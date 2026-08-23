import React from 'react';
import { 
  TrendingUp, Users, DollarSign, Activity, Calendar, Percent, Award, ShoppingCart 
} from 'lucide-react';

interface SimpleComponentsPreviewProps {
  componentType: string;
  configObj: any;
  mockRows: any[];
}

export const SimpleComponentsPreview: React.FC<SimpleComponentsPreviewProps> = ({
  componentType,
  configObj,
  mockRows
}) => {
  if (componentType === 'text') {
    return (
      <div className="p-6 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl">
        <div className="bg-white dark:bg-slate-850 p-6 border dark:border-slate-800 rounded-lg shadow-inner min-h-[100px] flex items-center justify-center">
          <div className={`w-full ${configObj.fontSize || 'text-base'} ${configObj.fontWeight || 'font-normal'} ${configObj.colorClass || 'text-slate-800'} ${configObj.alignment || 'text-left'}`}>
            {configObj.text || 'Ihr konfigurierter Text wird hier abgebildet.'}
          </div>
        </div>
      </div>
    );
  }

  if (componentType === 'button') {
    return (
      <div className="p-6 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl">
        <div className="bg-white dark:bg-slate-850 p-6 border dark:border-slate-800 rounded-lg shadow-inner flex items-center justify-center">
          <button 
            disabled
            className={`px-5 py-2 rounded-lg font-bold text-xs shadow-sm hover:shadow transition-all ${
              configObj.variant === 'primary' ? 'bg-indigo-600 text-white' :
              configObj.variant === 'secondary' ? 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border dark:border-slate-700' :
              configObj.variant === 'danger' ? 'bg-red-600 text-white' : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-300 dark:border-slate-700'
            }`}
          >
            {configObj.label || 'Aktions-Button'}
          </button>
        </div>
      </div>
    );
  }

  if (componentType === 'dropdown') {
    return (
      <div className="p-6 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl">
        <div className="bg-white dark:bg-slate-850 p-6 border dark:border-slate-800 rounded-lg shadow-inner space-y-2">
          {configObj.label && (
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300">{configObj.label}</label>
          )}
          <select disabled className="w-full max-w-xs border border-slate-300 dark:border-slate-700 rounded px-3 py-1.5 bg-slate-50 dark:bg-slate-800 text-xs opacity-75 dark:text-slate-300">
            <option>{configObj.placeholder || '-- Bitte wählen --'}</option>
          </select>
        </div>
      </div>
    );
  }

  if (componentType === 'metric_card') {
    const theme = configObj.themeColor || 'indigo';
    const themeClasses: Record<string, string> = {
      indigo: 'bg-indigo-50/50 border-indigo-100 text-indigo-700 dark:bg-indigo-950/20 dark:border-indigo-900/40 dark:text-indigo-400',
      emerald: 'bg-emerald-50/50 border-emerald-100 text-emerald-700 dark:bg-emerald-950/20 dark:border-emerald-900/40 dark:text-emerald-400',
      rose: 'bg-rose-50/50 border-rose-100 text-rose-700 dark:bg-rose-950/20 dark:border-rose-900/40 dark:text-rose-400',
      sky: 'bg-sky-50/50 border-sky-100 text-sky-700 dark:bg-sky-950/20 dark:border-sky-900/40 dark:text-sky-400',
      amber: 'bg-amber-50/50 border-amber-100 text-amber-700 dark:bg-amber-950/20 dark:border-amber-900/40 dark:text-amber-400',
      slate: 'bg-slate-50/50 border-slate-200 text-slate-700 dark:bg-slate-900/30 dark:border-slate-800 dark:text-slate-400'
    };

    const iconBgClasses: Record<string, string> = {
      indigo: 'bg-indigo-100 dark:bg-indigo-900/40',
      emerald: 'bg-emerald-100 dark:bg-emerald-900/40',
      rose: 'bg-rose-100 dark:bg-rose-900/40',
      sky: 'bg-sky-100 dark:bg-sky-900/40',
      amber: 'bg-amber-100 dark:bg-amber-900/40',
      slate: 'bg-slate-200 dark:bg-slate-800'
    };

    const IconDict: Record<string, any> = {
      TrendingUp, Users, DollarSign, Activity, Calendar, Percent, Award, ShoppingCart
    };
    const MetricIcon = IconDict[configObj.iconName || 'TrendingUp'] || TrendingUp;

    // Live Metric Calculation logic on mockup data
    const getLiveVal = () => {
      if (configObj.aggType === 'custom') return configObj.customValue || '0';
      if (!mockRows || mockRows.length === 0) return '0';
      if (configObj.aggType === 'count') return mockRows.length.toString();

      const f = configObj.aggField;
      if (!f) return '0';

      const numbers = mockRows.map(r => Number(r[f])).filter(val => !isNaN(val));
      if (numbers.length === 0) return '0,00';

      let res = 0;
      if (configObj.aggType === 'sum') {
        res = numbers.reduce((a, b) => a + b, 0);
      } else if (configObj.aggType === 'avg') {
        res = numbers.reduce((a, b) => a + b, 0) / numbers.length;
      } else if (configObj.aggType === 'min') {
        res = Math.min(...numbers);
      } else if (configObj.aggType === 'max') {
        res = Math.max(...numbers);
      }

      return res.toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    };

    return (
      <div className="p-6 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl flex justify-center">
        <div className={`w-full max-w-sm border-2 p-5 rounded-2xl shadow-sm ${themeClasses[theme] || themeClasses.indigo}`}>
          <div className="flex justify-between items-start">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                {configObj.title || 'Kennzahl'}
              </p>
              <h4 className="text-3xl font-bold tracking-tight mt-1 text-slate-900 dark:text-white font-sans">
                {configObj.prefix || ''}{getLiveVal()}{configObj.suffix || ''}
              </h4>
            </div>
            <div className={`p-2.5 rounded-xl ${iconBgClasses[theme] || iconBgClasses.indigo}`}>
              <MetricIcon size={18} className={themeClasses[theme]?.split(' ')[2]} />
            </div>
          </div>
          {configObj.subtext && (
            <div className="mt-3 text-[10px] text-slate-500 dark:text-slate-400 border-t border-slate-200/50 dark:border-slate-800/50 pt-2 flex items-center gap-1">
              <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
              <span>{configObj.subtext}</span>
            </div>
          )}
        </div>
      </div>
    );
  }

  return null;
};
