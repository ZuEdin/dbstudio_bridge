import React, { useState, useEffect } from 'react';
import { Search, Table, FileText, Layout, Database } from 'lucide-react';
import { Table as TableType, Query, Report, Form } from '../types/index';

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  tables: TableType[];
  queries: Query[];
  reports: Report[];
  forms: Form[];
  onNavigate: (type: 'table_data' | 'query_results' | 'report_view' | 'form_view', id: string) => void;
  onCreateTable?: (name: string) => void;
}

export const CommandPalette: React.FC<CommandPaletteProps> = ({ 
  isOpen, onClose, tables, queries, reports, forms, onNavigate, onCreateTable 
}) => {
  const [search, setSearch] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);

  const allItems = [
    ...tables.map(t => ({ id: t.id, name: t.name, type: 'Tabelle', icon: Table, action: 'table_data' as const })),
    ...queries.map(q => ({ id: q.id, name: q.name, type: 'Abfrage', icon: Search, action: 'query_results' as const })),
    ...forms.map(f => ({ id: f.id, name: f.name, type: 'Formular', icon: Layout, action: 'form_view' as const })),
    ...reports.map(r => ({ id: r.id, name: r.name, type: 'Bericht', icon: FileText, action: 'report_view' as const })),
  ];

  let filteredItems = allItems.filter(item => 
    item.name.toLowerCase().includes(search.toLowerCase()) || 
    item.type.toLowerCase().includes(search.toLowerCase())
  );

  // Command handling
  const isCreateTableCommand = search.toLowerCase().startsWith('> create table ');
  if (isCreateTableCommand && onCreateTable) {
      const newName = search.substring(15).trim();
      if (newName) {
          filteredItems = [{
              id: 'cmd_create_table',
              name: `Erstelle neue Tabelle: "${newName}"`,
              type: 'Befehl',
              icon: Table,
              action: 'create_table' as any
          }];
      }
  }

  useEffect(() => {
    setSelectedIndex(0);
  }, [search]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;

      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex(prev => Math.min(prev + 1, filteredItems.length - 1));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex(prev => Math.max(prev - 1, 0));
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (filteredItems[selectedIndex]) {
          const item = filteredItems[selectedIndex];
          if ((item.action as string) === 'create_table') {
              const newName = search.substring(15).trim();
              if (onCreateTable) onCreateTable(newName);
          } else {
              onNavigate(item.action as any, item.id);
          }
          onClose();
        }
      } else if (e.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, filteredItems, selectedIndex, onNavigate, onClose, onCreateTable, search]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] bg-black/20 backdrop-blur-sm flex items-start justify-center pt-[20vh]" onClick={onClose}>
      <div className="bg-white w-full max-w-xl rounded-xl shadow-2xl overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95 duration-100" onClick={e => e.stopPropagation()}>
        <div className="flex items-center px-4 border-b border-slate-100">
          <Search className="text-slate-400" size={20} />
          <input 
            className="w-full p-4 outline-none text-lg text-slate-700 placeholder:text-slate-300"
            placeholder="Suche nach Tabellen, Abfragen..."
            autoFocus
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
          <div className="text-xs text-slate-400 border border-slate-200 px-2 py-1 rounded">ESC</div>
        </div>
        <div className="max-h-[300px] overflow-y-auto py-2">
          {filteredItems.length === 0 ? (
            <div className="p-4 text-center text-slate-400 text-sm">Keine Ergebnisse gefunden.</div>
          ) : (
            filteredItems.map((item, index) => (
              <div 
                key={`${item.type}-${item.id}`}
                className={`px-4 py-3 flex items-center gap-3 cursor-pointer ${index === selectedIndex ? 'bg-indigo-50 text-indigo-900 border-l-4 border-indigo-500' : 'text-slate-700 border-l-4 border-transparent hover:bg-slate-50'}`}
                onClick={() => {
                  onNavigate(item.action, item.id);
                  onClose();
                }}
                onMouseEnter={() => setSelectedIndex(index)}
              >
                <item.icon size={18} className={index === selectedIndex ? 'text-indigo-600' : 'text-slate-400'} />
                <div className="flex-1">
                  <div className="font-medium">{item.name}</div>
                  <div className="text-xs opacity-60">{item.type}</div>
                </div>
                {index === selectedIndex && <span className="text-xs text-indigo-400">Enter zum Öffnen</span>}
              </div>
            ))
          )}
        </div>
        <div className="bg-slate-50 p-2 text-xs text-slate-400 flex justify-between border-t border-slate-100">
           <span><strong>↑↓</strong> zum Navigieren</span>
           <span>DB Studio Pro</span>
        </div>
      </div>
    </div>
  );
};