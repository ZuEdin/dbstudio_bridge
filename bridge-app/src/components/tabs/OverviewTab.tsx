import React, { useState } from 'react';
import { EnvironmentHealth, BridgeProcess } from '../../types/bridge';
import { StatusCard } from '../StatusCard';
import { 
  Terminal, 
  HardDrive, 
  Play, 
  Square, 
  RotateCw, 
  Globe, 
  Layers, 
  AlertCircle, 
  Clock, 
  Package, 
  FolderOpen, 
  CheckCircle2 
} from 'lucide-react';
import { bridgeApi } from '../../services/bridgeApi';

interface OverviewTabProps {
  health: EnvironmentHealth;
  processes: BridgeProcess[];
  onStartProcess: (id: string) => void;
  onStopProcess: (id: string) => void;
  onRestartProcess: (id: string) => void;
}

export const OverviewTab: React.FC<OverviewTabProps> = ({
  health,
  processes,
  onStartProcess,
  onStopProcess,
  onRestartProcess
}) => {
  const [packagingState, setPackagingState] = useState<Record<string, { isBuilding: boolean; message?: string; installerPath?: string }>>({});

  const getProjectId = (procId: string) => {
    return procId.replace(/_tauri|_backend|_frontend|_electron|_process|_build/g, '');
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

  const renderStatusBadge = (status: string) => {
    switch (status) {
      case 'building':
      case 'installing':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-mono uppercase font-bold bg-amber-500/15 text-amber-300 border border-amber-500/30 glow-amber">
            <RotateCw className="w-3 h-3 animate-spin text-amber-400" />
            <span>Kompiliert...</span>
          </span>
        );
      case 'running':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-mono uppercase font-bold bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 glow-emerald">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span>Aktiv</span>
          </span>
        );
      case 'stopped':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-mono uppercase font-bold bg-slate-800/80 text-slate-300 border border-slate-700">
            <span className="w-1.5 h-1.5 rounded-full bg-slate-500" />
            <span>Bereit / Gestoppt</span>
          </span>
        );
      case 'failed':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-mono uppercase font-bold bg-rose-500/15 text-rose-400 border border-rose-500/30">
            <AlertCircle className="w-3 h-3 text-rose-400" />
            <span>Fehlgeschlagen</span>
          </span>
        );
      default:
        return (
          <span className="px-2.5 py-1 rounded-full text-[10px] font-mono uppercase font-bold bg-slate-800 text-slate-400 border border-slate-700">
            {status}
          </span>
        );
    }
  };

  const runningCount = processes.filter(p => p.status === 'running').length;
  const buildingCount = processes.filter(p => p.status === 'building' || p.status === 'installing').length;

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Hero Welcome Banner */}
      <div className="bg-gradient-to-br from-[#0F172A] via-[#0E1526] to-[#0A0F1D] border border-slate-800/90 rounded-3xl p-6 shadow-2xl relative overflow-hidden">
        {/* Subtle Ambient Background Glows */}
        <div className="absolute top-0 right-1/4 w-72 h-72 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-teal-500/5 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
              </span>
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-400 font-mono">
                Bridge Daemon Active & Listening
              </span>
            </div>
            <h2 className="text-2xl font-extrabold text-white tracking-tight">
              Lokaler Workspace & Ausführungsumgebung
            </h2>
            <p className="text-slate-400 text-xs max-w-2xl leading-relaxed">
              Dieser lokale Dienst empfängt C#/.NET 10 und React-Code-Generierungen direkt aus der DB Studio Web-Applikation, 
              entpackt sie im Workspace und führt <code className="text-emerald-300 font-mono bg-slate-900/80 px-1.5 py-0.5 rounded border border-slate-800">dotnet run</code> sowie <code className="text-emerald-300 font-mono bg-slate-900/80 px-1.5 py-0.5 rounded border border-slate-800">npm run dev</code> auf Ihrem Computer aus.
            </p>
          </div>

          {/* Quick Metrics Cards */}
          <div className="flex items-center gap-3 flex-wrap sm:flex-nowrap">
            <div className="bg-[#080D17]/80 backdrop-blur-md border border-slate-800/90 px-4 py-3 rounded-2xl shadow-inner min-w-[120px] text-center">
              <div className="text-[10px] uppercase font-mono text-slate-500 font-semibold tracking-wider">Aktive Dienste</div>
              <div className="text-xl font-black text-emerald-400 font-mono mt-0.5">
                {runningCount} <span className="text-xs font-normal text-slate-500">/ {processes.length}</span>
              </div>
            </div>

            <div className="bg-[#080D17]/80 backdrop-blur-md border border-slate-800/90 px-4 py-3 rounded-2xl shadow-inner min-w-[120px] text-center">
              <div className="text-[10px] uppercase font-mono text-slate-500 font-semibold tracking-wider">Bridge Port</div>
              <div className="text-xl font-black text-teal-400 font-mono mt-0.5">
                :{health.bridgePort}
              </div>
            </div>

            <div className="bg-[#080D17]/80 backdrop-blur-md border border-slate-800/90 px-4 py-3 rounded-2xl shadow-inner min-w-[120px] text-center">
              <div className="text-[10px] uppercase font-mono text-slate-500 font-semibold tracking-wider">Toolchain</div>
              <div className="text-xs font-bold text-emerald-400 font-mono mt-2 flex items-center justify-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                <span>SDKs Bereit</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* System Toolchains & SDKs */}
      <div>
        <div className="flex items-center justify-between mb-3 px-1">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
            <Layers className="w-4 h-4 text-emerald-400" />
            Installierte Compiler & Runtimes
          </h3>
          <span className="text-[11px] text-slate-500 font-mono">Automatische Erkennung im Host-System</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatusCard
            title=".NET SDK"
            subtitle="C# Compiler & Runtime"
            icon={Layers}
            isReady={health.dotnetSdk.installed}
            version={health.dotnetSdk.version}
            path={health.dotnetSdk.path}
            badge="Backend"
          />
          <StatusCard
            title="Node.js"
            subtitle="JavaScript Engine"
            icon={Globe}
            isReady={health.nodejs.installed}
            version={health.nodejs.version}
            path={health.nodejs.path}
            badge="Toolchain"
          />
          <StatusCard
            title="NPM Bundler"
            subtitle="Package Manager & Vite"
            icon={Terminal}
            isReady={health.npm.installed}
            version={health.npm.version}
            path={health.npm.path}
            badge="Frontend"
          />
          <StatusCard
            title="Docker Engine"
            subtitle="Container & Services"
            icon={HardDrive}
            isReady={health.docker?.installed && health.docker?.running}
            version={health.docker?.serverVersion || health.docker?.version || (health.docker?.installed ? 'Installiert' : 'N/A')}
            path={health.docker?.hint}
            badge={health.docker?.running ? 'Aktiv' : health.docker?.installed ? 'Gestoppt' : 'Nicht gefunden'}
          />
        </div>
      </div>

      {/* Active Processes Management */}
      <div>
        <div className="flex items-center justify-between mb-3 px-1">
          <div className="flex items-center gap-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">Verwaltete Prozesse & Ports</h3>
            <span className="text-[10px] font-mono bg-slate-800 text-emerald-400 px-2 py-0.5 rounded-full border border-slate-700">
              {processes.length} {processes.length === 1 ? 'Dienst' : 'Dienste'}
            </span>
          </div>
          <span className="text-[11px] text-slate-500 font-mono">PID-gebundenes Lifecycle Management</span>
        </div>

        {processes.length === 0 ? (
          <div className="bg-[#0E1524]/80 backdrop-blur-md border border-slate-800/80 rounded-2xl p-10 text-center shadow-xl">
            <div className="w-14 h-14 rounded-2xl bg-[#080D17] border border-slate-800 flex items-center justify-center mx-auto mb-3 text-slate-500 shadow-inner">
              <Layers className="w-7 h-7 text-slate-400" />
            </div>
            <h4 className="text-sm font-bold text-slate-200">Momentan keine aktiven Prozesse oder registrierten Projekte</h4>
            <p className="text-xs text-slate-400 max-w-md mx-auto mt-1 leading-relaxed">
              Sobald Sie in DB Studio ein Projekt übertragen oder lokal starten, wird der laufende Backend- (.NET/Node) oder Frontend-Prozess hier in Echtzeit mit PID und Port angezeigt.
            </p>
          </div>
        ) : (
          <div className="bg-[#0E1524]/80 backdrop-blur-md border border-slate-800/80 rounded-2xl overflow-hidden shadow-2xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="bg-[#080D17] text-slate-400 font-mono border-b border-slate-800 text-[11px]">
                  <tr>
                    <th className="px-5 py-3.5 font-semibold">Dienst / Name</th>
                    <th className="px-4 py-3.5 font-semibold">Status</th>
                    <th className="px-4 py-3.5 font-semibold">PID</th>
                    <th className="px-4 py-3.5 font-semibold">Port</th>
                    <th className="px-4 py-3.5 font-semibold">Ressourcen</th>
                    <th className="px-4 py-3.5 font-semibold">Befehl</th>
                    <th className="px-5 py-3.5 font-semibold text-right">Aktionen & Packaging</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-sans">
                  {processes.map((proc) => {
                    const isRunning = proc.status === 'running';
                    const isBuilding = proc.status === 'building' || proc.status === 'installing';
                    const projId = getProjectId(proc.id);
                    const packState = packagingState[projId] || { isBuilding: false };

                    return (
                      <tr key={proc.id} className="hover:bg-slate-800/40 transition-colors group">
                        <td className="px-5 py-3.5 font-semibold text-slate-100 flex items-center gap-2.5">
                          {isBuilding ? (
                            <span title="Kompiliert / Startet...">
                              <RotateCw className="w-3.5 h-3.5 text-amber-400 animate-spin shrink-0" />
                            </span>
                          ) : isRunning ? (
                            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse shrink-0 glow-emerald" />
                          ) : proc.status === 'failed' ? (
                            <span className="w-2.5 h-2.5 rounded-full bg-rose-500 shrink-0" />
                          ) : (
                            <span className="w-2.5 h-2.5 rounded-full bg-slate-600 shrink-0" />
                          )}
                          <span className="truncate font-mono text-xs font-bold text-slate-100" title={proc.name}>
                            {proc.name}
                          </span>
                        </td>
                        <td className="px-4 py-3.5">
                          {renderStatusBadge(proc.status)}
                        </td>
                        <td className="px-4 py-3.5 font-mono text-slate-400">
                          {proc.pid ? (
                            <span className="bg-slate-900 px-2 py-0.5 rounded border border-slate-800 text-slate-300 font-bold">
                              {proc.pid}
                            </span>
                          ) : '-'}
                        </td>
                        <td className="px-4 py-3.5 font-mono">
                          {proc.port ? (
                            <a 
                              href={`http://localhost:${proc.port}`} 
                              target="_blank" 
                              rel="noreferrer" 
                              className="inline-flex items-center gap-1 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-2 py-0.5 rounded font-bold transition-colors"
                              title={`http://localhost:${proc.port} im Browser öffnen`}
                            >
                              <span>:{proc.port}</span>
                            </a>
                          ) : <span className="text-slate-500">-</span>}
                        </td>
                        <td className="px-4 py-3.5 font-mono text-[11px] text-slate-400">
                          {isRunning ? (
                            <span className="text-slate-300">{proc.cpuUsage || 0.5}% CPU | {proc.memoryUsageMb || 45} MB</span>
                          ) : isBuilding ? (
                            <span className="text-amber-400/80">Kompiliert...</span>
                          ) : <span className="text-slate-600">Inaktiv</span>}
                        </td>
                        <td className="px-4 py-3.5 font-mono text-[11px] text-slate-400 truncate max-w-xs" title={proc.command}>
                          <span className="bg-slate-950 px-2 py-1 rounded border border-slate-800/80 truncate block">
                            {proc.command}
                          </span>
                        </td>
                        <td className="px-5 py-3.5 text-right space-x-1.5 whitespace-nowrap">
                          {/* 1. Installer Button (MSI / EXE Packaging) */}
                          <button
                            onClick={() => handleBuildAndRunInstaller(projId)}
                            disabled={packState.isBuilding}
                            className={`px-2.5 py-1.5 rounded-xl border transition-all inline-flex items-center gap-1 text-xs font-semibold shadow-sm ${
                              packState.isBuilding
                                ? 'bg-amber-500/20 text-amber-300 border-amber-500/40 animate-pulse'
                                : packState.installerPath
                                ? 'bg-sky-500/20 text-sky-300 border-sky-500/40'
                                : 'bg-sky-500/10 hover:bg-sky-500/20 text-sky-400 border-sky-500/30'
                            }`}
                            title="Natives Installationspaket (MSI/EXE Setup) bauen und starten"
                          >
                            {packState.isBuilding ? (
                              <RotateCw className="w-3.5 h-3.5 animate-spin text-amber-400" />
                            ) : (
                              <Package className="w-3.5 h-3.5" />
                            )}
                            <span className="hidden sm:inline">
                              {packState.isBuilding ? 'Paketiere...' : 'Installer'}
                            </span>
                          </button>

                          {/* 2. Run / Restart / Stop Buttons */}
                          {isRunning || isBuilding ? (
                            <>
                              <button
                                onClick={() => onRestartProcess(proc.id)}
                                className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white transition-colors border border-slate-700 shadow-sm"
                                title="Neustarten"
                              >
                                <RotateCw className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => onStopProcess(proc.id)}
                                className="p-1.5 rounded-xl bg-rose-500/15 hover:bg-rose-500/25 text-rose-400 border border-rose-500/30 transition-colors shadow-sm"
                                title="Stoppen"
                              >
                                <Square className="w-3.5 h-3.5" />
                              </button>
                            </>
                          ) : (
                            <button
                              onClick={() => onStartProcess(proc.id)}
                              className="px-3 py-1.5 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-400 border border-emerald-500/30 transition-all inline-flex items-center gap-1 text-xs font-bold glow-emerald shadow-sm"
                              title="Dienst starten"
                            >
                              <Play className="w-3.5 h-3.5 fill-current" />
                              <span>Starten</span>
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
