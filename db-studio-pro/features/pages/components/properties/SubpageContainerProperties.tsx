import React from 'react';
import { Trash2, Layers } from 'lucide-react';
import { PageComponent, CustomPage } from '../../../../types';

interface SubpageContainerPropertiesProps {
  selectedNode: PageComponent;
  updateSelectedNodeProps: (newProps: any) => void;
  pages: CustomPage[];
}

export const SubpageContainerProperties: React.FC<SubpageContainerPropertiesProps> = ({
  selectedNode,
  updateSelectedNodeProps,
  pages,
}) => {
  const mappings = selectedNode.props.parameterMappings || [];
  
  const addMapping = () => {
    const newMapping = { sourceKey: '', targetKey: '' };
    updateSelectedNodeProps({ parameterMappings: [...mappings, newMapping] });
  };

  const removeMapping = (idx: number) => {
    const next = [...mappings];
    next.splice(idx, 1);
    updateSelectedNodeProps({ parameterMappings: next });
  };

  const updateMapping = (idx: number, field: 'sourceKey' | 'targetKey', val: string) => {
    const next = [...mappings];
    next[idx] = { ...next[idx], [field]: val };
    updateSelectedNodeProps({ parameterMappings: next });
  };

  return (
    <div className="space-y-4">
      <div>
        <h4 className="text-xs font-bold text-emerald-600 mb-2">Unterseiten-Einstellungen</h4>
        <label className="block text-xs font-semibold text-slate-600 mb-1">Eingebundene Seite (Sub-Page)</label>
        <select 
          value={selectedNode.props.subPageId || ''} 
          onChange={(e: any) => updateSelectedNodeProps({ subPageId: e.target.value })}
          className="w-full bg-slate-50 border border-slate-300 rounded px-2 py-1 text-xs mb-3"
        >
          <option value="">-- Keine Seite ausgewählt --</option>
          {pages.map(p => (
            <option key={p.id} value={p.id}>
              {p.name}{p.isSubpage ? ' (Unterseite)' : ''}
            </option>
          ))}
        </select>
      </div>

      <div className="pt-4 border-t border-slate-100">
        <h4 className="text-xs font-bold text-slate-700 mb-2">Parameter-Mapping</h4>
        <p className="text-[10px] text-slate-400 mb-3">
          Definiere, welche Variablen oder Spaltenwerte der Hauptseite an die Unterseite übergeben werden sollen.
        </p>
        
        <div className="space-y-2">
          {mappings.map((m: any, idx: number) => (
            <div key={idx} className="flex items-center gap-1.5 bg-slate-50 p-2 rounded border border-slate-200">
              <div className="flex-1 space-y-1">
                <input 
                  type="text"
                  value={m.sourceKey}
                  onChange={(e) => updateMapping(idx, 'sourceKey', e.target.value)}
                  placeholder="Source (z.B. id)"
                  className="w-full px-1.5 py-0.5 text-[11px] border border-slate-300 rounded font-mono"
                />
                <input 
                  type="text"
                  value={m.targetKey}
                  onChange={(e) => updateMapping(idx, 'targetKey', e.target.value)}
                  placeholder="Target (z.B. filterId)"
                  className="w-full px-1.5 py-0.5 text-[11px] border border-slate-300 rounded font-mono"
                />
              </div>
              <button 
                onClick={() => removeMapping(idx)}
                className="text-slate-400 hover:text-red-500 p-1"
                title="Mapping löschen"
                type="button"
              >
                <Trash2 size={14} />
              </button>
            </div>
          ))}
          
          <button 
            onClick={addMapping}
            className="w-full text-center py-1.5 border border-dashed border-slate-300 rounded text-xs font-semibold text-slate-600 hover:bg-slate-50 transition"
            type="button"
          >
            + Mapping hinzufügen
          </button>
        </div>
      </div>
    </div>
  );
};
