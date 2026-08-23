import React, { useState } from 'react';
import { SelectQuery } from '../../../types/index';

interface ApiInspectorProps {
    queries: any[];
    tables: any[];
}

export const ApiInspector: React.FC<ApiInspectorProps> = ({ queries, tables }) => {
    const [selectedType, setSelectedType] = useState<'table' | 'query'>('table');
    const [selectedId, setSelectedId] = useState<string>('');
    const [mockData, setMockData] = useState<any[] | null>(null);

    const activeList = selectedType === 'table' ? tables : queries;

    const handleSelectType = (type: 'table' | 'query') => {
        setSelectedType(type);
        setSelectedId('');
        setMockData(null);
    };

    const handleSelectId = (id: string) => {
        setSelectedId(id);
        if (!id) {
            setMockData(null);
            return;
        }

        if (selectedType === 'table') {
            const t = tables.find(tb => tb.id === id);
            setMockData(t ? t.data || [] : []);
        } else {
            const q = queries.find(qi => qi.id === id);
            if (q) {
                const cols = q.columns || [];
                const mockRows = Array.from({ length: 3 }).map((_, idx) => {
                    const row: Record<string, any> = {};
                    cols.forEach((col: any) => {
                        const name = col.alias || col.fieldName || 'field';
                        if (name.toLowerCase().includes('id')) row[name] = idx + 1;
                        else if (name.toLowerCase().includes('name')) row[name] = ['Müller', 'Schmidt', 'Fischer'][idx];
                        else if (name.toLowerCase().includes('status')) row[name] = ['Aktiv', 'Inaktiv', 'Entwurf'][idx];
                        else row[name] = `Wert ${idx + 1}`;
                    });
                    return row;
                });
                setMockData(mockRows);
            } else {
                setMockData([]);
            }
        }
    };

    return (
        <div className="space-y-3">
            <div className="flex bg-slate-200 p-0.5 rounded text-xs">
                <button 
                    type="button"
                    onClick={() => handleSelectType('table')}
                    className={`flex-1 py-1 rounded text-center font-medium transition ${selectedType === 'table' ? 'bg-white shadow-sm text-slate-800' : 'text-slate-500 hover:text-slate-800'}`}
                >
                    Tabellen
                </button>
                <button 
                    type="button"
                    onClick={() => handleSelectType('query')}
                    className={`flex-1 py-1 rounded text-center font-medium transition ${selectedType === 'query' ? 'bg-white shadow-sm text-slate-800' : 'text-slate-500 hover:text-slate-800'}`}
                >
                    Abfragen
                </button>
            </div>

            <select
                value={selectedId}
                onChange={(e) => handleSelectId(e.target.value)}
                className="w-full bg-white border border-slate-300 rounded px-2 py-1.5 text-xs focus:ring-1 focus:ring-indigo-500"
            >
                <option value="">-- Quelle auswählen --</option>
                {activeList.map(item => (
                    <option key={item.id} value={item.id}>{item.name}</option>
                ))}
            </select>

            {selectedId && (
                <div className="space-y-2 pt-1 border-t border-slate-100">
                    <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                        Endpoint &amp; Snippet:
                    </div>
                    <div className="bg-slate-900 text-slate-300 rounded p-2 text-[10px] font-mono select-all overflow-x-auto break-all">
                        {selectedType === 'table' ? (
                            `GET /api/tables/${activeList.find(x => x.id === selectedId)?.name || 'data'}`
                        ) : (
                            `GET /api/queries/${selectedId}`
                        )}
                    </div>

                    <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider pt-1 flex justify-between items-center">
                        <span>Antwort-Vorschau (Muster):</span>
                        <span className="text-[8px] bg-indigo-100 text-indigo-700 font-bold px-1 rounded uppercase">JSON</span>
                    </div>

                    <div className="bg-slate-900 text-emerald-400 rounded p-2 text-[10px] font-mono overflow-y-auto max-h-40 whitespace-pre-wrap">
                        {mockData ? JSON.stringify(mockData, null, 2) : 'Keine Vorschau verfügbar'}
                    </div>
                </div>
            )}
        </div>
    );
};
