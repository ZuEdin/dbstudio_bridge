import React, { useState } from 'react';
import { X, ArrowRight, Database, CheckSquare } from 'lucide-react';

import { Table } from '../../types/index';
import { parseSqlDdl, parseJsonSchemaOrData, parseCsvText } from './schema-import/schemaParserHelper';
import { SchemaImportStep1 } from './schema-import/SchemaImportStep1';
import { SchemaImportStep2 } from './schema-import/SchemaImportStep2';

interface SchemaImportWizardProps {
  onSave: (table: Table) => void;
  onClose: () => void;
  onAddToast: (message: string, type?: 'success' | 'error' | 'warning') => void;
}

export const SchemaImportWizard: React.FC<SchemaImportWizardProps> = ({ onSave, onClose, onAddToast }) => {
  const [inputText, setInputText] = useState('');
  const [format, setFormat] = useState<'auto' | 'sql' | 'json' | 'csv'>('auto');
  const [detectedFormat, setDetectedFormat] = useState<string>('');
  const [step, setStep] = useState<1 | 2>(1);
  const [parsedTables, setParsedTables] = useState<Table[]>([]);
  const [error, setError] = useState<string | null>(null);

  const handleAnalyze = () => {
    setError(null);
    if (!inputText.trim()) {
      setError("Bitte fügen Sie zuerst etwas Text oder SQL/JSON ein.");
      return;
    }

    let detected: 'sql' | 'json' | 'csv' | null = null;
    let tablesResult: Table[] = [];

    try {
      const trimmedText = inputText.trim();
      
      // Determine format
      if (format === 'auto') {
        if (trimmedText.startsWith('[') || trimmedText.startsWith('{')) {
          detected = 'json';
        } else if (/CREATE\s+TABLE/i.test(trimmedText)) {
          detected = 'sql';
        } else {
          detected = 'csv';
        }
      } else {
        detected = format;
      }

      setDetectedFormat(detected.toUpperCase());

      if (detected === 'json') {
        tablesResult = parseJsonSchemaOrData(trimmedText);
      } else if (detected === 'sql') {
        tablesResult = parseSqlDdl(trimmedText);
      } else {
        tablesResult = parseCsvText(trimmedText);
      }

      if (tablesResult.length === 0) {
        throw new Error("Es konnten keine Tabellen oder Schemata aus diesem Text extrahiert werden. Überprüfe die Syntax.");
      }

      setParsedTables(tablesResult);
      setStep(2);
      onAddToast(`${tablesResult.length} Tabelle(n) erfolgreich analysiert!`, 'success');

    } catch (err: any) {
      setError(err.message || String(err));
    }
  };

  const handleImport = () => {
    if (parsedTables.length === 0) return;
    parsedTables.forEach(t => onSave(t));
    onAddToast(`${parsedTables.length} Tabelle(n) erfolgreich importiert.`, 'success');
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 z-[200] flex items-center justify-center animate-in fade-in-25 backdrop-blur-sm p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl border border-slate-300 flex flex-col h-[650px] overflow-hidden">
        
        {/* Header */}
        <div className="flex justify-between items-center p-5 bg-gradient-to-r from-purple-800 to-indigo-900 text-white shrink-0">
          <div>
            <h2 className="text-xl font-bold flex items-center gap-2">
               <Database className="text-purple-200 animate-pulse"/> Projekt & Schema Text-Import
            </h2>
            <p className="text-purple-100 text-xs mt-1">
              Füge SQL DDL Statements (CREATE TABLE), JSON Schemata oder CSV Daten direkt hier ein.
            </p>
          </div>
          <button onClick={onClose} className="text-purple-200 hover:text-white transition-colors bg-white/10 hover:bg-white/20 p-1.5 rounded-lg">
            <X size={20} />
          </button>
        </div>

        {/* Content body */}
        <div className="flex-1 bg-slate-50 flex flex-col overflow-hidden">
          {step === 1 ? (
            <SchemaImportStep1
              format={format}
              setFormat={setFormat}
              inputText={inputText}
              setInputText={setInputText}
              error={error}
            />
          ) : (
            <SchemaImportStep2
              detectedFormat={detectedFormat}
              parsedTables={parsedTables}
            />
          )}
        </div>

        {/* Footer actions */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-between shrink-0">
          {step === 2 ? (
            <button onClick={() => setStep(1)} className="px-5 py-2.5 border rounded-lg text-slate-700 font-bold hover:bg-slate-100 transition-all text-sm flex items-center gap-2">
              Zurück zur Bearbeitung
            </button>
          ) : (
            <div className="text-xs text-slate-400 flex items-center gap-1">
              <CheckSquare size={14} className="text-purple-600"/>
              <span>Nach dem Import sind die Tabellen sofort in IndexedDB gespeichert und einsatzbereit.</span>
            </div>
          )}

          {step === 1 ? (
            <button
              onClick={handleAnalyze}
              className="bg-purple-700 hover:bg-purple-800 text-white px-6 py-2.5 rounded-lg font-bold shadow-md hover:shadow-lg transition-all flex items-center gap-2 text-sm"
            >
              Schema analysieren <ArrowRight size={16}/>
            </button>
          ) : (
            <button
              onClick={handleImport}
              className="bg-green-600 hover:bg-green-700 text-white px-6 py-2.5 rounded-lg font-bold shadow-md hover:shadow-lg transition-all flex items-center gap-2 text-sm"
            >
              Tabellen anlegen <ArrowRight size={16}/>
            </button>
          )}
        </div>

      </div>
    </div>
  );
};
