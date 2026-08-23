import React from 'react';
import { CheckCircle2 } from 'lucide-react';

interface LiveDatabaseSyncStep4CompletedProps {
  setSyncStep: (step: 'connect' | 'scanning' | 'diff' | 'completed') => void;
}

export const LiveDatabaseSyncStep4Completed: React.FC<LiveDatabaseSyncStep4CompletedProps> = ({
  setSyncStep,
}) => {
  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-8 shadow-sm flex flex-col items-center justify-center text-center space-y-4">
      <div className="w-14 h-14 rounded-full bg-emerald-100 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
        <CheckCircle2 className="w-8 h-8" />
      </div>
      <div className="space-y-1">
        <h3 className="font-bold text-slate-800 dark:text-slate-200">Schema erfolgreich synchronisiert!</h3>
        <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm">
          Dein lokales Modell ist jetzt perfekt mit dem Live-Datenbankschema abgeglichen. Alle neuen Tabellen wurden angelegt.
        </p>
      </div>
      <div className="flex gap-2.5 pt-2">
        <button
          type="button"
          onClick={() => setSyncStep('connect')}
          className="px-4 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 text-xs font-semibold hover:bg-slate-50 dark:hover:bg-slate-800 transition"
        >
          Neue Verbindung
        </button>
        <button
          type="button"
          onClick={() => {
            window.dispatchEvent(new CustomEvent('navigate-app-view', {
              detail: { type: 'relationships' }
            }));
          }}
          className="px-4 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow transition"
        >
          Modell-Beziehungen einsehen
        </button>
      </div>
    </div>
  );
};
