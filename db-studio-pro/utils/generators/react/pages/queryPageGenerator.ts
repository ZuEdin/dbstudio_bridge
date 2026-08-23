import { Query, Table, VirtualFile, SelectQuery } from '../../../../types/index';
import { toCamelCase, toPascalCase } from '../../common';

export const generateQueryPage = (
  query: Query,
  tables: Table[],
  root: string
): VirtualFile => {
  const compName = `${toPascalCase(query.name)}QueryPage`;

  if (query.type === 'SELECT') {
      const q = query as SelectQuery;
      const endpoint = `queries/${toCamelCase(q.name)}`; // Using view/query endpoint
      
      const visibleColumns = q.columns.filter(c => c.show !== false);
      const columns = visibleColumns.map(c => {
          return `<th className="p-4">${c.alias || c.fieldName}</th>`;
      }).join('\n');

      const cells = visibleColumns.map(c => {
          const rawKey = c.alias || c.fieldName || '';
          const fieldName = c.fieldName || '';
          return `<td className="p-4 text-sm text-slate-700 dark:text-slate-300 whitespace-nowrap">{String(getCellValue(item, ${JSON.stringify(rawKey)}, ${JSON.stringify(fieldName)}) ?? '')}</td>`;
      }).join('\n');

      const content = `import React, { useEffect, useState } from 'react';
import { get } from '../../services/api';
import { Search, ChevronLeft, ChevronRight } from 'lucide-react';

export const ${compName} = () => {
  const [data, setData] = useState<{ data: any[], total: number, page: number, totalPages: number }>({ data: [], total: 0, page: 1, totalPages: 1 });
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);

  useEffect(() => { load(); }, [page, search]);

  const getCellValue = (item: any, alias: string, fieldName: string) => {
      if (!item) return '';
      if (item[alias] !== undefined && item[alias] !== null) return item[alias];
      const camelAlias = alias ? alias.charAt(0).toLowerCase() + alias.slice(1) : '';
      if (camelAlias && item[camelAlias] !== undefined && item[camelAlias] !== null) return item[camelAlias];
      if (fieldName && item[fieldName] !== undefined && item[fieldName] !== null) return item[fieldName];
      const camelField = fieldName ? fieldName.charAt(0).toLowerCase() + fieldName.slice(1) : '';
      if (camelField && item[camelField] !== undefined && item[camelField] !== null) return item[camelField];
      const target = (alias || fieldName).toLowerCase();
      const foundKey = Object.keys(item).find(k => k.toLowerCase() === target);
      return foundKey ? item[foundKey] : '';
  };

  const load = async () => {
      setLoading(true);
      try {
          const res: any = await get('${endpoint}', { page, pageSize: 20, search });
          let items: any[] = [];
          let total = 0;
          let curPage = page;
          let totalPages = 1;

          if (Array.isArray(res)) {
              items = res;
              total = res.length;
          } else if (res && typeof res === 'object') {
              items = res.data || res.Data || res.items || res.Items || [];
              total = res.total ?? res.Total ?? items.length;
              curPage = res.page ?? res.Page ?? page;
              totalPages = (res.totalPages ?? res.TotalPages ?? Math.ceil(total / 20)) || 1;
          }
          setData({ data: items, total, page: curPage, totalPages });
      } finally { setLoading(false); }
  };

  return (
    <div className="p-8 max-w-[95%] mx-auto">
        <div className="flex justify-between items-center mb-8">
            <h1 className="text-3xl font-bold dark:text-white">${q.name}</h1>
            <div className="flex gap-4">
                <input 
                    type="text" 
                    placeholder="Suchen..." 
                    className="pl-4 pr-4 py-2 border rounded-lg bg-white dark:bg-slate-800 dark:border-slate-700 dark:text-white"
                    value={search}
                    onChange={e => { setSearch(e.target.value); setPage(1); }}
                />
            </div>
        </div>
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm overflow-hidden border border-slate-200 dark:border-slate-700">
            <div className="overflow-x-auto">
                <table className="w-full text-left">
                    <thead className="bg-slate-50 dark:bg-slate-900 border-b dark:border-slate-700 text-slate-500 uppercase text-xs font-semibold">
                        <tr>${columns}</tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                        {data.data.length > 0 ? data.data.map((item, i) => (
                            <tr key={i} className="hover:bg-slate-50 dark:hover:bg-slate-700/50">
                                ${cells}
                            </tr>
                        )) : (
                            <tr><td colSpan={${q.columns.filter(c=>c.show !== false).length}} className="p-8 text-center text-slate-400">Keine Daten.</td></tr>
                        )}
                    </tbody>
                </table>
            </div>
            <div className="p-4 border-t border-slate-100 dark:border-slate-700 flex items-center justify-between bg-slate-50 dark:bg-slate-900/50">
                <div className="text-sm text-slate-500">Seite {data.page} von {data.totalPages}</div>
                <div className="flex gap-2">
                    <button onClick={() => setPage(p => Math.max(1, p-1))} disabled={page<=1} className="p-2 border rounded bg-white hover:bg-slate-50 disabled:opacity-50"><ChevronLeft size={16}/></button>
                    <button onClick={() => setPage(p => Math.min(data.totalPages, p+1))} disabled={page>=data.totalPages} className="p-2 border rounded bg-white hover:bg-slate-50 disabled:opacity-50"><ChevronRight size={16}/></button>
                </div>
            </div>
        </div>
    </div>
  );
};`;
      return { name: `${compName}.tsx`, path: `${root}/src/pages/queries/${compName}.tsx`, content, language: 'typescript' };
  } else {
      // 3b. Update/Action Queries (Update Data from file)
      const q = query as any;
      const targetTable = tables.find(t => t.id === q.targetTableId);
      const targetTableName = targetTable ? targetTable.name : 'TargetTable';
      const targetTableCamel = targetTable ? toCamelCase(targetTable.name) : 'targetTable';
      const matchFieldName = q.matchField || 'id';
      
      const content = `import React, { useState } from 'react';
import { get, put } from '../../services/api';
import { Upload, RefreshCw, CheckCircle, AlertTriangle, ArrowLeft, Loader2, HelpCircle } from 'lucide-react';
import * as XLSX from 'xlsx';

export const ${compName} = () => {
  const [file, setFile] = useState<File | null>(null);
  const [parsedData, setParsedData] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState({ current: 0, total: 0 });
  const [result, setResult] = useState<{ success: number, failed: number } | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      setFile(selectedFile);
      setError(null);
      setResult(null);

      const reader = new FileReader();
      reader.onload = (evt) => {
        try {
          const content = evt.target?.result;
          if (!content) throw new Error('Datei konnte nicht gelesen werden.');

          let items: any[] = [];
          const name = selectedFile.name.toLowerCase();

          if (name.endsWith('.json')) {
            const parsed = JSON.parse(content as string);
            items = Array.isArray(parsed) ? parsed : [parsed];
          } else if (name.endsWith('.xlsx') || name.endsWith('.xls') || name.endsWith('.csv')) {
            const workbook = XLSX.read(content, { type: name.endsWith('.xlsx') || name.endsWith('.xls') ? 'binary' : 'string' });
            const sheet = workbook.Sheets[workbook.SheetNames[0]];
            items = XLSX.utils.sheet_to_json(sheet);
          } else if (name.endsWith('.xml')) {
            const parser = new DOMParser();
            const xmlDoc = parser.parseFromString(content as string, "text/xml");
            const rows = xmlDoc.getElementsByTagName("row") || xmlDoc.getElementsByTagName("record");
            for (let i = 0; i < rows.length; i++) {
              const node = rows[i];
              if (node.nodeType === 1) {
                const obj: any = {};
                node.childNodes.forEach(child => {
                  if (child.nodeType === 1) obj[child.nodeName] = child.textContent;
                });
                if (Object.keys(obj).length > 0) items.push(obj);
              }
            }
          }

          if (items.length === 0) throw new Error('Keine Datensätze gefunden.');
          setParsedData(items);
        } catch (err: any) {
          setError('Fehler beim Lesen der Datei: ' + (err.message || err));
        }
      };

      if (selectedFile.name.endsWith('.xlsx') || selectedFile.name.endsWith('.xls')) {
        reader.readAsBinaryString(selectedFile);
      } else {
        reader.readAsText(selectedFile);
      }
    }
  };

  const executeUpdate = async () => {
    if (parsedData.length === 0) return;
    setLoading(true);
    setError(null);
    setResult(null);
    setProgress({ current: 0, total: parsedData.length });

    const mapping: Record<string, string> = ${JSON.stringify(q.mapping || {})};
    const matchField = "${matchFieldName}";
    let successCount = 0;
    let failedCount = 0;

    try {
      // 1. Fetch all existing records to find matching keys
      const existingRes = await get('${targetTableCamel}', 1, 10000);
      const existingList = existingRes.data || existingRes;

      for (let i = 0; i < parsedData.length; i++) {
        const importRow = parsedData[i];
        
        // Find mapped imported key column
        const mappedColName = mapping[matchField] || matchField;
        const importKeyVal = String(importRow[mappedColName] || '').trim().toLowerCase();

        if (!importKeyVal) {
          failedCount++;
          setProgress(p => ({ ...p, current: i + 1 }));
          continue;
        }

        // Find existing record in the target table
        const matchRecord = existingList.find((dbRow: any) => {
          const dbVal = String(dbRow[matchField] || '').trim().toLowerCase();
          return dbVal === importKeyVal;
        });

        if (matchRecord) {
          // Apply mapping rules
          const updatedRecord = { ...matchRecord };
          Object.entries(mapping).forEach(([targetField, fileCol]) => {
            if (targetField === matchField) return; // Skip primary key update
            if (importRow[fileCol] !== undefined) {
              updatedRecord[targetField] = importRow[fileCol];
            }
          });

          // Send update PUT request
          try {
            await put(\`${targetTableCamel}/\${matchRecord.id}\`, updatedRecord);
            successCount++;
          } catch (e) {
            failedCount++;
          }
        } else {
          failedCount++;
        }

        setProgress(p => ({ ...p, current: i + 1 }));
      }

      setResult({ success: successCount, failed: failedCount });
    } catch (err: any) {
      setError('Verbindungsfehler oder ungültige Server-Antwort.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-4 sm:p-8">
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg border border-slate-200 dark:border-slate-700 overflow-hidden">
        
        {/* Header */}
        <div className="p-6 border-b border-slate-100 dark:border-slate-700 bg-gradient-to-r from-blue-700 to-indigo-700 text-white flex justify-between items-center">
          <div>
            <h1 className="text-xl font-bold flex items-center gap-2">
              <RefreshCw size={20} className={loading ? 'animate-spin' : ''}/> ${q.name}
            </h1>
            <p className="text-blue-100 text-xs mt-1">Aktualisierungsabfrage für Tabelle: ${targetTableName}</p>
          </div>
        </div>

        <div className="p-6 space-y-6">
          
          {/* File Upload zone */}
          <div className="border-2 border-dashed border-slate-300 dark:border-slate-600 rounded-lg p-8 text-center bg-slate-50 dark:bg-slate-900/30">
            <input 
              type="file" 
              id="file-import-input" 
              className="hidden" 
              accept=".csv, .xlsx, .xls, .xml, .json"
              onChange={handleFileChange}
              disabled={loading}
            />
            <button 
              onClick={() => document.getElementById('file-import-input')?.click()}
              className="px-6 py-3 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg shadow-sm font-semibold text-slate-700 dark:text-slate-200 text-sm inline-flex items-center gap-2 transition-colors disabled:opacity-50"
              disabled={loading}
            >
              Datei auswählen
            </button>
            <p className="text-xs text-slate-400 mt-2">Excel (.xlsx), CSV (.csv), XML (.xml) oder JSON (.json)</p>
            {file && (
              <p className="text-sm font-bold text-blue-600 dark:text-blue-400 mt-4">
                Ausgewählte Datei: {file.name} ({parsedData.length} Datensätze gefunden)
              </p>
            )}
          </div>

          {/* Error notification */}
          {error && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-800 dark:text-red-300 p-4 rounded-lg flex items-start gap-3">
              <AlertTriangle className="shrink-0 mt-0.5" size={18}/>
              <p className="text-sm">{error}</p>
            </div>
          )}

          {/* Loading Progress Bar */}
          {loading && (
            <div className="space-y-2 bg-slate-50 dark:bg-slate-900/50 p-4 rounded-lg border">
              <div className="flex justify-between items-center text-xs text-slate-500 font-bold">
                <span className="flex items-center gap-1.5"><Loader2 size={14} className="animate-spin"/> Daten werden aktualisiert...</span>
                <span>{progress.current} / {progress.total} ({Math.round((progress.current / progress.total) * 100)}%)</span>
              </div>
              <div className="w-full bg-slate-200 dark:bg-slate-700 h-2 rounded-full overflow-hidden">
                <div className="bg-indigo-600 h-full transition-all duration-150" style={{ width: \`\${(progress.current / progress.total) * 100}%\` }}></div>
              </div>
            </div>
          )}

          {/* Results summary */}
          {result && (
            <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-5 space-y-3">
              <h3 className="font-bold text-green-800 dark:text-green-300 flex items-center gap-2">
                <CheckCircle size={20}/> Abfrage erfolgreich abgeschlossen!
              </h3>
              <div className="grid grid-cols-2 gap-4 text-sm font-mono bg-white dark:bg-slate-900/50 p-4 rounded border dark:border-slate-800">
                <div className="text-green-700 dark:text-green-400 font-bold">Erfolgreich aktualisiert: {result.success}</div>
                <div className="text-slate-500">Nicht gefunden/Fehler: {result.failed}</div>
              </div>
            </div>
          )}

          {/* Info Card */}
          <div className="bg-blue-50 dark:bg-blue-900/10 border border-blue-200 dark:border-blue-900 rounded-lg p-4 flex gap-3 text-sm text-blue-800 dark:text-blue-300 leading-relaxed">
            <HelpCircle className="shrink-0 mt-0.5 text-blue-500" size={18}/>
            <div>
              <strong>Hinweise zum Abgleich:</strong>
              <p className="text-xs mt-1 text-blue-700 dark:text-blue-400">
                Die Spalte für den Abgleich ist auf <strong>"${matchFieldName}"</strong> konfiguriert. Datensätze aus Ihrer Import-Datei, die keine Entsprechung in der Tabelle haben, werden übersprungen.
              </p>
            </div>
          </div>

        </div>

        {/* Action Button */}
        <div className="p-4 bg-slate-50 dark:bg-slate-900/50 border-t border-slate-100 dark:border-slate-700 flex justify-end">
          <button
            onClick={executeUpdate}
            disabled={parsedData.length === 0 || loading}
            className="px-6 py-2.5 bg-gradient-to-r from-blue-700 to-indigo-700 hover:from-blue-600 hover:to-indigo-600 disabled:opacity-50 text-white rounded-lg text-sm font-bold flex items-center gap-1.5 shadow"
          >
            {loading ? <Loader2 size={16} className="animate-spin" /> : <RefreshCw size={16} />} Aktualisierung starten
          </button>
        </div>

      </div>
    </div>
  );
};`;
      return { name: `${compName}.tsx`, path: `${root}/src/pages/queries/${compName}.tsx`, content, language: 'typescript' };
  }
};
