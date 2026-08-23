import React from 'react';
import { Table, Query } from '../../../../types/index';
import { 
  Radio, Globe, RefreshCw, UploadCloud, AlertCircle, PlayCircle,
  Wifi, WifiOff, Terminal, ShieldAlert, CheckCircle2
} from 'lucide-react';

interface LiveSyncTabProps {
  serverHealth: { connected: boolean; latency?: number } | null;
  serverUrl: string;
  setServerUrl: (url: string) => void;
  isTestingServer: boolean;
  handleTestServerConnection: () => void;
  autoSyncEnabled: boolean;
  setAutoSyncEnabled: (val: boolean) => void;
  isUploading: boolean;
  handleSyncMetadata: () => void;
  isDownloading: boolean;
  handlePullMetadata: () => void;
  syncPrompt: string;
  setSyncPrompt: (p: string) => void;
  tables: Table[];
  selectedTables: Record<string, boolean>;
  onToggleTable: (id: string) => void;
  queries: Query[];
  selectedQueries: Record<string, boolean>;
  onToggleQuery: (id: string) => void;
  syncStatus: 'idle' | 'success' | 'error';
  syncStatusMsg: string;
  
  // New Auto-Sync parameters
  externalSqlConnected?: boolean;
  externalSqlLogs?: any[];
  isSyncingSql?: boolean;
  onToggleConnection?: (val: boolean) => void;
}

