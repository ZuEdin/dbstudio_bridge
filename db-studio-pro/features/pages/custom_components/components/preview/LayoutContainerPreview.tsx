import React from 'react';

interface LayoutContainerPreviewProps {
  configObj: any;
  customComponents: any[];
}

export const LayoutContainerPreview: React.FC<LayoutContainerPreviewProps> = ({
  configObj,
  customComponents
}) => {
  const layoutType = configObj.layoutType || 'row';
  const gap = configObj.gap || 'gap-4';
  const padding = configObj.padding || 'p-4';
  const bgStyle = configObj.bgStyle || 'bg-white dark:bg-slate-900';
  const shadow = configObj.shadow || 'shadow-sm';
  const borderStyle = configObj.borderStyle || '';
  const children = configObj.children || [];

  const getGridClass = () => {
    const c = configObj.cols || 3;
    if (c === 1) return 'grid-cols-1';
    if (c === 2) return 'grid-cols-1 sm:grid-cols-2';
    if (c === 3) return 'grid-cols-1 sm:grid-cols-2 md:grid-cols-3';
    if (c === 4) return 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4';
    if (c === 6) return 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-6';
    return 'grid-cols-1 sm:grid-cols-3';
  };

  const containerClasses = layoutType === 'grid'
    ? `grid ${getGridClass()} ${gap} ${padding} ${bgStyle} ${shadow} ${borderStyle}`
    : layoutType === 'col'
      ? `flex flex-col ${gap} ${padding} ${bgStyle} ${shadow} ${borderStyle}`
      : `flex flex-col sm:flex-row flex-wrap sm:items-stretch ${gap} ${padding} ${bgStyle} ${shadow} ${borderStyle}`;

  return (
    <div className="p-4 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl space-y-3">
      <div className="flex justify-between items-center pb-1.5 border-b dark:border-slate-800">
        <span className="font-bold text-slate-700 dark:text-slate-200 text-xs flex items-center gap-1.5">
          📐 Layout-Container Vorschau
        </span>
        <span className="text-[8px] font-mono bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-400 px-1.5 py-0.5 rounded font-bold uppercase">
          {layoutType === 'grid' ? `Grid (${configObj.cols || 3} Sp.)` : layoutType === 'col' ? 'Spalte (Vertical)' : 'Zeile (Horizontal)'}
        </span>
      </div>

      <div className={`${containerClasses} transition-all`}>
        {children.length === 0 ? (
          <div className="w-full text-center py-8 text-xs text-slate-400 italic">
            Noch keine Elemente hinzugefügt. Benutzen Sie den Designer auf der linken Seite.
          </div>
        ) : (
          children.map((child: any, cIdx: number) => {
            const widthClass = layoutType === 'row' ? (child.width || 'flex-1') : 'w-full';
            return (
              <div key={child.id || cIdx} className={`${widthClass} min-w-0 flex flex-col justify-center`}>
                {/* Render Text Element */}
                {child.type === 'text' && (
                  <div className={`${child.config?.fontSize || 'text-xs'} ${child.config?.fontWeight || 'font-normal'} ${child.config?.colorClass || 'text-slate-700 dark:text-slate-300'} ${child.config?.alignment || 'text-left'} leading-relaxed`}>
                    {child.config?.text || 'Textblock'}
                  </div>
                )}

                {/* Render Button Element */}
                {child.type === 'button' && (
                  <div className="py-1">
                    <button 
                      type="button"
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold shadow-xs hover:scale-[1.01] transition-transform ${
                        child.config?.variant === 'danger'
                          ? 'bg-red-600 hover:bg-red-700 text-white'
                          : child.config?.variant === 'secondary'
                            ? 'bg-slate-200 hover:bg-slate-350 text-slate-700 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-300'
                            : child.config?.variant === 'outline'
                              ? 'border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-900'
                              : 'bg-indigo-600 hover:bg-indigo-700 text-white'
                      }`}
                    >
                      {child.config?.label || 'Aktion'}
                    </button>
                  </div>
                )}

                {/* Render Metric Card */}
                {child.type === 'metric_card' && (() => {
                  const theme = child.config?.themeColor || 'indigo';
                  const themeClasses: Record<string, string> = {
                    indigo: 'border-indigo-100 dark:border-indigo-950 bg-indigo-50/40 dark:bg-indigo-950/20 text-indigo-700 dark:text-indigo-400',
                    emerald: 'border-emerald-100 dark:border-emerald-950 bg-emerald-50/40 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-400',
                    rose: 'border-rose-100 dark:border-rose-950 bg-rose-50/40 dark:bg-rose-950/20 text-rose-700 dark:text-rose-400',
                    amber: 'border-amber-100 dark:border-amber-950 bg-amber-50/40 dark:bg-amber-950/20 text-amber-700 dark:text-amber-400',
                  };
                  return (
                    <div className={`p-3 rounded-xl border ${themeClasses[theme] || themeClasses.indigo} flex flex-col justify-center min-h-[64px]`}>
                      <span className="text-[9px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 truncate">{child.config?.title || 'Kennzahl'}</span>
                      <span className="text-base font-bold text-slate-800 dark:text-white mt-0.5 truncate">
                        {child.config?.customValue || '0'}{child.config?.suffix || ''}
                      </span>
                    </div>
                  );
                })()}

                {/* Render Custom Component Reference Placeholder */}
                {child.type === 'component_ref' && (() => {
                  const referenced = customComponents.find(c => c.id === child.config?.refComponentId);
                  return (
                    <div className="p-3.5 rounded-xl border border-dashed border-indigo-200 dark:border-indigo-900/60 bg-indigo-50/20 dark:bg-indigo-950/10 flex flex-col items-center justify-center text-center">
                      <span className="text-[10px] font-bold text-indigo-700 dark:text-indigo-400 truncate max-w-full">
                        🧩 {referenced?.name || 'Komponente referenzieren'}
                      </span>
                      <span className="text-[8px] text-slate-400 mt-0.5 font-mono">
                        Ref: {referenced?.type || 'Keine Auswahl'}
                      </span>
                    </div>
                  );
                })()}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
