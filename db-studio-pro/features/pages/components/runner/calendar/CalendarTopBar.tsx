import React from 'react';
import { Database, Plus } from 'lucide-react';

interface CalendarTopBarProps {
  linkedTable: any;
  linkedQuery: any;
  eventsCount: number;
  onOpenAddModal: () => void;
}

export const CalendarTopBar: React.FC<CalendarTopBarProps> = ({
  linkedTable,
  linkedQuery,
  eventsCount,
  onOpenAddModal
}) => {
  return (
    <div className="bg-slate-50 dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800 px-4 py-2 flex items-center justify-between text-xs shrink-0">
      <div className="flex items-center gap-2">
        <Database size={14} className="text-indigo-500 shrink-0" />
        <span className="font-semibold text-slate-500 dark:text-slate-400">Verbindung:</span>
        {linkedTable ? (
          <span className="bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-900 text-indigo-700 dark:text-indigo-300 px-2 py-0.5 rounded font-medium flex items-center gap-1">
            💾 Tabelle <span className="font-mono font-bold">"{linkedTable.name}"</span>
          </span>
        ) : linkedQuery ? (
          <span className="bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900 text-emerald-700 dark:text-emerald-300 px-2 py-0.5 rounded font-medium flex items-center gap-1">
            🔍 Abfrage <span className="font-mono font-bold">"{linkedQuery.name}"</span>
          </span>
        ) : (
          <span className="text-rose-500 italic flex items-center gap-1">
            ⚠️ Keine Datenquelle verknüpft (Lokal-Modus)
          </span>
        )}
      </div>
      
      <div className="flex items-center gap-2">
        {linkedTable && (
          <button 
            onClick={onOpenAddModal}
            className="bg-indigo-600 hover:bg-indigo-700 text-white font-medium px-3 py-1 rounded-lg flex items-center gap-1 transition-colors shadow-xs"
          >
            <Plus size={13} />
            Eintrag hinzufügen
          </button>
        )}
        <span className="text-slate-400 dark:text-slate-600 font-mono text-[10px]">
          {eventsCount} {eventsCount === 1 ? 'Eintrag' : 'Einträge'}
        </span>
      </div>
    </div>
  );
};
