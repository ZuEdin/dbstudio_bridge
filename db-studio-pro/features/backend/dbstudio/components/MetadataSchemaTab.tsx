import React, { useState, useEffect } from 'react';
import { Table, Query } from '../../../../types/index';
import { 
  Database, Layers, Key, UploadCloud, RefreshCw, Code, Users, Terminal 
} from 'lucide-react';
import { getGeneratedCodeForTab } from '../utils/codeGenerators';

interface MetadataSchemaTabProps {
  activeMode: 'local' | 'cloud';
  systemSchema: Record<string, {
    name: string;
    description: string;
    fields: { name: string; type: string; isKey?: boolean; comment: string }[];
  }>;
  selectedSystemTable: string;
  setSelectedSystemTable: (val: string) => void;
  tables: Table[];
  selectedTables: Record<string, boolean>;
  setSelectedTables: React.Dispatch<React.SetStateAction<Record<string, boolean>>>;
  handleToggleTable: (id: string) => void;
  queries: Query[];
  selectedQueries: Record<string, boolean>;
  setSelectedQueries: React.Dispatch<React.SetStateAction<Record<string, boolean>>>;
  handleToggleQuery: (id: string) => void;
  implementGoal: string;
  setImplementGoal: (val: string) => void;
  backendTemplate: 'express' | 'nestjs';
  setBackendTemplate: (val: 'express' | 'nestjs') => void;
  authProvider: 'jwt' | 'google' | 'github';
  setAuthProvider: (val: 'jwt' | 'google' | 'github') => void;
  genCrud: boolean;
  setGenCrud: (val: boolean) => void;
  genTypes: boolean;
  setGenTypes: (val: boolean) => void;
  enableRls: boolean;
  setEnableRls: (val: boolean) => void;
  runSyncSimulation: () => void;
  syncStatus: 'idle' | 'testing' | 'generating' | 'uploading' | 'completed' | 'error';
  syncLogs: string[];
}

