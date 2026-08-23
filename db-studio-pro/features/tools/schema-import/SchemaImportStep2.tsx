import React from 'react';
import { Check, Database } from 'lucide-react';
import { Table } from '../../../types/index';

interface SchemaImportStep2Props {
  detectedFormat: string;
  parsedTables: Table[];
}

export const SchemaImportStep2: React.FC<SchemaImportStep2Props> = ({
  detectedFormat,
  parsedTables,
}) => {
  return (
    <div className="flex-1 p-6 flex flex-col gap-4 overflow-y-auto">
      <div className="bg-white rounded-lg p-4 border border-slate-200 shadow-sm shrink-0 flex items-center justify-between">
        <div>
          <h3 className="font-bold text-slate-800 text-base flex items-center gap-2">
            <Check className="text-green-600" size={18}/> Analyse abgeschlossen
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Format: <strong className="text-purple-700">{detectedFormat}</strong> | {parsedTables.length} Tabelle(n) bereit zum Anlegen im System.
          </p>
        </div>
        
        <div className="text-xs bg-purple-50 text-purple-700 font-bold px-3 py-1.5 rounded-lg border border-purple-100">
          IndexedDB Engine bereit
        </div>
      </div>

      {/* Table Preview List */}
      <div className="space-y-4">
        {parsedTables.map((table) => (
          <div key={table.id} className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
            {/* Table title */}
            <div className="bg-slate-50 border-b border-slate-100 px-4 py-3 flex justify-between items-center">
              <span className="font-bold text-slate-800 flex items-center gap-2 font-mono text-sm">
                <Database size={16} className="text-slate-400" /> {table.name}
              </span>
              <span className="text-xs text-slate-500 bg-slate-200 px-2 py-0.5 rounded font-medium">
                {table.fields.length} Spalten {table.data && table.data.length > 0 ? `| ${table.data.length} Datensätze` : ''}
              </span>
            </div>

            {/* Columns Grid */}
            <div className="p-4 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 bg-white">
              {table.fields.map(field => (
                <div key={field.id} className="flex flex-col p-2.5 rounded border border-slate-100 hover:border-slate-300 transition-all bg-slate-50/50">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-mono text-xs font-bold text-slate-700 truncate">{field.name}</span>
                    {field.isPrimaryKey && <span className="text-[9px] font-bold uppercase tracking-wider bg-amber-100 text-amber-800 px-1 py-0.5 rounded">PK</span>}
                  </div>
                  <div className="flex items-center gap-1.5 mt-1 text-[10px] text-slate-500">
                    <span className="font-mono bg-purple-50 text-purple-700 px-1 py-0.5 rounded font-bold">{field.type}</span>
                    {field.length && <span className="text-slate-400">({field.length})</span>}
                    {!field.allowNull && <span className="text-red-500 text-[9px] font-bold">NOT NULL</span>}
                  </div>
                  {field.defaultValue && (
                    <div className="text-[9px] text-slate-400 mt-1 italic truncate">
                      Default: {field.defaultValue}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
