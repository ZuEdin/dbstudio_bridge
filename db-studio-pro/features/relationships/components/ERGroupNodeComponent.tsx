import React from 'react';
import { Handle, Position } from '@xyflow/react';
import { LocalInput, LocalTextarea } from './LocalInput';

export const ERGroupNodeComponent = ({ data }: any) => {
  const { group, width, height, onNameChange, onCommentChange, onSelectMembers, onToggleCollapse, tablesInGroup, onColorChange } = data;
  const isCollapsed = group.isCollapsed;

  const colorStyles = {
    purple: 'border-purple-500 bg-purple-50/95 dark:bg-slate-900/95 ring-purple-500/10',
    blue: 'border-blue-500 bg-blue-50/95 dark:bg-slate-900/95 ring-blue-500/10',
    emerald: 'border-emerald-500 bg-emerald-50/95 dark:bg-slate-900/95 ring-emerald-500/10',
    rose: 'border-rose-500 bg-rose-50/95 dark:bg-slate-900/95 ring-rose-500/10',
    amber: 'border-amber-500 bg-amber-50/95 dark:bg-slate-900/95 ring-amber-500/10',
    slate: 'border-slate-500 bg-slate-50/95 dark:bg-slate-900/95 ring-slate-500/10'
  };

  const selectedColorClass = colorStyles[(group.color as keyof typeof colorStyles) || 'purple'];

  const uncollapsedColorStyles = {
    purple: 'border-purple-300 dark:border-purple-800 bg-purple-50/70 dark:bg-purple-900/20',
    blue: 'border-blue-300 dark:border-blue-800 bg-blue-50/70 dark:bg-blue-900/20',
    emerald: 'border-emerald-300 dark:border-emerald-800 bg-emerald-50/70 dark:bg-emerald-900/20',
    rose: 'border-rose-300 dark:border-rose-800 bg-rose-50/70 dark:bg-rose-900/20',
    amber: 'border-amber-300 dark:border-amber-800 bg-amber-50/70 dark:bg-amber-900/20',
    slate: 'border-slate-300 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/40'
  };

  const selectedUncollapsedColorClass = uncollapsedColorStyles[(group.color as keyof typeof uncollapsedColorStyles) || 'slate'];

  const headerColors: any = {
    purple: 'bg-purple-600 text-white',
    blue: 'bg-blue-600 text-white',
    emerald: 'bg-emerald-600 text-white',
    rose: 'bg-rose-600 text-white',
    amber: 'bg-amber-600 text-white',
    slate: 'bg-slate-700 text-white'
  };

  const selectedHeaderClass = headerColors[(group.color as keyof typeof headerColors) || 'slate'];

  if (isCollapsed) {
    return (
      <div 
        className={`border-2 shadow-xl rounded-xl flex flex-col pointer-events-auto select-none hover:shadow-2xl transition-all relative border-solid ring-2 overflow-hidden ${selectedColorClass}`}
        style={{ width, height }}
      >
        {/* Handles for collapsed state - act as proxy for internal tables */}
        <Handle type="target" position={Position.Top} className="w-3 h-3 !bg-white border-2 border-slate-400 dark:border-slate-600 dark:!bg-slate-800" id="top" />
        <Handle type="source" position={Position.Top} className="w-3 h-3 !bg-white border-2 border-slate-400 dark:border-slate-600 dark:!bg-slate-800" id="top-s" />
        
        <Handle type="target" position={Position.Bottom} className="w-3 h-3 !bg-white border-2 border-slate-400 dark:border-slate-600 dark:!bg-slate-800" id="bottom" />
        <Handle type="source" position={Position.Bottom} className="w-3 h-3 !bg-white border-2 border-slate-400 dark:border-slate-600 dark:!bg-slate-800" id="bottom-s" />
        
        <Handle type="target" position={Position.Left} className="w-3 h-3 !bg-white border-2 border-slate-400 dark:border-slate-600 dark:!bg-slate-800" id="left" />
        <Handle type="source" position={Position.Left} className="w-3 h-3 !bg-white border-2 border-slate-400 dark:border-slate-600 dark:!bg-slate-800" id="left-s" />
        
        <Handle type="target" position={Position.Right} className="w-3 h-3 !bg-white border-2 border-slate-400 dark:border-slate-600 dark:!bg-slate-800" id="right" />
        <Handle type="source" position={Position.Right} className="w-3 h-3 !bg-white border-2 border-slate-400 dark:border-slate-600 dark:!bg-slate-800" id="right-s" />

        <div className={`flex items-center justify-between gap-2 p-3 ${selectedHeaderClass}`}>
          <div className="flex items-center gap-1.5 min-w-0">
            <span className="font-bold text-xs truncate font-sans tracking-tight" title={group.name}>{group.name}</span>
          </div>
          <button
            onClick={() => onToggleCollapse(group.id)}
            className="shrink-0 text-[10px] bg-white/20 hover:bg-white/30 text-white px-2.5 py-0.5 rounded-md transition-all font-semibold shadow-sm hover:shadow"
            onMouseDown={(e) => e.stopPropagation()}
          >
            Maximieren
          </button>
        </div>
        <div className="px-3 py-2 text-[10px] opacity-70 font-sans truncate" title={tablesInGroup?.join(', ') || 'Keine Tabellen'}>
          {tablesInGroup && tablesInGroup.length > 0 ? `${tablesInGroup.length} Tabellen: ${tablesInGroup.join(', ')}` : 'Keine Tabellen'}
        </div>
      </div>
    );
  }

  return (
    <div className="relative pointer-events-auto select-none" style={{ width, height }}>
      {/* Header and Comment floating above the box */}
      <div className="absolute top-0 left-0 w-full -translate-y-[calc(100%+8px)] flex flex-col gap-1.5 z-10">
        <div className="flex items-center justify-between gap-2 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md p-1.5 rounded-lg border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-center gap-1.5 flex-1 min-w-0">
            <span className="text-slate-400 shrink-0 cursor-grab active:cursor-grabbing">📁</span>
            <LocalInput
              className="bg-transparent font-bold text-xs outline-none w-full text-slate-800 dark:text-slate-200 border-b border-transparent hover:border-slate-300 dark:hover:border-slate-700 focus:border-purple-500 font-sans tracking-tight truncate"
              value={group.name}
              onChange={(e: any) => onNameChange(group.id, e.target.value)}
              placeholder="Gruppenname"
              onMouseDown={(e: any) => e.stopPropagation()} // Prevent node drag when typing
            />
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            <div className="flex gap-1 mr-2" onMouseDown={(e) => e.stopPropagation()}>
              {Object.keys(colorStyles).map((color) => (
                <button
                  key={color}
                  onClick={() => onColorChange(group.id, color)}
                  className={`w-3 h-3 rounded-full border border-black/20 ${group.color === color || (!group.color && color === 'slate') ? 'ring-2 ring-offset-1 ring-purple-500' : ''}`}
                  style={{
                    backgroundColor: color === 'purple' ? '#a855f7' : color === 'blue' ? '#3b82f6' : color === 'emerald' ? '#10b981' : color === 'rose' ? '#f43f5e' : color === 'amber' ? '#f59e0b' : '#64748b'
                  }}
                  title={color}
                />
              ))}
            </div>
            <button
              onClick={onSelectMembers}
              className="shrink-0 text-[10px] bg-slate-200/60 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 px-2 py-0.5 rounded transition-all font-medium border border-slate-300/50 dark:border-slate-750"
              title="Alle Tabellen in dieser Gruppe markieren"
              onMouseDown={(e) => e.stopPropagation()}
            >
              Alle wählen
            </button>
            <button
              onClick={() => onToggleCollapse(group.id)}
              className="shrink-0 text-[10px] bg-purple-50 hover:bg-purple-100 dark:bg-purple-950/40 dark:hover:bg-purple-900/60 text-purple-600 dark:text-purple-400 px-2 py-0.5 rounded transition-all font-semibold border border-purple-200/40"
              title="Gruppe minimieren"
              onMouseDown={(e) => e.stopPropagation()}
            >
              Minimieren
            </button>
          </div>
        </div>
        <LocalTextarea
          className="text-[11px] outline-none w-full resize-none leading-relaxed border rounded p-1.5 bg-white/90 dark:bg-slate-900/90 shadow-sm text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 focus:border-purple-500 placeholder-slate-400 font-sans h-12 shrink-0"
          value={group.comment || ''}
          placeholder="Kommentar hinzufügen..."
          onChange={(e: any) => onCommentChange(group.id, e.target.value)}
          onMouseDown={(e: any) => e.stopPropagation()} // Prevent node drag when typing
        />
      </div>

      <div className={`w-full h-full border-2 border-dashed rounded-xl transition-all ${selectedUncollapsedColorClass}`} />
    </div>
  );
};
