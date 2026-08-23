import React from 'react';
import { Table, TableNode, Relationship, NODE_WIDTH } from '../../types/index';
import { X, Globe, Table as TableIcon } from 'lucide-react';

interface TableNodeElementProps {
    node: TableNode;
    table: Table;
    selectedNodeIds: string[];
    onNodeDoubleClick?: (tableId: string) => void;
    onRemoveNode?: (id: string) => void;
    onMouseDown: (e: React.MouseEvent) => void;
    safeRelationships: Relationship[];
    hoveredRelId: string | null;
    connectionStart: { tableId: string, fieldId: string, nodeId: string } | null;
    handleFieldMouseDown: (e: React.MouseEvent, tableId: string, fieldId: string, nodeId: string) => void;
    handleFieldMouseUp: (e: React.MouseEvent, tableId: string, fieldId: string) => void;
    handleFieldDragStart: (e: React.DragEvent, tableId: string, fieldId: string) => void;
}

export const TableNodeElement: React.FC<TableNodeElementProps> = ({
    node,
    table,
    selectedNodeIds,
    onNodeDoubleClick,
    onRemoveNode,
    onMouseDown,
    safeRelationships,
    hoveredRelId,
    connectionStart,
    handleFieldMouseDown,
    handleFieldMouseUp,
    handleFieldDragStart
}) => {
    return (
        <div
            className={`absolute bg-white dark:bg-slate-900 border border-slate-400 dark:border-slate-800 rounded-sm select-none transition-shadow transition-colors duration-300 ${selectedNodeIds.includes(node.id) ? 'z-30 shadow-xl border-blue-500 dark:border-blue-500' : 'z-20 shadow-md'}`}
            style={{ 
                left: node.x, 
                top: node.y, 
                width: NODE_WIDTH,
            }}
            onMouseDown={onMouseDown}
        >
            <div 
                className="node-header h-10 bg-gradient-to-b from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-900 border-b border-slate-300 dark:border-slate-800 px-2 flex items-center justify-between cursor-move"
                onDoubleClick={() => onNodeDoubleClick && onNodeDoubleClick(table.id)}
            >
                <div className="flex items-center gap-2 truncate">
                    {table.isApiImport ? (
                        <span title="Externe API Tabelle" className="flex items-center text-blue-600 flex-shrink-0">
                            <Globe size={14} />
                        </span>
                    ) : (
                        <span title="Lokale Tabelle" className="flex items-center text-slate-500 flex-shrink-0">
                            <TableIcon size={14} />
                        </span>
                    )}
                    <span className="font-bold text-xs truncate text-slate-700 dark:text-slate-200" title={table.name}>{table.name}</span>
                </div>
                {onRemoveNode && (
                    <button onClick={() => onRemoveNode(node.id)} className="text-slate-400 hover:text-red-500">
                        <X size={14} />
                    </button>
                )}
            </div>
            <div className="text-xs text-slate-800 dark:text-slate-200">
                {onRemoveNode && (
                    <div 
                        className="h-7 px-2 flex items-center font-bold hover:bg-sky-50 dark:hover:bg-slate-800/50 cursor-grab"
                        draggable
                        onDragStart={(e) => handleFieldDragStart(e, table.id, '*')}
                    >
                        *
                    </div>
                )}
                {table.fields.map(field => {
                    const isForeignKey = safeRelationships.some(r => r.toTableId === table.id && r.toFieldId === field.id);
                    const isHovered = hoveredRelId && safeRelationships.some(r => r.id === hoveredRelId && (r.fromFieldId === field.id || r.toFieldId === field.id));
                    return (
                        <div 
                            key={field.id} 
                            className={`h-7 px-2 flex items-center justify-between hover:bg-sky-50 dark:hover:bg-slate-800/50 ${isHovered ? 'bg-blue-100 dark:bg-blue-950/50 text-blue-900 dark:text-blue-200 font-bold' : ''} ${connectionStart?.fieldId === field.id && connectionStart.tableId === table.id ? 'bg-sky-100 dark:bg-sky-950/50' : ''} ${onRemoveNode ? 'cursor-grab' : ''}`}
                            onMouseDown={(e) => handleFieldMouseDown(e, table.id, field.id, node.id)}
                            onMouseUp={(e) => handleFieldMouseUp(e, table.id, field.id)}
                            draggable={!!onRemoveNode}
                            onDragStart={(e) => handleFieldDragStart(e, table.id, field.id)}
                        >
                            <div className="flex items-center gap-2 overflow-hidden">
                                {field.isPrimaryKey && <span className="text-yellow-500 text-[10px]" title="Primary Key">🔑</span>}
                                {isForeignKey && <span className="text-cyan-600 text-[9px] font-bold" title="Foreign Key">FK</span>}
                                <span className="truncate">{field.name}</span>
                            </div>
                            <div className="flex items-center gap-1">
                                <span className="text-[9px] text-slate-400 uppercase">{field.type.substring(0,3)}</span>
                                {field.isAutoIncrement && (
                                    <span className="text-[8px] bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400 px-1 rounded flex items-center" title="Auto Increment">
                                        AI
                                    </span>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};
