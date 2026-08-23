import React from 'react';
import { Server, Download } from 'lucide-react';

interface SelfHostConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  selfHostLang: 'nodejs' | 'csharp' | 'php' | 'python';
  setSelfHostLang: (lang: 'nodejs' | 'csharp' | 'php' | 'python') => void;
  subfolderPath: string;
  setSubfolderPath: (path: string) => void;
  includeWwwroot: boolean;
  setIncludeWwwroot: (include: boolean) => void;
  onDownloadZip: () => void;
}

export const SelfHostConfigModal: React.FC<SelfHostConfigModalProps> = ({
  isOpen,
  onClose,
  selfHostLang,
  setSelfHostLang,
  subfolderPath,
  setSubfolderPath,
  includeWwwroot,
  setIncludeWwwroot,
  onDownloadZip,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-700 rounded-xl max-w-lg w-full shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between px-6 py-4 bg-slate-800/80 border-b border-slate-700">
          <div className="flex items-center gap-2.5">
            <Server className="text-indigo-400" size={18} />
            <h3 className="text-sm font-bold text-white">Self-Host Unterordner & wwwroot Konfiguration</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-white text-lg leading-none p-1 cursor-pointer"
          >
            &times;
          </button>
        </div>

        <div className="p-6 space-y-5">
          <div className="bg-slate-950/60 p-3.5 rounded-lg border border-slate-800 text-xs text-slate-300 leading-relaxed">
            <p className="font-semibold text-indigo-300 mb-1">Vermeidung von 404-Fehlern beim Server-Upload:</p>
            Wenn Sie das Backend in einem Unterordner (z.B. <code>/api</code> oder <code>/dbstudio</code>) hosten, generieren wir automatisch passende <code>BASE_PATH</code> Routen, IIS <code>web.config</code> Rewrite-Regeln und Apache <code>.htaccess</code>.
          </div>

          {/* Tech Stack Select */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Backend Tech-Stack:</label>
            <select
              value={selfHostLang}
              onChange={(e) => setSelfHostLang(e.target.value as any)}
              className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-xs text-slate-100 focus:outline-none focus:border-indigo-500 font-medium cursor-pointer"
            >
              <option value="nodejs">Node.js (Express + CORS + IIS web.config / .htaccess)</option>
              <option value="csharp">.NET 10 (C# ASP.NET Core Web API + Swagger)</option>
              <option value="php">PHP (Laravel API + Mod_Rewrite rules)</option>
              <option value="python">Python (FastAPI + Static Files Router)</option>
            </select>
          </div>

          {/* Subfolder Path Input */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Unterordner Pfad (z.B. <code>/subfolder</code> oder <code>/my-app</code>):
            </label>
            <input
              type="text"
              value={subfolderPath}
              onChange={(e) => setSubfolderPath(e.target.value)}
              placeholder="/mein-unterordner"
              className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-xs text-slate-100 font-mono focus:outline-none focus:border-indigo-500"
            />
            <p className="text-[11px] text-slate-400 mt-1">
              Leer lassen für Hauptverzeichnis (Root). Falls gesetzt, werden alle API-Endpunkte unter <code>{subfolderPath || '/'}/api/*</code> erreichbar sein.
            </p>
          </div>

          {/* wwwroot Toggle */}
          <div className="flex items-start gap-3 p-3 bg-slate-950/50 rounded-lg border border-slate-800">
            <input
              type="checkbox"
              id="chk_include_wwwroot"
              checked={includeWwwroot}
              onChange={(e) => setIncludeWwwroot(e.target.checked)}
              className="mt-0.5 rounded border-slate-700 text-indigo-600 focus:ring-indigo-500 bg-slate-900 cursor-pointer"
            />
            <label htmlFor="chk_include_wwwroot" className="text-xs text-slate-300 cursor-pointer">
              <span className="font-semibold text-white block"><code>wwwroot</code>-Ordner mit Webserver-Routing generieren</span>
              Erstellt den <code>wwwroot/</code>-Ordner mit <code>index.html</code> Statusseite, <code>web.config</code> (IIS) and <code>.htaccess</code> (Apache) für nahtloses Subfolder-Routing.
            </label>
          </div>

          {/* Live Route Preview */}
          <div className="bg-slate-950 p-3 rounded-lg border border-indigo-500/20 text-xs font-mono">
            <div className="text-[10px] uppercase font-bold text-slate-500 mb-1">Routen-Vorschau:</div>
            <div className="text-emerald-400">GET https://ihr-server.de{subfolderPath.startsWith('/') ? subfolderPath : subfolderPath ? '/' + subfolderPath : ''}/api/health</div>
            <div className="text-indigo-300 mt-1">GET https://ihr-server.de{subfolderPath.startsWith('/') ? subfolderPath : subfolderPath ? '/' + subfolderPath : ''}/api/projects</div>
          </div>

          <div className="flex justify-end gap-2.5 pt-2 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors cursor-pointer"
            >
              Schließen
            </button>
            <button
              type="button"
              onClick={onDownloadZip}
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white shadow-md shadow-emerald-600/20 transition-all cursor-pointer"
            >
              <Download size={14} />
              <span>Jetzt Self-Host ZIP herunterladen</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
