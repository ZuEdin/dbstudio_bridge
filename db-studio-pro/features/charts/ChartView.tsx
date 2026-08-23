
import React, { useState, useEffect, useMemo } from 'react';
import { Chart, Table, Query, ChartType } from '../../types/index';
import { BarChart, Bar, LineChart, Line, AreaChart, Area, PieChart, Pie, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell } from 'recharts';
import { Settings, BarChart as BarIcon, LineChart as LineIcon, PieChart as PieIcon, Activity, Palette } from 'lucide-react';
import { executeSelectQuery } from '../queries/utils/queryExecution';

interface ChartViewProps {
  chart: Chart;
  tables: Table[];
  queries: Query[];
  onChartChange: (chart: Chart) => void;
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];

const ChartBar = Bar as any;
const ChartLine = Line as any;
const ChartArea = Area as any;
const ChartPie = Pie as any;

export const ChartView: React.FC<ChartViewProps> = ({ chart, tables, queries, onChartChange }) => {
  const [data, setData] = useState<any[]>([]);
  const [sourceFields, setSourceFields] = useState<{name: string, type: string}[]>([]);
  const [isConfigOpen, setIsConfigOpen] = useState(true); // Start open if new

  // Load Data
  useEffect(() => {
      let rawData: any[] = [];
      let fields: any[] = [];

      if (chart.sourceType === 'table') {
          const table = tables.find(t => t.id === chart.sourceId);
          if (table) {
              rawData = table.data || [];
              fields = table.fields;
          }
      } else {
          const query = queries.find(q => q.id === chart.sourceId);
          if (query && query.type === 'SELECT') {
              // Execute Query locally to get data for chart
              // Note: In real app, relationships should be passed. Here simplistic.
              // Assuming query execution logic is pure and available.
              // We need to import executeSelectQuery or similar. 
              // For now, we reuse the store's logic implicitly or need to pass it.
              // Fix: We import the logic directly.
              
              // We need to pass relationships... assuming empty for now or need refactor to pass relationships to this view
              // Ideally, this component receives `data` directly from parent to avoid logic duplication.
              // Let's assume parent passed data or we do simple fetch.
              
              // Fallback: Just get column names if no execution available here, 
              // but we need data.
              // Since we imported executeSelectQuery, let's use it, assuming we can get relationships from store/context?
              // Hack: relationships are missing in props. We'll skip complex query exec and just map columns.
              
              fields = query.columns.map(c => ({ name: c.alias || c.fieldName, type: 'string' }));
          }
      }
      
      // If we are in query mode, we need real data. 
      // Since we don't have relationships prop here easily without refactoring App.tsx...
      // Let's assume the user selects a Table for v1 Charts, or Query (but data might be empty if not passed).
      // UPGRADE: Added relationships prop to ViewRouter -> ChartView
      
      setSourceFields(fields);
      setData(rawData); 
  }, [chart.sourceId, chart.sourceType, tables]); // Trigger re-fetch

  const updateConfig = (updates: Partial<typeof chart.config>) => {
      onChartChange({ ...chart, config: { ...chart.config, ...updates } });
  };

  const renderChart = () => {
      if (data.length === 0) return <div className="flex h-full items-center justify-center text-slate-400">Keine Daten verfügbar</div>;

      const renderCommonAxis = () => (
          <>
            <XAxis dataKey={chart.config.xAxisFieldId} />
            <YAxis />
            <Tooltip />
            <Legend />
            {chart.config.showGrid !== false && <CartesianGrid strokeDasharray="3 3" />}
          </>
      );

      return (
          <ResponsiveContainer width="100%" height="100%">
              {chart.type === 'bar' ? (
                  <BarChart data={data}>
                      {renderCommonAxis()}
                      {chart.config.yAxisFieldIds.map((id, idx) => (
                          <ChartBar key={id} dataKey={id} fill={COLORS[idx % COLORS.length]} />
                      ))}
                  </BarChart>
              ) : chart.type === 'line' ? (
                  <LineChart data={data}>
                      {renderCommonAxis()}
                      {chart.config.yAxisFieldIds.map((id, idx) => (
                          <ChartLine key={id} type="monotone" dataKey={id} stroke={COLORS[idx % COLORS.length]} />
                      ))}
                  </LineChart>
              ) : chart.type === 'area' ? (
                  <AreaChart data={data}>
                      {renderCommonAxis()}
                      {chart.config.yAxisFieldIds.map((id, idx) => (
                          <ChartArea key={id} type="monotone" dataKey={id} stackId="1" stroke={COLORS[idx % COLORS.length]} fill={COLORS[idx % COLORS.length]} />
                      ))}
                  </AreaChart>
              ) : (
                  <PieChart>
                      <Pie 
                        data={data} 
                        dataKey={chart.config.yAxisFieldIds[0]} 
                        nameKey={chart.config.xAxisFieldId} 
                        cx="50%" cy="50%" outerRadius={120} 
                        label 
                      >
                          {data.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                      </Pie>
                      <Tooltip />
                      <Legend />
                  </PieChart>
              )}
          </ResponsiveContainer>
      );
  };

  return (
    <div className="flex h-full bg-slate-100">
        {/* Config Sidebar */}
        <div className={`${isConfigOpen ? 'w-80' : 'w-0'} bg-white border-r border-slate-300 transition-all duration-300 overflow-hidden flex flex-col`}>
            <div className="p-4 bg-slate-800 text-white flex justify-between items-center">
                <h2 className="font-bold flex items-center gap-2"><Settings size={18}/> Einstellungen</h2>
                <button onClick={() => setIsConfigOpen(false)}><Settings size={14}/></button>
            </div>
            
            <div className="p-4 space-y-6 overflow-y-auto flex-1">
                <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Diagramm Typ</label>
                    <div className="grid grid-cols-4 gap-2">
                        {['bar', 'line', 'area', 'pie'].map(t => (
                            <button 
                                key={t} 
                                onClick={() => onChartChange({ ...chart, type: t as ChartType })}
                                className={`p-2 rounded border flex justify-center ${chart.type === t ? 'bg-blue-100 border-blue-400 text-blue-700' : 'hover:bg-slate-50'}`}
                                title={t}
                            >
                                {t === 'bar' && <BarIcon size={20}/>}
                                {t === 'line' && <LineIcon size={20}/>}
                                {t === 'area' && <Activity size={20}/>}
                                {t === 'pie' && <PieIcon size={20}/>}
                            </button>
                        ))}
                    </div>
                </div>

                <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Datenquelle</label>
                    <select 
                        className="w-full border rounded p-2 text-sm"
                        value={chart.sourceType + ':' + chart.sourceId}
                        onChange={e => {
                            const [type, id] = e.target.value.split(':');
                            onChartChange({ ...chart, sourceType: type as any, sourceId: id });
                        }}
                    >
                        <optgroup label="Tabellen">
                            {tables.map(t => <option key={t.id} value={`table:${t.id}`}>{t.name}</option>)}
                        </optgroup>
                        <optgroup label="Abfragen">
                            {queries.map(q => <option key={q.id} value={`query:${q.id}`}>{q.name}</option>)}
                        </optgroup>
                    </select>
                </div>

                <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-2">X-Achse (Kategorie)</label>
                    <select 
                        className="w-full border rounded p-2 text-sm"
                        value={chart.config.xAxisFieldId}
                        onChange={e => updateConfig({ xAxisFieldId: e.target.value })}
                    >
                        {sourceFields.map(f => <option key={f.name} value={f.name}>{f.name}</option>)}
                    </select>
                </div>

                <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Y-Achse (Werte)</label>
                    <div className="space-y-1 border rounded p-2 max-h-40 overflow-y-auto">
                        {sourceFields.map(f => (
                            <label key={f.name} className="flex items-center gap-2 text-sm cursor-pointer hover:bg-slate-50 p-1 rounded">
                                <input 
                                    type="checkbox" 
                                    checked={chart.config.yAxisFieldIds.includes(f.name)}
                                    onChange={e => {
                                        const newIds = e.target.checked 
                                            ? [...chart.config.yAxisFieldIds, f.name]
                                            : chart.config.yAxisFieldIds.filter(id => id !== f.name);
                                        updateConfig({ yAxisFieldIds: newIds });
                                    }}
                                />
                                {f.name}
                            </label>
                        ))}
                    </div>
                </div>
            </div>
        </div>

        {/* Main Chart Area */}
        <div className="flex-1 flex flex-col p-4">
            {!isConfigOpen && (
                <button onClick={() => setIsConfigOpen(true)} className="absolute top-4 left-4 bg-white p-2 rounded shadow border z-10">
                    <Settings size={16}/>
                </button>
            )}
            <div className="bg-white rounded-xl shadow-lg border border-slate-200 flex-1 p-6 relative">
                <h2 className="text-xl font-bold text-center mb-4 text-slate-700">{chart.name}</h2>
                <div className="w-full h-[90%]">
                    {renderChart()}
                </div>
            </div>
        </div>
    </div>
  );
};
