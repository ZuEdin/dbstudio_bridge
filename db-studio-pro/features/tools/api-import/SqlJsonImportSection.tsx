import React, { useState } from 'react';
import { FileCode, FileJson, Plus, Upload } from 'lucide-react';
import { useProjectStore } from '../../../stores/useProjectStore';
import { useUIStore } from '../../../stores/useUIStore';
import { Table, Field } from '../../../types/index';
import { inferFieldType } from '../../../utils/apiImportHelper';

interface SqlJsonImportSectionProps {
  showMessage: (title: string, message: string, type: 'info' | 'warning' | 'error' | 'success') => void;
}

export const SqlJsonImportSection: React.FC<SqlJsonImportSectionProps> = ({ showMessage }) => {
  const store = useProjectStore();
  const ui = useUIStore();

  const [manualSqlText, setManualSqlText] = useState('');
  const [manualJsonText, setManualJsonText] = useState('');

  const handleSqlImport = () => {
    if (!manualSqlText.trim()) return showMessage("Fehler", "Bitte geben Sie SQL-Text ein.", "warning");
    
    try {
      const createRegex = /CREATE\s+TABLE\s+([a-zA-Z0-9_`"]+)\s*\(([\s\S]*?)\);/gi;
      let match;
      let count = 0;

      while ((match = createRegex.exec(manualSqlText)) !== null) {
        const tableName = match[1].replace(/[`"]/g, '').trim();
        const body = match[2];
        
        const lines = body.split(',').map(l => l.trim()).filter(Boolean);
        const fields: Field[] = [];

        lines.forEach(line => {
          const parts = line.split(/\s+/).map(p => p.replace(/[`"]/g, ''));
          if (parts.length >= 2) {
            const colName = parts[0];
            const typeStr = parts[1].toUpperCase();
            
            let type: Field['type'] = 'VARCHAR';
            if (typeStr.includes('INT')) type = 'INTEGER';
            else if (typeStr.includes('DECIMAL') || typeStr.includes('DOUBLE') || typeStr.includes('FLOAT')) type = 'DOUBLE';
            else if (typeStr.includes('BOOL')) type = 'BOOLEAN';
            else if (typeStr.includes('DATE')) type = 'DATE';
            else if (typeStr.includes('TEXT')) type = 'TEXT';

            fields.push({
              id: crypto.randomUUID(),
              name: colName,
              type: type,
              isPrimaryKey: line.toUpperCase().includes('PRIMARY KEY'),
              allowNull: !line.toUpperCase().includes('NOT NULL')
            });
          }
        });

        if (fields.length > 0) {
          if (!fields.some(f => f.isPrimaryKey)) {
            fields.unshift({ id: crypto.randomUUID(), name: 'id', type: 'INTEGER', isPrimaryKey: true, isAutoIncrement: true });
          }

          const newTable: Table = {
            id: crypto.randomUUID(),
            name: tableName,
            fields: fields,
            data: []
          };
          store.addTable(newTable);
          count++;
        }
      }

      if (count > 0) {
        ui.addToast(`${count} Tabelle(n) aus SQL-Schema erstellt!`, 'success');
        setManualSqlText('');
      } else {
        showMessage("SQL Import", "Keine gültigen 'CREATE TABLE' Anweisungen gefunden.", "info");
      }
    } catch (err: any) {
      showMessage("SQL Parser-Fehler", err.message, "error");
    }
  };

  const handleJsonImport = () => {
    if (!manualJsonText.trim()) return showMessage("Fehler", "Bitte geben Sie JSON-Text ein.", "warning");
    try {
      const parsed = JSON.parse(manualJsonText);
      const rows = Array.isArray(parsed) ? parsed : [parsed];
      if (rows.length === 0) throw new Error("Das JSON-Array ist leer.");

      const sample = rows[0];
      const fields: Field[] = Object.keys(sample).map(key => ({
        id: crypto.randomUUID(),
        name: key,
        type: inferFieldType(sample[key]),
        isPrimaryKey: key.toLowerCase() === 'id',
        allowNull: true
      }));

      if (!fields.some(f => f.isPrimaryKey)) {
        fields.unshift({ id: crypto.randomUUID(), name: 'id', type: 'INTEGER', isPrimaryKey: true, isAutoIncrement: true });
        rows.forEach((r, i) => r['id'] = i + 1);
      }

      const newTable: Table = {
        id: crypto.randomUUID(),
        name: `JSON_Import_${Date.now() % 10000}`,
        fields: fields,
        data: rows
      };

      store.addTable(newTable);
      ui.addToast("JSON-Tabelle erfolgreich importiert!", "success");
      setManualJsonText('');
    } catch (err: any) {
      showMessage("JSON Parser-Fehler", err.message, "error");
    }
  };

  return (
    <div className="grid grid-cols-2 gap-6 mt-4">
      {/* SQL Schema Parser */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 flex flex-col gap-4">
        <div className="flex items-center gap-2">
          <FileCode className="text-purple-600" size={22}/>
          <h3 className="font-bold text-slate-800 text-sm">SQL-Schema (CREATE TABLE) analysieren</h3>
        </div>
        <p className="text-xs text-slate-400">Fügen Sie DDL-Skripte ein, um relationale Tabellenstrukturen automatisch im Workspace anzulegen.</p>
        
        <textarea 
          className="flex-1 min-h-[160px] font-mono text-xs p-3 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500 bg-slate-50/50"
          placeholder="CREATE TABLE kunden (&#10;  id INTEGER PRIMARY KEY,&#10;  name VARCHAR(255),&#10;  ort VARCHAR(100)&#10;);"
          value={manualSqlText}
          onChange={(e) => setManualSqlText(e.target.value)}
        />

        <button 
          onClick={handleSqlImport}
          className="bg-purple-600 hover:bg-purple-700 text-white font-semibold py-2 px-4 rounded-lg text-xs flex items-center justify-center gap-2 shadow-sm transition-colors"
        >
          <Plus size={14}/> Schema generieren
        </button>
      </div>

      {/* JSON array parser */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 flex flex-col gap-4">
        <div className="flex items-center gap-2">
          <FileJson className="text-indigo-600" size={22}/>
          <h3 className="font-bold text-slate-800 text-sm">JSON-Daten importieren (Auto-Schema)</h3>
        </div>
        <p className="text-xs text-slate-400">Fügen Sie ein JSON-Array mit Datensätzen ein. Das System erzeugt Schema, Typen und Datensätze.</p>

        <textarea 
          className="flex-1 min-h-[160px] font-mono text-xs p-3 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500 bg-slate-50/50"
          placeholder="[&#10;  { &quot;name&quot;: &quot;Muster GmbH&quot;, &quot;plz&quot;: 10115, &quot;aktiv&quot;: true }&#10;]"
          value={manualJsonText}
          onChange={(e) => setManualJsonText(e.target.value)}
        />

        <button 
          onClick={handleJsonImport}
          className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2 px-4 rounded-lg text-xs flex items-center justify-center gap-2 shadow-sm transition-colors"
        >
          <Upload size={14}/> JSON importieren
        </button>
      </div>
    </div>
  );
};
