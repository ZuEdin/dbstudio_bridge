import React, { useState, useMemo } from 'react';
import { Project } from '../../../types/index';
import { AccessDatabaseCard } from './AccessDatabaseCard';
import { RecentProjectRow } from './RecentProjectRow';
import { 
  ChevronDown, 
  ChevronRight, 
  ArrowRight, 
  Search, 
  HelpCircle, 
  X,
  Layers,
  Sparkles,
  LayoutGrid,
  Lock,
  Cloud,
  HardDrive,
  Receipt,
  Users
} from 'lucide-react';
import { useAuthStore } from '../../../stores/useAuthStore';

interface StartseiteTabProps {
  projects: Project[];
  pinnedIds: string[];
  onTogglePin: (id: string) => void;
  onOpenNewModal: () => void;
  onOpenProject: (id: string) => void;
  onDeleteProject: (id: string) => void;
  onDuplicateProject: (project: Project) => void;
  onRenameProject: (id: string, currentName: string) => void;
  onExportProject: (id: string) => void;
  onGoToTemplates: () => void;
  onGoToOpenTab: () => void;
  onToggleScope?: (id: string, newIsCloud: boolean) => void;
  onApplyTemplate?: (templateId: string, templateName: string) => void;
}

export const StartseiteTab: React.FC<StartseiteTabProps> = ({
  projects,
  pinnedIds,
  onTogglePin,
  onOpenNewModal,
  onOpenProject,
  onDeleteProject,
  onDuplicateProject,
  onRenameProject,
  onExportProject,
  onGoToTemplates,
  onGoToOpenTab,
  onToggleScope,
  onApplyTemplate,
}) => {
  const { user } = useAuthStore();
  const [filterTab, setFilterTab] = useState<'all' | 'private' | 'cloud' | 'favorites'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isNeuSectionOpen, setIsNeuSectionOpen] = useState(true);

  // Dynamic German Greeting
  const greeting = useMemo(() => {
    const hour = new Date().getHours();
    if (hour < 11) return 'Guten Morgen';
    if (hour < 18) return 'Guten Tag';
    return 'Guten Abend';
  }, []);

  const privateCount = useMemo(() => projects.filter(p => !p.isCloud).length, [projects]);
  const cloudCount = useMemo(() => projects.filter(p => Boolean(p.isCloud)).length, [projects]);
  const favoriteCount = useMemo(() => projects.filter(p => pinnedIds.includes(p.id)).length, [projects, pinnedIds]);

  // Filter projects based on tab & search
  const filteredProjects = useMemo(() => {
    let list = projects;
    if (filterTab === 'private') {
      list = list.filter((p) => !p.isCloud);
    } else if (filterTab === 'cloud') {
      list = list.filter((p) => Boolean(p.isCloud));
    } else if (filterTab === 'favorites') {
      list = list.filter((p) => pinnedIds.includes(p.id));
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter((p) => p.name.toLowerCase().includes(q));
    }
    return list;
  }, [projects, filterTab, searchQuery, pinnedIds]);

  return (
    <div className="flex-1 flex flex-col h-full bg-[#2b2b2b] text-neutral-100 overflow-y-auto px-10 py-6 select-none">
      {/* Top Bar with Greeting */}
      <div className="flex items-center justify-between pb-4">
        <div>
          <h1 className="text-3xl font-light tracking-tight text-white">
            {greeting}
          </h1>
          <div className="flex items-center gap-3 text-xs text-neutral-400 mt-1">
            <span>DB Studio Arbeitsbereich</span>
            <span>•</span>
            <span className="text-neutral-300 font-medium">{projects.length} Projekte</span>
            <span>(</span>
            <span className="text-indigo-400 font-semibold">{privateCount} Privat / IndexedDB</span>
            <span>•</span>
            <span className="text-sky-400 font-semibold">{cloudCount} Cloud</span>
            <span>)</span>
          </div>
        </div>

        <div className="flex items-center gap-4 text-neutral-400">
          {/* User Profile / Status */}
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#383838] border border-[#484848] text-xs text-neutral-200 shadow-xs">
            <div className="w-5 h-5 rounded-full bg-indigo-600 flex items-center justify-center text-white text-[10px] font-bold">
              {(user?.displayName || user?.name || 'U').charAt(0).toUpperCase()}
            </div>
            <span className="font-medium">{user?.displayName || user?.name || 'Lokaler Benutzer'}</span>
          </div>

          <button className="p-1 hover:text-white transition-colors" title="Hilfe">
            <HelpCircle size={18} />
          </button>
        </div>
      </div>

      {/* Section "Neu" */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-3 border-b border-[#3d3d3d] pb-1.5">
          <button
            onClick={() => setIsNeuSectionOpen(!isNeuSectionOpen)}
            className="flex items-center gap-1.5 text-xs font-semibold text-neutral-300 hover:text-white uppercase tracking-wider"
          >
            {isNeuSectionOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
            <span>Neu</span>
          </button>

          <button
            onClick={onGoToTemplates}
            className="flex items-center gap-1 text-xs text-neutral-300 hover:text-white group transition-colors"
          >
            <span>Weitere Vorlagen</span>
            <ArrowRight size={13} className="group-hover:translate-x-0.5 transition-transform" />
          </button>
        </div>

        {isNeuSectionOpen && (
          <div className="flex items-center gap-4 pt-1 overflow-x-auto pb-2">
            {/* Blank Database Card */}
            <AccessDatabaseCard
              title="Leere Datenbank"
              subtitle="IndexedDB / Cloud"
              onClick={onOpenNewModal}
            />

            {/* Fakturierung & WaWi Suite Quick Card */}
            <button
              onClick={() => onApplyTemplate ? onApplyTemplate('fakturierung_suite', 'Fakturierung & WaWi Suite') : onGoToTemplates()}
              className="group relative flex flex-col items-center justify-center w-36 h-40 bg-[#333333] hover:bg-[#3d3d3d] border border-emerald-500/40 hover:border-emerald-400 rounded-lg transition-all p-3 text-center cursor-pointer shadow-xs"
            >
              <div className="w-12 h-12 bg-emerald-950/40 border border-emerald-500/30 rounded-xl flex items-center justify-center mb-2 group-hover:scale-105 group-hover:bg-emerald-900/60 transition-all text-emerald-400">
                <Receipt size={22} />
              </div>
              <span className="text-xs font-semibold text-neutral-100 group-hover:text-emerald-300 leading-tight">
                Fakturierung & WaWi
              </span>
              <span className="text-[10px] text-emerald-400/90 mt-1 font-medium bg-emerald-950/60 px-1.5 py-0.5 rounded border border-emerald-500/30">
                Empfohlen
              </span>
            </button>

            {/* Kundenverwaltung & CRM Quick Card */}
            <button
              onClick={() => onApplyTemplate ? onApplyTemplate('crm_suite', 'Kundenverwaltung & CRM Suite') : onGoToTemplates()}
              className="group relative flex flex-col items-center justify-center w-36 h-40 bg-[#333333] hover:bg-[#3d3d3d] border border-blue-500/40 hover:border-blue-400 rounded-lg transition-all p-3 text-center cursor-pointer shadow-xs"
            >
              <div className="w-12 h-12 bg-blue-950/40 border border-blue-500/30 rounded-xl flex items-center justify-center mb-2 group-hover:scale-105 group-hover:bg-blue-900/60 transition-all text-blue-400">
                <Users size={22} />
              </div>
              <span className="text-xs font-semibold text-neutral-100 group-hover:text-blue-300 leading-tight">
                Kunden & CRM
              </span>
              <span className="text-[10px] text-blue-400/90 mt-1 font-medium bg-blue-950/60 px-1.5 py-0.5 rounded border border-blue-500/30">
                Beliebt
              </span>
            </button>

            {/* Quick Access to Common Templates */}
            <button
              onClick={onGoToTemplates}
              className="group relative flex flex-col items-center justify-center w-36 h-40 bg-[#333333] hover:bg-[#3d3d3d] border border-[#444444] hover:border-indigo-500/50 rounded-lg transition-all p-3 text-center cursor-pointer shadow-xs"
            >
              <div className="w-12 h-12 bg-indigo-950/30 border border-indigo-500/20 rounded-xl flex items-center justify-center mb-2 group-hover:scale-105 group-hover:bg-indigo-950/60 transition-all text-indigo-400">
                <LayoutGrid size={22} />
              </div>
              <span className="text-xs font-semibold text-neutral-200 group-hover:text-white leading-tight">
                Vorlagen-Katalog
              </span>
              <span className="text-[10px] text-neutral-400 mt-1">
                Alle Schemas
              </span>
            </button>
          </div>
        )}
      </div>

      {/* Filter Tabs & Search Bar */}
      <div className="flex items-center justify-between border-b border-[#3d3d3d] pb-2 mb-3">
        {/* Pill Buttons: Alle | Privat (IndexedDB) | Cloud | Favoriten */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setFilterTab('all')}
            className={`px-3 py-1 rounded-full text-xs font-medium transition-all ${
              filterTab === 'all'
                ? 'bg-neutral-100 text-neutral-900 font-bold shadow-xs'
                : 'bg-[#383838] text-neutral-300 hover:bg-[#444444] hover:text-white'
            }`}
          >
            Alle ({projects.length})
          </button>

          <button
            onClick={() => setFilterTab('private')}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium transition-all ${
              filterTab === 'private'
                ? 'bg-indigo-600 text-white font-bold shadow-xs'
                : 'bg-[#383838] text-neutral-300 hover:bg-[#444444] hover:text-white'
            }`}
          >
            <Lock size={12} className={filterTab === 'private' ? 'text-indigo-200' : 'text-indigo-400'} />
            <span>Privat / IndexedDB ({privateCount})</span>
          </button>

          <button
            onClick={() => setFilterTab('cloud')}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium transition-all ${
              filterTab === 'cloud'
                ? 'bg-sky-600 text-white font-bold shadow-xs'
                : 'bg-[#383838] text-neutral-300 hover:bg-[#444444] hover:text-white'
            }`}
          >
            <Cloud size={12} className={filterTab === 'cloud' ? 'text-sky-200' : 'text-sky-400'} />
            <span>Cloud ({cloudCount})</span>
          </button>

          <button
            onClick={() => setFilterTab('favorites')}
            className={`px-3 py-1 rounded-full text-xs font-medium transition-all ${
              filterTab === 'favorites'
                ? 'bg-amber-600 text-white font-bold shadow-xs'
                : 'bg-[#383838] text-neutral-300 hover:bg-[#444444] hover:text-white'
            }`}
          >
            Favoriten ({favoriteCount})
          </button>
        </div>

        {/* Search input */}
        <div className="relative flex items-center w-64">
          <Search size={14} className="absolute left-3 text-neutral-400 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Suchen nach Name..."
            className="w-full bg-[#3d3d3d] hover:bg-[#454545] focus:bg-[#484848] border border-[#555555] focus:border-indigo-500 rounded-md pl-9 pr-3 py-1.5 text-xs text-white placeholder-neutral-400 outline-none transition-colors"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 text-neutral-400 hover:text-white"
            >
              <X size={13} />
            </button>
          )}
        </div>
      </div>

      {/* Projects List Header */}
      <div className="flex items-center justify-between text-[11px] font-semibold text-neutral-400 px-3 py-1 border-b border-[#383838]">
        <span>Projekt & Bereich</span>
        <span className="pr-12">Änderungsdatum</span>
      </div>

      {/* Projects List */}
      <div className="flex-1 divide-y divide-[#383838]/40 overflow-y-auto">
        {filteredProjects.length === 0 ? (
          <div className="py-12 text-center text-neutral-400">
            <p className="text-sm font-medium">
              {filterTab === 'favorites'
                ? 'Keine Favoriten vorhanden. Heften Sie Projekte mit dem Pin-Symbol an.'
                : filterTab === 'private'
                ? 'Keine privaten IndexedDB-Datenbanken gefunden.'
                : filterTab === 'cloud'
                ? 'Keine Cloud-Datenbanken gefunden.'
                : 'Keine Datenbanken gefunden.'}
            </p>
            <button
              onClick={onOpenNewModal}
              className="mt-3 inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-md shadow-xs transition-colors"
            >
              Neue Datenbank erstellen
            </button>
          </div>
        ) : (
          filteredProjects.map((proj) => (
            <RecentProjectRow
              key={proj.id}
              project={proj}
              isPinned={pinnedIds.includes(proj.id)}
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

      {/* Bottom Link to "Öffnen" */}
      <div className="pt-4 mt-auto border-t border-[#3d3d3d] flex justify-end">
        <button
          onClick={onGoToOpenTab}
          className="flex items-center gap-1.5 text-xs text-neutral-300 hover:text-white group transition-colors"
        >
          <span>Weitere Projekte durchsuchen</span>
          <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
        </button>
      </div>
    </div>
  );
};
