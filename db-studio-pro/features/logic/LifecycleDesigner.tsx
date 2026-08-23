import React, { useState } from 'react';
import { Table, BackendConfig } from '../../types/index';
import { Settings, Plus, Trash2, Code, Copy, Shield, Database, HelpCircle, Check, ArrowRight, Zap, RefreshCw } from 'lucide-react';

interface StateMachineTransition {
    id: string;
    fromState: string;
    toState: string;
    requiredRole?: string;
}

interface StateMachineConfig {
    id: string;
    tableId: string;
    statusField: string;
    states: string[];
    transitions: StateMachineTransition[];
}

interface LifecycleDesignerProps {
    config: BackendConfig;
    tables: Table[];
    onUpdateConfig?: (config: BackendConfig) => void;
    showMessage: (title: string, message: string, type: 'info' | 'success' | 'warning' | 'error') => void;
}

export const LifecycleDesigner: React.FC<LifecycleDesignerProps> = ({ config, tables, onUpdateConfig, showMessage }) => {
    const [selectedTableId, setSelectedTableId] = useState<string>(tables[0]?.id || '');
    const [statusField, setStatusField] = useState<string>('status');
    const [states, setStates] = useState<string[]>(['OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED']);
    const [newStateInput, setNewStateInput] = useState<string>('');
    const [transitions, setTransitions] = useState<StateMachineTransition[]>([
        { id: '1', fromState: 'OPEN', toState: 'IN_PROGRESS' },
        { id: '2', fromState: 'IN_PROGRESS', toState: 'RESOLVED' },
        { id: '3', fromState: 'IN_PROGRESS', toState: 'OPEN' },
        { id: '4', fromState: 'RESOLVED', toState: 'CLOSED', requiredRole: 'ADMIN' }
    ]);

    const [fromStateSel, setFromStateSel] = useState<string>('OPEN');
    const [toStateSel, setToStateSel] = useState<string>('IN_PROGRESS');
    const [roleSel, setRoleSel] = useState<string>('');

    const [copied, setCopied] = useState(false);

    const activeTable = tables.find(t => t.id === selectedTableId) || tables[0];

    const handleAddState = () => {
        const cleanState = newStateInput.toUpperCase().trim().replace(/[^A-Z0-9_]/g, '');
        if (!cleanState) {
            showMessage('Fehler', 'Bitte geben Sie einen gültigen Statusnamen ein.', 'error');
            return;
        }
        if (states.includes(cleanState)) {
            showMessage('Fehler', 'Dieser Status existiert bereits.', 'error');
            return;
        }
        setStates([...states, cleanState]);
        setNewStateInput('');
        showMessage('Erfolg', `Status ${cleanState} wurde hinzugefügt.`, 'success');
    };

    const handleRemoveState = (state: string) => {
        if (states.length <= 2) {
            showMessage('Fehler', 'Es müssen mindestens zwei Status-Werte existieren.', 'error');
            return;
        }
        setStates(states.filter(s => s !== state));
        setTransitions(transitions.filter(t => t.fromState !== state && t.toState !== state));
    };

    const handleAddTransition = () => {
        if (fromStateSel === toStateSel) {
            showMessage('Fehler', 'Start- und Zielstatus dürfen nicht identisch sein.', 'error');
            return;
        }
        const exists = transitions.some(t => t.fromState === fromStateSel && t.toState === toStateSel);
        if (exists) {
            showMessage('Fehler', 'Diese Transition existiert bereits.', 'error');
            return;
        }

        const newTransition: StateMachineTransition = {
            id: crypto.randomUUID(),
            fromState: fromStateSel,
            toState: toStateSel,
            requiredRole: roleSel || undefined
        };

        setTransitions([...transitions, newTransition]);
        showMessage('Erfolg', 'Transition wurde erfolgreich hinzugefügt.', 'success');
    };

    const handleRemoveTransition = (id: string) => {
        setTransitions(transitions.filter(t => t.id !== id));
    };

    const handleCopy = (text: string) => {
        navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
        showMessage('Erfolg', 'Status-Maschine Code wurde kopiert!', 'success');
    };

    const generateCode = () => {
        const tableName = activeTable?.name || 'Entity';
        const statesEnum = states.map(s => `    ${s} = '${s}',`).join('\n');
        
        const transitionsCheck = transitions.map(t => {
            const roleGuard = t.requiredRole 
                ? ` && userRole === '${t.requiredRole}'`
                : '';
            return `        if (from === ${tableName}Status.${t.fromState} && to === ${tableName}Status.${t.toState}${roleGuard}) return true;`;
        }).join('\n');

        return `/**
 * Automatisch generierter Lifecycle State Machine Validator für die Tabelle [${tableName}]
 * Erstellt Enums, Transition-Validierungen und Event-Hooks für das Backend.
 */

export enum ${tableName}Status {
${statesEnum}
}

export interface TransitionContext {
    userId: string;
    userRole?: string;
    timestamp: number;
}

export class ${tableName}LifecycleManager {
    
    /**
     * Prüft, ob eine Transition von einem Zustand in einen anderen erlaubt ist
     */
    public static isValidTransition(
        from: ${tableName}Status, 
        to: ${tableName}Status, 
        userRole?: string
    ): boolean {
        // Gleicher Zustand ist immer erlaubt (No-Op)
        if (from === to) return true;

${transitionsCheck || '        // Keine Transitionen konfiguriert'}

        return false;
    }

    /**
     * Führt die Transition aus und triggert registrierte Hooks/Events
     */
    public static async transitionEntity(
        entityId: string,
        fromState: ${tableName}Status,
        toState: ${tableName}Status,
        context: TransitionContext,
        onUpdateDatabase: (id: string, nextState: ${tableName}Status) => Promise<void>
    ): Promise<{ success: boolean; message: string }> {
        
        // 1. Guard checken
        const allowed = this.isValidTransition(fromState, toState, context.userRole);
        if (!allowed) {
            return { 
                success: false, 
                message: \`Transition von \${fromState} nach \${toState} ist nicht erlaubt oder unzureichende Rechte (\${context.userRole || 'GUEST'}).\` 
            };
        }

        try {
            // 2. Pre-Transition Hook auslösen
            await this.onBeforeTransition(entityId, fromState, toState, context);

            // 3. Status in DB persistent updaten
            await onUpdateDatabase(entityId, toState);

            // 4. Post-Transition Hook auslösen
            await this.onAfterTransition(entityId, fromState, toState, context);

            return { success: true, message: 'Status erfolgreich aktualisiert' };
        } catch (error: any) {
            return { success: false, message: \`Hook Fehler: \${error.message}\` };
        }
    }

    /**
     * Event Trigger vor dem Speichern in der Datenbank
     */
    private static async onBeforeTransition(entityId: string, from: ${tableName}Status, to: ${tableName}Status, ctx: TransitionContext) {
        console.log(\`[BEFORE_TRANSITION] Entity \${entityId} wechselt von \${from} zu \${to} durch User \${ctx.userId}\`);
        // Hier können Sie Validierungen oder externe API-Schnittstellen einbauen
    }

    /**
     * Event Trigger nach erfolgreichem Datenbank-Commit
     */
    private static async onAfterTransition(entityId: string, from: ${tableName}Status, to: ${tableName}Status, ctx: TransitionContext) {
        console.log(\`[AFTER_TRANSITION] Entity \${entityId} hat erfolgreich auf \${to} gewechselt.\`);
        // Ideal für Email-Benachrichtigungen, Slack Webhooks, Audit Logs, etc.
    }
}`;
    };

    return (
        <div className="h-full flex flex-col bg-slate-50 dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800">
            <div className="p-4 bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700">
                <h2 className="text-lg font-bold text-slate-800 dark:text-white flex items-center gap-2">
                    <Zap size={20} className="text-purple-500" /> Visual State Machine (Lifecycle Designer)
                </h2>
                <p className="text-xs text-slate-500">Definieren Sie Zustände, erlaubte Zustandsübergänge und Zugriffsberechtigungen für Geschäfts-Entitäten.</p>
            </div>

            <div className="flex-1 overflow-hidden flex flex-col md:flex-row">
                {/* Config Controls */}
                <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6">
                    {/* Entity Table Selector */}
                    <div className="bg-white dark:bg-slate-800 p-5 rounded-xl border border-slate-200 dark:border-slate-700 space-y-4 shadow-sm">
                        <h3 className="text-sm font-bold text-slate-800 dark:text-white flex items-center gap-1.5">
                            <Database size={16} className="text-indigo-500" /> Ziel-Modell & Tabellenauswahl
                        </h3>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1">Entity-Tabelle</label>
                                <select 
                                    value={selectedTableId} 
                                    onChange={e => setSelectedTableId(e.target.value)}
                                    className="w-full text-xs border p-2 rounded bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-600 dark:text-white"
                                >
                                    {tables.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1">Status Feldname</label>
                                <input 
                                    type="text" 
                                    value={statusField} 
                                    onChange={e => setStatusField(e.target.value)}
                                    className="w-full text-xs font-mono border p-2 rounded bg-slate-50 dark:bg-slate-900 border-slate-300 dark:border-slate-600 dark:text-white"
                                    placeholder="z.B. status"
                                />
                            </div>
                        </div>
                    </div>

                    {/* States Setup */}
                    <div className="bg-white dark:bg-slate-800 p-5 rounded-xl border border-slate-200 dark:border-slate-700 space-y-4 shadow-sm">
                        <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-700 pb-2">
                            <h3 className="text-sm font-bold text-slate-800 dark:text-white flex items-center gap-1.5">
                                <RefreshCw size={16} className="text-purple-500" /> Definierte Zustände (States)
                            </h3>
                            <div className="flex gap-1.5 items-center">
                                <input 
                                    type="text"
                                    placeholder="Status-Name"
                                    value={newStateInput}
                                    onChange={e => setNewStateInput(e.target.value)}
                                    className="text-xs font-mono border p-1 rounded bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-600 dark:text-white"
                                />
                                <button 
                                    onClick={handleAddState}
                                    className="text-[10px] flex items-center gap-1 bg-purple-50 text-purple-700 hover:bg-purple-100 px-2 py-1 rounded font-semibold dark:bg-purple-900/30 dark:text-purple-300"
                                >
                                    <Plus size={10}/> Add State
                                </button>
                            </div>
                        </div>

                        <div className="flex flex-wrap gap-2">
                            {states.map(s => (
                                <div key={s} className="flex items-center gap-1.5 bg-purple-50 text-purple-800 dark:bg-purple-950/40 dark:text-purple-300 px-2.5 py-1.5 rounded-lg border border-purple-100 dark:border-purple-900 text-xs font-bold font-mono">
                                    <span>{s}</span>
                                    <button onClick={() => handleRemoveState(s)} className="text-purple-400 hover:text-red-500 font-normal">×</button>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Transitions Config */}
                    <div className="bg-white dark:bg-slate-800 p-5 rounded-xl border border-slate-200 dark:border-slate-700 space-y-4 shadow-sm">
                        <h3 className="text-sm font-bold text-slate-800 dark:text-white flex items-center gap-1.5">
                            <ArrowRight size={16} className="text-emerald-500" /> Erlaubte Zustandsübergänge (Transitionen)
                        </h3>

                        <div className="grid grid-cols-4 gap-3 items-end p-3 rounded-lg border border-slate-100 dark:border-slate-700/50 bg-slate-50 dark:bg-slate-900">
                            <div>
                                <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 mb-1">Von Zustand</label>
                                <select 
                                    value={fromStateSel} 
                                    onChange={e => setFromStateSel(e.target.value)}
                                    className="w-full text-xs border p-1.5 rounded bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-600 dark:text-white"
                                >
                                    {states.map(s => <option key={s} value={s}>{s}</option>)}
                                </select>
                            </div>
                            <div className="flex justify-center pb-2 text-slate-400">
                                <ArrowRight size={16}/>
                            </div>
                            <div>
                                <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 mb-1">Zu Zustand</label>
                                <select 
                                    value={toStateSel} 
                                    onChange={e => setToStateSel(e.target.value)}
                                    className="w-full text-xs border p-1.5 rounded bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-600 dark:text-white"
                                >
                                    {states.map(s => <option key={s} value={s}>{s}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 mb-1">Rolle (Optional)</label>
                                <div className="flex gap-2">
                                    <select 
                                        value={roleSel} 
                                        onChange={e => setRoleSel(e.target.value)}
                                        className="w-full text-xs border p-1.5 rounded bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-600 dark:text-white"
                                    >
                                        <option value="">Jeder</option>
                                        <option value="ADMIN">ADMIN</option>
                                        <option value="MANAGER">MANAGER</option>
                                        <option value="USER">USER</option>
                                    </select>
                                    <button 
                                        onClick={handleAddTransition}
                                        className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-3 py-1.5 rounded flex items-center gap-1"
                                    >
                                        <Plus size={12}/> Hinzufügen
                                    </button>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-1">
                            {transitions.map(t => (
                                <div key={t.id} className="flex items-center justify-between p-2 rounded bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 text-xs font-mono">
                                    <div className="flex items-center gap-3">
                                        <span className="font-bold text-slate-700 dark:text-slate-300">{t.fromState}</span>
                                        <ArrowRight size={12} className="text-slate-400"/>
                                        <span className="font-bold text-slate-700 dark:text-slate-300">{t.toState}</span>
                                        {t.requiredRole && (
                                            <span className="ml-4 px-1.5 py-0.5 bg-red-100 text-red-800 dark:bg-red-950/40 dark:text-red-300 rounded text-[9px] font-bold">Role: {t.requiredRole}</span>
                                        )}
                                    </div>
                                    <button onClick={() => handleRemoveTransition(t.id)} className="text-slate-400 hover:text-red-500 p-1">
                                        <Trash2 size={12}/>
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Code Panel */}
                <div className="w-full md:w-[480px] bg-slate-900 border-t md:border-t-0 md:border-l border-slate-800 flex flex-col overflow-hidden text-slate-300 h-full">
                    <div className="p-3 bg-slate-950 border-b border-slate-800 flex justify-between items-center shrink-0">
                        <span className="text-xs font-bold text-slate-400 flex items-center gap-1.5">
                            <Code size={14} className="text-purple-500" /> Generierter TypeScript-Code
                        </span>
                        <button 
                            onClick={() => handleCopy(generateCode())}
                            className="text-xs flex items-center gap-1 hover:text-white text-slate-400"
                        >
                            {copied ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />} <span>{copied ? 'Kopiert!' : 'Kopieren'}</span>
                        </button>
                    </div>
                    <div className="flex-grow p-4 overflow-y-auto font-mono text-[11px] leading-relaxed select-all bg-slate-950">
                        <pre className="whitespace-pre">
                            {generateCode()}
                        </pre>
                    </div>
                </div>
            </div>
        </div>
    );
};
