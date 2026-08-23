
import React, { useMemo, useState } from 'react';
import { Report, Field, ReportColumn, TextStyle, Table, Relationship, GroupLevel, Query, ColumnRenderType } from '../../types/index';
import { FileText, FileSpreadsheet, ChevronDown, ExternalLink, Printer, Building2, Calculator, Layers } from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { RecordDetailModal } from '../../components/modals/RecordDetailModal';
import { ReportCellRenderer } from './components/ReportCellRenderer';
import { SubReportRenderer } from './components/SubReportRenderer';
import { ReportChartRenderer } from './components/ReportChartRenderer';

interface ReportViewProps {
  report: Report;
  data: Record<string, any>[];
  sourceFields: Field[];
  // Props for Linking
  allTables: Table[];
  relationships: Relationship[];
  allReports?: Report[];
  allQueries?: Query[];
  widgetMode?: boolean;
}

export interface SummaryResult {
  fieldName: string;
  calc: string;
  label: string;
  value: number | string;
}

const getCssFromStyle = (style?: TextStyle): React.CSSProperties => {
    if (!style) return {};
    return {
        fontFamily: style.fontFamily,
        fontSize: style.fontSize,
        color: style.color,
        backgroundColor: style.backgroundColor,
        fontWeight: style.bold ? 'bold' : 'normal',
        fontStyle: style.italic ? 'italic' : 'normal',
        textAlign: style.align,
        borderBottom: style.borderBottom ? '1px solid #e2e8f0' : undefined
    };
};

const getRecordValue = (item: Record<string, any>, fieldName?: string, label?: string) => {
    if (!item) return undefined;
    if (fieldName && item[fieldName] !== undefined) return item[fieldName];
    if (label && item[label] !== undefined) return item[label];
    
    const searchKeys = [fieldName, label].filter(Boolean) as string[];
    const lowerKeys = searchKeys.map(k => k.toLowerCase());
    
    for (const key of Object.keys(item)) {
        const lowerKey = key.toLowerCase();
        if (lowerKeys.includes(lowerKey) || lowerKeys.some(lk => lowerKey.endsWith('.' + lk))) {
            return item[key];
        }
    }
    return undefined;
};

