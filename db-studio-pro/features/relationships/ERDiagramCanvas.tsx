import React, { useEffect, useCallback, useState } from 'react';
import {
  ReactFlow,
  MiniMap,
  Background,
  useNodesState,
  useEdgesState,
  Panel,
  MarkerType,
  Position,
  Connection,
  Edge,
  Node,
  ReactFlowProvider,
  useReactFlow,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { Table, TableNode, Relationship } from '../../types/index';
import { 
  Grid, 
  Zap, 
  ZoomIn, 
  ZoomOut, 
  Maximize, 
  Group, 
  AlignLeft, 
  Magnet, 
  Grid3X3,
} from 'lucide-react';
import { useProjectStore } from '../../stores/useProjectStore';

// Imported modular components
import { ERGroupNodeComponent } from './components/ERGroupNodeComponent';
import { ERTableNodeComponent } from './components/ERTableNodeComponent';

const nodeTypes = {
  erTableNode: ERTableNodeComponent,
  erGroupNode: ERGroupNodeComponent,
};

interface ERDiagramCanvasProps {
  nodes: TableNode[];
  tables: Table[];
  relationships: Relationship[];
  onMoveNode: (id: string, x: number, y: number) => void;
  onUpdateNodes?: (nodes: TableNode[]) => void;
  onConnect: (t1: string, f1: string, t2: string, f2: string) => void;
  onRelationshipContextMenu?: (event: React.MouseEvent, relId: string) => void;
  onNodeDoubleClick?: (tableId: string) => void;
  showConfirmation?: (title: string, message: string, onConfirm: () => void, confirmText?: string, confirmClass?: string) => void;
}

const ERDiagramCanvasInner: React.FC<ERDiagramCanvasProps> = ({
  nodes,
  tables,
  relationships,
  onMoveNode,
  onUpdateNodes,
  onConnect,
  onRelationshipContextMenu,
  onNodeDoubleClick,
  showConfirmation,
}) => {
  const [nodesState, setNodesState, onNodesChange] = useNodesState<Node>([]);
  const [edgesState, setEdgesState, onEdgesChange] = useEdgesState<Edge>([]);
  const [snapToGrid, setSnapToGrid] = useState<boolean>(true);

  const tableGroups = useProjectStore((state) => state.tableGroups);
  const setTableGroups = useProjectStore((state) => state.setTableGroups);

  const { zoomIn, zoomOut, fitView } = useReactFlow();

  const tablesLength = tables.length;
  const nodesLength = nodes?.length || 0;

  // Sync missing tables to layout nodes with non-overlapping positions
  useEffect(() => {
    if (!onUpdateNodes) return;
    
    let changed = false;
    const updatedNodes = [...(nodes || [])];

    tables.forEach((table, index) => {
      const exists = updatedNodes.some((n) => n.tableId === table.id);
      if (!exists) {
        const col = index % 4;
        const row = Math.floor(index / 4);
        const x = 50 + col * 280;
        const y = 80 + row * 320;

        updatedNodes.push({
          id: crypto.randomUUID(),
          tableId: table.id,
          x,
          y,
        });
        changed = true;
      }
    });

    if (changed) {
      onUpdateNodes(updatedNodes);
    }
  }, [tablesLength, nodesLength, onUpdateNodes]);

  const nodesPositionString = JSON.stringify((nodes || []).map((n) => ({ id: n.id, x: n.x, y: n.y, groupId: n.groupId })));

  // Sync tables and groups to React Flow nodes
  useEffect(() => {
    const collapsedGroupIds = new Set((tableGroups || []).filter(g => g.isCollapsed).map(g => g.id));

    setNodesState((prevNodes) => {
      const prevNodesMap = new Map(prevNodes.map((n) => [n.id, n]));

      // 1. Build Table Nodes (ONLY tables NOT in a collapsed group)
      const tableNodes: Node[] = tables
        .filter((table) => {
          const layoutNode = nodes.find((n) => n.tableId === table.id);
          return !layoutNode?.groupId || !collapsedGroupIds.has(layoutNode.groupId);
        })
        .map((table) => {
          const layoutNode = nodes.find((n) => n.tableId === table.id);
          const prevNode = prevNodesMap.get(table.id) as any;
          return {
            id: table.id,
            type: 'erTableNode',
            selected: prevNode ? prevNode.selected : false,
            position: {
              x: layoutNode ? layoutNode.x : Math.random() * 200 + 100,
              y: layoutNode ? layoutNode.y : Math.random() * 200 + 100,
            },
            data: {
              table,
              relationships,
              nodes,
              tableGroups,
              onDoubleClick: () => onNodeDoubleClick?.(table.id),
            },
          };
        });

      // 2. Build Group Nodes
      const activeGroups = (tableGroups || []).filter((group) => {
        return tables.some((t) => {
          const layoutNode = nodes.find((n) => n.tableId === t.id);
          return layoutNode?.groupId === group.id;
        });
      });

      const groupNodes: Node[] = activeGroups.map((group) => {
        const memberLayoutNodes = nodes.filter((n) => n.groupId === group.id);
        const tablesInGroup = tables
          .filter((t) => {
            const ln = nodes.find((n) => n.tableId === t.id);
            return ln?.groupId === group.id;
          })
          .map((t) => t.name);
        
        const minX = memberLayoutNodes.length > 0 ? Math.min(...memberLayoutNodes.map((n) => n.x)) - 20 : 100;
        const minY = memberLayoutNodes.length > 0 ? Math.min(...memberLayoutNodes.map((n) => n.y)) - 100 : 100;
        
        let width = 240;
        let height = 80;

        if (!group.isCollapsed) {
          const maxX = memberLayoutNodes.length > 0 ? Math.max(...memberLayoutNodes.map((n) => n.x + 240)) + 20 : 340;
          const maxY = memberLayoutNodes.length > 0 ? Math.max(...memberLayoutNodes.map((n) => {
            const table = tables.find((t) => t.id === n.tableId);
            const fieldCount = table?.fields.length || 0;
            const heightVal = 48 + fieldCount * 32 + 12;
            return n.y + heightVal;
          })) + 20 : 300;

          width = maxX - minX;
          height = maxY - minY;
        }

        const prevNode = prevNodesMap.get(`group__${group.id}`) as any;

        return {
          id: `group__${group.id}`,
          type: 'erGroupNode',
          selected: prevNode ? prevNode.selected : false,
          position: { x: minX, y: minY },
          style: { width, height, zIndex: group.isCollapsed ? 5 : -10 },
          draggable: true,
          selectable: true,
          data: {
            group,
            width,
            height,
            tablesInGroup,
            onNameChange: (groupId: string, newName: string) => {
              const updated = (tableGroups || []).map((g) => g.id === groupId ? { ...g, name: newName } : g);
              setTableGroups(updated);
            },
            onCommentChange: (groupId: string, newComment: string) => {
              const updated = (tableGroups || []).map((g) => g.id === groupId ? { ...g, comment: newComment } : g);
              setTableGroups(updated);
            },
            onColorChange: (groupId: string, color: string) => {
              const updated = (tableGroups || []).map((g) => g.id === groupId ? { ...g, color } : g);
              setTableGroups(updated);
            },
            onToggleCollapse: (groupId: string) => {
              const updated = (tableGroups || []).map((g) => g.id === groupId ? { ...g, isCollapsed: !g.isCollapsed } : g);
              setTableGroups(updated);
            },
            onSelectMembers: () => {
              const memberTableIds = tables
                .filter((t) => {
                  const ln = nodes.find((n) => n.tableId === t.id);
                  return ln?.groupId === group.id;
                })
                .map((t) => t.id);
              setNodesState((prev) =>
                prev.map((n) => ({
                  ...n,
                  selected: memberTableIds.includes(n.id),
                }))
              );
            }
          },
        };
      });

      return [...groupNodes, ...tableNodes];
    });
  }, [tables, nodesPositionString, relationships, tableGroups, setNodesState, onNodeDoubleClick, nodes, setTableGroups]);

  // Sync relationships to React Flow edge structures (handling collapsed groups)
  useEffect(() => {
    const collapsedGroupIds = new Set((tableGroups || []).filter(g => g.isCollapsed).map(g => g.id));
    
    // Map of tableId -> groupId (only for collapsed groups)
    const tableToCollapsedGroup = new Map<string, string>();
    tables.forEach(t => {
      const layoutNode = nodes.find(n => n.tableId === t.id);
      if (layoutNode?.groupId && collapsedGroupIds.has(layoutNode.groupId)) {
        tableToCollapsedGroup.set(t.id, layoutNode.groupId);
      }
    });

    const rfEdges: Edge[] = relationships
      .map((rel) => {
        const fromCollapsedGroupId = tableToCollapsedGroup.get(rel.fromTableId);
        const toCollapsedGroupId = tableToCollapsedGroup.get(rel.toTableId);

        // If both in SAME collapsed group, keep them hidden for now as it would just be a loop
        if (fromCollapsedGroupId && toCollapsedGroupId && fromCollapsedGroupId === toCollapsedGroupId) {
          return null;
        }

        const sourceNodeId = fromCollapsedGroupId ? `group__${fromCollapsedGroupId}` : rel.fromTableId;
        const targetNodeId = toCollapsedGroupId ? `group__${toCollapsedGroupId}` : rel.toTableId;

        // Try to get dynamic handles based on layout coordinates
        const sourceLayoutNode = nodes.find(n => (fromCollapsedGroupId ? n.id === sourceNodeId : n.tableId === sourceNodeId));
        const targetLayoutNode = nodes.find(n => (toCollapsedGroupId ? n.id === targetNodeId : n.tableId === targetNodeId));
        
        let dynamicSourceHandle = 'right-s';
        let dynamicTargetHandle = 'left';
        
        if (sourceLayoutNode && targetLayoutNode) {
          const dx = targetLayoutNode.x - sourceLayoutNode.x;
          const dy = targetLayoutNode.y - sourceLayoutNode.y;
          
          if (Math.abs(dx) > Math.abs(dy)) {
            // Horizontal connection
            if (dx > 0) {
              dynamicSourceHandle = 'right-s';
              dynamicTargetHandle = 'left';
            } else {
              dynamicSourceHandle = 'left-s';
              dynamicTargetHandle = 'right';
            }
          } else {
            // Vertical connection
            if (dy > 0) {
              dynamicSourceHandle = 'bottom-s';
              dynamicTargetHandle = 'top';
            } else {
              dynamicSourceHandle = 'top-s';
              dynamicTargetHandle = 'bottom';
            }
          }
        }

        const sourceHandle = fromCollapsedGroupId 
          ? dynamicSourceHandle
          : `${rel.fromTableId}__${rel.fromFieldId}__source`;
          
        const targetHandle = toCollapsedGroupId 
          ? dynamicTargetHandle
          : `${rel.toTableId}__${rel.toFieldId}__target`;

        return {
          id: rel.id,
          source: sourceNodeId,
          target: targetNodeId,
          sourceHandle,
          targetHandle,
          type: 'smoothstep',
          markerEnd: {
            type: MarkerType.ArrowClosed,
            width: 16,
            height: 16,
            color: '#64748b',
          },
          style: {
            stroke: '#64748b',
            strokeWidth: 2,
          },
          label: rel.type === '1:1' ? '1 - 1' : '1 - 1:N',
          labelStyle: { fill: '#475569', fontWeight: 700, fontSize: 10 },
          labelBgPadding: [4, 2],
          labelBgBorderRadius: 4,
          labelBgStyle: { fill: '#f1f5f9', color: '#475569', fillOpacity: 0.9 },
        };
      })
      .filter(e => e !== null) as Edge[];

    setEdgesState(rfEdges);
  }, [relationships, setEdgesState, tableGroups, tables, nodes]);

  const dragStartPositions = React.useRef<Record<string, { x: number; y: number }>>({});
  
  const onNodeDragStart = useCallback((_event: any, node: any, nodes: any[]) => {
    nodes.forEach(n => {
      dragStartPositions.current[n.id] = { ...n.position };
    });
  }, []);

  const onNodeDrag = useCallback((_event: any, node: any, draggedNodes: any[]) => {
    if (!onUpdateNodes) return;
    
    // Live update the tables during group drag for visual feedback
    const draggedGroups = draggedNodes.filter(n => n.id.startsWith('group__'));
    if (draggedGroups.length === 0) return;
    
    setNodesState((prevNodes) => {
      let nextNodes = [...prevNodes];
      let changed = false;

      draggedGroups.forEach(groupNode => {
        const groupId = groupNode.id.replace('group__', '');
        const startPos = dragStartPositions.current[groupNode.id];
        if (startPos) {
          const dx = groupNode.position.x - startPos.x;
          const dy = groupNode.position.y - startPos.y;
          
          // Find member tables from the global `nodes` store
          const memberIds = nodes.filter(n => n.groupId === groupId).map(n => n.tableId);
          
          nextNodes = nextNodes.map(pn => {
            if (memberIds.includes(pn.id)) {
              const startChildPos = dragStartPositions.current[pn.id];
              if (startChildPos) {
                changed = true;
                return { ...pn, position: { x: startChildPos.x + dx, y: startChildPos.y + dy } };
              }
            }
            return pn;
          });
        }
      });
      return changed ? nextNodes : prevNodes;
    });
  }, [onUpdateNodes, setNodesState, nodes]);

  // Node move or drag ends -> persist coordinates in parent store
  const onNodeDragStop = useCallback(
    (_event: any, node: any, draggedNodes: any[]) => {
      const nodesToUpdate = Array.isArray(draggedNodes) && draggedNodes.length > 0 ? draggedNodes : [node];
      
      if (onUpdateNodes) {
        let updated = [...nodes];
        let potentialGroupId: string | null = null;
        let tableToGroup: string | null = null;

        // Check for drop on group (only if single table node is dragged)
        if (nodesToUpdate.length === 1 && !nodesToUpdate[0].id.startsWith('group__')) {
          const tableNodeId = nodesToUpdate[0].id;
          const tablePos = nodesToUpdate[0].position;
          
          // Find if dropped on a group node
          const groupNode = nodesState.find(n => 
            n.type === 'erGroupNode' && 
            tablePos.x >= n.position.x && 
            tablePos.x <= n.position.x + (n.style?.width as number || 240) &&
            tablePos.y >= n.position.y && 
            tablePos.y <= n.position.y + (n.style?.height as number || 80)
          );

          if (groupNode) {
            const groupId = groupNode.id.replace('group__', '');
            const currentTableNode = nodes.find(n => n.tableId === tableNodeId);
            if (currentTableNode && currentTableNode.groupId !== groupId) {
              potentialGroupId = groupId;
              tableToGroup = tableNodeId;
            }
          }
        }
        
        const performUpdate = (finalNodes: TableNode[]) => {
          onUpdateNodes(finalNodes);
        };

        const baseUpdated = [...updated];
        nodesToUpdate.forEach((dn) => {
          if (dn.id.startsWith('group__')) {
            const groupId = dn.id.replace('group__', '');
            const startPos = dragStartPositions.current[dn.id];
            if (startPos) {
              const dx = dn.position.x - startPos.x;
              const dy = dn.position.y - startPos.y;
              
              baseUpdated.forEach((n, idx) => {
                if (n.groupId === groupId) {
                  baseUpdated[idx] = { ...n, x: Math.round((n.x + dx) / 20) * 20, y: Math.round((n.y + dy) / 20) * 20 };
                }
              });
            }
          } else {
            const idx = baseUpdated.findIndex(n => n.tableId === dn.id);
            if (idx !== -1) {
              baseUpdated[idx] = { ...baseUpdated[idx], x: Math.round(dn.position.x / 20) * 20, y: Math.round(dn.position.y / 20) * 20 };
            }
          }
        });

        if (potentialGroupId && tableToGroup) {
          const targetGroup = tableGroups?.find(g => g.id === potentialGroupId);
          const targetTable = tables.find(t => t.id === tableToGroup);
          
          const applyGroupChange = () => {
            const finalUpdated = baseUpdated.map(n => 
              n.tableId === tableToGroup ? { ...n, groupId: potentialGroupId! } : n
            );
            performUpdate(finalUpdated);
          };

          if (showConfirmation && targetGroup && targetTable) {
            showConfirmation(
              'Tabelle zur Gruppe hinzufügen?',
              `Möchten Sie die Tabelle "${targetTable.name}" zur Gruppe "${targetGroup.name}" hinzufügen?`,
              applyGroupChange,
              'Hinzufügen',
              'bg-emerald-600 hover:bg-emerald-700 text-white'
            );
            performUpdate(baseUpdated);
          } else {
            applyGroupChange();
          }
        } else {
          performUpdate(baseUpdated);
        }
      } else {
        nodesToUpdate.forEach((dn) => {
          const layoutNode = nodes.find((n) => n.tableId === dn.id);
          if (layoutNode && !dn.id.startsWith('group__')) {
            onMoveNode(layoutNode.id, dn.position.x, dn.position.y);
          }
        });
      }
      dragStartPositions.current = {};
    },
    [nodes, onMoveNode, onUpdateNodes, nodesState, tableGroups, tables, showConfirmation]
  );

  // Handle new link drag & connect triggers
  const handleConnect = useCallback(
    (connection: Connection) => {
      if (
        !connection.source ||
        !connection.target ||
        !connection.sourceHandle ||
        !connection.targetHandle
      )
        return;

      const sourceFieldId = connection.sourceHandle.split('__')[1];
      const targetFieldId = connection.targetHandle.split('__')[1];

      onConnect(connection.source, sourceFieldId, connection.target, targetFieldId);
    },
    [onConnect]
  );

  // Trigger ContextMenu for Relationships (Edges)
  const onEdgeContextMenu = useCallback(
    (event: React.MouseEvent, edge: Edge) => {
      if (onRelationshipContextMenu) {
        onRelationshipContextMenu(event, edge.id);
      }
    },
    [onRelationshipContextMenu]
  );

  // Selection actions
  const selectedRFNodes = nodesState.filter((n) => n.selected && !n.id.startsWith('group__'));
  const selectedTableIds = selectedRFNodes.map((n) => n.id);

  // Force-directed Physics Layout
  const triggerPhysicsLayout = () => {
    if (!onUpdateNodes) return;

    const selectedGroupNodes = nodesState.filter(n => n.selected && n.id.startsWith('group__'));
    const selectedGroupIds = selectedGroupNodes.map(n => n.id.replace('group__', ''));
    
    let targetTableIds: string[] = [];
    if (selectedGroupIds.length > 0) {
      targetTableIds = nodes
        .filter(n => n.groupId && selectedGroupIds.includes(n.groupId))
        .map(n => n.tableId);
    } else if (selectedTableIds.length > 0) {
      targetTableIds = selectedTableIds;
    }

    const tablesToLayout = targetTableIds.length > 0 
      ? nodes.filter(n => targetTableIds.includes(n.tableId))
      : nodes;

    if (tablesToLayout.length === 0) return;

    const startX = Math.min(...tablesToLayout.map(n => n.x));
    const startY = Math.min(...tablesToLayout.map(n => n.y));

    const simNodes = tablesToLayout.map((n) => ({ ...n, vx: 0, vy: 0 }));
    const iterations = 150;
    const repulsion = 800000;
    const attraction = 0.05;
    const damping = 0.7;
    const optimalDist = 320;

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

      relationships.forEach((rel) => {
        const sourceNode = simNodes.find((n) => n.tableId === rel.fromTableId);
        const targetNode = simNodes.find((n) => n.tableId === rel.toTableId);
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

      simNodes.forEach((n) => {
        n.vx *= damping;
        n.vy *= damping;
        n.x += n.vx;
        n.y += n.vy;
      });
    }

    const simMinX = Math.min(...simNodes.map((n) => n.x));
    const simMinY = Math.min(...simNodes.map((n) => n.y));

    const updatedNodes = nodes.map((n) => {
      const simNode = simNodes.find((sn) => sn.tableId === n.tableId);
      if (simNode) {
        return {
          ...n,
          x: Math.round((simNode.x - simMinX + startX) / 20) * 20,
          y: Math.round((simNode.y - simMinY + startY) / 20) * 20,
        };
      }
      return n;
    });

    onUpdateNodes(updatedNodes);
  };

  // Align nodes into a clean grid
  const triggerGridLayout = () => {
    if (!onUpdateNodes) return;

    const selectedGroupNodes = nodesState.filter(n => n.selected && n.id.startsWith('group__'));
    const selectedGroupIds = selectedGroupNodes.map(n => n.id.replace('group__', ''));
    
    let targetTableIds: string[] = [];
    if (selectedGroupIds.length > 0) {
      targetTableIds = nodes
        .filter(n => n.groupId && selectedGroupIds.includes(n.groupId))
        .map(n => n.tableId);
    } else if (selectedTableIds.length > 0) {
      targetTableIds = selectedTableIds;
    }

    const tablesToLayout = targetTableIds.length > 0 
      ? nodes.filter(n => targetTableIds.includes(n.tableId))
      : nodes;

    if (tablesToLayout.length === 0) return;

    const startX = Math.min(...tablesToLayout.map(n => n.x));
    const startY = Math.min(...tablesToLayout.map(n => n.y));

    const groupedTables: { [groupId: string]: any[] } = {};
    const unGroupedTables: any[] = [];

    tablesToLayout.forEach(n => {
      if (n.groupId) {
        if (!groupedTables[n.groupId]) groupedTables[n.groupId] = [];
        groupedTables[n.groupId].push(n);
      } else {
        unGroupedTables.push(n);
      }
    });

    const spacingX = 300;
    const spacingY = 240;
    const groupPaddingX = 100;
    const groupPaddingY = 100;

    let currentGroupStartX = startX;
    let currentGroupStartY = startY;
    let maxGroupHeightInRow = 0;
    const maxWidth = 1400;

    const updatedNodes = [...nodes];

    const layoutTableSet = (tableSet: any[], groupId: string | null) => {
      if (tableSet.length === 0) return;
      const cols = Math.ceil(Math.sqrt(tableSet.length));
      
      let maxW = 0;
      let maxH = 0;

      tableSet.forEach((n, idx) => {
        const col = idx % cols;
        const row = Math.floor(idx / cols);

        const newX = currentGroupStartX + col * spacingX;
        const newY = currentGroupStartY + row * spacingY + (groupId ? 80 : 0);

        const originalNodeIdx = updatedNodes.findIndex(un => un.tableId === n.tableId);
        if (originalNodeIdx !== -1) {
          updatedNodes[originalNodeIdx] = { 
            ...updatedNodes[originalNodeIdx], 
            x: Math.round(newX / 20) * 20, 
            y: Math.round(newY / 20) * 20 
          };
        }

        maxW = Math.max(maxW, col * spacingX + 240);
        maxH = Math.max(maxH, row * spacingY + 300 + (groupId ? 80 : 0));
      });

      currentGroupStartX += maxW + groupPaddingX;
      maxGroupHeightInRow = Math.max(maxGroupHeightInRow, maxH);

      if (currentGroupStartX - startX > maxWidth) {
        currentGroupStartX = startX;
        currentGroupStartY += maxGroupHeightInRow + groupPaddingY;
        maxGroupHeightInRow = 0;
      }
    };

    Object.entries(groupedTables).forEach(([groupId, tableSet]) => {
      layoutTableSet(tableSet, groupId);
    });

    if (unGroupedTables.length > 0) {
      if (currentGroupStartX !== startX && maxGroupHeightInRow > 0) {
        currentGroupStartX = startX;
        currentGroupStartY += maxGroupHeightInRow + groupPaddingY;
      }
      layoutTableSet(unGroupedTables, null);
    }

    onUpdateNodes(updatedNodes);
  };

  // Align selected nodes to grid multiples of 20
  const handleAlignAllToGrid = () => {
    if (!onUpdateNodes) return;
    const updatedNodes = nodes.map((n) => ({
      ...n,
      x: Math.round(n.x / 20) * 20,
      y: Math.round(n.y / 20) * 20,
    }));
    onUpdateNodes(updatedNodes);
  };

  // Group Selected Nodes
  const handleGroupSelected = () => {
    if (!onUpdateNodes || selectedTableIds.length === 0) return;
    const groupId = crypto.randomUUID();
    const newGroups = [...(tableGroups || []), { id: groupId, name: 'Neue Gruppe', comment: '' }];
    setTableGroups(newGroups);

    const updatedNodes = nodes.map((n) => {
      if (selectedTableIds.includes(n.tableId)) {
        return { ...n, groupId };
      }
      return n;
    });
    onUpdateNodes(updatedNodes);
  };

  // Ungroup Selected Nodes
  const handleUngroupSelected = () => {
    if (!onUpdateNodes || selectedTableIds.length === 0) return;

    const updatedNodes = nodes.map((n) => {
      if (selectedTableIds.includes(n.tableId)) {
        return { ...n, groupId: undefined };
      }
      return n;
    });
    onUpdateNodes(updatedNodes);

    setTimeout(() => {
      const remainingGroupIds = new Set(updatedNodes.map((n) => n.groupId).filter(Boolean));
      const newGroups = (tableGroups || []).filter((g) => remainingGroupIds.has(g.id));
      setTableGroups(newGroups);
    }, 100);
  };

  // Align selected nodes - Top
  const handleAlignTop = () => {
    if (!onUpdateNodes || selectedTableIds.length === 0) return;
    const selectedLayoutNodes = nodes.filter((n) => selectedTableIds.includes(n.tableId));
    if (selectedLayoutNodes.length === 0) return;

    const minY = Math.min(...selectedLayoutNodes.map((n) => n.y));

    const updatedNodes = nodes.map((n) => {
      if (selectedTableIds.includes(n.tableId)) {
        return { ...n, y: minY };
      }
      return n;
    });
    onUpdateNodes(updatedNodes);
  };

  // Align selected nodes - Bottom
  const handleAlignBottom = () => {
    if (!onUpdateNodes || selectedTableIds.length === 0) return;
    const selectedLayoutNodes = nodes.filter((n) => selectedTableIds.includes(n.tableId));
    if (selectedLayoutNodes.length === 0) return;

    const maxY = Math.max(...selectedLayoutNodes.map((n) => n.y));

    const updatedNodes = nodes.map((n) => {
      if (selectedTableIds.includes(n.tableId)) {
        return { ...n, y: maxY };
      }
      return n;
    });
    onUpdateNodes(updatedNodes);
  };

  // Align selected nodes - Left
  const handleAlignLeft = () => {
    if (!onUpdateNodes || selectedTableIds.length === 0) return;
    const selectedLayoutNodes = nodes.filter((n) => selectedTableIds.includes(n.tableId));
    if (selectedLayoutNodes.length === 0) return;

    const minX = Math.min(...selectedLayoutNodes.map((n) => n.x));

    const updatedNodes = nodes.map((n) => {
      if (selectedTableIds.includes(n.tableId)) {
        return { ...n, x: minX };
      }
      return n;
    });
    onUpdateNodes(updatedNodes);
  };

  // Align selected nodes - Right
  const handleAlignRight = () => {
    if (!onUpdateNodes || selectedTableIds.length === 0) return;
    const selectedLayoutNodes = nodes.filter((n) => selectedTableIds.includes(n.tableId));
    if (selectedLayoutNodes.length === 0) return;

    const maxX = Math.max(...selectedLayoutNodes.map((n) => n.x));

    const updatedNodes = nodes.map((n) => {
      if (selectedTableIds.includes(n.tableId)) {
        return { ...n, x: maxX };
      }
      return n;
    });
    onUpdateNodes(updatedNodes);
  };

  return (
    <div className="w-full h-full relative">
      <ReactFlow
        nodes={nodesState}
        edges={edgesState}
        nodeTypes={nodeTypes}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onNodeDragStart={onNodeDragStart}
        onNodeDrag={onNodeDrag}
        onNodeDragStop={onNodeDragStop}
        onConnect={handleConnect}
        onEdgeContextMenu={onEdgeContextMenu}
        snapToGrid={snapToGrid}
        snapGrid={[20, 20]}
        fitView
        selectionKeyCode="Shift"
        multiSelectionKeyCode="Shift"
      >
        <Background gap={20} size={1.2} color="#cbd5e1" />
        
        <MiniMap 
          zoomable 
          pannable 
          position="bottom-right" 
          style={{ bottom: 80, right: 16, height: 120, width: 180, margin: 12 }}
          nodeColor={(n: any) => {
            if (n.type === 'erGroupNode') {
              const groupColor = n.data?.group?.color || 'slate';
              const isCollapsed = n.data?.group?.isCollapsed;
              
              if (isCollapsed) {
                const solidColors: any = {
                  purple: '#a855f7',
                  blue: '#3b82f6',
                  emerald: '#10b981',
                  rose: '#f43f5e',
                  amber: '#f59e0b',
                  slate: '#64748b'
                };
                return solidColors[groupColor] || solidColors.slate;
              }

              const colors: any = {
                purple: '#f5f3ff',
                blue: '#eff6ff',
                emerald: '#ecfdf5',
                rose: '#fff1f2',
                amber: '#fffbeb',
                slate: '#f8fafc'
              };
              return colors[groupColor] || colors.slate;
            }
            if (n.type === 'erTableNode') {
              const table = n.data?.table;
              const layoutNode = nodes.find(ln => ln.tableId === table?.id);
              if (layoutNode?.groupId) {
                const group = tableGroups.find(g => g.id === layoutNode.groupId);
                const groupColor = group?.color || 'slate';
                const colors: any = {
                  purple: '#a855f7',
                  blue: '#3b82f6',
                  emerald: '#10b981',
                  rose: '#f43f5e',
                  amber: '#f59e0b',
                  slate: '#64748b'
                };
                return colors[groupColor] || colors.slate;
              }
            }
            return '#cbd5e1';
          }}
          nodeStrokeColor={(n: any) => {
            const tableId = n.data?.table?.id;
            const groupColor = n.data?.group?.color || (n.type === 'erTableNode' ? (tableGroups.find(g => g.id === nodes.find(ln => ln.tableId === tableId)?.groupId)?.color) : null) || 'slate';
            const colors: any = {
              purple: '#a855f7',
              blue: '#3b82f6',
              emerald: '#10b981',
              rose: '#f43f5e',
              amber: '#f59e0b',
              slate: '#64748b'
            };
            return colors[groupColor] || colors.slate;
          }}
          nodeStrokeWidth={3}
          maskColor="rgba(241, 245, 249, 0.7)"
        />

        {selectedTableIds.length > 1 && (
          <Panel 
            position="top-center" 
            className="bg-white/95 dark:bg-slate-900/95 backdrop-blur border border-slate-300 dark:border-slate-800 p-1 rounded-lg shadow-2xl flex items-center gap-1 z-50 select-none transition-all"
          >
            <button 
              onClick={handleGroupSelected}
              className="flex items-center gap-1.5 px-2.5 py-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded text-slate-700 dark:text-slate-200 text-[11px] font-semibold transition-colors"
              title="Ausgewählte Tabellen in einer neuen Gruppe organisieren"
            >
              <Group size={14} className="text-purple-600 dark:text-purple-400" />
              <span>Gruppieren</span>
            </button>
            
            <div className="w-px h-4 bg-slate-200 dark:bg-slate-700 mx-0.5" />
            
            <button 
              onClick={handleUngroupSelected}
              className="flex items-center gap-1.5 px-2.5 py-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded text-slate-700 dark:text-slate-200 text-[11px] font-semibold transition-colors"
              title="Gruppe aufheben"
            >
              <Group size={14} className="text-slate-400 opacity-60" />
              <span>Aufheben</span>
            </button>

            <div className="w-px h-4 bg-slate-200 dark:bg-slate-700 mx-0.5" />

            <button 
              onClick={handleAlignTop}
              className="flex items-center gap-1.5 px-2.5 py-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded text-slate-700 dark:text-slate-200 text-[11px] font-semibold transition-colors"
              title="An der höchsten Tabelle ausrichten"
            >
              <AlignLeft size={14} className="text-blue-500 rotate-90" />
              <span>Oben</span>
            </button>
            
            <button 
              onClick={handleAlignBottom}
              className="flex items-center gap-1.5 px-2.5 py-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded text-slate-700 dark:text-slate-200 text-[11px] font-semibold transition-colors"
              title="An der tiefsten Tabelle ausrichten"
            >
              <AlignLeft size={14} className="text-blue-500 -rotate-90" />
              <span>Unten</span>
            </button>

            <div className="w-px h-4 bg-slate-200 dark:bg-slate-700 mx-0.5" />

            <button 
              onClick={handleAlignLeft}
              className="flex items-center gap-1.5 px-2.5 py-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded text-slate-700 dark:text-slate-200 text-[11px] font-semibold transition-colors"
              title="Am weitesten links ausrichten"
            >
              <AlignLeft size={14} className="text-emerald-500" />
              <span>Links</span>
            </button>

            <button 
              onClick={handleAlignRight}
              className="flex items-center gap-1.5 px-2.5 py-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded text-slate-700 dark:text-slate-200 text-[11px] font-semibold transition-colors"
              title="Am weitesten rechts ausrichten"
            >
              <AlignLeft size={14} className="text-emerald-500 scale-x-[-1]" />
              <span>Rechts</span>
            </button>
          </Panel>
        )}

        <Panel 
          position="bottom-left" 
          className="bg-white/95 dark:bg-slate-900/95 backdrop-blur border border-slate-300 dark:border-slate-800 p-1 flex items-center gap-1 z-40 select-none shadow-xl rounded-lg transition-all"
        >
          <button 
            onClick={() => zoomIn()}
            className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded text-slate-600 dark:text-slate-300 transition-colors"
            title="Zoom vergrößern"
          >
            <ZoomIn size={15} />
          </button>
          <button 
            onClick={() => zoomOut()}
            className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded text-slate-600 dark:text-slate-300 transition-colors"
            title="Zoom verkleinern"
          >
            <ZoomOut size={15} />
          </button>
          <button 
            onClick={() => fitView()}
            className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded text-slate-600 dark:text-slate-300 transition-colors flex items-center gap-1 text-[11px] font-semibold pr-2"
            title="Sichtfeld zurücksetzen / Zentrieren"
          >
            <Maximize size={15} />
            <span className="hidden sm:inline">Anpassen</span>
          </button>

          <div className="w-px h-5 bg-slate-200 dark:bg-slate-700 mx-0.5" />

          <button 
            onClick={triggerPhysicsLayout}
            className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded text-slate-600 dark:text-slate-300 transition-colors flex items-center gap-1 text-[11px] font-semibold"
            title="Smart Auto-Layout (Physik-basiert)"
          >
            <Zap size={15} className="text-amber-500" />
            <span className="hidden sm:inline">Smart Layout</span>
          </button>
          <button 
            onClick={triggerGridLayout}
            className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded text-slate-600 dark:text-slate-300 transition-colors flex items-center gap-1 text-[11px] font-semibold"
            title="Tabellen automatisch im Gitter anordnen"
          >
            <Grid3X3 size={15} className="text-slate-400" />
            <span className="hidden sm:inline">Gitter</span>
          </button>

          <div className="w-px h-5 bg-slate-200 dark:bg-slate-700 mx-0.5" />

          <button 
            onClick={() => setSnapToGrid(!snapToGrid)}
            className={`p-1.5 rounded transition-colors flex items-center gap-1 text-[11px] font-semibold ${
              snapToGrid 
                ? 'bg-purple-50 dark:bg-purple-950/40 text-purple-600 dark:text-purple-400' 
                : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
            title="Magnetisches Raster ein-/ausschalten"
          >
            <Grid size={15} />
            <span className="hidden sm:inline">Raster</span>
          </button>
          <button 
            onClick={handleAlignAllToGrid}
            className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded text-slate-600 dark:text-slate-300 transition-colors"
            title="Alle Tabellen exakt am 20px-Raster ausrichten"
          >
            <Magnet size={15} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200" />
          </button>
        </Panel>
      </ReactFlow>
    </div>
  );
};

export const ERDiagramCanvas: React.FC<ERDiagramCanvasProps> = (props) => {
  return (
    <ReactFlowProvider>
      <ERDiagramCanvasInner {...props} />
    </ReactFlowProvider>
  );
};
