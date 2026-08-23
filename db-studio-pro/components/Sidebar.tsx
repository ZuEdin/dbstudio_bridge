
import React, { useState, useMemo } from 'react';
import { Table, Report } from '../types/index';
import { Table as TableIcon, Search, FileText, Layout, ChevronDown, ChevronRight, Database, MoreHorizontal, PanelLeftClose, PanelLeftOpen, Folder, FolderOpen, Globe, BarChart2, Briefcase, GitFork, CalendarClock, LayoutTemplate, Server, Cloud, CheckSquare, History } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useProjectStore } from '../stores/useProjectStore';
import { useUIStore } from '../stores/useUIStore';

interface TreeNode<T> {
  id: string;
  item: T;
  displayName: string;
  children: TreeNode<T>[];
  isVirtual?: boolean;
}

interface RenderNodeProps {
  node: TreeNode<any>; 
  icon: any; 
  colorClass: string; 
  bgClass: string;
  onSelect: ((id: string) => void) | undefined; 
  type: 'table' | 'query' | 'report' | 'form' | 'chart' | 'workflow' | 'page'; 
  openFolders: Record<string, boolean>;
  toggleFolder: (id: string) => void;
  onItemContextMenu: (e: React.MouseEvent, type: 'table' | 'query' | 'report' | 'form' | 'chart' | 'workflow' | 'page', id: string) => void;
  handleDragStart: (e: React.DragEvent, type: 'table' | 'query', id: string) => void;
}

const RenderNode: React.FC<RenderNodeProps> = ({ 
  node, icon: DefaultIcon, colorClass, bgClass, onSelect, type,
  openFolders, toggleFolder, onItemContextMenu, handleDragStart
}) => {
  const getIcon = (n: TreeNode<any>) => {
      if (type === 'table' && (n.item as Table).isApiImport) return Globe;
      if (type === 'report' && (n.item as Report).sourceType === 'dashboard') return LayoutTemplate;
      return DefaultIcon;
  };

  const hasChildren = node.children && node.children.length > 0;
  
  const renderItem = (n: TreeNode<any>, overrideName?: string) => (
    <div className={`flex items-center justify-between px-2 py-1 ${bgClass} hover:brightness-95 dark:hover:brightness-110 rounded text-sm text-slate-700 dark:text-slate-300 group relative`}>
      <div
        className="flex items-center gap-2 flex-grow cursor-pointer truncate"
        onClick={() => onSelect && onSelect(n.id)}
        draggable={type === 'table' || type === 'query'}
        onDragStart={(e) => (type === 'table' || type === 'query') && handleDragStart(e, type, n.id)}
      >
        {(() => {
            const DynamicIcon = getIcon(n);
            return <DynamicIcon size={14} className={`${type === 'table' && (n.item as Table).isApiImport ? 'text-blue-600 dark:text-blue-400' : colorClass} flex-shrink-0`} />;
        })()}
        <span className="truncate" title={n.item.name}>{overrideName || n.displayName}</span>
        {type === 'page' && (n.item as any).isSubpage && (
          <span className="ml-1.5 px-1.5 py-0.5 bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 text-[9px] rounded font-semibold flex-shrink-0">Sub</span>
        )}
      </div>
      <button 
        type="button"
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          onItemContextMenu(e, type, n.id);
        }} 
        className="opacity-0 group-hover:opacity-100 text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 p-0.5 rounded flex-shrink-0"
      >
        <MoreHorizontal size={16} />
      </button>
    </div>
  );

  if (!hasChildren) {
    return renderItem(node);
  }

  const isOpen = openFolders[node.id] !== false; 
  
  // Calculate total descendants to show in badge
  const countDescendants = (n: TreeNode<any>): number => {
     return 1 + n.children.reduce((acc, current) => acc + countDescendants(current), 0);
  };

  return (
    <div className="mb-1">
      <div 
        className="flex items-center gap-1 px-1 py-1 hover:bg-slate-200 rounded cursor-pointer text-xs font-bold text-slate-600 select-none"
        onClick={() => toggleFolder(node.id)}
      >
        {isOpen ? <FolderOpen size={14} className="text-blue-400" /> : <Folder size={14} className="text-blue-400" />}
        <span className="truncate">{node.displayName}</span>
        <span className="ml-auto text-[9px] bg-slate-200 px-1 rounded-full text-slate-500 flex-shrink-0">{countDescendants(node)}</span>
      </div>
      {isOpen && (
        <div className="ml-3 pl-2 border-l border-slate-300 space-y-0.5 mt-0.5">
          {!node.isVirtual && renderItem(node, node.item.name)}
          {node.children.map((child, i) => (
            <RenderNode
              key={child.id + '_' + i}
              node={child}
              icon={DefaultIcon}
              colorClass={colorClass}
              bgClass={bgClass}
              onSelect={onSelect}
              type={type}
              openFolders={openFolders}
              toggleFolder={toggleFolder}
              onItemContextMenu={onItemContextMenu}
              handleDragStart={handleDragStart}
            />
          ))}
        </div>
      )}
    </div>
  );
};

