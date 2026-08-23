import React, { useState, useRef, useEffect } from 'react';
import { Terminal, Play, Square, RotateCw, Trash2, Download, CheckCircle2, Copy, Check, Filter } from 'lucide-react';
import { TerminalLogEntry, BridgeProcess } from '../../types/bridge';

interface TerminalTabProps {
  processes: BridgeProcess[];
}

export const TerminalTab: React.FC<TerminalTabProps> = ({ processes }) => {
  const [selectedProcessId, setSelectedProcessId] = useState<string>('all');
  const [autoScroll, setAutoScroll] = useState<boolean>(true);
  const [logs, setLogs] = useState<TerminalLogEntry[]>([]);
  const [copied, setCopied] = useState(false);
  const terminalEndRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    let ws: WebSocket | null = null;
    let reconnectTimeout: any = null;

    const connectWs = () => {
      try {
        ws = new WebSocket('ws://127.0.0.1:5050/logs');
        
        ws.onopen = () => {
          setLogs(prev => [
            ...prev,
            { id: Date.now().toString(), timestamp: new Date().toLocaleTimeString(), stream: 'system', message: '🟢 Live-Terminal WebSocket verbunden & bereit.' }
          ]);
        };

        ws.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            const newEntry: TerminalLogEntry = {
              id: Date.now() + Math.random().toString(),
              timestamp: new Date().toLocaleTimeString(),
              stream: data.stream || 'stdout',
              message: data.message || (typeof data === 'string' ? data : JSON.stringify(data)),
              processId: data.processId
            };
            setLogs(prev => [...prev.slice(-400), newEntry]);
          } catch (e) {
            setLogs(prev => [
              ...prev.slice(-400),
              { id: Date.now().toString(), timestamp: new Date().toLocaleTimeString(), stream: 'stdout', message: event.data }
            ]);
          }
        };

        ws.onclose = () => {
          reconnectTimeout = setTimeout(connectWs, 3000);
        };
      } catch (e) {
        reconnectTimeout = setTimeout(connectWs, 3000);
      }
    };

    connectWs();

    return () => {
      if (ws) ws.close();
      if (reconnectTimeout) clearTimeout(reconnectTimeout);
    };
  }, []);

  useEffect(() => {
    if (autoScroll && terminalEndRef.current) {
      terminalEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [logs, autoScroll]);

  const filteredLogs = selectedProcessId === 'all'
    ? logs
    : logs.filter(l => !l.processId || l.processId === selectedProcessId);

  const activeProcess = processes.find(p => p.id === selectedProcessId);

  const handleCopyLogs = () => {
    const text = filteredLogs.map(l => `[${l.timestamp}] [${l.stream}] ${l.message}`).join('\n');
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-4 max-w-7xl mx-auto h-[calc(100vh-140px)] flex flex-col">
      {/* Top Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-[#0E1524]/80 backdrop-blur-md border border-slate-800/80 p-3.5 rounded-2xl shadow-xl">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-gradient-to-br from-emerald-500/20 via-emerald-600/10 to-teal-500/5 border border-emerald-500/30 text-emerald-400 glow-emerald">
            <Terminal className="w-4 h-4" />
          </div>
          <div>
            <div className="text-xs font-bold uppercase tracking-wider text-slate-200 font-mono flex items-center gap-2">
              <span>Live Console Stream</span>
              <span className="text-[10px] bg-slate-800/80 text-emerald-400 px-2 py-0.2 rounded border border-slate-700">
                {filteredLogs.length} Zeilen
              </span>
            </div>
          </div>

          <div className="h-4 w-px bg-slate-800 mx-1 hidden sm:block" />

          {/* Process Selector */}
          <div className="flex items-center gap-1.5">
            <Filter className="w-3.5 h-3.5 text-slate-500 hidden sm:block" />
            <select 
              value={selectedProcessId}
              onChange={(e) => setSelectedProcessId(e.target.value)}
              className="bg-[#080D17] border border-slate-700/80 text-xs font-medium text-slate-200 rounded-xl px-3 py-1.5 focus:outline-none focus:border-emerald-500 font-mono shadow-inner transition-colors"
            >
              <option value="all">Alle Prozesse & System-Logs</option>
              {processes.map((proc) => (
                <option key={proc.id} value={proc.id}>
                  {proc.name} (Port: {proc.port || 'N/A'})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2">
          <label className="flex items-center gap-2 text-xs text-slate-400 select-none cursor-pointer bg-[#080D17] px-3 py-1.5 rounded-xl border border-slate-800 shadow-inner">
            <input 
              type="checkbox" 
              checked={autoScroll} 
              onChange={(e) => setAutoScroll(e.target.checked)}
              className="rounded border-slate-700 bg-slate-950 text-emerald-500 focus:ring-emerald-500 w-3.5 h-3.5"
            />
            <span className="text-[11px] font-mono">Auto-Scroll</span>
          </label>

          <button 
            onClick={handleCopyLogs}
            className="flex items-center gap-1.5 text-xs bg-[#080D17] hover:bg-slate-800 text-slate-300 px-3 py-1.5 rounded-xl transition-all border border-slate-800 shadow-inner"
            title="Logs in Zwischenablage kopieren"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            <span className="text-[11px] font-mono">{copied ? 'Kopiert!' : 'Kopieren'}</span>
          </button>

          <button 
            onClick={() => setLogs([])}
            className="flex items-center gap-1.5 text-xs bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 px-3 py-1.5 rounded-xl transition-all border border-rose-500/20 shadow-sm"
            title="Konsole leeren"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span className="text-[11px] font-mono">Leeren</span>
          </button>
        </div>
      </div>

      {/* Terminal Viewport */}
      <div className="flex-1 bg-[#060A11] border border-slate-800/90 rounded-2xl p-4 font-mono text-xs overflow-y-auto flex flex-col justify-between shadow-2xl relative">
        {/* Terminal macOS Frame Header */}
        <div className="flex items-center justify-between pb-3 mb-2 border-b border-slate-800/60 shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-rose-500/80 shadow-sm" />
            <div className="w-3 h-3 rounded-full bg-amber-500/80 shadow-sm" />
            <div className="w-3 h-3 rounded-full bg-emerald-500/80 shadow-sm" />
            <span className="text-[11px] text-slate-500 ml-2">bridge-daemon-bash // localhost:5050</span>
          </div>

          <div className="flex items-center gap-2">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold">Live Streaming</span>
          </div>
        </div>

        {/* Log Entries */}
        <div className="space-y-1 flex-1 overflow-y-auto pr-1">
          {filteredLogs.length === 0 ? (
            <div className="text-slate-600 text-center py-20">
              Warte auf Ausgaben oder WebSocket-Events...
            </div>
          ) : (
            filteredLogs.map((log) => {
              let textColor = 'text-slate-300';
              let badgeColor = 'bg-slate-800 text-slate-400';
              if (log.stream === 'system') {
                textColor = 'text-cyan-300 font-semibold';
                badgeColor = 'bg-cyan-500/15 text-cyan-400 border border-cyan-500/30';
              }
              if (log.stream === 'stderr') {
                textColor = 'text-rose-400 font-semibold';
                badgeColor = 'bg-rose-500/15 text-rose-400 border border-rose-500/30';
              }
              if (log.message.includes('Now listening on:') || log.message.includes('ready in')) {
                textColor = 'text-emerald-400 font-bold';
                badgeColor = 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30';
              }

              return (
                <div key={log.id} className="flex items-start gap-2.5 hover:bg-slate-900/60 px-2 py-1 rounded-lg transition-colors leading-relaxed group">
                  <span className="text-slate-600 select-none text-[10px] shrink-0 pt-0.5">{log.timestamp}</span>
                  <span className={`text-[9px] uppercase px-1.5 py-0.2 rounded shrink-0 font-semibold ${badgeColor}`}>
                    {log.stream}
                  </span>
                  <span className={`select-text break-all flex-1 text-[11px] ${textColor}`}>{log.message}</span>
                </div>
              );
            })
          )}
          <div ref={terminalEndRef} />
        </div>

        {/* Terminal Footer */}
        <div className="mt-3 pt-3 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-500 shrink-0">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            <span>Aktiver Prozess: <strong className="text-slate-300 font-mono">{activeProcess?.command || 'System Bridge'}</strong></span>
          </div>
          <div className="hidden sm:block">Working Directory: <strong className="text-slate-400 font-mono">{activeProcess?.workingDirectory || 'Default Workspace'}</strong></div>
        </div>
      </div>
    </div>
  );
};
