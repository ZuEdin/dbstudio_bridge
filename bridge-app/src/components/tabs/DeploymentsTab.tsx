import React, { useState, useEffect } from 'react';
import { 
  Rocket, 
  Layers, 
  RotateCcw, 
  ExternalLink, 
  CheckCircle2, 
  AlertCircle, 
  Clock, 
  Plus, 
  Box, 
  Server, 
  Terminal, 
  Play, 
  HardDrive,
  FolderOpen,
  Sliders,
  ChevronDown,
  ChevronUp,
  RefreshCw,
  Zap,
  Activity,
  Database,
  Sparkles,
  Check,
  Globe
} from 'lucide-react';
import { DeploymentRecord, DeploymentTarget, LocalProject } from '../../types/bridge';
import { bridgeApi } from '../../services/bridgeApi';

interface DeploymentsTabProps {
  deployments: DeploymentRecord[];
  onTriggerDeploy: (config: any) => Promise<void>;
  onRollback: (id: string) => Promise<void>;
}

export const DeploymentsTab: React.FC<DeploymentsTabProps> = ({
  deployments,
  onTriggerDeploy,
  onRollback
}) => {
  const [showNewModal, setShowNewModal] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(deployments[0]?.id || null);

  // Form State
  const [projectName, setProjectName] = useState('StandardProjekt');
  const [target, setTarget] = useState<DeploymentTarget>('self_contained_binary');
  const [port, setPort] = useState<number>(5000);
  const [autoRollback, setAutoRollback] = useState(true);
  const [runMigrations, setRunMigrations] = useState(true);
  const [isDeploying, setIsDeploying] = useState(false);

  // Phase 3: Multi-Server Profiles & Health-Checks
  const [profiles, setProfiles] = useState<any[]>([]);
  const [selectedProfileId, setSelectedProfileId] = useState<string>('staging');
  const [isCheckingHealth, setIsCheckingHealth] = useState(false);
  const [healthCheckResult, setHealthCheckResult] = useState<any>(null);

  // Phase 7: Docker Compose Orchestration
  const [projects, setProjects] = useState<LocalProject[]>([]);
  const [selectedDockerProject, setSelectedDockerProject] = useState<string>('');
  const [selectedDockerServices, setSelectedDockerServices] = useState<string[]>(['mysql', 'redis']);
  const [isManagingDocker, setIsManagingDocker] = useState(false);
  const [dockerActionMessage, setDockerActionMessage] = useState<string | null>(null);

  useEffect(() => {
    loadTabInitData();
  }, []);

  const loadTabInitData = async () => {
    try {
      const [profs, projs] = await Promise.all([
        bridgeApi.getDeploymentProfiles(),
        bridgeApi.getProjects()
      ]);
      setProfiles(profs);
      if (profs.length > 0) setSelectedProfileId(profs[0].id);
      setProjects(projs);
      if (projs.length > 0) setSelectedDockerProject(projs[0].id);
    } catch {
      // Ignore
    }
  };

  const handleRunHealthCheck = async (url: string) => {
    if (!url) return;
    setIsCheckingHealth(true);
    setHealthCheckResult(null);
    try {
      const res = await bridgeApi.performHealthCheck(url);
      setHealthCheckResult(res);
    } catch (e: any) {
      setHealthCheckResult({ success: false, error: e.message });
    } finally {
      setIsCheckingHealth(false);
    }
  };

  const handleGenerateDockerCompose = async () => {
    if (!selectedDockerProject) return;
    setIsManagingDocker(true);
    setDockerActionMessage(null);
    try {
      const res = await bridgeApi.generateDockerCompose({
        projectId: selectedDockerProject,
        services: selectedDockerServices
      });
      setDockerActionMessage(res.message || 'docker-compose.yml erstellt.');
    } catch (e: any) {
      setDockerActionMessage(`Fehler: ${e.message}`);
    } finally {
      setIsManagingDocker(false);
    }
  };

  const handleDockerAction = async (action: 'up' | 'down' | 'ps') => {
    if (!selectedDockerProject) return;
    setIsManagingDocker(true);
    setDockerActionMessage(null);
    try {
      const res = await bridgeApi.manageDockerCompose({
        projectId: selectedDockerProject,
        action
      });
      setDockerActionMessage(res.output || res.message || `Docker ${action} ausgeführt.`);
    } catch (e: any) {
      setDockerActionMessage(`Fehler: ${e.message}`);
    } finally {
      setIsManagingDocker(false);
    }
  };

  const targetLabels: Record<DeploymentTarget, { label: string; icon: any; desc: string }> = {
    self_contained_binary: {
      label: 'Self-Contained .NET 10 Binary (.exe)',
      icon: Box,
      desc: 'Eigenständige Single-File EXE ohne vorinstalliertes .NET SDK beim Endkunden'
    },
    docker_container: {
      label: 'Docker Container Engine',
      icon: Server,
      desc: 'Baut ein lokales Container-Image mit Port-Mapping'
    },
    windows_service: {
      label: 'Windows Service / Hintergrund-Dienst',
      icon: HardDrive,
      desc: 'Registriert den Dienst im Windows Service Manager (sc.exe) für Autostart'
    },
    local_dev: {
      label: 'Lokaler Dev-Daemon (Hot-Reload)',
      icon: Play,
      desc: 'Klassischer Entwicklungsmodus mit dotnet watch / Vite Dev Server'
    },
    static_bundle: {
      label: 'Produktions-Bundle (Vite Static Dist)',
      icon: Layers,
      desc: 'Kompiliertes HTML/JS/CSS Frontend für IIS oder Nginx'
    }
  };

  const handleStartDeploy = async () => {
    setIsDeploying(true);
    await onTriggerDeploy({
      projectName,
      target,
      port,
      autoRollback,
      runMigrations,
      envVars: {
        ASPNETCORE_ENVIRONMENT: 'Production',
        PORT: port.toString()
      }
    });
    setIsDeploying(false);
    setShowNewModal(false);
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Header & Quick Action */}
      <div className="bg-gradient-to-br from-[#0F172A] via-[#0E1526] to-[#0A0F1D] border border-slate-800/90 rounded-3xl p-6 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-1/4 w-72 h-72 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2.5 mb-1.5">
              <div className="p-2 rounded-2xl bg-gradient-to-br from-emerald-500/20 via-emerald-600/10 to-teal-500/5 border border-emerald-500/30 text-emerald-400 glow-emerald">
                <Rocket className="w-5 h-5" />
              </div>
              <h2 className="text-xl font-bold text-white tracking-tight">Lokaler Deployment & Release Manager</h2>
            </div>
            <p className="text-xs text-slate-400 max-w-2xl leading-relaxed">
              Kompilieren und veröffentlichen Sie generierten Code lokal als eigenständige Windows-Executable, Docker-Container oder dauerhaften Windows-Hintergrunddienst.
            </p>
          </div>

          <button
            onClick={() => setShowNewModal(true)}
            className="flex items-center justify-center gap-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-bold px-4 py-2.5 rounded-2xl transition-all shadow-lg shadow-emerald-950/50 shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>Neues Deployment starten</span>
          </button>
        </div>
      </div>

      {/* Deployments List */}
      <div className="space-y-4">
        <div className="flex items-center justify-between px-1">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">Bereitgestellte Instanzen & Release-Historie</h3>
          <span className="text-[11px] text-slate-500 font-mono">{deployments.length} Bereitstellungen</span>
        </div>

        {deployments.length === 0 ? (
          <div className="bg-[#0E1524]/80 backdrop-blur-md border border-slate-800/80 rounded-2xl p-10 text-center shadow-xl">
            <div className="w-12 h-12 rounded-2xl bg-[#080D17] border border-slate-800 flex items-center justify-center mx-auto mb-3 text-slate-500 shadow-inner">
              <Rocket className="w-6 h-6 text-slate-400" />
            </div>
            <h4 className="text-sm font-bold text-slate-200">Momentan keine Bereitstellungen aktiv</h4>
            <p className="text-xs text-slate-400 max-w-md mx-auto mt-1 leading-relaxed">
              Kompilierte Releases, Docker-Container oder Windows-Dienste werden nach dem ersten Ausführen hier protokolliert.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {deployments.map((dep) => {
            const TargetIcon = targetLabels[dep.target]?.icon || Box;
            const isExpanded = expandedId === dep.id;
            const isHealthy = dep.status === 'healthy';

            return (
              <div 
                key={dep.id} 
                className="bg-[#0E1524]/80 backdrop-blur-md border border-slate-800/80 rounded-2xl overflow-hidden shadow-xl hover:border-slate-700/80 transition-all"
              >
                {/* Main Card Summary */}
                <div className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex items-start gap-3.5">
                    <div className="w-11 h-11 rounded-2xl bg-[#080D17] border border-slate-800 flex items-center justify-center text-emerald-400 shrink-0 mt-0.5 shadow-inner">
                      <TargetIcon className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <h4 className="font-bold text-slate-100 text-sm">{dep.projectName}</h4>
                        <span className="text-[10px] font-mono bg-slate-900 text-emerald-300 px-2.5 py-0.5 rounded-full border border-slate-800 font-semibold">
                          {dep.version}
                        </span>
                        <span className={`flex items-center gap-1 text-[10px] font-mono px-2.5 py-0.5 rounded-full border font-semibold ${
                          isHealthy 
                            ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30 glow-emerald' 
                            : 'bg-rose-500/15 text-rose-300 border-rose-500/30'
                        }`}>
                          {isHealthy ? <CheckCircle2 className="w-3 h-3" /> : <AlertCircle className="w-3 h-3" />}
                          {dep.status.toUpperCase()}
                        </span>
                      </div>
                      <p className="text-xs text-slate-400 mt-0.5">{targetLabels[dep.target]?.label}</p>
                      
                      <div className="flex items-center gap-4 mt-2 text-[11px] text-slate-500 font-mono flex-wrap">
                        <span>Gestartet: {dep.startedAt}</span>
                        <span>Dauer: {dep.duration}</span>
                        {dep.artifactSizeMb && <span>Größe: {dep.artifactSizeMb} MB</span>}
                        {dep.port && (
                          <span className="text-emerald-400 font-bold">Port: :{dep.port}</span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Actions & Links */}
                  <div className="flex items-center gap-2 self-end md:self-center">
                    {dep.liveUrl && (
                      <a
                        href={dep.liveUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs px-3 py-2 rounded-lg border border-slate-700 transition-colors"
                      >
                        <span>Öffnen</span>
                        <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
                      </a>
                    )}

                    <button
                      onClick={() => onRollback(dep.id)}
                      className="flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs px-3 py-2 rounded-lg border border-slate-700 transition-colors"
                      title="Auf vorherige Version zurücksetzen"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">Rollback</span>
                    </button>

                    <button
                      onClick={() => setExpandedId(isExpanded ? null : dep.id)}
                      className="p-2 rounded-lg bg-slate-950 border border-slate-800 text-slate-400 hover:text-slate-200 transition-colors"
                      title="Pipeline Details"
                    >
                      {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Expanded Build Pipeline View */}
                {isExpanded && (
                  <div className="bg-slate-950/90 border-t border-slate-800 p-5 space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold uppercase tracking-wider text-slate-400 font-mono">
                        Build & Deployment Pipeline Schritte
                      </span>
                      <span className="text-[11px] text-slate-500 font-mono">Trigger: {dep.triggeredBy}</span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                      {dep.steps.map((step, idx) => (
                        <div key={step.id} className="bg-slate-900 border border-slate-800/80 p-3 rounded-lg flex items-start gap-2.5">
                          <div className="w-5 h-5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5 font-mono">
                            {idx + 1}
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="text-xs font-semibold text-slate-200 truncate">{step.name}</div>
                            <div className="text-[10px] font-mono text-slate-500 mt-0.5">
                              {step.durationMs ? `${step.durationMs} ms` : 'Abgeschlossen'}
                            </div>
                          </div>
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                        </div>
                      ))}
                    </div>

                    {dep.artifactPath && (
                      <div className="pt-2 border-t border-slate-800/60 flex items-center justify-between text-[11px] font-mono text-slate-400 truncate">
                        <span className="text-slate-500 shrink-0 mr-2">Ausgabe-Artefakt:</span>
                        <span className="truncate text-slate-300" title={dep.artifactPath}>{dep.artifactPath}</span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
        )}
      </div>

      {/* PHASE 3: MULTI-SERVER DEPLOYMENT PROFILES & HEALTH-CHECKS */}
      <div className="bg-[#0E1524]/80 backdrop-blur-md border border-slate-800/80 rounded-3xl p-6 shadow-2xl space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800/80 pb-3 flex-wrap gap-2">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 flex items-center justify-center glow-sky">
              <Globe className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
                <span>Multi-Server Profile & Post-Deploy Health-Checks</span>
                <span className="text-[10px] font-mono uppercase bg-cyan-500/15 text-cyan-300 px-2.5 py-0.5 rounded-full border border-cyan-500/30 font-semibold">
                  Phase 3
                </span>
              </h3>
              <p className="text-xs text-slate-400">Verwalten von Staging- & Production-Servern mit automatisierter HTTP-Endpunkt-Prüfung</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {profiles.map((prof) => {
            const isSelected = selectedProfileId === prof.id;
            return (
              <div
                key={prof.id}
                onClick={() => setSelectedProfileId(prof.id)}
                className={`p-4 rounded-2xl border transition-all cursor-pointer space-y-3 ${
                  isSelected
                    ? 'bg-[#080D17] border-cyan-500/50 shadow-lg shadow-cyan-950/20'
                    : 'bg-[#080D17]/60 border-slate-800/80 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Server className="w-4 h-4 text-cyan-400" />
                    <span className="font-bold text-xs text-slate-100">{prof.name}</span>
                  </div>
                  <span className="text-[10px] font-mono uppercase bg-slate-900 border border-slate-800 text-slate-300 px-2 py-0.5 rounded-md">
                    {prof.protocol.toUpperCase()} :{prof.port}
                  </span>
                </div>

                <div className="text-xs font-mono text-slate-400 space-y-1">
                  <div>Host: <span className="text-slate-200">{prof.host}</span></div>
                  <div>Pfad: <span className="text-slate-200">{prof.remotePath}</span></div>
                  {prof.healthCheckUrl && (
                    <div className="text-[11px] text-cyan-400/80 truncate">Health: {prof.healthCheckUrl}</div>
                  )}
                </div>

                {prof.healthCheckUrl && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleRunHealthCheck(prof.healthCheckUrl);
                    }}
                    disabled={isCheckingHealth}
                    className="w-full bg-cyan-600/20 hover:bg-cyan-600/30 text-cyan-300 border border-cyan-500/30 px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2"
                  >
                    {isCheckingHealth ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Activity className="w-3.5 h-3.5" />}
                    <span>Healthcheck testen</span>
                  </button>
                )}
              </div>
            );
          })}
        </div>

        {healthCheckResult && (
          <div className={`p-3.5 rounded-2xl text-xs font-mono flex items-center gap-2.5 shadow-inner ${
            healthCheckResult.success
              ? 'bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 glow-emerald'
              : 'bg-rose-500/15 border border-rose-500/30 text-rose-300'
          }`}>
            {healthCheckResult.success ? <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" /> : <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />}
            <span>{healthCheckResult.message || healthCheckResult.error}</span>
          </div>
        )}
      </div>

      {/* PHASE 7: DOCKER COMPOSE MULTI-CONTAINER ORCHESTRATION */}
      <div className="bg-[#0E1524]/80 backdrop-blur-md border border-slate-800/80 rounded-3xl p-6 shadow-2xl space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800/80 pb-3 flex-wrap gap-2">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-blue-500/10 border border-blue-500/30 text-blue-400 flex items-center justify-center glow-sky">
              <Box className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
                <span>Docker Compose Multi-Container Orchestrierung</span>
                <span className="text-[10px] font-mono uppercase bg-blue-500/15 text-blue-300 px-2.5 py-0.5 rounded-full border border-blue-500/30 font-semibold">
                  Phase 7
                </span>
              </h3>
              <p className="text-xs text-slate-400">Automatische Bereitstellung von MySQL, Postgres, Redis & Mailpit Containern für Ihre Projekte</p>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Projekt auswählen</label>
              <select
                value={selectedDockerProject}
                onChange={(e) => setSelectedDockerProject(e.target.value)}
                className="w-full bg-[#080D17] border border-slate-700/80 text-slate-200 text-xs rounded-xl px-3 py-2 outline-none font-semibold focus:border-blue-500"
              >
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>{p.name} ({p.framework})</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Enthaltene Container-Dienste</label>
              <div className="flex items-center gap-2 flex-wrap">
                {[
                  { id: 'mysql', label: 'MySQL 8 (Port 3306)' },
                  { id: 'postgres', label: 'Postgres 16 (Port 5432)' },
                  { id: 'redis', label: 'Redis 7 (Port 6379)' },
                  { id: 'mailpit', label: 'Mailpit (Port 1025/8025)' }
                ].map((svc) => {
                  const isChecked = selectedDockerServices.includes(svc.id);
                  return (
                    <button
                      key={svc.id}
                      type="button"
                      onClick={() => {
                        setSelectedDockerServices(
                          isChecked
                            ? selectedDockerServices.filter(s => s !== svc.id)
                            : [...selectedDockerServices, svc.id]
                        );
                      }}
                      className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
                        isChecked
                          ? 'bg-blue-500/20 border-blue-500/40 text-blue-300'
                          : 'bg-[#080D17] border-slate-800 text-slate-500'
                      }`}
                    >
                      {svc.label}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between gap-3 pt-2 border-t border-slate-800 flex-wrap">
            <span className="text-[11px] text-slate-500 font-mono">Erzeugt automatisiert eine production-ready `docker-compose.yml`</span>
            <div className="flex items-center gap-2">
              <button
                onClick={handleGenerateDockerCompose}
                disabled={isManagingDocker || !selectedDockerProject}
                className="bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 border border-blue-500/30 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Compose-Datei generieren</span>
              </button>
              <button
                onClick={() => handleDockerAction('up')}
                disabled={isManagingDocker || !selectedDockerProject}
                className="bg-emerald-600 hover:bg-emerald-500 text-white px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all shadow-md shadow-emerald-950/40 flex items-center gap-1.5"
              >
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>Container Starten (Up)</span>
              </button>
              <button
                onClick={() => handleDockerAction('down')}
                disabled={isManagingDocker || !selectedDockerProject}
                className="bg-slate-900 hover:bg-slate-800 text-rose-400 border border-slate-800 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all"
              >
                Stoppen (Down)
              </button>
            </div>
          </div>

          {dockerActionMessage && (
            <div className="p-3.5 rounded-2xl bg-[#080D17] border border-slate-800 text-xs font-mono text-blue-300">
              {dockerActionMessage}
            </div>
          )}
        </div>
      </div>

      {/* New Deployment Modal */}
      {showNewModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-xl w-full p-6 shadow-2xl space-y-5 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Rocket className="w-5 h-5 text-emerald-400" />
                <h3 className="font-bold text-slate-100 text-sm">Neues lokales Deployment konfigurieren</h3>
              </div>
              <button 
                onClick={() => setShowNewModal(false)}
                className="text-slate-400 hover:text-slate-200 text-xs font-mono font-bold"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-300 mb-1">Projekt-Name</label>
                <input
                  type="text"
                  value={projectName}
                  onChange={(e) => setProjectName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-slate-200 font-mono focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1.5">Ziel-Architektur / Deployment-Typ</label>
                <div className="space-y-2">
                  {(Object.keys(targetLabels) as DeploymentTarget[]).map((key) => {
                    const item = targetLabels[key];
                    const Icon = item.icon;
                    const isSelected = target === key;
                    return (
                      <div
                        key={key}
                        onClick={() => setTarget(key)}
                        className={`p-3 rounded-xl border cursor-pointer transition-all flex items-start gap-3 ${
                          isSelected 
                            ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-300' 
                            : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                        }`}
                      >
                        <Icon className={`w-4 h-4 mt-0.5 shrink-0 ${isSelected ? 'text-emerald-400' : 'text-slate-500'}`} />
                        <div>
                          <div className="font-semibold text-slate-200">{item.label}</div>
                          <div className="text-[11px] text-slate-500 mt-0.5">{item.desc}</div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">Lokaler Ziel-Port</label>
                <input
                  type="number"
                  value={port}
                  onChange={(e) => setPort(parseInt(e.target.value) || 5000)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-slate-200 font-mono focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="space-y-2 pt-2 border-t border-slate-800">
                <label className="flex items-center gap-2 text-slate-300 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={runMigrations}
                    onChange={(e) => setRunMigrations(e.target.checked)}
                    className="rounded border-slate-700 bg-slate-950 text-emerald-500 focus:ring-emerald-500 w-4 h-4"
                  />
                  <span>Datenbank-Migrationen vor Start automatisch ausführen</span>
                </label>
                <label className="flex items-center gap-2 text-slate-300 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={autoRollback}
                    onChange={(e) => setAutoRollback(e.target.checked)}
                    className="rounded border-slate-700 bg-slate-950 text-emerald-500 focus:ring-emerald-500 w-4 h-4"
                  />
                  <span>Automatisches Rollback bei fehlgeschlagenem Health-Check</span>
                </label>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
              <button
                onClick={() => setShowNewModal(false)}
                className="px-4 py-2 text-xs font-medium text-slate-400 hover:text-slate-200 bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors"
              >
                Abbrechen
              </button>
              <button
                onClick={handleStartDeploy}
                disabled={isDeploying}
                className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold px-4 py-2 rounded-lg transition-colors shadow-lg shadow-emerald-950/50"
              >
                <Rocket className="w-4 h-4" />
                <span>{isDeploying ? 'Kompiliere & Bereitstelle...' : 'Deployment ausführen'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
