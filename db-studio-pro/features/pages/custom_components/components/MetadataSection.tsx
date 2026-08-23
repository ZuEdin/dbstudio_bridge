import React from 'react';
import { Settings } from 'lucide-react';

interface MetadataSectionProps {
  componentName: string;
  setComponentName: (name: string) => void;
  componentDescription: string;
  setComponentDescription: (desc: string) => void;
  componentType: 'table_view' | 'chart_view' | 'form_view' | 'text' | 'button' | 'dropdown' | 'metric_card' | 'kanban_board' | 'card_template' | 'layout_container' | 'calendar_view';
  handleTypeChange: (type: any) => void;
}

export const MetadataSection: React.FC<MetadataSectionProps> = ({
  componentName,
  setComponentName,
  componentDescription,
  setComponentDescription,
  componentType,
  handleTypeChange,
}) => {
  return (
    <div className="p-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 space-y-3">
      <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
        <Settings size={13} />
        <span>Komponenten-Metadaten</span>
      </h3>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Name</label>
          <input 
            type="text" 
            value={componentName}
            onChange={(e) => setComponentName(e.target.value)}
            placeholder="z.B. CustomerDashboard"
            className="w-full px-2.5 py-1.5 text-xs bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-md text-slate-800 dark:text-slate-200 focus:ring-1 focus:ring-indigo-500 outline-none"
          />
        </div>
        <div>
          <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Basis-Typ (Factory)</label>
          <select 
            value={componentType}
            onChange={(e) => handleTypeChange(e.target.value)}
            className="w-full px-2 py-1.5 text-xs bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-md text-slate-800 dark:text-slate-200 focus:ring-1 focus:ring-indigo-500 outline-none"
          >
            <option value="table_view">Tabelle / Liste (Table View)</option>
            <option value="chart_view">Diagramm / Grafik (Chart View)</option>
            <option value="form_view">Formular (Form View)</option>
            <option value="dropdown">Auswahlmenü (Dropdown)</option>
            <option value="text">Einfacher Text / Label</option>
            <option value="button">Aktions-Button</option>
            <option value="metric_card">📊 Kennzahl-Karte (Metric Card)</option>
            <option value="kanban_board">📋 Aufgaben-Board (Kanban Board)</option>
            <option value="card_template">🃏 Kartenvorlage (Card Template)</option>
            <option value="layout_container">📐 Layout Spalten/Zeilen (Layout Container)</option>
            <option value="calendar_view">📅 Kalender (Calendar View)</option>
          </select>
        </div>
      </div>
      <div>
        <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Kurzbeschreibung</label>
        <input 
          type="text" 
          value={componentDescription}
          onChange={(e) => setComponentDescription(e.target.value)}
          placeholder="z.B. Zeigt eine Liste mit Kunden und ihren Umsätzen"
          className="w-full px-2.5 py-1.5 text-xs bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-md text-slate-800 dark:text-slate-200 focus:ring-1 focus:ring-indigo-500 outline-none"
        />
      </div>
    </div>
  );
};
