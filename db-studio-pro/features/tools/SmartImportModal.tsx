import React, { useState } from 'react';
import { Table, Macro, SmartImportConfig, ImportFieldMapping } from '../../types/index';
import { useProjectStore } from '../../stores/useProjectStore';
import { X, Upload, FileSpreadsheet, FileCode, CheckCircle, ArrowRight, Save, Database, AlertCircle } from 'lucide-react';

interface SmartImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetTableId?: string;
  onImportCompleted?: (tableName: string, rowCount: number) => void;
}

export const SmartImportModal: React.FC<SmartImportModalProps> = ({
  isOpen,
  onClose,
  targetTableId,
  onImportCompleted
}) => {
  const { tables, updateTable } = useProjectStore();

  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [selectedTableId, setSelectedTableId] = useState<string>(targetTableId || tables[0]?.id || '');
  const [rawText, setRawText] = useState<string>('');
  const [fileType, setFileType] = useState<'csv' | 'xlsx' | 'json'>('csv');
  const [parsedRows, setParsedRows] = useState<Record<string, any>[]>([]);
  const [fileColumns, setFileColumns] = useState<string[]>([]);
  const [fieldMappings, setFieldMappings] = useState<ImportFieldMapping[]>([]);
  const [importStrategy, setImportStrategy] = useState<'append' | 'update_by_pk' | 'upsert'>('append');
  const [saveAsMacro, setSaveAsMacro] = useState<boolean>(false);
  const [macroName, setMacroName] = useState<string>('');

  if (!isOpen) return null;

  const targetTable = tables.find(t => t.id === selectedTableId);

  // File Upload / Parse Handler
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    const ext = file.name.split('.').pop()?.toLowerCase();

    if (ext === 'json') {
      setFileType('json');
      reader.onload = (event) => {
        try {
          const json = JSON.parse(event.target?.result as string);
          const rows = Array.isArray(json) ? json : [json];
          processParsedRows(rows);
        } catch (err) {
          alert('Ungültiges JSON-Format.');
        }
      };
      reader.readAsText(file);
    } else {
      // Default CSV / Plain Text Parse
      setFileType('csv');
      reader.onload = (event) => {
        const text = event.target?.result as string;
        setRawText(text);
        parseCsvContent(text);
      };
      reader.readAsText(file);
    }
  };

  const parseCsvContent = (text: string) => {
    const lines = text.split(/\r\n|\n/).filter(l => l.trim().length > 0);
    if (lines.length < 1) return;

    // Detect delimiter (; or , or \t)
    const firstLine = lines[0];
    const delimiter = firstLine.includes(';') ? ';' : firstLine.includes('\t') ? '\t' : ',';

    const cols = firstLine.split(delimiter).map(c => c.replace(/^["']|["']$/g, '').trim());
    setFileColumns(cols);

    const rows: Record<string, any>[] = [];
    for (let i = 1; i < lines.length; i++) {
      const vals = lines[i].split(delimiter).map(v => v.replace(/^["']|["']$/g, '').trim());
      const rowObj: Record<string, any> = {};
      cols.forEach((col, idx) => {
        rowObj[col] = vals[idx] !== undefined ? vals[idx] : '';
      });
      rows.push(rowObj);
    }

    processParsedRows(rows, cols);
  };

  const processParsedRows = (rows: Record<string, any>[], colsFromHeaders?: string[]) => {
    if (rows.length === 0) return;
    const cols = colsFromHeaders || Object.keys(rows[0] || {});
    setFileColumns(cols);
    setParsedRows(rows);

    // Initial Auto-Mapping to Target Table Fields
    if (targetTable) {
      const mappings: ImportFieldMapping[] = cols.map(col => {
        // Find matching field in targetTable (case-insensitive)
        const matchField = targetTable.fields.find(f => f.name.toLowerCase() === col.toLowerCase());
        return {
          fileColumn: col,
          targetFieldId: matchField?.id || '',
          targetFieldName: matchField?.name || ''
        };
      });
      setFieldMappings(mappings);
    }
    setStep(2);
  };

  const handleExecuteImport = () => {
    if (!targetTable || parsedRows.length === 0) return;

    const pkField = targetTable.fields.find(f => f.isPrimaryKey) || targetTable.fields[0];
    const pkFieldName = pkField?.name || 'Id';

    let currentTableData = [...(targetTable.data || [])];

    // Process rows based on mapping
    const mappedNewRecords: Record<string, any>[] = parsedRows.map(pRow => {
      const newRecord: Record<string, any> = {};
      fieldMappings.forEach(mapping => {
        if (mapping.targetFieldName) {
          newRecord[mapping.targetFieldName] = pRow[mapping.fileColumn];
        }
      });
      return newRecord;
    });

    if (importStrategy === 'append') {
      currentTableData = [...currentTableData, ...mappedNewRecords];
    } else if (importStrategy === 'update_by_pk') {
      mappedNewRecords.forEach(newRec => {
        const pkVal = newRec[pkFieldName];
        if (pkVal !== undefined) {
          const idx = currentTableData.findIndex(r => String(r[pkFieldName]) === String(pkVal));
          if (idx !== -1) {
            currentTableData[idx] = { ...currentTableData[idx], ...newRec };
          }
        }
      });
    } else if (importStrategy === 'upsert') {
      mappedNewRecords.forEach(newRec => {
        const pkVal = newRec[pkFieldName];
        const idx = currentTableData.findIndex(r => String(r[pkFieldName]) === String(pkVal));
        if (idx !== -1) {
          currentTableData[idx] = { ...currentTableData[idx], ...newRec };
        } else {
          currentTableData.push(newRec);
        }
      });
    }

    // Save updated table state
    updateTable({ ...targetTable, data: currentTableData });

    // Handle Save as Macro Profile
    if (saveAsMacro && macroName.trim()) {
      const savedMacros: Macro[] = JSON.parse(localStorage.getItem('db_studio_macros') || '[]');
      const newMacro: Macro = {
        id: `macro_${Date.now()}`,
        name: macroName.trim(),
        description: `Smart Import Profile für Tabelle '${targetTable.name}'`,
        category: 'DATA_IMPORT',
        steps: [
          {
            id: `step_${Date.now()}`,
            name: `Import in ${targetTable.name}`,
            type: 'SMART_IMPORT',
            importConfig: {
              targetTableId: targetTable.id,
              importStrategy,
              fieldMappings
            }
          }
        ],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      localStorage.setItem('db_studio_macros', JSON.stringify([...savedMacros, newMacro]));
    }

    if (onImportCompleted) {
      onImportCompleted(targetTable.name, mappedNewRecords.length);
    }

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl w-full max-w-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] text-slate-100 font-sans">
        
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-800 bg-slate-950 flex justify-between items-center">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-indigo-600/20 rounded-xl text-indigo-400 border border-indigo-500/30">
              <Upload size={18} />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <span>Smart Upload & Import Wizard</span>
                <span className="text-[10px] bg-indigo-500/20 text-indigo-300 px-2 py-0.5 rounded-full font-mono border border-indigo-500/30">Auto-Field Matcher</span>
              </h3>
              <p className="text-xs text-slate-400">Importieren Sie Excel/CSV-Daten und verknüpfen Sie Spalten direkt mit Ihrer Datenbank.</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors">
            <X size={18} />
          </button>
        </div>

        {/* Wizard Steps Content */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6">

          {/* STEP 1: Select File & Target Table */}
          {step === 1 && (
            <div className="space-y-6">
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-300 uppercase tracking-wider block">1. Zieltabelle Auswählen</label>
                <select
                  value={selectedTableId}
                  onChange={(e) => setSelectedTableId(e.target.value)}
                  className="w-full bg-slate-950 text-white font-mono text-xs p-3 rounded-xl border border-slate-700 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                >
                  {tables.map(t => (
                    <option key={t.id} value={t.id}>
                      {t.name} ({t.fields.length} Felder, {t.data?.length || 0} Datensätze)
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-300 uppercase tracking-wider block">2. Datei Hochladen (CSV, Excel / XLSX, JSON)</label>
                <div className="border-2 border-dashed border-slate-700 hover:border-indigo-500 bg-slate-950/60 rounded-2xl p-8 text-center transition-colors">
                  <FileSpreadsheet size={36} className="mx-auto text-indigo-400 mb-2" />
                  <p className="text-xs font-semibold text-slate-300">Ziehen Sie Ihre Datei hierher oder klicken Sie zum Auswählen</p>
                  <p className="text-[11px] text-slate-500 mt-1">Unterstützte Formate: CSV, TSV, XLSX, JSON</p>
                  <input
                    type="file"
                    accept=".csv,.txt,.json,.xlsx"
                    onChange={handleFileUpload}
                    className="mt-4 mx-auto text-xs text-slate-400 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-indigo-600 file:text-white hover:file:bg-indigo-500 cursor-pointer"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-300 uppercase tracking-wider block">Oder CSV/JSON Text direkt einfügen</label>
                <textarea
                  rows={4}
                  value={rawText}
                  onChange={(e) => setRawText(e.target.value)}
                  placeholder="Vorname;Nachname;Email&#10;Max;Mustermann;max@test.de"
                  className="w-full bg-slate-950 text-slate-200 font-mono text-xs p-3 rounded-xl border border-slate-700 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
                <button
                  onClick={() => parseCsvContent(rawText)}
                  disabled={!rawText.trim()}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition-all disabled:opacity-50 cursor-pointer"
                >
                  Text Parsen
                </button>
              </div>
            </div>
          )}

          {/* STEP 2: Field Mapping & Import Options */}
          {step === 2 && (
            <div className="space-y-6">
              <div className="flex justify-between items-center bg-slate-950 p-3 rounded-xl border border-slate-800 text-xs font-mono">
                <span className="text-slate-400">Erkannte Zeilen: <strong className="text-emerald-400">{parsedRows.length}</strong></span>
                <span className="text-slate-400">Erkannte Spalten: <strong className="text-indigo-400">{fileColumns.length}</strong></span>
                <button onClick={() => setStep(1)} className="text-indigo-400 hover:underline">← Datei ändern</button>
              </div>

              <div className="space-y-3">
                <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider">Spalten-Mapping (Datei → Datenbank)</h4>
                <div className="bg-slate-950 rounded-xl border border-slate-800 p-4 space-y-3 max-h-56 overflow-y-auto">
                  {fileColumns.map(col => {
                    const currentMapping = fieldMappings.find(m => m.fileColumn === col);
                    return (
                      <div key={col} className="grid grid-cols-12 gap-3 items-center text-xs font-mono">
                        <span className="col-span-5 text-indigo-300 font-bold truncate">{col}</span>
                        <ArrowRight size={14} className="col-span-1 text-slate-500 mx-auto" />
                        <select
                          value={currentMapping?.targetFieldId || ''}
                          onChange={(e) => {
                            const fieldId = e.target.value;
                            const fieldName = targetTable?.fields.find(f => f.id === fieldId)?.name || '';
                            setFieldMappings(prev => prev.map(m => m.fileColumn === col ? { ...m, targetFieldId: fieldId, targetFieldName: fieldName } : m));
                          }}
                          className="col-span-6 bg-slate-900 text-white p-2 rounded-lg border border-slate-700 focus:outline-none"
                        >
                          <option value="">-- Nicht importieren --</option>
                          {targetTable?.fields.map(f => (
                            <option key={f.id} value={f.id}>{f.name} ({f.type})</option>
                          ))}
                        </select>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Import Strategy */}
              <div className="space-y-2 font-mono text-xs">
                <label className="text-xs font-bold text-slate-300 uppercase tracking-wider block">Import-Strategie</label>
                <div className="grid grid-cols-3 gap-3">
                  <button
                    onClick={() => setImportStrategy('append')}
                    className={`p-3 rounded-xl border text-left transition-all ${importStrategy === 'append' ? 'bg-indigo-600/30 border-indigo-500 text-white font-bold' : 'bg-slate-950 border-slate-800 text-slate-400'}`}
                  >
                    ➕ Anfügen (Append)
                    <p className="text-[10px] text-slate-400 font-normal mt-1">Alle Zeilen neu eintragen</p>
                  </button>
                  <button
                    onClick={() => setImportStrategy('update_by_pk')}
                    className={`p-3 rounded-xl border text-left transition-all ${importStrategy === 'update_by_pk' ? 'bg-indigo-600/30 border-indigo-500 text-white font-bold' : 'bg-slate-950 border-slate-800 text-slate-400'}`}
                  >
                    🔄 Aktualisieren (Update)
                    <p className="text-[10px] text-slate-400 font-normal mt-1">Bestehende Zeilen per PK überschreiben</p>
                  </button>
                  <button
                    onClick={() => setImportStrategy('upsert')}
                    className={`p-3 rounded-xl border text-left transition-all ${importStrategy === 'upsert' ? 'bg-indigo-600/30 border-indigo-500 text-white font-bold' : 'bg-slate-950 border-slate-800 text-slate-400'}`}
                  >
                    ⚡ Upsert (Merge)
                    <p className="text-[10px] text-slate-400 font-normal mt-1">Update bei Treffer, sonst Anfügen</p>
                  </button>
                </div>
              </div>

              {/* Save as Macro Profile */}
              <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 space-y-3 font-mono text-xs">
                <label className="flex items-center gap-2 text-slate-200 font-bold cursor-pointer">
                  <input
                    type="checkbox"
                    checked={saveAsMacro}
                    onChange={(e) => setSaveAsMacro(e.target.checked)}
                    className="rounded border-slate-700 text-indigo-600 focus:ring-indigo-500 bg-slate-900"
                  />
                  <span>💾 Als wiederverwendbares Import-Makro speichern?</span>
                </label>
                {saveAsMacro && (
                  <input
                    type="text"
                    value={macroName}
                    onChange={(e) => setMacroName(e.target.value)}
                    placeholder={`Import_Makro_${targetTable?.name || 'Tabelle'}`}
                    className="w-full bg-slate-900 text-white p-2.5 rounded-lg border border-slate-700 focus:outline-none"
                  />
                )}
              </div>
            </div>
          )}

        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 border-t border-slate-800 bg-slate-950 flex justify-between items-center">
          <button onClick={onClose} className="px-4 py-2 rounded-xl text-xs font-bold bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors">
            Abbrechen
          </button>
          {step === 2 && (
            <button
              onClick={handleExecuteImport}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-600/30 transition-all border border-emerald-400/30 cursor-pointer"
            >
              <CheckCircle size={16} />
              <span>Import Jetzt Ausführen ({parsedRows.length} Zeilen)</span>
            </button>
          )}
        </div>

      </div>
    </div>
  );
};
