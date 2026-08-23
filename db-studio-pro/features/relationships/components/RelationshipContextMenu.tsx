import React from 'react';
import { Edit, Trash2 } from 'lucide-react';

interface RelationshipContextMenuProps {
  x: number;
  y: number;
  onEdit: () => void;
  onDelete: () => void;
  onClose: () => void;
}

export const RelationshipContextMenu: React.FC<RelationshipContextMenuProps> = ({ x, y, onEdit, onDelete, onClose }) => {
  return (
    <div
      style={{ top: y, left: x }}
      className="fixed z-50 bg-white border border-slate-300 rounded-md shadow-lg text-sm py-1 animate-in fade-in-25"
      onClick={(e) => e.stopPropagation()} 
    >
      <button
        onClick={onEdit}
        className="flex items-center gap-2 w-full px-3 py-1 hover:bg-slate-100 text-slate-800"
      >
        <Edit size={14} />
        <span>Bearbeiten</span>
      </button>
      <button
        onClick={onDelete}
        className="flex items-center gap-2 w-full px-3 py-1 hover:bg-red-50 text-red-600"
      >
        <Trash2 size={14} />
        <span>Löschen</span>
      </button>
    </div>
  );
};