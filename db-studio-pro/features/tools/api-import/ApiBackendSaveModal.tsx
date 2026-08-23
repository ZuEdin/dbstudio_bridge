import React from 'react';
import { Server, Save, RefreshCw } from 'lucide-react';
import { inferFieldType } from '../../../utils/apiImportHelper';

interface ApiBackendSaveModalProps {
  showBackendApiModal: boolean;
  setShowBackendApiModal: (show: boolean) => void;
  backendApiName: string;
  setBackendApiName: (name: string) => void;
  primaryKeyCol: string | null;
  setPrimaryKeyCol: (col: string | null) => void;
  columns: string[];
  schemaOverrides: Record<string, any>;
  data: any[];
  backendApiOption: 'A' | 'B';
  setBackendApiOption: (option: 'A' | 'B') => void;
  backendRefreshInterval: number;
  setBackendRefreshInterval: (interval: number) => void;
  performBackendSave: () => void;
  isRegistering: boolean;
}

export const ApiBackendSaveModal: React.FC<ApiBackendSaveModalProps> = ({
  showBackendApiModal,
  setShowBackendApiModal,
  backendApiName,
  setBackendApiName,
  primaryKeyCol,
  setPrimaryKeyCol,
  columns,
  schemaOverrides,
  data,
  backendApiOption,
  setBackendApiOption,
  backendRefreshInterval,
  setBackendRefreshInterval,
  performBackendSave,
  isRegistering,
}) => {
  if (!showBackendApiModal) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white border border-slate-200 rounded-xl shadow-2xl max-w-lg w-full overflow-hidden animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="bg-slate-50 border-b border-slate-100 px-6 py-4 flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
            <Server size={18} className="text-indigo-600" /> Backend-API registrieren
          </h3>
          <button 
            type="button"
            onClick={() => setShowBackendApiModal(false)}
            className="text-slate-400 hover:text-slate-600 font-bold text-sm"
          >
            ✕
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Tabellen- / API-Name</label>
            <input 
              type="text" 
              value={backendApiName}
              onChange={e => setBackendApiName(e.target.value.replace(/[^a-zA-Z0-9_]/g, ''))}
              placeholder="KundenAPI"
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-800 focus:ring-2 focus:ring-indigo-500 outline-none placeholder:text-slate-300 bg-white"
            />
            <span className="text-[10px] text-slate-400 mt-1 block">Wird im Backend als Endpunkt <code>/api/backend-apis/{backendApiName || 'name'}/data</code> freigegeben.</span>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Primärschlüssel (PK)</label>
            <select 
              value={primaryKeyCol || '__auto_id__'}
              onChange={e => {
                const val = e.target.value;
                setPrimaryKeyCol(val === '__auto_id__' ? null : val);
              }}
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-800 bg-white focus:ring-2 focus:ring-indigo-500 outline-none"
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

          {/* Options A & B Cards */}
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Backend-Ausführungsmodus</label>
            <div className="grid grid-cols-1 gap-3">
              {/* Option A */}
              <div 
                onClick={() => setBackendApiOption('A')}
                className={`border rounded-lg p-3.5 cursor-pointer transition-all ${backendApiOption === 'A' ? 'border-indigo-600 bg-indigo-50/40 shadow-sm' : 'border-slate-200 hover:border-slate-300 bg-white'}`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-bold text-indigo-950 flex items-center gap-1.5">
                    <span className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center ${backendApiOption === 'A' ? 'border-indigo-600 bg-indigo-600' : 'border-slate-300'}`}>
                      {backendApiOption === 'A' && <span className="w-1.5 h-1.5 rounded-full bg-white" />}
                    </span>
                    Option A: Echtzeit Backend-Proxy
                  </span>
                  <span className="text-[9px] bg-sky-100 text-sky-800 font-extrabold px-1.5 py-0.5 rounded uppercase">Live</span>
                </div>
                <p className="text-[11px] text-slate-600 leading-normal pl-5">
                  Der Server ruft die Daten live bei jedem Client-Request von der externen API ab. Verbirgt API-Keys/Auth-Header sicher vor dem Browser des Nutzers und umgeht CORS.
                </p>
              </div>

              {/* Option B */}
              <div 
                onClick={() => setBackendApiOption('B')}
                className={`border rounded-lg p-3.5 cursor-pointer transition-all ${backendApiOption === 'B' ? 'border-indigo-600 bg-indigo-50/40 shadow-sm' : 'border-slate-200 hover:border-slate-300 bg-white'}`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-bold text-indigo-950 flex items-center gap-1.5">
                    <span className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center ${backendApiOption === 'B' ? 'border-indigo-600 bg-indigo-600' : 'border-slate-300'}`}>
                      {backendApiOption === 'B' && <span className="w-1.5 h-1.5 rounded-full bg-white" />}
                    </span>
                    Option B: Server-Datenbank & Cache
                  </span>
                  <span className="text-[9px] bg-emerald-100 text-emerald-800 font-extrabold px-1.5 py-0.5 rounded uppercase">Fast & Offline</span>
                </div>
                <p className="text-[11px] text-slate-600 leading-normal pl-5">
                  Der Server lädt die Daten einmalig herunter und speichert sie als lokale JSON-Tabelle. Erlaubt direktes Editieren/Manipulieren der Zeilen auf dem Server sowie vollen Offline-Betrieb.
                </p>
              </div>
            </div>
          </div>

          {/* Sync Interval */}
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Automatisches Synchronisierungs-Intervall</label>
            <select 
              value={backendRefreshInterval}
              onChange={e => setBackendRefreshInterval(Number(e.target.value))}
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-800 bg-white focus:ring-2 focus:ring-indigo-500 outline-none"
            >
              <option value={0}>Nur Manuell (über Aktualisieren-Button)</option>
              <option value={10}>Alle 10 Minuten im Hintergrund synchronisieren</option>
              <option value={30}>Alle 30 Minuten im Hintergrund synchronisieren</option>
              <option value={60}>Stündlich im Hintergrund synchronisieren</option>
              <option value={1440}>Täglich im Hintergrund synchronisieren</option>
            </select>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-slate-50 border-t border-slate-100 px-6 py-4 flex justify-end gap-2 shrink-0">
          <button 
            type="button"
            onClick={() => setShowBackendApiModal(false)}
            disabled={isRegistering}
            className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
          >
            Abbrechen
          </button>
          <button 
            type="button"
            onClick={performBackendSave}
            disabled={isRegistering || !backendApiName}
            className="px-4 py-2 text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg shadow-sm transition-colors flex items-center gap-1.5 disabled:opacity-50"
          >
            {isRegistering ? (
              <>
                <RefreshCw className="animate-spin text-white" size={14} /> Registriere...
              </>
            ) : (
              <>
                <Save size={14} /> API im Backend speichern
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
