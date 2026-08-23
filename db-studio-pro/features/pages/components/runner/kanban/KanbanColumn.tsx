import React from 'react';
import { KanbanCard } from './KanbanCard';
import { getNestedValueCaseInsensitive } from '../../../utils/pageViewUtils';

interface KanbanColumnProps {
    colKey: string;
    columnMapping?: Record<string, string>;
    rows: any[];
    titleF: string;
    descF: string;
    accentF: string;
    extraF1?: string;
    extraF2?: string;
    cardTemplate?: any;
    onDragOver: (e: React.DragEvent) => void;
    onDrop: (colKey: string) => void;
    onDragStart: (row: any, isSub?: boolean) => void;
    onDragEnter: (row: any) => void;
    onCardClick: (row: any) => void;

    // Sub-tasks extensions
    allSubItems?: any[];
    parentField?: string;
    groupByField?: string;
    completedStatus?: string;
    showSubTasksInline?: boolean;
    onToggleSubTask?: (subTaskId: any) => void;

    // Recursive hierarchical props
    onDropAsSubTask?: (parentRow: any) => void;
    activeDragItem?: any;

    allItems?: any[];
    onPromoteToMainTask?: (row: any) => void;
    layoutMode?: 'columns' | 'rows';
}

export const KanbanColumn: React.FC<KanbanColumnProps> = ({
    colKey,
    columnMapping,
    rows,
    titleF,
    descF,
    accentF,
    extraF1,
    extraF2,
    cardTemplate,
    onDragOver,
    onDrop,
    onDragStart,
    onDragEnter,
    onCardClick,
    allSubItems,
    parentField,
    groupByField,
    completedStatus,
    showSubTasksInline,
    onToggleSubTask,
    onDropAsSubTask,
    activeDragItem,
    allItems,
    onPromoteToMainTask,
    layoutMode = 'columns',
}) => {
    // Recursive function to render a card and all its children down the tree
    const renderCardAndChildren = (row: any, depth: number = 0) => {
        const rowId = row.id !== undefined && row.id !== null ? row.id : (row.Id !== undefined && row.Id !== null ? row.Id : null);
        
        // Find children belonging to this specific row
        const subTasks = (allSubItems && parentField && rowId !== null)
            ? allSubItems.filter(child => {
                  const parentVal = getNestedValueCaseInsensitive(child, parentField);
                  return parentVal !== undefined && parentVal !== null && String(parentVal) === String(rowId);
              })
            : [];

        // Cross-column parent tracking for top-level visual link badge
        const parentId = parentField ? getNestedValueCaseInsensitive(row, parentField) : null;
        let parentTitle = '';
        if (parentId && allItems && depth === 0) {
            const parentItem = allItems.find(item => {
                const itemPk = item.id !== undefined && item.id !== null ? item.id : (item.Id !== undefined && item.Id !== null ? item.Id : null);
                return String(itemPk) === String(parentId);
            });
            if (parentItem) {
                parentTitle = getNestedValueCaseInsensitive(parentItem, titleF) || getNestedValueCaseInsensitive(parentItem, 'name') || getNestedValueCaseInsensitive(parentItem, 'title') || `ID: ${parentId}`;
            }
        }

        return (
            <div key={`tree-node-${rowId || 'null'}-${depth}`} className="space-y-2 relative">
                <div className="relative">
                    {/* Visual branch horizontal line for children */}
                    {depth > 0 && (
                        <div className="absolute -left-3 top-[22px] w-3 h-px border-t border-dashed border-indigo-400 dark:border-indigo-600 pointer-events-none" />
                    )}
                    <KanbanCard
                        row={row}
                        titleF={titleF}
                        descF={descF}
                        accentF={accentF}
                        extraF1={extraF1}
                        extraF2={extraF2}
                        cardTemplate={cardTemplate}
                        columnMapping={columnMapping}
                        onDragStart={onDragStart}
                        onDragEnter={onDragEnter}
                        onClick={onCardClick}
                        subTasks={subTasks}
                        showSubTasksInline={showSubTasksInline}
                        onToggleSubTask={onToggleSubTask}
                        groupByField={groupByField}
                        completedStatus={completedStatus}
                        isSubCard={depth > 0}
                        depth={depth}
                        onDropAsSubTask={onDropAsSubTask}
                        activeDragItem={activeDragItem}
                        parentField={parentField}
                        parentTitle={parentTitle}
                        onPromoteToMainTask={onPromoteToMainTask}
                    />
                </div>

                {/* Recursively render child cards nested with indentation and vertical branch connector */}
                {subTasks.length > 0 && (
                    <div className="pl-4 ml-3 border-l border-dashed border-indigo-200 dark:border-indigo-800/80 space-y-2 relative">
                        {subTasks.map(childRow => renderCardAndChildren(childRow, depth + 1))}
                    </div>
                )}
            </div>
        );
    };

    if (layoutMode === 'rows') {
        return (
            <div 
                className="bg-slate-100/40 dark:bg-slate-900/40 p-4 rounded-2xl border border-slate-200/60 dark:border-slate-800/80 flex flex-col md:flex-row gap-4 items-stretch w-full min-h-[140px] transition-all"
                onDragOver={onDragOver}
                onDrop={() => onDrop(colKey)}
            >
                {/* Lane / Row Title and Badge */}
                <div className="w-full md:w-52 shrink-0 flex flex-row md:flex-col justify-between md:justify-center items-center md:items-start border-b md:border-b-0 md:border-r border-slate-200 dark:border-slate-800 pb-2 md:pb-0 md:pr-4">
                    <div>
                        <h5 className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                            <span className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse"></span>
                            {columnMapping && columnMapping[colKey] ? columnMapping[colKey] : colKey}
                        </h5>
                        <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5 hidden md:block">
                            Zeilen-Gruppe für '{groupByField}'
                        </p>
                    </div>
                    <span className="text-xs font-bold bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400 px-2 py-0.5 rounded-full">
                        {rows.length}
                    </span>
                </div>

                {/* Horizontal list of items */}
                <div className="flex-1 w-full flex flex-row gap-4 overflow-x-auto py-1 px-1 items-start min-w-0 scrollbar-thin">
                    {rows.length === 0 ? (
                        <div className="flex-1 flex items-center justify-center text-xs text-slate-400 italic py-4">
                            Keine Einträge. Ziehen Sie ein Kärtchen hierher.
                        </div>
                    ) : (
                        rows.map(row => {
                            const rowId = row.id !== undefined && row.id !== null ? row.id : (row.Id !== undefined && row.Id !== null ? row.Id : 'null');
                            return (
                                <div key={rowId} className="w-72 shrink-0 min-w-[280px]">
                                    {renderCardAndChildren(row, 0)}
                                </div>
                            );
                        })
                    )}
                </div>
            </div>
        );
    }

    return (
        <div 
            className="bg-slate-100/60 dark:bg-slate-900/50 p-3 rounded-2xl border border-slate-200/60 dark:border-slate-800/80 flex flex-col min-w-[250px] min-h-[450px]"
            onDragOver={onDragOver}
            onDrop={() => onDrop(colKey)}
        >
            <div className="flex justify-between items-center mb-3 px-1">
                <span className="text-xs font-bold text-slate-700 dark:text-slate-300 truncate max-w-[80%]">
                    {columnMapping && columnMapping[colKey] ? columnMapping[colKey] : colKey}
                </span>
                <span className="text-xs font-bold bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400 px-2 py-0.5 rounded-full">
                    {rows.length}
                </span>
            </div>

            <div className="space-y-3 flex-1">
                {rows.map(row => renderCardAndChildren(row, 0))}
            </div>
        </div>
    );
};
