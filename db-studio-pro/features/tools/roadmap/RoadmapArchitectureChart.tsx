import React from 'react';
import { Activity, Laptop, ChevronRight, RefreshCw, Cloud, ArrowUpRight } from 'lucide-react';

interface RoadmapArchitectureChartProps {
  activeArchSection: 'local' | 'sync' | 'cloud';
  setActiveArchSection: (section: 'local' | 'sync' | 'cloud') => void;
  totalCompleted: number;
  totalTasks: number;
  onSetView: (view: any) => void;
}

export const RoadmapArchitectureChart: React.FC<RoadmapArchitectureChartProps> = ({
  activeArchSection,
  setActiveArchSection,
  totalCompleted,
  totalTasks,
  onSetView,
}) => {
  return (
    <div className="space-y-6">
      {/* Architecture Chart */}
      <div className="bg-slate-900/50 rounded-xl p-5 border border-slate-800 flex flex-col">
        <div className="flex items-center gap-2 mb-4 shrink-0">
          <Activity className="text-indigo-400" size={16} />
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300">Zwei-System-Architektur (Visualisierung)</h3>
        </div>

        {/* Flowchart Graphics */}
        <div className="bg-slate-950 p-4 rounded-xl border border-slate-900 flex flex-col items-center justify-center gap-2 shrink-0">
          
          {/* Local Dev Server Module */}
          <button 
            type="button"
            onClick={() => setActiveArchSection('local')}
            className={`w-full p-3 text-left rounded-lg border transition-all ${
              activeArchSection === 'local' 
                ? 'bg-amber-500/10 border-amber-500/50 shadow-lg shadow-amber-500/5' 
                : 'bg-slate-900 border-slate-800 hover:border-slate-700'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1.5 text-xs font-bold text-white font-sans">
                <Laptop size={13} className="text-amber-400" />
                <span>Lokal-First Desktop (Entwickler)</span>
              </span>
              <span className="text-[9px] font-bold text-amber-300 uppercase px-1 rounded bg-amber-500/10 font-mono">SQLite / IDB</span>
            </div>
            <p className="text-[10px] text-slate-400 mt-1">Sichere lokale Metadaten-Generierung, läuft komplett offline auf Ihrem System.</p>
          </button>

          {/* Connector */}
          <div className="flex flex-col items-center my-0.5">
            <div className="w-0.5 h-6 bg-slate-800 relative flex items-center justify-center">
              <div className="absolute top-1/2 -translate-y-1/2 bg-slate-950 px-2 py-0.5 rounded border border-slate-800 text-[8px] font-mono text-indigo-400 uppercase tracking-widest font-bold">
                Sync-Wizard
              </div>
            </div>
            <ChevronRight size={14} className="text-slate-600 transform rotate-90 -mt-1" />
          </div>

          {/* Sync Bridge Module */}
          <button 
            type="button"
            onClick={() => setActiveArchSection('sync')}
            className={`w-full p-3 text-left rounded-lg border transition-all ${
              activeArchSection === 'sync' 
                ? 'bg-sky-500/10 border-sky-500/50 shadow-lg shadow-sky-500/5' 
                : 'bg-slate-900 border-slate-800 hover:border-slate-700'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1.5 text-xs font-bold text-white font-sans">
                <RefreshCw size={12} className="text-sky-400 animate-spin" style={{ animationDuration: '6s' }} />
                <span>Sync Bridge (Uploader)</span>
              </span>
              <span className="text-[9px] font-bold text-sky-300 uppercase px-1 rounded bg-sky-500/10 font-mono">SQL Migrations</span>
            </div>
            <p className="text-[10px] text-slate-400 mt-1">Interaktive Diff-Analyse, FK-Validierung und automatische Routen-Generierung.</p>
          </button>

          {/* Connector */}
          <div className="flex flex-col items-center my-0.5">
            <div className="w-0.5 h-4 bg-slate-800" />
            <ChevronRight size={14} className="text-slate-600 transform rotate-90 -mt-1" />
          </div>

          {/* Team-Cloud Hub Hosted Server Module */}
          <button 
            type="button"
            onClick={() => setActiveArchSection('cloud')}
            className={`w-full p-3 text-left rounded-lg border transition-all ${
              activeArchSection === 'cloud' 
                ? 'bg-emerald-500/10 border-emerald-500/50 shadow-lg shadow-emerald-500/5' 
                : 'bg-slate-900 border-slate-800 hover:border-slate-700'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1.5 text-xs font-bold text-white font-sans">
                <Cloud size={13} className="text-emerald-400" />
                <span>Team-Cloud Hub (Hosted Cluster)</span>
              </span>
              <span className="text-[9px] font-bold text-emerald-300 uppercase px-1 rounded bg-emerald-500/10 font-mono">Postgres / Spanner</span>
            </div>
            <p className="text-[10px] text-slate-400 mt-1">Mandantenfähige Kollaboration, Multiplayer-Sitzungen und synchronisierte Tickets.</p>
          </button>

        </div>

        {/* Explanations section */}
        <div className="mt-4 p-4 bg-slate-950/40 rounded-xl border border-slate-800 flex-1">
          {activeArchSection === 'local' && (
            <div className="space-y-2">
              <div className="flex items-center gap-1.5 text-amber-400 text-xs font-bold">
                <Laptop size={14} />
                <span>Lokal-First Fokus</span>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                Alle in DB Studio Pro angelegten Entwürfe sind standardmäßig absolut privat. Über den Offline-Adapter (SQLite in der Electron App oder IndexedDB im Browser-Fallback) werden alle relationalen Metadaten sicher und ohne Netzwerkanforderung lokal persistiert.
              </p>
              <p className="text-[10px] text-slate-500 italic">Entspricht Phase 1 des Entwicklungsplans.</p>
            </div>
          )}

          {activeArchSection === 'sync' && (
            <div className="space-y-2">
              <div className="flex items-center gap-1.5 text-sky-400 text-xs font-bold">
                <RefreshCw size={14} />
                <span>Intelligente Synchronisation</span>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                Der Sync-Wizard gleicht Ihre lokale Datenbank-Struktur ab. Er validiert Fremdschlüssel-Sicherungen, führt einen Diff mit dem Serverstand durch und generiert zerstörungsfreie relationale DDL-Migrationsskripte für Postgres.
              </p>
              <p className="text-[10px] text-slate-500 italic">Entspricht Phase 3 des Entwicklungsplans.</p>
            </div>
          )}

          {activeArchSection === 'cloud' && (
            <div className="space-y-2">
              <div className="flex items-center gap-1.5 text-emerald-400 text-xs font-bold">
                <Cloud size={14} />
                <span>Team-Cloud &amp; Mandantenfähigkeit</span>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                Sobald Daten in die Team-Cloud gepusht sind, können Teamkollegen wie Sarah oder Tom diese einsehen. Row-Level Security (RLS) verhindert die Datenüberschneidung zwischen Organisationen. Echtzeit-WebSockets halten Cursor und Chats synchron.
              </p>
              <p className="text-[10px] text-slate-500 italic">Entspricht Phase 2 &amp; 4 des Entwicklungsplans.</p>
            </div>
          )}
        </div>

      </div>

      {/* Quick Stats Panel */}
      <div className="bg-slate-900/50 rounded-xl p-5 border border-slate-800 flex items-center justify-between gap-4">
        <div>
          <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Erledigte Meilensteine</h4>
          <p className="text-2xl font-black text-white mt-1 font-mono">{totalCompleted} / {totalTasks}</p>
        </div>
        <div>
          <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider text-right">Offene Tickets im System</h4>
          <p className="text-2xl font-black text-indigo-400 mt-1 font-mono text-right">100% Sicher</p>
        </div>
        <button
          type="button"
          onClick={() => onSetView({ type: 'tickets_board' })}
          className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded text-xs font-bold transition-colors flex items-center gap-1 font-sans"
        >
          <span>Tickets</span>
          <ArrowUpRight size={12} />
        </button>
      </div>
    </div>
  );
};
