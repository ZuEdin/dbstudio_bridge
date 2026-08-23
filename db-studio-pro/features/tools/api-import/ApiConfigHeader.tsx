import React from 'react';
import { 
  Globe, ChevronDown, ChevronUp, Server, RefreshCw, Save, 
  Table as TableIcon, FileSpreadsheet, FileJson, FileText, Play 
} from 'lucide-react';
import { BackendConfig } from '../../../types/index';

interface ApiConfigHeaderProps {
  backendConfig?: BackendConfig;
  showBaseUrlSettings: boolean;
  setShowBaseUrlSettings: (show: boolean) => void;
  updateBaseUrl: (newUrl: string) => void;
  isConfigCollapsed: boolean;
  setIsConfigCollapsed: (collapsed: boolean) => void;
  data: any[];
  refreshOnLoad: boolean;
  setRefreshOnLoad: (refresh: boolean) => void;
  showSaveDropdown: boolean;
  setShowSaveDropdown: (show: boolean) => void;
  handleSaveClick: () => void;
  setShowBackendApiModal: (show: boolean) => void;
  exportToExcel: () => void;
  exportToJson: () => void;
  exportToPdf: () => void;
  url: string;
  setUrl: (url: string) => void;
  method: string;
  setMethod: (method: string) => void;
  handleFetch: () => void;
  isLoading: boolean;
  onSaveTable?: any;
  constructPreviewUrl: () => string;
}

