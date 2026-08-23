import React, { useState, useEffect } from 'react';
import { 
  FolderGit2, 
  Network, 
  ShieldCheck, 
  GitBranch, 
  UploadCloud, 
  Save, 
  CheckCircle2, 
  AlertTriangle, 
  RefreshCw, 
  Key, 
  ExternalLink,
  Trash2,
  Plus,
  Server,
  Radio,
  Eye,
  EyeOff,
  Globe,
  Sparkles,
  Check,
  Zap,
  Folder,
  FolderOpen,
  ArrowRight,
  HardDrive,
  FileCode
} from 'lucide-react';
import { BridgeSettings, FtpSettings, LocalProject } from '../../types/bridge';
import { bridgeApi } from '../../services/bridgeApi';

export const SettingsTab: React.FC = () => {
  const [settings, setSettings] = useState<BridgeSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  
  // Port check state
  const [portCheckResult, setPortCheckResult] = useState<{
    port: number;
    available: boolean;
    occupyingProcess?: any;
    suggestedAlternativePort?: number;
  } | null>(null);
  const [checkingPort, setCheckingPort] = useState(false);

  // FTP test & upload state
  const [ftpTestResult, setFtpTestResult] = useState<{
    success: boolean;
    latencyMs?: number;
    host?: string;
    port?: number;
    currentDir?: string;
    filesFound?: number;
    remoteFiles?: Array<{ name: string; type: string; sizeBytes?: number }>;
    message?: string;
    error?: string;
  } | null>(null);
  const [testingFtp, setTestingFtp] = useState(false);
  const [savedProjects, setSavedProjects] = useState<LocalProject[]>([]);
  const [selectedFtpProjectId, setSelectedFtpProjectId] = useState<string>('');
  const [detectedUploadCandidates, setDetectedUploadCandidates] = useState<any[]>([]);
  const [selectedUploadScope, setSelectedUploadScope] = useState<string>('auto');
  const [isDetectingFiles, setIsDetectingFiles] = useState(false);
  const [isUploadingFtp, setIsUploadingFtp] = useState(false);
  const [ftpUploadResult, setFtpUploadResult] = useState<{ success: boolean; message?: string; error?: string } | null>(null);

  // GitHub test state
  const [githubTestResult, setGithubTestResult] = useState<{ success: boolean; username?: string; message?: string; error?: string } | null>(null);
  const [testingGithub, setTestingGithub] = useState(false);

  // GitLab test state
  const [gitlabTestResult, setGitlabTestResult] = useState<{ success: boolean; username?: string; message?: string; error?: string } | null>(null);
  const [testingGitlab, setTestingGitlab] = useState(false);

  // Password visibility states
  const [showGithubToken, setShowGithubToken] = useState(false);
  const [showGitlabToken, setShowGitlabToken] = useState(false);
  const [showFtpPassword, setShowFtpPassword] = useState(false);

  // New allowed host input
  const [newOriginInput, setNewOriginInput] = useState('');

  // Phase 2: Windows Autostart state
  const [autostartStatus, setAutostartStatus] = useState<{ supported: boolean; enabled: boolean; message: string }>({ supported: false, enabled: false, message: '' });
  const [isTogglingAutostart, setIsTogglingAutostart] = useState(false);

  // Phase 6: CI/CD Pipeline state
  const [selectedPipelineProject, setSelectedPipelineProject] = useState<string>('');
  const [selectedPipelineProvider, setSelectedPipelineProvider] = useState<'github' | 'gitlab' | 'both'>('github');
  const [isGeneratingPipeline, setIsGeneratingPipeline] = useState(false);
  const [pipelineResult, setPipelineResult] = useState<{ success: boolean; message?: string; error?: string } | null>(null);

  useEffect(() => {
    loadSettingsData();
  }, []);

  const loadSettingsData = async () => {
    setLoading(true);
    const [data, projs, autoStatus] = await Promise.all([
      bridgeApi.getSettings(),
      bridgeApi.getProjects(),
      bridgeApi.getAutostartStatus()
    ]);
    setSettings(data);
    setSavedProjects(projs);
    setAutostartStatus(autoStatus);
    if (projs.length > 0) {
      setSelectedFtpProjectId(projs[0].id);
      setSelectedPipelineProject(projs[0].id);
      detectProjectFiles(projs[0].id);
    }
    setLoading(false);
  };

  const handleToggleAutostart = async () => {
    setIsTogglingAutostart(true);
    try {
      const res = await bridgeApi.toggleAutostart(!autostartStatus.enabled);
      if (res.success) {
        setAutostartStatus({ ...autostartStatus, enabled: !!res.enabled, message: res.message || '' });
      }
    } catch {
      // Ignore
    } finally {
      setIsTogglingAutostart(false);
    }
  };

  const handleGeneratePipeline = async () => {
    if (!selectedPipelineProject) return;
    setIsGeneratingPipeline(true);
    setPipelineResult(null);
    try {
      const res = await bridgeApi.generatePipeline({
        projectId: selectedPipelineProject,
        provider: selectedPipelineProvider,
        enableDotnetBuild: true,
        enableFrontendBuild: true,
        enableFtpDeploy: settings?.ftp?.enabled,
        ftpHost: settings?.ftp?.host,
        ftpUser: settings?.ftp?.username,
        ftpPath: settings?.ftp?.remotePath
      });
      setPipelineResult(res);
    } catch (e: any) {
      setPipelineResult({ success: false, error: e.message });
    } finally {
      setIsGeneratingPipeline(false);
    }
  };

  const detectProjectFiles = async (projectId: string) => {
    if (!projectId) return;
    setIsDetectingFiles(true);
    setDetectedUploadCandidates([]);
    try {
      const res = await bridgeApi.detectFtpUploadFiles(projectId);
      if (res.success && res.candidates) {
        setDetectedUploadCandidates(res.candidates);
      }
    } catch (e) {
      // Ignore
    } finally {
      setIsDetectingFiles(false);
    }
  };

  const handleSelectFtpProject = (projId: string) => {
    setSelectedFtpProjectId(projId);
    detectProjectFiles(projId);
  };

  const handleUploadViaFtp = async () => {
    if (!settings || !selectedFtpProjectId) return;
    setIsUploadingFtp(true);
    setFtpUploadResult(null);
    try {
      const res = await bridgeApi.uploadProjectViaFtp({
        projectId: selectedFtpProjectId,
        ftpConfig: settings.ftp,
        scope: selectedUploadScope,
        cleanRemoteBeforeUpload: settings.ftp.cleanRemoteBeforeUpload
      });
      setFtpUploadResult(res);
    } catch (e: any) {
      setFtpUploadResult({ success: false, error: e.message });
    } finally {
      setIsUploadingFtp(false);
    }
  };

  const handleSave = async () => {
    if (!settings) return;
    setSaving(true);
    const updated = await bridgeApi.saveSettings(settings);
    setSettings(updated);
    setSaving(false);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  const handleCheckPort = async (port: number) => {
    setCheckingPort(true);
    const res = await bridgeApi.checkPort(port);
    setPortCheckResult(res);
    setCheckingPort(false);
  };

  const handleKillOccupyingProcess = async (port: number) => {
    const res = await bridgeApi.killPort(port);
    if (res.killed) {
      alert(`Prozess erfolgreich beendet: ${res.message}`);
      handleCheckPort(port);
    } else {
      alert(`Konnte Prozess nicht beenden: ${res.message}`);
    }
  };

  const handleGenerateToken = async () => {
    if (!settings) return;
    const newToken = 'bridge_sec_' + Math.random().toString(36).substring(2, 10) + Math.random().toString(36).substring(2, 6);
    const updated = { ...settings, securityToken: newToken };
    setSettings(updated);
    await bridgeApi.saveSettings(updated);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  const handleAddOrigin = async () => {
    if (!newOriginInput.trim() || !settings) return;
    let url = newOriginInput.trim();
    if (!url.startsWith('http://') && !url.startsWith('https://') && !url.startsWith('*')) {
      url = 'https://' + url;
    }
    if (!settings.allowedOrigins.includes(url)) {
      const updated = {
        ...settings,
        allowedOrigins: [...settings.allowedOrigins, url]
      };
      setSettings(updated);
      await bridgeApi.saveSettings(updated);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    }
    setNewOriginInput('');
  };

  const handleRemoveOrigin = async (origin: string) => {
    if (!settings) return;
    const updated = {
      ...settings,
      allowedOrigins: settings.allowedOrigins.filter(o => o !== origin)
    };
    setSettings(updated);
    await bridgeApi.saveSettings(updated);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  const handleTestFtp = async () => {
    if (!settings) return;
    setTestingFtp(true);
    setFtpTestResult(null);
    const res = await bridgeApi.testFtp(settings.ftp);
    setFtpTestResult(res);
    setTestingFtp(false);
  };

  const handleTestGithub = async () => {
    if (!settings?.git?.github?.token && !settings?.git?.personalAccessToken) {
      setGithubTestResult({ success: false, error: 'Bitte geben Sie zuerst einen GitHub Personal Access Token ein.' });
      return;
    }
    setTestingGithub(true);
    setGithubTestResult(null);
    const token = settings.git.github?.token || settings.git.personalAccessToken;
    const res = await bridgeApi.testGitConnection({ provider: 'github', token });
    setGithubTestResult(res);
    setTestingGithub(false);
  };

  const handleTestGitlab = async () => {
    if (!settings?.git?.gitlab?.token && !settings?.git?.personalAccessToken) {
      setGitlabTestResult({ success: false, error: 'Bitte geben Sie zuerst einen GitLab Personal Access Token ein.' });
      return;
    }
    setTestingGitlab(true);
    setGitlabTestResult(null);
    const token = settings.git.gitlab?.token || settings.git.personalAccessToken;
    const serverUrl = settings.git.gitlab?.serverUrl || 'https://gitlab.com';
    const res = await bridgeApi.testGitConnection({ provider: 'gitlab', token, serverUrl });
    setGitlabTestResult(res);
    setTestingGitlab(false);
  };

  if (loading || !settings) {
    return (
      <div className="flex items-center justify-center h-64 text-slate-400 gap-3">
        <RefreshCw className="w-5 h-5 animate-spin text-emerald-400" />
        <span>Lade Bridge-Konfiguration...</span>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-12">
      {/* Top Header with Save Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#0E1524]/90 border border-slate-800/80 p-5 rounded-3xl backdrop-blur-xl sticky top-0 z-20 shadow-2xl">
        <div>
          <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2.5">
            <span>Bridge Konfiguration & Einstellungen</span>
            <span className="text-xs font-mono uppercase bg-emerald-500/15 text-emerald-300 px-2.5 py-0.5 rounded-full border border-emerald-500/30 font-semibold">
              Live Daemon Config
            </span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Zentrale Verwaltung aller Verzeichnisse, Netzwerk-Ports, Host-Berechtigungen, Git- & FTP-Verbindungen.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {saveSuccess && (
            <div className="flex items-center gap-1.5 text-emerald-300 bg-emerald-500/15 border border-emerald-500/30 px-3.5 py-1.5 rounded-xl text-xs font-bold animate-fade-in shadow-sm glow-emerald">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>Einstellungen gespeichert!</span>
            </div>
          )}

          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 active:from-emerald-700 active:to-teal-700 disabled:opacity-50 text-white text-xs font-bold px-4 py-2.5 rounded-xl transition-all shadow-md shadow-emerald-950/50"
          >
            <Save className="w-4 h-4" />
            <span>{saving ? 'Speichere...' : 'Einstellungen Übernehmen'}</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 1. SECTION: ORDNER & WORKSPACES */}
        <div className="bg-[#0E1524]/80 backdrop-blur-md border border-slate-800/80 rounded-3xl p-6 space-y-5 shadow-2xl">
          <div className="flex items-center gap-3 border-b border-slate-800/80 pb-3">
            <div className="w-10 h-10 rounded-2xl bg-blue-500/10 border border-blue-500/30 flex items-center justify-center text-blue-400">
              <FolderGit2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-100">1. Ordner & Workspaces</h3>
              <p className="text-[11px] text-slate-400">Pfade für generierte Projekte und den zentralen Dependency-Store</p>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Projekte-Hauptverzeichnis (Zielordner für DB Studio)
              </label>
              <input
                type="text"
                value={settings.projectsDir}
                onChange={(e) => setSettings({ ...settings, projectsDir: e.target.value })}
                className="w-full bg-[#080D17] border border-slate-700/80 focus:border-emerald-500 rounded-xl px-3.5 py-2 text-xs font-mono text-slate-100 outline-none transition-colors shadow-inner"
                placeholder="C:\DBStudio\Projects"
              />
              <p className="text-[10px] text-slate-500 mt-1">Hierhin werden empfangene Projekte entpackt und ausgeführt.</p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Zentraler Shared-Dependencies-Ordner (Globaler Pool)
              </label>
              <input
                type="text"
                value={settings.sharedDependenciesDir}
                onChange={(e) => setSettings({ ...settings, sharedDependenciesDir: e.target.value })}
                className="w-full bg-[#080D17] border border-slate-700/80 focus:border-emerald-500 rounded-xl px-3.5 py-2 text-xs font-mono text-slate-100 outline-none transition-colors shadow-inner"
                placeholder="C:\DBStudio\Shared_Dependencies"
              />
              <p className="text-[10px] text-slate-500 mt-1">
                Enthält zentrale <code className="text-emerald-400 font-mono">node_modules</code>, NuGet-Pakete und Cargo-Caches. Projekte werden per Windows-Junctions verlinkt.
              </p>
            </div>
          </div>
        </div>

        {/* 2. SECTION: NETZWERK & PORT-MANAGEMENT */}
        <div className="bg-[#0E1524]/80 backdrop-blur-md border border-slate-800/80 rounded-3xl p-6 space-y-5 shadow-2xl">
          <div className="flex items-center gap-3 border-b border-slate-800/80 pb-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 glow-emerald">
              <Network className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-100">2. Ports & Netzwerk-Konflikte</h3>
              <p className="text-[11px] text-slate-400">Port-Definition und automatische Konfliktbehandlung</p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-slate-300 mb-1">Bridge Port</label>
                <div className="flex items-center gap-1.5">
                  <input
                    type="number"
                    value={settings.bridgeServerPort}
                    onChange={(e) => setSettings({ ...settings, bridgeServerPort: parseInt(e.target.value, 10) || 5050 })}
                    className="w-full bg-[#080D17] border border-slate-700/80 focus:border-emerald-500 rounded-xl px-2.5 py-1.5 text-xs font-mono text-slate-100 outline-none shadow-inner"
                  />
                  <button
                    onClick={() => handleCheckPort(settings.bridgeServerPort)}
                    disabled={checkingPort}
                    title="Port auf Verfügbarkeit prüfen"
                    className="bg-slate-800 hover:bg-slate-700 text-slate-300 p-2 rounded-xl text-xs"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${checkingPort ? 'animate-spin' : ''}`} />
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-300 mb-1">Backend Port</label>
                <input
                  type="number"
                  value={settings.defaultBackendPort}
                  onChange={(e) => setSettings({ ...settings, defaultBackendPort: parseInt(e.target.value, 10) || 5000 })}
                  className="w-full bg-[#080D17] border border-slate-700/80 focus:border-emerald-500 rounded-xl px-2.5 py-1.5 text-xs font-mono text-slate-100 outline-none shadow-inner"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-300 mb-1">Frontend Port</label>
                <input
                  type="number"
                  value={settings.defaultFrontendPort}
                  onChange={(e) => setSettings({ ...settings, defaultFrontendPort: parseInt(e.target.value, 10) || 3000 })}
                  className="w-full bg-[#080D17] border border-slate-700/80 focus:border-emerald-500 rounded-xl px-2.5 py-1.5 text-xs font-mono text-slate-100 outline-none shadow-inner"
                />
              </div>
            </div>

            {/* Port Check Feedback Banner */}
            {portCheckResult && (
              <div className={`p-3 rounded-xl border text-xs ${
                portCheckResult.available 
                  ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300' 
                  : 'bg-amber-500/10 border-amber-500/30 text-amber-300'
              }`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {portCheckResult.available ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    ) : (
                      <AlertTriangle className="w-4 h-4 text-amber-400" />
                    )}
                    <span>
                      {portCheckResult.available 
                        ? `Port ${portCheckResult.port} ist frei und betriebsbereit!` 
                        : `Port ${portCheckResult.port} ist belegt! (PID: ${portCheckResult.occupyingProcess?.pid || 'Unbekannt'})`}
                    </span>
                  </div>

                  {!portCheckResult.available && (
                    <div className="flex items-center gap-2 mt-1 sm:mt-0">
                      <button
                        onClick={() => setSettings({ ...settings, bridgeServerPort: portCheckResult.suggestedAlternativePort || 5051 })}
                        className="bg-amber-600/30 hover:bg-amber-600/50 text-amber-200 px-2 py-1 rounded text-[11px] font-medium"
                      >
                        Nimm Port {portCheckResult.suggestedAlternativePort}
                      </button>
                      <button
                        onClick={() => handleKillOccupyingProcess(portCheckResult.port)}
                        className="bg-red-500/20 hover:bg-red-500/40 text-red-300 px-2 py-1 rounded text-[11px] font-medium"
                      >
                        Prozess Beenden
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Port Conflict Strategy */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-2">
                Verhalten bei Port-Kollision
              </label>
              <div className="grid grid-cols-3 gap-2 text-xs">
                <label className={`flex items-center gap-2 p-2.5 rounded-xl border cursor-pointer transition-colors ${
                  settings.portConflictStrategy === 'auto_increment'
                    ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-300'
                    : 'bg-slate-950 border-slate-800 text-slate-400'
                }`}>
                  <input
                    type="radio"
                    name="strategy"
                    checked={settings.portConflictStrategy === 'auto_increment'}
                    onChange={() => setSettings({ ...settings, portConflictStrategy: 'auto_increment' })}
                    className="hidden"
                  />
                  <span>Nächsten freien Port wählen</span>
                </label>

                <label className={`flex items-center gap-2 p-2.5 rounded-xl border cursor-pointer transition-colors ${
                  settings.portConflictStrategy === 'kill_existing'
                    ? 'bg-red-500/10 border-red-500/40 text-red-300'
                    : 'bg-slate-950 border-slate-800 text-slate-400'
                }`}>
                  <input
                    type="radio"
                    name="strategy"
                    checked={settings.portConflictStrategy === 'kill_existing'}
                    onChange={() => setSettings({ ...settings, portConflictStrategy: 'kill_existing' })}
                    className="hidden"
                  />
                  <span>Alt-Prozess killen</span>
                </label>

                <label className={`flex items-center gap-2 p-2.5 rounded-xl border cursor-pointer transition-colors ${
                  settings.portConflictStrategy === 'warn'
                    ? 'bg-amber-500/10 border-amber-500/40 text-amber-300'
                    : 'bg-slate-950 border-slate-800 text-slate-400'
                }`}>
                  <input
                    type="radio"
                    name="strategy"
                    checked={settings.portConflictStrategy === 'warn'}
                    onChange={() => setSettings({ ...settings, portConflictStrategy: 'warn' })}
                    className="hidden"
                  />
                  <span>Nur Warnen & Stopp</span>
                </label>
              </div>
            </div>
          </div>
        </div>

        {/* 3. SECTION: SICHERHEIT & AUTORISIERTE HOSTS */}
        <div className="bg-[#0E1524]/80 backdrop-blur-md border border-slate-800/80 rounded-3xl p-6 space-y-5 shadow-2xl">
          <div className="flex items-center gap-3 border-b border-slate-800/80 pb-3">
            <div className="w-10 h-10 rounded-2xl bg-purple-500/10 border border-purple-500/30 flex items-center justify-center text-purple-400 glow-purple">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-100">3. Autorisierte Hosts & CORS</h3>
              <p className="text-[11px] text-slate-400">Festlegen, welche Webseiten auf diesen PC zugreifen dürfen</p>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Sicherheits-Token (<code className="text-purple-400 font-mono">X-Bridge-Token</code>)
              </label>
              <div className="flex items-center gap-2">
                <div className="relative flex-1">
                  <Key className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={settings.securityToken}
                    onChange={(e) => setSettings({ ...settings, securityToken: e.target.value })}
                    className="w-full bg-[#080D17] border border-slate-700/80 focus:border-purple-500 rounded-xl pl-9 pr-3.5 py-2 text-xs font-mono text-slate-100 outline-none shadow-inner"
                  />
                </div>
                <button
                  onClick={handleGenerateToken}
                  className="bg-[#080D17] hover:bg-slate-800 text-slate-300 text-xs font-medium px-3.5 py-2 rounded-xl transition-all whitespace-nowrap border border-slate-800 shadow-inner"
                >
                  Neu Generieren
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Autorisierte Web-Hosts (CORS Whitelist)
              </label>
              <div className="flex items-center gap-2 mb-2.5">
                <input
                  type="text"
                  value={newOriginInput}
                  onChange={(e) => setNewOriginInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleAddOrigin()}
                  placeholder="https://dbstudio.app oder https://meine-domain.com"
                  className="flex-1 bg-[#080D17] border border-slate-700/80 focus:border-purple-500 rounded-xl px-3.5 py-2 text-xs text-slate-100 outline-none shadow-inner placeholder:text-slate-600 font-mono"
                />
                <button
                  onClick={handleAddOrigin}
                  className="flex items-center gap-1 bg-purple-600/30 hover:bg-purple-600/50 text-purple-300 text-xs font-bold px-3.5 py-2 rounded-xl transition-all border border-purple-500/30 shadow-sm"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Hinzufügen</span>
                </button>
              </div>

              <div className="flex flex-wrap gap-1.5 max-h-28 overflow-y-auto p-1">
                {settings.allowedOrigins.map((origin) => (
                  <span
                    key={origin}
                    className="inline-flex items-center gap-1.5 bg-[#080D17] border border-slate-800 text-slate-300 px-3 py-1 rounded-xl text-[11px] font-mono shadow-inner"
                  >
                    <span>{origin}</span>
                    <button
                      onClick={() => handleRemoveOrigin(origin)}
                      className="text-slate-500 hover:text-rose-400 p-0.5 rounded transition-colors"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* 4. SECTION: GIT INTEGRATION (GITHUB & GITLAB DUAL-SWITCH) */}
        <div className="bg-[#0E1524]/80 backdrop-blur-md border border-slate-800/80 rounded-3xl p-6 space-y-6 shadow-2xl lg:col-span-2">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800/80 pb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-orange-500/10 border border-orange-500/30 flex items-center justify-center text-orange-400 glow-amber">
                <GitBranch className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
                  <span>4. Git Remote-Repositories & Versionierung</span>
                  <span className="text-[10px] font-mono uppercase bg-orange-500/15 text-orange-300 px-2 py-0.5 rounded-full border border-orange-500/30 font-semibold">
                    GitHub & GitLab Support
                  </span>
                </h3>
                <p className="text-xs text-slate-400">Automatische Initialisierung, Commit-Verwaltung und Remote-Repository-Erstellung</p>
              </div>
            </div>

            {/* Master Git Toggle */}
            <div className="flex items-center gap-3 bg-[#080D17] border border-slate-800 px-4 py-2 rounded-2xl shadow-inner">
              <span className="text-xs font-bold text-slate-300">Git Versionierung</span>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.git.enabled}
                  onChange={(e) => setSettings({
                    ...settings,
                    git: { ...settings.git, enabled: e.target.checked }
                  })}
                  className="sr-only peer"
                />
                <div className="w-9 h-5 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-gradient-to-r peer-checked:from-emerald-500 peer-checked:to-teal-500"></div>
              </label>
            </div>
          </div>

          {settings.git.enabled && (
            <div className="space-y-6">
              {/* Global Git Options Bar */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 bg-[#080D17] p-4 rounded-2xl border border-slate-800/80 shadow-inner">
                <label className="flex items-center gap-2.5 text-xs text-slate-300 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={settings.git.autoInit}
                    onChange={(e) => setSettings({
                      ...settings,
                      git: { ...settings.git, autoInit: e.target.checked }
                    })}
                    className="rounded border-slate-700 bg-slate-950 text-emerald-500 focus:ring-emerald-500 w-4 h-4"
                  />
                  <span>Automatisch <code className="text-emerald-400 font-mono">git init</code> bei neuem Projekt</span>
                </label>

                <label className="flex items-center gap-2.5 text-xs text-slate-300 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={settings.git.autoCommit}
                    onChange={(e) => setSettings({
                      ...settings,
                      git: { ...settings.git, autoCommit: e.target.checked }
                    })}
                    className="rounded border-slate-700 bg-slate-950 text-emerald-500 focus:ring-emerald-500 w-4 h-4"
                  />
                  <span>Automatisch Committen nach Übertragung</span>
                </label>

                <label className="flex items-center gap-2.5 text-xs text-slate-300 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={settings.git.autoCreateRemoteRepo ?? true}
                    onChange={(e) => setSettings({
                      ...settings,
                      git: { ...settings.git, autoCreateRemoteRepo: e.target.checked }
                    })}
                    className="rounded border-slate-700 bg-slate-950 text-emerald-500 focus:ring-emerald-500 w-4 h-4"
                  />
                  <span>Remote-Repo auf Server automatisch anlegen</span>
                </label>
              </div>

              {/* DUAL SWITCHES GRID: GITHUB & GITLAB */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {/* 1. GITHUB SWITCH & BOX */}
                <div className={`rounded-3xl border transition-all p-5 shadow-xl flex flex-col justify-between ${
                  (settings.git.github?.enabled ?? true)
                    ? 'bg-[#0E1524]/90 border-emerald-500/40 shadow-emerald-950/20'
                    : 'bg-[#080D17]/80 border-slate-800/80 opacity-75'
                }`}>
                  <div className="space-y-4">
                    {/* Header with Switch */}
                    <div className="flex items-center justify-between gap-3 border-b border-slate-800 pb-3">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-slate-900 border border-slate-700 flex items-center justify-center text-white shadow-inner">
                          <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                            <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z"/>
                          </svg>
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="font-bold text-sm text-slate-100">GitHub Provider</h4>
                            {(settings.git.github?.enabled ?? true) && (
                              <span className="text-[10px] font-mono bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded-full border border-emerald-500/30 font-bold">
                                Aktiv
                              </span>
                            )}
                          </div>
                          <p className="text-[11px] text-slate-400">api.github.com (Cloud)</p>
                        </div>
                      </div>

                      {/* Switch 1: GitHub */}
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={settings.git.github?.enabled ?? true}
                          onChange={(e) => setSettings({
                            ...settings,
                            git: {
                              ...settings.git,
                              github: {
                                ...(settings.git.github || { token: '', defaultOrg: '' }),
                                enabled: e.target.checked
                              }
                            }
                          })}
                          className="sr-only peer"
                        />
                        <div className="w-8 h-4 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-3 after:w-3 after:transition-all peer-checked:bg-emerald-500"></div>
                      </label>
                    </div>

                    {/* GitHub Fields */}
                    <div className="space-y-3">
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                          Personal Access Token (PAT)
                        </label>
                        <div className="relative">
                          <input
                            type={showGithubToken ? 'text' : 'password'}
                            value={settings.git.github?.token || settings.git.personalAccessToken || ''}
                            onChange={(e) => setSettings({
                              ...settings,
                              git: {
                                ...settings.git,
                                personalAccessToken: e.target.value,
                                github: {
                                  ...(settings.git.github || { enabled: true, defaultOrg: '' }),
                                  token: e.target.value
                                }
                              }
                            })}
                            placeholder="ghp_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
                            disabled={!(settings.git.github?.enabled ?? true)}
                            className="w-full bg-[#080D17] border border-slate-700/80 focus:border-emerald-500 rounded-xl pl-3 pr-9 py-2 text-xs text-slate-100 outline-none font-mono shadow-inner disabled:opacity-50"
                          />
                          <button
                            type="button"
                            onClick={() => setShowGithubToken(!showGithubToken)}
                            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200"
                          >
                            {showGithubToken ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                          </button>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                        <div>
                          <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                            Organisation / User (optional)
                          </label>
                          <input
                            type="text"
                            value={settings.git.github?.defaultOrg || ''}
                            onChange={(e) => setSettings({
                              ...settings,
                              git: {
                                ...settings.git,
                                github: {
                                  ...(settings.git.github || { enabled: true, token: '' }),
                                  defaultOrg: e.target.value
                                }
                              }
                            })}
                            placeholder="z. B. mein-team"
                            disabled={!(settings.git.github?.enabled ?? true)}
                            className="w-full bg-[#080D17] border border-slate-700/80 focus:border-emerald-500 rounded-xl px-3 py-1.5 text-xs text-slate-100 outline-none shadow-inner disabled:opacity-50"
                          />
                        </div>

                        <div className="flex flex-col justify-center space-y-1.5 pt-1 sm:pt-4">
                          <label className="flex items-center gap-2 text-[11px] text-slate-300 cursor-pointer select-none">
                            <input
                              type="checkbox"
                              checked={settings.git.github?.isPrivate ?? true}
                              onChange={(e) => setSettings({
                                ...settings,
                                git: {
                                  ...settings.git,
                                  github: {
                                    ...(settings.git.github || { enabled: true, token: '' }),
                                    isPrivate: e.target.checked
                                  }
                                }
                              })}
                              disabled={!(settings.git.github?.enabled ?? true)}
                              className="rounded border-slate-700 bg-slate-950 text-emerald-500"
                            />
                            <span>Privates Repo anlegen</span>
                          </label>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* GitHub Test & Status */}
                  <div className="pt-4 mt-4 border-t border-slate-800/80 space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <button
                        onClick={handleTestGithub}
                        disabled={testingGithub || !(settings.git.github?.enabled ?? true)}
                        className="bg-emerald-500/15 hover:bg-emerald-500/25 disabled:opacity-40 text-emerald-300 text-xs font-bold px-3.5 py-1.5 rounded-xl transition-all border border-emerald-500/30 flex items-center gap-1.5 glow-emerald shadow-sm"
                      >
                        {testingGithub ? <RefreshCw className="w-3 h-3 animate-spin" /> : <Zap className="w-3 h-3 text-emerald-400" />}
                        <span>GitHub Verbindung testen</span>
                      </button>
                    </div>

                    {githubTestResult && (
                      <div className={`p-2.5 rounded-xl text-xs flex items-center gap-2 shadow-inner ${
                        githubTestResult.success 
                          ? 'bg-emerald-500/15 border border-emerald-500/30 text-emerald-300'
                          : 'bg-rose-500/15 border border-rose-500/30 text-rose-300'
                      }`}>
                        {githubTestResult.success ? <CheckCircle2 className="w-3.5 h-3.5 shrink-0 text-emerald-400" /> : <AlertTriangle className="w-3.5 h-3.5 shrink-0 text-rose-400" />}
                        <span className="font-mono text-[11px]">{githubTestResult.message || githubTestResult.error}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* 2. GITLAB SWITCH & BOX */}
                <div className={`rounded-3xl border transition-all p-5 shadow-xl flex flex-col justify-between ${
                  (settings.git.gitlab?.enabled ?? false)
                    ? 'bg-[#0E1524]/90 border-orange-500/40 shadow-orange-950/20'
                    : 'bg-[#080D17]/80 border-slate-800/80 opacity-75'
                }`}>
                  <div className="space-y-4">
                    {/* Header with Switch */}
                    <div className="flex items-center justify-between gap-3 border-b border-slate-800 pb-3">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-slate-900 border border-slate-700 flex items-center justify-center text-orange-400 shadow-inner">
                          <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                            <path d="M23.955 13.587l-1.342-4.135-2.664-8.189c-.135-.417-.674-.417-.809 0L16.476 9.45H7.524L4.86 1.263c-.135-.417-.674-.417-.809 0L1.387 9.452.045 13.587c-.29.892.029 1.872.784 2.421l11.171 8.118 11.171-8.118c.755-.549 1.074-1.529.784-2.421z"/>
                          </svg>
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="font-bold text-sm text-slate-100">GitLab Provider</h4>
                            {(settings.git.gitlab?.enabled ?? false) && (
                              <span className="text-[10px] font-mono bg-orange-500/20 text-orange-300 px-2 py-0.5 rounded-full border border-orange-500/30 font-bold">
                                Aktiv
                              </span>
                            )}
                          </div>
                          <p className="text-[11px] text-slate-400">Cloud & Self-Hosted Server</p>
                        </div>
                      </div>

                      {/* Switch 2: GitLab */}
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={settings.git.gitlab?.enabled ?? false}
                          onChange={(e) => setSettings({
                            ...settings,
                            git: {
                              ...settings.git,
                              gitlab: {
                                ...(settings.git.gitlab || { token: '', serverUrl: 'https://gitlab.com', defaultNamespace: '' }),
                                enabled: e.target.checked
                              }
                            }
                          })}
                          className="sr-only peer"
                        />
                        <div className="w-8 h-4 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-3 after:w-3 after:transition-all peer-checked:bg-orange-500"></div>
                      </label>
                    </div>

                    {/* GitLab Fields */}
                    <div className="space-y-3">
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                          GitLab Server URL (Cloud oder Self-Hosted)
                        </label>
                        <input
                          type="text"
                          value={settings.git.gitlab?.serverUrl || 'https://gitlab.com'}
                          onChange={(e) => setSettings({
                            ...settings,
                            git: {
                              ...settings.git,
                              gitlab: {
                                ...(settings.git.gitlab || { token: '', defaultNamespace: '' }),
                                serverUrl: e.target.value
                              }
                            }
                          })}
                          placeholder="https://gitlab.com oder https://git.firma.de"
                          disabled={!(settings.git.gitlab?.enabled ?? false)}
                          className="w-full bg-[#080D17] border border-slate-700/80 focus:border-orange-500 rounded-xl px-3 py-1.5 text-xs text-slate-100 outline-none font-mono shadow-inner disabled:opacity-50"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                          Personal Access Token
                        </label>
                        <div className="relative">
                          <input
                            type={showGitlabToken ? 'text' : 'password'}
                            value={settings.git.gitlab?.token || ''}
                            onChange={(e) => setSettings({
                              ...settings,
                              git: {
                                ...settings.git,
                                gitlab: {
                                  ...(settings.git.gitlab || { serverUrl: 'https://gitlab.com', defaultNamespace: '' }),
                                  token: e.target.value
                                }
                              }
                            })}
                            placeholder="glpat-xxxxxxxxxxxxxxxxxxxxxxxxxxxx"
                            disabled={!(settings.git.gitlab?.enabled ?? false)}
                            className="w-full bg-[#080D17] border border-slate-700/80 focus:border-orange-500 rounded-xl pl-3 pr-9 py-2 text-xs text-slate-100 outline-none font-mono shadow-inner disabled:opacity-50"
                          />
                          <button
                            type="button"
                            onClick={() => setShowGitlabToken(!showGitlabToken)}
                            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200"
                          >
                            {showGitlabToken ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                          </button>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                        <div>
                          <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                            Namespace / Gruppe (optional)
                          </label>
                          <input
                            type="text"
                            value={settings.git.gitlab?.defaultNamespace || ''}
                            onChange={(e) => setSettings({
                              ...settings,
                              git: {
                                ...settings.git,
                                gitlab: {
                                  ...(settings.git.gitlab || { serverUrl: 'https://gitlab.com', token: '' }),
                                  defaultNamespace: e.target.value
                                }
                              }
                            })}
                            placeholder="z. B. gruppen-name oder 12345"
                            disabled={!(settings.git.gitlab?.enabled ?? false)}
                            className="w-full bg-[#080D17] border border-slate-700/80 focus:border-orange-500 rounded-xl px-3 py-1.5 text-xs text-slate-100 outline-none shadow-inner disabled:opacity-50"
                          />
                        </div>

                        <div className="flex flex-col justify-center space-y-1.5 pt-1 sm:pt-4">
                          <label className="flex items-center gap-2 text-[11px] text-slate-300 cursor-pointer select-none">
                            <input
                              type="checkbox"
                              checked={settings.git.gitlab?.isPrivate ?? true}
                              onChange={(e) => setSettings({
                                ...settings,
                                git: {
                                  ...settings.git,
                                  gitlab: {
                                    ...(settings.git.gitlab || { serverUrl: 'https://gitlab.com', token: '' }),
                                    isPrivate: e.target.checked
                                  }
                                }
                              })}
                              disabled={!(settings.git.gitlab?.enabled ?? false)}
                              className="rounded border-slate-700 bg-slate-950 text-orange-500"
                            />
                            <span>Privates Repo anlegen</span>
                          </label>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* GitLab Test & Status */}
                  <div className="pt-4 mt-4 border-t border-slate-800/80 space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <button
                        onClick={handleTestGitlab}
                        disabled={testingGitlab || !(settings.git.gitlab?.enabled ?? false)}
                        className="bg-orange-500/15 hover:bg-orange-500/25 disabled:opacity-40 text-orange-300 text-xs font-bold px-3.5 py-1.5 rounded-xl transition-all border border-orange-500/30 flex items-center gap-1.5 glow-amber shadow-sm"
                      >
                        {testingGitlab ? <RefreshCw className="w-3 h-3 animate-spin" /> : <Zap className="w-3 h-3 text-orange-400" />}
                        <span>GitLab Verbindung testen</span>
                      </button>
                    </div>

                    {gitlabTestResult && (
                      <div className={`p-2.5 rounded-xl text-xs flex items-center gap-2 shadow-inner ${
                        gitlabTestResult.success 
                          ? 'bg-emerald-500/15 border border-emerald-500/30 text-emerald-300'
                          : 'bg-rose-500/15 border border-rose-500/30 text-rose-300'
                      }`}>
                        {gitlabTestResult.success ? <CheckCircle2 className="w-3.5 h-3.5 shrink-0 text-emerald-400" /> : <AlertTriangle className="w-3.5 h-3.5 shrink-0 text-rose-400" />}
                        <span className="font-mono text-[11px]">{gitlabTestResult.message || gitlabTestResult.error}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Fallback Remote URL */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Standard Fallback Remote URL (Optional für manuellen Git Push)
                </label>
                <input
                  type="text"
                  value={settings.git.defaultRemote}
                  onChange={(e) => setSettings({
                    ...settings,
                    git: { ...settings.git, defaultRemote: e.target.value }
                  })}
                  placeholder="https://github.com/user/mein-projekt.git"
                  className="w-full bg-[#080D17] border border-slate-700/80 focus:border-orange-500 rounded-xl px-3.5 py-2 text-xs font-mono text-slate-100 outline-none shadow-inner"
                />
              </div>
            </div>
          )}
        </div>

        {/* 5. SECTION: FTP & SFTP DEPLOYMENT CONTROL CENTER */}
        <div className="bg-[#0E1524]/80 backdrop-blur-md border border-slate-800/80 rounded-3xl p-6 space-y-6 shadow-2xl lg:col-span-2">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800/80 pb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 glow-sky">
                <Server className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
                  <span>5. FTP / FTPS & Webserver Deployment</span>
                  <span className="text-[10px] font-mono uppercase bg-cyan-500/15 text-cyan-300 px-2.5 py-0.5 rounded-full border border-cyan-500/30 font-semibold">
                    Intelligente Build-Erkennung
                  </span>
                </h3>
                <p className="text-xs text-slate-400">Automatischer und manueller Upload von Frontend-Dist-Dateien & .NET-Releases auf entfernte Webserver</p>
              </div>
            </div>

            <div className="flex items-center gap-3 bg-[#080D17] border border-slate-800 px-4 py-2 rounded-2xl shadow-inner">
              <span className="text-xs font-bold text-slate-300">FTP Server-Upload</span>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.ftp.enabled}
                  onChange={(e) => setSettings({
                    ...settings,
                    ftp: { ...settings.ftp, enabled: e.target.checked }
                  })}
                  className="sr-only peer"
                />
                <div className="w-9 h-5 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-gradient-to-r peer-checked:from-cyan-500 peer-checked:to-blue-500"></div>
              </label>
            </div>
          </div>

          {settings.ftp.enabled && (
            <div className="space-y-6">
              {/* Protocol Selection & Credentials */}
              <div className="bg-[#080D17] p-5 rounded-3xl border border-slate-800/80 space-y-4 shadow-inner">
                {/* Protocol Tabs */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">Übertragungs-Protokoll</label>
                  <div className="flex flex-wrap gap-2">
                    {[
                      { id: 'ftp', label: 'Standard FTP', port: 21, desc: 'Port 21 (Klartext / Standard)' },
                      { id: 'ftps', label: 'FTPS (Explizit SSL/TLS)', port: 21, desc: 'Port 21 (Verschlüsselt, Empfohlen)' },
                      { id: 'sftp', label: 'SFTP (SSH File Transfer)', port: 22, desc: 'Port 22 (SSH Key/Passwort)' }
                    ].map((p) => {
                      const isActive = (settings.ftp.protocol || 'ftp') === p.id;
                      return (
                        <button
                          key={p.id}
                          type="button"
                          onClick={() => setSettings({
                            ...settings,
                            ftp: {
                              ...settings.ftp,
                              protocol: p.id as any,
                              port: p.port
                            }
                          })}
                          className={`flex-1 min-w-[200px] text-left p-3 rounded-2xl border transition-all ${
                            isActive
                              ? 'bg-cyan-500/15 border-cyan-500/40 text-cyan-300 glow-sky'
                              : 'bg-slate-950/60 border-slate-800/80 text-slate-400 hover:text-slate-200'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-xs">{p.label}</span>
                            <span className="text-[10px] font-mono opacity-80">Port {p.port}</span>
                          </div>
                          <p className="text-[10px] text-slate-500 mt-0.5">{p.desc}</p>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Host & Port */}
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                  <div className="sm:col-span-3">
                    <label className="block text-xs font-semibold text-slate-300 mb-1">Server Hostname / IP-Adresse</label>
                    <input
                      type="text"
                      value={settings.ftp.host}
                      onChange={(e) => setSettings({
                        ...settings,
                        ftp: { ...settings.ftp, host: e.target.value }
                      })}
                      placeholder="ftp.meinedomain.de oder 192.168.1.100"
                      className="w-full bg-[#0B0F17] border border-slate-700/80 focus:border-cyan-500 rounded-xl px-3.5 py-2 text-xs text-slate-100 outline-none shadow-inner"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">Port</label>
                    <input
                      type="number"
                      value={settings.ftp.port}
                      onChange={(e) => setSettings({
                        ...settings,
                        ftp: { ...settings.ftp, port: parseInt(e.target.value, 10) || 21 }
                      })}
                      className="w-full bg-[#0B0F17] border border-slate-700/80 focus:border-cyan-500 rounded-xl px-3.5 py-2 text-xs font-mono text-slate-100 outline-none shadow-inner"
                    />
                  </div>
                </div>

                {/* Credentials */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">Benutzername</label>
                    <input
                      type="text"
                      value={settings.ftp.username}
                      onChange={(e) => setSettings({
                        ...settings,
                        ftp: { ...settings.ftp, username: e.target.value }
                      })}
                      placeholder="ftp-user"
                      className="w-full bg-[#0B0F17] border border-slate-700/80 focus:border-cyan-500 rounded-xl px-3.5 py-2 text-xs text-slate-100 outline-none shadow-inner"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">Passwort / SSH Key</label>
                    <div className="relative">
                      <input
                        type={showFtpPassword ? 'text' : 'password'}
                        value={settings.ftp.password || ''}
                        onChange={(e) => setSettings({
                          ...settings,
                          ftp: { ...settings.ftp, password: e.target.value }
                        })}
                        placeholder="••••••••••••"
                        className="w-full bg-[#0B0F17] border border-slate-700/80 focus:border-cyan-500 rounded-xl pl-3.5 pr-9 py-2 text-xs text-slate-100 outline-none shadow-inner"
                      />
                      <button
                        type="button"
                        onClick={() => setShowFtpPassword(!showFtpPassword)}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200"
                      >
                        {showFtpPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Remote Directory & Presets */}
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Remote Zielordner auf dem Server</label>
                  <div className="flex flex-col sm:flex-row gap-2">
                    <input
                      type="text"
                      value={settings.ftp.remotePath}
                      onChange={(e) => setSettings({
                        ...settings,
                        ftp: { ...settings.ftp, remotePath: e.target.value }
                      })}
                      placeholder="/public_html oder /var/www/html/app"
                      className="flex-1 bg-[#0B0F17] border border-slate-700/80 focus:border-cyan-500 rounded-xl px-3.5 py-2 text-xs font-mono text-slate-100 outline-none shadow-inner"
                    />
                    <div className="flex items-center gap-1.5 flex-wrap">
                      {['/', '/public_html', '/httpdocs', '/var/www/html', '/web'].map((preset) => (
                        <button
                          key={preset}
                          type="button"
                          onClick={() => setSettings({
                            ...settings,
                            ftp: { ...settings.ftp, remotePath: preset }
                          })}
                          className="bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-slate-200 text-[10px] font-mono px-2.5 py-1.5 rounded-lg border border-slate-800 transition-colors"
                        >
                          {preset}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Test Connection Button */}
                <div className="pt-2 flex items-center justify-between gap-3 flex-wrap">
                  <div className="flex items-center gap-4">
                    <label className="flex items-center gap-2 text-xs text-slate-300 select-none cursor-pointer">
                      <input
                        type="checkbox"
                        checked={settings.ftp.cleanRemoteBeforeUpload ?? false}
                        onChange={(e) => setSettings({
                          ...settings,
                          ftp: { ...settings.ftp, cleanRemoteBeforeUpload: e.target.checked }
                        })}
                        className="rounded border-slate-700 bg-slate-950 text-cyan-500 focus:ring-cyan-500 w-4 h-4"
                      />
                      <span>Vor dem Upload Remote-Ordner bereinigen</span>
                    </label>
                    <label className="flex items-center gap-2 text-xs text-slate-300 select-none cursor-pointer">
                      <input
                        type="checkbox"
                        checked={settings.ftp.autoDeployOnBuild}
                        onChange={(e) => setSettings({
                          ...settings,
                          ftp: { ...settings.ftp, autoDeployOnBuild: e.target.checked }
                        })}
                        className="rounded border-slate-700 bg-slate-950 text-cyan-500 focus:ring-cyan-500 w-4 h-4"
                      />
                      <span>Auto-Upload nach DB Studio Deployment</span>
                    </label>
                  </div>

                  <button
                    onClick={handleTestFtp}
                    disabled={testingFtp}
                    className="bg-cyan-600/20 hover:bg-cyan-600/30 text-cyan-300 border border-cyan-500/30 px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-sm glow-sky flex items-center gap-2"
                  >
                    {testingFtp ? <RefreshCw className="w-3.5 h-3.5 animate-spin text-cyan-400" /> : <Zap className="w-3.5 h-3.5 text-cyan-400" />}
                    <span>FTP Verbindung testen</span>
                  </button>
                </div>

                {/* Test Result Feedback */}
                {ftpTestResult && (
                  <div className={`p-4 rounded-2xl text-xs shadow-inner space-y-2 ${
                    ftpTestResult.success 
                      ? 'bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 glow-emerald' 
                      : 'bg-rose-500/15 border border-rose-500/30 text-rose-300'
                  }`}>
                    <div className="flex items-center gap-2 font-bold">
                      {ftpTestResult.success ? <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" /> : <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />}
                      <span>{ftpTestResult.message || ftpTestResult.error}</span>
                    </div>

                    {ftpTestResult.success && ftpTestResult.remoteFiles && ftpTestResult.remoteFiles.length > 0 && (
                      <div className="pt-2 border-t border-emerald-500/20 space-y-1">
                        <span className="text-[10px] text-emerald-400/80 font-bold uppercase tracking-wider">Remote Verzeichnisinhalt:</span>
                        <div className="flex flex-wrap gap-1.5 font-mono text-[11px]">
                          {ftpTestResult.remoteFiles.map((rf, idx) => (
                            <span key={idx} className="bg-[#080D17] border border-emerald-500/30 px-2 py-0.5 rounded-md text-emerald-200 flex items-center gap-1">
                              {rf.type === 'folder' ? <Folder className="w-3 h-3 text-emerald-400" /> : <FileCode className="w-3 h-3 text-cyan-400" />}
                              <span>{rf.name}</span>
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* LIVE FTP PROJECT UPLOAD ENGINE (DATEI-ANSPRACHE & SCOPE) */}
              <div className="bg-[#080D17] p-5 rounded-3xl border border-slate-800/80 space-y-4 shadow-inner">
                <div className="flex items-center justify-between gap-3 border-b border-slate-800 pb-3 flex-wrap">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 flex items-center justify-center">
                      <UploadCloud className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="font-bold text-sm text-slate-100">Sofort-Upload: Projekt via FTP auf Webserver übertragen</h4>
                      <p className="text-[11px] text-slate-400">Wählen Sie ein Projekt aus. Die Bridge erkennt automatisch die kompilierten Web-Assets.</p>
                    </div>
                  </div>

                  {/* Project Selector */}
                  <div className="flex items-center gap-2">
                    <select
                      value={selectedFtpProjectId}
                      onChange={(e) => handleSelectFtpProject(e.target.value)}
                      className="bg-[#0B0F17] border border-slate-700/80 text-slate-200 text-xs rounded-xl px-3 py-1.5 outline-none font-semibold focus:border-cyan-500"
                    >
                      {savedProjects.length === 0 ? (
                        <option value="">Keine Projekte im Workspace</option>
                      ) : (
                        savedProjects.map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.name} ({p.framework})
                          </option>
                        ))
                      )}
                    </select>
                  </div>
                </div>

                {/* Upload Scope Cards */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
                    Upload-Umfang (Welche Dateien ansprechen?)
                  </label>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    {[
                      {
                        id: 'auto',
                        title: '🚀 Smart-Build (Empfohlen)',
                        desc: 'Lädt automatisch den `dist/`- oder `.NET publish/`-Ordner hoch'
                      },
                      {
                        id: 'web_dist',
                        title: '🌐 Nur Web-Assets (dist/)',
                        desc: 'Kompilierte HTML, JS, CSS und Media-Dateien für den Webserver'
                      },
                      {
                        id: 'clean_source',
                        title: '📦 Bereinigter Quellcode',
                        desc: 'Projektdateien ohne Ballast (ohne node_modules, .git, bin/obj)'
                      }
                    ].map((scope) => {
                      const isSelected = selectedUploadScope === scope.id;
                      return (
                        <button
                          key={scope.id}
                          type="button"
                          onClick={() => setSelectedUploadScope(scope.id)}
                          className={`text-left p-3.5 rounded-2xl border transition-all ${
                            isSelected
                              ? 'bg-cyan-500/15 border-cyan-500/40 text-cyan-200 glow-sky'
                              : 'bg-[#0B0F17] border-slate-800 text-slate-400 hover:text-slate-200'
                          }`}
                        >
                          <div className="font-bold text-xs mb-1">{scope.title}</div>
                          <p className="text-[11px] text-slate-500 leading-relaxed">{scope.desc}</p>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Detected Candidates Preview */}
                {detectedUploadCandidates.length > 0 && (
                  <div className="bg-[#0B0F17] p-3.5 rounded-2xl border border-slate-800 space-y-2">
                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Erkannte Datei-Pakete:</span>
                    <div className="space-y-1.5">
                      {detectedUploadCandidates.map((cand, i) => (
                        <div key={i} className="flex items-center justify-between text-xs font-mono p-2 rounded-xl bg-slate-950/60 border border-slate-800/80">
                          <div className="flex items-center gap-2">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                            <span className="text-slate-200 font-semibold">{cand.label}</span>
                          </div>
                          <div className="flex items-center gap-3 text-slate-400 text-[11px]">
                            <span>{cand.fileCount} Dateien</span>
                            <span className="text-cyan-400 font-bold">{(cand.totalBytes / (1024 * 1024)).toFixed(2)} MB</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Action Upload Button */}
                <div className="flex items-center justify-between gap-3 pt-2">
                  <span className="text-xs text-slate-400 font-mono">
                    Ziel: <strong className="text-cyan-300">{settings.ftp.host || 'Kein Host'}:{settings.ftp.remotePath || '/'}</strong>
                  </span>

                  <button
                    onClick={handleUploadViaFtp}
                    disabled={isUploadingFtp || !selectedFtpProjectId || !settings.ftp.host}
                    className="bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 disabled:opacity-40 text-white text-xs font-bold px-5 py-2.5 rounded-2xl transition-all shadow-lg shadow-cyan-950/50 flex items-center gap-2"
                  >
                    {isUploadingFtp ? <RefreshCw className="w-4 h-4 animate-spin" /> : <UploadCloud className="w-4 h-4" />}
                    <span>{isUploadingFtp ? 'Übertrage Dateien...' : 'Projekt jetzt via FTP hochladen'}</span>
                  </button>
                </div>

                {/* Upload Status Feedback */}
                {ftpUploadResult && (
                  <div className={`p-4 rounded-2xl text-xs shadow-inner flex items-center gap-2.5 ${
                    ftpUploadResult.success 
                      ? 'bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 glow-emerald' 
                      : 'bg-rose-500/15 border border-rose-500/30 text-rose-300'
                  }`}>
                    {ftpUploadResult.success ? <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" /> : <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />}
                    <span className="font-mono">{ftpUploadResult.message || ftpUploadResult.error}</span>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* 6. SECTION: WINDOWS SYSTEM AUTOSTART & BACKGROUND DAEMON (PHASE 2) */}
        <div className="bg-[#0E1524]/80 backdrop-blur-md border border-slate-800/80 rounded-3xl p-6 space-y-4 shadow-2xl">
          <div className="flex items-center justify-between gap-3 border-b border-slate-800/80 pb-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center text-indigo-400 glow-purple">
                <HardDrive className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
                  <span>6. Windows Autostart & System-Integration</span>
                  <span className="text-[10px] font-mono uppercase bg-indigo-500/15 text-indigo-300 px-2 py-0.5 rounded-full border border-indigo-500/30">
                    Phase 2
                  </span>
                </h3>
                <p className="text-xs text-slate-400">Bridge beim Hochfahren von Windows automatisch im Hintergrund starten</p>
              </div>
            </div>

            <button
              onClick={handleToggleAutostart}
              disabled={isTogglingAutostart || !autostartStatus.supported}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 shadow-sm ${
                autostartStatus.enabled
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 glow-emerald'
                  : 'bg-slate-900 hover:bg-slate-800 text-slate-400 border border-slate-800'
              }`}
            >
              {isTogglingAutostart ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Zap className="w-3.5 h-3.5 text-indigo-400" />}
              <span>{autostartStatus.enabled ? 'Autostart Aktiviert' : 'Autostart Aktivieren'}</span>
            </button>
          </div>

          <div className="bg-[#080D17] p-3.5 rounded-2xl border border-slate-800 text-xs font-mono text-slate-300 flex items-center justify-between">
            <span>Status: <strong>{autostartStatus.message || 'Prüfe Windows Task Scheduler...'}</strong></span>
            <span className="text-[11px] text-slate-500">Aufgabenplanung: DBStudioBridgeDaemon</span>
          </div>
        </div>

        {/* 7. SECTION: CI/CD PIPELINE GENERATOR (PHASE 6) */}
        <div className="bg-[#0E1524]/80 backdrop-blur-md border border-slate-800/80 rounded-3xl p-6 space-y-4 shadow-2xl">
          <div className="flex items-center justify-between gap-3 border-b border-slate-800/80 pb-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 glow-amber">
                <GitBranch className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
                  <span>7. CI/CD Workflow & Actions Generator</span>
                  <span className="text-[10px] font-mono uppercase bg-amber-500/15 text-amber-300 px-2 py-0.5 rounded-full border border-amber-500/30">
                    Phase 6
                  </span>
                </h3>
                <p className="text-xs text-slate-400">Automatische Erstellung von `.github/workflows` oder `.gitlab-ci.yml` für Ihre Repositories</p>
              </div>
            </div>
          </div>

          <div className="bg-[#080D17] p-4 rounded-2xl border border-slate-800 space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Ziel-Projekt</label>
                <select
                  value={selectedPipelineProject}
                  onChange={(e) => setSelectedPipelineProject(e.target.value)}
                  className="w-full bg-[#0B0F17] border border-slate-700/80 text-slate-200 text-xs rounded-xl px-3 py-2 outline-none font-semibold focus:border-amber-500"
                >
                  {savedProjects.map((p) => (
                    <option key={p.id} value={p.id}>{p.name} ({p.framework})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">CI/CD Plattform</label>
                <div className="grid grid-cols-3 gap-2">
                  {(['github', 'gitlab', 'both'] as const).map((prov) => (
                    <button
                      key={prov}
                      type="button"
                      onClick={() => setSelectedPipelineProvider(prov)}
                      className={`p-2 rounded-xl text-xs font-bold border transition-all text-center uppercase ${
                        selectedPipelineProvider === prov
                          ? 'bg-amber-500/20 border-amber-500/40 text-amber-300 glow-amber'
                          : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      {prov}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between pt-2">
              <span className="text-[11px] text-slate-500 font-mono">Inkludiert: .NET 10 Build, Vite Frontend Compile & FTP Deploy</span>
              <button
                onClick={handleGeneratePipeline}
                disabled={isGeneratingPipeline || !selectedPipelineProject}
                className="bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 disabled:opacity-40 text-white text-xs font-bold px-4 py-2 rounded-xl transition-all shadow-md shadow-amber-950/50 flex items-center gap-1.5"
              >
                {isGeneratingPipeline ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
                <span>Pipeline generieren</span>
              </button>
            </div>

            {pipelineResult && (
              <div className={`p-3 rounded-xl text-xs font-mono flex items-center gap-2 ${
                pipelineResult.success 
                  ? 'bg-emerald-500/15 border border-emerald-500/30 text-emerald-300' 
                  : 'bg-rose-500/15 border border-rose-500/30 text-rose-300'
              }`}>
                {pipelineResult.success ? <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" /> : <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />}
                <span>{pipelineResult.message || pipelineResult.error}</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
