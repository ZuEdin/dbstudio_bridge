import React from 'react';
import { Save, Table as TableIcon } from 'lucide-react';
import { inferFieldType } from '../../../utils/apiImportHelper';

interface ApiSaveModalProps {
  showSaveModal: boolean;
  setShowSaveModal: (show: boolean) => void;
  saveTableName: string;
  setSaveTableName: (name: string) => void;
  primaryKeyCol: string | null;
  setPrimaryKeyCol: (col: string | null) => void;
  columns: string[];
  schemaOverrides: Record<string, any>;
  data: any[];
  performSave: (tableName: string) => void;
}

export const ApiSaveModal: React.FC<ApiSaveModalProps> = ({
  showSaveModal,
  setShowSaveModal,
  saveTableName,
  setSaveTableName,
  primaryKeyCol,
  setPrimaryKeyCol,
  columns,
  schemaOverrides,
  data,
  performSave,
}) => {
  if (!showSaveModal) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white border border-slate-200 rounded-xl shadow-2xl max-w-md w-full overflow-hidden animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="bg-slate-50 border-b border-slate-100 px-6 py-4 flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
            <TableIcon size={18} className="text-blue-600" /> Tabelle speichern
          </h3>
          <button 
            type="button"
            onClick={() => setShowSaveModal(false)}
            className="text-slate-400 hover:text-slate-600 font-bold text-sm"
          >
            ✕
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Tabellenname</label>
            <input 
              type="text" 
              value={saveTableName}
              onChange={e => setSaveTableName(e.target.value.replace(/[^a-zA-Z0-9_]/g, ''))}
              placeholder="ApiData"
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-800 focus:ring-2 focus:ring-blue-500 outline-none placeholder:text-slate-300 bg-white"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Primärschlüssel (PK)</label>
            <select 
              value={primaryKeyCol || '__auto_id__'}
              onChange={e => {
                const val = e.target.value;
                setPrimaryKeyCol(val === '__auto_id__' ? null : val);
              }}
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-800 bg-white focus:ring-2 focus:ring-blue-500 outline-none"
            >
              <option value="__auto_id__">✨ Automatisch generierte ID (id)</option>
              {columns.map(col => (
                <option key={col} value={col}>Eigener PK: {col} ({schemaOverrides[col] || (Array.isArray(data[0]?.[col]) ? 'TEXT' : inferFieldType(data[0]?.[col]))})</option>
              ))}
            </select>
            <span className="text-[10px] text-slate-400 mt-1 block">
              {primaryKeyCol 
                ? `Verwendet das vorhandene Feld "${primaryKeyCol}" als eindeutigen Primärschlüssel.`
                : 'Erstellt automatisch eine neue fortlaufende ID-Spalte (id) am Anfang der Tabelle.'
              }
            </span>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-slate-50 border-t border-slate-100 px-6 py-4 flex justify-end gap-2 shrink-0">
          <button 
            type="button"
            onClick={() => setShowSaveModal(false)}
            className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
          >
            Abbrechen
          </button>
          <button 
            type="button"
            onClick={() => {
              performSave(saveTableName);
              setShowSaveModal(false);
            }}
            disabled={!saveTableName}
            className="px-4 py-2 text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white rounded-lg shadow-sm transition-colors flex items-center gap-1.5 disabled:opacity-50"
          >
            <Save size={14} /> Speichern
          </button>
        </div>
      </div>
    </div>
  );
};
