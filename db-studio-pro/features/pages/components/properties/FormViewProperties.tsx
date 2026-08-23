import React from 'react';
import { PageComponent, Form, Table } from '../../../../types';

interface FormViewPropertiesProps {
  selectedNode: PageComponent;
  updateSelectedNodeProps: (newProps: any) => void;
  forms: Form[];
  tables: Table[];
}

export const FormViewProperties: React.FC<FormViewPropertiesProps> = ({
  selectedNode,
  updateSelectedNodeProps,
  forms,
  tables,
}) => {
  return (
    <div className="pt-4 border-t border-slate-200 space-y-4">
      <h4 className="text-xs font-bold text-emerald-600 mb-2">Formular (Embedded)</h4>
      
      <div>
        <label className="block text-[10px] font-bold text-indigo-900 mb-1">Formular auswählen</label>
        <select
          value={selectedNode.props.formId || ''}
          onChange={(e) => updateSelectedNodeProps({ formId: e.target.value })}
          className="w-full bg-white border border-indigo-200 rounded px-2 py-1.5 text-xs focus:ring-1 focus:ring-indigo-500"
        >
          <option value="">-- Formular wählen --</option>
          {forms.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
        </select>
      </div>

      <div>
        <label className="block text-[10px] font-bold text-indigo-900 mb-1">Modus</label>
        <select
          value={selectedNode.props.formMode || 'edit'}
          onChange={(e) => updateSelectedNodeProps({ formMode: e.target.value })}
          className="w-full bg-white border border-indigo-200 rounded px-2 py-1.5 text-xs focus:ring-1 focus:ring-indigo-500"
        >
          <option value="create">Neuen Datensatz erstellen (Create)</option>
          <option value="edit">Ausgewählten Datensatz bearbeiten (Update)</option>
          <option value="readonly">Nur Lesen (View)</option>
        </select>
      </div>

      {selectedNode.props.formMode === 'edit' && (
        <p className="text-[9px] text-slate-500">
          Liest die Datensatz-ID aus dem Parameter <code className="font-mono text-indigo-700 bg-white px-0.5 border font-semibold">selectedId</code>.
        </p>
      )}

      <div className="space-y-2 pt-2 border-t border-slate-200 mt-2">
        <label className="block text-[10px] font-bold text-slate-500 uppercase">Ausblenden</label>
        <label className="flex items-center gap-2 text-xs text-slate-600 cursor-pointer">
          <input 
            type="checkbox" 
            checked={selectedNode.props.hideNavigation || false}
            onChange={(e) => updateSelectedNodeProps({ hideNavigation: e.target.checked })}
          />
          Navigation (Pfeile) verbergen
        </label>
        <label className="flex items-center gap-2 text-xs text-slate-600 cursor-pointer">
          <input 
            type="checkbox" 
            checked={selectedNode.props.hideActions || false}
            onChange={(e) => updateSelectedNodeProps({ hideActions: e.target.checked })}
          />
          Aktionen (Speichern/Löschen/Neu) verbergen
        </label>
        <label className="flex items-center gap-2 text-xs text-slate-600 cursor-pointer">
          <input 
            type="checkbox" 
            checked={selectedNode.props.hideHeader || false}
            onChange={(e) => updateSelectedNodeProps({ hideHeader: e.target.checked })}
          />
          Kopfzeile (Titel & Schließen-X) verbergen
        </label>
      </div>

      <div className="pt-2 border-t border-indigo-100">
        <span className="block text-[10px] font-bold text-indigo-900 mb-1.5 flex justify-between items-center">
          <span>Parameter (Default Values)</span>
          <button 
            type="button"
            onClick={() => {
              const m = selectedNode.props.navigateTargetParams || [];
              updateSelectedNodeProps({
                navigateTargetParams: [...m, { sourceKey: '', targetKey: '' }]
              });
            }}
            className="text-[9px] text-indigo-700 hover:underline font-bold"
          >
            + Hinzufügen
          </button>
        </span>
        {(() => {
          const mappings = selectedNode.props.navigateTargetParams || [];
          const formObj = forms.find(f => f.id === selectedNode.props.formId);
          const sourceTable = formObj ? tables.find(t => t.id === formObj.sourceId) : null;
          const formFields = sourceTable?.fields || [];
          
          return (
            <div className="space-y-1.5">
              {mappings.length === 0 ? (
                <span className="text-[9px] text-slate-400 italic block leading-normal">Keine Parameter definiert. Aktuelle Seiten-Parameter werden automatisch übergeben.</span>
              ) : (
                mappings.map((mapping: any, mIdx: number) => (
                  <div key={mIdx} className="flex items-center gap-1 w-full bg-white p-1 rounded border border-indigo-50 shadow-sm font-mono text-[10px]">
                    <input
                      type="text"
                      value={mapping.sourceKey}
                      onChange={(e) => {
                        const copy = [...mappings];
                        copy[mIdx] = { ...copy[mIdx], sourceKey: e.target.value };
                        updateSelectedNodeProps({ navigateTargetParams: copy });
                      }}
                      placeholder="Quelle (z.B. id)"
                      className="flex-1 text-[10px] font-mono px-1.5 py-0.5 border border-slate-300 rounded min-w-0"
                    />
                    <span className="text-slate-400">➔</span>
                    <select
                      value={mapping.targetKey}
                      onChange={(e) => {
                        const copy = [...mappings];
                        copy[mIdx] = { ...copy[mIdx], targetKey: e.target.value };
                        updateSelectedNodeProps({ navigateTargetParams: copy });
                      }}
                      className="flex-1 text-[10px] font-mono px-1 py-0.5 border border-slate-300 rounded bg-white min-w-0"
                    >
                      <option value="">Formular-Feld</option>
                      {formFields.map(f => <option key={f.name} value={f.name}>{f.name}</option>)}
                    </select>
                    <button
                      type="button"
                      onClick={() => {
                        updateSelectedNodeProps({
                          navigateTargetParams: mappings.filter((_:any, idx:number) => idx !== mIdx)
                        });
                      }}
                      className="text-red-500 text-[11px] font-bold px-1"
                    >
                      ×
                    </button>
                  </div>
                ))
              )}
            </div>
          );
        })()}
      </div>
    </div>
  );
};
