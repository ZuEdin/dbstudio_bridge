import React, { useState } from 'react';
import { Table } from '../../../types/index';
import { OpenApiSpec } from '../openApiTypes';
import { Play, ChevronDown, ChevronRight, Copy, Check, Send, AlertCircle, Database } from 'lucide-react';
import { executeInBrowserMockRequest, MockServerResponse } from '../mockServerService';
import { generateCurlCommand } from '../openApiGeneratorService';

interface OpenApiSwaggerUiProps {
  spec: OpenApiSpec;
  tables: Table[];
  updateTable: (table: Table) => void;
  latencyMs: number;
  onLogGenerated: (log: any) => void;
}

export const OpenApiSwaggerUi: React.FC<OpenApiSwaggerUiProps> = ({
  spec,
  tables,
  updateTable,
  latencyMs,
  onLogGenerated
}) => {
  const [expandedEndpoints, setExpandedEndpoints] = useState<Record<string, boolean>>({});
  const [tryOutParams, setTryOutParams] = useState<Record<string, { id?: string; query?: string; body?: string }>>({});
  const [endpointResponses, setEndpointResponses] = useState<Record<string, MockServerResponse | null>>({});
  const [loadingMap, setLoadingMap] = useState<Record<string, boolean>>({});
  const [copiedCurl, setCopiedCurl] = useState<string | null>(null);

  const toggleEndpoint = (key: string, defaultBody?: any) => {
    setExpandedEndpoints(prev => ({ ...prev, [key]: !prev[key] }));
    if (!tryOutParams[key] && defaultBody) {
      setTryOutParams(prev => ({
        ...prev,
        [key]: { body: JSON.stringify(defaultBody, null, 2), id: '1', query: '' }
      }));
    }
  };

  const handleExecute = async (key: string, method: 'GET' | 'POST' | 'PUT' | 'DELETE', rawPath: string) => {
    setLoadingMap(prev => ({ ...prev, [key]: true }));

    const params = tryOutParams[key] || {};
    let resolvedPath = rawPath;
    if (resolvedPath.includes('{id}')) {
      resolvedPath = resolvedPath.replace('{id}', params.id || '1');
    }
    if (params.query) {
      resolvedPath += (resolvedPath.includes('?') ? '&' : '?') + params.query;
    }

    let parsedBody: any = undefined;
    if (params.body && (method === 'POST' || method === 'PUT')) {
      try {
        parsedBody = JSON.parse(params.body);
      } catch (e) {
        parsedBody = { error: 'Invalid JSON' };
      }
    }

    try {
      const { response, log } = await executeInBrowserMockRequest(
        method,
        resolvedPath,
        tables,
        updateTable,
        parsedBody,
        latencyMs
      );
      setEndpointResponses(prev => ({ ...prev, [key]: response }));
      onLogGenerated(log);
    } catch (err: any) {
      setEndpointResponses(prev => ({
        ...prev,
        [key]: {
          status: 500,
          statusText: 'Internal Error',
          headers: {},
          data: { error: err?.message || 'Execution error' },
          durationMs: 0
        }
      }));
    } finally {
      setLoadingMap(prev => ({ ...prev, [key]: false }));
    }
  };

  const handleCopyCurl = (key: string, method: string, path: string) => {
    const params = tryOutParams[key] || {};
    let resolvedPath = path.replace('{id}', params.id || '1');
    let bodyObj = undefined;
    if (params.body) {
      try { bodyObj = JSON.parse(params.body); } catch (e) {}
    }
    const curl = generateCurlCommand(method, resolvedPath, bodyObj);
    navigator.clipboard.writeText(curl);
    setCopiedCurl(key);
    setTimeout(() => setCopiedCurl(null), 2000);
  };

  return (
    <div className="space-y-6">
      {tables.map(table => {
        const tableName = table.name.toLowerCase();
        const routes = [
          { method: 'GET' as const, path: `/api/v1/${tableName}`, desc: `Alle ${table.name} abrufen (Paginierung & Suche)` },
          { method: 'POST' as const, path: `/api/v1/${tableName}`, desc: `Neuen Datensatz in ${table.name} erstellen` },
          { method: 'GET' as const, path: `/api/v1/${tableName}/{id}`, desc: `Einzelnen Datensatz aus ${table.name} nach ID abrufen` },
          { method: 'PUT' as const, path: `/api/v1/${tableName}/{id}`, desc: `Datensatz in ${table.name} nach ID aktualisieren` },
          { method: 'DELETE' as const, path: `/api/v1/${tableName}/{id}`, desc: `Datensatz aus ${table.name} nach ID löschen` }
        ];

        return (
          <div key={table.id} className="bg-slate-50 dark:bg-slate-900/60 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-2xs">
            {/* Table Header Tag */}
            <div className="bg-slate-100 dark:bg-slate-800/80 px-4 py-3 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Database size={16} className="text-indigo-600 dark:text-indigo-400" />
                <h3 className="font-extrabold text-sm text-slate-800 dark:text-slate-200">{table.name}</h3>
                <span className="text-[10px] bg-indigo-100 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 font-bold px-2 py-0.5 rounded-full border border-indigo-200 dark:border-indigo-800">
                  {table.data?.length || 0} Datensätze in DB
                </span>
              </div>
              <span className="text-xs text-slate-400 font-mono">/api/v1/{tableName}</span>
            </div>

            {/* Endpoints List */}
            <div className="p-3 space-y-2.5">
              {routes.map(r => {
                const key = `${r.method}_${r.path}`;
                const isExpanded = !!expandedEndpoints[key];
                const res = endpointResponses[key];
                const isLoading = !!loadingMap[key];

                let methodBadge = 'bg-blue-600 text-white';
                let borderTheme = 'border-blue-200 dark:border-blue-900/40 bg-blue-50/20';
                if (r.method === 'POST') {
                  methodBadge = 'bg-emerald-600 text-white';
                  borderTheme = 'border-emerald-200 dark:border-emerald-900/40 bg-emerald-50/20';
                } else if (r.method === 'PUT') {
                  methodBadge = 'bg-amber-600 text-white';
                  borderTheme = 'border-amber-200 dark:border-amber-900/40 bg-amber-50/20';
                } else if (r.method === 'DELETE') {
                  methodBadge = 'bg-rose-600 text-white';
                  borderTheme = 'border-rose-200 dark:border-rose-900/40 bg-rose-50/20';
                }

                return (
                  <div key={key} className={`rounded-xl border transition-all ${borderTheme}`}>
                    {/* Endpoint Header Bar */}
                    <div
                      onClick={() => toggleEndpoint(key, table.data?.[0] || {})}
                      className="p-3 flex items-center justify-between cursor-pointer hover:bg-white/40 dark:hover:bg-slate-800/40 select-none"
                    >
                      <div className="flex items-center gap-3">
                        <span className={`px-2.5 py-0.5 rounded-md text-[11px] font-black tracking-wider ${methodBadge}`}>
                          {r.method}
                        </span>
                        <span className="font-mono text-xs font-bold text-slate-800 dark:text-slate-200">{r.path}</span>
                        <span className="text-xs text-slate-500 hidden md:inline">{r.desc}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        {isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                      </div>
                    </div>

                    {/* Collapsible Test Console ("Try it out") */}
                    {isExpanded && (
                      <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-4">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <span className="text-xs font-extrabold uppercase tracking-wider text-slate-400">Interaktive Test-Konsole (Try it out)</span>
                          <button
                            onClick={() => handleCopyCurl(key, r.method, r.path)}
                            className="flex items-center gap-1 text-[11px] text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded border"
                          >
                            {copiedCurl === key ? <Check size={12} className="text-emerald-500" /> : <Copy size={12} />}
                            <span>cURL kopieren</span>
                          </button>
                        </div>

                        {/* Parameter Controls */}
                        {r.path.includes('{id}') && (
                          <div>
                            <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 mb-1">
                              ID Parameter:
                            </label>
                            <input
                              type="text"
                              value={tryOutParams[key]?.id || '1'}
                              onChange={e => setTryOutParams(prev => ({
                                ...prev,
                                [key]: { ...prev[key], id: e.target.value }
                              }))}
                              className="w-48 text-xs font-mono p-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                              placeholder="1"
                            />
                          </div>
                        )}

                        {r.method === 'GET' && !r.path.includes('{id}') && (
                          <div>
                            <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 mb-1">
                              Query Parameter (z. B. limit=10&search=Linz):
                            </label>
                            <input
                              type="text"
                              value={tryOutParams[key]?.query || ''}
                              onChange={e => setTryOutParams(prev => ({
                                ...prev,
                                [key]: { ...prev[key], query: e.target.value }
                              }))}
                              className="w-full text-xs font-mono p-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                              placeholder="limit=20&search="
                            />
                          </div>
                        )}

                        {(r.method === 'POST' || r.method === 'PUT') && (
                          <div>
                            <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 mb-1">
                              Request JSON Body:
                            </label>
                            <textarea
                              rows={4}
                              value={tryOutParams[key]?.body || '{\n}'}
                              onChange={e => setTryOutParams(prev => ({
                                ...prev,
                                [key]: { ...prev[key], body: e.target.value }
                              }))}
                              className="w-full text-xs font-mono p-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                            />
                          </div>
                        )}

                        {/* Execute Button */}
                        <div className="flex justify-end">
                          <button
                            disabled={isLoading}
                            onClick={() => handleExecute(key, r.method, r.path)}
                            className="flex items-center gap-1.5 px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-xl text-xs font-extrabold shadow-2xs transition-all"
                          >
                            <Send size={12} />
                            <span>{isLoading ? 'Ausführen...' : 'Aufruf ausführen (Execute)'}</span>
                          </button>
                        </div>

                        {/* Response Inspector */}
                        {res && (
                          <div className="space-y-2 pt-2 border-t border-slate-200 dark:border-slate-800">
                            <div className="flex items-center justify-between text-xs">
                              <span className="font-extrabold text-slate-600 dark:text-slate-300">Server Response:</span>
                              <div className="flex items-center gap-2">
                                <span className={`px-2 py-0.5 rounded font-mono font-bold text-[11px] ${
                                  res.status < 300 ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300' : 'bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300'
                                }`}>
                                  Status: {res.status} {res.statusText}
                                </span>
                                <span className="text-slate-400 font-mono text-[10px]">{res.durationMs}ms</span>
                              </div>
                            </div>
                            <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 text-emerald-400 font-mono text-xs overflow-x-auto max-h-48 shadow-inner">
                              <pre>{JSON.stringify(res.data, null, 2)}</pre>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
};
