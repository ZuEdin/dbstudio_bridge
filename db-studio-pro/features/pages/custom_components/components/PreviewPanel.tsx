import React from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';
import { useProjectStore } from '../../../../stores/useProjectStore';
import { CalendarRunner } from '../../components/runner/CalendarRunner';

// Import modular preview components
import { renderCardWithTemplate } from './preview/CardRenderer';
import { TableViewPreview } from './preview/TableViewPreview';
import { ChartViewPreview } from './preview/ChartViewPreview';
import { FormViewPreview } from './preview/FormViewPreview';
import { SimpleComponentsPreview } from './preview/SimpleComponentsPreview';
import { KanbanBoardPreview } from './preview/KanbanBoardPreview';
import { LayoutContainerPreview } from './preview/LayoutContainerPreview';

interface PreviewPanelProps {
  componentName: string;
  componentType: 'table_view' | 'chart_view' | 'form_view' | 'text' | 'button' | 'dropdown' | 'metric_card' | 'kanban_board' | 'card_template' | 'calendar_view' | string;
  configObj: any;
  activeTab: 'visual' | 'json';
  jsonError: string | null;
  mockRows: any[];
  calculateAggregate: (colField: string, footerType: string, customText?: string) => string;
  forms: any[];
}

export const PreviewPanel: React.FC<PreviewPanelProps> = ({
  componentName,
  componentType,
  configObj,
  activeTab,
  jsonError,
  mockRows,
  calculateAggregate,
  forms,
}) => {
  const { customComponents = [], tables = [] } = useProjectStore();

  return (
    <div className="flex-1 bg-slate-100 dark:bg-slate-950 flex flex-col p-6 overflow-y-auto z-0">
      <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col h-full min-h-[500px]">
        {/* Simulation Header */}
        <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50/55 dark:bg-slate-950/35">
          <div>
            <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Visual Canvas Preview &amp; Wireframe</h3>
            <h2 className="text-xs font-bold text-slate-800 dark:text-slate-100">
              {componentName} <span className="font-mono text-slate-400 text-[10px]">({componentType})</span>
            </h2>
          </div>
          <div className="flex gap-2 items-center">
            <span className="text-[10px] bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400 px-2 py-0.5 rounded font-bold uppercase tracking-wider flex items-center gap-1">
              <RefreshCw size={10} className="animate-spin" /> Live Sync
            </span>
          </div>
        </div>

        {/* PREVIEW CONTAINER */}
        <div className="flex-1 p-6 flex flex-col justify-start">
          {activeTab === 'json' && jsonError ? (
            <div className="m-auto text-center text-slate-400 max-w-xs p-8">
              <AlertCircle size={36} className="mx-auto text-amber-500 mb-2" />
              <p className="text-xs">Die visuelle Vorschau wurde angehalten, bis das JSON korrigiert ist.</p>
            </div>
          ) : (
            <div className="w-full h-full flex flex-col justify-between space-y-6">
              {/* Visual Renderings based on componentType */}
              <div className="flex-1">
                {/* TABLE VIEW PREVIEW */}
                {componentType === 'table_view' && (
                  <TableViewPreview 
                    configObj={configObj} 
                    mockRows={mockRows} 
                    calculateAggregate={calculateAggregate} 
                  />
                )}

                {/* CHART VIEW PREVIEW */}
                {componentType === 'chart_view' && (
                  <ChartViewPreview 
                    configObj={configObj} 
                    mockRows={mockRows} 
                  />
                )}

                {/* FORM VIEW PREVIEW */}
                {componentType === 'form_view' && (
                  <FormViewPreview 
                    configObj={configObj} 
                    forms={forms} 
                  />
                )}

                {/* SIMPLE COMPONENTS (TEXT, BUTTON, DROPDOWN, METRIC CARD) PREVIEWS */}
                {['text', 'button', 'dropdown', 'metric_card'].includes(componentType) && (
                  <SimpleComponentsPreview 
                    componentType={componentType} 
                    configObj={configObj} 
                    mockRows={mockRows} 
                  />
                )}

                {/* KANBAN BOARD PREVIEW */}
                {componentType === 'kanban_board' && (
                  <KanbanBoardPreview 
                    configObj={configObj} 
                    mockRows={mockRows} 
                    customComponents={customComponents} 
                    tables={tables} 
                  />
                )}

                {/* CARD TEMPLATE PREVIEW */}
                {componentType === 'card_template' && (
                  <div className="p-4 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl space-y-4">
                    <div className="flex justify-between items-center pb-2 border-b dark:border-slate-800">
                      <span className="font-bold text-slate-700 dark:text-slate-200 text-xs">Kartenvorlage (Card Template)</span>
                      <span className="text-[9px] font-mono text-indigo-600 bg-indigo-50 dark:bg-indigo-950/40 px-1.5 py-0.5 rounded font-bold uppercase dark:text-indigo-400">
                        Vorlage
                      </span>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {mockRows.slice(0, 2).map((row, rIdx) => (
                        <div key={rIdx}>
                          {renderCardWithTemplate(row, configObj)}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* CALENDAR VIEW PREVIEW */}
                {componentType === 'calendar_view' && (
                  <div className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl flex flex-col relative w-full h-[650px] overflow-hidden">
                    <div className="absolute top-0 right-0 z-10 p-1">
                      <span className="text-[9px] font-mono text-indigo-600 bg-indigo-50/80 px-1.5 py-0.5 rounded shadow-xs font-bold uppercase backdrop-blur-xs">Vorschau</span>
                    </div>
                    <CalendarRunner
                      comp={{ configuration: configObj }}
                      fetchedData={mockRows}
                      loading={false}
                    />
                  </div>
                )}

                {/* LAYOUT CONTAINER PREVIEW */}
                {componentType === 'layout_container' && (
                  <LayoutContainerPreview 
                    configObj={configObj} 
                    customComponents={customComponents} 
                  />
                )}
              </div>

              {/* BOTTOM EXPLANATION BOX */}
              <div className="mt-auto pt-4 border-t border-slate-100 dark:border-slate-800 font-mono text-[9px] text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-950 p-3 rounded-lg flex items-center gap-2">
                <span className="bg-indigo-100 dark:bg-indigo-900/40 text-indigo-800 dark:text-indigo-400 font-bold px-1.5 py-0.5 rounded uppercase shrink-0 font-sans">SDUI Integration</span>
                <p className="leading-relaxed">
                  Komponente in der Registry registriert. Sie können dieses Template im Page Builder über den Typ <strong>Custom Component</strong> direkt verknüpfen!
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
