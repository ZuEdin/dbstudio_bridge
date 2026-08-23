import React, { useState } from 'react';
import { AuditEntry, AuditActionType } from '../auditTypes';
import { Search, Filter, History, RotateCcw, ArrowRight, User, Shield, Calendar } from 'lucide-react';

interface AuditLogTimelineProps {
  entries: AuditEntry[];
  onSelectEntryForTimeTravel: (entry: AuditEntry) => void;
}

export const AuditLogTimeline: React.FC<AuditLogTimelineProps> = ({
  entries,
  onSelectEntryForTimeTravel
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [actionFilter, setActionFilter] = useState<string>('ALL');
  const [tableFilter, setTableFilter] = useState<string>('ALL');

  const uniqueTables = Array.from(new Set(entries.map(e => e.tableName)));

  const filteredEntries = entries.filter(e => {
    if (actionFilter !== 'ALL' && e.action !== actionFilter) return false;
    if (tableFilter !== 'ALL' && e.tableName !== tableFilter) return false;
    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      const matchText = `${e.userName} ${e.tableName} ${e.recordId} ${e.comment || ''} ${JSON.stringify(e.diffs)}`.toLowerCase();
      if (!matchText.includes(q)) return false;
    }
    return true;
  });

  const getActionBadge = (action: AuditActionType) => {
    switch (action) {
      case 'INSERT':
        return <span className="bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 px-2 py-0.5 rounded font-black text-[10px]">INSERT</span>;
      case 'UPDATE':
        return <span className="bg-blue-100 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 px-2 py-0.5 rounded font-black text-[10px]">UPDATE</span>;
      case 'DELETE':
        return <span className="bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 px-2 py-0.5 rounded font-black text-[10px]">DELETE</span>;
      case 'RESTORE':
        return <span className="bg-purple-100 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 px-2 py-0.5 rounded font-black text-[10px]">TIME-TRAVEL</span>;
      default:
        return <span className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded font-bold text-[10px]">{action}</span>;
    }
  };

  return (
    <div className="space-y-4">
      {/* Filter Bar */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-3 bg-slate-50 dark:bg-slate-900/80 p-3 rounded-xl border border-slate-200 dark:border-slate-800">
        <div className="md:col-span-2 relative">
          <Search size={14} className="absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            placeholder="Suche nach Benutzer, Tabelle, Feld oder Wert..."
            className="w-full text-xs pl-8 pr-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
          />
        </div>

        <div>
          <select
            value={tableFilter}
            onChange={e => setTableFilter(e.target.value)}
            className="w-full text-xs py-1.5 px-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
          >
            <option value="ALL">Alle Tabellen</option>
            {uniqueTables.map(t => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
        </div>

        <div>
          <select
            value={actionFilter}
            onChange={e => setActionFilter(e.target.value)}
            className="w-full text-xs py-1.5 px-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-bold"
          >
            <option value="ALL">Alle Aktionen</option>
            <option value="INSERT">Nur INSERT</option>
            <option value="UPDATE">Nur UPDATE</option>
            <option value="DELETE">Nur DELETE</option>
            <option value="RESTORE">Nur TIME-TRAVEL</option>
          </select>
        </div>
      </div>

      {/* Timeline Stream */}
      <div className="space-y-2.5 max-h-[460px] overflow-y-auto pr-1">
        {filteredEntries.length === 0 ? (
          <div className="p-8 text-center bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-400 text-xs">
            Keine Audit-Einträge mit den gewählten Filterkriterien gefunden.
          </div>
        ) : (
          filteredEntries.map(entry => (
            <div
              key={entry.id}
              className="p-3.5 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-3 shadow-2xs hover:border-slate-300 transition-all"
            >
              {/* Left Details */}
              <div className="space-y-1.5">
                <div className="flex flex-wrap items-center gap-2">
                  {getActionBadge(entry.action)}
                  <span className="font-bold text-xs text-slate-800 dark:text-slate-200">
                    {entry.tableName}
                  </span>
                  <span className="text-[11px] font-mono bg-slate-100 dark:bg-slate-800 px-1.5 py-0.2 rounded text-slate-600 dark:text-slate-400">
                    ID #{entry.recordId}
                  </span>
                  <span className="text-slate-400 text-[11px] flex items-center gap-1">
                    <Calendar size={12} /> {entry.timestamp}
                  </span>
                </div>

                <div className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-400">
                  <User size={12} className="text-slate-400" />
                  <span className="font-semibold text-slate-700 dark:text-slate-300">{entry.userName}</span>
                  <span className="text-[10px] bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 px-1.5 py-0.2 rounded">
                    {entry.userRole}
                  </span>
                  {entry.comment && (
                    <span className="text-slate-400 italic text-[11px]">— {entry.comment}</span>
                  )}
                </div>

                {/* Diffs Preview */}
                {entry.diffs.length > 0 && entry.action === 'UPDATE' && (
                  <div className="flex flex-wrap gap-2 pt-1">
                    {entry.diffs.map((d, i) => (
                      <span key={i} className="text-[11px] bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 px-2 py-0.5 rounded-md flex items-center gap-1 font-mono">
                        <strong className="text-slate-700 dark:text-slate-300">{d.fieldName}:</strong>
                        <span className="text-rose-500 line-through">{String(d.oldValue ?? 'null')}</span>
                        <ArrowRight size={10} className="text-slate-400" />
                        <span className="text-emerald-500 font-bold">{String(d.newValue ?? 'null')}</span>
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Right Action Button: Time Travel */}
              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={() => onSelectEntryForTimeTravel(entry)}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 dark:bg-indigo-950/40 hover:bg-indigo-100 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 rounded-xl text-xs font-bold shadow-2xs transition-all"
                >
                  <RotateCcw size={12} />
                  <span>Time-Travel Diff</span>
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
