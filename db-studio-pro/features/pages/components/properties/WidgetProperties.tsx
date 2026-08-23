import React from 'react';
import { PageComponent, Table } from '../../../../types';
import { AlertCircle, Plus, Trash2, Search, Sliders, LayoutGrid } from 'lucide-react';

interface WidgetPropertiesProps {
  selectedNode: PageComponent;
  updateSelectedNodeProps: (newProps: any) => void;
  tables: Table[];
}

export const WidgetProperties: React.FC<WidgetPropertiesProps> = ({
  selectedNode,
  updateSelectedNodeProps,
  tables,
}) => {
  const props = selectedNode.props || {};

  if (selectedNode.type === 'alert_box') {
    return (
      <div className="space-y-4">
        <div>
          <h4 className="text-xs font-bold text-amber-600 mb-2 flex items-center gap-1.5">
            <AlertCircle size={14} /> Hinweis- / Alert-Box
          </h4>
          <p className="text-[10px] text-slate-500 mb-3">
            Wichtige Status-Meldungen, Warnungen oder Erfolgs-Feedbacks.
          </p>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-600 mb-1">Typ</label>
          <select
            value={props.alertType || 'info'}
            onChange={(e) => updateSelectedNodeProps({ alertType: e.target.value })}
            className="w-full bg-slate-50 border border-slate-300 rounded px-2 py-1 text-xs"
          >
            <option value="info">Information (Blau)</option>
            <option value="success">Erfolg (Grün)</option>
            <option value="warning">Warnung (Gelb/Orange)</option>
            <option value="danger">Fehler / Achtung (Rot)</option>
          </select>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-600 mb-1">Titel</label>
          <input
            type="text"
            value={props.title || ''}
            onChange={(e) => updateSelectedNodeProps({ title: e.target.value })}
            placeholder="z. B. Wichtiger Hinweis"
            className="w-full px-2 py-1 text-xs border border-slate-300 rounded"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-600 mb-1">Nachricht</label>
          <textarea
            value={props.message || ''}
            onChange={(e) => updateSelectedNodeProps({ message: e.target.value })}
            placeholder="Detaillierter Meldungstext..."
            className="w-full px-2 py-1 text-xs border border-slate-300 rounded min-h-[60px]"
          />
        </div>

        <label className="flex items-center gap-2 text-xs text-slate-700 cursor-pointer pt-2">
          <input
            type="checkbox"
            checked={props.dismissible !== false}
            onChange={(e) => updateSelectedNodeProps({ dismissible: e.target.checked })}
            className="rounded text-indigo-600 border-slate-300"
          />
          Schließen-Button (X) anzeigen
        </label>
      </div>
    );
  }

  if (selectedNode.type === 'badge_pill') {
    return (
      <div className="space-y-4">
        <div>
          <h4 className="text-xs font-bold text-indigo-600 mb-2">Badge / Status-Pill</h4>
        </div>
        <div>
          <label className="block text-xs font-semibold text-slate-600 mb-1">Text / Label</label>
          <input
            type="text"
            value={props.label || ''}
            onChange={(e) => updateSelectedNodeProps({ label: e.target.value })}
            placeholder="z. B. Aktiv, In Bearbeitung"
            className="w-full px-2 py-1 text-xs border border-slate-300 rounded"
          />
        </div>
        <div>
          <label className="block text-xs font-semibold text-slate-600 mb-1">Farbschema</label>
          <select
            value={props.colorScheme || 'emerald'}
            onChange={(e) => updateSelectedNodeProps({ colorScheme: e.target.value })}
            className="w-full bg-slate-50 border border-slate-300 rounded px-2 py-1 text-xs"
          >
            <option value="emerald">Grün (Aktiv / Erfolgreich)</option>
            <option value="amber">Orange (In Bearbeitung / Warnung)</option>
            <option value="rose">Rot (Dringend / Fehler)</option>
            <option value="indigo">Indigo (Info / System)</option>
            <option value="blue">Blau (In Prüfung)</option>
            <option value="slate">Grau (Entwurf / Archiv)</option>
          </select>
        </div>
      </div>
    );
  }

  if (selectedNode.type === 'action_group') {
    const actions = props.actions || [
      { label: 'Exportieren', icon: 'Download', variant: 'secondary', actionType: 'export' },
      { label: 'Speichern', icon: 'Check', variant: 'primary', actionType: 'custom' }
    ];

    const handleAddAction = () => {
      updateSelectedNodeProps({
        actions: [...actions, { label: 'Neue Aktion', icon: 'Play', variant: 'secondary', actionType: 'custom' }]
      });
    };

    const handleRemoveAction = (idx: number) => {
      const next = [...actions];
      next.splice(idx, 1);
      updateSelectedNodeProps({ actions: next });
    };

    const handleUpdateAction = (idx: number, field: string, value: string) => {
      const next = [...actions];
      next[idx] = { ...next[idx], [field]: value };
      updateSelectedNodeProps({ actions: next });
    };

    return (
      <div className="space-y-4">
        <div>
          <h4 className="text-xs font-bold text-indigo-600 mb-2">Aktionsleiste / Button-Gruppe</h4>
        </div>
        <div className="space-y-2">
          {actions.map((act: any, idx: number) => (
            <div key={idx} className="p-2 border border-slate-200 rounded bg-slate-50 space-y-1.5">
              <div className="flex items-center gap-1.5">
                <input
                  type="text"
                  value={act.label}
                  onChange={(e) => handleUpdateAction(idx, 'label', e.target.value)}
                  placeholder="Button Label"
                  className="flex-1 px-1.5 py-0.5 text-xs border border-slate-300 rounded bg-white"
                />
                <button
                  type="button"
                  onClick={() => handleRemoveAction(idx)}
                  className="p-1 text-slate-400 hover:text-red-500"
                >
                  <Trash2 size={13} />
                </button>
              </div>
              <div className="grid grid-cols-2 gap-1.5">
                <select
                  value={act.variant || 'secondary'}
                  onChange={(e) => handleUpdateAction(idx, 'variant', e.target.value)}
                  className="bg-white border border-slate-300 rounded px-1.5 py-0.5 text-[11px]"
                >
                  <option value="primary">Primär (Farbig)</option>
                  <option value="secondary">Sekundär (Outline)</option>
                  <option value="danger">Gefahr (Rot)</option>
                </select>
                <input
                  type="text"
                  value={act.icon || ''}
                  onChange={(e) => handleUpdateAction(idx, 'icon', e.target.value)}
                  placeholder="Icon (z.B. Download)"
                  className="px-1.5 py-0.5 text-[11px] border border-slate-300 rounded bg-white font-mono"
                />
              </div>
            </div>
          ))}
          <button
            type="button"
            onClick={handleAddAction}
            className="w-full text-center py-1.5 border border-dashed border-indigo-300 text-indigo-600 text-xs font-semibold rounded hover:bg-indigo-50"
          >
            + Button hinzufügen
          </button>
        </div>
      </div>
    );
  }

  if (selectedNode.type === 'search_filter_bar') {
    return (
      <div className="space-y-4">
        <div>
          <h4 className="text-xs font-bold text-indigo-600 mb-2 flex items-center gap-1.5">
            <Search size={14} /> Such- & Filterleiste
          </h4>
        </div>
        <div>
          <label className="block text-xs font-semibold text-slate-600 mb-1">Platzhalter-Text</label>
          <input
            type="text"
            value={props.placeholder || ''}
            onChange={(e) => updateSelectedNodeProps({ placeholder: e.target.value })}
            placeholder="Suchen..."
            className="w-full px-2 py-1 text-xs border border-slate-300 rounded"
          />
        </div>
        <label className="flex items-center gap-2 text-xs text-slate-700 cursor-pointer pt-1">
          <input
            type="checkbox"
            checked={props.showFilterTags !== false}
            onChange={(e) => updateSelectedNodeProps({ showFilterTags: e.target.checked })}
            className="rounded text-indigo-600 border-slate-300"
          />
          Filter-Tabs anzeigen
        </label>
      </div>
    );
  }

  if (selectedNode.type === 'grid_layout') {
    return (
      <div className="space-y-4">
        <div>
          <h4 className="text-xs font-bold text-indigo-600 mb-2 flex items-center gap-1.5">
            <LayoutGrid size={14} /> Responsive Grid Layout
          </h4>
        </div>
        <div>
          <label className="block text-xs font-semibold text-slate-600 mb-1">Spalten-Anzahl (Desktop)</label>
          <select
            value={props.columns || 3}
            onChange={(e) => updateSelectedNodeProps({ columns: parseInt(e.target.value, 10) })}
            className="w-full bg-slate-50 border border-slate-300 rounded px-2 py-1 text-xs"
          >
            <option value="2">2 Spalten (50% / 50%)</option>
            <option value="3">3 Spalten (Drittel)</option>
            <option value="4">4 Spalten (Viertel)</option>
            <option value="6">6 Spalten</option>
          </select>
        </div>
        <div>
          <label className="block text-xs font-semibold text-slate-600 mb-1">Abstand (Gap)</label>
          <select
            value={props.gap || 4}
            onChange={(e) => updateSelectedNodeProps({ gap: parseInt(e.target.value, 10) })}
            className="w-full bg-slate-50 border border-slate-300 rounded px-2 py-1 text-xs"
          >
            <option value="2">Kompakt (gap-2 / 8px)</option>
            <option value="4">Standard (gap-4 / 16px)</option>
            <option value="6">Großzügig (gap-6 / 24px)</option>
            <option value="8">Sehr weit (gap-8 / 32px)</option>
          </select>
        </div>
      </div>
    );
  }

  return null;
};
