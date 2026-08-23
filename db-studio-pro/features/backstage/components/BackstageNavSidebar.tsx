import React from 'react';
import { 
  ArrowLeft, 
  Home, 
  FilePlus, 
  FolderOpen, 
  Info, 
  Save, 
  Share2, 
  Printer, 
  XSquare, 
  UserCircle2, 
  Sliders, 
  Layers,
  Sparkles
} from 'lucide-react';

export type BackstageTabType = 
  | 'startseite' 
  | 'neu' 
  | 'oeffnen' 
  | 'info' 
  | 'ueber_db_studio'
  | 'speichern' 
  | 'speichern_unter' 
  | 'drucken' 
  | 'konto' 
  | 'optionen';

interface BackstageNavSidebarProps {
  activeTab: BackstageTabType;
  onSelectTab: (tab: BackstageTabType) => void;
  hasActiveProject: boolean;
  onBackToProject?: () => void;
  onSaveProject?: () => void;
  onCloseProject?: () => void;
}

export const BackstageNavSidebar: React.FC<BackstageNavSidebarProps> = ({
  activeTab,
  onSelectTab,
  hasActiveProject,
  onBackToProject,
  onSaveProject,
  onCloseProject,
}) => {
  return (
    <div className="w-56 bg-[#232323] border-r border-[#383838] flex flex-col justify-between shrink-0 select-none py-2 text-neutral-300">
      {/* Top Part: Back button + Studio Logo + Main Navigation */}
      <div className="space-y-1">
        {/* Back Arrow button */}
        {hasActiveProject && onBackToProject && (
          <div className="px-3 py-1 mb-2">
            <button
              onClick={onBackToProject}
              className="group flex items-center justify-center w-9 h-9 rounded-lg bg-[#333333] hover:bg-indigo-600 border border-[#484848] hover:border-indigo-500 text-white transition-all shadow-xs"
              title="Zurück zur Datenbank (Esc)"
            >
              <ArrowLeft size={18} className="group-hover:-translate-x-0.5 transition-transform" />
            </button>
          </div>
        )}

        {/* DB Studio Title & Icon */}
        <div className="px-4 py-2 flex items-center gap-2.5 mb-2">
          <div className="w-7 h-7 rounded-lg bg-indigo-600 flex items-center justify-center text-white font-bold text-xs shadow-xs border border-indigo-400/40">
            <Layers size={15} />
          </div>
          <span className="font-semibold text-sm text-neutral-100 tracking-wide">
            DB Studio
          </span>
        </div>

        {/* Navigation list */}
        <div className="space-y-0.5 px-2">
          <button
            onClick={() => onSelectTab('startseite')}
            className={`w-full flex items-center gap-3 px-3 py-2 rounded-md text-xs font-medium transition-colors ${
              activeTab === 'startseite'
                ? 'bg-[#333333] text-white border-l-3 border-indigo-500 font-semibold'
                : 'hover:bg-[#2c2c2c] hover:text-white text-neutral-300'
            }`}
          >
            <Home size={16} className={activeTab === 'startseite' ? 'text-indigo-400' : 'text-neutral-400'} />
            <span>Startseite</span>
          </button>

          <button
            onClick={() => onSelectTab('neu')}
            className={`w-full flex items-center gap-3 px-3 py-2 rounded-md text-xs font-medium transition-colors ${
              activeTab === 'neu'
                ? 'bg-[#333333] text-white border-l-3 border-indigo-500 font-semibold'
                : 'hover:bg-[#2c2c2c] hover:text-white text-neutral-300'
            }`}
          >
            <FilePlus size={16} className={activeTab === 'neu' ? 'text-indigo-400' : 'text-neutral-400'} />
            <span>Neu</span>
          </button>

          <button
            onClick={() => onSelectTab('oeffnen')}
            className={`w-full flex items-center gap-3 px-3 py-2 rounded-md text-xs font-medium transition-colors ${
              activeTab === 'oeffnen'
                ? 'bg-[#333333] text-white border-l-3 border-indigo-500 font-semibold'
                : 'hover:bg-[#2c2c2c] hover:text-white text-neutral-300'
            }`}
          >
            <FolderOpen size={16} className={activeTab === 'oeffnen' ? 'text-indigo-400' : 'text-neutral-400'} />
            <span>Öffnen</span>
          </button>

          <button
            onClick={() => onSelectTab('ueber_db_studio')}
            className={`w-full flex items-center gap-3 px-3 py-2 rounded-md text-xs font-medium transition-colors ${
              activeTab === 'ueber_db_studio'
                ? 'bg-[#333333] text-white border-l-3 border-indigo-500 font-semibold'
                : 'hover:bg-[#2c2c2c] hover:text-white text-neutral-300'
            }`}
          >
            <Sparkles size={16} className={activeTab === 'ueber_db_studio' ? 'text-indigo-400' : 'text-neutral-400'} />
            <span>Über DB Studio</span>
          </button>

          {/* Project Specific Actions */}
          {hasActiveProject && (
            <>
              <div className="h-px bg-[#383838] my-2 mx-1" />

              <button
                onClick={() => onSelectTab('info')}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-md text-xs font-medium transition-colors ${
                  activeTab === 'info'
                    ? 'bg-[#333333] text-white border-l-3 border-indigo-500 font-semibold'
                    : 'hover:bg-[#2c2c2c] hover:text-white text-neutral-300'
                }`}
              >
                <Info size={16} className={activeTab === 'info' ? 'text-indigo-400' : 'text-neutral-400'} />
                <span>Informationen</span>
              </button>

              <button
                onClick={() => {
                  if (onSaveProject) onSaveProject();
                }}
                className="w-full flex items-center gap-3 px-3 py-2 rounded-md text-xs font-medium text-neutral-300 hover:bg-[#2c2c2c] hover:text-white transition-colors"
              >
                <Save size={16} className="text-neutral-400" />
                <span>Speichern</span>
              </button>

              <button
                onClick={() => onSelectTab('speichern_unter')}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-md text-xs font-medium transition-colors ${
                  activeTab === 'speichern_unter'
                    ? 'bg-[#333333] text-white border-l-3 border-indigo-500 font-semibold'
                    : 'hover:bg-[#2c2c2c] hover:text-white text-neutral-300'
                }`}
              >
                <Share2 size={16} className={activeTab === 'speichern_unter' ? 'text-indigo-400' : 'text-neutral-400'} />
                <span>Speichern unter</span>
              </button>

              <button
                onClick={() => onSelectTab('drucken')}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-md text-xs font-medium transition-colors ${
                  activeTab === 'drucken'
                    ? 'bg-[#333333] text-white border-l-3 border-indigo-500 font-semibold'
                    : 'hover:bg-[#2c2c2c] hover:text-white text-neutral-300'
                }`}
              >
                <Printer size={16} className={activeTab === 'drucken' ? 'text-indigo-400' : 'text-neutral-400'} />
                <span>Drucken & Export</span>
              </button>

              <button
                onClick={() => {
                  if (onCloseProject) onCloseProject();
                }}
                className="w-full flex items-center gap-3 px-3 py-2 rounded-md text-xs font-medium text-red-400 hover:bg-red-950/40 hover:text-red-300 transition-colors"
              >
                <XSquare size={16} />
                <span>Schließen</span>
              </button>
            </>
          )}
        </div>
      </div>

      {/* Bottom Part: Konto, Optionen */}
      <div className="space-y-0.5 px-2 border-t border-[#383838] pt-2">
        <button
          onClick={() => onSelectTab('konto')}
          className={`w-full flex items-center gap-3 px-3 py-2 rounded-md text-xs font-medium transition-colors ${
            activeTab === 'konto'
              ? 'bg-[#333333] text-white border-l-3 border-indigo-500 font-semibold'
              : 'hover:bg-[#2c2c2c] hover:text-white text-neutral-300'
          }`}
        >
          <UserCircle2 size={16} className={activeTab === 'konto' ? 'text-indigo-400' : 'text-neutral-400'} />
          <span>Konto</span>
        </button>

        <button
          onClick={() => onSelectTab('optionen')}
          className={`w-full flex items-center gap-3 px-3 py-2 rounded-md text-xs font-medium transition-colors ${
            activeTab === 'optionen'
              ? 'bg-[#333333] text-white border-l-3 border-indigo-500 font-semibold'
              : 'hover:bg-[#2c2c2c] hover:text-white text-neutral-300'
          }`}
        >
          <Sliders size={16} className={activeTab === 'optionen' ? 'text-indigo-400' : 'text-neutral-400'} />
          <span>Optionen</span>
        </button>
      </div>
    </div>
  );
};
