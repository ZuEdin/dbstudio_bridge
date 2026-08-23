import React, { useRef, useState, useEffect } from 'react';
import { Table, TableNode, Relationship, HEADER_HEIGHT, FIELD_HEIGHT, NODE_WIDTH } from '../types/index';
import { GripVertical } from 'lucide-react';
import { useProjectStore } from '../stores/useProjectStore';

// Modular Subcomponents Imports
import { LocalInput, LocalTextarea } from './canvas/LocalInputs';
import { CollaboratorCursors } from './canvas/CollaboratorCursors';
import { Minimap } from './canvas/Minimap';
import { SelectionToolbar } from './canvas/SelectionToolbar';
import { CanvasControls } from './canvas/CanvasControls';
import { RelationshipLines } from './canvas/RelationshipLines';
import { TableNodeElement } from './canvas/TableNodeElement';

interface CanvasProps {
  nodes: TableNode[];
  tables: Table[];
  relationships?: Relationship[];
  onMoveNode?: (id: string, x: number, y: number) => void;
  onUpdateNodes?: (nodes: TableNode[]) => void;
  onRemoveNode?: (id: string) => void;
  onConnect?: (sourceTableId: string, sourceFieldId: string, targetTableId: string, targetFieldId: string) => void;
  isInteractive?: boolean;
  onRelationshipContextMenu?: (event: React.MouseEvent, relId: string) => void;
  onNodeDoubleClick?: (tableId: string) => void;
}

type DragState = { 
  nodeIds: string[]; 
  initialPositions: { [id: string]: { x: number; y: number } }; 
  mouseStartX: number; 
  mouseStartY: number; 
} | null;

