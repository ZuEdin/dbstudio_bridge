import React, { useState } from 'react';
import { Table } from '../../../types/index';
import { OpenApiSpec } from '../openApiTypes';
import { generatePostmanCollection } from '../openApiGeneratorService';
import { Download, Copy, Check, FileJson, Send, Terminal } from 'lucide-react';

interface ApiExportDrawerProps {
  spec: OpenApiSpec;
  tables: Table[];
}

export const ApiExportDrawer: React.FC<ApiExportDrawerProps> = ({ spec, tables }) => {
  const [activeTab, setActiveTab] = useState<'openapi_json' | 'postman' | 'curl_all'>('openapi_json');
  const [copied, setCopied] = useState(false);

  const postman = generatePostmanCollection(tables);

  const allCurls = tables.map(t => {
    const tableName = t.name.toLowerCase();
    return `# =========================================
# Endpunkte für ${t.name}
# =========================================

# 1. Alle ${t.name} abrufen (GET)
curl -X GET "http://localhost:3000/api/v1/${tableName}?limit=20" \\
  -H "Accept: application/json"

# 2. ${t.name} nach ID abrufen (GET)
curl -X GET "http://localhost:3000/api/v1/${tableName}/1" \\
  -H "Accept: application/json"

# 3. Neuen Datensatz in ${t.name} erstellen (POST)
curl -X POST "http://localhost:3000/api/v1/${tableName}" \\
  -H "Content-Type: application/json" \\
  -d '{"name": "Beispiel", "aktiv": true}'

# 4. Datensatz in ${t.name} löschen (DELETE)
curl -X DELETE "http://localhost:3000/api/v1/${tableName}/1"
`;
  }).join('\n\n');

  const getContent = () => {
    switch (activeTab) {
      case 'openapi_json':
        return {
          code: JSON.stringify(spec, null, 2),
          filename: 'openapi_3.1.json',
          type: 'application/json'
        };
      case 'postman':
        return {
          code: JSON.stringify(postman, null, 2),
          filename: 'postman_collection.json',
          type: 'application/json'
        };
      case 'curl_all':
        return {
          code: allCurls,
          filename: 'api_requests.sh',
          type: 'text/x-sh'
        };
    }
  };

  const current = getContent();

  const handleCopy = () => {
    navigator.clipboard.writeText(current.code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const blob = new Blob([current.code], { type: `${current.type};charset=utf-8` });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = current.filename;
    link.click();
  };

  return (
    <div className="space-y-4">
      {/* Top Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 dark:border-slate-800 pb-3">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab('openapi_json')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              activeTab === 'openapi_json'
                ? 'bg-indigo-600 text-white shadow-2xs'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
            }`}
          >
            <FileJson size={13} />
            <span>OpenAPI 3.1 (JSON)</span>
          </button>
          <button
            onClick={() => setActiveTab('postman')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              activeTab === 'postman'
                ? 'bg-orange-600 text-white shadow-2xs'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
            }`}
          >
            <Send size={13} />
            <span>Postman v2.1 Collection</span>
          </button>
          <button
            onClick={() => setActiveTab('curl_all')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              activeTab === 'curl_all'
                ? 'bg-emerald-600 text-white shadow-2xs'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
            }`}
          >
            <Terminal size={13} />
            <span>cURL Skripte (.sh)</span>
          </button>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleCopy}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-white dark:bg-slate-800 hover:bg-slate-50 border border-slate-300 dark:border-slate-700 rounded-lg text-xs font-bold shadow-2xs transition-all text-slate-700 dark:text-slate-200"
          >
            {copied ? <Check size={13} className="text-emerald-500" /> : <Copy size={13} />}
            <span>{copied ? 'Kopiert!' : 'Kopieren'}</span>
          </button>
          <button
            onClick={handleDownload}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold shadow-2xs transition-all"
          >
            <Download size={13} />
            <span>Download ({current.filename})</span>
          </button>
        </div>
      </div>

      {/* Code Display */}
      <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 text-emerald-400 font-mono text-xs overflow-x-auto max-h-[380px] shadow-inner">
        <pre>{current.code}</pre>
      </div>
    </div>
  );
};
