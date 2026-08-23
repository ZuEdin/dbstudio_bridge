import React from 'react';
import { Report, Table, Query } from '../../../types/index';
import { ReportCellRenderer } from './ReportCellRenderer';

interface SubReportRendererProps {
  subReportId: string;
  foreignKeyFieldId: string;
  parentKeyValue: any;
  allReports?: Report[];
  allTables?: Table[];
  allQueries?: Query[];
}

export const SubReportRenderer: React.FC<SubReportRendererProps> = ({
  subReportId,
  foreignKeyFieldId,
  parentKeyValue,
  allReports = [],
  allTables = [],
  allQueries = []
}) => {
  const childReport = allReports.find(r => r.id === subReportId);
  if (!childReport) {
    return (
      <div className="p-2 text-xs text-slate-400 italic bg-slate-50 rounded border border-slate-200">
        Unterbericht nicht gefunden (ID: {subReportId})
      </div>
    );
  }

  // Find source table or query
  let childData: Record<string, any>[] = [];
  let childFields: { id: string; name: string }[] = [];

  if (childReport.sourceType === 'table') {
    const table = allTables.find(t => t.id === childReport.sourceId);
    if (table) {
      childFields = table.fields;
      childData = table.data || [];
    }
  } else if (childReport.sourceType === 'query') {
    const query = allQueries.find(q => q.id === childReport.sourceId);
    if (query && query.type === 'SELECT') {
      childFields = query.columns.map(c => ({ id: c.fieldId, name: c.fieldName }));
      // Data matching child query can be retrieved if executed
    }
  }

  // Filter child records matching parent key
  const fkFieldName = childFields.find(f => f.id === foreignKeyFieldId)?.name || foreignKeyFieldId;
  const filteredChildData = childData.filter(row => {
    return String(row[fkFieldName]) === String(parentKeyValue);
  });

  const displayCols = childReport.columns && childReport.columns.length > 0
    ? childReport.columns.filter(c => c.visible).sort((a, b) => a.order - b.order)
    : childFields.map((f, i) => ({ fieldId: f.id, label: f.name, visible: true, order: i }));

  return (
    <div className="my-2 p-3 bg-slate-50 border border-slate-300 rounded-lg shadow-2xs">
      <div className="text-[11px] font-bold text-slate-700 mb-1.5 uppercase tracking-wider flex items-center gap-1.5">
        <span className="w-2 h-2 rounded-full bg-blue-600"></span>
        <span>Unterbericht: {childReport.name} ({filteredChildData.length} Einträge)</span>
      </div>

      {filteredChildData.length > 0 ? (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs bg-white border border-slate-200 rounded">
            <thead>
              <tr className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                {displayCols.map(col => {
                  const field = childFields.find(f => f.id === col.fieldId);
                  return (
                    <th key={col.fieldId} className="p-2 border-r border-slate-200 last:border-r-0">
                      {col.label || field?.name || col.fieldId}
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {filteredChildData.map((row, rowIdx) => (
                <tr key={rowIdx} className="hover:bg-slate-50">
                  {displayCols.map(col => {
                    const field = childFields.find(f => f.id === col.fieldId);
                    const fieldName = field?.name || col.fieldId;
                    return (
                      <td key={col.fieldId} className="p-2 border-r border-slate-200 last:border-r-0">
                        <ReportCellRenderer
                          value={row[fieldName]}
                          renderType={(col as any).renderType || 'text'}
                        />
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="text-xs text-slate-400 italic p-2 bg-white rounded border border-slate-200">
          Keine zugehörigen Daten für diesen Eintrag vorhanden.
        </div>
      )}
    </div>
  );
};
