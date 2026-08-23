import React from 'react';
import { Sliders, Check, CheckCircle2 } from 'lucide-react';
import { Table } from '../../../types/index';

export interface MockDiff {
  id: string;
  type: 'new_table' | 'column_mismatch' | 'missing_column';
  direction?: 'download' | 'upload';
  tableName: string;
  description: string;
  localDetail?: string;
  liveDetail?: string;
  sql: string;
  suggestedTable?: Table;
}

interface LiveDatabaseSyncStep3DiffProps {
  mockDiffs: MockDiff[];
  selectedDiffs: string[];
  toggleDiffSelection: (id: string) => void;
  setSyncStep: (step: 'connect' | 'scanning' | 'diff' | 'completed') => void;
  handleApplySync: () => void;
}

export const LiveDatabaseSyncStep3Diff: React.FC<LiveDatabaseSyncStep3DiffProps> = ({
  mockDiffs,
  selectedDiffs,
  toggleDiffSelection,
  setSyncStep,
  handleApplySync,
}) => {
  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-sm flex flex-col gap-4 min-h-0">
      <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-850">
        <div className="flex items-center gap-2">
          <Sliders className="w-5 h-5 text-indigo-500" />
          <h2 className="text-sm font-bold text-slate-700 dark:text-slate-200">Identifizierte Unterschiede (2-Wege Diff)</h2>
        </div>
        <span className="text-[11px] font-bold text-slate-500">
          {selectedDiffs.length} von {mockDiffs.length} ausgewählt
        </span>
      </div>

      {/* Diffs List */}
      <div className="space-y-3 max-h-[380px] overflow-y-auto pr-1">
        {mockDiffs.length === 0 ? (
          <div className="text-center py-10 px-4 flex flex-col items-center justify-center space-y-3 bg-slate-50/50 dark:bg-slate-900/30 rounded-xl border border-dashed border-slate-200 dark:border-slate-800">
            <div className="w-12 h-12 rounded-full bg-emerald-100 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shadow-inner">
              <CheckCircle2 className="w-6 h-6 animate-pulse" />
            </div>
            <div className="space-y-1">
              <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">Keine Abweichungen festgestellt!</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 max-w-xs mx-auto">
                Dein lokales Datenmodell (IndexedDB) ist bereits 100% synchron mit dem Zustand deiner Live-Datenbank (SQL Server).
              </p>
            </div>
          </div>
        ) : (
          mockDiffs.map((diff) => {
            const isSelected = selectedDiffs.includes(diff.id);
            const isUpload = diff.direction === 'upload';

            return (
              <div 
                key={diff.id}
                onClick={() => toggleDiffSelection(diff.id)}
                className={`p-3 rounded-lg border text-left cursor-pointer transition-all flex gap-3 ${
                  isSelected 
                    ? isUpload 
                      ? 'bg-blue-50/50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-900/60'
                      : 'bg-indigo-50/50 dark:bg-indigo-950/15 border-indigo-200 dark:border-indigo-900/60' 
                    : 'bg-slate-50 dark:bg-slate-800/20 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                }`}
              >
                {/* Checkbox */}
                <div className="pt-0.5">
                  {isSelected ? (
                    <div className={`w-4 h-4 rounded text-white flex items-center justify-center ${isUpload ? 'bg-blue-600' : 'bg-indigo-600'}`}>
                      <Check size={11} strokeWidth={3} />
                    </div>
                  ) : (
                    <div className="w-4 h-4 rounded border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-950" />
                  )}
                </div>

                <div className="space-y-2 flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    {/* Direction Tag */}
                    <span className={`px-1.5 py-0.5 rounded text-[9px] font-extrabold uppercase ${
                      isUpload 
                        ? 'bg-blue-100 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800' 
                        : 'bg-purple-100 dark:bg-purple-950/50 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800'
                    }`}>
                      {isUpload ? '📤 Upload (IndexedDB ➔ SQL)' : '📥 Download (SQL ➔ IndexedDB)'}
                    </span>

                    <span className={`px-1.5 py-0.5 rounded text-[9px] font-extrabold uppercase ${
                      diff.type === 'new_table' 
                        ? 'bg-emerald-100 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400' 
                        : 'bg-amber-100 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400'
                    }`}>
                      {diff.type === 'new_table' ? 'Neue Tabelle' : 'Spalte fehlt'}
                    </span>
                    <span className="font-mono text-xs font-bold text-slate-800 dark:text-slate-200 truncate">
                      {diff.tableName}
                    </span>
                  </div>

                  <p className="text-xs text-slate-600 dark:text-slate-400">{diff.description}</p>

                  {/* Details */}
                  <div className="grid grid-cols-2 gap-2 text-[10px] bg-white dark:bg-slate-950 p-2 rounded border border-slate-100 dark:border-slate-850 font-mono">
                    <div>
                      <span className="text-slate-400 block font-sans">Lokale IndexedDB:</span>
                      <span className="text-slate-600 dark:text-slate-300">{diff.localDetail || 'Fehlt im Schema'}</span>
                    </div>
                    <div>
                      <span className="text-indigo-400 block font-sans">Live SQL-Server:</span>
                      <span className="text-indigo-600 dark:text-indigo-400 font-bold">{diff.liveDetail || 'Fehlt im Schema'}</span>
                    </div>
                  </div>

                  {/* SQL Code accordion */}
                  <div className="bg-slate-900 text-slate-300 p-2 rounded font-mono text-[9px] whitespace-pre overflow-x-auto border border-slate-850">
                    {diff.sql}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Sync Actions */}
      <div className="flex justify-between items-center pt-3 border-t border-slate-100 dark:border-slate-850">
        <button
          type="button"
          onClick={() => setSyncStep('connect')}
          className="px-4 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 text-xs font-semibold hover:bg-slate-50 dark:hover:bg-slate-800 transition"
        >
          Zurück
        </button>
        <button
          type="button"
          onClick={handleApplySync}
          className="flex items-center gap-1.5 px-5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-semibold shadow-md text-xs transition"
        >
          <CheckCircle2 size={13} />
          <span>Ausgewählte 2-Wege-Änderungen ausführen & synchronisieren</span>
        </button>
      </div>
    </div>
  );
};
