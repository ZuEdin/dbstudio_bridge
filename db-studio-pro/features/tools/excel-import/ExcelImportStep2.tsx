import React from 'react';
import { Database, FileSpreadsheet } from 'lucide-react';
import * as XLSX from 'xlsx';
import { Table, FieldType } from '../../../types/index';

export interface ColumnMapping {
  index: number;
  originalName: string;
  targetName: string;
  type: FieldType;
  selected: boolean;
  sampleValue: any;
  md5Hash?: boolean;
  isPrimaryKey?: boolean;
  enumValues?: string[];
}

interface ExcelImportStep2Props {
  sheetNames: string[];
  selectedSheet: string;
  setSelectedSheet: (sheet: string) => void;
  workbook: XLSX.WorkBook | null;
  processSheet: (wb: XLSX.WorkBook, sheetName: string, fileName: string) => void;
  file: File | null;
  mappings: ColumnMapping[];
  updateMapping: (index: number, updates: Partial<ColumnMapping>) => void;
  handleTypeChange: (index: number, type: FieldType) => void;
  toggleSelection: (index: number) => void;
  setPrimaryKey: (index: number) => void;
  suggestedRelations: Record<number, { toTableId: string, toFieldId: string }>;
  setSuggestedRelations: (rels: Record<number, { toTableId: string, toFieldId: string }>) => void;
  tables?: Table[];
  rawRows: any[][];
}

