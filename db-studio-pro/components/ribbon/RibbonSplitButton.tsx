import React, { useState, useRef, useEffect } from 'react';
import { 
  Table as TableIcon, ChevronDown, ChevronRight, Plus, Search, Bookmark, 
  Sparkles, Users, CheckSquare, AlertCircle, Package, Building, 
  Truck, Globe, Tag, Hash, Settings, Check, FileText
} from 'lucide-react';
import { TableTemplate } from '../../types/tableTemplates';
import { getAllTemplates, getBuiltinTemplates, getCustomTemplates } from '../../services/tableTemplateService';
import { useUIStore } from '../../stores/useUIStore';

interface RibbonSplitButtonProps {
  label: string;
  onMainClick: () => void;
  onSelectTemplate: (template: TableTemplate, withSampleData: boolean) => void;
  onOpenTemplateManager: () => void;
  onSaveCurrentAsTemplate?: () => void;
  disabled?: boolean;
}

export const RibbonSplitButton: React.FC<RibbonSplitButtonProps> = ({
  label,
  onMainClick,
  onSelectTemplate,
  onOpenTemplateManager,
  onSaveCurrentAsTemplate,
  disabled = false
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [withSampleData, setWithSampleData] = useState(true);
  const [templates, setTemplates] = useState<TableTemplate[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);

  const loadData = () => {
    setTemplates(getAllTemplates());
  };

  useEffect(() => {
    if (isOpen) {
      loadData();
    }
  }, [isOpen]);

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

  const renderIcon = (iconName: string, className = 'w-4 h-4') => {
    switch (iconName) {
      case 'Users': return <Users className={`${className} text-blue-600 dark:text-blue-400`} />;
      case 'Building': return <Building className={`${className} text-indigo-600 dark:text-indigo-400`} />;
      case 'Truck': return <Truck className={`${className} text-amber-600 dark:text-amber-400`} />;
      case 'CheckSquare': return <CheckSquare className={`${className} text-emerald-600 dark:text-emerald-400`} />;
      case 'AlertCircle': return <AlertCircle className={`${className} text-rose-600 dark:text-rose-400`} />;
      case 'Package': return <Package className={`${className} text-violet-600 dark:text-violet-400`} />;
      case 'Globe': return <Globe className={`${className} text-teal-600 dark:text-teal-400`} />;
      case 'Tag': return <Tag className={`${className} text-sky-600 dark:text-sky-400`} />;
      case 'Hash': return <Hash className={`${className} text-amber-600 dark:text-amber-400`} />;
      case 'FileText': return <FileText className={`${className} text-slate-600 dark:text-slate-400`} />;
      default: return <Bookmark className={`${className} text-purple-600 dark:text-purple-400`} />;
    }
  };

  const filtered = templates.filter(t => 
    t.name.toLowerCase().includes(search.toLowerCase()) ||
    t.description.toLowerCase().includes(search.toLowerCase()) ||
    t.categoryLabel.toLowerCase().includes(search.toLowerCase())
  );

  const frequentTemplates = filtered.filter(t => !t.isCustom && ['crm', 'pm', 'finance'].includes(t.category));
  const lookupTemplates = filtered.filter(t => !t.isCustom && ['lookup', 'org'].includes(t.category));
  const customTemplates = filtered.filter(t => t.isCustom);

  return (
    <div className="relative inline-flex" ref={containerRef}>
      {/* Office-style split button layout */}
      <div className={`flex flex-col items-center justify-between border rounded transition-colors ${
        isOpen 
          ? 'bg-sky-100 dark:bg-sky-950/60 border-sky-300 dark:border-sky-800' 
          : 'border-transparent hover:bg-slate-100 dark:hover:bg-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
      }`}>
        
        {/* Main top button (New Table) */}
        <button
          type="button"
          onClick={disabled ? undefined : onMainClick}
          disabled={disabled}
          title="Neue leere Tabelle erstellen"
          className="flex flex-col items-center justify-center pt-1.5 px-3 pb-0.5 w-20 text-slate-700 dark:text-slate-200 hover:text-sky-900 dark:hover:text-white transition-colors"
        >
          <div className="scale-125 mb-1 text-blue-600 dark:text-blue-400">
            <TableIcon size={20} />
          </div>
          <span className="text-xs font-semibold leading-tight">{label}</span>
        </button>

        {/* Bottom dropdown trigger */}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            if (!disabled) setIsOpen(prev => !prev);
          }}
          disabled={disabled}
          title="Beispieltabellen & Vorlagen anzeigen"
          className="w-full flex items-center justify-center py-0.5 hover:bg-sky-200/60 dark:hover:bg-slate-700 rounded-b text-slate-600 dark:text-slate-300 transition-colors"
        >
          <ChevronDown size={13} className={`transition-transform duration-200 ${isOpen ? 'rotate-180 text-blue-600' : ''}`} />
        </button>
      </div>

      {/* Popover Dropdown Menu */}
      {isOpen && (
        <div className="absolute top-full left-0 mt-1 w-96 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-2xl z-[100] overflow-hidden animate-in fade-in zoom-in-95 duration-150 text-slate-800 dark:text-slate-100">
          
          {/* Header & Search */}
          <div className="p-3 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Tabellen-Vorlagen
              </span>
              <label className="flex items-center gap-1.5 text-[11px] font-medium text-slate-600 dark:text-slate-300 cursor-pointer select-none">
                <input 
                  type="checkbox"
                  checked={withSampleData}
                  onChange={(e) => setWithSampleData(e.target.checked)}
                  className="rounded text-blue-600 focus:ring-blue-500 w-3 h-3"
                />
                <span>Mit Beispieldaten</span>
              </label>
            </div>

            <div className="relative">
              <Search className="absolute left-2.5 top-2 text-slate-400 w-3.5 h-3.5" />
              <input 
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Vorlage suchen (z. B. Kontakte, Aufgaben, Staaten)..."
                className="w-full pl-8 pr-3 py-1.5 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                autoFocus
              />
            </div>
          </div>

          {/* List Area */}
          <div className="max-h-80 overflow-y-auto p-2 space-y-3">
            
            {/* Quick-Start / Standard */}
            {frequentTemplates.length > 0 && (
              <div>
                <div className="px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                  Häufige Tabellen
                </div>
                <div className="grid grid-cols-2 gap-1 mt-0.5">
                  {frequentTemplates.map(tpl => (
                    <button
                      key={tpl.id}
                      onClick={() => {
                        onSelectTemplate(tpl, withSampleData);
                        setIsOpen(false);
                      }}
                      className="flex items-start gap-2 p-2 rounded-lg text-left hover:bg-slate-100 dark:hover:bg-slate-800/80 transition-colors group"
                    >
                      <div className="p-1.5 rounded bg-slate-100 dark:bg-slate-800 group-hover:bg-blue-50 dark:group-hover:bg-blue-950/40 shrink-0">
                        {renderIcon(tpl.icon)}
                      </div>
                      <div className="min-w-0">
                        <div className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate group-hover:text-blue-600 dark:group-hover:text-blue-400">
                          {tpl.name}
                        </div>
                        <div className="text-[10px] text-slate-400 dark:text-slate-500 truncate">
                          {tpl.fields.length} Felder
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Lookups & Master Data */}
            {lookupTemplates.length > 0 && (
              <div>
                <div className="px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 border-t border-slate-100 dark:border-slate-800/60 pt-2">
                  Stammdaten & Nachschlagetabellen (Lookups)
                </div>
                <div className="grid grid-cols-2 gap-1 mt-0.5">
                  {lookupTemplates.map(tpl => (
                    <button
                      key={tpl.id}
                      onClick={() => {
                        onSelectTemplate(tpl, withSampleData);
                        setIsOpen(false);
                      }}
                      className="flex items-start gap-2 p-2 rounded-lg text-left hover:bg-slate-100 dark:hover:bg-slate-800/80 transition-colors group"
                    >
                      <div className="p-1.5 rounded bg-slate-100 dark:bg-slate-800 group-hover:bg-blue-50 dark:group-hover:bg-blue-950/40 shrink-0">
                        {renderIcon(tpl.icon)}
                      </div>
                      <div className="min-w-0">
                        <div className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate group-hover:text-blue-600 dark:group-hover:text-blue-400">
                          {tpl.name}
                        </div>
                        <div className="text-[10px] text-slate-400 dark:text-slate-500 truncate">
                          {tpl.fields.length} Felder {tpl.sampleData?.length ? `• ${tpl.sampleData.length} Einträge` : ''}
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Custom Templates */}
            {customTemplates.length > 0 && (
              <div>
                <div className="px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-purple-600 dark:text-purple-400 border-t border-slate-100 dark:border-slate-800/60 pt-2 flex items-center justify-between">
                  <span>Eigene Vorlagen ({customTemplates.length})</span>
                  <span className="text-[9px] bg-purple-100 dark:bg-purple-900/40 text-purple-600 dark:text-purple-300 px-1 py-0.2 rounded font-bold">Benutzerdefiniert</span>
                </div>
                <div className="space-y-1 mt-0.5">
                  {customTemplates.map(tpl => (
                    <button
                      key={tpl.id}
                      onClick={() => {
                        onSelectTemplate(tpl, withSampleData);
                        setIsOpen(false);
                      }}
                      className="w-full flex items-center justify-between p-2 rounded-lg text-left hover:bg-purple-50 dark:hover:bg-purple-950/30 transition-colors group"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <div className="p-1 rounded bg-purple-100 dark:bg-purple-900/40 text-purple-600 shrink-0">
                          <Bookmark size={14} />
                        </div>
                        <div className="min-w-0">
                          <div className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate group-hover:text-purple-600">
                            {tpl.name}
                          </div>
                          <div className="text-[10px] text-slate-400 truncate">
                            {tpl.fields.length} Felder {tpl.sampleData?.length ? `• ${tpl.sampleData.length} Daten` : ''}
                          </div>
                        </div>
                      </div>
                      <span className="text-[11px] text-purple-600 font-semibold opacity-0 group-hover:opacity-100 transition-opacity">
                        Einfügen →
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {filtered.length === 0 && (
              <div className="p-6 text-center text-xs text-slate-400">
                Keine passenden Vorlagen gefunden.
              </div>
            )}
          </div>

          {/* Footer Actions */}
          <div className="p-2 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 flex flex-col gap-1">
            {onSaveCurrentAsTemplate && (
              <button
                type="button"
                onClick={() => {
                  onSaveCurrentAsTemplate();
                  setIsOpen(false);
                }}
                className="w-full flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs font-medium text-purple-600 dark:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-950/40 rounded-lg transition-colors"
              >
                <Bookmark size={13} /> Aktuelle Tabelle als Vorlage speichern...
              </button>
            )}

            <button
              type="button"
              onClick={() => {
                onOpenTemplateManager();
                setIsOpen(false);
              }}
              className="w-full flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs font-bold text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/40 rounded-lg transition-colors"
            >
              <Settings size={13} /> Vorlagenkatalog verwalten & importieren...
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
