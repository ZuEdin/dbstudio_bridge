
import React from 'react';
import { useConfigStore } from '../../stores/useConfigStore';
import { useAuthStore } from '../../stores/useAuthStore';
import { Settings, Shield, Server, Database, Globe, RefreshCcw, Save } from 'lucide-react';

export const ToolSettings: React.FC = () => {
  const { config, updateConfig, resetConfig } = useConfigStore();
  const { isAdmin } = useAuthStore();

  if (!isAdmin()) {
    return (
      <div className="p-8 text-center">
        <Shield size={48} className="mx-auto text-slate-300 mb-4" />
        <h3 className="text-lg font-bold text-slate-800 dark:text-white">Zugriff verweigert</h3>
        <p className="text-sm text-slate-500">Nur Administratoren können diese Einstellungen sehen.</p>
      </div>
    );
  }

  return (
    <div className="p-6 bg-slate-50 dark:bg-slate-900/50 h-full overflow-y-auto custom-scrollbar">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h2 className="text-xl font-extrabold text-slate-800 dark:text-white flex items-center gap-2">
            <Settings size={20} className="text-blue-500" />
            System-Einstellungen
          </h2>
          <p className="text-xs text-slate-500 mt-1">Konfigurieren Sie API-Modi und Datenspeicherung</p>
        </div>
        <button 
          onClick={resetConfig}
          className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 rounded-lg transition-colors"
          title="Einstellungen zurücksetzen"
        >
          <RefreshCcw size={18} />
        </button>
      </div>

      <div className="grid grid-cols-1 gap-6">
        {/* Mode Settings */}
        <div className="bg-white dark:bg-slate-800 p-5 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <Globe size={18} className="text-indigo-500" />
            <h3 className="font-bold text-sm text-slate-700 dark:text-slate-200">API Betriebsmodus</h3>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => updateConfig({ mode: 'DEMO' })}
              className={`p-3 rounded-lg border-2 text-left transition-all ${
                config.mode === 'DEMO' 
                  ? 'border-blue-500 bg-blue-50 dark:bg-blue-950/30' 
                  : 'border-slate-100 dark:border-slate-700 hover:border-slate-200 dark:hover:border-slate-600'
              }`}
            >
              <div className="font-bold text-sm mb-1 text-slate-800 dark:text-white">DEMO</div>
              <div className="text-[10px] text-slate-500">Lokale Mock-Daten & Simulationen</div>
            </button>
            <button
              onClick={() => updateConfig({ mode: 'REGISTERED' })}
              className={`p-3 rounded-lg border-2 text-left transition-all ${
                config.mode === 'REGISTERED' 
                  ? 'border-blue-500 bg-blue-50 dark:bg-blue-950/30' 
                  : 'border-slate-100 dark:border-slate-700 hover:border-slate-200 dark:hover:border-slate-600'
              }`}
            >
              <div className="font-bold text-sm mb-1 text-slate-800 dark:text-white">PRODUKTIV</div>
              <div className="text-[10px] text-slate-500">Echtzeit API & Registrierte Dienste</div>
            </button>
          </div>
        </div>

        {/* Storage Settings */}
        <div className="bg-white dark:bg-slate-800 p-5 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <Database size={18} className="text-emerald-500" />
            <h3 className="font-bold text-sm text-slate-700 dark:text-slate-200">Daten-Speicherort</h3>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => updateConfig({ storage: 'local' })}
              className={`p-3 rounded-lg border-2 text-left transition-all ${
                config.storage === 'local' 
                  ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/30' 
                  : 'border-slate-100 dark:border-slate-700 hover:border-slate-200 dark:hover:border-slate-600'
              }`}
            >
              <div className="font-bold text-sm mb-1 text-slate-800 dark:text-white flex items-center gap-1.5">
                 Local (Browser)
              </div>
              <div className="text-[10px] text-slate-500">IndexedDB & LocalStorage</div>
            </button>
            <button
              onClick={() => updateConfig({ storage: 'server' })}
              className={`p-3 rounded-lg border-2 text-left transition-all ${
                config.storage === 'server' 
                  ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/30' 
                  : 'border-slate-100 dark:border-slate-700 hover:border-slate-200 dark:hover:border-slate-600'
              }`}
            >
              <div className="font-bold text-sm mb-1 text-slate-800 dark:text-white flex items-center gap-1.5">
                 <Server size={12} /> Server / App
              </div>
              <div className="text-[10px] text-slate-500">REST API & SQL Cloud-Speicher</div>
            </button>
          </div>
        </div>

        {/* API URL */}
        <div className="bg-white dark:bg-slate-800 p-5 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <Save size={18} className="text-blue-500" />
            <h3 className="font-bold text-sm text-slate-700 dark:text-slate-200">API Endpoint</h3>
          </div>
          <input 
            type="text"
            className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="https://api.your-system.com/v1"
            value={config.apiUrl}
            onChange={e => updateConfig({ apiUrl: e.target.value })}
          />
          <p className="text-[10px] text-slate-400 mt-2 italic">* Änderungen werden nach dem Neuladen der Anwendung aktiv.</p>
        </div>
      </div>
    </div>
  );
};