export const ExcelImportStep2: React.FC<ExcelImportStep2Props> = ({
  sheetNames,
  selectedSheet,
  setSelectedSheet,
  workbook,
  processSheet,
  file,
  mappings,
  updateMapping,
  handleTypeChange,
  toggleSelection,
  setPrimaryKey,
  suggestedRelations,
  setSuggestedRelations,
  tables,
  rawRows,
}) => {
  return (
    <div className="flex flex-col h-full gap-4">
      <div className="bg-blue-50 border border-blue-200 p-3 rounded text-sm text-blue-800 flex flex-wrap justify-between items-center gap-4">
        <div className="flex gap-2 items-start flex-1 min-w-[280px]">
          <Database size={16} className="mt-0.5 shrink-0 text-blue-600"/>
          <div>
            Wählen Sie die Spalten aus, die Sie importieren möchten. Sie können Namen und Datentypen anpassen.
            Nicht ausgewählte Spalten werden ignoriert.
          </div>
        </div>
        {sheetNames.length > 1 && (
          <div className="flex items-center gap-2 shrink-0 bg-white border border-slate-200 p-1.5 rounded-lg shadow-sm">
            <span className="text-xs font-bold text-slate-500 flex items-center gap-1">
              <FileSpreadsheet size={12} className="text-green-600"/> Arbeitsblatt:
            </span>
            <select
              value={selectedSheet}
              onChange={(e) => {
                const sheetName = e.target.value;
                setSelectedSheet(sheetName);
                if (workbook) {
                  processSheet(workbook, sheetName, file?.name || '');
                }
              }}
              className="text-xs font-bold bg-slate-50 border border-slate-300 rounded px-2 py-1 text-slate-700 cursor-pointer hover:bg-slate-100 outline-none"
            >
              {sheetNames.map((n, i) => (
                <option key={i} value={n}>{n}</option>
              ))}
            </select>
          </div>
        )}
      </div>

      <div className="flex-1 overflow-auto border border-slate-300 rounded bg-white shadow-inner">
        <table className="w-full border-collapse">
          <thead>
            <tr>
              {mappings.map((map, i) => (
                <th key={i} className={`p-3 border-b border-r border-slate-200 min-w-[240px] bg-slate-50 transition-colors align-top ${!map.selected ? 'opacity-50 bg-slate-100' : ''}`}>
                  {/* Configuration Block per Column */}
                  <div className="flex flex-col gap-2 text-left">
                    <label className="flex items-center gap-2 cursor-pointer select-none">
                      <input 
                        type="checkbox" 
                        checked={map.selected} 
                        onChange={() => toggleSelection(map.index)}
                        className="rounded text-green-600 focus:ring-green-500"
                      />
                      <span className={`text-xs font-bold uppercase ${map.selected ? 'text-green-700' : 'text-slate-400'}`}>
                        {map.selected ? 'Importieren' : 'Ignorieren'}
                      </span>
                    </label>
                    
                    <input 
                      type="text" 
                      value={map.targetName} 
                      disabled={!map.selected}
                      onChange={e => updateMapping(map.index, { targetName: e.target.value.toLowerCase() })}
                      className="w-full border border-slate-300 rounded px-2 py-1 text-sm font-bold text-slate-700 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 disabled:bg-slate-100 disabled:text-slate-400"
                      placeholder="Spaltenname"
                    />

                    <select 
                      value={map.type}
                      disabled={!map.selected}
                      onChange={e => handleTypeChange(map.index, e.target.value as FieldType)}
                      className="w-full border border-slate-300 rounded px-2 py-1 text-xs bg-white disabled:bg-slate-100 disabled:text-slate-400"
                    >
                      <option value="VARCHAR">Text (Kurz)</option>
                      <option value="TEXT">Text (Lang)</option>
                      <option value="INTEGER">Ganzzahl</option>
                      <option value="DECIMAL">Kommazahl</option>
                      <option value="DATE">Datum (DATE)</option>
                      <option value="TIME">Uhrzeit (TIME)</option>
                      <option value="DATETIME">Datum & Zeit (DATETIME)</option>
                      <option value="TIMESTAMP">Zeitstempel (TIMESTAMP)</option>
                      <option value="BOOLEAN">Ja/Nein</option>
                      <option value="ENUM">Auswahl (Enum / Dropdown)</option>
                    </select>
                    
                    {/* Smart Enum Manager UI */}
                    {map.type === 'ENUM' && map.selected && (
                      <div className="mt-1 bg-blue-50 border border-blue-100 rounded p-2 text-[11px] flex flex-col gap-1.5 w-full">
                        <span className="font-bold text-blue-700 uppercase text-[9px] flex justify-between items-center">
                          Dropdown-Werte (Enum):
                        </span>
                        <div className="flex flex-wrap gap-1 max-h-[60px] overflow-y-auto bg-white p-1 rounded border border-blue-200">
                          {(map.enumValues || []).map((val, eIdx) => (
                            <span key={eIdx} className="bg-blue-100 text-blue-800 text-[10px] px-1.5 py-0.5 rounded font-medium flex items-center gap-1 shrink-0">
                              {val}
                              <button
                                type="button"
                                onClick={() => {
                                  const newVals = (map.enumValues || []).filter(v => v !== val);
                                  updateMapping(map.index, { enumValues: newVals });
                                }}
                                className="text-blue-500 hover:text-blue-800 font-bold"
                              >
                                ×
                              </button>
                            </span>
                          ))}
                          {(map.enumValues || []).length === 0 && (
                            <span className="text-slate-400 italic">Keine Optionen</span>
                          )}
                        </div>
                        <input
                          type="text"
                          placeholder="Wert tippen & Enter..."
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              const val = e.currentTarget.value.trim();
                              if (val && !(map.enumValues || []).includes(val)) {
                                const newVals = [...(map.enumValues || []), val];
                                updateMapping(map.index, { enumValues: newVals });
                                e.currentTarget.value = '';
                              }
                            }
                          }}
                          className="w-full border border-blue-200 bg-white rounded px-1.5 py-0.5 text-[10px] outline-none"
                        />
                      </div>
                    )}

                    {/* Smart SVERWEIS relationships mapping UI */}
                    {tables && tables.length > 0 && map.selected && (
                      <div className="mt-1 bg-purple-50 border border-purple-100 rounded p-2 text-[11px] flex flex-col gap-1 w-full">
                        <span className="font-bold text-purple-700 uppercase text-[9px] flex items-center gap-1">
                          🔗 SVERWEIS / Beziehung:
                        </span>
                        <select
                          value={suggestedRelations[map.index]?.toTableId || ''}
                          onChange={(e) => {
                            const targetTId = e.target.value;
                            if (!targetTId) {
                              const updated = { ...suggestedRelations };
                              delete updated[map.index];
                              setSuggestedRelations(updated);
                            } else {
                              const targetT = tables.find(t => t.id === targetTId);
                              const targetPk = targetT?.fields.find(f => f.isPrimaryKey) || targetT?.fields[0];
                              setSuggestedRelations({
                                ...suggestedRelations,
                                [map.index]: {
                                  toTableId: targetTId,
                                  toFieldId: targetPk?.id || ''
                                }
                              });
                            }
                          }}
                          className="w-full border border-purple-200 rounded px-1.5 py-0.5 text-[10px] bg-white text-purple-800 outline-none"
                        >
                          <option value="">Keine Verknüpfung</option>
                          {tables.map(t => (
                            <option key={t.id} value={t.id}>
                              Verweis auf {t.name}
                            </option>
                          ))}
                        </select>
                        {suggestedRelations[map.index] && (
                          <span className="text-[9px] text-purple-600 bg-purple-100/50 px-1 py-0.5 rounded italic truncate">
                            SVERWEIS ➔ {tables.find(t => t.id === suggestedRelations[map.index].toTableId)?.name} ({
                              tables.find(t => t.id === suggestedRelations[map.index].toTableId)?.fields.find(f => f.id === suggestedRelations[map.index].toFieldId)?.name || 'ID'
                            })
                          </span>
                        )}
                      </div>
                    )}

                    <div className="text-[10px] text-slate-400 truncate" title={`Original: ${map.originalName}`}>
                      Orig: {map.originalName}
                    </div>

                    <label className={`flex items-center gap-1 cursor-pointer select-none mt-1 ${!map.selected ? 'opacity-50 pointer-events-none' : ''}`}>
                      <input 
                        type="radio" 
                        name="primaryKey"
                        disabled={!map.selected}
                        checked={!!map.isPrimaryKey}
                        onChange={() => setPrimaryKey(map.index)}
                        className="rounded-full w-3 h-3 text-green-600 focus:ring-green-500"
                      />
                      <span className="text-[10px] font-bold text-slate-600">Als Primärschlüssel (PK)</span>
                    </label>
                    {(map.type === 'VARCHAR' || map.type === 'TEXT') && (
                      <label className={`flex items-center gap-1 cursor-pointer select-none mt-1 ${!map.selected ? 'opacity-50 pointer-events-none' : ''}`}>
                        <input 
                          type="checkbox" 
                          disabled={!map.selected}
                          checked={!!map.md5Hash}
                          onChange={e => updateMapping(map.index, { md5Hash: e.target.checked })}
                          className="rounded w-3 h-3 text-blue-600 focus:ring-blue-500"
                        />
                        <span className="text-[10px] font-bold text-slate-600">MD5 Hash (Passwort)</span>
                      </label>
                    )}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rawRows.slice(0, 5).map((row, rIdx) => (
              <tr key={rIdx} className="border-b border-slate-100 last:border-0 hover:bg-slate-50">
                {mappings.map((map, cIdx) => (
                  <td key={cIdx} className={`p-3 text-sm text-slate-600 border-r border-slate-100 truncate max-w-[240px] ${!map.selected ? 'opacity-30 bg-slate-50' : ''}`}>
                    {String(row[cIdx] ?? '')}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="text-xs text-slate-400 text-right">Zeige Vorschau der ersten 5 Zeilen.</div>
    </div>
  );
};
