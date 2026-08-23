import React from 'react';
import { RefreshCw, Database } from 'lucide-react';

export const LiveDatabaseSyncStep2Scan: React.FC = () => {
  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-8 shadow-sm flex flex-col items-center justify-center text-center space-y-4">
      <div className="relative">
        <div className="w-16 h-16 rounded-full border-4 border-indigo-100 dark:border-indigo-950 flex items-center justify-center">
          <RefreshCw className="w-8 h-8 text-indigo-600 animate-spin" />
        </div>
        <div className="absolute -bottom-1 -right-1 p-1 bg-indigo-600 rounded-full text-white">
          <Database size={12} />
        </div>
      </div>
      <div className="space-y-1">
        <h3 className="font-bold text-slate-800 dark:text-slate-200">Introspection läuft...</h3>
        <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm">
          Datenbank-Kataloge und Schemata werden analysiert. Dieser Vorgang dauert nur wenige Sekunden.
        </p>
      </div>
    </div>
  );
};
