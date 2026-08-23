import React from 'react';
import { Info, Lock } from 'lucide-react';
import { QueryPreset, QUERY_PRESETS } from '../copilotData';

interface QueryCopilotTabProps {
  selectedPreset: QueryPreset;
  onSelectPreset: (preset: QueryPreset) => void;
}

export const QueryCopilotTab: React.FC<QueryCopilotTabProps> = ({
  selectedPreset,
  onSelectPreset
}) => {
  return (
    <div className="space-y-5">
      <div className="p-3.5 bg-indigo-50 dark:bg-indigo-950/40 rounded-xl border border-indigo-200/80 dark:border-indigo-800/60 flex items-start gap-3 text-xs text-indigo-900 dark:text-indigo-200">
        <Info size={16} className="text-indigo-600 dark:text-indigo-400 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <div className="font-bold">Natural Language Visual Query Engine</div>
          <div className="opacity-90 leading-relaxed text-[11px]">
            Übersetzt natürlichsprachliche Fragestellungen in visuelle Joins, Kriterien und SQL-Aggregatfunktionen.
          </div>
        </div>
      </div>

      {/* Disabled Query Prompt Input */}
      <div>
        <div className="flex items-center justify-between mb-1.5">
          <label className="text-[11px] font-extrabold uppercase text-slate-500 tracking-wider flex items-center gap-1.5">
            <Lock size={12} className="text-slate-400" />
            Natural Language Query-Prompt
          </label>
          <span className="text-[10px] font-bold text-slate-400">Eingabe deaktiviert</span>
        </div>
        <textarea
          disabled
          value={selectedPreset.prompt}
          rows={2}
          className="w-full bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl p-3 text-xs text-slate-600 dark:text-slate-300 cursor-not-allowed font-medium shadow-inner"
        />
      </div>

      {/* Preset Selection */}
      <div>
        <label className="block text-[11px] font-extrabold uppercase text-slate-700 dark:text-slate-300 tracking-wider mb-2">
          Beispiel-Abfrage auswählen:
        </label>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {QUERY_PRESETS.map(preset => (
            <button
              key={preset.id}
              onClick={() => onSelectPreset(preset)}
              className={`p-3 rounded-xl border text-left transition-all ${
                selectedPreset.id === preset.id
                  ? 'bg-indigo-50/80 dark:bg-indigo-900/30 border-indigo-500 ring-2 ring-indigo-500/20'
                  : 'bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700 hover:border-slate-300'
              }`}
            >
              <div className="font-bold text-xs text-slate-800 dark:text-slate-100">{preset.title}</div>
              <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 line-clamp-2">
                {preset.explanation}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Generated SQL & Flow Preview */}
      <div className="space-y-2">
        <span className="text-[11px] font-extrabold uppercase text-slate-500 tracking-wider">
          Generiertes SQL Statement & Logik
        </span>
        <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 text-emerald-400 font-mono text-xs overflow-x-auto shadow-inner">
          <pre>{selectedPreset.sql}</pre>
        </div>
      </div>
    </div>
  );
};
