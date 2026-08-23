import React, { useState, useEffect } from 'react';
import { 
  Box, Code, Save, ArrowLeft, AlertCircle, RefreshCw, Eye, CheckCircle2 
} from 'lucide-react';
import { useUIStore } from '../../../stores/useUIStore';
import { useProjectStore } from '../../../stores/useProjectStore';
import { CustomComponent } from '../../../types';
import { executeSelectQuery } from '../../queries/utils/queryExecution';

// Import small sub-components
import { MetadataSection } from './components/MetadataSection';
import { TableViewDesigner } from './components/TableViewDesigner';
import { ChartViewDesigner } from './components/ChartViewDesigner';
import { FormViewDesigner } from './components/FormViewDesigner';
import { TextViewDesigner } from './components/TextViewDesigner';
import { ButtonViewDesigner } from './components/ButtonViewDesigner';
import { DropdownViewDesigner } from './components/DropdownViewDesigner';
import { MetricCardViewDesigner } from './components/MetricCardViewDesigner';
import { KanbanBoardViewDesigner } from './components/KanbanBoardViewDesigner';
import { CardTemplateDesigner } from './components/CardTemplateDesigner';
import { LayoutContainerDesigner } from './components/LayoutContainerDesigner';
import { PreviewPanel } from './components/PreviewPanel';
import { CalendarViewDesigner } from './components/CalendarViewDesigner';

interface CustomComponentDesignerProps {
  componentId?: string;
}

