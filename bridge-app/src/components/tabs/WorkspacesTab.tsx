import React, { useState, useEffect } from 'react';
import { 
  Folder, 
  HardDrive, 
  Save, 
  RefreshCw, 
  CheckCircle2, 
  FolderGit2, 
  Sparkles, 
  Package, 
  Play, 
  FolderOpen, 
  RotateCw, 
  Check, 
  ExternalLink,
  Plus,
  X,
  Layers,
  Cpu
} from 'lucide-react';
import { bridgeApi } from '../../services/bridgeApi';
import { LocalProject } from '../../types/bridge';

export const WorkspacesTab: React.FC = () => {
  const [workspacePath, setWorkspacePath] = useState('C:\\_DEV\\dbstudio_bridge\\Projects');
  const [cleanBuildOnDeploy, setCleanBuildOnDeploy] = useState(true);
  const [autoKillPortConflicts, setAutoKillPortConflicts] = useState(true);
  const [isSaved, setIsSaved] = useState(false);
  const [savedProjects, setSavedProjects] = useState<LocalProject[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [iconSyncStatus, setIconSyncStatus] = useState<string | null>(null);
  const [packagingState, setPackagingState] = useState<Record<string, { isBuilding: boolean; installerPath?: string; message?: string }>>({});

  // Phase 5: Template Scaffolder Modal state
  const [showTemplateModal, setShowTemplateModal] = useState(false);
  const [templates, setTemplates] = useState<any[]>([]);
  const [selectedTemplateId, setSelectedTemplateId] = useState('dotnet_react');
  const [newProjectName, setNewProjectName] = useState('');
  const [newBackendPort, setNewBackendPort] = useState(5000);
  const [newFrontendPort, setNewFrontendPort] = useState(3000);
  const [isScaffolding, setIsScaffolding] = useState(false);
  const [scaffoldMessage, setScaffoldMessage] = useState<string | null>(null);

  const loadData = async () => {
    try {
      setIsLoading(true);
      const settings = await bridgeApi.getSettings();
      if (settings?.projectsDir) {
        setWorkspacePath(settings.projectsDir);
      }
      const [projects, tmpls] = await Promise.all([
        bridgeApi.getProjects(),
        bridgeApi.getTemplates()
      ]);
      setSavedProjects(projects);
      setTemplates(tmpls);
    } catch (e) {
      // Leise ignorieren
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();

    // Phase 1: Realtime WebSocket Watcher listener
    let ws: WebSocket | null = null;
    try {
      ws = new WebSocket('ws://127.0.0.1:5050/logs');
      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data.type === 'workspace_change' || data.stream === 'workspace_change') {
            loadData();
          }
        } catch {
          // Ignore
        }
      };
    } catch {
      // Ignore
    }

    return () => {
      if (ws) ws.close();
    };
  }, []);

  const handleCreateFromTemplate = async () => {
    if (!newProjectName.trim()) {
      alert('Bitte einen Projektnamen eingeben.');
      return;
    }
    setIsScaffolding(true);
    setScaffoldMessage(null);
    try {
      const res = await bridgeApi.createProjectFromTemplate({
        templateId: selectedTemplateId,
        projectName: newProjectName.trim(),
        targetDir: workspacePath,
        backendPort: newBackendPort,
        frontendPort: newFrontendPort
      });
      if (res.success) {
        setScaffoldMessage(`Projekt '${newProjectName}' erfolgreich erstellt!`);
        setTimeout(() => {
          setShowTemplateModal(false);
          setNewProjectName('');
          setScaffoldMessage(null);
          loadData();
        }, 1200);
      } else {
        setScaffoldMessage(`Fehler: ${res.error}`);
      }
    } catch (e: any) {
      setScaffoldMessage(`Fehler: ${e.message}`);
    } finally {
      setIsScaffolding(false);
    }
  };

  const handleSave = async () => {
    try {
      const current = await bridgeApi.getSettings();
      await bridgeApi.saveSettings({
        ...current,
        projectsDir: workspacePath
      });
      setIsSaved(true);
      setTimeout(() => setIsSaved(false), 2500);
      loadData();
    } catch (e) {
      setIsSaved(false);
    }
  };

  const handleSyncIcons = async () => {
    setIconSyncStatus('Synchronisiere Icons...');
    try {
      const res = await bridgeApi.syncTauriIcons(workspacePath);
      if (res.success) {
        const count = res.restored?.length || 0;
        setIconSyncStatus(count > 0 ? `${count} Icons wiederhergestellt!` : 'Alle Icons sind aktuell!');
      } else {
        setIconSyncStatus('Fehler beim Icon-Download');
      }
    } catch (e) {
      setIconSyncStatus('Fehler beim Sync');
    }
    setTimeout(() => setIconSyncStatus(null), 3500);
  };

  const handleBuildAndRunInstaller = async (projectId: string) => {
    setPackagingState(prev => ({
      ...prev,
      [projectId]: { isBuilding: true, message: 'Erstelle Installationspaket...' }
    }));

    try {
      const res = await bridgeApi.buildPackage(projectId);
      if (res.success && res.installerPath) {
        setPackagingState(prev => ({
          ...prev,
          [projectId]: { isBuilding: false, installerPath: res.installerPath, message: `Installer bereit: ${res.installerName}` }
        }));
        // Installer direkt starten
        await bridgeApi.launchPackage(res.installerPath);
      } else {
        setPackagingState(prev => ({
          ...prev,
          [projectId]: { 
            isBuilding: false, 
            message: res.allInstallers && res.allInstallers.length > 0 
              ? 'Installer gebaut' 
              : 'Build abgeschlossen' 
          }
        }));
        if (res.packageDir) {
          await bridgeApi.openPackageFolder(res.packageDir);
        }
      }
    } catch (err: any) {
      setPackagingState(prev => ({
        ...prev,
        [projectId]: { isBuilding: false, message: `Fehler: ${err.message}` }
      }));
    }
  };

  const handleOpenFolder = async (folderPath: string) => {
    await bridgeApi.openPackageFolder(folderPath);
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Workspace Configuration Box */}
      <div className="bg-[#0E1524]/80 backdrop-blur-md border border-slate-800/80 rounded-3xl p-6 shadow-2xl space-y-4">
        <div className="flex items-center justify-between gap-3 mb-2 flex-wrap">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-emerald-500/20 via-emerald-600/10 to-teal-500/5 border border-emerald-500/30 text-emerald-400 flex items-center justify-center glow-emerald">
              <FolderGit2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white tracking-tight">Projekt- & Workspace-Verzeichnis</h3>
              <p className="text-xs text-slate-400">Geben Sie den lokalen Ordner an, in den empfangene Projekte extrahiert und ausgeführt werden.</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowTemplateModal(true)}
              className="flex items-center gap-1.5 bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/30 text-xs font-bold px-3.5 py-1.5 rounded-xl transition-all shadow-sm glow-emerald"
            >
              <Plus className="w-3.5 h-3.5 text-emerald-400" />
              <span>Neues Projekt erstellen</span>
            </button>

            <button
              onClick={handleSyncIcons}
              className="flex items-center gap-1.5 bg-[#080D17] hover:bg-slate-800 text-slate-200 border border-slate-800 text-xs font-semibold px-3.5 py-1.5 rounded-xl transition-all shadow-inner"
              title="DB Studio & Tauri Icons für alle Projekte prüfen und einbinden"
            >
              <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
              <span>{iconSyncStatus || 'Icons prüfen'}</span>
            </button>
          </div>
        </div>

        <div className="space-y-4 pt-1">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">Standard-Speicherort</label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Folder className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
                <input
                  type="text"
                  value={workspacePath}
                  onChange={(e) => setWorkspacePath(e.target.value)}
                  className="w-full bg-[#080D17] border border-slate-700/80 rounded-xl pl-9 pr-3.5 py-2 text-xs font-mono text-slate-100 focus:outline-none focus:border-emerald-500 shadow-inner transition-colors"
                />
              </div>
              <button 
                onClick={handleSave}
                className="flex items-center gap-1.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-bold px-4 py-2 rounded-xl transition-all shadow-md shadow-emerald-950/50"
              >
                {isSaved ? <CheckCircle2 className="w-4 h-4" /> : <Save className="w-4 h-4" />}
                <span>{isSaved ? 'Gespeichert!' : 'Speichern'}</span>
              </button>
            </div>
          </div>

          <div className="pt-3 border-t border-slate-800/80 space-y-2.5">
            <label className="flex items-center gap-3 text-xs text-slate-300 select-none cursor-pointer">
              <input
                type="checkbox"
                checked={cleanBuildOnDeploy}
                onChange={(e) => setCleanBuildOnDeploy(e.target.checked)}
                className="rounded border-slate-700 bg-slate-950 text-emerald-500 focus:ring-emerald-500 w-4 h-4"
              />
              <span>Bei Neuübertragung aus DB Studio vorherige Build-Artefakte (bin/obj) bereinigen</span>
            </label>

            <label className="flex items-center gap-3 text-xs text-slate-300 select-none cursor-pointer">
              <input
                type="checkbox"
                checked={autoKillPortConflicts}
                onChange={(e) => setAutoKillPortConflicts(e.target.checked)}
                className="rounded border-slate-700 bg-slate-950 text-emerald-500 focus:ring-emerald-500 w-4 h-4"
              />
              <span>Portkonflikte automatisch auflösen (vorherige Prozess-PID vor dem Start beenden)</span>
            </label>
          </div>
        </div>
      </div>

      {/* Local Projects on Disk */}
      <div>
        <div className="flex items-center justify-between mb-3 px-1">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">Lokale Projekte auf der Festplatte</h3>
          <div className="flex items-center gap-3">
            <button
              onClick={loadData}
              className="text-[11px] text-slate-400 hover:text-slate-200 flex items-center gap-1 transition-colors"
            >
              <RefreshCw className="w-3 h-3" />
              <span>Aktualisieren</span>
            </button>
            <span className="text-[11px] text-slate-500 font-mono">
              {savedProjects.length} {savedProjects.length === 1 ? 'Verzeichnis' : 'Verzeichnisse'} gefunden
            </span>
          </div>
        </div>

        {savedProjects.length === 0 ? (
          <div className="bg-[#0E1524]/80 backdrop-blur-md border border-slate-800/80 rounded-2xl p-10 text-center shadow-xl">
            <div className="w-12 h-12 rounded-2xl bg-[#080D17] border border-slate-800 flex items-center justify-center mx-auto mb-3 text-slate-500 shadow-inner">
              <FolderGit2 className="w-6 h-6 text-slate-400" />
            </div>
            <h4 className="text-sm font-bold text-slate-200">Momentan keine Projekte vorhanden</h4>
            <p className="text-xs text-slate-400 max-w-md mx-auto mt-1 leading-relaxed">
              Sobald Sie in der DB Studio Web-Applikation ein Projekt generieren oder lokal im Workspace-Verzeichnis ablegen, erscheint es hier mit Typ und Pfad.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {savedProjects.map((proj) => {
              const packState = packagingState[proj.id] || { isBuilding: false };

              return (
                <div key={proj.id} className="bg-[#0E1524]/80 backdrop-blur-md border border-slate-800/80 rounded-2xl p-5 shadow-xl flex flex-col justify-between hover:border-slate-700/80 transition-all">
                  <div>
                    <div className="flex items-center justify-between mb-2.5">
                      <h4 className="font-bold text-slate-100 text-sm truncate" title={proj.name}>{proj.name}</h4>
                      <span className="text-[10px] font-mono bg-slate-900 text-emerald-400 px-2.5 py-0.5 rounded-full border border-slate-800 shrink-0 ml-2 font-semibold">
                        {proj.framework}
                      </span>
                    </div>
                    <div className="bg-[#080D17] p-2.5 rounded-xl border border-slate-800/80 font-mono text-[11px] text-slate-400 truncate mb-3.5 flex items-center justify-between gap-2 shadow-inner" title={proj.path}>
                      <span className="truncate">{proj.path}</span>
                      <button 
                        onClick={() => handleOpenFolder(proj.path)}
                        className="text-slate-400 hover:text-slate-200 shrink-0 p-0.5 rounded transition-colors"
                        title="Ordner öffnen"
                      >
                        <FolderOpen className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  <div className="space-y-2.5 pt-3 border-t border-slate-800/80">
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                      <div className="flex items-center gap-2">
                        {/* 1. Dev / Live ausführen */}
                        <button
                          onClick={async () => {
                            await bridgeApi.launchProject(proj.id);
                          }}
                          className="flex items-center gap-1 bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-400 border border-emerald-500/30 px-3 py-1.5 rounded-xl text-xs font-bold transition-all glow-emerald shadow-sm"
                          title="Dev-Modus / Live-Prozess starten"
                        >
                          <Play className="w-3 h-3 fill-current" />
                          <span>Starten</span>
                        </button>

                        {/* 2. Installations-Package bauen & ausführen */}
                        <button
                          onClick={() => handleBuildAndRunInstaller(proj.id)}
                          disabled={packState.isBuilding}
                          className={`flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all shadow-sm ${
                            packState.isBuilding
                              ? 'bg-amber-500/20 text-amber-300 border-amber-500/40 animate-pulse'
                              : packState.installerPath
                              ? 'bg-sky-500/20 hover:bg-sky-500/30 text-sky-300 border-sky-500/40'
                              : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700'
                          }`}
                          title="Natives Installationspaket (MSI/EXE Setup) bauen und starten"
                        >
                          {packState.isBuilding ? (
                            <RotateCw className="w-3 h-3 animate-spin text-amber-400" />
                          ) : (
                            <Package className="w-3 h-3" />
                          )}
                          <span>
                            {packState.isBuilding 
                              ? 'Paketiere...' 
                              : packState.installerPath 
                              ? 'Installer starten' 
                              : 'Installer erstellen'}
                          </span>
                        </button>
                      </div>

                      <span className="text-[11px] text-slate-500 font-mono">
                        {proj.lastDeployed}
                      </span>
                    </div>

                    {packState.message && (
                      <div className="text-[10px] font-mono text-amber-400/90 bg-[#080D17] px-3 py-1.5 rounded-xl border border-slate-800 truncate flex items-center justify-between shadow-inner">
                        <span className="truncate">{packState.message}</span>
                        {packState.installerPath && (
                          <button
                            onClick={() => handleOpenFolder(packState.installerPath!)}
                            className="text-sky-400 hover:underline shrink-0 ml-2 font-bold"
                          >
                            Im Ordner anzeigen
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Phase 5: Template Scaffolder Modal */}
      {showTemplateModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#0E1524] border border-slate-700/80 rounded-3xl max-w-2xl w-full p-6 shadow-2xl space-y-5 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 flex items-center justify-center glow-emerald">
                  <Plus className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-100">Neues Projekt aus Vorlage erstellen</h3>
                  <p className="text-xs text-slate-400">Offline-Scaffold Engine für Fullstack- & Desktop-Projekte</p>
                </div>
              </div>
              <button
                onClick={() => setShowTemplateModal(false)}
                className="text-slate-400 hover:text-slate-200 p-1.5 rounded-xl bg-slate-900 border border-slate-800"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-4">
              {/* Template Selection */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">Projekt-Vorlage auswählen</label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {templates.map((tmpl) => {
                    const isSelected = selectedTemplateId === tmpl.id;
                    return (
                      <button
                        key={tmpl.id}
                        type="button"
                        onClick={() => {
                          setSelectedTemplateId(tmpl.id);
                          if (tmpl.defaultBackendPort) setNewBackendPort(tmpl.defaultBackendPort);
                          if (tmpl.defaultFrontendPort) setNewFrontendPort(tmpl.defaultFrontendPort);
                        }}
                        className={`text-left p-3 rounded-2xl border transition-all ${
                          isSelected
                            ? 'bg-emerald-500/15 border-emerald-500/50 text-emerald-300 glow-emerald shadow-sm'
                            : 'bg-[#080D17] border-slate-800/80 text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        <div className="font-bold text-xs text-slate-100 mb-1">{tmpl.name}</div>
                        <p className="text-[11px] text-slate-400 leading-relaxed">{tmpl.description}</p>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Project Name */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Projektname</label>
                <input
                  type="text"
                  value={newProjectName}
                  onChange={(e) => setNewProjectName(e.target.value)}
                  placeholder="MeinNeuesProjekt"
                  className="w-full bg-[#080D17] border border-slate-700/80 focus:border-emerald-500 rounded-xl px-3.5 py-2 text-xs font-mono text-slate-100 outline-none shadow-inner"
                />
              </div>

              {/* Ports */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Backend Port</label>
                  <input
                    type="number"
                    value={newBackendPort}
                    onChange={(e) => setNewBackendPort(parseInt(e.target.value, 10) || 5000)}
                    className="w-full bg-[#080D17] border border-slate-700/80 focus:border-emerald-500 rounded-xl px-3.5 py-2 text-xs font-mono text-slate-100 outline-none shadow-inner"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Frontend Port</label>
                  <input
                    type="number"
                    value={newFrontendPort}
                    onChange={(e) => setNewFrontendPort(parseInt(e.target.value, 10) || 3000)}
                    className="w-full bg-[#080D17] border border-slate-700/80 focus:border-emerald-500 rounded-xl px-3.5 py-2 text-xs font-mono text-slate-100 outline-none shadow-inner"
                  />
                </div>
              </div>

              {scaffoldMessage && (
                <div className="p-3 rounded-xl bg-slate-900 border border-slate-700 text-xs font-mono text-emerald-300">
                  {scaffoldMessage}
                </div>
              )}
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-800">
              <button
                onClick={() => setShowTemplateModal(false)}
                className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-400 text-xs font-semibold"
              >
                Abbrechen
              </button>
              <button
                onClick={handleCreateFromTemplate}
                disabled={isScaffolding || !newProjectName.trim()}
                className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 disabled:opacity-40 text-white text-xs font-bold px-5 py-2.5 rounded-xl transition-all shadow-md shadow-emerald-950/50 flex items-center gap-2"
              >
                {isScaffolding ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                <span>{isScaffolding ? 'Erstelle Projekt...' : 'Projekt jetzt generieren'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
