import React, { useState } from 'react';
import { GitPullRequest, ArrowRight, ShieldCheck, Check, Trash2, Code } from 'lucide-react';
import { MergeRequest, GitBranch, SchemaCommit } from './types';

interface VersionControlMergeRequestModalProps {
  onClose: () => void;
  mergeRequests: MergeRequest[];
  branches: GitBranch[];
  commits: SchemaCommit[];
  onCreateMR: (title: string, description: string, source: string, target: string, provider: 'github' | 'gitlab') => void;
  onMergeMR: (mrId: string) => void;
  onDeleteMR: (mrId: string) => void;
  provider: 'github' | 'gitlab';
}

export const VersionControlMergeRequestModal: React.FC<VersionControlMergeRequestModalProps> = ({
  onClose,
  mergeRequests,
  branches,
  commits,
  onCreateMR,
  onMergeMR,
  onDeleteMR,
  provider,
}) => {
  const [activeTab, setActiveTab] = useState<'list' | 'create'>('list');
  
  // New MR form
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [sourceBranch, setSourceBranch] = useState(branches[1]?.name || '');
  const [targetBranch, setTargetBranch] = useState('main');

  const mrLabel = provider === 'gitlab' ? 'Merge Request (MR)' : 'Pull Request (PR)';

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !sourceBranch || !targetBranch) return;
    if (sourceBranch === targetBranch) {
      alert('Source und Target Branch müssen unterschiedlich sein.');
      return;
    }

    onCreateMR(title, description, sourceBranch, targetBranch, provider);
    setTitle('');
    setDescription('');
    setActiveTab('list');
  };

  // Helper to preview tables diff between source and target branch
  const getBranchTables = (branchName: string) => {
    const branchCommits = commits.filter(c => c.branch === branchName);
    return branchCommits[0]?.tables || [];
  };

  const getMRDiffCount = (mr: MergeRequest) => {
    const sourceTables = getBranchTables(mr.sourceBranch);
    const targetTables = getBranchTables(mr.targetBranch);
    const diff = Math.abs(sourceTables.length - targetTables.length);
    return diff === 0 ? 'Feinabstimmung (0 Differenzen)' : `${diff} Tabelle(n) Abweichung`;
  };

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-900 rounded-xl shadow-2xl max-w-2xl w-full max-h-[85vh] flex flex-col border border-slate-200 dark:border-slate-800">
        
        {/* Header */}
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-900/50 rounded-t-xl shrink-0">
          <div className="flex items-center gap-2">
            <GitPullRequest size={18} className="text-indigo-500" />
            <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100 font-sans">
              {provider === 'gitlab' ? 'GitLab Merge Requests' : 'GitHub Pull Requests'}
            </h3>
          </div>
          <button 
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-xs font-bold"
          >
            Schließen
          </button>
        </div>

        {/* Tab Selection */}
        <div className="flex border-b border-slate-200 dark:border-slate-800 shrink-0">
          <button
            type="button"
            onClick={() => setActiveTab('list')}
            className={`flex-1 py-2 text-xs font-bold transition-all border-b-2 ${
              activeTab === 'list'
                ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400 bg-slate-50/50 dark:bg-slate-950/20'
                : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
            }`}
          >
            Alle {mrLabel}s ({mergeRequests.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('create')}
            className={`flex-1 py-2 text-xs font-bold transition-all border-b-2 ${
              activeTab === 'create'
                ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400 bg-slate-50/50 dark:bg-slate-950/20'
                : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
            }`}
          >
            Neues {mrLabel} erstellen
          </button>
        </div>

        {/* Body content */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {activeTab === 'list' ? (
            <div className="space-y-3">
              {mergeRequests.length === 0 ? (
                <div className="text-center py-10 text-slate-400">
                  <GitPullRequest size={36} className="mx-auto mb-2 text-slate-300" />
                  <p className="text-sm font-semibold">Keine aktiven {mrLabel}s</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Erstellen Sie ein neues {mrLabel}, um Schemaänderungen abzugleichen.</p>
                </div>
              ) : (
                mergeRequests.map((mr) => (
                  <div 
                    key={mr.id} 
                    className={`p-4 rounded-lg border text-left flex flex-col gap-3 ${
                      mr.status === 'merged'
                        ? 'bg-emerald-50/20 dark:bg-emerald-950/5 border-emerald-200 dark:border-emerald-900/40'
                        : 'bg-slate-50 dark:bg-slate-900/30 border-slate-200 dark:border-slate-800'
                    }`}
                  >
                    <div className="flex justify-between items-start">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className={`px-1.5 py-0.5 rounded text-[9px] font-extrabold uppercase ${
                            mr.status === 'merged'
                              ? 'bg-emerald-100 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-400'
                              : 'bg-indigo-100 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-400'
                          }`}>
                            {mr.status === 'merged' ? 'Merged' : 'Offen'}
                          </span>
                          <span className="font-bold text-xs text-slate-800 dark:text-slate-100">{mr.title}</span>
                        </div>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">{mr.description}</p>
                      </div>
                      
                      {mr.status === 'open' && (
                        <button
                          type="button"
                          onClick={() => onDeleteMR(mr.id)}
                          className="text-slate-400 hover:text-red-500 p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-800"
                        >
                          <Trash2 size={13} />
                        </button>
                      )}
                    </div>

                    {/* Compare Branches line */}
                    <div className="flex items-center gap-2.5 py-1.5 px-2.5 rounded bg-white dark:bg-slate-950 border border-slate-100 dark:border-slate-850 text-xs font-mono">
                      <span className="text-indigo-600 dark:text-indigo-400 font-bold">{mr.sourceBranch}</span>
                      <ArrowRight size={12} className="text-slate-400" />
                      <span className="text-slate-600 dark:text-slate-300">{mr.targetBranch}</span>
                      <span className="ml-auto text-[10px] text-slate-400 font-sans font-bold">
                        {getMRDiffCount(mr)}
                      </span>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1">
                      <div>
                        <span>Erstellt von: <strong className="text-slate-700 dark:text-slate-300">{mr.author}</strong></span>
                        <span className="mx-2">•</span>
                        <span>{new Date(mr.createdAt).toLocaleDateString()}</span>
                      </div>

                      {mr.status === 'open' && (
                        <div className="flex gap-2">
                          {/* Approve feedback simulation */}
                          <div className="flex items-center gap-1 text-[10px] text-indigo-600 dark:text-indigo-400 font-bold mr-1 bg-indigo-50 dark:bg-indigo-950/20 px-2 py-0.5 rounded border border-indigo-100/30">
                            <ShieldCheck size={11} />
                            <span>Sarah Approved</span>
                          </div>

                          <button
                            type="button"
                            onClick={() => onMergeMR(mr.id)}
                            className="flex items-center gap-1 px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded shadow transition-all"
                          >
                            <Check size={11} />
                            <span>Merge bestätigen</span>
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          ) : (
            <form onSubmit={handleCreate} className="space-y-4">
              {/* Branch Config Row */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1">Source (Quelle)</label>
                  <select
                    value={sourceBranch}
                    onChange={(e) => setSourceBranch(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg p-2 text-xs text-slate-800 dark:text-slate-200 focus:outline-none"
                    required
                  >
                    <option value="">-- Zweig wählen --</option>
                    {branches.map(b => (
                      <option key={b.name} value={b.name}>{b.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1">Target (Ziel)</label>
                  <select
                    value={targetBranch}
                    onChange={(e) => setTargetBranch(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg p-2 text-xs text-slate-800 dark:text-slate-200 focus:outline-none"
                    required
                  >
                    {branches.map(b => (
                      <option key={b.name} value={b.name}>{b.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Title input */}
              <div>
                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1">Titel</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="z.B. Feature: Tabellen-Abgleich und FK-Indizes"
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg p-2.5 text-xs text-slate-800 dark:text-slate-100 focus:outline-none"
                  required
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1">Beschreibung / Review Notizen</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Beschreiben Sie hier, welche SQL Schema-Änderungen in das Hauptsystem überführt werden sollen."
                  rows={4}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg p-2.5 text-xs text-slate-800 dark:text-slate-100 focus:outline-none"
                />
              </div>

              {/* Diff Preview before Merge Request creation */}
              {sourceBranch && targetBranch && sourceBranch !== targetBranch && (
                <div className="p-3 bg-indigo-50/40 dark:bg-slate-950/40 rounded-lg border border-indigo-100/40 dark:border-slate-800 text-xs flex gap-2">
                  <Code size={16} className="text-indigo-500 mt-0.5" />
                  <div>
                    <span className="font-bold text-slate-700 dark:text-slate-300">Schema-Diff-Validierung:</span>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                      DB Studio Pro wird die Quelltabelle von <code className="font-mono text-indigo-600 dark:text-indigo-400 bg-slate-100 dark:bg-slate-800 px-1 py-0.5 rounded">{sourceBranch}</code> in <code className="font-mono text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 px-1 py-0.5 rounded">{targetBranch}</code> mergen und die referenzielle Integrität vor dem Zusammenführen validieren.
                    </p>
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="flex justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setActiveTab('list')}
                  className="px-4 py-2 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-semibold hover:bg-slate-50 text-slate-500"
                >
                  Abbrechen
                </button>
                <button
                  type="submit"
                  disabled={!title.trim() || sourceBranch === targetBranch}
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-lg text-xs shadow transition-all disabled:opacity-50"
                >
                  {mrLabel} absenden
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
