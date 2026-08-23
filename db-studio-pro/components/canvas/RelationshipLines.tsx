import React from 'react';
import { Table, TableNode, Relationship, HEADER_HEIGHT, FIELD_HEIGHT, NODE_WIDTH } from '../../types/index';

interface RelationshipLinesProps {
    safeRelationships: Relationship[];
    safeNodes: TableNode[];
    safeTables: Table[];
    hoveredRelId: string | null;
    setHoveredRelId: (id: string | null) => void;
    onRelationshipContextMenu?: (event: React.MouseEvent, relId: string) => void;
    onRemoveNode?: (id: string) => void;
}

export const RelationshipLines: React.FC<RelationshipLinesProps> = ({
    safeRelationships,
    safeNodes,
    safeTables,
    hoveredRelId,
    setHoveredRelId,
    onRelationshipContextMenu,
    onRemoveNode
}) => {
    const getFieldPos = (node: TableNode, table: Table, fieldId: string, side: 'left' | 'right') => {
        const fieldIndex = table.fields.findIndex(f => f.id === fieldId);
        let y = node.y + HEADER_HEIGHT + (fieldIndex * FIELD_HEIGHT) + (FIELD_HEIGHT / 2);
        if (onRemoveNode) y += FIELD_HEIGHT; // Offset for the '*' row in query designer

        const x = side === 'left' ? node.x : node.x + NODE_WIDTH;
        return { x, y };
    };

    return (
        <>
            <svg className="absolute top-0 left-0 w-[10000px] h-[10000px] pointer-events-none z-10 overflow-visible" style={{ left: -5000, top: -5000, pointerEvents: 'none' }}>
                <g transform="translate(5000, 5000)">
                    <defs>
                        <marker id="arrowhead" markerWidth="10" markerHeight="7" refX="0" refY="3.5" orient="auto">
                            <polygon points="0 0, 10 3.5, 0 7" fill="#64748b" />
                        </marker>
                    </defs>
                    {safeRelationships.map(rel => {
                        const fromNode = safeNodes.find(n => n.tableId === rel.fromTableId);
                        const toNode = safeNodes.find(n => n.tableId === rel.toTableId);
                        const fromTable = safeTables.find(t => t.id === rel.fromTableId);
                        const toTable = safeTables.find(t => t.id === rel.toTableId);

                        if (!fromNode || !toNode || !fromTable || !toTable) return null;

                        const fromField = fromTable.fields.find(f => f.id === rel.fromFieldId);
                        const toField = toTable.fields.find(f => f.id === rel.toFieldId);
                        const fromFieldName = fromField ? fromField.name : '?';
                        const toFieldName = toField ? toField.name : '?';

                        const fromIsLeft = fromNode.x < toNode.x;
                        const startSide = fromIsLeft ? 'right' : 'left';
                        const endSide = fromIsLeft ? 'left' : 'right';

                        let start = getFieldPos(fromNode, fromTable, rel.fromFieldId, startSide);
                        let end = getFieldPos(toNode, toTable, rel.toFieldId, endSide);

                        if (fromTable.fields.findIndex(f => f.id === rel.fromFieldId) === -1) {
                            start = { x: start.x, y: fromNode.y + HEADER_HEIGHT / 2 };
                        }
                        if (toTable.fields.findIndex(f => f.id === rel.toFieldId) === -1) {
                            end = { x: end.x, y: toNode.y + HEADER_HEIGHT / 2 };
                        }

                        const adjustedEndX = fromIsLeft ? end.x - 10 : end.x + 10;
                        const bezierEnd = { x: adjustedEndX, y: end.y };

                        const controlOffset = 50;
                        const cx1 = fromIsLeft ? start.x + controlOffset : start.x - controlOffset;
                        const cx2 = fromIsLeft ? bezierEnd.x - controlOffset : bezierEnd.x + controlOffset;

                        const d = `M ${start.x} ${start.y} C ${cx1} ${start.y}, ${cx2} ${bezierEnd.y}, ${bezierEnd.x} ${bezierEnd.y}`;
                        const labelTo = rel.type === '1:1' ? '1' : '∞';
                        const titleText = `${fromTable.name}.${fromFieldName} ${rel.type === '1:1' ? '-' : '->'} ${toTable.name}.${toFieldName}`;

                        return (
                            <g 
                                key={rel.id} 
                                className="pointer-events-auto"
                                onContextMenu={(e) => onRelationshipContextMenu && onRelationshipContextMenu(e, rel.id)}
                                onMouseEnter={() => setHoveredRelId(rel.id)}
                                onMouseLeave={() => setHoveredRelId(null)}
                            >
                                <title>{titleText}</title>
                                <path d={d} stroke="transparent" strokeWidth="16" fill="none" className="cursor-pointer" />
                                <path 
                                    d={d} 
                                    stroke={hoveredRelId === rel.id ? '#3b82f6' : '#64748b'} 
                                    strokeWidth={hoveredRelId === rel.id ? "3" : "2"} 
                                    fill="none" 
                                    markerEnd="url(#arrowhead)" 
                                    className="pointer-events-none transition-all duration-200" 
                                    strokeDasharray={rel.referentialIntegrity === false ? '4 2' : 'none'}
                                />
                                <circle cx={start.x} cy={start.y} r={hoveredRelId === rel.id ? "5" : "4"} fill={hoveredRelId === rel.id ? '#3b82f6' : '#64748b'} className="pointer-events-none transition-all duration-200" stroke="white" strokeWidth="1" />
                                <circle cx={bezierEnd.x} cy={bezierEnd.y} r={hoveredRelId === rel.id ? "5" : "4"} fill={hoveredRelId === rel.id ? '#3b82f6' : '#64748b'} className="pointer-events-none transition-all duration-200" stroke="white" strokeWidth="1" />
                                <text x={fromIsLeft ? start.x + 8 : start.x - 15} y={start.y - 6} className={`font-mono text-xs font-bold pointer-events-none select-none transition-colors ${hoveredRelId === rel.id ? 'fill-blue-600' : 'fill-slate-600'}`}>1</text>
                                <text x={fromIsLeft ? end.x - 18 : end.x + 10} y={end.y - 6} className={`font-mono text-xs font-bold pointer-events-none select-none transition-colors ${hoveredRelId === rel.id ? 'fill-blue-600' : 'fill-slate-600'}`}>{labelTo}</text>
                            </g>
                        );
                    })}
                </g>
            </svg>

            {hoveredRelId && (() => {
                const rel = safeRelationships.find(r => r.id === hoveredRelId);
                if (!rel) return null;
                
                const fromNode = safeNodes.find(n => n.tableId === rel.fromTableId);
                const toNode = safeNodes.find(n => n.tableId === rel.toTableId);
                const fromTable = safeTables.find(t => t.id === rel.fromTableId);
                const toTable = safeTables.find(t => t.id === rel.toTableId);
                
                if (!fromNode || !toNode || !fromTable || !toTable) return null;
                
                const fromField = fromTable.fields.find(f => f.id === rel.fromFieldId);
                const toField = toTable.fields.find(f => f.id === rel.toFieldId);
                if (!fromField || !toField) return null;

                const fromIsLeft = fromNode.x < toNode.x;
                const startSide = fromIsLeft ? 'right' : 'left';
                const endSide = fromIsLeft ? 'left' : 'right';

                let start = getFieldPos(fromNode, fromTable, rel.fromFieldId, startSide);
                let end = getFieldPos(toNode, toTable, rel.toFieldId, endSide);
                
                const midX = (start.x + end.x) / 2;
                const midY = (start.y + end.y) / 2;

                return (
                    <div 
                        className="absolute bg-slate-900/95 dark:bg-slate-950/95 text-white p-3 rounded-lg border border-blue-500 shadow-2xl z-50 pointer-events-none backdrop-blur-sm max-w-xs transition-all duration-200"
                        style={{ 
                            left: midX - 120, 
                            top: midY - 60,
                            width: 240,
                        }}
                    >
                        <div className="text-[10px] uppercase tracking-wider font-bold text-blue-400 border-b border-slate-700/50 pb-1 mb-1.5 flex justify-between items-center">
                            <span>Beziehung ({rel.type})</span>
                            {rel.referentialIntegrity !== false && (
                                <span className="bg-emerald-500/20 text-emerald-400 px-1 py-0.5 rounded text-[8px]">FK Constraint</span>
                            )}
                        </div>
                        <div className="space-y-1 text-xs">
                            <div className="flex items-center justify-between gap-2">
                                <span className="text-slate-300 font-medium truncate">{fromTable.name}</span>
                                <span className="text-slate-500 font-bold">→</span>
                                <span className="text-slate-300 font-medium truncate">{toTable.name}</span>
                            </div>
                            <div className="flex items-center justify-between gap-1 font-mono text-[10px] bg-slate-800 p-1 rounded border border-slate-700/30">
                                <span className="text-orange-400 truncate font-semibold">{fromField.name} {fromField.isPrimaryKey ? '🔑' : ''}</span>
                                <span className="text-slate-500">==</span>
                                <span className="text-blue-400 truncate font-semibold">{toField.name} {toField.isPrimaryKey ? '🔑' : '🔗'}</span>
                            </div>
                            {rel.comment && (
                                <p className="text-[10px] italic text-slate-400 mt-1.5 border-t border-slate-700/50 pt-1 leading-normal">
                                    {rel.comment}
                                </p>
                            )}
                        </div>
                    </div>
                );
            })()}
        </>
    );
};
