
import React, { useState, useEffect } from 'react';
import { Table, DbType } from '../../types/index';
import { calculateMigration, MigrationScript } from '../../services/migrationService';
import { X, GitCommit, ArrowRight, Database, Download, CheckCircle, FileCode, Edit3, Save, RotateCcw } from 'lucide-react';

interface MigrationManagerModalProps {
  currentTables: Table[];
  lastSnapshot: Table[] | undefined;
  dbType: DbType;
  onSnapshot: () => void;
  onClose: () => void;
}

export const MigrationManagerModal: React.FC<MigrationManagerModalProps> = ({ currentTables, lastSnapshot, dbType, onSnapshot, onClose }) => {
  const [migration, setMigration] = useState<MigrationScript | null>(null);
  const [activeTab, setActiveTab] = useState<'up' | 'down'>('up');
  const [showConfirm, setShowConfirm] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  
  // Local state for live-editable scripts
  const [editableUp, setEditableUp] = useState('');
  const [editableDown, setEditableDown] = useState('');

  useEffect(() => {
      const result = calculateMigration(currentTables, lastSnapshot || [], dbType);
      setMigration(result);
      setEditableUp(result.up);
      setEditableDown(result.down);
  }, [currentTables, lastSnapshot, dbType]);

  const handleApply = () => {
      onSnapshot();
      onClose();
  };

  const handleDownload = () => {
      const content = `-- Migration Up\n${editableUp}\n\n-- Migration Down\n${editableDown}`;
      const blob = new Blob([content], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `migration_${dbType}_${new Date().toISOString().replace(/[-:T.]/g, '').slice(0,14)}.sql`;
      a.click();
  };

  const handleResetToGenerated = () => {
      if (migration) {
          setEditableUp(migration.up);
          setEditableDown(migration.down);
      }
  };

  const hasChanges = migration && migration.description !== 'No changes';

  // Helper to count lines of current active script
  const activeCode = activeTab === 'up' ? editableUp : editableDown;
  const lineCount = activeCode.split('\n').length;

  return (
    <div className="fixed inset-0 bg-black/60 z-[150] flex items-center justify-center p-4 animate-in fade-in-25 backdrop-blur-sm">
      <div className="bg-white dark:bg-slate-900 rounded-xl shadow-2xl w-full max-w-5xl border border-slate-300 dark:border-slate-800 overflow-hidden flex flex-col h-[750px] transition-colors duration-300">
        
        {/* Modal Header */}
        <div className="bg-slate-800 dark:bg-slate-950 text-white p-5 flex justify-between items-center shrink-0 border-b border-slate-700 dark:border-slate-800">
            <div className="flex items-center gap-3">
              <div className="bg-orange-500/20 p-2 rounded-lg">
                <GitCommit className="text-orange-400 w-5 h-5"/>
              </div>
              <div>
                <h2 className="text-xl font-extrabold tracking-tight">Visual Migration Generator</h2>
                <p className="text-xs text-slate-400">Verwalte, editiere und vergleiche Schema-Migrationsskripte</p>
              </div>
            </div>
            <button 
              onClick={onClose} 
              className="text-slate-400 hover:text-white p-1 rounded-md hover:bg-slate-700/50 transition-colors"
            >
              <X size={20}/>
            </button>
        </div>

        {/* Outer Split Layout */}
        <div className="flex-1 overflow-hidden flex flex-col md:flex-row">
            
            {/* Left Sidebar: Detected Changes Difference List */}
            <div className="w-full md:w-80 bg-slate-50 dark:bg-slate-950/40 border-r border-slate-200 dark:border-slate-800 p-4 overflow-y-auto flex flex-col shrink-0">
                <h3 className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-3">Änderungen erkannt</h3>
                {hasChanges ? (
                    <div className="space-y-2 flex-1">
                        {migration?.description.split('\n').map((line, i) => {
                            let dotColor = 'bg-blue-500';
                            let bgClass = 'bg-blue-50/50 border-blue-200 dark:bg-blue-950/20 dark:border-blue-900/30 text-blue-900 dark:text-blue-300';
                            
                            if (line.toLowerCase().includes('create table') || line.toLowerCase().includes('add column')) {
                              dotColor = 'bg-emerald-500';
                              bgClass = 'bg-emerald-50/50 border-emerald-200 dark:bg-emerald-950/20 dark:border-emerald-900/30 text-emerald-950 dark:text-emerald-300';
                            } else if (line.toLowerCase().includes('drop table') || line.toLowerCase().includes('drop column')) {
                              dotColor = 'bg-rose-500';
                              bgClass = 'bg-rose-50/50 border-rose-200 dark:bg-rose-950/20 dark:border-rose-900/30 text-rose-950 dark:text-rose-300';
                            }

                            return (
                                <div key={i} className={`p-2.5 rounded-lg border text-xs shadow-sm flex items-start gap-2.5 transition-all ${bgClass}`}>
                                    <span className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${dotColor}`}></span>
                                    <span className="font-medium leading-relaxed">{line}</span>
                                </div>
                            );
                        })}
                    </div>
                ) : (
                    <div className="text-center text-slate-400 dark:text-slate-500 my-auto py-10">
                        <CheckCircle size={48} className="mx-auto mb-3 text-green-500 dark:text-green-400 opacity-60"/>
                        <p className="font-semibold text-sm">Schema ist vollständig synchron</p>
                        <p className="text-xs mt-1 leading-normal">Der aktuelle Entwurf entspricht exakt dem letzten gespeicherten Snapshot.</p>
                    </div>
                )}
                
                {/* Dialect Info Badge */}
                <div className="mt-4 p-3 bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-slate-500 dark:text-slate-400 font-medium">Ziel-Datenbank:</span>
                    <span className="font-mono bg-blue-100 dark:bg-blue-950 text-blue-800 dark:text-blue-300 px-2 py-0.5 rounded font-bold uppercase">{dbType}</span>
                  </div>
                </div>
            </div>

            {/* Right: Live SQL Editor Block */}
            <div className="flex-1 flex flex-col bg-white dark:bg-slate-900">
                
                {/* Editor Tabs and Actions Header */}
                <div className="border-b border-slate-200 dark:border-slate-800 flex justify-between items-center px-4 py-1.5 bg-slate-50/50 dark:bg-slate-900/80 shrink-0">
                    <div className="flex gap-1">
                        <button 
                            onClick={() => setActiveTab('up')}
                            className={`px-4 py-2 text-xs font-bold rounded-lg transition-all ${activeTab === 'up' ? 'bg-blue-500 text-white shadow-md' : 'text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800'}`}
                        >
                            🚀 UP Script (Ausführen)
                        </button>
                        <button 
                            onClick={() => setActiveTab('down')}
                            className={`px-4 py-2 text-xs font-bold rounded-lg transition-all ${activeTab === 'down' ? 'bg-rose-500 text-white shadow-md' : 'text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800'}`}
                        >
                            ⏪ DOWN Script (Rückgängig)
                        </button>
                    </div>
                    
                    <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => setIsEditing(!isEditing)}
                          className={`p-1.5 px-3 rounded-lg border text-xs font-semibold flex items-center gap-1.5 transition-all ${isEditing ? 'bg-amber-500 border-amber-600 text-white shadow' : 'border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 bg-white dark:bg-slate-900'}`}
                          title="Änderungen am SQL-Skript manuell vornehmen"
                        >
                          {isEditing ? <Save size={14}/> : <Edit3 size={14}/>}
                          <span>{isEditing ? 'Live-Editiermodus beenden' : 'SQL editieren'}</span>
                        </button>
                        
                        {(editableUp !== (migration?.up || '') || editableDown !== (migration?.down || '')) && (
                          <button
                            onClick={handleResetToGenerated}
                            className="p-1.5 px-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg text-slate-600 dark:text-slate-400 border border-transparent transition-colors"
                            title="Auf generierte Standardscripte zurücksetzen"
                          >
                            <RotateCcw size={14} />
                          </button>
                        )}
                    </div>
                </div>

                {/* Code Editor Body */}
                <div className="flex-1 flex overflow-hidden bg-[#1e293b] font-mono text-sm leading-relaxed relative">
                    
                    {/* Line numbers column */}
                    <div className="py-4 text-right pr-3 pl-4 text-slate-500 select-none border-r border-slate-800 shrink-0 text-xs text-opacity-80">
                      {Array.from({ length: lineCount }).map((_, i) => (
                        <div key={i} className="h-5">{i + 1}</div>
                      ))}
                    </div>

                    {/* Code Container */}
                    <div className="flex-1 relative overflow-auto">
                      {isEditing ? (
                        <textarea
                          value={activeTab === 'up' ? editableUp : editableDown}
                          onChange={(e) => {
                            if (activeTab === 'up') setEditableUp(e.target.value);
                            else setEditableDown(e.target.value);
                          }}
                          className="w-full h-full min-h-full bg-transparent text-emerald-400 focus:outline-none p-4 font-mono text-xs leading-5 resize-none caret-white"
                          style={{ tabSize: 4 }}
                        />
                      ) : (
                        <pre className="p-4 text-xs font-mono text-emerald-400 leading-5">
                          {activeCode || '-- Keine Änderungen notwendig'}
                        </pre>
                      )}
                    </div>

                    {/* Indicator Overlay when in live editing mode */}
                    {isEditing && (
                      <div className="absolute top-2 right-4 bg-amber-500/10 border border-amber-500/40 text-amber-400 text-[10px] uppercase tracking-wider font-bold px-2 py-0.5 rounded shadow-sm">
                        Live Editierung aktiv
                      </div>
                    )}
                </div>
            </div>
        </div>

        {/* Modal Footer Controls */}
        <div className="p-4 bg-slate-50 dark:bg-slate-950 border-t border-slate-200 dark:border-slate-800 flex justify-between items-center shrink-0 transition-colors duration-300">
            {showConfirm ? (
                <div className="flex items-center gap-3 w-full justify-end bg-orange-50 dark:bg-orange-950/20 p-2 rounded border border-orange-200 dark:border-orange-900/30">
                    <span className="text-sm text-orange-800 dark:text-orange-300 font-bold">Snapshot wirklich aktualisieren?</span>
                    <span className="text-xs text-slate-500 dark:text-slate-400 hidden sm:inline">Dies speichert den aktuellen Schema-Entwurf als neuen Ausgangspunkt.</span>
                    <button onClick={() => setShowConfirm(false)} className="text-slate-500 dark:text-slate-400 text-xs hover:underline ml-2">Abbrechen</button>
                    <button onClick={handleApply} className="bg-orange-600 hover:bg-orange-700 text-white px-4 py-1.5 rounded-lg text-xs font-extrabold shadow-md transition-colors">Ja, Snapshot aktualisieren</button>
                </div>
            ) : (
                <>
                    <div className="text-xs text-slate-500 dark:text-slate-400 max-w-md hidden sm:block">
                        Vergleicht den aktuellen Schemaentwurf mit dem gespeicherten Snapshot, um die minimalen `ALTER TABLE` DDL-Skripte zu berechnen.
                    </div>
                    <div className="flex gap-2 w-full sm:w-auto justify-end">
                        <button onClick={onClose} className="px-4 py-2 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-lg text-sm transition-colors">Schließen</button>
                        {hasChanges && (
                            <>
                                <button onClick={handleDownload} className="px-4 py-2 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg text-sm font-semibold flex items-center gap-2 transition-colors">
                                    <Download size={16} className="text-slate-500 dark:text-slate-400"/> SQL Speichern
                                </button>
                                <button onClick={() => setShowConfirm(true)} className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-bold shadow-md flex items-center gap-2 transition-colors">
                                    <Database size={16}/> Snapshot speichern
                                </button>
                            </>
                        )}
                    </div>
                </>
            )}
        </div>
      </div>
    </div>
  );
};

