import React, { useState, useEffect } from 'react';
import { Settings, Play, Download, AppWindow, Server, UploadCloud, CircuitBoard, CloudLightning, Radio, X, Database, Eye, Check, FileCode, RefreshCw, GitCommit, Globe, ShieldCheck, ShieldAlert, History, Laptop, Terminal, Layers } from 'lucide-react';
import { BackendConfig, DbType, FrontendFramework, StylingFramework } from '../../../types/index';
import { RibbonButton } from '../RibbonButton';
import { RibbonGroup } from '../RibbonGroup';
import { useTranslation } from 'react-i18next';
import { useBridgeStore } from '../../../stores/useBridgeStore';

interface DeployTabProps {
  onAction: (action: string) => void;
  backendConfig: BackendConfig;
  setBackendConfig: (config: BackendConfig) => void;
  onOpenSettings: () => void;
}

const getDefaultPort = (framework: FrontendFramework): number => {
    switch (framework) {
        case 'angular':
        case 'angular-modern': return 4200;
        case 'vue': return 5173;
        case 'blazor': return 5002;
        case 'maui': return 5003;
        case 'maui-native': return 5004;
        default: return 3000;
    }
};

export const DeployTab: React.FC<DeployTabProps> = ({ onAction, backendConfig, setBackendConfig, onOpenSettings }) => {
  const { t } = useTranslation();
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [activeTab, setActiveTab] = useState<'backend' | 'frontend' | 'connection'>('backend');

  const { 
    config: bridgeConfig, 
    isOnline: isBridgeOnline, 
    isChecking: isBridgeChecking 
  } = useBridgeStore();

  const getDbLabel = (type: DbType) => {
    switch(type) {
      case 'SQL': return 'SQL Server';
      case 'MySQL': return 'MySQL';
      case 'SQLite': return 'SQLite';
      case 'PostgreSQL': return 'PostgreSQL';
      case 'NoSQL': return 'NoSQL (Mongo)';
      default: return type;
    }
  };

  const getFrontendLabel = (fw: FrontendFramework) => {
    switch(fw) {
      case 'react': return 'React';
      case 'vue': return 'Vue.js';
      case 'angular-modern': return 'Angular 19 (Standalone & Signals)';
      case 'angular': return 'Angular (Klassisch / NgModule)';
      case 'blazor': return 'Blazor (WASM)';
      case 'maui': return '.NET MAUI (Blazor Hybrid)';
      case 'maui-native': return '.NET MAUI (XAML / Native)';
      case 'none': return 'Keins (Nur API)';
      default: return fw;
    }
  };

  const getBackendLabel = (lang: string) => {
    switch(lang) {
      case 'dotnet': return '.NET API';
      case 'nodejs': return 'Node.js';
      case 'python': return 'Python';
      case 'php': return 'PHP';
      case 'laravel': return 'Laravel';
      case 'electron': return 'Electron';
      case 'tauri': return 'Tauri (Rust)';
      default: return lang;
    }
  };

  const getProtocolLabel = (mode?: 'http' | 'https' | 'both') => {
    if (mode === 'http') return 'Nur HTTP';
    if (mode === 'https') return 'Nur HTTPS';
    return 'HTTP & HTTPS';
  };

  return (
    <div className="flex gap-4 items-start h-full relative">
        {/* Settings Overview Group */}
        <div className="relative flex flex-col px-3 border-r border-slate-300 pr-5 h-full py-1 bg-slate-50/50 rounded-l min-w-[280px]">
           <div className="flex flex-col gap-1">
             <span className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wider">Aktive Konfiguration</span>
             <div className="grid grid-cols-2 gap-x-3 gap-y-0.5 mt-0.5 text-slate-700 text-xs">
                <div>
                  <span className="text-slate-400 font-semibold">DB:</span>{' '}
                  <span className="font-bold text-slate-800">{getDbLabel(backendConfig.dbType)}</span>
                </div>
                <div>
                  <span className="text-slate-400 font-semibold">API:</span>{' '}
                  <span className="font-bold text-blue-700">{getBackendLabel(backendConfig.language)} {backendConfig.language === 'dotnet' ? (backendConfig.backendVersion || '10.0') : ''}</span>
                </div>
                <div>
                  <span className="text-slate-400 font-semibold">Web:</span>{' '}
                  <span className="font-bold text-emerald-700">{getFrontendLabel(backendConfig.frontendFramework)} ({backendConfig.stylingFramework || 'tailwind'})</span>
                </div>
                <div>
                  <span className="text-slate-400 font-semibold">Port:</span>{' '}
                  <span className="font-mono text-slate-600">{backendConfig.port} {backendConfig.language === 'dotnet' && ` / ${backendConfig.port + 1}`}</span>
                </div>
                <div className="col-span-2 flex items-center gap-1.5 mt-0.5">
                  <span className="text-[10px] bg-sky-100 text-sky-800 px-1.5 py-0.2 rounded font-bold">
                    {getProtocolLabel(backendConfig.protocolMode)}
                  </span>
                  {backendConfig.useSwagger && (
                    <span className="text-[10px] bg-emerald-100 text-emerald-800 px-1.5 py-0.2 rounded font-bold">
                      Swagger (Aktiv)
                    </span>
                  )}
                </div>
             </div>
           </div>
           
           <div className="absolute bottom-2 right-2">
               <button 
                    onClick={() => setShowSettingsModal(true)}
                    className="bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 rounded p-1.5 shadow-sm flex items-center justify-center transition-all"
                    title="Einstellungen"
                >
                    <Settings size={14} className="text-slate-600" />
                </button>
           </div>
        </div>

        {/* Schema & Migrations Group */}
        <RibbonGroup label="Schema & DB Ops">
            <RibbonButton 
                icon={<GitCommit className="text-indigo-600" />} 
                label="Schema-Diff" 
                onClick={() => onAction('open_schema_diff')} 
                size="large"
            />
            <div className="flex flex-col gap-1">
                <button onClick={() => onAction('open_schema_diff')} className="text-[10px] text-left px-2 py-1 hover:bg-slate-200 rounded flex items-center gap-1.5 text-slate-700 font-medium">
                    <ShieldCheck size={12} className="text-emerald-600"/> Pre-Flight Check
                </button>
                <button onClick={() => onAction('open_migrations')} className="text-[10px] text-left px-2 py-1 hover:bg-slate-200 rounded flex items-center gap-1.5 text-slate-700 font-medium">
                    <Database size={12} className="text-indigo-600"/> Migrationen
                </button>
            </div>
        </RibbonGroup>

        {/* API & Mocking Group */}
        <RibbonGroup label="Live API & Mocking">
            <RibbonButton 
                icon={<Globe className="text-emerald-600" />} 
                label="OpenAPI 3.1" 
                onClick={() => onAction('open_openapi_mock')} 
                size="large"
            />
            <div className="flex flex-col gap-1">
                <button onClick={() => onAction('open_openapi_mock')} className="text-[10px] text-left px-2 py-1 hover:bg-slate-200 rounded flex items-center gap-1.5 text-slate-700 font-medium">
                    <Radio size={12} className="text-emerald-600"/> Mock Server
                </button>
                <button onClick={() => onAction('open_openapi_mock')} className="text-[10px] text-left px-2 py-1 hover:bg-slate-200 rounded flex items-center gap-1.5 text-slate-700 font-medium">
                    <FileCode size={12} className="text-orange-600"/> Postman / cURL
                </button>
            </div>
        </RibbonGroup>

        {/* Security & Governance Group */}
        <RibbonGroup label="Security & Data Gov">
            <RibbonButton 
                icon={<ShieldAlert className="text-rose-600" />} 
                label="RLS & Rollen" 
                onClick={() => onAction('open_security_rls')} 
                size="large"
            />
            <div className="flex flex-col gap-1">
                <button onClick={() => onAction('open_security_rls')} className="text-[10px] text-left px-2 py-1 hover:bg-slate-200 rounded flex items-center gap-1.5 text-slate-700 font-medium">
                    <ShieldCheck size={12} className="text-emerald-600"/> CRUD Matrix
                </button>
                <button onClick={() => onAction('open_audit_trail')} className="text-[10px] text-left px-2 py-1 hover:bg-slate-200 rounded flex items-center gap-1.5 text-slate-700 font-medium">
                    <History size={12} className="text-purple-600"/> Audit & Time-Travel
                </button>
            </div>
        </RibbonGroup>

        {/* Extensions Group */}
        <RibbonGroup label="Extensions">
            <RibbonButton 
                icon={<CircuitBoard className="text-purple-600" />} 
                label="Integrations Hub" 
                onClick={() => onAction('open_integrations')} 
                size="large"
            />
            <div className="flex flex-col gap-1">
                <button onClick={() => onAction('open_integrations')} className="text-[10px] text-left px-2 py-1 hover:bg-slate-200 rounded flex items-center gap-2 text-slate-600">
                    <CloudLightning size={12}/> AI & LLM
                </button>
                <button onClick={() => onAction('open_integrations')} className="text-[10px] text-left px-2 py-1 hover:bg-slate-200 rounded flex items-center gap-2 text-slate-600">
                    <Radio size={12}/> Chat / Realtime
                </button>
            </div>
        </RibbonGroup>

        {/* Cloud Group */}
        <RibbonGroup label="Cloud & DevOps">
            <RibbonButton icon={<Server className="text-indigo-600" />} label="Self-Host" onClick={() => onAction('dbstudio_backend')} />
            <RibbonButton icon={<RefreshCw className="text-emerald-600" />} label="Offline Sync" onClick={() => onAction('open_offline_sync')} />
            <RibbonButton icon={<Server className="text-teal-600" />} label="Umgebungen" onClick={() => onAction('open_envs')} />
            <RibbonButton icon={<UploadCloud className="text-indigo-600" />} label="Deployment" onClick={() => onAction('open_deployment_modal')} />
        </RibbonGroup>

        {/* Lokale Bridge (PC Execution Runner) Group */}
        <RibbonGroup label="Lokale Ausführung & Bridge">
            <RibbonButton 
                icon={<Laptop className={isBridgeOnline ? "text-emerald-600 animate-pulse" : "text-slate-400"} />} 
                label="Auf PC ausführen" 
                sublabel={isBridgeOnline ? `Online (Port ${bridgeConfig.port})` : `Offline (Port ${bridgeConfig.port})`}
                onClick={() => onAction('deploy_to_bridge')} 
                size="large"
                className={isBridgeOnline ? "ring-2 ring-emerald-500/30 bg-emerald-50/50" : "opacity-80"}
            />
            <div className="flex flex-col gap-1">
                <button 
                  onClick={() => onAction('open_bridge_runner')} 
                  className="text-[10px] text-left px-2 py-1 hover:bg-slate-200 rounded flex items-center gap-1.5 text-slate-700 font-medium"
                  title="Live Terminal & Logs der lokalen Bridge öffnen"
                >
                    <Terminal size={12} className="text-indigo-600"/> Live-Konsole
                </button>
                <button 
                  onClick={() => onAction('open_bridge_options')} 
                  className="text-[10px] text-left px-2 py-1 hover:bg-slate-200 rounded flex items-center gap-1.5 text-slate-700 font-medium"
                  title="Bridge Einstellungen & Shared Dependencies"
                >
                    <Layers size={12} className="text-emerald-600"/> Shared Store (Aktiv)
                </button>
            </div>
        </RibbonGroup>

        {/* Export Group */}
        <RibbonGroup label="Export" isLast>
            <RibbonButton icon={<FileCode className="text-green-600"/>} label="Codegenerierung" onClick={() => onAction('backend_generate')} />
            <RibbonButton icon={<Download className="text-slate-600"/>} label="App als ZIP" onClick={() => onAction('backend_export')} />
        </RibbonGroup>

        {/* Generator settings Modal */}
        {showSettingsModal && (
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50 animate-in fade-in duration-150">
            <div className="bg-white border border-slate-200 rounded-xl shadow-2xl w-[520px] max-w-full overflow-hidden animate-in zoom-in-95 duration-150 flex flex-col max-h-[90vh]">
              
              {/* Modal Header */}
              <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 bg-blue-100 text-blue-600 rounded">
                    <Settings size={16} />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-800 text-sm">Generator & Backend-Konfiguration</h3>
                    <p className="text-[11px] text-slate-500">Passen Sie die Ziel-Technologien und Netzwerk-Ports an</p>
                  </div>
                </div>
                <button 
                  onClick={() => setShowSettingsModal(false)}
                  className="text-slate-400 hover:text-slate-600 p-1 rounded-full hover:bg-slate-100 transition-colors"
                >
                  <X size={16} />
                </button>
              </div>

              {/* Modal Tabs */}
              <div className="flex border-b border-slate-200 bg-white">
                <button
                  className={`flex-1 py-2 text-xs font-bold ${activeTab === 'backend' ? 'border-b-2 border-blue-600 text-blue-700' : 'text-slate-500 hover:text-slate-700'}`}
                  onClick={() => setActiveTab('backend')}
                >
                  Backend
                </button>
                <button
                  className={`flex-1 py-2 text-xs font-bold ${activeTab === 'frontend' ? 'border-b-2 border-blue-600 text-blue-700' : 'text-slate-500 hover:text-slate-700'}`}
                  onClick={() => setActiveTab('frontend')}
                >
                  Frontend
                </button>
                <button
                  className={`flex-1 py-2 text-xs font-bold ${activeTab === 'connection' ? 'border-b-2 border-blue-600 text-blue-700' : 'text-slate-500 hover:text-slate-700'}`}
                  onClick={() => setActiveTab('connection')}
                >
                  Connection String
                </button>
              </div>

              {/* Modal Body */}
              <div className="p-5 overflow-y-auto space-y-4 text-xs h-[400px]">
                
                {activeTab === 'backend' && (
                  <div className="space-y-4 animate-in fade-in">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block font-bold text-slate-700 mb-1">Datenbanktyp</label>
                        <select 
                            className="w-full border border-slate-300 rounded-lg px-3 py-2 bg-white text-slate-800 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                            value={backendConfig.dbType}
                            onChange={e => setBackendConfig({ ...backendConfig, dbType: e.target.value as DbType })}
                        >
                            <option value="SQL">SQL Server</option>
                            <option value="MySQL">MySQL</option>
                            <option value="SQLite">SQLite</option>
                            <option value="PostgreSQL">PostgreSQL</option>
                            <option value="NoSQL">NoSQL (Mongo)</option>
                        </select>
                      </div>

                      <div>
                        <label className="block font-bold text-slate-700 mb-1">Backend-Technologie</label>
                        <select 
                            className="w-full border border-slate-300 rounded-lg px-3 py-2 bg-white text-slate-800 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                            value={backendConfig.language}
                            onChange={e => {
                                const lang = e.target.value as any;
                                const updatedConfig = { ...backendConfig, language: lang };
                                if (lang === 'electron') {
                                    updatedConfig.deploymentConfig = {
                                        ...(backendConfig.deploymentConfig || { target: 'electron' }),
                                        target: 'electron'
                                    };
                                } else if (lang === 'tauri') {
                                    updatedConfig.deploymentConfig = {
                                        ...(backendConfig.deploymentConfig || { target: 'tauri' }),
                                        target: 'tauri'
                                    };
                                } else if (backendConfig.language === 'electron' || backendConfig.language === 'tauri') {
                                    if (backendConfig.deploymentConfig?.target === 'electron' || backendConfig.deploymentConfig?.target === 'tauri') {
                                        updatedConfig.deploymentConfig = {
                                            ...backendConfig.deploymentConfig,
                                            target: 'docker'
                                        };
                                    }
                                }
                                setBackendConfig(updatedConfig);
                            }}
                        >
                            <option value="dotnet">.NET API</option>
                            <option value="nodejs">Node.js</option>
                            <option value="python">Python</option>
                            <option value="php">PHP</option>
                            <option value="laravel">Laravel</option>
                            <option value="electron">Electron</option>
                            <option value="tauri">Tauri (Rust)</option>
                        </select>
                      </div>
                    </div>

                    {/* Conditional .NET Version option */}
                    {backendConfig.language === 'dotnet' && (
                      <div className="p-3 bg-blue-50/50 border border-blue-100 rounded-lg">
                        <label className="block font-bold text-slate-700 mb-1">.NET SDK Version (Standard ist 10.0)</label>
                        <select 
                            className="w-full border border-slate-300 rounded-lg px-3 py-1.5 bg-white font-mono text-blue-700 focus:outline-none focus:border-blue-500"
                            value={backendConfig.backendVersion || '10.0'}
                            onChange={e => setBackendConfig({ ...backendConfig, backendVersion: e.target.value })}
                        >
                            <option value="10.0">10.0 (Standard)</option>
                            <option value="9.0">9.0</option>
                            <option value="8.0">8.0 (LTS)</option>
                            <option value="7.0">7.0</option>
                            <option value="6.0">6.0 (LTS)</option>
                        </select>
                        <p className="text-[10px] text-slate-500 mt-1">
                          Wichtig: In der Projektdatei wird standardmäßig Swagger vorkonfiguriert und beim Starten geöffnet.
                        </p>
                      </div>
                    )}

                    {/* Protocol Selector for Swagger (HTTP / HTTPS / Both) */}
                    <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg space-y-2">
                      <label className="block font-bold text-slate-700">Entwicklungs-Protokolle & Swagger</label>
                      <div className="grid grid-cols-1 gap-2">
                        <select 
                          className="w-full border border-slate-300 rounded-lg px-3 py-1.5 bg-white text-slate-800 focus:outline-none focus:border-blue-500"
                          value={backendConfig.protocolMode || 'both'}
                          onChange={e => setBackendConfig({ ...backendConfig, protocolMode: e.target.value as any })}
                        >
                          <option value="both">HTTP & HTTPS gleichzeitig zur Auswahl anbieten (Standard)</option>
                          <option value="http">Nur HTTP einsetzen (z.B. http://localhost:5000)</option>
                          <option value="https">Nur HTTPS einsetzen (z.B. https://localhost:5001)</option>
                        </select>
                      </div>

                      <div className="flex items-center gap-2 mt-1">
                        <input 
                          type="checkbox"
                          id="useSwaggerCheckbox"
                          className="rounded text-blue-600 focus:ring-blue-500 h-3.5 w-3.5"
                          checked={backendConfig.useSwagger}
                          onChange={e => setBackendConfig({ ...backendConfig, useSwagger: e.target.checked })}
                        />
                        <label htmlFor="useSwaggerCheckbox" className="font-semibold text-slate-700 cursor-pointer select-none">
                          Swagger / OpenAPI Dokumentation aktivieren und beim Starten anzeigen
                        </label>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block font-bold text-slate-700 mb-1">API Port (Localhost)</label>
                        <input 
                            type="number" 
                            className="w-full border border-slate-300 rounded-lg px-3 py-1.5 bg-white text-slate-800 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                            value={backendConfig.port}
                            onChange={e => setBackendConfig({ ...backendConfig, port: parseInt(e.target.value) || 5000 })}
                        />
                        {backendConfig.language === 'dotnet' && (
                          <span className="text-[10px] text-slate-400 mt-0.5 block">HTTPS Port: {backendConfig.port + 1}</span>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === 'frontend' && (
                  <div className="space-y-4 animate-in fade-in">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block font-bold text-slate-700 mb-1">Frontend-Framework</label>
                        <select 
                            className="w-full border border-slate-300 rounded-lg px-3 py-2 bg-white text-slate-800 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                            value={backendConfig.frontendFramework}
                            onChange={e => {
                                const fw = e.target.value as FrontendFramework;
                                const updatedConfig = { 
                                    ...backendConfig, 
                                    frontendFramework: fw,
                                    frontendPort: getDefaultPort(fw)
                                };
                                setBackendConfig(updatedConfig);
                            }}
                        >
                            <option value="react">React</option>
                            <option value="vue">Vue.js</option>
                            <option value="angular-modern">Angular 19 (Standalone & Signals)</option>
                            <option value="angular">Angular (Klassisch / NgModule)</option>
                            <option value="blazor">Blazor (WASM)</option>
                            <option value="maui">.NET MAUI (Blazor Hybrid)</option>
                            <option value="maui-native">.NET MAUI (XAML / Native)</option>
                            <option value="none">Keins (Nur API)</option>
                        </select>
                      </div>

                      <div>
                        <label className="block font-bold text-slate-700 mb-1">Styling Framework</label>
                        <select 
                            className="w-full border border-slate-300 rounded-lg px-3 py-2 bg-white text-slate-800 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                            value={backendConfig.stylingFramework || 'tailwind'}
                            onChange={e => {
                                const fw = e.target.value as any;
                                setBackendConfig({ ...backendConfig, stylingFramework: fw });
                            }}
                        >
                            <option value="tailwind">Tailwind CSS</option>
                            <option value="bootstrap">Bootstrap</option>
                            <option value="none">Keins / Custom</option>
                        </select>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block font-bold text-slate-700 mb-1">Frontend Port (Localhost)</label>
                        <input 
                            type="number" 
                            className="w-full border border-slate-300 rounded-lg px-3 py-1.5 bg-white text-slate-800 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                            value={backendConfig.frontendPort || 3000}
                            onChange={e => setBackendConfig({ ...backendConfig, frontendPort: parseInt(e.target.value) || 3000 })}
                        />
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === 'connection' && (
                  <div className="space-y-4 animate-in fade-in">
                    <div className="bg-slate-50 border border-slate-200 rounded-lg p-4">
                      <h4 className="font-bold text-slate-800 mb-2">Verbindungszeichenfolge (Connection String)</h4>
                      <p className="text-slate-500 text-[11px] mb-3">Geben Sie die Verbindungszeichenfolge für die Datenbank an. Diese wird im Backend konfiguriert.</p>
                      
                      <textarea 
                        className="w-full border border-slate-300 rounded-lg p-3 bg-white text-slate-800 font-mono text-xs focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                        rows={4}
                        placeholder="Server=localhost;Database=my_db;User Id=root;Password=***;"
                        value={backendConfig.dbConnection || ''}
                        onChange={e => setBackendConfig({ ...backendConfig, dbConnection: e.target.value })}
                      />

                      <div className="mt-4 flex justify-end">
                        <button 
                          onClick={() => {
                            setShowSettingsModal(false);
                            onOpenSettings();
                          }}
                          className="text-blue-600 hover:text-blue-700 font-bold flex items-center gap-1 bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded transition-colors"
                        >
                          <Database size={12} />
                          Erweiterten Assistenten öffnen
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Modal Footer */}
              <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-end gap-2">
                <button 
                  onClick={() => setShowSettingsModal(false)}
                  className="bg-slate-800 hover:bg-slate-900 text-white font-bold px-4 py-2 rounded-lg transition-colors flex items-center gap-1.5"
                >
                  <Check size={14} /> Speichern & Schließen
                </button>
              </div>

            </div>
          </div>
        )}
    </div>
  );
};
