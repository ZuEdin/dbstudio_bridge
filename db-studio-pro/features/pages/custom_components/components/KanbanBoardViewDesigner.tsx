import React, { useState } from 'react';
import { Sliders, Plus, Trash2 } from 'lucide-react';
import { useProjectStore } from '../../../../stores/useProjectStore';

interface KanbanBoardViewDesignerProps {
  configObj: any;
  updateVisualConfig: (newProps: any) => void;
  tables: any[];
  fields: any[];
}

export const KanbanBoardViewDesigner: React.FC<KanbanBoardViewDesignerProps> = ({
  configObj,
  updateVisualConfig,
  tables,
  fields,
}) => {
  const [newId, setNewId] = useState('');
  const [newLabel, setNewLabel] = useState('');
  const { customComponents = [] } = useProjectStore();
  const cardTemplates = customComponents.filter(c => c.type === 'card_template');

  const mapping = configObj.columnMapping || {};

  const handleAddMapping = () => {
    if (newId && newLabel) {
      updateVisualConfig({ columnMapping: { ...mapping, [newId]: newLabel } });
      setNewId('');
      setNewLabel('');
    }
  };

  const handleDeleteMapping = (id: string) => {
    const newMapping = { ...mapping };
    delete newMapping[id];
    updateVisualConfig({ columnMapping: newMapping });
  };

  return (
    <div className="space-y-4">
      <h4 className="text-xs font-bold text-indigo-600 uppercase tracking-wider flex items-center gap-1">
        <Sliders size={13} /> Kanban-Board konfigurieren
      </h4>

      <div>
        <label className="block text-[10px] text-slate-500 font-bold uppercase mb-1">Board Titel</label>
        <input 
          type="text"
          value={configObj.title || ''}
          onChange={(e) => updateVisualConfig({ title: e.target.value })}
          placeholder="z.B. Aufgabenverteilung"
          className="w-full px-2.5 py-1.5 text-xs bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded dark:text-white font-medium"
        />
      </div>

      <div>
        <label className="block text-[10px] text-slate-500 font-bold uppercase mb-1">Layout-Ausrichtung (Orientierung)</label>
        <select
          value={configObj.kanbanLayout || 'columns'}
          onChange={(e) => updateVisualConfig({ kanbanLayout: e.target.value })}
          className="w-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded px-2.5 py-1.5 text-xs dark:text-white font-semibold text-indigo-700 dark:text-indigo-400"
        >
          <option value="columns">Spaltenweise (Vertikal, Standard)</option>
          <option value="rows">Zeilenweise (Horizontal / Swimlanes)</option>
        </select>
        <p className="text-[9px] text-slate-400 mt-0.5">
          Wählen Sie 'Zeilenweise', um Aufgaben horizontal in Zeilen/Swimlanes darzustellen und Drag & Drop zeilenübergreifend zu nutzen.
        </p>
      </div>

      <div>
        <label className="block text-[10px] text-slate-500 font-bold uppercase mb-1">Datenquelle (Tabelle)</label>
        <select
          value={configObj.dataSourceId || ''}
          onChange={(e) => updateVisualConfig({ dataSourceId: e.target.value })}
          className="w-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded px-2.5 py-1.5 text-xs dark:text-white"
        >
          <option value="">-- Keine Datenbindung --</option>
          {tables.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
        </select>
      </div>

      <div>
        <label className="block text-[10px] text-slate-500 font-bold uppercase mb-1">Gruppieren nach Spalte (Kanban-Spalten)</label>
        <select
          value={configObj.groupByField || ''}
          onChange={(e) => updateVisualConfig({ groupByField: e.target.value })}
          className="w-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded px-2.5 py-1.5 text-xs dark:text-white font-semibold text-indigo-700 dark:text-indigo-400"
        >
          <option value="">-- Spalte wählen (z.B. Status) --</option>
          {fields.map(f => <option key={f.name} value={f.name}>{f.name} ({f.type})</option>)}
        </select>
        <p className="text-[9px] text-slate-400 mt-0.5 leading-tight">
          Das Board generiert automatisch eine Spalte für jeden eindeutigen Wert dieser Datenbankspalte.
        </p>
      </div>

      <div className="border-t border-slate-100 dark:border-slate-800 my-2 pt-2 space-y-3">
        <h5 className="text-[10px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider">Karten-Feldzuordnung (Mapping)</h5>
        
        <div>
          <label className="block text-[10px] text-slate-500 font-bold uppercase mb-0.5">Kartenvorlage</label>
          <select
            value={configObj.cardTemplateId || ''}
            onChange={(e) => updateVisualConfig({ cardTemplateId: e.target.value })}
            className="w-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded p-1.5 text-xs dark:text-white"
          >
            <option value="">-- Standard Karte --</option>
            {cardTemplates.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
          </select>
        </div>

        <div>
          <label className="block text-[10px] text-slate-500 font-bold uppercase mb-0.5">Titel der Karte</label>
          <select
            value={configObj.titleField || ''}
            onChange={(e) => updateVisualConfig({ titleField: e.target.value })}
            className="w-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded p-1.5 text-xs dark:text-white"
          >
            <option value="">-- Feld --</option>
            {fields.map(f => <option key={f.name} value={f.name}>{f.name}</option>)}
          </select>
        </div>

        <div>
          <label className="block text-[10px] text-slate-500 font-bold uppercase mb-0.5">Beschreibung / Untertitel</label>
          <select
            value={configObj.descField || ''}
            onChange={(e) => updateVisualConfig({ descField: e.target.value })}
            className="w-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded p-1.5 text-xs dark:text-white"
          >
            <option value="">-- Feld --</option>
            {fields.map(f => <option key={f.name} value={f.name}>{f.name}</option>)}
          </select>
        </div>

        <div>
          <label className="block text-[10px] text-slate-500 font-bold uppercase mb-0.5">Zusatz / Akzent-Feld (z.B. Preis, Datum)</label>
          <select
            value={configObj.cardAccentField || ''}
            onChange={(e) => updateVisualConfig({ cardAccentField: e.target.value })}
            className="w-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded p-1.5 text-xs dark:text-white"
          >
            <option value="">-- Feld --</option>
            {fields.map(f => <option key={f.name} value={f.name}>{f.name}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-[10px] text-slate-500 font-bold uppercase mb-0.5">Extra Feld 1</label>
          <select
            value={configObj.extraField1 || ''}
            onChange={(e) => updateVisualConfig({ extraField1: e.target.value })}
            className="w-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded p-1.5 text-xs dark:text-white"
          >
            <option value="">-- Feld --</option>
            {fields.map(f => <option key={f.name} value={f.name}>{f.name}</option>)}
          </select>
        </div>

        <div>
          <label className="block text-[10px] text-slate-500 font-bold uppercase mb-0.5">Extra Feld 2</label>
          <select
            value={configObj.extraField2 || ''}
            onChange={(e) => updateVisualConfig({ extraField2: e.target.value })}
            className="w-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded p-1.5 text-xs dark:text-white"
          >
            <option value="">-- Feld --</option>
            {fields.map(f => <option key={f.name} value={f.name}>{f.name}</option>)}
          </select>
        </div>
      </div>

      <div className="border-t border-slate-100 dark:border-slate-800 my-4 pt-4 space-y-3">
        <h5 className="text-[10px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider flex items-center gap-1">
          <span>⚙️</span> Reihenfolge & Sub-Todos (Hierarchie)
        </h5>
        
        <div>
          <label className="block text-[10px] text-slate-500 font-bold uppercase mb-0.5">Sortier-Feld (Reihenfolge)</label>
          <select
            value={configObj.sortField || ''}
            onChange={(e) => updateVisualConfig({ sortField: e.target.value })}
            className="w-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded p-1.5 text-xs dark:text-white"
          >
            <option value="">-- Standard (Keine Sortierung) --</option>
            {fields.map(f => <option key={f.name} value={f.name}>{f.name}</option>)}
          </select>
          <p className="text-[9px] text-slate-400 mt-0.5">
            Definiert, welche Spalte (z.B. eine Zahl) die Reihenfolge der Kärtchen steuert. Drag & Drop aktualisiert diese Werte.
          </p>
        </div>

        <div>
          <label className="block text-[10px] text-slate-500 font-bold uppercase mb-0.5">Übergeordnetes Feld (Sub-Todo Verknüpfung)</label>
          <select
            value={configObj.parentField || ''}
            onChange={(e) => updateVisualConfig({ parentField: e.target.value })}
            className="w-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded p-1.5 text-xs dark:text-white"
          >
            <option value="">-- Keine Hierarchie (Flach) --</option>
            {fields.map(f => <option key={f.name} value={f.name}>{f.name}</option>)}
          </select>
          <p className="text-[9px] text-slate-400 mt-0.5">
            Bestimmt die Spalte, die auf die ID der übergeordneten Aufgabe verweist, um Sub-Todos zu aktivieren.
          </p>
        </div>

        {configObj.parentField && (
          <div className="bg-indigo-50/50 dark:bg-indigo-950/20 p-2.5 rounded border border-indigo-100 dark:border-indigo-900/40 space-y-2">
            <label className="flex items-start gap-2 cursor-pointer text-[10px] text-slate-700 dark:text-slate-300 font-medium leading-tight">
              <input
                type="checkbox"
                checked={!!configObj.autoCompleteParent}
                onChange={(e) => updateVisualConfig({ autoCompleteParent: e.target.checked })}
                className="mt-0.5 rounded text-indigo-600 focus:ring-indigo-500"
              />
              <span>
                <strong>Auto-Complete:</strong> Hauptaufgabe automatisch auf "Erledigt" setzen, wenn alle Sub-Aufgaben erledigt sind.
              </span>
            </label>
            <label className="flex items-start gap-2 cursor-pointer text-[10px] text-slate-700 dark:text-slate-300 font-medium leading-tight">
              <input
                type="checkbox"
                checked={!!configObj.showSubTasksInline}
                onChange={(e) => updateVisualConfig({ showSubTasksInline: e.target.checked })}
                className="mt-0.5 rounded text-indigo-600 focus:ring-indigo-500"
              />
              <span>
                Sub-Todos direkt als Liste in der Haupt-Karte auflisten.
              </span>
            </label>
          </div>
        )}
      </div>

      <div className="border-t border-slate-100 dark:border-slate-800 my-4 pt-4 space-y-3">
        <h5 className="text-[10px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider">Spalten-Beschriftung (Beziehung)</h5>
        
        <div>
          <label className="block text-[10px] text-slate-500 font-bold uppercase mb-0.5">Quelltabelle für Spaltennamen</label>
          <select
            value={configObj.columnSourceTableId || ''}
            onChange={(e) => updateVisualConfig({ columnSourceTableId: e.target.value })}
            className="w-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded p-1.5 text-xs dark:text-white"
          >
            <option value="">-- Keine (Standard) --</option>
            {tables.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
          </select>
        </div>

        {configObj.columnSourceTableId && (() => {
          const selectedTable = tables.find(t => t.id === configObj.columnSourceTableId);
          const fields = selectedTable?.fields || [];
          return (
            <div>
              <label className="block text-[10px] text-slate-500 font-bold uppercase mb-0.5">Anzeigefeld</label>
              <select
                value={configObj.columnDisplayField || ''}
                onChange={(e) => updateVisualConfig({ columnDisplayField: e.target.value })}
                className="w-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded p-1.5 text-xs dark:text-white"
              >
                <option value="">-- Feld wählen --</option>
                {fields.map(f => <option key={f.name} value={f.name}>{f.name}</option>)}
              </select>
            </div>
          );
        })()}
      </div>
    </div>
  );
};
