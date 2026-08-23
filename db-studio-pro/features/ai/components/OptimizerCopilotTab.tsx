import React, { useState } from 'react';
import { Zap, CheckCircle2, Copy, Check } from 'lucide-react';
import { OPTIMIZER_SAMPLE_SQL, OPTIMIZER_INDEX_DDL } from '../copilotData';

export const OptimizerCopilotTab: React.FC = () => {
  const [copiedIndex, setCopiedIndex] = useState(false);

  const handleCopyIndex = () => {
    navigator.clipboard.writeText(OPTIMIZER_INDEX_DDL);
    setCopiedIndex(true);
    setTimeout(() => setCopiedIndex(false), 2000);
  };

  return (
    <div className="space-y-5">
      <div className="p-3.5 bg-amber-50 dark:bg-amber-950/30 rounded-xl border border-amber-200 dark:border-amber-800/60 flex items-start gap-3 text-xs text-amber-900 dark:text-amber-200">
        <Zap size={16} className="text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <div className="font-bold">SQL Execution Plan Analyzer & Index Empfehlungen</div>
          <div className="opacity-90 leading-relaxed text-[11px]">
            Erklärt komplexe Abfragen in verständlichem Deutsch und berechnet fehlende Indizes zur Beschleunigung von Joins.
          </div>
        </div>
      </div>

      {/* Query SQL Preview */}
      <div>
        <label className="block text-[11px] font-extrabold uppercase text-slate-500 tracking-wider mb-1.5">
          Analysiertes SQL Query
        </label>
        <div className="bg-slate-900 p-3.5 rounded-xl border border-slate-800 text-slate-200 font-mono text-xs overflow-x-auto">
          <pre>{OPTIMIZER_SAMPLE_SQL}</pre>
        </div>
      </div>

      {/* Execution Plan Explanation Breakdown */}
      <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl border border-slate-200 dark:border-slate-700 space-y-3">
        <div className="font-bold text-xs text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
          <CheckCircle2 size={14} className="text-emerald-500" />
          <span>Schrittweise Analyse des Ausführungsplans</span>
        </div>
        
        <div className="space-y-2 text-xs text-slate-600 dark:text-slate-300">
          <div className="flex items-start gap-2">
            <span className="w-5 h-5 rounded-full bg-blue-100 text-blue-700 font-bold text-[10px] flex items-center justify-center shrink-0 mt-0.5">1</span>
            <span><strong>Filterung Tabelle "kunden":</strong> Filtert Datensätze auf <code>ort = 'Wien'</code>. Ohne Index entsteht ein sequentieller Full-Table-Scan.</span>
          </div>
          <div className="flex items-start gap-2">
            <span className="w-5 h-5 rounded-full bg-blue-100 text-blue-700 font-bold text-[10px] flex items-center justify-center shrink-0 mt-0.5">2</span>
            <span><strong>Hash-Join mit "bestellungen":</strong> Verknüpft Treffer über den Fremdschlüssel <code>kunden.id = bestellungen.kunde_id</code>.</span>
          </div>
          <div className="flex items-start gap-2">
            <span className="w-5 h-5 rounded-full bg-blue-100 text-blue-700 font-bold text-[10px] flex items-center justify-center shrink-0 mt-0.5">3</span>
            <span><strong>Aggregation & Sortierung:</strong> Berechnet <code>SUM(gesamt_netto)</code> pro Kunde und sortiert das Ergebnis absteigend.</span>
          </div>
        </div>
      </div>

      {/* Index Recommendations */}
      <div className="bg-emerald-50/60 dark:bg-emerald-950/30 p-4 rounded-xl border border-emerald-200 dark:border-emerald-800/60 space-y-2.5">
        <div className="flex items-center justify-between">
          <span className="font-extrabold text-xs text-emerald-800 dark:text-emerald-300 flex items-center gap-1.5">
            <Zap size={13} className="text-emerald-600" />
            Empfohlene Composite Indizes (Geschätzter Speedup: ~8.4x)
          </span>
          <button
            onClick={handleCopyIndex}
            className="flex items-center gap-1 bg-white dark:bg-slate-800 hover:bg-slate-50 text-slate-700 dark:text-slate-200 border border-slate-300 dark:border-slate-700 px-2.5 py-1 rounded-lg text-[11px] font-bold shadow-2xs transition-all"
          >
            {copiedIndex ? <Check size={12} className="text-emerald-600" /> : <Copy size={12} />}
            <span>{copiedIndex ? 'Kopiert!' : 'DDL Kopieren'}</span>
          </button>
        </div>
        <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 text-emerald-400 font-mono text-[11px] overflow-x-auto">
          <pre>{OPTIMIZER_INDEX_DDL}</pre>
        </div>
      </div>
    </div>
  );
};
