import React, { useState } from 'react';
import { Project } from '../../../types/index';
import { Pin, MoreVertical, FolderOpen, Copy, Edit2, Download, Trash2, Cloud, Lock, HardDrive, RefreshCw } from 'lucide-react';

interface RecentProjectRowProps {
  project: Project;
  isPinned: boolean;
  onTogglePin: (id: string) => void;
  onOpen: (id: string) => void;
  onDelete: (id: string) => void;
  onDuplicate: (project: Project) => void;
  onRename: (id: string, currentName: string) => void;
  onExport: (id: string) => void;
  onToggleScope?: (id: string, newIsCloud: boolean) => void;
}

export const RecentProjectRow: React.FC<RecentProjectRowProps> = ({
  project,
  isPinned,
  onTogglePin,
  onOpen,
  onDelete,
  onDuplicate,
  onRename,
  onExport,
  onToggleScope,
}) => {
  const [menuOpen, setMenuOpen] = useState(false);

  // Format date in German standard
  const formatDate = (timestamp: number) => {
    if (!timestamp) return 'Unbekannt';
    const date = new Date(timestamp);
    const now = new Date();
    const isToday = date.toDateString() === now.toDateString();
    
    if (isToday) {
      return `Heute, ${date.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })}`;
    }
    
    const isThisYear = date.getFullYear() === now.getFullYear();
    if (isThisYear) {
      return date.toLocaleDateString('de-DE', { day: 'numeric', month: 'long' });
    }
    
    return date.toLocaleDateString('de-DE', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  const displayName = project.name.replace(/\.(accdb|dbsp|json)$/i, '');
  const isCloudProject = Boolean(project.isCloud);
  const dbEngine = project.data?.backendConfig?.dbType || 'IndexedDB';

  return (
    <div className="group relative flex items-center justify-between py-2.5 px-3 hover:bg-[#383838] rounded-lg transition-colors duration-100 cursor-pointer border-b border-[#383838]/60">
      {/* Left side: Modern Studio Badge + Names */}
      <div 
        onClick={() => onOpen(project.id)}
        className="flex items-center gap-3.5 flex-1 min-w-0 pr-4"
      >
        {/* Dynamic Icon based on Cloud vs. Private */}
        <div 
          className={`relative w-9 h-9 rounded-lg flex items-center justify-center font-semibold text-xs shadow-xs shrink-0 border transition-all ${
            isCloudProject
              ? 'bg-sky-950/60 border-sky-500/40 text-sky-400 group-hover:border-sky-400 group-hover:bg-sky-950/80 group-hover:text-sky-300'
              : 'bg-indigo-950/60 border-indigo-500/40 text-indigo-400 group-hover:border-indigo-400 group-hover:bg-indigo-950/80 group-hover:text-indigo-300'
          }`}
          title={isCloudProject ? 'Cloud Workspace Projekt' : 'Privates IndexedDB Projekt'}
        >
          {isCloudProject ? <Cloud size={18} /> : <Lock size={16} />}
        </div>

        <div className="flex flex-col min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-semibold text-neutral-100 group-hover:text-white truncate">
              {displayName}
            </span>

            {/* Prominent Clear Scope Badge */}
            {isCloudProject ? (
              <span className="inline-flex items-center gap-1 text-[10px] font-bold text-sky-300 bg-sky-950/80 border border-sky-500/40 px-2 py-0.5 rounded-full shadow-xs">
                <Cloud size={10} className="text-sky-400" />
                <span>CLOUD</span>
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 text-[10px] font-bold text-indigo-300 bg-indigo-950/80 border border-indigo-500/40 px-2 py-0.5 rounded-full shadow-xs">
                <Lock size={10} className="text-indigo-400" />
                <span>PRIVAT (INDEXEDDB)</span>
              </span>
            )}
          </div>

          <div className="flex items-center gap-2 text-[11px] text-neutral-400 mt-0.5">
            <span className="truncate">
              {isCloudProject ? 'Cloud Workspace • Geteilter Speicher' : 'Lokaler Browser-Speicher • 100% autark'}
            </span>
            <span className="text-neutral-600">•</span>
            <span className="text-[10px] text-neutral-300 bg-[#282828] border border-[#484848] px-1.5 py-0.2 rounded font-mono">
              {dbEngine}
            </span>
          </div>
        </div>
      </div>

      {/* Right side: Date + Pin Button + Context Actions */}
      <div className="flex items-center gap-4 shrink-0">
        <span 
          onClick={() => onOpen(project.id)}
          className="text-xs text-neutral-400 group-hover:text-neutral-300 min-w-[90px] text-right"
        >
          {formatDate(project.lastModified)}
        </span>

        {/* Favorite Pin */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onTogglePin(project.id);
          }}
          className={`p-1.5 rounded hover:bg-neutral-600/60 transition-colors ${
            isPinned 
              ? 'text-amber-400 opacity-100' 
              : 'text-neutral-400 opacity-0 group-hover:opacity-100 hover:text-white'
          }`}
          title={isPinned ? 'Von Favoriten entfernen' : 'An Favoriten anheften'}
        >
          <Pin size={15} className={isPinned ? 'fill-amber-400 rotate-45' : ''} />
        </button>

        {/* Three dots menu */}
        <div className="relative">
          <button
            onClick={(e) => {
              e.stopPropagation();
              setMenuOpen(!menuOpen);
            }}
            className="p-1.5 rounded text-neutral-400 hover:text-white hover:bg-neutral-600/60 opacity-0 group-hover:opacity-100 transition-all"
            title="Optionen"
          >
            <MoreVertical size={15} />
          </button>

          {menuOpen && (
            <>
              <div 
                className="fixed inset-0 z-40" 
                onClick={(e) => {
                  e.stopPropagation();
                  setMenuOpen(false);
                }} 
              />
              <div className="absolute right-0 top-full mt-1 w-52 bg-[#2d2d2d] border border-[#555555] rounded-md shadow-xl py-1 z-50 text-xs text-neutral-200 animate-in fade-in zoom-in-95 duration-100">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setMenuOpen(false);
                    onOpen(project.id);
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 hover:bg-[#3d3d3d] text-left text-neutral-200 hover:text-white"
                >
                  <FolderOpen size={14} className="text-indigo-400" />
                  <span>Projekt öffnen</span>
                </button>

                {onToggleScope && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setMenuOpen(false);
                      onToggleScope(project.id, !isCloudProject);
                    }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 hover:bg-[#3d3d3d] text-left text-neutral-200 hover:text-white"
                  >
                    {isCloudProject ? (
                      <>
                        <Lock size={14} className="text-indigo-400" />
                        <span>Als Privat (IndexedDB) festlegen</span>
                      </>
                    ) : (
                      <>
                        <Cloud size={14} className="text-sky-400" />
                        <span>Als Cloud-Projekt festlegen</span>
                      </>
                    )}
                  </button>
                )}

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setMenuOpen(false);
                    onRename(project.id, project.name);
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 hover:bg-[#3d3d3d] text-left text-neutral-200 hover:text-white"
                >
                  <Edit2 size={14} className="text-neutral-400" />
                  <span>Umbenennen</span>
                </button>

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setMenuOpen(false);
                    onDuplicate(project);
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 hover:bg-[#3d3d3d] text-left text-neutral-200 hover:text-white"
                >
                  <Copy size={14} className="text-neutral-400" />
                  <span>Duplizieren</span>
                </button>

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setMenuOpen(false);
                    onExport(project.id);
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 hover:bg-[#3d3d3d] text-left text-neutral-200 hover:text-white"
                >
                  <Download size={14} className="text-neutral-400" />
                  <span>Projektdatei exportieren (.dbsp)</span>
                </button>

                <div className="h-px bg-[#444444] my-1" />

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setMenuOpen(false);
                    onDelete(project.id);
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 hover:bg-red-950/60 text-left text-red-400 hover:text-red-300"
                >
                  <Trash2 size={14} />
                  <span>Löschen</span>
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
