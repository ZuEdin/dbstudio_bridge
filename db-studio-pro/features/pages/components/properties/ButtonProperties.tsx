import React from 'react';
import { MousePointerClick } from 'lucide-react';
import { PageComponent, Form, Table, CustomPage } from '../../../../types';

interface ButtonPropertiesProps {
  selectedNode: PageComponent;
  updateSelectedNodeProps: (newProps: any) => void;
  forms: Form[];
  tables: Table[];
  pages: CustomPage[];
}

export const ButtonProperties: React.FC<ButtonPropertiesProps> = ({
  selectedNode,
  updateSelectedNodeProps,
  forms,
  tables,
  pages,
}) => {
  return (
    <div className="space-y-4">
      <div>
        <label className="block text-xs font-semibold text-slate-600 mb-1">Button-Beschriftung</label>
        <input
          type="text"
          value={selectedNode.props.label || ''}
          onChange={(e) => updateSelectedNodeProps({ label: e.target.value })}
          className="w-full px-2 py-1.5 text-xs border border-slate-300 rounded focus:ring-1 focus:ring-indigo-500"
        />
      </div>

      <div className="pt-3 border-t border-slate-100">
        <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1">
          <MousePointerClick size={14} className="text-indigo-600" />
          Button-Aktion (CRUD &amp; Navigation)
        </label>
        <select
          value={selectedNode.props.actionType || 'none'}
          onChange={(e) => updateSelectedNodeProps({ 
            actionType: e.target.value,
            formId: '',
            formMode: 'create',
            targetTableId: '',
            paramKey: 'selectedId',
            paramName: '',
            paramValue: '',
            targetPageId: '',
            navigateTargetParams: []
          })}
          className="w-full bg-slate-50 border border-slate-300 rounded px-2 py-1.5 text-xs focus:ring-1 focus:ring-indigo-500"
        >
          <option value="none">Keine Aktion</option>
          <option value="open_form">Formular öffnen (CRUD Create/Edit)</option>
          <option value="delete_record">Datensatz löschen (CRUD Delete)</option>
          <option value="set_parameter">Parameter setzen (Status / Filter)</option>
          <option value="navigate_to_page">Seite wechseln (Details / Navigation)</option>
          <option value="run_macro">⚡ Makro Ausführen</option>
          <option value="export_report">📊 Bericht / Tabelle Exportieren (PDF, Excel, XML, JSON, CSV)</option>
          <option value="smart_import">📥 Smart Upload & Import Wizard Starten</option>
        </select>
      </div>

      {/* Macro Action Fields */}
      {selectedNode.props.actionType === 'run_macro' && (
        <div className="space-y-3 bg-purple-50/50 border border-purple-200 rounded p-2.5 text-xs font-mono">
          <p className="text-purple-900 font-bold">⚡ Makro-Steuerung</p>
          <p className="text-[10px] text-purple-700 font-sans">Klick führt den Makro-Manager aus oder startet konfigurierte Makros.</p>
        </div>
      )}

      {/* Smart Import Action Fields */}
      {selectedNode.props.actionType === 'smart_import' && (
        <div className="space-y-3 bg-emerald-50/50 border border-emerald-200 rounded p-2.5 text-xs font-mono">
          <p className="text-emerald-900 font-bold">📥 Smart Import Assistent</p>
          <div>
            <label className="block text-[10px] font-bold text-slate-700 mb-1">Zieltabelle (Optional)</label>
            <select
              value={selectedNode.props.targetTableId || ''}
              onChange={(e) => updateSelectedNodeProps({ targetTableId: e.target.value })}
              className="w-full bg-white border border-slate-300 rounded px-2 py-1 text-xs"
            >
              <option value="">-- Bei Upload frei wählen --</option>
              {tables.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
            </select>
          </div>
        </div>
      )}

      {/* Export Report Action Fields */}
      {selectedNode.props.actionType === 'export_report' && (
        <div className="space-y-3 bg-indigo-50/50 border border-indigo-200 rounded p-2.5 text-xs font-mono">
          <p className="text-indigo-900 font-bold">📊 Berichts-Export Optionen</p>
          <div>
            <label className="block text-[10px] font-bold text-slate-700 mb-1">Export-Format</label>
            <select
              value={selectedNode.props.exportFormat || 'PDF'}
              onChange={(e) => updateSelectedNodeProps({ exportFormat: e.target.value })}
              className="w-full bg-white border border-slate-300 rounded px-2 py-1 text-xs font-bold text-indigo-700"
            >
              <option value="PDF">📄 PDF Dokument</option>
              <option value="XLSX">📈 Excel Arbeitsmappe (.xlsx)</option>
              <option value="CSV">📑 CSV Tabelle (.csv)</option>
              <option value="JSON">📦 JSON Datei (.json)</option>
              <option value="XML">🏷️ XML Dokument (.xml)</option>
              <option value="HTML_PRINT">🖨️ Druckansicht</option>
            </select>
          </div>
          <div>
            <label className="block text-[10px] font-bold text-slate-700 mb-1">Zieltabelle</label>
            <select
              value={selectedNode.props.targetTableId || ''}
              onChange={(e) => updateSelectedNodeProps({ targetTableId: e.target.value })}
              className="w-full bg-white border border-slate-300 rounded px-2 py-1 text-xs"
            >
              <option value="">-- Tabelle wählen --</option>
              {tables.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
            </select>
          </div>
        </div>
      )}

      {/* Open Form Action Fields */}
      {selectedNode.props.actionType === 'open_form' && (
        <div className="space-y-3 bg-indigo-50/30 border border-indigo-100 rounded p-2.5">
          <div>
            <label className="block text-[10px] font-bold text-indigo-900 mb-1">Formular wählen</label>
            <select
              value={selectedNode.props.formId || ''}
              onChange={(e) => updateSelectedNodeProps({ formId: e.target.value })}
              className="w-full bg-white border border-slate-300 rounded px-2 py-1 text-xs"
            >
              <option value="">-- Formular wählen --</option>
              {forms.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-[10px] font-bold text-indigo-900 mb-1">Modus</label>
            <select
              value={selectedNode.props.formMode || 'create'}
              onChange={(e) => updateSelectedNodeProps({ formMode: e.target.value })}
              className="w-full bg-white border border-slate-300 rounded px-2 py-1 text-xs"
            >
              <option value="create">Neuen Datensatz erstellen (Create)</option>
              <option value="edit">Ausgewählten Datensatz bearbeiten (Update)</option>
            </select>
          </div>
          {selectedNode.props.formMode === 'edit' && (
            <p className="text-[9px] text-slate-500">
              Liest die Datensatz-ID aus dem Parameter <code className="font-mono text-indigo-700 bg-white px-0.5 border font-semibold">selectedId</code>.
            </p>
          )}
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
              const targetForm = forms.find(f => f.id === selectedNode.props.formId);
              const targetTable = tables.find(t => t.id === targetForm?.sourceId);
              const formFields = targetTable?.fields || [];

              return (
                <div className="space-y-1.5">
                  {mappings.length === 0 ? (
                    <span className="text-[9px] text-slate-400 italic block leading-normal">Aktuelle Seiten-Parameter werden automatisch übergeben, falls Feldnamen übereinstimmen.</span>
                  ) : (
                    mappings.map((mapping: any, mIdx: number) => (
                      <div key={mIdx} className="flex gap-1 items-center">
                        <input
                          type="text"
                          value={mapping.sourceKey}
                          onChange={(e) => {
                            const copy = [...mappings];
                            copy[mIdx] = { ...copy[mIdx], sourceKey: e.target.value };
                            updateSelectedNodeProps({ navigateTargetParams: copy });
                          }}
                          placeholder="Quelle (z.B. id)"
                          className="flex-1 text-[10px] font-mono px-1.5 py-0.5 border border-slate-300 rounded"
                        />
                        <span className="text-slate-400">➔</span>
                        <select
                          value={mapping.targetKey}
                          onChange={(e) => {
                            const copy = [...mappings];
                            copy[mIdx] = { ...copy[mIdx], targetKey: e.target.value };
                            updateSelectedNodeProps({ navigateTargetParams: copy });
                          }}
                          className="flex-1 text-[10px] font-mono px-1 py-0.5 border border-slate-300 rounded bg-white"
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
      )}

      {/* Delete Record Action Fields */}
      {selectedNode.props.actionType === 'delete_record' && (
        <div className="space-y-3 bg-red-50/30 border border-red-100 rounded p-2.5">
          <div>
            <label className="block text-[10px] font-bold text-red-900 mb-1">Tabelle wählen</label>
            <select
              value={selectedNode.props.targetTableId || ''}
              onChange={(e) => updateSelectedNodeProps({ targetTableId: e.target.value })}
              className="w-full bg-white border border-slate-300 rounded px-2 py-1 text-xs"
            >
              <option value="">-- Tabelle wählen --</option>
              {tables.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-[10px] font-bold text-red-900 mb-1">ID Parameterquelle</label>
            <input
              type="text"
              value={selectedNode.props.paramKey || 'selectedId'}
              onChange={(e) => updateSelectedNodeProps({ paramKey: e.target.value })}
              placeholder="z.B. selectedId"
              className="w-full px-2 py-1 text-xs border border-slate-300 rounded font-mono"
            />
          </div>
          <p className="text-[9px] text-slate-500 leading-normal">
            Löscht den Datensatz, dessen Primärschlüssel dem Parameterwert entspricht.
          </p>
        </div>
      )}

      {/* Set Parameter Action Fields */}
      {selectedNode.props.actionType === 'set_parameter' && (
        <div className="space-y-3 bg-slate-50 border border-slate-200 rounded p-2.5">
          <div>
            <label className="block text-[10px] font-bold text-slate-700 mb-1">Parameter Name</label>
            <input
              type="text"
              value={selectedNode.props.paramName || ''}
              onChange={(e) => updateSelectedNodeProps({ paramName: e.target.value })}
              placeholder="z.B. filterId"
              className="w-full px-2 py-1 text-xs border border-slate-300 rounded font-mono"
            />
          </div>
          <div>
            <label className="block text-[10px] font-bold text-slate-700 mb-1">Parameter-Wert</label>
            <input
              type="text"
              value={selectedNode.props.paramValue || ''}
              onChange={(e) => updateSelectedNodeProps({ paramValue: e.target.value })}
              placeholder="z.B. {{id}} oder Konstante"
              className="w-full px-2 py-1 text-xs border border-slate-300 rounded font-mono"
            />
            <span className="text-[8px] text-slate-400 mt-0.5 block leading-normal">
              Unterstützt Platzhalter wie <code className="bg-white px-0.5">{"{{id}}"}</code> aus dem Schleifen-Kontext.
            </span>
          </div>
        </div>
      )}

      {/* Navigate to Page Action Fields */}
      {selectedNode.props.actionType === 'navigate_to_page' && (
        <div className="space-y-3 bg-emerald-50/30 border border-emerald-100 rounded p-2.5">
          <div>
            <label className="block text-[10px] font-bold text-emerald-900 mb-1">Zielseite</label>
            <select
              value={selectedNode.props.targetPageId || ''}
              onChange={(e) => updateSelectedNodeProps({ targetPageId: e.target.value })}
              className="w-full bg-white border border-slate-300 rounded px-2 py-1 text-xs"
            >
              <option value="">-- Seite wählen --</option>
              {pages.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </div>

          <div className="pt-2 border-t border-emerald-100">
            <span className="block text-[10px] font-bold text-emerald-900 mb-1.5 flex justify-between items-center">
              <span>Parameter-Übergabe</span>
              <button 
                type="button"
                onClick={() => {
                  const m = selectedNode.props.navigateTargetParams || [];
                  updateSelectedNodeProps({
                    navigateTargetParams: [...m, { sourceKey: '', targetKey: '' }]
                  });
                }}
                className="text-[9px] text-emerald-700 hover:underline font-bold"
              >
                + Hinzufügen
              </button>
            </span>
            {(() => {
              const mappings = selectedNode.props.navigateTargetParams || [];
              const targetPage = pages.find(p => p.id === selectedNode.props.targetPageId);
              const expectedTargetParams = targetPage?.expectedParams || [];

              return (
                <div className="space-y-1.5">
                  {mappings.length === 0 ? (
                    <span className="text-[9px] text-slate-400 italic block">Keine Übergabe definiert.</span>
                  ) : (
                    mappings.map((mapping: any, mIdx: number) => (
                      <div key={mIdx} className="flex gap-1 items-center">
                        <input
                          type="text"
                          value={mapping.sourceKey}
                          onChange={(e) => {
                            const copy = [...mappings];
                            copy[mIdx] = { ...copy[mIdx], sourceKey: e.target.value };
                            updateSelectedNodeProps({ navigateTargetParams: copy });
                          }}
                          placeholder="Quelle (z.B. {{id}})"
                          className="flex-1 text-[10px] font-mono px-1.5 py-0.5 border border-slate-300 rounded"
                        />
                        <span className="text-slate-400">➔</span>
                        <select
                          value={mapping.targetKey}
                          onChange={(e) => {
                            const copy = [...mappings];
                            copy[mIdx] = { ...copy[mIdx], targetKey: e.target.value };
                            updateSelectedNodeProps({ navigateTargetParams: copy });
                          }}
                          className="flex-1 text-[10px] font-mono px-1 py-0.5 border border-slate-300 rounded bg-white"
                        >
                          <option value="">Ziel-Key</option>
                          {expectedTargetParams.map(p => <option key={p} value={p}>{p}</option>)}
                          <option value="id">id (Standard)</option>
                          <option value="selectedId">selectedId</option>
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
      )}
    </div>
  );
};
