import React from 'react';
import { ResponsiveContainer, BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import { ReportChartConfig } from '../../../types/report';
import { Field } from '../../../types/index';

interface ReportChartRendererProps {
  config: ReportChartConfig;
  data: Record<string, any>[];
  sourceFields: Field[];
}

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#06b6d4'];

const BarComponent = Bar as any;
const LineComponent = Line as any;

export const ReportChartRenderer: React.FC<ReportChartRendererProps> = ({ config, data, sourceFields }) => {
  if (!config.enabled || !config.xAxisFieldId || !config.yAxisFieldId || !data || data.length === 0) {
    return null;
  }

  const xAxisField = sourceFields.find(f => f.id === config.xAxisFieldId)?.name || config.xAxisFieldId;
  const yAxisField = sourceFields.find(f => f.id === config.yAxisFieldId)?.name || config.yAxisFieldId;

  // Prepare Chart Data
  const chartData = data.map(item => ({
    name: String(item[xAxisField] ?? 'Unbekannt'),
    val: parseFloat(item[yAxisField]) || 0
  })).slice(0, 15); // Limit max bars to 15 for clean layout

  return (
    <div className="my-4 p-4 bg-white border border-slate-300 rounded-lg shadow-2xs">
      <div className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-2 flex items-center justify-between">
        <span>{config.title || `Diagramm: ${yAxisField} nach ${xAxisField}`}</span>
        <span className="text-[10px] text-slate-400 font-mono font-normal">Eingebettetes Recharts Diagramm</span>
      </div>

      <div className="h-52 w-full">
        <ResponsiveContainer width="100%" height="100%">
          {config.type === 'line' ? (
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="name" tick={{ fontSize: 10 }} />
              <YAxis tick={{ fontSize: 10 }} />
              <Tooltip />
              <LineComponent type="monotone" dataKey="val" name={yAxisField} stroke="#2563eb" strokeWidth={2} dot={{ r: 4 }} />
            </LineChart>
          ) : config.type === 'pie' ? (
            <PieChart>
              <Pie data={chartData} dataKey="val" nameKey="name" cx="50%" cy="50%" outerRadius={70} fill="#3b82f6" label>
                {chartData.map((_, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          ) : (
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="name" tick={{ fontSize: 10 }} />
              <YAxis tick={{ fontSize: 10 }} />
              <Tooltip />
              <BarComponent dataKey="val" name={yAxisField} fill="#3b82f6" radius={[4, 4, 0, 0]} />
            </BarChart>
          )}
        </ResponsiveContainer>
      </div>
    </div>
  );
};
