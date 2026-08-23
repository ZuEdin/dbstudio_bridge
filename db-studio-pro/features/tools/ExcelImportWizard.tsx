import React, { useState, useRef } from 'react';
import * as XLSX from 'xlsx';
import md5 from 'md5';
import { X, ArrowRight, Database, FileSpreadsheet } from 'lucide-react';

import { Table, Field, FieldType, Relationship } from '../../types/index';
import { inferFieldType } from '../../utils/apiImportHelper';

// Subcomponents & Helpers
import { convertValueToDateFormat } from './excel-import/excelImportHelper';
import { ExcelImportStep1 } from './excel-import/ExcelImportStep1';
import { ExcelImportStep2, ColumnMapping } from './excel-import/ExcelImportStep2';
import { ExcelImportStep3 } from './excel-import/ExcelImportStep3';

interface ExcelImportWizardProps {
  tables?: Table[];
  onSave: (table: Table, newRelations?: Relationship[]) => void;
  onClose: () => void;
}

export const ExcelImportWizard: React.FC<ExcelImportWizardProps> = ({ tables, onSave, onClose }) => {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [file, setFile] = useState<File | null>(null);
  const [rawRows, setRawRows] = useState<any[][]>([]); // Array of Arrays
  const [mappings, setMappings] = useState<ColumnMapping[]>([]);
  const [tableName, setTableName] = useState('');
  const [loading, setLoading] = useState(false);

  // Sheet states
  const [sheetNames, setSheetNames] = useState<string[]>([]);
  const [selectedSheet, setSelectedSheet] = useState<string>('');
  const [workbook, setWorkbook] = useState<XLSX.WorkBook | null>(null);

  // Suggested SVERWEIS relations: index -> { toTableId, toFieldId }
  const [suggestedRelations, setSuggestedRelations] = useState<Record<number, { toTableId: string, toFieldId: string }>>({});

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const uploadedFile = e.target.files?.[0];
    if (!uploadedFile) return;
    setFile(uploadedFile);
    processFile(uploadedFile);
  };

  const processSheet = (wb: XLSX.WorkBook, sheetName: string, fileName: string) => {
    const ws = wb.Sheets[sheetName];
    // Read as array of arrays to handle headers manually
    const data = XLSX.utils.sheet_to_json(ws, { header: 1 }) as any[][];
    
    if (data.length === 0) {
      alert("Das ausgewählte Arbeitsblatt scheint leer zu sein.");
      return;
    }

    const headers = data[0] || []; // First row as headers
    const samples = data.length > 1 ? data[1] : []; // Second row for type inference

    // Generate Initial Mappings and smart Enum detection
    const newMappings: ColumnMapping[] = headers.map((h, idx) => {
      const val = samples[idx];
      const originalName = String(h || `spalte ${idx + 1}`);
      const targetName = String(h || `spalte${idx + 1}`).replace(/[^a-zA-Z0-9_]/g, '').toLowerCase();
      
      // Smart ENUM detection: extract non-empty values from all rows for this column
      const colValues = data.slice(1).map(row => row[idx]).filter(v => v !== undefined && v !== null && String(v).trim() !== '');
      const uniqueValues = Array.from(new Set(colValues)).map(v => String(v).trim());
      
      let inferredType = inferFieldType(val);
      let enumValues: string[] | undefined = undefined;
      
      // If unique options are <= 15 and we have at least 3 rows, propose ENUM with options!
      if (uniqueValues.length > 0 && uniqueValues.length <= 15 && data.length >= 4) {
        inferredType = 'ENUM';
        enumValues = uniqueValues;
      }

      return {
        index: idx,
        originalName,
        targetName,
        type: inferredType,
        selected: true,
        sampleValue: val,
        isPrimaryKey: false,
        enumValues
      };
    });

    // Smart SVERWEIS detection
    const newSuggestedRelations: Record<number, { toTableId: string, toFieldId: string }> = {};
    if (tables && tables.length > 0) {
      newMappings.forEach(m => {
        const colNameLower = m.targetName.toLowerCase();
        for (const t of tables) {
          const tableNameLower = t.name.toLowerCase();
          const pkField = t.fields.find(f => f.isPrimaryKey) || t.fields[0];
          
          if (colNameLower === tableNameLower || 
              colNameLower === `${tableNameLower}id` || 
              colNameLower === `${tableNameLower}_id` ||
              colNameLower === `fk_${tableNameLower}` ||
              (pkField && colNameLower === pkField.name.toLowerCase())) {
              
            if (pkField) {
              newSuggestedRelations[m.index] = {
                toTableId: t.id,
                toFieldId: pkField.id
              };
              break;
            }
          }
        }
      });
    }
    setSuggestedRelations(newSuggestedRelations);

    // Pre-convert column rows if they are inferred as Date/Datetime
    const rawSliced = data.slice(1);
    const processedRows = rawSliced.map(row => {
      const newRow = [...row];
      newMappings.forEach(m => {
        if (m.type === 'DATE' || m.type === 'DATETIME' || m.type === 'TIMESTAMP') {
          newRow[m.index] = convertValueToDateFormat(newRow[m.index], m.type);
        }
      });
      return newRow;
    });

    setRawRows(processedRows);
    setMappings(newMappings);
    const sanitizedSheetName = sheetName.replace(/[^a-zA-Z0-9]/g, '');
    setTableName(sanitizedSheetName || fileName.split('.')[0].replace(/[^a-zA-Z0-9]/g, ''));
  };

  const processFile = (f: File) => {
    setLoading(true);
    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const bstr = evt.target?.result;
        // Use cellDates: true to let xlsx automatically read Excel date formatting as JS Date objects
        const wb = XLSX.read(bstr, { type: 'binary', cellDates: true });
        setWorkbook(wb);
        setSheetNames(wb.SheetNames);
        
        const firstSheet = wb.SheetNames[0];
        setSelectedSheet(firstSheet);
        
        processSheet(wb, firstSheet, f.name);

        if (wb.SheetNames.length === 1) {
          setStep(2);
        }
      } catch (err) {
        console.error(err);
        alert("Fehler beim Lesen der Datei.");
      } finally {
        setLoading(false);
      }
    };
    reader.readAsBinaryString(f);
  };

  const updateMapping = (index: number, updates: Partial<ColumnMapping>) => {
    setMappings(prev => prev.map(m => m.index === index ? { ...m, ...updates } : m));
  };

  const handleTypeChange = (index: number, newType: FieldType) => {
    updateMapping(index, { type: newType });
    if (newType === 'DATE' || newType === 'DATETIME' || newType === 'TIMESTAMP') {
      setRawRows(prev => prev.map(row => {
        const newRow = [...row];
        newRow[index] = convertValueToDateFormat(newRow[index], newType);
        return newRow;
      }));
    }
  };

  const toggleSelection = (index: number) => {
    const m = mappings.find(x => x.index === index);
    if (m) {
      updateMapping(index, { selected: !m.selected });
      if (m.isPrimaryKey && m.selected) { 
        updateMapping(index, { selected: false, isPrimaryKey: false });
      }
    }
  };

  const setPrimaryKey = (index: number) => {
    setMappings(prev => prev.map(m => m.index === index ? { ...m, isPrimaryKey: true } : { ...m, isPrimaryKey: false }));
  };

  const handleFinish = () => {
    if (!tableName) return alert("Bitte Tabellennamen angeben.");
    
    const selectedMappings = mappings.filter(m => m.selected);
    if (selectedMappings.length === 0) return alert("Bitte mindestens eine Spalte auswählen.");

    const newTableId = crypto.randomUUID();

    // 1. Create Fields
    const fields: Field[] = [];
    const fieldIdMap: Record<number, string> = {}; // map column index to field ID
    
    const pkMapping = selectedMappings.find(m => m.isPrimaryKey);
    const hasId = selectedMappings.some(m => m.targetName.toLowerCase() === 'id');
    
    let needsAutoId = false;

    if (!pkMapping) {
      if (!hasId) {
        needsAutoId = true;
        fields.push({ id: crypto.randomUUID(), name: 'id', type: 'INTEGER', isPrimaryKey: true, isAutoIncrement: true });
      }
    }

    selectedMappings.forEach(m => {
      const isPK = m.isPrimaryKey || (!pkMapping && m.targetName.toLowerCase() === 'id');
      const fieldId = crypto.randomUUID();
      fieldIdMap[m.index] = fieldId;

      fields.push({
        id: fieldId,
        name: m.targetName,
        type: m.type,
        isPrimaryKey: isPK,
        allowNull: !isPK,
        enumValues: m.type === 'ENUM' ? m.enumValues : undefined
      });
    });

    // 2. Map Data
    const importedData = rawRows.map(row => {
      const rowObj: any = {};
      
      selectedMappings.forEach(m => {
        let val = row[m.index];
        // Basic Type Conversion
        if (m.type === 'INTEGER') val = parseInt(val) || 0;
        else if (m.type === 'DECIMAL' || m.type === 'DOUBLE') val = parseFloat(val) || 0.0;
        else if (m.type === 'BOOLEAN') val = (String(val).toLowerCase() === 'true' || val === 1);
        else val = String(val ?? '');
        
        if (m.md5Hash) {
          val = md5(String(val));
        }

        rowObj[m.targetName] = val;
      });
      return rowObj;
    });

    // Fill IDs if artificial
    if (needsAutoId) {
      importedData.forEach((row, i) => row['id'] = i + 1);
    }

    const newTable: Table = {
      id: newTableId,
      name: tableName,
      fields: fields,
      data: importedData
    };

    // 3. Construct relations to save
    const newRelations: Relationship[] = [];
    selectedMappings.forEach(m => {
      const relInfo = suggestedRelations[m.index];
      if (relInfo) {
        newRelations.push({
          id: crypto.randomUUID(),
          fromTableId: newTableId,
          fromFieldId: fieldIdMap[m.index],
          toTableId: relInfo.toTableId,
          toFieldId: relInfo.toFieldId,
          type: '1:n',
          referentialIntegrity: false
        });
      }
    });

    onSave(newTable, newRelations);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-[200] flex items-center justify-center animate-in fade-in-25 backdrop-blur-sm">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-6xl border border-slate-300 flex flex-col h-[85vh] overflow-hidden">
        
        {/* Header */}
        <div className="flex justify-between items-center p-5 bg-green-700 text-white shrink-0">
          <div>
            <h2 className="text-xl font-bold flex items-center gap-2">
              <FileSpreadsheet className="text-green-200"/> Excel Import Assistent
            </h2>
            <p className="text-green-100 text-sm mt-1">
              Schritt {step} von 3: {step === 1 ? 'Datei & Arbeitsblatt wählen' : step === 2 ? 'Spalten zuweisen' : 'Abschließen'}
            </p>
          </div>
          <button onClick={onClose} className="text-green-200 hover:text-white transition-colors">
            <X size={24} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 bg-slate-50 p-6 overflow-hidden flex flex-col">
          {step === 1 && (
            <ExcelImportStep1
              workbook={workbook}
              sheetNames={sheetNames}
              file={file}
              loading={loading}
              handleFileUpload={handleFileUpload}
              setSelectedSheet={setSelectedSheet}
              processSheet={processSheet}
              setStep={setStep}
              setWorkbook={setWorkbook}
              setSheetNames={setSheetNames}
              setFile={setFile}
            />
          )}

          {step === 2 && (
            <ExcelImportStep2
              sheetNames={sheetNames}
              selectedSheet={selectedSheet}
              setSelectedSheet={setSelectedSheet}
              workbook={workbook}
              processSheet={processSheet}
              file={file}
              mappings={mappings}
              updateMapping={updateMapping}
              handleTypeChange={handleTypeChange}
              toggleSelection={toggleSelection}
              setPrimaryKey={setPrimaryKey}
              suggestedRelations={suggestedRelations}
              setSuggestedRelations={setSuggestedRelations}
              tables={tables}
              rawRows={rawRows}
            />
          )}

          {step === 3 && (
            <ExcelImportStep3
              tableName={tableName}
              setTableName={setTableName}
              mappings={mappings}
            />
          )}
        </div>

        {/* Footer */}
        <div className="p-5 bg-white border-t border-slate-200 flex justify-between shrink-0">
          {step > 1 ? (
            <button onClick={() => setStep(prev => (prev - 1) as any)} className="px-6 py-2 text-slate-600 hover:bg-slate-100 rounded font-medium border border-slate-300">
              Zurück
            </button>
          ) : (
            <div></div>
          )}

          {step === 2 && (
            <button onClick={() => setStep(3)} className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded font-bold shadow-md flex items-center gap-2">
              Weiter <ArrowRight size={18}/>
            </button>
          )}
          
          {step === 3 && (
            <button onClick={handleFinish} className="bg-green-600 hover:bg-green-700 text-white px-8 py-2 rounded font-bold shadow-md flex items-center gap-2">
              <Database size={18}/> Import Abschließen
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