export const Canvas: React.FC<CanvasProps> = ({ 
  nodes, 
  tables, 
  relationships = [], 
  onMoveNode, 
  onUpdateNodes,
  onRemoveNode,
  onConnect,
  isInteractive = false,
  onRelationshipContextMenu,
  onNodeDoubleClick,
}) => {
  const [dragState, setDragState] = useState<DragState>(null);
  const [connectionStart, setConnectionStart] = useState<{ tableId: string, fieldId: string, nodeId: string } | null>(null);
  const [selectedNodeIds, setSelectedNodeIds] = useState<string[]>([]);
  const [hoveredRelId, setHoveredRelId] = useState<string | null>(null);
  
  const [scale, setScale] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });

  const tableGroups = useProjectStore(state => state.tableGroups);
  const setTableGroups = useProjectStore(state => state.setTableGroups);

  const [snapToGrid, setSnapToGrid] = useState<boolean>(true);
  const [canvasMode, setCanvasMode] = useState<'select' | 'pan'>('select');
  const [selectionBox, setSelectionBox] = useState<{ startX: number; startY: number; currentX: number; currentY: number } | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);
  const [containerSize, setContainerSize] = useState({ width: 1000, height: 600 });
  const [showMinimap, setShowMinimap] = useState(true);
  const [isDraggingMinimap, setIsDraggingMinimap] = useState(false);

  useEffect(() => {
    if (!containerRef.current) return;
    const updateSize = () => {
      if (containerRef.current) {
        setContainerSize({
          width: containerRef.current.clientWidth || 1000,
          height: containerRef.current.clientHeight || 600
        });
      }
    };
    updateSize();
    
    const observer = new ResizeObserver(updateSize);
    observer.observe(containerRef.current);
    
    window.addEventListener('resize', updateSize);
    return () => {
      observer.disconnect();
      window.removeEventListener('resize', updateSize);
    };
  }, []);

  const safeNodes = Array.isArray(nodes) ? nodes : [];
  const safeTables = Array.isArray(tables) ? tables : [];
  const safeRelationships = Array.isArray(relationships) ? relationships : [];

  const handleAlignAllToGrid = () => {
    if (!onUpdateNodes) return;
    const updatedNodes = safeNodes.map(n => ({
      ...n,
      x: Math.round(n.x / 20) * 20,
      y: Math.round(n.y / 20) * 20
    }));
    onUpdateNodes(updatedNodes);
  };

  const handleAutoArrange = () => {
    if (!onUpdateNodes) return;

    const updatedNodesMap: Record<string, { x: number; y: number }> = {};
    let currentGroupStartX = 80;
    let currentGroupStartY = 140;
    let maxGroupHeightInRow = 0;
    const groupSpacingX = 100; 
    const groupSpacingY = 160; 
    const wrapWidth = 1400;

    const activeGroups = (tableGroups || [])
      .filter(g => safeNodes.some(n => n.groupId === g.id))
      .sort((a, b) => a.name.localeCompare(b.name));

    activeGroups.forEach(group => {
      const groupNodes = safeNodes
        .filter(n => n.groupId === group.id)
        .sort((a, b) => {
          const tA = safeTables.find(t => t.id === a.tableId);
          const tB = safeTables.find(t => t.id === b.tableId);
          return (tA ? tA.name : '').localeCompare(tB ? tB.name : '');
        });

      const K = groupNodes.length;
      if (K === 0) return;

      const cols = K <= 2 ? K : (K <= 4 ? 2 : 3);
      const rows = Math.ceil(K / cols);

      const hSpacing = 280;
      const vSpacing = 280;

      const groupWidth = cols * hSpacing;
      const groupHeight = rows * vSpacing;

      if (currentGroupStartX > 80 && currentGroupStartX + groupWidth > wrapWidth) {
        currentGroupStartX = 80;
        currentGroupStartY += maxGroupHeightInRow + groupSpacingY;
        maxGroupHeightInRow = 0;
      }

      groupNodes.forEach((node, index) => {
        const col = index % cols;
        const row = Math.floor(index / cols);

        let x = currentGroupStartX + col * hSpacing;
        let y = currentGroupStartY + row * vSpacing;

        if (snapToGrid) {
          x = Math.round(x / 20) * 20;
          y = Math.round(y / 20) * 20;
        }

        updatedNodesMap[node.id] = { x, y };
      });

      maxGroupHeightInRow = Math.max(maxGroupHeightInRow, groupHeight);
      currentGroupStartX += groupWidth + groupSpacingX;
    });

    let ungroupedStartY = 50;
    if (activeGroups.length > 0) {
      ungroupedStartY = currentGroupStartY + maxGroupHeightInRow + 140;
    }

    const ungroupedNodes = safeNodes
      .filter(n => !n.groupId)
      .sort((a, b) => {
        const tA = safeTables.find(t => t.id === a.tableId);
        const tB = safeTables.find(t => t.id === b.tableId);
        return (tA ? tA.name : '').localeCompare(tB ? tB.name : '');
      });

    const ungroupedCols = 4; 
    ungroupedNodes.forEach((node, index) => {
      const col = index % ungroupedCols;
      const row = Math.floor(index / ungroupedCols);

      let x = 80 + col * 280;
      let y = ungroupedStartY + row * 280;

      if (snapToGrid) {
        x = Math.round(x / 20) * 20;
        y = Math.round(y / 20) * 20;
      }

      updatedNodesMap[node.id] = { x, y };
    });

    const updatedNodes = safeNodes.map(n => {
      if (updatedNodesMap[n.id]) {
        return {
          ...n,
          x: updatedNodesMap[n.id].x,
          y: updatedNodesMap[n.id].y
        };
      }
      return n;
    });

    onUpdateNodes(updatedNodes);
  };

  const handlePhysicsLayout = () => {
    if (!onUpdateNodes) return;
    
    const simNodes = safeNodes.map(n => ({ ...n, vx: 0, vy: 0 }));
    const iterations = 150;
    const repulsion = 800000; 
    const attraction = 0.05;
    const damping = 0.7;
    const optimalDist = 350;
    
    for (let i = 0; i < iterations; i++) {
        for (let j = 0; j < simNodes.length; j++) {
            for (let k = j + 1; k < simNodes.length; k++) {
                const dx = simNodes[j].x - simNodes[k].x;
                const dy = simNodes[j].y - simNodes[k].y;
                const distSq = dx * dx + dy * dy || 1;
                const dist = Math.sqrt(distSq);
                const force = repulsion / distSq;
                const fx = (dx / dist) * force;
                const fy = (dy / dist) * force;
                simNodes[j].vx += fx;
                simNodes[j].vy += fy;
                simNodes[k].vx -= fx;
                simNodes[k].vy -= fy;
            }
        }
        
        safeRelationships.forEach(rel => {
            const sourceNode = simNodes.find(n => n.tableId === rel.fromTableId);
            const targetNode = simNodes.find(n => n.tableId === rel.toTableId);
            if (sourceNode && targetNode && sourceNode !== targetNode) {
                const dx = targetNode.x - sourceNode.x;
                const dy = targetNode.y - sourceNode.y;
                const dist = Math.sqrt(dx * dx + dy * dy || 1);
                const force = (dist - optimalDist) * attraction;
                const fx = (dx / dist) * force;
                const fy = (dy / dist) * force;
                sourceNode.vx += fx;
                sourceNode.vy += fy;
                targetNode.vx -= fx;
                targetNode.vy -= fy;
            }
        });
        
        simNodes.forEach(n => {
            n.vx *= damping;
            n.vy *= damping;
            n.x += n.vx;
            n.y += n.vy;
        });
    }
    
    const minX = Math.min(...simNodes.map(n => n.x));
    const minY = Math.min(...simNodes.map(n => n.y));
    
    const updatedNodes = simNodes.map(n => {
        let finalX = n.x - minX + 80;
        let finalY = n.y - minY + 80;
        if (snapToGrid) {
            finalX = Math.round(finalX / 20) * 20;
            finalY = Math.round(finalY / 20) * 20;
        }
        return { ...n, x: finalX, y: finalY };
    });
    
    onUpdateNodes(updatedNodes);
  };

  const handleZoomIn = () => {
    setScale(prev => Math.min(2, Math.round(prev * 1.15 * 100) / 100));
  };

  const handleZoomOut = () => {
    setScale(prev => Math.max(0.2, Math.round((prev / 1.15) * 100) / 100));
  };

  const handleZoomReset = () => {
    setScale(1);
    setPan({ x: 0, y: 0 });
  };

  // Minimap Settings
  const minimapWidth = 200;
  const minimapHeight = 130;
  const minimapPadding = 150;

  const nodesX = safeNodes.map(n => n.x);
  const nodesY = safeNodes.map(n => n.y);
  const nodesWidths = safeNodes.map(() => NODE_WIDTH);
  const nodesHeights = safeNodes.map(n => {
    const t = safeTables.find(tbl => tbl.id === n.tableId);
    return t ? HEADER_HEIGHT + t.fields.length * FIELD_HEIGHT + (onRemoveNode ? FIELD_HEIGHT : 0) : 150;
  });

  const nodesMinX = nodesX.length > 0 ? Math.min(...nodesX) : 0;
  const nodesMaxX = nodesX.length > 0 ? Math.max(...nodesX.map((x, i) => x + nodesWidths[i])) : 1200;
  const nodesMinY = nodesY.length > 0 ? Math.min(...nodesY) : 0;
  const nodesMaxY = nodesY.length > 0 ? Math.max(...nodesY.map((y, i) => y + nodesHeights[i])) : 800;

  const minX = Math.min(0, nodesMinX - minimapPadding);
  const minY = Math.min(0, nodesMinY - minimapPadding);
  const maxX = Math.max(1600, nodesMaxX + minimapPadding);
  const maxY = Math.max(1000, nodesMaxY + minimapPadding);

  const boundsWidth = maxX - minX;
  const boundsHeight = maxY - minY;

  const handleMinimapInteraction = (clientX: number, clientY: number, containerElement: HTMLDivElement) => {
    const rect = containerElement.getBoundingClientRect();
    const mx = Math.max(0, Math.min(minimapWidth, clientX - rect.left));
    const my = Math.max(0, Math.min(minimapHeight, clientY - rect.top));

    const cx = minX + (mx / minimapWidth) * boundsWidth;
    const cy = minY + (my / minimapHeight) * boundsHeight;

    const panX = containerSize.width / 2 - cx * scale;
    const panY = containerSize.height / 2 - cy * scale;

    setPan({ x: panX, y: panY });
  };

  useEffect(() => {
    if (!isDraggingMinimap) return;

    const handleWindowMouseMove = (e: MouseEvent) => {
      const mmElement = document.getElementById('minimap-content');
      if (mmElement) {
        handleMinimapInteraction(e.clientX, e.clientY, mmElement as HTMLDivElement);
      }
    };

    const handleWindowMouseUp = () => {
      setIsDraggingMinimap(false);
    };

    window.addEventListener('mousemove', handleWindowMouseMove);
    window.addEventListener('mouseup', handleWindowMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleWindowMouseMove);
      window.removeEventListener('mouseup', handleWindowMouseUp);
    };
  }, [isDraggingMinimap, containerSize, scale, minX, minY, boundsWidth, boundsHeight]);

  const handleGroupDragStart = (e: React.MouseEvent, groupNodeIds: string[]) => {
    if (!isInteractive) return;
    e.stopPropagation();

    let newSelection = [...selectedNodeIds];
    if (!e.shiftKey) {
        newSelection = Array.from(new Set([...newSelection, ...groupNodeIds]));
    } else {
        const allSelected = groupNodeIds.every(id => newSelection.includes(id));
        if (allSelected) {
            newSelection = newSelection.filter(id => !groupNodeIds.includes(id));
        } else {
            newSelection = Array.from(new Set([...newSelection, ...groupNodeIds]));
        }
    }
    
    if (newSelection.length > 0) {
        setSelectedNodeIds(newSelection);

        const initialPositions: { [id: string]: { x: number; y: number } } = {};
        newSelection.forEach(id => {
            const n = safeNodes.find(n => n.id === id);
            if (n) initialPositions[id] = { x: n.x, y: n.y };
        });

        setDragState({
            nodeIds: newSelection,
            initialPositions,
            mouseStartX: e.clientX,
            mouseStartY: e.clientY,
        });
    }
  };

  const handleDragStart = (e: React.MouseEvent, nodeId: string) => {
    const node = safeNodes.find(n => n.id === nodeId);
    if (!node || !isInteractive) return;

    if ((e.target as HTMLElement).closest('.node-header')) {
      e.stopPropagation();

      let newSelection = [...selectedNodeIds];
      
      if (e.shiftKey) {
        if (newSelection.includes(nodeId)) {
          newSelection = newSelection.filter(id => id !== nodeId);
        } else {
          newSelection.push(nodeId);
        }
      } else {
        if (!newSelection.includes(nodeId)) {
          newSelection = [nodeId];
          if (node.groupId) {
             const groupNodes = safeNodes.filter(n => n.groupId === node.groupId).map(n => n.id);
             newSelection = Array.from(new Set([...newSelection, ...groupNodes]));
          }
        } else {
          if (node.groupId) {
             const groupNodes = safeNodes.filter(n => n.groupId === node.groupId).map(n => n.id);
             newSelection = Array.from(new Set([...newSelection, ...groupNodes]));
          }
        }
      }
      
      setSelectedNodeIds(newSelection);

      const initialPositions: { [id: string]: { x: number; y: number } } = {};
      newSelection.forEach(id => {
        const n = safeNodes.find(n => n.id === id);
        if (n) initialPositions[id] = { x: n.x, y: n.y };
      });

      setDragState({
        nodeIds: newSelection,
        initialPositions,
        mouseStartX: e.clientX,
        mouseStartY: e.clientY,
      });
    }
  };

  const handleContainerMouseDown = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget && isInteractive) {
      if (canvasMode === 'pan' || e.altKey || e.button === 1) {
        setSelectedNodeIds([]);
        setIsPanning(true);
        setPanStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
      } else {
        setSelectedNodeIds([]);
        const rect = e.currentTarget.getBoundingClientRect();
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;
        setSelectionBox({
          startX: mouseX,
          startY: mouseY,
          currentX: mouseX,
          currentY: mouseY
        });
      }
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isPanning) {
      setPan({ x: e.clientX - panStart.x, y: e.clientY - panStart.y });
      return;
    }
    if (selectionBox) {
      const rect = e.currentTarget.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;

      const selLeft = Math.min(selectionBox.startX, mouseX);
      const selRight = Math.max(selectionBox.startX, mouseX);
      const selTop = Math.min(selectionBox.startY, mouseY);
      const selBottom = Math.max(selectionBox.startY, mouseY);

      const newlySelected: string[] = [];
      safeNodes.forEach(node => {
        const table = safeTables.find(t => t.id === node.tableId);
        if (!table) return;

        const nodeHeight = HEADER_HEIGHT + table.fields.length * FIELD_HEIGHT + (onRemoveNode ? FIELD_HEIGHT : 0);

        const nodeLeft = node.x * scale + pan.x;
        const nodeRight = (node.x + NODE_WIDTH) * scale + pan.x;
        const nodeTop = node.y * scale + pan.y;
        const nodeBottom = (node.y + nodeHeight) * scale + pan.y;

        const overlapsX = nodeLeft < selRight && nodeRight > selLeft;
        const overlapsY = nodeTop < selBottom && nodeBottom > selTop;

        if (overlapsX && overlapsY) {
          newlySelected.push(node.id);
        }
      });

      setSelectedNodeIds(newlySelected);
      setSelectionBox({
        ...selectionBox,
        currentX: mouseX,
        currentY: mouseY
      });
      return;
    }
    if (dragState) {
      const dx = (e.clientX - dragState.mouseStartX) / scale;
      const dy = (e.clientY - dragState.mouseStartY) / scale;
      
      if (onUpdateNodes) {
        const updatedNodes = safeNodes.map(n => {
           if (dragState.nodeIds.includes(n.id)) {
             let newX = dragState.initialPositions[n.id].x + dx;
             let newY = dragState.initialPositions[n.id].y + dy;
             if (snapToGrid) {
               newX = Math.round(newX / 20) * 20;
               newY = Math.round(newY / 20) * 20;
             }
             return { ...n, x: newX, y: newY };
           }
           return n;
        });
        onUpdateNodes(updatedNodes);
      } else if (onMoveNode) {
        dragState.nodeIds.forEach(id => {
          let newX = dragState.initialPositions[id].x + dx;
          let newY = dragState.initialPositions[id].y + dy;
          if (snapToGrid) {
            newX = Math.round(newX / 20) * 20;
            newY = Math.round(newY / 20) * 20;
          }
          onMoveNode(id, newX, newY);
        });
      }
    }
  };

  const handleMouseUp = () => {
    setDragState(null);
    setConnectionStart(null);
    setIsPanning(false);
    setSelectionBox(null);
  };

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const zoomFactor = 1.1;
    const rect = e.currentTarget.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    const newScale = e.deltaY < 0 ? scale * zoomFactor : scale / zoomFactor;
    const clampedScale = Math.min(Math.max(0.2, newScale), 2);
    
    const panX = mouseX - (mouseX - pan.x) * (clampedScale / scale);
    const panY = mouseY - (mouseY - pan.y) * (clampedScale / scale);

    setScale(clampedScale);
    setPan({ x: panX, y: panY });
  };

  const handleFieldMouseDown = (e: React.MouseEvent, tableId: string, fieldId: string, nodeId: string) => {
    setSelectedNodeIds([nodeId]);
    if (!isInteractive || onRemoveNode) return; 
    e.stopPropagation();
    setConnectionStart({ tableId, fieldId, nodeId });
  };

  const handleFieldMouseUp = (e: React.MouseEvent, tableId: string, fieldId: string) => {
    if (!isInteractive || !connectionStart || onRemoveNode) return;
    e.stopPropagation();
    
    if (connectionStart.tableId !== tableId && onConnect) {
      onConnect(connectionStart.tableId, connectionStart.fieldId, tableId, fieldId);
    }
    setConnectionStart(null);
  };

  const handleFieldDragStart = (e: React.DragEvent, tableId: string, fieldId: string) => {
    if (!onRemoveNode) return; 
    e.dataTransfer.setData('application/json', JSON.stringify({ type: 'query_field', tableId, fieldId }));
    e.dataTransfer.effectAllowed = 'copy';
  };

  const handleGroupSelected = () => {
    if (!onUpdateNodes) return;
    const groupId = crypto.randomUUID();
    const newGroups = [...(tableGroups || []), { id: groupId, name: 'Neue Gruppe' }];
    setTableGroups(newGroups);

    const updatedNodes = safeNodes.map(n => {
       if (selectedNodeIds.includes(n.id)) {
           return { ...n, groupId };
       }
       return n;
    });
    onUpdateNodes(updatedNodes);
  };

  const handleUngroupSelected = () => {
    if (!onUpdateNodes) return;
    const groupIdsToRemove = new Set(safeNodes.filter(n => selectedNodeIds.includes(n.id) && n.groupId).map(n => n.groupId));
    
    if (groupIdsToRemove.size > 0 && tableGroups) {
        setTableGroups(tableGroups.filter(g => !groupIdsToRemove.has(g.id)));
    }

    const updatedNodes = safeNodes.map(n => {
       if (selectedNodeIds.includes(n.id)) {
           return { ...n, groupId: undefined };
       }
       return n;
    });
    onUpdateNodes(updatedNodes);
  };

  const handleAlignTop = () => {
    if (!onUpdateNodes) return;
    const selectedNodes = safeNodes.filter(n => selectedNodeIds.includes(n.id));
    if (selectedNodes.length === 0) return;
    const minY = Math.min(...selectedNodes.map(n => n.y));
    
    const updatedNodes = safeNodes.map(n => {
       if (selectedNodeIds.includes(n.id)) {
           return { ...n, y: minY };
       }
       return n;
    });
    onUpdateNodes(updatedNodes);
  };

  const handleAlignLeft = () => {
    if (!onUpdateNodes) return;
    const selectedNodes = safeNodes.filter(n => selectedNodeIds.includes(n.id));
    if (selectedNodes.length === 0) return;
    const minX = Math.min(...selectedNodes.map(n => n.x));
    
    const updatedNodes = safeNodes.map(n => {
       if (selectedNodeIds.includes(n.id)) {
           return { ...n, x: minX };
       }
       return n;
    });
    onUpdateNodes(updatedNodes);
  };

  return (
    <div 
      ref={containerRef}
      className="relative w-full h-full overflow-hidden canvas-grid bg-slate-50 dark:bg-slate-950 cursor-grab"
      style={{ cursor: isPanning ? 'grabbing' : 'grab' }}
      onWheel={handleWheel}
      onMouseDown={handleContainerMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
    >
      <div 
        className="absolute top-0 left-0"
        style={{ transform: `translate(${pan.x}px, ${pan.y}px) scale(${scale})`, transformOrigin: '0 0' }}
      >
        {tableGroups && tableGroups.map(group => {
            const groupNodes = safeNodes.filter(n => n.groupId === group.id);
            if (groupNodes.length === 0) return null;
            
            const minX = Math.min(...groupNodes.map(n => n.x)) - 24;
            const minY = Math.min(...groupNodes.map(n => n.y)) - 100; 
            const maxX = Math.max(...groupNodes.map(n => n.x + NODE_WIDTH)) + 24;
            const maxY = Math.max(...groupNodes.map(n => {
               const t = safeTables.find(t => t.id === n.tableId);
               const h = t ? HEADER_HEIGHT + t.fields.length * FIELD_HEIGHT + (onRemoveNode ? FIELD_HEIGHT : 0) : 200;
               return n.y + h;
            })) + 24;

            const width = maxX - minX;
            const height = maxY - minY;
            const isSelected = groupNodes.some(n => selectedNodeIds.includes(n.id));

            return (
                <div 
                    key={group.id}
                    className={`absolute rounded-xl transition-all duration-200 pointer-events-auto ${isSelected ? 'border-2 border-blue-400 bg-blue-50/80 shadow-md z-0' : 'border-2 border-slate-300 bg-slate-100 shadow-sm z-0'}`}
                    style={{ left: minX, top: minY, width, height }}
                >
                   <div className="absolute top-0 left-0 w-full px-4 py-3 transition-opacity flex flex-col pointer-events-none">
                       <div className="flex items-center gap-1 mb-1 w-full relative -ml-1">
                           <div 
                               className="cursor-move text-slate-400 hover:text-slate-600 active:text-blue-500 p-1 rounded flex-shrink-0 pointer-events-auto"
                               onMouseDown={(e) => handleGroupDragStart(e, groupNodes.map(n => n.id))}
                               title="Gruppe verschieben"
                           >
                               <GripVertical size={16} />
                           </div>
                           <LocalInput 
                               className={`bg-transparent font-semibold text-sm outline-none w-full pointer-events-auto transition-colors ${isSelected ? 'text-blue-900 placeholder-blue-300' : 'text-slate-800 placeholder-slate-400'}`}
                               value={group.name}
                               placeholder="Gruppenname"
                               onChange={(e: any) => {
                                   const newGroups = tableGroups.map(g => g.id === group.id ? { ...g, name: e.target.value } : g);
                                   setTableGroups(newGroups);
                               }}
                               onMouseDown={(e: any) => e.stopPropagation()}
                           />
                       </div>
                       {(isSelected || group.comment) && (
                          <LocalTextarea
                             className={`text-xs outline-none w-full resize-none pointer-events-auto leading-relaxed border rounded p-1.5 transition-colors ${isSelected ? 'bg-white/60 text-slate-700 border-blue-200 focus:border-blue-400 focus:bg-white placeholder-slate-400' : 'bg-transparent text-slate-600 border-transparent placeholder-slate-400'}`}
                             value={group.comment || ''}
                             placeholder={isSelected ? "Kommentar hinzufügen..." : ""}
                             rows={2}
                             onChange={(e: any) => {
                                 const newGroups = tableGroups.map(g => g.id === group.id ? { ...g, comment: e.target.value } : g);
                                 setTableGroups(newGroups);
                             }}
                             onMouseDown={(e: any) => e.stopPropagation()}
                          />
                       )}
                   </div>
                </div>
            );
        })}

        {/* Modular Relationship Lines Renderer */}
        <RelationshipLines 
            safeRelationships={safeRelationships}
            safeNodes={safeNodes}
            safeTables={safeTables}
            hoveredRelId={hoveredRelId}
            setHoveredRelId={setHoveredRelId}
            onRelationshipContextMenu={onRelationshipContextMenu}
            onRemoveNode={onRemoveNode}
        />

        {/* Database Tables (Nodes) Renderer */}
        {safeNodes.map(node => {
          const table = safeTables.find(t => t.id === node.tableId);
          if (!table) return null;

          return (
            <TableNodeElement 
                key={node.id}
                node={node}
                table={table}
                selectedNodeIds={selectedNodeIds}
                onNodeDoubleClick={onNodeDoubleClick}
                onRemoveNode={onRemoveNode}
                onMouseDown={(e) => {
                    if (!selectedNodeIds.includes(node.id) && !e.shiftKey) {
                        setSelectedNodeIds([node.id]);
                    }
                    handleDragStart(e, node.id);
                }}
                safeRelationships={safeRelationships}
                hoveredRelId={hoveredRelId}
                connectionStart={connectionStart}
                handleFieldMouseDown={handleFieldMouseDown}
                handleFieldMouseUp={handleFieldMouseUp}
                handleFieldDragStart={handleFieldDragStart}
            />
          );
        })}

        {/* Real-time Multiplayer Collaborative Cursors */}
        <CollaboratorCursors nodes={safeNodes} />
      </div>
      
      {/* Selection Toolbar Component */}
      <SelectionToolbar 
          selectedNodeIds={selectedNodeIds}
          handleGroupSelected={handleGroupSelected}
          handleUngroupSelected={handleUngroupSelected}
          handleAlignTop={handleAlignTop}
          handleAlignLeft={handleAlignLeft}
      />

      {/* Zoom and Grid Controls */}
      <CanvasControls 
          canvasMode={canvasMode}
          setCanvasMode={setCanvasMode}
          handlePhysicsLayout={handlePhysicsLayout}
          handleAutoArrange={handleAutoArrange}
          snapToGrid={snapToGrid}
          setSnapToGrid={setSnapToGrid}
          handleAlignAllToGrid={handleAlignAllToGrid}
          handleZoomIn={handleZoomIn}
          handleZoomOut={handleZoomOut}
          handleZoomReset={handleZoomReset}
          scale={scale}
      />

      {/* Minimap Component */}
      <Minimap 
          showMinimap={showMinimap}
          setShowMinimap={setShowMinimap}
          minimapWidth={minimapWidth}
          minimapHeight={minimapHeight}
          tableGroups={tableGroups || []}
          safeNodes={safeNodes}
          safeTables={safeTables}
          selectedNodeIds={selectedNodeIds}
          minX={minX}
          minY={minY}
          boundsWidth={boundsWidth}
          boundsHeight={boundsHeight}
          pan={pan}
          scale={scale}
          containerSize={containerSize}
          setIsDraggingMinimap={setIsDraggingMinimap}
          handleMinimapInteraction={handleMinimapInteraction}
          onRemoveNode={onRemoveNode}
      />

      {/* Selection Box Overlay */}
      {selectionBox && (
        <div 
          className="absolute border border-blue-500 bg-blue-500/10 rounded pointer-events-none z-50 shadow-sm"
          style={{
            left: Math.min(selectionBox.startX, selectionBox.currentX),
            top: Math.min(selectionBox.startY, selectionBox.currentY),
            width: Math.abs(selectionBox.startX - selectionBox.currentX),
            height: Math.abs(selectionBox.startY - selectionBox.currentY)
          }}
        />
      )}
    </div>
  );
};
