import React from 'react';
import { Plus } from 'lucide-react';
import { Table } from '../../../../types/index';

interface SplitViewListProps {
  isCreating: boolean;
  data: Record<string, any>[];
  currentIndex: number;
  setCurrentIndex: (idx: number) => void;
  formSettings: any;
  sourceTable?: Table;
}

export const SplitViewList: React.FC<SplitViewListProps> = ({
  isCreating,
  data,
  currentIndex,
  setCurrentIndex,
  formSettings,
  sourceTable,
}) => {
  return (
    <div className="w-1/3 border-r border-slate-200 overflow-y-auto bg-slate-50/50" id="form-split-view-list">
      {isCreating && (
        <div className="p-3 border-b border-emerald-200 bg-emerald-50 dark:bg-emerald-950/30 border-l-4 border-l-emerald-600">
          <div className="font-bold text-sm text-emerald-900 dark:text-emerald-200 flex items-center gap-1.5">
            <Plus size={14} className="text-emerald-600" /> [Neuer Datensatz]
          </div>
          <div className="text-xs text-emerald-700 dark:text-emerald-400 mt-0.5 font-medium">Wird jetzt eingegeben...</div>
        </div>
      )}
      {data.map((row, idx) => {
        let mainField = null;
        if (formSettings?.splitViewDisplayFieldId) {
          mainField = sourceTable?.fields.find((f) => f.id === formSettings.splitViewDisplayFieldId);
        }
        if (!mainField) {
          mainField =
            sourceTable?.fields.find((f) => !f.isAutoIncrement && f.type === 'VARCHAR') ||
            sourceTable?.fields.find((f) => !f.isAutoIncrement) ||
            sourceTable?.fields[0];
        }

        let subField = null;
        if (formSettings?.splitViewSubtitleFieldId) {
          subField = sourceTable?.fields.find((f) => f.id === formSettings.splitViewSubtitleFieldId);
        }
        if (!subField) {
          subField = sourceTable?.fields.find((f) => f.isPrimaryKey) || sourceTable?.fields[0];
        }
        return (
          <div
            key={idx}
            onClick={() => !isCreating && setCurrentIndex(idx)}
            className={`p-3 border-b border-slate-200 cursor-pointer hover:bg-white transition-colors ${
              currentIndex === idx && !isCreating
                ? 'bg-white border-l-4 border-l-blue-500'
                : 'border-l-4 border-l-transparent'
            }`}
          >
            <div className="font-semibold text-sm text-slate-700 truncate">
              {mainField ? String(row[mainField.name] ?? '') || `Datensatz #${idx + 1}` : `Datensatz #${idx + 1}`}
            </div>
            <div className="text-xs text-slate-400 mt-1">
              {subField ? `${subField.name}: ${row[subField.name] ?? ''}` : `Index: ${idx}`}
            </div>
          </div>
        );
      })}
      {data.length === 0 && !isCreating && (
        <div className="p-4 text-center text-xs text-slate-400">Keine Daten</div>
      )}
    </div>
  );
};
