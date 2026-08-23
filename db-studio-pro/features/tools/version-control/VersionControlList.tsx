import React from 'react';
import { Info } from 'lucide-react';
import { SchemaCommit } from './types';

interface VersionControlListProps {
  commits: SchemaCommit[];
  selectedCommitId: string | null;
  setSelectedCommitId: (id: string | null) => void;
  generateDefaultCommits: () => void;
}

export const VersionControlList: React.FC<VersionControlListProps> = ({
  commits,
  selectedCommitId,
  setSelectedCommitId,
  generateDefaultCommits,
}) => {
  return (
    <div className="p-4 space-y-4">
      <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Commit-Verlauf (Lokale Zeitlinie)</h3>
      
      {commits.length === 0 ? (
        <div className="text-center py-8 text-slate-400">
          <Info size={28} className="mx-auto mb-2 text-slate-300" />
          <p className="text-sm">Keine Commits vorhanden.</p>
          <button 
            type="button"
            onClick={generateDefaultCommits}
            className="mt-2 text-xs text-amber-500 underline"
          >
            Mock-Daten generieren
          </button>
        </div>
      ) : (
        <div className="relative border-l-2 border-slate-200 dark:border-slate-800 ml-3 space-y-6">
          {commits.map((commit) => {
            const isSelected = selectedCommitId === commit.id;
            const date = new Date(commit.timestamp).toLocaleString('de-DE', {
              month: 'short',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit'
            });

            return (
              <div key={commit.id} className="relative pl-6">
                {/* Timeline Dot */}
                <span className={`absolute -left-2 top-1.5 w-4 h-4 rounded-full border-2 bg-white flex items-center justify-center transition ${
                  isSelected 
                    ? 'border-amber-500 scale-125 shadow-sm' 
                    : 'border-slate-300 dark:border-slate-700'
                }`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${isSelected ? 'bg-amber-500' : 'bg-slate-200 dark:bg-slate-800'}`} />
                </span>

                {/* Card block */}
                <div 
                  onClick={() => setSelectedCommitId(commit.id)}
                  className={`p-3.5 rounded-lg border text-left cursor-pointer transition ${
                    isSelected 
                      ? 'bg-amber-50/50 dark:bg-amber-950/10 border-amber-300 dark:border-amber-800/60 shadow-sm' 
                      : 'bg-slate-50 hover:bg-slate-100 dark:bg-slate-900/40 dark:hover:bg-slate-900 border-slate-200 dark:border-slate-800'
                  }`}
                >
                  <div className="flex justify-between items-start mb-1">
                    <span className="font-mono text-[10px] bg-slate-200 dark:bg-slate-800 px-1.5 py-0.5 rounded text-slate-600 dark:text-slate-400 font-bold">
                      {commit.sha}
                    </span>
                    <span className="text-[10px] text-slate-400">{date}</span>
                  </div>

                  <h4 className="text-xs font-semibold text-slate-800 dark:text-slate-200 line-clamp-2">
                    {commit.message}
                  </h4>

                  <div className="mt-2.5 flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
                    <div className="flex items-center gap-1">
                      <div className="w-4 h-4 rounded-full bg-slate-200 dark:bg-slate-800 flex items-center justify-center text-[9px] font-bold text-slate-700 dark:text-slate-300">
                        {commit.author[0]}
                      </div>
                      <span>{commit.author}</span>
                    </div>
                    
                    <div className="flex items-center gap-3">
                      <span>{commit.tables?.length || 0} Tabellen</span>
                      <span>{commit.relationships?.length || 0} Rel.</span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