export const ApiConfigHeader: React.FC<ApiConfigHeaderProps> = ({
  backendConfig,
  showBaseUrlSettings,
  setShowBaseUrlSettings,
  updateBaseUrl,
  isConfigCollapsed,
  setIsConfigCollapsed,
  data,
  refreshOnLoad,
  setRefreshOnLoad,
  showSaveDropdown,
  setShowSaveDropdown,
  handleSaveClick,
  setShowBackendApiModal,
  exportToExcel,
  exportToJson,
  exportToPdf,
  url,
  setUrl,
  method,
  setMethod,
  handleFetch,
  isLoading,
  onSaveTable,
  constructPreviewUrl,
}) => {
  return (
    <div className="bg-white p-4 border-b border-slate-200 shadow-sm shrink-0 max-h-[50vh] overflow-y-auto">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-bold text-slate-700 flex items-center gap-2">
          <Globe className="text-blue-600" /> API Abfrage & Import
        </h2>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setIsConfigCollapsed(!isConfigCollapsed)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 rounded border border-slate-300 transition-colors mr-1"
            title={isConfigCollapsed ? "Einstellungen maximieren" : "Einstellungen minimieren"}
          >
            {isConfigCollapsed ? <ChevronDown size={14} /> : <ChevronUp size={14} />}
            <span>{isConfigCollapsed ? "Ausklappen" : "Einklappen"}</span>
          </button>
          {backendConfig && (
            <button 
              type="button"
              onClick={() => setShowBaseUrlSettings(!showBaseUrlSettings)} 
              className={`flex items-center gap-1 px-3 py-1.5 text-xs font-bold border rounded transition-colors ${
                showBaseUrlSettings || backendConfig.apiBaseUrl 
                  ? 'bg-blue-50 border-blue-200 text-blue-700' 
                  : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
              }`}
              title="Globale Server-URL definieren"
            >
              <Server size={14}/> {backendConfig.apiBaseUrl ? 'Basis-URL aktiv' : 'Basis-URL definieren'}
            </button>
          )}
          {data.length > 0 && onSaveTable && (
            <div className="flex items-center gap-2 border-l pl-2 ml-2">
              <label className="flex items-center gap-2 text-sm text-slate-600 cursor-pointer border border-slate-300 rounded px-2 py-1 bg-slate-50 hover:bg-white select-none">
                <input 
                  type="checkbox" 
                  checked={refreshOnLoad} 
                  onChange={e => setRefreshOnLoad(e.target.checked)}
                  className="rounded text-indigo-600 focus:ring-indigo-500"
                />
                <span className="flex items-center gap-1"><RefreshCw size={14} /> Live-Verbindung</span>
              </label>
              
              <div className="relative inline-block text-left">
                <div className="flex items-center shadow-sm rounded-md overflow-hidden">
                  <button 
                    type="button"
                    onClick={handleSaveClick}
                    className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white pl-4 pr-3 py-2 text-sm font-semibold transition-colors border-r border-indigo-500"
                    title="Daten direkt als eigene Tabelle in IndexedDB speichern"
                  >
                    <Save size={16} /> Speichern als eigene Tabelle
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowSaveDropdown(!showSaveDropdown)}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white px-2 py-2 text-sm font-semibold transition-colors h-[38px] flex items-center justify-center"
                    title="Weitere Speicher- & Export-Optionen"
                  >
                    <ChevronDown size={16} className={`transition-transform duration-200 ${showSaveDropdown ? 'rotate-180' : ''}`} />
                  </button>
                </div>

                {showSaveDropdown && (
                  <>
                    <div 
                      className="fixed inset-0 z-10" 
                      onClick={() => setShowSaveDropdown(false)}
                    />
                    <div className="absolute right-0 mt-1.5 w-80 bg-white border border-slate-200 rounded-lg shadow-xl z-20 overflow-hidden divide-y divide-slate-100 origin-top-right animate-in fade-in slide-in-from-top-1 duration-150">
                      <div className="p-1">
                        <button
                          type="button"
                          onClick={() => {
                            setShowSaveDropdown(false);
                            handleSaveClick();
                          }}
                          className="w-full text-left px-3 py-2 text-sm text-slate-700 hover:bg-indigo-50 rounded flex items-start gap-2.5 transition-colors group"
                        >
                          <TableIcon size={18} className="text-indigo-600 mt-0.5 shrink-0" />
                          <div>
                            <span className="font-bold block text-xs text-slate-800">In App-Datenbank speichern</span>
                            <span className="text-[10px] text-slate-500 block leading-normal mt-0.5">
                              Erstellt automatisch eine eigene Tabelle im lokalen App-Speicher (IndexedDB). Kein SQL-Code erforderlich!
                            </span>
                          </div>
                        </button>
                      </div>

                      <div className="p-1 border-t border-slate-100">
                        <button
                          type="button"
                          onClick={() => {
                            setShowSaveDropdown(false);
                            setShowBackendApiModal(true);
                          }}
                          className="w-full text-left px-3 py-2 text-sm text-slate-700 hover:bg-indigo-50 rounded flex items-start gap-2.5 transition-colors group"
                        >
                          <Server size={18} className="text-indigo-600 mt-0.5 shrink-0" />
                          <div>
                            <span className="font-bold block text-xs text-slate-800">Als Backend-API speichern</span>
                            <span className="text-[10px] text-slate-500 block leading-normal mt-0.5">
                              Registriert die API am Backend (Option A Proxy / Option B Server-Datenbank) für vollständige Kontrolle.
                            </span>
                          </div>
                        </button>
                      </div>

                      <div className="p-1.5 bg-slate-50">
                        <span className="block px-2.5 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Lokaler Datei-Export</span>
                        
                        <button
                          type="button"
                          onClick={() => {
                            setShowSaveDropdown(false);
                            exportToExcel();
                          }}
                          className="w-full text-left px-2.5 py-1.5 text-xs text-slate-700 hover:bg-white hover:text-emerald-700 rounded flex items-center gap-2 transition-colors mt-1 font-medium"
                        >
                          <FileSpreadsheet size={14} className="text-emerald-600" />
                          <span>Excel-Export (.xlsx)</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            setShowSaveDropdown(false);
                            exportToJson();
                          }}
                          className="w-full text-left px-2.5 py-1.5 text-xs text-slate-700 hover:bg-white hover:text-amber-700 rounded flex items-center gap-2 transition-colors font-medium"
                        >
                          <FileJson size={14} className="text-amber-600" />
                          <span>JSON-Export (.json)</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            setShowSaveDropdown(false);
                            exportToPdf();
                          }}
                          className="w-full text-left px-2.5 py-1.5 text-xs text-slate-700 hover:bg-white hover:text-rose-700 rounded flex items-center gap-2 transition-colors font-medium"
                        >
                          <FileText size={14} className="text-rose-600" />
                          <span>PDF-Export (.pdf)</span>
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {isConfigCollapsed && (
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2 mt-2 px-3 py-2 bg-slate-50 border border-slate-200 rounded text-xs font-medium text-slate-700 animate-in fade-in duration-150">
          <div className="flex items-center gap-1.5">
            <span className="font-bold text-slate-400">Methode:</span>
            <span className="font-bold bg-blue-100 text-blue-800 px-1.5 py-0.5 rounded text-[10px]">{method}</span>
          </div>
          <div className="flex items-center gap-1.5 min-w-0 flex-1">
            <span className="font-bold text-slate-400 shrink-0">URL:</span>
            <span className="truncate font-mono text-[11px] text-slate-600 bg-white border px-2 py-0.5 rounded" title={url}>{url || '(Keine URL angegeben)'}</span>
          </div>
          {data.length > 0 && (
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-slate-400">Geladen:</span>
              <span className="bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded text-[10px] font-bold">
                {data.length} Datensätze
              </span>
            </div>
          )}
          <button
            type="button"
            onClick={handleFetch}
            disabled={isLoading || !url}
            className="ml-auto bg-blue-600 hover:bg-blue-700 text-white font-bold px-3 py-1 rounded text-[11px] flex items-center gap-1.5 disabled:opacity-50 transition-colors"
          >
            {isLoading ? 'Laden...' : <><Play size={12} /> Abrufen</>}
          </button>
        </div>
      )}

      {!isConfigCollapsed && (
        <>
          {/* Base URL Settings Panel */}
          {showBaseUrlSettings && backendConfig && (
            <div className="mb-4 p-3 bg-blue-50 border border-blue-100 rounded animate-in slide-in-from-top-2">
              <label className="block text-xs font-bold text-blue-800 uppercase mb-1">Globale Projekt Basis-URL</label>
              <div className="flex gap-2">
                <input 
                  type="text" 
                  value={backendConfig.apiBaseUrl || ''}
                  onChange={e => updateBaseUrl(e.target.value)}
                  placeholder="https://api.mein-server.de/v1"
                  className="flex-1 border border-blue-200 rounded px-2 py-1 text-sm text-blue-900 placeholder:text-blue-300 focus:ring-2 focus:ring-blue-400 outline-none bg-white"
                />
              </div>
            </div>
          )}

          <div className="flex flex-col gap-4">
            <div className="flex gap-2">
              <select 
                value={method} 
                onChange={e => setMethod(e.target.value)}
                className="border border-slate-300 rounded px-3 py-2 bg-slate-50 font-bold text-slate-700 text-sm"
              >
                <option value="GET">GET</option>
                <option value="POST">POST</option>
              </select>
              <input 
                type="text" 
                value={url} 
                onChange={e => setUrl(e.target.value)}
                placeholder={backendConfig?.apiBaseUrl ? "/endpoint (oder volle URL)" : "https://api.example.com/data"}
                className="flex-1 border border-slate-300 rounded px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none font-mono bg-white"
              />
              <button 
                type="button"
                onClick={handleFetch} 
                disabled={isLoading || !url}
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded text-sm font-semibold flex items-center gap-2 disabled:opacity-50"
              >
                {isLoading ? 'Laden...' : <><Play size={16} /> Abrufen</>}
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
};
