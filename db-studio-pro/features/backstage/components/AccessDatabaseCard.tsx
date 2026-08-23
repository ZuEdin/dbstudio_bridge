import React from 'react';
import { Plus, LayoutGrid } from 'lucide-react';

interface AccessDatabaseCardProps {
  title?: string;
  subtitle?: string;
  onClick: () => void;
}

export const AccessDatabaseCard: React.FC<AccessDatabaseCardProps> = ({
  title = 'Leere Datenbank',
  subtitle = 'IndexedDB',
  onClick
}) => {
  return (
    <button
      onClick={onClick}
      className="group relative flex flex-col items-center justify-center w-36 h-40 bg-[#333333] hover:bg-[#3d3d3d] border-2 border-dashed border-[#555555] hover:border-indigo-500 focus:border-indigo-500 focus:outline-none rounded-lg transition-all duration-150 p-3 shadow-xs hover:shadow-md text-center cursor-pointer"
      title="Neue leere Datenbank in DB Studio erstellen"
    >
      {/* Modern DB Studio Creation Icon */}
      <div className="relative w-14 h-14 rounded-xl bg-indigo-950/40 border border-indigo-500/30 flex items-center justify-center text-indigo-400 group-hover:scale-105 group-hover:bg-indigo-600 group-hover:text-white transition-all duration-150 mb-3 shadow-inner">
        <Plus size={24} className="stroke-[2.5]" />
      </div>

      <span className="text-xs font-semibold text-neutral-100 group-hover:text-white leading-tight">
        {title}
      </span>
      {subtitle && (
        <span className="text-[10px] text-neutral-400 mt-1">
          {subtitle}
        </span>
      )}
    </button>
  );
};
