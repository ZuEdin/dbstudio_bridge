import React, { useState, useMemo } from 'react';
import { Table } from '../../types/index';
import { generateOpenApiSpec } from './openApiGeneratorService';
import { OpenApiSwaggerUi } from './components/OpenApiSwaggerUi';
import { InBrowserMockConsole } from './components/InBrowserMockConsole';
import { ApiExportDrawer } from './components/ApiExportDrawer';
import { MockApiLog } from './openApiTypes';
import { X, Globe, Radio, Download, Activity, Code } from 'lucide-react';

interface OpenApiMockServerModalProps {
  tables: Table[];
  updateTable: (table: Table) => void;
  onClose: () => void;
}

export const OpenApiMockServerModal: React.FC<OpenApiMockServerModalProps> = ({
  tables,
  updateTable,
  onClose
}) => {
  const [activeTab, setActiveTab] = useState<'swagger' | 'console' | 'export'>('swagger');
  const [logs, setLogs] = useState<MockApiLog[]>([]);
  const [latencyMs, setLatencyMs] = useState<number>(80);

  const spec = useMemo(() => {
    return generateOpenApiSpec(tables);
  }, [tables]);

  const handleLogGenerated = (log: MockApiLog) => {
    setLogs(prev => [log, ...prev.slice(0, 49)]); // Keep last 50 logs
  };

  return (
    <div className="fixed inset-0 bg-black/60 z-[150] flex items-center justify-center p-4 animate-in fade-in backdrop-blur-xs">
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-5xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col h-[780px]">
        
        {/* Header */}
        <div className="bg-slate-900 text-white p-4.5 flex justify-between items-center shrink-0 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="bg-emerald-500/20 p-2.5 rounded-xl border border-emerald-500/30">
              <Globe className="text-emerald-400 w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-black tracking-tight">OpenAPI 3.1 & In-Browser Mock Server</h2>
                <span className="bg-emerald-900/60 text-emerald-300 text-[10px] font-bold px-2 py-0.5 rounded-full border border-emerald-700">
                  Live Mocking Aktiv
                </span>
                <span className="bg-slate-800 text-slate-300 text-[10px] font-bold px-2 py-0.5 rounded-full border border-slate-700">
                  {tables.length} Entitäten
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Interaktive Swagger-Dokumentation mit Live-REST-Mocking gegen die echte In-Memory Datenbank.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="bg-slate-50 dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800 px-6 pt-3 flex items-center justify-between shrink-0">
          <div className="flex gap-2">
            <button
              onClick={() => setActiveTab('swagger')}
              className={`flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-t-xl transition-all border-t border-x ${
                activeTab === 'swagger'
                  ? 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-emerald-600 dark:text-emerald-400 shadow-2xs'
                  : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'
              }`}
            >
              <Code size={13} />
              <span>Swagger API Explorer</span>
            </button>
            <button
              onClick={() => setActiveTab('console')}
              className={`flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-t-xl transition-all border-t border-x ${
                activeTab === 'console'
                  ? 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-emerald-600 dark:text-emerald-400 shadow-2xs'
                  : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'
              }`}
            >
              <Activity size={13} />
              <span>Mock Server Logs & Latenz</span>
              {logs.length > 0 && (
                <span className="bg-emerald-100 text-emerald-800 text-[10px] px-1.5 py-0.2 rounded-full font-extrabold">
                  {logs.length}
                </span>
              )}
            </button>
            <button
              onClick={() => setActiveTab('export')}
              className={`flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-t-xl transition-all border-t border-x ${
                activeTab === 'export'
                  ? 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-emerald-600 dark:text-emerald-400 shadow-2xs'
                  : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'
              }`}
            >
              <Download size={13} />
              <span>Postman & cURL Export</span>
            </button>
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 p-6 overflow-y-auto bg-white dark:bg-slate-900">
          {activeTab === 'swagger' && (
            <OpenApiSwaggerUi
              spec={spec}
              tables={tables}
              updateTable={updateTable}
              latencyMs={latencyMs}
              onLogGenerated={handleLogGenerated}
            />
          )}

          {activeTab === 'console' && (
            <InBrowserMockConsole
              logs={logs}
              onClearLogs={() => setLogs([])}
              latencyMs={latencyMs}
              setLatencyMs={setLatencyMs}
            />
          )}

          {activeTab === 'export' && (
            <ApiExportDrawer spec={spec} tables={tables} />
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-slate-50 dark:bg-slate-950 border-t border-slate-200 dark:border-slate-800 flex justify-between items-center shrink-0">
          <div className="text-xs text-slate-500 flex items-center gap-2">
            <Radio size={13} className="text-emerald-500 animate-pulse" />
            <span>Mock Server läuft autark in diesem Browser-Tab (IndexedDB / State-Backed)</span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white text-xs font-bold rounded-xl shadow-2xs transition-colors"
          >
            Schließen
          </button>
        </div>

      </div>
    </div>
  );
};
