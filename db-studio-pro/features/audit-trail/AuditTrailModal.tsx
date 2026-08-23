import React, { useState } from 'react';
import { Table } from '../../types/index';
import { AuditEntry } from './auditTypes';
import { generateSampleAuditHistory, restoreRecordFromSnapshot, exportAuditLogsToCsv } from './auditService';
import { AuditLogTimeline } from './components/AuditLogTimeline';
import { TimeTravelDiffViewer } from './components/TimeTravelDiffViewer';
import { X, History, Download, RotateCcw, ShieldCheck, Check, Sparkles } from 'lucide-react';

interface AuditTrailModalProps {
  tables: Table[];
  updateTable: (table: Table) => void;
  onClose: () => void;
}

export const AuditTrailModal: React.FC<AuditTrailModalProps> = ({
  tables,
  updateTable,
  onClose
}) => {
  const [entries, setEntries] = useState<AuditEntry[]>(() => generateSampleAuditHistory(tables));
  const [selectedEntry, setSelectedEntry] = useState<AuditEntry | null>(null);
  const [restoreNotification, setRestoreNotification] = useState<string | null>(null);

  const handleRestore = (entry: AuditEntry) => {
    const targetTable = tables.find(t => t.id === entry.tableId || t.name === entry.tableName);
    const snapshot = entry.snapshotAfter || entry.snapshotBefore;
    if (!targetTable || !snapshot) return;

    const updatedTable = restoreRecordFromSnapshot(targetTable, entry.recordId, snapshot);
    updateTable(updatedTable);

    // Append new audit entry for the restore action
    const newEntry: AuditEntry = {
      id: `audit_rest_${Date.now()}`,
      timestamp: new Date().toLocaleString('de-DE'),
      unixTimestamp: Date.now(),
      userId: 'current_user',
      userName: 'Aktueller Benutzer (Du)',
      userRole: 'Admin',
      action: 'RESTORE',
      tableId: targetTable.id,
      tableName: targetTable.name,
      recordId: entry.recordId,
      diffs: [],
      snapshotAfter: snapshot,
      comment: `Point-in-Time Restore auf Stand vom ${entry.timestamp} durchgeführt.`
    };

    setEntries(prev => [newEntry, ...prev]);
    setSelectedEntry(null);
    setRestoreNotification(`Datensatz #${entry.recordId} in Tabelle "${targetTable.name}" erfolgreich auf Stand vom ${entry.timestamp} zurückgesetzt.`);
    setTimeout(() => setRestoreNotification(null), 4000);
  };

  const handleExportCsv = () => {
    const csv = exportAuditLogsToCsv(entries);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `audit_trail_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  const handleExportJson = () => {
    const jsonStr = JSON.stringify(entries, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `audit_trail_${new Date().toISOString().split('T')[0]}.json`;
    link.click();
  };

  return (
    <div className="fixed inset-0 bg-black/60 z-[150] flex items-center justify-center p-4 animate-in fade-in backdrop-blur-xs">
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-5xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col h-[780px]">
        
        {/* Header */}
        <div className="bg-slate-900 text-white p-4.5 flex justify-between items-center shrink-0 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="bg-purple-500/20 p-2.5 rounded-xl border border-purple-500/30">
              <History className="text-purple-400 w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-black tracking-tight">Audit-Trail & Change Data Capture (CDC)</h2>
                <span className="bg-purple-900/60 text-purple-300 text-[10px] font-bold px-2 py-0.5 rounded-full border border-purple-700">
                  {entries.length} Änderungen protokolliert
                </span>
                <span className="bg-emerald-900/60 text-emerald-300 text-[10px] font-bold px-2 py-0.5 rounded-full border border-emerald-700">
                  Time-Travel Aktiv
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Lückenloses Änderungsprotokoll mit 1-Klick Point-in-Time Datensatz-Wiederherstellung.
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

        {/* Toolbar */}
        <div className="bg-slate-50 dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800 px-6 py-2.5 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <span className="text-xs font-extrabold text-slate-600 dark:text-slate-300 uppercase tracking-wider">
              {selectedEntry ? 'Side-by-Side Time-Travel Diff' : 'Chronologischer Änderungsverlauf'}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleExportCsv}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-white dark:bg-slate-800 hover:bg-slate-50 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-200 rounded-lg text-xs font-bold shadow-2xs transition-all"
            >
              <Download size={12} />
              <span>CSV Export</span>
            </button>
            <button
              onClick={handleExportJson}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-purple-50 dark:bg-purple-950/40 hover:bg-purple-100 border border-purple-200 dark:border-purple-800 text-purple-700 dark:text-purple-300 rounded-lg text-xs font-bold shadow-2xs transition-all"
            >
              <Download size={12} />
              <span>JSON Export</span>
            </button>
          </div>
        </div>

        {/* Success Alert Banner */}
        {restoreNotification && (
          <div className="bg-emerald-500 text-white p-3 text-xs font-bold flex items-center justify-between animate-in slide-in-from-top">
            <div className="flex items-center gap-2">
              <Check size={16} />
              <span>{restoreNotification}</span>
            </div>
            <button onClick={() => setRestoreNotification(null)} className="text-white/80 hover:text-white">
              <X size={14} />
            </button>
          </div>
        )}

        {/* Content Area */}
        <div className="flex-1 p-6 overflow-y-auto bg-white dark:bg-slate-900">
          {selectedEntry ? (
            <TimeTravelDiffViewer
              entry={selectedEntry}
              currentTable={tables.find(t => t.id === selectedEntry.tableId || t.name === selectedEntry.tableName)}
              onBack={() => setSelectedEntry(null)}
              onRestore={handleRestore}
            />
          ) : (
            <AuditLogTimeline
              entries={entries}
              onSelectEntryForTimeTravel={setSelectedEntry}
            />
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-slate-50 dark:bg-slate-950 border-t border-slate-200 dark:border-slate-800 flex justify-between items-center shrink-0">
          <div className="text-xs text-slate-500 flex items-center gap-2">
            <RotateCcw size={13} className="text-purple-500" />
            <span>Point-in-Time Restore synchronisiert sofort den In-Memory Tabellenstatus</span>
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
