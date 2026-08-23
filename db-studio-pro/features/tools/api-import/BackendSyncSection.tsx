import React, { useState, useEffect } from 'react';
import { RefreshCw, Server, Plus, Trash2, Upload, Check, X, Edit3 } from 'lucide-react';
import { useProjectStore } from '../../../stores/useProjectStore';
import { useUIStore } from '../../../stores/useUIStore';
import { Table, Field } from '../../../types/index';
import { getApiUrl } from '../../../stores/useConfigStore';

interface BackendSyncSectionProps {
  showMessage: (title: string, message: string, type: 'info' | 'warning' | 'error' | 'success') => void;
}

export const BackendSyncSection: React.FC<BackendSyncSectionProps> = ({ showMessage }) => {
  const store = useProjectStore();
  const ui = useUIStore();

  // --- Backend Sync States ---
  const [backendApis, setBackendApis] = useState<any[]>([]);
  const [selectedBackendApi, setSelectedBackendApi] = useState<any | null>(null);
  const [backendApiCacheData, setBackendApiCacheData] = useState<any[]>([]);
  const [isEditingCache, setIsEditingCache] = useState(false);
  const [cacheEditFields, setCacheEditFields] = useState<Field[]>([]);
  const [loadingBackendApis, setLoadingBackendApis] = useState(false);

  // Registration of local table to backend
  const [regLocalTableId, setRegLocalTableId] = useState<string>('');
  const [regApiName, setRegApiName] = useState('');
  const [registeringLocalTable, setRegisteringLocalTable] = useState(false);

  useEffect(() => {
    loadBackendApis();
  }, []);

  const loadBackendApis = async () => {
    setLoadingBackendApis(true);
    try {
      const response = await fetch(getApiUrl('/api/backend-apis'));
      if (response.ok) {
        const list = await response.json();
        setBackendApis(list);
      }
    } catch (e) {
      console.error("Error loading backend apis:", e);
    } finally {
      setLoadingBackendApis(false);
    }
  };

  const handleSelectBackendApi = async (api: any) => {
    setSelectedBackendApi(api);
    setIsEditingCache(false);
    try {
      const response = await fetch(getApiUrl(`/api/backend-apis/${encodeURIComponent(api.name)}/data`));
      if (response.ok) {
        const rows = await response.json();
        setBackendApiCacheData(rows);
        setCacheEditFields(api.fields || []);
      }
    } catch (e) {
      console.error(e);
      ui.addToast("Fehler beim Laden der Backend-Daten.", 'error');
    }
  };

  const handleRefreshBackendApi = async (apiName: string) => {
    ui.addToast("Server-Synchronisierung läuft...", 'info');
    try {
      const response = await fetch(getApiUrl(`/api/backend-apis/${encodeURIComponent(apiName)}/refresh`), {
        method: 'POST'
      });
      if (response.ok) {
        const res = await response.json();
        ui.addToast(`Erfolgreich synchronisiert! ${res.count} Zeilen vom Server geladen.`, 'success');
        loadBackendApis();
        if (selectedBackendApi?.name === apiName) {
          handleSelectBackendApi(selectedBackendApi);
        }
      } else {
        throw new Error("Fehler beim API Sync");
      }
    } catch (e: any) {
      ui.addToast(`Sync-Fehler: ${e.message}`, 'error');
    }
  };

  const handleImportToLocalTable = (api: any) => {
    const fields: Field[] = api.fields || [];
    const newTable: Table = {
      id: crypto.randomUUID(),
      name: api.name,
      fields: fields,
      data: backendApiCacheData,
      isApiImport: true,
      apiConfig: {
        url: getApiUrl(`/api/backend-apis/${api.name}/data`),
        method: 'GET',
        headers: '{}',
        queryParams: [],
        refreshOnLoad: true
      }
    };
    store.addTable(newTable);
    ui.addToast(`Schnittstelle "${api.name}" erfolgreich als lokale Tabelle kopiert!`, 'success');
  };

  const handleDeleteBackendApiConfig = async (apiName: string) => {
    if (!confirm(`Möchten Sie die Backend-Schnittstelle "${apiName}" wirklich löschen?`)) return;
    try {
      const response = await fetch(getApiUrl(`/api/backend-apis/${encodeURIComponent(apiName)}`), {
        method: 'DELETE'
      });
      if (response.ok) {
        ui.addToast(`Schnittstelle "${apiName}" erfolgreich gelöscht.`, 'success');
        setSelectedBackendApi(null);
        loadBackendApis();
      }
    } catch (e) {
      ui.addToast("Löschen fehlgeschlagen.", 'error');
    }
  };

  const handleUpdateServerCache = async () => {
    if (!selectedBackendApi) return;
    try {
      const response = await fetch(getApiUrl(`/api/backend-apis/${encodeURIComponent(selectedBackendApi.name)}/data`), {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(backendApiCacheData)
      });
      if (response.ok) {
        ui.addToast("Serverseitiger Daten-Cache erfolgreich aktualisiert!", 'success');
        setIsEditingCache(false);
      } else {
        throw new Error();
      }
    } catch (e) {
      ui.addToast("Aktualisierung des Server-Caches fehlgeschlagen.", 'error');
    }
  };

  const handleRegisterLocalTableToBackend = async () => {
    const tableToReg = store.tables.find(t => t.id === regLocalTableId);
    if (!tableToReg || !regApiName.trim()) {
      return showMessage("Fehler", "Bitte wählen Sie eine Tabelle und geben Sie einen Schnittstellennamen ein.", "warning");
    }
    setRegisteringLocalTable(true);
    try {
      const response = await fetch(getApiUrl('/api/backend-apis'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: regApiName.trim(),
          url: `http://localhost:3000/api/mock-source/${regApiName}`,
          method: 'GET',
          headers: '{}',
          queryParams: [],
          option: 'B',
          refreshInterval: 0,
          fields: tableToReg.fields,
          data: tableToReg.data
        })
      });

      if (response.ok) {
        ui.addToast(`Lokale Tabelle "${tableToReg.name}" wurde erfolgreich als serverseitige API "${regApiName}" registriert!`, 'success');
        setRegApiName('');
        loadBackendApis();
      } else {
        throw new Error();
      }
    } catch (e) {
      ui.addToast("Registrierung fehlgeschlagen.", 'error');
    } finally {
      setRegisteringLocalTable(false);
    }
  };

  return (
    <div className="flex-1 flex overflow-hidden">
      
      {/* List of Registered Backend APIs on Left */}
      <div className="w-80 bg-white border-r border-slate-200 flex flex-col shrink-0">
        <div className="p-4 border-b border-slate-200 flex justify-between items-center shrink-0">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Registrierte Backend-APIs</span>
          <button 
            onClick={loadBackendApis}
            className="p-1 rounded hover:bg-slate-100 text-slate-500 hover:text-indigo-600 transition-colors"
            title="Schnittstellenliste neu laden"
          >
            <RefreshCw size={14} className={loadingBackendApis ? "animate-spin" : ""}/>
          </button>
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto p-2 flex flex-col gap-1">
          {backendApis.length > 0 ? (
            backendApis.map((api) => (
              <button
                key={api.id || api.name}
                onClick={() => handleSelectBackendApi(api)}
                className={`w-full text-left p-3 rounded-lg flex flex-col gap-1.5 transition-all border ${
                  selectedBackendApi?.name === api.name 
                    ? 'bg-indigo-50/50 border-indigo-200 text-indigo-900 font-semibold shadow-sm' 
                    : 'border-transparent text-slate-700 hover:bg-slate-50 hover:border-slate-100'
                }`}
              >
                <div className="flex justify-between items-center">
                  <span className="text-sm truncate w-40">{api.name}</span>
                  <span className={`text-[9px] px-1.5 py-0.5 rounded font-mono font-bold ${
                    api.option === 'B' ? 'bg-emerald-100 text-emerald-800' : 'bg-blue-100 text-blue-800'
                  }`}>
                    {api.option === 'B' ? 'CACHE' : 'PROXY'}
                  </span>
                </div>
                <div className="text-[10px] text-slate-400 truncate max-w-full font-mono">{api.url}</div>
              </button>
            ))
          ) : (
            <div className="text-center p-6 text-slate-400 text-xs">Keine registrierten Backend-Schnittstellen.</div>
          )}
        </div>

        {/* Register Local Table Form */}
        <div className="p-4 border-t border-slate-200 bg-slate-50 flex flex-col gap-3 shrink-0">
          <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Tabelle ins Backend pushen</div>
          <select 
            className="bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-700 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            value={regLocalTableId}
            onChange={(e) => setRegLocalTableId(e.target.value)}
          >
            <option value="">-- Tabelle wählen --</option>
            {store.tables.map(t => (
              <option key={t.id} value={t.id}>{t.name}</option>
            ))}
          </select>

          <input 
            type="text"
            placeholder="Backend API-Name"
            className="bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-700 focus:outline-none focus:ring-1 focus:ring-indigo-500 font-mono"
            value={regApiName}
            onChange={(e) => setRegApiName(e.target.value)}
          />

          <button
            onClick={handleRegisterLocalTableToBackend}
            disabled={registeringLocalTable}
            className="bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-300 text-white font-semibold py-1.5 px-3 rounded-lg text-xs flex items-center justify-center gap-2 transition-colors shadow-sm w-full"
          >
            {registeringLocalTable ? 'Registrierung...' : <><Plus size={14}/> Im Backend registrieren</>}
          </button>
        </div>

      </div>

      {/* Display / Edit Backend cache on Right */}
      <div className="flex-1 bg-slate-50 p-6 overflow-y-auto flex flex-col gap-6">
        {selectedBackendApi ? (
          <div className="flex flex-col gap-6 max-w-5xl w-full mx-auto">
            
            {/* API Header Info */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 flex justify-between items-start">
              <div className="flex flex-col gap-1.5">
                <div className="flex items-center gap-2">
                  <span className="text-lg font-bold text-slate-800">{selectedBackendApi.name}</span>
                  <span className={`text-[10px] font-bold font-mono px-2 py-0.5 rounded ${
                    selectedBackendApi.option === 'B' ? 'bg-emerald-100 text-emerald-800' : 'bg-blue-100 text-blue-800'
                  }`}>
                    Option {selectedBackendApi.option === 'A' ? 'A (Live-Proxy)' : 'B (Serverseitiger Cache)'}
                  </span>
                </div>
                <div className="text-xs text-slate-400 font-mono">{selectedBackendApi.url}</div>
                {selectedBackendApi.lastSync && (
                  <div className="text-[10px] text-slate-400 mt-1">Letzter Sync: {new Date(selectedBackendApi.lastSync).toLocaleString()}</div>
                )}
              </div>

              <div className="flex items-center gap-2 shrink-0">
                
                {selectedBackendApi.option === 'B' && (
                  <button
                    onClick={() => handleRefreshBackendApi(selectedBackendApi.name)}
                    className="bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 font-semibold py-1.5 px-3 rounded-lg text-xs flex items-center gap-1.5 shadow-sm transition-colors"
                    title="Führt serverseitigen Fetch aus der Originalquelle aus und aktualisiert den JSON-Cache"
                  >
                    <RefreshCw size={14}/> Server-Sync triggern
                  </button>
                )}

                <button
                  onClick={() => handleImportToLocalTable(selectedBackendApi)}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-1.5 px-3 rounded-lg text-xs flex items-center gap-1.5 shadow-sm transition-colors"
                  title="Importiert diese Daten als neue Tabelle in den lokalen IndexedDB Workspace"
                >
                  <Upload size={14}/> In lokale DB kopieren
                </button>

                <button
                  onClick={() => handleDeleteBackendApiConfig(selectedBackendApi.name)}
                  className="bg-red-50 hover:bg-red-100 text-red-600 border border-red-100 font-semibold p-1.5 rounded-lg text-xs transition-colors"
                  title="API Konfiguration vom Server löschen"
                >
                  <Trash2 size={16}/>
                </button>

              </div>
            </div>

            {/* Cache Table Display / Editor */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden flex flex-col min-h-[300px]">
              <div className="p-4 border-b border-slate-200 flex justify-between items-center bg-slate-50 shrink-0">
                <div className="flex flex-col">
                  <span className="text-xs font-bold text-slate-700">Cache-Datenbank vorschauen</span>
                  <span className="text-[10px] text-slate-400">Gibt den serverseitigen JSON-Cache aus ({backendApiCacheData.length} Datensätze)</span>
                </div>

                {selectedBackendApi.option === 'B' && (
                  <div className="flex items-center gap-2">
                    {isEditingCache ? (
                      <>
                        <button
                          onClick={handleUpdateServerCache}
                          className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-1 px-3 rounded text-xs flex items-center gap-1 transition-colors"
                        >
                          <Check size={14}/> Cache speichern
                        </button>
                        <button
                          onClick={() => { setIsEditingCache(false); handleSelectBackendApi(selectedBackendApi); }}
                          className="bg-slate-200 hover:bg-slate-300 text-slate-700 font-semibold py-1 px-3 rounded text-xs flex items-center gap-1 transition-colors"
                        >
                          <X size={14}/> Abbrechen
                        </button>
                      </>
                    ) : (
                      <button
                        onClick={() => setIsEditingCache(true)}
                        className="bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 font-semibold py-1 px-3 rounded text-xs flex items-center gap-1 transition-colors"
                      >
                        <Edit3 size={14}/> Cache editieren
                      </button>
                    )}
                  </div>
                )}
              </div>

              <div className="flex-1 overflow-auto max-h-[350px]">
                {backendApiCacheData.length > 0 ? (
                  <table className="w-full text-left text-xs border-collapse font-mono">
                    <thead>
                      <tr className="bg-slate-100 text-slate-500 sticky top-0 border-b border-slate-200">
                        {cacheEditFields.map(f => (
                          <th key={f.id} className="p-2.5 font-semibold border-r border-slate-200">{f.name}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {backendApiCacheData.map((row, rIdx) => (
                        <tr key={rIdx} className="border-b border-slate-100 hover:bg-slate-50">
                          {cacheEditFields.map(f => (
                            <td key={f.id} className="p-2 border-r border-slate-200">
                              {isEditingCache ? (
                                <input 
                                  type="text"
                                  className="bg-amber-50 focus:bg-white border border-transparent focus:border-amber-300 rounded px-1 py-0.5 w-full focus:outline-none"
                                  value={row[f.name] ?? ''}
                                  onChange={(e) => {
                                    const next = [...backendApiCacheData];
                                    next[rIdx] = { ...next[rIdx], [f.name]: e.target.value };
                                    setBackendApiCacheData(next);
                                  }}
                                />
                              ) : (
                                <span className="px-1">{String(row[f.name] ?? '')}</span>
                              )}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  <div className="text-center p-12 text-slate-400 text-xs">Der Cache-Speicher für diese API ist leer. Triggern Sie einen Sync.</div>
                )}
              </div>

            </div>

          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-[350px] text-slate-400 gap-3 max-w-xl mx-auto text-center mt-8">
            <Server size={64} className="opacity-10 text-slate-800" />
            <div>
              <h4 className="font-bold text-slate-700 text-sm">Keine Schnittstelle ausgewählt</h4>
              <p className="text-xs text-slate-400 mt-1">Wählen Sie links eine registrierte Backend-API aus, um serverseitige Cache-Tabellen zu betrachten, zu editieren, live zu syncen oder in Ihr IndexedDB-Projekt zu klonen.</p>
            </div>
          </div>
        )}
      </div>

    </div>
  );
};
