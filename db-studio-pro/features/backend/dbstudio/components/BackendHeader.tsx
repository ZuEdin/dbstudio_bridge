import React from 'react';
import { Server, MessageSquare, Download, Laptop, Cloud } from 'lucide-react';

interface BackendHeaderProps {
  configMode: 'DEMO' | 'REGISTERED';
  onActivateBackend: () => void;
  selfHostLang: 'nodejs' | 'csharp' | 'php' | 'python';
  setSelfHostLang: (lang: 'nodejs' | 'csharp' | 'php' | 'python') => void;
  onOpenTeamChat: () => void;
  onOpenSelfHostConfig: () => void;
  subfolderPath: string;
  onDownloadZip: () => void;
  activeMode: 'local' | 'cloud';
  setActiveMode: (mode: 'local' | 'cloud') => void;
  showMessage: (title: string, message: string, type: 'info' | 'warning' | 'error' | 'success') => void;
}

export const BackendHeader: React.FC<BackendHeaderProps> = ({
  configMode,
  onActivateBackend,
  selfHostLang,
  setSelfHostLang,
  onOpenTeamChat,
  onOpenSelfHostConfig,
  subfolderPath,
  onDownloadZip,
  activeMode,
  setActiveMode,
  showMessage,
}) => {
  return (
    <>
      {/* DEMO Mode Notice */}
      {configMode === 'DEMO' && (
        <div className="bg-amber-600/10 border-b border-amber-500/20 px-6 py-2.5 flex items-center justify-between text-xs text-amber-300 shrink-0">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse"></span>
            <span>
              <strong>Offline-Simulationsmodus aktiv:</strong> Das Enterprise-Backend ist in den System-Einstellungen auf <strong>DEMO</strong> konfiguriert. Alle Änderungen sind lokal simuliert.
            </span>
          </div>
          <button 
            type="button"
            onClick={onActivateBackend}
            className="px-2.5 py-1 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded transition-colors shadow-sm cursor-pointer"
          >
            Backend aktivieren
          </button>
        </div>
      )}

      {/* Visual Top Bar / Dashboard Title */}
      <div className="px-6 py-4 bg-slate-800/90 border-b border-slate-700/80 shrink-0 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-lg font-bold flex items-center gap-2 text-white font-sans tracking-wide">
            <Server className="text-indigo-400 shrink-0" size={20} />
            <span>DB Studio Self-Hosting Backend</span>
            <span className="text-xs bg-indigo-500/20 text-indigo-300 font-semibold px-2 py-0.5 rounded-full border border-indigo-500/30">Eating our own dog food</span>
          </h1>
          <p className="text-xs text-slate-400 mt-0.5 font-sans leading-relaxed">Nutzen Sie DB Studio, um seine eigene relationale Metadaten-Datenbank lokal zu hosten oder im Team zu synchronisieren.</p>
        </div>

        <div className="flex items-center gap-3 shrink-0 flex-wrap">
          {/* Tech Stack Selection Dropdown */}
          <div className="flex items-center gap-2 bg-slate-950/80 px-3 py-1.5 rounded-xl border border-slate-800 shadow-inner">
            <span className="text-[11px] font-semibold text-slate-400 font-mono">Stack:</span>
            <select
              id="select_selfhost_lang"
              value={selfHostLang}
              onChange={(e) => setSelfHostLang(e.target.value as any)}
              className="bg-slate-900 hover:bg-slate-800 text-slate-200 text-xs font-semibold px-2 py-1 rounded-lg border border-slate-700 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 cursor-pointer transition-colors duration-150"
            >
              <option value="nodejs">Node.js (Express)</option>
              <option value="csharp">.NET 10 (C# Enterprise WebAPI)</option>
              <option value="php">PHP (Laravel API)</option>
              <option value="python">Python (FastAPI)</option>
            </select>
          </div>

          {/* Action Button: Team Chat Modal */}
          <button
            id="btn_open_team_chat"
            onClick={onOpenTeamChat}
            className="flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white shadow-md shadow-indigo-600/20 transition-all border border-indigo-500/30 cursor-pointer"
            title="Öffnet den Team Chat & Realtime Log (/api/chat/messages)"
          >
            <MessageSquare size={14} />
            <span>Team Chat</span>
          </button>

          {/* Action Button: Self-Host Backend Config Modal */}
          <button
            id="btn_open_selfhost_config"
            onClick={onOpenSelfHostConfig}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-600 transition-all cursor-pointer"
            title="Unterordner & wwwroot Web-Config Einstellungen anpassen"
          >
            <Server size={14} className="text-indigo-400" />
            <span>Unterordner & wwwroot</span>
            {subfolderPath && (
              <span className="text-[10px] bg-indigo-500/20 text-indigo-300 px-1.5 py-0.5 rounded font-mono">
                {subfolderPath}
              </span>
            )}
          </button>

          {/* Action Button: Self-Host Backend ZIP Download */}
          <button
            id="btn_download_dbstudio_backend_zip"
            onClick={onDownloadZip}
            className="flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white shadow-md shadow-emerald-600/20 transition-all border border-emerald-500/30 cursor-pointer"
            title={`Lädt das vollständige DB Studio Pro Self-Host Backend (${selfHostLang.toUpperCase()}) als ZIP-Paket herunter`}
          >
            <Download size={14} />
            <span>Self-Host ZIP ({selfHostLang === 'nodejs' ? 'Node.js' : selfHostLang === 'csharp' ? '.NET C#' : selfHostLang === 'php' ? 'Laravel' : 'Python'})</span>
          </button>

          {/* Local vs Team Cloud Main Toggle Switch */}
          <div className="flex bg-slate-950 p-1 rounded-xl border border-slate-700 shrink-0">
            <button 
              id="btn_mode_local"
              onClick={() => {
                setActiveMode('local');
                showMessage("Lokaler Modus", "Sie arbeiten nun offline-first auf Ihrem Rechner. Daten verbleiben auf SQLite/IndexedDB.", "info");
              }}
              className={`flex items-center gap-2 px-4 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${activeMode === 'local' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20' : 'text-slate-400 hover:text-slate-200'}`}
            >
              <Laptop size={14} />
              <span>Lokal (Offline)</span>
            </button>
            <button 
              id="btn_mode_cloud"
              onClick={() => {
                setActiveMode('cloud');
                showMessage("Team-Cloud aktiviert", "Kollaborativer Live-Modus ist aktiv. Sie arbeiten mit dem Team auf der gehosteten PostgreSQL-Datenbank.", "info");
              }}
              className={`flex items-center gap-2 px-4 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${activeMode === 'cloud' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20' : 'text-slate-400 hover:text-slate-200'}`}
            >
              <Cloud size={14} />
              <span>Team-Cloud (Kollaboration)</span>
            </button>
          </div>
        </div>
      </div>
    </>
  );
};