export const ReportView: React.FC<ReportViewProps> = ({ 
  report, 
  data, 
  sourceFields, 
  allTables, 
  relationships, 
  allReports = [], 
  allQueries = [], 
  widgetMode 
}) => {
  const [detailView, setDetailView] = useState<{ targetTableId: string, recordId: any } | null>(null);

  // Normalize group levels: convert legacy groupingFieldId or use groupingFields
  const groupLevels = useMemo((): GroupLevel[] => {
    if (report.groupingFields && report.groupingFields.length > 0) {
      return report.groupingFields;
    }
    if (report.groupingFieldId) {
      const field = sourceFields.find(f => f.id === report.groupingFieldId);
      return [{
        fieldId: report.groupingFieldId,
        fieldName: field?.name,
        sortOrder: 'asc',
        showHeader: true,
        showFooter: true
      }];
    }
    return [];
  }, [report.groupingFields, report.groupingFieldId, sourceFields]);

  // Determine Columns to Display
  const displayColumns = useMemo((): { id: string, label: string, fieldName: string, renderType?: ColumnRenderType, isFK?: boolean, targetTableId?: string }[] => {
      let cols: any[] = [];
      
      const mapCol = (fieldId: string, label: string, fieldName: string, renderType?: ColumnRenderType) => {
          let isFK = false;
          let targetTableId = undefined;

          if (report.sourceType === 'table') {
              const rel = relationships.find(r => r.fromTableId === report.sourceId && r.fromFieldId === fieldId);
              if (rel) {
                  isFK = true;
                  targetTableId = rel.toTableId;
              }
          }
          return { id: fieldId, label, fieldName, renderType, isFK, targetTableId };
      };

      if (report.columns && report.columns.length > 0) {
          cols = report.columns
            .filter(c => c.visible)
            .sort((a, b) => a.order - b.order)
            .map(c => mapCol(c.fieldId, c.label, sourceFields.find(f => f.id === c.fieldId)?.name || '', c.renderType));
      } else {
          cols = sourceFields.map(f => mapCol(f.id, f.name, f.name));
      }

      // Hide active grouping fields from detail rows to avoid repetition (MS Access Stepped Style)
      const groupFieldIds = new Set(groupLevels.map(g => g.fieldId));
      if (groupFieldIds.size > 0) {
          return cols.filter(c => !groupFieldIds.has(c.id));
      }
      return cols;
  }, [report.columns, sourceFields, groupLevels, relationships, report.sourceId, report.sourceType]);

  // Calculate summaries for a dataset
  const calculateSummaries = (items: Record<string, any>[], filterGroupFieldId?: string): SummaryResult[] => {
    const results: SummaryResult[] = [];
    if (!items || items.length === 0) return results;

    const applicableSummaries = report.summaries.filter(s => {
      if (filterGroupFieldId) {
        return !s.groupFieldId || s.groupFieldId === filterGroupFieldId;
      }
      return true;
    });

    applicableSummaries.forEach(summary => {
      const fieldName = summary.fieldName;
      
      if (summary.calculation === 'COUNT') {
        results.push({
          fieldName,
          calc: 'COUNT',
          label: `Anzahl (${fieldName})`,
          value: items.length
        });
      } else {
        const vals = items
          .map(item => Number(item[fieldName]))
          .filter(v => !isNaN(v) && v !== null);

        if (vals.length === 0) {
          results.push({ fieldName, calc: summary.calculation, label: `${summary.calculation} (${fieldName})`, value: 0 });
          return;
        }

        if (summary.calculation === 'SUM') {
          const sum = vals.reduce((acc, v) => acc + v, 0);
          results.push({ fieldName, calc: 'SUM', label: `Summe (${fieldName})`, value: Math.round(sum * 100) / 100 });
        } else if (summary.calculation === 'AVG') {
          const avg = vals.reduce((acc, v) => acc + v, 0) / vals.length;
          results.push({ fieldName, calc: 'AVG', label: `Durchschnitt (${fieldName})`, value: Math.round(avg * 100) / 100 });
        } else if (summary.calculation === 'MIN') {
          const min = Math.min(...vals);
          results.push({ fieldName, calc: 'MIN', label: `Minimum (${fieldName})`, value: min });
        } else if (summary.calculation === 'MAX') {
          const max = Math.max(...vals);
          results.push({ fieldName, calc: 'MAX', label: `Maximum (${fieldName})`, value: max });
        }
      }
    });
    return results;
  };

  // Grand totals across all records
  const grandTotalSummaries = useMemo(() => {
    return calculateSummaries(data);
  }, [data, report.summaries]);

  // Multi-level grouping processor
  const processedGroups = useMemo(() => {
    if (groupLevels.length === 0) {
      return [{
        groupPath: [],
        level: 0,
        groupValue: 'Gesamt',
        fieldLabel: '',
        items: data,
        summaries: calculateSummaries(data)
      }];
    }

    // Single or Multi-level grouping logic
    const level1Group = groupLevels[0];
    const level1Field = sourceFields.find(f => f.id === level1Group.fieldId);
    const level1FieldName = level1Field?.name || level1Group.fieldName || '';

    const groupedMap: Record<string, Record<string, any>[]> = {};
    data.forEach(row => {
      let rawVal = row[level1FieldName];
      if (rawVal === undefined || rawVal === null || rawVal === '') rawVal = '(Nicht angegeben)';
      let key = String(rawVal);
      if (report.settings?.groupMethod === 'firstLetter') {
        key = key.charAt(0).toUpperCase();
      }
      if (!groupedMap[key]) groupedMap[key] = [];
      groupedMap[key].push(row);
    });

    const sortedKeys = Object.keys(groupedMap).sort((a, b) => {
      return level1Group.sortOrder === 'desc' ? b.localeCompare(a) : a.localeCompare(b);
    });

    return sortedKeys.map(key => ({
      groupPath: [key],
      level: 0,
      groupValue: key,
      fieldLabel: level1FieldName,
      items: groupedMap[key],
      summaries: calculateSummaries(groupedMap[key], level1Group.fieldId)
    }));
  }, [data, groupLevels, sourceFields, report.summaries, report.settings?.groupMethod]);

  const handleExportPDF = () => {
      const doc = new jsPDF({ orientation: report.settings?.orientation || 'portrait' });
      
      doc.setFontSize(report.styles?.header?.fontSize || 18);
      if(report.styles?.header?.bold) doc.setFont('helvetica', 'bold');
      if(report.styles?.header?.color) doc.setTextColor(report.styles.header.color);
      doc.text(report.name, 14, 15);
      
      doc.setFontSize(10);
      doc.setTextColor(100, 100, 100);
      doc.setFont('helvetica', 'normal');
      if (report.settings?.subtitle) {
        doc.text(report.settings.subtitle, 14, 22);
      }
      doc.text(`Erstellt am: ${new Date().toLocaleDateString()}`, 14, report.settings?.subtitle ? 27 : 22);
      
      let finalY = report.settings?.subtitle ? 34 : 28;

      processedGroups.forEach(group => {
          if (finalY > 250) { doc.addPage(); finalY = 20; }

          if (groupLevels.length > 0) {
              doc.setFontSize(11);
              doc.setFont('helvetica', 'bold');
              doc.setFillColor(240, 243, 246);
              doc.rect(14, finalY, 182, 8, 'F');
              doc.setTextColor(30, 41, 59);
              doc.text(`${group.fieldLabel}: ${group.groupValue}`, 16, finalY + 5.5);
              finalY += 12;
          }

          const tableHeaders = displayColumns.map(c => c.label);
          const tableBody = group.items.map(item => displayColumns.map(col => String(item[col.fieldName] ?? '')));

          autoTable(doc, {
              startY: finalY,
              head: [tableHeaders],
              body: tableBody,
              theme: report.settings?.showGridlines ? 'grid' : report.settings?.zebraStriping ? 'striped' : 'plain',
              styles: { 
                  fontSize: report.styles?.detail?.fontSize || 9, 
                  cellPadding: 2,
              },
              headStyles: { 
                  fillColor: [226, 232, 240], 
                  textColor: [51, 65, 85], 
                  fontStyle: 'bold',
              },
              margin: { left: groupLevels.length > 0 ? 20 : 14, right: 14 }
          });

          // @ts-ignore
          finalY = doc.lastAutoTable.finalY + 5;

          if (group.summaries.length > 0) {
              doc.setFontSize(9);
              doc.setFont('helvetica', 'bold');
              doc.setTextColor(15, 23, 42);
              const summaryText = group.summaries.map(s => `${s.label}: ${s.value}`).join('   |   ');
              doc.text(`[Gruppen-Summe]: ${summaryText}`, groupLevels.length > 0 ? 20 : 14, finalY);
              finalY += 10;
          }
          
          if (report.settings?.pageBreakAfterGroup) {
              doc.addPage();
              finalY = 20;
          } else {
              finalY += 4;
          }
      });

      // Overall Grand Total
      if (grandTotalSummaries.length > 0) {
        if (finalY > 250) { doc.addPage(); finalY = 20; }
        doc.setFontSize(10);
        doc.setFont('helvetica', 'bold');
        doc.setFillColor(226, 232, 240);
        doc.rect(14, finalY, 182, 8, 'F');
        doc.setTextColor(15, 23, 42);
        const text = grandTotalSummaries.map(s => `${s.label}: ${s.value}`).join('   |   ');
        doc.text(`GESAMTERGEBNIS: ${text}`, 16, finalY + 5.5);
      }

      doc.save(`${report.name.replace(/[^a-z0-9]/gi, '_')}.pdf`);
  };

  const handleExportExcel = () => {
      const exportData = processedGroups.flatMap(group => {
          return group.items.map(item => {
              const row: any = {};
              if (groupLevels.length > 0) {
                  row[`[Gruppe] ${group.fieldLabel}`] = group.groupValue;
              }
              displayColumns.forEach(col => {
                  row[col.label] = item[col.fieldName];
              });
              return row;
          });
      });

      const ws = XLSX.utils.json_to_sheet(exportData);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Bericht");
      XLSX.writeFile(wb, `${report.name.replace(/[^a-z0-9]/gi, '_')}.xlsx`);
  };

  const getCellStyle = (value: any, column: ReportColumn): React.CSSProperties => {
      let style = { ...getCssFromStyle(report.styles?.detail) };
      if (!column.formattingRules || column.formattingRules.length === 0) return style;
      const numValue = Number(value);
      const isNum = !isNaN(numValue) && value !== '';
      for (const rule of column.formattingRules) {
          let match = false;
          const ruleVal = Number(rule.value);
          switch(rule.operator) {
              case 'eq': match = String(value) === rule.value; break;
              case 'neq': match = String(value) !== rule.value; break;
              case 'contains': match = String(value).toLowerCase().includes(rule.value.toLowerCase()); break;
              case 'gt': match = isNum && numValue > ruleVal; break;
              case 'lt': match = isNum && numValue < ruleVal; break;
              case 'gte': match = isNum && numValue >= ruleVal; break;
              case 'lte': match = isNum && numValue <= ruleVal; break;
          }
          if (match) {
              const ruleCss = getCssFromStyle(rule.style);
              style = { ...style, ...ruleCss };
          }
      }
      return style;
  };

  const targetTable = detailView ? allTables.find(t => t.id === detailView.targetTableId) : null;
  const isLandscape = report.settings?.orientation === 'landscape';
  const sizeClasses = isLandscape ? 'max-w-[297mm] min-h-[210mm]' : 'max-w-[210mm] min-h-[297mm]';

  return (
    <div className={`${widgetMode ? 'bg-transparent' : 'bg-slate-200'} h-full overflow-hidden flex flex-col`}>
      <style>{`
        @media print {
          @page {
            size: ${isLandscape ? 'landscape' : 'portrait'};
            margin: 15mm;
          }
          body {
            -webkit-print-color-adjust: exact;
          }
        }
      `}</style>

      {/* Sticky Toolbar */}
      {!widgetMode && (
          <div className="bg-white border-b border-slate-300 p-2 flex justify-between items-center flex-shrink-0 sticky top-0 z-20 shadow-sm">
              <div className="flex items-center gap-2 pl-2 text-xs font-bold text-slate-700">
                <Printer size={16} className="text-blue-600" />
                <span>Berichtsvorschau</span>
                <span className="text-slate-400 font-normal">| {processedGroups.length} Gruppen ({data.length} Datensätze)</span>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={() => window.print()} className="flex items-center gap-1.5 bg-slate-700 hover:bg-slate-800 text-white px-3 py-1.5 rounded font-semibold text-xs transition-colors shadow-sm">
                    <Printer size={14}/> Drucken
                </button>
                <button onClick={handleExportExcel} className="flex items-center gap-1.5 bg-green-600 hover:bg-green-700 text-white px-3 py-1.5 rounded font-semibold text-xs transition-colors shadow-sm">
                    <FileSpreadsheet size={14}/> Excel
                </button>
                <button onClick={handleExportPDF} className="flex items-center gap-1.5 bg-red-600 hover:bg-red-700 text-white px-3 py-1.5 rounded font-semibold text-xs transition-colors shadow-sm">
                    <FileText size={14}/> PDF
                </button>
              </div>
          </div>
      )}

      <div className={`${widgetMode ? 'p-2 relative' : 'p-8 flex-1 bg-slate-200'} overflow-auto`}>
        <div className={widgetMode ? 'w-full bg-white h-full' : `mx-auto bg-white shadow-2xl p-[15mm] border border-slate-300 transition-all duration-300 ${sizeClasses}`}>
            
            {/* 1. BERICHTSKOPF (Report Header) */}
            {(!widgetMode && report.settings?.showReportHeader !== false) && (
                <header className="border-b-2 border-slate-800 pb-4 mb-6" style={getCssFromStyle(report.styles?.header)}>
                    <div className="flex justify-between items-start">
                        <div className="space-y-1">
                            {report.settings?.companyLogoUrl && (
                              <img src={report.settings.companyLogoUrl} alt="Logo" className="h-10 mb-2 object-contain" />
                            )}
                            <h1 className="text-2xl font-black text-slate-900 tracking-tight" style={{ color: 'inherit', fontSize: 'inherit' }}>
                              {report.name}
                            </h1>
                            {report.settings?.subtitle && (
                              <p className="text-xs text-slate-600 font-medium">{report.settings.subtitle}</p>
                            )}
                            <p className="text-[10px] text-slate-400 uppercase tracking-widest font-bold pt-1">
                              BERICHT • SEKTION: BERICHTSKOPF
                            </p>
                        </div>
                        <div className="text-right text-xs text-slate-500 font-mono">
                            <p className="font-semibold text-slate-700">Datum: {new Date().toLocaleDateString('de-DE')}</p>
                            <p className="text-[10px]">Uhrzeit: {new Date().toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })}</p>
                        </div>
                    </div>
                </header>
            )}

            {/* Embedded Chart if enabled */}
            {report.chartConfig && report.chartConfig.enabled && (
              <ReportChartRenderer
                config={report.chartConfig}
                data={data}
                sourceFields={sourceFields}
              />
            )}

            {/* 2. HAUPTDATEN & GRUPPIERUNG (Detail Band & Group Headers/Footers) */}
            <main className="space-y-6">
            {processedGroups.map((group, groupIdx) => (
                <div key={groupIdx} className="break-inside-avoid border border-slate-200 rounded-lg overflow-hidden shadow-xs">
                    
                    {/* GRUPPENKOPF (Group Header) */}
                    {groupLevels.length > 0 && (
                        <div 
                            className="flex items-center justify-between px-3 py-2 bg-slate-100 border-b border-slate-300 text-slate-800 font-bold text-sm"
                            style={getCssFromStyle(report.styles?.groupHeader)}
                        >
                            <div className="flex items-center gap-2">
                                <span className="p-1 bg-slate-800 text-white rounded text-[10px] font-mono">GRUPPE</span>
                                <span className="text-xs text-slate-500 font-semibold">{group.fieldLabel}:</span>
                                <span className="text-sm font-bold text-slate-900">{group.groupValue}</span>
                            </div>
                            <span className="text-xs text-slate-500 font-mono font-normal bg-white px-2 py-0.5 rounded border border-slate-200">
                              {group.items.length} Zeilen
                            </span>
                        </div>
                    )}
                    
                    {/* DETAILBEREICH (Detail Band Table) */}
                    <div className="overflow-x-auto">
                        <table className={`w-full text-left text-xs border-collapse ${report.settings?.showGridlines ? 'border border-slate-300 divide-y divide-slate-300' : ''}`}>
                            <thead>
                                <tr className="bg-slate-50 border-b border-slate-300 text-slate-600 font-bold uppercase tracking-wider text-[11px]" style={getCssFromStyle(report.styles?.columnHeader)}>
                                    {displayColumns.map(col => (
                                        <th key={col.id} className={`p-2.5 font-bold ${report.settings?.showGridlines ? 'border-r border-slate-200 last:border-r-0' : ''}`}>
                                            {col.label}
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-200">
                                {group.items.map((item, itemIndex) => {
                                    const isZebra = report.settings?.zebraStriping && itemIndex % 2 === 1;
                                    const parentKeyValue = report.subReport ? item[sourceFields.find(f => f.id === report.subReport?.parentKeyFieldId)?.name || 'id'] : null;

                                    return (
                                      <React.Fragment key={itemIndex}>
                                        <tr className={`transition-colors ${isZebra ? 'bg-slate-50/80' : 'bg-white'} hover:bg-blue-50/50`}>
                                            {displayColumns.map(col => {
                                                const val = getRecordValue(item, col.fieldName, col.label);
                                                return (
                                                <td key={col.id} className={`p-2.5 whitespace-nowrap ${report.settings?.showGridlines ? 'border-r border-slate-200 last:border-r-0' : ''}`} style={getCellStyle(val, { ...col } as any)}>
                                                    <div className="flex items-center gap-2">
                                                        <ReportCellRenderer value={val} renderType={col.renderType || 'text'} />
                                                        {col.isFK && col.targetTableId && val && (
                                                            <button 
                                                                onClick={() => setDetailView({ targetTableId: col.targetTableId!, recordId: val })}
                                                                className="text-blue-500 hover:text-blue-700 opacity-0 group-hover:opacity-100 transition-opacity"
                                                                title="Details anzeigen"
                                                            >
                                                                <ExternalLink size={12}/>
                                                            </button>
                                                        )}
                                                    </div>
                                                </td>
                                                );
                                            })}
                                        </tr>

                                        {/* Nested Sub-Report if configured */}
                                        {report.subReport && report.subReport.reportId && (
                                          <tr className="bg-slate-50/60">
                                            <td colSpan={displayColumns.length} className="p-2 pl-6">
                                              <SubReportRenderer
                                                subReportId={report.subReport.reportId}
                                                foreignKeyFieldId={report.subReport.foreignKeyFieldId}
                                                parentKeyValue={parentKeyValue}
                                                allReports={allReports}
                                                allTables={allTables}
                                                allQueries={allQueries}
                                              />
                                            </td>
                                          </tr>
                                        )}
                                      </React.Fragment>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>

                    {/* GRUPPENFUSS (Group Footer with Calculations) */}
                    {group.summaries.length > 0 && (
                        <div className="bg-amber-50/80 px-3 py-2 border-t border-amber-200 flex flex-wrap items-center gap-4 text-xs" style={getCssFromStyle(report.styles?.footer)}>
                            <div className="flex items-center gap-1 font-bold text-amber-900">
                              <Calculator size={14} className="text-amber-700" />
                              <span>Gruppenfuss-Ergebnisse:</span>
                            </div>
                            {group.summaries.map((sum, i) => (
                              <div key={i} className="flex items-center gap-1 bg-white px-2 py-1 rounded border border-amber-300 shadow-2xs">
                                <span className="text-[10px] font-bold text-amber-800 uppercase">{sum.label}:</span>
                                <span className="font-mono font-bold text-slate-900">{sum.value}</span>
                              </div>
                            ))}
                        </div>
                    )}
                </div>
            ))}
            
            {/* 3. BERICHTSFUSS / GESAMTERGEBNISSE (Report Footer - Grand Totals) */}
            {grandTotalSummaries.length > 0 && (
              <div className="mt-8 p-4 bg-slate-900 text-white rounded-lg shadow-md space-y-2 border border-slate-800">
                <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                  <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-amber-400">
                    <Calculator size={16} />
                    <span>Berichtsfuss — Gesamtergebnisse ({data.length} Datensätze gesamt)</span>
                  </div>
                </div>
                <div className="flex flex-wrap gap-4 pt-1">
                  {grandTotalSummaries.map((sum, i) => (
                    <div key={i} className="bg-slate-800 px-3 py-1.5 rounded border border-slate-700 flex items-center gap-2">
                      <span className="text-xs text-slate-300 font-medium">{sum.label}:</span>
                      <span className="text-sm font-bold font-mono text-amber-300">{sum.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {data.length === 0 && (
                <div className="p-12 text-center border-2 border-dashed border-slate-200 rounded-lg text-slate-400">
                    Keine Daten für diesen Bericht vorhanden.
                </div>
            )}
            </main>

            {/* 4. SEITENFUSS (Page Footer) */}
            {(!widgetMode && report.settings?.showPageFooter !== false) && (
              <footer className="mt-12 pt-3 border-t border-slate-200 flex justify-between items-center text-[11px] text-slate-400 font-mono">
                <div>DB Studio Pro • Report Engine</div>
                <div>Seite 1 von 1</div>
              </footer>
            )}
        </div>
      </div>

      {detailView && targetTable && (
          <RecordDetailModal 
            table={targetTable} 
            recordId={detailView.recordId} 
            onClose={() => setDetailView(null)} 
          />
      )}
    </div>
  );
};

