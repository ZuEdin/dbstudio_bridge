import React from 'react';
import { Table, TableNode, TableGroup, HEADER_HEIGHT, FIELD_HEIGHT, NODE_WIDTH } from '../../types/index';
import { Map, Eye, EyeOff } from 'lucide-react';

interface MinimapProps {
    showMinimap: boolean;
    setShowMinimap: (show: boolean) => void;
    minimapWidth: number;
    minimapHeight: number;
    tableGroups: TableGroup[];
    safeNodes: TableNode[];
    safeTables: Table[];
    selectedNodeIds: string[];
    minX: number;
    minY: number;
    boundsWidth: number;
    boundsHeight: number;
    pan: { x: number; y: number };
    scale: number;
    containerSize: { width: number; height: number };
    setIsDraggingMinimap: (dragging: boolean) => void;
    handleMinimapInteraction: (clientX: number, clientY: number, containerElement: HTMLDivElement) => void;
    onRemoveNode?: (id: string) => void;
}

export const Minimap: React.FC<MinimapProps> = ({
    showMinimap,
    setShowMinimap,
    minimapWidth,
    minimapHeight,
    tableGroups,
    safeNodes,
    safeTables,
    selectedNodeIds,
    minX,
    minY,
    boundsWidth,
    boundsHeight,
    pan,
    scale,
    containerSize,
    setIsDraggingMinimap,
    handleMinimapInteraction,
    onRemoveNode
}) => {
    return (
        <div 
            className="absolute bottom-16 right-4 z-40 transition-all duration-300"
            style={{ pointerEvents: 'auto' }}
        >
            <div className="flex flex-col bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border border-slate-200 dark:border-slate-800/80 rounded-xl shadow-2xl overflow-hidden">
                {/* Header */}
                <div className="flex items-center justify-between px-3 py-2 bg-slate-50/50 dark:bg-slate-800/30 border-b border-slate-100 dark:border-slate-850/80 select-none">
                    <div className="flex items-center gap-1.5 text-[11px] font-bold tracking-wider text-slate-500 dark:text-slate-400 uppercase">
                        <Map size={13} className="text-indigo-500" />
                        <span>Minimap</span>
                    </div>
                    <button 
                        onClick={() => setShowMinimap(!showMinimap)}
                        className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                        title={showMinimap ? "Minimap einklappen" : "Minimap ausklappen"}
                    >
                        {showMinimap ? <EyeOff size={13} /> : <Eye size={13} />}
                    </button>
                </div>

                {/* Map Area */}
                {showMinimap && (
                    <div 
                        id="minimap-content"
                        className="relative cursor-crosshair overflow-hidden select-none bg-slate-50/40 dark:bg-slate-950/40"
                        style={{ width: minimapWidth, height: minimapHeight }}
                        onMouseDown={(e) => {
                            setIsDraggingMinimap(true);
                            handleMinimapInteraction(e.clientX, e.clientY, e.currentTarget);
                        }}
                    >
                        {/* Minimap Grid simulation */}
                        <div className="absolute inset-0 bg-[linear-gradient(to_right,#f1f5f9_1px,transparent_1px),linear-gradient(to_bottom,#f1f5f9_1px,transparent_1px)] dark:bg-[linear-gradient(to_right,#1e293b_1px,transparent_1px),linear-gradient(to_bottom,#1e293b_1px,transparent_1px)] bg-[size:10px_10px] opacity-25 pointer-events-none" />

                        {/* Group Bounds */}
                        {tableGroups && tableGroups.map(group => {
                            const groupNodes = safeNodes.filter(n => n.groupId === group.id);
                            if (groupNodes.length === 0) return null;
                            const gMinX = Math.min(...groupNodes.map(n => n.x)) - 24;
                            const gMinY = Math.min(...groupNodes.map(n => n.y)) - 100;
                            const gMaxX = Math.max(...groupNodes.map(n => n.x + NODE_WIDTH)) + 24;
                            const gMaxY = Math.max(...groupNodes.map(n => {
                                const t = safeTables.find(tbl => tbl.id === n.tableId);
                                const h = t ? HEADER_HEIGHT + t.fields.length * FIELD_HEIGHT + (onRemoveNode ? FIELD_HEIGHT : 0) : 200;
                                return n.y + h;
                            })) + 24;

                            const gx = ((gMinX - minX) / boundsWidth) * minimapWidth;
                            const gy = ((gMinY - minY) / boundsHeight) * minimapHeight;
                            const gw = ((gMaxX - gMinX) / boundsWidth) * minimapWidth;
                            const gh = ((gMaxY - gMinY) / boundsHeight) * minimapHeight;

                            return (
                                <div
                                    key={group.id}
                                    className="absolute border border-dashed border-indigo-400/40 dark:border-indigo-500/30 bg-indigo-500/5 rounded pointer-events-none"
                                    style={{ left: gx, top: gy, width: gw, height: gh }}
                                />
                            );
                        })}

                        {/* Node Bounds */}
                        {safeNodes.map(node => {
                            const t = safeTables.find(tbl => tbl.id === node.tableId);
                            const nodeHeight = t ? HEADER_HEIGHT + t.fields.length * FIELD_HEIGHT + (onRemoveNode ? FIELD_HEIGHT : 0) : 150;

                            const nx = ((node.x - minX) / boundsWidth) * minimapWidth;
                            const ny = ((node.y - minY) / boundsHeight) * minimapHeight;
                            const nw = (NODE_WIDTH / boundsWidth) * minimapWidth;
                            const nh = (nodeHeight / boundsHeight) * minimapHeight;
                            const isSelected = selectedNodeIds.includes(node.id);

                            return (
                                <div
                                    key={node.id}
                                    className={`absolute rounded-[2px] transition-all pointer-events-none ${
                                        isSelected 
                                            ? 'bg-indigo-500/45 border border-indigo-500 shadow-[0_0_4px_rgba(99,102,241,0.5)] z-10' 
                                            : 'bg-slate-300 dark:bg-slate-700 border border-slate-400 dark:border-slate-650'
                                    }`}
                                    style={{ left: nx, top: ny, width: nw, height: nh }}
                                >
                                    <div className="h-[2px] w-full bg-slate-400 dark:bg-slate-500 rounded-t" />
                                </div>
                            );
                        })}

                        {/* Viewport Bounds Rectangle */}
                        {(() => {
                            const viewportLeft = -pan.x / scale;
                            const viewportTop = -pan.y / scale;
                            const viewportRight = (-pan.x + containerSize.width) / scale;
                            const viewportBottom = (-pan.y + containerSize.height) / scale;

                            const vx = ((viewportLeft - minX) / boundsWidth) * minimapWidth;
                            const vy = ((viewportTop - minY) / boundsHeight) * minimapHeight;
                            const vw = ((viewportRight - viewportLeft) / boundsWidth) * minimapWidth;
                            const vh = ((viewportBottom - viewportTop) / boundsHeight) * minimapHeight;

                            return (
                                <div
                                    className="absolute border-2 border-indigo-500 dark:border-indigo-400 bg-indigo-500/10 dark:bg-indigo-500/15 rounded shadow-[0_0_8px_rgba(99,102,241,0.25)] pointer-events-none"
                                    style={{
                                        left: vx,
                                        top: vy,
                                        width: Math.max(12, vw),
                                        height: Math.max(12, vh),
                                    }}
                                />
                            );
                        })()}
                    </div>
                )}
            </div>
        </div>
    );
};
