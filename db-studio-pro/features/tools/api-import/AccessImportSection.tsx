import React, { useState } from 'react';
import { Upload, Database, RefreshCw, AlertCircle } from 'lucide-react';
import { useProjectStore } from '../../../stores/useProjectStore';
import { useUIStore } from '../../../stores/useUIStore';
import { Table, Field } from '../../../types/index';
import { inferFieldType } from '../../../utils/apiImportHelper';

export const AccessImportSection: React.FC = () => {
  const store = useProjectStore();
  const ui = useUIStore();

  const [accessFile, setAccessFile] = useState<File | null>(null);
  const [accessProgress, setAccessProgress] = useState('');

  const escapeXml = (unsafe: string) => {
    return unsafe.replace(/[<>&'"]/g, (c) => {
      switch (c) {
        case '<': return '&lt;';
        case '>': return '&gt;';
        case '&': return '&amp;';
        case '\'': return '&apos;';
        case '"': return '&quot;';
        default: return c;
      }
    });
  };

  const parseAccessXmlText = (text: string) => {
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(text, "text/xml");
    
    if (xmlDoc.getElementsByTagName("parsererror").length > 0) {
      throw new Error("Ungültiges XML-Format.");
    }

    const root = xmlDoc.documentElement;
    const tablesMap = new Map<string, any[]>();

    for (let i = 0; i < root.children.length; i++) {
      const node = root.children[i];
      if (node.nodeType !== 1) continue;
      
      const tableName = node.tagName;
      if (!tablesMap.has(tableName)) {
        tablesMap.set(tableName, []);
      }
      
      const rowData: any = {};
      for (let j = 0; j < node.children.length; j++) {
        const fieldNode = node.children[j];
        const fieldName = fieldNode.tagName;
        const val = fieldNode.textContent;
        rowData[fieldName] = val;
      }
      tablesMap.get(tableName)?.push(rowData);
    }

    const parsedTables: Table[] = [];
    tablesMap.forEach((rows, tableName) => {
      if (rows.length === 0) return;

      const sampleRow = rows[0];
      const fields: Field[] = Object.keys(sampleRow).map(key => ({
        id: crypto.randomUUID(),
        name: key,
        type: inferFieldType(sampleRow[key]),
        isPrimaryKey: key.toLowerCase() === 'id' || key.toLowerCase().endsWith('id'),
        allowNull: true
      }));

      if (!fields.some(f => f.name.toLowerCase() === 'id')) {
        fields.unshift({ 
          id: crypto.randomUUID(), 
          name: 'ID', 
          type: 'INTEGER', 
          isPrimaryKey: true, 
          isAutoIncrement: true 
        });
        rows.forEach((r, idx) => r['ID'] = idx + 1);
      }

      parsedTables.push({
        id: crypto.randomUUID(),
        name: tableName,
        fields: fields,
        data: rows
      });
    });

    return parsedTables;
  };

  const handleAccessImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setAccessFile(file);
    setAccessProgress('XML-Datei wird analysiert...');

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const text = evt.target?.result as string;
        const parsed = parseAccessXmlText(text);
        parsed.forEach(t => store.addTable(t));
        ui.addToast(`${parsed.length} Access-Tabelle(n) importiert!`, 'success');
        setAccessProgress('Import erfolgreich abgeschlossen.');
      } catch (err: any) {
        ui.addToast(`Fehler: ${err.message}`, 'error');
        setAccessProgress('Fehler beim Import.');
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-8 flex flex-col gap-6 max-w-3xl mx-auto w-full mt-4">
      <div className="flex items-center gap-3">
        <div className="p-3 rounded-lg bg-orange-100 text-orange-700">
          <Database size={28}/>
        </div>
        <div>
          <h3 className="text-lg font-bold text-slate-800">Microsoft Access XML Import</h3>
          <p className="text-slate-500 text-xs mt-1">Importiert Access-Strukturen und Tabelleninhalte über exportierte XML-Dateien.</p>
        </div>
      </div>

      <div className="bg-orange-50/40 p-4 rounded-lg border border-orange-100 text-xs text-orange-800 flex gap-2">
        <AlertCircle size={16} className="shrink-0" />
        <div>
          <p className="font-semibold">Wie exportiere ich aus MS Access?</p>
          <p className="mt-1">Klicken Sie in Access auf die gewünschte Tabelle, wählen Sie im Menüband "Externe Daten" &rarr; "XML-Datei". Speichern Sie die Datei mit gesetztem Haken bei "Daten" und "Schema (XSD)". Laden Sie die erzeugte XML-Datei hier hoch.</p>
        </div>
      </div>

      <div className="border-2 border-dashed border-slate-200 rounded-xl p-8 bg-slate-50/50 flex flex-col items-center justify-center gap-4 hover:border-orange-500 transition-colors cursor-pointer group relative">
        <input 
          type="file" 
          accept=".xml" 
          onChange={handleAccessImport}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" 
          id="access-xml-upload"
        />
        <div className="flex flex-col items-center justify-center text-center">
          <Upload size={40} className="text-slate-400 group-hover:text-orange-600 transition-colors mb-2" />
          <span className="text-sm font-bold text-slate-700">Access XML-Datei wählen</span>
          <span className="text-xs text-slate-400 mt-1">Zulässig: .xml (Microsoft Access dataroot)</span>
        </div>
      </div>

      {accessProgress && (
        <div className="bg-slate-50 p-4 rounded-lg border border-slate-200 flex items-center gap-2 text-sm text-slate-600">
          <RefreshCw size={16} className={`text-orange-600 ${accessProgress.includes('analysiert') ? 'animate-spin' : ''}`}/>
          <span>Status: {accessProgress}</span>
        </div>
      )}
    </div>
  );
};
