import React, { useState } from 'react';
import { Table, BackendConfig } from '../../types/index';
import { Users, ShieldAlert, Check, Copy, Code, HelpCircle, AlertTriangle, ArrowRight, Server, Database, Plus, Trash2 } from 'lucide-react';

interface MultiTenancyWizardProps {
    config: BackendConfig;
    tables: Table[];
    onUpdateConfig?: (config: BackendConfig) => void;
    showMessage: (title: string, message: string, type: 'info' | 'success' | 'warning' | 'error') => void;
}

export const MultiTenancyWizard: React.FC<MultiTenancyWizardProps> = ({ config, tables, onUpdateConfig, showMessage }) => {
    const [enabled, setEnabled] = useState(config.multiTenancy?.enabled || false);
    const [strategy, setStrategy] = useState<'discriminator' | 'database'>(config.multiTenancy?.strategy || 'discriminator');
    const [tenantField, setTenantField] = useState(config.multiTenancy?.tenantField || 'tenant_id');
    const [selectedTenantTables, setSelectedTenantTables] = useState<string[]>(
        tables.slice(0, 3).map(t => t.id)
    );
    const [copied, setCopied] = useState(false);

    const handleSaveConfig = () => {
        if (onUpdateConfig) {
            onUpdateConfig({
                ...config,
                multiTenancy: {
                    enabled,
                    strategy,
                    tenantField
                }
            });
        }
        showMessage('Erfolg', 'Multi-Tenancy Konfiguration erfolgreich aktualisiert.', 'success');
    };

    const handleCopy = (text: string) => {
        navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
        showMessage('Erfolg', 'SaaS Scaffold Code kopiert!', 'success');
    };

    const toggleTenantTable = (id: string) => {
        if (selectedTenantTables.includes(id)) {
            setSelectedTenantTables(selectedTenantTables.filter(t => t !== id));
        } else {
            setSelectedTenantTables([...selectedTenantTables, id]);
        }
    };

    const generateCode = () => {
        if (strategy === 'discriminator') {
            const tableNames = selectedTenantTables.map(id => tables.find(t => t.id === id)?.name).filter(Boolean);
            return `/**
 * MULTI-TENANT ARCHITECTURE: SHARED SCHEMA STRATEGY
 * Automatisch generiertes Scoping-Middleware- & Query-Scaffolding.
 * Jede SaaS-Tabelle besitzt ein [${tenantField}] Feld zur Trennung.
 */

import { Request, Response, NextFunction } from 'express';
import { db } from './db';

export interface TenantRequest extends Request {
    tenantId?: string;
}

/**
 * Middleware: Ermittelt den Tenant anhand des 'X-Tenant-ID' Headers oder Subdomains.
 */
export function tenantContextMiddleware(req: TenantRequest, res: Response, next: NextFunction) {
    const tenantHeader = req.header('X-Tenant-ID');
    
    // Fallback auf Subdomain (z.B. client1.my-saas.com)
    const host = req.headers.host || '';
    const subdomain = host.split('.')[0];
    
    const tenantId = tenantHeader || (subdomain !== 'www' && subdomain !== 'app' ? subdomain : null);
    
    if (!tenantId) {
        return res.status(400).json({ 
            error: 'SaaS Error', 
            message: 'Mandanten-Identifikator fehlt im Header (X-Tenant-ID) oder Subdomain.' 
        });
    }
    
    req.tenantId = tenantId;
    next();
}

/**
 * Datenbank Query Wrapper für automatischen Tenant-Scope.
 * Verhindert Rauschen oder Daten-Leaks zwischen Mandanten vollständig!
 */
export const TenantScope = {
    /**
     * Führt SELECT auf einer mandantenfähigen Tabelle aus (mit automatischem WHERE)
     */
    async findMany(tableName: string, tenantId: string, filter: any = {}) {
        const isMultiTenant = [
            ${tableNames.map(n => `'${n}'`).join(', ')}
        ].includes(tableName);
        
        if (isMultiTenant) {
            return db(tableName).where({ ...filter, ${tenantField}: tenantId });
        }
        
        return db(tableName).where(filter);
    },

    /**
     * Erstellt einen neuen Datensatz mit dem korrekten TenantId-Schlüssel
     */
    async create(tableName: string, tenantId: string, data: any) {
        return db(tableName).insert({
            ...data,
            ${tenantField}: tenantId
        }).returning('*');
    }
};

// Beispiel Express Route:
// router.get('/orders', tenantContextMiddleware, async (req: TenantRequest, res) => {
//    const orders = await TenantScope.findMany('orders', req.tenantId!);
//    res.json(orders);
// });`;
        } else {
            return `/**
 * MULTI-TENANT ARCHITECTURE: DATABASE-PER-TENANT STRATEGY
 * Dynamische Datenbank-Router, Pooling und Verbindungs-Umschaltung
 * Jeder Mandant besitzt seine eigene, physisch getrennte SQL-Datenbank!
 */

import { Request, Response, NextFunction } from 'express';
import knex, { Knex } from 'knex';

// Cache für aktive Datenbank-Pools
const tenantPools: Record<string, Knex> = {};

/**
 * Liefert die Datenbank-Konfiguration für einen bestimmten Tenant aus der Registry
 */
async function getTenantDbConfig(tenantId: string) {
    // In der Produktion laden Sie dies aus einer Master-Datenbank
    return {
        client: 'pg',
        connection: {
            host: process.env.DB_MASTER_HOST || '127.0.0.1',
            user: 'db_user',
            password: 'secret_password',
            database: \`saas_tenant_\${tenantId}\`, // Dynamischer DB Name
            port: 5432
        },
        pool: { min: 2, max: 10 }
    };
}

/**
 * Ermittelt oder erstellt den passenden Connection Pool für diesen Mandanten
 */
export async function getTenantConnection(tenantId: string): Promise<Knex> {
    if (tenantPools[tenantId]) {
        return tenantPools[tenantId];
    }
    
    const config = await getTenantDbConfig(tenantId);
    const pool = knex(config);
    
    // Speichern im Cache
    tenantPools[tenantId] = pool;
    return pool;
}

/**
 * Express Middleware zum Bereitstellen der dynamischen Knex Instanz im Request
 */
export interface MultiTenantRequest extends Request {
    tenantId?: string;
    db?: Knex;
}

export async function useDynamicTenantDb(req: MultiTenantRequest, res: Response, next: NextFunction) {
    const tenantId = req.header('X-Tenant-ID');
    
    if (!tenantId) {
        return res.status(400).json({ error: 'Missing tenant identifier.' });
    }
    
    try {
        req.tenantId = tenantId;
        req.db = await getTenantConnection(tenantId);
        next();
    } catch (err: any) {
        res.status(500).json({ error: 'Database Route Fail', details: err.message });
    }
}

// Verwendung im Controller:
// app.get('/api/users', useDynamicTenantDb, async (req: MultiTenantRequest, res) => {
//     const users = await req.db!('users').select('*');
//     res.json(users);
// });`;
        }
    };

    return (
        <div className="h-full flex flex-col bg-slate-50 dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800">
            <div className="p-4 bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700">
                <h2 className="text-lg font-bold text-slate-800 dark:text-white flex items-center gap-2">
                    <Users size={20} className="text-amber-500" /> Multi-Tenant (SaaS) Architecture Setup
                </h2>
                <p className="text-xs text-slate-500">Konfigurieren Sie Mandantenfähigkeit für Ihre App. Wählen Sie zwischen logischer Trennung (Column) oder physischer Isolation (mehrere DBs).</p>
            </div>

            <div className="flex-1 overflow-hidden flex flex-col md:flex-row">
                {/* Form controls */}
                <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6">
                    {/* Master Switch */}
                    <div className="bg-white dark:bg-slate-800 p-5 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm flex items-center justify-between">
                        <div>
                            <h3 className="text-sm font-bold text-slate-800 dark:text-white">SaaS Mandantenfähigkeit (Multi-Tenancy) aktivieren</h3>
                            <p className="text-xs text-slate-500 mt-1">Bereitet den Code für die sichere Bereitstellung für Hunderte separate Firmen/Kunden vor.</p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer select-none">
                            <input 
                                type="checkbox" 
                                checked={enabled} 
                                onChange={e => setEnabled(e.target.checked)}
                                className="sr-only peer" 
                            />
                            <div className="w-11 h-6 bg-slate-300 dark:bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:width-5 after:transition-all dark:border-slate-600 peer-checked:bg-amber-500"></div>
                        </label>
                    </div>

                    {enabled && (
                        <>
                            {/* Strategy Select */}
                            <div className="bg-white dark:bg-slate-800 p-5 rounded-xl border border-slate-200 dark:border-slate-700 space-y-4 shadow-sm">
                                <h3 className="text-sm font-bold text-slate-800 dark:text-white">Multi-Tenant Strategie auswählen</h3>
                                
                                <div className="grid grid-cols-2 gap-4">
                                    <div 
                                        onClick={() => setStrategy('discriminator')}
                                        className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${strategy === 'discriminator' ? 'border-amber-500 bg-amber-50/20 dark:bg-amber-950/10' : 'border-slate-100 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-900'}`}
                                    >
                                        <div className="flex items-center gap-2 mb-2">
                                            <Database size={16} className="text-amber-500" />
                                            <span className="text-xs font-bold text-slate-800 dark:text-white">Shared Schema (Logisch)</span>
                                        </div>
                                        <p className="text-[11px] text-slate-500 leading-normal">
                                            Alle Mandanten teilen sich eine einzige Datenbank. Ein Diskriminator-Feld (z.B. <code className="font-mono bg-slate-100 p-0.5 text-red-500">tenant_id</code>) trennt die Daten. Günstig, extrem performant & einfach zu migrieren.
                                        </p>
                                    </div>

                                    <div 
                                        onClick={() => setStrategy('database')}
                                        className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${strategy === 'database' ? 'border-amber-500 bg-amber-50/20 dark:bg-amber-950/10' : 'border-slate-100 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-900'}`}
                                    >
                                        <div className="flex items-center gap-2 mb-2">
                                            <Server size={16} className="text-amber-500" />
                                            <span className="text-xs font-bold text-slate-800 dark:text-white">Schema-per-Tenant / DB (Physisch)</span>
                                        </div>
                                        <p className="text-[11px] text-slate-500 leading-normal">
                                            Jeder Kunde besitzt seine eigene relationale Datenbank. Höchste physische Datensicherheit und Isolation. Bestens geeignet für große Firmen-Lösungen oder strenge Compliance-Richtlinien.
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Options depending on Strategy */}
                            {strategy === 'discriminator' ? (
                                <div className="bg-white dark:bg-slate-800 p-5 rounded-xl border border-slate-200 dark:border-slate-700 space-y-4 shadow-sm">
                                    <h3 className="text-sm font-bold text-slate-800 dark:text-white">Shared Schema Optionen</h3>
                                    
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1">Diskriminator-Feld (Spalten-Name)</label>
                                            <input 
                                                type="text" 
                                                value={tenantField} 
                                                onChange={e => setTenantField(e.target.value.replace(/[^a-z0-9_]/g, ''))}
                                                className="w-full text-xs font-mono border p-2 rounded bg-slate-50 dark:bg-slate-900 border-slate-300 dark:border-slate-600 dark:text-white"
                                            />
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-2">Für welche Tabellen soll Tenant-Isolation erzwungen werden?</label>
                                        <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto p-2 border rounded border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-900">
                                            {tables.map(t => (
                                                <label key={t.id} className="flex items-center gap-2 p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded cursor-pointer text-xs">
                                                    <input 
                                                        type="checkbox"
                                                        checked={selectedTenantTables.includes(t.id)}
                                                        onChange={() => toggleTenantTable(t.id)}
                                                        className="rounded text-amber-500 border-slate-300 focus:ring-amber-400"
                                                    />
                                                    <span className="font-semibold text-slate-700 dark:text-slate-300 font-mono">{t.name}</span>
                                                </label>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <div className="bg-white dark:bg-slate-800 p-5 rounded-xl border border-slate-200 dark:border-slate-700 space-y-3 shadow-sm">
                                    <h3 className="text-sm font-bold text-slate-800 dark:text-white flex items-center gap-1.5 text-amber-600">
                                        <ShieldAlert size={16} /> Compliance & Sicherheits-Hinweis
                                    </h3>
                                    <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                                        Die DB-per-Tenant Strategie erzeugt dynamische Verbindungspools im Arbeitsspeicher des Node.js-Servers. Stellen Sie sicher, dass Ihre Hostings-Plattform genügend Dateihandles und offene Verbindungen (max_connections) unterstützt, da für jeden Tenant ein Mini-Pool erzeugt wird.
                                    </p>
                                </div>
                            )}

                            {/* Save Button */}
                            <div className="flex justify-end">
                                <button 
                                    onClick={handleSaveConfig}
                                    className="bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs px-4 py-2 rounded-lg shadow transition-colors"
                                >
                                    SaaS Struktur übernehmen
                                </button>
                            </div>
                        </>
                    )}
                </div>

                {/* Code Generator Output */}
                <div className="w-full md:w-[480px] bg-slate-900 border-t md:border-t-0 md:border-l border-slate-800 flex flex-col overflow-hidden text-slate-300 h-full">
                    <div className="p-3 bg-slate-950 border-b border-slate-800 flex justify-between items-center shrink-0">
                        <span className="text-xs font-bold text-slate-400 flex items-center gap-1.5">
                            <Code size={14} className="text-amber-500" /> SaaS / Tenant Scaffolding Code
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
