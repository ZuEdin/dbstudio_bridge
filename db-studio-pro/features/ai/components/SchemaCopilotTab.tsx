import React from 'react';
import { Info, Lock, Layers, Table as TableIcon } from 'lucide-react';
import { SchemaPreset, SCHEMA_PRESETS } from '../copilotData';

interface SchemaCopilotTabProps {
  selectedPreset: SchemaPreset;
  onSelectPreset: (preset: SchemaPreset) => void;
}

export const SchemaCopilotTab: React.FC<SchemaCopilotTabProps> = ({
  selectedPreset,
  onSelectPreset
}) => {
  return (
    <div className="space-y-5">
      {/* Notice Banner */}
      <div className="p-3.5 bg-indigo-50 dark:bg-indigo-950/40 rounded-xl border border-indigo-200/80 dark:border-indigo-800/60 flex items-start gap-3 text-xs text-indigo-900 dark:text-indigo-200">
        <Info size={16} className="text-indigo-600 dark:text-indigo-400 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <div className="font-bold">Enterprise KI-Schnittstelle vorbereitet (Offline-Modus)</div>
          <div className="opacity-90 leading-relaxed text-[11px]">
            Das Prompt-Eingabefeld ist im Client-Modus schreibgeschützt gesperrt. Wählen Sie unten eines der vorbereiteten 
            Architektur-Szenarien, um das vollständig relational verknüpfte Schema direkt in Ihr Projekt zu übernehmen.
          </div>
        </div>
      </div>

      {/* Disabled Prompt Input */}
      <div>
        <div className="flex items-center justify-between mb-1.5">
          <label className="text-[11px] font-extrabold uppercase text-slate-500 tracking-wider flex items-center gap-1.5">
            <Lock size={12} className="text-slate-400" />
            Natural Language Schema-Prompt
          </label>
          <span className="text-[10px] font-bold text-slate-400">Eingabe deaktiviert</span>
        </div>
        <div className="relative">
          <textarea
            disabled
            value={selectedPreset.prompt}
            rows={2}
            className="w-full bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl p-3 text-xs text-slate-600 dark:text-slate-300 cursor-not-allowed font-medium shadow-inner"
          />
          <div className="absolute right-3 bottom-3 flex items-center gap-1 bg-slate-200 dark:bg-slate-700 px-2 py-0.5 rounded text-[10px] font-mono text-slate-500">
            <Lock size={10} /> Read-Only
          </div>
        </div>
      </div>

      {/* Scenario / Preset Dropdown */}
      <div>
        <label className="block text-[11px] font-extrabold uppercase text-slate-700 dark:text-slate-300 tracking-wider mb-2">
          Vorbereitetes Datenmodell-Szenario wählen:
        </label>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {SCHEMA_PRESETS.map(preset => (
            <button
              key={preset.id}
              onClick={() => onSelectPreset(preset)}
              className={`p-3.5 rounded-xl border text-left transition-all flex flex-col justify-between ${
                selectedPreset.id === preset.id
                  ? 'bg-indigo-50/80 dark:bg-indigo-900/30 border-indigo-500 ring-2 ring-indigo-500/20 shadow-sm'
                  : 'bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700 hover:border-slate-300'
              }`}
            >
              <div className="font-bold text-xs text-slate-800 dark:text-slate-100">{preset.title}</div>
              <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-2 font-mono">
                {preset.tables.length} Tabellen • {preset.relationships.length} Fremdschlüssel-Relationen
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Generated Architecture Preview */}
      <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-xs">
        <div className="bg-slate-100 dark:bg-slate-850 px-4 py-2.5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <span className="font-extrabold text-xs text-slate-700 dark:text-slate-300 flex items-center gap-2">
            <Layers size={14} className="text-indigo-600" />
            Generierte ER-Architektur Vorschau
          </span>
          <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded border border-emerald-300 dark:border-emerald-800">
            Kompilierbar & Integritäts-Geprüft
          </span>
        </div>

        <div className="p-4 grid grid-cols-1 sm:grid-cols-2 gap-4 max-h-60 overflow-y-auto bg-slate-50/50 dark:bg-slate-900/50">
          {selectedPreset.tables.map(tbl => (
            <div key={tbl.id} className="bg-white dark:bg-slate-800 p-3 rounded-lg border border-slate-200 dark:border-slate-700 shadow-2xs">
              <div className="font-bold text-xs text-indigo-600 dark:text-indigo-400 flex items-center gap-1.5 mb-2 pb-1 border-b border-slate-100 dark:border-slate-700">
                <TableIcon size={12} />
                <span>{tbl.name}</span>
              </div>
              <div className="space-y-1">
                {tbl.fields?.map(f => (
                  <div key={f.id} className="flex items-center justify-between text-[11px]">
                    <span className="font-mono text-slate-700 dark:text-slate-300 flex items-center gap-1">
                      {f.isPrimaryKey && <span className="text-amber-500 font-bold text-[9px]">PK</span>}
                      {f.name}
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono">{f.type}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
