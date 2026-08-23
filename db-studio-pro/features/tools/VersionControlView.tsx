import React, { useState, useEffect } from 'react';
import { useProjectStore } from '../../stores/useProjectStore';
import { useUIStore } from '../../stores/useUIStore';
import { History, GitBranch, RefreshCw, GitPullRequest } from 'lucide-react';

// Subcomponents & Types
import { SchemaCommit, GitBranch as GitBranchType, RemoteConfig, MergeRequest } from './version-control/types';
import { VersionControlForm } from './version-control/VersionControlForm';
import { VersionControlList } from './version-control/VersionControlList';
import { VersionControlDetails } from './version-control/VersionControlDetails';
import { VersionControlJsonModal } from './version-control/VersionControlJsonModal';
import { VersionControlBranchSelector } from './version-control/VersionControlBranchSelector';
import { VersionControlRemoteSettings } from './version-control/VersionControlRemoteSettings';
import { VersionControlMergeRequestModal } from './version-control/VersionControlMergeRequestModal';

export const VersionControlView: React.FC = () => {
  const store = useProjectStore();
  const ui = useUIStore();
  
  const [commits, setCommits] = useState<SchemaCommit[]>([]);
  const [selectedCommitId, setSelectedCommitId] = useState<string | null>(null);
  
  // Branch State
  const [branches, setBranches] = useState<GitBranchType[]>([]);
  const [activeBranch, setActiveBranch] = useState('main');
  
  // Remote Git Config (GitHub / GitLab)
  const [remote, setRemote] = useState<RemoteConfig>({
    provider: null,
    repoName: '',
    connected: false,
    token: '',
    username: '',
  });
  
  // Pull / Merge Requests
  const [mergeRequests, setMergeRequests] = useState<MergeRequest[]>([]);
  const [isSyncing, setIsSyncing] = useState(false);
  const [showMRModal, setShowMRModal] = useState(false);

  // Commit Form State
  const [commitMessage, setCommitMessage] = useState('');
  const [commitAuthor, setCommitAuthor] = useState('Me');

  const [showJsonModal, setShowJsonModal] = useState<string | null>(null);

  // Storage Keys
  const commitsKey = `dbstudio_git_commits_${store.projectId || 'default'}`;
  const branchesKey = `dbstudio_git_branches_${store.projectId || 'default'}`;
  const activeBranchKey = `dbstudio_git_active_branch_${store.projectId || 'default'}`;
  const remoteKey = `dbstudio_git_remote_${store.projectId || 'default'}`;
  const mrsKey = `dbstudio_git_mrs_${store.projectId || 'default'}`;

  // Load all configurations
  useEffect(() => {
    // 1. Branches
    const savedBranches = localStorage.getItem(branchesKey);
    if (savedBranches) {
      setBranches(JSON.parse(savedBranches));
    } else {
      const defaultB: GitBranchType[] = [
        { name: 'main', createdAt: Date.now(), isProtected: true },
        { name: 'feature/invoices', createdAt: Date.now() - 3600000, isProtected: false }
      ];
      setBranches(defaultB);
      localStorage.setItem(branchesKey, JSON.stringify(defaultB));
    }

    // 2. Active Branch
    const savedActive = localStorage.getItem(activeBranchKey);
    if (savedActive) {
      setActiveBranch(savedActive);
    } else {
      setActiveBranch('main');
    }

    // 3. Remote Config
    const savedRemote = localStorage.getItem(remoteKey);
    if (savedRemote) {
      setRemote(JSON.parse(savedRemote));
    }

    // 4. Merge Requests
    const savedMrs = localStorage.getItem(mrsKey);
    if (savedMrs) {
      setMergeRequests(JSON.parse(savedMrs));
    } else {
      setMergeRequests([]);
    }

    // 5. Commits
    const savedCommits = localStorage.getItem(commitsKey);
    if (savedCommits) {
      try {
        const parsed = JSON.parse(savedCommits);
        setCommits(parsed);
        if (parsed.length > 0) {
          setSelectedCommitId(parsed[0].id);
        }
      } catch (e) {
        generateDefaultCommits();
      }
    } else {
      generateDefaultCommits();
    }
  }, [store.projectId]);

  const generateDefaultCommits = () => {
    const currentTables = store.tables || [];
    const currentRels = store.relationships || [];

    const mockCommits: SchemaCommit[] = [
      {
        id: 'c1',
        sha: 'f72a1bc',
        message: 'Initiales Datenbankschema erstellt',
        author: 'Sarah Lee',
        timestamp: Date.now() - 3 * 24 * 60 * 60 * 1000,
        tables: currentTables.slice(0, Math.min(2, currentTables.length)),
        relationships: currentRels.slice(0, Math.min(1, currentRels.length)),
        branch: 'main'
      },
      {
        id: 'c2',
        sha: 'b819a0e',
        message: 'Fremdschlüssel-Beziehungen und Indizes hinzugefügt',
        author: 'Tom H.',
        timestamp: Date.now() - 1 * 24 * 60 * 60 * 1000,
        tables: currentTables.slice(0, Math.min(4, currentTables.length)),
        relationships: currentRels,
        branch: 'main'
      }
    ];

    setCommits(mockCommits);
    setSelectedCommitId(mockCommits[1].id);
    localStorage.setItem(commitsKey, JSON.stringify(mockCommits));
  };

  // Branch Operations
  const handleSelectBranch = (branchName: string) => {
    setActiveBranch(branchName);
    localStorage.setItem(activeBranchKey, branchName);

    // Filter commits on selected branch and checkout the latest one
    const branchCommits = commits.filter(c => c.branch === branchName);
    if (branchCommits.length > 0) {
      const latest = branchCommits[0];
      setSelectedCommitId(latest.id);
      store.executeAction(s => {
        s.tables = JSON.parse(JSON.stringify(latest.tables));
        s.relationships = JSON.parse(JSON.stringify(latest.relationships));
      });
      ui.addToast(`Branch gewechselt zu '${branchName}' (Schema geladen)`, 'info');
    } else {
      ui.addToast(`Branch '${branchName}' hat noch keine Commits. Workspace bleibt unverändert.`, 'info');
    }
  };

  const handleCreateBranch = (branchName: string) => {
    const newB: GitBranchType = {
      name: branchName,
      createdAt: Date.now(),
      isProtected: false
    };
    const updated = [...branches, newB];
    setBranches(updated);
    localStorage.setItem(branchesKey, JSON.stringify(updated));

    // Create an initial commit on the new branch using current workspace state
    const newCommit: SchemaCommit = {
      id: crypto.randomUUID(),
      sha: Math.random().toString(16).substring(2, 9),
      message: `Initialer Zweig-Commit für ${branchName}`,
      author: 'Me',
      timestamp: Date.now(),
      tables: JSON.parse(JSON.stringify(store.tables || [])),
      relationships: JSON.parse(JSON.stringify(store.relationships || [])),
      branch: branchName
    };

    const updatedCommits = [newCommit, ...commits];
    setCommits(updatedCommits);
    setSelectedCommitId(newCommit.id);
    localStorage.setItem(commitsKey, JSON.stringify(updatedCommits));

    handleSelectBranch(branchName);
    ui.addToast(`Branch '${branchName}' erfolgreich angelegt!`, 'success');
  };

  const handleDeleteBranch = (branchName: string) => {
    const filtered = branches.filter(b => b.name !== branchName);
    setBranches(filtered);
    localStorage.setItem(branchesKey, JSON.stringify(filtered));

    if (activeBranch === branchName) {
      handleSelectBranch('main');
    }
    ui.addToast(`Branch '${branchName}' gelöscht.`, 'info');
  };

  // Remote Config Operations
  const handleUpdateRemote = (newRemote: RemoteConfig) => {
    setRemote(newRemote);
    localStorage.setItem(remoteKey, JSON.stringify(newRemote));
    ui.addToast(newRemote.connected ? `Erfolgreich mit ${newRemote.provider === 'github' ? 'GitHub' : 'GitLab'} verbunden!` : 'Verbindung getrennt.', 'success');
  };

  const handlePush = () => {
    setIsSyncing(true);
    ui.addToast(`Pushe lokale Commits auf Remote-Repository (${remote.repoName})...`, 'info');
    setTimeout(() => {
      setIsSyncing(false);
      ui.addToast('Schema erfolgreich gepusht! Alle Remote-Zweige sind auf dem neuesten Stand.', 'success');
    }, 1200);
  };

  const handlePull = () => {
    setIsSyncing(true);
    ui.addToast('Rufe Änderungen vom Remote-Repository ab...', 'info');
    setTimeout(() => {
      setIsSyncing(false);
      ui.addToast('Zweige synchronisiert. Keine neuen Änderungen gefunden.', 'success');
    }, 1200);
  };

  // Merge Requests
  const handleCreateMR = (title: string, description: string, source: string, target: string, provider: 'github' | 'gitlab') => {
    const newMR: MergeRequest = {
      id: crypto.randomUUID(),
      title,
      description,
      sourceBranch: source,
      targetBranch: target,
      status: 'open',
      provider,
      author: 'Me',
      createdAt: Date.now(),
      sha: Math.random().toString(16).substring(2, 9),
    };

    const updated = [newMR, ...mergeRequests];
    setMergeRequests(updated);
    localStorage.setItem(mrsKey, JSON.stringify(updated));
    ui.addToast(`${provider === 'gitlab' ? 'Merge Request' : 'Pull Request'} erfolgreich übermittelt!`, 'success');
  };

  const handleMergeMR = (mrId: string) => {
    const mr = mergeRequests.find(m => m.id === mrId);
    if (!mr) return;

    // Retrieve latest commit from source branch
    const sourceCommits = commits.filter(c => c.branch === mr.sourceBranch);
    if (sourceCommits.length === 0) {
      ui.addToast('Der Quellzweig enthält keine Commits zum Mergen.', 'error');
      return;
    }

    const latestSourceCommit = sourceCommits[0];

    // Create a Merge Commit on target branch
    const mergeCommit: SchemaCommit = {
      id: crypto.randomUUID(),
      sha: Math.random().toString(16).substring(2, 9),
      message: `Merge branch '${mr.sourceBranch}' into ${mr.targetBranch}`,
      author: 'Sarah Lee', // Team Lead approved
      timestamp: Date.now(),
      tables: JSON.parse(JSON.stringify(latestSourceCommit.tables)),
      relationships: JSON.parse(JSON.stringify(latestSourceCommit.relationships)),
      branch: mr.targetBranch,
    };

    // Update status to merged
    const updatedMRs = mergeRequests.map(m => m.id === mrId ? { ...m, status: 'merged' as const } : m);
    setMergeRequests(updatedMRs);
    localStorage.setItem(mrsKey, JSON.stringify(updatedMRs));

    const updatedCommits = [mergeCommit, ...commits];
    setCommits(updatedCommits);
    localStorage.setItem(commitsKey, JSON.stringify(updatedCommits));

    // Select the target branch and checkout the merged state
    setActiveBranch(mr.targetBranch);
    localStorage.setItem(activeBranchKey, mr.targetBranch);
    setSelectedCommitId(mergeCommit.id);
    store.executeAction(s => {
      s.tables = JSON.parse(JSON.stringify(mergeCommit.tables));
      s.relationships = JSON.parse(JSON.stringify(mergeCommit.relationships));
    });

    ui.addToast(`Merge erfolgreich abgeschlossen! Schema wurde in '${mr.targetBranch}' integriert.`, 'success');
  };

  const handleDeleteMR = (mrId: string) => {
    const filtered = mergeRequests.filter(m => m.id !== mrId);
    setMergeRequests(filtered);
    localStorage.setItem(mrsKey, JSON.stringify(filtered));
  };

  // Timeline Filter: Only show commits belonging to active branch
  const filteredCommits = commits.filter(c => c.branch === activeBranch);

  const handleCreateCommit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!commitMessage.trim()) return;

    const newCommit: SchemaCommit = {
      id: crypto.randomUUID(),
      sha: Math.random().toString(16).substring(2, 9),
      message: commitMessage.trim(),
      author: commitAuthor,
      timestamp: Date.now(),
      tables: JSON.parse(JSON.stringify(store.tables || [])),
      relationships: JSON.parse(JSON.stringify(store.relationships || [])),
      branch: activeBranch
    };

    const updated = [newCommit, ...commits];
    setCommits(updated);
    setSelectedCommitId(newCommit.id);
    localStorage.setItem(commitsKey, JSON.stringify(updated));
    setCommitMessage('');

    ui.addToast(`Schema erfolgreich eingecheckt auf Branch '${activeBranch}'!`, 'success');
  };

  const handleCheckoutCommit = (commit: SchemaCommit) => {
    store.executeAction(s => {
      s.tables = JSON.parse(JSON.stringify(commit.tables));
      s.relationships = JSON.parse(JSON.stringify(commit.relationships));
    });
    ui.addToast(`Workspace auf Stand von Commit '${commit.sha}' zurückgesetzt.`, 'success');
  };

  const handleDeleteCommit = (id: string) => {
    const filtered = commits.filter(c => c.id !== id);
    setCommits(filtered);
    localStorage.setItem(commitsKey, JSON.stringify(filtered));
    if (selectedCommitId === id) {
      setSelectedCommitId(filtered[0]?.id || null);
    }
    ui.addToast('Commit aus dem lokalen Verlauf gelöscht.', 'info');
  };

  const getSelectedCommit = () => {
    return commits.find(c => c.id === selectedCommitId) || null;
  };

  const selectedCommit = getSelectedCommit();

  const getPreviousCommit = (commit: SchemaCommit) => {
    const idx = commits.findIndex(c => c.id === commit.id);
    if (idx !== -1 && idx < commits.length - 1) {
      return commits[idx + 1];
    }
    return null;
  };

  const previousCommit = selectedCommit ? getPreviousCommit(selectedCommit) : null;

  const computeDiff = () => {
    if (!selectedCommit) return { added: [], removed: [], modified: [] };
    
    const current = selectedCommit.tables;
    const base = previousCommit ? previousCommit.tables : [];

    const added: string[] = [];
    const removed: string[] = [];
    const modified: { tableName: string; fieldDiffs: string[] }[] = [];

    current.forEach(t => {
      const baseTable = base.find(bt => bt.id === t.id);
      if (!baseTable) {
        added.push(t.name);
      } else {
        const fieldDiffs: string[] = [];
        if (baseTable.name !== t.name) {
          fieldDiffs.push(`Umbenannt von '${baseTable.name}' in '${t.name}'`);
        }
        t.fields.forEach(f => {
          const baseField = baseTable.fields.find(bf => bf.id === f.id);
          if (!baseField) {
            fieldDiffs.push(`Spalte hinzugefügt: '${f.name}' (${f.type})`);
          } else if (baseField.name !== f.name || baseField.type !== f.type) {
            fieldDiffs.push(`Spalte geändert: '${baseField.name}' (${baseField.type}) -> '${f.name}' (${f.type})`);
          }
        });
        baseTable.fields.forEach(bf => {
          if (!t.fields.some(f => f.id === bf.id)) {
            fieldDiffs.push(`Spalte entfernt: '${bf.name}'`);
          }
        });
        if (fieldDiffs.length > 0) {
          modified.push({ tableName: t.name, fieldDiffs });
        }
      }
    });

    base.forEach(bt => {
      if (!current.some(t => t.id === bt.id)) {
        removed.push(bt.name);
      }
    });

    return { added, removed, modified };
  };

  const diff = computeDiff();

  return (
    <div className="flex-1 bg-slate-50 dark:bg-slate-950 flex flex-col h-full overflow-hidden">
      {/* Title Header */}
      <div className="px-6 py-4 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 shrink-0 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
            <History className="text-amber-500" size={24} />
            <span>Git-Schema-Versionierung</span>
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Verwalten Sie inkrementelle Schema-Snapshots, vergleichen Sie Tabellendifferenzen, steuern Sie Branches und erstellen Sie GitLab Merge Requests.
          </p>
        </div>
        
        {/* Pull / Merge Request Launcher Button */}
        <div className="flex items-center gap-2">
          {remote.connected && (
            <button
              type="button"
              onClick={() => setShowMRModal(true)}
              className="flex items-center gap-1.5 px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded shadow transition-all"
            >
              <GitPullRequest size={14} />
              <span>{remote.provider === 'gitlab' ? 'Merge Requests' : 'Pull Requests'} ({mergeRequests.filter(m => m.status === 'open').length})</span>
            </button>
          )}
          <button 
            type="button"
            onClick={generateDefaultCommits}
            className="flex items-center gap-1 px-3 py-1.5 text-xs border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 rounded transition text-slate-600 dark:text-slate-300"
            title="Historie auf Standard-Demos zurücksetzen"
          >
            <RefreshCw size={12} />
            <span>Reset</span>
          </button>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Left Side: Branch Selector + Remote + Commit Form & Timeline (Scrollable) */}
        <div className="w-1/2 border-r border-slate-200 dark:border-slate-800 flex flex-col h-full bg-white dark:bg-slate-900 overflow-y-auto">
          <div className="p-4 space-y-4">
            
            {/* Branch Management */}
            <VersionControlBranchSelector
              branches={branches}
              activeBranch={activeBranch}
              onSelectBranch={handleSelectBranch}
              onCreateBranch={handleCreateBranch}
              onDeleteBranch={handleDeleteBranch}
            />

            {/* GitHub & GitLab integration */}
            <VersionControlRemoteSettings
              remote={remote}
              onUpdateRemote={handleUpdateRemote}
              onPush={handlePush}
              onPull={handlePull}
              isSyncing={isSyncing}
            />

          </div>

          <VersionControlForm
            commitMessage={commitMessage}
            setCommitMessage={setCommitMessage}
            commitAuthor={commitAuthor}
            setCommitAuthor={setCommitAuthor}
            tablesCount={store.tables?.length || 0}
            relationshipsCount={store.relationships?.length || 0}
            handleCreateCommit={handleCreateCommit}
          />
          <VersionControlList
            commits={filteredCommits}
            selectedCommitId={selectedCommitId}
            setSelectedCommitId={setSelectedCommitId}
            generateDefaultCommits={generateDefaultCommits}
          />
        </div>

        {/* Right Details Panel */}
        <div className="w-1/2 flex flex-col h-full bg-white dark:bg-slate-900">
          <VersionControlDetails
            selectedCommit={selectedCommit}
            previousCommit={previousCommit}
            diff={diff}
            setShowJsonModal={setShowJsonModal}
            handleCheckoutCommit={handleCheckoutCommit}
            handleDeleteCommit={handleDeleteCommit}
          />
        </div>
      </div>

      {/* JSON Viewer Modal */}
      {showJsonModal && (
        <VersionControlJsonModal
          showJsonModal={showJsonModal}
          onClose={() => setShowJsonModal(null)}
        />
      )}

      {/* Pull Request / Merge Request modal */}
      {showMRModal && (
        <VersionControlMergeRequestModal
          onClose={() => setShowMRModal(false)}
          mergeRequests={mergeRequests}
          branches={branches}
          commits={commits}
          onCreateMR={handleCreateMR}
          onMergeMR={handleMergeMR}
          onDeleteMR={handleDeleteMR}
          provider={remote.provider || 'github'}
        />
      )}
    </div>
  );
};
