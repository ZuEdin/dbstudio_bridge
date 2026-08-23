import React from 'react';
import { FolderOpen, Clock, Users, Edit2, Copy, Trash2, Cloud } from 'lucide-react';
import { Project } from '../../../../types/index';

interface ProjectListProps {
  projects: Project[];
  activeSource: 'local' | 'cloud';
  user: any;
  onSelectProject: (project: Project) => void;
  onManageMembers: (project: Project) => void;
  onRenameClick: (e: React.MouseEvent, project: Project) => void;
  onCopyClick: (e: React.MouseEvent, project: Project) => void;
  onDeleteClick: (e: React.MouseEvent, id: string) => void;
  t: any;
}

export const ProjectList: React.FC<ProjectListProps> = ({
  projects,
  activeSource,
  user,
  onSelectProject,
  onManageMembers,
  onRenameClick,
  onCopyClick,
  onDeleteClick,
  t
}) => {
  return (
    <div className="flex-1 overflow-y-auto pr-2 space-y-3">
      {projects.length === 0 ? (
        <div className="text-center py-20 text-slate-400 border-2 border-dashed border-slate-100 rounded-xl">
          <FolderOpen size={48} className="mx-auto mb-2 opacity-20" />
          <p>{t('start.no_projects')}</p>
        </div>
      ) : (
        projects.map(p => (
          <div 
            key={p.id} 
            onClick={() => onSelectProject(p)}
            className="group relative p-3 rounded-lg border border-slate-200 hover:border-blue-400 hover:shadow-md transition-all cursor-pointer bg-slate-50 hover:bg-white"
          >
            <div className="flex justify-between items-start">
              <div className="min-w-0 flex-1">
                <h3 className="font-bold text-slate-800 text-sm group-hover:text-blue-600 flex items-center gap-2 truncate">
                  {p.name}
                  {p.isCloud && <Cloud size={12} className="text-blue-400 shrink-0" />}
                </h3>
                <div className="text-[10px] text-slate-500 mt-1 flex flex-wrap items-center gap-x-3 gap-y-1">
                  <span className="bg-slate-200 px-1.5 py-0.5 rounded text-slate-600 font-mono shrink-0">
                    {p.data?.backendConfig?.dbType || 'SQL'} / {p.data?.backendConfig?.language || '.NET 10'}
                  </span>
                  <span className="flex items-center gap-1 shrink-0"><Clock size={10}/> {new Date(p.lastModified || Date.now()).toLocaleDateString()}</span>
                  {p.owner && <span className="flex items-center gap-1 text-blue-500 shrink-0 truncate max-w-[120px]"><Users size={10}/> {p.owner}</span>}
                </div>
              </div>
              <div className="flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity shrink-0 ml-2">
                {p.isCloud && (user?.role === 'admin' || user?.role === 'manager') && (
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      onManageMembers(p);
                    }}
                    className="text-slate-400 hover:text-emerald-500 p-1.5 rounded-full hover:bg-emerald-50 transition-colors"
                    title="Mitglieder verwalten"
                  >
                    <Users size={13} />
                  </button>
                )}
                <button 
                  onClick={(e) => onRenameClick(e, p)}
                  className="text-slate-400 hover:text-blue-500 p-1.5 rounded-full hover:bg-blue-50 transition-colors"
                  title="Projekt umbenennen"
                >
                  <Edit2 size={13} />
                </button>
                <button 
                  onClick={(e) => onCopyClick(e, p)}
                  className="text-slate-400 hover:text-indigo-500 p-1.5 rounded-full hover:bg-indigo-50 transition-colors"
                  title="Projekt kopieren"
                >
                  <Copy size={13} />
                </button>
                <button 
                  onClick={(e) => onDeleteClick(e, p.id)}
                  className="text-slate-400 hover:text-red-500 p-1.5 rounded-full hover:bg-red-50 transition-colors"
                  title="Projekt löschen"
                >
                  <Trash2 size={13} />
                </button>
              </div>
            </div>
          </div>
        ))
      )}
    </div>
  );
};
