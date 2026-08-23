
import React, { useState } from 'react';
import { Table, Field, FieldType, ValidationRule, ValidationOperator, LockInfo, Relationship } from '../../types/index';
import { Plus, Trash2, Key, Wand2, Hash, Clock, CheckSquare, ShieldAlert, Lock, Unlock, UserCheck, GripVertical, Database, Sparkles, ListFilter, Tag, X, ListPlus } from 'lucide-react';
import { generateTableSchema } from '../../services/geminiService';
import { DATA_TYPES } from '../../config/dataTypes';
import { MockDataGeneratorModal } from './MockDataGeneratorModal';
import { SequenceConfigModal } from './components/SequenceConfigModal';

interface TableDesignerProps {
  table: Table;
  onTableChange: (table: Table) => void;
  lockedBy?: LockInfo | null;
  currentUserId?: string;
  relationships?: Relationship[];
  showConfirmation?: (title: string, message: string, onConfirm: () => void, confirmText?: string, confirmClass?: string) => void;
}

export const TableDesigner: React.FC<TableDesignerProps> = ({ table, onTableChange, lockedBy, currentUserId, relationships = [], showConfirmation }) => {
  const [activeTab, setActiveTab] = useState<'fields' | 'validation' | 'grid'>('fields');
  const [aiPrompt, setAiPrompt] = useState('');
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [showAi, setShowAi] = useState(false);
  const [draggedFieldIndex, setDraggedFieldIndex] = useState<number | null>(null);
  const [showMockData, setShowMockData] = useState(false);
  const [selectedFieldId, setSelectedFieldId] = useState<string | null>(null);
  const [sequenceModalField, setSequenceModalField] = useState<Field | null>(null);
  const [enumInputText, setEnumInputText] = useState('');

  const { name: tableName, description: tableDescription, fields = [], validationRules = [] } = table;

  const activeSelectedFieldId = selectedFieldId || fields[0]?.id || null;
  const selectedField = fields.find(f => f.id === activeSelectedFieldId) || fields[0] || null;
  
  const isLockedByMe = lockedBy?.userId === currentUserId;
  const isLockedByOther = lockedBy && !isLockedByMe;
  const isReadOnly = isLockedByOther;

  const setTableName = (name: string) => {
    if(isReadOnly) return;
    onTableChange({ ...table, name });
  }

  const setTableDescription = (description: string) => {
    if(isReadOnly) return;
    onTableChange({ ...table, description });
  }

  const setFields = (fields: Field[]) => {
    if(isReadOnly) return;
    onTableChange({ ...table, fields });
  }

  const addField = () => {
    if(isReadOnly) return;
    setFields([...fields, { 
        id: crypto.randomUUID(), 
        name: `Feld${fields.length + 1}`, 
        type: 'VARCHAR',
        length: 255,
        allowNull: true
    }]);
  };

  const updateField = (id: string, updates: Partial<Field>) => {
    if(isReadOnly) return;
    
    let updatedData = table.data;
    if (updates.name !== undefined) {
        const oldField = fields.find(f => f.id === id);
        const oldName = oldField?.name;
        const newName = updates.name;
        if (oldName && newName && oldName !== newName && Array.isArray(updatedData)) {
            updatedData = updatedData.map(row => {
                const newRow = { ...row };
                if (oldName in newRow) {
                    newRow[newName] = newRow[oldName];
                    delete newRow[oldName];
                }
                return newRow;
            });
        }
    }

    const nextFields = fields.map(f => {
        if (f.id !== id) return f;
        if (updates.type && updates.type !== f.type) {
            const config = DATA_TYPES[updates.type];
            return { 
                ...f, 
                ...updates,
                length: config.hasLength ? (config.defaultLength || 255) : undefined,
                precision: config.hasPrecision ? config.defaultPrecision : undefined,
                scale: config.hasPrecision ? config.defaultScale : undefined,
                enumValues: updates.type === 'ENUM' ? (f.enumValues && f.enumValues.length > 0 ? f.enumValues : ['Option 1', 'Option 2']) : f.enumValues,
                defaultValue: undefined 
            };
        }
        return { ...f, ...updates };
    });

    onTableChange({ ...table, fields: nextFields, data: updatedData });
  };

  const removeField = (id: string) => {
    if(isReadOnly) return;
    const fieldObj = fields.find(f => f.id === id);
    const fieldName = fieldObj?.name || 'Unbekanntes Feld';

    const isUsedInRelationship = relationships.some(rel => 
      (rel.fromTableId === table.id && rel.fromFieldId === id) ||
      (rel.toTableId === table.id && rel.toFieldId === id)
    );

    const performDelete = () => setFields(fields.filter(f => f.id !== id));

    if (isUsedInRelationship) {
        if (showConfirmation) {
            showConfirmation(
                'Feld löschen?',
                `Das Feld "${fieldName}" wird in einer oder mehreren Beziehungen (Tabellenverknüpfungen) verwendet. Wenn Sie es löschen, werden diese Beziehungen möglicherweise ungültig oder beschädigt. Möchten Sie das Feld wirklich löschen?`,
                performDelete
            );
        } else if (window.confirm(`Das Feld "${fieldName}" wird in einer Beziehung verwendet. Wirklich löschen?`)) {
            performDelete();
        }
    } else {
        if (showConfirmation) {
            showConfirmation(
                'Feld löschen?',
                `Möchten Sie das Feld "${fieldName}" wirklich löschen?`,
                performDelete
            );
        } else if (window.confirm(`Möchten Sie das Feld "${fieldName}" wirklich löschen?`)) {
            performDelete();
        }
    }
  };

  // Drag and Drop Handlers
  const handleDragStart = (e: React.DragEvent, index: number) => {
    if (isReadOnly) return;
    setDraggedFieldIndex(index);
    e.dataTransfer.effectAllowed = "move";
    // Required for Firefox to allow dragging
    e.dataTransfer.setData("text/plain", String(index));
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    if (isReadOnly) return;
    e.preventDefault(); // Necessary to allow dropping
    e.dataTransfer.dropEffect = "move";
  };

  const handleDrop = (e: React.DragEvent, dropIndex: number) => {
    if (isReadOnly) return;
    e.preventDefault();
    
    if (draggedFieldIndex === null || draggedFieldIndex === dropIndex) return;

    const newFields = [...fields];
    const [movedField] = newFields.splice(draggedFieldIndex, 1);
    newFields.splice(dropIndex, 0, movedField);

    setFields(newFields);
    setDraggedFieldIndex(null);
  };

  const addValidationRule = () => {
      if(isReadOnly) return;
      const newRule: ValidationRule = {
          id: crypto.randomUUID(),
          fieldId: fields[0]?.id || '',
          operator: 'gt',
          compareType: 'value',
          compareValue: '0',
          errorMessage: 'Ungültiger Wert'
      };
      onTableChange({ ...table, validationRules: [...validationRules, newRule] });
  };

  const updateValidationRule = (id: string, updates: Partial<ValidationRule>) => {
      if(isReadOnly) return;
      const newRules = validationRules.map(r => r.id === id ? { ...r, ...updates } : r);
      onTableChange({ ...table, validationRules: newRules });
  };

  const removeValidationRule = (id: string) => {
      if(isReadOnly) return;
      const performDelete = () => onTableChange({ ...table, validationRules: validationRules.filter(r => r.id !== id) });
      if (showConfirmation) {
          showConfirmation('Regel löschen?', 'Möchten Sie diese Validierungsregel wirklich löschen?', performDelete);
      } else if (window.confirm('Möchten Sie diese Validierungsregel wirklich löschen?')) {
          performDelete();
      }
  };

  const handleAiGenerate = async () => {
    if (!aiPrompt || isReadOnly) return;
    setIsAiLoading(true);
    const schema = await generateTableSchema(aiPrompt);
    if (schema) {
      const newTable = { ...table };
      newTable.name = schema.tableName || tableName;
      if (schema.fields && Array.isArray(schema.fields)) {
        const newFields: Field[] = schema.fields.map((f: any) => ({
          id: crypto.randomUUID(),
          name: f.name,
          type: (DATA_TYPES[f.type] ? f.type : 'VARCHAR') as FieldType,
          isPrimaryKey: f.name.toLowerCase() === 'id',
          allowNull: f.name.toLowerCase() !== 'id',
          isAutoIncrement: f.name.toLowerCase() === 'id' && f.type === 'INTEGER',
          length: f.type === 'VARCHAR' ? 255 : undefined
        }));
        newTable.fields = newFields;
      }
      onTableChange(newTable);
    }
    setIsAiLoading(false);
    setShowAi(false);
  };

  const renderDefaultValueInput = (field: Field) => {
      if (field.isAutoIncrement) return <span className="text-slate-400 text-xs italic">-</span>;

      if (field.type === 'BOOLEAN') {
          return (
              <select 
                  value={field.defaultValue || ''} 
                  disabled={isReadOnly}
                  onChange={e => updateField(field.id, { defaultValue: e.target.value })}
                  className="w-full border border-transparent hover:border-slate-300 focus:border-blue-500 rounded px-2 py-1 bg-transparent text-sm"
              >
                  <option value="">(Kein Standard)</option>
                  <option value="true">True (Ja)</option>
                  <option value="false">False (Nein)</option>
              </select>
          );
      }

      if (field.type === 'ENUM') {
          const options = field.enumValues || [];
          return (
              <select 
                  value={field.defaultValue || ''} 
                  disabled={isReadOnly}
                  onChange={e => updateField(field.id, { defaultValue: e.target.value })}
                  className="w-full border border-slate-300 focus:border-blue-500 rounded px-2 py-1 bg-white text-xs text-slate-800"
              >
                  <option value="">(Kein Standard / Leer)</option>
                  {options.map((opt, i) => (
                      <option key={i} value={opt}>{opt}</option>
                  ))}
              </select>
          );
      }

      if (field.type === 'DATE' || field.type === 'TIME' || field.type === 'DATETIME' || field.type === 'TIMESTAMP') {
          return (
            <div className="relative group">
                <input 
                    type="text" 
                    value={field.defaultValue || ''}
                    disabled={isReadOnly}
                    onChange={(e) => updateField(field.id, { defaultValue: e.target.value })}
                    placeholder="NULL"
                    className="w-full border border-transparent hover:border-slate-300 focus:border-blue-500 rounded px-2 py-1 bg-transparent text-sm placeholder:text-slate-300"
                />
                {!isReadOnly && (
                    <div className="absolute right-1 top-1 hidden group-hover:block">
                        <button 
                            onClick={() => updateField(field.id, { defaultValue: 'NOW' })} 
                            className="text-[10px] bg-slate-200 hover:bg-slate-300 px-1 rounded text-slate-600"
                            title="Aktuelles Datum (NOW)"
                        >
                            NOW
                        </button>
                    </div>
                )}
            </div>
          );
      }

      return (
        <input 
            type="text" 
            value={field.defaultValue || ''}
            disabled={isReadOnly}
            onChange={(e) => updateField(field.id, { defaultValue: e.target.value })}
            placeholder="NULL"
            className="w-full border border-transparent hover:border-slate-300 focus:border-blue-500 rounded px-2 py-1 bg-transparent text-sm placeholder:text-slate-300"
        />
      );
  };

  return (
    <div className="p-8 h-full bg-slate-50 overflow-y-auto">
      <div className={`max-w-[95%] mx-auto bg-white shadow-lg border rounded-lg overflow-hidden flex flex-col h-full ${isReadOnly ? 'border-amber-300 ring-2 ring-amber-100' : isLockedByMe ? 'border-emerald-300 ring-2 ring-emerald-50' : 'border-slate-200'}`}>
        {/* Header */}
        <div className={`text-white px-6 py-4 flex justify-between items-center shrink-0 ${isReadOnly ? 'bg-amber-600' : isLockedByMe ? 'bg-emerald-700' : 'bg-slate-800'}`}>
          <div className="flex gap-4 items-center">
              <h2 className="text-xl font-bold flex items-center gap-2">
                  {isReadOnly ? <Lock size={20} className="text-white"/> : isLockedByMe ? <UserCheck size={20} className="text-emerald-100"/> : null} 
                  Tabellenentwurf
              </h2>
              <div className="flex bg-black/20 rounded p-1">
                  <button 
                    onClick={() => setActiveTab('fields')} 
                    className={`px-3 py-1 rounded text-sm transition-colors ${activeTab === 'fields' ? 'bg-white text-slate-900 font-bold' : 'text-white/70 hover:text-white'}`}
                  >
                      Felder
                  </button>
                  <button 
                    onClick={() => setActiveTab('grid')} 
                    className={`px-3 py-1 rounded text-sm transition-colors flex items-center gap-1 ${activeTab === 'grid' ? 'bg-white text-slate-900 font-bold' : 'text-white/70 hover:text-white'}`}
                  >
                      Grid UX
                  </button>
                  <button 
                    onClick={() => setActiveTab('validation')} 
                    className={`px-3 py-1 rounded text-sm transition-colors flex items-center gap-1 ${activeTab === 'validation' ? 'bg-white text-slate-900 font-bold' : 'text-white/70 hover:text-white'}`}
                  >
                      <ShieldAlert size={14}/> Validierung
                  </button>
              </div>
          </div>
          <div className="flex items-center gap-2">
            {!isReadOnly && (
              <button onClick={() => setShowMockData(true)} className="flex items-center gap-1 px-3 py-1 bg-sky-600 hover:bg-sky-500 rounded text-sm text-white">
                  <Database size={14} /> Mock-Data
              </button>
            )}
            {!isReadOnly && (
              <button disabled={true} className="flex items-center gap-1 px-3 py-1 rounded text-sm bg-slate-300 text-slate-500 cursor-not-allowed">
                  <Wand2 size={14} /> AI-Entwurf (Deaktiviert)
              </button>
            )}
          </div>
        </div>

        {/* Lock Banner */}
        {isReadOnly && lockedBy && (
            <div className="bg-amber-100 text-amber-800 px-6 py-2 text-sm font-semibold flex items-center gap-2 border-b border-amber-200">
                <Lock size={14} />
                Schreibgeschützt: Dieses Objekt wird gerade von <u>{lockedBy.userName}</u> bearbeitet.
            </div>
        )}
        
        {/* Locked by Me Banner */}
        {isLockedByMe && (
            <div className="bg-emerald-50 text-emerald-800 px-6 py-2 text-xs font-semibold flex items-center gap-2 border-b border-emerald-100">
                <UserCheck size={14} />
                Bearbeitungsmodus: Für andere Benutzer gesperrt.
            </div>
        )}

        {/* AI Assistant */}
        {showAi && !isReadOnly && (
          <div className="p-4 bg-red-50 border-b border-red-100 animate-in slide-in-from-top-2 shrink-0">
            <label className="block text-sm font-medium text-red-900 mb-1">Beschreibe deine Tabelle (Deaktiviert):</label>
            <div className="flex gap-2">
              <input 
                type="text" 
                disabled={true}
                className="flex-1 border border-red-250 bg-slate-100 rounded p-2 text-sm text-slate-500 cursor-not-allowed outline-none"
                placeholder="AI-Entwurf ist deaktiviert"
                value={aiPrompt}
                onChange={e => setAiPrompt(e.target.value)}
              />
              <button 
                disabled={true}
                className="bg-slate-300 text-slate-500 px-4 rounded cursor-not-allowed"
              >
                Generieren
              </button>
            </div>
          </div>
        )}

        <div className="p-6 flex-1 overflow-auto">
          <div className="mb-6 grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1">Tabellenname</label>
              <input 
                type="text" 
                value={tableName} 
                disabled={isReadOnly}
                onChange={(e) => setTableName(e.target.value)}
                className="w-full border border-slate-300 rounded p-2 font-mono text-sm disabled:bg-slate-100 disabled:text-slate-500"
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1">Beschreibung (Optional)</label>
              <input 
                type="text" 
                value={tableDescription || ''} 
                disabled={isReadOnly}
                onChange={(e) => setTableDescription(e.target.value)}
                placeholder="Kommentar zur Tabelle"
                className="w-full border border-slate-300 rounded p-2 text-sm disabled:bg-slate-100 disabled:text-slate-500"
              />
            </div>
          </div>

          {activeTab === 'fields' ? (
              <div className="space-y-6">
                {/* Oberer Bereich: Tabellenfeld-Übersicht im MS Access Stil */}
                <div className="border border-slate-300 rounded-lg overflow-hidden bg-white shadow-sm">
                  <div className="bg-slate-100 px-3 py-2 border-b border-slate-300 text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center justify-between">
                    <span>Felderliste ({fields.length} Felder)</span>
                    <span className="text-[11px] text-slate-500 font-normal">Klicken Sie auf eine Zeile, um unten die Feldeigenschaften & Formeln zu bearbeiten.</span>
                  </div>
                  <div className="max-h-64 overflow-y-auto">
                    <table className="w-full border-collapse text-left">
                        <thead>
                        <tr className="bg-slate-50 border-b border-slate-200 text-xs font-bold text-slate-600 uppercase tracking-wider">
                            <th className="p-2 w-6 text-center"></th>
                            {!isReadOnly && <th className="p-2 w-8"></th>}
                            <th className="p-2 w-10 text-center" title="Primärschlüssel">PK</th>
                            <th className="p-2 w-1/4">Feldname</th>
                            <th className="p-2 w-44">Datentyp</th>
                            <th className="p-2 w-20 text-center" title="Erlaubt NULL-Werte">Null</th>
                            <th className="p-2 w-20 text-center" title="Automatisch hochzählen">Auto</th>
                            <th className="p-2 flex-1">Standard / Berechnete Formel</th>
                            <th className="p-2 w-1/4">Kommentar</th>
                            {!isReadOnly && <th className="p-2 w-10"></th>}
                        </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200 text-sm">
                        {fields.map((field, idx) => {
                            const typeConfig = DATA_TYPES[field.type];
                            const isSelected = selectedField?.id === field.id;
                            const isCalculated = Boolean(field.calculationFormula || field.isCalculated);

                            return (
                            <tr 
                                key={field.id} 
                                onClick={() => setSelectedFieldId(field.id)}
                                className={`cursor-pointer transition-colors ${
                                  isSelected 
                                    ? 'bg-blue-50/90 font-medium text-slate-900 border-l-4 border-l-blue-600' 
                                    : 'hover:bg-slate-50 text-slate-700'
                                }`}
                                draggable={!isReadOnly}
                                onDragStart={(e) => handleDragStart(e, idx)}
                                onDragOver={(e) => handleDragOver(e, idx)}
                                onDrop={(e) => handleDrop(e, idx)}
                            >
                            <td className="p-2 text-center text-blue-600 font-bold text-xs">
                              {isSelected ? '▶' : ''}
                            </td>
                            {!isReadOnly && (
                                <td className="p-2 text-center cursor-move text-slate-300 hover:text-slate-500">
                                    <GripVertical size={16} />
                                </td>
                            )}
                            <td className="p-2 text-center" onClick={(e) => e.stopPropagation()}>
                                <button 
                                disabled={isReadOnly}
                                onClick={() => updateField(field.id, { isPrimaryKey: !field.isPrimaryKey, allowNull: field.isPrimaryKey })}
                                className={`p-1 rounded ${field.isPrimaryKey ? 'text-yellow-600' : 'text-slate-300'} ${!isReadOnly ? 'hover:bg-slate-200' : ''}`}
                                >
                                <Key size={16} />
                                </button>
                            </td>
                            <td className="p-2" onClick={(e) => e.stopPropagation()}>
                                <input 
                                type="text" 
                                value={field.name}
                                disabled={isReadOnly}
                                onChange={(e) => updateField(field.id, { name: e.target.value })}
                                className="w-full border border-transparent hover:border-slate-300 focus:border-blue-500 rounded px-2 py-1 bg-transparent text-sm disabled:text-slate-500 font-medium"
                                />
                            </td>
                            <td className="p-2" onClick={(e) => e.stopPropagation()}>
                                <select 
                                value={field.type}
                                disabled={isReadOnly}
                                onChange={(e) => updateField(field.id, { type: e.target.value as FieldType })}
                                className="w-full border border-transparent hover:border-slate-300 focus:border-blue-500 rounded px-2 py-1 bg-transparent text-sm disabled:text-slate-500"
                                >
                                {Object.entries(DATA_TYPES).map(([key, config]) => (
                                    <option key={key} value={key}>{config.label}</option>
                                ))}
                                </select>
                            </td>
                            <td className="p-2 text-center" onClick={(e) => e.stopPropagation()}>
                                <input 
                                    type="checkbox" 
                                    checked={field.allowNull !== false}
                                    disabled={field.isPrimaryKey || isReadOnly}
                                    onChange={(e) => updateField(field.id, { allowNull: e.target.checked })}
                                    className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                                />
                            </td>
                            <td className="p-2 text-center" onClick={(e) => e.stopPropagation()}>
                                {field.sequenceConfig?.enabled ? (
                                    <button 
                                      disabled={isReadOnly}
                                      onClick={() => setSequenceModalField(field)}
                                      className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-emerald-100 border border-emerald-300 text-emerald-800 text-[10px] font-mono font-bold hover:bg-emerald-200 transition-colors"
                                      title={`Nummernkreis: ${field.sequenceConfig.prefix || ''}000... (Klicken zum Bearbeiten)`}
                                    >
                                      <Sparkles size={10} className="text-emerald-600" />
                                      {field.sequenceConfig.prefix ? field.sequenceConfig.prefix.replace('-', '') : 'SEQ'}
                                    </button>
                                ) : field.type === 'INTEGER' ? (
                                    <button 
                                      disabled={isReadOnly}
                                      onClick={() => updateField(field.id, { isAutoIncrement: !field.isAutoIncrement })}
                                      className={`p-1 rounded ${field.isAutoIncrement ? 'text-green-600' : 'text-slate-300'} ${!isReadOnly ? 'hover:bg-slate-200' : ''}`}
                                      title={field.isAutoIncrement ? 'Auto-Inkrement aktiv (Klicken zum Deaktivieren)' : 'Auto-Inkrement aktivieren'}
                                    >
                                      <Hash size={16} />
                                    </button>
                                ) : (
                                    <button
                                      disabled={isReadOnly}
                                      onClick={() => setSequenceModalField(field)}
                                      className="p-1 rounded text-slate-200 hover:text-blue-600 hover:bg-slate-200 transition-colors opacity-60 hover:opacity-100"
                                      title="Nummernkreis / Sequenz einrichten"
                                    >
                                      <Hash size={14} />
                                    </button>
                                )}
                            </td>
                            <td className="p-2">
                                {isCalculated ? (
                                  <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-amber-100 border border-amber-300 text-amber-900 text-xs font-mono font-bold">
                                    ⚡ {field.calculationFormula || 'Berechnet'}
                                  </span>
                                ) : field.type === 'ENUM' ? (
                                  <div className="flex items-center gap-1.5 flex-wrap">
                                    <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-indigo-50 border border-indigo-200 text-indigo-800 text-[11px] font-semibold" title={`Optionen: ${(field.enumValues || []).join(', ')}`}>
                                      🏷️ {(field.enumValues || []).length} Werte: {(field.enumValues || []).slice(0, 3).join(', ')}{(field.enumValues || []).length > 3 ? '...' : ''}
                                    </span>
                                    {field.defaultValue && (
                                      <span className="text-[10px] text-slate-500 font-mono bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200" title="Standardwert">
                                        = {String(field.defaultValue)}
                                      </span>
                                    )}
                                  </div>
                                ) : field.defaultValue ? (
                                  <span className="text-xs text-slate-600 font-mono bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                                    = {String(field.defaultValue)}
                                  </span>
                                ) : (
                                  <span className="text-xs text-slate-400 italic">(Kein Standard)</span>
                                )}
                            </td>
                            <td className="p-2" onClick={(e) => e.stopPropagation()}>
                                <input 
                                    type="text" 
                                    value={field.comment || ''}
                                    disabled={isReadOnly}
                                    onChange={(e) => updateField(field.id, { comment: e.target.value })}
                                    placeholder="Kommentar..."
                                    className="w-full border border-transparent hover:border-slate-300 focus:border-blue-500 rounded px-2 py-1 bg-transparent text-xs text-slate-600 disabled:text-slate-400"
                                />
                            </td>
                            {!isReadOnly && (
                                <td className="p-2 text-center" onClick={(e) => e.stopPropagation()}>
                                    <button 
                                    onClick={() => removeField(field.id)}
                                    className="text-slate-400 hover:text-red-600 p-1"
                                    title="Feld löschen"
                                    >
                                    <Trash2 size={16} />
                                    </button>
                                </td>
                            )}
                            </tr>
                        )})}
                        </tbody>
                    </table>
                  </div>

                  {!isReadOnly && (
                      <div className="p-2 bg-slate-50 border-t border-slate-200">
                        <button 
                            onClick={addField}
                            className="flex items-center gap-1.5 text-blue-600 hover:text-blue-800 text-xs font-bold px-2 py-1 rounded hover:bg-blue-50 transition-colors"
                        >
                            <Plus size={16} /> Neues Feld hinzufügen
                        </button>
                      </div>
                  )}
                </div>

                {/* Unterer Bereich: MS Access Style "Feldeigenschaften" Panel */}
                {selectedField && (
                  <div className="border border-slate-300 rounded-lg overflow-hidden bg-white shadow-md animate-in fade-in">
                    <div className="bg-slate-800 text-white px-4 py-2 text-xs font-bold flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Database size={16} className="text-amber-400" />
                        <span>Feldeigenschaften — Feld: <span className="text-amber-300 font-mono font-semibold text-sm">{selectedField.name}</span> ({selectedField.type})</span>
                      </div>
                      <span className="text-[11px] font-normal text-slate-300">Tabellen-Entwurfsmodus</span>
                    </div>

                    <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-6 bg-slate-50/50">
                      
                      {/* Spalte 1: ⚡ Feldberechnung & Formel-Editor (Freies Schreiben & Assistent) */}
                      <div className="bg-white border border-slate-200 rounded-lg p-3.5 space-y-3 shadow-sm">
                        <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                          <h4 className="font-bold text-xs text-slate-800 flex items-center gap-1.5">
                            <span className="p-1 bg-amber-100 text-amber-800 rounded">⚡</span>
                            Feldberechnung & Freie Formel
                          </h4>
                          {selectedField.calculationFormula && (
                            <button
                              onClick={() => updateField(selectedField.id, { calculationFormula: '', isCalculated: false })}
                              className="text-[10px] text-red-600 hover:underline font-semibold"
                            >
                              Formel löschen
                            </button>
                          )}
                        </div>

                        <div>
                          <label className="block text-xs font-semibold text-slate-700 mb-1">
                            Freie Formel / Ausdruck:
                          </label>
                          <textarea
                            value={selectedField.calculationFormula || ''}
                            disabled={isReadOnly}
                            onChange={(e) => updateField(selectedField.id, { 
                              calculationFormula: e.target.value,
                              isCalculated: Boolean(e.target.value.trim())
                            })}
                            rows={3}
                            placeholder="z.B. [Preis] * [Menge] oder AGE([Geburtsdatum]) oder [Vorname] + ' ' + [Nachname]"
                            className="w-full border border-slate-300 focus:border-blue-500 rounded p-2 text-xs font-mono text-slate-900 bg-white shadow-inner focus:outline-none focus:ring-1 focus:ring-blue-500"
                          />
                        </div>

                        {/* Formel-Assistent / Feld-Einfügen */}
                        {!isReadOnly && (
                          <div className="space-y-2 pt-1 border-t border-slate-100">
                            <div className="text-[11px] font-bold text-slate-600">
                              Formel-Assistent — Klick zum Einfügen in die Formel:
                            </div>

                            {/* Verfügbare Felder in der Tabelle */}
                            <div>
                              <span className="text-[10px] text-slate-500 uppercase tracking-wider block mb-1 font-semibold">Tabelle-Felder:</span>
                              <div className="flex flex-wrap gap-1">
                                {fields.map(f => (
                                  <button
                                    key={f.id}
                                    type="button"
                                    onClick={() => {
                                      const current = selectedField.calculationFormula || '';
                                      const newFormula = current ? `${current} [${f.name}]` : `[${f.name}]`;
                                      updateField(selectedField.id, { calculationFormula: newFormula, isCalculated: true });
                                    }}
                                    className="px-2 py-0.5 bg-slate-100 hover:bg-amber-100 border border-slate-300 hover:border-amber-400 rounded text-[11px] font-mono text-slate-800 transition-colors"
                                  >
                                    [{f.name}]
                                  </button>
                                ))}
                              </div>
                            </div>

                            {/* Operatoren & Vorlagen */}
                            <div>
                              <span className="text-[10px] text-slate-500 uppercase tracking-wider block mb-1 font-semibold">Operatoren & Funktionen:</span>
                              <div className="flex flex-wrap gap-1">
                                {[
                                  { label: '+', expr: ' + ' },
                                  { label: '-', expr: ' - ' },
                                  { label: '*', expr: ' * ' },
                                  { label: '/', expr: ' / ' },
                                  { label: '( )', expr: '()' },
                                  { label: 'AGE(...)', expr: 'AGE([Geburtsdatum])' },
                                  { label: 'ROUND(x, 2)', expr: 'ROUND([Netto] * 1.19, 2)' },
                                  { label: 'Text + Text', expr: "[Vorname] + ' ' + [Nachname]" },
                                ].map((item, i) => (
                                  <button
                                    key={i}
                                    type="button"
                                    onClick={() => {
                                      const current = selectedField.calculationFormula || '';
                                      const newFormula = current ? `${current}${item.expr}` : item.expr;
                                      updateField(selectedField.id, { calculationFormula: newFormula, isCalculated: true });
                                    }}
                                    className="px-1.5 py-0.5 bg-white hover:bg-blue-50 border border-slate-200 hover:border-blue-300 rounded text-[11px] font-mono text-slate-700 transition-colors"
                                  >
                                    {item.label}
                                  </button>
                                ))}
                              </div>
                            </div>

                            <p className="text-[10px] text-slate-500 italic pt-1">
                              💡 Hinweis: Sie können jedes Feld in eckigen Klammern `[Feldname]` in der Formel verwenden.
                            </p>
                          </div>
                        )}
                      </div>

                      {/* Spalte 2: ⚙️ Allgemeine Feldeigenschaften */}
                      <div className="bg-white border border-slate-200 rounded-lg p-3.5 space-y-3 shadow-sm">
                        <h4 className="font-bold text-xs text-slate-800 border-b border-slate-100 pb-2 flex items-center gap-1.5">
                          <span className="p-1 bg-slate-100 text-slate-700 rounded">⚙️</span>
                          Allgemeine Eigenschaften
                        </h4>

                        <div className="grid grid-cols-2 gap-3 text-xs">
                          <div>
                            <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                              Standardwert:
                            </label>
                            {renderDefaultValueInput(selectedField)}
                          </div>

                          <div>
                            <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                              Formatierung:
                            </label>
                            <select 
                              value={selectedField.rendererType || ''}
                              disabled={isReadOnly}
                              onChange={e => updateField(selectedField.id, { rendererType: e.target.value as any })}
                              className="w-full border border-slate-300 rounded px-2 py-1 text-xs bg-white"
                            >
                              <option value="">(Standard Text)</option>
                              <option value="markdown">📝 Markdown / Formatierter Text</option>
                              <option value="currency">💶 Währung (€)</option>
                              <option value="progress">📊 Fortschrittsbalken (%)</option>
                              <option value="status_pill">🏷️ Status Pill Badge</option>
                              <option value="avatar">👤 Benutzer-Avatar</option>
                              <option value="date">📅 Datum / Uhrzeit</option>
                            </select>
                          </div>

                          {(DATA_TYPES[selectedField.type]?.hasLength || DATA_TYPES[selectedField.type]?.hasPrecision) && (
                            <div>
                              <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                                Feldgröße / Länge:
                              </label>
                              <div className="flex items-center gap-1">
                                {DATA_TYPES[selectedField.type]?.hasLength && (
                                  <input 
                                    type="number" 
                                    value={selectedField.length || ''} 
                                    disabled={isReadOnly}
                                    onChange={e => updateField(selectedField.id, { length: parseInt(e.target.value) })}
                                    className="w-20 border border-slate-300 rounded px-2 py-1 text-xs bg-white"
                                    placeholder="255"
                                  />
                                )}
                                {DATA_TYPES[selectedField.type]?.hasPrecision && (
                                  <>
                                    <input 
                                      type="number" 
                                      value={selectedField.precision || ''} 
                                      disabled={isReadOnly}
                                      onChange={e => updateField(selectedField.id, { precision: parseInt(e.target.value) })}
                                      className="w-14 border border-slate-300 rounded px-1 py-1 text-xs text-center"
                                      placeholder="10"
                                    />
                                    <span>,</span>
                                    <input 
                                      type="number" 
                                      value={selectedField.scale || ''} 
                                      disabled={isReadOnly}
                                      onChange={e => updateField(selectedField.id, { scale: parseInt(e.target.value) })}
                                      className="w-14 border border-slate-300 rounded px-1 py-1 text-xs text-center"
                                      placeholder="2"
                                    />
                                  </>
                                )}
                              </div>
                            </div>
                          )}

                          <div>
                            <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                              Eingabe Erforderlich:
                            </label>
                            <div className="flex items-center gap-2 pt-1">
                              <input 
                                type="checkbox" 
                                id="allowNullProp"
                                checked={selectedField.allowNull === false}
                                disabled={selectedField.isPrimaryKey || isReadOnly}
                                onChange={(e) => updateField(selectedField.id, { allowNull: !e.target.checked })}
                                className="rounded border-slate-300 text-blue-600"
                              />
                              <label htmlFor="allowNullProp" className="text-xs text-slate-700 cursor-pointer">
                                Ja (Wert nicht leeren)
                              </label>
                            </div>
                          </div>

                          {selectedField.type === 'INTEGER' && !selectedField.sequenceConfig?.enabled && (
                            <div>
                              <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                                Auto-Inkrement:
                              </label>
                              <div className="flex items-center gap-2 pt-1">
                                <input 
                                  type="checkbox" 
                                  id="autoIncProp"
                                  checked={selectedField.isAutoIncrement || false}
                                  disabled={isReadOnly}
                                  onChange={(e) => updateField(selectedField.id, { isAutoIncrement: e.target.checked })}
                                  className="rounded border-slate-300 text-blue-600"
                                />
                                <label htmlFor="autoIncProp" className="text-xs text-slate-700 cursor-pointer">
                                  Automatisch hochzählen (+1)
                                </label>
                              </div>
                            </div>
                          )}

                          <div className="col-span-full">
                            <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                              Fortlaufende Nummerierung / Nummernkreis (Formatierung):
                            </label>
                            {selectedField.sequenceConfig?.enabled ? (
                              <div className="flex items-center justify-between p-2.5 bg-emerald-50 border border-emerald-200 rounded-lg">
                                <div className="space-y-0.5">
                                  <div className="text-xs font-bold text-emerald-950 flex items-center gap-1.5">
                                    <Sparkles size={14} className="text-emerald-600" />
                                    Aktiv: <span className="font-mono bg-white px-1.5 py-0.5 rounded border border-emerald-300 text-emerald-800">{selectedField.sequenceConfig.prefix || ''}{'0'.repeat(selectedField.sequenceConfig.padding || 5)}{selectedField.sequenceConfig.suffix || ''}</span>
                                  </div>
                                  <div className="text-[11px] text-emerald-700">
                                    Startwert: {selectedField.sequenceConfig.startValue ?? 1} • Schritt: +{selectedField.sequenceConfig.step ?? 1} {selectedField.sequenceConfig.includeYear ? `• Jahr: ${selectedField.sequenceConfig.includeYear}` : ''}
                                  </div>
                                </div>
                                <div className="flex items-center gap-1.5">
                                  <button
                                    type="button"
                                    disabled={isReadOnly}
                                    onClick={() => setSequenceModalField(selectedField)}
                                    className="px-2.5 py-1 text-xs font-bold text-emerald-800 bg-white border border-emerald-300 rounded-md hover:bg-emerald-100 transition-colors shadow-2xs"
                                  >
                                    Konfigurieren
                                  </button>
                                  <button
                                    type="button"
                                    disabled={isReadOnly}
                                    onClick={() => updateField(selectedField.id, { sequenceConfig: undefined })}
                                    className="p-1 text-xs text-slate-400 hover:text-red-600 transition-colors"
                                    title="Nummernkreis deaktivieren"
                                  >
                                    <Trash2 size={14} />
                                  </button>
                                </div>
                              </div>
                            ) : (
                              <button
                                type="button"
                                disabled={isReadOnly}
                                onClick={() => setSequenceModalField(selectedField)}
                                className="w-full flex items-center justify-center gap-2 py-2 px-3 border border-dashed border-slate-300 hover:border-blue-500 rounded-lg text-xs font-semibold text-slate-600 hover:text-blue-700 hover:bg-blue-50/70 transition-colors"
                              >
                                <Sparkles size={14} className="text-blue-600" />
                                Fortlaufende Nummerierung einrichten (z. B. LIF-00010, KD-10001)...
                              </button>
                            )}
                          </div>
                        </div>

                        <div>
                          <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                            Beschreibung / Kommentar:
                          </label>
                          <input 
                            type="text" 
                            value={selectedField.comment || ''}
                            disabled={isReadOnly}
                            onChange={(e) => updateField(selectedField.id, { comment: e.target.value })}
                            placeholder="Zweck oder Beschreibung dieses Feldes..."
                            className="w-full border border-slate-300 rounded px-2 py-1 text-xs bg-white"
                          />
                        </div>
                      </div>

                      {/* Volle Breite (wenn ENUM): 🏷️ ENUM-Auswahloptionen Manager */}
                      {selectedField.type === 'ENUM' && (
                        <div className="col-span-full bg-white border-2 border-indigo-200 rounded-lg p-4 space-y-3.5 shadow-sm animate-in fade-in">
                          <div className="flex items-center justify-between border-b border-indigo-100 pb-2.5">
                            <div className="flex items-center gap-2">
                              <div className="p-1.5 bg-indigo-100 text-indigo-700 rounded-md">
                                <Tag size={16} />
                              </div>
                              <div>
                                <h4 className="font-bold text-xs text-slate-800 flex items-center gap-2">
                                  ENUM-Auswahlwerte / Dropdown-Optionen
                                  <span className="px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-800 text-[10px] font-mono font-bold">
                                    {(selectedField.enumValues || []).length} Werte definiert
                                  </span>
                                </h4>
                                <p className="text-[11px] text-slate-500">
                                  Legen Sie die erlaubten Werte für das Dropdown-Menü fest. Benutzer können im Datenblatt oder Formularen aus diesen Optionen wählen.
                                </p>
                              </div>
                            </div>
                            
                            {(selectedField.enumValues || []).length > 0 && !isReadOnly && (
                              <button
                                type="button"
                                onClick={() => updateField(selectedField.id, { enumValues: [], defaultValue: undefined })}
                                className="text-[11px] text-red-600 hover:text-red-800 hover:underline font-semibold"
                              >
                                Alle löschen
                              </button>
                            )}
                          </div>

                          {/* Aktuelle ENUM-Werte als interaktive Tags / Badges */}
                          <div>
                            <span className="text-[11px] font-bold text-slate-700 block mb-1.5">
                              Aktuelle Auswahloptionen:
                            </span>
                            <div className="flex flex-wrap gap-1.5 min-h-[38px] p-2 bg-slate-50 border border-slate-200 rounded-lg items-center">
                              {(selectedField.enumValues || []).map((val, idx) => (
                                <span
                                  key={idx}
                                  className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-semibold shadow-2xs transition-all ${
                                    selectedField.defaultValue === val
                                      ? 'bg-indigo-600 text-white ring-2 ring-indigo-400'
                                      : 'bg-white text-indigo-900 border border-indigo-200 hover:border-indigo-300'
                                  }`}
                                >
                                  <Tag size={11} className={selectedField.defaultValue === val ? 'text-indigo-200' : 'text-indigo-500'} />
                                  <span>{val}</span>
                                  {selectedField.defaultValue === val && (
                                    <span className="text-[9px] bg-indigo-800 text-indigo-100 px-1 rounded uppercase font-bold tracking-wider">
                                      Standard
                                    </span>
                                  )}
                                  {!isReadOnly && (
                                    <button
                                      type="button"
                                      onClick={() => {
                                        const newVals = (selectedField.enumValues || []).filter((_, i) => i !== idx);
                                        const newDefault = selectedField.defaultValue === val ? undefined : selectedField.defaultValue;
                                        updateField(selectedField.id, { enumValues: newVals, defaultValue: newDefault });
                                      }}
                                      className="ml-1 text-slate-400 hover:text-red-600 font-bold p-0.5 hover:bg-slate-100 rounded"
                                      title={`"${val}" entfernen`}
                                    >
                                      <X size={12} />
                                    </button>
                                  )}
                                </span>
                              ))}

                              {(!selectedField.enumValues || selectedField.enumValues.length === 0) && (
                                <span className="text-xs text-slate-400 italic">
                                  Noch keine Werte eingetragen. Tragen Sie unten Werte ein oder wählen Sie eine Vorlage.
                                </span>
                              )}
                            </div>
                          </div>

                          {/* Schnelleingabe neuer Werte */}
                          {!isReadOnly && (
                            <div className="space-y-2">
                              <label className="block text-[11px] font-bold text-slate-700">
                                Neuen Wert hinzufügen (Einzeln oder Komma-getrennt für mehrere):
                              </label>
                              <div className="flex gap-2">
                                <input
                                  type="text"
                                  value={enumInputText}
                                  onChange={e => setEnumInputText(e.target.value)}
                                  onKeyDown={e => {
                                    if (e.key === 'Enter') {
                                      e.preventDefault();
                                      const trimmed = enumInputText.trim();
                                      if (!trimmed) return;
                                      const splitValues = trimmed.split(',').map(s => s.trim()).filter(Boolean);
                                      const existing = selectedField.enumValues || [];
                                      const uniqueToAdd = splitValues.filter(v => !existing.includes(v));
                                      if (uniqueToAdd.length > 0) {
                                        updateField(selectedField.id, { enumValues: [...existing, ...uniqueToAdd] });
                                      }
                                      setEnumInputText('');
                                    }
                                  }}
                                  placeholder="z.B. Offen, In Bearbeitung, Erledigt oder einzelner Wert (Enter zum Hinzufügen)..."
                                  className="flex-1 border border-slate-300 focus:border-indigo-500 rounded-lg px-3 py-1.5 text-xs bg-white text-slate-800 shadow-2xs focus:outline-none focus:ring-1 focus:ring-indigo-500"
                                />
                                <button
                                  type="button"
                                  onClick={() => {
                                    const trimmed = enumInputText.trim();
                                    if (!trimmed) return;
                                    const splitValues = trimmed.split(',').map(s => s.trim()).filter(Boolean);
                                    const existing = selectedField.enumValues || [];
                                    const uniqueToAdd = splitValues.filter(v => !existing.includes(v));
                                    if (uniqueToAdd.length > 0) {
                                      updateField(selectedField.id, { enumValues: [...existing, ...uniqueToAdd] });
                                    }
                                    setEnumInputText('');
                                  }}
                                  className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-lg transition-colors flex items-center gap-1.5 shadow-2xs"
                                >
                                  <Plus size={14} /> Hinzufügen
                                </button>
                              </div>
                            </div>
                          )}

                          {/* Schnellauswahl / Presets */}
                          {!isReadOnly && (
                            <div className="pt-2 border-t border-slate-100 space-y-1.5">
                              <span className="text-[10px] uppercase tracking-wider text-slate-500 font-bold block">
                                Schnellauswahl / Häufige Vorlagen (Klick zum Übernehmen):
                              </span>
                              <div className="flex flex-wrap gap-1.5">
                                {[
                                  { label: 'Anrede (Herr, Frau, Divers, Firma)', vals: ['Herr', 'Frau', 'Divers', 'Firma'] },
                                  { label: 'Status (Offen, In Bearbeitung, Erledigt, Blockiert)', vals: ['Offen', 'In Bearbeitung', 'Erledigt', 'Blockiert'] },
                                  { label: 'Ticket (Neu, In Bearbeitung, Gelöst, Geschlossen)', vals: ['Neu', 'In Bearbeitung', 'Gelöst', 'Geschlossen'] },
                                  { label: 'Priorität (Niedrig, Normal, Hoch, Dringend)', vals: ['Niedrig', 'Normal', 'Hoch', 'Dringend'] },
                                  { label: 'Ja / Nein', vals: ['Ja', 'Nein'] },
                                  { label: 'Zahlung (Offen, Bezahlt, Gemahnt, Storniert)', vals: ['Offen', 'Bezahlt', 'Gemahnt', 'Storniert'] },
                                  { label: 'Einheiten (Stück, Stunde, Meter, kg, Pauschale)', vals: ['Stück', 'Stunde', 'Meter', 'kg', 'Pauschale'] },
                                ].map((preset, pIdx) => (
                                  <button
                                    key={pIdx}
                                    type="button"
                                    onClick={() => {
                                      updateField(selectedField.id, {
                                        enumValues: preset.vals,
                                        defaultValue: preset.vals[0]
                                      });
                                    }}
                                    className="px-2 py-1 bg-slate-100 hover:bg-indigo-50 border border-slate-200 hover:border-indigo-300 rounded text-[11px] text-slate-700 hover:text-indigo-900 transition-colors font-medium"
                                  >
                                    ⚡ {preset.label}
                                  </button>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      )}

                    </div>
                  </div>
                )}
              </div>
          ) : activeTab === 'grid' ? (
              <div className="max-w-4xl animate-in fade-in space-y-6">
                <div className="bg-slate-100 p-4 border border-slate-200 rounded-lg">
                    <h3 className="font-bold text-slate-800 flex items-center gap-2 mb-2"><CheckSquare size={18} /> Excel-Like Data Grid</h3>
                    <p className="text-xs text-slate-600 mb-4">Erweiterte Tabellenfunktionen für den Endanwender in der fertig generierten Application.</p>
                    
                    <div className="space-y-3">
                        <label className="flex items-center gap-2 text-sm font-semibold text-slate-800">
                            <input type="checkbox" checked={table.enableInlineEditing || false} disabled={isReadOnly} onChange={e => onTableChange({...table, enableInlineEditing: e.target.checked})} />
                            Inline Editing erlauben (Doppelklick zum Bearbeiten)
                        </label>
                        <label className="flex items-center gap-2 text-sm font-semibold text-slate-800">
                            <input type="checkbox" checked={table.enableMassUpdates || false} disabled={isReadOnly} onChange={e => onTableChange({...table, enableMassUpdates: e.target.checked})} />
                            Mass Updates & Checkboxes erlauben
                        </label>
                    </div>
                </div>

                <div className="border border-slate-200 rounded-lg p-4">
                    <h3 className="font-bold text-slate-800 mb-4">Spalten-Formatierung (Custom Renderer)</h3>
                    <div className="space-y-2">
                        {fields.map(field => (
                             <div key={field.id} className="flex gap-4 items-center bg-slate-50 p-2 rounded">
                                 <div className="w-1/3 flex items-center gap-2">
                                    <span className="font-mono text-sm font-bold text-slate-700">{field.name}</span>
                                    <span className="text-[10px] bg-slate-200 px-1 rounded text-slate-500">{field.type}</span>
                                 </div>
                                 <div className="flex-1">
                                    <select 
                                        value={field.rendererType || 'text'}
                                        disabled={isReadOnly}
                                        onChange={e => updateField(field.id, { rendererType: e.target.value as any })}
                                        className="w-full text-sm border p-1.5 rounded disabled:bg-slate-100 bg-white"
                                    >
                                        <option value="text">Standard-Text</option>
                                        <option value="progress">Progress-Bar (%)</option>
                                        <option value="status_pill">Status-Badge (Pill)</option>
                                        <option value="avatar">Avatar (mit Name/Email)</option>
                                        <option value="currency">Währung / Currency</option>
                                    </select>
                                 </div>
                             </div>
                        ))}
                    </div>
                </div>

                <div className="border border-slate-200 rounded-lg p-4">
                    <h3 className="font-bold text-slate-800 mb-4">Bedingte Formatierung (Zeilen)</h3>
                    <div className="space-y-2">
                        {(table.conditionalFormatting || []).map((rule, idx) => (
                             <div key={rule.id} className="flex gap-2 items-center bg-white border border-slate-200 rounded p-2 text-sm shadow-sm">
                                <span>Wenn Feld</span>
                                <select 
                                    className="border rounded p-1 bg-slate-50 text-xs"
                                    value={rule.fieldId}
                                    onChange={e => {
                                        const updated = [...(table.conditionalFormatting || [])];
                                        updated[idx] = { ...updated[idx], fieldId: e.target.value };
                                        onTableChange({...table, conditionalFormatting: updated});
                                    }}
                                >
                                    {(fields || []).map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
                                </select>
                                <select 
                                    className="border rounded p-1 bg-slate-50 text-xs"
                                    value={rule.operator}
                                    onChange={e => {
                                        const updated = [...(table.conditionalFormatting || [])];
                                        updated[idx] = { ...updated[idx], operator: e.target.value as any };
                                        onTableChange({...table, conditionalFormatting: updated});
                                    }}
                                >
                                    <option value="eq">ist gleich</option>
                                    <option value="neq">ist ungleich</option>
                                    <option value="contains">enthält</option>
                                    <option value="gt">größer als</option>
                                    <option value="lt">kleiner als</option>
                                </select>
                                <input 
                                    type="text" 
                                    className="border rounded p-1 w-20 text-xs" 
                                    placeholder="Wert..."
                                    value={rule.value || ''}
                                    onChange={e => {
                                        const updated = [...(table.conditionalFormatting || [])];
                                        updated[idx] = { ...updated[idx], value: e.target.value };
                                        onTableChange({...table, conditionalFormatting: updated});
                                    }}
                                />
                                <span className="text-slate-400 font-bold">»</span>
                                
                                <span className="text-xs text-slate-600">Zeile einfärben:</span>
                                <input type="color" value={rule.style.backgroundColor || '#ffffff'} onChange={e => {
                                    const updated = [...(table.conditionalFormatting || [])];
                                    updated[idx] = { ...updated[idx], style: { ...updated[idx].style, backgroundColor: e.target.value } };
                                    onTableChange({...table, conditionalFormatting: updated});
                                }} className="h-6 w-6 rounded border cursor-pointer"/>
                                                                
                                <input type="color" value={rule.style.color || '#000000'} onChange={e => {
                                    const updated = [...(table.conditionalFormatting || [])];
                                    updated[idx] = { ...updated[idx], style: { ...updated[idx].style, color: e.target.value } };
                                    onTableChange({...table, conditionalFormatting: updated});
                                }} className="h-6 w-6 rounded border cursor-pointer"/>

                                <button 
                                    className="text-red-500 hover:bg-red-50 p-1 rounded ml-auto text-xs font-bold"
                                    onClick={() => {
                                        const updated = (table.conditionalFormatting || []).filter(r => r.id !== rule.id);
                                        onTableChange({...table, conditionalFormatting: updated});
                                    }}
                                >
                                    X
                                </button>
                            </div>
                        ))}
                        <button 
                            className="mt-4 flex items-center gap-1 text-sm text-blue-600 hover:text-blue-800 font-bold"
                            onClick={() => {
                                const newRule = {
                                    id: crypto.randomUUID(),
                                    fieldId: fields[0]?.id || '',
                                    operator: 'eq' as const,
                                    value: '',
                                    style: { backgroundColor: '#fee2e2', color: '#991b1b' }
                                };
                                onTableChange({...table, conditionalFormatting: [...(table.conditionalFormatting || []), newRule]});
                            }}
                        >
                            <Plus size={16}/> Neue Regel
                        </button>
                    </div>
                </div>
              </div>
          ) : (
              <div className="max-w-4xl animate-in fade-in slide-in-from-right-4">
                  <div className="bg-blue-50 border-l-4 border-blue-500 p-4 mb-4">
                      <p className="text-sm text-blue-700">
                          Definieren Sie hier Geschäftsregeln, die beim Speichern (Backend) validiert werden.
                      </p>
                  </div>
                  
                  <div className="space-y-3">
                      {validationRules.map((rule) => (
                          <div key={rule.id} className="flex gap-2 items-center bg-slate-50 border border-slate-200 p-2 rounded shadow-sm">
                              <div className="w-1/4">
                                  <label className="block text-[10px] font-bold text-slate-500 uppercase">Feld</label>
                                  <select 
                                    className="w-full border rounded p-1 text-sm disabled:bg-slate-100"
                                    value={rule.fieldId}
                                    disabled={isReadOnly}
                                    onChange={e => updateValidationRule(rule.id, { fieldId: e.target.value })}
                                  >
                                      {fields.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
                                  </select>
                              </div>
                              <div className="w-24">
                                  <label className="block text-[10px] font-bold text-slate-500 uppercase">Operator</label>
                                  <select 
                                    className="w-full border rounded p-1 text-sm disabled:bg-slate-100"
                                    value={rule.operator}
                                    disabled={isReadOnly}
                                    onChange={e => updateValidationRule(rule.id, { operator: e.target.value as ValidationOperator })}
                                  >
                                      <option value="gt">Größer (&gt;)</option>
                                      <option value="lt">Kleiner (&lt;)</option>
                                      <option value="gte">Min (&gt;=)</option>
                                      <option value="lte">Max (&lt;=)</option>
                                      <option value="eq">Gleich (=)</option>
                                      <option value="neq">Ungleich (!=)</option>
                                      <option value="regex">Regex Pattern</option>
                                  </select>
                              </div>
                              <div className="w-1/3">
                                  <label className="block text-[10px] font-bold text-slate-500 uppercase">Vergleichswert / Feld</label>
                                  <div className="flex gap-1">
                                      <select 
                                        className="border rounded p-1 text-xs w-16 bg-slate-100 disabled:opacity-50"
                                        value={rule.compareType}
                                        disabled={isReadOnly}
                                        onChange={e => updateValidationRule(rule.id, { compareType: e.target.value as any })}
                                      >
                                          <option value="value">Wert</option>
                                          <option value="field">Feld</option>
                                      </select>
                                      {rule.compareType === 'field' ? (
                                          <select 
                                            className="flex-1 border rounded p-1 text-sm disabled:bg-slate-100"
                                            value={rule.compareValue}
                                            disabled={isReadOnly}
                                            onChange={e => updateValidationRule(rule.id, { compareValue: e.target.value })}
                                          >
                                              <option value="">(Wählen)</option>
                                              {fields.filter(f => f.id !== rule.fieldId).map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
                                          </select>
                                      ) : (
                                          <input 
                                            type="text" 
                                            className="flex-1 border rounded p-1 text-sm disabled:bg-slate-100"
                                            placeholder={rule.operator === 'regex' ? '^Pattern$' : 'Wert'}
                                            value={rule.compareValue}
                                            disabled={isReadOnly}
                                            onChange={e => updateValidationRule(rule.id, { compareValue: e.target.value })}
                                          />
                                      )}
                                  </div>
                              </div>
                              <div className="flex-1">
                                  <label className="block text-[10px] font-bold text-slate-500 uppercase">Fehlermeldung</label>
                                  <input 
                                    type="text" 
                                    className="w-full border rounded p-1 text-sm disabled:bg-slate-100"
                                    placeholder="z.B. Startdatum muss vor Enddatum liegen"
                                    value={rule.errorMessage}
                                    disabled={isReadOnly}
                                    onChange={e => updateValidationRule(rule.id, { errorMessage: e.target.value })}
                                  />
                              </div>
                              {!isReadOnly && (
                                <button onClick={() => removeValidationRule(rule.id)} className="mt-4 text-slate-400 hover:text-red-500"><Trash2 size={16}/></button>
                              )}
                          </div>
                      ))}
                      
                      {!isReadOnly && (
                        <button onClick={addValidationRule} className="flex items-center gap-1 text-blue-600 hover:text-blue-800 text-sm font-semibold mt-4">
                            <Plus size={16} /> Regel hinzufügen
                        </button>
                      )}
                  </div>
              </div>
          )}
        </div>
      </div>
      {showMockData && (
          <MockDataGeneratorModal table={table} onClose={() => setShowMockData(false)} />
      )}
      {sequenceModalField && (
          <SequenceConfigModal
            isOpen={Boolean(sequenceModalField)}
            field={sequenceModalField}
            onClose={() => setSequenceModalField(null)}
            onSave={(cfg) => {
              updateField(sequenceModalField.id, { sequenceConfig: cfg });
              setSequenceModalField(null);
            }}
          />
      )}
    </div>
  );
};
