
import React, { useState, useEffect } from 'react';
import { FormElement, Form, Table, Relationship } from '../../../types/index';
import { Edit3, Trash2, Settings2, Shield, Users, Zap, Plus, ChevronDown, ArrowUp, ArrowDown, Sparkles } from 'lucide-react';
import { getSavedMacros } from '../../logic/MacroEngine';

interface CommaSeparatedInputProps {
  value: string[];
  onChange: (value: string[]) => void;
  placeholder?: string;
  className?: string;
}

const CommaSeparatedInput: React.FC<CommaSeparatedInputProps> = ({ value, onChange, placeholder, className }) => {
  const [localValue, setLocalValue] = useState(value.join(', '));

  useEffect(() => {
    const normalizedProp = value.join(', ');
    const normalizedLocal = localValue.split(',').map(v => v.trim()).filter(Boolean).join(', ');
    if (normalizedProp !== normalizedLocal) {
      setLocalValue(normalizedProp);
    }
  }, [value]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;
    setLocalValue(raw);
    const parsed = raw.split(',').map(v => v.trim());
    const filtered = parsed.filter(v => v !== '');
    onChange(filtered);
  };

  const handleBlur = () => {
    const parsed = localValue.split(',').map(v => v.trim()).filter(Boolean);
    setLocalValue(parsed.join(', '));
    onChange(parsed);
  };

  return (
    <input
      type="text"
      placeholder={placeholder}
      value={localValue}
      onChange={handleChange}
      onBlur={handleBlur}
      className={className}
    />
  );
};

const parseBorder = (className: string): string => {
  if (className.includes('border-dashed')) return 'dashed';
  if (className.includes('border-0')) return 'none';
  if (className.includes('border-solid') || className.includes('border')) return 'solid';
  return 'none';
};

const parseBg = (className: string): string => {
  if (className.includes('bg-transparent')) return 'transparent';
  if (className.includes('bg-white')) return 'white';
  if (className.includes('bg-slate-50')) return 'slate-50';
  if (className.includes('bg-indigo-50')) return 'indigo-50';
  return 'none';
};

const parsePadding = (className: string): string => {
  const match = className.match(/\bp-\d+\b/);
  return match ? match[0] : 'p-4';
};

const parseGap = (className: string): string => {
  const match = className.match(/\bgap-\d+\b/);
  return match ? match[0] : 'gap-4';
};

const updateContainerClass = (
  currentClass: string,
  border: string,
  bg: string,
  padding: string,
  gap: string
): string => {
  let cleaned = currentClass || '';
  
  cleaned = cleaned.replace(/\bp-\d+\b/g, '').trim();
  cleaned = cleaned.replace(/\bgap-\d+\b/g, '').trim();
  cleaned = cleaned.replace(/\bborder-dashed\b|\bborder-solid\b|\bborder-0\b|\bborder-slate-\d+\b|\bdark:border-slate-\d+\b|\bborder\b/g, '').trim();
  cleaned = cleaned.replace(/\bbg-transparent\b|\bbg-white\b|\bbg-slate-50\/50\b|\bbg-slate-50\b|\bbg-indigo-50\/50\b|\bbg-indigo-50\b|\bdark:bg-slate-\d+\/50\b|\bdark:bg-slate-\d+\b|\bdark:bg-indigo-\d+\/20\b|\bdark:bg-indigo-\d+\b|\bdark:bg-slate-900\b/g, '').trim();

  const parts = [cleaned];
  
  if (border === 'dashed') parts.push('border border-dashed border-slate-300 dark:border-slate-600');
  else if (border === 'solid') parts.push('border border-solid border-slate-200 dark:border-slate-700');
  else if (border === 'none') parts.push('border-0');
  
  if (bg === 'white') parts.push('bg-white dark:bg-slate-900');
  else if (bg === 'slate-50') parts.push('bg-slate-50/50 dark:bg-slate-800/50');
  else if (bg === 'indigo-50') parts.push('bg-indigo-50/50 dark:bg-indigo-950/20');
  else if (bg === 'transparent') parts.push('bg-transparent');
  
  parts.push(padding);
  
  if (cleaned.includes('grid') || cleaned.includes('flex')) {
    parts.push(gap);
  }

  return parts.filter(Boolean).join(' ').replace(/\s+/g, ' ').trim();
};

interface PropertiesPanelProps {
  form: Form;
  selectedElement: FormElement | null;
  allTables: Table[];
  allForms: Form[];
  onPropertyChange: (key: keyof FormElement, value: any) => void;
  onFormPropertyChange: (key: keyof Form, value: any) => void;
  onLookupPropertyChange: (key: string, value: any) => void;
  onSubformPermissionChange: (perm: string, val: boolean) => void;
  onDeleteSelected: () => void;
  onMoveElement?: (direction: 'up' | 'down') => void;
  onShowLookupModal: () => void;
  onToggleFullScreen: () => void;
  onToggleEditButton: () => void;
  onToggleTableSplitView: () => void;
}

