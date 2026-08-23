import React, { useState, useEffect } from 'react';
import { 
  Database, 
  Table, 
  Search, 
  Play, 
  RefreshCw, 
  CheckCircle2, 
  AlertTriangle, 
  HardDrive, 
  FileCode, 
  Layers, 
  Key, 
  Hash, 
  Terminal, 
  ExternalLink,
  Plus,
  FileSpreadsheet,
  Sparkles
} from 'lucide-react';
import { bridgeApi } from '../../services/bridgeApi';
import { LocalProject } from '../../types/bridge';
import { AccessMigrationView } from '../database/AccessMigrationView';

export const DatabaseTab: React.FC = () => {
  const [activeMode, setActiveMode] = useState<'access_migration' | 'explorer'>('access_migration');
  const [projects, setProjects] = useState<LocalProject[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<string>('');
  const [databases, setDatabases] = useState<any[]>([]);
  const [selectedDbPath, setSelectedDbPath] = useState<string>('');
  const [tables, setTables] = useState<any[]>([]);
  const [selectedTable, setSelectedTable] = useState<string>('');
  const [queryInput, setQueryInput] = useState<string>('');
  const [queryResult, setQueryResult] = useState<{
    columns: string[];
    rows: any[];
    rowCount: number;
    error?: string;
  } | null>(null);
  const [isLoadingDatabases, setIsLoadingDatabases] = useState(false);
  const [isQuerying, setIsQuerying] = useState(false);

  useEffect(() => {
    loadProjects();
  }, []);

  const loadProjects = async () => {
    try {
      const projs = await bridgeApi.getProjects();
      setProjects(projs);
      if (projs.length > 0) {
        setSelectedProjectId(projs[0].id);
        loadDatabases(projs[0].id);
      } else {
        loadDatabases();
      }
    } catch {
      loadDatabases();
    }
  };

  const loadDatabases = async (projId?: string) => {
    setIsLoadingDatabases(true);
    setDatabases([]);
    setSelectedDbPath('');
    setTables([]);
    setQueryResult(null);
    try {
      const res = await bridgeApi.findDatabases(projId);
      if (res.success && res.databases.length > 0) {
        setDatabases(res.databases);
        setSelectedDbPath(res.databases[0].fullPath);
        inspectDb(res.databases[0].fullPath);
      }
    } catch {
      // Ignore
    } finally {
      setIsLoadingDatabases(false);
    }
  };

  const inspectDb = async (dbPath: string) => {
    if (!dbPath) return;
    try {
      const res = await bridgeApi.inspectDatabase(dbPath);
      if (res.success && res.tables) {
        setTables(res.tables);
        if (res.tables.length > 0) {
          const firstTable = res.tables[0].name;
          setSelectedTable(firstTable);
          const initialQuery = `SELECT * FROM ${firstTable} LIMIT 25;`;
          setQueryInput(initialQuery);
          executeQuery(dbPath, initialQuery);
        }
      }
    } catch {
      // Ignore
    }
  };

  const executeQuery = async (dbPath: string, sql: string) => {
    if (!dbPath || !sql.trim()) return;
    setIsQuerying(true);
    try {
      const res = await bridgeApi.queryDatabase(dbPath, sql.trim(), 50);
      if (res.success) {
        setQueryResult({
          columns: res.columns || [],
          rows: res.rows || [],
          rowCount: res.rowCount || 0
        });
      } else {
        setQueryResult({
          columns: [],
          rows: [],
          rowCount: 0,
          error: res.error
        });
      }
    } catch (e: any) {
      setQueryResult({
        columns: [],
        rows: [],
        rowCount: 0,
        error: e.message
      });
    } finally {
      setIsQuerying(false);
    }
  };

  const handleSelectTable = (tblName: string) => {
    setSelectedTable(tblName);
    const sql = `SELECT * FROM ${tblName} LIMIT 25;`;
    setQueryInput(sql);
    executeQuery(selectedDbPath, sql);
  };

  return (
    <div className="space-y-6">
      {/* Top Mode Switcher Bar */}
      <div className="bg-[#0E1524]/90 backdrop-blur-md border border-slate-800/80 rounded-2xl p-2 shadow-xl flex items-center gap-2">
        <button
          onClick={() => setActiveMode('access_migration')}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-xs font-bold transition-all ${
            activeMode === 'access_migration'
              ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-lg shadow-emerald-950/50 glow-emerald'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
          }`}
        >
          <FileSpreadsheet className="w-4 h-4 text-emerald-300" />
          <span>Microsoft Access Migration (.accdb & .mdb)</span>
          <span className="text-[10px] font-mono bg-emerald-400/20 text-emerald-300 px-2 py-0.2 rounded-full border border-emerald-400/30">
            Phase 8
          </span>
        </button>

        <button
          onClick={() => setActiveMode('explorer')}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-xs font-bold transition-all ${
            activeMode === 'explorer'
              ? 'bg-gradient-to-r from-indigo-600 to-blue-600 text-white shadow-lg shadow-indigo-950/50 glow-purple'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
          }`}
        >
          <Database className="w-4 h-4 text-indigo-300" />
          <span>SQLite & Live DB Explorer</span>
          <span className="text-[10px] font-mono bg-indigo-400/20 text-indigo-300 px-2 py-0.2 rounded-full border border-indigo-400/30">
            Phase 4
          </span>
        </button>
      </div>

      {activeMode === 'access_migration' ? (
        <AccessMigrationView />
      ) : (
        <div className="space-y-6">
          {/* Top Controls: Project & Database Selector */}
          <div className="bg-[#0E1524]/80 backdrop-blur-md border border-slate-800/80 rounded-3xl p-6 shadow-2xl space-y-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800/80 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-indigo-500/20 via-indigo-600/10 to-blue-500/5 border border-indigo-500/30 flex items-center justify-center text-indigo-400 font-bold glow-purple">
                  <Database className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-slate-100 flex items-center gap-2">
                    <span>Datenbank & Schema Explorer</span>
                    <span className="text-[10px] font-mono uppercase bg-indigo-500/15 text-indigo-300 px-2.5 py-0.5 rounded-full border border-indigo-500/30 font-semibold">
                      Phase 4 Live
                    </span>
                  </h2>
                  <p className="text-xs text-slate-400">Direkte Einsicht in SQLite- & Projekt-Datenbanken, Tabellen-Schemata und SQL-Abfragen</p>
                </div>
              </div>

              {/* Selectors */}
              <div className="flex items-center gap-3 flex-wrap">
                <div className="flex items-center gap-2 bg-[#080D17] px-3 py-1.5 rounded-xl border border-slate-800">
                  <span className="text-xs text-slate-400">Projekt:</span>
                  <select
                    value={selectedProjectId}
                onChange={(e) => {
                  setSelectedProjectId(e.target.value);
                  loadDatabases(e.target.value);
                }}
                className="bg-transparent text-slate-100 text-xs font-semibold outline-none cursor-pointer"
              >
                {projects.map((p) => (
                  <option key={p.id} value={p.id} className="bg-slate-900 text-slate-100">
                    {p.name}
                  </option>
                ))}
              </select>
            </div>

            <button
              onClick={() => loadDatabases(selectedProjectId)}
              disabled={isLoadingDatabases}
              className="bg-slate-900 hover:bg-slate-800 text-slate-300 text-xs font-semibold px-3 py-2 rounded-xl border border-slate-800 transition-all flex items-center gap-1.5 shadow-sm"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoadingDatabases ? 'animate-spin text-indigo-400' : ''}`} />
              <span>Neu laden</span>
            </button>
          </div>
        </div>

        {/* Database files found */}
        {databases.length === 0 ? (
          <div className="p-6 rounded-2xl bg-[#080D17] border border-slate-800/80 text-center space-y-2">
            <Database className="w-8 h-8 text-slate-600 mx-auto" />
            <p className="text-xs text-slate-400">Keine `.db` oder `.sqlite` Datenbankdateien in diesem Projekt gefunden.</p>
            <p className="text-[11px] text-slate-500">Datenbankdateien werden automatisch erkannt, sobald Ihr Backend migrations- oder datenbezogene Operationen durchführt.</p>
          </div>
        ) : (
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider mr-2">Gefundene Datenbanken:</span>
            {databases.map((db, idx) => {
              const isSelected = selectedDbPath === db.fullPath;
              return (
                <button
                  key={idx}
                  onClick={() => {
                    setSelectedDbPath(db.fullPath);
                    inspectDb(db.fullPath);
                  }}
                  className={`px-3.5 py-2 rounded-xl border text-xs font-mono transition-all flex items-center gap-2 ${
                    isSelected
                      ? 'bg-indigo-500/15 border-indigo-500/40 text-indigo-300 glow-purple shadow-sm'
                      : 'bg-[#080D17] border-slate-800 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <Database className="w-3.5 h-3.5" />
                  <span className="font-bold">{db.name}</span>
                  <span className="text-[10px] opacity-70 font-sans">({db.sizeFormatted})</span>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Main Grid: Left Tables Sidebar, Right Query & Data Grid */}
      {selectedDbPath && (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Left Sidebar: Tables List */}
          <div className="lg:col-span-1 bg-[#0E1524]/80 backdrop-blur-md border border-slate-800/80 rounded-3xl p-5 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Layers className="w-4 h-4 text-indigo-400" />
                <h3 className="font-bold text-sm text-slate-100">Tabellen</h3>
              </div>
              <span className="text-[10px] font-mono bg-indigo-500/15 text-indigo-300 px-2 py-0.5 rounded-full border border-indigo-500/30">
                {tables.length}
              </span>
            </div>

            <div className="space-y-1.5 max-h-[500px] overflow-y-auto pr-1">
              {tables.map((tbl, i) => {
                const isSelected = selectedTable === tbl.name;
                return (
                  <button
                    key={i}
                    onClick={() => handleSelectTable(tbl.name)}
                    className={`w-full text-left p-2.5 rounded-xl border transition-all flex items-center justify-between text-xs font-mono ${
                      isSelected
                        ? 'bg-indigo-500/20 border-indigo-500/40 text-indigo-200 font-bold shadow-sm'
                        : 'bg-[#080D17] border-slate-800/80 text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
                    }`}
                  >
                    <div className="flex items-center gap-2 truncate">
                      <Table className="w-3.5 h-3.5 shrink-0 text-indigo-400" />
                      <span className="truncate">{tbl.name}</span>
                    </div>
                    {tbl.rowCount !== undefined && (
                      <span className="text-[10px] font-sans opacity-70 ml-1">{tbl.rowCount}</span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Right Area: SQL Console & Data Table */}
          <div className="lg:col-span-3 space-y-4">
            {/* SQL Console */}
            <div className="bg-[#0E1524]/80 backdrop-blur-md border border-slate-800/80 rounded-3xl p-5 shadow-2xl space-y-3">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <Terminal className="w-4 h-4 text-indigo-400" />
                  <span className="text-xs font-bold text-slate-200 uppercase tracking-wider">SQL Query Console</span>
                </div>
                <button
                  onClick={() => executeQuery(selectedDbPath, queryInput)}
                  disabled={isQuerying || !queryInput.trim()}
                  className="bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-500 hover:to-blue-500 disabled:opacity-40 text-white text-xs font-bold px-4 py-1.5 rounded-xl transition-all shadow-md shadow-indigo-950/40 flex items-center gap-1.5"
                >
                  {isQuerying ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Play className="w-3.5 h-3.5 fill-current" />}
                  <span>Ausführen</span>
                </button>
              </div>

              <div className="relative">
                <textarea
                  value={queryInput}
                  onChange={(e) => setQueryInput(e.target.value)}
                  rows={3}
                  placeholder="SELECT * FROM Users LIMIT 25;"
                  className="w-full bg-[#080D17] border border-slate-700/80 focus:border-indigo-500 rounded-2xl p-3 text-xs font-mono text-indigo-200 outline-none shadow-inner resize-none"
                />
              </div>
            </div>

            {/* Query Results Table */}
            <div className="bg-[#0E1524]/80 backdrop-blur-md border border-slate-800/80 rounded-3xl p-5 shadow-2xl space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="font-bold text-sm text-slate-100 flex items-center gap-2">
                  <span>Ergebnisdaten</span>
                  {queryResult && !queryResult.error && (
                    <span className="text-[10px] font-mono text-slate-400 bg-slate-900 px-2 py-0.5 rounded-md border border-slate-800">
                      {queryResult.rowCount} Zeilen gefunden
                    </span>
                  )}
                </h4>
              </div>

              {queryResult?.error ? (
                <div className="p-4 rounded-2xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0 text-rose-400" />
                  <span className="font-mono">{queryResult.error}</span>
                </div>
              ) : queryResult && queryResult.rows.length > 0 ? (
                <div className="overflow-x-auto border border-slate-800 rounded-2xl bg-[#080D17]">
                  <table className="w-full text-left text-xs font-mono">
                    <thead className="bg-slate-900/90 text-slate-300 border-b border-slate-800">
                      <tr>
                        {queryResult.columns.map((col, idx) => (
                          <th key={idx} className="p-3 font-semibold text-[11px] uppercase tracking-wider text-indigo-300 whitespace-nowrap">
                            {col}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60 text-slate-200">
                      {queryResult.rows.map((row, rIdx) => (
                        <tr key={rIdx} className="hover:bg-slate-900/40 transition-colors">
                          {queryResult.columns.map((col, cIdx) => (
                            <td key={cIdx} className="p-3 whitespace-nowrap text-slate-300">
                              {row[col] !== null && row[col] !== undefined ? String(row[col]) : <span className="text-slate-600 italic">null</span>}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="p-8 text-center text-slate-500 text-xs font-mono">
                  Keine Datenzeilen für diese Abfrage vorhanden.
                </div>
              )}
            </div>
          </div>
        </div>
      )}
        </div>
      )}
    </div>
  );
};
