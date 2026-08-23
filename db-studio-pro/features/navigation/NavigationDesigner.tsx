import React, { useState, useEffect } from 'react';
import { 
  FolderPlus, Plus, Calendar, Shield, Trash2, ChevronRight, ChevronDown, 
  Settings, Key, Layers, ArrowUp, ArrowDown, HelpCircle, Check, Play,
  Home, Database, Search, FileText, Frame, BookOpen, BarChart2, CheckSquare, 
  Sliders, Link, ShieldAlert, Folder, UserCheck, AlertCircle, Globe, Sparkles, Command
} from 'lucide-react';
import { 
  Table, Query, Report, Form, NavigationItem, BackendConfig 
} from '../../types/index';
import { useProjectStore } from '../../stores/useProjectStore';
import { toCamelCase } from '../../utils/generators/common';

// A dynamic icon mapping for easy visual choices
const AVAILABLE_ICONS = [
  { name: 'home', icon: Home, label: 'Start/Home' },
  { name: 'database', icon: Database, label: 'Datenbank' },
  { name: 'search', icon: Search, label: 'Suche/Abfrage' },
  { name: 'file-text', icon: FileText, label: 'Dokument/Bericht' },
  { name: 'form', icon: Frame, label: 'Formular' },
  { name: 'calendar', icon: Calendar, label: 'Zeitplanung' },
  { name: 'chart', icon: BarChart2, label: 'Graph/Diagramm' },
  { name: 'shield', icon: Shield, label: 'Sicherheit' },
  { name: 'settings', icon: Settings, label: 'Optionen' },
  { name: 'folder', icon: Folder, label: 'Ordner' },
  { name: 'tasks', icon: CheckSquare, label: 'Aufgaben' },
  { name: 'sliders', icon: Sliders, label: 'Parameter' },
  { name: 'link', icon: Link, label: 'Verknüpfung' },
];

interface NavigationDesignerProps {
  tables: Table[];
  queries: Query[];
  reports: Report[];
  forms: Form[];
  backendConfig: BackendConfig;
  onUpdateBackendConfig: (config: BackendConfig) => void;
  showMessage: (title: string, message: string, type: 'info' | 'warning' | 'error' | 'success') => void;
}

