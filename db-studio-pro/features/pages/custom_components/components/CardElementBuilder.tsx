import React from 'react';
import { LayoutGrid, Plus, ArrowUpDown, Trash2 } from 'lucide-react';

interface CardElementBuilderProps {
  configObj: any;
  updateVisualConfig: (newProps: any) => void;
  fields: any[];
}

export const CardElementBuilder: React.FC<CardElementBuilderProps> = ({
  configObj,
  updateVisualConfig,
  fields,
}) => {
  return (
    <div className="space-y-3 pt-4 border-t border-slate-100">
      <div className="flex justify-between items-center">
        <h4 className="text-xs font-bold text-indigo-600 uppercase tracking-wider flex items-center gap-1">
          <LayoutGrid size={13} /> Card Element Builder
        </h4>
        <button
          onClick={() => {
            const template = [...(configObj.cardTemplate || [])];
            template.push({
              type: 'description',
              field: fields[0]?.name || 'id',
              label: 'Neues Element',
              style: 'text-xs text-slate-600'
            });
            updateVisualConfig({ cardTemplate: template });
          }}
          className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 flex items-center gap-1 bg-indigo-50 px-2 py-1 rounded hover:bg-indigo-100 transition"
        >
          <Plus size={12} />
          <span>Element</span>
        </button>
      </div>

      {(!configObj.cardTemplate || configObj.cardTemplate.length === 0) ? (
        <div className="text-center p-6 border border-dashed border-slate-200 rounded text-xs text-slate-400">
          Keine Card-Elemente vorhanden. Klicken Sie auf + Element.
        </div>
      ) : (
        <div className="space-y-3 max-h-[400px] overflow-y-auto pr-1">
          {configObj.cardTemplate.map((elem: any, idx: number) => (
            <div key={idx} className="p-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg space-y-2 relative group">
              <div className="absolute top-2.5 right-2 flex gap-1 opacity-60 group-hover:opacity-100 transition">
                <button
                  onClick={() => {
                    if (idx === 0) return;
                    const next = [...configObj.cardTemplate];
                    const temp = next[idx];
                    next[idx] = next[idx - 1];
                    next[idx - 1] = temp;
                    updateVisualConfig({ cardTemplate: next });
                  }}
                  disabled={idx === 0}
                  className="p-1 hover:bg-slate-200 rounded text-slate-400 disabled:opacity-25"
                  title="Nach oben"
                >
                  <ArrowUpDown size={11} />
                </button>
                <button
                  onClick={() => {
                    const next = [...configObj.cardTemplate];
                    const temp = next[idx];
                    next[idx] = next[idx + 1];
                    next[idx + 1] = temp;
                    updateVisualConfig({ cardTemplate: next });
                  }}
                  disabled={idx === configObj.cardTemplate.length - 1}
                  className="p-1 hover:bg-slate-200 rounded text-slate-400 disabled:opacity-25"
                  title="Nach unten"
                >
                  <ArrowUpDown size={11} className="rotate-180" />
                </button>
                <button
                  onClick={() => {
                    const next = configObj.cardTemplate.filter((_: any, i: number) => i !== idx);
                    updateVisualConfig({ cardTemplate: next });
                  }}
                  className="p-1 hover:bg-red-50 text-slate-400 hover:text-red-500 rounded"
                  title="Löschen"
                >
                  <Trash2 size={11} />
                </button>
              </div>

              {/* Elem Type */}
              <div className="grid grid-cols-2 gap-2 pr-12">
                <div>
                  <label className="block text-[9px] font-bold text-slate-500 uppercase">Komponenten-Typ</label>
                  <select
                    value={elem.type}
                    onChange={(e) => {
                      const next = [...configObj.cardTemplate];
                      let newStyle = next[idx].style;
                      if (e.target.value === 'title') newStyle = 'text-sm font-bold text-slate-800';
                      else if (e.target.value === 'badge') newStyle = 'bg-indigo-50 text-indigo-700 text-[10px] font-bold px-2 py-0.5 rounded-full inline-block w-fit';
                      else if (e.target.value === 'description') newStyle = 'text-xs text-slate-500 mt-1';
                      else if (e.target.value === 'button') newStyle = 'mt-2 text-xs text-white bg-indigo-600 font-semibold px-3 py-1 rounded inline-block text-center';
                      next[idx] = { ...next[idx], type: e.target.value, style: newStyle };
                      updateVisualConfig({ cardTemplate: next });
                    }}
                    className="w-full border border-slate-300 rounded px-1.5 py-0.5 text-xs bg-white text-slate-700"
                  >
                    <option value="title">Titel (Fett / Groß)</option>
                    <option value="badge">Status-Badge (Kapsel)</option>
                    <option value="description">Beschreibungstext</option>
                    <option value="subtitle">Untertitel (Grau)</option>
                    <option value="button">CTA Aktions-Button</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[9px] font-bold text-slate-500 uppercase">DB-Feld (Wert)</label>
                  <select
                    value={elem.field}
                    onChange={(e) => {
                      const next = [...configObj.cardTemplate];
                      next[idx] = { ...next[idx], field: e.target.value };
                      updateVisualConfig({ cardTemplate: next });
                    }}
                    className="w-full border border-slate-300 rounded px-1.5 py-0.5 text-xs bg-white text-slate-700"
                  >
                    {fields.length === 0 ? (
                      <>
                        <option value="Name">Name</option>
                        <option value="Status">Status</option>
                        <option value="Email">Email</option>
                        <option value="Umsatz">Umsatz</option>
                        <option value="Datum">Datum</option>
                      </>
                    ) : (
                      fields.map(f => <option key={f.name} value={f.name}>{f.name}</option>)
                    )}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[9px] font-bold text-slate-500 uppercase">Label / Präfix</label>
                  <input 
                    type="text"
                    value={elem.label || ''}
                    onChange={(e) => {
                      const next = [...configObj.cardTemplate];
                      next[idx] = { ...next[idx], label: e.target.value };
                      updateVisualConfig({ cardTemplate: next });
                    }}
                    placeholder="Z.B. Name:"
                    className="w-full px-2 py-0.5 text-xs border border-slate-300 rounded"
                  />
                </div>
                <div>
                  <label className="block text-[9px] font-bold text-slate-500 uppercase font-mono">Tailwind CSS Stil</label>
                  <input 
                    type="text"
                    value={elem.style || ''}
                    onChange={(e) => {
                      const next = [...configObj.cardTemplate];
                      next[idx] = { ...next[idx], style: e.target.value };
                      updateVisualConfig({ cardTemplate: next });
                    }}
                    className="w-full px-2 py-0.5 text-xs border border-slate-300 rounded font-mono text-[10px]"
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
