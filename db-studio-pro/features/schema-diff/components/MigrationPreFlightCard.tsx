import React from 'react';
import { PreFlightReport } from '../schemaDiffTypes';
import { ShieldCheck, ShieldAlert, AlertTriangle, CheckCircle, Info, Sparkles } from 'lucide-react';

interface MigrationPreFlightCardProps {
  report: PreFlightReport;
}

export const MigrationPreFlightCard: React.FC<MigrationPreFlightCardProps> = ({ report }) => {
  const getRiskBadge = () => {
    if (report.overallRisk === 'critical') {
      return (
        <div className="flex items-center gap-1.5 px-3 py-1 bg-rose-500/20 text-rose-300 rounded-full border border-rose-500/30 font-bold text-xs">
          <ShieldAlert size={14} /> Kritisches Risiko ({report.riskScore}/100)
        </div>
      );
    }
    if (report.overallRisk === 'warning') {
      return (
        <div className="flex items-center gap-1.5 px-3 py-1 bg-amber-500/20 text-amber-300 rounded-full border border-amber-500/30 font-bold text-xs">
          <AlertTriangle size={14} /> Mittleres Risiko ({report.riskScore}/100)
        </div>
      );
    }
    return (
      <div className="flex items-center gap-1.5 px-3 py-1 bg-emerald-500/20 text-emerald-300 rounded-full border border-emerald-500/30 font-bold text-xs">
        <ShieldCheck size={14} /> Sicher (0/100)
      </div>
    );
  };

  return (
    <div className="space-y-4">
      {/* Top Banner with Score */}
      <div className="bg-slate-900 text-white p-4 rounded-xl border border-slate-800 flex items-center justify-between shadow-sm">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="font-extrabold text-sm text-slate-100">Pre-Flight Analyse & Sicherheits-Check</span>
          </div>
          <p className="text-xs text-slate-400">
            Prüfung auf destruktive Tabellenlöschungen, Spaltenverluste & inkonsistente Typ-Konvertierungen.
          </p>
        </div>
        <div>{getRiskBadge()}</div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-3 gap-3">
        <div className="p-3 bg-rose-50/60 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900/40 rounded-xl text-center">
          <div className="text-xl font-black text-rose-600 dark:text-rose-400">{report.criticalCount}</div>
          <div className="text-[11px] font-bold text-rose-800 dark:text-rose-300 uppercase mt-0.5">Destruktiv (Data Loss)</div>
        </div>
        <div className="p-3 bg-amber-50/60 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/40 rounded-xl text-center">
          <div className="text-xl font-black text-amber-600 dark:text-amber-400">{report.warningCount}</div>
          <div className="text-[11px] font-bold text-amber-800 dark:text-amber-300 uppercase mt-0.5">Warnungen / Truncation</div>
        </div>
        <div className="p-3 bg-emerald-50/60 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900/40 rounded-xl text-center">
          <div className="text-xl font-black text-emerald-600 dark:text-emerald-400">{report.safeCount}</div>
          <div className="text-[11px] font-bold text-emerald-800 dark:text-emerald-300 uppercase mt-0.5">Sichere Operationen</div>
        </div>
      </div>

      {/* Warnings breakdown */}
      {report.warnings.length > 0 && (
        <div className="space-y-2 max-h-48 overflow-y-auto">
          <span className="text-[11px] font-extrabold uppercase text-slate-500 tracking-wider">Identifizierte Risiken & Empfehlungen</span>
          {report.warnings.map((w, idx) => (
            <div key={idx} className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700 text-xs space-y-1">
              <div className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                {w.level === 'critical' ? <ShieldAlert size={14} className="text-rose-500" /> : <AlertTriangle size={14} className="text-amber-500" />}
                <span>{w.title}</span>
              </div>
              <div className="text-slate-600 dark:text-slate-400 text-[11px]">{w.description}</div>
              <div className="text-[11px] text-indigo-600 dark:text-indigo-400 font-medium pt-1 border-t border-slate-200 dark:border-slate-700/60">
                💡 <strong>Mitigation:</strong> {w.mitigation}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Zero Downtime Best Practices */}
      <div className="p-3.5 bg-indigo-50/70 dark:bg-indigo-950/30 rounded-xl border border-indigo-200 dark:border-indigo-800/60 space-y-1.5 text-xs text-indigo-900 dark:text-indigo-200">
        <div className="font-bold flex items-center gap-1.5">
          <Sparkles size={13} className="text-indigo-600 dark:text-indigo-400" />
          <span>Zero-Downtime Deployment Best Practices</span>
        </div>
        <ul className="list-disc list-inside space-y-1 text-[11px] opacity-90">
          {report.zeroDowntimeAdvice.map((adv, i) => (
            <li key={i}>{adv}</li>
          ))}
        </ul>
      </div>
    </div>
  );
};
