import React from 'react';
import { Field } from '../../../types/index';
import { inferFieldType } from '../../../utils/apiImportHelper';

interface ApiSchemaMapperProps {
  columns: string[];
  primaryKeyCol: string | null;
  setPrimaryKeyCol: (col: string | null) => void;
  schemaOverrides: Record<string, Field['type']>;
  setSchemaOverrides: React.Dispatch<React.SetStateAction<Record<string, Field['type']>>>;
  data: any[];
}

export const ApiSchemaMapper: React.FC<ApiSchemaMapperProps> = ({
  columns,
  primaryKeyCol,
  setPrimaryKeyCol,
  schemaOverrides,
  setSchemaOverrides,
  data,
}) => {
  return (
    <div className="p-4 h-full overflow-auto bg-slate-50">
      <h3 className="text-lg font-bold text-slate-700 mb-2">Schema & Datentyp Mapping</h3>
      <p className="text-sm text-slate-600 mb-6 max-w-4xl">
        Alle Felder wurden basierend auf dem ersten Datensatz automatisch erkannt. Sie können jedoch explizit erzwingen, dass bestimmte Felder als Zahl, Text oder Datum konvertiert werden sollen. Dies ist besonders nützlich, wenn Ihre API Zahlen als Text-Strings liefert und Sie diese für Berechnungen oder Filterung umwandeln müssen.
      </p>
      <div className="bg-white border border-slate-200 rounded-lg overflow-hidden shadow-sm max-w-4xl">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-100 border-b border-slate-200 text-slate-600">
            <tr>
              <th className="px-4 py-3">Spaltenname (API)</th>
              <th className="px-4 py-3 text-center">Primärschlüssel</th>
              <th className="px-4 py-3">Beispielwert</th>
              <th className="px-4 py-3">Erkannter / Gewählter Typ</th>
            </tr>
          </thead>
          <tbody className="divide-y border-slate-100">
            {columns.map(col => {
              const sampleVal = data[0]?.[col];
              const currentType = schemaOverrides[col] || (Array.isArray(sampleVal) ? 'TEXT' : inferFieldType(sampleVal));
              
              return (
                <tr key={col} className="hover:bg-slate-50">
                  <td className="px-4 py-3 font-mono font-bold text-slate-700">{col}</td>
                  <td className="px-4 py-3 text-center">
                    <input 
                      type="radio" 
                      name="primaryKeyApi" 
                      checked={primaryKeyCol === col} 
                      onChange={() => setPrimaryKeyCol(col)}
                      className="w-4 h-4 text-green-600 focus:ring-green-500"
                    />
                  </td>
                  <td className="px-4 py-3 text-slate-500 truncate max-w-[200px]" title={String(sampleVal)}>
                    {Array.isArray(sampleVal) ? `[Array mit ${sampleVal.length} Elementen]` : String(sampleVal ?? 'null')}
                  </td>
                  <td className="px-4 py-3 flex items-center gap-2">
                    <select 
                      value={currentType}
                      onChange={e => setSchemaOverrides(prev => ({ ...prev, [col]: e.target.value as Field['type'] }))}
                      className={`border rounded px-2 py-1.5 text-sm w-full max-w-[200px] outline-none ${
                        schemaOverrides[col] 
                          ? 'border-orange-400 bg-orange-50 font-bold text-orange-800' 
                          : 'border-slate-300 bg-white text-slate-700'
                      }`}
                    >
                      <option value="TEXT">Text (VARCHAR)</option>
                      <option value="INTEGER">Ganzzahl (INTEGER)</option>
                      <option value="REAL">Dezimalzahl (REAL)</option>
                      <option value="BOOLEAN">Wahrheitswert (BOOLEAN)</option>
                      <option value="DATE">Datum (DATE)</option>
                      <option value="TIME">Uhrzeit (TIME)</option>
                      <option value="DATETIME">Datum & Zeit (DATETIME)</option>
                      <option value="TIMESTAMP">Zeitstempel (TIMESTAMP)</option>
                      <option value="TINYINT">Winzige Ganzzahl (TINYINT)</option>
                    </select>
                    {schemaOverrides[col] ? (
                      <span className="text-xs font-bold text-orange-600 bg-orange-100 px-2 py-0.5 rounded">Manuell geändert</span>
                    ) : (
                      <span className="text-xs text-slate-400 italic">Automatisch erkannt</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
