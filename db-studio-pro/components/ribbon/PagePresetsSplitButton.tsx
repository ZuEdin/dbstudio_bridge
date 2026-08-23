import React, { useState, useRef, useEffect } from 'react';
import { 
  FolderPlus, ChevronDown, Sparkles, LayoutTemplate, 
  Layers, Search, Check, FileText, ArrowRight, Grid, DollarSign, Users, Database
} from 'lucide-react';
import { PAGE_PRESETS, PagePreset } from '../../features/pages/components/templates/pagePresets';
import { PageComponent } from '../../types/index';

interface PagePresetsSplitButtonProps {
  label?: string;
  onApplyPreset: (preset: PagePreset) => void;
  onOpenModal: () => void;
  onClearLayout?: () => void;
  disabled?: boolean;
}

export const PagePresetsSplitButton: React.FC<PagePresetsSplitButtonProps> = ({
  label = 'Vorlagen & Presets',
  onApplyPreset,
  onOpenModal,
  onClearLayout,
  disabled = false
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  const categories = [
    { id: 'all', label: 'Alle' },
    { id: 'master_detail', label: 'Master-Detail' },
    { id: 'dashboard', label: 'Dashboard' },
    { id: 'crm', label: 'CRM & Kunde' },
    { id: 'forms', label: 'Formulare' }
  ];

  const filteredPresets = PAGE_PRESETS.filter(p => {
    const matchesCat = selectedCategory === 'all' || p.category === selectedCategory;
    const matchesSearch = 
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.description.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCat && matchesSearch;
  });

  const getCategoryBadgeClass = (category: string) => {
    switch (category) {
      case 'master_detail': return 'bg-indigo-100 text-indigo-800 border-indigo-200';
      case 'dashboard': return 'bg-amber-100 text-amber-800 border-amber-200';
      case 'crm': return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      default: return 'bg-purple-100 text-purple-800 border-purple-200';
    }
  };

  return (
    <div className="relative inline-flex" ref={containerRef}>
      <div className={`flex flex-col items-center justify-between border rounded transition-colors ${
        isOpen 
          ? 'bg-indigo-100 dark:bg-indigo-950/60 border-indigo-300 dark:border-indigo-800' 
          : 'border-transparent hover:bg-slate-100 dark:hover:bg-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
      }`}>
        
        {/* Main top button (Quick Open Presets Modal or Dropdown) */}
        <button
          type="button"
          onClick={() => {
            if (!disabled) setIsOpen(prev => !prev);
          }}
          disabled={disabled}
          title="Vorlagen & Presets öffnen"
          className="flex flex-col items-center justify-center pt-1.5 px-3 pb-0.5 w-24 text-slate-700 dark:text-slate-200 hover:text-indigo-900 dark:hover:text-white transition-colors"
        >
          <div className="scale-125 mb-1 text-indigo-600 dark:text-indigo-400">
            <FolderPlus size={20} />
          </div>
          <span className="text-xs font-semibold leading-tight text-center">
            {label}
          </span>
        </button>

        {/* Dropdown toggle bar */}
        <button
          type="button"
          onClick={() => {
            if (!disabled) setIsOpen(prev => !prev);
          }}
          disabled={disabled}
          title="Vorlagen-Liste aufklappen"
          className="w-full flex items-center justify-center py-0.5 border-t border-slate-200 dark:border-slate-700 hover:bg-indigo-200 dark:hover:bg-indigo-900/50 transition-colors"
        >
          <ChevronDown size={12} className={`text-slate-600 dark:text-slate-300 transition-transform ${isOpen ? 'rotate-180 text-indigo-600' : ''}`} />
        </button>
      </div>

      {/* Rich Dropdown Panel */}
      {isOpen && (
        <div className="absolute top-full left-0 mt-1.5 w-96 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl shadow-2xl z-[100] overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-100">
          
          {/* Header */}
          <div className="p-3 bg-gradient-to-r from-indigo-900 to-slate-900 text-white flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles size={16} className="text-indigo-300" />
              <span className="font-bold text-xs">Seiten-Vorlagen & Layout Presets</span>
            </div>
            <button
              onClick={onOpenModal}
              className="text-[10px] bg-white/10 hover:bg-white/20 px-2 py-0.5 rounded text-indigo-200 hover:text-white transition font-medium flex items-center gap-1"
            >
              Katalog <ArrowRight size={10} />
            </button>
          </div>

          {/* Search bar */}
          <div className="p-2.5 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/40">
            <div className="relative">
              <Search size={13} className="absolute left-2.5 top-2 text-slate-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Vorlage nach Name oder Funktion suchen..."
                className="w-full pl-7 pr-2.5 py-1 text-xs bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg focus:outline-none focus:border-indigo-500 text-slate-800 dark:text-slate-200"
                autoFocus
              />
            </div>

            {/* Category Pills */}
            <div className="flex items-center gap-1 mt-2 overflow-x-auto pb-0.5">
              {categories.map(cat => (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`px-2 py-0.5 rounded-full text-[10px] font-semibold whitespace-nowrap transition ${
                    selectedCategory === cat.id
                      ? 'bg-indigo-600 text-white'
                      : 'bg-slate-200/80 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-300'
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>
          </div>

          {/* Preset list */}
          <div className="max-h-72 overflow-y-auto p-2 space-y-1.5 divide-y divide-slate-100 dark:divide-slate-800">
            {filteredPresets.length > 0 ? (
              filteredPresets.map(preset => (
                <div
                  key={preset.id}
                  onClick={() => {
                    onApplyPreset(preset);
                    setIsOpen(false);
                  }}
                  className="p-2.5 rounded-lg hover:bg-indigo-50 dark:hover:bg-indigo-950/40 cursor-pointer transition flex items-start justify-between group border border-transparent hover:border-indigo-200 dark:hover:border-indigo-800/60"
                >
                  <div className="flex-1 pr-2">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="font-bold text-xs text-slate-900 dark:text-slate-100 group-hover:text-indigo-600 dark:group-hover:text-indigo-400">
                        {preset.name}
                      </span>
                      <span className={`text-[9px] font-bold px-1.5 py-0.2 rounded border ${getCategoryBadgeClass(preset.category)}`}>
                        {preset.category}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed">
                      {preset.description}
                    </p>
                  </div>
                  <div className="p-1 rounded bg-indigo-100 dark:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300 opacity-0 group-hover:opacity-100 transition shrink-0 mt-1">
                    <Check size={13} />
                  </div>
                </div>
              ))
            ) : (
              <div className="p-4 text-center text-xs text-slate-400">
                Keine Vorlagen gefunden.
              </div>
            )}
          </div>

          {/* Footer Actions */}
          <div className="p-2 bg-slate-50 dark:bg-slate-950 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between">
            <button
              onClick={() => {
                onOpenModal();
                setIsOpen(false);
              }}
              className="text-[11px] text-indigo-600 dark:text-indigo-400 hover:underline font-semibold flex items-center gap-1"
            >
              <LayoutTemplate size={12} /> Vollständigen Katalog öffnen...
            </button>
            {onClearLayout && (
              <button
                onClick={() => {
                  onClearLayout();
                  setIsOpen(false);
                }}
                className="text-[10px] text-red-500 hover:text-red-700 font-medium hover:underline"
              >
                Layout leeren
              </button>
            )}
          </div>

        </div>
      )}
    </div>
  );
};
