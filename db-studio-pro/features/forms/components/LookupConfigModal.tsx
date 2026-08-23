
import React, { useState, useEffect } from 'react';
import { Table, Field, Query, SelectQuery } from '../../../types/index';
import { X, GripVertical, ArrowRight, Check, Search, Plus, Trash2, AlignCenter, ArrowUpAZ, ArrowDownAZ } from 'lucide-react';

interface DisplayConfigItem {
    fieldId: string;
    prefix?: string;
    suffix?: string;
}

interface LookupConfigModalProps {
  allTables: Table[];
  queries?: Query[];
  initialConfig: {
    tableId: string;
    valueFieldId: string;
    labelFields: string[];
    displayFormat?: DisplayConfigItem[];
    sort?: { fieldId: string; direction: 'ASC' | 'DESC' };
  };
  onSave: (config: any) => void;
  onClose: () => void;
}

export const LookupConfigModal: React.FC<LookupConfigModalProps> = ({
  allTables,
  queries,
  initialConfig,
  onSave,
  onClose,
}) => {
  // Map tables and queries into a unified data structure
  const dataSources = React.useMemo(() => {
    const tableSources = allTables.map(t => ({
      id: t.id,
      name: t.name,
      type: 'Tabelle',
      fields: t.fields.map(f => ({ id: f.id, name: f.name, isPrimaryKey: f.isPrimaryKey })),
      data: t.data
    }));

    const querySources = (queries || []).filter(q => q.type === 'SELECT').map(q => {
      const sq = q as SelectQuery;
      // Extract unique fields from columns
      const fields = sq.columns.map(c => ({
        id: c.id, 
        name: c.alias || c.fieldName,
        isPrimaryKey: false
      }));
      return {
        id: q.id,
        name: q.name,
        type: 'Abfrage',
        fields: fields,
        data: [] // No preview data available for queries currently
      };
    });

    return [...tableSources, ...querySources];
  }, [allTables, queries]);

  const [tableId, setTableId] = useState(initialConfig?.tableId || (dataSources[0]?.id || ''));
  const [valueFieldId, setValueFieldId] = useState(initialConfig?.valueFieldId || '');
  
  // Sort State
  const [sortFieldId, setSortFieldId] = useState(initialConfig?.sort?.fieldId || '');
  const [sortDirection, setSortDirection] = useState<'ASC' | 'DESC'>(initialConfig?.sort?.direction || 'ASC');

  // State for the sortable, configurable list
  const [selectedItems, setSelectedItems] = useState<DisplayConfigItem[]>([]);
  const [draggedIdx, setDraggedIdx] = useState<number | null>(null);

  const selectedTable = dataSources.find((t) => t.id === tableId);

  // Init state from props
  useEffect(() => {
      if (initialConfig?.displayFormat && initialConfig.displayFormat.length > 0) {
          setSelectedItems(initialConfig.displayFormat);
      } else if (initialConfig?.labelFields && initialConfig.labelFields.length > 0) {
          // Migration from old array string format
          setSelectedItems(initialConfig.labelFields.map(id => ({ fieldId: id, prefix: '', suffix: ' ' })));
      }
  }, [initialConfig]);

  // Reset fields when table changes
  useEffect(() => {
    if (selectedTable) {
        // Validate Value Field
        const isValueValid = selectedTable.fields.some(f => f.id === valueFieldId);
        if (!isValueValid) {
            setValueFieldId(selectedTable.fields.find(f => f.isPrimaryKey)?.id || selectedTable.fields[0]?.id || '');
            setSelectedItems([]);
        }
        // Validate Sort Field
        const isSortValid = selectedTable.fields.some(f => f.id === sortFieldId);
        if (!isSortValid && sortFieldId !== '') {
            setSortFieldId('');
        }
    }
  }, [tableId, selectedTable]);

  const availableFields = selectedTable?.fields.filter(f => !selectedItems.some(item => item.fieldId === f.id)) || [];
  
  const handleAddField = (fieldId: string) => {
    // Default suffix is space, unless it's the very first item
    setSelectedItems([...selectedItems, { fieldId, prefix: '', suffix: ' ' }]);
  };

  const handleRemoveField = (fieldId: string) => {
    setSelectedItems(selectedItems.filter((item) => item.fieldId !== fieldId));
  };

  const updateItemConfig = (index: number, key: 'prefix' | 'suffix', value: string) => {
      const newItems = [...selectedItems];
      newItems[index] = { ...newItems[index], [key]: value };
      setSelectedItems(newItems);
  };

  // Drag and Drop Logic
  const handleDragStart = (e: React.DragEvent, index: number) => {
    setDraggedIdx(index);
    e.dataTransfer.setData('text/plain', String(index));
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedIdx === null || draggedIdx === index) return;

    const newOrder = [...selectedItems];
    const draggedItem = newOrder[draggedIdx];
    newOrder.splice(draggedIdx, 1);
    newOrder.splice(index, 0, draggedItem);

    setSelectedItems(newOrder);
    setDraggedIdx(index);
  };

  const handleSave = () => {
    onSave({
      tableId,
      valueFieldId,
      labelFields: selectedItems.map(i => i.fieldId), // Keep strictly for legacy compatibility
      displayFormat: selectedItems,
      sort: sortFieldId ? { fieldId: sortFieldId, direction: sortDirection } : undefined
    });
    onClose();
  };

  // Preview Logic
  const getPreviewText = () => {
      if (!selectedTable || !selectedTable.data || selectedTable.data.length === 0) return 'Keine Daten für Vorschau...';
      const row = selectedTable.data[0];
      
      return selectedItems.map(item => {
          const f = selectedTable.fields.find(field => field.id === item.fieldId);
          const val = f ? row[f.name] : '???';
          return `${item.prefix || ''}${val}${item.suffix || ''}`;
      }).join('');
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-[60] flex items-center justify-center animate-in fade-in-25 backdrop-blur-sm">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-5xl border border-slate-300 flex flex-col h-[90vh]">
        
        {/* Header */}
        <div className="flex justify-between items-center p-5 bg-slate-800 text-white rounded-t-xl shrink-0">
          <div>
            <h2 className="text-xl font-bold flex items-center gap-2">
               <Search size={24} className="text-blue-400"/> Lookup Konfiguration
            </h2>
            <p className="text-slate-300 text-sm mt-1">Definieren Sie Quelle, Sortierung und Anzeigeformat.</p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors">
            <X size={24} />
          </button>
        </div>

        <div className="flex-1 overflow-hidden flex flex-col p-6 gap-6 bg-slate-50">
            
            {/* Top Settings */}
            <div className="grid grid-cols-2 gap-6 bg-white p-4 rounded-lg border border-slate-200 shadow-sm shrink-0">
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-bold text-slate-700 mb-1">Quelle (Tabelle)</label>
                        <select 
                            className="w-full border border-slate-300 rounded p-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                            value={tableId}
                            onChange={(e) => setTableId(e.target.value)}
                        >
                            {dataSources.map(t => <option key={t.id} value={t.id}>{t.type}: {t.name}</option>)}
                        </select>
                    </div>
                    
                    <div className="flex gap-2">
                        <div className="flex-1">
                            <label className="block text-sm font-bold text-slate-700 mb-1">Sortieren nach</label>
                            <select 
                                className="w-full border border-slate-300 rounded p-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                                value={sortFieldId}
                                onChange={(e) => setSortFieldId(e.target.value)}
                            >
                                <option value="">(Keine Sortierung)</option>
                                {selectedTable?.fields.map(f => (
                                    <option key={f.id} value={f.id}>{f.name}</option>
                                ))}
                            </select>
                        </div>
                        <div className="w-1/3">
                            <label className="block text-sm font-bold text-slate-700 mb-1">Reihenfolge</label>
                            <div className="flex bg-slate-100 rounded p-1 border border-slate-300">
                                <button 
                                    onClick={() => setSortDirection('ASC')}
                                    className={`flex-1 flex justify-center py-1 rounded text-xs ${sortDirection === 'ASC' ? 'bg-white shadow text-blue-600 font-bold' : 'text-slate-500 hover:bg-slate-200'}`}
                                    title="Aufsteigend (A-Z, 0-9)"
                                >
                                    <ArrowUpAZ size={16}/>
                                </button>
                                <button 
                                    onClick={() => setSortDirection('DESC')}
                                    className={`flex-1 flex justify-center py-1 rounded text-xs ${sortDirection === 'DESC' ? 'bg-white shadow text-blue-600 font-bold' : 'text-slate-500 hover:bg-slate-200'}`}
                                    title="Absteigend (Z-A, 9-0)"
                                >
                                    <ArrowDownAZ size={16}/>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                <div>
                    <label className="block text-sm font-bold text-slate-700 mb-1">Gespeicherter Wert (Value / ID)</label>
                    <select 
                        className="w-full border border-slate-300 rounded p-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                        value={valueFieldId}
                        onChange={(e) => setValueFieldId(e.target.value)}
                    >
                        {selectedTable?.fields.map(f => (
                            <option key={f.id} value={f.id}>{f.name} {f.isPrimaryKey ? '(PK)' : ''}</option>
                        ))}
                    </select>
                    <p className="text-[10px] text-slate-400 mt-2">Das ist der Wert, der tatsächlich in der Datenbank gespeichert wird (meistens die ID).</p>
                </div>
            </div>

            {/* Drag & Drop Area */}
            <div className="flex-1 flex gap-4 min-h-0">
                
                {/* Left: Available */}
                <div className="w-1/3 flex flex-col bg-white border border-slate-200 rounded-lg shadow-sm overflow-hidden">
                    <div className="p-3 bg-slate-100 border-b border-slate-200 font-bold text-slate-600 text-sm">
                        Verfügbare Felder
                    </div>
                    <div className="flex-1 overflow-y-auto p-2 space-y-1">
                        {availableFields.map(f => (
                            <div 
                                key={f.id} 
                                onClick={() => handleAddField(f.id)}
                                className="flex items-center justify-between p-2 rounded border border-transparent hover:bg-blue-50 hover:border-blue-200 cursor-pointer group transition-colors"
                            >
                                <span className="text-sm text-slate-700">{f.name}</span>
                                <Plus size={16} className="text-blue-500 opacity-0 group-hover:opacity-100" />
                            </div>
                        ))}
                        {availableFields.length === 0 && <div className="text-xs text-slate-400 text-center py-4">Alle Felder ausgewählt</div>}
                    </div>
                </div>

                {/* Center: Arrow */}
                <div className="flex flex-col justify-center items-center text-slate-300">
                    <ArrowRight size={24} />
                </div>

                {/* Right: Selected (Sortable & Configurable) */}
                <div className="flex-1 flex flex-col bg-white border border-blue-200 ring-1 ring-blue-100 rounded-lg shadow-sm overflow-hidden">
                    <div className="p-3 bg-blue-50 border-b border-blue-100 font-bold text-blue-800 text-sm flex justify-between items-center">
                        <span>Anzeigereihenfolge & Formatierung</span>
                        <span className="text-xs font-normal text-blue-600 bg-white px-2 py-0.5 rounded-full border border-blue-200">{selectedItems.length} Felder</span>
                    </div>
                    <div className="grid grid-cols-[30px_80px_1fr_80px_30px] gap-2 px-3 py-2 bg-slate-100 border-b border-slate-200 text-xs font-bold text-slate-500 uppercase">
                        <div></div>
                        <div>Davor</div>
                        <div>Feld</div>
                        <div>Danach</div>
                        <div></div>
                    </div>
                    <div className="flex-1 overflow-y-auto p-2 space-y-2 bg-slate-50/50">
                        {selectedItems.map((item, idx) => {
                            const fieldName = selectedTable?.fields.find(f => f.id === item.fieldId)?.name || '???';
                            return (
                                <div 
                                    key={item.fieldId}
                                    draggable
                                    onDragStart={(e) => handleDragStart(e, idx)}
                                    onDragOver={(e) => handleDragOver(e, idx)}
                                    className="grid grid-cols-[30px_80px_1fr_80px_30px] gap-2 items-center p-2 bg-white rounded border border-slate-200 shadow-sm cursor-grab active:cursor-grabbing hover:border-blue-300 group"
                                >
                                    <div className="text-slate-400 cursor-move flex justify-center">
                                        <GripVertical size={16} />
                                    </div>
                                    
                                    <input 
                                        type="text" 
                                        className="w-full border border-slate-200 rounded px-1 py-0.5 text-xs text-center focus:border-blue-400 focus:ring-1 focus:ring-blue-400 outline-none placeholder:text-slate-300"
                                        placeholder='z.B. ('
                                        value={item.prefix || ''}
                                        onChange={(e) => updateItemConfig(idx, 'prefix', e.target.value)}
                                    />

                                    <div className="text-sm font-medium text-slate-800 truncate text-center bg-slate-50 border border-slate-100 rounded px-1">
                                        {fieldName}
                                    </div>

                                    <input 
                                        type="text" 
                                        className="w-full border border-slate-200 rounded px-1 py-0.5 text-xs text-center focus:border-blue-400 focus:ring-1 focus:ring-blue-400 outline-none placeholder:text-slate-300"
                                        placeholder='z.B. )'
                                        value={item.suffix || ''}
                                        onChange={(e) => updateItemConfig(idx, 'suffix', e.target.value)}
                                    />

                                    <button 
                                        onClick={() => handleRemoveField(item.fieldId)}
                                        className="text-slate-400 hover:text-red-500 p-1 rounded hover:bg-red-50 transition-colors flex justify-center"
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            );
                        })}
                        {selectedItems.length === 0 && (
                            <div className="h-full flex flex-col items-center justify-center text-slate-400 border-2 border-dashed border-slate-200 rounded m-2">
                                <p className="text-xs">Fügen Sie Felder von links hinzu.</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Preview Section */}
            <div className="bg-slate-100 p-4 rounded-lg border border-slate-200 shrink-0">
                <label className="block text-xs font-bold uppercase text-slate-500 mb-2">Ergebnis Vorschau (Beispiel mit 1. Datensatz)</label>
                <div className="w-full max-w-md bg-white border border-slate-300 rounded p-2 text-sm text-slate-800 shadow-inner flex items-center justify-between">
                    <span className="font-mono text-blue-900">{getPreviewText()}</span>
                    <Search size={16} className="text-slate-400" />
                </div>
            </div>

        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 p-5 bg-slate-50 border-t border-slate-200 rounded-b-xl shrink-0">
          <button onClick={onClose} className="bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 px-6 py-2 rounded-lg text-sm font-medium transition-colors">
            Abbrechen
          </button>
          <button onClick={handleSave} className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg text-sm font-medium flex items-center gap-2 shadow-sm transition-colors">
            <Check size={18} /> Konfiguration speichern
          </button>
        </div>
      </div>
    </div>
  );
};
