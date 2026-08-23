import React, { useState } from 'react';
import { 
  Sparkles, 
  Database, 
  Search, 
  Zap, 
  X, 
  ArrowRight
} from 'lucide-react';
import { Table, Relationship, Query } from '../../types/index';
import { useProjectStore } from '../../stores/useProjectStore';
import { useUIStore } from '../../stores/useUIStore';
import { SCHEMA_PRESETS, QUERY_PRESETS, SchemaPreset, QueryPreset } from './copilotData';
import { SchemaCopilotTab } from './components/SchemaCopilotTab';
import { QueryCopilotTab } from './components/QueryCopilotTab';
import { OptimizerCopilotTab } from './components/OptimizerCopilotTab';

interface AiSchemaQueryCopilotModalProps {
  onClose: () => void;
  initialTab?: 'schema' | 'query' | 'optimizer';
  initialPrompt?: string;
  onSetView?: (view: any) => void;
}

export const AiSchemaQueryCopilotModal: React.FC<AiSchemaQueryCopilotModalProps> = ({
  onClose,
  initialTab = 'schema',
  onSetView
}) => {
  const [activeTab, setActiveTab] = useState<'schema' | 'query' | 'optimizer'>(initialTab);
  const [selectedSchemaPreset, setSelectedSchemaPreset] = useState<SchemaPreset>(SCHEMA_PRESETS[0]);
  const [selectedQueryPreset, setSelectedQueryPreset] = useState<QueryPreset>(QUERY_PRESETS[0]);

  const store = useProjectStore();
  const ui = useUIStore();

  const handleApplySchema = () => {
    const existingTableNames = new Set(store.tables.map(t => t.name.toLowerCase()));
    let addedCount = 0;

    selectedSchemaPreset.tables.forEach(tableData => {
      if (!existingTableNames.has(tableData.name?.toLowerCase() || '')) {
        store.addTable(tableData as Table);
        addedCount++;
      }
    });

    const updatedRels = [...store.relationships];
    selectedSchemaPreset.relationships.forEach(rel => {
      const alreadyExists = updatedRels.some(
        r => r.fromTable === rel.fromTable && r.fromField === rel.fromField && r.toTable === rel.toTable
      );
      if (!alreadyExists) {
        updatedRels.push(rel as Relationship);
      }
    });
    store.setRelationships(updatedRels);

    ui.addToast(`AI-Schema übernommen: ${addedCount} Tabellen & Relationen integriert!`, 'success');
    onClose();
    if (onSetView) {
      onSetView({ type: 'relationships' });
    }
  };

  const handleApplyQuery = () => {
    const newQuery: Query = {
      id: `ai_query_${Date.now()}`,
      name: `AI: ${selectedQueryPreset.title.replace(/[^a-zA-Z0-9 _-]/g, '').slice(0, 30)}`,
      type: 'SELECT',
      nodes: [
        { id: 'node_1', tableId: 'tbl_kunden', x: 50, y: 50 }
      ],
      columns: selectedQueryPreset.columns.map((col, idx) => ({
        id: `col_${idx}`,
        tableId: 'tbl_kunden',
        fieldId: `fld_${col}`,
        tableName: 'kunden',
        fieldName: col,
        sort: idx === 0 ? 'ASC' : '',
        show: true,
        criteria: []
      }))
    };

    store.setQueries([...store.queries, newQuery]);
    ui.addToast(`Abfrage "${newQuery.name}" erfolgreich erstellt!`, 'success');
    onClose();
    if (onSetView) {
      onSetView({ type: 'query_designer', queryId: newQuery.id });
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 max-w-4xl w-full flex flex-col max-h-[90vh] overflow-hidden animate-in zoom-in-95 duration-150">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-950 text-white p-5 flex items-center justify-between border-b border-slate-700/80 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-600/30 border border-indigo-400/30 flex items-center justify-center text-indigo-300 shadow-md">
              <Sparkles size={20} className="animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-extrabold text-base text-white tracking-tight">AI Schema- & Query-Copilot</h2>
                <span className="bg-amber-500/20 text-amber-300 text-[10px] font-bold px-2 py-0.5 rounded-full border border-amber-400/30">
                  Offline-Architektur & Presets
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-0.5">
                Modellierung von relationalen Schemata, komplexen Abfragen & Performance-Analysen
              </p>
            </div>
          </div>

          <button 
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="bg-slate-100 dark:bg-slate-850 px-5 pt-2 border-b border-slate-200 dark:border-slate-800 flex gap-2 shrink-0">
          <button
            onClick={() => setActiveTab('schema')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-t-xl text-xs font-bold transition-all border-t-2 ${
              activeTab === 'schema'
                ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 border-indigo-600 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 border-transparent hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Database size={14} />
            <span>1. Schema-Copilot (Natural Language zu DB)</span>
          </button>

          <button
            onClick={() => setActiveTab('query')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-t-xl text-xs font-bold transition-all border-t-2 ${
              activeTab === 'query'
                ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 border-indigo-600 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 border-transparent hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Search size={14} />
            <span>2. Query-Copilot (Natural Language zu Abfrage)</span>
          </button>

          <button
            onClick={() => setActiveTab('optimizer')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-t-xl text-xs font-bold transition-all border-t-2 ${
              activeTab === 'optimizer'
                ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 border-indigo-600 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 border-transparent hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Zap size={14} />
            <span>3. SQL Explainer & Optimizer</span>
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 bg-white dark:bg-slate-900">
          {activeTab === 'schema' && (
            <SchemaCopilotTab 
              selectedPreset={selectedSchemaPreset}
              onSelectPreset={setSelectedSchemaPreset}
            />
          )}

          {activeTab === 'query' && (
            <QueryCopilotTab 
              selectedPreset={selectedQueryPreset}
              onSelectPreset={setSelectedQueryPreset}
            />
          )}

          {activeTab === 'optimizer' && (
            <OptimizerCopilotTab />
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-4 bg-slate-50 dark:bg-slate-850 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between shrink-0">
          <div className="text-[11px] text-slate-500 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            <span>Vorbereitete Vorlagen sofort integrierbar</span>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-slate-200 hover:bg-slate-300 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 text-xs font-bold rounded-xl transition-colors"
            >
              Schließen
            </button>

            {activeTab === 'schema' && (
              <button
                onClick={handleApplySchema}
                className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-extrabold rounded-xl shadow-md shadow-indigo-600/30 transition-all flex items-center gap-1.5"
              >
                <span>Schema in Projekt übernehmen</span>
                <ArrowRight size={13} />
              </button>
            )}

            {activeTab === 'query' && (
              <button
                onClick={handleApplyQuery}
                className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-extrabold rounded-xl shadow-md shadow-indigo-600/30 transition-all flex items-center gap-1.5"
              >
                <span>Abfrage im Designer öffnen</span>
                <ArrowRight size={13} />
              </button>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};
