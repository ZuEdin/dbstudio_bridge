import React from 'react';
import { SchemaDiffChange } from '../schemaDiffTypes';
import { Plus, Trash2, Edit2, AlertTriangle, CheckCircle2, ShieldAlert } from 'lucide-react';

interface SchemaDiffInspectorProps {
  changes: SchemaDiffChange[];
}

export const SchemaDiffInspector: React.FC<SchemaDiffInspectorProps> = ({ changes }) => {
  if (changes.length === 0) {
    return (
      <div className="p-8 text-center bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-200 dark:border-slate-800">
        <CheckCircle2 size={36} className="text-emerald-500 mx-auto mb-2" />
        <h4 className="font-bold text-sm text-slate-800 dark:text-slate-200">Schema ist synchron</h4>
        <p className="text-xs text-slate-500 mt-1">Keine Abweichungen zwischen aktuellem Schema und Snapshot erkannt.</p>
      </div>
    );
  }

  return (
    <div className="space-y-2.5 max-h-[380px] overflow-y-auto pr-1">
      {changes.map(change => {
        let icon = <Plus size={14} className="text-emerald-600" />;
        let badgeColor = 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300';
        let riskBadge = null;

        if (change.riskLevel === 'critical') {
          icon = <Trash2 size={14} className="text-rose-600" />;
          badgeColor = 'bg-rose-50 dark:bg-rose-950/40 border-rose-300 dark:border-rose-800 text-rose-900 dark:text-rose-300';
          riskBadge = (
            <span className="flex items-center gap-1 text-[10px] font-bold text-rose-600 bg-rose-100 dark:bg-rose-900/40 px-2 py-0.5 rounded border border-rose-200 dark:border-rose-800">
              <ShieldAlert size={11} /> Datenverlust-Risiko
            </span>
          );
        } else if (change.riskLevel === 'warning') {
          icon = <Edit2 size={14} className="text-amber-600" />;
          badgeColor = 'bg-amber-50 dark:bg-amber-950/40 border-amber-300 dark:border-amber-800 text-amber-900 dark:text-amber-300';
          riskBadge = (
            <span className="flex items-center gap-1 text-[10px] font-bold text-amber-700 bg-amber-100 dark:bg-amber-900/40 px-2 py-0.5 rounded border border-amber-200 dark:border-amber-800">
              <AlertTriangle size={11} /> Vorsicht nötig
            </span>
          );
        }

        return (
          <div
            key={change.id}
            className={`p-3 rounded-xl border flex items-start justify-between gap-3 transition-all ${badgeColor}`}
          >
            <div className="flex items-start gap-2.5">
              <div className="p-1.5 rounded-lg bg-white/80 dark:bg-slate-800/80 shadow-2xs shrink-0 mt-0.5">
                {icon}
              </div>
              <div className="space-y-0.5">
                <div className="font-extrabold text-xs flex items-center gap-2">
                  <span>{change.tableName}</span>
                  {change.columnName && (
                    <span className="font-mono text-[11px] opacity-80">.{change.columnName}</span>
                  )}
                </div>
                <div className="text-[11px] leading-relaxed opacity-90">{change.description}</div>
                {change.riskReason && (
                  <div className="text-[10px] font-semibold text-rose-700 dark:text-rose-400 mt-1">
                    ⚠️ {change.riskReason}
                  </div>
                )}
              </div>
            </div>
            <div className="shrink-0">{riskBadge}</div>
          </div>
        );
      })}
    </div>
  );
};
