import React, { useState, useMemo } from 'react';
import { 
  X, Search, HelpCircle, Info, MousePointer, Database, Key, 
  ChevronRight, Filter, Sparkles, CheckCircle2, ArrowRight
} from 'lucide-react';
import * as Icons from 'lucide-react';
import { BUTTON_INFO_DATA, ButtonInfoItem } from '../../data/buttonInfoData';

interface ButtonInfoModalProps {
  isOpen: boolean;
  onClose: () => void;
  onExecuteAction?: (actionKey: string) => void;
}

export const ButtonInfoModal: React.FC<ButtonInfoModalProps> = ({
  isOpen,
  onClose,
  onExecuteAction
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [selectedItem, setSelectedItem] = useState<ButtonInfoItem | null>(null);

  const categories = useMemo(() => {
    return [
      { id: 'all', label: 'Alle Schaltflächen' },
      { id: 'home', label: 'Start / Home' },
      { id: 'create', label: 'Erstellen' },
      { id: 'external', label: 'Externe Daten' },
      { id: 'pages', label: 'Pages & SDUI' },
      { id: 'deploy', label: 'Bereitstellung' },
    ];
  }, []);

  const filteredItems = useMemo(() => {
    return BUTTON_INFO_DATA.filter(item => {
      const matchesCategory = activeCategory === 'all' || item.category === activeCategory;
      const matchesSearch = 
        item.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.dbAction.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (item.shortcut && item.shortcut.toLowerCase().includes(searchQuery.toLowerCase()));
      return matchesCategory && matchesSearch;
    });
  }, [activeCategory, searchQuery]);

  if (!isOpen) return null;

  const renderDynamicIcon = (iconName: string) => {
    const IconComponent = (Icons as any)[iconName] || Icons.HelpCircle;
    return <IconComponent size={20} className="text-blue-600 dark:text-blue-400" />;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-4xl max-h-[85vh] bg-white dark:bg-slate-800 rounded-xl shadow-2xl border border-slate-200 dark:border-slate-700 flex flex-col overflow-hidden text-slate-800 dark:text-slate-100">
        
        {/* Header */}
        <div className="px-6 py-4 bg-slate-800 text-white flex items-center justify-between border-b border-slate-700">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-blue-600/30 border border-blue-400/40 flex items-center justify-center text-blue-400">
              <HelpCircle size={22} />
            </div>
            <div>
              <h2 className="text-base font-bold flex items-center gap-2">
                Schaltflächen-Informationen & Referenz
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 font-semibold border border-blue-400/30">
                  {BUTTON_INFO_DATA.length} Funktionen
                </span>
              </h2>
              <p className="text-xs text-slate-300">
                Übersicht über alle Schaltflächen im Menüband, deren Funktionen & IndexedDB-Datenbankauswirkungen.
              </p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-700 transition-colors"
            title="Schließen"
          >
            <X size={20} />
          </button>
        </div>

        {/* Toolbar & Filter */}
        <div className="p-4 bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-700 flex flex-col sm:flex-row gap-3 items-center justify-between">
          {/* Search Box */}
          <div className="relative w-full sm:w-72">
            <Search size={16} className="absolute left-3 top-2.5 text-slate-400" />
            <input 
              type="text"
              placeholder="Schaltfläche suchen..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-1.5 text-xs rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-800 dark:text-slate-100"
            />
            {searchQuery && (
              <button 
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-xs"
              >
                ✕
              </button>
            )}
          </div>

          {/* Category Tabs */}
          <div className="flex items-center gap-1 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id)}
                className={`px-3 py-1 rounded-md text-xs whitespace-nowrap transition-all font-medium ${
                  activeCategory === cat.id
                    ? 'bg-blue-600 text-white shadow-sm font-semibold'
                    : 'bg-slate-200/80 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-300 dark:hover:bg-slate-600'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </div>

        {/* Body Content */}
        <div className="flex-1 overflow-y-auto p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredItems.length === 0 ? (
            <div className="col-span-full py-12 flex flex-col items-center justify-center text-center text-slate-500 dark:text-slate-400">
              <Info size={36} className="mb-2 opacity-50 text-blue-500" />
              <p className="font-semibold text-sm">Keine passenden Schaltflächen gefunden</p>
              <p className="text-xs mt-1">Versuchen Sie einen anderen Suchbegriff oder wählen Sie "Alle Schaltflächen".</p>
            </div>
          ) : (
            filteredItems.map((item) => {
              const isSelected = selectedItem?.id === item.id;
              return (
                <div 
                  key={item.id}
                  onClick={() => setSelectedItem(isSelected ? null : item)}
                  className={`group relative p-4 rounded-xl border transition-all cursor-pointer flex flex-col justify-between ${
                    isSelected 
                      ? 'border-blue-500 bg-blue-50/50 dark:bg-blue-950/30 ring-2 ring-blue-500/20' 
                      : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 hover:border-blue-300 dark:hover:border-blue-700 hover:shadow-md'
                  }`}
                >
                  <div>
                    {/* Item Top Bar */}
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-900/40 border border-blue-200 dark:border-blue-800 flex items-center justify-center shrink-0">
                          {renderDynamicIcon(item.iconName)}
                        </div>
                        <div>
                          <h3 className="font-bold text-sm text-slate-800 dark:text-slate-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                            {item.label}
                          </h3>
                          <span className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">
                            {item.categoryLabel}
                          </span>
                        </div>
                      </div>

                      {item.shortcut && (
                        <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-600 text-slate-600 dark:text-slate-300 shrink-0">
                          {item.shortcut}
                        </span>
                      )}
                    </div>

                    {/* Description */}
                    <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed mb-3">
                      {item.description}
                    </p>
                  </div>

                  {/* Database / Technical Action Box */}
                  <div className="mt-2 pt-2.5 border-t border-slate-100 dark:border-slate-800/80 flex items-start gap-2 text-[11px] text-slate-500 dark:text-slate-400">
                    <Database size={13} className="text-emerald-500 shrink-0 mt-0.5" />
                    <span className="line-clamp-2 italic">
                      <strong className="font-semibold text-slate-700 dark:text-slate-300 not-italic">IndexedDB: </strong>
                      {item.dbAction}
                    </span>
                  </div>

                  {/* Trigger Action Button inside Modal */}
                  {onExecuteAction && (
                    <div className="mt-3 pt-2 border-t border-slate-100 dark:border-slate-800 flex justify-end">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onClose();
                          onExecuteAction(item.actionKey);
                        }}
                        className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 hover:bg-blue-600 hover:text-white transition-all text-[11px] font-semibold"
                      >
                        <span>Aktion ausführen</span>
                        <ArrowRight size={12} />
                      </button>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 bg-slate-100 dark:bg-slate-900 border-t border-slate-200 dark:border-slate-700 flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
            <Sparkles size={14} className="text-amber-500" />
            <span>IndexedDB ist die primäre Datenquelle für alle Schaltflächen-Operationen.</span>
          </div>

          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-xs font-semibold transition-colors shadow"
          >
            Verstehen & Schließen
          </button>
        </div>

      </div>
    </div>
  );
};
