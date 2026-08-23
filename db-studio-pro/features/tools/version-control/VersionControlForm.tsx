import React from 'react';
import { Plus } from 'lucide-react';

interface VersionControlFormProps {
  commitMessage: string;
  setCommitMessage: (msg: string) => void;
  commitAuthor: string;
  setCommitAuthor: (author: string) => void;
  tablesCount: number;
  relationshipsCount: number;
  handleCreateCommit: (e: React.FormEvent) => void;
}

export const VersionControlForm: React.FC<VersionControlFormProps> = ({
  commitMessage,
  setCommitMessage,
  commitAuthor,
  setCommitAuthor,
  tablesCount,
  relationshipsCount,
  handleCreateCommit,
}) => {
  return (
    <div className="p-4 bg-slate-50 dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-800">
      <form onSubmit={handleCreateCommit} className="space-y-3">
        <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Neuen Schema-Commit erstellen</h3>
        
        <div className="grid grid-cols-3 gap-2">
          <div className="col-span-2">
            <input
              type="text"
              value={commitMessage}
              onChange={(e) => setCommitMessage(e.target.value)}
              placeholder="z.B. Feature: Tabelle 'Customers' hinzugefügt"
              className="w-full px-3 py-1.5 text-xs bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded focus:outline-none focus:border-amber-500 dark:text-white"
              required
            />
          </div>
          <div>
            <select
              value={commitAuthor}
              onChange={(e) => setCommitAuthor(e.target.value)}
              className="w-full px-2 py-1.5 text-xs bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded focus:outline-none focus:border-amber-500 dark:text-white"
            >
              <option value="Me">Ich (Entwickler)</option>
              <option value="Sarah Lee">Sarah Lee (Lead)</option>
              <option value="Tom H.">Tom H. (Backend)</option>
            </select>
          </div>
        </div>

        <div className="flex justify-between items-center">
          <p className="text-[10px] text-slate-400">
            Übernimmt {tablesCount} Tabellen und {relationshipsCount} Beziehungen.
          </p>
          <button
            type="submit"
            disabled={!commitMessage.trim()}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-500 hover:bg-amber-600 disabled:bg-slate-300 disabled:dark:bg-slate-800 text-white text-xs font-bold rounded shadow transition-all"
          >
            <Plus size={14} />
            <span>Schema committen</span>
          </button>
        </div>
      </form>
    </div>
  );
};
