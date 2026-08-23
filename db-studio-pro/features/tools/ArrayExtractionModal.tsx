
import React, { useState, useEffect } from 'react';
import { Table, Field } from '../../types/index';
import { X, ArrowRight, Save, Table as TableIcon, GitFork } from 'lucide-react';
import { inferFieldType } from '../../utils/apiImportHelper';
import { VirtualTable } from '../../components/VirtualTable';

interface ArrayExtractionModalProps {
  parentData: any[]; // The full dataset from the parent import
  arrayColumn: string; // The column name containing the array
  onSave: (table: Table) => void;
  onClose: () => void;
}

export const ArrayExtractionModal: React.FC<ArrayExtractionModalProps> = ({ parentData, arrayColumn, onSave, onClose }) => {
  const [tableName, setTableName] = useState(arrayColumn + '_List');
  const [extractedData, setExtractedData] = useState<any[]>([]);
  const [previewFields, setPreviewFields] = useState<string[]>([]);

  useEffect(() => {
      // Flatten logic: Iterate all parent rows, extract the array, add ParentId
      const flat: any[] = [];
      
      parentData.forEach(parentRow => {
          const arr = parentRow[arrayColumn];
          if (Array.isArray(arr)) {
              arr.forEach((childItem: any) => {
                  let normalizedItem: any = {};
                  
                  // If array contains primitives (e.g. ['tag1', 'tag2']), wrap in object
                  if (typeof childItem !== 'object' || childItem === null) {
                      normalizedItem = { Value: childItem };
                  } else {
                      // Flatten child object simply (1 level)
                      for (const key in childItem) {
                          if (typeof childItem[key] === 'object') {
                              normalizedItem[key] = JSON.stringify(childItem[key]);
                          } else {
                              normalizedItem[key] = childItem[key];
                          }
                      }
                  }

                  // Link back to parent using the temporary ImportId
                  normalizedItem['_ParentId'] = parentRow['_ImportId'];
                  flat.push(normalizedItem);
              });
          }
      });

      setExtractedData(flat);
      if (flat.length > 0) {
          setPreviewFields(Object.keys(flat[0]));
      }
  }, [parentData, arrayColumn]);

  const handleSave = () => {
      if (!tableName) return;
      if (extractedData.length === 0) return;

      const sampleRow = extractedData[0];
      const fields: Field[] = Object.keys(sampleRow).map(key => {
          const isFk = key === '_ParentId';
          return {
              id: crypto.randomUUID(),
              name: key,
              type: inferFieldType(sampleRow[key]),
              isPrimaryKey: false,
              allowNull: !isFk
          };
      });

      // Add PK
      fields.unshift({
          id: crypto.randomUUID(),
          name: 'Id',
          type: 'INTEGER',
          isPrimaryKey: true,
          isAutoIncrement: true
      });

      // Fill IDs
      const finalData = extractedData.map((row, i) => ({ ...row, Id: i + 1 }));

      const newTable: Table = {
          id: crypto.randomUUID(),
          name: tableName,
          fields: fields,
          data: finalData
      };

      onSave(newTable);
      onClose();
  };

  const renderRow = (row: any, rowIndex: number) => (
      <div className="flex border-b border-slate-100 hover:bg-slate-50 group h-full items-center text-xs text-slate-700">
          {previewFields.map(header => (
              <div key={`${rowIndex}-${header}`} className="w-32 shrink-0 border-r border-slate-100 h-full px-2 py-1 overflow-hidden truncate">
                  {String(row[header] ?? '')}
              </div>
          ))}
      </div>
  );

  return (
    <div className="fixed inset-0 bg-black/50 z-[200] flex items-center justify-center animate-in fade-in-25 backdrop-blur-sm">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl border border-slate-300 flex flex-col h-[700px] overflow-hidden">
        
        <div className="flex justify-between items-center p-5 bg-indigo-900 text-white shrink-0">
          <div>
            <h2 className="text-xl font-bold flex items-center gap-2">
               <GitFork className="text-indigo-300"/> Array Extraktion
            </h2>
            <p className="text-indigo-200 text-sm mt-1">
                Wandelt das Array <strong>"{arrayColumn}"</strong> in eine eigene relationale Tabelle um.
            </p>
          </div>
          <button onClick={onClose} className="text-indigo-300 hover:text-white transition-colors">
            <X size={24} />
          </button>
        </div>

        <div className="flex-1 bg-slate-50 p-6 overflow-hidden flex flex-col gap-4">
            
            <div className="bg-blue-50 border border-blue-200 p-4 rounded text-sm text-blue-800 flex gap-3">
                <TableIcon className="shrink-0" size={20}/>
                <div>
                    <strong>Relationale Verknüpfung:</strong><br/>
                    Wir haben <strong>{extractedData.length}</strong> Einträge aus <strong>{parentData.length}</strong> Haupt-Datensätzen extrahiert.
                    <br/>
                    Die neue Spalte <code>_ParentId</code> verknüpft diese Einträge mit der Haupttabelle.
                </div>
            </div>

            <div className="flex gap-4 items-end">
                <div className="flex-1">
                    <label className="block text-sm font-bold text-slate-700 mb-1">Name der neuen Tabelle</label>
                    <input 
                        type="text" 
                        value={tableName}
                        onChange={e => setTableName(e.target.value)}
                        className="w-full border border-slate-300 rounded p-2 focus:ring-2 focus:ring-indigo-500 outline-none"
                    />
                </div>
                <div className="text-sm text-slate-500 pb-2">
                    Enthält {previewFields.length} Spalten
                </div>
            </div>

            <div className="flex-1 border border-slate-300 rounded bg-white overflow-hidden shadow-sm">
                <div className="bg-slate-100 p-2 border-b text-xs font-bold text-slate-500 uppercase">
                    Vorschau Daten
                </div>
                <div className="h-full overflow-hidden relative">
                    <VirtualTable 
                        data={extractedData}
                        headers={previewFields}
                        renderRow={renderRow}
                        rowHeight={30}
                    />
                </div>
            </div>

        </div>

        <div className="p-5 bg-white border-t border-slate-200 flex justify-end gap-2 shrink-0">
            <button onClick={onClose} className="px-4 py-2 border rounded text-slate-600 hover:bg-slate-50">Abbrechen</button>
            <button onClick={handleSave} className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2 rounded font-bold shadow-md flex items-center gap-2">
                <Save size={18}/> Als Tabelle speichern
            </button>
        </div>

      </div>
    </div>
  );
};