export const LiveSyncTab: React.FC<LiveSyncTabProps> = ({
  serverHealth,
  serverUrl,
  setServerUrl,
  isTestingServer,
  handleTestServerConnection,
  autoSyncEnabled,
  setAutoSyncEnabled,
  isUploading,
  handleSyncMetadata,
  isDownloading,
  handlePullMetadata,
  syncPrompt,
  setSyncPrompt,
  tables,
  selectedTables,
  onToggleTable,
  queries,
  selectedQueries,
  onToggleQuery,
  syncStatus,
  syncStatusMsg,
  
  externalSqlConnected = true,
  externalSqlLogs = [],
  isSyncingSql = false,
  onToggleConnection
}) => {
  return (
    <div id="live_sync_tab_container" className="space-y-6 max-w-7xl mx-auto animate-in fade-in duration-200">
      
      {/* Real-time External SQL Server Status Widget & Offline Simulation */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Connection status box */}
        <div className="bg-slate-800/80 rounded-2xl p-5 border border-slate-700/80 shadow-xl space-y-4 lg:col-span-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`p-2.5 rounded-xl ${externalSqlConnected ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'}`}>
                {externalSqlConnected ? <Wifi size={18} /> : <WifiOff size={18} />}
              </div>
              <div>
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Verbindung zum Externen SQL Server</h3>
                <p className="text-sm font-bold text-white mt-0.5">
                  {externalSqlConnected ? '🟢 AKTIV & VERBUNDEN' : '🔴 OFFLINE / VERBINDUNGSFEHLER'}
                </p>
              </div>
            </div>
            
            {/* Toggle simulating connection drop */}
            <button
              id="btn_toggle_simulated_connection"
              onClick={() => onToggleConnection && onToggleConnection(!externalSqlConnected)}
              className={`text-[10px] font-bold px-3 py-1.5 rounded-lg border transition-all cursor-pointer ${
                externalSqlConnected 
                  ? 'bg-rose-500/10 text-rose-300 border-rose-500/20 hover:bg-rose-500/20' 
                  : 'bg-emerald-500/10 text-emerald-300 border-emerald-500/20 hover:bg-emerald-500/20'
              }`}
            >
              {externalSqlConnected ? '🔌 Offline simulieren' : '⚡ Online schalten'}
            </button>
          </div>

          <p className="text-xs text-slate-300 leading-relaxed">
            {externalSqlConnected 
              ? 'Der Hintergrund-Sync gleicht Ihre lokal gezeichneten Tabellen und Spalten parallel mit dem externen SQL Server ab. Ihre IndexedDB dient kontinuierlich als absolut sicheres lokales Backup.'
              : 'Keine Verbindung zum SQL-Server möglich. DB Studio wechselt automatisch in den ausfallsicheren Offline-Modus: Ihre Arbeit wird sicher in der lokalen IndexedDB gespeichert. Sobald der Server wieder online ist, wird der Datenbestand nachsynchronisiert.'}
          </p>

          <div className="bg-slate-900/60 rounded-xl p-3 border border-slate-800 flex items-center justify-between text-xs">
            <span className="text-slate-400 flex items-center gap-1.5">
              <RefreshCw size={12} className={isSyncingSql ? 'animate-spin text-indigo-400' : 'text-slate-500'} />
              <span>Hintergrund-Synchronisation:</span>
            </span>
            <span className={`font-bold ${autoSyncEnabled ? 'text-indigo-400' : 'text-slate-500'}`}>
              {autoSyncEnabled ? (isSyncingSql ? 'Gleicht ab...' : 'Aktiv (Intervall: 7s)') : 'Inaktiv (Auto-Sync deaktiviert)'}
            </span>
          </div>
        </div>

        {/* Local Copy status box */}
        <div className="bg-slate-800/40 rounded-2xl p-5 border border-slate-700/50 flex flex-col justify-between">
          <div className="space-y-2">
            <span className="text-[10px] bg-slate-700 text-slate-300 px-2.5 py-1 rounded-full font-bold uppercase tracking-wider">Sicherungskopie</span>
            <h4 className="text-sm font-bold text-white">IndexedDB Local Storage</h4>
            <p className="text-xs text-slate-400 leading-relaxed">
              Jeder Klick und jede Tabelle wird sofort verschlüsselt in Ihrer lokalen IndexedDB gespeichert. Bei Server-Ausfall verlieren Sie niemals Ihre Daten oder Ihr Schema!
            </p>
          </div>
          <div className="border-t border-slate-700/40 pt-3 mt-4 flex items-center justify-between text-[11px]">
            <span className="text-slate-400">Backup Status:</span>
            <span className="font-bold text-emerald-400 flex items-center gap-1">
              <CheckCircle2 size={12} />
              <span>100% Sicher (Lokal persistiert)</span>
            </span>
          </div>
        </div>
      </div>

      {/* Live Connection Control Box */}
      <div className="bg-slate-800/60 rounded-2xl p-6 border border-slate-700/80 shadow-xl space-y-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-700/60 pb-5">
          <div>
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <Radio className="text-indigo-400" size={20} />
              <span>Punkt 1: Live Realtime Sync & Server Bridge</span>
              <span className="text-[10px] bg-indigo-500/20 text-indigo-300 px-2 py-0.5 rounded-full font-mono border border-indigo-500/30">Local IndexedDB ⇄ Self-Host Backend</span>
            </h2>
            <p className="text-xs text-slate-400 mt-1">Verbinden Sie DB Studio Pro direkt mit Ihrem lokalen oder gehosteten Backend-Server für automatischen Datenabgleich.</p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <label className="flex items-center gap-2 text-xs font-semibold text-slate-300 bg-slate-900 px-3 py-1.5 rounded-xl border border-slate-700 cursor-pointer hover:bg-slate-850">
              <input
                type="checkbox"
                checked={autoSyncEnabled}
                onChange={(e) => setAutoSyncEnabled(e.target.checked)}
                className="rounded border-slate-700 text-indigo-600 focus:ring-indigo-500 bg-slate-800"
              />
              <span>⚡ Auto-Sync Aktiv</span>
            </label>
          </div>
        </div>

        {/* Connection URL Bar */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-center">
          <div className="md:col-span-7 flex items-center bg-slate-950 rounded-xl border border-slate-700/80 px-3 py-2 text-xs">
            <Globe size={16} className="text-slate-400 shrink-0 mr-2" />
            <span className="text-slate-500 font-mono mr-1">URL:</span>
            <input
              type="text"
              id="input_server_bridge_url"
              value={serverUrl}
              onChange={(e) => setServerUrl(e.target.value)}
              placeholder="http://localhost:3000"
              className="flex-1 bg-transparent border-none text-slate-200 font-mono focus:outline-none placeholder-slate-600"
            />
          </div>

          <button
            id="btn_test_bridge_connection"
            onClick={handleTestServerConnection}
            disabled={isTestingServer}
            className="md:col-span-2 py-2 px-3 rounded-xl bg-slate-700/80 hover:bg-slate-700 text-slate-200 font-semibold text-xs border border-slate-600 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
          >
            <RefreshCw size={12} className={isTestingServer ? 'animate-spin' : ''} />
            <span>Verbindung testen</span>
          </button>

          <div className="md:col-span-3">
            {serverHealth ? (
              <div className={`p-2 rounded-xl text-[11px] font-medium border flex items-center gap-2 ${serverHealth.connected ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-red-500/10 text-red-400 border-red-500/20'}`}>
                <span className={`w-1.5 h-1.5 rounded-full ${serverHealth.connected ? 'bg-emerald-400 animate-pulse' : 'bg-red-400'}`}></span>
                <span className="truncate">{serverHealth.connected ? `Verbunden (${serverHealth.latency}ms)` : 'Verbindung fehlgeschlagen'}</span>
              </div>
            ) : (
              <div className="p-2 bg-slate-950/60 text-slate-500 text-[11px] border border-slate-800 rounded-xl flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-slate-600"></span>
                <span>Ungeprüft</span>
              </div>
            )}
          </div>
        </div>

        {/* Action Controls for Metadata Sync */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
          {/* Push to Server */}
          <div className="bg-slate-900/60 rounded-xl p-5 border border-slate-800 space-y-4">
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Option A: Lokales IndexedDB Schema im Server persistieren</span>
            <p className="text-xs text-slate-400 leading-relaxed">Lädt all Ihre lokal entworfenen Tabellen, SQL-Abfragen und Datenzeilen scharf in das gehostete Self-Host-Backend hoch.</p>
            
            <div className="space-y-2">
              <input
                type="text"
                value={syncPrompt}
                onChange={(e) => setSyncPrompt(e.target.value)}
                placeholder="Synchronisations-Kommentar (z.B. Abrechnung V2 hinzugefügt)"
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
              />
            </div>

            <button
              id="btn_push_local_to_cloud"
              onClick={handleSyncMetadata}
              disabled={isUploading || !serverHealth?.connected}
              className="w-full py-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-800 disabled:text-slate-500 disabled:border-transparent text-white font-bold text-xs shadow-md shadow-indigo-600/20 transition-all flex items-center justify-center gap-2 cursor-pointer border border-indigo-400/20"
            >
              <UploadCloud size={14} className={isUploading ? 'animate-bounce' : ''} />
              <span>{isUploading ? 'Daten werden übertragen...' : 'Lokal ➔ Server hochladen'}</span>
            </button>
          </div>

          {/* Pull from Server */}
          <div className="bg-slate-900/60 rounded-xl p-5 border border-slate-800 space-y-4">
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Option B: Server-Metadaten lokal importieren</span>
            <p className="text-xs text-slate-400 leading-relaxed">Lädt das auf dem Server liegende Schema herunter und überschreibt Ihre lokale IndexedDB. Perfekt bei Arbeiten im Team.</p>
            
            <div className="text-xs bg-amber-500/10 border border-amber-500/20 rounded-lg p-2.5 text-amber-300 flex gap-2 items-start">
              <AlertCircle size={14} className="shrink-0 mt-0.5" />
              <span><strong>Achtung:</strong> Überschreibt Ihren lokalen Entwurf unwiderruflich mit dem aktuellen Stand des Teams.</span>
            </div>

            <button
              id="btn_pull_cloud_to_local"
              onClick={handlePullMetadata}
              disabled={isDownloading || !serverHealth?.connected}
              className="w-full py-2.5 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:text-slate-600 text-slate-300 font-bold text-xs shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer border border-slate-700"
            >
              <RefreshCw size={14} className={isDownloading ? 'animate-spin' : ''} />
              <span>{isDownloading ? 'Hole Server-Stand...' : 'Server ➔ Lokal herunterladen'}</span>
            </button>
          </div>
        </div>

        {/* Sync Feedbacks */}
        {syncStatus !== 'idle' && (
          <div className={`p-4 rounded-xl border flex items-start gap-3 text-xs ${syncStatus === 'success' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-300' : 'bg-red-500/10 border-red-500/20 text-red-300'}`}>
            <AlertCircle size={16} className="shrink-0 mt-0.5" />
            <div className="space-y-0.5">
              <span className="font-bold">{syncStatus === 'success' ? 'Synchronisierung erfolgreich' : 'Fehler bei der Übertragung'}</span>
              <p className="text-[11px] opacity-90">{syncStatusMsg}</p>
            </div>
          </div>
        )}
      </div>

      {/* Live Sync SQL Operations History Terminal */}
      <div className="bg-slate-800/60 rounded-2xl p-6 border border-slate-700/80 shadow-xl space-y-4">
        <div className="flex items-center justify-between border-b border-slate-700/60 pb-3">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <Terminal size={16} className="text-slate-400" />
            <span>Live Synchronisations-Protokoll (SQL Background Server)</span>
          </h3>
          <span className="text-[10px] text-slate-400 font-mono">Echtzeit-Updates</span>
        </div>

        <div className="bg-slate-950 rounded-xl p-4 border border-slate-850 font-mono text-[11px] max-h-56 overflow-y-auto space-y-2">
          {externalSqlLogs.length > 0 ? (
            externalSqlLogs.map((log: any, idx: number) => (
              <div key={idx} className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-1 p-2 bg-slate-900/40 rounded border border-slate-850">
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  <span className="text-slate-500 shrink-0">[{new Date(log.timestamp).toLocaleTimeString()}]</span>
                  <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded uppercase shrink-0 ${
                    log.status === 'SUCCESS' ? 'bg-emerald-500/15 text-emerald-400' : 
                    log.status === 'OFFLINE_FALLBACK' ? 'bg-amber-500/15 text-amber-400' : 'bg-indigo-500/15 text-indigo-400'
                  }`}>
                    {log.action}
                  </span>
                  <span className="text-slate-300 truncate">{log.details}</span>
                </div>
                <span className={`text-[10px] font-bold uppercase shrink-0 ${
                  log.status === 'SUCCESS' ? 'text-emerald-400' : 
                  log.status === 'OFFLINE_FALLBACK' ? 'text-amber-400' : 'text-indigo-400'
                }`}>
                  {log.status}
                </span>
              </div>
            ))
          ) : (
            <div className="text-slate-600 text-center py-4">Keine Sync-Protokolle vorhanden. Aktivieren Sie Auto-Sync oder testen Sie die Verbindung.</div>
          )}
        </div>
      </div>

      {/* Synchronization Scope Selection Details */}
      <div className="bg-slate-800/40 rounded-2xl p-6 border border-slate-700/60 shadow-md space-y-4">
        <div>
          <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider">Auswahl des Synchronisations-Scopes</h3>
          <p className="text-xs text-slate-400 mt-1">Wählen Sie aus, welche Schemata und Datenzeilen aktiv abgeglichen werden sollen.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          {/* Tables selection */}
          <div className="bg-slate-950/60 rounded-xl p-4 border border-slate-850 space-y-2">
            <span className="text-[11px] font-bold text-slate-400">Tabellen ({tables.length})</span>
            <div className="max-h-44 overflow-y-auto space-y-1.5 pr-2">
              {tables.map(t => (
                <label key={t.id} className="flex items-center justify-between p-1.5 hover:bg-slate-900 rounded cursor-pointer">
                  <span className="font-semibold text-slate-300 font-mono">{t.name}</span>
                  <input
                    type="checkbox"
                    checked={!!selectedTables[t.id]}
                    onChange={() => onToggleTable(t.id)}
                    className="rounded border-slate-800 text-indigo-600 focus:ring-indigo-500 bg-slate-900"
                  />
                </label>
              ))}
            </div>
          </div>

          {/* Queries selection */}
          <div className="bg-slate-950/60 rounded-xl p-4 border border-slate-850 space-y-2">
            <span className="text-[11px] font-bold text-slate-400">Gespeicherte Abfragen ({queries.length})</span>
            <div className="max-h-44 overflow-y-auto space-y-1.5 pr-2">
              {queries.map(q => (
                <label key={q.id} className="flex items-center justify-between p-1.5 hover:bg-slate-900 rounded cursor-pointer">
                  <span className="text-slate-300 font-mono truncate max-w-[80%]">{q.name}</span>
                  <input
                    type="checkbox"
                    checked={!!selectedQueries[q.id]}
                    onChange={() => onToggleQuery(q.id)}
                    className="rounded border-slate-800 text-indigo-600 focus:ring-indigo-500 bg-slate-900"
                  />
                </label>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

