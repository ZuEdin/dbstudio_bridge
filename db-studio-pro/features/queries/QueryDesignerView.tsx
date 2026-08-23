

import React, { useState, useEffect } from 'react';
import { Canvas } from '../../components/Canvas';
import { QueryGrid } from './components/QueryGrid';
import { TableNode, Table, Relationship, Query, QueryColumn, SelectQuery, DbType, Form } from '../../types/index';
import { Calculator, Sigma, Sparkles, Play, Database, Wand2, Loader2, Check, HelpCircle, X, Terminal, Code } from 'lucide-react';
import { generateSqlSelect } from '../../utils/sqlHelper';
import { AccessSqlConverterModal } from '../tools/AccessSqlConverterModal';
import { useUIStore } from '../../stores/useUIStore';

interface QueryDesignerViewProps {
  query: Query;
  onQueryChange: (query: Query) => void;
  tables: Table[];
  forms?: Form[];
  queries?: Query[];
  relationships: Relationship[];
  dbType: DbType;
}

export const QueryDesignerView: React.FC<QueryDesignerViewProps> = ({
  query,
  onQueryChange,
  tables,
  forms = [],
  queries = [],
  relationships,
  dbType,
}) => {
  const ui = useUIStore();

  if (query.type !== 'SELECT') {
    const actionQuery = query as any;
    
    const handleExecuteAction = () => {
        // Find the table and modify data in the store
        // We will call an execution helper or just show a message that it requires generation
        alert('Action-Abfragen können aktuell im Editor nur gespeichert werden. Im generierten Code stehen sie als API-Endpunkt (/api/actions/' + (actionQuery.name).replace(/\s+/g, '') + ') zur Verfügung.');
    };

    return (
      <div className="flex-1 flex flex-col bg-slate-50 p-8 items-center justify-center">
        <div className="bg-white rounded-xl shadow-lg border border-slate-200 p-8 max-w-xl w-full text-center">
            <div className="w-16 h-16 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <Play size={32}/>
            </div>
            <h2 className="text-2xl font-bold text-slate-800 mb-2">{actionQuery.name}</h2>
            <p className="text-slate-500 mb-6">
                Typ: <span className="font-semibold text-blue-600">{actionQuery.type}</span>
            </p>
            <div className="bg-slate-50 p-4 rounded text-left border border-slate-200 mb-8 space-y-2 text-sm">
                {actionQuery.type === 'INSERT' && (
                    <>
                        <div><span className="font-bold">Quelltabelle:</span> {tables.find(t => t.id === actionQuery.sourceTableId)?.name}</div>
                        <div><span className="font-bold">Zieltabelle:</span> {tables.find(t => t.id === actionQuery.targetTableId)?.name}</div>
                    </>
                )}
                {actionQuery.type === 'UPDATE' && (
                    <>
                        <div><span className="font-bold">Zieltabelle:</span> {tables.find(t => t.id === actionQuery.targetTableId)?.name}</div>
                        <div><span className="font-bold">Aktualisierungen:</span> {Object.keys(actionQuery.updateMap || {}).length} Felder</div>
                        <div><span className="font-bold">Kriterien:</span> {actionQuery.criteria?.length || 0}</div>
                    </>
                )}
                {actionQuery.type === 'DELETE' && (
                    <>
                        <div><span className="font-bold">Zieltabelle:</span> {tables.find(t => t.id === actionQuery.targetTableId)?.name}</div>
                        <div><span className="font-bold">Kriterien:</span> {actionQuery.criteria?.length || 0}</div>
                    </>
                )}
            </div>
            
            <button 
                onClick={handleExecuteAction}
                className="bg-blue-600 text-white px-6 py-3 rounded-lg font-bold shadow-md hover:bg-blue-700 flex items-center gap-2 mx-auto"
            >
                <Database size={18}/> Code-Integration Info
            </button>
        </div>
      </div>
    );
  }

  
  const [showTotals, setShowTotals] = useState(query.columns.some(c => c.aggregate));
  const [generatedSql, setGeneratedSql] = useState('');
  const { nodes, columns: queryColumns } = query;

  // Custom SQL Override
  const [overrideSql, setOverrideSql] = useState('');
  
  useEffect(() => {
    if (queryColumns.length === 0 || nodes.length === 0) {
      setGeneratedSql('Ziehen Sie Felder in den Grid, um eine Abfrage zu erstellen.');
    } else {
      const sql = generateSqlSelect(nodes, queryColumns, tables, relationships, dbType);
      setGeneratedSql(sql + ';');
    }
  }, [query, relationships, tables, dbType]);

  const autoResolveAliases = (cols: QueryColumn[]): QueryColumn[] => {
    const countMap: Record<string, number> = {};
    cols.forEach(col => {
      const name = col.isCalculated ? 'calculated' : (col.alias || col.fieldName).toLowerCase();
      countMap[name] = (countMap[name] || 0) + 1;
    });

    return cols.map(col => {
      if (col.isCalculated) return col;
      const name = (col.alias || col.fieldName).toLowerCase();
      if (countMap[name] > 1 && (!col.alias || col.alias.trim() === '')) {
        return {
          ...col,
          alias: `${col.tableName}_${col.fieldName}`
        };
      }
      return col;
    });
  };

  const setNodes = (nodes: TableNode[]) => {
    onQueryChange({ ...query, nodes });
  }

  const setQueryColumns = (columns: QueryColumn[]) => {
    const resolved = autoResolveAliases(columns);
    onQueryChange({ ...query, columns: resolved });
  }

  const toggleTotals = () => {
    const newState = !showTotals;
    setShowTotals(newState);
    if (!newState) {
       setQueryColumns(queryColumns.map(c => ({...c, aggregate: null})));
    } else {
       setQueryColumns(queryColumns.map(c => ({...c, aggregate: 'GROUP_BY'})));
    }
  }

  const addCalculatedColumn = () => {
     const newCol: QueryColumn = {
         id: crypto.randomUUID(),
         tableId: '',
         fieldId: 'calculated',
         tableName: '',
         fieldName: 'Ausdr1',
         alias: 'BerechnetesFeld',
         isCalculated: true,
         expression: '',
         sort: '',
         show: true,
         criteria: ['']
     };
     setQueryColumns([...queryColumns, newCol]);
  };
  
  const handleDropOnCanvas = (e: React.DragEvent) => {
    e.preventDefault();
    try {
      const json = e.dataTransfer.getData('application/json');
      if (!json) return;
      const data = JSON.parse(json);
      if (data.type === 'table') {
        const table = tables.find(t => t.id === data.id);
        if (table && !nodes.some(n => n.tableId === table.id)) {
          const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
          const x = e.clientX - rect.left;
          const y = e.clientY - rect.top;
          setNodes([...nodes, { id: `node_${Date.now()}`, tableId: table.id, x, y }]);
        }
      }
    } catch (err) {
      console.error("Drop error", err);
    }
  };
  
  const handleMoveNode = (id: string, x: number, y: number) => {
    setNodes(nodes.map(n => n.id === id ? { ...n, x, y } : n));
  };
  
  const handleRemoveNode = (id: string) => {
    setNodes(nodes.filter(n => n.id !== id));
  };

  const handleGridDrop = (e: React.DragEvent) => {
    e.preventDefault();
    try {
      const json = e.dataTransfer.getData('application/json');
      if (!json) return;

      const data = JSON.parse(json);
      if (data.type === 'query_field') {
        const table = tables.find(t => t.id === data.tableId);
        if (!table) return;

        if (data.fieldId === '*') {
          const newColumns = table.fields.map(field => ({ id: crypto.randomUUID(), tableId: table.id, fieldId: field.id, tableName: table.name, fieldName: field.name, sort: '' as const, show: true, criteria: [''] }));
          setQueryColumns([...queryColumns, ...newColumns]);
        } else {
          const field = table.fields.find(f => f.id === data.fieldId);
          if (field) {
            const newColumn: QueryColumn = { id: crypto.randomUUID(), tableId: table.id, fieldId: field.id, tableName: table.name, fieldName: field.name, sort: '' as const, show: true, criteria: [''] };
            setQueryColumns([...queryColumns, newColumn]);
          }
        }
      }
    } catch (err) { console.error('Grid drop error', err); }
  };

  const [showAccessSqlModal, setShowAccessSqlModal] = useState(false);

  return (
    <div className="w-full h-full flex flex-col relative">
      <div className="bg-slate-100 border-b border-slate-300 p-1 flex gap-2 items-center">
         <button onClick={toggleTotals} className={`flex items-center gap-1 px-2 py-1 rounded text-xs border ${showTotals ? 'bg-slate-300 border-slate-400' : 'bg-white border-slate-300 hover:bg-slate-50'}`}>
            <Sigma size={14}/> {showTotals ? 'Aggregation aus' : 'Aggregation (Anzahl, Summe, ...)'}
         </button>
         <button onClick={addCalculatedColumn} className="flex items-center gap-1 px-2 py-1 rounded text-xs border bg-white border-slate-300 hover:bg-slate-50">
            <Calculator size={14}/> Berechnetes Feld
         </button>
         
         <button 
           onClick={() => setShowAccessSqlModal(true)}
           className="flex items-center gap-1 px-2.5 py-1 rounded text-xs border bg-blue-50 border-blue-200 text-blue-700 hover:bg-blue-100 font-bold transition ml-auto shrink-0 shadow-2xs"
         >
            <Code size={13} className="text-blue-600" />
            <span>SQL Dialekt Konverter</span>
         </button>

         <button 
           onClick={() => {
             ui.setAiCopilotTab('query');
             ui.setShowAiCopilotModal(true);
           }}
           className="flex items-center gap-1.5 px-2.5 py-1 rounded text-xs border bg-indigo-50 border-indigo-200 text-indigo-700 hover:bg-indigo-100 font-bold transition shrink-0 shadow-2xs"
           title="AI Query-Copilot öffnen (Vorbereitet)"
         >
            <Sparkles size={13} className="text-indigo-500" /> 
            <span>AI Query-Copilot</span>
            <span className="text-[9px] bg-indigo-200/60 text-indigo-800 px-1 py-0.2 rounded font-semibold">Vorbereitet</span>
         </button>
      </div>

      {showAccessSqlModal && (
        <AccessSqlConverterModal 
          onClose={() => setShowAccessSqlModal(false)} 
          onApplySql={(convertedSql) => {
            setOverrideSql(convertedSql);
          }}
        />
      )}

      <div className="flex-1 relative bg-slate-200" onDragOver={(e) => e.preventDefault()} onDrop={handleDropOnCanvas}>
        <Canvas nodes={nodes} tables={tables} relationships={relationships} onMoveNode={handleMoveNode} onRemoveNode={handleRemoveNode} isInteractive={true} />
        {nodes.length === 0 && ( <div className="absolute inset-0 flex items-center justify-center pointer-events-none"> <div className="bg-white/80 p-4 rounded border border-slate-300 text-slate-500 text-sm shadow-sm text-center"> <p className="font-bold">Abfrage-Entwurf</p> <p>Ziehen Sie Tabellen aus der linken Leiste hierher.</p> </div> </div> )}
      </div>
      
      <div className="h-72 flex flex-col bg-white border-t border-slate-300 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)] z-10">
        <div className="flex-1 overflow-hidden flex flex-col" onDragOver={e => e.preventDefault()} onDrop={handleGridDrop}>
           <QueryGrid 
             columns={queryColumns} 
             tables={tables} 
             forms={forms}
             queries={queries}
             onUpdateColumns={setQueryColumns} 
             showTotals={showTotals}
           />
        </div>
        
        {/* Terminal / Code Editor Pane */}
        <div className="flex flex-col bg-slate-800 border-t border-slate-400 shrink-0">
          {overrideSql && (
            <div className="bg-amber-500/10 border-b border-amber-500/30 px-3 py-1 flex justify-between items-center text-[10px] text-amber-500">
              <span className="flex items-center gap-1 font-bold">
                <Terminal size={11} />
                ⚠️ Manuelles KI-generiertes SQL aktiv. Der interaktive Grid-Designer ist pausiert.
              </span>
              <button 
                onClick={() => setOverrideSql('')}
                className="bg-amber-500 hover:bg-amber-600 text-slate-900 px-2 py-0.5 rounded font-extrabold"
              >
                Designer reaktivieren
              </button>
            </div>
          )}
          <div className="p-2.5 text-white font-mono text-xs overflow-auto h-20">
            <pre className="text-emerald-400">{overrideSql || generatedSql}</pre>
          </div>
        </div>
      </div>
    </div>
  );
};
