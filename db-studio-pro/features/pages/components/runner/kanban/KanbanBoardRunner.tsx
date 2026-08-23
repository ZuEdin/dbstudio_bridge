import React, { useState } from 'react';
import { Layers } from 'lucide-react';
import { useProjectStore } from '../../../../../stores/useProjectStore';
import { getNestedValueCaseInsensitive } from '../../../utils/pageViewUtils';
import { KanbanColumn } from './KanbanColumn';

const updateFieldCaseInsensitive = (obj: any, field: string, value: any) => {
    if (!obj || !field) return obj;
    const lowerField = field.toLowerCase();
    const existingKey = Object.keys(obj).find(k => k.toLowerCase() === lowerField);
    if (existingKey) {
        return { ...obj, [existingKey]: value };
    }
    return { ...obj, [field]: value };
};

interface KanbanBoardRunnerProps {
    conf: any;
    fetchedData: any[];
    loading: boolean;
    setParam: (k: string, v: any) => void;
}

export const KanbanBoardRunner: React.FC<KanbanBoardRunnerProps> = ({
    conf,
    fetchedData,
    loading,
    setParam
}) => {
    const { tables, updateTable, customComponents = [] } = useProjectStore();
    const [activeDragItem, setActiveDragItem] = useState<any>(null);
    const [targetDragOverItem, setTargetDragOverItem] = useState<any>(null);
    const [activeDragIsSubTask, setActiveDragIsSubTask] = useState<boolean>(false);
    const [kanbanNotification, setKanbanNotification] = useState<string>('');

    const groupBy = conf.groupByField || 'Status';
    const titleF = conf.titleField || 'Name';
    const descF = conf.descField || 'Email';
    const accentF = conf.cardAccentField || 'Umsatz';

    const parentField = conf.parentField || tables.find(t => t.id === (conf.dataSourceId || conf.tableId))?.fields.find(f => 
        ['parent', 'parentid', 'parent_id', 'parentfield', 'vater_id', 'parent_todo_id', 'parenttodoid'].includes(f.name.toLowerCase())
    )?.name || 'parentId';
    const pkField = tables.find(t => t.id === (conf.dataSourceId || conf.tableId))?.fields.find(f => f.isPrimaryKey) || { name: 'Id' };
    const pkName = pkField.name;

    // Build mapping: manual mapping + dynamic mapping from related table
    const columnMapping = { ...(conf.columnMapping || {}) };
    if (conf.columnSourceTableId && conf.columnDisplayField) {
        const sourceTable = tables.find(t => t.id === conf.columnSourceTableId);
        if (sourceTable && sourceTable.data) {
            sourceTable.data.forEach(item => {
                const idVal = getNestedValueCaseInsensitive(item, 'id') ?? getNestedValueCaseInsensitive(item, 'Id');
                const labelVal = getNestedValueCaseInsensitive(item, conf.columnDisplayField);
                if (idVal !== undefined && idVal !== null && labelVal !== undefined && labelVal !== null) {
                    columnMapping[String(idVal)] = String(labelVal);
                }
            });
        }
    }

    // Find card template
    const cardTemplate = conf.cardTemplateId ? customComponents.find(c => c.id === conf.cardTemplateId) : null;

    const groups: Record<string, any[]> = {};
    const unassignedKey = "Nicht zugeordnet";
    
    // IF we have mapping, use mapping keys as default columns
    const keysFromMapping = Object.keys(columnMapping);
    const defaultCols = keysFromMapping.length > 0 ? keysFromMapping : (conf.columns || ['Offen', 'In Arbeit', 'Erledigt']);
    
    defaultCols.forEach((col: string) => { groups[col] = []; });
    groups[unassignedKey] = [];

    // Filter parent tasks vs sub-tasks if parentField is defined
    let parentItems: any[] = [];
    let subItems: any[] = [];

    if (parentField) {
        const parentIdsSet = new Set(fetchedData.map(row => String(getNestedValueCaseInsensitive(row, pkName) || '')));
        
        const isSubItemInSameCol = (item: any): boolean => {
            const parentVal = getNestedValueCaseInsensitive(item, parentField);
            const parentValStr = parentVal !== undefined && parentVal !== null ? String(parentVal) : '';
            if (parentValStr === '' || parentValStr === '0' || !parentIdsSet.has(parentValStr)) {
                return false;
            }
            
            // Find parent item to compare columns
            const parentItem = fetchedData.find(row => String(getNestedValueCaseInsensitive(row, pkName)) === parentValStr);
            if (!parentItem) return false;
            
            const parentCol = String(getNestedValueCaseInsensitive(parentItem, groupBy) || '');
            const itemCol = String(getNestedValueCaseInsensitive(item, groupBy) || '');
            return parentCol === itemCol;
        };

        fetchedData.forEach(row => {
            if (isSubItemInSameCol(row)) {
                subItems.push(row);
            } else {
                parentItems.push(row);
            }
        });
    } else {
        parentItems = fetchedData;
    }

    // Group only parents in columns
    parentItems.forEach(row => {
        const val = String(getNestedValueCaseInsensitive(row, groupBy) || '');
        if (groups.hasOwnProperty(val)) {
            groups[val].push(row);
        } else {
            groups[unassignedKey].push(row);
        }
    });

    // If sortField is defined, sort the parent tasks inside each column
    const sortField = conf.sortField;
    if (sortField) {
        Object.keys(groups).forEach(colKey => {
            groups[colKey].sort((a, b) => {
                const valA = Number(getNestedValueCaseInsensitive(a, sortField)) || 0;
                const valB = Number(getNestedValueCaseInsensitive(b, sortField)) || 0;
                return valA - valB;
            });
        });
    }

    const columnsKeys = [...defaultCols, ...(groups[unassignedKey].length > 0 ? [unassignedKey] : [])];

    const handleCardClick = (row: any) => {
        const idVal = getNestedValueCaseInsensitive(row, 'id') || getNestedValueCaseInsensitive(row, 'Id');
        if (idVal !== undefined) {
            setParam('selectedId', idVal);
        }
    };

    const handleDragStart = (item: any, isSub: boolean = false) => {
        setActiveDragItem(item);
        setActiveDragIsSubTask(isSub);
    };

    const handleDragEnterItem = (item: any) => {
        setTargetDragOverItem(item);
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
    };

    const handleToggleSubTask = (subTaskId: any) => {
        const dsId = conf.dataSourceId || conf.tableId;
        const targetT = tables.find(t => t.id === dsId);
        if (!targetT || !targetT.data) return;

        const firstCol = defaultCols[0] || 'Offen';
        const lastCol = defaultCols[defaultCols.length - 1] || 'Erledigt';

        const subTaskItem = targetT.data.find(r => String(getNestedValueCaseInsensitive(r, pkName)) === String(subTaskId));
        if (!subTaskItem) return;

        const currentStatus = String(getNestedValueCaseInsensitive(subTaskItem, groupBy) || '');
        const newStatus = currentStatus === lastCol ? firstCol : lastCol;

        let updatedData = targetT.data.map(row => {
            if (String(getNestedValueCaseInsensitive(row, pkName)) === String(subTaskId)) {
                return updateFieldCaseInsensitive(row, groupBy, newStatus);
            }
            return row;
        });

        if (conf.autoCompleteParent) {
            const parentId = getNestedValueCaseInsensitive(subTaskItem, parentField);
            if (parentId) {
                const siblings = updatedData.filter(row => 
                    String(getNestedValueCaseInsensitive(row, parentField)) === String(parentId)
                );
                const allCompleted = siblings.every(sibling => 
                    String(getNestedValueCaseInsensitive(sibling, groupBy)) === lastCol
                );
                
                if (allCompleted) {
                    updatedData = updatedData.map(row => {
                        if (String(getNestedValueCaseInsensitive(row, pkName)) === String(parentId)) {
                            return updateFieldCaseInsensitive(row, groupBy, lastCol);
                        }
                        return row;
                    });
                    setKanbanNotification(`Alle Sub-Aufgaben erledigt! Hauptaufgabe wurde automatisch als '${lastCol}' markiert.`);
                } else {
                    const parentItem = targetT.data.find(row => String(getNestedValueCaseInsensitive(row, pkName)) === String(parentId));
                    if (parentItem && String(getNestedValueCaseInsensitive(parentItem, groupBy)) === lastCol) {
                        updatedData = updatedData.map(row => {
                            if (String(getNestedValueCaseInsensitive(row, pkName)) === String(parentId)) {
                                return updateFieldCaseInsensitive(row, groupBy, defaultCols[1] || firstCol);
                            }
                            return row;
                        });
                    }
                }
            }
        }

        updateTable({ ...targetT, data: updatedData });
    };

    const handleDrop = (targetColumn: string) => {
        const item = activeDragItem;
        if (!item) return;

        const dsId = conf.dataSourceId || conf.tableId;
        const targetT = tables.find(t => t.id === dsId);
        if (!targetT || !targetT.data) return;

        const oldColumn = String(getNestedValueCaseInsensitive(item, groupBy) || 'Offen');
        const itemTitle = getNestedValueCaseInsensitive(item, titleF) || getNestedValueCaseInsensitive(item, 'name') || getNestedValueCaseInsensitive(item, 'title') || 'ID: ' + (item.id || item.Id);

        let updatedItem = { ...item };
        updatedItem = updateFieldCaseInsensitive(updatedItem, groupBy, targetColumn);
        if (!activeDragIsSubTask) {
            updatedItem = updateFieldCaseInsensitive(updatedItem, parentField, '');
        }
        const lastCol = defaultCols[defaultCols.length - 1] || 'Erledigt';

        // 1. Update the item itself + handle group dragging of children if parent is dragged
        let updatedList = targetT.data.map(row => {
            if (String(getNestedValueCaseInsensitive(row, pkName)) === String(getNestedValueCaseInsensitive(item, pkName))) {
                return updatedItem;
            }
            // Group dragging: if parent is dragged, update all its sub-todos as well
            if (parentField && !activeDragIsSubTask) {
                const parentIdVal = getNestedValueCaseInsensitive(item, pkName);
                const rowParentId = getNestedValueCaseInsensitive(row, parentField);
                if (rowParentId !== undefined && rowParentId !== null && String(rowParentId) === String(parentIdVal)) {
                    return updateFieldCaseInsensitive(row, groupBy, targetColumn);
                }
            }
            return row;
        });

        // 2. Insert at drag-over target position if dropped over another item of the same level
        let itemsInCol = updatedList.filter(t => {
            const sameCol = String(getNestedValueCaseInsensitive(t, groupBy) || 'Offen') === targetColumn;
            if (!sameCol) return false;
            // If dragging sub-task, only order within subtasks of same parent
            if (parentField && activeDragIsSubTask) {
                const parentIdVal = getNestedValueCaseInsensitive(item, parentField);
                return String(getNestedValueCaseInsensitive(t, parentField)) === String(parentIdVal);
            }
            // If dragging parent, only order within parent tasks
            if (parentField && !activeDragIsSubTask) {
                const parentVal = getNestedValueCaseInsensitive(t, parentField);
                return parentVal === undefined || parentVal === null || parentVal === '' || parentVal === 0 || parentVal === '0';
            }
            return true;
        });

        // Remove item from itemsInCol first to insert it at new index
        itemsInCol = itemsInCol.filter(t => String(getNestedValueCaseInsensitive(t, pkName)) !== String(getNestedValueCaseInsensitive(item, pkName)));

        let newIndex = itemsInCol.length;
        if (targetDragOverItem) {
            const idx = itemsInCol.findIndex(t => String(getNestedValueCaseInsensitive(t, pkName)) === String(getNestedValueCaseInsensitive(targetDragOverItem, pkName)));
            if (idx !== -1) {
                newIndex = idx;
            }
        }
        
        // Insert at new index
        itemsInCol.splice(newIndex, 0, updatedItem);

        // Re-assign sequence positions
        const positionFieldName = conf.sortField || targetT.fields.find(f => 
            ['position', 'sort_order', 'sort', 'order', 'priority_order', 'sortorder'].includes(f.name.toLowerCase())
        )?.name;

        if (positionFieldName) {
            const newPositionsMap = new Map<string, number>();
            itemsInCol.forEach((t, index) => {
                const pkVal = String(getNestedValueCaseInsensitive(t, pkName) || '');
                if (pkVal) {
                    newPositionsMap.set(pkVal, index);
                }
            });

            updatedList = updatedList.map(row => {
                const pkVal = String(getNestedValueCaseInsensitive(row, pkName) || '');
                if (newPositionsMap.has(pkVal)) {
                    return { ...row, [positionFieldName]: newPositionsMap.get(pkVal) };
                }
                return row;
            });
        }

        let msg = '';
        if (oldColumn === targetColumn) {
            msg = `Reihenfolge geändert: '${itemTitle}' innerhalb von '${targetColumn}' auf Position ${newIndex + 1} verschoben.`;
        } else {
            msg = `Erfolgreich verschoben: '${itemTitle}' von '${oldColumn}' nach '${targetColumn}' auf Position ${newIndex + 1}.`;
        }

        // 3. Auto-complete parent if subtask is moved to completed column
        if (activeDragIsSubTask && conf.autoCompleteParent && targetColumn === lastCol) {
            const parentId = getNestedValueCaseInsensitive(item, parentField);
            if (parentId) {
                const siblings = updatedList.filter(row => 
                    String(getNestedValueCaseInsensitive(row, parentField)) === String(parentId)
                );
                const allCompleted = siblings.every(sibling => 
                    String(getNestedValueCaseInsensitive(sibling, groupBy)) === lastCol
                );
                if (allCompleted) {
                    updatedList = updatedList.map(row => {
                        if (String(getNestedValueCaseInsensitive(row, pkName)) === String(parentId)) {
                            return { ...row, [groupBy]: lastCol };
                        }
                        return row;
                    });
                    msg += ` Alle Sub-Aufgaben erledigt! Hauptaufgabe wurde automatisch als '${lastCol}' markiert.`;
                }
            }
        }

        updateTable({ ...targetT, data: updatedList });

        setKanbanNotification(msg);
        setTimeout(() => {
            setKanbanNotification(prev => prev === msg ? '' : prev);
        }, 5000);

        setActiveDragItem(null);
        setTargetDragOverItem(null);
        setActiveDragIsSubTask(false);
    };

    const handleDropAsSubTask = (parentRow: any) => {
        const draggedItem = activeDragItem;
        if (!draggedItem || !parentRow) return;

        const dsId = conf.dataSourceId || conf.tableId;
        const targetT = tables.find(t => t.id === dsId);
        if (!targetT || !targetT.data) return;

        const draggedIdVal = getNestedValueCaseInsensitive(draggedItem, pkName);
        const parentIdVal = getNestedValueCaseInsensitive(parentRow, pkName);

        // Safety check 1: Can't drop on itself
        if (String(draggedIdVal) === String(parentIdVal)) return;

        // Safety check 2: Prevent circular hierarchy (A cannot be a descendant of itself)
        const isDescendant = (pRow: any, possibleDescendantRow: any): boolean => {
            const pId = String(getNestedValueCaseInsensitive(pRow, pkName) || '');
            let current = possibleDescendantRow;
            while (current) {
                const currentParentId = String(getNestedValueCaseInsensitive(current, parentField) || '');
                if (!currentParentId) return false;
                if (currentParentId === pId) return true;
                current = targetT.data.find(r => String(getNestedValueCaseInsensitive(r, pkName)) === currentParentId);
            }
            return false;
        };

        if (isDescendant(draggedItem, parentRow)) {
            setKanbanNotification(`Fehler: Eine Hauptaufgabe kann nicht als Unterpunkt ihres eigenen Unterpunkts abgelegt werden.`);
            setTimeout(() => setKanbanNotification(''), 4000);
            return;
        }

        const draggedTitle = getNestedValueCaseInsensitive(draggedItem, titleF) || 'Aufgabe';
        const parentTitle = getNestedValueCaseInsensitive(parentRow, titleF) || 'Aufgabe';

        // Update parentField of the dragged item and Status/groupBy to match parent status
        const parentStatus = getNestedValueCaseInsensitive(parentRow, groupBy);

        const updatedList = targetT.data.map(row => {
            if (String(getNestedValueCaseInsensitive(row, pkName)) === String(draggedIdVal)) {
                let updatedRow = { ...row };
                updatedRow = updateFieldCaseInsensitive(updatedRow, parentField, parentIdVal);
                updatedRow = updateFieldCaseInsensitive(updatedRow, groupBy, parentStatus);
                return updatedRow;
            }
            return row;
        });

        updateTable({ ...targetT, data: updatedList });

        setKanbanNotification(`'${draggedTitle}' wurde als Unterpunkt von '${parentTitle}' hinzugefügt.`);
        setTimeout(() => {
            setKanbanNotification('');
        }, 5000);

        setActiveDragItem(null);
        setTargetDragOverItem(null);
        setActiveDragIsSubTask(false);
    };

    const handlePromoteToMainTask = (row: any) => {
        if (!row || !parentField) return;

        const dsId = conf.dataSourceId || conf.tableId;
        const targetT = tables.find(t => t.id === dsId);
        if (!targetT || !targetT.data) return;

        const rowIdVal = getNestedValueCaseInsensitive(row, pkName);
        const rowTitle = getNestedValueCaseInsensitive(row, titleF) || 'Aufgabe';

        const updatedList = targetT.data.map(item => {
            if (String(getNestedValueCaseInsensitive(item, pkName)) === String(rowIdVal)) {
                return updateFieldCaseInsensitive(item, parentField, '');
            }
            return item;
        });

        updateTable({ ...targetT, data: updatedList });

        setKanbanNotification(`'${rowTitle}' wurde zu einer Hauptaufgabe befördert.`);
        setTimeout(() => {
            setKanbanNotification('');
        }, 5000);
    };

    if (loading) {
        return (
            <div className="p-4 w-full space-y-3 text-left">
                <div className="h-6 w-48 bg-slate-200 dark:bg-slate-800 animate-pulse rounded"></div>
                <div className="grid grid-cols-3 gap-3">
                    <div className="h-48 bg-slate-100 dark:bg-slate-900 animate-pulse rounded-xl"></div>
                    <div className="h-48 bg-slate-100 dark:bg-slate-900 animate-pulse rounded-xl"></div>
                    <div className="h-48 bg-slate-100 dark:bg-slate-900 animate-pulse rounded-xl"></div>
                </div>
            </div>
        );
    }

    return (
        <div className="p-4 w-full space-y-4 text-left">
            <div className="flex justify-between items-center border-b border-slate-200/60 dark:border-slate-800 pb-2">
                <h4 className="text-sm font-bold text-slate-800 dark:text-slate-100 flex items-center gap-1.5">
                    <Layers size={14} className="text-indigo-500" /> {conf.title || 'Kanban-Board'}
                </h4>
                <span className="text-[10px] bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400 px-2 py-0.5 rounded font-mono font-medium">
                    Status-Spalte: {groupBy}
                </span>
            </div>

            {kanbanNotification && (
                <div className="mb-4 bg-blue-50 dark:bg-blue-950/40 border-l-4 border-blue-500 text-blue-700 dark:text-blue-300 p-3 rounded-lg shadow-sm flex items-center gap-2 animate-pulse text-xs">
                    <span className="font-semibold">{kanbanNotification}</span>
                </div>
            )}

            {columnsKeys.length === 0 ? (
                <div className="text-center p-8 bg-slate-50 dark:bg-slate-900 border border-dashed border-slate-200 dark:border-slate-800 text-slate-400 text-xs italic rounded-xl">
                    Keine Daten gefunden. Bitte wählen Sie ein gültiges Gruppierungs-Feld.
                </div>
            ) : (
                <div className={conf.kanbanLayout === 'rows' ? "flex flex-col gap-6 w-full" : "grid grid-cols-1 md:grid-cols-3 xl:grid-cols-4 gap-4 overflow-x-auto pb-2"}>
                    {columnsKeys.map(colKey => (
                        <KanbanColumn
                            key={colKey}
                            colKey={colKey}
                            columnMapping={columnMapping}
                            rows={groups[colKey] || []}
                            titleF={titleF}
                            descF={descF}
                            accentF={accentF}
                            extraF1={conf.extraField1}
                            extraF2={conf.extraField2}
                            cardTemplate={cardTemplate?.configuration}
                            onDragOver={handleDragOver}
                            onDrop={handleDrop}
                            onDragStart={handleDragStart}
                            onDragEnter={handleDragEnterItem}
                            onCardClick={handleCardClick}
                            allSubItems={subItems}
                            parentField={parentField}
                            groupByField={groupBy}
                            completedStatus={defaultCols[defaultCols.length - 1]}
                            showSubTasksInline={conf.showSubTasksInline}
                            onToggleSubTask={handleToggleSubTask}
                            onDropAsSubTask={handleDropAsSubTask}
                            activeDragItem={activeDragItem}
                            allItems={fetchedData}
                            onPromoteToMainTask={handlePromoteToMainTask}
                            layoutMode={conf.kanbanLayout}
                        />
                    ))}
                </div>
            )}
        </div>
    );
};
