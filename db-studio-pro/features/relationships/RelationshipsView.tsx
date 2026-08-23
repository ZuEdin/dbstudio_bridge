import React, { useState } from 'react';
import { ERDiagramCanvas } from './ERDiagramCanvas';
import { TableNode, Table, Relationship, TableGroup } from '../../types/index';
import { EditRelationshipModal } from './components/EditRelationshipModal';
import { RelationshipContextMenu } from './components/RelationshipContextMenu';

interface RelationshipsViewProps {
  nodes: TableNode[];
  tables: Table[];
  groups?: TableGroup[];
  relationships: Relationship[];
  onMoveNode: (id: string, x: number, y: number) => void;
  onUpdateNodes?: (nodes: TableNode[]) => void;
  onUpdateGroups?: (groups: TableGroup[]) => void;
  onConnect: (t1: string, f1: string, t2: string, f2: string) => void;
  onDeleteRelationship: (id: string) => void;
  onUpdateRelationship: (rel: Relationship) => void;
  onNodeDoubleClick?: (tableId: string) => void;
  showConfirmation?: (title: string, message: string, onConfirm: () => void, confirmText?: string, confirmClass?: string) => void;
}

export const RelationshipsView: React.FC<RelationshipsViewProps> = ({
  nodes,
  tables,
  groups,
  relationships,
  onMoveNode,
  onUpdateNodes,
  onUpdateGroups,
  onConnect,
  onDeleteRelationship,
  onUpdateRelationship,
  onNodeDoubleClick,
  showConfirmation,
}) => {
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; relId: string } | null>(null);
  const [editingRel, setEditingRel] = useState<Relationship | null>(null);

  const handleRelationshipContextMenu = (event: React.MouseEvent, relId: string) => {
    event.preventDefault();
    setContextMenu({ x: event.clientX, y: event.clientY, relId });
  };

  const closeContextMenu = () => setContextMenu(null);

  const handleDelete = () => {
    if (contextMenu) {
      const relId = contextMenu.relId;
      const performDelete = () => {
          onDeleteRelationship(relId);
          closeContextMenu();
      };
      
      if (showConfirmation) {
          showConfirmation(
              'Beziehung löschen?', 
              'Möchten Sie diese Verknüpfung zwischen den Tabellen wirklich löschen? Dadurch könnten Abfragen und Formulare beeinträchtigt werden.', 
              performDelete
          );
      } else if (window.confirm('Verknüpfung wirklich löschen?')) {
          performDelete();
      } else {
          closeContextMenu();
      }
    }
  };

  const handleEdit = () => {
    if (contextMenu) {
      const relToEdit = relationships.find(r => r.id === contextMenu.relId);
      if (relToEdit) {
        setEditingRel(relToEdit);
      }
      closeContextMenu();
    }
  };

  const handleSaveRelationship = (updatedRel: Relationship) => {
    onUpdateRelationship(updatedRel);
    setEditingRel(null);
  };

  return (
    <div className="w-full h-full" onClick={closeContextMenu}>
      <ERDiagramCanvas 
        nodes={nodes}
        tables={tables}
        relationships={relationships}
        onMoveNode={onMoveNode}
        onUpdateNodes={onUpdateNodes}
        onConnect={onConnect}
        onRelationshipContextMenu={handleRelationshipContextMenu}
        onNodeDoubleClick={onNodeDoubleClick}
        showConfirmation={showConfirmation}
      />
      {contextMenu && (
        <RelationshipContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          onEdit={handleEdit}
          onDelete={handleDelete}
          onClose={closeContextMenu}
        />
      )}
      {editingRel && (
        <EditRelationshipModal
          relationship={editingRel}
          tables={tables}
          onSave={handleSaveRelationship}
          onClose={() => setEditingRel(null)}
        />
      )}
    </div>
  );
};