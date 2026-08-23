import React from 'react';
import { Zap, XCircle, PlayCircle, Terminal } from 'lucide-react';

interface LiveServerRunnerTabProps {
  runnerStatus: 'RUNNING' | 'STOPPED' | 'ERROR' | string;
  deployedPort: number | null;
  deployedPid: number | null;
  isDeployingServer: boolean;
  runnerLogs: string[];
  setRunnerLogs: React.Dispatch<React.SetStateAction<string[]>>;
  handleStopDeployedServer: () => void;
  handleDeployServer: () => void;
}

export const LiveServerRunnerTab: React.FC<LiveServerRunnerTabProps> = ({
  runnerStatus,
  deployedPort,
  deployedPid,
  isDeployingServer,
  runnerLogs,
  setRunnerLogs,
  handleStopDeployedServer,
  handleDeployServer,
}) => {
  return (
    <div id="live_server_runner_tab_container" className="space-y-6 max-w-7xl mx-auto animate-in fade-in duration-200">
      
      {/* Top Control Panel */}
      <div className="bg-slate-900/80 p-6 rounded-2xl border border-slate-800 shadow-xl space-y-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-800 pb-5">
          <div className="space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <Zap className="text-amber-400" size={20} />
              <h2 className="text-base font-bold text-white uppercase tracking-wider">Dynamische Server-Laufzeitumgebung</h2>
              <span className="text-[10px] font-mono font-bold bg-amber-500/15 text-amber-300 border border-amber-500/30 px-2 py-0.5 rounded-full">
                SCHARFE AUSFÜHRUNG
              </span>
            </div>
            <p className="text-xs text-slate-400 max-w-2xl">
              Führt den generierten Code (C# .NET / Node.js) direkt auf dem Server in einem isolierten Prozess aus. Der Server weist dem Runner automatisch einen freien Port zwischen 10.000 und 60.000 zu.
            </p>
          </div>

          <div className="flex gap-3">
            {runnerStatus === 'RUNNING' ? (
              <button
                onClick={handleStopDeployedServer}
                className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold bg-red-600 hover:bg-red-700 text-white shadow-lg transition-all cursor-pointer"
              >
                <XCircle size={14} />
                <span>Server Stoppen (Port {deployedPort})</span>
              </button>
            ) : (
              <button
                onClick={handleDeployServer}
                disabled={isDeployingServer}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-600/30 transition-all disabled:opacity-50 cursor-pointer"
              >
                <PlayCircle size={16} className={isDeployingServer ? 'animate-spin' : ''} />
                <span>{isDeployingServer ? 'Deploye auf Server...' : 'Auf Server Ausführen & Port Zuweisen'}</span>
              </button>
            )}
          </div>
        </div>

        {/* Status Metrics Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-800">
            <span className="text-[10px] uppercase font-bold text-slate-500">Prozess-Status</span>
            <div className="flex items-center gap-2 mt-1">
              <span className={`w-3 h-3 rounded-full ${runnerStatus === 'RUNNING' ? 'bg-emerald-400 animate-ping' : 'bg-slate-600'}`} />
              <span className="font-mono text-sm font-bold text-white">{runnerStatus}</span>
            </div>
          </div>

          <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-800">
            <span className="text-[10px] uppercase font-bold text-slate-500">Zugewiesener Port</span>
            <div className="font-mono text-sm font-bold text-amber-400 mt-1">
              {deployedPort ? `:${deployedPort}` : 'Kein Port aktiv'}
            </div>
          </div>

          <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-800">
            <span className="text-[10px] uppercase font-bold text-slate-500">Prozess PID</span>
            <div className="font-mono text-sm font-bold text-indigo-300 mt-1">
              {deployedPid ? `PID ${deployedPid}` : 'N/A'}
            </div>
          </div>

          <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-800">
            <span className="text-[10px] uppercase font-bold text-slate-500">Ingress Proxy URL</span>
            <div className="font-mono text-[11px] text-emerald-400 truncate mt-1" title={deployedPort ? `/api/deploy/runner/${deployedPort}/api` : 'Inaktiv'}>
              {deployedPort ? `/api/deploy/runner/${deployedPort}/api` : 'Inaktiv'}
            </div>
          </div>
        </div>

        {/* Live Terminal Output */}
        <div className="bg-slate-950 rounded-xl border border-slate-800 overflow-hidden font-mono text-xs">
          <div className="p-3 bg-slate-900 border-b border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Terminal size={14} className="text-emerald-400" />
              <span className="text-slate-300 font-bold text-[11px]">Server Console Output Logs (Port {deployedPort || '---'})</span>
            </div>
            <button
              onClick={() => setRunnerLogs([])}
              className="text-[10px] text-slate-500 hover:text-slate-300 underline cursor-pointer"
            >
              Clear Logs
            </button>
          </div>
          <div className="p-4 h-64 overflow-y-auto space-y-1 text-slate-300 bg-slate-950">
            {runnerLogs.length === 0 ? (
              <div className="text-slate-600 italic">Klicken Sie auf 'Auf Server Ausführen', um den Code scharf zu deployen und Konsolenausgaben anzuzeigen...</div>
            ) : (
              runnerLogs.map((log, i) => (
                <div key={i} className="flex gap-2 text-[11px] hover:bg-slate-900/50 p-0.5 rounded">
                  <span className="text-slate-600 shrink-0">[{new Date().toLocaleTimeString()}]</span>
                  <span className={log.includes('[ERROR]') ? 'text-red-400 font-bold' : log.includes('[RUNNER]') ? 'text-emerald-400' : 'text-slate-300'}>{log}</span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
