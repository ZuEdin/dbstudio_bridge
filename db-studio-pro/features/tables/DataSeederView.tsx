import React, { useState, useEffect } from 'react';
import { Table, BackendConfig } from '../../types/index';
import { Database, Plus, Trash2, Code, Copy, Check, Info, Settings, Shield, RefreshCw } from 'lucide-react';

interface DataSeederViewProps {
    tables: Table[];
    backendConfig: BackendConfig;
    showMessage: (title: string, message: string, type: 'info' | 'success' | 'warning' | 'error') => void;
}

export const DataSeederView: React.FC<DataSeederViewProps> = ({ tables, backendConfig, showMessage }) => {
    const [selectedTableId, setSelectedTableId] = useState<string>(tables[0]?.id || '');
    const [rows, setRows] = useState<Record<string, any>[]>([]);
    const [copied, setCopied] = useState(false);
    const [seedFormat, setSeedFormat] = useState<'sql' | 'prisma' | 'drizzle' | 'knex'>('sql');

    const activeTable = tables.find(t => t.id === selectedTableId) || tables[0];

    // Initialize rows with activeTable.data or a dummy row
    useEffect(() => {
        if (activeTable) {
            if (activeTable.data && activeTable.data.length > 0) {
                setRows(activeTable.data.slice(0, 5));
            } else {
                // Generate a blank row with default fields
                const defaultRow: Record<string, any> = {};
                activeTable.fields.forEach(f => {
                    defaultRow[f.name] = f.isPrimaryKey ? 1 : '';
                });
                setRows([defaultRow]);
            }
        }
    }, [selectedTableId, activeTable]);

    const handleAddRow = () => {
        const newRow: Record<string, any> = {};
        activeTable.fields.forEach(f => {
            if (f.isPrimaryKey) {
                const maxId = rows.reduce((max, r) => {
                    const val = parseInt(r[f.name]);
                    return isNaN(val) ? max : Math.max(max, val);
                }, 0);
                newRow[f.name] = maxId + 1;
            } else {
                newRow[f.name] = '';
            }
        });
        setRows([...rows, newRow]);
    };

    const handleUpdateCell = (rowIdx: number, fieldName: string, value: any) => {
        const updated = [...rows];
        updated[rowIdx] = { ...updated[rowIdx], [fieldName]: value };
        setRows(updated);
    };

    const handleRemoveRow = (idx: number) => {
        if (rows.length <= 1) {
            showMessage('Fehler', 'Es muss mindestens eine Zeile zum Seeden konfiguriert sein.', 'error');
            return;
        }
        setRows(rows.filter((_, i) => i !== idx));
    };

    const handleCopy = (text: string) => {
        navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
        showMessage('Erfolg', 'Seed-Script wurde kopiert!', 'success');
    };

    const generateSeedScript = () => {
        if (!activeTable) return '// Keine Tabelle ausgewählt';
        const tableName = activeTable.name;
        const fields = activeTable.fields.map(f => f.name);

        switch (seedFormat) {
            case 'sql': {
                const inserts = rows.map(row => {
                    const values = activeTable.fields.map(f => {
                        const val = row[f.name];
                        if (val === undefined || val === '') return 'NULL';
                        if (f.type === 'INTEGER' || f.type === 'DECIMAL' || f.type === 'BOOLEAN') return val;
                        return `'${val.toString().replace(/'/g, "''")}'`;
                    }).join(', ');
                    return `INSERT INTO "${tableName}" (${fields.map(fn => `"${fn}"`).join(', ')}) VALUES (${values});`;
                }).join('\n');
                return `-- SQL Master-Daten Seed für Tabelle [${tableName}]\n-- Generiert im AI Studio Workspace\n\nTRUNCATE TABLE "${tableName}" RESTART IDENTITY CASCADE;\n\n${inserts}`;
            }
            case 'prisma': {
                const prismaRows = rows.map(row => {
                    const entries = activeTable.fields.map(f => {
                        const val = row[f.name];
                        const formattedVal = (f.type === 'INTEGER' || f.type === 'DECIMAL') 
                            ? (parseInt(val) || 0)
                            : f.type === 'BOOLEAN' ? (val === 'true' || val === true) : `'${val}'`;
                        return `      ${f.name}: ${formattedVal}`;
                    }).join(',\n');
                    return `    {\n${entries}\n    }`;
                }).join(',\n');

                return `import { PrismaClient } from '@prisma/client';\nconst prisma = new PrismaClient();\n\nasync function main() {\n  console.log('Seeding table [${tableName}]...');\n  \n  await prisma.${tableName.toLowerCase()}.deleteMany();\n  \n  await prisma.${tableName.toLowerCase()}.createMany({\n    data: [\n${prismaRows}\n    ]\n  });\n}\n\nmain()\n  .catch((e) => { console.error(e); process.exit(1); })\n  .finally(async () => { await prisma.$disconnect(); });`;
            }
            case 'drizzle': {
                const drizzleRows = rows.map(row => {
                    const entries = activeTable.fields.map(f => {
                        const val = row[f.name];
                        const formattedVal = (f.type === 'INTEGER' || f.type === 'DECIMAL') 
                            ? (parseInt(val) || 0)
                            : f.type === 'BOOLEAN' ? (val === 'true' || val === true) : `'${val}'`;
                        return `    ${f.name}: ${formattedVal}`;
                    }).join(',\n');
                    return `  {\n${entries}\n  }`;
                }).join(',\n');

                return `import { db } from './db';\nimport { ${tableName.toLowerCase()} } from './schema';\n\nasync function seed() {\n  console.log('Seeding table ${tableName} with master data...');\n  \n  await db.insert(${tableName.toLowerCase()}).values([\n${drizzleRows}\n  ]).onConflictDoNothing();\n}\n\nseed();`;
            }
            case 'knex': {
                const knexRows = rows.map(row => {
                    const entries = activeTable.fields.map(f => {
                        const val = row[f.name];
                        const formattedVal = (f.type === 'INTEGER' || f.type === 'DECIMAL') 
                            ? (parseInt(val) || 0)
                            : f.type === 'BOOLEAN' ? (val === 'true' || val === true) : `'${val}'`;
                        return `      ${f.name}: ${formattedVal}`;
                    }).join(',\n');
                    return `    {\n${entries}\n    }`;
                }).join(',\n');

                return `exports.seed = async function(knex) {\n  // Deletes ALL existing entries\n  await knex('${tableName}').del();\n  \n  // Inserts seed entries\n  await knex('${tableName}').insert([\n${knexRows}\n  ]);\n};`;
            }
            default:
                return '';
        }
    };

    return (
        <div className="h-full flex flex-col bg-slate-50 dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800">
            <div className="p-4 bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700">
                <h2 className="text-lg font-bold text-slate-800 dark:text-white flex items-center gap-2">
                    <Database size={20} className="text-emerald-500" /> Advanced Data Seeding & Master Data Manager
                </h2>
                <p className="text-xs text-slate-500">Erfassen Sie Master- und Stammdaten (z.B. Ländercodes, Systemrollen, Status) und generieren Sie performante Seed-Dateien.</p>
            </div>

            <div className="flex-1 overflow-hidden flex flex-col md:flex-row">
                {/* Editor area */}
                <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6">
                    {/* Table Select */}
                    <div className="bg-white dark:bg-slate-800 p-5 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm space-y-4">
                        <div className="flex justify-between items-center">
                            <h3 className="text-sm font-bold text-slate-800 dark:text-white flex items-center gap-1.5">
                                <Settings size={16} className="text-emerald-500" /> Seeding Zieltabelle
                            </h3>
                            <button 
                                onClick={handleAddRow}
                                className="text-xs flex items-center gap-1 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 px-3 py-1.5 rounded font-semibold dark:bg-emerald-900/30 dark:text-emerald-300"
                            >
                                <Plus size={12}/> Zeile hinzufügen
                            </button>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1">Stammdaten Tabelle</label>
                                <select 
                                    value={selectedTableId} 
                                    onChange={e => setSelectedTableId(e.target.value)}
                                    className="w-full text-xs border p-2 rounded bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-600 dark:text-white"
                                >
                                    {tables.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                                </select>
                            </div>
                        </div>
                    </div>

                    {/* Interactive Table Data Grid */}
                    {activeTable && (
                        <div className="bg-white dark:bg-slate-800 p-5 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm space-y-4 overflow-x-auto">
                            <h3 className="text-sm font-bold text-slate-800 dark:text-white">Master-Datensätze bearbeiten</h3>
                            
                            <table className="w-full border-collapse text-left text-xs">
                                <thead>
                                    <tr className="border-b border-slate-200 dark:border-slate-700 text-slate-500 bg-slate-50 dark:bg-slate-900/50">
                                        {activeTable.fields.map(f => (
                                            <th key={f.id} className="p-2 font-bold font-mono">
                                                {f.name} <span className="text-[10px] text-slate-400 font-normal">({f.type})</span>
                                                {f.isPrimaryKey && <span className="ml-1 text-[9px] bg-amber-100 text-amber-800 px-1 rounded">PK</span>}
                                            </th>
                                        ))}
                                        <th className="p-2 w-10"></th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                                    {rows.map((row, rowIdx) => (
                                        <tr key={rowIdx} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                                            {activeTable.fields.map(field => {
                                                const rawVal = row[field.name] ?? '';
                                                let inputType = "text";
                                                let inputValue: any = rawVal;
                                                
                                                if (field?.type === 'INTEGER' || field?.type === 'DECIMAL' || field?.type === 'REAL') {
                                                    inputType = "number";
                                                } else if (field?.type === 'DATE') {
                                                    inputType = "date";
                                                    if (rawVal) {
                                                        const d = new Date(rawVal);
                                                        if (!isNaN(d.getTime())) {
                                                            inputValue = d.toISOString().split('T')[0];
                                                        }
                                                    }
                                                } else if (field?.type === 'TIME') {
                                                    inputType = "time";
                                                    if (typeof rawVal === 'string' && rawVal.length > 5) {
                                                        inputValue = rawVal.substring(0, 5);
                                                    }
                                                } else if (field?.type === 'DATETIME' || field?.type === 'TIMESTAMP') {
                                                    inputType = "datetime-local";
                                                    if (rawVal) {
                                                        const d = new Date(rawVal);
                                                        if (!isNaN(d.getTime())) {
                                                            inputValue = d.toISOString().slice(0, 16);
                                                        }
                                                    }
                                                } else if (field?.type === 'BOOLEAN') {
                                                    inputType = "checkbox";
                                                    inputValue = Boolean(rawVal) && String(rawVal).toLowerCase() !== 'false' && String(rawVal) !== '0';
                                                }

                                                return (
                                                    <td key={field.id} className="p-1 text-center">
                                                        {inputType === 'checkbox' ? (
                                                            <input
                                                                type="checkbox"
                                                                checked={inputValue as boolean}
                                                                onChange={e => handleUpdateCell(rowIdx, field.name, e.target.checked)}
                                                                className="w-4 h-4 text-emerald-500 rounded border-slate-300 focus:ring-emerald-500"
                                                            />
                                                        ) : (
                                                            <input 
                                                                type={inputType}
                                                                value={inputValue as string}
                                                                onChange={e => handleUpdateCell(rowIdx, field.name, e.target.value)}
                                                                className="w-full bg-transparent p-1.5 focus:bg-white dark:focus:bg-slate-900 rounded border border-transparent hover:border-slate-200 dark:hover:border-slate-700 focus:border-emerald-500 font-mono text-xs dark:text-white"
                                                            />
                                                        )}
                                                    </td>
                                                );
                                            })}
                                            <td className="p-1 text-center">
                                                <button onClick={() => handleRemoveRow(rowIdx)} className="text-slate-400 hover:text-red-500 p-1.5 rounded">
                                                    <Trash2 size={12}/>
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>

                {/* Script Code Output */}
                <div className="w-full md:w-[480px] bg-slate-900 border-t md:border-t-0 md:border-l border-slate-800 flex flex-col overflow-hidden text-slate-300 h-full">
                    <div className="p-3 bg-slate-950 border-b border-slate-800 flex justify-between items-center shrink-0">
                        <div className="flex gap-2">
                            {['sql', 'prisma', 'drizzle', 'knex'].map(fmt => (
                                <button 
                                    key={fmt}
                                    onClick={() => setSeedFormat(fmt as any)}
                                    className={`text-xs px-2 py-1 rounded font-bold transition-all ${seedFormat === fmt ? 'bg-emerald-500 text-slate-950' : 'text-slate-400 hover:text-white'}`}
                                >
                                    {fmt.toUpperCase()}
                                </button>
                            ))}
                        </div>
                        <button 
                            onClick={() => handleCopy(generateSeedScript())}
                            className="text-xs flex items-center gap-1 hover:text-white text-slate-400"
                        >
                            {copied ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />} <span>{copied ? 'Kopiert!' : 'Kopieren'}</span>
                        </button>
                    </div>
                    <div className="flex-grow p-4 overflow-y-auto font-mono text-[11px] leading-relaxed select-all bg-slate-950">
                        <pre className="whitespace-pre">
                            {generateSeedScript()}
                        </pre>
                    </div>
                </div>
            </div>
        </div>
    );
};
