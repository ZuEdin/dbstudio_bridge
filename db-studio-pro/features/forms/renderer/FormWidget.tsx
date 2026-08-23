
import React, { useState } from 'react';
import { FormElement, Table, getWidthClasses } from '../../../types/index';
import { Plus, Search, User, Loader2, FileText } from 'lucide-react';
import { UserPickerModal } from '../components/UserPickerModal';
import { MarkdownEditor } from '../../../components/common/MarkdownEditor';
import { MarkdownViewer } from '../../../components/common/MarkdownViewer';

interface FormWidgetProps {
  element: FormElement;
  value: any;
  sourceTable?: Table;
  isReadOnly: boolean;
  onChange: (fieldName: string, value: any) => void;
  getLookupOptions: (lookupConfig: any) => any[];
  onOpenLookupModal?: (tableId: string, fieldName: string, formId?: string) => void;
  onContextMenu?: (e: React.MouseEvent, fieldName: string, value: any) => void;
  onFocusField?: (fieldName: string) => void;
}

export const FormWidget: React.FC<FormWidgetProps> = ({
  element,
  value,
  sourceTable,
  isReadOnly,
  onChange,
  getLookupOptions,
  onOpenLookupModal,
  onContextMenu,
  onFocusField
}) => {
  const field = sourceTable?.fields.find(f => f.id === element.fieldId);
  const fieldName = field?.name || '';
  const label = element.label || fieldName;
  const elementId = `field_${element.id}`;

  const widthClass = getWidthClasses(element.width);
  const mergedClassName = `${element.className || ''} ${widthClass}`.trim();

  const [showUserPicker, setShowUserPicker] = useState<boolean>(false);
  const [pickerMode, setPickerMode] = useState<'me' | 'search'>('me');

  const openPicker = (mode: 'me' | 'search') => {
      if (isReadOnly) return;
      setPickerMode(mode);
      setShowUserPicker(true);
  };

  const handleUserSelect = (username: string, display: string) => {
      onChange(fieldName, username); // We store the username/ID
      setShowUserPicker(false);
  };

  let widget = element.widgetType;
  if (!widget && field) {
      if (field.rendererType === 'markdown') widget = 'markdown';
      else if (field.type === 'BOOLEAN') widget = 'checkbox';
      else if (field.type === 'DATE') widget = 'date';
      else if (field.type === 'TIME') widget = 'time';
      else if (field.type === 'DATETIME' || field.type === 'TIMESTAMP') widget = 'datetime-local';
      else if (field.type === 'INTEGER' || field.type === 'DECIMAL') widget = 'number';
      else widget = 'text';
  }

  // --- RENDER: Calculated Field ---
  if (widget === 'calculated' || element.isCalculated) {
      return (
          <div className={mergedClassName}>
              <div className="flex justify-between items-center mb-1">
                  {!element.hideLabel && <label htmlFor={elementId} className="block text-sm font-semibold text-slate-700 dark:text-slate-300">{label}</label>}
                  {element.hideLabel && <div className="flex-1" />}
                  <span className="text-[10px] bg-amber-100 text-amber-800 font-bold px-2 py-0.5 rounded-full border border-amber-300/50 flex items-center gap-1 font-mono">
                      ⚡ Berechnet {element.calculationFormula ? `(${element.calculationFormula})` : ''}
                  </span>
              </div>
              <div className="relative">
                  <input
                    id={elementId}
                    type="text"
                    readOnly
                    value={value !== undefined && value !== null ? String(value) : ''}
                    onContextMenu={(e) => onContextMenu && onContextMenu(e, fieldName, value)}
                    className="w-full border border-amber-200 dark:border-amber-800 bg-amber-50/60 dark:bg-amber-950/20 text-amber-950 dark:text-amber-200 font-bold rounded-lg p-2.5 text-sm font-mono cursor-default focus:outline-none shadow-inner"
                    placeholder="(Berechnung ausstehend)"
                  />
              </div>
          </div>
      );
  }

  // --- RENDER: Current User (WhoAmI) ---
  if (widget === 'current-user') {
      return (
          <div className={mergedClassName}>
              {!element.hideLabel && <label htmlFor={elementId} className="block text-sm font-semibold text-slate-600 dark:text-slate-300 mb-1">{label}</label>}
              <div className="flex gap-2">
                  <div className="relative flex-1">
                      <User className="absolute left-2 top-2 text-emerald-600 dark:text-emerald-400" size={16} />
                      <input
                        id={elementId}
                        type="text"
                        readOnly
                        value={value || ''}
                        onContextMenu={(e) => onContextMenu && onContextMenu(e, fieldName, value)}
                        className="w-full border border-emerald-300 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-900 dark:text-emerald-100 rounded p-2 pl-8 text-sm font-mono cursor-default focus:outline-none"
                        placeholder="(Leer)"
                      />
                  </div>
                  {!isReadOnly && (
                      <button 
                        onClick={() => openPicker('me')}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-1 rounded text-xs font-bold shadow-sm transition-colors whitespace-nowrap"
                        title="Mich selbst eintragen"
                      >
                          Ich (Auto)
                      </button>
                  )}
              </div>
              {showUserPicker && (
                  <UserPickerModal 
                    initialTab="me"
                    onSelect={handleUserSelect} 
                    onClose={() => setShowUserPicker(false)} 
                  />
              )}
          </div>
      );
  }

  // --- RENDER: AD Search ---
  if (widget === 'ad-search') {
      return (
          <div className={mergedClassName}>
              {!element.hideLabel && <label htmlFor={elementId} className="block text-sm font-semibold text-slate-600 dark:text-slate-300 mb-1">{label}</label>}
              <div className="flex gap-2">
                  <div className="relative flex-1">
                      <Search className="absolute left-2 top-2 text-blue-500 dark:text-blue-400" size={16} />
                      <input
                        id={elementId}
                        type="text"
                        readOnly={isReadOnly} // Editable manually? Maybe not if strict AD.
                        value={value || ''} 
                        onChange={(e) => onChange(fieldName, e.target.value)}
                        onContextMenu={(e) => onContextMenu && onContextMenu(e, fieldName, value)}
                        className="w-full border border-blue-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white rounded p-2 pl-8 text-sm focus:ring-2 focus:ring-blue-500 outline-none font-medium"
                        placeholder="Benutzer auswählen..."
                      />
                  </div>
                  {!isReadOnly && (
                      <button 
                        onClick={() => openPicker('search')}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded text-xs font-bold shadow-sm transition-colors whitespace-nowrap flex items-center gap-1"
                      >
                          <Search size={14}/> Suchen
                      </button>
                  )}
              </div>
              {showUserPicker && (
                  <UserPickerModal 
                    initialTab="search"
                    onSelect={handleUserSelect} 
                    onClose={() => setShowUserPicker(false)} 
                  />
              )}
          </div>
      );
  }

  if (widget === 'checkbox' || widget === 'switch') {
      const isSwitch = widget === 'switch';
      return (
          <div className={mergedClassName}>
              <div className={`flex items-center gap-2.5 ${element.hideLabel ? 'mt-2' : 'mt-6'} mb-2`}>
                  {isSwitch ? (
                      <button
                          id={elementId}
                          type="button"
                          disabled={isReadOnly}
                          onClick={() => !isReadOnly && onChange(fieldName, !value)}
                          onFocus={() => onFocusField && onFocusField(fieldName)}
                          className={`relative inline-flex h-5 w-10 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 ${
                              value ? 'bg-indigo-600' : 'bg-slate-200'
                          } ${isReadOnly ? 'opacity-50 cursor-not-allowed' : ''}`}
                      >
                          <span
                              className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                                  value ? 'translate-x-5' : 'translate-x-0'
                              }`}
                          />
                      </button>
                  ) : (
                      <input 
                          id={elementId}
                          type="checkbox"
                          disabled={isReadOnly}
                          checked={!!value}
                          onChange={e => onChange(fieldName, e.target.checked)}
                          onFocus={() => onFocusField && onFocusField(fieldName)}
                          onContextMenu={(e) => onContextMenu && onContextMenu(e, fieldName, value)}
                          className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500 border-gray-300 cursor-pointer"
                      />
                  )}
                  {!element.hideLabel && (
                      <label htmlFor={elementId} className="text-sm font-semibold text-slate-700 dark:text-slate-300 cursor-pointer">{label}</label>
                  )}
              </div>
          </div>
      );
  }

  if (widget === 'select') {
      const options = element.lookup ? getLookupOptions(element.lookup) : [{ value: '', label: '(Keine Datenquelle konfiguriert)' }];
      return (
          <div className={mergedClassName}>
              {!element.hideLabel && <label htmlFor={elementId} className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">{label}</label>}
              <div className="flex gap-2">
                <select
                    id={elementId}
                    disabled={isReadOnly || !element.lookup}
                    value={value || ''}
                    onChange={e => onChange(fieldName, e.target.value)}
                    onFocus={() => onFocusField && onFocusField(fieldName)}
                    onContextMenu={(e) => onContextMenu && onContextMenu(e, fieldName, value)}
                    className="flex-1 shrink-0 appearance-none bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-900 dark:text-white font-medium focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none shadow-sm disabled:bg-slate-50 dark:disabled:bg-slate-900 disabled:text-slate-400 dark:disabled:text-slate-500"
                >
                    <option value="" className="bg-white dark:bg-slate-800 text-slate-900 dark:text-white">Auswählen...</option>
                    {options.map((opt, idx) => (
                        <option key={`${opt.value}-${idx}`} value={opt.value} className="bg-white dark:bg-slate-800 text-slate-900 dark:text-white">{opt.label}</option>
                    ))}
                </select>
                {element.lookup && element.lookup.allowQuickCreate && onOpenLookupModal && !isReadOnly && (
                    <button 
                        onClick={() => element.lookup && onOpenLookupModal(element.lookup.tableId, fieldName, element.lookup.quickCreateFormId)}
                        className="shrink-0 h-9 w-9 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded flex items-center justify-center transition-colors shadow-sm focus:ring focus:ring-indigo-200"
                        title="Neuen Eintrag erstellen (+)"
                    >
                        <Plus size={16} strokeWidth={2.5} />
                    </button>
                )}
              </div>
          </div>
      );
  }

  if (widget === 'markdown') {
      return (
          <div className={mergedClassName}>
              <div className="flex justify-between items-center mb-1">
                  {!element.hideLabel && <label htmlFor={elementId} className="block text-sm font-semibold text-slate-700">{label}</label>}
                  {element.hideLabel && <div className="flex-1" />}
                  <span className="text-[10px] bg-indigo-50 text-indigo-700 font-bold px-2 py-0.5 rounded-full border border-indigo-200/60 flex items-center gap-1 font-mono">
                      <FileText size={10} /> Markdown
                  </span>
              </div>
              {isReadOnly ? (
                  <div className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 min-h-[80px]">
                      <MarkdownViewer content={value || ''} />
                  </div>
              ) : (
                  <MarkdownEditor
                      id={elementId}
                      value={value !== undefined && value !== null ? String(value) : ''}
                      onChange={(newVal) => onChange(fieldName, newVal)}
                      onFocus={() => onFocusField && onFocusField(fieldName)}
                      onContextMenu={(e) => onContextMenu && onContextMenu(e, fieldName, value)}
                      minHeight="140px"
                  />
              )}
          </div>
      );
  }

  if (widget === 'textarea') {
       return (
          <div className={mergedClassName}>
              {!element.hideLabel && <label htmlFor={elementId} className="block text-sm font-semibold text-slate-600 dark:text-slate-300 mb-1">{label}</label>}
              <textarea
                  id={elementId}
                  readOnly={isReadOnly}
                  value={value || ''}
                  onChange={(e) => onChange(fieldName, e.target.value)}
                  onFocus={() => onFocusField && onFocusField(fieldName)}
                  onContextMenu={(e) => onContextMenu && onContextMenu(e, fieldName, value)}
                  className="w-full bg-white dark:bg-slate-800 text-slate-900 dark:text-white border border-slate-300 dark:border-slate-700 rounded-lg p-2.5 text-sm font-medium focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none shadow-2xs"
                  rows={3}
              />
          </div>
      );
  }

  let finalType = 'text';
  if (widget === 'date') finalType = 'date';
  else if (widget === 'time') finalType = 'time';
  else if (widget === 'datetime-local') finalType = 'datetime-local';
  else if (widget === 'number') finalType = 'number';

  let displayValue: any = value || '';
  if (displayValue) {
      if (finalType === 'date') {
          const d = new Date(displayValue);
          if (!isNaN(d.getTime())) displayValue = d.toISOString().split('T')[0];
      } else if (finalType === 'datetime-local') {
          const d = new Date(displayValue);
          if (!isNaN(d.getTime())) displayValue = d.toISOString().slice(0, 16);
      } else if (finalType === 'time' && typeof displayValue === 'string' && displayValue.length > 5) {
          displayValue = displayValue.substring(0, 5);
      }
  }

  return (
      <div className={mergedClassName}>
          {!element.hideLabel && <label htmlFor={elementId} className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">{label}</label>}
          <input
            id={elementId}
            type={finalType}
            readOnly={isReadOnly}
            value={displayValue}
            onChange={(e) => onChange(fieldName, e.target.value)}
            onFocus={() => onFocusField && onFocusField(fieldName)}
            onContextMenu={(e) => onContextMenu && onContextMenu(e, fieldName, value)}
            className={`w-full bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-medium border border-slate-300 dark:border-slate-700 rounded-lg p-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none shadow-2xs ${field?.isAutoIncrement ? 'bg-slate-50 dark:bg-slate-900' : ''}`}
          />
      </div>
  );
};
