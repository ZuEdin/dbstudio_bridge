import React, { useState } from 'react';
import { BackendConfig, GlobalStateVariable, ProductTour } from '../../types/index';
import { Settings, Zap, Compass, Plus, Trash2, Cpu, Play, Check, Layers, FileOutput } from 'lucide-react';
import { Macro, MacroStep, ExportFormat } from '../../types/macro';
import { getSavedMacros, saveMacro, deleteMacro, executeMacro } from './MacroEngine';
import { useProjectStore } from '../../stores/useProjectStore';

interface LogicDesignerProps {
    config: BackendConfig;
    onUpdateConfig: (config: BackendConfig) => void;
    showMessage: (title: string, message: string, type: 'info' | 'success' | 'warning' | 'error') => void;
}

export const LogicDesigner: React.FC<LogicDesignerProps> = ({ config, onUpdateConfig, showMessage }) => {
    const [activeTab, setActiveTab] = useState<'macros' | 'states' | 'tours'>('macros');
    const { tables, queries, reports } = useProjectStore();

    // Macros State
    const [macros, setMacros] = useState<Macro[]>(() => getSavedMacros());
    const [selectedMacroId, setSelectedMacroId] = useState<string | null>(() => getSavedMacros()[0]?.id || null);

    const selectedMacro = macros.find(m => m.id === selectedMacroId) || null;
    
    const states = config.globalStates || [];
    const tours = config.productTours || [];

    const updateStates = (newStates: GlobalStateVariable[]) => {
        onUpdateConfig({ ...config, globalStates: newStates });
    };

    const updateTours = (newTours: ProductTour[]) => {
        onUpdateConfig({ ...config, productTours: newTours });
    };

    // Macro Actions
    const handleCreateMacro = () => {
        const newM: Macro = {
            id: `macro_${Date.now()}`,
            name: 'Neues Makro',
            description: 'Automatisierte Aktion und Workflow-Schritt',
            category: 'CUSTOM',
            steps: [
                {
                    id: `step_${Date.now()}`,
                    name: 'Schritt 1: Bericht Exportieren',
                    type: 'EXPORT_REPORT',
                    exportConfig: {
                        sourceType: 'table',
                        sourceId: tables[0]?.id || '',
                        format: 'PDF',
                        title: 'Automatischer Bericht'
                    }
                }
            ],
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };
        const updated = saveMacro(newM);
        setMacros(updated);
        setSelectedMacroId(newM.id);
        showMessage('Makro erstellt', `Makro "${newM.name}" wurde angelegt.`, 'success');
    };

    const handleSaveSelectedMacro = (updatedMacro: Macro) => {
        const updatedList = saveMacro(updatedMacro);
        setMacros(updatedList);
        showMessage('Makro gespeichert', `Makro "${updatedMacro.name}" wurde erfolgreich gespeichert.`, 'success');
    };

    const handleDeleteSelectedMacro = (id: string) => {
        const updated = deleteMacro(id);
        setMacros(updated);
        setSelectedMacroId(updated[0]?.id || null);
        showMessage('Makro gelöscht', 'Das Makro wurde entfernt.', 'info');
    };

    const handleAddStep = () => {
        if (!selectedMacro) return;
        const newStep: MacroStep = {
            id: `step_${Date.now()}`,
            name: `Schritt ${selectedMacro.steps.length + 1}`,
            type: 'EXPORT_REPORT',
            exportConfig: {
                sourceType: 'table',
                sourceId: tables[0]?.id || '',
                format: 'PDF',
                title: 'Neuer Export'
            }
        };
        const updated = { ...selectedMacro, steps: [...selectedMacro.steps, newStep] };
        handleSaveSelectedMacro(updated);
    };

    const handleRunMacro = (m: Macro) => {
        executeMacro(m, { 
            tables, 
            queries, 
            reports: useProjectStore.getState().reports,
            onShowToast: (msg, type) => showMessage('Makro Info', msg, type)
        });
        showMessage('Makro ausgeführt', `Makro "${m.name}" wurde gestartet.`, 'success');
    };

    return (
        <div className="h-full flex flex-col bg-slate-50 dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800">
            <div className="p-4 bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700">
                <h2 className="text-lg font-bold text-slate-800 dark:text-white flex items-center gap-2">
                    <Zap size={20} className="text-indigo-500" /> App Logik & Automatisierung (Makros)
                </h2>
                <p className="text-xs text-slate-500">Erstellen Sie Makros, konfigurieren Sie globale State-Variablen und Guided Tours.</p>
            </div>

            <div className="flex flex-1 overflow-hidden">
                <div className="w-64 bg-white dark:bg-slate-800 border-r border-slate-200 dark:border-slate-700 p-2 space-y-1">
                    <button onClick={() => setActiveTab('macros')} className={`w-full flex items-center gap-3 px-3 py-2 text-sm rounded transition-colors ${activeTab === 'macros' ? 'bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 font-semibold' : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'}`}>
                        <Cpu size={16} /> Makros & Automation
                    </button>
                    <button onClick={() => setActiveTab('states')} className={`w-full flex items-center gap-3 px-3 py-2 text-sm rounded transition-colors ${activeTab === 'states' ? 'bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 font-semibold' : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'}`}>
                        <Settings size={16} /> Global App State
                    </button>
                    <button onClick={() => setActiveTab('tours')} className={`w-full flex items-center gap-3 px-3 py-2 text-sm rounded transition-colors ${activeTab === 'tours' ? 'bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 font-semibold' : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'}`}>
                        <Compass size={16} /> Product Tours
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-4 md:p-8">
                    <div className="max-w-4xl mx-auto space-y-8">
                        {activeTab === 'macros' && (
                            <div className="space-y-6 animate-in fade-in">
                                <div className="flex justify-between items-center border-b border-slate-200 dark:border-slate-700 pb-2">
                                    <div>
                                        <h3 className="text-lg font-bold text-slate-800 dark:text-white flex items-center gap-2">
                                            <Cpu size={20} className="text-indigo-600 dark:text-indigo-400" />
                                            <span>Makro-Verwaltung</span>
                                        </h3>
                                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Automatisieren Sie Exporte, Imports, Abfragen und Benachrichtigungen.</p>
                                    </div>
                                    <button 
                                        onClick={handleCreateMacro}
                                        className="text-xs flex items-center gap-1 bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-2 rounded font-semibold transition-colors shadow-sm"
                                    >
                                        <Plus size={14}/> Neues Makro
                                    </button>
                                </div>

                                <div className="grid grid-cols-12 gap-6 min-h-[400px]">
                                    {/* Macro Sidebar List */}
                                    <div className="col-span-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-3 space-y-2 h-fit">
                                        <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block px-1">Gespeicherte Makros ({macros.length})</span>
                                        {macros.length === 0 ? (
                                            <p className="text-xs text-slate-400 italic p-3 text-center">Keine Makros vorhanden.</p>
                                        ) : (
                                            macros.map(m => {
                                                const isSel = selectedMacroId === m.id;
                                                return (
                                                    <div 
                                                        key={m.id}
                                                        onClick={() => setSelectedMacroId(m.id)}
                                                        className={`p-3 rounded-lg border text-xs cursor-pointer transition-all ${isSel ? 'bg-indigo-50 dark:bg-indigo-900/40 border-indigo-500 text-indigo-950 dark:text-white font-semibold' : 'bg-slate-50 dark:bg-slate-900/50 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:border-slate-300'}`}
                                                    >
                                                        <div className="flex justify-between items-center font-bold">
                                                            <span className="truncate">{m.name}</span>
                                                            <span className="text-[10px] bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 px-1.5 py-0.5 rounded font-mono">{m.steps.length} Schritte</span>
                                                        </div>
                                                        {m.description && <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 truncate">{m.description}</p>}
                                                    </div>
                                                );
                                            })
                                        )}
                                    </div>

                                    {/* Selected Macro Editor */}
                                    <div className="col-span-8 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-5 space-y-5">
                                        {selectedMacro ? (
                                            <>
                                                {/* Macro Header */}
                                                <div className="bg-slate-50 dark:bg-slate-900/80 p-4 rounded-lg border border-slate-200 dark:border-slate-700 space-y-3">
                                                    <div className="flex justify-between items-center gap-3">
                                                        <input 
                                                            type="text" 
                                                            value={selectedMacro.name}
                                                            onChange={e => {
                                                                const updated = { ...selectedMacro, name: e.target.value };
                                                                setMacros(prev => prev.map(m => m.id === selectedMacro.id ? updated : m));
                                                            }}
                                                            className="text-base font-bold text-slate-900 dark:text-white bg-transparent border-b border-slate-300 dark:border-slate-600 focus:border-indigo-500 focus:outline-none flex-1 py-1"
                                                        />
                                                        <div className="flex items-center gap-2">
                                                            <button 
                                                                onClick={() => handleDeleteSelectedMacro(selectedMacro.id)}
                                                                className="p-1.5 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded transition-colors"
                                                                title="Makro löschen"
                                                            >
                                                                <Trash2 size={16} />
                                                            </button>
                                                            <button 
                                                                onClick={() => handleRunMacro(selectedMacro)}
                                                                className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-xs font-bold shadow-xs transition-colors"
                                                            >
                                                                <Play size={14} /> Ausführen
                                                            </button>
                                                        </div>
                                                    </div>
                                                    <input 
                                                        type="text" 
                                                        value={selectedMacro.description || ''}
                                                        onChange={e => {
                                                            const updated = { ...selectedMacro, description: e.target.value };
                                                            setMacros(prev => prev.map(m => m.id === selectedMacro.id ? updated : m));
                                                        }}
                                                        placeholder="Makro-Beschreibung eingeben..."
                                                        className="w-full text-xs text-slate-600 dark:text-slate-400 bg-transparent border-b border-slate-200 dark:border-slate-700 focus:border-indigo-500 focus:outline-none"
                                                    />
                                                </div>

                                                {/* Steps Section */}
                                                <div className="space-y-3">
                                                    <div className="flex justify-between items-center">
                                                        <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                                                            <Layers size={14} className="text-indigo-500" /> Aktionen & Schritte
                                                        </h4>
                                                        <button 
                                                            onClick={handleAddStep}
                                                            className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline font-bold flex items-center gap-1"
                                                        >
                                                            <Plus size={14} /> Schritt hinzufügen
                                                        </button>
                                                    </div>

                                                    {selectedMacro.steps.map((step, idx) => (
                                                        <div key={step.id} className="bg-slate-50 dark:bg-slate-900/50 rounded-lg border border-slate-200 dark:border-slate-700 p-3 space-y-3 text-xs">
                                                            <div className="flex justify-between items-center pb-2 border-b border-slate-200 dark:border-slate-700">
                                                                <span className="font-bold text-slate-800 dark:text-slate-200">Aktion #{idx + 1}: {step.name}</span>
                                                                <button 
                                                                    onClick={() => {
                                                                        const filtered = selectedMacro.steps.filter(s => s.id !== step.id);
                                                                        const updated = { ...selectedMacro, steps: filtered };
                                                                        setMacros(prev => prev.map(m => m.id === selectedMacro.id ? updated : m));
                                                                    }}
                                                                    className="text-slate-400 hover:text-rose-600"
                                                                >
                                                                    <Trash2 size={14} />
                                                                </button>
                                                            </div>

                                                            <div className="grid grid-cols-2 gap-3">
                                                                <div>
                                                                    <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Aktionstyp</label>
                                                                    <select 
                                                                        value={step.type}
                                                                        onChange={e => {
                                                                            const newType = e.target.value as any;
                                                                            const updatedSteps = selectedMacro.steps.map(s => s.id === step.id ? { 
                                                                              ...s, 
                                                                              type: newType,
                                                                              ...(newType === 'EXPORT_REPORT' && !s.exportConfig ? { exportConfig: { sourceType: 'report' as const, sourceId: '', format: 'PDF' as const, title: 'Bericht' } } : {})
                                                                            } : s);
                                                                            const updated = { ...selectedMacro, steps: updatedSteps };
                                                                            setMacros(prev => prev.map(m => m.id === selectedMacro.id ? updated : m));
                                                                        }}
                                                                        className="w-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded p-1.5 text-xs text-slate-800 dark:text-slate-200 font-medium"
                                                                    >
                                                                        <optgroup label="📂 Benutzeroberflächenbefehle">
                                                                            <option value="SHOW_TOAST">🔔 Benachrichtigung (Toast)</option>
                                                                            <option value="MESSAGE_BOX">💬 Meldungsfeld (Alert)</option>
                                                                            <option value="CONFIRM_DIALOG">❓ Bestätigungsdialog</option>
                                                                            <option value="NAVIGATE">↗️ Navigieren Zu Seite</option>
                                                                        </optgroup>
                                                                        <optgroup label="🗄️ Datenbankobjekte">
                                                                            <option value="OPEN_REPORT">📊 Öffnen Bericht</option>
                                                                            <option value="PRINT_REPORT">🖨️ Drucken / Seitenansicht Bericht</option>
                                                                            <option value="OPEN_FORM">📋 Öffnen Formular</option>
                                                                            <option value="CLOSE_FORM">❌ Schließen Formular</option>
                                                                            <option value="OPEN_TABLE">📑 Öffnen Tabelle</option>
                                                                            <option value="REFRESH_OBJECT">🔄 Aktualisieren Objekt</option>
                                                                        </optgroup>
                                                                        <optgroup label="✍️ Dateneingabevorgänge">
                                                                            <option value="SAVE_RECORD">💾 Datensatz Speichern</option>
                                                                            <option value="DELETE_RECORD">🗑️ Datensatz Löschen</option>
                                                                            <option value="CALCULATE_FORMULA">🧮 Formel Berechnen</option>
                                                                        </optgroup>
                                                                        <optgroup label="📤 Datenimport/-export">
                                                                            <option value="EXPORT_REPORT">📊 Exportieren Mit Formatierung (Bericht / Tabelle)</option>
                                                                            <option value="SMART_IMPORT">📥 Smart Upload & Import Wizard</option>
                                                                            <option value="EMAIL_DATABASE_OBJECT">📧 E-Mail Datenbankobjekt</option>
                                                                        </optgroup>
                                                                        <optgroup label="🪟 Fensterverwaltung">
                                                                            <option value="CLOSE_WINDOW">❌ Fenster Schließen</option>
                                                                            <option value="MAXIMIZE_WINDOW">🔲 Maximieren Fenster</option>
                                                                            <option value="MINIMIZE_WINDOW">🛋️ Minimieren Fenster</option>
                                                                            <option value="RESTORE_WINDOW">↩️ Wiederherstellen Fenster</option>
                                                                        </optgroup>
                                                                        <optgroup label="🔍 Filter / Abfrage / Suche">
                                                                            <option value="EXECUTE_QUERY">⚡ Abfrage Ausführen / Öffnen</option>
                                                                            <option value="EXECUTE_ACTION">💥 Aktionsabfrage Ausführen</option>
                                                                            <option value="SET_FILTER">🎯 Anwenden / Festlegen Filter</option>
                                                                            <option value="REMOVE_FILTER">🧹 Filter & Sortierung Entfernen</option>
                                                                            <option value="REQUERY">🔄 Aktualisieren Daten (Requery)</option>
                                                                        </optgroup>
                                                                        <optgroup label="⚡ Makrobefehle">
                                                                            <option value="RUN_MACRO">▶️ Ausführen Makro</option>
                                                                            <option value="EXECUTE_JS_SCRIPT">💻 Ausführen Code (JS/TS Sandbox)</option>
                                                                            <option value="SET_TEMP_VAR">📌 Festlegen TempVar</option>
                                                                            <option value="REMOVE_TEMP_VAR">🗑️ Entfernen TempVar</option>
                                                                            <option value="STOP_ALL_MACROS">🛑 Stopp Alle Makros</option>
                                                                        </optgroup>
                                                                        <optgroup label="⚙️ Systembefehle (Target-Spezifisch)">
                                                                            <option value="SYSTEM_CURSOR_BUSY">⏳ Anzeigen Sanduhrzeiger (Busy)</option>
                                                                            <option value="SYSTEM_BEEP">🔔 Signalton (Beep)</option>
                                                                            <option value="SYSTEM_QUIT">🚪 Beenden Anwendung (Quit)</option>
                                                                            <option value="CLOSE_DATABASE">🔒 Schließen Datenbank</option>
                                                                            <option value="SYSTEM_EXEC_COMMAND">🖥️ Systembefehl Ausführen (Process.Start / Exec)</option>
                                                                        </optgroup>
                                                                    </select>
                                                                </div>

                                                                {/* SYSTEM_EXEC_COMMAND Controls */}
                                                                {step.type === 'SYSTEM_EXEC_COMMAND' && (
                                                                    <div className="col-span-2 space-y-2 bg-slate-100 dark:bg-slate-800/80 p-2.5 rounded-lg border border-slate-200 dark:border-slate-700">
                                                                        <div className="flex items-center justify-between text-xs font-bold text-slate-700 dark:text-slate-300">
                                                                            <span>Systembefehl / Kommandozeile:</span>
                                                                            <span className="text-[10px] text-indigo-600 bg-indigo-50 dark:bg-indigo-950 px-2 py-0.5 rounded font-mono">Process.Start / shell_exec</span>
                                                                        </div>
                                                                        <div className="grid grid-cols-3 gap-2">
                                                                            <input 
                                                                                type="text" 
                                                                                value={step.sysCommand || ''} 
                                                                                onChange={e => {
                                                                                    const cmd = e.target.value;
                                                                                    const updatedSteps = selectedMacro.steps.map(s => s.id === step.id ? { ...s, sysCommand: cmd } : s);
                                                                                    setMacros(prev => prev.map(m => m.id === selectedMacro.id ? { ...selectedMacro, steps: updatedSteps } : m));
                                                                                }}
                                                                                placeholder="z.B. dotnet run / php script.php / calc.exe"
                                                                                className="col-span-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded p-1.5 text-xs font-mono"
                                                                            />
                                                                            <select
                                                                                value={step.sysTargetPlatform || 'ALL'}
                                                                                onChange={e => {
                                                                                    const plat = e.target.value as any;
                                                                                    const updatedSteps = selectedMacro.steps.map(s => s.id === step.id ? { ...s, sysTargetPlatform: plat } : s);
                                                                                    setMacros(prev => prev.map(m => m.id === selectedMacro.id ? { ...selectedMacro, steps: updatedSteps } : m));
                                                                                }}
                                                                                className="bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded p-1.5 text-xs"
                                                                            >
                                                                                <option value="ALL">Alle Systeme</option>
                                                                                <option value="DOTNET">.NET (C#)</option>
                                                                                <option value="PHP">PHP Backend</option>
                                                                                <option value="ELECTRON">Electron App</option>
                                                                                <option value="BROWSER">Browser Sandbox</option>
                                                                            </select>
                                                                        </div>
                                                                    </div>
                                                                )}

                                                                {step.type === 'EXPORT_REPORT' && (
                                                                    <>
                                                                        <div>
                                                                            <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Export-Format</label>
                                                                            <select 
                                                                                value={step.exportConfig?.format || 'PDF'}
                                                                                onChange={e => {
                                                                                    const fmt = e.target.value as ExportFormat;
                                                                                    const updatedSteps = selectedMacro.steps.map(s => s.id === step.id ? {
                                                                                        ...s,
                                                                                        exportConfig: { ...s.exportConfig!, format: fmt }
                                                                                    } : s);
                                                                                    const updated = { ...selectedMacro, steps: updatedSteps };
                                                                                    setMacros(prev => prev.map(m => m.id === selectedMacro.id ? updated : m));
                                                                                }}
                                                                                className="w-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded p-1.5 text-xs text-slate-800 dark:text-slate-200 font-bold"
                                                                            >
                                                                                <option value="PDF">📄 PDF Dokument</option>
                                                                                <option value="XLSX">📈 Excel Arbeitsmappe (.xlsx)</option>
                                                                                <option value="CSV">📑 CSV Tabelle (.csv)</option>
                                                                                <option value="JSON">📦 JSON Daten (.json)</option>
                                                                                <option value="XML">🏷️ XML Markup (.xml)</option>
                                                                                <option value="HTML_PRINT">🖨️ Druckansicht</option>
                                                                            </select>
                                                                        </div>

                                                                        <div>
                                                                            <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Datenquelle</label>
                                                                            <select 
                                                                                value={step.exportConfig?.sourceType || 'table'}
                                                                                onChange={e => {
                                                                                    const st = e.target.value as any;
                                                                                    const updatedSteps = selectedMacro.steps.map(s => s.id === step.id ? {
                                                                                        ...s,
                                                                                        exportConfig: { ...s.exportConfig!, sourceType: st, sourceId: '' }
                                                                                    } : s);
                                                                                    const updated = { ...selectedMacro, steps: updatedSteps };
                                                                                    setMacros(prev => prev.map(m => m.id === selectedMacro.id ? updated : m));
                                                                                }}
                                                                                className="w-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded p-1.5 text-xs text-slate-800 dark:text-slate-200"
                                                                            >
                                                                                <option value="report">Erstellter Bericht</option>
                                                                                <option value="table">Tabelle</option>
                                                                                <option value="query">Abfrage (Query)</option>
                                                                            </select>
                                                                        </div>

                                                                        <div>
                                                                            <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Quell-Objekt</label>
                                                                            <select 
                                                                                value={step.exportConfig?.sourceId || ''}
                                                                                onChange={e => {
                                                                                    const sid = e.target.value;
                                                                                    const updatedSteps = selectedMacro.steps.map(s => s.id === step.id ? {
                                                                                        ...s,
                                                                                        exportConfig: { ...s.exportConfig!, sourceId: sid }
                                                                                    } : s);
                                                                                    const updated = { ...selectedMacro, steps: updatedSteps };
                                                                                    setMacros(prev => prev.map(m => m.id === selectedMacro.id ? updated : m));
                                                                                }}
                                                                                className="w-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded p-1.5 text-xs text-slate-800 dark:text-slate-200"
                                                                            >
                                                                                <option value="">-- Objekt wählen --</option>
                                                                                {step.exportConfig?.sourceType === 'report' ? (
                                                                                    reports.map(r => <option key={r.id} value={r.id}>Bericht: {r.name}</option>)
                                                                                ) : step.exportConfig?.sourceType === 'table' ? (
                                                                                    tables.map(t => <option key={t.id} value={t.id}>Tabelle: {t.name}</option>)
                                                                                ) : (
                                                                                    queries.map(q => <option key={q.id} value={q.id}>Abfrage: {q.name}</option>)
                                                                                )}
                                                                            </select>
                                                                        </div>
                                                                    </>
                                                                )}
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>

                                                <div className="pt-3 border-t border-slate-200 dark:border-slate-700 flex justify-end">
                                                    <button 
                                                        onClick={() => handleSaveSelectedMacro(selectedMacro)}
                                                        className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded text-xs font-bold transition-colors shadow-sm"
                                                    >
                                                        <Check size={15} /> Makro Speichern
                                                    </button>
                                                </div>
                                            </>
                                        ) : (
                                            <div className="h-full flex flex-col items-center justify-center text-slate-400 text-xs py-12">
                                                <Cpu size={36} className="mb-2 text-slate-300 dark:text-slate-600" />
                                                <span>Wählen Sie links ein Makro aus oder erstellen Sie ein neues.</span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        )}

                        {activeTab === 'states' && (
                            <div className="space-y-6 animate-in fade-in">
                                <div className="flex justify-between items-center border-b border-slate-200 dark:border-slate-700 pb-2">
                                    <h3 className="text-lg font-bold text-slate-800 dark:text-white">Globale State-Variablen</h3>
                                    <button 
                                        onClick={() => updateStates([...states, { id: crypto.randomUUID(), name: 'newState', type: 'string', defaultValue: '' }])}
                                        className="text-xs flex items-center gap-1 bg-indigo-100 text-indigo-700 hover:bg-indigo-200 px-3 py-1.5 rounded font-semibold dark:bg-indigo-900/50 dark:text-indigo-300"
                                    >
                                        <Plus size={14}/> Variable hinzufügen
                                    </button>
                                </div>
                                <div className="space-y-4">
                                    {states.length === 0 && <p className="text-sm text-slate-500">Noch keine globalen Variablen definiert.</p>}
                                    {states.map((state, i) => (
                                        <div key={state.id} className="flex gap-4 items-end bg-white dark:bg-slate-800 p-4 border border-slate-200 dark:border-slate-700 rounded-lg shadow-sm">
                                            <div className="flex-1">
                                                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">Variablen-Name</label>
                                                <input 
                                                    type="text" 
                                                    value={state.name} 
                                                    onChange={e => { const s=[...states]; s[i] = { ...s[i], name: e.target.value.replace(/[^a-zA-Z0-9_]/g,'') }; updateStates(s); }}
                                                    className="w-full text-sm border p-2 rounded bg-slate-50 dark:bg-slate-900 border-slate-300 dark:border-slate-600 dark:text-white font-mono"
                                                    placeholder="z.B. selectedYear"
                                                />
                                            </div>
                                            <div className="w-1/4">
                                                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">Datentyp</label>
                                                <select 
                                                    value={state.type}
                                                    onChange={e => { const s=[...states]; s[i] = { ...s[i], type: e.target.value as any }; updateStates(s); }}
                                                    className="w-full text-sm border p-2 rounded bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-600 dark:text-white"
                                                >
                                                    <option value="string">String</option>
                                                    <option value="number">Number</option>
                                                    <option value="boolean">Boolean</option>
                                                </select>
                                            </div>
                                            <div className="w-1/4">
                                                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">Default</label>
                                                <input 
                                                    type="text" 
                                                    value={state.defaultValue} 
                                                    onChange={e => { const s=[...states]; s[i] = { ...s[i], defaultValue: e.target.value }; updateStates(s); }}
                                                    className="w-full text-sm border p-2 rounded bg-slate-50 dark:bg-slate-900 border-slate-300 dark:border-slate-600 dark:text-white"
                                                    placeholder="Default Wert"
                                                />
                                            </div>
                                            <button onClick={() => updateStates(states.filter(s => s.id !== state.id))} className="text-red-500 hover:bg-red-50 p-2 rounded mb-0.5">
                                                <Trash2 size={18}/>
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {activeTab === 'tours' && (
                            <div className="space-y-6 animate-in fade-in">
                                <div className="flex justify-between items-center border-b border-slate-200 dark:border-slate-700 pb-2">
                                    <h3 className="text-lg font-bold text-slate-800 dark:text-white">Guided Tours (Onboarding)</h3>
                                    <button 
                                        onClick={() => updateTours([...tours, { id: crypto.randomUUID(), name: 'Neue Tour', steps: [] }])}
                                        className="text-xs flex items-center gap-1 bg-indigo-100 text-indigo-700 hover:bg-indigo-200 px-3 py-1.5 rounded font-semibold dark:bg-indigo-900/50 dark:text-indigo-300"
                                    >
                                        <Plus size={14}/> Tour erstellen
                                    </button>
                                </div>
                                <div className="space-y-6">
                                    {tours.length === 0 && <p className="text-sm text-slate-500">Noch keine Touren angelegt.</p>}
                                    {tours.map((tour, tourIdx) => (
                                        <div key={tour.id} className="border border-slate-200 dark:border-slate-700 rounded-lg p-5 bg-white dark:bg-slate-800 shadow-sm">
                                            <div className="flex justify-between items-start mb-4">
                                                <div className="flex-1">
                                                    <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">Tour-Name</label>
                                                    <input 
                                                        type="text" 
                                                        value={tour.name} 
                                                        onChange={e => { const t = [...tours]; t[tourIdx] = { ...t[tourIdx], name: e.target.value }; updateTours(t); }}
                                                        className="w-1/2 text-sm border p-2 rounded bg-slate-50 dark:bg-slate-900 border-slate-300 dark:border-slate-600 dark:text-white font-bold"
                                                    />
                                                </div>
                                                <button onClick={() => updateTours(tours.filter(t => t.id !== tour.id))} className="text-red-500 hover:text-red-700 text-sm font-semibold">Tour löschen</button>
                                            </div>

                                            <div className="space-y-3 mt-4 border-t border-slate-100 dark:border-slate-700 pt-4">
                                                <h4 className="text-sm font-bold text-slate-700 dark:text-slate-300">Schritte</h4>
                                                {(tour.steps || []).map((step, stepIdx) => (
                                                    <div key={stepIdx} className="flex gap-4 items-start bg-slate-50 dark:bg-slate-900 p-3 rounded border border-slate-200 dark:border-slate-700">
                                                        <div className="pt-2 font-bold text-slate-400">{stepIdx + 1}.</div>
                                                        <div className="flex-1 space-y-2">
                                                            <div className="flex gap-2">
                                                                <input type="text" placeholder="Titel (z.B. Willkommen)" value={step.title} onChange={e => { const t=[...tours]; const steps=[...(t[tourIdx].steps || [])]; steps[stepIdx] = { ...steps[stepIdx], title: e.target.value }; t[tourIdx] = { ...t[tourIdx], steps }; updateTours(t); }} className="w-1/2 text-sm border p-1.5 rounded dark:bg-slate-800 dark:border-slate-600 dark:text-white" />
                                                                <input type="text" placeholder="CSS Ziel (z.B. #nav-dashboard)" value={step.targetSelector} onChange={e => { const t=[...tours]; const steps=[...(t[tourIdx].steps || [])]; steps[stepIdx] = { ...steps[stepIdx], targetSelector: e.target.value }; t[tourIdx] = { ...t[tourIdx], steps }; updateTours(t); }} className="w-1/2 text-sm border p-1.5 rounded font-mono text-indigo-600 dark:text-indigo-400 dark:bg-slate-800 dark:border-slate-600" />
                                                            </div>
                                                            <textarea placeholder="Text für dieses Popover..." value={step.content} onChange={e => { const t=[...tours]; const steps=[...(t[tourIdx].steps || [])]; steps[stepIdx] = { ...steps[stepIdx], content: e.target.value }; t[tourIdx] = { ...t[tourIdx], steps }; updateTours(t); }} rows={2} className="w-full text-sm border p-2 rounded dark:bg-slate-800 dark:border-slate-600 dark:text-white"></textarea>
                                                        </div>
                                                        <button onClick={() => { const t=[...tours]; const steps=(t[tourIdx].steps || []).filter((_, idx) => idx !== stepIdx); t[tourIdx] = { ...t[tourIdx], steps }; updateTours(t); }} className="text-red-500 hover:bg-red-50 p-1.5 rounded mt-1">
                                                            <Trash2 size={16}/>
                                                        </button>
                                                    </div>
                                                ))}
                                                <button 
                                                    onClick={() => { const t=[...tours]; const steps=[...(t[tourIdx].steps || []), { title: '', content: '', targetSelector: '' }]; t[tourIdx] = { ...t[tourIdx], steps }; updateTours(t); }}
                                                    className="text-xs text-indigo-600 hover:text-indigo-800 font-semibold flex items-center gap-1 mt-2"
                                                >
                                                    <Plus size={14} /> Weiteren Schritt hinzufügen
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