export const MetadataSchemaTab: React.FC<MetadataSchemaTabProps> = ({
  activeMode,
  systemSchema,
  selectedSystemTable,
  setSelectedSystemTable,
  tables,
  selectedTables,
  setSelectedTables,
  handleToggleTable,
  queries,
  selectedQueries,
  setSelectedQueries,
  handleToggleQuery,
  implementGoal,
  setImplementGoal,
  backendTemplate,
  setBackendTemplate,
  authProvider,
  setAuthProvider,
  genCrud,
  setGenCrud,
  genTypes,
  setGenTypes,
  enableRls,
  setEnableRls,
  runSyncSimulation,
  syncStatus,
  syncLogs,
}) => {
  const [activeTab, setActiveTab] = useState<'sql' | 'backend' | 'auth'>('sql');
  const [generatedCode, setGeneratedCode] = useState('');

  useEffect(() => {
    if (syncStatus === 'completed') {
      const code = getGeneratedCodeForTab(
        activeTab,
        backendTemplate,
        authProvider,
        enableRls,
        tables,
        selectedTables,
        implementGoal
      );
      setGeneratedCode(code);
    }
  }, [activeTab, backendTemplate, authProvider, enableRls, syncStatus, selectedTables, tables, implementGoal]);

  const handleSelectAllTables = () => {
    const allSelected = tables.every(t => selectedTables[t.id]);
    const next: Record<string, boolean> = {};
    tables.forEach(t => { next[t.id] = !allSelected; });
    setSelectedTables(next);
  };

  const handleSelectAllQueries = () => {
    const allSelected = queries.every(q => selectedQueries[q.id]);
    const next: Record<string, boolean> = {};
    queries.forEach(q => { next[q.id] = !allSelected; });
    setSelectedQueries(next);
  };

  return (
    <div id="metadata_schema_tab_container" className="grid grid-cols-1 xl:grid-cols-12 gap-6 animate-in fade-in duration-200">
      {/* Left Column (System Schema Explorer & Mode Details) */}
      <div className="xl:col-span-4 space-y-6 flex flex-col h-full min-h-0">
        
        {/* Active Mode Status Panel */}
        <div className="bg-slate-800/50 rounded-xl p-5 border border-slate-700/60 relative overflow-hidden shrink-0">
          <div className={`absolute top-0 left-0 right-0 h-1 ${activeMode === 'local' ? 'bg-amber-500' : 'bg-emerald-500'}`} />
          <h2 className="text-sm font-bold text-white flex items-center justify-between mb-3">
            <span>Aktueller Status</span>
            <span className={`inline-flex items-center gap-1.5 text-[10px] px-2 py-0.5 rounded-full font-bold border ${activeMode === 'local' ? 'bg-amber-500/10 text-amber-300 border-amber-500/20' : 'bg-emerald-500/10 text-emerald-300 border-emerald-500/20'}`}>
              <span className={`w-1.5 h-1.5 rounded-full ${activeMode === 'local' ? 'bg-amber-400 animate-pulse' : 'bg-emerald-400 animate-pulse'}`} />
              {activeMode === 'local' ? 'Lokal-First' : 'Team-Cloud Online'}
            </span>
          </h2>
          
          <p className="text-xs text-slate-300 leading-relaxed">
            {activeMode === 'local' 
              ? "Sie arbeiten auf Ihrer lokalen Entwickler-Maschine. Alle Datenbank-Spezifikationen, Relationen, Tickets und Entwürfe werden sicher in einer lokalen SQLite-Datei gesichert."
              : "Sie sind mit der mandantenfähigen Team-Cloud verbunden. Ihre Änderungen werden in Echtzeit via WebSockets synchronisiert. Sarah und Tom können Ihre Änderungen sofort sehen."}
          </p>

          <div className="mt-4 bg-slate-900/60 p-3 rounded-lg border border-slate-700/50 text-xs flex items-center gap-3">
            <Database className="text-slate-400" size={16} />
            <div>
              <p className="font-semibold text-slate-200">Verwendete Metadaten-DB:</p>
              <p className="font-mono text-[10px] text-slate-400">{activeMode === 'local' ? 'sqlite://localhost/db_studio_pro.db' : 'postgresql://dbstudio-cloud-cluster:5432/main_metadata'}</p>
            </div>
          </div>
        </div>

        {/* DB Studio's Own Schema Explorer */}
        <div className="bg-slate-800/40 rounded-xl border border-slate-700/60 flex flex-col flex-1 min-h-[350px]">
          <div className="p-4 border-b border-slate-700/60 flex items-center gap-2">
            <Layers className="text-indigo-400" size={16} />
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300">System Metadaten-Tabellen</h3>
          </div>
          
          <div className="grid grid-cols-2 p-2 gap-1 border-b border-slate-700/50 shrink-0">
            {Object.keys(systemSchema).map(tblName => (
              <button
                key={tblName}
                onClick={() => setSelectedSystemTable(tblName)}
                className={`text-left p-2 rounded text-xs font-mono transition-colors truncate cursor-pointer ${selectedSystemTable === tblName ? 'bg-indigo-600/20 text-indigo-300 border border-indigo-500/30' : 'hover:bg-slate-700/40 text-slate-400'}`}
              >
                📁 {tblName}
              </button>
            ))}
          </div>

          <div className="p-4 overflow-y-auto flex-1 space-y-3">
            <div>
              <h4 className="text-sm font-semibold text-white font-mono">{systemSchema[selectedSystemTable]?.name}</h4>
              <p className="text-xs text-slate-400 mt-1">{systemSchema[selectedSystemTable]?.description}</p>
            </div>

            <div className="border border-slate-700/50 rounded-lg overflow-hidden bg-slate-900/55">
              <div className="grid grid-cols-12 bg-slate-800/80 text-[10px] uppercase font-bold text-slate-400 p-2 border-b border-slate-700/60 font-mono">
                <div className="col-span-5">Feld</div>
                <div className="col-span-4">Typ</div>
                <div className="col-span-3 text-right">Details</div>
              </div>
              <div className="divide-y divide-slate-800/60 font-mono text-[11px] max-h-48 overflow-y-auto">
                {systemSchema[selectedSystemTable]?.fields.map(f => (
                  <div key={f.name} className="grid grid-cols-12 p-2 hover:bg-slate-800/30 group">
                    <div className="col-span-5 font-semibold text-slate-200 flex items-center gap-1">
                      {f.isKey && <Key size={10} className="text-amber-400" />}
                      <span>{f.name}</span>
                    </div>
                    <div className="col-span-4 text-indigo-300">{f.type}</div>
                    <div className="col-span-3 text-right text-slate-500 text-[10px] group-hover:text-slate-300" title={f.comment}>Info</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Right Column (Sync Upload Assistant & Output) */}
      <div className="xl:col-span-8 flex flex-col space-y-6">
        
        {/* Synchronisierungs-Assistent */}
        <div className="bg-slate-800/50 rounded-xl p-6 border border-slate-700/60 relative">
          <h2 className="text-base font-bold text-white flex items-center gap-2 mb-4">
            <UploadCloud className="text-indigo-400" size={18} />
            <span>Lokale Daten & Schema in die Team-Cloud laden</span>
          </h2>

          {/* Selector Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            {/* Tables list */}
            <div className="bg-slate-900/60 p-4 rounded-xl border border-slate-700/50">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3 flex justify-between items-center">
                <span>Tabellen für Upload ({tables.length})</span>
                <button 
                  onClick={handleSelectAllTables}
                  className="text-[10px] text-indigo-400 hover:underline cursor-pointer"
                >
                  Alle an/abwählen
                </button>
              </h3>
              <div className="space-y-1.5 max-h-36 overflow-y-auto pr-2">
                {tables.map(t => (
                  <label key={t.id} className="flex items-center gap-2 p-2 rounded bg-slate-800/40 hover:bg-slate-800/80 cursor-pointer transition-colors text-xs text-slate-300">
                    <input 
                      type="checkbox" 
                      checked={!!selectedTables[t.id]} 
                      onChange={() => handleToggleTable(t.id)}
                      className="rounded border-slate-700 text-indigo-600 focus:ring-indigo-500 bg-slate-900"
                    />
                    <span className="font-mono text-white font-semibold">{t.name}</span>
                    <span className="text-[10px] text-slate-500 ml-auto">({t.fields.length} Felder)</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Queries list */}
            <div className="bg-slate-900/60 p-4 rounded-xl border border-slate-700/50">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3 flex justify-between items-center">
                <span>Abfragen für Upload ({queries.length})</span>
                <button 
                  onClick={handleSelectAllQueries}
                  className="text-[10px] text-indigo-400 hover:underline cursor-pointer"
                >
                  Alle an/abwählen
                </button>
              </h3>
              <div className="space-y-1.5 max-h-36 overflow-y-auto pr-2">
                {queries.length > 0 ? (
                  queries.map(q => (
                    <label key={q.id} className="flex items-center gap-2 p-2 rounded bg-slate-800/40 hover:bg-slate-800/80 cursor-pointer transition-colors text-xs text-slate-300">
                      <input 
                        type="checkbox" 
                        checked={!!selectedQueries[q.id]} 
                        onChange={() => handleToggleQuery(q.id)}
                        className="rounded border-slate-700 text-indigo-600 focus:ring-indigo-500 bg-slate-900"
                      />
                      <span className="font-mono text-white truncate max-w-[150px]" title={q.name}>{q.name}</span>
                      <span className="text-[9px] bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 px-1 rounded ml-auto">SELECT</span>
                    </label>
                  ))
                ) : (
                  <p className="text-xs text-slate-500 text-center py-6">Keine benutzerdefinierten Abfragen entworfen.</p>
                )}
              </div>
            </div>
          </div>

          {/* AI Prompt / Questionnaire */}
          <div className="bg-slate-900/45 p-4 rounded-xl border border-slate-700/50 mb-6 space-y-4">
            <div className="flex gap-2 items-center">
              <Terminal size={14} className="text-indigo-400" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300">Implementierungs-Fragebogen (Team Cloud Integration)</h3>
            </div>

            <div>
              <label className="block text-xs text-slate-400 mb-1.5 font-semibold">Was soll in diesem Team-Cloud-Projekt implementiert werden?</label>
              <div className="flex gap-2">
                <input 
                  type="text"
                  value={implementGoal}
                  onChange={e => setImplementGoal(e.target.value)}
                  placeholder="z.B. Erstelle eine Tabelle für Aufgaben und verknüpfe sie mit Kunden"
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-xs focus:outline-none focus:border-indigo-500 transition-colors text-slate-200"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pb-1">
              <div>
                <label className="block text-[11px] text-slate-400 mb-1 font-semibold">Backend-Architektur / Framework</label>
                <select
                  value={backendTemplate}
                  onChange={e => setBackendTemplate(e.target.value as any)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-xs focus:outline-none focus:border-indigo-500 transition-colors text-slate-200"
                >
                  <option value="express">Express.js (NodeJS Template)</option>
                  <option value="nestjs">NestJS (TypeScript Controller & Services)</option>
                </select>
              </div>
              <div>
                <label className="block text-[11px] text-slate-400 mb-1 font-semibold">Authentifizierungs-Methode</label>
                <select
                  value={authProvider}
                  onChange={e => setAuthProvider(e.target.value as any)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-xs focus:outline-none focus:border-indigo-500 transition-colors text-slate-200"
                >
                  <option value="jwt">JWT (JSON Web Token & Bearer Strategy)</option>
                  <option value="google">Google OAuth2 SSO Strategy</option>
                  <option value="github">GitHub SSO & Passport Integration</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs pt-2 border-t border-slate-800/40">
              <label className="flex items-center gap-2 cursor-pointer">
                <input 
                  type="checkbox"
                  checked={genCrud}
                  onChange={e => setGenCrud(e.target.checked)}
                  className="rounded border-slate-700 text-indigo-600 focus:ring-indigo-500 bg-slate-900"
                />
                <span>CRUD-Endpunkte erzeugen</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input 
                  type="checkbox"
                  checked={genTypes}
                  onChange={e => setGenTypes(e.target.checked)}
                  className="rounded border-slate-700 text-indigo-600 focus:ring-indigo-500 bg-slate-900"
                />
                <span>TypeScript & Zod Validierung</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input 
                  type="checkbox"
                  checked={enableRls}
                  onChange={e => setEnableRls(e.target.checked)}
                  className="rounded border-slate-700 text-indigo-600 focus:ring-indigo-500 bg-slate-900"
                />
                <span>Row-Level Security (RLS)</span>
              </label>
            </div>
          </div>

          {/* Upload Button */}
          <div className="flex items-center justify-between gap-4">
            <p className="text-xs text-slate-400">
              Die Daten werden an Ihre Team-Instanz übermittelt und dort live registriert.
            </p>
            <button
              onClick={runSyncSimulation}
              disabled={syncStatus !== 'idle' && syncStatus !== 'completed'}
              className="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-bold px-6 py-2.5 rounded-lg text-xs flex items-center gap-2 shadow-lg shadow-indigo-600/10 hover:shadow-indigo-600/20 transition-all shrink-0 cursor-pointer"
            >
              {syncStatus === 'idle' || syncStatus === 'completed' ? (
                <>
                  <UploadCloud size={16} />
                  <span>In Team-Cloud hochladen</span>
                </>
              ) : (
                <>
                  <RefreshCw size={14} className="animate-spin" />
                  <span>Synchronisiere...</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Sync Console & Code Output */}
        {syncStatus !== 'idle' && (
          <div className="bg-slate-950 rounded-xl border border-slate-700 overflow-hidden flex flex-col flex-1 animate-in fade-in slide-in-from-bottom-2 duration-300 min-h-[300px]">
            
            {/* Console Header */}
            <div className="bg-slate-900 px-4 py-3 border-b border-slate-800 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-red-500" />
                <span className="w-2.5 h-2.5 rounded-full bg-yellow-500" />
                <span className="w-2.5 h-2.5 rounded-full bg-green-500" />
                <span className="text-xs font-mono font-bold text-slate-400 ml-2">Console & Code Generator</span>
              </div>

              {syncStatus === 'completed' && (
                <div className="flex bg-slate-800 p-0.5 rounded-lg border border-slate-700 text-[11px] font-mono">
                  <button 
                    onClick={() => setActiveTab('sql')}
                    className={`px-2 py-1 rounded-md transition-all cursor-pointer ${activeTab === 'sql' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'}`}
                  >
                    migrations.sql
                  </button>
                  <button 
                    onClick={() => setActiveTab('backend')}
                    className={`px-2 py-1 rounded-md transition-all cursor-pointer ${activeTab === 'backend' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'}`}
                  >
                    {backendTemplate === 'express' ? 'routes.ts' : 'cloud-hub.controller.ts'}
                  </button>
                  <button 
                    onClick={() => setActiveTab('auth')}
                    className={`px-2 py-1 rounded-md transition-all cursor-pointer ${activeTab === 'auth' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'}`}
                  >
                    {backendTemplate === 'express' ? 'auth.ts' : 'jwt.strategy.ts'}
                  </button>
                </div>
              )}
            </div>

            {/* Console Body Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 flex-1 divide-y md:divide-y-0 md:divide-x divide-slate-800 min-h-[220px]">
              
              {/* Live Logs Left Panel */}
              <div className="p-4 font-mono text-[11px] text-slate-300 overflow-y-auto space-y-1 bg-slate-950/80">
                {syncLogs.map((log, idx) => (
                  <div key={idx} className="leading-relaxed">
                    <span className="text-emerald-400 font-bold">&gt;</span> {log}
                  </div>
                ))}
                {syncStatus !== 'completed' && (
                  <div className="flex items-center gap-2 text-slate-500 animate-pulse mt-2">
                    <RefreshCw size={10} className="animate-spin" />
                    <span>Analysiere & verarbeite Metadaten-Strom...</span>
                  </div>
                )}
              </div>

              {/* Code Preview Right Panel */}
              <div className="bg-slate-900/40 overflow-hidden flex flex-col font-mono text-[11px]">
                {syncStatus === 'completed' ? (
                  <div className="p-4 overflow-y-auto flex-1 max-h-64 md:max-h-none">
                    <pre className="text-slate-300 leading-normal whitespace-pre">
                      <code>{generatedCode}</code>
                    </pre>
                  </div>
                ) : (
                  <div className="flex-1 flex items-center justify-center flex-col text-slate-500 gap-2 p-6 text-center">
                    <Code size={24} className="opacity-25" />
                    <p>Warten auf Generierung der Migrations-Skripte und API-Schnittstellen...</p>
                  </div>
                )}
              </div>

            </div>

          </div>
        )}

        {/* Active Cloud Collaborators Card (Simulated Cloud Multiplayer) */}
        {activeMode === 'cloud' && (
          <div className="bg-slate-800/35 p-5 rounded-xl border border-slate-700/50 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 animate-in fade-in duration-200 shrink-0">
            <div className="flex items-center gap-3">
              <Users className="text-emerald-400 shrink-0" size={18} />
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300">Aktive Teammitglieder in der Cloud</h4>
                <p className="text-xs text-slate-400 mt-0.5">Folgende Personen bearbeiten dieses Schema gerade live mit Ihnen.</p>
              </div>
            </div>
            
            <div className="flex gap-4 items-center shrink-0">
              <div className="flex items-center gap-1.5 text-xs">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 border-2 border-slate-900" />
                <span className="text-white font-medium">Ich (u1)</span>
              </div>
              <div className="flex items-center gap-1.5 text-xs text-slate-300">
                <span className="w-2.5 h-2.5 rounded-full bg-blue-400 border-2 border-slate-900 animate-pulse" />
                <span className="font-medium">Sarah (u2)</span>
                <span className="text-[10px] text-slate-500">Bearbeitet 'Bestellungen'</span>
              </div>
              <div className="flex items-center gap-1.5 text-xs text-slate-300">
                <span className="w-2.5 h-2.5 rounded-full bg-purple-400 border-2 border-slate-900 animate-pulse" />
                <span className="font-medium">Tom (u3)</span>
                <span className="text-[10px] text-slate-500">Erstellt Query 'Umsätze'</span>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