export const PropertiesPanel: React.FC<PropertiesPanelProps> = ({
  form,
  selectedElement,
  allTables,
  allForms,
  onPropertyChange,
  onFormPropertyChange,
  onLookupPropertyChange,
  onSubformPermissionChange,
  onDeleteSelected,
  onMoveElement,
  onShowLookupModal,
  onToggleFullScreen,
  onToggleEditButton,
  onToggleTableSplitView
}) => {
  const sourceTable = allTables.find(t => t.id === form.sourceId);

  return (
    <div className="w-72 bg-white border-l border-slate-300 flex flex-col h-full overflow-y-auto">
      <div className="p-4 border-b border-slate-200 bg-slate-50">
        <h3 className="font-bold text-slate-800 flex items-center gap-2">
          <Edit3 size={16}/> Eigenschaften
        </h3>
      </div>
      
      <div className="p-4">
        {selectedElement ? (
          <div className="space-y-4 text-sm">
            <div className="font-mono text-xs text-slate-400">ID: {selectedElement.id.substring(0,8)}...</div>
            
            {(selectedElement.type === 'field' || selectedElement.type === 'label' || selectedElement.type === 'subform' || selectedElement.type === 'tab_page') && (
              <div className="space-y-2">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">{selectedElement.type === 'label' ? 'Text' : selectedElement.type === 'tab_page' ? 'Tab-Titel / Name' : 'Beschriftung'}</label>
                  <input 
                    type="text" 
                    value={selectedElement.label || ''} 
                    onChange={e => onPropertyChange('label', e.target.value)}
                    className="w-full border border-slate-300 rounded p-1.5" 
                  />
                </div>
                {selectedElement.type === 'field' && (
                  <div className="flex items-center gap-2 pt-1">
                    <input
                      id="hide-label-checkbox"
                      type="checkbox"
                      checked={!!selectedElement.hideLabel}
                      onChange={e => onPropertyChange('hideLabel', e.target.checked)}
                      className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 h-4 w-4"
                    />
                    <label htmlFor="hide-label-checkbox" className="text-xs font-semibold text-slate-700 cursor-pointer">
                      Beschriftung ausblenden (verbergen)
                    </label>
                  </div>
                )}
              </div>
            )}

            {selectedElement.type === 'field' && (
              <div className="border p-3 rounded bg-slate-50 space-y-3">
                <div>
                    <label className="block font-bold text-slate-700 mb-1">Widget Typ</label>
                    <select 
                      value={selectedElement.widgetType || ''}
                      onChange={e => onPropertyChange('widgetType', e.target.value)}
                      className="w-full border border-slate-300 rounded p-1.5 bg-white focus:ring-2 focus:ring-blue-500 outline-none"
                    >
                      <option value="">Automatisch (Text)</option>
                      <optgroup label="Standard">
                        <option value="text">Textfeld (Einzeilig)</option>
                        <option value="textarea">Mehrzeilig (Textarea)</option>
                        <option value="markdown">📝 Markdown / Rich-Text Editor</option>
                        <option value="number">Zahl</option>
                        <option value="date">Datum</option>
                        <option value="checkbox">Checkbox</option>
                        <option value="switch">Switch (Schalter)</option>
                        <option value="select">Dropdown (Lookup)</option>
                      </optgroup>
                      <optgroup label="Berechnungen & Ausdrücke">
                        <option value="calculated">⚡ Berechnetes Feld (Formel)</option>
                      </optgroup>
                      <optgroup label="Active Directory / Auth">
                        <option value="ad-search">🔍 AD User Suche</option>
                        <option value="current-user">👤 Aktueller User (WhoAmI)</option>
                      </optgroup>
                    </select>
                </div>

                {/* Additional Info for Markdown */}
                {selectedElement.widgetType === 'markdown' && (
                    <div className="p-2.5 bg-indigo-50 text-indigo-900 text-xs rounded-lg border border-indigo-200 space-y-1.5">
                        <div className="flex items-center gap-1.5 font-bold text-indigo-950">
                            <Sparkles size={13} className="text-indigo-600" /> Markdown / Rich-Text Editor
                        </div>
                        <p className="text-[11px] text-indigo-800 leading-relaxed">
                            Bietet einen visuellen Editor mit Formatierungsleiste (Fett, Kursiv, Überschriften, Listen, Tabellen, Code) und Live-Vorschau. In der Detailansicht wird der formatierte Text direkt visualisiert.
                        </p>
                    </div>
                )}

                {/* Additional Info for AD Types */}
                {selectedElement.widgetType === 'ad-search' && (
                    <div className="p-2 bg-blue-50 text-blue-800 text-xs rounded border border-blue-200">
                        <div className="flex items-center gap-1 font-bold mb-1"><Users size={12}/> AD Suche</div>
                        Ermöglicht das Suchen nach Benutzern im Active Directory via <code>/api/ad/search</code>.
                    </div>
                )}
                {selectedElement.widgetType === 'current-user' && (
                    <div className="p-2 bg-emerald-50 text-emerald-800 text-xs rounded border border-emerald-200">
                        <div className="flex items-center gap-1 font-bold mb-1"><Shield size={12}/> Auto-Fill</div>
                        Füllt das Feld automatisch mit dem Login-Namen des aktuellen Benutzers.
                    </div>
                )}
                {selectedElement.widgetType === 'calculated' && (
                    <div className="p-2.5 bg-amber-50 text-amber-900 text-xs rounded border border-amber-300/80 space-y-2.5">
                        <div className="font-bold text-amber-950 flex items-center justify-between">
                            <span className="flex items-center gap-1">⚡ Formel-Editor (Ausdrücke)</span>
                            <span className="text-[10px] font-mono text-amber-800 bg-amber-200/60 px-1.5 py-0.5 rounded">Access / Excel Math</span>
                        </div>
                        <div>
                            <label className="block text-[10px] font-bold text-amber-800 mb-1">Berechnungsformel:</label>
                            <textarea
                                value={selectedElement.calculationFormula || ''}
                                onChange={e => onPropertyChange('calculationFormula', e.target.value)}
                                rows={3}
                                placeholder="z.B. [Preis] * [Menge] oder IIF([Status] = 'Aktiv', 100, 0)"
                                className="w-full border border-amber-300 rounded p-1.5 font-mono text-xs bg-white text-slate-900 focus:outline-none focus:ring-1 focus:ring-amber-500"
                            />
                        </div>

                        {sourceTable?.fields && sourceTable.fields.length > 0 && (
                          <div>
                            <label className="block text-[10px] font-bold text-amber-800 mb-1">Feld einfügen:</label>
                            <div className="flex flex-wrap gap-1 max-h-24 overflow-y-auto p-1 bg-white/60 rounded border border-amber-200">
                              {sourceTable.fields.map(f => (
                                <button
                                  key={f.id}
                                  type="button"
                                  onClick={() => {
                                    const current = selectedElement.calculationFormula || '';
                                    onPropertyChange('calculationFormula', current ? `${current} [${f.name}]` : `[${f.name}]`);
                                  }}
                                  className="px-1.5 py-0.5 bg-amber-100 hover:bg-amber-200 border border-amber-300 text-amber-900 rounded text-[10px] font-mono transition-colors"
                                  title={`Feld [${f.name}] an Formel anhängen`}
                                >
                                  + [{f.name}]
                                </button>
                              ))}
                            </div>
                          </div>
                        )}

                        <div>
                            <label className="block text-[10px] font-bold text-amber-800 mb-1">Schnell-Vorlagen & Funktionen:</label>
                            <div className="grid grid-cols-1 gap-1 max-h-36 overflow-y-auto pr-0.5">
                                <button
                                    type="button"
                                    onClick={() => onPropertyChange('calculationFormula', 'AGE([Geburtsdatum])')}
                                    className="text-left px-2 py-1 bg-white hover:bg-amber-100 border border-amber-200 rounded text-[11px] font-mono text-amber-900 transition-colors"
                                >
                                    🎂 Alter: AGE([Geburtsdatum])
                                </button>
                                <button
                                    type="button"
                                    onClick={() => onPropertyChange('calculationFormula', '[Preis] * [Menge]')}
                                    className="text-left px-2 py-1 bg-white hover:bg-amber-100 border border-amber-200 rounded text-[11px] font-mono text-amber-900 transition-colors"
                                >
                                    🧮 Multiplikation: [Preis] * [Menge]
                                </button>
                                <button
                                    type="button"
                                    onClick={() => onPropertyChange('calculationFormula', "CONCAT([Vorname], ' ', [Nachname])")}
                                    className="text-left px-2 py-1 bg-white hover:bg-amber-100 border border-amber-200 rounded text-[11px] font-mono text-amber-900 transition-colors"
                                >
                                    👤 Text: CONCAT([Vorname], ' ', [Nachname])
                                </button>
                                <button
                                    type="button"
                                    onClick={() => onPropertyChange('calculationFormula', 'ROUND([Netto] * 1.19, 2)')}
                                    className="text-left px-2 py-1 bg-white hover:bg-amber-100 border border-amber-200 rounded text-[11px] font-mono text-amber-900 transition-colors"
                                >
                                    🏷️ MwSt / Brutto: ROUND([Netto] * 1.19, 2)
                                </button>
                                <button
                                    type="button"
                                    onClick={() => onPropertyChange('calculationFormula', "IIF([Menge] > 10, [Preis] * 0.9, [Preis])")}
                                    className="text-left px-2 py-1 bg-white hover:bg-amber-100 border border-amber-200 rounded text-[11px] font-mono text-amber-900 transition-colors"
                                >
                                    🔀 Bedingung: IIF([Menge] &gt; 10, Rabatt, Normal)
                                </button>
                                <button
                                    type="button"
                                    onClick={() => onPropertyChange('calculationFormula', "SUM([Positionen.Gesamtpreis])")}
                                    className="text-left px-2 py-1 bg-white hover:bg-amber-100 border border-amber-200 rounded text-[11px] font-mono text-amber-900 transition-colors"
                                >
                                    📊 Subform Summe: SUM([Positionen.Gesamtpreis])
                                </button>
                                <button
                                    type="button"
                                    onClick={() => onPropertyChange('calculationFormula', "DATEDIFF('day', [Startdatum], [Enddatum])")}
                                    className="text-left px-2 py-1 bg-white hover:bg-amber-100 border border-amber-200 rounded text-[11px] font-mono text-amber-900 transition-colors"
                                >
                                    📅 Tage: DATEDIFF('day', [Startdatum], [Enddatum])
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {selectedElement.widgetType === 'select' && (
                  <div className="pt-2 border-t border-slate-200">
                    <button 
                      onClick={onShowLookupModal}
                      className="w-full bg-blue-100 hover:bg-blue-200 text-blue-800 text-xs font-semibold py-2 px-3 rounded flex items-center justify-center gap-2 mb-2"
                    >
                      <Settings2 size={14} /> Konfiguration
                    </button>
                    
                    {selectedElement.lookup && (
                        <div className="space-y-2">
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input 
                                type="checkbox" 
                                checked={selectedElement.lookup.allowQuickCreate || false}
                                onChange={e => onLookupPropertyChange('allowQuickCreate', e.target.checked)}
                                className="rounded text-blue-600"
                                />
                                <span className="text-xs font-semibold text-slate-700">Quick Create (+)</span>
                            </label>
                            {selectedElement.lookup.allowQuickCreate && (
                                <select 
                                    value={selectedElement.lookup.quickCreateFormId || ''}
                                    onChange={e => onLookupPropertyChange('quickCreateFormId', e.target.value)}
                                    className="w-full border border-slate-300 rounded p-1 text-xs"
                                >
                                    <option value="">(Auto-Formular)</option>
                                    {allForms.filter(f => f.sourceId === selectedElement.lookup?.tableId).map(f => (
                                        <option key={f.id} value={f.id}>{f.name}</option>
                                    ))}
                                </select>
                            )}
                        </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {selectedElement.type === 'subform' && selectedElement.subform && (
               <div className="border border-indigo-200 bg-indigo-50 rounded p-2 text-xs space-y-2">
                  <div className="font-bold text-indigo-800 flex items-center gap-1"><Shield size={12}/> Rechte</div>
                  {['canAdd', 'canEdit', 'canDelete'].map(perm => (
                      <label key={perm} className="flex items-center gap-2 cursor-pointer">
                        <input 
                          type="checkbox" 
                          checked={(selectedElement.subform as any)[perm] !== false} 
                          onChange={e => onSubformPermissionChange(perm, e.target.checked)}
                          className="rounded text-indigo-600"
                        />
                        <span>{perm.replace('can', '')} erlauben</span>
                      </label>
                  ))}
               </div>
            )}

            {selectedElement.type === 'button' && (
                <div className="border border-purple-200 bg-purple-50/70 rounded-lg p-3 text-xs space-y-3">
                    <div className="flex items-center gap-1.5 font-bold text-purple-900 border-b border-purple-200 pb-2">
                        <Zap size={15} className="text-amber-500 fill-amber-400" />
                        <span>Schaltfläche / Makro Steuerelement</span>
                    </div>

                    <div>
                        <label className="block font-bold text-slate-700 mb-1">Beschriftung (Label)</label>
                        <input 
                          type="text" 
                          value={selectedElement.label || ''} 
                          onChange={e => onPropertyChange('label', e.target.value)}
                          placeholder="z.B. Makro ausführen"
                          className="w-full border border-slate-300 rounded p-1.5 bg-white font-medium" 
                        />
                    </div>

                    <div className="font-bold text-purple-800 text-[11px] uppercase tracking-wider">Aktionen & Flows</div>
                    {(selectedElement.actions || []).map((action, actionIdx) => (
                        <div key={action.id} className="bg-white border border-purple-200 rounded-md p-2 shadow-xs space-y-2">
                            <div>
                                <label className="block text-[10px] font-bold text-slate-500 mb-0.5">Ereignis (Trigger)</label>
                                <select 
                                    value={action.trigger}
                                    onChange={e => {
                                        const newActions = [...(selectedElement.actions || [])];
                                        newActions[actionIdx] = { ...newActions[actionIdx], trigger: e.target.value as any };
                                        onPropertyChange('actions', newActions);
                                    }}
                                    className="w-full border border-slate-300 rounded p-1 text-xs font-semibold bg-slate-50"
                                >
                                    <option value="OnClick">Bei Klick (OnClick)</option>
                                    <option value="OnChange">Bei Änderung (OnChange)</option>
                                    <option value="OnPageLoad">Beim Laden (OnPageLoad)</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-[10px] font-bold text-slate-500 mb-0.5">Aktions-Typ</label>
                                <select 
                                    value={action.actionType}
                                    onChange={e => {
                                        const newActions = [...(selectedElement.actions || [])];
                                        newActions[actionIdx] = { ...newActions[actionIdx], actionType: e.target.value as any };
                                        onPropertyChange('actions', newActions);
                                    }}
                                    className="w-full border border-slate-300 rounded p-1 text-xs font-bold text-purple-700 bg-white"
                                >
                                    <option value="RunMacro">⚡ Makro ausführen</option>
                                    <option value="ShowToast">🔔 Toast / Nachricht anzeigen</option>
                                    <option value="OpenModal">📋 Formular / Modal öffnen</option>
                                    <option value="Navigate">↗️ Navigieren zu Route</option>
                                    <option value="ExecuteAPI">🌐 API Call ausführen</option>
                                    <option value="SetState">⚙️ Global State setzen</option>
                                </select>
                            </div>

                            {action.actionType === 'RunMacro' && (
                                <div className="p-2 bg-amber-50/80 rounded border border-amber-200 space-y-1.5">
                                    <label className="block text-[10px] font-bold text-amber-900">Auszuführendes Makro:</label>
                                    <select 
                                        value={action.macroId || ''} 
                                        onChange={e => {
                                            const newActions = [...(selectedElement.actions || [])];
                                            newActions[actionIdx] = { ...newActions[actionIdx], macroId: e.target.value };
                                            onPropertyChange('actions', newActions);
                                        }} 
                                        className="w-full border border-amber-300 rounded p-1 text-xs font-bold bg-white text-slate-800"
                                    >
                                        <option value="">-- Makro auswählen --</option>
                                        {getSavedMacros().map(m => (
                                            <option key={m.id} value={m.id}>⚡ {m.name}</option>
                                        ))}
                                    </select>
                                    {getSavedMacros().length === 0 && (
                                        <p className="text-[10px] text-amber-700 italic">Keine Makros gefunden. Erstellen Sie Makros im Reiter "Makros & Logik".</p>
                                    )}
                                </div>
                            )}

                            {action.actionType === 'ShowToast' && (
                                <div className="space-y-1">
                                    <input type="text" placeholder="Nachricht..." value={action.toastMessage || ''} onChange={e => {
                                        const newActions = [...(selectedElement.actions || [])];
                                        newActions[actionIdx] = { ...newActions[actionIdx], toastMessage: e.target.value };
                                        onPropertyChange('actions', newActions);
                                    }} className="w-full border p-1 rounded" />
                                    <select value={action.toastType || 'success'} onChange={e => {
                                        const newActions = [...(selectedElement.actions || [])];
                                        newActions[actionIdx] = { ...newActions[actionIdx], toastType: e.target.value as any };
                                        onPropertyChange('actions', newActions);
                                    }} className="w-full border p-1 rounded">
                                        <option value="success">Erfolg (Grün)</option>
                                        <option value="error">Fehler (Rot)</option>
                                        <option value="info">Info (Blau)</option>
                                    </select>
                                </div>
                            )}

                            {action.actionType === 'OpenModal' && (
                                <select value={action.modalId || ''} onChange={e => {
                                        const newActions = [...(selectedElement.actions || [])];
                                        newActions[actionIdx] = { ...newActions[actionIdx], modalId: e.target.value };
                                        onPropertyChange('actions', newActions);
                                    }} className="w-full border p-1 rounded">
                                    <option value="">Formular wählen...</option>
                                    {allForms.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
                                </select>
                            )}

                            {action.actionType === 'Navigate' && (
                                <input type="text" placeholder="/route/path" value={action.routeUrl || ''} onChange={e => {
                                    const newActions = [...(selectedElement.actions || [])];
                                    newActions[actionIdx] = { ...newActions[actionIdx], routeUrl: e.target.value };
                                    onPropertyChange('actions', newActions);
                                }} className="w-full border p-1 rounded" />
                            )}
                            
                            {action.actionType === 'SetState' && (
                                <div className="flex gap-1">
                                    <input type="text" placeholder="State ID" value={action.stateVariableId || ''} onChange={e => {
                                        const newActions = [...(selectedElement.actions || [])];
                                        newActions[actionIdx] = { ...newActions[actionIdx], stateVariableId: e.target.value };
                                        onPropertyChange('actions', newActions);
                                    }} className="w-1/2 border p-1 rounded" />
                                    <input type="text" placeholder="Wert" value={action.stateValue || ''} onChange={e => {
                                        const newActions = [...(selectedElement.actions || [])];
                                        newActions[actionIdx] = { ...newActions[actionIdx], stateValue: e.target.value };
                                        onPropertyChange('actions', newActions);
                                    }} className="w-1/2 border p-1 rounded" />
                                </div>
                            )}

                            <button onClick={() => {
                                const newActions = (selectedElement.actions || []).filter(a => a.id !== action.id);
                                onPropertyChange('actions', newActions);
                            }} className="text-red-500 hover:bg-red-50 py-0.5 rounded text-[11px] font-bold w-full text-center">Aktion entfernen</button>
                        </div>
                    ))}
                    <button 
                        onClick={() => {
                            const newActions = [...(selectedElement.actions || []), { id: crypto.randomUUID(), trigger: 'OnClick', actionType: 'RunMacro', macroId: '' }];
                            onPropertyChange('actions', newActions);
                        }}
                        className="text-purple-700 bg-purple-100 hover:bg-purple-200 w-full rounded-md py-1.5 font-bold shadow-2xs flex items-center justify-center gap-1 transition-colors"
                    >
                        <Zap size={14} /> + Aktion / Makro hinzufügen
                    </button>
                </div>
            )}

            {selectedElement.type === 'dropdown_button' && (
                <div className="border border-indigo-200 bg-indigo-50/70 rounded-lg p-3 text-xs space-y-3">
                    <div className="flex items-center justify-between border-b border-indigo-200 pb-2">
                        <div className="flex items-center gap-1.5 font-bold text-indigo-900">
                            <Zap size={15} className="text-indigo-600 fill-indigo-400" />
                            <span>Dropdown-Schaltfläche (Menü)</span>
                        </div>
                    </div>

                    <div>
                        <label className="block font-bold text-slate-700 mb-1">Haupt-Beschriftung (Label)</label>
                        <input 
                          type="text" 
                          value={selectedElement.label || ''} 
                          onChange={e => onPropertyChange('label', e.target.value)}
                          placeholder="z.B. Aktionen"
                          className="w-full border border-slate-300 rounded p-1.5 bg-white font-medium" 
                        />
                    </div>

                    <div className="border-t border-indigo-200 pt-3 space-y-3">
                        <div className="flex items-center justify-between">
                            <span className="font-bold text-indigo-900 text-xs uppercase tracking-wider">
                                Unter-Buttons ({selectedElement.dropdownItems?.length || 0})
                            </span>
                            <button
                                onClick={() => {
                                    const currentItems = selectedElement.dropdownItems || [];
                                    const newItem = {
                                        id: crypto.randomUUID(),
                                        label: `Aktion ${currentItems.length + 1}`,
                                        actions: [{ id: crypto.randomUUID(), trigger: 'OnClick', actionType: 'RunMacro', macroId: '' }]
                                    };
                                    onPropertyChange('dropdownItems', [...currentItems, newItem]);
                                }}
                                className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-2 py-1 rounded text-[11px] flex items-center gap-1 transition-colors cursor-pointer shadow-2xs"
                            >
                                <Plus size={12} /> Button hinzufügen
                            </button>
                        </div>

                        {(!selectedElement.dropdownItems || selectedElement.dropdownItems.length === 0) && (
                            <div className="p-3 bg-white border border-dashed border-indigo-200 rounded text-center text-slate-400 italic text-xs">
                                Keine Unter-Buttons definiert. Klicken Sie oben auf "Button hinzufügen".
                            </div>
                        )}

                        {(selectedElement.dropdownItems || []).map((item, itemIdx) => (
                            <div key={item.id} className="bg-white border border-indigo-200 rounded-lg p-2.5 shadow-2xs space-y-2">
                                <div className="flex items-center justify-between gap-2 border-b border-slate-100 pb-1.5">
                                    <span className="font-bold text-slate-700 text-xs flex items-center gap-1">
                                        <span className="w-4 h-4 bg-indigo-100 text-indigo-700 rounded-full inline-flex items-center justify-center text-[10px]">
                                            {itemIdx + 1}
                                        </span>
                                        Unter-Button
                                    </span>
                                    <button
                                        onClick={() => {
                                            const updated = (selectedElement.dropdownItems || []).filter(i => i.id !== item.id);
                                            onPropertyChange('dropdownItems', updated);
                                        }}
                                        className="text-red-500 hover:text-red-700 hover:bg-red-50 p-1 rounded transition-colors text-[11px] font-bold flex items-center gap-0.5"
                                        title="Unter-Button löschen"
                                    >
                                        <Trash2 size={13} /> Entfernen
                                    </button>
                                </div>

                                <div>
                                    <label className="block text-[10px] font-bold text-slate-500 mb-0.5">Titel / Name</label>
                                    <input
                                        type="text"
                                        value={item.label || ''}
                                        onChange={e => {
                                            const updated = [...(selectedElement.dropdownItems || [])];
                                            updated[itemIdx] = { ...updated[itemIdx], label: e.target.value };
                                            onPropertyChange('dropdownItems', updated);
                                        }}
                                        placeholder="z.B. Bericht drucken"
                                        className="w-full border border-slate-300 rounded p-1 text-xs font-semibold bg-white"
                                    />
                                </div>

                                <div className="space-y-1.5 pt-1">
                                    <div className="text-[10px] font-bold text-indigo-800 uppercase tracking-wider flex items-center justify-between">
                                        <span>Befehle & Makros</span>
                                        <button
                                            onClick={() => {
                                                const updated = [...(selectedElement.dropdownItems || [])];
                                                const currentActions = updated[itemIdx].actions || [];
                                                updated[itemIdx] = {
                                                    ...updated[itemIdx],
                                                    actions: [...currentActions, { id: crypto.randomUUID(), trigger: 'OnClick', actionType: 'RunMacro', macroId: '' }]
                                                };
                                                onPropertyChange('dropdownItems', updated);
                                            }}
                                            className="text-indigo-600 hover:text-indigo-800 text-[10px] font-bold underline"
                                        >
                                            + Befehl hinzufügen
                                        </button>
                                    </div>

                                    {(item.actions || []).map((action, actIdx) => (
                                        <div key={action.id} className="bg-slate-50 border border-indigo-100 rounded p-1.5 space-y-1.5">
                                            <div className="flex gap-1">
                                                <select
                                                    value={action.actionType}
                                                    onChange={e => {
                                                        const updated = [...(selectedElement.dropdownItems || [])];
                                                        const actions = [...(updated[itemIdx].actions || [])];
                                                        actions[actIdx] = { ...actions[actIdx], actionType: e.target.value as any };
                                                        updated[itemIdx] = { ...updated[itemIdx], actions };
                                                        onPropertyChange('dropdownItems', updated);
                                                    }}
                                                    className="w-full border border-slate-300 rounded p-1 text-xs font-bold text-purple-800 bg-white"
                                                >
                                                    <option value="RunMacro">⚡ Makro ausführen</option>
                                                    <option value="ShowToast">🔔 Toast anzeigen</option>
                                                    <option value="OpenModal">📋 Formular öffnen</option>
                                                    <option value="Navigate">↗️ Navigieren</option>
                                                </select>
                                                <button
                                                    onClick={() => {
                                                        const updated = [...(selectedElement.dropdownItems || [])];
                                                        const actions = (updated[itemIdx].actions || []).filter(a => a.id !== action.id);
                                                        updated[itemIdx] = { ...updated[itemIdx], actions };
                                                        onPropertyChange('dropdownItems', updated);
                                                    }}
                                                    className="text-red-500 hover:bg-red-100 p-1 rounded"
                                                    title="Befehl löschen"
                                                >
                                                    <Trash2 size={12} />
                                                </button>
                                            </div>

                                            {action.actionType === 'RunMacro' && (
                                                <select
                                                    value={action.macroId || ''}
                                                    onChange={e => {
                                                        const updated = [...(selectedElement.dropdownItems || [])];
                                                        const actions = [...(updated[itemIdx].actions || [])];
                                                        actions[actIdx] = { ...actions[actIdx], macroId: e.target.value };
                                                        updated[itemIdx] = { ...updated[itemIdx], actions };
                                                        onPropertyChange('dropdownItems', updated);
                                                    }}
                                                    className="w-full border border-amber-300 rounded p-1 text-xs font-bold bg-amber-50 text-amber-950"
                                                >
                                                    <option value="">-- Makro wählen --</option>
                                                    {getSavedMacros().map(m => (
                                                        <option key={m.id} value={m.id}>⚡ {m.name}</option>
                                                    ))}
                                                </select>
                                            )}

                                            {action.actionType === 'ShowToast' && (
                                                <input
                                                    type="text"
                                                    placeholder="Nachricht..."
                                                    value={action.toastMessage || ''}
                                                    onChange={e => {
                                                        const updated = [...(selectedElement.dropdownItems || [])];
                                                        const actions = [...(updated[itemIdx].actions || [])];
                                                        actions[actIdx] = { ...actions[actIdx], toastMessage: e.target.value };
                                                        updated[itemIdx] = { ...updated[itemIdx], actions };
                                                        onPropertyChange('dropdownItems', updated);
                                                    }}
                                                    className="w-full border p-1 rounded text-xs bg-white"
                                                />
                                            )}

                                            {action.actionType === 'OpenModal' && (
                                                <select
                                                    value={action.modalId || ''}
                                                    onChange={e => {
                                                        const updated = [...(selectedElement.dropdownItems || [])];
                                                        const actions = [...(updated[itemIdx].actions || [])];
                                                        actions[actIdx] = { ...actions[actIdx], modalId: e.target.value };
                                                        updated[itemIdx] = { ...updated[itemIdx], actions };
                                                        onPropertyChange('dropdownItems', updated);
                                                    }}
                                                    className="w-full border p-1 rounded text-xs bg-white"
                                                >
                                                    <option value="">Formular wählen...</option>
                                                    {allForms.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
                                                </select>
                                            )}

                                            {action.actionType === 'Navigate' && (
                                                <input
                                                    type="text"
                                                    placeholder="/route/path"
                                                    value={action.routeUrl || ''}
                                                    onChange={e => {
                                                        const updated = [...(selectedElement.dropdownItems || [])];
                                                        const actions = [...(updated[itemIdx].actions || [])];
                                                        actions[actIdx] = { ...actions[actIdx], routeUrl: e.target.value };
                                                        updated[itemIdx] = { ...updated[itemIdx], actions };
                                                        onPropertyChange('dropdownItems', updated);
                                                    }}
                                                    className="w-full border p-1 rounded text-xs bg-white"
                                                />
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {selectedElement.type === 'container' && (
              <div className="bg-slate-50 border border-slate-200 rounded p-2.5 space-y-3">
                <div className="font-bold text-slate-800 flex items-center gap-1 text-xs">
                  <Settings2 size={12}/> Container Layout-Typ
                </div>
                <select
                  value={
                    selectedElement.className?.includes('grid-cols-12') ? 'grid-12' :
                    selectedElement.className?.includes('grid-cols-3') ? 'grid-3' :
                    selectedElement.className?.includes('grid-cols-2') ? 'grid-2' :
                    selectedElement.className?.includes('flex-row') ? 'flex-row' : 'vertical'
                  }
                  onChange={e => {
                    const val = e.target.value;
                    let newClass = selectedElement.className || '';
                    // Strip existing layout classes
                    newClass = newClass
                      .replace(/grid\s+grid-cols-\d+/g, '')
                      .replace(/flex\s+flex-row[^\s]*/g, '')
                      .replace(/gap-\d+/g, '')
                      .replace(/flex-wrap/g, '')
                      .replace(/items-end/g, '')
                      .trim();

                    if (val === 'grid-12') {
                      newClass = `grid grid-cols-12 gap-4 ${newClass}`.trim();
                    } else if (val === 'grid-3') {
                      newClass = `grid grid-cols-3 gap-4 ${newClass}`.trim();
                    } else if (val === 'grid-2') {
                      newClass = `grid grid-cols-2 gap-4 ${newClass}`.trim();
                    } else if (val === 'flex-row') {
                      newClass = `flex flex-row gap-4 flex-wrap items-end ${newClass}`.trim();
                    }
                    onPropertyChange('className', newClass);
                  }}
                  className="w-full border border-slate-300 rounded p-1.5 bg-white text-xs font-semibold"
                >
                  <option value="vertical">Einspaltig (Vertikal gestapelt)</option>
                  <option value="grid-12">Mehrspaltig (12-Spalten Grid)</option>
                  <option value="grid-3">Mehrspaltig (3-Spalten Grid)</option>
                  <option value="grid-2">Mehrspaltig (2-Spalten Grid)</option>
                  <option value="flex-row">Flex-Reihe (Horizontal fließend)</option>
                </select>
                <p className="text-[10px] text-slate-400">
                  Bestimmt, wie die Kind-Elemente innerhalb dieses Containers angeordnet werden.
                </p>

                <div className="border-t border-slate-200/80 my-2 pt-2.5 space-y-2">
                  <div className="font-bold text-slate-700 text-[11px] uppercase tracking-wider mb-1">
                    Container-Styling (Optik)
                  </div>
                  
                  {/* Hintergrund */}
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-0.5">Hintergrund</label>
                    <select
                      value={parseBg(selectedElement.className || '')}
                      onChange={e => {
                        const newBg = e.target.value;
                        const currentBorder = parseBorder(selectedElement.className || '');
                        const currentPadding = parsePadding(selectedElement.className || '');
                        const currentGap = parseGap(selectedElement.className || '');
                        const newClass = updateContainerClass(selectedElement.className || '', currentBorder, newBg, currentPadding, currentGap);
                        onPropertyChange('className', newClass);
                      }}
                      className="w-full border border-slate-300 rounded p-1 bg-white text-xs font-medium text-slate-700"
                    >
                      <option value="none">Standard (Grau)</option>
                      <option value="transparent">Transparent (Kein Hintergrund)</option>
                      <option value="white">Weiß (White)</option>
                      <option value="slate-50">Hellgrau (Slate)</option>
                      <option value="indigo-50">Hellblau (Indigo)</option>
                    </select>
                  </div>

                  {/* Rahmen */}
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-0.5">Rahmen (Border)</label>
                    <select
                      value={parseBorder(selectedElement.className || '')}
                      onChange={e => {
                        const newBorder = e.target.value;
                        const currentBg = parseBg(selectedElement.className || '');
                        const currentPadding = parsePadding(selectedElement.className || '');
                        const currentGap = parseGap(selectedElement.className || '');
                        const newClass = updateContainerClass(selectedElement.className || '', newBorder, currentBg, currentPadding, currentGap);
                        onPropertyChange('className', newClass);
                      }}
                      className="w-full border border-slate-300 rounded p-1 bg-white text-xs font-medium text-slate-700"
                    >
                      <option value="none">Kein Rahmen (Rahmenlos)</option>
                      <option value="dashed">Gestrichelt (Dashed)</option>
                      <option value="solid">Durchgezogen (Solid)</option>
                    </select>
                  </div>

                  {/* Innenabstand */}
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-0.5">Innenabstand (Padding)</label>
                    <select
                      value={parsePadding(selectedElement.className || '')}
                      onChange={e => {
                        const newPadding = e.target.value;
                        const currentBorder = parseBorder(selectedElement.className || '');
                        const currentBg = parseBg(selectedElement.className || '');
                        const currentGap = parseGap(selectedElement.className || '');
                        const newClass = updateContainerClass(selectedElement.className || '', currentBorder, currentBg, newPadding, currentGap);
                        onPropertyChange('className', newClass);
                      }}
                      className="w-full border border-slate-300 rounded p-1 bg-white text-xs font-medium text-slate-700"
                    >
                      <option value="p-0">Keiner (p-0)</option>
                      <option value="p-1">Sehr klein (p-1)</option>
                      <option value="p-2">Klein (p-2)</option>
                      <option value="p-3">Mittel-klein (p-3)</option>
                      <option value="p-4">Standard (p-4)</option>
                      <option value="p-6">Groß (p-6)</option>
                    </select>
                  </div>

                  {/* Elementen-Abstand (Gap) */}
                  {(selectedElement.className?.includes('grid') || selectedElement.className?.includes('flex')) && (
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-600 mb-0.5">Abstand (Spaltengröße / Gap)</label>
                      <select
                        value={parseGap(selectedElement.className || '')}
                        onChange={e => {
                          const newGap = e.target.value;
                          const currentBorder = parseBorder(selectedElement.className || '');
                          const currentBg = parseBg(selectedElement.className || '');
                          const currentPadding = parsePadding(selectedElement.className || '');
                          const newClass = updateContainerClass(selectedElement.className || '', currentBorder, currentBg, currentPadding, newGap);
                          onPropertyChange('className', newClass);
                        }}
                        className="w-full border border-slate-300 rounded p-1 bg-white text-xs font-medium text-slate-700"
                      >
                        <option value="gap-0">Keiner (gap-0)</option>
                        <option value="gap-1">Sehr klein (gap-1 / 4px)</option>
                        <option value="gap-2">Klein (gap-2 / 8px)</option>
                        <option value="gap-3">Mittel (gap-3 / 12px)</option>
                        <option value="gap-4">Standard (gap-4 / 16px)</option>
                        <option value="gap-6">Groß (gap-6 / 24px)</option>
                      </select>
                    </div>
                  )}
                </div>
              </div>
            )}

            <div>
              <label className="block font-bold text-slate-700 mb-1">Breite (Spaltenbreite)</label>
              <select
                value={selectedElement.width || ''}
                onChange={e => onPropertyChange('width', e.target.value || undefined)}
                className="w-full border border-slate-300 rounded p-1.5 bg-white text-slate-700 font-medium text-xs"
              >
                <option value="">Standard (Automatisch)</option>
                <option value="full">Volle Breite (100% / col-span-12)</option>
                <option value="11/12">11/12 Breite (92% / col-span-11)</option>
                <option value="5/6">5/6 Breite (83% / col-span-10)</option>
                <option value="3/4">3/4 Breite (75% / col-span-9)</option>
                <option value="2/3">2/3 Breite (66% / col-span-8)</option>
                <option value="7/12">7/12 Breite (58% / col-span-7)</option>
                <option value="1/2">Hälfte (50% / col-span-6)</option>
                <option value="5/12">5/12 Breite (42% / col-span-5)</option>
                <option value="1/3">Ein Drittel (33% / col-span-4)</option>
                <option value="1/4">Ein Viertel (25% / col-span-3)</option>
                <option value="1/6">Ein Sechstel (16% / col-span-2)</option>
                <option value="1/12">Ein Zwölftel (8% / col-span-1)</option>
              </select>
              <p className="text-[10px] text-slate-400 mt-1">
                Bestimmt die Breite des Elements in einem Raster (Grid) oder einer flexiblen Reihe.
              </p>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">CSS Klassen (Tailwind)</label>
              <textarea 
                value={selectedElement.className || ''} 
                onChange={e => onPropertyChange('className', e.target.value)}
                className="w-full border border-slate-300 rounded p-1.5 h-20 font-mono text-xs" 
                placeholder="z.B. p-4 bg-gray-100"
              />
            </div>
            
            <div className="border border-indigo-200 bg-indigo-50 rounded p-2 text-xs space-y-2">
                <div className="font-bold text-indigo-800 flex items-center gap-1"><Shield size={12}/> Sichtbarkeit (Rollen)</div>
                <CommaSeparatedInput 
                    placeholder="admin, user (kommagetrennt)"
                    value={selectedElement.allowedRoles || []} 
                    onChange={roles => {
                        onPropertyChange('allowedRoles', roles.length > 0 ? roles : undefined);
                    }}
                    className="w-full border p-1 rounded bg-white text-xs" 
                />
            </div>

            <div className="border border-emerald-200 bg-emerald-50/50 rounded p-2 text-xs space-y-2">
                <div className="font-bold text-emerald-800 flex items-center gap-1">
                  <Shield size={12}/> Validierungsregeln
                </div>
                <div className="space-y-2">
                  {(selectedElement.validationRules || []).map((rule, rIdx) => (
                    <div key={rule.id || rIdx} className="bg-white p-2.5 rounded border border-emerald-200 space-y-2 shadow-2xs">
                      <div className="flex justify-between items-center font-bold text-[11px] text-slate-700">
                        <span className="text-emerald-800 font-mono">Regel #{rIdx + 1}</span>
                        <button 
                          onClick={() => {
                            const updated = (selectedElement.validationRules || []).filter((_, i) => i !== rIdx);
                            onPropertyChange('validationRules', updated);
                          }}
                          className="text-rose-500 hover:text-rose-700 p-0.5 rounded hover:bg-rose-50"
                          title="Regel löschen"
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>

                      <div className="space-y-1">
                        <label className="block text-[10px] font-bold text-slate-600">Regel-Typ:</label>
                        <select
                          value={rule.type}
                          onChange={e => {
                            const updated = [...(selectedElement.validationRules || [])];
                            updated[rIdx] = { ...updated[rIdx], type: e.target.value as any };
                            onPropertyChange('validationRules', updated);
                          }}
                          className="w-full border border-slate-300 rounded p-1 text-[11px] bg-white text-slate-800 font-medium"
                        >
                          <option value="required">Pflichtfeld (Required)</option>
                          <option value="min">Mindestwert (Min Value)</option>
                          <option value="max">Höchstwert (Max Value)</option>
                          <option value="regex">Regulärer Ausdruck (RegEx)</option>
                          <option value="custom_js">Benutzerdefiniertes JS (Custom JS)</option>
                        </select>
                      </div>

                      {rule.type === 'min' && (
                        <div>
                          <label className="block text-[10px] font-bold text-slate-600 mb-0.5">Mindestwert:</label>
                          <input 
                            type="number"
                            placeholder="z.B. 0 oder 18"
                            value={rule.minValue !== undefined ? rule.minValue : ''}
                            onChange={e => {
                              const updated = [...(selectedElement.validationRules || [])];
                              updated[rIdx] = { ...updated[rIdx], minValue: e.target.value === '' ? undefined : Number(e.target.value) };
                              onPropertyChange('validationRules', updated);
                            }}
                            className="w-full border border-slate-300 p-1 rounded text-[11px]"
                          />
                        </div>
                      )}

                      {rule.type === 'max' && (
                        <div>
                          <label className="block text-[10px] font-bold text-slate-600 mb-0.5">Höchstwert:</label>
                          <input 
                            type="number"
                            placeholder="z.B. 100 oder 9999"
                            value={rule.maxValue !== undefined ? rule.maxValue : ''}
                            onChange={e => {
                              const updated = [...(selectedElement.validationRules || [])];
                              updated[rIdx] = { ...updated[rIdx], maxValue: e.target.value === '' ? undefined : Number(e.target.value) };
                              onPropertyChange('validationRules', updated);
                            }}
                            className="w-full border border-slate-300 p-1 rounded text-[11px]"
                          />
                        </div>
                      )}

                      {rule.type === 'regex' && (
                        <div>
                          <label className="block text-[10px] font-bold text-slate-600 mb-0.5">RegEx Muster:</label>
                          <input 
                            type="text"
                            placeholder="z.B. ^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$"
                            value={rule.regexPattern || ''}
                            onChange={e => {
                              const updated = [...(selectedElement.validationRules || [])];
                              updated[rIdx] = { ...updated[rIdx], regexPattern: e.target.value };
                              onPropertyChange('validationRules', updated);
                            }}
                            className="w-full border border-slate-300 p-1 rounded text-[11px] font-mono"
                          />
                        </div>
                      )}

                      {rule.type === 'custom_js' && (
                        <div>
                          <label className="block text-[10px] font-bold text-slate-600 mb-0.5">JS-Prüfcode (return true/false):</label>
                          <textarea 
                            rows={2}
                            placeholder="return value && value.length >= 5;"
                            value={rule.customJsCode || ''}
                            onChange={e => {
                              const updated = [...(selectedElement.validationRules || [])];
                              updated[rIdx] = { ...updated[rIdx], customJsCode: e.target.value };
                              onPropertyChange('validationRules', updated);
                            }}
                            className="w-full border border-slate-300 p-1 rounded text-[11px] font-mono"
                          />
                        </div>
                      )}

                      <div>
                        <label className="block text-[10px] font-bold text-slate-600 mb-0.5">Fehlermeldung:</label>
                        <input 
                          type="text"
                          placeholder="Benutzerdefinierte Fehlermeldung"
                          value={rule.errorMessage || ''}
                          onChange={e => {
                            const updated = [...(selectedElement.validationRules || [])];
                            updated[rIdx] = { ...updated[rIdx], errorMessage: e.target.value };
                            onPropertyChange('validationRules', updated);
                          }}
                          className="w-full border border-slate-300 p-1 rounded text-[11px]"
                        />
                      </div>
                    </div>
                  ))}
                  <button
                    onClick={() => {
                      const newRule = {
                        id: crypto.randomUUID(),
                        fieldId: selectedElement.fieldId || selectedElement.id,
                        type: 'required' as const,
                        errorMessage: 'Dieses Feld darf nicht leer sein.'
                      };
                      onPropertyChange('validationRules', [...(selectedElement.validationRules || []), newRule]);
                    }}
                    className="w-full bg-emerald-600 hover:bg-emerald-700 text-white rounded p-1.5 text-[11px] font-bold shadow-2xs transition-colors"
                  >
                    + Validierungsregel hinzufügen
                  </button>
                </div>
            </div>

            <div className="border border-amber-200 bg-amber-50 rounded p-2 text-xs space-y-2">
                <div className="font-bold text-amber-800 flex items-center justify-between">
                  <span className="flex items-center gap-1"><Settings2 size={12}/> Bedingte Anzeige (Sichtbarkeit)</span>
                  {selectedElement.visibilityCondition && (
                    <button
                      onClick={() => onPropertyChange('visibilityCondition', undefined)}
                      className="text-rose-500 hover:text-rose-700 font-normal text-[10px]"
                    >
                      Zurücksetzen
                    </button>
                  )}
                </div>
                <div className="space-y-1.5">
                    <div>
                      <label className="block text-[10px] font-bold text-amber-900 mb-0.5">Abhängiges Quellfeld:</label>
                      <select
                        value={selectedElement.visibilityCondition?.fieldId || ''}
                        onChange={e => onPropertyChange('visibilityCondition', { 
                          fieldId: e.target.value, 
                          operator: selectedElement.visibilityCondition?.operator || 'eq', 
                          value: selectedElement.visibilityCondition?.value || '' 
                        })}
                        className="w-full border border-amber-300 rounded p-1 text-[11px] bg-white text-slate-800"
                      >
                        <option value="">-- Kein abhängiges Feld --</option>
                        {sourceTable?.fields.map(f => (
                          <option key={f.id} value={f.id}>{f.name} ({f.type})</option>
                        ))}
                      </select>
                    </div>

                    {selectedElement.visibilityCondition?.fieldId && (
                      <>
                        <div>
                          <label className="block text-[10px] font-bold text-amber-900 mb-0.5">Bedingung / Operator:</label>
                          <select 
                            value={selectedElement.visibilityCondition?.operator || 'eq'} 
                            onChange={e => onPropertyChange('visibilityCondition', { 
                              ...selectedElement.visibilityCondition, 
                              operator: e.target.value as any, 
                              fieldId: selectedElement.visibilityCondition?.fieldId || '', 
                              value: selectedElement.visibilityCondition?.value || '' 
                            })}
                            className="w-full border border-amber-300 p-1 rounded text-[11px] bg-white text-slate-800"
                          >
                            <option value="eq">Gleich (=)</option>
                            <option value="neq">Ungleich (!=)</option>
                            <option value="contains">Enthält Text</option>
                            <option value="gt">Größer als (&gt;)</option>
                            <option value="gte">Größer oder gleich (&gt;=)</option>
                            <option value="lt">Kleiner als (&lt;)</option>
                            <option value="lte">Kleiner oder gleich (&lt;=)</option>
                            <option value="empty">Ist leer (NULL/leer)</option>
                            <option value="not_empty">Ist nicht leer</option>
                          </select>
                        </div>

                        {selectedElement.visibilityCondition?.operator !== 'empty' && selectedElement.visibilityCondition?.operator !== 'not_empty' && (
                          <div>
                            <label className="block text-[10px] font-bold text-amber-900 mb-0.5">Vergleichswert:</label>
                            <input 
                              type="text" 
                              placeholder="z.B. Ja, Aktiv, 100, etc."
                              value={selectedElement.visibilityCondition?.value || ''} 
                              onChange={e => onPropertyChange('visibilityCondition', { 
                                ...selectedElement.visibilityCondition, 
                                value: e.target.value, 
                                fieldId: selectedElement.visibilityCondition?.fieldId || '', 
                                operator: selectedElement.visibilityCondition?.operator || 'eq' 
                              })}
                              className="w-full border border-amber-300 p-1 rounded text-[11px] bg-white" 
                            />
                          </div>
                        )}
                      </>
                    )}
                </div>
            </div>

            {onMoveElement && (
              <div className="grid grid-cols-2 gap-2 mt-4">
                <button 
                  type="button"
                  onClick={() => onMoveElement('up')} 
                  className="bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 p-2 rounded flex items-center justify-center gap-1 font-bold text-xs shadow-xs transition-colors"
                >
                  <ArrowUp size={14} /> Nach oben
                </button>
                <button 
                  type="button"
                  onClick={() => onMoveElement('down')} 
                  className="bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 p-2 rounded flex items-center justify-center gap-1 font-bold text-xs shadow-xs transition-colors"
                >
                  <ArrowDown size={14} /> Nach unten
                </button>
              </div>
            )}

            <button onClick={onDeleteSelected} className="w-full mt-4 bg-red-50 text-red-600 border border-red-200 p-2 rounded hover:bg-red-100 flex items-center justify-center gap-2">
              <Trash2 size={14} /> Element löschen
            </button>
          </div>
        ) : (
          <div className="text-slate-500 text-sm space-y-4">
            <p className="italic">Kein Element ausgewählt.</p>
            <div className="pt-4 border-t border-slate-200">
                <p className="font-bold text-slate-700 mb-2">Formular-Optionen</p>
                <label className="flex items-center gap-2 cursor-pointer mb-2">
                    <input type="checkbox" checked={form.settings?.isFullScreen || false} onChange={onToggleFullScreen} className="rounded" />
                    <span>Vollbild-Modus</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer mb-2">
                    <input type="checkbox" checked={form.settings?.showEditToggle || false} onChange={onToggleEditButton} className="rounded" />
                    <span>Bearbeiten-Toggle anzeigen</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer mb-2">
                    <input type="checkbox" checked={form.settings?.showTableSplitView || false} onChange={onToggleTableSplitView} className="rounded" />
                    <span>Tabelle & Formular (Split View)</span>
                </label>
                
                {form.settings?.showTableSplitView && sourceTable && (
                  <div className="mb-4 pl-4 py-2 bg-slate-50 border-l-2 border-slate-300 rounded-r-md space-y-2 text-xs">
                    <div>
                      <label className="block text-slate-600 font-bold mb-1">Anzeigefeld (Haupttitel)</label>
                      <select 
                        value={form.settings?.splitViewDisplayFieldId || ''} 
                        onChange={e => onFormPropertyChange('settings', { ...form.settings, splitViewDisplayFieldId: e.target.value })}
                        className="w-full border border-slate-300 rounded p-1.5 bg-white text-slate-700 font-medium"
                      >
                        <option value="">(Automatisch)</option>
                        {sourceTable.fields.map(f => (
                          <option key={f.id} value={f.id}>{f.name}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-slate-600 font-bold mb-1">Anzeigefeld (Untertitel)</label>
                      <select 
                        value={form.settings?.splitViewSubtitleFieldId || ''} 
                        onChange={e => onFormPropertyChange('settings', { ...form.settings, splitViewSubtitleFieldId: e.target.value })}
                        className="w-full border border-slate-300 rounded p-1.5 bg-white text-slate-700 font-medium"
                      >
                        <option value="">(Automatisch / Primärschlüssel)</option>
                        {sourceTable.fields.map(f => (
                          <option key={f.id} value={f.id}>{f.name}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                )}

                <label className="flex items-center gap-2 cursor-pointer mb-4">
                    <input 
                      type="checkbox" 
                      checked={form.settings?.hideNavigation || false} 
                      onChange={e => onFormPropertyChange('settings', { ...form.settings, hideNavigation: e.target.checked })} 
                      className="rounded" 
                    />
                    <span>Datensatznavigation ausblenden</span>
                </label>
                
                <div className="border border-indigo-200 bg-indigo-50 rounded p-2 text-xs space-y-2">
                    <div className="font-bold text-indigo-800 flex items-center gap-1"><Shield size={12}/> Formular-Sichtbarkeit (Rollen)</div>
                    <CommaSeparatedInput 
                        placeholder="admin, user (kommagetrennt)"
                        value={form.allowedRoles || []} 
                        onChange={roles => {
                            onFormPropertyChange('allowedRoles', roles.length > 0 ? roles : undefined);
                        }}
                        className="w-full border p-1 rounded bg-white text-xs" 
                    />
                </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
