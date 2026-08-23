import React, { useState, useMemo } from 'react';
import { Table, DbType } from '../../types/index';
import { computeSchemaDiff } from './schemaDiffService';
import { SchemaDiffInspector } from './components/SchemaDiffInspector';
import { MigrationPreFlightCard } from './components/MigrationPreFlightCard';
import { MigrationCodeViewer } from './components/MigrationCodeViewer';
import { X, GitCommit, ShieldCheck, Code, Camera, Check, RefreshCw, AlertCircle } from 'lucide-react';

interface SchemaDiffModalProps {
  currentTables: Table[];
  lastSnapshot: Table[] | undefined;
  dbType: DbType;
  onSnapshot: () => void;
  onClose: () => void;
}

export const SchemaDiffModal: React.FC<SchemaDiffModalProps> = ({
  currentTables,
  lastSnapshot,
  dbType,
  onSnapshot,
  onClose
}) => {
  const [activeView, setActiveView] = useState<'diff' | 'preflight' | 'scripts'>('diff');
  const [snapshotSuccess, setSnapshotSuccess] = useState(false);

  const diffResult = useMemo(() => {
    return computeSchemaDiff(currentTables, lastSnapshot || [], dbType);
  }, [currentTables, lastSnapshot, dbType]);

  const handleTakeSnapshot = () => {
    onSnapshot();
    setSnapshotSuccess(true);
    setTimeout(() => setSnapshotSuccess(false), 2500);
  };

  const hasChanges = diffResult.changes.length > 0;

  return (
    <div className="fixed inset-0 bg-black/60 z-[150] flex items-center justify-center p-4 animate-in fade-in backdrop-blur-xs">
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-5xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col h-[780px]">
        
        {/* Header */}
        <div className="bg-slate-900 text-white p-4.5 flex justify-between items-center shrink-0 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="bg-indigo-500/20 p-2.5 rounded-xl border border-indigo-500/30">
              <GitCommit className="text-indigo-400 w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-black tracking-tight">Schema-Diff & Migration Hub</h2>
                <span className="bg-indigo-900/60 text-indigo-300 text-[10px] font-bold px-2 py-0.5 rounded-full border border-indigo-700">
                  Target: {dbType}
                </span>
                {hasChanges ? (
                  <span className="bg-amber-900/60 text-amber-300 text-[10px] font-bold px-2 py-0.5 rounded-full border border-amber-700">
                    {diffResult.changes.length} Änderung(en)
                  </span>
                ) : (
                  <span className="bg-emerald-900/60 text-emerald-300 text-[10px] font-bold px-2 py-0.5 rounded-full border border-emerald-700">
                    Synchron
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Vergleiche Schemata, führe Pre-Flight Risikoprüfungen durch und generiere Flyway & Liquibase Migrationen.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="bg-slate-50 dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800 px-6 pt-3 flex items-center justify-between shrink-0">
          <div className="flex gap-2">
            <button
              onClick={() => setActiveView('diff')}
              className={`flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-t-xl transition-all border-t border-x ${
                activeView === 'diff'
                  ? 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-indigo-600 dark:text-indigo-400 shadow-2xs'
                  : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'
              }`}
            >
              <RefreshCw size={13} />
              <span>Visueller Schema-Diff</span>
              {diffResult.changes.length > 0 && (
                <span className="bg-indigo-100 text-indigo-700 text-[10px] px-1.5 py-0.2 rounded-full font-extrabold">
                  {diffResult.changes.length}
                </span>
              )}
            </button>
            <button
              onClick={() => setActiveView('preflight')}
              className={`flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-t-xl transition-all border-t border-x ${
                activeView === 'preflight'
                  ? 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-indigo-600 dark:text-indigo-400 shadow-2xs'
                  : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'
              }`}
            >
              <ShieldCheck size={13} />
              <span>Pre-Flight Risk Check</span>
              {diffResult.preFlight.overallRisk === 'critical' && (
                <span className="bg-rose-100 text-rose-700 text-[10px] px-1.5 py-0.2 rounded-full font-extrabold">
                  !
                </span>
              )}
            </button>
            <button
              onClick={() => setActiveView('scripts')}
              className={`flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-t-xl transition-all border-t border-x ${
                activeView === 'scripts'
                  ? 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-indigo-600 dark:text-indigo-400 shadow-2xs'
                  : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'
              }`}
            >
              <Code size={13} />
              <span>Flyway, Liquibase & SQL Code</span>
            </button>
          </div>

          <div className="pb-2">
            <button
              onClick={handleTakeSnapshot}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold shadow-2xs transition-all ${
                snapshotSuccess
                  ? 'bg-emerald-600 text-white'
                  : 'bg-indigo-600 hover:bg-indigo-700 text-white'
              }`}
              title="Aktuellen Stand als neuen Baseline-Snapshot speichern"
            >
              {snapshotSuccess ? <Check size={13} /> : <Camera size={13} />}
              <span>{snapshotSuccess ? 'Snapshot gespeichert!' : 'Neuen Snapshot setzen'}</span>
            </button>
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 p-6 overflow-y-auto bg-white dark:bg-slate-900">
          {activeView === 'diff' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-extrabold text-sm text-slate-800 dark:text-slate-200">Erkannte Schema-Änderungen</h3>
                  <p className="text-xs text-slate-500">Gegenüber dem letzten gespeicherten Schema-Snapshot.</p>
                </div>
              </div>
              <SchemaDiffInspector changes={diffResult.changes} />
            </div>
          )}

          {activeView === 'preflight' && (
            <MigrationPreFlightCard report={diffResult.preFlight} />
          )}

          {activeView === 'scripts' && (
            <MigrationCodeViewer migrations={diffResult.migrations} dbType={dbType} />
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-slate-50 dark:bg-slate-950 border-t border-slate-200 dark:border-slate-800 flex justify-between items-center shrink-0">
          <div className="text-xs text-slate-500 flex items-center gap-1.5">
            <AlertCircle size={13} className="text-slate-400" />
            <span>Automatische DDL-Generierung mit Zero-Downtime Empfehlungen</span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white text-xs font-bold rounded-xl shadow-2xs transition-colors"
          >
            Schließen
          </button>
        </div>

      </div>
    </div>
  );
};
