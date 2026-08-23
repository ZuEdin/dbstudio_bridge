import React from 'react';
import { MockApiLog } from '../openApiTypes';
import { Activity, Clock, Trash2, CheckCircle2, ShieldAlert } from 'lucide-react';

interface InBrowserMockConsoleProps {
  logs: MockApiLog[];
  onClearLogs: () => void;
  latencyMs: number;
  setLatencyMs: (ms: number) => void;
}

export const InBrowserMockConsole: React.FC<InBrowserMockConsoleProps> = ({
  logs,
  onClearLogs,
  latencyMs,
  setLatencyMs
}) => {
  return (
    <div className="space-y-4">
      {/* Top Configuration Toolbar */}
      <div className="bg-slate-900 text-white p-4 rounded-xl border border-slate-800 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-emerald-500/20 rounded-xl text-emerald-400 border border-emerald-500/30">
            <Activity size={18} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-sm text-slate-100">In-Browser Local Mock Server</span>
              <span className="bg-emerald-500/20 text-emerald-300 text-[10px] font-bold px-2 py-0.5 rounded-full border border-emerald-500/30">
                Aktiv (In-Memory DB)
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Verarbeitet echte REST-Requests direkt im Browser ohne externes Node.js Backend.
            </p>
          </div>
        </div>

        {/* Latency Simulator Slider */}
        <div className="flex items-center gap-3 bg-slate-950 px-3 py-1.5 rounded-xl border border-slate-800">
          <Clock size={14} className="text-indigo-400" />
          <span className="text-xs font-bold text-slate-300">Latenz-Simulation:</span>
          <div className="flex items-center gap-2">
            {[0, 80, 250, 600].map(ms => (
              <button
                key={ms}
                onClick={() => setLatencyMs(ms)}
                className={`px-2 py-0.5 rounded text-[11px] font-bold transition-all ${
                  latencyMs === ms
                    ? 'bg-indigo-600 text-white'
                    : 'bg-slate-800 text-slate-400 hover:text-slate-200'
                }`}
              >
                {ms === 0 ? '0ms' : `${ms}ms`}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Logs Table / Stream */}
      <div className="bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-2xs">
        <div className="p-3 bg-slate-100 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <span className="font-extrabold text-xs text-slate-700 dark:text-slate-300 uppercase tracking-wider">
            Live Request Stream ({logs.length})
          </span>
          {logs.length > 0 && (
            <button
              onClick={onClearLogs}
              className="flex items-center gap-1 text-[11px] text-slate-500 hover:text-rose-600 transition-colors"
            >
              <Trash2 size={12} />
              <span>Logs leeren</span>
            </button>
          )}
        </div>

        {logs.length === 0 ? (
          <div className="p-8 text-center text-slate-400 space-y-1">
            <CheckCircle2 size={28} className="mx-auto text-slate-400 opacity-60 mb-2" />
            <div className="text-xs font-bold">Noch keine API-Aufrufe registriert</div>
            <div className="text-[11px]">Führe Anfragen im Swagger-Explorer aus, um Live-Logs hier zu sehen.</div>
          </div>
        ) : (
          <div className="divide-y divide-slate-200 dark:divide-slate-800 max-h-[350px] overflow-y-auto">
            {logs.map(log => {
              let methodColor = 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300';
              if (log.method === 'POST') methodColor = 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300';
              if (log.method === 'PUT') methodColor = 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300';
              if (log.method === 'DELETE') methodColor = 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300';

              return (
                <div key={log.id} className="p-3 text-xs flex items-center justify-between hover:bg-slate-100/60 dark:hover:bg-slate-800/40">
                  <div className="flex items-center gap-3">
                    <span className="text-[10px] text-slate-400 font-mono">{log.timestamp}</span>
                    <span className={`px-2 py-0.5 rounded font-black text-[10px] ${methodColor}`}>
                      {log.method}
                    </span>
                    <span className="font-mono font-bold text-slate-800 dark:text-slate-200">{log.path}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`px-2 py-0.5 rounded font-bold font-mono text-[10px] ${
                      log.status < 300 ? 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400' : 'bg-rose-500/20 text-rose-600 dark:text-rose-400'
                    }`}>
                      {log.status}
                    </span>
                    <span className="text-[10px] font-mono text-slate-400">{log.durationMs}ms</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
