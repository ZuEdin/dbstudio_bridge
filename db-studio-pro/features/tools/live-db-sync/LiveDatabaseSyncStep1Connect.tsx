import React from 'react';
import { Server, HelpCircle, Play } from 'lucide-react';

interface LiveDatabaseSyncStep1ConnectProps {
  dbType: 'postgresql' | 'mysql' | 'mssql' | 'sqlite';
  setDbType: (type: 'postgresql' | 'mysql' | 'mssql' | 'sqlite') => void;
  syncDirection: 'bidirectional' | 'download' | 'upload';
  setSyncDirection: (dir: 'bidirectional' | 'download' | 'upload') => void;
  host: string;
  setHost: (h: string) => void;
  port: string;
  setPort: (p: string) => void;
  database: string;
  setDatabase: (db: string) => void;
  username: string;
  setUsername: (u: string) => void;
  password: string;
  setPassword: (p: string) => void;
  ssl: boolean;
  setSsl: (s: boolean) => void;
  handleConnect: () => void;
}

export const LiveDatabaseSyncStep1Connect: React.FC<LiveDatabaseSyncStep1ConnectProps> = ({
  dbType,
  setDbType,
  syncDirection,
  setSyncDirection,
  host,
  setHost,
  port,
  setPort,
  database,
  setDatabase,
  username,
  setUsername,
  password,
  setPassword,
  ssl,
  setSsl,
  handleConnect,
}) => {
  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-sm space-y-4">
      <div className="flex items-center gap-2 pb-2 border-b border-slate-100 dark:border-slate-850">
        <Server className="w-5 h-5 text-indigo-500" />
        <h2 className="text-sm font-bold text-slate-700 dark:text-slate-200">Verbindungsdaten für Live-Datenbank</h2>
      </div>

      {/* Sync Direction Mode */}
      <div>
        <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1.5">Synchronisations-Richtung (Zweibahnstraße)</label>
        <div className="grid grid-cols-3 gap-2">
          {[
            { id: 'bidirectional', label: '🔄 2-Wege-Sync', desc: 'Beidseitiger Abgleich (IndexedDB ↔ Live SQL)' },
            { id: 'download', label: '📥 Download (Live ➔ IndexedDB)', desc: 'Live SQL-Tabellen lokal importieren' },
            { id: 'upload', label: '📤 Upload (IndexedDB ➔ Live)', desc: 'Lokale Tabellen auf SQL Server anlegen' }
          ].map((mode) => (
            <button
              type="button"
              key={mode.id}
              onClick={() => setSyncDirection(mode.id as any)}
              className={`p-2 text-left rounded-lg border text-xs transition-all ${
                syncDirection === mode.id
                  ? 'border-indigo-500 bg-indigo-50/70 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 font-bold border-2 ring-1 ring-indigo-500/20'
                  : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400'
              }`}
            >
              <div className="font-bold">{mode.label}</div>
              <div className="text-[10px] text-slate-500 dark:text-slate-400 font-normal mt-0.5">{mode.desc}</div>
            </button>
          ))}
        </div>
      </div>

      {/* DB Type Selection */}
      <div>
        <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1.5">Datenbank-Typ (Dialekt)</label>
        <div className="grid grid-cols-4 gap-2">
          {[
            { id: 'postgresql', label: 'PostgreSQL', color: 'border-indigo-500 text-indigo-600 dark:text-indigo-400 bg-indigo-50/50 dark:bg-indigo-950/20' },
            { id: 'mysql', label: 'MySQL', color: 'border-blue-500 text-blue-600 dark:text-blue-400 bg-blue-50/50 dark:bg-blue-950/20' },
            { id: 'mssql', label: 'SQL Server', color: 'border-red-500 text-red-600 dark:text-red-400 bg-red-50/50 dark:bg-red-950/20' },
            { id: 'sqlite', label: 'SQLite (File)', color: 'border-amber-500 text-amber-600 dark:text-amber-400 bg-amber-50/50 dark:bg-amber-950/20' }
          ].map((db) => (
            <button
              type="button"
              key={db.id}
              onClick={() => setDbType(db.id as any)}
              className={`py-2 px-1 text-center rounded-lg border text-xs font-bold transition-all ${
                dbType === db.id 
                  ? `${db.color} border-2 ring-1 ring-offset-1 ring-indigo-500 dark:ring-offset-slate-900` 
                  : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400'
              }`}
            >
              {db.label}
            </button>
          ))}
        </div>
      </div>

      {/* Server Fields */}
      {dbType !== 'sqlite' ? (
        <div className="grid grid-cols-3 gap-3">
          <div className="col-span-2">
            <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1">Host / Server-Addresse</label>
            <input 
              type="text" 
              className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-1.5 text-xs focus:ring-2 focus:ring-indigo-500" 
              value={host}
              onChange={(e) => setHost(e.target.value)}
              placeholder="z.B. db.example.com oder localhost"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1">Port</label>
            <input 
              type="text" 
              className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-1.5 text-xs text-center focus:ring-2 focus:ring-indigo-500" 
              value={port}
              onChange={(e) => setPort(e.target.value)}
            />
          </div>
        </div>
      ) : (
        <div>
          <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1 font-mono">SQLite Pfad</label>
          <input 
            type="text" 
            className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-1.5 text-xs focus:ring-2 focus:ring-indigo-500" 
            value={port}
            onChange={(e) => setPort(e.target.value)}
          />
        </div>
      )}

      {/* Database Name & SSL */}
      {dbType !== 'sqlite' && (
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1">Datenbankname</label>
            <input 
              type="text" 
              className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-1.5 text-xs focus:ring-2 focus:ring-indigo-500" 
              value={database}
              onChange={(e) => setDatabase(e.target.value)}
            />
          </div>
          <div className="flex items-center h-full pt-5 pl-1">
            <label className="flex items-center gap-2 cursor-pointer select-none text-xs text-slate-600 dark:text-slate-300">
              <input 
                type="checkbox" 
                checked={ssl}
                onChange={(e) => setSsl(e.target.checked)}
                className="rounded border-slate-300 dark:border-slate-700 text-indigo-600 focus:ring-indigo-500"
              />
              <span className="font-semibold">SSL-Verschlüsselung (standardmäßig Aus für lokale Server)</span>
            </label>
          </div>
        </div>
      )}

      {/* Credentials */}
      {dbType !== 'sqlite' && (
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1">Benutzername</label>
            <input 
              type="text" 
              className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-1.5 text-xs focus:ring-2 focus:ring-indigo-500" 
              value={username}
              onChange={(e) => setUsername(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1">Passwort</label>
            <input 
              type="password" 
              className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-1.5 text-xs focus:ring-2 focus:ring-indigo-500" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
        </div>
      )}

      {/* Live Status Warning */}
      <div className="p-3.5 rounded-lg bg-indigo-50/70 dark:bg-slate-800/40 border border-indigo-100/50 dark:border-slate-800 text-xs text-indigo-800 dark:text-indigo-400 flex gap-2.5">
        <HelpCircle className="w-5 h-5 shrink-0 text-indigo-500" />
        <div className="space-y-1">
          <span className="font-bold">💡 Wie funktioniert Introspection?</span>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
            Dieses System scannt die Metadatentabellen der Live-Datenbank und vergleicht sie mit deinen lokalen Modellen. Du kannst gefundene Abweichungen komfortabel per Knopfdruck in dein Design übernehmen.
          </p>
        </div>
      </div>

      {/* Trigger */}
      <div className="flex justify-end pt-2">
        <button
          type="button"
          onClick={handleConnect}
          disabled={!database && dbType !== 'sqlite'}
          className="flex items-center gap-1.5 px-5 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-semibold shadow-md transition disabled:opacity-50 text-xs"
        >
          <Play size={13} className="fill-white" />
          <span>Verbindung testen & Scan starten</span>
        </button>
      </div>
    </div>
  );
};
