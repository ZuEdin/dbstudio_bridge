import React from 'react';
import { Layers } from 'lucide-react';
import { getNestedValueCaseInsensitive } from '../../../utils/pageViewUtils';
import { getNestedValue, renderCardWithTemplate } from './CardRenderer';

interface KanbanBoardPreviewProps {
  configObj: any;
  mockRows: any[];
  customComponents: any[];
  tables: any[];
}

export const KanbanBoardPreview: React.FC<KanbanBoardPreviewProps> = ({
  configObj,
  mockRows,
  customComponents,
  tables
}) => {
  const groupBy = configObj.groupByField || 'Status';
  const titleF = configObj.titleField || 'Name';
  const descF = configObj.descField || 'Email';
  const accentF = configObj.cardAccentField || 'Umsatz';

  // Build mapping: manual mapping + dynamic mapping from related table
  const columnMapping: Record<string, string> = { ...(configObj.columnMapping || {}) };
  if (configObj.columnSourceTableId && configObj.columnDisplayField) {
    const sourceTable = tables.find((t: any) => t.id === configObj.columnSourceTableId);
    if (sourceTable && sourceTable.data) {
      sourceTable.data.forEach((item: any) => {
        const idVal = getNestedValueCaseInsensitive(item, 'id') ?? getNestedValueCaseInsensitive(item, 'Id');
        const labelVal = getNestedValueCaseInsensitive(item, configObj.columnDisplayField);
        if (idVal !== undefined && idVal !== null && labelVal !== undefined && labelVal !== null) {
          columnMapping[String(idVal)] = String(labelVal);
        }
      });
    }
  }

  const keysFromMapping = Object.keys(columnMapping);
  const defaultCols = keysFromMapping.length > 0 ? keysFromMapping : (configObj.columns || ['Offen', 'In Arbeit', 'Erledigt']);

  const groups: Record<string, any[]> = {};
  const unassignedKey = "Nicht zugeordnet";

  defaultCols.forEach((col: string) => { groups[col] = []; });
  groups[unassignedKey] = [];

  mockRows.forEach(row => {
    const val = String(getNestedValueCaseInsensitive(row, groupBy) || '');
    if (groups.hasOwnProperty(val)) {
      groups[val].push(row);
    } else {
      groups[unassignedKey].push(row);
    }
  });

  const columnsKeys = [...defaultCols, ...(groups[unassignedKey].length > 0 ? [unassignedKey] : [])];

  return (
    <div className="p-4 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl space-y-4">
      <div className="flex justify-between items-center border-b border-slate-200/60 dark:border-slate-800 pb-2">
        <h4 className="text-xs font-bold text-slate-800 dark:text-slate-100 flex items-center gap-1">
          <Layers size={13} className="text-indigo-500" /> {configObj.title || 'Kanban-Board'}
        </h4>
        <span className="text-[9px] bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400 px-1.5 py-0.5 rounded font-mono">
          grouped by {groupBy}
        </span>
      </div>

      {columnsKeys.length === 0 ? (
        <div className="text-center p-6 text-slate-400 text-xs italic">
          Wählen Sie ein Gruppierungs-Feld aus, um Kanban-Spalten zu erzeugen.
        </div>
      ) : configObj.kanbanLayout === 'rows' ? (
        <div className="flex flex-col gap-4 w-full">
          {columnsKeys.map(colKey => (
            <div key={colKey} className="bg-slate-100/40 dark:bg-slate-900/40 p-3 rounded-xl border border-slate-200/50 dark:border-slate-800/50 flex flex-col md:flex-row gap-3 items-stretch w-full">
              {/* Left side title for Row layout */}
              <div className="w-full md:w-36 shrink-0 flex flex-row md:flex-col justify-between md:justify-center items-center md:items-start border-b md:border-b-0 md:border-r border-slate-200 dark:border-slate-800 pb-1.5 md:pb-0 md:pr-3">
                <div>
                  <h5 className="text-[10px] font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse"></span>
                    {columnMapping[colKey] || colKey}
                  </h5>
                  <p className="text-[8px] text-slate-400 mt-0.5 hidden md:block">Zeilen-Lane</p>
                </div>
                <span className="text-[9px] font-bold bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400 px-1.5 py-0.5 rounded-full">
                  {groups[colKey]?.length || 0}
                </span>
              </div>

              {/* Cards container */}
              <div className="flex-1 flex flex-row gap-3 overflow-x-auto py-1 items-start min-w-0 scrollbar-thin">
                {groups[colKey]?.length === 0 ? (
                  <div className="flex-1 flex items-center justify-center text-[9px] text-slate-400 italic py-2">
                    Keine Einträge
                  </div>
                ) : (
                  (groups[colKey] || []).map((row, rIdx) => {
                    if (configObj.cardTemplateId) {
                      const template = customComponents.find(c => c.id === configObj.cardTemplateId);
                      if (template) {
                        return (
                          <div key={rIdx} className="w-56 shrink-0 cursor-pointer hover:scale-[1.01] transition-transform">
                            {renderCardWithTemplate(row, template.configuration)}
                          </div>
                        );
                      }
                    }

                    const mapValWithLookup = (val: any): string => {
                      if (val === undefined || val === null) return '';
                      const sVal = String(val);
                      if (columnMapping && columnMapping[sVal] !== undefined) {
                        return columnMapping[sVal];
                      }
                      return typeof val === 'number' ? val.toLocaleString('de-DE') : sVal;
                    };

                    const cardTitleVal = getNestedValue(row, titleF) || getNestedValue(row, 'Name') || getNestedValue(row, 'name') || getNestedValue(row, 'Title') || getNestedValue(row, 'title');
                    const cardTitle = cardTitleVal ? mapValWithLookup(cardTitleVal) : `Karte #${rIdx + 1}`;
                    const cardDescVal = getNestedValue(row, descF) || getNestedValue(row, 'Email') || getNestedValue(row, 'email');
                    const cardDesc = cardDescVal ? mapValWithLookup(cardDescVal) : '';
                    const cardAccent = getNestedValue(row, accentF);

                    return (
                      <div key={rIdx} className="w-56 shrink-0 bg-white dark:bg-slate-900 p-2.5 rounded-lg border border-slate-200 dark:border-slate-800 shadow-xs hover:shadow-sm transition-all space-y-1.5">
                        <h5 className="text-[10px] font-bold text-slate-800 dark:text-slate-100 leading-tight truncate">{cardTitle}</h5>
                        {cardDesc && <p className="text-[9px] text-slate-500 dark:text-slate-400 leading-normal line-clamp-2">{cardDesc}</p>}
                        {cardAccent !== undefined && cardAccent !== null && (
                          <div className="flex justify-end pt-1">
                            <span className="text-[8px] font-bold bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 px-1.5 py-0.5 rounded font-mono">
                              {mapValWithLookup(cardAccent)}
                            </span>
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 xl:grid-cols-4 gap-3 overflow-x-auto pb-2">
          {columnsKeys.map(colKey => (
            <div key={colKey} className="bg-slate-100/80 dark:bg-slate-850 p-2.5 rounded-xl border border-slate-200/50 dark:border-slate-800/50 flex flex-col min-w-[150px]">
              <div className="flex justify-between items-center mb-2 px-1">
                <span className="text-[10px] font-bold text-slate-700 dark:text-slate-300 truncate max-w-[80%]">
                  {columnMapping[colKey] || colKey}
                </span>
                <span className="text-[9px] font-bold bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400 px-1.5 py-0.5 rounded-full">
                  {groups[colKey]?.length || 0}
                </span>
              </div>

              <div className="space-y-2 flex-1">
                {(groups[colKey] || []).map((row, rIdx) => {
                  if (configObj.cardTemplateId) {
                    const template = customComponents.find(c => c.id === configObj.cardTemplateId);
                    if (template) {
                      return (
                        <div key={rIdx} className="cursor-pointer hover:scale-[1.01] active:scale-[0.99] transition-transform">
                          {renderCardWithTemplate(row, template.configuration)}
                        </div>
                      );
                    }
                  }

                  const mapValWithLookup = (val: any): string => {
                    if (val === undefined || val === null) return '';
                    const sVal = String(val);
                    if (columnMapping && columnMapping[sVal] !== undefined) {
                      return columnMapping[sVal];
                    }
                    return typeof val === 'number' ? val.toLocaleString('de-DE') : sVal;
                  };

                  const cardTitleVal = getNestedValue(row, titleF) || getNestedValue(row, 'Name') || getNestedValue(row, 'name') || getNestedValue(row, 'Title') || getNestedValue(row, 'title') || getNestedValue(row, 'Username') || getNestedValue(row, 'username');
                  const cardTitle = cardTitleVal ? mapValWithLookup(cardTitleVal) : `Karte #${rIdx + 1}`;
                  
                  const cardDescVal = getNestedValue(row, descF) || getNestedValue(row, 'Email') || getNestedValue(row, 'email') || getNestedValue(row, 'Description') || getNestedValue(row, 'description') || getNestedValue(row, 'Untertitel');
                  const cardDesc = cardDescVal ? mapValWithLookup(cardDescVal) : '';

                  const cardAccent = getNestedValue(row, accentF);

                  return (
                    <div key={rIdx} className="bg-white dark:bg-slate-900 p-2.5 rounded-lg border border-slate-200 dark:border-slate-800 shadow-xs hover:shadow-sm transition-all space-y-1.5">
                      <h5 className="text-[10px] font-bold text-slate-800 dark:text-slate-100 leading-tight truncate">{cardTitle}</h5>
                      {cardDesc && <p className="text-[9px] text-slate-500 dark:text-slate-400 leading-normal line-clamp-2">{cardDesc}</p>}
                      
                      {cardAccent !== undefined && cardAccent !== null && (
                        <div className="flex justify-end pt-1">
                          <span className="text-[8px] font-bold bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 px-1.5 py-0.5 rounded font-mono">
                            {mapValWithLookup(cardAccent)}
                          </span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
