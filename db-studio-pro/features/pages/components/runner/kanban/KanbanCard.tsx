import React from 'react';
import { getNestedValueCaseInsensitive } from '../../../utils/pageViewUtils';

interface KanbanCardProps {
    row: any;
    titleF: string;
    descF: string;
    accentF: string;
    extraF1?: string;
    extraF2?: string;
    cardTemplate?: any;
    columnMapping?: Record<string, string>;
    onDragStart: (row: any, isSub?: boolean) => void;
    onDragEnter: (row: any) => void;
    onClick: (row: any) => void;

    // Sub-tasks extensions
    subTasks?: any[];
    showSubTasksInline?: boolean;
    onToggleSubTask?: (subTaskId: any) => void;
    groupByField?: string;
    completedStatus?: string;

    // Hierarchical / Tree visual props
    isSubCard?: boolean;
    depth?: number;
    onDropAsSubTask?: (parentRow: any) => void;
    activeDragItem?: any;

    parentField?: string;
    parentTitle?: string;
    onPromoteToMainTask?: (row: any) => void;
}

export const KanbanCard: React.FC<KanbanCardProps> = ({
    row,
    titleF,
    descF,
    accentF,
    extraF1,
    extraF2,
    cardTemplate,
    columnMapping,
    onDragStart,
    onDragEnter,
    onClick,
    subTasks,
    showSubTasksInline,
    onToggleSubTask,
    groupByField,
    completedStatus,
    isSubCard = false,
    depth = 0,
    onDropAsSubTask,
    activeDragItem,
    parentField,
    parentTitle,
    onPromoteToMainTask,
}) => {
    // Robust, case-insensitive deep property selector supporting dot-nested path keys
    const getNestedValue = (obj: any, path: string): any => {
        if (!path) return undefined;
        const parts = path.split('.');
        let current = obj;
        for (const part of parts) {
            if (current === undefined || current === null) return undefined;
            current = getNestedValueCaseInsensitive(current, part);
        }
        return current;
    };

    const mapValWithLookup = (val: any): string => {
        if (val === undefined || val === null) return '';
        const sVal = String(val);
        if (columnMapping && columnMapping[sVal] !== undefined) {
            return columnMapping[sVal];
        }
        return typeof val === 'number' ? val.toLocaleString('de-DE') : sVal;
    };

    const hasSubTasks = subTasks && subTasks.length > 0;
    const totalSubs = hasSubTasks ? subTasks.length : 0;
    const completedSubs = hasSubTasks
        ? subTasks.filter(st => {
              const statusVal = String(getNestedValue(st, groupByField || 'Status') || '');
              return completedStatus ? (statusVal === completedStatus) : ['erledigt', 'done', 'completed', '3', 'geschlossen'].includes(statusVal.toLowerCase());
          }).length
        : 0;

    const percentDone = totalSubs > 0 ? Math.round((completedSubs / totalSubs) * 100) : 0;

    const renderSubTasksSection = () => {
        if (!hasSubTasks) return null;
        return (
            <div className="mt-3 pt-2.5 border-t border-slate-100 dark:border-slate-800/80 space-y-2 select-none" onClick={(e) => e.stopPropagation()}>
                <div className="flex justify-between items-center text-[9px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    <span className="flex items-center gap-1">
                        📋 Sub-Tasks
                    </span>
                    <span className="font-mono">{completedSubs}/{totalSubs} ({percentDone}%)</span>
                </div>
                {/* Progress Bar */}
                <div className="w-full h-1 bg-slate-100 dark:bg-slate-800/80 rounded-full overflow-hidden">
                    <div 
                        className="h-full bg-indigo-500 dark:bg-indigo-400 rounded-full transition-all duration-300" 
                        style={{ width: `${percentDone}%` }}
                    />
                </div>

                {/* Inline checklist if enabled */}
                {showSubTasksInline && (
                    <div className="space-y-1.5 pt-1 max-h-36 overflow-y-auto pr-1">
                        {subTasks.map((st, sIdx) => {
                            const stId = getNestedValue(st, 'id') || getNestedValue(st, 'Id');
                            const stTitle = getNestedValue(st, titleF) || getNestedValue(st, 'Name') || getNestedValue(st, 'name') || 'Sub-Task';
                            const stStatus = String(getNestedValue(st, groupByField || 'Status') || '');
                            const isStDone = completedStatus ? (stStatus === completedStatus) : ['erledigt', 'done', 'completed', '3', 'geschlossen'].includes(stStatus.toLowerCase());

                            return (
                                <div 
                                    key={stId || sIdx}
                                    draggable="true"
                                    onDragStart={(e) => {
                                        e.stopPropagation(); // Avoid dragging parent card
                                        onDragStart(st, true); // true indicates it is a subtask
                                    }}
                                    className="flex items-center justify-between gap-2 p-1.5 rounded bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 hover:border-slate-200 dark:hover:border-slate-700 hover:shadow-2xs transition-all duration-150 cursor-grab active:cursor-grabbing text-[10px]"
                                >
                                    <label className="flex items-center gap-1.5 cursor-pointer flex-1 min-w-0">
                                        <input
                                            type="checkbox"
                                            checked={isStDone}
                                            onChange={(e) => {
                                                e.stopPropagation();
                                                if (onToggleSubTask && stId !== undefined) {
                                                    onToggleSubTask(stId);
                                                }
                                            }}
                                            className="rounded border-slate-300 dark:border-slate-700 text-indigo-600 focus:ring-indigo-500 w-3.5 h-3.5 shrink-0"
                                        />
                                        <span className={`truncate ${isStDone ? 'line-through text-slate-400 dark:text-slate-500' : 'text-slate-700 dark:text-slate-300 font-medium'}`}>
                                            {stTitle}
                                        </span>
                                    </label>
                                    <span className={`text-[8px] font-bold px-1 py-0.5 rounded shrink-0 ${
                                        isStDone 
                                            ? 'bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600' 
                                            : 'bg-indigo-50 dark:bg-indigo-950/20 text-indigo-600'
                                    }`}>
                                        {columnMapping && columnMapping[stStatus] ? columnMapping[stStatus] : stStatus}
                                    </span>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        );
    };
    
    if (cardTemplate) {
        const fields = cardTemplate.fields || [];
        const cardStyle = cardTemplate.cardStyle || {
            padding: 'p-3',
            rounded: 'rounded-xl',
            bg: 'bg-white dark:bg-slate-950',
            border: 'border border-slate-200 dark:border-slate-800',
            shadow: 'shadow-xs'
        };

        const currentBg = isSubCard ? 'bg-slate-50/80 dark:bg-slate-900/40 hover:bg-slate-100 dark:hover:bg-slate-900/60' : cardStyle.bg;
        const currentPadding = isSubCard ? 'p-2.5' : cardStyle.padding;
        const currentBorder = isSubCard ? 'border border-dashed border-slate-200 dark:border-slate-800/85' : cardStyle.border;

        const rowPk = row.id !== undefined && row.id !== null ? row.id : (row.Id !== undefined && row.Id !== null ? row.Id : null);
        const activeDragPk = activeDragItem ? (activeDragItem.id !== undefined && activeDragItem.id !== null ? activeDragItem.id : (activeDragItem.Id !== undefined && activeDragItem.Id !== null ? activeDragItem.Id : null)) : null;
        const canBeDropTarget = activeDragItem && rowPk !== null && activeDragPk !== null && String(rowPk) !== String(activeDragPk);

        const hasParentVal = !!(parentField && (
            (row[parentField] !== undefined && row[parentField] !== null && row[parentField] !== '' && row[parentField] !== 0 && row[parentField] !== '0') ||
            (getNestedValueCaseInsensitive(row, parentField) !== undefined && getNestedValueCaseInsensitive(row, parentField) !== null && getNestedValueCaseInsensitive(row, parentField) !== '' && getNestedValueCaseInsensitive(row, parentField) !== 0 && getNestedValueCaseInsensitive(row, parentField) !== '0')
        ));

        return (
            <div 
                draggable="true"
                onDragStart={() => onDragStart(row, hasParentVal)}
                onDragEnter={() => onDragEnter(row)}
                onClick={() => onClick(row)}
                className={`${currentBg} ${currentPadding} ${cardStyle.rounded} ${currentBorder} ${isSubCard ? 'shadow-none' : cardStyle.shadow} hover:shadow-md hover:border-indigo-400 dark:hover:border-indigo-500 transition-all duration-200 cursor-grab active:cursor-grabbing space-y-1.5 text-left select-none relative`}
            >
                {parentField && (row[parentField] || getNestedValueCaseInsensitive(row, parentField)) && onPromoteToMainTask && (
                    <div className="absolute top-2 right-2 flex items-center gap-1 z-10" onClick={(e) => e.stopPropagation()}>
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                onPromoteToMainTask(row);
                            }}
                            title="Zu Hauptaufgabe machen"
                            className="p-0.5 text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded transition-colors"
                        >
                            <i className="fa-solid fa-arrow-up-right-from-square text-[9px]"></i>
                        </button>
                    </div>
                )}

                {isSubCard && (
                    <div className="pt-0.5">
                        <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-bold ${
                            completedStatus && String(getNestedValue(row, groupByField || 'Status') || '') === completedStatus
                                ? 'bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600'
                                : 'bg-amber-50 dark:bg-amber-950/20 text-amber-600'
                        }`}>
                            <span>Status:</span> {mapValWithLookup(getNestedValue(row, groupByField || 'Status'))}
                        </span>
                    </div>
                )}

                {!isSubCard && parentTitle && (
                    <div className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[9px] font-medium bg-indigo-50 dark:bg-indigo-950/30 text-indigo-700 dark:text-indigo-300 border border-indigo-100 dark:border-indigo-900/40 w-fit max-w-full truncate">
                        <span className="font-bold">↳</span> <span>Unteraufgabe von:</span> <strong className="font-semibold truncate">{parentTitle}</strong>
                    </div>
                )}

                {fields.length === 0 ? (
                    <div className="text-center py-2 text-[10px] text-slate-400 italic">Keine Felder definiert</div>
                ) : (
                    fields.map((f: any, i: number) => {
                        const val = getNestedValue(row, f.field);
                        if (val === undefined || val === null) return null;

                        const alignClass = f.align || 'text-left';
                        const sizeClass = f.fontSize || 'text-xs';
                        const weightClass = f.fontWeight || 'font-normal';
                        const displayVal = mapValWithLookup(val);

                        if (f.isBadge) {
                            const badgeColorClass = f.badgeColor || 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400';
                            return (
                                <div key={i} className={`${alignClass} pt-0.5`}>
                                    <span className={`inline-block ${sizeClass} ${weightClass} ${badgeColorClass} px-2 py-0.5 rounded-md`}>
                                        {f.showLabel !== false && f.label && <span className="opacity-80 mr-1">{f.label}:</span>}
                                        {displayVal}
                                    </span>
                                </div>
                            );
                        } else {
                            const textColorClass = f.textColor || 'text-slate-800 dark:text-slate-100';
                            return (
                                <div key={i} className={`${alignClass} ${sizeClass} ${weightClass} ${textColorClass} leading-tight`}>
                                    {f.showLabel !== false && f.label && (
                                        <span className="text-[10px] text-slate-400 dark:text-slate-500 font-bold mr-1">{f.label}:</span>
                                    )}
                                    {displayVal}
                                </div>
                            );
                        }
                    })
                )}
                {renderSubTasksSection()}

                {canBeDropTarget && onDropAsSubTask && (
                    <div
                        onDragOver={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                        }}
                        onDrop={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            onDropAsSubTask(row);
                        }}
                        className="mt-2 p-1.5 border border-dashed border-indigo-300 dark:border-indigo-700/80 rounded bg-indigo-50/50 dark:bg-indigo-950/20 text-center text-[10px] font-bold text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100/80 dark:hover:bg-indigo-950/40 transition-colors cursor-pointer flex items-center justify-center gap-1"
                    >
                        <span className="text-[11px]">↳</span> Als Unterpunkt ablegen
                    </div>
                )}
            </div>
        );
    }

    const cardTitleVal = getNestedValue(row, titleF) || getNestedValue(row, 'Name') || getNestedValue(row, 'name') || getNestedValue(row, 'Title') || getNestedValue(row, 'title') || getNestedValue(row, 'Username') || getNestedValue(row, 'username');
    const cardTitle = cardTitleVal ? mapValWithLookup(cardTitleVal) : `Task`;

    const cardDescVal = getNestedValue(row, descF) || getNestedValue(row, 'Email') || getNestedValue(row, 'email') || getNestedValue(row, 'Description') || getNestedValue(row, 'description') || getNestedValue(row, 'Untertitel');
    const cardDesc = cardDescVal ? mapValWithLookup(cardDescVal) : '';
    const cardAccent = getNestedValue(row, accentF);
    const cardExtra1 = extraF1 ? getNestedValue(row, extraF1) : null;
    const cardExtra2 = extraF2 ? getNestedValue(row, extraF2) : null;

    const rowPk = row.id !== undefined && row.id !== null ? row.id : (row.Id !== undefined && row.Id !== null ? row.Id : null);
    const activeDragPk = activeDragItem ? (activeDragItem.id !== undefined && activeDragItem.id !== null ? activeDragItem.id : (activeDragItem.Id !== undefined && activeDragItem.Id !== null ? activeDragItem.Id : null)) : null;
    const canBeDropTarget = activeDragItem && rowPk !== null && activeDragPk !== null && String(rowPk) !== String(activeDragPk);

    const hasParentVal = !!(parentField && (
        (row[parentField] !== undefined && row[parentField] !== null && row[parentField] !== '' && row[parentField] !== 0 && row[parentField] !== '0') ||
        (getNestedValueCaseInsensitive(row, parentField) !== undefined && getNestedValueCaseInsensitive(row, parentField) !== null && getNestedValueCaseInsensitive(row, parentField) !== '' && getNestedValueCaseInsensitive(row, parentField) !== 0 && getNestedValueCaseInsensitive(row, parentField) !== '0')
    ));

    const cardBg = isSubCard ? 'bg-slate-50/80 dark:bg-slate-900/40 hover:bg-slate-100 dark:hover:bg-slate-900/60' : 'bg-white dark:bg-slate-950';
    const cardPadding = isSubCard ? 'p-2.5' : 'p-3';
    const cardBorder = isSubCard ? 'border border-dashed border-slate-200 dark:border-slate-800/85' : 'border border-slate-200 dark:border-slate-800';
    const cardShadow = isSubCard ? 'shadow-none' : 'shadow-xs';

    return (
        <div 
            draggable="true"
            onDragStart={() => onDragStart(row, hasParentVal)}
            onDragEnter={() => onDragEnter(row)}
            onClick={() => onClick(row)}
            className={`${cardBg} ${cardPadding} rounded-xl ${cardBorder} ${cardShadow} hover:shadow-md hover:border-indigo-400 dark:hover:border-indigo-500 transition-all duration-200 cursor-grab active:cursor-grabbing space-y-2 text-left select-none relative`}
        >
            <div className="flex justify-between items-start gap-2">
                <h5 className={`${isSubCard ? 'text-[11px]' : 'text-xs'} font-bold text-slate-800 dark:text-slate-100 leading-tight truncate flex-1`}>{cardTitle}</h5>
                <div className="flex items-center gap-1 shrink-0">
                    {parentField && (row[parentField] || getNestedValueCaseInsensitive(row, parentField)) && onPromoteToMainTask && (
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                onPromoteToMainTask(row);
                            }}
                            title="Zu Hauptaufgabe machen"
                            className="p-0.5 text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded transition-colors"
                        >
                            <i className="fa-solid fa-arrow-up-right-from-square text-[9px]"></i>
                        </button>
                    )}
                    <i className="fa-solid fa-grip-vertical text-[10px] text-slate-400 dark:text-slate-600 cursor-move shrink-0" />
                </div>
            </div>
            {cardDesc && <p className="text-[10px] text-slate-500 dark:text-slate-400 leading-relaxed line-clamp-2">{cardDesc}</p>}
            
            {isSubCard && (
                <div className="pt-0.5">
                    <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-bold ${
                        completedStatus && String(getNestedValue(row, groupByField || 'Status') || '') === completedStatus
                            ? 'bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600'
                            : 'bg-amber-50 dark:bg-amber-950/20 text-amber-600'
                    }`}>
                        <span>Status:</span> {mapValWithLookup(getNestedValue(row, groupByField || 'Status'))}
                    </span>
                </div>
            )}

            {!isSubCard && parentTitle && (
                <div className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[9px] font-medium bg-indigo-50 dark:bg-indigo-950/30 text-indigo-700 dark:text-indigo-300 border border-indigo-100 dark:border-indigo-900/40 w-fit max-w-full truncate">
                    <span className="font-bold">↳</span> <span>Unteraufgabe von:</span> <strong className="font-semibold truncate">{parentTitle}</strong>
                </div>
            )}

            <div className="flex flex-wrap gap-1 pt-0.5">
                {cardAccent !== undefined && cardAccent !== null && (
                    <span className="text-[9px] font-bold bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 px-1.5 py-0.5 rounded font-mono">
                        {mapValWithLookup(cardAccent)}
                    </span>
                )}
                {cardExtra1 !== undefined && cardExtra1 !== null && (
                    <span className="text-[9px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 px-1.5 py-0.5 rounded font-mono">
                        {mapValWithLookup(cardExtra1)}
                    </span>
                )}
                {cardExtra2 !== undefined && cardExtra2 !== null && (
                    <span className="text-[9px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 px-1.5 py-0.5 rounded font-mono">
                        {mapValWithLookup(cardExtra2)}
                    </span>
                )}
            </div>
            {renderSubTasksSection()}

            {canBeDropTarget && onDropAsSubTask && (
                <div
                    onDragOver={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                    }}
                    onDrop={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        onDropAsSubTask(row);
                    }}
                    className="mt-2 p-1.5 border border-dashed border-indigo-300 dark:border-indigo-700/80 rounded bg-indigo-50/50 dark:bg-indigo-950/20 text-center text-[10px] font-bold text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100/80 dark:hover:bg-indigo-950/40 transition-colors cursor-pointer flex items-center justify-center gap-1"
                >
                    <span className="text-[11px]">↳</span> Als Unterpunkt ablegen
                </div>
            )}
        </div>
    );
};
