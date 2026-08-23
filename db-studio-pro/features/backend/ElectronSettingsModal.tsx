
import React, { useState } from 'react';
import { ElectronSettings } from '../../types/index';
import { X, Save, Server, AppWindow, Globe } from 'lucide-react';

interface ElectronSettingsModalProps {
  settings: ElectronSettings;
  onSave: (settings: ElectronSettings) => void;
  onClose: () => void;
}

export const ElectronSettingsModal: React.FC<ElectronSettingsModalProps> = ({ settings, onSave, onClose }) => {
  const [includeBackend, setIncludeBackend] = useState(settings.includeBackend ?? true);
  const [bundleFrontend, setBundleFrontend] = useState(settings.bundleFrontend ?? true);
  const [targetUrl, setTargetUrl] = useState(settings.targetUrl ?? 'http://localhost:3000');

  const handleSave = () => {
    onSave({
      includeBackend,
      bundleFrontend,
      targetUrl
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-[100] flex items-center justify-center animate-in fade-in-25">
      <div className="bg-white rounded-lg shadow-2xl w-full max-w-lg border border-slate-300">
        <div className="flex justify-between items-center p-4 bg-slate-800 text-white border-b border-slate-700">
          <h2 className="text-lg font-bold flex items-center gap-2">
             <AppWindow size={20} className="text-teal-400" /> Electron Konfiguration
          </h2>
          <button onClick={onClose} className="text-slate-400 hover:text-white"><X size={20} /></button>
        </div>
        
        <div className="p-6 space-y-6">
          <p className="text-sm text-slate-500">Definieren Sie die Architektur Ihrer Desktop-Anwendung.</p>

          {/* Scenario 1: Backend Integration */}
          <div className="bg-slate-50 p-4 rounded border border-slate-200">
             <div className="flex items-start gap-3">
                <div className="mt-1 bg-white p-1.5 rounded border border-slate-200">
                    <Server size={20} className={includeBackend ? 'text-green-600' : 'text-slate-300'} />
                </div>
                <div className="flex-1">
                    <label className="flex items-center gap-2 font-bold text-slate-700 cursor-pointer">
                        <input 
                            type="checkbox" 
                            checked={includeBackend} 
                            onChange={e => setIncludeBackend(e.target.checked)}
                            className="rounded text-teal-600 focus:ring-teal-500 w-4 h-4"
                        />
                        Integriertes Backend (Node.js)
                    </label>
                    <p className="text-xs text-slate-500 mt-1">
                        Soll die App einen eigenen lokalen Server (Express.js + DB) beinhalten? 
                        <br/>
                        <span className="italic text-slate-400">Ja: Die App startet beim Öffnen im Hintergrund einen Server.</span>
                        <br/>
                        <span className="italic text-slate-400">Nein: Die App greift nur auf externe APIs zu.</span>
                    </p>
                </div>
             </div>
          </div>

          {/* Scenario 2: Frontend Integration */}
          <div className="bg-slate-50 p-4 rounded border border-slate-200">
             <div className="flex items-start gap-3">
                <div className="mt-1 bg-white p-1.5 rounded border border-slate-200">
                    <AppWindow size={20} className={bundleFrontend ? 'text-blue-600' : 'text-slate-300'} />
                </div>
                <div className="flex-1">
                    <label className="flex items-center gap-2 font-bold text-slate-700 cursor-pointer">
                        <input 
                            type="checkbox" 
                            checked={bundleFrontend} 
                            onChange={e => setBundleFrontend(e.target.checked)}
                            className="rounded text-teal-600 focus:ring-teal-500 w-4 h-4"
                        />
                        Frontend bündeln (Offline-fähig)
                    </label>
                    <p className="text-xs text-slate-500 mt-1">
                        Soll der React/Angular Code kompiliert und in die App integriert werden?
                        <br/>
                        <span className="italic text-slate-400">Ja: App lädt lokale HTML-Dateien (schnell, offline).</span>
                        <br/>
                        <span className="italic text-slate-400">Nein: App fungiert als Browser für eine URL.</span>
                    </p>
                </div>
             </div>

             {!bundleFrontend && (
                 <div className="mt-4 pl-12 animate-in fade-in slide-in-from-top-1">
                     <label className="block text-xs font-bold text-slate-600 mb-1 flex items-center gap-1">
                         <Globe size={12}/> Ziel-URL (z.B. Webserver)
                     </label>
                     <input 
                        type="text" 
                        value={targetUrl}
                        onChange={e => setTargetUrl(e.target.value)}
                        className="w-full border border-slate-300 rounded p-2 text-sm"
                        placeholder="https://mein-crm.de"
                     />
                 </div>
             )}
          </div>
        </div>

        <div className="flex justify-end gap-3 p-4 bg-slate-50 border-t border-slate-200">
          <button onClick={onClose} className="bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 px-4 py-2 rounded text-sm font-medium">
            Abbrechen
          </button>
          <button onClick={handleSave} className="bg-teal-600 hover:bg-teal-700 text-white px-4 py-2 rounded text-sm font-medium flex items-center gap-2">
              <Save size={16} /> Speichern
          </button>
        </div>
      </div>
    </div>
  );
};
