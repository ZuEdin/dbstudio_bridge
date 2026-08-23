import React, { useState } from 'react';
import { Table, Query, BackendConfig } from '../../types/index';
import { Route, Plus, Trash2, Code, Copy, Shield, Database, Settings, HelpCircle, Check, ArrowRight } from 'lucide-react';

interface ApiRouteItem {
    id: string;
    path: string;
    method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
    sourceType: 'table' | 'query' | 'custom';
    sourceId: string;
    description: string;
    middlewares: string[];
    validationFields: { name: string; type: 'string' | 'number' | 'boolean' | 'email' | 'uuid'; required: boolean }[];
}

interface ApiRoutingDesignerProps {
    config: BackendConfig;
    tables: Table[];
    queries: Query[];
    onUpdateConfig?: (config: BackendConfig) => void;
    showMessage: (title: string, message: string, type: 'info' | 'success' | 'warning' | 'error') => void;
}

export const ApiRoutingDesigner: React.FC<ApiRoutingDesignerProps> = ({ config, tables, queries, onUpdateConfig, showMessage }) => {
    const [routes, setRoutes] = useState<ApiRouteItem[]>([
        {
            id: '1',
            path: '/api/v1/tickets',
            method: 'GET',
            sourceType: 'table',
            sourceId: tables[0]?.id || '',
            description: 'Ruft alle Tickets für das Kanban-Board ab',
            middlewares: ['authMiddleware', 'rateLimiter'],
            validationFields: [
                { name: 'status', type: 'string', required: false },
                { name: 'priority', type: 'string', required: false }
            ]
        },
        {
            id: '2',
            path: '/api/v1/tickets',
            method: 'POST',
            sourceType: 'table',
            sourceId: tables[0]?.id || '',
            description: 'Erstellt ein neues Ticket mit automatischer Zod-Validierung',
            middlewares: ['authMiddleware'],
            validationFields: [
                { name: 'title', type: 'string', required: true },
                { name: 'description', type: 'string', required: true },
                { name: 'priority', type: 'string', required: true }
            ]
        }
    ]);

    const [selectedRouteId, setSelectedRouteId] = useState<string>('1');
    const [codeTab, setCodeTab] = useState<'express' | 'nestjs' | 'fastify'>('express');
    const [copied, setCopied] = useState(false);

    const activeRoute = routes.find(r => r.id === selectedRouteId) || routes[0];

    const handleAddRoute = () => {
        const newRoute: ApiRouteItem = {
            id: crypto.randomUUID(),
            path: '/api/v1/new-endpoint',
            method: 'GET',
            sourceType: 'table',
            sourceId: tables[0]?.id || '',
            description: 'Eigener API-Endpunkt mit automatischem Mapping',
            middlewares: ['authMiddleware'],
            validationFields: []
        };
        setRoutes([...routes, newRoute]);
        setSelectedRouteId(newRoute.id);
        showMessage('Erfolg', 'Neuer API-Endpunkt wurde hinzugefügt.', 'success');
    };

    const handleDeleteRoute = (id: string) => {
        if (routes.length <= 1) {
            showMessage('Fehler', 'Es muss mindestens ein Endpunkt existieren.', 'error');
            return;
        }
        const filtered = routes.filter(r => r.id !== id);
        setRoutes(filtered);
        if (selectedRouteId === id) {
            setSelectedRouteId(filtered[0].id);
        }
    };

    const handleUpdateRoute = (id: string, updated: Partial<ApiRouteItem>) => {
        setRoutes(routes.map(r => r.id === id ? { ...r, ...updated } : r));
    };

    const handleCopy = (text: string) => {
        navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
        showMessage('Erfolg', 'Code wurde in die Zwischenablage kopiert!', 'success');
    };

    const generateExpressCode = (route: ApiRouteItem) => {
        const targetName = route.sourceType === 'table' 
            ? (tables.find(t => t.id === route.sourceId)?.name || 'Table')
            : (queries.find(q => q.id === route.sourceId)?.name || 'Query');

        const zodFields = route.validationFields.map(f => {
            let zType = `z.${f.type}()`;
            if (f.type === 'email') zType = `z.string().email()`;
            if (f.type === 'uuid') zType = `z.string().uuid()`;
            if (!f.required) zType += `.optional()`;
            return `    ${f.name}: ${zType},`;
        }).join('\n');

        const middlewaresStr = route.middlewares.length > 0
            ? `${route.middlewares.join(', ')}, `
            : '';

        return `import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { db } from './db'; 
import { ${route.middlewares.join(', ') || 'authMiddleware'} } from '../middlewares';

const router = Router();

// Zod Validation Schema
const ${targetName}Schema = z.object({
${zodFields || '    // Keine Filterparameter konfiguriert'}
});

/**
 * ${route.method} ${route.path}
 * Description: ${route.description}
 */
router.${route.method.toLowerCase()}('${route.path}', ${middlewaresStr}async (req: Request, res: Response) => {
    try {
        // Request Validierung
        const parsed = ${targetName}Schema.safeParse(${route.method === 'GET' ? 'req.query' : 'req.body'});
        if (!parsed.success) {
            return res.status(400).json({ error: 'Validierungsfehler', details: parsed.error.format() });
        }

        ${route.method === 'GET' ? `
        // Query ausführen auf ${route.sourceType} [${targetName}]
        const data = await db('${targetName}')
            .select('*')
            .where(parsed.data);
            
        return res.json({ success: true, count: data.length, data });
        ` : route.method === 'POST' ? `
        // Datensatz in ${targetName} einfügen
        const [insertedId] = await db('${targetName}')
            .insert(parsed.data)
            .returning('id');

        return res.status(201).json({ success: true, id: insertedId, message: 'Ressource erstellt' });
        ` : `
        // Datensatz updaten/löschen in ${targetName}
        await db('${targetName}')
            .where({ id: req.params.id || parsed.data.id })
            .update(parsed.data);

        return res.json({ success: true, message: 'Aktion erfolgreich ausgeführt' });
        `}
    } catch (error: any) {
        return res.status(500).json({ error: 'Serverfehler', message: error.message });
    }
});

export default router;`;
    };

    const generateNestCode = (route: ApiRouteItem) => {
        const targetName = route.sourceType === 'table' 
            ? (tables.find(t => t.id === route.sourceId)?.name || 'Table')
            : (queries.find(q => q.id === route.sourceId)?.name || 'Query');

        return `@Controller('${route.path.split('/')[2] || 'api'}')
@UseGuards(${route.middlewares.includes('authMiddleware') ? 'JwtAuthGuard' : 'PublicGuard'})
export class ${targetName}Controller {
    constructor(private readonly dbService: DatabaseService) {}

    @${route.method === 'GET' ? 'Get' : route.method === 'POST' ? 'Post' : 'Put'}('${route.path.split('/').slice(3).join('/')}')
    async handleRequest(@Query() queryParams: any, @Body() bodyData: any) {
        // Automatisch generiertes Controller-Mapping
        return this.dbService.execute('${targetName}', { ...queryParams, ...bodyData });
    }
}`;
    };

    return (
        <div className="h-full flex flex-col bg-slate-50 dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800">
            <div className="p-4 bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700">
                <h2 className="text-lg font-bold text-slate-800 dark:text-white flex items-center gap-2">
                    <Route size={20} className="text-cyan-500" /> API Endpoint & Routing Designer
                </h2>
                <p className="text-xs text-slate-500">Mappen Sie relationale Tabellen und SQL-Queries direkt auf REST Endpoints mit automatischer Zod Validierung.</p>
            </div>

            <div className="flex flex-1 overflow-hidden">
                {/* Route Sidebar */}
                <div className="w-80 bg-white dark:bg-slate-800 border-r border-slate-200 dark:border-slate-700 flex flex-col justify-between">
                    <div className="p-3 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center">
                        <span className="text-xs font-bold text-slate-500 dark:text-slate-400">REST Endpunkte ({routes.length})</span>
                        <button onClick={handleAddRoute} className="text-xs flex items-center gap-1 bg-cyan-50 text-cyan-700 hover:bg-cyan-100 dark:bg-cyan-900/40 dark:text-cyan-300 px-2 py-1 rounded font-semibold">
                            <Plus size={12}/> Route
                        </button>
                    </div>

                    <div className="flex-1 overflow-y-auto p-2 space-y-1">
                        {routes.map(r => {
                            const methodColors = {
                                GET: 'bg-green-100 text-green-700 dark:bg-green-950/40 dark:text-green-300',
                                POST: 'bg-blue-100 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300',
                                PUT: 'bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300',
                                DELETE: 'bg-red-100 text-red-700 dark:bg-red-950/40 dark:text-red-300',
                                PATCH: 'bg-purple-100 text-purple-700 dark:bg-purple-950/40 dark:text-purple-300'
                            };

                            return (
                                <div 
                                    key={r.id}
                                    onClick={() => setSelectedRouteId(r.id)}
                                    className={`flex items-center justify-between p-2 rounded-lg border transition-all cursor-pointer ${selectedRouteId === r.id ? 'bg-cyan-50 border-cyan-200 dark:bg-cyan-950/20 dark:border-cyan-800' : 'border-transparent hover:bg-slate-50 dark:hover:bg-slate-700/50'}`}
                                >
                                    <div className="flex items-center gap-2 truncate">
                                        <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${methodColors[r.method]}`}>{r.method}</span>
                                        <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 truncate font-mono">{r.path}</span>
                                    </div>
                                    <button 
                                        onClick={(e) => { e.stopPropagation(); handleDeleteRoute(r.id); }} 
                                        className="text-slate-400 hover:text-red-500 p-1 rounded"
                                    >
                                        <Trash2 size={12}/>
                                    </button>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Main Config Area */}
                {activeRoute && (
                    <div className="flex-1 overflow-y-auto p-4 md:p-6 flex flex-col md:flex-row gap-6">
                        {/* Editor Forms */}
                        <div className="flex-1 space-y-6">
                            <div className="bg-white dark:bg-slate-800 p-5 rounded-xl border border-slate-200 dark:border-slate-700 space-y-4 shadow-sm">
                                <h3 className="text-sm font-bold text-slate-800 dark:text-white flex items-center gap-1.5">
                                    <Settings size={16} className="text-cyan-500" /> Route-Konfiguration
                                </h3>

                                <div className="grid grid-cols-3 gap-4">
                                    <div>
                                        <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1">HTTP Methode</label>
                                        <select 
                                            value={activeRoute.method} 
                                            onChange={e => handleUpdateRoute(activeRoute.id, { method: e.target.value as any })}
                                            className="w-full text-xs border p-2 rounded bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-600 dark:text-white"
                                        >
                                            <option value="GET">GET (Daten lesen)</option>
                                            <option value="POST">POST (Daten erstellen)</option>
                                            <option value="PUT">PUT (Daten updaten)</option>
                                            <option value="DELETE">DELETE (Daten löschen)</option>
                                            <option value="PATCH">PATCH (Teil-Update)</option>
                                        </select>
                                    </div>
                                    <div className="col-span-2">
                                        <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1">Route Pfad</label>
                                        <input 
                                            type="text" 
                                            value={activeRoute.path} 
                                            onChange={e => handleUpdateRoute(activeRoute.id, { path: e.target.value })}
                                            className="w-full text-xs font-mono border p-2 rounded bg-slate-50 dark:bg-slate-900 border-slate-300 dark:border-slate-600 dark:text-white"
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1">Datenquelle Typ</label>
                                        <select 
                                            value={activeRoute.sourceType} 
                                            onChange={e => handleUpdateRoute(activeRoute.id, { sourceType: e.target.value as any })}
                                            className="w-full text-xs border p-2 rounded bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-600 dark:text-white"
                                        >
                                            <option value="table">Tabelle (Direktes CRUD)</option>
                                            <option value="query">Query (Optimierte SQL Query)</option>
                                            <option value="custom">Custom (Reiner Code-Controller)</option>
                                        </select>
                                    </div>
                                    {activeRoute.sourceType !== 'custom' && (
                                        <div>
                                            <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1">Gewählte Quelle</label>
                                            <select 
                                                value={activeRoute.sourceId} 
                                                onChange={e => handleUpdateRoute(activeRoute.id, { sourceId: e.target.value })}
                                                className="w-full text-xs border p-2 rounded bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-600 dark:text-white"
                                            >
                                                {activeRoute.sourceType === 'table' ? (
                                                    tables.map(t => <option key={t.id} value={t.id}>{t.name}</option>)
                                                ) : (
                                                    queries.map(q => <option key={q.id} value={q.id}>{q.name}</option>)
                                                )}
                                            </select>
                                        </div>
                                    )}
                                </div>

                                <div>
                                    <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1">Beschreibung / Dokumentation (Swagger/OpenAPI)</label>
                                    <textarea 
                                        rows={2}
                                        value={activeRoute.description} 
                                        onChange={e => handleUpdateRoute(activeRoute.id, { description: e.target.value })}
                                        className="w-full text-xs border p-2 rounded bg-slate-50 dark:bg-slate-900 border-slate-300 dark:border-slate-600 dark:text-white"
                                        placeholder="Beschreiben Sie kurz, was dieser Endpunkt tut..."
                                    />
                                </div>
                            </div>

                            {/* Middlewares & Shield */}
                            <div className="bg-white dark:bg-slate-800 p-5 rounded-xl border border-slate-200 dark:border-slate-700 space-y-4 shadow-sm">
                                <h3 className="text-sm font-bold text-slate-800 dark:text-white flex items-center gap-1.5">
                                    <Shield size={16} className="text-emerald-500" /> Middleware-Kette & Security Guards
                                </h3>

                                <div className="grid grid-cols-2 gap-4">
                                    {['authMiddleware', 'rateLimiter', 'auditLogger', 'tenantScopeGuard'].map(mid => (
                                        <label key={mid} className="flex items-center gap-2 p-3 rounded-lg border border-slate-100 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-900 cursor-pointer text-xs">
                                            <input 
                                                type="checkbox"
                                                checked={activeRoute.middlewares.includes(mid)}
                                                onChange={e => {
                                                    const current = activeRoute.middlewares;
                                                    const next = e.target.checked ? [...current, mid] : current.filter(m => m !== mid);
                                                    handleUpdateRoute(activeRoute.id, { middlewares: next });
                                                }}
                                                className="rounded text-cyan-600 border-slate-300 focus:ring-cyan-500"
                                            />
                                            <div>
                                                <span className="font-bold text-slate-700 dark:text-slate-300 font-mono">{mid}</span>
                                                <span className="block text-[10px] text-slate-400">
                                                    {mid === 'authMiddleware' ? 'Erfordert gültiges JWT / OAuth Token' :
                                                     mid === 'rateLimiter' ? 'Limitiert IP-Anfragen auf 100/min' :
                                                     mid === 'auditLogger' ? 'Loggt alle Datenbank-Modifikationen' :
                                                     'Sichert Datenmandanten-Trennung (SaaS)'}
                                                </span>
                                            </div>
                                        </label>
                                    ))}
                                </div>
                            </div>

                            {/* Validation Schema (Zod) */}
                            <div className="bg-white dark:bg-slate-800 p-5 rounded-xl border border-slate-200 dark:border-slate-700 space-y-4 shadow-sm">
                                <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-700 pb-2">
                                    <h3 className="text-sm font-bold text-slate-800 dark:text-white flex items-center gap-1.5">
                                        <Database size={16} className="text-blue-500" /> Validation-Schema (Zod Params)
                                    </h3>
                                    <button 
                                        onClick={() => {
                                            const updatedFields = [...activeRoute.validationFields, { name: 'newParam', type: 'string' as const, required: true }];
                                            handleUpdateRoute(activeRoute.id, { validationFields: updatedFields });
                                        }}
                                        className="text-[10px] flex items-center gap-1 bg-blue-50 text-blue-700 hover:bg-blue-100 px-2.5 py-1 rounded font-semibold dark:bg-blue-900/30 dark:text-blue-300"
                                    >
                                        <Plus size={10}/> Parameter hinzufügen
                                    </button>
                                </div>

                                <div className="space-y-2">
                                    {activeRoute.validationFields.length === 0 && (
                                        <p className="text-xs text-slate-400 italic">Keine Validierungsparameter konfiguriert. Alle Inputs werden unvalidiert durchgelassen.</p>
                                    )}
                                    {activeRoute.validationFields.map((field, idx) => (
                                        <div key={idx} className="flex items-center gap-2 bg-slate-50 dark:bg-slate-900 p-2 rounded-lg border border-slate-200 dark:border-slate-700">
                                            <input 
                                                type="text"
                                                value={field.name}
                                                onChange={e => {
                                                    const f = [...activeRoute.validationFields];
                                                    f[idx] = { ...f[idx], name: e.target.value.replace(/[^a-zA-Z0-9_]/g, '') };
                                                    handleUpdateRoute(activeRoute.id, { validationFields: f });
                                                }}
                                                placeholder="Param-Name (z.B. limit)"
                                                className="flex-1 text-xs font-mono border p-1 rounded bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-600 dark:text-white"
                                            />
                                            <select 
                                                value={field.type}
                                                onChange={e => {
                                                    const f = [...activeRoute.validationFields];
                                                    f[idx] = { ...f[idx], type: e.target.value as any };
                                                    handleUpdateRoute(activeRoute.id, { validationFields: f });
                                                }}
                                                className="text-xs border p-1 rounded bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-600 dark:text-white"
                                            >
                                                <option value="string">String</option>
                                                <option value="number">Number</option>
                                                <option value="boolean">Boolean</option>
                                                <option value="email">Email</option>
                                                <option value="uuid">UUID</option>
                                            </select>
                                            <label className="flex items-center gap-1 text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                                                <input 
                                                    type="checkbox"
                                                    checked={field.required}
                                                    onChange={e => {
                                                        const f = [...activeRoute.validationFields];
                                                        f[idx] = { ...f[idx], required: e.target.checked };
                                                        handleUpdateRoute(activeRoute.id, { validationFields: f });
                                                    }}
                                                    className="rounded border-slate-300 text-cyan-600 focus:ring-cyan-500"
                                                /> Pflicheld
                                            </label>
                                            <button 
                                                onClick={() => {
                                                    const f = activeRoute.validationFields.filter((_, i) => i !== idx);
                                                    handleUpdateRoute(activeRoute.id, { validationFields: f });
                                                }}
                                                className="text-red-500 hover:bg-red-50 p-1 rounded"
                                            >
                                                <Trash2 size={12}/>
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Code Generator Output */}
                        <div className="w-full md:w-[480px] flex flex-col bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-xl text-slate-300 h-[600px]">
                            <div className="p-3 bg-slate-950 border-b border-slate-800 flex justify-between items-center shrink-0">
                                <div className="flex gap-2">
                                    <button 
                                        onClick={() => setCodeTab('express')}
                                        className={`text-xs px-2.5 py-1 rounded font-bold transition-all ${codeTab === 'express' ? 'bg-cyan-500 text-slate-950' : 'text-slate-400 hover:text-white'}`}
                                    >
                                        Express.js
                                    </button>
                                    <button 
                                        onClick={() => setCodeTab('nestjs')}
                                        className={`text-xs px-2.5 py-1 rounded font-bold transition-all ${codeTab === 'nestjs' ? 'bg-cyan-500 text-slate-950' : 'text-slate-400 hover:text-white'}`}
                                    >
                                        NestJS
                                    </button>
                                </div>
                                <button 
                                    onClick={() => handleCopy(codeTab === 'express' ? generateExpressCode(activeRoute) : generateNestCode(activeRoute))}
                                    className="text-xs flex items-center gap-1 hover:text-white text-slate-400"
                                    title="In Zwischenablage kopieren"
                                >
                                    {copied ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />} <span>{copied ? 'Kopiert!' : 'Kopieren'}</span>
                                </button>
                            </div>

                            <div className="flex-1 overflow-auto p-4 font-mono text-[11px] leading-relaxed select-all">
                                <pre className="whitespace-pre">
                                    {codeTab === 'express' ? generateExpressCode(activeRoute) : generateNestCode(activeRoute)}
                                </pre>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};
