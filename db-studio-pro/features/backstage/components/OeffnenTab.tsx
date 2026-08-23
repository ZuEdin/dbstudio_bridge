import React, { useState } from 'react';
import { Project } from '../../../types/index';
import { RecentProjectRow } from './RecentProjectRow';
import { 
  Clock, 
  HardDrive, 
  Upload, 
  Server, 
  FolderOpen,
  Cloud,
  Lock
} from 'lucide-react';
import { useConfigStore } from '../../../stores/useConfigStore';

interface OeffnenTabProps {
  projects: Project[];
  pinnedIds: string[];
  onTogglePin: (id: string) => void;
  onOpenProject: (id: string) => void;
  onDeleteProject: (id: string) => void;
  onDuplicateProject: (project: Project) => void;
  onRenameProject: (id: string, currentName: string) => void;
  onExportProject: (id: string) => void;
  onImportFile: (file: File) => void;
  onToggleScope?: (id: string, newIsCloud: boolean) => void;
}

export const OeffnenTab: React.FC<OeffnenTabProps> = ({
  projects,
  pinnedIds,
  onTogglePin,
  onOpenProject,
  onDeleteProject,
  onDuplicateProject,
  onRenameProject,
  onExportProject,
  onImportFile,
  onToggleScope,
}) => {
  const [subSection, setSubSection] = useState<'recent' | 'indexeddb' | 'cloud' | 'browse' | 'server'>('recent');
  const [isDragging, setIsDragging] = useState(false);
  const { config, updateConfig } = useConfigStore();

  const displayedProjects = React.useMemo(() => {
    if (subSection === 'indexeddb') {
      return projects.filter(p => !p.isCloud);
    }
    if (subSection === 'cloud') {
      return projects.filter(p => Boolean(p.isCloud));
    }
    return projects;
  }, [projects, subSection]);

  const privateCount = projects.filter(p => !p.isCloud).length;
  const cloudCount = projects.filter(p => Boolean(p.isCloud)).length;

  const handleFileDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      onImportFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      onImportFile(e.target.files[0]);
    }
  };

  return (
    <div className="flex-1 flex h-full bg-[#2b2b2b] text-neutral-100 select-none overflow-hidden">
      {/* Sub-Sidebar */}
      <div className="w-60 bg-[#262626] border-r border-[#383838] p-3 space-y-1">
        <h2 className="text-xs font-semibold text-neutral-400 uppercase tracking-wider px-3 py-2">
          Öffnen aus
        </h2>

        <button
          onClick={() => setSubSection('recent')}
          className={`w-full flex items-center justify-between px-3 py-2 rounded-md text-xs font-medium transition-colors ${
            subSection === 'recent'
              ? 'bg-[#333333] text-white border-l-3 border-indigo-500 font-semibold'
              : 'text-neutral-300 hover:bg-[#2e2e2e] hover:text-white'
          }`}
        >
          <div className="flex items-center gap-2.5">
            <Clock size={15} className={subSection === 'recent' ? 'text-indigo-400' : 'text-neutral-400'} />
            <span>Zuletzt verwendet</span>
          </div>
          <span className="text-[10px] text-neutral-400 bg-[#383838] px-1.5 py-0.5 rounded font-mono">
            {projects.length}
          </span>
        </button>

        <button
          onClick={() => setSubSection('indexeddb')}
          className={`w-full flex items-center justify-between px-3 py-2 rounded-md text-xs font-medium transition-colors ${
            subSection === 'indexeddb'
              ? 'bg-[#333333] text-white border-l-3 border-indigo-500 font-semibold'
              : 'text-neutral-300 hover:bg-[#2e2e2e] hover:text-white'
          }`}
        >
          <div className="flex items-center gap-2.5">
            <Lock size={15} className={subSection === 'indexeddb' ? 'text-indigo-400' : 'text-neutral-400'} />
            <span>Privat (IndexedDB)</span>
          </div>
          <span className="text-[10px] text-indigo-300 bg-indigo-950/60 px-1.5 py-0.5 rounded font-mono">
            {privateCount}
          </span>
        </button>

        <button
          onClick={() => setSubSection('cloud')}
          className={`w-full flex items-center justify-between px-3 py-2 rounded-md text-xs font-medium transition-colors ${
            subSection === 'cloud'
              ? 'bg-[#333333] text-white border-l-3 border-sky-500 font-semibold'
              : 'text-neutral-300 hover:bg-[#2e2e2e] hover:text-white'
          }`}
        >
          <div className="flex items-center gap-2.5">
            <Cloud size={15} className={subSection === 'cloud' ? 'text-sky-400' : 'text-neutral-400'} />
            <span>Cloud Workspace</span>
          </div>
          <span className="text-[10px] text-sky-300 bg-sky-950/60 px-1.5 py-0.5 rounded font-mono">
            {cloudCount}
          </span>
        </button>

        <div className="h-px bg-[#383838] my-2" />

        <button
          onClick={() => setSubSection('browse')}
          className={`w-full flex items-center gap-3 px-3 py-2 rounded-md text-xs font-medium transition-colors ${
            subSection === 'browse'
              ? 'bg-[#333333] text-white border-l-3 border-indigo-500 font-semibold'
              : 'text-neutral-300 hover:bg-[#2e2e2e] hover:text-white'
          }`}
        >
          <Upload size={15} className={subSection === 'browse' ? 'text-indigo-400' : 'text-neutral-400'} />
          <span>Durchsuchen & Import</span>
        </button>

        <button
          onClick={() => setSubSection('server')}
          className={`w-full flex items-center gap-3 px-3 py-2 rounded-md text-xs font-medium transition-colors ${
            subSection === 'server'
              ? 'bg-[#333333] text-white border-l-3 border-indigo-500 font-semibold'
              : 'text-neutral-300 hover:bg-[#2e2e2e] hover:text-white'
          }`}
        >
          <Server size={15} className={subSection === 'server' ? 'text-emerald-400' : 'text-neutral-400'} />
          <span>Datenbank-Server</span>
        </button>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col h-full overflow-y-auto px-8 py-6">
        {subSection === 'recent' || subSection === 'indexeddb' || subSection === 'cloud' ? (
          <div>
            <div className="flex items-center justify-between border-b border-[#383838] pb-3 mb-4">
              <div>
                <h1 className="text-xl font-light text-white">
                  {subSection === 'indexeddb' 
                    ? 'Privater IndexedDB Speicher' 
                    : subSection === 'cloud' 
                    ? 'Cloud Workspace Projekte' 
                    : 'Zuletzt geöffnete Datenbanken'}
                </h1>
                <p className="text-xs text-neutral-400 mt-0.5">
                  {subSection === 'indexeddb'
                    ? '100% lokal im Browser gespeicherte und autarke Datenbanken'
                    : subSection === 'cloud'
                    ? 'Zentralisierte Cloud-Projekte für Zusammenarbeit und ortsunabhängigen Zugriff'
                    : 'Alle lokal in IndexedDB und in der Cloud gesicherten DB Studio Projekte'}
                </p>
              </div>
              <span className="text-xs text-neutral-400">
                {displayedProjects.length} Einträge
              </span>
            </div>

            <div className="divide-y divide-[#383838]/60">
              {displayedProjects.length === 0 ? (
                <div className="py-12 text-center text-neutral-400">
                  <p className="text-xs">
                    {subSection === 'indexeddb'
                      ? 'Keine privaten IndexedDB-Datenbanken vorhanden.'
                      : subSection === 'cloud'
                      ? 'Keine Cloud-Projekte vorhanden.'
                      : 'Keine Datenbanken gefunden.'}
                  </p>
                </div>
              ) : (
                displayedProjects.map((p) => (
                  <RecentProjectRow
                    key={p.id}
                    project={p}
                    isPinned={pinnedIds.includes(p.id)}
                    onTogglePin={onTogglePin}
                    onOpen={onOpenProject}
                    onDelete={onDeleteProject}
                    onDuplicate={onDuplicateProject}
                    onRename={onRenameProject}
                    onExport={onExportProject}
                    onToggleScope={onToggleScope}
                  />
                ))
              )}
            </div>
          </div>
        ) : subSection === 'browse' ? (
          <div className="max-w-xl">
            <h1 className="text-xl font-light text-white mb-1">
              Projektdatei importieren & öffnen
            </h1>
            <p className="text-xs text-neutral-400 mb-6">
              Laden Sie eine bestehende .dbsp, JSON oder SQL Schemadatei direkt in Ihre lokale IndexedDB
            </p>

            {/* Drop Zone */}
            <div
              onDragOver={(e) => {
                e.preventDefault();
                setIsDragging(true);
              }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={handleFileDrop}
              className={`border-2 border-dashed rounded-xl p-8 text-center transition-all ${
                isDragging
                  ? 'border-indigo-500 bg-indigo-950/30'
                  : 'border-[#555555] bg-[#333333] hover:border-neutral-400'
              }`}
            >
              <div className="w-12 h-12 rounded-xl bg-indigo-950/40 border border-indigo-500/30 flex items-center justify-center mx-auto mb-3 text-indigo-400">
                <FolderOpen size={24} />
              </div>
              <h3 className="text-sm font-semibold text-white mb-1">
                Datei hierher ziehen oder durchsuchen
              </h3>
              <p className="text-xs text-neutral-400 mb-4">
                Unterstützte Formate: .dbsp (DB Studio Project), .json, .sql
              </p>

              <label className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-md cursor-pointer transition-colors shadow-xs">
                <Upload size={14} />
                <span>Datei auswählen</span>
                <input
                  type="file"
                  accept=".dbsp,.json,.sql,.accdb"
                  onChange={handleFileInput}
                  className="hidden"
                />
              </label>
            </div>
          </div>
        ) : (
          <div className="max-w-xl">
            <h1 className="text-xl font-light text-white mb-1">
              Mit Datenbank-Server verbinden
            </h1>
            <p className="text-xs text-neutral-400 mb-6">
              Verbinden Sie Ihr Frontend direkt mit einem externen Backend-Server
            </p>

            <div className="space-y-4 bg-[#333333] border border-[#444444] rounded-xl p-5">
              <div>
                <label className="block text-xs font-semibold text-neutral-300 mb-1">
                  API-Server URL
                </label>
                <input
                  type="text"
                  value={config.apiUrl || ''}
                  onChange={(e) => updateConfig({ apiUrl: e.target.value })}
                  placeholder="https://api.ihre-domain.de"
                  className="w-full bg-[#3d3d3d] border border-[#555555] focus:border-indigo-500 rounded-md px-3 py-2 text-xs text-white outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-300 mb-1">
                  Speichermodus
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => updateConfig({ storage: 'local' })}
                    className={`p-3 rounded-lg border text-left text-xs transition-colors ${
                      config.storage === 'local'
                        ? 'bg-indigo-950/40 border-indigo-500 text-white'
                        : 'bg-[#383838] border-[#444444] text-neutral-300 hover:bg-[#3d3d3d]'
                    }`}
                  >
                    <div className="font-semibold flex items-center gap-1.5">
                      <HardDrive size={14} className="text-indigo-400" />
                      <span>IndexedDB (Standard)</span>
                    </div>
                    <p className="text-[10px] text-neutral-400 mt-1">
                      100% autark im Browser ohne Serverabhängigkeit
                    </p>
                  </button>

                  <button
                    type="button"
                    onClick={() => updateConfig({ storage: 'server' })}
                    className={`p-3 rounded-lg border text-left text-xs transition-colors ${
                      config.storage === 'server'
                        ? 'bg-indigo-950/40 border-indigo-500 text-white'
                        : 'bg-[#383838] border-[#444444] text-neutral-300 hover:bg-[#3d3d3d]'
                    }`}
                  >
                    <div className="font-semibold flex items-center gap-1.5">
                      <Server size={14} className="text-emerald-400" />
                      <span>Remote Server API</span>
                    </div>
                    <p className="text-[10px] text-neutral-400 mt-1">
                      Zentralisierte Synchronisation mit Backend-Datenbank
                    </p>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
