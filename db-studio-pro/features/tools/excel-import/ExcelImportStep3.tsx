import React from 'react';
import { Check, AlertTriangle } from 'lucide-react';
import { ColumnMapping } from './ExcelImportStep2';

interface ExcelImportStep3Props {
  tableName: string;
  setTableName: (name: string) => void;
  mappings: ColumnMapping[];
}

export const ExcelImportStep3: React.FC<ExcelImportStep3Props> = ({
  tableName,
  setTableName,
  mappings,
}) => {
  return (
    <div className="flex flex-col items-center justify-center h-full gap-6 max-w-lg mx-auto w-full">
      <div className="bg-green-50 p-6 rounded-full text-green-600 mb-4 animate-in zoom-in">
        <Check size={48} />
      </div>
      
      <h3 className="text-2xl font-bold text-slate-800">Fast fertig!</h3>
      <p className="text-slate-500 text-center">
        Wir haben {mappings.filter(m => m.selected).length} Spalten zum Import vorbereitet.
        Wie soll die neue Tabelle heißen?
      </p>

      <div className="w-full">
        <label className="block text-sm font-bold text-slate-700 mb-2">Tabellenname</label>
        <input 
          type="text" 
          value={tableName}
          onChange={e => setTableName(e.target.value)}
          className="w-full border border-slate-300 rounded-lg p-3 text-lg focus:ring-2 focus:ring-green-500 outline-none"
          placeholder="z.B. ImportierteKunden"
          autoFocus
        />
      </div>

      <div className="bg-yellow-50 border border-yellow-200 p-3 rounded text-sm text-yellow-800 flex gap-2 w-full">
        <AlertTriangle size={16} className="shrink-0 mt-0.5"/>
        <div>
          <strong>Hinweis:</strong> Die Tabelle wird in Ihrer IndexedDB gespeichert.
          Stellen Sie sicher, dass der Name eindeutig ist.
        </div>
      </div>
    </div>
  );
};
