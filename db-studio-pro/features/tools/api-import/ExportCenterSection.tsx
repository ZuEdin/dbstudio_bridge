import React, { useState, useEffect } from 'react';
import { Download, FileSpreadsheet, Database, FileCode, FileJson, AlertCircle } from 'lucide-react';
import * as XLSX from 'xlsx';
import { useProjectStore } from '../../../stores/useProjectStore';
import { useUIStore } from '../../../stores/useUIStore';
import { Table, Field } from '../../../types/index';

export const ExportCenterSection: React.FC = () => {
  const store = useProjectStore();
  const ui = useUIStore();

  const [selectedExportTableId, setSelectedExportTableId] = useState<string>('');
  const selectedExportTable = store.tables.find(t => t.id === selectedExportTableId);

  // Initialize selected table
  useEffect(() => {
    if (store.tables.length > 0 && !selectedExportTableId) {
      setSelectedExportTableId(store.tables[0].id);
    }
  }, [store.tables]);

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

  const triggerExcelExport = () => {
    if (!selectedExportTable) return;
    const ws = XLSX.utils.json_to_sheet(selectedExportTable.data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, selectedExportTable.name);
    XLSX.writeFile(wb, `${selectedExportTable.name}_export.xlsx`);
    ui.addToast(`Excel-Export für "${selectedExportTable.name}" heruntergeladen.`, 'success');
  };

  const triggerAccessXmlExport = () => {
    if (!selectedExportTable) return;
    let xml = `<?xml version="1.0" encoding="UTF-8"?>\n`;
    xml += `<dataroot xmlns:od="urn:schemas-microsoft-com:officedata" generated="${new Date().toISOString()}">\n`;
    selectedExportTable.data.forEach((row) => {
      xml += `  <${selectedExportTable.name}>\n`;
      selectedExportTable.fields.forEach(f => {
        const val = row[f.name];
        if (val !== undefined && val !== null) {
          xml += `    <${f.name}>${escapeXml(String(val))}</${f.name}>\n`;
        }
      });
      xml += `  </${selectedExportTable.name}>\n`;
    });
    xml += `</dataroot>\n`;
    
    const blob = new Blob([xml], { type: 'text/xml;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${selectedExportTable.name}_access.xml`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    ui.addToast(`Access XML für "${selectedExportTable.name}" heruntergeladen.`, 'success');
  };

  const triggerSqlDumpExport = () => {
    if (!selectedExportTable) return;
    let sql = `-- DB Studio Pro SQL Dump\n`;
    sql += `-- Erstellt am: ${new Date().toLocaleString()}\n`;
    sql += `-- Tabelle: ${selectedExportTable.name}\n\n`;
    
    sql += `CREATE TABLE \`${selectedExportTable.name}\` (\n`;
    const colDefs = selectedExportTable.fields.map(f => {
      let sqlType = 'VARCHAR(255)';
      if (f.type === 'INTEGER') sqlType = 'INT';
      else if (f.type === 'DECIMAL' || f.type === 'DOUBLE') sqlType = 'DECIMAL(10, 2)';
      else if (f.type === 'BOOLEAN') sqlType = 'TINYINT(1)';
      else if (f.type === 'DATE') sqlType = 'DATE';
      else if (f.type === 'DATETIME' || f.type === 'TIMESTAMP') sqlType = 'DATETIME';
      else if (f.type === 'TEXT') sqlType = 'TEXT';
      
      let def = `  \`${f.name}\` ${sqlType}`;
      if (f.isPrimaryKey) def += ' PRIMARY KEY';
      if (f.isAutoIncrement) def += ' AUTO_INCREMENT';
      if (!f.allowNull) def += ' NOT NULL';
      return def;
    });
    sql += colDefs.join(',\n');
    sql += `\n);\n\n`;
    
    if (selectedExportTable.data.length > 0) {
      sql += `-- Einfügen von Daten für ${selectedExportTable.name}\n`;
      selectedExportTable.data.forEach(row => {
        const columns: string[] = [];
        const values: string[] = [];
        selectedExportTable.fields.forEach(f => {
          const val = row[f.name];
          if (val !== undefined && val !== null) {
            columns.push(`\`${f.name}\``);
            if (typeof val === 'number') {
              values.push(String(val));
            } else if (typeof val === 'boolean') {
              values.push(val ? '1' : '0');
            } else {
              const escaped = String(val).replace(/'/g, "''");
              values.push(`'${escaped}'`);
            }
          }
        });
        if (columns.length > 0) {
          sql += `INSERT INTO \`${selectedExportTable.name}\` (${columns.join(', ')}) VALUES (${values.join(', ')});\n`;
        }
      });
    }
    
    const blob = new Blob([sql], { type: 'text/sql;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${selectedExportTable.name}_dump.sql`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    ui.addToast(`SQL Dump für "${selectedExportTable.name}" heruntergeladen.`, 'success');
  };

  const triggerJsonExport = () => {
    if (!selectedExportTable) return;
    const jsonString = `data:text/json;charset=utf-8,${encodeURIComponent(JSON.stringify(selectedExportTable.data, null, 2))}`;
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", jsonString);
    downloadAnchor.setAttribute("download", `${selectedExportTable.name}_export.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    ui.addToast(`JSON-Export für "${selectedExportTable.name}" heruntergeladen.`, 'success');
  };

  return (
    <div className="flex-1 bg-slate-50 p-6 overflow-y-auto flex flex-col gap-6">
      <div className="max-w-4xl mx-auto w-full flex flex-col gap-6 mt-4">
        
        {/* Select table to export */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 flex justify-between items-center">
          <div className="flex flex-col gap-1">
            <span className="text-sm font-bold text-slate-800">Zu exportierende Tabelle wählen:</span>
            <span className="text-xs text-slate-400">In IndexedDB gespeicherte relationale Schema &amp; Datenbestände exportieren.</span>
          </div>
          <select 
            className="bg-slate-50 border border-slate-200 rounded-lg px-4 py-2 text-sm font-semibold text-slate-700 focus:outline-none focus:ring-1 focus:ring-indigo-500 min-w-[220px]"
            value={selectedExportTableId}
            onChange={(e) => setSelectedExportTableId(e.target.value)}
          >
            {store.tables.map(t => (
              <option key={t.id} value={t.id}>{t.name} ({t.data.length} Zeilen)</option>
            ))}
          </select>
        </div>

        {selectedExportTable ? (
          <>
            {/* Bento Grid with Export choices */}
            <div className="grid grid-cols-4 gap-4">
              
              {/* Excel Export Card */}
              <button 
                onClick={triggerExcelExport}
                className="bg-white hover:bg-emerald-50/30 p-6 rounded-xl shadow-sm border border-slate-200 hover:border-emerald-400 flex flex-col items-center justify-center gap-3 transition-all group cursor-pointer text-center"
              >
                <div className="p-4 rounded-full bg-emerald-100 text-emerald-700 group-hover:scale-110 transition-transform">
                  <FileSpreadsheet size={24}/>
                </div>
                <span className="text-xs font-bold text-slate-700">Excel-Export</span>
                <span className="text-[10px] text-slate-400">Erzeugt .xlsx Datei</span>
              </button>

              {/* Access XML Export Card */}
              <button 
                onClick={triggerAccessXmlExport}
                className="bg-white hover:bg-orange-50/30 p-6 rounded-xl shadow-sm border border-slate-200 hover:border-orange-400 flex flex-col items-center justify-center gap-3 transition-all group cursor-pointer text-center"
              >
                <div className="p-4 rounded-full bg-orange-100 text-orange-700 group-hover:scale-110 transition-transform">
                  <Database size={24}/>
                </div>
                <span className="text-xs font-bold text-slate-700">XML Data Export</span>
                <span className="text-[10px] text-slate-400">XML Schema &amp; Data</span>
              </button>

              {/* SQL Script Export Card */}
              <button 
                onClick={triggerSqlDumpExport}
                className="bg-white hover:bg-indigo-50/30 p-6 rounded-xl shadow-sm border border-slate-200 hover:border-indigo-400 flex flex-col items-center justify-center gap-3 transition-all group cursor-pointer text-center"
              >
                <div className="p-4 rounded-full bg-indigo-100 text-indigo-700 group-hover:scale-110 transition-transform">
                  <FileCode size={24}/>
                </div>
                <span className="text-xs font-bold text-slate-700">SQL Dump / Schema</span>
                <span className="text-[10px] text-slate-400">Generiert DDL &amp; INSERTs</span>
              </button>

              {/* JSON Export Card */}
              <button 
                onClick={triggerJsonExport}
                className="bg-white hover:bg-slate-100 p-6 rounded-xl shadow-sm border border-slate-200 hover:border-slate-400 flex flex-col items-center justify-center gap-3 transition-all group cursor-pointer text-center"
              >
                <div className="p-4 rounded-full bg-slate-100 text-slate-700 group-hover:scale-110 transition-transform">
                  <FileJson size={24}/>
                </div>
                <span className="text-xs font-bold text-slate-700">JSON Export</span>
                <span className="text-[10px] text-slate-400">Flaches JSON-Array</span>
              </button>

            </div>

            {/* Schema Preview */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 flex flex-col gap-4">
              <h3 className="font-bold text-sm text-slate-800">Export-Struktur: {selectedExportTable.name}</h3>
              <div className="flex flex-wrap gap-2">
                {selectedExportTable.fields.map(f => (
                  <span key={f.id} className="text-xs bg-slate-100 border border-slate-200 px-3 py-1.5 rounded-lg text-slate-700 flex items-center gap-1.5 font-medium">
                    {f.isPrimaryKey && <span className="w-2 h-2 rounded-full bg-indigo-600" title="Primärschlüssel"/>}
                    {f.name} <span className="text-[10px] text-slate-400 uppercase font-mono">{f.type}</span>
                  </span>
                ))}
              </div>
            </div>
          </>
        ) : (
          <div className="text-center p-12 text-slate-400 bg-white rounded-xl shadow-sm border border-slate-200">
            <AlertCircle size={48} className="mx-auto text-slate-300 mb-2"/>
            Keine Tabellen zum Exportieren vorhanden.
          </div>
        )}

      </div>
    </div>
  );
};