export const CustomComponentDesigner: React.FC<CustomComponentDesignerProps> = ({ componentId }) => {
  const ui = useUIStore();
  const { customComponents = [], setCustomComponents, saveProject, queries, tables, forms, pages, relationships } = useProjectStore();
  
  const existingComponent = componentId ? customComponents.find(c => c.id === componentId) : null;

  const [componentName, setComponentName] = useState('');
  const [componentDescription, setComponentDescription] = useState('');
  const [componentType, setComponentType] = useState<'table_view' | 'chart_view' | 'form_view' | 'text' | 'button' | 'dropdown' | 'metric_card' | 'kanban_board' | 'card_template' | 'layout_container' | 'calendar_view'>('table_view');
  
  // Tab control: 'visual' or 'json'
  const [activeTab, setActiveTab] = useState<'visual' | 'json'>('visual');
  const [configJson, setConfigJson] = useState('');
  const [jsonError, setJsonError] = useState<string | null>(null);
  
  // Local object representing the parsed config
  const [configObj, setConfigObj] = useState<any>({});
  
  // Default templates based on types
  const templates = {
    table_view: {
      dataSourceType: "table",
      dataSourceId: tables[0]?.id || '',
      layoutMode: "table", // "table" (Table) or "grid" (Card Grid)
      title: "Umsatzübersicht",
      pageSize: 5,
      tableStyle: "striped", // "striped", "compact", "bordered", "flat"
      enableSearch: true,
      searchPlaceholder: "Suchen...",
      enableFilters: false,
      filterFields: [] as string[],
      columns: [
        { field: "id", title: "ID", width: "80px", align: "left", type: "text", footerType: "none" },
        { field: "Name", title: "Name", width: "auto", align: "left", type: "text", footerType: "none" }
      ],
      cardGridCols: 3,
      cardShadow: "sm", // "none", "sm", "md", "lg"
      cardBorder: "slate", // "none", "slate", "indigo"
      cardTemplate: [
        { type: "badge", field: "Status", label: "Status", style: "bg-emerald-50 text-emerald-700 text-[10px] font-bold px-2 py-0.5 rounded-full" },
        { type: "title", field: "Name", label: "Name", style: "text-sm font-bold text-slate-800" },
        { type: "description", field: "Email", label: "E-Mail", style: "text-xs text-slate-500 mt-1" }
      ]
    },
    card_template: {
        title: "Standard Karte",
        dataSourceType: "table",
        dataSourceId: tables[0]?.id || '',
        fields: [
            { field: "Name", label: "Name", showLabel: true, fontSize: "text-sm", fontWeight: "font-bold", textColor: "text-slate-800 dark:text-slate-100", align: "text-left" },
            { field: "Email", label: "E-Mail", showLabel: true, fontSize: "text-xs", fontWeight: "font-normal", textColor: "text-slate-500 dark:text-slate-400", align: "text-left" }
        ]
    },
    chart_view: {
      chartType: "bar", // "bar", "line", "area", "pie"
      title: "Monatlicher Umsatz",
      dataSourceType: "table",
      dataSourceId: tables[0]?.id || '',
      xAxisKey: "Month",
      series: [
        { key: "Revenue", label: "Umsatz (€)", color: "#3b82f6" }
      ]
    },
    form_view: {
      formId: forms[0]?.id || '',
      formMode: "create", // "create" or "edit"
      hideHeader: false,
      hideActions: false
    },
    text: {
      text: "Hallo {name}, willkommen zurück!",
      fontSize: "text-lg", // "text-xs", "text-sm", "text-base", "text-lg", "text-2xl"
      fontWeight: "font-bold", // "font-normal", "font-medium", "font-semibold", "font-bold"
      colorClass: "text-indigo-900",
      alignment: "text-left" // "text-left", "text-center", "text-right"
    },
    button: {
      label: "Speichern",
      actionType: "submit", // "submit", "navigate", "setParam"
      variant: "primary", // "primary", "secondary", "danger", "outline"
      targetPageId: "",
      targetParamKey: "",
      targetParamVal: ""
    },
    dropdown: {
      label: "Status wählen",
      dataSourceType: "table",
      dataSourceId: tables[0]?.id || '',
      displayField: "Name",
      valueField: "id",
      placeholder: "-- Bitte wählen --"
    },
    metric_card: {
      title: "Gesamtumsatz",
      dataSourceType: "table",
      dataSourceId: tables[0]?.id || '',
      aggType: "sum",
      aggField: "Umsatz",
      prefix: "",
      suffix: " €",
      subtext: "Aktuelle monatliche Kennzahl",
      themeColor: "indigo",
      iconName: "TrendingUp"
    },
    kanban_board: {
      title: "Task-Board",
      dataSourceType: "table",
      dataSourceId: tables[0]?.id || '',
      groupByField: "Status",
      titleField: "Name",
      descField: "Email",
      cardAccentField: "Umsatz",
      kanbanLayout: "columns"
    },
    layout_container: {
      layoutType: "row",
      cols: 3,
      gap: "gap-4",
      padding: "p-4",
      bgStyle: "bg-white dark:bg-slate-900",
      borderStyle: "border border-slate-200 dark:border-slate-800 rounded-xl",
      shadow: "shadow-sm",
      children: [
        {
          id: "child-1",
          type: "text",
          width: "flex-1",
          config: {
            text: "Spalte Links",
            fontSize: "text-sm",
            fontWeight: "font-semibold",
            colorClass: "text-slate-800 dark:text-slate-100",
            alignment: "text-left"
          }
        },
        {
          id: "child-2",
          type: "text",
          width: "flex-1",
          config: {
            text: "Spalte Rechts",
            fontSize: "text-sm",
            fontWeight: "font-normal",
            colorClass: "text-slate-500 dark:text-slate-400",
            alignment: "text-left"
          }
        }
      ]
    },
    calendar_view: {
      title: "Mein Kalender",
      dataSourceType: "table",
      dataSourceId: tables[0]?.id || '',
      startDateField: "Datum",
      endDateField: "",
      titleField: "Name",
      colorField: "",
      defaultView: "month",
      views: ["month", "week", "day", "agenda"]
    }
  };

  // On mount or componentId change, load existing or set defaults
  useEffect(() => {
    if (existingComponent) {
      setComponentName(existingComponent.name);
      setComponentDescription(existingComponent.description || '');
      setComponentType(existingComponent.type);
      const conf = existingComponent.configuration || {};
      setConfigObj(conf);
      setConfigJson(JSON.stringify(conf, null, 2));
    } else {
      setComponentName('MyCustomComponent');
      setComponentDescription('Eine dynamische SDUI-Komponente');
      setComponentType('table_view');
      const conf = templates.table_view;
      setConfigObj(conf);
      setConfigJson(JSON.stringify(conf, null, 2));
    }
  }, [componentId]);

  // Sync JSON text to config object
  useEffect(() => {
    if (activeTab === 'json') {
      try {
        const parsed = JSON.parse(configJson);
        setConfigObj(parsed);
        setJsonError(null);
      } catch (e: any) {
        setJsonError(e.message || 'Ungültiges JSON-Format');
      }
    }
  }, [configJson, activeTab]);

  const handleTypeChange = (newType: any) => {
    setComponentType(newType);
    const template = templates[newType as keyof typeof templates] || {};
    setConfigObj(template);
    setConfigJson(JSON.stringify(template, null, 2));
  };

  // Helper to update properties visually
  const updateVisualConfig = (newProps: any) => {
    const updated = { ...configObj, ...newProps };
    setConfigObj(updated);
    setConfigJson(JSON.stringify(updated, null, 2));
  };

  const handleSave = async () => {
    if (!componentName.trim()) {
      ui.addToast('Bitte geben Sie einen Namen für die Komponente an.', 'error');
      return;
    }
    
    // In visual mode, sync final visual configObj state to JSON string just to be sure
    let finalConfig = configObj;
    if (activeTab === 'json') {
      try {
        finalConfig = JSON.parse(configJson);
      } catch (e) {
        ui.addToast('Fehler: Bitte korrigieren Sie das JSON vor dem Speichern.', 'error');
        return;
      }
    }

    try {
      const updatedComponent: CustomComponent = {
        id: existingComponent?.id || crypto.randomUUID(),
        name: componentName,
        description: componentDescription,
        type: componentType,
        configuration: finalConfig
      };

      let nextComps: CustomComponent[];
      if (existingComponent) {
        nextComps = customComponents.map(c => c.id === existingComponent.id ? updatedComponent : c);
      } else {
        nextComps = [...customComponents, updatedComponent];
      }

      setCustomComponents(nextComps);
      ui.addToast('Komponente erfolgreich in der SDUI Registry gespeichert.', 'success');
      await saveProject();
      ui.setCurrentView({ type: 'custom_components_manager' });
    } catch (e) {
      ui.addToast('Fehler beim Speichern der Komponente.', 'error');
    }
  };

  // --- MOCK DATA ENGINE ---
  const selectedTable = configObj.dataSourceType === 'query' ? undefined : tables.find(t => t.id === configObj.dataSourceId);
  const selectedQuery = configObj.dataSourceType === 'query' ? queries.find(q => q.id === configObj.dataSourceId) : undefined;
  
  let fields: any[] = [];
  if (selectedTable) {
    fields = selectedTable.fields;
  } else if (selectedQuery && selectedQuery.type === 'SELECT') {
    fields = selectedQuery.columns.map(c => ({
      name: c.alias || c.fieldName,
      type: 'VARCHAR', // Mock type for now
      isPrimaryKey: false
    }));
  }

  const getMockRows = () => {
    if (selectedTable && selectedTable.data && selectedTable.data.length > 0) {
      return selectedTable.data;
    }
    if (selectedQuery && selectedQuery.type === 'SELECT') {
      try {
        const queryData = executeSelectQuery(selectedQuery as any, tables, relationships || []);
        if (queryData && queryData.length > 0) {
          return queryData;
        }
      } catch (err) {
        console.error("Error executing query in designer:", err);
      }
    }
    
    if (fields.length > 0) {
      return Array.from({ length: 4 }).map((_, idx) => {
          const row: any = {};
          fields.forEach(f => {
            if (f.isPrimaryKey) row[f.name] = idx + 1;
            else if (f.type === 'VARCHAR' || f.type === 'TEXT' || !f.type) {
              const fname = f.name.toLowerCase();
              if (fname.includes('preis') || fname.includes('betrag') || fname.includes('umsatz') || fname.includes('gehalt') || fname.includes('sum') || fname.includes('count') || fname.includes('avg') || fname.includes('total') || fname.includes('wert') || fname.includes('qty') || fname.includes('menge') || fname.includes('anzahl') || fname.includes('revenue') || fname.includes('sales')) {
                row[f.name] = Number(125.50 * (idx + 1) + (Math.random() * 50));
              } else if (f.name.toLowerCase().includes('name')) {
                const names = ['Emma Wagner', 'Jonas Scholz', 'Sarah Becker', 'Lukas Meier'];
                row[f.name] = names[idx % names.length];
              } else if (f.name.toLowerCase().includes('mail')) {
                row[f.name] = `kontakt${idx + 1}@domain.de`;
              } else if (f.name.toLowerCase().includes('stadt') || f.name.toLowerCase().includes('ort')) {
                const cities = ['Berlin', 'Frankfurt', 'Stuttgart', 'Dresden'];
                row[f.name] = cities[idx % cities.length];
              } else if (f.name.toLowerCase().includes('status')) {
                const statuses = ['Aktiv', 'Ausstehend', 'Gesperrt', 'Inaktiv'];
                row[f.name] = statuses[idx % statuses.length];
              } else {
                row[f.name] = `${f.name} Wert ${idx + 1}`;
              }
            } else if (['INTEGER', 'DECIMAL', 'DOUBLE', 'TINYINT'].includes(f.type as any)) {
              if (f.name.toLowerCase().includes('preis') || f.name.toLowerCase().includes('betrag') || f.name.toLowerCase().includes('umsatz') || f.name.toLowerCase().includes('gehalt')) {
                row[f.name] = Number(245.75 * (idx + 1));
              } else if (f.name.toLowerCase().includes('alter') || f.name.toLowerCase().includes('age')) {
                row[f.name] = 23 + idx * 8;
              } else {
                row[f.name] = 12 * (idx + 1);
              }
            } else if (f.type === 'BOOLEAN') {
              row[f.name] = idx % 2 === 0;
            } else if (f.type === 'DATE' || f.type === 'DATETIME') {
              row[f.name] = new Date(Date.now() - idx * 36 * 60 * 60 * 1000).toISOString().split('T')[0];
            } else {
              const fname = f.name.toLowerCase();
              if (fname.includes('preis') || fname.includes('betrag') || fname.includes('umsatz') || fname.includes('gehalt') || fname.includes('sum') || fname.includes('count') || fname.includes('avg') || fname.includes('total') || fname.includes('wert') || fname.includes('qty') || fname.includes('menge') || fname.includes('anzahl') || fname.includes('revenue') || fname.includes('sales')) {
                row[f.name] = Number(125.50 * (idx + 1) + (Math.random() * 50));
              } else {
                row[f.name] = `${f.name} Wert ${idx + 1}`;
              }
            }
          });
        return row;
      });
    }
    // Default mock rows
    return [
      { id: 1, Name: 'Anna Müller', Status: 'Aktiv', Umsatz: 450.00, Email: 'anna@beispiel.de', Datum: '2026-07-01' },
      { id: 2, Name: 'Markus Schmidt', Status: 'Inaktiv', Umsatz: 120.50, Email: 'markus@beispiel.de', Datum: '2026-07-04' },
      { id: 3, Name: 'Julia Weber', Status: 'Ausstehend', Umsatz: 890.00, Email: 'julia@beispiel.de', Datum: '2026-07-10' },
      { id: 4, Name: 'David Fischer', Status: 'Aktiv', Umsatz: 1420.00, Email: 'david@beispiel.de', Datum: '2026-07-12' },
    ];
  };

  const mockRows = getMockRows();

  // Aggregate Calculator for Table Footer
  const calculateAggregate = (colField: string, footerType: string, customText?: string) => {
    if (footerType === 'custom') return customText || '';
    if (footerType === 'none') return '';
    if (mockRows.length === 0) return '-';
    
    if (footerType === 'count') {
      return `Anzahl: ${mockRows.length}`;
    }

    const values = mockRows
      .map(row => Number(row[colField]))
      .filter(val => !isNaN(val));

    if (values.length === 0) return '0.00';

    if (footerType === 'sum') {
      const sum = values.reduce((acc, curr) => acc + curr, 0);
      return `Summe: ${sum.toLocaleString('de-DE', { minimumFractionDigits: 2 })} €`;
    }

    if (footerType === 'avg') {
      const sum = values.reduce((acc, curr) => acc + curr, 0);
      const avg = sum / values.length;
      return `Ø: ${avg.toLocaleString('de-DE', { minimumFractionDigits: 2 })} €`;
    }

    return '';
  };

  return (
    <div className="flex-1 bg-slate-50 dark:bg-slate-950 flex flex-col h-full overflow-hidden">
      {/* Top Bar */}
      <div className="px-6 py-4 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 shrink-0 flex flex-wrap gap-4 justify-between items-center z-10 shadow-sm">
        <div className="flex items-center gap-3">
          <button 
            onClick={() => ui.setCurrentView({ type: 'custom_components_manager' })}
            className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-500 transition"
            title="Zurück"
          >
            <ArrowLeft size={18} />
          </button>
          <div>
            <h1 className="text-base font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
              <Box className="text-emerald-500" size={20} />
              <span>{existingComponent ? `Komponente bearbeiten: ${componentName}` : 'Neue Custom Component erstellen'}</span>
            </h1>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              Konfigurieren Sie dynamische, datengebundene Server-Driven UI (SDUI) Templates für Entwickler und Designer.
            </p>
          </div>
        </div>

        {/* Tab Controls */}
        <div className="flex bg-slate-100 dark:bg-slate-800 p-0.5 rounded-lg border border-slate-200 dark:border-slate-700">
          <button
            onClick={() => setActiveTab('visual')}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-semibold transition ${activeTab === 'visual' ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-sm' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'}`}
          >
            <Eye size={13} />
            <span>🎨 Visueller Designer</span>
          </button>
          <button
            onClick={() => setActiveTab('json')}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-semibold transition ${activeTab === 'json' ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-sm' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'}`}
          >
            <Code size={13} />
            <span>💻 JSON-Code (Dev)</span>
          </button>
        </div>

        <div className="flex items-center gap-2">
          <button 
            onClick={() => ui.setCurrentView({ type: 'custom_components_manager' })}
            className="px-3 py-1.5 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition"
          >
            Abbrechen
          </button>
          <button 
            onClick={handleSave}
            disabled={activeTab === 'json' && !!jsonError}
            className="flex items-center gap-1.5 px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-xs font-bold rounded-lg shadow-sm transition"
          >
            <Save size={14} />
            <span>In Registry speichern</span>
          </button>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* LEFT SIDE: CONFIGURATION & EDITOR PANEL */}
        <div className="w-[520px] max-w-[90vw] shrink-0 border-r border-slate-200 dark:border-slate-800 flex flex-col bg-white dark:bg-slate-900 overflow-y-auto transition-all duration-300">
          {/* Metadata Section */}
          <MetadataSection 
            componentName={componentName}
            setComponentName={setComponentName}
            componentDescription={componentDescription}
            setComponentDescription={setComponentDescription}
            componentType={componentType}
            handleTypeChange={handleTypeChange}
          />

          {/* Active Tab: JSON Schema Editor */}
          {activeTab === 'json' && (
            <div className="flex-1 flex flex-col p-4 overflow-hidden h-full">
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2 flex items-center justify-between">
                <span className="flex items-center gap-1"><Code size={13} /> JSON-Spezifikation (SDUI Schema)</span>
                {jsonError ? (
                  <span className="text-red-500 flex items-center gap-1 text-[9px] font-bold animate-pulse"><AlertCircle size={10} /> Syntaxfehler</span>
                ) : (
                  <span className="text-emerald-600 text-[9px] font-bold flex items-center gap-1"><CheckCircle2 size={10} /> Valides Schema</span>
                )}
              </label>
              <textarea
                value={configJson}
                onChange={(e) => setConfigJson(e.target.value)}
                className="flex-1 w-full bg-slate-950 text-emerald-400 font-mono text-[11px] p-4 rounded-lg border border-slate-800 focus:outline-none focus:border-emerald-500 resize-none"
                spellCheck={false}
              />
              {jsonError && (
                <div className="mt-2 bg-red-50 dark:bg-red-950/20 text-red-600 dark:text-red-400 text-[10px] p-2.5 rounded border border-red-200 dark:border-red-900/40 font-mono leading-relaxed">
                  {jsonError}
                </div>
              )}
            </div>
          )}

          {/* Active Tab: Visual Designer Editor */}
          {activeTab === 'visual' && (
            <div className="p-4 space-y-6">
              {componentType === 'table_view' && (
                <TableViewDesigner 
                  configObj={configObj}
                  updateVisualConfig={updateVisualConfig}
                  tables={tables}
                  fields={fields}
                  queries={queries}
                />
              )}

              {componentType === 'chart_view' && (
                <ChartViewDesigner 
                  configObj={configObj}
                  updateVisualConfig={updateVisualConfig}
                  fields={fields}
                  tables={tables}
                  queries={queries}
                />
              )}

              {componentType === 'form_view' && (
                <FormViewDesigner 
                  configObj={configObj}
                  updateVisualConfig={updateVisualConfig}
                  forms={forms}
                />
              )}

              {componentType === 'text' && (
                <TextViewDesigner 
                  configObj={configObj}
                  updateVisualConfig={updateVisualConfig}
                />
              )}

              {componentType === 'button' && (
                <ButtonViewDesigner 
                  configObj={configObj}
                  updateVisualConfig={updateVisualConfig}
                  pages={pages}
                />
              )}

              {componentType === 'dropdown' && (
                <DropdownViewDesigner 
                  configObj={configObj}
                  updateVisualConfig={updateVisualConfig}
                  tables={tables}
                  fields={fields}
                />
              )}

              {componentType === 'metric_card' && (
                <MetricCardViewDesigner 
                  configObj={configObj}
                  updateVisualConfig={updateVisualConfig}
                  tables={tables}
                  fields={fields}
                />
              )}

              {componentType === 'kanban_board' && (
                <KanbanBoardViewDesigner 
                  configObj={configObj}
                  updateVisualConfig={updateVisualConfig}
                  tables={tables}
                  fields={fields}
                />
              )}

              {componentType === 'card_template' && (
                <CardTemplateDesigner 
                  configObj={configObj}
                  updateVisualConfig={updateVisualConfig}
                  tables={tables}
                  fields={fields}
                />
              )}

              {componentType === 'layout_container' && (
                <LayoutContainerDesigner 
                  configObj={configObj}
                  updateVisualConfig={updateVisualConfig}
                />
              )}

              {componentType === 'calendar_view' && (
                <CalendarViewDesigner 
                  configObj={configObj}
                  updateVisualConfig={updateVisualConfig}
                  tables={tables}
                  queries={queries}
                  fields={fields}
                />
              )}
            </div>
          )}
        </div>

        {/* RIGHT SIDE: LIVE WIREFRAME CANVAS & VISUAL PREVIEW */}
        <PreviewPanel 
          componentName={componentName}
          componentType={componentType}
          configObj={configObj}
          activeTab={activeTab}
          jsonError={jsonError}
          mockRows={mockRows}
          calculateAggregate={calculateAggregate}
          forms={forms}
        />
      </div>
    </div>
  );
};