interface SidebarProps {
  onSetView: (view: any) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ onSetView }) => {
  const tables = useProjectStore(state => state.tables);
  const queries = useProjectStore(state => state.queries);
  const reports = useProjectStore(state => state.reports);
  const forms = useProjectStore(state => state.forms);
  const charts = useProjectStore(state => state.charts);
  const workflows = useProjectStore(state => state.workflows);
  const pages = useProjectStore(state => state.pages);
  const ui = useUIStore();
  
  const { isSidebarOpen: isOpen, setIsSidebarOpen: toggleSidebar, setItemContextMenu } = ui;

  const onSelectTable = (id: string) => onSetView({ type: 'table_data', tableId: id });
  const onSelectQuery = (id: string) => onSetView({ type: 'query_results', queryId: id });
  const onSelectReport = (id: string) => onSetView({ type: 'report_view', reportId: id });
  const onSelectForm = (id: string) => onSetView({ type: 'form_view', formId: id });
  const onSelectChart = (id: string) => onSetView({ type: 'chart_view', chartId: id });
  const onSelectWorkflow = (id: string) => onSetView({ type: 'workflow_designer', workflowId: id });
  const onSelectPage = (id: string) => onSetView({ type: 'page_designer', pageId: id });
  const onSelectScheduler = () => onSetView({ type: 'scheduler' });
  const onSelectDbstudioBackend = () => onSetView({ type: 'dbstudio_backend' });
  
  const onItemContextMenu = (e: React.MouseEvent, type: any, id: string) => {
      e.preventDefault();
      setItemContextMenu({ type, id, x: e.clientX, y: e.clientY });
  };

  const [openGroups, setOpenGroups] = useState(() => {
    try {
      const saved = localStorage.getItem('sidebar_openGroups');
      if (saved) return JSON.parse(saved);
    } catch(e) {}
    return { tables: true, queries: true, reports: true, forms: true, charts: true, workflows: true, pages: true, infrastructure: true };
  });
  
  const [openFolders, setOpenFolders] = useState<Record<string, boolean>>(() => {
    try {
      const saved = localStorage.getItem('sidebar_openFolders');
      if (saved) return JSON.parse(saved);
    } catch(e) {}
    return {};
  });
  const { t } = useTranslation();

  const toggleGroup = (group: keyof typeof openGroups) => {
    setOpenGroups(prev => {
        const next = { ...prev, [group]: !prev[group] };
        localStorage.setItem('sidebar_openGroups', JSON.stringify(next));
        return next;
    });
  };

  const toggleFolder = (folderId: string) => {
    setOpenFolders(prev => {
        const next = { ...prev, [folderId]: !prev[folderId] };
        localStorage.setItem('sidebar_openFolders', JSON.stringify(next));
        return next;
    });
  };

  const handleDragStart = (e: React.DragEvent, type: 'table' | 'query', id: string) => {
    e.dataTransfer.setData('application/json', JSON.stringify({ type, id }));
    e.dataTransfer.effectAllowed = 'copy';
  };

  const buildRecursiveTree = <T extends { id: string; name: string }>(items: T[]): TreeNode<T>[] => {
    if (!Array.isArray(items)) return [];
    const sorted = [...items].sort((a, b) => (a?.name || '').localeCompare(b?.name || ''));
    
    const nodes = sorted.map(item => ({
        id: item.id,
        item,
        displayName: item.name,
        children: [],
        isVirtual: false,
        parentId: null as string | null
    }));

    const prefixCounts = new Map<string, number>();
    nodes.forEach(node => {
        const parts = node.item.name.split('_');
        let current = '';
        for(let i=0; i<parts.length-1; i++){
            current += (i===0 ? '' : '_') + parts[i];
            prefixCounts.set(current, (prefixCounts.get(current) || 0) + 1);
        }
    });

    const exactNames = new Set(nodes.map(n => n.item.name));
    const validPrefixes = new Set<string>();
    for (const [prefix, count] of prefixCounts.entries()) {
        if (count > 1 || exactNames.has(prefix) || exactNames.has(prefix + 's')) {
            validPrefixes.add(prefix);
        }
    }

    const sortedPrefixes = Array.from(validPrefixes).sort((a,b) => b.length - a.length);

    const virtualFolders = new Map<string, TreeNode<T>>();
    const exactNodes = new Map(nodes.map(n => [n.item.name, n]));

    sortedPrefixes.forEach(prefix => {
        if (!exactNodes.has(prefix) && !exactNodes.has(prefix + 's')) {
            virtualFolders.set(prefix, {
                id: 'virt_' + prefix,
                item: { name: prefix } as unknown as T,
                displayName: prefix,
                children: [],
                isVirtual: true,
                parentId: null
            } as TreeNode<T> & { isVirtual: boolean, parentId: string | null });
        }
    });

    const resolveNode = (prefix: string) => {
        if (exactNodes.has(prefix)) return exactNodes.get(prefix);
        if (exactNodes.has(prefix + 's')) return exactNodes.get(prefix + 's');
        return virtualFolders.get(prefix);
    };

    nodes.forEach(childNode => {
        let bestPrefix = null;
        for (const prefix of sortedPrefixes) {
            if (childNode.item.name.startsWith(prefix + '_')) {
                bestPrefix = prefix;
                break;
            }
        }
        
        if (bestPrefix) {
            const parent = resolveNode(bestPrefix);
            if (parent) {
                parent.children.push(childNode);
                const prefixStr = bestPrefix + '_';
                if (childNode.item.name.startsWith(prefixStr)) {
                    childNode.displayName = childNode.item.name.slice(prefixStr.length);
                }
                childNode.parentId = parent.id;
            }
        }
    });

    const allVirtuals = Array.from(virtualFolders.values()) as (TreeNode<T> & { isVirtual?: boolean, parentId?: string | null })[];
    allVirtuals.forEach(virtNode => {
        let bestPrefix = null;
        for (const prefix of sortedPrefixes) {
            if (virtNode.item.name !== prefix && virtNode.item.name.startsWith(prefix + '_')) {
                bestPrefix = prefix;
                break;
            }
        }
        if (bestPrefix) {
            const parent = resolveNode(bestPrefix);
            if (parent) {
                parent.children.push(virtNode);
                const prefixStr = bestPrefix + '_';
                if (virtNode.item.name.startsWith(prefixStr)) {
                    virtNode.displayName = virtNode.item.name.slice(prefixStr.length);
                }
                virtNode.parentId = parent.id;
            }
        }
    });

    let changed = true;
    while (changed) {
       changed = false;
       for (const virt of allVirtuals) {
           if (virt.isVirtual && virt.children.length === 1) {
               const child = virt.children[0] as TreeNode<T> & { isVirtual?: boolean, parentId?: string | null };
               if (virt.parentId) {
                   const parent = exactNodes.has(virt.parentId) ? exactNodes.get(virt.parentId) : virtualFolders.get(virt.parentId.replace('virt_', ''));
                   if (parent && parent !== virt) {
                       parent.children = parent.children.filter(c => c.id !== virt.id);
                       parent.children.push(child);
                       child.parentId = parent.id;
                       child.displayName = virt.displayName + '_' + child.displayName;
                       virt.children = [];
                       changed = true;
                   }
               } else {
                   child.parentId = null;
                   child.displayName = virt.item.name + '_' + child.displayName;
                   virt.children = [];
                   changed = true;
               }
           }
       }
    }

    const forest: TreeNode<T>[] = [];
    nodes.filter(n => !n.parentId).forEach(n => forest.push(n));
    allVirtuals.filter(n => !n.parentId && n.children.length > 0).forEach(n => forest.push(n));

    const sortNodes = (arr: TreeNode<T>[]) => {
        arr.sort((a,b) => a.displayName.localeCompare(b.displayName));
        arr.forEach(n => sortNodes(n.children));
    };
    sortNodes(forest);

    return forest;
  };

  const groupedTables = useMemo(() => buildRecursiveTree(tables || []), [tables]);
  const groupedQueries = useMemo(() => buildRecursiveTree(queries || []), [queries]);
  const groupedReports = useMemo(() => buildRecursiveTree(reports || []), [reports]);
  const groupedForms = useMemo(() => buildRecursiveTree(forms || []), [forms]);
  const groupedCharts = useMemo(() => buildRecursiveTree(charts || []), [charts]);
  const groupedWorkflows = useMemo(() => buildRecursiveTree(workflows || []), [workflows]);
  
  const visiblePages = useMemo(() => {
    return pages || [];
  }, [pages]);
  const groupedPages = useMemo(() => buildRecursiveTree(visiblePages), [visiblePages]);

  if (!isOpen) {
    return (
      <div className="w-8 bg-slate-50 border-r border-slate-300 flex flex-col items-center py-2 select-none">
        <button onClick={() => toggleSidebar(true)} title="Seitenleiste einblenden" className="p-1 hover:bg-slate-200 rounded text-slate-600">
          <PanelLeftOpen size={20} />
        </button>
        <div className="mt-4 flex flex-col gap-4 text-slate-400">
           <Database size={16} />
        </div>
      </div>
    );
  }

  return (
    <div className="w-64 bg-slate-50 dark:bg-slate-900 border-r border-slate-300 dark:border-slate-800 flex flex-col h-full select-none transition-all duration-300">
      <div className="p-2 bg-slate-200 dark:bg-slate-800 border-b border-slate-300 dark:border-slate-800 font-bold text-slate-700 dark:text-slate-200 text-sm flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Database size={16} />
          <span>{t('sidebar.all_objects')}</span>
        </div>
        <button onClick={() => toggleSidebar(false)} className="text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 p-0.5 rounded">
           <PanelLeftClose size={16} />
        </button>
      </div>
      
      <div className="flex-1 overflow-y-auto p-2 space-y-2">
        {/* Tables */}
        <div>
          <button onClick={() => toggleGroup('tables')} className="w-full flex items-center gap-1 text-xs font-bold text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800 px-1 py-1 rounded">
            {openGroups.tables ? <ChevronDown size={14} /> : <ChevronRight size={14} />} {t('sidebar.tables')}
          </button>
          {openGroups.tables && (
            <div className="ml-2 mt-1 space-y-1">
              {groupedTables.map((g, i) => <RenderNode key={'t_'+g.id+'_'+i} node={g} icon={TableIcon} colorClass="text-orange-600 dark:text-orange-400" bgClass="hover:bg-orange-100 dark:hover:bg-orange-950/30 hover:text-orange-900 dark:hover:text-orange-200" onSelect={onSelectTable} type="table" openFolders={openFolders} toggleFolder={toggleFolder} onItemContextMenu={onItemContextMenu} handleDragStart={handleDragStart} />)}
            </div>
          )}
        </div>

        {/* Queries */}
        <div>
          <button onClick={() => toggleGroup('queries')} className="w-full flex items-center gap-1 text-xs font-bold text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800 px-1 py-1 rounded">
            {openGroups.queries ? <ChevronDown size={14} /> : <ChevronRight size={14} />} {t('sidebar.queries')}
          </button>
          {openGroups.queries && (
            <div className="ml-2 mt-1 space-y-1">
              {groupedQueries.map((g, i) => <RenderNode key={'q_'+g.id+'_'+i} node={g} icon={Search} colorClass="text-blue-600 dark:text-blue-400" bgClass="hover:bg-blue-100 dark:hover:bg-blue-950/30 hover:text-blue-900 dark:hover:text-blue-200" onSelect={onSelectQuery} type="query" openFolders={openFolders} toggleFolder={toggleFolder} onItemContextMenu={onItemContextMenu} handleDragStart={handleDragStart} />)}
            </div>
          )}
        </div>
        
        {/* Reports */}
        <div>
           <button onClick={() => toggleGroup('reports')} className="w-full flex items-center gap-1 text-xs font-bold text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800 px-1 py-1 rounded">
            {openGroups.reports ? <ChevronDown size={14} /> : <ChevronRight size={14} />} {t('sidebar.reports')}
          </button>
          {openGroups.reports && (
             <div className="ml-2 mt-1 space-y-1">
              {groupedReports.map((g, i) => <RenderNode key={'r_'+g.id+'_'+i} node={g} icon={FileText} colorClass="text-green-600 dark:text-green-400" bgClass="hover:bg-green-100 dark:hover:bg-green-950/30 hover:text-green-900 dark:hover:text-green-200" onSelect={onSelectReport} type="report" openFolders={openFolders} toggleFolder={toggleFolder} onItemContextMenu={onItemContextMenu} handleDragStart={handleDragStart} />)}
             </div>
          )}
        </div>
        
        {/* Forms */}
         <div>
           <button onClick={() => toggleGroup('forms')} className="w-full flex items-center gap-1 text-xs font-bold text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800 px-1 py-1 rounded">
            {openGroups.forms ? <ChevronDown size={14} /> : <ChevronRight size={14} />} {t('sidebar.forms')}
          </button>
          {openGroups.forms && (
             <div className="ml-2 mt-1 space-y-1">
                {groupedForms.map((g, i) => <RenderNode key={'f_'+g.id+'_'+i} node={g} icon={Layout} colorClass="text-indigo-600 dark:text-indigo-400" bgClass="hover:bg-indigo-100 dark:hover:bg-indigo-950/30 hover:text-indigo-900 dark:hover:text-indigo-200" onSelect={onSelectForm} type="form" openFolders={openFolders} toggleFolder={toggleFolder} onItemContextMenu={onItemContextMenu} handleDragStart={handleDragStart} />)}
             </div>
          )}
        </div>

        {/* Charts */}
        <div>
           <button onClick={() => toggleGroup('charts')} className="w-full flex items-center gap-1 text-xs font-bold text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800 px-1 py-1 rounded">
            {openGroups.charts ? <ChevronDown size={14} /> : <ChevronRight size={14} />} {t('sidebar.charts')}
          </button>
          {openGroups.charts && (
             <div className="ml-2 mt-1 space-y-1">
                {groupedCharts.map((g, i) => <RenderNode key={'c_'+g.id+'_'+i} node={g} icon={BarChart2} colorClass="text-pink-600 dark:text-pink-400" bgClass="hover:bg-pink-100 dark:hover:bg-pink-950/30 hover:text-pink-900 dark:hover:text-pink-200" onSelect={onSelectChart!} type="chart" openFolders={openFolders} toggleFolder={toggleFolder} onItemContextMenu={onItemContextMenu} handleDragStart={handleDragStart} />)}
             </div>
          )}
        </div>

        {/* Workflows & Scheduler (NEW) */}
        <div>
           <button onClick={() => toggleGroup('workflows')} className="w-full flex items-center gap-1 text-xs font-bold text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800 px-1 py-1 rounded">
            {openGroups.workflows ? <ChevronDown size={14} /> : <ChevronRight size={14} />} Logik & Jobs
          </button>
          {openGroups.workflows && (
             <div className="ml-2 mt-1 space-y-1">
                {/* Scheduler Item */}
                <div className={`flex items-center justify-between px-2 py-1 hover:bg-teal-100 dark:hover:bg-teal-950/30 hover:text-teal-900 dark:hover:text-teal-200 rounded text-sm text-slate-700 dark:text-slate-300 cursor-pointer`} onClick={onSelectScheduler}>
                    <div className="flex items-center gap-2">
                        <CalendarClock size={14} className="text-teal-600 dark:text-teal-400" />
                        <span>Zeitplaner (Jobs)</span>
                    </div>
                </div>
                
                {groupedWorkflows.map((g, i) => <RenderNode key={'w_'+g.id+'_'+i} node={g} icon={GitFork} colorClass="text-purple-600 dark:text-purple-400" bgClass="hover:bg-purple-100 dark:hover:bg-purple-950/30 hover:text-purple-900 dark:hover:text-purple-200" onSelect={onSelectWorkflow} type="workflow" openFolders={openFolders} toggleFolder={toggleFolder} onItemContextMenu={onItemContextMenu} handleDragStart={handleDragStart} />)}
             </div>
          )}
        </div>

        {/* Pages (NEW) */}
        <div>
          <button onClick={() => toggleGroup('pages')} className="w-full flex items-center gap-1 text-xs font-bold text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800 px-1 py-1 rounded">
            {openGroups.pages ? <ChevronDown size={14} /> : <ChevronRight size={14} />} Pages
          </button>
          {openGroups.pages && (
             <div className="ml-2 mt-1 space-y-1">
                {groupedPages.map((g, i) => <RenderNode key={'p_'+g.id+'_'+i} node={g} icon={LayoutTemplate} colorClass="text-amber-600 dark:text-amber-400" bgClass="hover:bg-amber-100 dark:hover:bg-amber-950/30 hover:text-amber-900 dark:hover:text-amber-200" onSelect={onSelectPage!} type="page" openFolders={openFolders} toggleFolder={toggleFolder} onItemContextMenu={onItemContextMenu} handleDragStart={handleDragStart} />)}
             </div>
          )}
        </div>

        {/* Infrastruktur & Cloud (NEW) */}
        <div>
          <button onClick={() => toggleGroup('infrastructure' as any)} className="w-full flex items-center gap-1 text-xs font-bold text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800 px-1 py-1 rounded">
            {(openGroups as any).infrastructure ? <ChevronDown size={14} /> : <ChevronRight size={14} />} Infrastruktur & Cloud
          </button>
          {(openGroups as any).infrastructure && (
             <div className="ml-2 mt-1 space-y-1">
                {/* Projects & Requirements */}
                <div 
                  id="sidebar_btn_project_management"
                  className="flex items-center justify-between px-2 py-1.5 hover:bg-emerald-100 dark:hover:bg-emerald-950/30 hover:text-emerald-900 dark:hover:text-emerald-200 rounded text-sm text-slate-700 dark:text-slate-300 cursor-pointer"
                  onClick={() => onSetView({ type: 'project_management' })}
                >
                    <div className="flex items-center gap-2">
                        <Briefcase size={14} className="text-emerald-600 dark:text-emerald-400" />
                        <span className="font-medium text-slate-800 dark:text-slate-200">Projekte & Requirements</span>
                    </div>
                </div>

                {/* DB Studio self-hosting backend */}
                <div 
                  id="sidebar_btn_dbstudio_backend"
                  className="flex items-center justify-between px-2 py-1.5 hover:bg-indigo-100 dark:hover:bg-indigo-950/30 hover:text-indigo-900 dark:hover:text-indigo-200 rounded text-sm text-slate-700 dark:text-slate-300 cursor-pointer"
                  onClick={onSelectDbstudioBackend}
                >
                    <div className="flex items-center gap-2">
                        <Server size={14} className="text-indigo-600 dark:text-indigo-400" />
                        <span className="font-medium text-slate-800 dark:text-slate-200">DB Studio Backend (Self-Host)</span>
                    </div>
                </div>

                {/* Interactive Roadmap / TODO.md */}
                <div 
                  id="sidebar_btn_roadmap_view"
                  className="flex items-center justify-between px-2 py-1.5 hover:bg-emerald-100 dark:hover:bg-emerald-950/30 hover:text-emerald-900 dark:hover:text-emerald-200 rounded text-sm text-slate-700 dark:text-slate-300 cursor-pointer"
                  onClick={() => onSetView({ type: 'roadmap_view' })}
                >
                    <div className="flex items-center gap-2">
                        <CheckSquare size={14} className="text-emerald-600 dark:text-emerald-400" />
                        <span className="font-medium text-slate-800 dark:text-slate-200">Roadmap &amp; Architektur Plan</span>
                    </div>
                </div>

                {/* Audit Trail / Änderungshistorie */}
                <div 
                  id="sidebar_btn_audit_trail"
                  className="flex items-center justify-between px-2 py-1.5 hover:bg-slate-200 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-100 rounded text-sm text-slate-700 dark:text-slate-300 cursor-pointer"
                  onClick={() => onSetView({ type: 'audit_trail' })}
                >
                    <div className="flex items-center gap-2">
                        <History size={14} className="text-amber-600 dark:text-amber-400" />
                        <span className="text-slate-700 dark:text-slate-300">Audit Trail (Änderungshistorie)</span>
                    </div>
                </div>

                {/* Tickets Board */}
                <div 
                  id="sidebar_btn_tickets_board"
                  className="flex items-center justify-between px-2 py-1.5 hover:bg-slate-200 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-100 rounded text-sm text-slate-700 dark:text-slate-300 cursor-pointer"
                  onClick={() => onSetView({ type: 'tickets_board' })}
                >
                    <div className="flex items-center gap-2">
                        <Database size={14} className="text-blue-600 dark:text-blue-400" />
                        <span className="text-slate-700 dark:text-slate-300">Team-Aufgaben & Tickets</span>
                    </div>
                </div>
             </div>
          )}
        </div>

      </div>
    </div>
  );
};
