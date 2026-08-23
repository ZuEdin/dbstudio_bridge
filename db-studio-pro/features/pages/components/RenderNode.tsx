import React, { useState } from 'react';
import { PageComponent } from '../../../types/index';
import { 
  LayoutTemplate, Layers, TrendingUp, DollarSign, AlertCircle, Tag, Play, Search, 
  Trash2, Copy, ArrowUp, ArrowDown, CornerLeftUp, Plus, CheckCircle, Clock, Users,
  Award, Briefcase, Zap, Activity, ChevronDown, ChevronRight
} from 'lucide-react';
import { useProjectStore } from '../../../stores/useProjectStore';
import { CustomComponentRunner } from './runner/CustomComponentRunner';

interface SubPagePreviewNodeProps {
    node: PageComponent;
    queries: any[];
    tables: any[];
    pages: any[];
}

export const SubPagePreviewNode: React.FC<SubPagePreviewNodeProps> = ({ node, queries, tables, pages }) => {
    let content = null;
    
    switch (node.type) {
        case 'container':
        case 'card':
        case 'row':
        case 'column':
            content = (
                <div className={`flex flex-col gap-1.5 w-full p-2 border border-slate-200/50 rounded bg-slate-50/25 ${node.props.className || ''}`} style={node.props.style}>
                    {node.children && node.children.length > 0 ? (
                        node.children.map(c => <SubPagePreviewNode key={c.id} node={c} queries={queries} tables={tables} pages={pages} />)
                    ) : (
                        <div className="text-slate-300 text-[10px] text-center py-2 border border-dashed border-slate-200 rounded">Leerer Bereich</div>
                    )}
                </div>
            );
            break;
            
        case 'text':
            content = (
                <div className={`p-1 text-xs text-slate-700 font-medium break-words ${node.props.className || ''}`} style={node.props.style}>
                    {node.props.text || 'Text Block'}
                </div>
            );
            break;

        case 'button':
            content = (
                <button disabled className={`px-2.5 py-1 bg-indigo-600/50 text-white text-[10px] rounded m-0.5 opacity-70 cursor-not-allowed ${node.props.className || ''}`} style={node.props.style}>
                    {node.props.label || 'Button'}
                </button>
            );
            break;

        case 'kpi_widget':
        case 'stat_card':
            content = (
                <div className="p-2 border border-amber-200/60 rounded-lg bg-amber-50/30">
                    <div className="text-[9px] text-slate-500 font-medium">{node.props.label || 'KPI Kennzahl'}</div>
                    <div className="text-sm font-bold text-slate-800 mt-0.5">{node.props.value || '12.450'} {node.props.unit || '€'}</div>
                </div>
            );
            break;

        case 'subform':
            content = (
                <div className="p-2 border border-indigo-200 rounded-lg bg-indigo-50/30 text-[10px] text-indigo-900 font-medium flex items-center gap-1.5">
                    <Layers size={12} className="text-indigo-600"/> Subformular: {node.props.title || 'Positionen'}
                </div>
            );
            break;

        default:
            content = (
                <div className="p-1 bg-slate-100/40 text-slate-400 rounded text-[9px] border border-slate-100/50 italic text-center">
                    [{node.type}]
                </div>
            );
            break;
    }

    return (
        <div className="w-full relative pointer-events-none select-none">
            {content}
        </div>
    );
};

interface RenderNodeProps {
    node: PageComponent;
    selectedNodeId: string | null;
    onSelect: (id: string, e: React.MouseEvent) => void;
    onDrop: (e: React.DragEvent, id: string) => void;
    onDuplicate?: (id: string) => void;
    onMove?: (id: string, dir: 'up' | 'down') => void;
    onDelete?: (id: string) => void;
    onSelectParent?: (id: string) => void;
}

