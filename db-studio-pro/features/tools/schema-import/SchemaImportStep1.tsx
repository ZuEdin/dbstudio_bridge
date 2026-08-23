import React from 'react';
import { Settings, AlertTriangle } from 'lucide-react';

interface SchemaImportStep1Props {
  format: 'auto' | 'sql' | 'json' | 'csv';
  setFormat: (f: 'auto' | 'sql' | 'json' | 'csv') => void;
  inputText: string;
  setInputText: (text: string) => void;
  error: string | null;
}

export const SchemaImportStep1: React.FC<SchemaImportStep1Props> = ({
  format,
  setFormat,
  inputText,
  setInputText,
  error,
}) => {
  return (
    <div className="flex-1 p-6 flex flex-col gap-4 overflow-hidden">
      <div className="flex justify-between items-center gap-4 shrink-0">
        <div className="flex gap-2 items-center text-sm font-medium text-slate-700">
          <Settings size={16} className="text-slate-400"/>
          <span>Import-Format:</span>
          <div className="flex bg-slate-200 p-1 rounded-lg">
            {(['auto', 'sql', 'json', 'csv'] as const).map(f => (
              <button
                key={f}
                type="button"
                onClick={() => setFormat(f)}
                className={`px-3 py-1 text-xs font-bold rounded-md transition-all ${
                  format === f ? 'bg-purple-600 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-300'
                }`}
              >
                {f === 'auto' ? 'Auto-Erkennung' : f.toUpperCase()}
              </button>
            ))}
          </div>
        </div>
        
        <span className="text-xs text-slate-400">Tipp: Du kannst beliebig viele CREATE TABLE Anweisungen kopieren.</span>
      </div>

      {/* Textarea */}
      <div className="flex-1 min-h-0 flex flex-col relative border border-slate-300 rounded-lg overflow-hidden bg-slate-900">
        <textarea
          value={inputText}
          onChange={e => setInputText(e.target.value)}
          placeholder={`-- BEISPIEL SQL DDL:
CREATE TABLE kunden (
    id INT PRIMARY KEY AUTO_INCREMENT,
    firma VARCHAR(255) NOT NULL,
    kontakt VARCHAR(100),
    aktiv BOOLEAN DEFAULT TRUE,
    erstellt_am TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE kontakte (
    id INT PRIMARY KEY,
    name VARCHAR(100),
    email VARCHAR(150),
    kunden_id INT
);`}
          className="flex-1 p-4 bg-slate-900 text-slate-100 font-mono text-xs focus:outline-none resize-none overflow-y-auto leading-relaxed"
        />
      </div>

      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2.5 text-xs text-red-700 shrink-0">
          <AlertTriangle size={16} className="text-red-500 shrink-0 mt-0.5"/>
          <p className="leading-normal font-medium">{error}</p>
        </div>
      )}
    </div>
  );
};
