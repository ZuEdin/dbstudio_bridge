import React from 'react';
import { Terminal, FileCode } from 'lucide-react';

interface LiveDatabaseSyncLogPanelProps {
  logs: string[];
}

export const LiveDatabaseSyncLogPanel: React.FC<LiveDatabaseSyncLogPanelProps> = ({ logs }) => {
  return (
    <div className="flex flex-col gap-4 h-full">
      
      {/* Live System Log */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-sm flex-1 flex flex-col min-h-[220px]">
        <div className="flex items-center justify-between pb-2 border-b border-slate-800 mb-3">
          <div className="flex items-center gap-1.5">
            <Terminal className="w-4 h-4 text-emerald-400 animate-pulse" />
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono">Live Introspection Log</span>
          </div>
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
        </div>

        <div className="flex-1 overflow-y-auto font-mono text-[10px] text-emerald-400/90 space-y-1.5 scrollbar-thin scrollbar-thumb-slate-800">
          {logs.length === 0 ? (
            <div className="text-slate-600 italic">Noch keine Scan-Aktivität durchgeführt. Bitte Verbindung starten.</div>
          ) : (
            logs.map((log, i) => (
              <div key={i} className="leading-relaxed whitespace-pre-wrap break-all">{log}</div>
            ))
          )}
        </div>
      </div>

      {/* API Stub details */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-sm">
        <div className="flex items-center gap-2 pb-2 border-b border-slate-100 dark:border-slate-850 mb-2">
          <FileCode className="w-4 h-4 text-indigo-500" />
          <span className="text-xs font-bold text-slate-700 dark:text-slate-200">Server API-Schnittstelle</span>
        </div>
        <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed mb-3">
          Um eine echte Live-Introspection auszuführen, ist im Express-Backend die Route <code className="font-mono text-indigo-600 dark:text-indigo-400 bg-slate-50 dark:bg-slate-800 px-1 py-0.5 rounded text-[10px]">/api/db-introspection</code> vorbereitet. Diese kann mit der <code className="font-mono text-[10px]">pg</code> Bibliothek wie folgt angebunden werden:
        </p>
        
        <div className="bg-slate-900 text-slate-300 p-2.5 rounded font-mono text-[9px] max-h-[160px] overflow-y-auto border border-slate-850">
{`// Express API Endpoint stub:
app.post("/api/db-introspection", async (req, res) => {
  const { host, port, database, user, password, ssl } = req.body;
  
  const client = new Client({ host, port, database, user, password, ssl });
  await client.connect();
  
  const tables = await client.query(\`
    SELECT table_name 
    FROM information_schema.tables 
    WHERE table_schema = 'public'
  \`);
  
  res.json({ tables: tables.rows });
});`}
        </div>
      </div>

    </div>
  );
};
