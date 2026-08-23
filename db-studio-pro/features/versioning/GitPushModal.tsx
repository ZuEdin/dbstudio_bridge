
import React, { useState } from 'react';
import { X, GitBranch, UploadCloud, Lock, CheckCircle } from 'lucide-react';
import { cloudService } from '../../services/cloudService';

interface GitPushModalProps {
  onClose: () => void;
  onSuccess: () => void;
  files: any[]; // The generated files to push
}

export const GitPushModal: React.FC<GitPushModalProps> = ({ onClose, onSuccess, files }) => {
  const [repoUrl, setRepoUrl] = useState('');
  const [branch, setBranch] = useState('main');
  const [message, setMessage] = useState('Update generated code');
  const [isPushing, setIsPushing] = useState(false);

  const handlePush = async () => {
      setIsPushing(true);
      try {
          await cloudService.pushToGit('mock-id', files, message);
          onSuccess();
          onClose();
      } catch (e) {
          alert('Push failed');
      }
      setIsPushing(false);
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-[200] flex items-center justify-center animate-in fade-in-25 backdrop-blur-sm">
      <div className="bg-white rounded-lg shadow-2xl w-full max-w-md border border-slate-300 overflow-hidden">
        <div className="p-4 bg-slate-900 text-white flex justify-between items-center">
            <h3 className="font-bold flex items-center gap-2"><GitBranch size={18} className="text-orange-400"/> Push to Git</h3>
            <button onClick={onClose}><X size={18}/></button>
        </div>
        
        <div className="p-6 space-y-4">
            <div className="bg-slate-50 border border-slate-200 p-3 rounded text-sm text-slate-600 mb-4">
                <p>Sie sind dabei, <strong>{files.length} generierte Dateien</strong> in Ihr Repository zu übertragen.</p>
            </div>

            <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Repository URL</label>
                <input 
                    type="text" 
                    className="w-full border border-slate-300 rounded p-2 text-sm"
                    placeholder="https://github.com/user/project.git"
                    value={repoUrl}
                    onChange={e => setRepoUrl(e.target.value)}
                />
            </div>

            <div className="flex gap-4">
                <div className="flex-1">
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Branch</label>
                    <input 
                        type="text" 
                        className="w-full border border-slate-300 rounded p-2 text-sm font-mono"
                        value={branch}
                        onChange={e => setBranch(e.target.value)}
                    />
                </div>
                <div className="flex-1">
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Auth (Token)</label>
                    <div className="relative">
                        <Lock size={14} className="absolute left-2 top-2.5 text-slate-400"/>
                        <input 
                            type="password" 
                            className="w-full border border-slate-300 rounded p-2 pl-8 text-sm"
                            placeholder="ghp_..."
                        />
                    </div>
                </div>
            </div>

            <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Commit Nachricht</label>
                <textarea 
                    className="w-full border border-slate-300 rounded p-2 text-sm h-20"
                    value={message}
                    onChange={e => setMessage(e.target.value)}
                />
            </div>
        </div>

        <div className="p-4 bg-slate-50 border-t flex justify-end gap-2">
            <button onClick={onClose} className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-200 rounded">Abbrechen</button>
            <button 
                onClick={handlePush} 
                disabled={isPushing || !repoUrl}
                className="px-4 py-2 text-sm bg-slate-900 text-white hover:bg-black rounded flex items-center gap-2 disabled:opacity-50"
            >
                {isPushing ? 'Übertrage...' : <><UploadCloud size={16}/> Push Commit</>}
            </button>
        </div>
      </div>
    </div>
  );
};