export const RenderNode: React.FC<RenderNodeProps> = ({ 
    node, 
    selectedNodeId, 
    onSelect, 
    onDrop,
    onDuplicate,
    onMove,
    onDelete,
    onSelectParent
}) => {
    const { queries, tables, pages } = useProjectStore();
    const isSelected = selectedNodeId === node.id;
    const [activeTabId, setActiveTabId] = useState<string>('');
    
    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
    };
    
    const handleDragEnter = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
    };
    
    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        onDrop(e, node.id);
    };
    
    const handleClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        onSelect(node.id, e);
    };

    let content = null;
    let isDropTarget = true;
    
    switch (node.type) {
        case 'grid_layout': {
            const cols = node.props.columns || 3;
            const gap = node.props.gap || 4;
            const gridColClass = cols === 2 ? 'grid-cols-1 md:grid-cols-2' : cols === 4 ? 'grid-cols-1 sm:grid-cols-2 md:grid-cols-4' : cols === 6 ? 'grid-cols-2 sm:grid-cols-3 md:grid-cols-6' : 'grid-cols-1 md:grid-cols-3';
            content = (
                <div className={`grid ${gridColClass} gap-${gap} w-full min-h-[60px] p-2 border border-dashed border-indigo-200/60 bg-indigo-50/10 rounded-lg ${node.props.className || ''}`} style={node.props.style}>
                    {(node.children && node.children.length > 0) ? (
                        node.children.map(c => (
                            <RenderNode 
                                key={c.id} 
                                node={c} 
                                selectedNodeId={selectedNodeId} 
                                onSelect={onSelect} 
                                onDrop={onDrop}
                                onDuplicate={onDuplicate}
                                onMove={onMove}
                                onDelete={onDelete}
                                onSelectParent={onSelectParent}
                            />
                        ))
                    ) : (
                        <div className="col-span-full text-slate-300 text-xs text-center border-2 border-dashed border-slate-200 p-4 rounded hover:border-slate-300 transition-colors pointer-events-none">
                            Grid-Elemente (KPI Cards, Spalten) hier ablegen ({cols} Spalten)
                        </div>
                    )}
                </div>
            );
            break;
        }

        case 'row':
             content = (
                 <div className={`flex flex-row gap-2 w-full min-h-[50px] p-2 border border-dashed border-blue-200/50 bg-blue-50/20 ${node.props.className || ''}`} style={node.props.style}>
                    {(node.children && node.children.length > 0) ? 
                        node.children.map(c => (
                            <RenderNode 
                                key={c.id} 
                                node={c} 
                                selectedNodeId={selectedNodeId} 
                                onSelect={onSelect} 
                                onDrop={onDrop}
                                onDuplicate={onDuplicate}
                                onMove={onMove}
                                onDelete={onDelete}
                                onSelectParent={onSelectParent}
                            />
                        ))
                        : (
                            <div className="text-slate-300 text-xs text-center border-2 border-dashed border-slate-200 p-4 rounded hover:border-slate-300 hover:bg-slate-50 transition-colors w-full flex-1 flex items-center justify-center pointer-events-none">Spalten (Columns) oder Container hier ablegen</div>
                        )
                    }
                 </div>
             );
             break;

        case 'column':
             content = (
                 <div className={`flex flex-col gap-2 w-full min-h-[50px] p-2 border border-dashed border-emerald-200/50 bg-emerald-50/20 ${node.props.className || ''}`} style={{ flex: '1 1 0%', ...node.props.style }}>
                    {(node.children && node.children.length > 0) ? 
                        node.children.map(c => (
                            <RenderNode 
                                key={c.id} 
                                node={c} 
                                selectedNodeId={selectedNodeId} 
                                onSelect={onSelect} 
                                onDrop={onDrop}
                                onDuplicate={onDuplicate}
                                onMove={onMove}
                                onDelete={onDelete}
                                onSelectParent={onSelectParent}
                            />
                        ))
                        : (
                            <div className="text-slate-300 text-xs text-center border-2 border-dashed border-slate-200 p-4 rounded hover:border-slate-300 hover:bg-slate-50 transition-colors w-full flex-1 flex items-center justify-center pointer-events-none">Komponenten hier ablegen</div>
                        )
                    }
                 </div>
             );
             break;

        case 'card':
             content = (
                 <div className={`bg-white rounded-xl shadow-xs border border-slate-200 w-full min-h-[80px] overflow-hidden ${node.props.className || ''}`} style={node.props.style}>
                     {node.props.title && (
                         <div className={`px-4 py-3 border-b border-slate-200 bg-slate-50/70 font-bold text-xs text-slate-800 flex items-center justify-between ${node.props.headerClassName || ''}`}>
                             <span>{node.props.title}</span>
                         </div>
                     )}
                     <div className={`p-4 min-h-[60px] flex flex-col gap-2 ${node.props.bodyClassName || ''}`}>
                        {(node.children && node.children.length > 0) ? 
                            node.children.map(c => (
                                <RenderNode 
                                    key={c.id} 
                                    node={c} 
                                    selectedNodeId={selectedNodeId} 
                                    onSelect={onSelect} 
                                    onDrop={onDrop}
                                    onDuplicate={onDuplicate}
                                    onMove={onMove}
                                    onDelete={onDelete}
                                    onSelectParent={onSelectParent}
                                />
                            ))
                            : (
                                <div className="text-slate-300 text-xs text-center border-2 border-dashed border-slate-200 p-4 rounded hover:border-slate-300 hover:bg-slate-50 transition-colors w-full flex-1 flex items-center justify-center pointer-events-none">Card-Inhalt hier ablegen</div>
                            )
                        }
                     </div>
                 </div>
             );
             break;

        case 'container':
             content = (
                 <div className={`flex flex-col gap-2 w-full ${node.id === 'root' ? 'min-h-[700px] h-full p-6' : 'min-h-[50px] p-2'} ${node.props.className || ''}`} style={node.props.style}>
                    {(node.children && node.children.length > 0) ? 
                        node.children.map(c => (
                            <RenderNode 
                                key={c.id} 
                                node={c} 
                                selectedNodeId={selectedNodeId} 
                                onSelect={onSelect} 
                                onDrop={onDrop}
                                onDuplicate={onDuplicate}
                                onMove={onMove}
                                onDelete={onDelete}
                                onSelectParent={onSelectParent}
                            />
                        ))
                        : (
                            <div className="text-slate-300 text-xs text-center border-2 border-dashed border-slate-200 p-8 rounded hover:border-slate-300 hover:bg-slate-50 transition-colors w-full flex-1 flex items-center justify-center pointer-events-none">Komponenten hier ablegen</div>
                        )
                    }
                 </div>
             );
             break;

        case 'tabs_container': {
            const tabs = node.props.tabs || [
                { id: 'tab1', label: 'Tab 1', icon: 'FileText' },
                { id: 'tab2', label: 'Tab 2', icon: 'List' }
            ];
            const currentTab = activeTabId || node.props.defaultTab || tabs[0]?.id || 'tab1';
            content = (
                <div className={`bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden w-full ${node.props.className || ''}`} style={node.props.style}>
                    <div className="flex border-b border-slate-200 bg-slate-50 px-2 pt-2 gap-1">
                        {tabs.map((tab: any) => (
                            <button
                                key={tab.id}
                                type="button"
                                onClick={(e) => { e.stopPropagation(); setActiveTabId(tab.id); }}
                                className={`px-4 py-2 text-xs font-bold rounded-t-lg transition border-t border-x ${
                                    currentTab === tab.id 
                                        ? 'bg-white border-slate-200 border-b-transparent text-indigo-700 -mb-[1px]' 
                                        : 'bg-transparent border-transparent text-slate-500 hover:text-slate-800'
                                }`}
                            >
                                {tab.label}
                            </button>
                        ))}
                    </div>
                    <div className="p-4 min-h-[100px] flex flex-col gap-2">
                        {(node.children && node.children.length > 0) ? (
                            node.children.map(c => (
                                <RenderNode 
                                    key={c.id} 
                                    node={c} 
                                    selectedNodeId={selectedNodeId} 
                                    onSelect={onSelect} 
                                    onDrop={onDrop}
                                    onDuplicate={onDuplicate}
                                    onMove={onMove}
                                    onDelete={onDelete}
                                    onSelectParent={onSelectParent}
                                />
                            ))
                        ) : (
                            <div className="text-slate-300 text-xs text-center border-2 border-dashed border-slate-200 p-6 rounded hover:border-slate-300 pointer-events-none">
                                Komponenten für Tabs hier ablegen (Subformulare, Tabellen, Subpages)
                            </div>
                        )}
                    </div>
                </div>
            );
            break;
        }

        case 'subform': {
            const subTable = tables.find(t => t.id === node.props.subTableId);
            const cols = node.props.selectedColumns || (subTable ? subTable.fields.map(f => f.name) : ['position', 'bezeichnung', 'menge', 'einzelpreis', 'gesamtpreis']);
            content = (
                <div className={`p-4 rounded-xl bg-indigo-50/30 border-2 border-indigo-200/80 w-full min-h-[140px] shadow-xs ${node.props.className || ''}`} style={node.props.style}>
                    <div className="flex items-center justify-between text-indigo-900 text-xs font-bold mb-3 pb-2 border-b border-indigo-100 pointer-events-none">
                        <div className="flex items-center gap-2">
                            <div className="p-1 rounded bg-indigo-100 text-indigo-700"><Layers size={14}/></div>
                            <div>
                                <span>{node.props.title || 'Subformular (Master-Detail)'}</span>
                                {subTable && <span className="text-[10px] text-slate-500 font-normal ml-2">Tabelle: {subTable.name} (FK: {node.props.foreignKeyField || 'parent_id'})</span>}
                            </div>
                        </div>
                        <span className="text-[10px] bg-indigo-100 text-indigo-800 px-2 py-0.5 rounded-full font-bold">Subform</span>
                    </div>

                    <div className="bg-white rounded-lg border border-indigo-100 overflow-hidden shadow-2xs">
                        <div className="bg-slate-50 px-3 py-2 border-b border-slate-200 flex gap-4 text-[10px] font-bold text-slate-500 uppercase">
                            {cols.slice(0, 5).map((col: string) => (
                                <div key={col} className="flex-1 truncate">{col.replace(/_/g, ' ')}</div>
                            ))}
                            <div className="w-16 text-right">Aktionen</div>
                        </div>
                        <div className="p-3 text-center text-xs text-slate-400 italic bg-white">
                            [Interaktive Subform-Tabelle mit Inline CRUD & automatischer Fremdschlüsselbindung]
                        </div>
                    </div>
                </div>
            );
            isDropTarget = false;
            break;
        }

        case 'kpi_widget':
        case 'stat_card': {
            const colorsMap: Record<string, { bg: string, text: string, ring: string, iconBg: string }> = {
                indigo: { bg: 'bg-indigo-50/50', text: 'text-indigo-700', ring: 'border-indigo-100', iconBg: 'bg-indigo-100 text-indigo-700' },
                emerald: { bg: 'bg-emerald-50/50', text: 'text-emerald-700', ring: 'border-emerald-100', iconBg: 'bg-emerald-100 text-emerald-700' },
                amber: { bg: 'bg-amber-50/50', text: 'text-amber-700', ring: 'border-amber-100', iconBg: 'bg-amber-100 text-amber-700' },
                rose: { bg: 'bg-rose-50/50', text: 'text-rose-700', ring: 'border-rose-100', iconBg: 'bg-rose-100 text-rose-700' },
                blue: { bg: 'bg-blue-50/50', text: 'text-blue-700', ring: 'border-blue-100', iconBg: 'bg-blue-100 text-blue-700' },
            };
            const cTheme = colorsMap[node.props.accentColor || 'indigo'] || colorsMap.indigo;

            content = (
                <div className={`p-4 rounded-xl bg-white border ${cTheme.ring} shadow-xs w-full flex items-center justify-between ${node.props.className || ''}`} style={node.props.style}>
                    <div>
                        <div className="text-xs font-semibold text-slate-500">{node.props.label || 'KPI Kennzahl'}</div>
                        <div className="text-2xl font-bold text-slate-900 mt-1 flex items-baseline gap-1">
                            {node.props.value || '14.850,00'}
                            {node.props.unit && <span className="text-sm font-semibold text-slate-500">{node.props.unit}</span>}
                        </div>
                        {node.props.trend && (
                            <div className="flex items-center gap-1 mt-1 text-[11px]">
                                <span className={`font-bold ${node.props.trendDirection === 'down' ? 'text-rose-600' : 'text-emerald-600'}`}>
                                    {node.props.trend}
                                </span>
                                {node.props.trendLabel && <span className="text-slate-400">{node.props.trendLabel}</span>}
                            </div>
                        )}
                    </div>
                    <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${cTheme.iconBg} shrink-0`}>
                        <TrendingUp size={22} />
                    </div>
                </div>
            );
            isDropTarget = false;
            break;
        }

        case 'alert_box': {
            const typesMap: Record<string, { bg: string, border: string, text: string, icon: any }> = {
                info: { bg: 'bg-blue-50', border: 'border-blue-200', text: 'text-blue-900', icon: AlertCircle },
                success: { bg: 'bg-emerald-50', border: 'border-emerald-200', text: 'text-emerald-900', icon: CheckCircle },
                warning: { bg: 'bg-amber-50', border: 'border-amber-200', text: 'text-amber-900', icon: AlertCircle },
                danger: { bg: 'bg-rose-50', border: 'border-rose-200', text: 'text-rose-900', icon: AlertCircle },
            };
            const aTheme = typesMap[node.props.alertType || 'info'] || typesMap.info;
            const IconComp = aTheme.icon;

            content = (
                <div className={`p-3.5 rounded-xl border ${aTheme.border} ${aTheme.bg} ${aTheme.text} w-full flex items-start gap-2.5 ${node.props.className || ''}`} style={node.props.style}>
                    <IconComp size={18} className="shrink-0 mt-0.5" />
                    <div className="flex-1">
                        {node.props.title && <div className="font-bold text-xs">{node.props.title}</div>}
                        <div className="text-xs mt-0.5 text-slate-700">{node.props.message || 'Wichtiger Hinweis'}</div>
                    </div>
                </div>
            );
            isDropTarget = false;
            break;
        }

        case 'badge_pill': {
            const pillColors: Record<string, string> = {
                emerald: 'bg-emerald-100 text-emerald-800 border-emerald-200',
                amber: 'bg-amber-100 text-amber-800 border-amber-200',
                rose: 'bg-rose-100 text-rose-800 border-rose-200',
                indigo: 'bg-indigo-100 text-indigo-800 border-indigo-200',
                blue: 'bg-blue-100 text-blue-800 border-blue-200',
                slate: 'bg-slate-100 text-slate-800 border-slate-200',
            };
            const cClass = pillColors[node.props.colorScheme || 'emerald'] || pillColors.emerald;

            content = (
                <div className="inline-block p-1">
                    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold border ${cClass}`}>
                        <Tag size={12} /> {node.props.label || 'Status: Aktiv'}
                    </span>
                </div>
            );
            isDropTarget = false;
            break;
        }

        case 'action_group': {
            const actions = node.props.actions || [
                { label: 'Exportieren', icon: 'Download', variant: 'secondary' },
                { label: 'Speichern', icon: 'Check', variant: 'primary' }
            ];
            content = (
                <div className={`flex flex-wrap items-center gap-2 p-1 ${node.props.className || ''}`}>
                    {actions.map((act: any, idx: number) => (
                        <button
                            key={idx}
                            type="button"
                            className={`px-3 py-1.5 rounded-lg text-xs font-semibold shadow-2xs flex items-center gap-1.5 transition ${
                                act.variant === 'primary' 
                                    ? 'bg-indigo-600 text-white hover:bg-indigo-700' 
                                    : act.variant === 'danger'
                                    ? 'bg-rose-600 text-white hover:bg-rose-700'
                                    : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
                            }`}
                        >
                            {act.label}
                        </button>
                    ))}
                </div>
            );
            isDropTarget = false;
            break;
        }

        case 'search_filter_bar':
            content = (
                <div className={`p-3 bg-white border border-slate-200 rounded-xl shadow-2xs w-full space-y-2 ${node.props.className || ''}`}>
                    <div className="flex items-center gap-2">
                        <div className="relative flex-1">
                            <Search size={14} className="absolute left-2.5 top-2.5 text-slate-400" />
                            <input
                                type="text"
                                disabled
                                placeholder={node.props.placeholder || 'Suche nach Datensätzen...'}
                                className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg cursor-not-allowed"
                            />
                        </div>
                    </div>
                </div>
            );
            isDropTarget = false;
            break;

        case 'list_repeater':
             content = (
                 <div className={`p-4 rounded-xl bg-indigo-50/30 border-2 border-indigo-200 w-full min-h-[100px] ${node.props.className || ''}`} style={node.props.style}>
                    <div className="flex items-center justify-between text-indigo-700 text-xs font-bold mb-3 border-b border-indigo-100 pb-1.5 pointer-events-none">
                        <span className="flex items-center gap-1">
                            <LayoutTemplate size={12}/> List-Repeater: {node.props.dataSourceType === 'query' ? `Abfrage: ${queries.find(q=>q.id===node.props.dataSourceId)?.name || 'Keine'}` : `Tabelle: ${tables.find(t=>t.id===node.props.dataSourceId)?.name || 'Keine'}`}
                        </span>
                        <span className="text-[10px] bg-indigo-100 px-1.5 py-0.5 rounded uppercase">Repeater Loop</span>
                    </div>
                    
                    <div className="flex flex-col gap-2">
                        {(node.children && node.children.length > 0) ? (
                            <div className="border border-indigo-100 bg-white p-3 rounded-lg shadow-2xs opacity-90 pointer-events-auto">
                                <div className="text-[10px] text-slate-400 font-mono mb-2 uppercase select-none">Repeater Element (Entwurf)</div>
                                {node.children.map(c => (
                                    <RenderNode 
                                        key={c.id} 
                                        node={c} 
                                        selectedNodeId={selectedNodeId} 
                                        onSelect={onSelect} 
                                        onDrop={onDrop}
                                        onDuplicate={onDuplicate}
                                        onMove={onMove}
                                        onDelete={onDelete}
                                        onSelectParent={onSelectParent}
                                    />
                                ))}
                            </div>
                        ) : (
                            <div className="text-slate-400 text-xs text-center border-2 border-dashed border-slate-200 p-6 rounded bg-white pointer-events-none">
                                Komponenten hier ablegen, die wiederholt werden sollen
                            </div>
                        )}
                    </div>
                 </div>
             );
             break;

        case 'text':
             content = <div className={`p-2 w-full break-words ${node.props.className || ''}`} style={node.props.style}>{node.props.text || 'Text Block'}</div>;
             isDropTarget = false;
             break;

        case 'button':
             content = <button className={`px-4 py-2 bg-indigo-600 text-white text-xs font-semibold rounded-lg hover:bg-indigo-700 m-1 shadow-2xs ${node.props.className || ''}`} style={node.props.style}>{node.props.label || 'Button'}</button>;
             isDropTarget = false;
             break;

        case 'dropdown':
             content = (
                  <div className={`p-2 ${node.props.className || ''}`}>
                      <select className="border border-slate-300 rounded px-3 py-1.5 bg-white text-xs w-full max-w-xs" style={node.props.style}>
                          <option>{node.props.placeholder || 'Option wählen...'}</option>
                      </select>
                  </div>
             );
             isDropTarget = false;
             break;

        case 'subpage_container': {
             const subPage = pages?.find(p => p.id === node.props.subPageId);
             content = (
                  <div className={`p-4 rounded-xl bg-emerald-50/50 border-2 border-emerald-200 w-full min-h-[100px] ${node.props.className || ''}`} style={node.props.style}>
                      <div className="flex items-center justify-between text-emerald-700 text-xs font-bold mb-3 border-b border-emerald-100 pb-1.5 pointer-events-none">
                          <span className="flex items-center gap-1">
                              <Layers size={12}/> Unterseiten-Container (Sub-Page)
                          </span>
                          <span className="text-[10px] bg-emerald-100 px-1.5 py-0.5 rounded uppercase font-bold">Sub-Page</span>
                      </div>
                      <div className="text-xs text-slate-700 font-medium">
                          {subPage ? (
                              <div className="flex flex-col gap-1.5">
                                  <div className="text-emerald-800 font-semibold flex items-center gap-1">
                                      <Layers size={12} className="text-emerald-600"/> Eingebundene Seite: <span className="underline">{subPage.name}</span>
                                  </div>
                                  <div className="mt-2 border border-emerald-200/50 bg-white/80 p-2.5 rounded shadow-inner mb-2 pointer-events-none">
                                      <div className="text-[9px] text-emerald-600 font-mono font-bold mb-1.5 uppercase select-none tracking-wider border-b border-emerald-100/50 pb-1 flex items-center gap-1">
                                          <Layers size={10} /> Inhalt Vorschau
                                      </div>
                                      {subPage.layout ? (
                                          <SubPagePreviewNode node={subPage.layout} queries={queries} tables={tables} pages={pages} />
                                      ) : (
                                          <div className="text-slate-400 text-xs italic">Unterseite ist leer.</div>
                                      )}
                                  </div>
                              </div>
                          ) : (
                              <div className="text-slate-400 text-xs text-center border-2 border-dashed border-slate-200 p-4 rounded bg-white pointer-events-none">
                                  Wählen Sie rechts eine Seite aus, die hier eingebunden werden soll
                              </div>
                          )}
                      </div>
                  </div>
             );
             isDropTarget = false;
             break;
        }

        default:
             content = (
                  <div className={`p-4 m-1 bg-slate-100 rounded-lg border flex items-center justify-center border-slate-200 text-center text-xs font-medium text-slate-500 ${node.props.className || ''}`}>
                      {node.type}
                  </div>
             );
             isDropTarget = false;
             break;
    }

    return (
        <div 
           className={`relative border-2 ${isSelected ? 'border-indigo-500 ring-2 ring-indigo-200 z-20 shadow-md' : 'border-transparent hover:border-slate-300'} transition-all rounded-lg w-full ${node.id === 'root' ? 'bg-white shadow-sm border-slate-200' : ''}`}
           onClick={handleClick}
           onDragOver={isDropTarget ? handleDragOver : undefined}
           onDragEnter={isDropTarget ? handleDragEnter : undefined}
           onDrop={isDropTarget ? handleDrop : undefined}
           style={node.id === 'root' ? { ...node.props.style } : {}}
        >
            {/* Quick Action Floating Toolbar on selected node */}
            {node.id !== 'root' && isSelected && (
                <div className="absolute -top-7 left-0 bg-indigo-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-t-md shadow-md flex items-center gap-2 z-30 select-none">
                    <span className="uppercase">{node.type.replace('_', ' ')}</span>
                    
                    <div className="w-[1px] h-3 bg-indigo-400 mx-0.5"></div>
                    
                    {onSelectParent && (
                        <button
                            type="button"
                            onClick={(e) => { e.stopPropagation(); onSelectParent(node.id); }}
                            className="p-0.5 hover:bg-indigo-700 rounded text-indigo-100 hover:text-white"
                            title="Übergeordnetes Element auswählen"
                        >
                            <CornerLeftUp size={11} />
                        </button>
                    )}

                    {onDuplicate && (
                        <button
                            type="button"
                            onClick={(e) => { e.stopPropagation(); onDuplicate(node.id); }}
                            className="p-0.5 hover:bg-indigo-700 rounded text-indigo-100 hover:text-white"
                            title="Element duplizieren"
                        >
                            <Copy size={11} />
                        </button>
                    )}

                    {onMove && (
                        <>
                            <button
                                type="button"
                                onClick={(e) => { e.stopPropagation(); onMove(node.id, 'up'); }}
                                className="p-0.5 hover:bg-indigo-700 rounded text-indigo-100 hover:text-white"
                                title="Nach oben verschieben"
                            >
                                <ArrowUp size={11} />
                            </button>
                            <button
                                type="button"
                                onClick={(e) => { e.stopPropagation(); onMove(node.id, 'down'); }}
                                className="p-0.5 hover:bg-indigo-700 rounded text-indigo-100 hover:text-white"
                                title="Nach unten verschieben"
                            >
                                <ArrowDown size={11} />
                            </button>
                        </>
                    )}

                    {onDelete && (
                        <button
                            type="button"
                            onClick={(e) => { e.stopPropagation(); onDelete(node.id); }}
                            className="p-0.5 hover:bg-red-600 rounded text-indigo-100 hover:text-white ml-1"
                            title="Element löschen"
                        >
                            <Trash2 size={11} />
                        </button>
                    )}
                </div>
            )}

            {content}
        </div>
    );
};
