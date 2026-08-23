import React, { useEffect, useRef, useState } from 'react';
import { useBridgeStore, stripAnsiCodes } from '../../stores/useBridgeStore';
import { useProjectStore } from '../../stores/useProjectStore';
import { 
  X, 
  Terminal, 
  Play, 
  Square, 
  RotateCw, 
  ExternalLink, 
  Layers, 
  Trash2, 
  CheckCircle2, 
  AlertTriangle, 
  Laptop, 
  Settings, 
  Download,
  Activity,
  Loader2
} from 'lucide-react';
import { downloadBridgePackageZip } from '../../utils/bridgePackageGenerator';

interface BridgeRunnerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenSettings?: () => void;
}

export const BridgeRunnerModal: React.FC<BridgeRunnerModalProps> = ({ isOpen, onClose, onOpenSettings }) => {
  const { 
    config, 
    isOnline, 
    activeProject, 
    clearLogs, 
    sendProcessAction, 
    checkHealth 
  } = useBridgeStore();

  const currentProjectName = useProjectStore(s => s.projectName) || useProjectStore(s => s.projectId) || 'MyProject';
  const effectiveProjectId = activeProject.projectId || currentProjectName;
  const [busyAction, setBusyAction] = useState<'start' | 'stop' | 'restart' | null>(null);

  const handleAction = async (action: 'start' | 'stop' | 'restart') => {
    setBusyAction(action);
    try {
      await sendProcessAction(effectiveProjectId, action);
    } finally {
      setTimeout(() => setBusyAction(null), 600);
    }
  };

  const terminalEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      terminalEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [activeProject.logs, isOpen]);

  if (!isOpen) return null;

  const getStatusBadge = () => {
    switch (activeProject.status) {
      case 'running':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-300 animate-pulse">
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            Aktiv & Läuft lokal
          </span>
        );
      case 'deploying':
      case 'generating':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-blue-100 text-blue-800 border border-blue-300">
            <RotateCw size={12} className="animate-spin text-blue-600" />
            Wird übertragen & gestartet...
          </span>
        );
      case 'stopped':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-slate-200 text-slate-700 border border-slate-300">
            <Square size={10} className="text-slate-600" />
            Gestoppt
          </span>
        );
      case 'error':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-rose-100 text-rose-800 border border-rose-300">
            <AlertTriangle size={12} className="text-rose-600" />
            Fehler
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-600 border border-slate-200">
            Bereit
          </span>
        );
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-[9999] animate-in fade-in duration-150 p-4">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl w-[900px] max-w-full overflow-hidden flex flex-col max-h-[92vh] animate-in zoom-in-95 duration-150">
        
        {/* Header */}
        <div className="p-4 bg-slate-800/90 border-b border-slate-700/80 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-600/20 border border-indigo-500/30 text-indigo-400 rounded-xl">
              <Laptop size={20} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-white text-base">
                  Lokale Bridge: {activeProject.projectName || 'DB Studio Projekt'}
                </h3>
                {getStatusBadge()}
              </div>
              <p className="text-xs text-slate-400 flex items-center gap-2 mt-0.5">
                <span>Ziel: <strong className="text-slate-300">{config.useCustomPort === false || (config.host.startsWith('https://') && !config.host.includes(':', 8)) ? config.host : `${config.host}:${config.port}`}</strong></span>
                <span>•</span>
                <span className="text-emerald-400 font-medium flex items-center gap-1">
                  <Layers size={11} /> Shared Dependencies aktiv (Kein Datenmüll)
                </span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => checkHealth()}
              className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-700 transition-colors"
              title="Bridge-Status aktualisieren"
            >
              <Activity size={16} />
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-700 transition-colors"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Offline Warning Banner if Bridge is not reachable */}
        {!isOnline && (
          <div className="bg-amber-950/60 border-b border-amber-600/40 p-3.5 flex items-start justify-between gap-3 text-xs text-amber-200">
            <div className="flex items-start gap-2.5">
              <AlertTriangle className="text-amber-400 shrink-0 mt-0.5" size={18} />
              <div>
                <p className="font-bold text-amber-300">
                  Bridge ist nicht erreichbar ({config.host.startsWith('https://') && !config.host.includes(':', 8) ? config.host : `${config.host}:${config.port}`})
                </p>
                <p className="text-[11px] text-amber-200/80 mt-0.5">
                  Um das Projekt direkt auf Ihrem PC auszuführen, starten Sie bitte den Bridge-Server lokal (z. B. über <code className="bg-black/40 px-1 py-0.5 rounded text-amber-300 font-mono">start-bridge.bat</code> oder <code className="bg-black/40 px-1 py-0.5 rounded text-amber-300 font-mono">node server.js</code>).
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={() => checkHealth()}
                className="px-3 py-1 rounded bg-amber-600 hover:bg-amber-500 text-black font-bold text-xs transition-colors flex items-center gap-1.5 shadow-xs"
              >
                <RotateCw size={12} /> Verbindung prüfen
              </button>
            </div>
          </div>
        )}

        {/* Action Bar (Live Links & Process Controls) */}
        <div className="px-4 py-2.5 bg-slate-800/50 border-b border-slate-700/60 flex items-center justify-between flex-wrap gap-2 text-xs">
          <div className="flex items-center gap-2">
            {activeProject.frontendUrl && (
              <a
                href={activeProject.frontendUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold transition-all shadow-xs"
              >
                <ExternalLink size={13} />
                Frontend öffnen ({activeProject.frontendUrl})
              </a>
            )}

            {activeProject.backendUrl && (
              <a
                href={`${activeProject.backendUrl}/swagger`}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-bold transition-all shadow-xs"
              >
                <ExternalLink size={13} />
                Backend API / Swagger ({activeProject.backendUrl})
              </a>
            )}
          </div>

          <div className="flex items-center gap-2">
            {activeProject.status === 'stopped' ? (
              <button
                onClick={() => handleAction('start')}
                disabled={busyAction !== null}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-semibold transition-colors shadow-xs"
                title="Projektprozesse starten"
              >
                {busyAction === 'start' ? (
                  <Loader2 size={13} className="animate-spin text-white" />
                ) : (
                  <Play size={13} className="fill-white" />
                )}
                Starten
              </button>
            ) : (
              <>
                <button
                  onClick={() => handleAction('restart')}
                  disabled={busyAction !== null}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-700 hover:bg-slate-600 disabled:opacity-50 text-slate-200 font-semibold transition-colors cursor-pointer"
                  title="Projektprozesse neu starten (Ports freigeben & sauberer Neustart)"
                >
                  {busyAction === 'restart' ? (
                    <Loader2 size={13} className="animate-spin text-cyan-400" />
                  ) : (
                    <RotateCw size={13} />
                  )}
                  Neustart
                </button>
                <button
                  onClick={() => handleAction('stop')}
                  disabled={busyAction !== null}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-rose-900/60 hover:bg-rose-800 disabled:opacity-50 text-rose-200 border border-rose-700/50 font-semibold transition-colors cursor-pointer"
                  title="Alle aktiven Hintergrundprozesse (Backend & Frontend) beenden & Ports freigeben"
                >
                  {busyAction === 'stop' ? (
                    <Loader2 size={13} className="animate-spin text-rose-300" />
                  ) : (
                    <Square size={13} className="fill-rose-300" />
                  )}
                  Stoppen
                </button>
              </>
            )}
            <button
              onClick={clearLogs}
              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-slate-200 transition-colors"
              title="Terminal leeren"
            >
              <Trash2 size={13} /> Leeren
            </button>
          </div>
        </div>

        {/* Terminal Window */}
        <div className="flex-1 p-4 bg-black/90 font-mono text-xs overflow-y-auto max-h-[460px] min-h-[300px] select-text">
          <div className="flex items-center justify-between pb-2 mb-2 border-b border-neutral-800 text-[11px] text-neutral-500">
            <span className="flex items-center gap-1.5 text-neutral-400">
              <Terminal size={13} className="text-emerald-400" />
              Live Console Output (WebSocket Stream)
            </span>
            <span>{activeProject.logs.length} Zeilen</span>
          </div>

          {activeProject.logs.length === 0 ? (
            <div className="text-neutral-500 py-12 text-center">
              <p>Warte auf Ausgaben der lokalen Bridge...</p>
              <p className="text-[11px] mt-1 text-neutral-600">
                Verbindung: {config.host}:{config.port}
              </p>
            </div>
          ) : (
            <div className="space-y-1">
              {activeProject.logs.map((log, index) => {
                let colorClass = 'text-neutral-300';
                if (log.type === 'stderr') colorClass = 'text-rose-400';
                else if (log.type === 'system') colorClass = 'text-sky-300 font-semibold';
                else if (log.service === 'Backend') colorClass = 'text-emerald-300';
                else if (log.service === 'Frontend') colorClass = 'text-amber-300';

                const timeStr = log.timestamp ? log.timestamp.substring(11, 19) : '';

                return (
                  <div key={index} className="flex items-start gap-2 leading-relaxed">
                    <span className="text-neutral-600 select-none text-[10px] shrink-0 pt-0.5">
                      {timeStr}
                    </span>
                    <span className="text-[10px] uppercase font-bold text-neutral-400 bg-neutral-800 px-1 py-0.2 rounded shrink-0">
                      {log.service}
                    </span>
                    <span className={`whitespace-pre-wrap break-all ${colorClass}`}>
                      {stripAnsiCodes(log.message)}
                    </span>
                  </div>
                );
              })}
              <div ref={terminalEndRef} />
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-3 bg-slate-800/90 border-t border-slate-700/80 flex items-center justify-between text-xs text-slate-400">
          <div className="flex items-center gap-2">
            <span className="flex items-center gap-1">
              <span className={`w-2 h-2 rounded-full ${isOnline ? 'bg-emerald-400' : 'bg-amber-400'}`}></span>
              Bridge: <strong className="text-slate-200">{isOnline ? 'Verbunden' : 'Wartet auf Verbindung'}</strong>
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => downloadBridgePackageZip(config)}
              className="px-3 py-1.5 rounded-lg bg-slate-700 hover:bg-slate-600 text-slate-200 font-medium transition-colors flex items-center gap-1.5"
            >
              <Download size={13} />
              Bridge-Starterpaket (ZIP)
            </button>
            {onOpenSettings && (
              <button
                onClick={() => {
                  onClose();
                  onOpenSettings();
                }}
                className="px-3 py-1.5 rounded-lg bg-slate-700 hover:bg-slate-600 text-slate-200 font-medium transition-colors flex items-center gap-1.5"
              >
                <Settings size={13} />
                Optionen anpassen
              </button>
            )}
            <button
              onClick={onClose}
              className="px-4 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-bold transition-colors"
            >
              Schließen
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
