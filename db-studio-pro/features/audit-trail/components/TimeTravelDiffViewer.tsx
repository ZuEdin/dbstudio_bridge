import React from 'react';
import { AuditEntry } from '../auditTypes';
import { Table } from '../../../types/index';
import { RotateCcw, ArrowLeft, CheckCircle2, History, AlertTriangle, Shield } from 'lucide-react';

interface TimeTravelDiffViewerProps {
  entry: AuditEntry;
  currentTable?: Table;
  onBack: () => void;
  onRestore: (entry: AuditEntry) => void;
}

export const TimeTravelDiffViewer: React.FC<TimeTravelDiffViewerProps> = ({
  entry,
  currentTable,
  onBack,
  onRestore
}) => {
  const pkField = currentTable?.fields.find(f => f.isPrimaryKey)?.name || currentTable?.fields[0]?.name || 'id';
  const currentRecord = currentTable?.data?.find(r => String(r[pkField]) === String(entry.recordId)) || {};
  const historicalSnapshot = entry.snapshotAfter || entry.snapshotBefore || {};

  const allFieldKeys = Array.from(new Set([
    ...Object.keys(currentRecord),
    ...Object.keys(historicalSnapshot)
  ]));

  return (
    <div className="space-y-4">
      {/* Top Bar with Back and Restore */}
      <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
        <button
          onClick={onBack}
          className="flex items-center gap-1.5 text-xs font-bold text-slate-600 dark:text-slate-300 hover:text-slate-900"
        >
          <ArrowLeft size={14} />
          <span>Zurück zur Timeline</span>
        </button>

        <div className="flex items-center gap-3">
          <span className="text-xs text-slate-500 font-mono">
            Stand: <strong>{entry.timestamp}</strong> ({entry.userName})
          </span>
          <button
            onClick={() => onRestore(entry)}
            className="flex items-center gap-1.5 px-4 py-1.5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-extrabold shadow-2xs transition-all"
          >
            <RotateCcw size={13} />
            <span>Diesen Stand wiederherstellen (Point-in-Time Restore)</span>
          </button>
        </div>
      </div>

      {/* Info Card */}
      <div className="p-3.5 bg-purple-50/60 dark:bg-purple-950/20 rounded-xl border border-purple-200 dark:border-purple-900/40 text-xs text-purple-900 dark:text-purple-200 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <History size={16} className="text-purple-600" />
          <span>
            Vergleich zwischen <strong>Historischem Stand ({entry.timestamp})</strong> und dem <strong>Aktuellen Stand in der Datenbank</strong>.
          </span>
        </div>
        <span className="font-mono font-bold text-[11px]">Tabelle: {entry.tableName} (ID #{entry.recordId})</span>
      </div>

      {/* Side-by-Side Table Comparison */}
      <div className="bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-2xs">
        <table className="w-full text-left text-xs border-collapse font-mono">
          <thead>
            <tr className="bg-slate-100 dark:bg-slate-800/80 text-slate-500 font-bold border-b border-slate-200 dark:border-slate-800">
              <th className="p-3 w-1/4">Feld</th>
              <th className="p-3 w-3/8 text-purple-700 dark:text-purple-300">Historischer Wert ({entry.timestamp})</th>
              <th className="p-3 w-3/8 text-slate-700 dark:text-slate-300">Aktueller Wert (Jetzt)</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
            {allFieldKeys.map(key => {
              const histVal = historicalSnapshot[key];
              const currVal = currentRecord[key];
              const isDifferent = String(histVal) !== String(currVal);

              return (
                <tr key={key} className={isDifferent ? 'bg-amber-50/40 dark:bg-amber-950/20' : 'hover:bg-slate-100/40'}>
                  <td className="p-3 font-bold text-slate-700 dark:text-slate-300">
                    {key}
                  </td>
                  <td className="p-3">
                    <span className={isDifferent ? 'text-purple-600 dark:text-purple-400 font-bold bg-purple-100/60 dark:bg-purple-950 px-1.5 py-0.5 rounded' : 'text-slate-500'}>
                      {histVal !== undefined ? String(histVal) : '—'}
                    </span>
                  </td>
                  <td className="p-3">
                    <span className={isDifferent ? 'text-amber-600 dark:text-amber-400 font-bold bg-amber-100/60 dark:bg-amber-950 px-1.5 py-0.5 rounded' : 'text-slate-500'}>
                      {currVal !== undefined ? String(currVal) : '—'}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
