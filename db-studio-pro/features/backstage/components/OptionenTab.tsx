import React, { useState, useEffect } from 'react';
import { useConfigStore } from '../../../stores/useConfigStore';
import { useBridgeStore } from '../../../stores/useBridgeStore';
import { useUIStore } from '../../../stores/useUIStore';
import { 
  Sliders, 
  HardDrive, 
  Save, 
  Keyboard, 
  FileText, 
  CheckCircle2, 
  Server,
  Laptop,
  Radio,
  Download,
  RotateCw,
  Layers,
  Key,
  ExternalLink,
  ShieldCheck,
  AlertTriangle
} from 'lucide-react';
import { downloadBridgePackageZip, downloadRelayPhpScript } from '../../../utils/bridgePackageGenerator';

export const OptionenTab: React.FC = () => {
  const { config, updateConfig } = useConfigStore();
  const { 
    config: bridgeConfig, 
    updateConfig: updateBridgeConfig, 
    isOnline: isBridgeOnline, 
    isChecking: isBridgeChecking,
    bridgeInfo,
    checkHealth 
  } = useBridgeStore();
  const ui = useUIStore();

  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);

  useEffect(() => {
    checkHealth();
  }, []);

  const getRuntimeVersionString = (detail: any, fallback = 'n/a'): string => {
    if (!detail) return fallback;
    if (typeof detail === 'string') return detail;
    if (typeof detail === 'object') {
      if (detail.version) return detail.version;
      if (typeof detail.installed === 'boolean') return detail.installed ? 'Installiert' : 'Nicht installiert';
    }
    return fallback;
  };

  const handleTestBridge = async () => {
    setTestResult(null);
    const ok = await checkHealth();
    if (ok) {
      setTestResult({
        success: true,
        message: `Verbindung erfolgreich hergestellt zu ${bridgeConfig.host}:${bridgeConfig.port}!`
      });
      ui.addToast("Lokale Bridge ist ONLINE & einsatzbereit.", 'success');
    } else {
      setTestResult({
        success: false,
        message: `Keine Antwort von ${bridgeConfig.host}:${bridgeConfig.port}. Bitte starten Sie die Bridge lokal auf Ihrem Rechner.`
      });
      ui.addToast("Bridge nicht erreichbar. Bitte lokalen Bridge-Agent starten.", 'error');
    }
  };

  const handleSaveOptions = () => {
    ui.addToast("Optionen erfolgreich gespeichert.", 'success');
  };

  const generateNewToken = () => {
    const randomHex = Array.from(crypto.getRandomValues(new Uint8Array(16)))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');
    updateBridgeConfig({ token: `bridge_${randomHex}` });
    ui.addToast("Neuer Sicherheitsschlüssel für Bridge generiert.", 'info');
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-[#2b2b2b] text-neutral-100 overflow-y-auto px-10 py-6 select-none">
      <div className="mb-6">
        <h1 className="text-2xl font-light tracking-tight text-white mb-1">
          DB Studio Optionen & Systemeinstellungen
        </h1>
        <p className="text-xs text-neutral-400">
          Konfigurieren Sie Standard-Datenbanktreiber, Auto-Save, die Lokale Execution Bridge und API-Architektur
        </p>
      </div>

      <div className="space-y-6 max-w-3xl">

        {/* Local Execution Bridge Settings */}
        <div className="p-5 rounded-xl bg-[#333333] border border-[#444444] space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Laptop size={18} className="text-indigo-400" />
              <h2 className="text-xs font-semibold text-neutral-300 uppercase tracking-wider">
                Lokale DB Studio Bridge (Ausführung & Tests auf PC)
              </h2>
            </div>
            {isBridgeOnline ? (
              <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-950/80 text-emerald-300 border border-emerald-500/40">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                Bridge Online {bridgeConfig.useCustomPort === false ? '(Relay / Web)' : `(Port ${bridgeConfig.port})`}
              </span>
            ) : (
              <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-neutral-800 text-neutral-400 border border-neutral-700">
                <span className="w-2 h-2 rounded-full bg-neutral-500"></span>
                Bridge Offline
              </span>
            )}
          </div>

          <p className="text-xs text-neutral-400">
            Ermöglicht das automatische Übertragen, Kompilieren und Starten generierter Anwendungen (React, .NET, Node.js) direkt auf Ihrem Computer.
          </p>

          <div className="grid grid-cols-3 gap-3 text-xs">
            <div className="col-span-2">
              <label className="block text-[11px] font-semibold text-neutral-300 mb-1">
                Bridge Host-Adresse / Relay-URL / Tunnel
              </label>
              <input
                type="text"
                value={bridgeConfig.host}
                onChange={(e) => {
                  const newHost = e.target.value;
                  const isRelay = newHost.trim().toLowerCase().includes('.php') || (newHost.startsWith('https://') && !newHost.includes(':'));
                  updateBridgeConfig({ 
                    host: newHost,
                    // If user switches to a relay URL and hasn't explicitly overridden port setting, auto-disable port
                    useCustomPort: isRelay ? false : (bridgeConfig.useCustomPort ?? true)
                  });
                }}
                placeholder="http://127.0.0.1 oder https://dbstudiopro.edv-knowhow.at/api/bridge_relay.php"
                className="w-full bg-[#242424] border border-[#444444] rounded-lg px-3 py-1.5 text-white font-mono focus:outline-none focus:border-indigo-500"
              />
              <span className="text-[10px] text-neutral-400 mt-0.5 block">
                Tipp: PHP-Relay Gateway (<code className="text-emerald-400">https://.../bridge_relay.php</code>), Lokaler Server (<code className="text-neutral-300">http://127.0.0.1</code>) oder Tunnel
              </span>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-[11px] font-semibold text-neutral-300">
                  Bridge Port
                </label>
                <button
                  type="button"
                  onClick={() => {
                    const nextState = bridgeConfig.useCustomPort === false ? true : false;
                    updateBridgeConfig({ useCustomPort: nextState });
                  }}
                  className={`text-[10px] px-1.5 py-0.5 rounded font-medium transition-colors ${
                    bridgeConfig.useCustomPort === false
                      ? 'bg-neutral-800 text-neutral-400 hover:text-neutral-200 border border-neutral-700'
                      : 'bg-indigo-900/60 text-indigo-300 border border-indigo-500/40 hover:bg-indigo-800'
                  }`}
                  title={bridgeConfig.useCustomPort === false ? "Port aktivieren" : "Port deaktivieren (z. B. für Relay / Webspace)"}
                >
                  {bridgeConfig.useCustomPort === false ? 'Deaktiviert' : 'Aktiv'}
                </button>
              </div>
              <input
                type="text"
                disabled={bridgeConfig.useCustomPort === false}
                value={bridgeConfig.useCustomPort === false ? '— (Inaktiv)' : bridgeConfig.port}
                onChange={(e) => {
                  if (bridgeConfig.useCustomPort !== false) {
                    updateBridgeConfig({ port: parseInt(e.target.value) || 5050 });
                  }
                }}
                placeholder={bridgeConfig.useCustomPort === false ? '—' : '5050'}
                className={`w-full border rounded-lg px-3 py-1.5 font-mono focus:outline-none transition-all ${
                  bridgeConfig.useCustomPort === false
                    ? 'bg-[#181818] border-[#333333] text-neutral-500 cursor-not-allowed opacity-60 text-center font-sans italic text-xs'
                    : 'bg-[#242424] border-[#444444] text-white focus:border-indigo-500'
                }`}
              />
              <span className="text-[10px] mt-0.5 block">
                {bridgeConfig.useCustomPort === false ? (
                  <span className="text-amber-400/90 font-medium">Deaktiviert (HTTPS-Standard)</span>
                ) : (
                  <span className="text-neutral-500">Standard: 5050</span>
                )}
              </span>
            </div>
          </div>

          {/* Security Token */}
          <div className="text-xs">
            <div className="flex items-center justify-between mb-1">
              <label className="text-[11px] font-semibold text-neutral-300 flex items-center gap-1">
                <Key size={12} className="text-amber-400" />
                Sicherheits-Token (X-Bridge-Token)
              </label>
              <button
                type="button"
                onClick={generateNewToken}
                className="text-[10px] text-indigo-400 hover:text-indigo-300 underline cursor-pointer"
              >
                Neu generieren
              </button>
            </div>
            <input
              type="text"
              value={bridgeConfig.token}
              onChange={(e) => updateBridgeConfig({ token: e.target.value })}
              className="w-full bg-[#242424] border border-[#444444] rounded-lg px-3 py-1.5 text-white font-mono text-xs focus:outline-none focus:border-indigo-500"
            />
          </div>

          {/* Shared Dependencies Setting - Crucial requirement! */}
          <div className="p-3.5 rounded-lg bg-[#272727] border border-[#444444]/80 space-y-2">
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={bridgeConfig.useSharedDependencies}
                onChange={(e) => updateBridgeConfig({ useSharedDependencies: e.target.checked })}
                className="mt-0.5 accent-indigo-500 w-4 h-4 rounded"
              />
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-white flex items-center gap-1.5">
                    <Layers size={13} className="text-emerald-400" />
                    Zentrales Dependency-Management (Shared Store / Shared Dependencies)
                  </span>
                  <span className="text-[9px] bg-emerald-900/60 text-emerald-300 font-bold px-1.5 py-0.2 rounded border border-emerald-500/30">
                    EMPFOHLEN (VERMEIDET DATENMÜLL)
                  </span>
                </div>
                <p className="text-[11px] text-neutral-400 mt-1 leading-relaxed">
                  Verknüpft <code className="text-emerald-300 bg-[#1f1f1f] px-1 py-0.5 rounded">node_modules</code> und NuGet-Pakete mit einem zentralen Verzeichnis (<code className="text-neutral-300">Shared_Dependencies/</code>) über Symlinks/Junctions. Dadurch wird kein Speicherplatz durch wiederholte Downloads verschwendet.
                </p>
              </div>
            </label>
          </div>

          {/* Test & Download actions */}
          <div className="pt-2 flex items-center justify-between flex-wrap gap-2 border-t border-[#444444]">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleTestBridge}
                disabled={isBridgeChecking}
                className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-lg transition-colors flex items-center gap-1.5 disabled:opacity-50 shadow-xs"
              >
                <RotateCw size={13} className={isBridgeChecking ? 'animate-spin' : ''} />
                Verbindung prüfen (Ping)
              </button>

              <button
                type="button"
                onClick={() => downloadRelayPhpScript(bridgeConfig)}
                className="px-3 py-1.5 bg-emerald-900/60 hover:bg-emerald-800 text-emerald-300 text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5 border border-emerald-500/40"
                title="Generiert die PHP-Zwischenstelle für Ihren eigenen Webserver"
              >
                <Download size={13} />
                bridge_relay.php
              </button>

              <button
                type="button"
                onClick={() => downloadBridgePackageZip(bridgeConfig)}
                className="px-3.5 py-1.5 bg-[#3e3e3e] hover:bg-[#4a4a4a] text-neutral-200 text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5 border border-[#555555]"
              >
                <Download size={13} />
                Bridge-Starterpaket (.zip)
              </button>
            </div>

            <div className="text-[11px] text-neutral-400">
              Auto-Connect: <span className="text-emerald-400 font-semibold">Aktiv</span>
            </div>
          </div>

            {/* Test result feedback banner */}
            {testResult && (
              <div className={`p-3 rounded-lg text-xs flex items-start gap-2 ${testResult.success ? 'bg-emerald-950/50 border border-emerald-500/40 text-emerald-300' : 'bg-rose-950/50 border border-rose-500/40 text-rose-300'}`}>
                {testResult.success ? <CheckCircle2 size={16} className="shrink-0 mt-0.5 text-emerald-400" /> : <AlertTriangle size={16} className="shrink-0 mt-0.5 text-rose-400" />}
                <div className="w-full">
                  <p className="font-semibold">{testResult.message}</p>
                  {testResult.success && bridgeInfo && (
                    <div className="mt-2 text-[11px] text-neutral-200 bg-black/40 p-2.5 rounded-lg border border-white/5 space-y-1.5">
                      <div className="flex items-center justify-between text-[10px] text-neutral-400 pb-1 border-b border-neutral-800">
                        <span>OS: <strong className="text-neutral-200">{bridgeInfo.osPlatform || 'Windows'}</strong></span>
                        <span>Version: <strong className="text-neutral-200">{bridgeInfo.version || '1.0.0'}</strong></span>
                        <span>Port: <strong className="text-emerald-400">{bridgeConfig.useCustomPort === false ? 'Standard (HTTPS)' : (bridgeInfo.bridgePort || bridgeConfig.port)}</strong></span>
                      </div>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-0.5">
                        <div className="bg-neutral-900/80 px-2 py-1 rounded">
                          <div className="text-[10px] text-neutral-500">.NET SDK</div>
                          <div className="font-mono font-bold text-emerald-400">
                            {getRuntimeVersionString(bridgeInfo.runtimes?.dotnetSdk || bridgeInfo.runtimes?.dotnet)}
                          </div>
                        </div>
                        <div className="bg-neutral-900/80 px-2 py-1 rounded">
                          <div className="text-[10px] text-neutral-500">Node.js</div>
                          <div className="font-mono font-bold text-emerald-400">
                            {getRuntimeVersionString(bridgeInfo.runtimes?.nodejs || bridgeInfo.runtimes?.node)}
                          </div>
                        </div>
                        <div className="bg-neutral-900/80 px-2 py-1 rounded">
                          <div className="text-[10px] text-neutral-500">npm</div>
                          <div className="font-mono font-bold text-emerald-400">
                            {getRuntimeVersionString(bridgeInfo.runtimes?.npm)}
                          </div>
                        </div>
                        <div className="bg-neutral-900/80 px-2 py-1 rounded">
                          <div className="text-[10px] text-neutral-500">Docker</div>
                          <div className="font-mono font-bold text-neutral-400">
                            {typeof bridgeInfo.runtimes?.docker === 'object' 
                              ? (bridgeInfo.runtimes?.docker?.installed ? 'Aktiv' : 'Nicht aktiv') 
                              : getRuntimeVersionString(bridgeInfo.runtimes?.docker, 'Nein')}
                          </div>
                        </div>
                      </div>
                      {bridgeInfo.config?.sharedDependenciesDir && (
                        <div className="text-[10px] text-neutral-400 pt-1 flex items-center gap-1 truncate">
                          <Layers size={11} className="text-emerald-400 shrink-0" />
                          <span className="shrink-0">Shared Store:</span>
                          <span className="font-mono text-emerald-300/90 truncate">{bridgeInfo.config.sharedDependenciesDir}</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}
        </div>

        {/* Storage Engine Priority Setting */}
        <div className="p-5 rounded-xl bg-[#333333] border border-[#444444]">
          <div className="flex items-center gap-2 mb-3">
            <HardDrive size={16} className="text-indigo-400" />
            <h2 className="text-xs font-semibold text-neutral-300 uppercase tracking-wider">
              Standard-Datenbank-Engine (Priorität)
            </h2>
          </div>
          <p className="text-xs text-neutral-400 mb-4">
            Legt fest, welches Datenbanksystem standardmäßig für neue Projekte und Speichervorgänge priorisiert wird.
          </p>

          <div className="space-y-2">
            <label className="flex items-start gap-3 p-3 rounded-lg bg-indigo-950/30 border border-indigo-500/50 cursor-pointer">
              <input
                type="radio"
                name="storage_engine"
                checked={config.storage === 'local'}
                onChange={() => updateConfig({ storage: 'local' })}
                className="mt-1 accent-indigo-500"
              />
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-white">IndexedDB (Browser-Datenbank)</span>
                  <span className="text-[9px] bg-indigo-600 text-white font-bold px-1.5 py-0.5 rounded">
                    PRIORITÄT / STANDARD
                  </span>
                </div>
                <p className="text-[11px] text-neutral-300 mt-0.5">
                  100% autarke lokale Speicherung im Browser. Schnelle Ladezeiten, Offline-fähig und kein Serverzwang.
                </p>
              </div>
            </label>

            <label className="flex items-start gap-3 p-3 rounded-lg bg-[#383838] border border-[#444444] hover:bg-[#3d3d3d] cursor-pointer">
              <input
                type="radio"
                name="storage_engine"
                checked={config.storage === 'server'}
                onChange={() => updateConfig({ storage: 'server' })}
                className="mt-1 accent-indigo-500"
              />
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-white">Zentraler Backend-Server (MySQL / PostgreSQL / MSSQL)</span>
                </div>
                <p className="text-[11px] text-neutral-400 mt-0.5">
                  Synchronisiert Änderungen mit einer externen API und zentraler Serverdatenbank.
                </p>
              </div>
            </label>
          </div>
        </div>

        {/* Auto-Save */}
        <div className="p-5 rounded-xl bg-[#333333] border border-[#444444]">
          <div className="flex items-center gap-2 mb-3">
            <Save size={16} className="text-emerald-400" />
            <h2 className="text-xs font-semibold text-neutral-300 uppercase tracking-wider">
              Automatisches Speichern (Auto-Save)
            </h2>
          </div>
          <div className="flex items-center justify-between text-xs">
            <div>
              <span className="font-medium text-white">Änderungen fortlaufend in IndexedDB sichern</span>
              <p className="text-[11px] text-neutral-400 mt-0.5">
                Alle 15 Sekunden bei erkannten Schema- oder Datensatz-Änderungen
              </p>
            </div>
            <span className="px-2 py-1 rounded bg-emerald-950/60 text-emerald-400 border border-emerald-500/30 text-xs font-semibold">
              Aktiviert
            </span>
          </div>
        </div>

        {/* Keyboard Shortcuts Overview */}
        <div className="p-5 rounded-xl bg-[#333333] border border-[#444444]">
          <div className="flex items-center gap-2 mb-3">
            <Keyboard size={16} className="text-blue-400" />
            <h2 className="text-xs font-semibold text-neutral-300 uppercase tracking-wider">
              Tastaturkürzel (DB Studio Shortcuts)
            </h2>
          </div>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="flex justify-between p-2.5 rounded bg-[#2d2d2d]">
              <span className="text-neutral-400">Speichern:</span>
              <span className="font-mono font-bold text-neutral-200">Strg + S</span>
            </div>
            <div className="flex justify-between p-2.5 rounded bg-[#2d2d2d]">
              <span className="text-neutral-400">Befehlspalette:</span>
              <span className="font-mono font-bold text-neutral-200">Strg + K</span>
            </div>
            <div className="flex justify-between p-2.5 rounded bg-[#2d2d2d]">
              <span className="text-neutral-400">Neue Tabelle:</span>
              <span className="font-mono font-bold text-neutral-200">Alt + N</span>
            </div>
            <div className="flex justify-between p-2.5 rounded bg-[#2d2d2d]">
              <span className="text-neutral-400">Suchen / Filter:</span>
              <span className="font-mono font-bold text-neutral-200">Strg + F</span>
            </div>
            <div className="flex justify-between p-2.5 rounded bg-[#2d2d2d]">
              <span className="text-neutral-400">Backstage verlassen:</span>
              <span className="font-mono font-bold text-neutral-200">Esc</span>
            </div>
          </div>
        </div>

        <div className="flex justify-end pt-2">
          <button
            onClick={handleSaveOptions}
            className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 text-white text-xs font-bold rounded-md shadow-xs transition-colors"
          >
            Einstellungen übernehmen
          </button>
        </div>
      </div>
    </div>
  );
};

