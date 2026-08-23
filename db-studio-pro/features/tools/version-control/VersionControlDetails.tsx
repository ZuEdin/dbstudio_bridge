import React from 'react';
import { User, Code, Play, Trash, Info } from 'lucide-react';
import { SchemaCommit } from './types';

interface VersionControlDetailsProps {
  selectedCommit: SchemaCommit | null;
  previousCommit: SchemaCommit | null;
  diff: {
    added: string[];
    removed: string[];
    modified: { tableName: string; fieldDiffs: string[] }[];
  };
  setShowJsonModal: (json: string) => void;
  handleCheckoutCommit: (commit: SchemaCommit) => void;
  handleDeleteCommit: (id: string) => void;
}

export const VersionControlDetails: React.FC<VersionControlDetailsProps> = ({
  selectedCommit,
  previousCommit,
  diff,
  setShowJsonModal,
  handleCheckoutCommit,
  handleDeleteCommit,
}) => {
  if (!selectedCommit) {
    return (
      <div className="flex-grow flex items-center justify-center text-slate-400 italic text-sm">
        Bitte wählen Sie links einen Commit aus, um die Differenz anzuzeigen.
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Commit Head Details */}
      <div className="p-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 shrink-0">
        <div className="flex justify-between items-start">
          <div>
            <span className="text-[10px] uppercase font-bold text-slate-400">Ausgewählter Commit</span>
            <h2 className="text-base font-bold text-slate-800 dark:text-slate-100 mt-0.5">
              {selectedCommit.message}
            </h2>
          </div>
          <div className="text-right">
            <span className="font-mono text-xs bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 px-2 py-1 rounded font-bold">
              SHA: {selectedCommit.sha}
            </span>
            <div className="text-[10px] text-slate-400 mt-1">
              {new Date(selectedCommit.timestamp).toLocaleString()}
            </div>
          </div>
        </div>

        <div className="mt-4 flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-400">
            <User size={14} className="text-slate-400" />
            <span>Autor: <strong className="text-slate-800 dark:text-slate-200">{selectedCommit.author}</strong></span>
          </div>
          
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setShowJsonModal(JSON.stringify(selectedCommit.tables, null, 2))}
              className="flex items-center gap-1 px-2.5 py-1 text-xs border border-slate-300 dark:border-slate-700 rounded bg-white dark:bg-slate-800 hover:bg-slate-50 text-slate-700 dark:text-slate-300"
            >
              <Code size={12} />
              <span>JSON Schema</span>
            </button>
            
            <button
              type="button"
              onClick={() => handleCheckoutCommit(selectedCommit)}
              className="flex items-center gap-1 px-3 py-1 text-xs bg-amber-500 hover:bg-amber-600 text-white font-bold rounded shadow transition-all"
            >
              <Play size={12} />
              <span>Wiederherstellen (Checkout)</span>
            </button>

            <button
              type="button"
              onClick={() => handleDeleteCommit(selectedCommit.id)}
              className="p-1 hover:text-red-500 text-slate-400 rounded hover:bg-red-50 dark:hover:bg-red-950/20"
              title="Commit löschen"
            >
              <Trash size={14} />
            </button>
          </div>
        </div>
      </div>

      {/* Commit Diffs / Tables List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        
        {/* Visual Schema Diff Box */}
        <div className="border border-slate-200 dark:border-slate-800 rounded-lg p-3 bg-white dark:bg-slate-900">
          <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Änderungen in diesem Commit</h3>
          
          {!previousCommit ? (
            <div className="text-xs text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/20 p-2.5 rounded flex items-center gap-2">
              <Info size={14} />
              <span>Dies ist der erste Commit in der Historie. Er importiert alle Tabellen als initiales Schema.</span>
            </div>
          ) : (
            <div className="space-y-2.5">
              {/* Added Tables */}
              {diff.added.length > 0 && (
                <div>
                  <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider block">Hinzugefügte Tabellen</span>
                  <div className="mt-1 flex flex-wrap gap-1">
                    {diff.added.map(t => (
                      <span key={t} className="px-2 py-0.5 bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-300 text-xs rounded border border-emerald-100">
                        + {t}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Modified Tables */}
              {diff.modified.length > 0 && (
                <div>
                  <span className="text-[10px] font-bold text-blue-600 uppercase tracking-wider block">Geänderte Tabellen</span>
                  <div className="mt-1 space-y-1.5">
                    {diff.modified.map(m => (
                      <div key={m.tableName} className="text-xs bg-blue-50/40 dark:bg-blue-950/10 border border-blue-100 dark:border-blue-900 p-2 rounded">
                        <span className="font-bold text-blue-800 dark:text-blue-300">{m.tableName}</span>
                        <ul className="list-disc list-inside mt-1 space-y-0.5 pl-1 text-[11px] text-slate-600 dark:text-slate-400">
                          {m.fieldDiffs.map((fd, i) => (
                            <li key={i}>{fd}</li>
                          ))}
                        </ul>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Removed Tables */}
              {diff.removed.length > 0 && (
                <div>
                  <span className="text-[10px] font-bold text-red-600 uppercase tracking-wider block">Gelöschte Tabellen</span>
                  <div className="mt-1 flex flex-wrap gap-1">
                    {diff.removed.map(t => (
                      <span key={t} className="px-2 py-0.5 bg-red-50 dark:bg-red-950/30 text-red-700 dark:text-red-300 text-xs rounded border border-red-100">
                        - {t}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {diff.added.length === 0 && diff.modified.length === 0 && diff.removed.length === 0 && (
                <div className="text-xs text-slate-500 bg-slate-50 p-2 rounded text-center italic">
                  Keine Tabellen- oder Spalten-Änderungen in diesem Commit.
                </div>
              )}
            </div>
          )}
        </div>

        {/* Schema Snapshots Tables list */}
        <div>
          <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
            Gesichertes Tabellen-Schema ({selectedCommit.tables?.length || 0} Tabellen)
          </h3>
          
          <div className="grid grid-cols-2 gap-2">
            {selectedCommit.tables?.map(t => (
              <div key={t.id} className="border border-slate-100 dark:border-slate-800 p-2.5 rounded bg-slate-50/50 dark:bg-slate-900/40">
                <span className="font-bold text-xs text-slate-800 dark:text-slate-200">{t.name}</span>
                <div className="mt-1.5 flex flex-wrap gap-1">
                  {t.fields?.map(f => (
                    <span key={f.id} className="text-[9px] bg-slate-200/60 dark:bg-slate-800 px-1 py-0.5 rounded text-slate-600 dark:text-slate-400 font-mono">
                      {f.name} <span className="text-slate-400 text-[8px]">{f.type}</span>
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
};
