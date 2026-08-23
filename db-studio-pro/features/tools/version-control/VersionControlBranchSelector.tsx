import React, { useState } from 'react';
import { GitBranch, Plus, Trash2, ShieldCheck } from 'lucide-react';
import { GitBranch as GitBranchType } from './types';

interface VersionControlBranchSelectorProps {
  branches: GitBranchType[];
  activeBranch: string;
  onSelectBranch: (branchName: string) => void;
  onCreateBranch: (branchName: string) => void;
  onDeleteBranch: (branchName: string) => void;
}

export const VersionControlBranchSelector: React.FC<VersionControlBranchSelectorProps> = ({
  branches,
  activeBranch,
  onSelectBranch,
  onCreateBranch,
  onDeleteBranch,
}) => {
  const [newBranchName, setNewBranchName] = useState('');
  const [isAdding, setIsAdding] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const formatted = newBranchName.trim().toLowerCase().replace(/\s+/g, '-');
    if (!formatted) return;

    if (branches.some(b => b.name === formatted)) {
      alert('Dieser Zweig existiert bereits.');
      return;
    }

    onCreateBranch(formatted);
    setNewBranchName('');
    setIsAdding(false);
  };

  return (
    <div className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg shadow-sm">
      <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-850 mb-3">
        <h3 className="text-xs font-bold text-slate-700 dark:text-slate-200 flex items-center gap-1.5 uppercase tracking-wider">
          <GitBranch size={14} className="text-amber-500" />
          <span>Branches (Zweige)</span>
        </h3>
        <button
          type="button"
          onClick={() => setIsAdding(!isAdding)}
          className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1"
        >
          <Plus size={12} />
          <span>Neu</span>
        </button>
      </div>

      {isAdding && (
        <form onSubmit={handleSubmit} className="mb-3 p-2 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-200 dark:border-slate-800 space-y-2">
          <div>
            <label className="block text-[9px] font-bold text-slate-400 uppercase mb-1">Zweig-Name</label>
            <input
              type="text"
              value={newBranchName}
              onChange={(e) => setNewBranchName(e.target.value)}
              placeholder="z.B. feature/analytics"
              className="w-full px-2 py-1 text-xs bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded text-slate-800 dark:text-slate-100 focus:outline-none focus:border-indigo-500"
              required
            />
          </div>
          <div className="flex justify-end gap-1.5">
            <button
              type="button"
              onClick={() => setIsAdding(false)}
              className="px-2 py-1 text-[10px] text-slate-500 hover:text-slate-700 font-semibold"
            >
              Abbrechen
            </button>
            <button
              type="submit"
              className="px-2.5 py-1 text-[10px] bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded transition-all"
            >
              Erstellen
            </button>
          </div>
        </form>
      )}

      {/* Branches list */}
      <div className="space-y-1.5 max-h-[160px] overflow-y-auto pr-1">
        {branches.map((b) => {
          const isActive = b.name === activeBranch;
          return (
            <div
              key={b.name}
              className={`flex items-center justify-between p-2 rounded-lg border text-xs transition-all ${
                isActive
                  ? 'bg-amber-50/50 dark:bg-amber-950/10 border-amber-300 dark:border-amber-800/60 font-semibold text-slate-900 dark:text-slate-100'
                  : 'bg-slate-50 dark:bg-slate-800/20 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 text-slate-600 dark:text-slate-400 cursor-pointer'
              }`}
              onClick={() => !isActive && onSelectBranch(b.name)}
            >
              <span className="flex items-center gap-1.5 truncate">
                <GitBranch size={12} className={isActive ? 'text-amber-500' : 'text-slate-400'} />
                <span className="truncate">{b.name}</span>
                {b.isProtected && (
                  <span title="Geschützter Hauptzweig">
                    <ShieldCheck size={12} className="text-indigo-500 shrink-0" />
                  </span>
                )}
              </span>

              {!b.isProtected && !isActive && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onDeleteBranch(b.name);
                  }}
                  className="text-slate-400 hover:text-red-500 p-0.5"
                  title="Branch löschen"
                >
                  <Trash2 size={11} />
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
