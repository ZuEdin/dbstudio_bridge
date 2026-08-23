import React from 'react';
import { PageComponent } from '../../../../types';
import { TrendingUp, DollarSign, Users, Award, Clock, Activity, Briefcase, Zap } from 'lucide-react';

interface StatCardPropertiesProps {
  selectedNode: PageComponent;
  updateSelectedNodeProps: (newProps: any) => void;
}

export const StatCardProperties: React.FC<StatCardPropertiesProps> = ({
  selectedNode,
  updateSelectedNodeProps,
}) => {
  const props = selectedNode.props || {};

  const colors = [
    { id: 'indigo', label: 'Indigo', bg: 'bg-indigo-500' },
    { id: 'emerald', label: 'Emerald (Grün)', bg: 'bg-emerald-500' },
    { id: 'amber', label: 'Amber (Orange)', bg: 'bg-amber-500' },
    { id: 'rose', label: 'Rose (Rot)', bg: 'bg-rose-500' },
    { id: 'blue', label: 'Blue (Blau)', bg: 'bg-blue-500' },
    { id: 'purple', label: 'Purple (Lila)', bg: 'bg-purple-500' },
    { id: 'slate', label: 'Slate (Neutral)', bg: 'bg-slate-500' },
  ];

  const icons = [
    'DollarSign', 'TrendingUp', 'Users', 'Award', 'Clock', 'Activity', 'Briefcase', 'Zap', 'Layers', 'CheckCircle'
  ];

  return (
    <div className="space-y-4">
      <div>
        <h4 className="text-xs font-bold text-indigo-600 mb-2 flex items-center gap-1.5">
          <TrendingUp size={14} /> KPI / Stat-Card Widget
        </h4>
        <p className="text-[10px] text-slate-500 mb-3">
          Zeigt wichtige Kennzahlen, Umsätze, Zähler oder Trends mit optischem Akzent an.
        </p>
      </div>

      <div>
        <label className="block text-xs font-semibold text-slate-600 mb-1">Titel / Kennzahl-Name</label>
        <input
          type="text"
          value={props.label || ''}
          onChange={(e) => updateSelectedNodeProps({ label: e.target.value })}
          placeholder="z. B. Monatsumsatz Netto"
          className="w-full px-2 py-1 text-xs border border-slate-300 rounded focus:border-indigo-500 focus:outline-none"
        />
      </div>

      <div className="grid grid-cols-3 gap-2">
        <div className="col-span-2">
          <label className="block text-xs font-semibold text-slate-600 mb-1">Hauptwert / Expression</label>
          <input
            type="text"
            value={props.value || ''}
            onChange={(e) => updateSelectedNodeProps({ value: e.target.value })}
            placeholder="14.850 oder {{context.total}}"
            className="w-full px-2 py-1 text-xs border border-slate-300 rounded font-semibold focus:border-indigo-500 focus:outline-none"
          />
        </div>
        <div>
          <label className="block text-xs font-semibold text-slate-600 mb-1">Einheit</label>
          <input
            type="text"
            value={props.unit || ''}
            onChange={(e) => updateSelectedNodeProps({ unit: e.target.value })}
            placeholder="€, %, Pos."
            className="w-full px-2 py-1 text-xs border border-slate-300 rounded focus:border-indigo-500 focus:outline-none"
          />
        </div>
      </div>

      <div className="pt-2 border-t border-slate-100 space-y-2">
        <div className="text-[10px] font-bold text-slate-500 uppercase">Trend & Vergleich</div>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="block text-[10px] text-slate-500 mb-0.5">Trend-Wert</label>
            <input
              type="text"
              value={props.trend || ''}
              onChange={(e) => updateSelectedNodeProps({ trend: e.target.value })}
              placeholder="+12.4%"
              className="w-full px-2 py-1 text-xs border border-slate-300 rounded"
            />
          </div>
          <div>
            <label className="block text-[10px] text-slate-500 mb-0.5">Richtung</label>
            <select
              value={props.trendDirection || 'up'}
              onChange={(e) => updateSelectedNodeProps({ trendDirection: e.target.value })}
              className="w-full bg-white border border-slate-300 rounded px-1.5 py-1 text-xs"
            >
              <option value="up">Positiv (Grün ↗)</option>
              <option value="down">Negativ (Rot ↘)</option>
              <option value="neutral">Neutral (Grau ↔)</option>
            </select>
          </div>
        </div>
        <div>
          <label className="block text-[10px] text-slate-500 mb-0.5">Trend-Erklärung</label>
          <input
            type="text"
            value={props.trendLabel || ''}
            onChange={(e) => updateSelectedNodeProps({ trendLabel: e.target.value })}
            placeholder="vs. Vormonat"
            className="w-full px-2 py-1 text-xs border border-slate-300 rounded"
          />
        </div>
      </div>

      <div className="pt-2 border-t border-slate-100">
        <label className="block text-xs font-semibold text-slate-600 mb-1.5">Farbakzent</label>
        <div className="grid grid-cols-4 gap-1.5">
          {colors.map(c => (
            <button
              key={c.id}
              type="button"
              onClick={() => updateSelectedNodeProps({ accentColor: c.id })}
              className={`p-1.5 rounded text-[11px] font-medium border text-center flex items-center gap-1.5 justify-center transition ${
                (props.accentColor || 'indigo') === c.id 
                  ? 'border-indigo-600 bg-indigo-50 text-indigo-900 ring-1 ring-indigo-500 font-bold' 
                  : 'border-slate-200 hover:bg-slate-50 text-slate-700'
              }`}
            >
              <span className={`w-2.5 h-2.5 rounded-full ${c.bg}`}></span>
              {c.label.split(' ')[0]}
            </button>
          ))}
        </div>
      </div>

      <div className="pt-2 border-t border-slate-100">
        <label className="block text-xs font-semibold text-slate-600 mb-1.5">Icon</label>
        <div className="flex flex-wrap gap-1">
          {icons.map(ic => (
            <button
              key={ic}
              type="button"
              onClick={() => updateSelectedNodeProps({ icon: ic })}
              className={`px-2 py-1 rounded text-xs border transition ${
                (props.icon || 'TrendingUp') === ic 
                  ? 'border-indigo-600 bg-indigo-50 text-indigo-700 font-bold' 
                  : 'border-slate-200 hover:bg-slate-50 text-slate-600'
              }`}
            >
              {ic}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
