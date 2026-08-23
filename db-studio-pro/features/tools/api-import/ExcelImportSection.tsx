import React, { useState } from 'react';
import { Upload, FileSpreadsheet, RefreshCw } from 'lucide-react';
import * as XLSX from 'xlsx';
import { useProjectStore } from '../../../stores/useProjectStore';
import { useUIStore } from '../../../stores/useUIStore';
import { Table, Field } from '../../../types/index';

export const ExcelImportSection: React.FC = () => {
  const store = useProjectStore();
  const ui = useUIStore();

  const [excelFile, setExcelFile] = useState<File | null>(null);
  const [excelProgress, setExcelProgress] = useState('');

  const handleExcelImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setExcelFile(file);
    setExcelProgress('Datei wird geladen...');

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const bstr = evt.target?.result;
        const wb = XLSX.read(bstr, { type: 'binary', cellDates: true });
        
        let importedCount = 0;
        wb.SheetNames.forEach((sheetName) => {
          const ws = wb.Sheets[sheetName];
          const rawData = XLSX.utils.sheet_to_json(ws, { header: 1 }) as any[][];
          
          if (rawData.length > 0) {
            const headers = rawData[0] || [];
            const rows = rawData.slice(1);
            
            const fields: Field[] = headers.map((h, idx) => {
              const colName = String(h || `spalte${idx + 1}`).replace(/[^a-zA-Z0-9_]/g, '').toLowerCase();
              return {
                id: crypto.randomUUID(),
                name: colName,
                type: 'VARCHAR',
                isPrimaryKey: colName === 'id',
                allowNull: true
              };
            });

            if (!fields.some(f => f.isPrimaryKey)) {
              fields.unshift({
                id: crypto.randomUUID(),
                name: 'id',
                type: 'INTEGER',
                isPrimaryKey: true,
                isAutoIncrement: true
              });
            }

            const cleanData = rows.map((row, rIdx) => {
              const rowObj: any = {};
              if (!headers.some(h => String(h).toLowerCase() === 'id')) {
                rowObj['id'] = rIdx + 1;
              }
              headers.forEach((h, cIdx) => {
                const colName = String(h).replace(/[^a-zA-Z0-9_]/g, '').toLowerCase();
                rowObj[colName] = row[cIdx] ?? '';
              });
              return rowObj;
            });

            const newTable: Table = {
              id: crypto.randomUUID(),
              name: sheetName.replace(/[^a-zA-Z0-9]/g, '') || `Excel_${Date.now()}`,
              fields: fields,
              data: cleanData
            };

            store.addTable(newTable);
            importedCount++;
          }
        });

        ui.addToast(`${importedCount} Excel-Tabelle(n) geladen!`, 'success');
        setExcelProgress('Erfolgreich importiert.');
      } catch (err: any) {
        ui.addToast(`Fehler: ${err.message}`, 'error');
        setExcelProgress('Import fehlgeschlagen.');
      }
    };
    reader.readAsBinaryString(file);
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-8 flex flex-col gap-6 max-w-3xl mx-auto w-full mt-4">
      <div className="flex items-center gap-3">
        <div className="p-3 rounded-lg bg-emerald-100 text-emerald-700">
          <FileSpreadsheet size={28}/>
        </div>
        <div>
          <h3 className="text-lg font-bold text-slate-800">Excel Arbeitsblätter importieren</h3>
          <p className="text-slate-500 text-xs mt-1">Laden Sie eine lokale Excel-Tabelle hoch, um Arbeitsblätter automatisch als eigenständige IndexedDB-Tabellen anzulegen.</p>
        </div>
      </div>

      <div className="border-2 border-dashed border-slate-200 rounded-xl p-8 bg-slate-50/50 flex flex-col items-center justify-center gap-4 hover:border-emerald-500 transition-colors cursor-pointer group relative">
        <input 
          type="file" 
          accept=".xlsx, .xls" 
          onChange={handleExcelImport}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" 
          id="excel-file-upload"
        />
        <div className="flex flex-col items-center justify-center text-center">
          <Upload size={40} className="text-slate-400 group-hover:text-emerald-600 transition-colors mb-2" />
          <span className="text-sm font-bold text-slate-700">Excel-Datei auswählen</span>
          <span className="text-xs text-slate-400 mt-1">Zulässig: .xlsx, .xls (SheetJS Parser)</span>
        </div>
      </div>

      {excelProgress && (
        <div className="bg-slate-50 p-4 rounded-lg border border-slate-200 flex items-center gap-2 text-sm text-slate-600">
          <RefreshCw size={16} className={`text-emerald-600 ${excelProgress.includes('laden') ? 'animate-spin' : ''}`}/>
          <span>Status: {excelProgress}</span>
        </div>
      )}
    </div>
  );
};
