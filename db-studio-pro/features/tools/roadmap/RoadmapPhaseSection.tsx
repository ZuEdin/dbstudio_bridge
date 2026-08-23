import React from 'react';
import { Laptop, Server, RefreshCw, Users, Sparkles, CheckCircle2, Square, Ticket, Trash2 } from 'lucide-react';
import { RoadmapItem } from './types';

interface RoadmapPhaseSectionProps {
  phaseNum: number;
  stats: { completedCount: number; totalCount: number; pct: number };
  items: RoadmapItem[];
  completedState: Record<string, boolean>;
  toggleTask: (id: string) => void;
  convertToTicket: (item: RoadmapItem) => void;
  deleteCustomTask: (id: string) => void;
}

export const RoadmapPhaseSection: React.FC<RoadmapPhaseSectionProps> = ({
  phaseNum,
  stats,
  items,
  completedState,
  toggleTask,
  convertToTicket,
  deleteCustomTask,
}) => {
  const phaseTitle = phaseNum === 1 ? 'Phase 1: Lokaler State & IndexedDB Sync (Local Mode)' :
                     phaseNum === 2 ? 'Phase 2: Team-Cloud Backend & API-Infrastruktur' :
                     phaseNum === 3 ? 'Phase 3: Der Interaktive Sync-Assistent (Local -> Cloud)' :
                     phaseNum === 4 ? 'Phase 4: Team-Kollaborations-Werkzeuge (Multiplayer)' :
                     'Phase 5: Next-Level Enterprise & Developer Platform (v3.0)';
                     
  const phaseIcon = phaseNum === 1 ? <Laptop size={15} className="text-amber-400" /> :
                    phaseNum === 2 ? <Server size={15} className="text-indigo-400" /> :
                    phaseNum === 3 ? <RefreshCw size={15} className="text-sky-400 animate-pulse" /> :
                    phaseNum === 4 ? <Users size={15} className="text-emerald-400" /> :
                    <Sparkles size={15} className="text-purple-400 animate-pulse" />;

  const phaseItems = items.filter(item => item.phase === phaseNum);

  return (
    <div className="bg-slate-900/50 rounded-xl border border-slate-800 overflow-hidden flex flex-col">
      
      {/* Accordion Phase Header */}
      <div className="px-4 py-3 bg-slate-900 flex items-center justify-between border-b border-slate-800/80">
        <div className="flex items-center gap-2">
          {phaseIcon}
          <h3 className="text-xs font-bold text-white tracking-wide uppercase font-sans">{phaseTitle}</h3>
        </div>
        
        {/* Phase stats */}
        <div className="flex items-center gap-3">
          <span className="text-[10px] font-mono text-slate-400 font-bold bg-slate-950 px-2 py-0.5 rounded border border-slate-800">
            {stats.completedCount}/{stats.totalCount} Done
          </span>
          <span className={`text-xs font-bold font-mono ${stats.pct === 100 ? 'text-emerald-400' : 'text-indigo-300'}`}>
            {stats.pct}%
          </span>
        </div>
      </div>

      {/* Checklist Body */}
      <div className="p-4 divide-y divide-slate-800/40 space-y-1 max-h-64 overflow-y-auto">
        {phaseItems.map(item => {
          const isDone = !!completedState[item.id];
          return (
            <div key={item.id} className="flex items-start justify-between gap-4 py-2.5 hover:bg-slate-900/35 px-2 rounded-lg transition-colors group">
              
              {/* Left Label with Checkbox */}
              <div className="flex items-start gap-3 cursor-pointer select-none" onClick={() => toggleTask(item.id)}>
                <span className="mt-0.5 text-slate-500 hover:text-indigo-400 transition-colors shrink-0">
                  {isDone ? (
                    <CheckCircle2 size={16} className="text-emerald-400" />
                  ) : (
                    <Square size={16} className="text-slate-600" />
                  )}
                </span>
                <div>
                  <p className={`text-xs leading-relaxed transition-all ${isDone ? 'line-through text-slate-500' : 'text-slate-200'}`}>
                    {item.task}
                  </p>
                  <span className="inline-block mt-1 text-[9px] font-mono text-indigo-400 uppercase tracking-wide bg-indigo-500/10 px-1.5 py-0.2 rounded">
                    {item.category}
                  </span>
                </div>
              </div>

              {/* Right Quick Action: Convert to Ticket / Delete */}
              <div className="flex items-center gap-2 shrink-0 opacity-40 group-hover:opacity-100 transition-opacity">
                
                {/* Convert to Kanban Ticket Button */}
                <button
                  type="button"
                  onClick={() => convertToTicket(item)}
                  title="In Team-Aufgabe / Kanban-Ticket umwandeln"
                  className="p-1 rounded bg-slate-800 hover:bg-indigo-600 hover:text-white text-indigo-400 transition-all border border-slate-700/50"
                >
                  <Ticket size={11} />
                </button>

                {/* Delete custom task */}
                {item.id.startsWith('custom-') && (
                  <button
                    type="button"
                    onClick={() => deleteCustomTask(item.id)}
                    title="Ziel löschen"
                    className="p-1 rounded bg-slate-800 hover:bg-red-600 hover:text-white text-red-400 transition-all border border-slate-700/50"
                  >
                    <Trash2 size={11} />
                  </button>
                )}
              </div>

            </div>
          );
        })}
        {phaseItems.length === 0 && (
          <p className="text-xs text-slate-500 italic py-3 text-center">Keine Meilensteine in dieser Phase vorhanden.</p>
        )}
      </div>
    </div>
  );
};
