import React from 'react';
import { AuditLog } from '../types';
import { Activity, Sparkles, Clock } from 'lucide-react';

interface LiveMonitorTabProps {
  qpsCount: number;
  avgLatency: number;
  auditLogs: AuditLog[];
  handleSimulateTraffic: () => void;
}

export const LiveMonitorTab: React.FC<LiveMonitorTabProps> = ({
  qpsCount,
  avgLatency,
  auditLogs,
  handleSimulateTraffic,
}) => {
  return (
    <div id="live_monitor_tab_container" className="space-y-6 max-w-7xl mx-auto animate-in fade-in duration-200">
      <div className="bg-slate-800/60 rounded-2xl p-6 border border-slate-700/80 shadow-xl space-y-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-700/60 pb-5">
          <div>
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <Activity className="text-indigo-400 animate-pulse" size={20} />
              <span>Punkt 5: Audit Log & Realtime Database Monitor</span>
              <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded-full font-mono border border-emerald-500/30">Telemetry Stream Active</span>
            </h2>
            <p className="text-xs text-slate-400 mt-1">Echtzeit-Überwachung von Datenbank-Abfragen, Performance-Latenzen, QPS und Audit-Sicherheitsprotokollen.</p>
          </div>

          <button
            onClick={handleSimulateTraffic}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-600/30 border border-indigo-400/30 transition-all cursor-pointer"
          >
            <Sparkles size={14} />
            <span>⚡ Traffic Event Simulieren</span>
          </button>
        </div>

        {/* Health Metrics Gauges */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 font-mono text-xs">
          <div className="bg-slate-900/90 p-4 rounded-xl border border-slate-800 space-y-1">
            <p className="text-slate-500 text-[10px] uppercase font-bold">Abfragen/Sek (QPS)</p>
            <p className="text-xl font-bold text-indigo-400">{qpsCount} <span className="text-xs text-slate-500 font-normal">req/s</span></p>
            <p className="text-[10px] text-emerald-400">↑ Normaler Durchsatz</p>
          </div>

          <div className="bg-slate-900/90 p-4 rounded-xl border border-slate-800 space-y-1">
            <p className="text-slate-500 text-[10px] uppercase font-bold">Ø Latenz</p>
            <p className="text-xl font-bold text-emerald-400">{avgLatency} <span className="text-xs text-slate-500 font-normal">ms</span></p>
            <p className="text-[10px] text-emerald-400">⚡ Sehr schnell</p>
          </div>

          <div className="bg-slate-900/90 p-4 rounded-xl border border-slate-800 space-y-1">
            <p className="text-slate-500 text-[10px] uppercase font-bold">Connection Pool</p>
            <p className="text-xl font-bold text-slate-200">12 / 50</p>
            <p className="text-[10px] text-slate-400">24% Auslastung</p>
          </div>

          <div className="bg-slate-900/90 p-4 rounded-xl border border-slate-800 space-y-1">
            <p className="text-slate-500 text-[10px] uppercase font-bold">Cache Hit Rate</p>
            <p className="text-xl font-bold text-indigo-300">98.6%</p>
            <p className="text-[10px] text-emerald-400">In-Memory Cache</p>
          </div>

          <div className="bg-slate-900/90 p-4 rounded-xl border border-slate-800 space-y-1 col-span-2 md:col-span-1">
            <p className="text-slate-500 text-[10px] uppercase font-bold">Speicher (IndexedDB)</p>
            <p className="text-xl font-bold text-slate-200">1.4 MB</p>
            <p className="text-[10px] text-slate-500">Persistent local storage</p>
          </div>
        </div>

        {/* Realtime Audit Trail Table */}
        <div className="space-y-3 font-mono text-xs">
          <div className="flex justify-between items-center text-slate-300">
            <h3 className="font-bold text-slate-200 flex items-center gap-2">
              <Clock size={16} className="text-indigo-400" />
              <span>Realtime DB Audit Log & Execution History</span>
            </h3>
            <span className="text-[11px] text-slate-500">{auditLogs.length} protokollierte Ereignisse</span>
          </div>

          <div className="bg-slate-950 rounded-xl border border-slate-800 overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-slate-900 border-b border-slate-800 text-slate-400 uppercase text-[10px]">
                <tr>
                  <th className="p-3">Zeitstempel</th>
                  <th className="p-3">Aktion</th>
                  <th className="p-3">User & Rolle</th>
                  <th className="p-3">Details & Abfrage</th>
                  <th className="p-3 text-right">Latenz</th>
                  <th className="p-3 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-slate-300">
                {auditLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-900/50">
                    <td className="p-3 text-slate-400 text-[11px]">{log.timestamp}</td>
                    <td className="p-3">
                      <span className={`px-2 py-0.5 rounded font-bold text-[10px] ${
                        log.action === 'SELECT' ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30' :
                        log.action === 'INSERT' ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' :
                        log.action === 'UPDATE' ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30' :
                        log.action === 'DELETE' ? 'bg-red-500/20 text-red-300 border border-red-500/30' :
                        'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                      }`}>
                        {log.action}
                      </span>
                    </td>
                    <td className="p-3 font-semibold text-slate-200">
                      {log.user} <span className="text-[10px] text-slate-500">({log.role})</span>
                    </td>
                    <td className="p-3 text-slate-300 font-mono text-[11px] truncate max-w-md">{log.details}</td>
                    <td className="p-3 text-right font-bold text-slate-400">{log.latencyMs} ms</td>
                    <td className="p-3 text-center">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        log.status === 'SUCCESS' ? 'bg-emerald-500/20 text-emerald-400' :
                        log.status === 'WARN' ? 'bg-amber-500/20 text-amber-400' : 'bg-red-500/20 text-red-400'
                      }`}>
                        {log.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};
