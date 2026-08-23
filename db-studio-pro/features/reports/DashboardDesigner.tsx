import React, { useState } from 'react';
import { Report, Table, Query, Chart, ProjectData, DashboardWidget } from '../../types/index';
import { Plus, X, LayoutTemplate, Settings, ExternalLink, Printer, Maximize2 } from 'lucide-react';
import { ReportView } from './ReportView';
import { useProjectStore } from '../../stores/useProjectStore';

interface DashboardDesignerProps {
  report: Report;
  tables: Table[];
  queries: Query[];
  relationships: any[];
  reports: Report[];
  onReportChange: (report: Report) => void;
  onOpenReport?: (reportId: string) => void;
}

export const DashboardDesigner: React.FC<DashboardDesignerProps> = ({ report, tables, queries, relationships, reports, onReportChange, onOpenReport }) => {
  const [widgets, setWidgets] = useState<DashboardWidget[]>(report.dashboardWidgets || []);
  const [showAddMenu, setShowAddMenu] = useState(false);
  const [globalFilter, setGlobalFilter] = useState('');
  const executeQuery = useProjectStore(state => state.executeQuery);

  const getSourceFieldsForReport = (r: Report) => {
    if (r.sourceType === 'table') {
      return tables.find(t => t.id === r.sourceId)?.fields || [];
    } else if (r.sourceType === 'query') {
      const q = queries.find(query => query.id === r.sourceId) as any;
      return q?.columns?.map((c: any) => ({
        id: c.fieldId, 
        name: c.label || c.fieldName, 
        type: 'text'
      })) || [];
    }
    return [];
  };

  // Exclude current dashboard from reports list to avoid recursion
  const availableReports = reports.filter(r => r.id !== report.id);

  const addWidget = (sourceId: string, sourceType: 'report' | 'query' | 'chart') => {
    const maxX = widgets.reduce((max, w) => Math.max(max, w.x + w.w), 0);
    const maxY = widgets.reduce((max, w) => Math.max(max, w.y + w.h), 0);
    
    // Auto-layout: simple placement
    const newWidget: DashboardWidget = {
      id: crypto.randomUUID(),
      sourceId,
      sourceType,
      x: 0,
      y: maxY,
      w: 12, // full width by default in a 12-col grid
      h: 4 // approx height
    };
    
    const newWidgets = [...widgets, newWidget];
    setWidgets(newWidgets);
    onReportChange({ ...report, dashboardWidgets: newWidgets });
    setShowAddMenu(false);
  };

  const removeWidget = (id: string) => {
    const newWidgets = widgets.filter(w => w.id !== id);
    setWidgets(newWidgets);
    onReportChange({ ...report, dashboardWidgets: newWidgets });
  };

  return (
    <div className="flex h-full bg-slate-50 relative">
      <div className="flex-1 p-6 overflow-auto">
        <div className="bg-white border border-slate-200 rounded-xl p-4 mb-6 shadow-sm flex flex-col md:flex-row gap-4 items-center justify-between">
          <div className="flex items-center gap-2 w-full md:w-auto">
             <LayoutTemplate className="text-indigo-600 size-6 mr-1" />
             <div>
                <h2 className="text-lg font-bold text-slate-800 leading-tight">{report.name}</h2>
                <span className="text-[10px] text-indigo-700 bg-indigo-50 px-1.5 py-0.5 rounded font-bold uppercase tracking-wider">Dashboard (Multi-Bericht)</span>
             </div>
          </div>
          <div className="flex items-center gap-3 w-full md:w-auto">
             {/* Dynamic Global Filter */}
             <div className="relative flex-1 md:w-64">
                <input 
                    type="text" 
                    value={globalFilter} 
                    onChange={e => setGlobalFilter(e.target.value)} 
                    placeholder="Widgets filtern (z.B. Name...)" 
                    className="w-full pl-3 pr-8 py-1.5 bg-slate-50 border border-slate-300 rounded text-xs focus:bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500 font-medium" 
                />
                {globalFilter && (
                    <button onClick={() => setGlobalFilter('')} className="absolute inset-y-0 right-0 flex items-center pr-3.5 text-slate-400 hover:text-slate-600 text-[10px] font-bold">
                        ✕
                    </button>
                )}
             </div>

             <div className="relative">
                 <button 
                    className="bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-1.5 rounded text-xs font-semibold flex items-center gap-1.5 shadow-sm transition-colors"
                    onClick={() => setShowAddMenu(!showAddMenu)}
                 >
                    <Plus size={14} /> Widget
                 </button>
                 {showAddMenu && (
                     <div className="absolute right-0 top-full mt-2 w-64 bg-white border border-slate-200 shadow-xl rounded-lg z-50 p-2 overflow-y-auto max-h-96">
                         <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2 px-2">Berichte</div>
                         {availableReports.map(r => (
                             <button key={r.id} onClick={() => addWidget(r.id, 'report')} className="w-full text-left px-3 py-2 text-xs hover:bg-slate-50 text-slate-700 rounded truncate">
                                 {r.name}
                             </button>
                         ))}
                         {availableReports.length === 0 && <div className="px-3 py-2 text-xs text-slate-400 italic">Keine weiteren Berichte verfügbar</div>}
                     </div>
                 )}
             </div>
          </div>
        </div>

        {/* Dashboard Grid View */}
        {widgets.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 border-2 border-dashed border-slate-300 rounded-xl">
                 <LayoutTemplate className="text-slate-300 size-12 mb-3" />
                 <h3 className="text-lg font-bold text-slate-600 mb-1">Leeres Dashboard</h3>
                 <p className="text-slate-500 mb-4 text-sm text-center">Fügen Sie Widgets hinzu, um verschiedene Berichte hier zu kombinieren.</p>
                 <button onClick={() => setShowAddMenu(true)} className="bg-white border shadow-sm border-slate-300 text-slate-700 px-4 py-2 rounded text-sm font-semibold hover:bg-slate-50">
                    + Widget hinzufügen
                 </button>
            </div>
        ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                {widgets.map(widget => {
                    const rBase = reports.find(r => r.id === widget.sourceId);
                    
                    let widgetData: Record<string, any>[] = [];
                    let widgetSourceFields: any[] = [];
                    
                    if (rBase) {
                        widgetSourceFields = getSourceFieldsForReport(rBase);
                        if (rBase.sourceType === 'table') {
                            const table = tables.find(t => t.id === rBase.sourceId);
                            widgetData = table?.data || [];
                        } else {
                            const query = queries.find(q => q.id === rBase.sourceId);
                            if (query) widgetData = executeQuery(query);
                        }
                        
                        // Apply dynamic filter over widget data
                        const filterLower = globalFilter.toLowerCase().trim();
                        if (filterLower) {
                            widgetData = widgetData.filter(row => 
                                Object.values(row).some(cell => 
                                    String(cell ?? '').toLowerCase().includes(filterLower)
                                )
                            );
                        }
                    }

                    return (
                        <div key={widget.id} className="bg-white border border-slate-200 rounded-xl shadow-sm flex flex-col overflow-hidden col-span-1" style={{ minHeight: '400px' }}>
                            <div className="bg-slate-50 border-b border-slate-200 px-4 py-3 flex justify-between items-center group">
                                <input 
                                    className="font-bold text-slate-700 bg-transparent border-none focus:ring-1 focus:ring-blue-400 rounded outline-none p-1 hover:bg-slate-100 text-sm"
                                    value={widget.title !== undefined ? widget.title : (rBase ? rBase.name : 'Unknown Report')}
                                    onChange={(e) => {
                                        const newWidgets = widgets.map(w => w.id === widget.id ? { ...w, title: e.target.value } : w);
                                        setWidgets(newWidgets);
                                        onReportChange({ ...report, dashboardWidgets: newWidgets });
                                    }}
                                    placeholder="Titel..."
                                />
                                <div className="flex items-center opacity-0 group-hover:opacity-100 transition-opacity bg-white px-2 shadow-sm rounded-md border border-slate-200">
                                    {rBase && onOpenReport && (
                                        <button 
                                            title="Bericht öffnen / Drucken"
                                            onClick={() => onOpenReport(rBase.id)} 
                                            className="text-slate-500 hover:text-indigo-600 p-1.5 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider"
                                        >
                                            <Maximize2 size={14} /> Ansicht & Druck
                                        </button>
                                    )}
                                    <div className="w-[1px] h-4 bg-slate-300 mx-1"></div>
                                    <button 
                                        title="Widget entfernen"
                                        onClick={() => removeWidget(widget.id)} 
                                        className="text-slate-400 hover:text-red-500 p-1.5 rounded hover:bg-red-50"
                                    >
                                        <X size={16} />
                                    </button>
                                </div>
                            </div>
                            <div className="flex-1 overflow-auto bg-white relative pointer-events-auto">
                                {rBase ? (
                                    <ReportView report={rBase} data={widgetData} sourceFields={widgetSourceFields} allTables={tables} relationships={relationships} widgetMode={true} />
                                ) : (
                                    <div className="p-4 text-center text-slate-400">Bericht nicht gefunden</div>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>
        )}
      </div>
    </div>
  );
};
