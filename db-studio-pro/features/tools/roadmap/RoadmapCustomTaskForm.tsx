import React from 'react';
import { Plus } from 'lucide-react';

interface RoadmapCustomTaskFormProps {
  customTask: string;
  setCustomTask: (task: string) => void;
  customPhase: number;
  setCustomPhase: (phase: number) => void;
  addCustomTask: (e: React.FormEvent) => void;
}

export const RoadmapCustomTaskForm: React.FC<RoadmapCustomTaskFormProps> = ({
  customTask,
  setCustomTask,
  customPhase,
  setCustomPhase,
  addCustomTask,
}) => {
  return (
    <form onSubmit={addCustomTask} className="bg-slate-900/40 p-4 rounded-xl border border-slate-800/60 space-y-4">
      <h4 className="text-xs font-bold text-white flex items-center gap-1.5">
        <Plus size={14} className="text-indigo-400" />
        <span>Einen eigenen Projekt-Meilenstein hinzufügen</span>
      </h4>
      <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
        <div className="md:col-span-6">
          <input 
            type="text" 
            value={customTask}
            onChange={e => setCustomTask(e.target.value)}
            placeholder="z.B. Integration von Supabase als Ausweich-Provider..."
            className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-xs focus:outline-none focus:border-indigo-500 text-slate-200"
          />
        </div>
        <div className="md:col-span-3">
          <select
            value={customPhase}
            onChange={e => setCustomPhase(parseInt(e.target.value, 10))}
            className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-xs focus:outline-none focus:border-indigo-500 text-slate-300 font-sans"
          >
            <option value={1}>Phase 1 (Lokal)</option>
            <option value={2}>Phase 2 (Cloud DB)</option>
            <option value={3}>Phase 3 (Sync)</option>
            <option value={4}>Phase 4 (Team)</option>
            <option value={5}>Phase 5 (v3.0 Enterprise)</option>
          </select>
        </div>
        <div className="md:col-span-3">
          <button
            type="submit"
            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded-lg text-xs flex items-center justify-center gap-1.5 transition-colors"
          >
            <Plus size={12} />
            <span>Hinzufügen</span>
          </button>
        </div>
      </div>
    </form>
  );
};
