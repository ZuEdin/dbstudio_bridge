
import React, { useState, useEffect } from 'react';
import { Report, Field, Table, Query, ReportColumn, Relationship, GroupLevel, ReportSummary } from '../../types/index';
import { Eye, EyeOff, Settings, Columns, GripVertical, Palette, Layers, Calculator, Layout, Plus, Trash2, ArrowUp, ArrowDown } from 'lucide-react';
import { ReportFormattingPanel } from './designer/ReportFormattingPanel';
import { ReportView } from './ReportView';
import { executeSelectQuery } from '../queries/utils/queryExecution';

interface ReportDesignerViewProps {
  report: Report;
  tables: Table[];
  queries: Query[];
  relationships: Relationship[];
  allReports?: Report[];
  onReportChange: (report: Report) => void;
}

export const ReportDesignerView: React.FC<ReportDesignerViewProps> = ({ report, tables, queries, relationships, allReports = [], onReportChange }) => {
  const [activeTab, setActiveTab] = useState<'columns' | 'grouping' | 'summaries' | 'settings'>('columns');
  const [columns, setColumns] = useState<ReportColumn[]>([]);
  const [sourceFields, setSourceFields] = useState<Field[]>([]);
  const [draggedColIndex, setDraggedColIndex] = useState<number | null>(null);
  const [activeFormattingColIndex, setActiveFormattingColIndex] = useState<number | null>(null);
  const [previewData, setPreviewData] = useState<any[]>([]);

  // Initialize Data & Fields based on Source
  useEffect(() => {
    let fields: Field[] = [];
    let data: any[] = [];

    if (report.sourceType === 'table') {
        const table = tables.find(t => t.id === report.sourceId);
        fields = table?.fields || [];
        data = table?.data || [];
    } else {
        const query = queries.find(q => q.id === report.sourceId);
        if (query && query.type === 'SELECT') {
             const fieldMap = new Map<string, Field>();
             query.columns.forEach(col => {
                const table = tables.find(t => t.id === col.tableId);
                const field = table?.fields.find(f => f.id === col.fieldId);
                if (field && !fieldMap.has(field.id)) {
                    fieldMap.set(field.id, field);
                }
             });
             fields = Array.from(fieldMap.values());
             data = executeSelectQuery(query, tables, relationships); 
        }
    }
    setSourceFields(fields);
    setPreviewData(data);

    const currentCols = report.columns || [];
    if (currentCols.length === 0) {
        const initialCols = fields.map((f, i) => ({
            fieldId: f.id, label: f.name, visible: true, order: i
        }));
        setColumns(initialCols);
        onReportChange({ ...report, columns: initialCols });
    } else {
        setColumns(JSON.parse(JSON.stringify(currentCols)));
    }
  }, [report.id, report.sourceId, report.sourceType, tables, queries, relationships]);

  const syncToReport = (newCols: ReportColumn[]) => {
      setColumns(newCols);
      onReportChange({ ...report, columns: newCols });
  };

  // Drag & Drop for Columns
  const handleDragStart = (e: React.DragEvent, index: number) => {
    setDraggedColIndex(index);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', String(index));
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault();
    if (draggedColIndex === null || draggedColIndex === dropIndex) return;
    
    const newCols = columns.map(c => ({...c}));
    const [movedCol] = newCols.splice(draggedColIndex, 1);
    newCols.splice(dropIndex, 0, movedCol);
    
    newCols.forEach((col, idx) => { col.order = idx; });
    
    syncToReport(newCols);
    setDraggedColIndex(null);
  };

  const toggleVisibility = (index: number) => {
      const newCols = columns.map((c, i) => i === index ? { ...c, visible: !c.visible } : c);
      syncToReport(newCols);
  };

  const handleLabelChange = (index: number, val: string) => {
      const newCols = columns.map((c, i) => i === index ? { ...c, label: val } : c);
      setColumns(newCols);
      onReportChange({ ...report, columns: newCols });
  };

  const updateSingleColumn = (index: number, updates: Partial<ReportColumn>) => {
      const newCols = columns.map((c, i) => i === index ? { ...c, ...updates } : c);
      syncToReport(newCols);
  };

  // Grouping Handlers
  const groupLevels = report.groupingFields || (report.groupingFieldId ? [{ fieldId: report.groupingFieldId, fieldName: sourceFields.find(f => f.id === report.groupingFieldId)?.name }] : []);

  const handleAddGroupLevel = (fieldId: string) => {
    if (!fieldId) return;
    const field = sourceFields.find(f => f.id === fieldId);
    const newGroup: GroupLevel = {
      fieldId,
      fieldName: field?.name || '',
      sortOrder: 'asc',
      showHeader: true,
      showFooter: true
    };
    const updated = [...groupLevels, newGroup];
    onReportChange({
      ...report,
      groupingFields: updated,
      groupingFieldId: updated[0]?.fieldId
    });
  };

  const handleRemoveGroupLevel = (index: number) => {
    const updated = groupLevels.filter((_, i) => i !== index);
    onReportChange({
      ...report,
      groupingFields: updated,
      groupingFieldId: updated[0]?.fieldId || undefined
    });
  };

  const handleToggleSortOrder = (index: number) => {
    const updated = groupLevels.map((g, i) => i === index ? { ...g, sortOrder: (g.sortOrder === 'desc' ? 'asc' : 'desc') as 'asc' | 'desc' } : g);
    onReportChange({ ...report, groupingFields: updated });
  };

  // Summary Handlers
  const handleAddSummary = (fieldId: string, calc: 'SUM' | 'COUNT' | 'AVG' | 'MIN' | 'MAX') => {
    const field = sourceFields.find(f => f.id === fieldId);
    if (!field) return;
    const newSummary: ReportSummary = {
      fieldId,
      fieldName: field.name,
      calculation: calc
    };
    const updated = [...report.summaries, newSummary];
    onReportChange({ ...report, summaries: updated });
  };

  const handleRemoveSummary = (index: number) => {
    const updated = report.summaries.filter((_, i) => i !== index);
    onReportChange({ ...report, summaries: updated });
  };

  const handleRenderTypeChange = (index: number, renderType: any) => {
    const updated = [...columns];
    updated[index] = { ...updated[index], renderType };
    setColumns(updated);
    onReportChange({ ...report, columns: updated });
  };

  // Settings Handlers
  const updateSettings = (key: string, value: any) => {
    onReportChange({
      ...report,
      settings: {
        ...report.settings,
        [key]: value
      }
    });
  };

  const previewReport: Report = {
      ...report,
      columns: columns
  };

  return (
    <div className="flex h-full bg-slate-100">
      {/* LEFT: Config Panel */}
      <div className="w-96 flex flex-col bg-white border-r border-slate-300 shadow-xl z-10">
          <div className="p-4 bg-slate-900 text-white flex justify-between items-center shrink-0 border-b border-slate-800">
              <div>
                <h2 className="font-extrabold text-base flex items-center gap-2 text-amber-400">
                  <Layout size={18}/> Berichts-Designer
                </h2>
                <p className="text-[10px] text-slate-400">Berichtsstruktur & Sektionen bearbeiten</p>
              </div>
          </div>

          {/* Navigation Tabs */}
          <div className="flex border-b border-slate-200 bg-slate-50 shrink-0 text-xs font-semibold">
            <button 
              onClick={() => setActiveTab('columns')} 
              className={`flex-1 py-2.5 text-center flex items-center justify-center gap-1 border-b-2 transition-colors ${activeTab === 'columns' ? 'border-blue-600 text-blue-700 bg-white font-bold' : 'border-transparent text-slate-600 hover:text-slate-900'}`}
            >
              <Columns size={14}/> Spalten
            </button>
            <button 
              onClick={() => setActiveTab('grouping')} 
              className={`flex-1 py-2.5 text-center flex items-center justify-center gap-1 border-b-2 transition-colors ${activeTab === 'grouping' ? 'border-blue-600 text-blue-700 bg-white font-bold' : 'border-transparent text-slate-600 hover:text-slate-900'}`}
            >
              <Layers size={14}/> Gruppen
            </button>
            <button 
              onClick={() => setActiveTab('summaries')} 
              className={`flex-1 py-2.5 text-center flex items-center justify-center gap-1 border-b-2 transition-colors ${activeTab === 'summaries' ? 'border-blue-600 text-blue-700 bg-white font-bold' : 'border-transparent text-slate-600 hover:text-slate-900'}`}
            >
              <Calculator size={14}/> Summen
            </button>
            <button 
              onClick={() => setActiveTab('settings')} 
              className={`flex-1 py-2.5 text-center flex items-center justify-center gap-1 border-b-2 transition-colors ${activeTab === 'settings' ? 'border-blue-600 text-blue-700 bg-white font-bold' : 'border-transparent text-slate-600 hover:text-slate-900'}`}
            >
              <Settings size={14}/> Layout
            </button>
          </div>
          
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
              
              {/* TAB 1: SPALTEN & REIHENFOLGE */}
              {activeTab === 'columns' && (
                <div>
                    <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3 flex items-center gap-1"><Columns size={14}/> Tabellen-Spalten</h3>
                    <div className="space-y-2">
                        {columns.map((col, idx) => (
                            <div 
                                key={col.fieldId} 
                                draggable
                                onDragStart={(e) => handleDragStart(e, idx)}
                                onDragOver={handleDragOver}
                                onDrop={(e) => handleDrop(e, idx)}
                                className={`flex items-center gap-2 p-2 rounded border transition-all ${col.visible ? 'bg-white border-slate-300' : 'bg-slate-50 border-slate-200 opacity-70'} ${draggedColIndex === idx ? 'opacity-50 border-blue-400 border-dashed' : ''}`}
                            >
                                <div className="cursor-move text-slate-400 hover:text-slate-600 p-1"><GripVertical size={14}/></div>
                                <div className="flex-1 grid grid-cols-1 gap-1">
                                    <div className="flex items-center justify-between text-[10px] font-mono text-slate-400">
                                        <span className="truncate">{sourceFields.find(f => f.id === col.fieldId)?.name || '???'}</span>
                                        <select
                                          value={col.renderType || 'text'}
                                          onChange={e => handleRenderTypeChange(idx, e.target.value)}
                                          className="text-[10px] bg-slate-100 border border-slate-200 rounded px-1 py-0.5 text-slate-700 font-semibold focus:outline-none focus:border-blue-500 cursor-pointer"
                                          title="Darstellungstyp (Text, QR Code, Barcode, etc.)"
                                        >
                                          <option value="text">Text</option>
                                          <option value="qrcode">QR Code</option>
                                          <option value="barcode">Barcode</option>
                                          <option value="currency">Währung (€)</option>
                                          <option value="date">Datum</option>
                                          <option value="badge">Badge</option>
                                          <option value="image">Bild URL</option>
                                        </select>
                                    </div>
                                    <input 
                                      type="text" 
                                      value={col.label} 
                                      onChange={e => handleLabelChange(idx, e.target.value)} 
                                      className="w-full border-b border-transparent hover:border-slate-300 focus:border-blue-500 outline-none text-sm font-medium bg-transparent" 
                                    />
                                </div>
                                <div className="flex items-center gap-1">
                                    <button 
                                        onClick={() => setActiveFormattingColIndex(activeFormattingColIndex === idx ? null : idx)}
                                        className={`p-1.5 rounded flex items-center gap-1 text-xs ${col.formattingRules?.length ? 'bg-purple-100 text-purple-700 border border-purple-200' : 'text-slate-400 hover:bg-slate-100'}`}
                                        title="Bedingte Formatierung"
                                    >
                                        <Palette size={14} />
                                    </button>
                                    <button onClick={() => toggleVisibility(idx)} className={`p-1.5 rounded ${col.visible ? 'text-green-600 hover:bg-green-50' : 'text-slate-400 hover:bg-slate-200'}`}>
                                        {col.visible ? <Eye size={14} /> : <EyeOff size={14} />}
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
              )}

              {/* TAB 2: MEHRSTUFIGE GRUPPIERUNG */}
              {activeTab === 'grouping' && (
                <div className="space-y-4">
                  <div>
                    <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-1"><Layers size={14}/> Gruppierungsebenen</h3>
                    <p className="text-xs text-slate-500 mb-3">Organisiere Datensätze nach einer oder mehreren Kategorien mit Gruppenköpfen.</p>
                    
                    <div className="flex gap-2 mb-4">
                      <select id="new-group-select" className="flex-1 text-xs border border-slate-300 rounded p-2">
                        <option value="">Feld zum Gruppieren wählen...</option>
                        {sourceFields.map(f => (
                          <option key={f.id} value={f.id}>{f.name}</option>
                        ))}
                      </select>
                      <button 
                        onClick={() => {
                          const el = document.getElementById('new-group-select') as HTMLSelectElement;
                          if (el && el.value) {
                            handleAddGroupLevel(el.value);
                            el.value = '';
                          }
                        }}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded text-xs font-bold flex items-center gap-1"
                      >
                        <Plus size={14}/> Hinzufügen
                      </button>
                    </div>

                    <div className="space-y-2">
                      {groupLevels.map((group, idx) => (
                        <div key={idx} className="p-3 bg-slate-50 border border-slate-200 rounded-lg flex items-center justify-between">
                          <div>
                            <div className="text-[10px] font-bold text-slate-400 uppercase">Ebene {idx + 1}</div>
                            <div className="text-sm font-bold text-slate-800">{group.fieldName || sourceFields.find(f => f.id === group.fieldId)?.name}</div>
                          </div>
                          <div className="flex items-center gap-2">
                            <button 
                              onClick={() => handleToggleSortOrder(idx)}
                              className="px-2 py-1 bg-white border border-slate-300 rounded text-xs font-mono font-bold flex items-center gap-1 hover:bg-slate-100"
                              title="Sortierreihenfolge umschalten"
                            >
                              {group.sortOrder === 'desc' ? <ArrowDown size={12}/> : <ArrowUp size={12}/>}
                              {group.sortOrder === 'desc' ? 'DESC' : 'ASC'}
                            </button>
                            <button 
                              onClick={() => handleRemoveGroupLevel(idx)}
                              className="p-1.5 text-red-500 hover:bg-red-50 rounded"
                              title="Gruppe entfernen"
                            >
                              <Trash2 size={14}/>
                            </button>
                          </div>
                        </div>
                      ))}

                      {groupLevels.length === 0 && (
                        <div className="p-4 border-2 border-dashed border-slate-200 text-center text-slate-400 text-xs rounded-lg">
                          Keine Gruppierung aktiv. Alle Datensätze werden flach dargestellt.
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 3: BERECHNUNGEN & SUMMEN */}
              {activeTab === 'summaries' && (
                <div className="space-y-4">
                  <div>
                    <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-1"><Calculator size={14}/> Gruppen- & Berichtssummen</h3>
                    <p className="text-xs text-slate-500 mb-3">Füge automatische Aggregate im Gruppenfuss und Berichtsfuss hinzu.</p>

                    {/* Form to add summary */}
                    <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg space-y-2 mb-4">
                      <div className="text-xs font-bold text-slate-700">Neue Berechnung erstellen:</div>
                      <select id="summary-field-select" className="w-full text-xs border border-slate-300 rounded p-1.5">
                        <option value="">Feld wählen...</option>
                        {sourceFields.map(f => (
                          <option key={f.id} value={f.id}>{f.name} ({f.type})</option>
                        ))}
                      </select>
                      <div className="flex gap-2">
                        <select id="summary-calc-select" className="flex-1 text-xs border border-slate-300 rounded p-1.5">
                          <option value="SUM">SUMME (Sum)</option>
                          <option value="AVG">DURCHSCHNITT (Avg)</option>
                          <option value="COUNT">ANZAHL (Count)</option>
                          <option value="MIN">MINIMUM (Min)</option>
                          <option value="MAX">MAXIMUM (Max)</option>
                        </select>
                        <button 
                          onClick={() => {
                            const fieldEl = document.getElementById('summary-field-select') as HTMLSelectElement;
                            const calcEl = document.getElementById('summary-calc-select') as HTMLSelectElement;
                            if (fieldEl && fieldEl.value && calcEl) {
                              handleAddSummary(fieldEl.value, calcEl.value as any);
                            }
                          }}
                          className="bg-amber-600 hover:bg-amber-700 text-white px-3 py-1.5 rounded text-xs font-bold flex items-center gap-1"
                        >
                          <Plus size={14}/> Einfügen
                        </button>
                      </div>
                    </div>

                    {/* List active summaries */}
                    <div className="space-y-2">
                      {report.summaries.map((sum, idx) => (
                        <div key={idx} className="p-2.5 bg-white border border-slate-200 rounded-lg flex items-center justify-between shadow-2xs">
                          <div>
                            <span className="px-1.5 py-0.5 bg-amber-100 text-amber-800 text-[10px] font-bold rounded font-mono mr-2">
                              {sum.calculation}
                            </span>
                            <span className="text-xs font-bold text-slate-800">{sum.fieldName}</span>
                          </div>
                          <button 
                            onClick={() => handleRemoveSummary(idx)}
                            className="p-1 text-red-500 hover:bg-red-50 rounded"
                          >
                            <Trash2 size={14}/>
                          </button>
                        </div>
                      ))}

                      {report.summaries.length === 0 && (
                        <div className="p-4 border-2 border-dashed border-slate-200 text-center text-slate-400 text-xs rounded-lg">
                          Keine Berechnungen konfiguriert.
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 4: LAYOUT & EINSTELLUNGEN */}
              {activeTab === 'settings' && (
                <div className="space-y-4">
                  <div>
                    <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3 flex items-center gap-1"><Settings size={14}/> Berichtslayout</h3>
                    
                    <div className="space-y-3 text-xs">
                      <div>
                        <label className="block text-slate-700 font-bold mb-1">Untertitel / Kopfzeile</label>
                        <input 
                          type="text" 
                          value={report.settings?.subtitle || ''} 
                          onChange={e => updateSettings('subtitle', e.target.value)}
                          placeholder="z.B. Monatlicher Finanzbericht Q3"
                          className="w-full border border-slate-300 rounded p-2"
                        />
                      </div>

                      <div>
                        <label className="block text-slate-700 font-bold mb-1">Firmen-Logo URL (optional)</label>
                        <input 
                          type="text" 
                          value={report.settings?.companyLogoUrl || ''} 
                          onChange={e => updateSettings('companyLogoUrl', e.target.value)}
                          placeholder="https://..."
                          className="w-full border border-slate-300 rounded p-2"
                        />
                      </div>

                      <div className="pt-2 border-t border-slate-200 space-y-2">
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input 
                            type="checkbox" 
                            checked={report.settings?.showReportHeader !== false} 
                            onChange={e => updateSettings('showReportHeader', e.target.checked)}
                          />
                          <span className="font-semibold text-slate-800">Berichtskopf anzeigen</span>
                        </label>

                        <label className="flex items-center gap-2 cursor-pointer">
                          <input 
                            type="checkbox" 
                            checked={report.settings?.showPageFooter !== false} 
                            onChange={e => updateSettings('showPageFooter', e.target.checked)}
                          />
                          <span className="font-semibold text-slate-800">Seitenfuss (Seitenzahlen) anzeigen</span>
                        </label>

                        <label className="flex items-center gap-2 cursor-pointer">
                          <input 
                            type="checkbox" 
                            checked={!!report.settings?.zebraStriping} 
                            onChange={e => updateSettings('zebraStriping', e.target.checked)}
                          />
                          <span className="font-semibold text-slate-800">Wechselnde Zeilenfarben (Zebra)</span>
                        </label>

                        <label className="flex items-center gap-2 cursor-pointer">
                          <input 
                            type="checkbox" 
                            checked={!!report.settings?.showGridlines} 
                            onChange={e => updateSettings('showGridlines', e.target.checked)}
                          />
                          <span className="font-semibold text-slate-800">Gitterlinien anzeigen</span>
                        </label>

                        <label className="flex items-center gap-2 cursor-pointer">
                          <input 
                            type="checkbox" 
                            checked={!!report.settings?.pageBreakAfterGroup} 
                            onChange={e => updateSettings('pageBreakAfterGroup', e.target.checked)}
                          />
                          <span className="font-semibold text-slate-800">Seitenumbruch nach jeder Gruppe</span>
                        </label>
                      </div>

                      <div className="pt-2 border-t border-slate-200">
                        <label className="block text-slate-700 font-bold mb-1">Ausrichtung</label>
                        <select 
                          value={report.settings?.orientation || 'portrait'} 
                          onChange={e => updateSettings('orientation', e.target.value)}
                          className="w-full border border-slate-300 rounded p-2"
                        >
                          <option value="portrait">Hochformat (Portrait)</option>
                          <option value="landscape">Querformat (Landscape)</option>
                        </select>
                      </div>

                      {/* Unterbericht (Sub-Report) Configuration */}
                      <div className="pt-3 border-t border-slate-200 space-y-2">
                        <h4 className="font-bold text-slate-800 text-xs uppercase tracking-wider flex items-center gap-1">
                          <Layers size={14} className="text-blue-600"/> Unterbericht (1:N Details)
                        </h4>
                        <select
                          value={report.subReport?.reportId || ''}
                          onChange={e => {
                            const val = e.target.value;
                            if (!val) {
                              onReportChange({ ...report, subReport: undefined });
                            } else {
                              onReportChange({
                                ...report,
                                subReport: {
                                  reportId: val,
                                  foreignKeyFieldId: report.subReport?.foreignKeyFieldId || '',
                                  parentKeyFieldId: report.subReport?.parentKeyFieldId || sourceFields[0]?.id || ''
                                }
                              });
                            }
                          }}
                          className="w-full border border-slate-300 rounded p-1.5 text-xs"
                        >
                          <option value="">Kein Unterbericht eingebunden</option>
                          {allReports.filter(r => r.id !== report.id).map(r => (
                            <option key={r.id} value={r.id}>{r.name}</option>
                          ))}
                        </select>

                        {report.subReport?.reportId && (
                          <div className="space-y-1.5 p-2 bg-slate-50 border border-slate-200 rounded text-xs">
                            <div>
                              <label className="block font-bold text-slate-600">Fremdschlüssel im Unterbericht:</label>
                              <input
                                type="text"
                                placeholder="z.B. kunden_id"
                                value={report.subReport.foreignKeyFieldId}
                                onChange={e => onReportChange({
                                  ...report,
                                  subReport: { ...report.subReport!, foreignKeyFieldId: e.target.value }
                                })}
                                className="w-full border border-slate-300 rounded p-1"
                              />
                            </div>
                            <div>
                              <label className="block font-bold text-slate-600">Primärschlüssel im Hauptbericht:</label>
                              <select
                                value={report.subReport.parentKeyFieldId}
                                onChange={e => onReportChange({
                                  ...report,
                                  subReport: { ...report.subReport!, parentKeyFieldId: e.target.value }
                                })}
                                className="w-full border border-slate-300 rounded p-1"
                              >
                                {sourceFields.map(f => (
                                  <option key={f.id} value={f.id}>{f.name}</option>
                                ))}
                              </select>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Embedded Chart Configuration */}
                      <div className="pt-3 border-t border-slate-200 space-y-2">
                        <h4 className="font-bold text-slate-800 text-xs uppercase tracking-wider flex items-center gap-1">
                          <Calculator size={14} className="text-amber-600"/> Eingebettetes Diagramm
                        </h4>
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={!!report.chartConfig?.enabled}
                            onChange={e => onReportChange({
                              ...report,
                              chartConfig: {
                                enabled: e.target.checked,
                                type: report.chartConfig?.type || 'bar',
                                xAxisFieldId: report.chartConfig?.xAxisFieldId || sourceFields[0]?.id || '',
                                yAxisFieldId: report.chartConfig?.yAxisFieldId || sourceFields[1]?.id || sourceFields[0]?.id || '',
                                title: report.chartConfig?.title || 'Übersichtsdiagramm'
                              }
                            })}
                          />
                          <span className="font-semibold text-slate-800">Diagramm im Berichtskopf anzeigen</span>
                        </label>

                        {report.chartConfig?.enabled && (
                          <div className="space-y-1.5 p-2 bg-slate-50 border border-slate-200 rounded text-xs">
                            <div>
                              <label className="block font-bold text-slate-600">Diagramm-Typ:</label>
                              <select
                                value={report.chartConfig.type}
                                onChange={e => onReportChange({
                                  ...report,
                                  chartConfig: { ...report.chartConfig!, type: e.target.value as any }
                                })}
                                className="w-full border border-slate-300 rounded p-1"
                              >
                                <option value="bar">Säulendiagramm (Bar)</option>
                                <option value="line">Liniendiagramm (Line)</option>
                                <option value="pie">Kreisdiagramm (Pie)</option>
                              </select>
                            </div>
                            <div>
                              <label className="block font-bold text-slate-600">X-Achse (Kategorie):</label>
                              <select
                                value={report.chartConfig.xAxisFieldId}
                                onChange={e => onReportChange({
                                  ...report,
                                  chartConfig: { ...report.chartConfig!, xAxisFieldId: e.target.value }
                                })}
                                className="w-full border border-slate-300 rounded p-1"
                              >
                                {sourceFields.map(f => (
                                  <option key={f.id} value={f.id}>{f.name}</option>
                                ))}
                              </select>
                            </div>
                            <div>
                              <label className="block font-bold text-slate-600">Y-Achse (Wert):</label>
                              <select
                                value={report.chartConfig.yAxisFieldId}
                                onChange={e => onReportChange({
                                  ...report,
                                  chartConfig: { ...report.chartConfig!, yAxisFieldId: e.target.value }
                                })}
                                className="w-full border border-slate-300 rounded p-1"
                              >
                                {sourceFields.map(f => (
                                  <option key={f.id} value={f.id}>{f.name}</option>
                                ))}
                              </select>
                            </div>
                          </div>
                        )}
                      </div>

                    </div>
                  </div>
                </div>
              )}

          </div>
      </div>

      {/* CENTER: Live Preview */}
      <div className="flex-1 overflow-hidden flex flex-col">
          <div className="bg-slate-800 p-2 text-xs text-center text-slate-300 border-b border-slate-700 shrink-0 font-mono flex items-center justify-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              <span>LIVE BERICHTSVORSCHAU (DESIGN MODUS)</span>
          </div>
          <div className="flex-1 overflow-auto relative bg-slate-300 p-4">
             <div className="max-w-5xl mx-auto">
                <ReportView 
                    report={previewReport} 
                    data={previewData} 
                    sourceFields={sourceFields}
                    allTables={tables} 
                    relationships={relationships} 
                    allReports={allReports}
                    allQueries={queries}
                />
             </div>
          </div>
      </div>

      {/* RIGHT: Formatting Sidebar (Conditional) */}
      {activeFormattingColIndex !== null && columns[activeFormattingColIndex] && (
          <ReportFormattingPanel 
            column={columns[activeFormattingColIndex]} 
            onUpdateColumn={(updates) => updateSingleColumn(activeFormattingColIndex, updates)}
            onClose={() => setActiveFormattingColIndex(null)}
          />
      )}
    </div>
  );
};

