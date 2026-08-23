import React from 'react';
import { 
  BarChart, Bar, LineChart, Line, AreaChart, Area, PieChart, Pie, 
  XAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell 
} from 'recharts';

const ChartBar = Bar as any;
const ChartLine = Line as any;
const ChartArea = Area as any;
const ChartPie = Pie as any;

interface ChartViewPreviewProps {
  configObj: any;
  mockRows: any[];
}

export const ChartViewPreview: React.FC<ChartViewPreviewProps> = ({
  configObj,
  mockRows
}) => {
  const chartData = mockRows.map(row => {
    const newRow = { ...row };
    if (configObj.series) {
      configObj.series.forEach((s: any) => {
        if (newRow[s.key] !== undefined && !isNaN(Number(newRow[s.key]))) {
          newRow[s.key] = Number(newRow[s.key]);
        } else if (newRow[s.key] === undefined || isNaN(Number(newRow[s.key]))) {
          // Fallback if not a number, give it a random number for preview
          newRow[s.key] = Math.floor(Math.random() * 500) + 100;
        }
      });
    }
    return newRow;
  });

  return (
    <div className="p-6 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl space-y-4">
      <div className="flex justify-between items-center pb-2 border-b dark:border-slate-800">
        <span className="font-bold text-slate-700 dark:text-slate-200 text-sm">{configObj.title || 'Diagramm'}</span>
        <span className="text-[10px] font-mono text-slate-400 uppercase">Typ: {configObj.chartType}</span>
      </div>
      <div className="h-64 bg-white dark:bg-slate-950 p-4 border rounded-lg dark:border-slate-800">
        <ResponsiveContainer width="100%" height="100%">
          <>
            {configObj.chartType === 'bar' ? (
              <BarChart data={chartData}>
                <XAxis dataKey={configObj.xAxisKey || 'Name'} tick={{ fontSize: 10 }} />
                <Tooltip />
                {configObj.series?.map((s: any, idx: number) => (
                  <ChartBar key={s.key || idx} dataKey={s.key || 'value'} fill={s.color || '#3b82f6'} />
                ))}
              </BarChart>
            ) : configObj.chartType === 'line' ? (
              <LineChart data={chartData}>
                <XAxis dataKey={configObj.xAxisKey || 'Name'} tick={{ fontSize: 10 }} />
                <Tooltip />
                <CartesianGrid strokeDasharray="3 3" />
                {configObj.series?.map((s: any, idx: number) => (
                  <ChartLine key={s.key || idx} type="monotone" dataKey={s.key || 'value'} stroke={s.color || '#3b82f6'} />
                ))}
              </LineChart>
            ) : configObj.chartType === 'area' ? (
              <AreaChart data={chartData}>
                <XAxis dataKey={configObj.xAxisKey || 'Name'} tick={{ fontSize: 10 }} />
                <Tooltip />
                <CartesianGrid strokeDasharray="3 3" />
                {configObj.series?.map((s: any, idx: number) => (
                  <ChartArea key={s.key || idx} type="monotone" dataKey={s.key || 'value'} fill={s.color || '#3b82f6'} stroke={s.color || '#3b82f6'} />
                ))}
              </AreaChart>
            ) : configObj.chartType === 'pie' ? (
              <PieChart>
                <ChartPie 
                  data={chartData} 
                  dataKey={configObj.series?.[0]?.key || 'value'} 
                  nameKey={configObj.xAxisKey || 'Name'} 
                  cx="50%" cy="50%" outerRadius={80} 
                  label
                >
                  {mockRows.map((entry: any, index: number) => (
                    <Cell key={`cell-${index}`} fill={(configObj.series && configObj.series.length > 0) ? configObj.series[index % configObj.series.length].color : ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'][index % 5]} />
                  ))}
                </ChartPie>
                <Tooltip />
              </PieChart>
            ) : (
              <div className="flex h-full items-center justify-center text-slate-400">Typ nicht unterstützt</div>
            )}
          </>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