export const NavigationDesigner: React.FC<NavigationDesignerProps> = ({
  tables,
  queries,
  reports,
  forms,
  backendConfig,
  onUpdateBackendConfig,
  showMessage,
}) => {
  // Try to load existing roles from 'sys_roles' table if present, otherwise default
  const rolesTable = tables.find(t => t.name === 'sys_roles');
  const availableRoles = rolesTable && rolesTable.data && rolesTable.data.length > 0
    ? rolesTable.data.map((r: any) => r.Name || String(r.Id))
    : ['Admin', 'Manager', 'Editor', 'User', 'Guest'];

  const [menuItems, setMenuItems] = useState<NavigationItem[]>([]);
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
  const [expandedFolders, setExpandedFolders] = useState<Record<string, boolean>>({});
  
  // Tab within the Inspector: 'general' | 'power_ups'
  const [inspectorTab, setInspectorTab] = useState<'general' | 'power_ups'>('general');
  
  // Custom states for Phase 3 Command Palette simulation
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);
  const [commandSearch, setCommandSearch] = useState('');
  
  // Layout style preset
  const [selectedLayout, setSelectedLayout] = useState<'sidebar' | 'top_nav' | 'double_rail'>(
    backendConfig.navigationPreset || 'sidebar'
  );

  // Initialize menu with existing pages or pre-existing config
  useEffect(() => {
    if (backendConfig.navigationConfig && backendConfig.navigationConfig.length > 0) {
      let currentConfig = [...backendConfig.navigationConfig];
      const flatItems = getFlatItems(currentConfig);
      const missingQueries = queries.filter(q => 
        (q.type === 'SELECT' || q.type === 'UPDATE' || !q.type) && 
        !flatItems.some(item => (item.targetType === 'query' && item.targetId === q.id) || item.id === `query-${q.id}` || item.route === `/queries/${toCamelCase(q.name)}`)
      );

      if (missingQueries.length > 0) {
        const newQueryItems: NavigationItem[] = missingQueries.map(q => ({
          id: `query-${q.id}`,
          type: 'page',
          title: q.name,
          icon: 'search',
          route: `/queries/${toCamelCase(q.name)}`,
          requiredRoles: ['User', 'Admin'],
          targetId: q.id,
          targetType: 'query',
          translations: { de: q.name, en: q.name }
        }));
        currentConfig = [...currentConfig, ...newQueryItems];
        saveToConfig(currentConfig, selectedLayout);
      }
      setMenuItems(currentConfig);
    } else {
      // Auto-populate initial clean menu based on existing tables/queries/forms/reports
      const initialItems: NavigationItem[] = [
        {
          id: 'home-dashboard',
          type: 'page',
          title: 'Cockpit / Dashboard',
          icon: 'home',
          route: '/dashboard',
          requiredRoles: ['User', 'Admin'],
          targetType: 'custom',
          translations: { de: 'Cockpit', en: 'Dashboard', fr: 'Tableau de bord' }
        }
      ];

      // Add major tables to default menu
      tables.filter(t => !t.name.startsWith('sys_')).forEach(table => {
        initialItems.push({
          id: `table-${table.id}`,
          type: 'page',
          title: table.name.replace(/_/g, ' '),
          icon: 'database',
          route: `/${table.name.toLowerCase()}`,
          requiredRoles: ['User', 'Admin'],
          targetId: table.id,
          targetType: 'table',
          translations: { de: table.name.replace(/_/g, ' '), en: table.name.replace(/_/g, ' ') }
        });
      });

      // Add queries
      queries.filter(q => q.type === 'SELECT' || q.type === 'UPDATE' || !q.type).forEach(query => {
        initialItems.push({
          id: `query-${query.id}`,
          type: 'page',
          title: query.name,
          icon: 'search',
          route: `/queries/${toCamelCase(query.name)}`,
          requiredRoles: ['User', 'Admin'],
          targetId: query.id,
          targetType: 'query',
          translations: { de: query.name, en: query.name }
        });
      });

      // Add forms
      forms.forEach(form => {
        initialItems.push({
          id: `form-${form.id}`,
          type: 'page',
          title: form.name,
          icon: 'form',
          route: `/form/${form.id}`,
          requiredRoles: ['User', 'Admin'],
          targetId: form.id,
          targetType: 'form',
          translations: { de: form.name, en: `${form.name} Form` }
        });
      });

      // Add reports
      reports.forEach(report => {
        initialItems.push({
          id: `report-${report.id}`,
          type: 'page',
          title: report.name,
          icon: 'file-text',
          route: `/report/${report.id}`,
          requiredRoles: ['User', 'Admin'],
          targetId: report.id,
          targetType: 'report',
          translations: { de: report.name, en: `${report.name} Report` }
        });
      });

      setMenuItems(initialItems);
      saveToConfig(initialItems, selectedLayout);
    }
  }, [tables, queries, reports, forms]);

  // Command Palette hook
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setIsCommandPaletteOpen(prev => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const saveToConfig = (items: NavigationItem[], layout: 'sidebar' | 'top_nav' | 'double_rail') => {
    onUpdateBackendConfig({
      ...backendConfig,
      navigationConfig: items,
      navigationPreset: layout
    });
  };

  const handleUpdateItems = (updated: NavigationItem[]) => {
    setMenuItems(updated);
    saveToConfig(updated, selectedLayout);
  };

  const handleLayoutChange = (layout: 'sidebar' | 'top_nav' | 'double_rail') => {
    setSelectedLayout(layout);
    saveToConfig(menuItems, layout);
    showMessage("Layout aktualisiert", `Das Shell Preset "${layout === 'sidebar' ? 'Modern Sidebar' : layout === 'top_nav' ? 'Top Navigation' : 'Double Rail'}" wurde gespeichert.`, "success");
  };

  // Helper to toggle folder expanded state
  const toggleFolder = (id: string) => {
    setExpandedFolders(prev => ({ ...prev, [id]: !prev[id] }));
  };

  // Find a specific node by ID in the tree
  const findItemById = (id: string, items: NavigationItem[]): NavigationItem | null => {
    for (const item of items) {
      if (item.id === id) return item;
      if (item.children) {
        const found = findItemById(id, item.children);
        if (found) return found;
      }
    }
    return null;
  };

  // Update specific node values
  const updateItemInTree = (
    id: string, 
    fields: Partial<NavigationItem>,
    items: NavigationItem[]
  ): NavigationItem[] => {
    return items.map(item => {
      if (item.id === id) {
        return { ...item, ...fields };
      }
      if (item.children) {
        return { ...item, children: updateItemInTree(id, fields, item.children) };
      }
      return item;
    });
  };

  // Get currently selected item properties
  const selectedItem = selectedItemId ? findItemById(selectedItemId, menuItems) : null;

  // Render icon
  const renderIconComponent = (iconName: string, size = 16, className = "text-slate-500") => {
    const found = AVAILABLE_ICONS.find(i => i.name === iconName);
    const IconComponent = found ? found.icon : BookOpen;
    return <IconComponent size={size} className={className} />;
  };

  // Add a new blank folder to root or into folder
  const addFolder = () => {
    const newFolder: NavigationItem = {
      id: `folder-${crypto.randomUUID()}`,
      type: 'folder',
      title: 'Neuer Ordner',
      icon: 'folder',
      route: '#',
      requiredRoles: ['User', 'Admin'],
      children: [],
      translations: { de: 'Neuer Ordner', en: 'New Folder', fr: 'Nouveau dossier' }
    };
    const updated = [...menuItems, newFolder];
    handleUpdateItems(updated);
    setSelectedItemId(newFolder.id);
  };

  // Add custom URL / Page
  const addCustomLink = () => {
    const newLink: NavigationItem = {
      id: `custom-${crypto.randomUUID()}`,
      type: 'page',
      title: 'Benutzerdefinierte Seite',
      icon: 'link',
      route: '/custom-page',
      requiredRoles: ['User', 'Admin'],
      targetType: 'custom',
      translations: { de: 'Eigene Seite', en: 'Custom Page', fr: 'Page personnalisée' }
    };
    const updated = [...menuItems, newLink];
    handleUpdateItems(updated);
    setSelectedItemId(newLink.id);
  };

  // Delete matching item from tree
  const deleteFromTree = (id: string, items: NavigationItem[]): NavigationItem[] => {
    const filtered: NavigationItem[] = [];
    for (const item of items) {
      if (item.id === id) {
        // Skip adding this one (deletes it)
        continue;
      }
      if (item.children) {
        filtered.push({
          ...item,
          children: deleteFromTree(id, item.children)
        });
      } else {
        filtered.push(item);
      }
    }
    return filtered;
  };

  const handleDeleteItem = (id: string) => {
    const updated = deleteFromTree(id, menuItems);
    handleUpdateItems(updated);
    if (selectedItemId === id) setSelectedItemId(null);
    showMessage("Element entfernt", "Das Navigationselement wurde erfolgreich gelöscht.", "success");
  };

  // Move element up inside its parent array
  const moveElementInTree = (id: string, direction: 'up' | 'down', items: NavigationItem[]): NavigationItem[] => {
    const idx = items.findIndex(item => item.id === id);
    if (idx !== -1) {
      const nextIdx = direction === 'up' ? idx - 1 : idx + 1;
      if (nextIdx >= 0 && nextIdx < items.length) {
        const result = [...items];
        const temp = result[idx];
        result[idx] = result[nextIdx];
        result[nextIdx] = temp;
        return result;
      }
      return items;
    }

    return items.map(item => {
      if (item.children && item.children.length > 0) {
        return {
          ...item,
          children: moveElementInTree(id, direction, item.children)
        };
      }
      return item;
    });
  };

  const handleMove = (id: string, direction: 'up' | 'down') => {
    const updated = moveElementInTree(id, direction, menuItems);
    handleUpdateItems(updated);
  };

  // Helper to deep clone navigation tree to prevent state mutation
  const cloneTree = (tree: NavigationItem[]): NavigationItem[] => {
    return tree.map(item => ({
      ...item,
      children: item.children ? cloneTree(item.children) : undefined
    }));
  };

  // Recursively find parent folder ID of a given item
  const findParentFolderId = (itemId: string, items: NavigationItem[]): string => {
    for (const item of items) {
      if (item.children && item.children.some(child => child.id === itemId)) {
        return item.id;
      }
      if (item.children) {
        const found = findParentFolderId(itemId, item.children);
        if (found !== 'root') return found;
      }
    }
    return 'root';
  };

  // Recursively retrieve all folders with their nesting depth
  const getAllFolders = (items: NavigationItem[], depth = 0): { folder: NavigationItem; depth: number }[] => {
    let folders: { folder: NavigationItem; depth: number }[] = [];
    for (const item of items) {
      if (item.type === 'folder') {
        folders.push({ folder: item, depth });
        if (item.children) {
          folders = [...folders, ...getAllFolders(item.children, depth + 1)];
        }
      }
    }
    return folders;
  };

  // Recursively check if targetId is a descendant of ancestorId
  const isDescendantOf = (ancestorId: string, targetId: string, items: NavigationItem[]): boolean => {
    const ancestor = findItemById(ancestorId, items);
    if (!ancestor || !ancestor.children) return false;
    if (ancestor.children.some(c => c.id === targetId)) return true;
    return ancestor.children.some(c => isDescendantOf(c.id, targetId, items));
  };

  // Drop source into target folder logic
  const moveItemToFolder = (
    itemId: string, 
    targetFolderId: string | null, 
    items: NavigationItem[]
  ): NavigationItem[] => {
    let draggedItem: NavigationItem | null = null;
    const clonedItems = cloneTree(items);
    
    const findAndRemove = (list: NavigationItem[]): NavigationItem[] => {
      return list.filter(item => {
        if (item.id === itemId) {
          draggedItem = item;
          return false;
        }
        if (item.children) {
          item.children = findAndRemove(item.children);
        }
        return true;
      });
    };

    const pristineList = findAndRemove(clonedItems);
    if (!draggedItem) return items; // Not found

    if (targetFolderId === null) {
      return [...pristineList, draggedItem];
    }

    const insertInFolder = (list: NavigationItem[]): NavigationItem[] => {
      return list.map(item => {
        if (item.id === targetFolderId && item.type === 'folder') {
          return {
            ...item,
            children: [...(item.children || []), draggedItem!]
          };
        }
        if (item.children) {
          return {
            ...item,
            children: insertInFolder(item.children)
          };
        }
        return item;
      });
    };

    return insertInFolder(pristineList);
  };

  const handleAddToolboxItem = (type: 'table' | 'query' | 'form' | 'report', item: any) => {
    let iconName = 'database';
    let path = `/${item.name?.toLowerCase() || item.id}`;
    if (type === 'query') { iconName = 'search'; path = `/queries/${toCamelCase(item.name || item.id)}`; }
    if (type === 'form') { iconName = 'form'; path = `/form/${item.id}`; }
    if (type === 'report') { iconName = 'file-text'; path = `/report/${item.id}`; }

    const newNavItem: NavigationItem = {
      id: `${type}-${item.id}`,
      type: 'page',
      title: item.name || item.title || 'Neue Seite',
      icon: iconName,
      route: path,
      requiredRoles: ['User', 'Admin'],
      targetId: item.id,
      targetType: type,
      translations: { de: item.name || item.title, en: item.name || item.title }
    };

    const updated = [...menuItems, newNavItem];
    handleUpdateItems(updated);
    setSelectedItemId(newNavItem.id);
    showMessage("Menüpunkt hinzugefügt", `"${newNavItem.title}" wurde der Navigationsstruktur hinzugefügt.`, "success");
  };

  // Flatten helper to search files in Command Palette
  const getFlatItems = (items: NavigationItem[]): NavigationItem[] => {
    const flat: NavigationItem[] = [];
    const recurse = (list: NavigationItem[]) => {
      list.forEach(i => {
        flat.push(i);
        if (i.children) recurse(i.children);
      });
    };
    recurse(items);
    return flat;
  };

  const flatListForSearch = getFlatItems(menuItems);
  const filteredSearchList = flatListForSearch.filter(it => 
    it.title.toLowerCase().includes(commandSearch.toLowerCase()) || 
    it.route.toLowerCase().includes(commandSearch.toLowerCase())
  );

  // Render a single menu item row
  const renderItemRow = (item: NavigationItem, depth = 0) => {
    const isFolder = item.type === 'folder';
    const isExpanded = expandedFolders[item.id] !== false;
    const isSelected = selectedItemId === item.id;
    
    // Simulate badge render if configured
    const hasBadge = !!item.badgeCountQuery;
    // Generate a beautiful simulated count based on string length or pseudo random
    const simulatedCount = item.badgeCountQuery ? (item.badgeCountQuery.length % 7) + 2 : 0;
    
    return (
      <div key={item.id} className="group flex flex-col">
        {/* Row Container */}
        <div 
          onClick={() => {
            setSelectedItemId(item.id);
            if (item.title.toLowerCase() === 'cms') {
              const store = useProjectStore.getState();
              // Add Devices table if missing
              if (!store.tables.find(t => t.name === 'sys_user_devices')) {
                store.addTable({
                  id: crypto.randomUUID(),
                  name: 'sys_user_devices',
                  fields: [
                    { id: crypto.randomUUID(), name: 'Id', type: 'INTEGER', isPrimaryKey: true, isAutoIncrement: true },
                    { id: crypto.randomUUID(), name: 'user_id', type: 'INTEGER', allowNull: false },
                    { id: crypto.randomUUID(), name: 'device_token', type: 'VARCHAR', length: 255 },
                    { id: crypto.randomUUID(), name: 'platform', type: 'VARCHAR', length: 255 },
                    { id: crypto.randomUUID(), name: 'last_active', type: 'TIMESTAMP' }
                  ],
                  data: []
                });
              }
              // Add Tokens table if missing
              if (!store.tables.find(t => t.name === 'sys_user_tokens')) {
                store.addTable({
                  id: crypto.randomUUID(),
                  name: 'sys_user_tokens',
                  fields: [
                    { id: crypto.randomUUID(), name: 'Id', type: 'INTEGER', isPrimaryKey: true, isAutoIncrement: true },
                    { id: crypto.randomUUID(), name: 'user_id', type: 'INTEGER', allowNull: false },
                    { id: crypto.randomUUID(), name: 'token', type: 'VARCHAR', length: 255 },
                    { id: crypto.randomUUID(), name: 'expires_at', type: 'TIMESTAMP' }
                  ],
                  data: []
                });
              }
              showMessage("CMS Tabellen erstellt", "Die erforderlichen Tabellen 'sys_user_devices' und 'sys_user_tokens' wurden automatisch erstellt.", "success");
            }
          }}
          className={`flex items-center justify-between p-2.5 mx-2 my-0.5 rounded-lg cursor-pointer border select-none transition-all duration-150 ${
            isSelected 
              ? 'bg-sky-50 border-sky-300 shadow-sm text-sky-950 font-medium' 
              : 'bg-white border-slate-200 hover:border-slate-300 text-slate-700 hover:bg-slate-50'
          }`}
          style={{ marginLeft: `${depth * 20 + 8}px` }}
        >
          <div className="flex items-center gap-2 overflow-hidden flex-1">
            {/* Folder toggle button */}
            {isFolder ? (
              <button 
                onClick={(e) => { e.stopPropagation(); toggleFolder(item.id); }}
                className="p-1 hover:bg-slate-200 rounded text-slate-500 hover:text-slate-800 transition-colors"
              >
                {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
              </button>
            ) : (
              <span className="w-6 col-span-1" />
            )}

            {/* Icon representation */}
            {renderIconComponent(item.icon, 16, isSelected ? 'text-sky-600' : 'text-slate-400')}
            
            <span className="truncate text-xs">{item.title}</span>
            <span className="text-[10px] text-slate-400 font-mono italic">({item.route})</span>

            {/* Phase 3: LIVE BADGE PREVIEW */}
            {hasBadge && (
              <span className="inline-flex items-center gap-1 ml-2 px-1.5 py-0.5 text-[9px] font-bold rounded-full bg-red-500 text-white animate-pulse shadow-sm">
                {simulatedCount}
              </span>
            )}
          </div>

          {/* Action pills & re-ordering buttons */}
          <div className="flex items-center gap-1 opacity-10 sm:opacity-100 group-hover:opacity-100 transition-opacity">
            {item.requiredRoles.length > 0 && (
              <span className="hidden md:inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-bold font-mono bg-amber-50 text-amber-800 border border-amber-200">
                <Shield size={8} className="mr-0.5" />
                {item.requiredRoles.length} R
              </span>
            )}
            <button 
              onClick={(e) => { e.stopPropagation(); handleMove(item.id, 'up'); }}
              className="p-1 hover:bg-slate-100 text-slate-400 hover:text-slate-600 rounded" 
              title="Nach oben"
            >
              <ArrowUp size={12} />
            </button>
            <button 
              onClick={(e) => { e.stopPropagation(); handleMove(item.id, 'down'); }}
              className="p-1 hover:bg-slate-100 text-slate-400 hover:text-slate-600 rounded" 
              title="Nach unten"
            >
              <ArrowDown size={12} />
            </button>
            <button 
              onClick={(e) => { e.stopPropagation(); handleDeleteItem(item.id); }}
              className="p-1 hover:bg-red-50 text-slate-400 hover:text-red-600 rounded transition-colors"
              title="Löschen"
            >
              <Trash2 size={12} />
            </button>
          </div>
        </div>

        {/* Recursive folder children rendering */}
        {isFolder && isExpanded && item.children && item.children.map(child => renderItemRow(child, depth + 1))}
      </div>
    );
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-slate-100 text-slate-800 relative">
      
      {/* 1. Header with metadata and command line shortcut search */}
      <div className="bg-white border-b border-slate-300 p-4 shrink-0 flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Sparkles size={18} className="text-yellow-500 fill-yellow-100" />
              Navigations- & Menü-Designer
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Definieren Sie Icons, AD-Rollen mapping, i18n Übersetzungen, dynamische Live-Badges und tastaturbereite Command Paletten.
            </p>
          </div>
          
          <div className="flex items-center gap-2">
            <button 
              onClick={() => setIsCommandPaletteOpen(true)}
              className="flex items-center gap-2 px-3 py-1.5 bg-slate-50 border border-slate-300 hover:bg-slate-100 text-xs font-semibold rounded-lg text-slate-600 transition-all shadow-sm cursor-pointer"
              title="Cmd + K oder STRG + K drücken"
            >
              <Command size={14} className="text-slate-500" />
              <span>Suche Palette</span>
              <span className="hidden sm:inline bg-slate-200 text-slate-500 text-[10px] px-1.5 py-0.5 rounded font-mono">Strg + K</span>
            </button>
            <button 
              onClick={addFolder}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-sky-50 border border-sky-300 text-sky-700 hover:bg-sky-100 text-xs font-bold rounded-lg transition-colors cursor-pointer"
            >
              <FolderPlus size={14} />
              Ordner
            </button>
            <button 
              onClick={addCustomLink}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 border border-emerald-300 text-emerald-700 hover:bg-emerald-100 text-xs font-bold rounded-lg transition-colors cursor-pointer"
            >
              <Plus size={14} />
              Eigene Seite
            </button>
          </div>
        </div>

        {/* Phase 3 UI Powerup: Layout styles selector */}
        <div className="border-t border-slate-200 pt-3 flex flex-col md:flex-row md:items-center gap-3">
          <span className="text-xs font-bold text-slate-700 flex items-center gap-2">
            <Layers size={14} className="text-sky-500" />
            Shell-Layout Preset (Navigationstyp):
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => handleLayoutChange('sidebar')}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold rounded-lg border transition-all cursor-pointer ${
                selectedLayout === 'sidebar' 
                  ? 'bg-sky-600 border-sky-700 text-white shadow' 
                  : 'bg-white border-slate-300 hover:bg-slate-50 text-slate-700'
              }`}
            >
              <Database size={13} />
              Modern Sidebar
            </button>
            <button
              onClick={() => handleLayoutChange('top_nav')}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold rounded-lg border transition-all cursor-pointer ${
                selectedLayout === 'top_nav' 
                  ? 'bg-sky-600 border-sky-700 text-white shadow' 
                  : 'bg-white border-slate-300 hover:bg-slate-50 text-slate-700'
              }`}
            >
              <Sliders size={13} />
              Top Navigation Dropdown
            </button>
            <button
              onClick={() => handleLayoutChange('double_rail')}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold rounded-lg border transition-all cursor-pointer ${
                selectedLayout === 'double_rail' 
                  ? 'bg-sky-600 border-sky-700 text-white shadow' 
                  : 'bg-white border-slate-300 hover:bg-slate-50 text-slate-700'
              }`}
            >
              <Layers size={13} />
              Double Rail
            </button>
          </div>
        </div>
      </div>

      {/* Main Content Areas split 3 columns: Left toolbox, Center canvas, Right properties */}
      <div className="flex-1 flex overflow-hidden min-h-0">
        
        {/* Left Toolbox: Unmapped elements to add */}
        <div className="w-80 border-r border-slate-300 bg-slate-50 flex flex-col shrink-0 overflow-y-auto">
          <div className="p-3 border-b border-slate-200 bg-white sticky top-0 z-10">
            <span className="font-bold text-xs text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
              <Plus size={14} className="text-slate-500" />
              Verfügbare Objekte
            </span>
          </div>

          {/* Tables sub-list */}
          <div className="p-3 border-b border-slate-200 bg-white">
            <span className="font-bold text-[11px] text-slate-500 flex items-center gap-1">
              <Database size={12} />
              Datenbank-Tabellen ({tables.length})
            </span>
            <div className="flex flex-col gap-1 mt-1.5">
              {tables.map(t => (
                <button
                  key={t.id}
                  onClick={() => handleAddToolboxItem('table', t)}
                  className="w-full text-left p-2 rounded border border-slate-200 bg-slate-50 hover:bg-sky-50 hover:border-sky-300 text-xs flex items-center justify-between transition-colors group cursor-pointer"
                >
                  <span className="font-mono text-slate-700 group-hover:text-sky-900 font-medium truncate">{t.name}</span>
                  <Plus size={10} className="text-slate-400 group-hover:text-sky-600" />
                </button>
              ))}
            </div>
          </div>

          {/* Queries sub-list */}
          <div className="p-3 border-b border-slate-200 bg-white">
            <span className="font-bold text-[11px] text-slate-500 flex items-center gap-1">
              <Search size={12} />
              Abfragen ({queries.length})
            </span>
            <div className="flex flex-col gap-1 mt-1.5">
              {queries.length === 0 ? (
                <span className="text-[10px] text-slate-400 italic">Keine Abfragen erstellt</span>
              ) : (
                queries.map(q => (
                  <button
                    key={q.id}
                    onClick={() => handleAddToolboxItem('query', q)}
                    className="w-full text-left p-2 rounded border border-slate-200 bg-slate-50 hover:bg-sky-50 hover:border-sky-300 text-xs flex items-center justify-between transition-colors group cursor-pointer"
                  >
                    <span className="font-mono text-slate-700 group-hover:text-sky-900 font-medium truncate">{q.name}</span>
                    <Plus size={10} className="text-slate-400 group-hover:text-sky-600" />
                  </button>
                ))
              )}
            </div>
          </div>

          {/* Forms sub-list */}
          <div className="p-3 border-b border-slate-200 bg-white">
            <span className="font-bold text-[11px] text-slate-500 flex items-center gap-1">
              <Frame size={12} />
              Formulare ({forms.length})
            </span>
            <div className="flex flex-col gap-1 mt-1.5">
              {forms.length === 0 ? (
                <span className="text-[10px] text-slate-400 italic">Keine Formulare erstellt</span>
              ) : (
                forms.map(f => (
                  <button
                    key={f.id}
                    onClick={() => handleAddToolboxItem('form', f)}
                    className="w-full text-left p-2 rounded border border-slate-200 bg-slate-50 hover:bg-sky-50 hover:border-sky-300 text-xs flex items-center justify-between transition-colors group cursor-pointer"
                  >
                    <span className="text-slate-700 group-hover:text-sky-900 font-medium truncate">{f.name}</span>
                    <Plus size={10} className="text-slate-400 group-hover:text-sky-600" />
                  </button>
                ))
              )}
            </div>
          </div>

          {/* Reports sub-list */}
          <div className="p-3 bg-white">
            <span className="font-bold text-[11px] text-slate-500 flex items-center gap-1">
              <FileText size={12} />
              Berichte ({reports.length})
            </span>
            <div className="flex flex-col gap-1 mt-1.5">
              {reports.length === 0 ? (
                <span className="text-[10px] text-slate-400 italic">Keine Berichte erstellt</span>
              ) : (
                reports.map(r => (
                  <button
                    key={r.id}
                    onClick={() => handleAddToolboxItem('report', r)}
                    className="w-full text-left p-2 rounded border border-slate-200 bg-slate-50 hover:bg-sky-50 hover:border-sky-300 text-xs flex items-center justify-between transition-colors group cursor-pointer"
                  >
                    <span className="text-slate-700 group-hover:text-sky-900 font-medium truncate">{r.name}</span>
                    <Plus size={10} className="text-slate-400 group-hover:text-sky-600" />
                  </button>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Center Canvas: Menu tree structure with drag & move order mapping */}
        <div className="flex-1 flex flex-col bg-slate-100 overflow-y-auto">
          <div className="p-3 border-b border-slate-200 bg-white shrink-0">
            <span className="font-bold text-xs text-slate-700 uppercase tracking-wider">
              Aktive Navigationsleiste (Sidebar-Baum)
            </span>
          </div>

          <div className="flex-1 p-4 flex flex-col">
            {menuItems.length === 0 ? (
              <div className="my-auto p-12 text-center max-w-sm mx-auto border-2 border-dashed border-slate-300 rounded-xl bg-white shadow">
                <ShieldAlert className="mx-auto text-slate-400 mb-2" size={32} />
                <span className="text-sm font-bold block text-slate-700">Navigations-Menü ist leer</span>
                <span className="text-xs text-slate-500 mt-1 block">Fügen Sie Ordner oder vorhandene Seiten über das linke Panel hinzu oder klicken Sie oben auf „Eigene Seite“.</span>
              </div>
            ) : (
              <div className="flex flex-col gap-0.5 max-w-3xl w-full mx-auto bg-slate-50 p-3 rounded-xl border border-slate-200 shadow-sm min-h-[400px]">
                {menuItems.map(item => renderItemRow(item, 0))}

                {/* Drop zone to move folder files back to root */}
                <div 
                  onClick={() => selectedItemId && handleUpdateItems(moveItemToFolder(selectedItemId, null, menuItems))}
                  className="mt-auto border border-dashed border-slate-200 hover:border-sky-300 hover:bg-sky-50/50 p-2.5 rounded-lg text-center text-[10px] text-slate-400 hover:text-sky-700 cursor-pointer select-none font-medium"
                >
                  Klicken Sie hier, um das ausgewählte Menüelement auf die Hauptebene (Root) zu verschieben
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Inspector: Property fields editor */}
        <div className="w-80 border-l border-slate-300 bg-white flex flex-col shrink-0 overflow-y-auto">
          
          {/* Header tabs */}
          <div className="p-2 border-b border-slate-200 bg-slate-50 flex items-center justify-between shrink-0">
            <button
              onClick={() => setInspectorTab('general')}
              className={`flex-1 py-2 text-center text-xs font-bold transition-all ${
                inspectorTab === 'general' ? 'bg-white text-slate-800 border-b-2 border-slate-800 font-extrabold shadow-sm rounded-t' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              Allgemein
            </button>
            <button
              onClick={() => setInspectorTab('power_ups')}
              className={`flex-1 py-1 px-1 text-center text-[11px] font-bold transition-all relative ${
                inspectorTab === 'power_ups' ? 'bg-white text-purple-900 border-b-2 border-purple-600 font-extrabold shadow-sm rounded-t' : 'text-slate-500 hover:text-purple-600'
              }`}
            >
              <Sparkles className="inline mr-1 text-yellow-500 fill-yellow-200" size={12} />
              Power-Ups
            </button>
          </div>

          {selectedItem ? (
            <div className="p-4 flex flex-col gap-4">
              
              {inspectorTab === 'general' ? (
                <>
                  {/* Name/Title */}
                  <div className="flex flex-col gap-1">
                    <label className="text-xs font-bold text-slate-600">Menü-Beschriftung (Label)</label>
                    <input 
                      type="text" 
                      value={selectedItem.title} 
                      onChange={(e) => handleUpdateItems(updateItemInTree(selectedItem.id, { title: e.target.value }, menuItems))}
                      className="w-full text-xs p-2 rounded-lg border border-slate-300 bg-white text-slate-800 outline-none focus:border-sky-500"
                    />
                  </div>

                  {/* Path/Route */}
                  <div className="flex flex-col gap-1">
                    <label className="text-xs font-bold text-slate-600">Routen-Pfad (Relative URL)</label>
                    <input 
                      type="text" 
                      value={selectedItem.route} 
                      disabled={selectedItem.type === 'folder'}
                      onChange={(e) => handleUpdateItems(updateItemInTree(selectedItem.id, { route: e.target.value }, menuItems))}
                      className={`w-full text-xs p-2 rounded-lg border text-slate-800 outline-none focus:border-sky-500 ${selectedItem.type === 'folder' ? 'bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed' : 'bg-white border-slate-300'}`}
                    />
                  </div>

                  {/* Target folder drop picker if another item is selected */}
                  {(selectedItem.type === 'page' || selectedItem.type === 'folder') && (
                    <div className="flex flex-col gap-1">
                      <label className="text-xs font-bold text-slate-600">Übergeordneter Ordner</label>
                      <select
                        className="w-full text-xs p-2 bg-white rounded-lg border border-slate-300 outline-none focus:border-sky-500 text-slate-800"
                        onChange={(e) => {
                          const targetId = e.target.value === 'root' ? null : e.target.value;
                          const updated = moveItemToFolder(selectedItem.id, targetId, menuItems);
                          handleUpdateItems(updated);
                        }}
                        value={findParentFolderId(selectedItem.id, menuItems)}
                      >
                        <option value="root">Hauptmenü (Hauptebene)</option>
                        {getAllFolders(menuItems)
                          .filter(({ folder }) => {
                            if (folder.id === selectedItem.id) return false;
                            if (selectedItem.type === 'folder' && isDescendantOf(selectedItem.id, folder.id, menuItems)) return false;
                            return true;
                          })
                          .map(({ folder, depth }) => (
                            <option key={folder.id} value={folder.id}>
                              {'\u00A0'.repeat(depth * 3)} {depth > 0 ? '↳ ' : ''}{folder.title}
                            </option>
                          ))}
                      </select>
                    </div>
                  )}

                  {/* Icon Selector list grid */}
                  <div className="flex flex-col gap-1">
                    <label className="text-xs font-bold text-slate-600 mb-1">Menü-Symbol (Icon)</label>
                    <div className="grid grid-cols-4 gap-1.5 max-h-48 overflow-y-auto p-2 bg-slate-50 border border-slate-200 rounded-lg">
                      {AVAILABLE_ICONS.map(i => {
                        const isSelected = selectedItem.icon === i.name;
                        return (
                          <button
                            key={i.name}
                            onClick={() => handleUpdateItems(updateItemInTree(selectedItem.id, { icon: i.name }, menuItems))}
                            className={`p-2 rounded-lg border transition-all flex flex-col items-center justify-center gap-1 cursor-pointer ${
                              isSelected 
                                ? 'bg-sky-100 border-sky-400 text-sky-800 shadow-sm' 
                                : 'bg-white border-slate-200 hover:border-slate-300 text-slate-500'
                            }`}
                            title={i.label}
                          >
                            <i.icon size={16} />
                            <span className="text-[8px] truncate max-w-full text-slate-500">{i.label}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Roles & Userlevel Permissions matrix checkbox selection */}
                  <div className="flex flex-col gap-1.5 border-t border-slate-200 pt-3">
                    <span className="text-xs font-bold text-slate-700 flex items-center gap-1">
                      <UserCheck size={14} className="text-slate-500" />
                      Sichtbarkeit & Rollen (Userlevels)
                    </span>
                    <p className="text-[10px] text-slate-400 leading-normal font-medium text-slate-500 mb-1">
                      Zuweisung der Sichtbarkeit an Admin, Editor, etc.
                    </p>

                    <div className="flex flex-col gap-1 bg-slate-50 border border-slate-200 rounded-lg p-2.5">
                      {availableRoles.map(role => {
                        const isChecked = selectedItem.requiredRoles.includes(role);
                        return (
                          <label 
                            key={role} 
                            className="flex items-center gap-2 py-1 px-1.5 rounded hover:bg-slate-200/50 cursor-pointer select-none text-xs text-slate-700 font-medium"
                          >
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={() => {
                                const current = [...selectedItem.requiredRoles];
                                const next = checked => {
                                  if (checked) {
                                    return [...current, role];
                                  } else {
                                    return current.filter(r => r !== role);
                                  }
                                };
                                const updatedRoles = next(!isChecked);
                                handleUpdateItems(updateItemInTree(selectedItem.id, { requiredRoles: updatedRoles }, menuItems));
                              }}
                              className="rounded text-sky-600 focus:ring-sky-500 w-3.5 h-3.5"
                            />
                            <span className="truncate">{role}</span>
                          </label>
                        );
                      })}
                    </div>
                  </div>
                </>
              ) : (
                <>
                  {/* Category: 1. Live Badge Engine */}
                  <div className="flex flex-col gap-2 bg-purple-50 rounded-xl border border-purple-200 p-3.5">
                    <span className="text-xs font-extrabold text-purple-950 flex items-center gap-1">
                      <Sparkles size={14} className="text-purple-600 text-yellow-500 fill-yellow-200 animate-pulse" />
                      Live-Badge Engine
                    </span>
                    <p className="text-[10px] text-purple-700/80 leading-normal">
                      Verknüpfen Sie das Menü mit einem dynamischen Zähler (z. B. unfertige Tickets, Aufgaben oder Fehler-Records), um im Frontend ein Warn-Badge anzuzeigen.
                    </p>

                    <div className="flex flex-col gap-1 mt-1.5">
                      <label className="text-[10px] font-bold text-purple-950 uppercase">SQL Count-Abfrage oder Endpoint</label>
                      <input 
                        type="text" 
                        placeholder="Z. B. SELECT COUNT(*) FROM Bestelleingang WHERE Offen = 1" 
                        value={selectedItem.badgeCountQuery || ''} 
                        onChange={(e) => handleUpdateItems(updateItemInTree(selectedItem.id, { badgeCountQuery: e.target.value }, menuItems))}
                        className="w-full text-xs p-2 rounded-lg border border-purple-300 bg-white text-slate-800 outline-none focus:border-purple-500"
                      />
                    </div>
                  </div>

                  {/* Category: 2. Internationalization */}
                  <div className="flex flex-col gap-2 bg-teal-50 rounded-xl border border-teal-200 p-3.5 mt-2">
                    <span className="text-xs font-extrabold text-teal-950 flex items-center gap-1">
                      <Globe size={14} className="text-teal-600" />
                      Mehrsprachigkeit (i18n Translation)
                    </span>
                    <p className="text-[10px] text-teal-700/80 leading-normal">
                      Pflegen Sie Übersetzungen direkt in der UI. Bei Klick wird automatisch die entsprechende Sprachdatei (de.json, en.json etc.) angelegt.
                    </p>

                    <div className="flex flex-col gap-2 mt-1.5">
                      {/* German */}
                      <div className="flex flex-col gap-0.5">
                        <span className="text-[9px] font-bold text-teal-950">DEUTSCH (DE)</span>
                        <input 
                          type="text" 
                          placeholder="Z. B. Dashboard" 
                          value={selectedItem.translations?.de || ''} 
                          onChange={(e) => {
                            const currentTrans = selectedItem.translations || {};
                            handleUpdateItems(updateItemInTree(selectedItem.id, { 
                              translations: { ...currentTrans, de: e.target.value } 
                            }, menuItems));
                          }}
                          className="w-full text-xs p-1.5 rounded-lg border border-teal-300 bg-white text-slate-800 outline-none"
                        />
                      </div>

                      {/* English */}
                      <div className="flex flex-col gap-0.5">
                        <span className="text-[9px] font-bold text-teal-950">ENGLISH (EN)</span>
                        <input 
                          type="text" 
                          placeholder="Z. B. Cockpit / Workspace" 
                          value={selectedItem.translations?.en || ''} 
                          onChange={(e) => {
                            const currentTrans = selectedItem.translations || {};
                            handleUpdateItems(updateItemInTree(selectedItem.id, { 
                              translations: { ...currentTrans, en: e.target.value } 
                            }, menuItems));
                          }}
                          className="w-full text-xs p-1.5 rounded-lg border border-teal-300 bg-white text-slate-800 outline-none"
                        />
                      </div>

                      {/* French */}
                      <div className="flex flex-col gap-0.5">
                        <span className="text-[9px] font-bold text-teal-950">FRANÇAIS (FR)</span>
                        <input 
                          type="text" 
                          placeholder="Z. B. Tableau de bord" 
                          value={selectedItem.translations?.fr || ''} 
                          onChange={(e) => {
                            const currentTrans = selectedItem.translations || {};
                            handleUpdateItems(updateItemInTree(selectedItem.id, { 
                              translations: { ...currentTrans, fr: e.target.value } 
                            }, menuItems));
                          }}
                          className="w-full text-xs p-1.5 rounded-lg border border-teal-300 bg-white text-slate-800 outline-none"
                        />
                      </div>
                    </div>
                  </div>
                </>
              )}

            </div>
          ) : (
            <div className="p-8 text-center text-slate-400 my-auto">
              <HelpCircle className="mx-auto mb-1 text-slate-300" size={24} />
              <span className="text-xs">Wählen Sie ein Navigations-Element aus dem Baum aus, um die Eigenschaften (Titel, Route, AD-Gruppen und Rollensichtbarkeit) anzupassen.</span>
            </div>
          )}
        </div>

      </div>

      {/* COMMAND PALETTE POPUP PREVIEW MODAL */}
      {isCommandPaletteOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-fade-in">
          <div className="bg-white rounded-2xl border border-slate-300 w-full max-w-xl shadow-2xl overflow-hidden flex flex-col max-h-[460px] animate-scale-up">
            
            {/* Search Input area */}
            <div className="p-4 border-b border-slate-200 flex items-center gap-3 bg-slate-50 sticky top-0">
              <Command size={18} className="text-slate-500 animate-spin" />
              <input 
                type="text" 
                placeholder="Suche nach Tabellen, Berichten, Formularen, Custom Pages..." 
                value={commandSearch}
                onChange={e => setCommandSearch(e.target.value)}
                className="w-full bg-transparent text-sm text-slate-800 placeholder-slate-400 outline-none font-medium"
                autoFocus
              />
              <button 
                onClick={() => setIsCommandPaletteOpen(false)}
                className="text-xs text-slate-400 hover:text-slate-600 bg-slate-200 border border-slate-300 rounded-lg px-2 py-1 font-mono cursor-pointer"
              >
                ESC
              </button>
            </div>

            {/* Simulated Search Results */}
            <div className="flex-1 overflow-y-auto p-2 space-y-0.5">
              <span className="text-[10px] uppercase tracking-wider font-extrabold text-slate-400 px-3 py-1.5 block">
                Command Palette Link Index ({filteredSearchList.length} Resultate gefunden)
              </span>

              {filteredSearchList.length === 0 ? (
                <div className="p-8 text-center text-slate-400 text-xs">
                  Keine passenden Seiten oder Menüpfade für "{commandSearch}" gefunden.
                </div>
              ) : (
                filteredSearchList.map(it => {
                  const isFolder = it.type === 'folder';
                  return (
                    <button
                      key={it.id}
                      onClick={() => {
                        setIsCommandPaletteOpen(false);
                        showMessage("Navigation Trigger", `Power Palette leitet weiter zu: ${it.route} (Rollenbeschränkung: [${it.requiredRoles.join(', ')}])`, "success");
                      }}
                      className="w-full text-left p-2.5 rounded-xl hover:bg-sky-50 flex items-center justify-between border border-transparent hover:border-sky-200 group transition-all duration-150 cursor-pointer"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        {renderIconComponent(it.icon, 16, 'text-slate-400 group-hover:text-sky-600')}
                        <div className="flex flex-col min-w-0">
                          <span className="text-xs font-semibold text-slate-800 group-hover:text-sky-950 truncate">{it.title}</span>
                          <span className="text-[10px] text-slate-400 font-mono italic truncate">{it.route}</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-1 shrink-0">
                        {it.requiredRoles.map(role => (
                          <span key={role} className="text-[8px] bg-slate-100 border border-slate-200 px-1 py-0.5 rounded font-mono font-bold text-slate-600">
                            {role}
                          </span>
                        ))}
                        <span className="text-[11px] font-bold text-sky-600 opacity-0 group-hover:opacity-100 transition-opacity ml-2">Öffnen ↵</span>
                      </div>
                    </button>
                  );
                })
              )}
            </div>

            {/* Footer usage tip */}
            <div className="bg-slate-50 border-t border-slate-100 p-2 text-center text-[10px] text-slate-400 font-medium">
              Tipp: Navigieren Sie blitzschnell im generierten Workspace mit der vollautomatischen Command Palette!
            </div>
            
          </div>
        </div>
      )}

    </div>
  );
};
