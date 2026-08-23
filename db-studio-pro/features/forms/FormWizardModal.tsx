import React, { useState, useMemo } from 'react';
import { Table, Query, Form, FormElement, Relationship } from '../../types/index';
import { X, Layout, Columns, Layers, Info } from 'lucide-react';
import { useProjectStore } from '../../stores/useProjectStore';

interface FormWizardModalProps {
  tables: Table[];
  queries: Query[];
  onSave: (form: Form) => void;
  onClose: () => void;
}

export const FormWizardModal: React.FC<FormWizardModalProps> = ({
  tables,
  queries,
  onSave,
  onClose,
}) => {
  const store = useProjectStore();
  const { relationships, forms, setForms } = store;

  const [formName, setFormName] = useState('Neues Formular');
  const [source, setSource] = useState<string>(''); // "table:id" or "query:id"
  const [selectedSubforms, setSelectedSubforms] = useState<Record<string, boolean>>({});

  const dataSources = useMemo(() => [
    ...tables.map(t => ({ id: `table:${t.id}`, name: t.name, type: 'Tabelle' })),
    ...queries.map(q => ({ id: `query:${q.id}`, name: q.name, type: 'Abfrage' }))
  ], [tables, queries]);

  // Find relationships linked to the selected table
  const subformOptions = useMemo(() => {
    if (!source || !source.startsWith('table:')) return [];
    const tableId = source.split(':')[1];
    const options: {
      table: Table;
      relationship: Relationship;
      masterFieldId: string;
      childFieldId: string;
      displayName: string;
    }[] = [];

    relationships.forEach(r => {
      if (r.fromTableId === tableId) {
        const otherTable = tables.find(t => t.id === r.toTableId);
        if (otherTable) {
          options.push({
            table: otherTable,
            relationship: r,
            masterFieldId: r.fromFieldId,
            childFieldId: r.toFieldId,
            displayName: otherTable.name
          });
        }
      } else if (r.toTableId === tableId) {
        const otherTable = tables.find(t => t.id === r.fromTableId);
        if (otherTable) {
          options.push({
            table: otherTable,
            relationship: r,
            masterFieldId: r.toFieldId,
            childFieldId: r.fromFieldId,
            displayName: otherTable.name
          });
        }
      }
    });

    // De-duplicate options by target table ID to keep UI clean
    const seen = new Set<string>();
    return options.filter(opt => {
      if (seen.has(opt.table.id)) return false;
      seen.add(opt.table.id);
      return true;
    });
  }, [source, relationships, tables]);

  const handleSourceChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
      const val = e.target.value;
      setSource(val);
      setSelectedSubforms({});
      const selected = dataSources.find(ds => ds.id === val);
      if (selected) {
          setFormName(selected.name);
      }
  };

  const toggleSubform = (tableId: string) => {
    setSelectedSubforms(prev => ({
      ...prev,
      [tableId]: !prev[tableId]
    }));
  };

  const handleSave = () => {
    if (!source || !formName) return;
    const [sourceType, sourceId] = source.split(':');
    
    let sourceFields: { id: string, name: string }[] = [];
    if (sourceType === 'table') {
        sourceFields = tables.find(t => t.id === sourceId)?.fields || [];
    } else {
        const query = queries.find(q => q.id === sourceId);
        if (query && query.type === 'SELECT') {
            const fieldMap = new Map<string, { id: string, name: string }>();
            query.columns.forEach(col => {
                const table = tables.find(t => t.id === col.tableId);
                const field = table?.fields.find(f => f.id === col.fieldId);
                if (field && !fieldMap.has(field.id)) {
                    fieldMap.set(field.id, { id: field.id, name: field.name });
                }
            });
            sourceFields = Array.from(fieldMap.values());
        }
    }

    const activeSubformOptions = subformOptions.filter(opt => selectedSubforms[opt.table.id]);
    const generatedFormsToSave: Form[] = [];

    let rootLayout: FormElement;

    const getFieldWidgetType = (fieldId: string, fieldName: string): FormElement['widgetType'] | undefined => {
      const field = (sourceType === 'table' ? tables.find(t => t.id === sourceId) : undefined)?.fields.find(f => f.id === fieldId);
      if (field?.rendererType === 'markdown') return 'markdown';
      const nameLower = fieldName.toLowerCase();
      if (nameLower.includes('markdown') || nameLower.includes('beschreibung') || nameLower.includes('notiz') || nameLower.includes('dokumentation') || nameLower.includes('details') || nameLower.includes('inhalt') || nameLower.includes('content')) {
        return 'markdown';
      }
      if (field?.type === 'TEXT') return 'markdown';
      if (field?.type === 'BOOLEAN') return 'checkbox';
      if (field?.type === 'DATE') return 'date';
      if (field?.type === 'INTEGER' || field?.type === 'DECIMAL') return 'number';
      return undefined;
    };

    if (activeSubformOptions.length > 0) {
        // TABBED LAYOUT: Organize main fields and subforms into separate tab pages
        const mainTabPage: FormElement = {
            id: 'tabpage_' + crypto.randomUUID(),
            type: 'tab_page',
            label: 'Allgemein',
            children: sourceFields.map(f => {
                const wType = getFieldWidgetType(f.id, f.name);
                return {
                    id: crypto.randomUUID(),
                    type: 'field',
                    fieldId: f.id,
                    label: f.name,
                    widgetType: wType,
                    className: 'mb-4'
                };
            })
        };

        const tabPages: FormElement[] = [mainTabPage];

        activeSubformOptions.forEach(opt => {
            // Find existing form for the child table or auto-generate a subform
            let childForm = forms.find(f => f.sourceId === opt.table.id);
            let childFormId = childForm?.id;

            if (!childFormId) {
                // Generate default subform for B
                const childFormFields = opt.table.fields || [];
                const newChildFormId = crypto.randomUUID();
                const newChildForm: Form = {
                    id: newChildFormId,
                    name: `Subform ${opt.table.name}`,
                    sourceType: 'table',
                    sourceId: opt.table.id,
                    layout: {
                        id: crypto.randomUUID(),
                        type: 'container',
                        className: 'p-4 space-y-2',
                        children: childFormFields.map(f => {
                            const nameLower = f.name.toLowerCase();
                            const isMd = f.rendererType === 'markdown' || f.type === 'TEXT' || nameLower.includes('markdown') || nameLower.includes('beschreibung') || nameLower.includes('notiz');
                            return {
                                id: crypto.randomUUID(),
                                type: 'field',
                                fieldId: f.id,
                                label: f.name,
                                widgetType: isMd ? 'markdown' : undefined,
                                className: 'mb-4'
                            };
                        })
                    },
                    fields: childFormFields.map(f => ({ fieldId: f.id, label: f.name }))
                };
                generatedFormsToSave.push(newChildForm);
                childFormId = newChildFormId;
            }

            tabPages.push({
                id: 'tabpage_' + crypto.randomUUID(),
                type: 'tab_page',
                label: opt.table.name,
                children: [
                    {
                        id: crypto.randomUUID(),
                        type: 'subform',
                        label: opt.table.name,
                        subform: {
                            formId: childFormId,
                            masterLinkFieldId: opt.masterFieldId,
                            childLinkFieldId: opt.childFieldId,
                            canAdd: true,
                            canEdit: true,
                            canDelete: true
                        },
                        className: 'border p-2 rounded bg-indigo-50/20'
                    }
                ]
            });
        });

        rootLayout = {
            id: crypto.randomUUID(),
            type: 'tabs',
            className: 'my-2',
            children: tabPages
        };
    } else {
        // FLAT CONTAINER LAYOUT
        const children: FormElement[] = sourceFields.map(f => {
            const wType = getFieldWidgetType(f.id, f.name);
            return {
                id: crypto.randomUUID(),
                type: 'field',
                fieldId: f.id,
                label: f.name,
                widgetType: wType,
                className: 'mb-4'
            };
        });

        rootLayout = {
            id: crypto.randomUUID(),
            type: 'container',
            className: 'p-4 space-y-2',
            children: children
        };
    }

    const parentForm: Form = {
      id: crypto.randomUUID(),
      name: formName,
      sourceType: sourceType as 'table' | 'query',
      sourceId,
      layout: rootLayout,
      fields: sourceFields.map(f => ({ fieldId: f.id, label: f.name }))
    };

    // Save all forms including any new subforms to the store
    if (generatedFormsToSave.length > 0) {
      setForms([...forms, ...generatedFormsToSave, parentForm]);
    } else {
      setForms([...forms, parentForm]);
    }

    onSave(parentForm);
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center animate-in fade-in-25">
      <div className="bg-white dark:bg-slate-900 rounded-lg shadow-2xl w-full max-w-lg border border-slate-300 dark:border-slate-800 flex flex-col max-h-[85vh]">
        <div className="flex justify-between items-center p-4 bg-slate-100 dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <Layout className="text-indigo-600 dark:text-indigo-400" />
            <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100">Formular erstellen</h2>
          </div>
          <button onClick={onClose} className="text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200"><X size={20} /></button>
        </div>
        
        <div className="p-6 space-y-5 overflow-y-auto flex-1">
          <div>
            <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1">Datenquelle auswählen</label>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-2">Wählen Sie eine Tabelle oder Abfrage, auf der das Formular basieren soll.</p>
            <select value={source} onChange={handleSourceChange} className="w-full border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 rounded p-2 text-sm dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500">
              <option value="">Bitte wählen...</option>
              {dataSources.map(ds => <option key={ds.id} value={ds.id}>{ds.type}: {ds.name}</option>)}
            </select>
          </div>

          <div>
            <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1">Formularname</label>
            <input type="text" value={formName} onChange={e => setFormName(e.target.value)} className="w-full border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 rounded p-2 text-sm dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>

          {/* Subform checkboxes with Tab Integration notice */}
          {subformOptions.length > 0 && (
            <div className="border border-slate-200 dark:border-slate-800 rounded-lg p-4 bg-slate-50 dark:bg-slate-950/40">
              <span className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-2 mb-1.5">
                <Layers size={14} className="text-indigo-500" /> Unterformulare einbinden
              </span>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mb-3 flex items-start gap-1">
                <Info size={12} className="shrink-0 text-slate-400 mt-0.5" />
                <span>Es wurden verknüpfte Tabellen gefunden. Aktivierte Unterformulare werden automatisch als eigene <strong>Registerkarten (Tabs)</strong> generiert!</span>
              </p>
              <div className="space-y-2 max-h-32 overflow-y-auto">
                {subformOptions.map(opt => (
                  <label key={opt.table.id} className="flex items-center gap-3 p-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded hover:bg-indigo-50/50 dark:hover:bg-indigo-950/10 cursor-pointer transition-colors">
                    <input 
                      type="checkbox" 
                      checked={!!selectedSubforms[opt.table.id]} 
                      onChange={() => toggleSubform(opt.table.id)}
                      className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 h-4 w-4"
                    />
                    <div className="text-xs">
                      <span className="font-bold text-slate-800 dark:text-slate-200">{opt.table.name}</span>
                      <span className="text-slate-400 dark:text-slate-500 ml-1.5">
                        ({opt.table.fields.find(f => f.id === opt.childFieldId)?.name} ➔ {tables.find(t => t.id === source.split(':')[1])?.fields.find(f => f.id === opt.masterFieldId)?.name})
                      </span>
                    </div>
                  </label>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="flex justify-end gap-3 p-4 bg-slate-50 dark:bg-slate-950 border-t border-slate-200 dark:border-slate-800">
          <button onClick={onClose} className="bg-slate-200 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 px-4 py-2 rounded text-sm">Abbrechen</button>
          <button onClick={handleSave} disabled={!source || !formName} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded text-sm font-semibold disabled:opacity-50">Formular erstellen</button>
        </div>
      </div>
    </div>
  );
};
