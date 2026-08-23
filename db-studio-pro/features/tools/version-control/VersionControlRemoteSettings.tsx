import React, { useState } from 'react';
import { GitBranch, Globe, Link, Check, RefreshCw } from 'lucide-react';
import { RemoteConfig } from './types';

interface VersionControlRemoteSettingsProps {
  remote: RemoteConfig;
  onUpdateRemote: (remote: RemoteConfig) => void;
  onPush: () => void;
  onPull: () => void;
  isSyncing: boolean;
}

export const VersionControlRemoteSettings: React.FC<VersionControlRemoteSettingsProps> = ({
  remote,
  onUpdateRemote,
  onPush,
  onPull,
  isSyncing,
}) => {
  const [provider, setProvider] = useState<'github' | 'gitlab'>(remote.provider || 'github');
  const [repoName, setRepoName] = useState(remote.repoName || 'my-org/database-schema');
  const [username, setUsername] = useState(remote.username || 'git-developer');
  const [token, setToken] = useState(remote.token || '');
  const [isEditing, setIsEditing] = useState(!remote.connected);

  const handleSave = () => {
    onUpdateRemote({
      provider,
      repoName,
      username,
      token,
      connected: true,
    });
    setIsEditing(false);
  };

  const handleDisconnect = () => {
    onUpdateRemote({
      provider: null,
      repoName: '',
      username: '',
      token: '',
      connected: false,
    });
    setIsEditing(true);
  };

  return (
    <div className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg shadow-sm">
      <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-850 mb-3">
        <h3 className="text-xs font-bold text-slate-700 dark:text-slate-200 flex items-center gap-1.5 uppercase tracking-wider">
          <Globe size={14} className="text-indigo-500" />
          <span>Remote-Anbindung (GitHub & GitLab)</span>
        </h3>
        {remote.connected && !isEditing && (
          <span className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-100 dark:border-emerald-900 text-[10px] text-emerald-600 dark:text-emerald-400 font-bold">
            <Check size={10} />
            <span>Verbunden ({remote.provider === 'github' ? 'GitHub' : 'GitLab'})</span>
          </span>
        )}
      </div>

      {isEditing ? (
        <div className="space-y-3">
          {/* Provider Toggle */}
          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Provider auswählen</label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setProvider('github')}
                className={`py-1.5 text-center text-xs font-bold border rounded transition-all ${
                  provider === 'github'
                    ? 'border-slate-900 dark:border-white bg-slate-50 dark:bg-slate-800 text-slate-950 dark:text-white'
                    : 'border-slate-200 dark:border-slate-800 text-slate-400 hover:text-slate-600'
                }`}
              >
                GitHub
              </button>
              <button
                type="button"
                onClick={() => setProvider('gitlab')}
                className={`py-1.5 text-center text-xs font-bold border rounded transition-all ${
                  provider === 'gitlab'
                    ? 'border-orange-500 text-orange-600 dark:text-orange-400 bg-orange-50/50 dark:bg-orange-950/20'
                    : 'border-slate-200 dark:border-slate-800 text-slate-400 hover:text-slate-600'
                }`}
              >
                GitLab (Self-Hosted ok)
              </button>
            </div>
          </div>

          {/* Repo Name */}
          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Repository Pfad</label>
            <input
              type="text"
              value={repoName}
              onChange={(e) => setRepoName(e.target.value)}
              placeholder="z.B. organization/repo-name"
              className="w-full px-2.5 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded text-slate-800 dark:text-slate-100"
            />
          </div>

          {/* Credentials */}
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Benutzername</label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="git-developer"
                className="w-full px-2.5 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded text-slate-800 dark:text-slate-100"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Personal Access Token</label>
              <input
                type="password"
                value={token}
                onChange={(e) => setToken(e.target.value)}
                placeholder="glpat- / ghp_..."
                className="w-full px-2.5 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded text-slate-800 dark:text-slate-100"
              />
            </div>
          </div>

          {/* Save Button */}
          <button
            type="button"
            onClick={handleSave}
            disabled={!repoName.trim() || !username.trim()}
            className="w-full py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded transition-all flex items-center justify-center gap-1"
          >
            <Link size={12} />
            <span>Repository anbinden</span>
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="text-xs space-y-1.5 font-mono text-slate-600 dark:text-slate-300">
            <div className="flex justify-between">
              <span className="text-slate-400 font-sans">Server URL:</span>
              <span>{remote.provider === 'github' ? 'github.com' : 'gitlab.com'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400 font-sans">Repository:</span>
              <span className="font-semibold text-indigo-600 dark:text-indigo-400">{remote.repoName}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400 font-sans">Zugeordnet als:</span>
              <span>{remote.username}</span>
            </div>
          </div>

          {/* Push & Pull Actions */}
          <div className="grid grid-cols-2 gap-2 pt-1">
            <button
              type="button"
              onClick={onPull}
              disabled={isSyncing}
              className="flex items-center justify-center gap-1 py-1.5 border border-slate-300 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 rounded font-semibold text-xs text-slate-700 dark:text-slate-300 transition-colors"
            >
              <RefreshCw size={12} className={isSyncing ? 'animate-spin' : ''} />
              <span>Pull (Abrufen)</span>
            </button>
            <button
              type="button"
              onClick={onPush}
              disabled={isSyncing}
              className="flex items-center justify-center gap-1 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded font-bold text-xs transition-colors"
            >
              <GitBranch size={12} />
              <span>Push (Veröffentlichen)</span>
            </button>
          </div>

          {/* Disconnect Button */}
          <div className="flex justify-end">
            <button
              type="button"
              onClick={handleDisconnect}
              className="text-[10px] text-red-500 hover:underline font-bold"
            >
              Verbindung trennen / Bearbeiten
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
