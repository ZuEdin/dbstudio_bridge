
import React, { useState } from 'react';
import { DeploymentConfig, DeploymentTarget } from '../../../types/index';
import { X, Upload, Server, Cloud, Globe, Ship, Github, ArrowRight, Database, Terminal, Cpu, Layers, Settings, GitBranch, Play, CheckCircle2, DollarSign, Building, FileText, RefreshCw, Key, ShieldCheck } from 'lucide-react';

interface DeploymentModalProps {
  config: DeploymentConfig | undefined;
  onSave: (config: DeploymentConfig) => void;
  onClose: () => void;
  onDeploy: () => void;
}

export const DeploymentModal: React.FC<DeploymentModalProps> = ({ config, onSave, onClose, onDeploy }) => {
  // Ensure default target is valid cloud target
  const initialTarget = (config?.target === 'electron' || config?.target === 'tauri') ? 'docker' : (config?.target || 'docker');
  const [target, setTarget] = useState<DeploymentTarget>(initialTarget);
  
  // Docker
  const [dockerImage, setDockerImage] = useState(config?.dockerImageName || 'myapp:latest');
  const [dockerPort, setDockerPort] = useState(config?.dockerPort || 8080);

  // FTP
  const [ftpHost, setFtpHost] = useState(config?.ftpHost || '');
  const [ftpUser, setFtpUser] = useState(config?.ftpUser || '');
  const [ftpPath, setFtpPath] = useState(config?.ftpPath || '/public_html');

  const handleSave = () => {
      onSave({
          target,
          dockerImageName: dockerImage,
          dockerPort,
          ftpHost,
          ftpUser,
          ftpPath
      });
  };

  // Dynamic cost & pipeline details depending on selection
  const getArchitectureStats = () => {
    switch (target) {
      case 'docker':
        return {
          cost: '$15 - $35 / Monat',
          provider: 'Self-Hosted VPS / Container Registry / Docker Compose',
          infraFiles: ['Dockerfile', 'docker-compose.yml', '.dockerignore'],
          nodes: [
            { id: 'src', label: 'Source Code', type: 'Local workspace', active: true },
            { id: 'build', label: 'Docker Build', type: 'Local Engine', active: true },
            { id: 'container', label: 'Docker Container', type: 'Exposed Port', active: true },
            { id: 'service', label: 'App Service', type: 'Docker Daemon', active: true }
          ]
        };
      case 'github':
        return {
          cost: '$0.00 / Monat (Kostenloses Limit)',
          provider: 'GitHub Actions / CI/CD Workflow Pipeline',
          infraFiles: ['.github/workflows/main.yml', '.github/workflows/docker.yml'],
          nodes: [
            { id: 'src', label: 'Commit Push', type: 'GitHub Repo', active: true },
            { id: 'build', label: 'GitHub Runner', type: 'CI/CD Pipeline', active: true },
            { id: 'test', label: 'Linting & Tests', type: 'Verification Step', active: true },
            { id: 'deploy', label: 'Artifacts', type: 'Production Build', active: true }
          ]
        };
      case 'ftp':
        return {
          cost: '$3 - $8 / Monat',
          provider: 'Shared Web Host / Managed SFTP Server',
          infraFiles: ['deploy_sftp.sh', 'dist/.htaccess', 'package.json (build script)'],
          nodes: [
            { id: 'src', label: 'Build Folder', type: 'Static dist/ assets', active: true },
            { id: 'ftp', label: 'Bridge SFTP', type: 'Secure Local Upload', active: true },
            { id: 'remote', label: 'Web Server', type: '/public_html target', active: true },
            { id: 'web', label: 'Live Server', type: 'Apache / Nginx Host', active: true }
          ]
        };
      case 'azure':
        return {
          cost: '$45 - $80 / Monat (Inkl. Managed DB)',
          provider: 'Microsoft Azure Cloud (ASP + Flexible Server Postgres/MySQL)',
          infraFiles: ['infrastructure/terraform/main.tf', 'infrastructure/bicep/main.bicep', '.github/workflows/main.yml'],
          nodes: [
            { id: 'src', label: 'Git Hub Repo', type: 'Source Version', active: true },
            { id: 'pipeline', label: 'Azure Webapps', type: 'Github Pipeline Workflow', active: true },
            { id: 'cloud', label: 'App Service', type: 'Azure Flexible Linux', active: true },
            { id: 'db', label: 'Managed DB', type: 'Azure Database', active: true }
          ]
        };
      case 'offline_sync':
        return {
          cost: '$0 - $15 / Monat (Lokale SQLite kostenlos)',
          provider: 'Hybrid: SQLite (Client) ➔ MySQL / Postgres (Cloud)',
          infraFiles: [
            '01_sqlite_local_schema.sql',
            '02_mysql_remote_schema.sql',
            'syncApiRoutes.ts',
            'offlineClientSyncWorker.ts',
            'docker-compose.offline-sync.yml'
          ],
          nodes: [
            { id: 'src', label: 'SQLite Client', type: 'Lokale Edge DB', active: true },
            { id: 'wrapper', label: 'Sync Worker', type: 'Delta Push/Pull', active: true },
            { id: 'service', label: 'Sync API', type: 'REST Gateway', active: true },
            { id: 'db', label: 'Master DB', type: 'Cloud Server DB', active: true }
          ]
        };
      default:
        return {
          cost: 'Variabel',
          provider: 'Cloud Provider',
          infraFiles: [],
          nodes: []
        };
    }
  };

  const currentStats = getArchitectureStats();

  return (
    <div className="fixed inset-0 bg-black/50 z-[100] flex items-center justify-center animate-in fade-in-25">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-5xl border border-slate-300 flex overflow-hidden h-[630px]">
        
        {/* Sidebar */}
        <div className="w-64 bg-slate-800 text-white p-6 flex flex-col">
            <h2 className="text-lg font-bold mb-1 flex items-center gap-2"><Globe className="text-blue-400"/> Infrastructure</h2>
            <div className="text-[10px] text-slate-400 uppercase tracking-widest font-bold mb-6">Cloud & Server Deployment</div>
            
            <div className="space-y-1.5 flex-1">
                <button onClick={() => setTarget('docker')} className={`w-full text-left py-2.5 px-3 rounded flex items-center gap-3 text-sm transition-colors ${target === 'docker' ? 'bg-blue-600 text-white shadow-lg font-bold' : 'hover:bg-slate-700 text-slate-300'}`}>
                    <Ship size={16} /> Docker Container
                </button>
                <button onClick={() => setTarget('azure')} className={`w-full text-left py-2.5 px-3 rounded flex items-center gap-3 text-sm transition-colors ${target === 'azure' ? 'bg-blue-600 text-white shadow-lg font-bold' : 'hover:bg-slate-700 text-slate-300'}`}>
                    <Cloud size={16} /> IaC Azure & AWS
                </button>
                <button onClick={() => setTarget('github')} className={`w-full text-left py-2.5 px-3 rounded flex items-center gap-3 text-sm transition-colors ${target === 'github' ? 'bg-blue-600 text-white shadow-lg font-bold' : 'hover:bg-slate-700 text-slate-300'}`}>
                    <Github size={16} /> GitHub Actions
                </button>
                <button onClick={() => setTarget('offline_sync')} className={`w-full text-left py-2.5 px-3 rounded flex items-center gap-3 text-sm transition-colors ${target === 'offline_sync' ? 'bg-blue-600 text-white shadow-lg font-bold' : 'hover:bg-slate-700 text-slate-300'}`}>
                    <RefreshCw size={16} className="text-emerald-400" /> Offline-First (SQLite ➔ Cloud)
                </button>
                <div className="h-4 border-t border-slate-700/50 my-2"></div>
                <button onClick={() => setTarget('ftp')} className={`w-full text-left py-2.5 px-3 rounded flex items-center gap-3 text-sm transition-colors ${target === 'ftp' ? 'bg-blue-600 text-white shadow-lg font-bold' : 'hover:bg-slate-700 text-slate-300'}`}>
                    <Upload size={16} /> SFTP / Webhosting
                </button>
            </div>

            <div className="mt-auto pt-4 border-t border-slate-700 text-xs text-slate-400">
                <div className="flex items-center gap-1.5 text-blue-400 font-semibold mb-1">
                  <ShieldCheck size={12} className="text-emerald-400" />
                  <span>Sicherheits-Standard</span>
                </div>
                <span className="text-[11px] leading-tight">Passwörter & API-Keys werden sicher lokal auf Ihrer Bridge verwaltet.</span>
            </div>
        </div>

        {/* Content Layout: 2-Columns */}
        <div className="flex-1 flex flex-col bg-slate-50">
            <div className="p-4 border-b border-slate-200 bg-white flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <span className="p-1.5 bg-blue-100 text-blue-700 rounded-md">
                    {target === 'docker' && <Ship size={18} />}
                    {target === 'azure' && <Cloud size={18} />}
                    {target === 'github' && <Github size={18} />}
                    {target === 'offline_sync' && <RefreshCw size={18} className="text-emerald-600" />}
                    {target === 'ftp' && <Upload size={18} />}
                  </span>
                  <div>
                    <h3 className="font-bold text-slate-700 text-sm">Deployment & Infrastruktur: {target.toUpperCase()}</h3>
                    <p className="text-[11px] text-slate-500">Continuous Integration, Containerisierung und Cloud-Ressourcen Planung</p>
                  </div>
                </div>
                <button onClick={onClose} className="text-slate-400 hover:text-slate-700 p-1.5 hover:bg-slate-100 rounded-full transition-colors"><X size={20}/></button>
            </div>

            {/* Split layout: Parameter input (Left) & Dynamic Visualizer (Right) */}
            <div className="flex-1 flex overflow-hidden">
                
                {/* Parameter Column */}
                <div className="w-1/2 p-6 overflow-y-auto border-r border-slate-200 bg-white">
                    <h4 className="text-xs uppercase tracking-wider font-bold text-slate-400 mb-4 flex items-center gap-1.5">
                      <Settings size={12} /> Konfigurationen & Parameter
                    </h4>

                    {target === 'docker' && (
                        <div className="space-y-5 animate-in slide-in-from-right-2">
                            <div className="bg-blue-50/70 border border-blue-100 p-3.5 rounded-lg text-blue-900 text-xs leading-relaxed">
                                Erstellt ein multi-stage <code>Dockerfile</code> und ein lokales <code>docker-compose.yml</code>. Ideal für containerisierte Deployments oder Kubernetes Orchestrations.
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-600 mb-1">Image Name</label>
                                <input type="text" value={dockerImage} onChange={e => setDockerImage(e.target.value)} className="w-full border border-slate-300 rounded p-2 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none" placeholder="mycompany/myapp:latest" />
                                <span className="text-[10px] text-slate-400 mt-1 block">Repository-Name für Docker Hub oder Container Registry</span>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-600 mb-1">Exposed Port (Host)</label>
                                <input type="number" value={dockerPort} onChange={e => setDockerPort(parseInt(e.target.value))} className="w-full border border-slate-300 rounded p-2 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none" />
                                <span className="text-[10px] text-slate-400 mt-1 block">Der interne Port im Container (wird auf den Host gemappt)</span>
                            </div>
                        </div>
                    )}

                    {target === 'azure' && (
                        <div className="space-y-4 animate-in slide-in-from-right-2">
                            <div className="bg-sky-50 border border-sky-100 p-3.5 rounded-lg text-sky-900 text-xs leading-relaxed">
                                Generiert professionellen **Infrastructure as Code (IaC)** Code: AWS Terraform (<code>main.tf</code>, <code>variables.tf</code>) sowie ein Azure Bicep Template (<code>main.bicep</code>). 
                            </div>
                            <div className="space-y-3 pt-2">
                              <div className="flex items-start gap-2 text-xs">
                                <div className="p-1 bg-sky-100 text-sky-700 rounded mt-0.5"><Layers size={12} /></div>
                                <div>
                                  <p className="font-bold text-slate-700">Terraform Standard (AWS)</p>
                                  <p className="text-slate-500 text-[11px]">Erschafft VPC, Subnetze, AWS App Runner & PostgreSQL RDS Database.</p>
                                </div>
                              </div>
                              <div className="flex items-start gap-2 text-xs">
                                <div className="p-1 bg-violet-100 text-violet-700 rounded mt-0.5"><Cloud size={12} /></div>
                                <div>
                                  <p className="font-bold text-slate-700">Azure Web App & flexible DB</p>
                                  <p className="text-slate-500 text-[11px]">Generiert Bicep Manifest für vollautomatisiertes Azure Resource Management.</p>
                                </div>
                              </div>
                            </div>
                            <div className="pt-3 border-t border-slate-100">
                                <label className="block text-xs font-bold text-slate-600 mb-1">Projekt-ID (Cloud Suffix)</label>
                                <input type="text" readOnly className="w-full border border-slate-200 bg-slate-50 rounded p-2 text-xs font-mono text-slate-500" value={`cloud-${(config as any)?.projectName?.toLowerCase() || 'prod-instance'}`} />
                            </div>
                        </div>
                    )}

                    {target === 'github' && (
                        <div className="space-y-4 animate-in slide-in-from-right-2">
                            <div className="bg-slate-100 border border-slate-200 p-3.5 rounded-lg text-slate-800 text-xs leading-relaxed">
                                Generiert die komplette CI/CD GitHub Pipeline Workflow YAML. 
                            </div>
                            <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs space-y-2">
                              <p className="font-bold text-slate-700 flex items-center gap-1.5"><Terminal size={12} /> Automatisch integrierte Schritte:</p>
                              <ul className="list-disc pl-4 space-y-1 text-slate-600 text-[11px]">
                                <li><strong>Repository Checkout</strong></li>
                                <li><strong>Node.js Environment Setup (18.x / 20.x)</strong></li>
                                <li><strong>Dependency caching & npm install</strong></li>
                                <li><strong>Build Generation (static & server bundle)</strong></li>
                                <li><strong>Automatisches Testing (Unit & End-to-End)</strong></li>
                              </ul>
                            </div>
                        </div>
                    )}

                    {target === 'offline_sync' && (
                        <div className="space-y-4 animate-in slide-in-from-right-2">
                            <div className="bg-emerald-50 border border-emerald-200 p-3.5 rounded-lg text-emerald-950 text-xs leading-relaxed">
                                <p className="font-bold text-emerald-900 mb-1 flex items-center gap-1.5">
                                    <RefreshCw size={13} className="text-emerald-600 animate-spin-reverse" /> Offline-First Synchronisations-Architektur
                                </p>
                                Ermöglicht unterbrechungsfreies Arbeiten in einer lokalen **SQLite**-Datenbank (Client/Desktop/Edge) und synchronisiert Änderungen im Hintergrund mit dem zentralen **MySQL / PostgreSQL** Online-Server.
                            </div>
                            <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs space-y-2.5">
                              <div>
                                <p className="font-bold text-slate-700 text-[11px]">Automatische Features & Spalten:</p>
                                <div className="grid grid-cols-2 gap-1.5 text-[10px] text-slate-600 mt-1">
                                  <div className="flex items-center gap-1"><span className="text-emerald-500 font-bold">✓</span> Soft-Delete (<code>_is_deleted</code>)</div>
                                  <div className="flex items-center gap-1"><span className="text-emerald-500 font-bold">✓</span> Delta-Zeitstempel (<code>_updated_at</code>)</div>
                                  <div className="flex items-center gap-1"><span className="text-emerald-500 font-bold">✓</span> Revisions-Locking (<code>_sync_version</code>)</div>
                                  <div className="flex items-center gap-1"><span className="text-emerald-500 font-bold">✓</span> Last-Write-Wins (LWW)</div>
                                </div>
                              </div>
                              <div className="pt-2 border-t border-slate-200/60">
                                <p className="font-bold text-slate-700 text-[11px] mb-1">Generierte Sync-Routen & Worker:</p>
                                <div className="space-y-1 font-mono text-[9px] text-slate-300 bg-slate-900 p-2 rounded">
                                  <div>- POST /api/sync/pull (Delta-Query since timestamp)</div>
                                  <div>- POST /api/sync/push (Batch Upsert & Soft-Delete)</div>
                                  <div>- OfflineSyncEngine (Client SQLite Worker)</div>
                                </div>
                              </div>
                            </div>
                        </div>
                    )}

                    {target === 'ftp' && (
                        <div className="space-y-4 animate-in slide-in-from-right-2">
                            <div className="bg-orange-50 border border-orange-100 p-3.5 rounded-lg text-orange-900 text-xs leading-relaxed">
                                Generiert Deploy-Skripte für klassische Webhoster (z.B. All-Inkl, Host Europe, Strato, Hetzner). Die Bridge baut das Projekt lokal und überträgt nur die <code>dist/</code>-Dateien.
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-600 mb-1">Server Hostname</label>
                                <input type="text" value={ftpHost} onChange={e => setFtpHost(e.target.value)} className="w-full border border-slate-300 rounded p-2 text-sm focus:ring-2 focus:ring-orange-500 focus:outline-none" placeholder="sftp.meine-domain.at" />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-600 mb-1">Benutzername</label>
                                <input type="text" value={ftpUser} onChange={e => setFtpUser(e.target.value)} className="w-full border border-slate-300 rounded p-2 text-sm focus:ring-2 focus:ring-orange-500 focus:outline-none" placeholder="web_deploy_user" />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-600 mb-1">Zielpfad (Remote Path)</label>
                                <input type="text" value={ftpPath} onChange={e => setFtpPath(e.target.value)} className="w-full border border-slate-300 rounded p-2 text-sm focus:ring-2 focus:ring-orange-500 focus:outline-none" placeholder="/public_html" />
                            </div>
                            <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg flex items-start gap-2.5 text-xs text-slate-600">
                              <Key size={16} className="text-amber-600 shrink-0 mt-0.5" />
                              <div>
                                <p className="font-bold text-slate-800 text-[11px]">Sichere Passwort-Verwaltung</p>
                                <p className="text-[10px] text-slate-500">Passwörter und SFTP-Keys werden nicht in der Cloud gespeichert, sondern ausschließlich lokal in der Bridge (<code>.env</code> / Vault) hinterlegt.</p>
                              </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* VISUALIZER Column */}
                <div className="w-1/2 p-6 flex flex-col bg-slate-900 text-slate-100">
                    <h4 className="text-xs uppercase tracking-wider font-bold text-slate-400 mb-4 flex items-center justify-between">
                      <span className="flex items-center gap-1.5"><Terminal size={12} className="text-blue-400" /> Live-Architektur Visualisierung</span>
                      <span className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-1.5 py-0.5 rounded text-[9px] animate-pulse">Echtzeit-Entwurf</span>
                    </h4>

                    {/* Interactive Node Flow Chart */}
                    <div className="bg-slate-950 rounded-xl border border-slate-800 p-4 py-6 flex-1 flex flex-col justify-between mb-4">
                      
                      <div className="flex justify-between items-center relative w-full px-2">
                        {/* Connecting Line background */}
                        <div className="absolute top-1/2 left-4 right-4 h-0.5 bg-slate-800 -translate-y-1/2 -z-0"></div>

                        {currentStats.nodes.map((node, i) => (
                          <div key={node.id} className="flex flex-col items-center z-10 w-20 text-center scale-95 hover:scale-100 transition-transform">
                            {/* Visual circle connector node */}
                            <div className={`w-9 h-9 rounded-full flex items-center justify-center border-2 mb-2 shadow-lg transition-colors ${
                              i === currentStats.nodes.length - 1
                                ? 'bg-emerald-950 border-emerald-400 text-emerald-400'
                                : 'bg-slate-900 border-blue-500 text-blue-400'
                            }`}>
                              {node.id === 'src' && <GitBranch size={16} />}
                              {node.id === 'build' && <Cpu size={16} />}
                              {node.id === 'pipeline' && <Cpu size={16} />}
                              {node.id === 'container' && <Layers size={16} />}
                              {node.id === 'remote' && <Upload size={16} />}
                              {node.id === 'web' && <Globe size={16} />}
                              {node.id === 'test' && <CheckCircle2 size={16} />}
                              {node.id === 'deploy' && <Play size={16} />}
                              {node.id === 'service' && <Server size={16} />}
                              {node.id === 'cloud' && <Cloud size={16} />}
                              {node.id === 'db' && <Database size={16} />}
                              {node.id === 'ftp' && <Upload size={16} />}
                            </div>
                            <span className="text-[10px] font-bold text-slate-100 leading-tight block truncate w-full">{node.label}</span>
                            <span className="text-[8px] text-slate-400 block truncate w-full mt-0.5">{node.type}</span>
                          </div>
                        ))}
                      </div>

                      {/* Code Generation file metrics */}
                      <div className="mt-4 pt-4 border-t border-slate-900 bg-slate-950/50 p-3 rounded-lg flex flex-col gap-2">
                        <span className="text-[10px] text-blue-400 font-mono font-bold uppercase tracking-wider block">Generierte IaC & CI/CD Dateien:</span>
                        <div className="flex flex-wrap gap-1.5">
                          {currentStats.infraFiles.map(file => (
                            <span key={file} className="bg-slate-900 border border-slate-800 text-slate-300 font-mono text-[10px] px-2 py-0.5 rounded-md flex items-center gap-1">
                              <FileText size={10} className="text-yellow-500" />
                              <code>{file}</code>
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Cost & Cloud Hosting Estimation Widget */}
                    <div className="bg-slate-950/50 p-3.5 rounded-xl border border-slate-800 flex justify-between items-center text-xs">
                        <div className="flex items-center gap-3">
                          <span className="p-2 bg-amber-500/10 text-amber-400 border border-amber-500/20 rounded-lg">
                            <DollarSign size={18} />
                          </span>
                          <div>
                            <p className="font-bold text-slate-200">Geschätzte Infrastrukturkosten</p>
                            <p className="text-[10px] text-slate-400 font-medium">Provider: {currentStats.provider}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-mono text-sm text-emerald-400 font-bold">{currentStats.cost}</p>
                          <p className="text-[9px] text-slate-500 font-medium uppercase tracking-widest leading-none">Freier Tier möglich</p>
                        </div>
                    </div>
                </div>

            </div>

            {/* Bottom button line */}
            <div className="p-4 border-t border-slate-200 bg-white flex justify-end gap-3 shrink-0">
                <button onClick={onClose} className="px-4 py-2 border border-slate-300 rounded text-slate-600 hover:bg-slate-50 text-xs transition-all font-semibold">Abbrechen</button>
                <button 
                    onClick={() => { handleSave(); onDeploy(); }} 
                    className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded font-bold shadow-md hover:shadow-lg transition-all flex items-center gap-2 text-xs"
                >
                    <Upload size={14} /> Blueprint-Dateien generieren
                </button>
            </div>
        </div>
      </div>
    </div>
  );
};

