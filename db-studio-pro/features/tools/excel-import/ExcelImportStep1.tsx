import React, { useRef } from 'react';
import { Upload, FileSpreadsheet } from 'lucide-react';
import * as XLSX from 'xlsx';

interface ExcelImportStep1Props {
  workbook: XLSX.WorkBook | null;
  sheetNames: string[];
  file: File | null;
  loading: boolean;
  handleFileUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  setSelectedSheet: (sheetName: string) => void;
  processSheet: (wb: XLSX.WorkBook, sheetName: string, fileName: string) => void;
  setStep: (step: 1 | 2 | 3) => void;
  setWorkbook: (wb: XLSX.WorkBook | null) => void;
  setSheetNames: (names: string[]) => void;
  setFile: (file: File | null) => void;
}

export const ExcelImportStep1: React.FC<ExcelImportStep1Props> = ({
  workbook,
  sheetNames,
  file,
  loading,
  handleFileUpload,
  setSelectedSheet,
  processSheet,
  setStep,
  setWorkbook,
  setSheetNames,
  setFile,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!workbook) {
    return (
      <div className="flex flex-col items-center justify-center h-full border-2 border-dashed border-slate-300 rounded-xl bg-slate-100 hover:bg-white transition-colors gap-4">
        <div className="p-6 bg-green-100 rounded-full text-green-600">
          <Upload size={48} />
        </div>
        <div className="text-center">
          <h3 className="text-lg font-bold text-slate-700">Excel-Datei hier ablegen</h3>
          <p className="text-slate-500 text-sm">oder klicken zum Auswählen (.xlsx, .xls, .csv)</p>
        </div>
        <input 
          type="file" 
          accept=".xlsx, .xls, .csv" 
          ref={fileInputRef} 
          className="hidden" 
          onChange={handleFileUpload}
        />
        <button 
          type="button"
          onClick={() => fileInputRef.current?.click()} 
          disabled={loading}
          className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded font-bold shadow-md transition-all"
        >
          {loading ? 'Lese Datei...' : 'Datei wählen'}
        </button>
      </div>
    );
  }

  if (sheetNames.length > 1) {
    return (
      <div className="flex flex-col h-full gap-6 max-w-2xl mx-auto justify-center">
        <div className="text-center">
          <div className="inline-block p-4 bg-green-100 text-green-700 rounded-full mb-3 animate-pulse">
            <FileSpreadsheet size={32} />
          </div>
          <h3 className="text-xl font-bold text-slate-800">Mehrere Arbeitsblätter gefunden</h3>
          <p className="text-slate-500 text-sm mt-1">
            Die Datei <strong>{file?.name}</strong> enthält mehrere Mappenblätter. Welches Arbeitsblatt möchten Sie importieren?
          </p>
        </div>
        
        <div className="grid grid-cols-2 gap-3 max-h-[250px] overflow-y-auto p-2">
          {sheetNames.map((sheetName, sIdx) => (
            <button
              type="button"
              key={sIdx}
              onClick={() => {
                setSelectedSheet(sheetName);
                processSheet(workbook, sheetName, file?.name || '');
                setStep(2);
              }}
              className="flex items-center gap-3 p-4 bg-white border border-slate-200 hover:border-green-500 hover:bg-green-50/50 rounded-xl transition-all shadow-sm text-left group"
            >
              <div className="p-2 bg-slate-100 group-hover:bg-green-100 text-slate-500 group-hover:text-green-600 rounded-lg shrink-0">
                <FileSpreadsheet size={18} />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-bold text-slate-700 truncate group-hover:text-green-800">{sheetName}</p>
                <p className="text-xs text-slate-400">Arbeitsblatt {sIdx + 1}</p>
              </div>
            </button>
          ))}
        </div>
        
        <button
          type="button"
          onClick={() => { 
            setWorkbook(null); 
            setSheetNames([]); 
            setFile(null); 
          }}
          className="text-xs text-slate-400 hover:text-slate-600 text-center underline"
        >
          Andere Datei wählen
        </button>
      </div>
    );
  }

  return null;
};
