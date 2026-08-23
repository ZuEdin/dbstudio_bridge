
import React, { useState, useMemo } from 'react';
import { Table, Query, Report, Field, ReportSummary } from '../../types/index';
import { X, FileText } from 'lucide-react';

interface ReportWizardModalProps {
  tables: Table[];
  queries: Query[];
  onSave: (report: Report) => void;
  onClose: () => void;
}

export const ReportWizardModal: React.FC<ReportWizardModalProps> = ({
  tables,
  queries,
  onSave,
  onClose,
}) => {
  const [reportName, setReportName] = useState('Neuer Bericht');
  const [source, setSource] = useState<string>('');
  const [groupingFieldId, setGroupingFieldId] = useState<string>('');
  const [summaries, setSummaries] = useState<ReportSummary[]>([]);

  const dataSources = useMemo(() => [
    { id: 'dashboard:none', name: 'Leeres Dashboard', type: 'Dashboard' },
    ...tables.map(t => ({ id: `table:${t.id}`, name: t.name, type: 'Tabelle' })),
    ...queries.map(q => ({ id: `query:${q.id}`, name: q.name, type: 'Abfrage' }))
  ], [tables, queries]);

  const handleSourceChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
      const val = e.target.value;
      setSource(val);
      const selected = dataSources.find(ds => ds.id === val);
      if (selected) {
          setReportName(selected.name);
      }
  };

  const selectedSourceFields = useMemo((): Field[] => {
    if (!source) return [];
    const [type, id] = source.split(':');
    if (type === 'table') {
      return tables.find(t => t.id === id)?.fields || [];
    }
    if (type === 'query') {
      const query = queries.find(q => q.id === id);
      if (!query || query.type !== 'SELECT') return [];
      
      // Use Query Columns as pseudo-fields to ensure aliases are respected
      return query.columns.map(col => {
          const table = tables.find(t => t.id === col.tableId);
          const field = table?.fields.find(f => f.id === col.fieldId);
          return {
              id: col.id, // Use QueryColumn ID to link to report column
              name: col.alias && col.alias.trim() !== '' ? col.alias : col.fieldName,
              type: field?.type || 'VARCHAR', // Fallback type
              isPrimaryKey: false
          };
      });
    }
    return [];
  }, [source, tables, queries]);

  const handleSummaryChange = (field: Field, calc: 'SUM' | 'COUNT', checked: boolean) => {
    setSummaries(prev => {
      const existing = prev.find(s => s.fieldId === field.id && s.calculation === calc);
      if (checked && !existing) {
        return [...prev, { fieldId: field.id, fieldName: field.name, calculation: calc }];
      }
      if (!checked && existing) {
        return prev.filter(s => !(s.fieldId === field.id && s.calculation === calc));
      }
      return prev;
    });
  };

  const handleSave = () => {
    if (!source || !reportName) return;
    const [sourceType, sourceId] = source.split(':');
    
    // Initialize columns for the report based on selected fields
    const initialColumns = selectedSourceFields.map((f, i) => ({
        fieldId: f.id,
        label: f.name,
        visible: true,
        order: i
    }));

    const groupingFieldsList = groupingFieldId ? [{
      fieldId: groupingFieldId,
      fieldName: selectedSourceFields.find(f => f.id === groupingFieldId)?.name || '',
      sortOrder: 'asc' as const,
      showHeader: true,
      showFooter: true
    }] : [];

    const newReport: Report = {
      id: crypto.randomUUID(),
      name: reportName,
      sourceType: sourceType as 'table' | 'query' | 'dashboard',
      sourceId,
      groupingFieldId: groupingFieldId || undefined,
      groupingFields: groupingFieldsList,
      summaries,
      columns: initialColumns,
      dashboardWidgets: sourceType === 'dashboard' ? [] : undefined,
      settings: {
        orientation: 'portrait',
        pageSize: 'A4',
        showGridlines: true,
        zebraStriping: true,
        showReportHeader: true,
        showReportFooter: true,
        showPageFooter: true
      }
    };
    onSave(newReport);
  };
  
  const numericFields = selectedSourceFields.filter(f => f.type === 'INTEGER');

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center animate-in fade-in-25">
      <div className="bg-white rounded-lg shadow-2xl w-full max-w-2xl border border-slate-300 flex flex-col">
        <div className="flex justify-between items-center p-4 bg-slate-100 border-b border-slate-200">
          <div className="flex items-center gap-2">
            <FileText className="text-green-600" />
            <h2 className="text-lg font-bold text-slate-800">Bericht erstellen</h2>
          </div>
          <button onClick={onClose} className="text-slate-500 hover:text-slate-800"><X size={20} /></button>
        </div>
        
        <div className="p-6 overflow-y-auto" style={{ maxHeight: '70vh' }}>
          <div className="space-y-6">
            
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1">1. Datenquelle auswählen</label>
              <select value={source} onChange={handleSourceChange} className="w-full border border-slate-300 rounded p-2 text-sm">
                <option value="">Bitte wählen...</option>
                {dataSources.map(ds => <option key={ds.id} value={ds.id}>{ds.type}: {ds.name}</option>)}
              </select>
            </div>

            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1">Berichtsname</label>
              <input type="text" value={reportName} onChange={e => setReportName(e.target.value)} className="w-full max-w-md border border-slate-300 rounded p-2 text-sm" />
            </div>

            {source && (
              <>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">2. Gruppieren nach (optional)</label>
                  <select value={groupingFieldId} onChange={e => setGroupingFieldId(e.target.value)} className="w-full border border-slate-300 rounded p-2 text-sm">
                    <option value="">Keine Gruppierung</option>
                    {selectedSourceFields.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
                  </select>
                </div>
                {numericFields.length > 0 && (
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-1">3. Zusammenfassungen (optional)</label>
                    <div className="border border-slate-200 rounded p-3 space-y-2 bg-slate-50">
                      {numericFields.map(field => (
                        <div key={field.id} className="grid grid-cols-3 items-center text-sm">
                          <span className="font-semibold">{field.name}</span>
                           <label className="flex items-center gap-2"><input type="checkbox" onChange={e => handleSummaryChange(field, 'SUM', e.target.checked)} /> Summe</label>
                           <label className="flex items-center gap-2"><input type="checkbox" onChange={e => handleSummaryChange(field, 'COUNT', e.target.checked)} /> Anzahl</label>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>

        <div className="flex justify-end gap-3 p-4 bg-slate-50 border-t border-slate-200">
          <button onClick={onClose} className="bg-slate-200 hover:bg-slate-300 text-slate-800 px-4 py-2 rounded text-sm">Abbrechen</button>
          <button onClick={handleSave} disabled={!source || !reportName} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded text-sm font-semibold disabled:opacity-50">Bericht erstellen</button>
        </div>
      </div>
    </div>
  );
};
