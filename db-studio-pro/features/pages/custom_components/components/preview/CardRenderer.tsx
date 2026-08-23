import React from 'react';
import { getNestedValueCaseInsensitive } from '../../../utils/pageViewUtils';

export const getNestedValue = (obj: any, path: string): any => {
  if (!path) return undefined;
  const parts = path.split('.');
  let current = obj;
  for (const part of parts) {
    if (current === undefined || current === null) return undefined;
    current = getNestedValueCaseInsensitive(current, part);
  }
  return current;
};

export const renderCardWithTemplate = (row: any, config: any) => {
  const fields = config?.fields || [];
  const cardStyle = config?.cardStyle || {
    padding: 'p-3',
    rounded: 'rounded-xl',
    bg: 'bg-white dark:bg-slate-950',
    border: 'border border-slate-200 dark:border-slate-800',
    shadow: 'shadow-xs'
  };

  return (
    <div className={`${cardStyle.bg} ${cardStyle.padding} ${cardStyle.rounded} ${cardStyle.border} ${cardStyle.shadow} space-y-1.5 text-left transition-all duration-200`}>
      {fields.length === 0 ? (
        <div className="text-center py-4 text-[10px] text-slate-400 italic">Keine Felder definiert</div>
      ) : (
        fields.map((f: any, fIdx: number) => {
          const val = getNestedValue(row, f.field);
          if (val === undefined || val === null) return null;

          const alignClass = f.align || 'text-left';
          const sizeClass = f.fontSize || 'text-xs';
          const weightClass = f.fontWeight || 'font-normal';
          
          if (f.isBadge) {
            const badgeColorClass = f.badgeColor || 'bg-slate-100 text-slate-600';
            return (
              <div key={fIdx} className={`${alignClass} pt-0.5`}>
                <span className={`inline-block ${sizeClass} ${weightClass} ${badgeColorClass} px-2 py-0.5 rounded-md`}>
                  {f.showLabel !== false && f.label && <span className="opacity-80 mr-1">{f.label}:</span>}
                  {String(val)}
                </span>
              </div>
            );
          } else {
            const textColorClass = f.textColor || 'text-slate-800 dark:text-slate-100';
            return (
              <div key={fIdx} className={`${alignClass} ${sizeClass} ${weightClass} ${textColorClass} leading-tight`}>
                {f.showLabel !== false && f.label && (
                  <span className="text-[10px] text-slate-400 dark:text-slate-500 font-bold mr-1">{f.label}:</span>
                )}
                {String(val)}
              </div>
            );
          }
        })
      )}
    </div>
  );
};
