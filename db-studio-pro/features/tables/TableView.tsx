
import React, { useRef, useState, useEffect } from 'react';
import { Table, ApiQueryParam, Field, Relationship } from '../../types/index';
import { Plus, Trash2, Upload, RefreshCw, Loader2, Sliders, Filter, X, ExternalLink, Layout, List, GripVertical, ArrowUpDown, Shuffle, Settings2, HelpCircle, Zap, SlidersHorizontal, ShieldAlert } from 'lucide-react';
import { VirtualTable } from '../../components/VirtualTable';
import { fetchApiData } from '../../utils/apiImportHelper';
import { useDataFilter } from '../../hooks/useDataFilter';
import { RecordDetailModal } from '../../components/modals/RecordDetailModal';
import { KanbanBoard } from './components/KanbanBoard';
import { evaluateFormFormula } from '../../utils/formulaEvaluator';
import { generateNextSequenceValue } from '../../utils/sequenceHelper';
import { AdvancedFilterModal } from './components/AdvancedFilterModal';
import { CascadeDeleteModal } from './components/CascadeDeleteModal';
import { useProjectStore } from '../../stores/useProjectStore';

interface TableViewProps {
  table: Table;
  allTables: Table[];
  relationships: Relationship[];
  onTableChange: (table: Table) => void;
  showConfirmation: (title: string, message: string, onConfirm: () => void, confirmText?: string, confirmClass?: string) => void;
  formActionTrigger?: { action: string; timestamp: number } | null;
}

const formatDateValue = (val: any, format?: string, type?: string) => {
    if (!val) return '';
    
    // For TIME fields without format string, or if value is just HH:mm
    if (type === 'TIME' && typeof val === 'string' && val.length <= 8 && val.includes(':')) {
        return format ? val : val.substring(0, 5); // Return HH:mm if just time
    }

    let date: Date;
    if (typeof val === 'number') {
        date = new Date(val > 10000000000 ? val : val * 1000);
    } else {
        // If it’s just a time string, map it to today
        if (type === 'TIME' && typeof val === 'string' && val.match(/^\d{2}:\d{2}/)) {
            const [h, m, s] = val.split(':');
            date = new Date();
            date.setHours(parseInt(h || '0'), parseInt(m || '0'), parseInt(s || '0'), 0);
        } else {
            date = new Date(val);
        }
    }
    if (isNaN(date.getTime())) return String(val);
    
    if (!format) {
        if (type === 'TIME') return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        if (type === 'DATE') return date.toLocaleDateString();
        return date.toLocaleString();
    }
    const d = date.getDate().toString().padStart(2, '0');
    const m = (date.getMonth() + 1).toString().padStart(2, '0');
    const y = date.getFullYear();
    const H = date.getHours().toString().padStart(2, '0');
    const M = date.getMinutes().toString().padStart(2, '0');
    const S = date.getSeconds().toString().padStart(2, '0');
    return format.replace('dd', d).replace('MM', m).replace('yyyy', String(y)).replace('HH', H).replace('mm', M).replace('ss', S);
};

export const TableView: React.FC<TableViewProps> = ({ table, allTables, relationships, onTableChange, showConfirmation, formActionTrigger }) => {
  const headers = table.fields.map(field => field.name);
  const headerTooltips = table.fields.reduce((acc, field) => {
    if (field.comment) acc[field.name] = field.comment;
    return acc;
  }, {} as Record<string, string>);
  const rawData = table.data || [];
  
  const { updateTable } = useProjectStore();

  const { 
    filteredData, filters, setFilter, clearFilters, showFilters, setShowFilters, columnStats,
    sortColumn, sortDirection, handleSort, setSort, clearSort,
    advancedRules, setAdvancedRules, matchMode, setMatchMode
  } = useDataFilter(rawData, table.fields);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showParams, setShowParams] = useState(false);
  const [detailView, setDetailView] = useState<{ targetTableId: string, recordId: any } | null>(null);
  const [activeColumn, setActiveColumn] = useState<string | null>(null);
  const [selectedRowIndex, setSelectedRowIndex] = useState<number | null>(null);

  // Modals state
  const [showAdvancedFilterModal, setShowAdvancedFilterModal] = useState(false);
  const [showCascadeDeleteModal, setShowCascadeDeleteModal] = useState(false);
  const [recordForDelete, setRecordForDelete] = useState<Record<string, any> | null>(null);
  
  // View Mode: List or Kanban
  const [viewMode, setViewMode] = useState<'list' | 'kanban'>('list');

  // Reordering Drag & Drop State
  const [pendingReorder, setPendingReorder] = useState<{ srcIdx: number; targetIdx: number } | null>(null);
  const [selectedSortField, setSelectedSortField] = useState<string>('');
  const [reorderMethod, setReorderMethod] = useState<'cascade' | 'swap' | 'only_this'>('cascade');
  const [rememberReorderRule, setRememberReorderRule] = useState(false);

  const handleRowReorder = (srcIdx: number, targetIdx: number) => {
    if (srcIdx === targetIdx) return;
    
    // Check if there is a saved rule in localStorage
    const savedRuleStr = localStorage.getItem(`table_reorder_rule_${table.id}`);
    if (savedRuleStr) {
      try {
        const rule = JSON.parse(savedRuleStr);
        if (table.fields.some(f => f.name === rule.field)) {
          executeReorder(srcIdx, targetIdx, rule.field, rule.method);
          return;
        }
      } catch (e) {
        console.error(e);
      }
    }
    
    // Otherwise, open the prompt modal
    const numericFields = table.fields.filter(f => f.type === 'INTEGER' || f.type === 'DECIMAL' || f.type === 'REAL');
    const candidate = numericFields.find(f => {
      const n = f.name.toLowerCase();
      return n.includes('order') || n.includes('pos') || n.includes('seq') || n.includes('sort') || n.includes('reihenfolge') || n.includes('nr');
    }) || numericFields[0];
    
    setSelectedSortField(candidate ? candidate.name : '');
    setPendingReorder({ srcIdx, targetIdx });
  };

  const createNewSortOrderField = () => {
    const newFieldId = 'f-' + Math.random().toString(36).substring(2, 9);
    const newField: Field = {
      id: newFieldId,
      name: 'SortOrder',
      type: 'INTEGER',
      allowNull: true,
      defaultValue: '1',
      comment: 'Automatisch generierte Spalte für Zeilenreihenfolge'
    };
    
    const updatedData = rawData.map((row, idx) => ({
      ...row,
      SortOrder: idx + 1
    }));
    
    const updatedFields = [...table.fields, newField];
    onTableChange({
      ...table,
      fields: updatedFields,
      data: updatedData
    });
    
    setSelectedSortField('SortOrder');
  };

  const executeReorder = (srcIdx: number, targetIdx: number, fieldName: string, method: 'cascade' | 'swap' | 'only_this') => {
    let updatedData = [...rawData];
    
    if (method === 'cascade') {
      const reordered = [...rawData];
      const [removed] = reordered.splice(srcIdx, 1);
      reordered.splice(targetIdx, 0, removed);
      updatedData = reordered.map((row, idx) => ({
        ...row,
        [fieldName]: idx + 1
      }));
    } else if (method === 'swap') {
      const val1 = rawData[srcIdx][fieldName];
      const val2 = rawData[targetIdx][fieldName];
      updatedData[srcIdx] = { ...updatedData[srcIdx], [fieldName]: val2 };
      updatedData[targetIdx] = { ...updatedData[targetIdx], [fieldName]: val1 };
      
      const [removed] = updatedData.splice(srcIdx, 1);
      updatedData.splice(targetIdx, 0, removed);
    } else {
      const targetVal = rawData[targetIdx][fieldName];
      updatedData[srcIdx] = { ...updatedData[srcIdx], [fieldName]: targetVal };
      
      const [removed] = updatedData.splice(srcIdx, 1);
      updatedData.splice(targetIdx, 0, removed);
    }
    
    if (rememberReorderRule) {
      localStorage.setItem(`table_reorder_rule_${table.id}`, JSON.stringify({
        field: fieldName,
        method
      }));
    }
    
    onTableChange({ ...table, data: updatedData });
    setPendingReorder(null);
  };

  const queryParams = table.apiConfig?.queryParams || [];

  useEffect(() => {
      if (table.apiConfig?.refreshOnLoad) {
          handleApiRefresh();
      }
  }, [table.id]);

  useEffect(() => {
    const handleToggleFilters = () => {
      setShowFilters(prev => !prev);
    };
    window.addEventListener('toggle-table-filters', handleToggleFilters);
    return () => {
      window.removeEventListener('toggle-table-filters', handleToggleFilters);
    };
  }, [setShowFilters]);

  // Handle ribbon action triggers (from Home Tab / Start Registerkarte)
  useEffect(() => {
    if (!formActionTrigger) return;
    const { action } = formActionTrigger;
    switch (action) {
      case 'form_new_record':
        addRow();
        break;
      case 'form_delete_record': {
        const targetRow = (selectedRowIndex !== null && rawData[selectedRowIndex]) 
          ? rawData[selectedRowIndex] 
          : rawData[rawData.length - 1];
        if (targetRow) {
          // Check if there are foreign key relationships for this table
          const rels = relationships.filter(r => r.fromTableId === table.id);
          if (rels.length > 0) {
            setRecordForDelete(targetRow);
            setShowCascadeDeleteModal(true);
          } else {
            deleteRow(targetRow);
          }
        } else {
          alert('Kein Datensatz zum Löschen vorhanden.');
        }
        break;
      }
      case 'form_delete_cascade': {
        const targetRow = (selectedRowIndex !== null && rawData[selectedRowIndex]) 
          ? rawData[selectedRowIndex] 
          : rawData[rawData.length - 1];
        if (targetRow) {
          setRecordForDelete(targetRow);
          setShowCascadeDeleteModal(true);
        } else {
          alert('Kein Datensatz zum erweiterten Löschen ausgewählt.');
        }
        break;
      }
      case 'form_filter_selection': {
        if (activeColumn && selectedRowIndex !== null && rawData[selectedRowIndex]) {
          const cellVal = String(rawData[selectedRowIndex][activeColumn] ?? '');
          setFilter(activeColumn, cellVal);
        } else if (activeColumn && rawData.length > 0) {
          const cellVal = String(rawData[0][activeColumn] ?? '');
          if (cellVal) {
            setFilter(activeColumn, cellVal);
          } else {
            alert(`Klicken Sie auf eine konkrete Zelle in Spalte "${activeColumn}", um nach deren Inhalt zu filtern.`);
          }
        } else {
          alert('Bitte klicken Sie in der Tabelle auf eine Zelle, um nach diesem Wert zu filtern ("Filter nach Auswahl").');
        }
        break;
      }
      case 'form_filter_advanced': {
        setShowAdvancedFilterModal(true);
        break;
      }
      case 'form_toggle_filter':
        setShowFilters(prev => !prev);
        break;
      case 'form_sort_asc': {
        const targetCol = activeColumn || sortColumn || headers[0];
        if (targetCol) {
          setSort(targetCol, 'asc');
        }
        break;
      }
      case 'form_sort_desc': {
        const targetCol = activeColumn || sortColumn || headers[0];
        if (targetCol) {
          setSort(targetCol, 'desc');
        }
        break;
      }
      case 'form_clear_sort':
        clearSort();
        break;
      case 'form_refresh':
        clearFilters();
        if (table.apiConfig) handleApiRefresh();
        break;
      case 'form_save_record':
        onTableChange({ ...table });
        break;
      default:
        break;
    }
  }, [formActionTrigger]);

  const updateParamValue = (id: string, newVal: string) => {
      if (!table.apiConfig || !table.apiConfig.queryParams) return;
      const newParams = table.apiConfig.queryParams.map(p => p.id === id ? { ...p, value: newVal } : p);
      onTableChange({ ...table, apiConfig: { ...table.apiConfig, queryParams: newParams } });
  };

  const handleDataChange = (rowToUpdate: any, header: string, value: any) => {
    const originalIndex = rawData.indexOf(rowToUpdate);
    if (originalIndex === -1) return;
    const newData = [...rawData];
    newData[originalIndex] = { ...newData[originalIndex], [header]: value };
    onTableChange({ ...table, data: newData });
  };

  const addRow = () => {
    const newRow = headers.reduce((acc, header) => {
      const field = table.fields.find(f => f.name === header);
      if (field?.sequenceConfig?.enabled) {
          acc[header] = generateNextSequenceValue(field, rawData);
      } else if (field?.isAutoIncrement && field.type === 'INTEGER') {
          const maxVal = rawData.reduce((max, row) => {
              const val = parseInt(row[header], 10);
              return !isNaN(val) && val > max ? val : max;
          }, 0);
          acc[header] = maxVal + 1;
      } else if (field?.defaultValue !== undefined && field?.defaultValue !== '') {
          if (field.type === 'BOOLEAN') {
              acc[header] = field.defaultValue === 'true';
          } else if ((field.type === 'DATE' || field.type === 'TIME' || field.type === 'DATETIME' || field.type === 'TIMESTAMP') && field.defaultValue.toUpperCase() === 'NOW') {
              acc[header] = new Date().toISOString();
          } else {
              acc[header] = field.defaultValue;
          }
      } else {
          acc[header] = '';
      }
      return acc;
    }, {} as Record<string, any>);

    const newData = [...rawData, newRow];
    onTableChange({ ...table, data: newData });
  };

  const deleteRow = (rowToDelete: any) => {
    // If relationships exist, offer cascade delete modal
    const rels = relationships.filter(r => r.fromTableId === table.id);
    if (rels.length > 0) {
      setRecordForDelete(rowToDelete);
      setShowCascadeDeleteModal(true);
      return;
    }

    showConfirmation('Zeile löschen', 'Möchten Sie diese Zeile wirklich löschen?', () => {
        const newData = rawData.filter(r => r !== rowToDelete);
        onTableChange({ ...table, data: newData });
    });
  };

  const handleCascadeDeleteConfirm = (mode: 'cascade' | 'set_null' | 'restrict') => {
    if (!recordForDelete) return;

    if (mode === 'restrict') {
      const rels = relationships.filter(r => r.fromTableId === table.id);
      let hasDeps = false;
      rels.forEach(rel => {
        const parentField = table.fields.find(f => f.id === rel.fromFieldId);
        const childTable = allTables.find(t => t.id === rel.toTableId);
        const childField = childTable?.fields.find(f => f.id === rel.toFieldId);
        const parentVal = parentField ? recordForDelete[parentField.name] : null;
        if (childTable && childField && parentVal !== undefined && parentVal !== null) {
          const matchCount = (childTable.data || []).filter(cRow => String(cRow[childField.name]) === String(parentVal)).length;
          if (matchCount > 0) hasDeps = true;
        }
      });

      if (hasDeps) {
        alert('Löschen abgebrochen: Es existieren noch abhängige Datensätze in verknüpften Tabellen (RESTRICT / Sperre aktiv).');
        setShowCascadeDeleteModal(false);
        setRecordForDelete(null);
        return;
      }
    }

    let childTablesUpdatedCount = 0;
    let childRowsAffectedCount = 0;

    const rels = relationships.filter(r => r.fromTableId === table.id);
    rels.forEach(rel => {
      const parentField = table.fields.find(f => f.id === rel.fromFieldId);
      const childTable = allTables.find(t => t.id === rel.toTableId);
      const childField = childTable?.fields.find(f => f.id === rel.toFieldId);
      const parentVal = parentField ? recordForDelete[parentField.name] : null;

      if (childTable && childField && parentVal !== undefined && parentVal !== null) {
        if (mode === 'cascade') {
          const oldLen = childTable.data?.length || 0;
          const newChildData = (childTable.data || []).filter(cRow => String(cRow[childField.name]) !== String(parentVal));
          const removed = oldLen - newChildData.length;
          if (removed > 0) {
            childTablesUpdatedCount++;
            childRowsAffectedCount += removed;
            updateTable({ ...childTable, data: newChildData });
          }
        } else if (mode === 'set_null') {
          let updatedCount = 0;
          const newChildData = (childTable.data || []).map(cRow => {
            if (String(cRow[childField.name]) === String(parentVal)) {
              updatedCount++;
              return { ...cRow, [childField.name]: '' };
            }
            return cRow;
          });
          if (updatedCount > 0) {
            childTablesUpdatedCount++;
            childRowsAffectedCount += updatedCount;
            updateTable({ ...childTable, data: newChildData });
          }
        }
      }
    });

    const newData = rawData.filter(r => r !== recordForDelete);
    onTableChange({ ...table, data: newData });

    setShowCascadeDeleteModal(false);
    setRecordForDelete(null);

    if (childRowsAffectedCount > 0) {
      alert(`Löschaktion erfolgreich! ${childRowsAffectedCount} abhängige Datensätze in ${childTablesUpdatedCount} verknüpften Tabellen wurden (${mode === 'cascade' ? 'kaskadierend gelöscht' : 'Fremdschlüssel geleert'}).`);
    } else {
      alert('Hauptdatensatz erfolgreich gelöscht.');
    }
  };

  const handleApiRefresh = async () => {
      if (!table.apiConfig) return;
      setIsRefreshing(true);
      const result = await fetchApiData(table.apiConfig.url, table.apiConfig.method, table.apiConfig.headers, table.apiConfig.queryParams);
      if (result.error) {
          alert('Fehler beim Aktualisieren: ' + result.error);
      } else {
          onTableChange({ ...table, data: result.data });
      }
      setIsRefreshing(false);
  };

  const handleImportCSV = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      if (!text) return;
      const lines = text.split('\n');
      const csvHeaders = lines[0].split(',').map(h => h.trim().replace(/^"|"$/g, ''));
      const autoIncFields = table.fields.filter(f => f.isAutoIncrement && f.type === 'INTEGER');
      const nextAutoIncValues: Record<string, number> = {};
      autoIncFields.forEach(f => {
          const maxVal = rawData.reduce((max, row) => {
              const val = parseInt(row[f.name], 10);
              return !isNaN(val) && val > max ? val : max;
          }, 0);
          nextAutoIncValues[f.name] = maxVal + 1;
      });
      const newRows: Record<string, any>[] = [];
      for (let i = 1; i < lines.length; i++) {
        if (!lines[i].trim()) continue;
        const values = lines[i].split(',').map(v => v.trim().replace(/^"|"$/g, ''));
        if (values.length === csvHeaders.length) {
          const row: Record<string, any> = {};
          table.fields.forEach(field => {
             const index = csvHeaders.findIndex(h => h.toLowerCase() === field.name.toLowerCase());
             row[field.name] = index !== -1 ? values[index] : '';
          });
          autoIncFields.forEach(f => {
              if (!row[f.name]) { row[f.name] = nextAutoIncValues[f.name]; nextAutoIncValues[f.name]++; }
          });
          newRows.push(row);
        }
      }
      if (newRows.length > 0) {
        onTableChange({ ...table, data: [...rawData, ...newRows] });
        alert(`${newRows.length} Zeilen erfolgreich importiert.`);
      }
      if (fileInputRef.current) fileInputRef.current.value = '';
    };
    reader.readAsText(file);
  };

  const renderRow = (row: any, rowIndex: number) => {
      const computedRow = { ...row };
      const calculatedFields = table.fields.filter(f => f.isCalculated || Boolean(f.calculationFormula));
      let changed = true;
      let passes = 0;
      while (changed && passes < 5) {
          changed = false;
          passes++;
          for (const field of calculatedFields) {
              if (field.calculationFormula) {
                  const newVal = evaluateFormFormula(field.calculationFormula, computedRow);
                  if (computedRow[field.name] !== newVal) {
                      computedRow[field.name] = newVal;
                      changed = true;
                  }
              }
          }
      }

      return (
          <div 
              onDragOver={(e) => {
                  e.preventDefault();
              }}
              onDrop={(e) => {
                  e.preventDefault();
                  const srcIdxStr = e.dataTransfer.getData('text/row-index');
                  if (srcIdxStr) {
                      const srcIdx = parseInt(srcIdxStr, 10);
                      if (!isNaN(srcIdx)) {
                          handleRowReorder(srcIdx, rowIndex);
                      }
                  }
              }}
              className="flex border-b border-slate-100 hover:bg-sky-50 group h-full items-center text-sm text-slate-700"
          >
              {/* Drag Handle */}
              <div 
                  draggable
                  onDragStart={(e) => {
                      e.dataTransfer.setData('text/row-index', String(rowIndex));
                      e.dataTransfer.effectAllowed = 'move';
                  }}
                  className="w-8 shrink-0 flex items-center justify-center cursor-grab active:cursor-grabbing text-slate-400 hover:text-indigo-600 border-r border-slate-100 h-full bg-slate-50/50"
                  title="Zeile verschieben (Drag & Drop)"
              >
                  <GripVertical size={14} />
              </div>

              {headers.map((header, colIdx) => {
                const field = table.fields.find(f => f.name === header);
                const isAutoInc = field?.isAutoIncrement;
                const isCalculated = field?.isCalculated || Boolean(field?.calculationFormula);
                let rawVal = computedRow[header] ?? '';


            const rel = relationships.find(r => r.fromTableId === table.id && r.fromFieldId === field?.id);
            const isFK = !!rel;
            const showLink = isFK && rawVal;

            let inputType = "text";
            let inputValue: any = rawVal;
            
            if (field?.type === 'INTEGER' || field?.type === 'DECIMAL' || field?.type === 'REAL') {
                inputType = "number";
            } else if (field?.type === 'DATE') {
                inputType = "date";
                if (rawVal) {
                    const d = new Date(rawVal);
                    if (!isNaN(d.getTime())) {
                        inputValue = d.toISOString().split('T')[0];
                    }
                }
            } else if (field?.type === 'TIME') {
                inputType = "time";
                if (typeof rawVal === 'string' && rawVal.length > 5) {
                    inputValue = rawVal.substring(0, 5);
                }
            } else if (field?.type === 'DATETIME' || field?.type === 'TIMESTAMP') {
                inputType = "datetime-local";
                if (rawVal) {
                    const d = new Date(rawVal);
                    if (!isNaN(d.getTime())) {
                        inputValue = d.toISOString().slice(0, 16);
                    }
                }
            } else if (field?.type === 'BOOLEAN') {
                inputType = "checkbox";
                inputValue = Boolean(rawVal) && String(rawVal).toLowerCase() !== 'false' && String(rawVal) !== '0';
            } else if (field?.type === 'ENUM') {
                inputType = "enum";
                inputValue = rawVal !== undefined && rawVal !== null ? String(rawVal) : '';
            }

            return (
                <div key={`${rowIndex}-${header}-${colIdx}`} className={`w-40 shrink-0 border-r border-slate-100 h-full relative ${isAutoInc ? 'bg-slate-50' : isCalculated ? 'bg-amber-50/50' : ''} flex items-center`}>
                    {inputType === 'checkbox' ? (
                        <div className="flex-1 flex items-center justify-center">
                            <input
                                type="checkbox"
                                checked={inputValue as boolean}
                                onChange={(e) => { handleDataChange(row, header, e.target.checked) }}
                                onFocus={() => setActiveColumn(header)}
                                disabled={isAutoInc || isCalculated}
                                className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500"
                            />
                        </div>
                    ) : inputType === 'enum' ? (
                        <select
                            value={inputValue as string}
                            onChange={(e) => { handleDataChange(row, header, e.target.value) }}
                            onFocus={() => setActiveColumn(header)}
                            disabled={isAutoInc || isCalculated}
                            className={`flex-1 h-full px-2 w-full bg-transparent focus:bg-white focus:outline-none focus:ring-1 focus:ring-inset focus:ring-indigo-500 text-xs font-medium text-slate-800 ${isCalculated ? 'cursor-default font-semibold text-amber-900' : ''} ${showLink ? 'pr-8' : ''}`}
                        >
                            <option value="">(Leer)</option>
                            {(field?.enumValues || []).map((enumVal, eIdx) => (
                                <option key={eIdx} value={enumVal}>{enumVal}</option>
                            ))}
                            {/* If current value is not in enum list, preserve it */}
                            {inputValue && !(field?.enumValues || []).includes(inputValue as string) && (
                                <option value={inputValue as string}>{inputValue as string} (Benutzerdefiniert)</option>
                            )}
                        </select>
                    ) : (
                        <input
                            type={inputType}
                            value={inputValue as string} 
                            title={isCalculated ? `⚡ Berechnet: ${field?.calculationFormula} = ${String(rawVal)}` : String(rawVal)} 
                            onChange={(e) => { handleDataChange(row, header, e.target.value) }}
                            onFocus={() => setActiveColumn(header)}
                            readOnly={isAutoInc || isCalculated}
                            className={`flex-1 h-full px-2 w-full bg-transparent focus:bg-white focus:outline-none focus:ring-1 focus:ring-inset focus:ring-blue-500 ${isAutoInc ? 'cursor-not-allowed italic text-slate-400' : isCalculated ? 'cursor-default font-semibold text-amber-900 font-mono text-xs' : ''} ${showLink ? 'pr-8' : ''}`}
                        />
                    )}
                    {showLink && (
                        <button 
                            onClick={() => setDetailView({ targetTableId: rel.toTableId, recordId: rawVal })}
                            className="absolute right-1 top-1 bottom-1 p-1 text-blue-400 hover:text-blue-700 hover:bg-blue-100 rounded transition-colors flex items-center justify-center"
                            title="Datensatz anzeigen"
                        >
                            <ExternalLink size={12} />
                        </button>
                    )}
                </div>
            )
          })}
          <div className="w-10 shrink-0 flex justify-center">
              <button onClick={() => deleteRow(row)} className="text-slate-300 hover:text-red-600 opacity-0 group-hover:opacity-100 transition-opacity">
                <Trash2 size={14} />
              </button>
          </div>
      </div>
      );
  };

  const targetTable = detailView ? allTables.find(t => t.id === detailView.targetTableId) : null;

  return (
    <div className="p-4 sm:p-8 bg-slate-50 h-full overflow-hidden flex flex-col">
      <div className="max-w-full mx-auto bg-white shadow-lg border border-slate-200 rounded-lg overflow-hidden flex flex-col h-full w-full">
        <div className="bg-slate-800 text-white px-6 py-4 flex justify-between items-center shrink-0">
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold">Datenblatt: {table.name}</h2>
                <div className="flex items-center gap-1 ml-4 bg-slate-700 rounded p-1">
                    <button onClick={() => setViewMode('list')} className={`p-1.5 rounded transition-colors ${viewMode === 'list' ? 'bg-white text-slate-800' : 'text-slate-400 hover:text-white'}`} title="Liste">
                        <List size={16}/>
                    </button>
                    <button onClick={() => setViewMode('kanban')} className={`p-1.5 rounded transition-colors ${viewMode === 'kanban' ? 'bg-white text-slate-800' : 'text-slate-400 hover:text-white'}`} title="Kanban Board">
                        <Layout size={16}/>
                    </button>
                </div>

                {viewMode === 'list' && (
                    <div className="flex items-center gap-1 ml-4">
                        <button 
                          onClick={() => setShowAdvancedFilterModal(true)}
                          className={`flex items-center gap-1 px-3 py-1 rounded text-xs border transition-colors ${advancedRules.length > 0 || Object.keys(filters).length > 0 ? 'bg-indigo-600 border-indigo-400 text-white font-bold shadow-xs' : 'bg-slate-700 border-slate-600 hover:bg-slate-600 text-slate-300'}`}
                          title="Erweiterten Filter & Kriterien-Dialog öffnen"
                        >
                            <SlidersHorizontal size={14} /> Filtern & Kriterien {advancedRules.length > 0 ? `(${advancedRules.length})` : Object.keys(filters).length > 0 ? `(${Object.keys(filters).length})` : ''}
                        </button>

                        {advancedRules.length > 0 && (
                            <div className="flex items-center gap-1.5 bg-indigo-700 text-white text-xs px-2.5 py-1 rounded border border-indigo-400 font-semibold animate-in fade-in-25">
                                <SlidersHorizontal size={13} />
                                <span>Erweitert ({advancedRules.length} Regeln - {matchMode})</span>
                                <button onClick={() => setAdvancedRules([])} className="ml-1 hover:text-indigo-200 transition-colors" title="Erweiterten Filter zurücksetzen">
                                    <X size={12}/>
                                </button>
                            </div>
                        )}

                        {sortColumn && sortDirection && (
                            <div className="flex items-center gap-1.5 bg-indigo-600/90 text-white text-xs px-2.5 py-1 rounded border border-indigo-400 font-semibold animate-in fade-in-25">
                                <ArrowUpDown size={13} />
                                <span>{sortColumn} ({sortDirection === 'asc' ? '▲ Aufsteigend' : '▼ Absteigend'})</span>
                                <button onClick={clearSort} className="ml-1 hover:text-indigo-200 transition-colors" title="Sortierung zurücksetzen">
                                    <X size={12}/>
                                </button>
                            </div>
                        )}

                        {table.apiConfig && (
                          <div className="flex items-center bg-slate-700 rounded ml-2 p-1">
                              {queryParams.length > 0 && (
                                  <button 
                                      onClick={() => setShowParams(!showParams)}
                                      className={`p-1 px-2 rounded text-xs flex items-center gap-1 ${showParams ? 'bg-slate-600 text-white' : 'text-slate-300 hover:text-white'}`}
                                      title="API Parameter"
                                  >
                                      <Sliders size={14} /> {queryParams.length}
                                  </button>
                              )}
                              <button 
                                  onClick={handleApiRefresh} 
                                  disabled={isRefreshing}
                                  className={`flex items-center gap-1 hover:bg-blue-500 text-white px-3 py-1 rounded text-xs ml-1 disabled:opacity-50 ${isRefreshing ? 'bg-blue-500' : 'bg-blue-600'}`}
                              >
                                  {isRefreshing ? <Loader2 size={14} className="animate-spin"/> : <RefreshCw size={14} />}
                                  {isRefreshing ? 'Lädt...' : 'Refresh'}
                              </button>
                          </div>
                        )}
                    </div>
                )}
            </div>
            {table.description && (
                <div className="text-slate-400 text-xs italic">{table.description}</div>
            )}
          </div>
          <div className="flex gap-2">
            <input type="file" accept=".csv" ref={fileInputRef} style={{ display: 'none' }} onChange={handleImportCSV} />
            <button onClick={() => fileInputRef.current?.click()} className="flex items-center gap-1 bg-slate-700 hover:bg-slate-600 px-3 py-1 rounded text-sm border border-slate-600">
              <Upload size={16} /> CSV
            </button>
            <button onClick={addRow} className="flex items-center gap-1 bg-green-600 hover:bg-green-50 px-3 py-1 rounded text-sm font-semibold">
              <Plus size={16} /> Neu
            </button>
          </div>
        </div>

        {/* API Parameters Toolbar */}
        {showParams && queryParams.length > 0 && viewMode === 'list' && (
            <div className="bg-slate-100 border-b border-slate-200 p-2 flex flex-wrap gap-4 items-center animate-in slide-in-from-top-1">
                <span className="text-xs font-bold text-slate-500 uppercase">API Parameter:</span>
                {queryParams.map(p => (
                    <div key={p.id} className="flex items-center gap-1">
                        <label className="text-xs font-semibold text-slate-700">{p.key}:</label>
                        {p.type === 'select' ? (
                            <select value={p.value} onChange={e => updateParamValue(p.id, e.target.value)} className="border border-slate-300 rounded text-xs py-1 px-2">
                                <option value="">(Alle/Keine)</option>
                                {p.options?.map(opt => <option key={opt} value={opt.trim()}>{opt.trim()}</option>)}
                            </select>
                        ) : (
                            <input type="text" value={p.value} onChange={e => updateParamValue(p.id, e.target.value)} className="border border-slate-300 rounded text-xs py-1 px-2 w-24" />
                        )}
                    </div>
                ))}
            </div>
        )}

        {/* DATA FILTER BAR */}
        {showFilters && viewMode === 'list' && (
            <div className="bg-orange-50 border-b border-orange-200 p-2 flex overflow-x-auto gap-2 items-center animate-in slide-in-from-top-2 shadow-inner shrink-0">
                <div className="flex items-center gap-2 pr-4 border-r border-orange-200 mr-2">
                    <span className="text-xs font-bold text-orange-800 uppercase flex items-center gap-1"><Filter size={12}/> Filter</span>
                    <button onClick={clearFilters} className="text-orange-600 hover:text-orange-800 text-xs underline">Alle löschen</button>
                </div>
                {headers.map((h, colIdx) => {
                    const stats = columnStats[h];
                    const hasFilter = !!filters[h];
                    const field = table.fields.find(f => f.name === h);
                    const isDate = field?.type === 'DATE' || field?.type === 'TIME' || field?.type === 'DATETIME' || field?.type === 'TIMESTAMP';
                    return (
                        <div key={`${h}-${colIdx}`} className={`flex flex-col min-w-[120px] max-w-[200px] ${hasFilter ? 'bg-white rounded shadow-sm' : ''} p-1`}>
                            <label className="text-[10px] font-bold text-orange-700 mb-0.5 truncate px-1">{h}</label>
                            {stats?.isLowCardinality && !isDate ? (
                                <select value={filters[h] || ''} onChange={e => setFilter(h, e.target.value)} className={`w-full border rounded px-1 py-0.5 text-xs outline-none ${hasFilter ? 'border-orange-400 bg-orange-50' : 'border-orange-200 bg-white'}`}>
                                    <option value="">(Alle)</option>
                                    {stats.uniqueValues.map((val, valIdx) => <option key={`${val}-${valIdx}`} value={val}>{val}</option>)}
                                </select>
                            ) : (
                                <div className="relative">
                                    <input type="text" value={filters[h] || ''} onChange={e => setFilter(h, e.target.value)} placeholder={isDate ? "z.B. 2024-01-01" : "Suchen..."} className={`w-full border rounded px-1 py-0.5 text-xs outline-none pr-4 ${hasFilter ? 'border-orange-400 bg-orange-50' : 'border-orange-200'}`} />
                                    {filters[h] && <button onClick={() => setFilter(h, '')} className="absolute right-1 top-0.5 text-orange-400 hover:text-orange-600"><X size={10}/></button>}
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        )}

        <div className="overflow-hidden flex-1 relative bg-slate-50">
          {isRefreshing && (
              <div className="absolute inset-0 bg-white/50 z-20 flex items-center justify-center backdrop-blur-sm">
                  <div className="bg-white p-4 rounded shadow-lg flex items-center gap-3 border border-slate-200">
                      <Loader2 className="animate-spin text-blue-600" size={24} />
                      <span className="text-sm font-semibold text-slate-700">Lade Live-Daten...</span>
                  </div>
              </div>
          )}
          
          {viewMode === 'kanban' ? (
              <KanbanBoard table={table} onUpdateRow={handleDataChange} />
          ) : (
              headers.length > 0 ? (
                  <VirtualTable 
                      data={filteredData} 
                      headers={headers} 
                      headerTooltips={headerTooltips} 
                      renderRow={renderRow} 
                      rowHeight={35} 
                      enableRowReorder={true}
                      sortColumn={sortColumn}
                      sortDirection={sortDirection}
                      onSort={handleSort}
                      activeColumn={activeColumn}
                      onSelectColumn={setActiveColumn}
                  />
              ) : (
                 <div className="p-6 text-center text-slate-500"><p>Die Tabelle "{table.name}" enthält keine Daten.</p></div>
              )
          )}
        </div>
        <div className="bg-slate-50 border-t border-slate-200 p-2 text-xs text-slate-500 text-right flex justify-between shrink-0">
           <span>{Object.keys(filters).length > 0 ? `${filteredData.length} gefiltert von ${rawData.length}` : `${rawData.length} Datensätze`}</span>
           <span>{table.apiConfig?.refreshOnLoad ? '(Live API)' : '(Lokal)'}</span>
        </div>
      </div>

      {detailView && targetTable && (
          <RecordDetailModal table={targetTable} recordId={detailView.recordId} onClose={() => setDetailView(null)} />
      )}

      {pendingReorder && (
          <div className="fixed inset-0 bg-slate-900/60 z-50 flex items-center justify-center backdrop-blur-sm animate-in fade-in-30">
              <div className="bg-white rounded-2xl shadow-xl border border-slate-200 w-full max-w-lg overflow-hidden flex flex-col" onClick={e => e.stopPropagation()}>
                  {/* Header */}
                  <div className="bg-indigo-600 text-white p-5 flex items-center gap-3">
                      <div className="p-2.5 bg-white/10 rounded-xl">
                          <ArrowUpDown size={20} className="text-white" />
                      </div>
                      <div>
                          <h3 className="text-base font-bold">Reihenfolge aktualisieren</h3>
                          <p className="text-xs text-indigo-100 mt-0.5">Zeilen-Verschiebung im Datenblatt</p>
                      </div>
                  </div>

                  {/* Body */}
                  <div className="p-6 space-y-5">
                      <p className="text-sm text-slate-600 leading-relaxed">
                          Du hast Zeile <span className="font-bold text-slate-800">#{pendingReorder.srcIdx + 1}</span> an die Position <span className="font-bold text-slate-800">#{pendingReorder.targetIdx + 1}</span> verschoben. Wie soll die Datenbank diesen Positionswechsel abspeichern?
                      </p>

                      {/* Step 1: Select or Create sorting column */}
                      <div className="space-y-2">
                          <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block">1. Sortier-Spalte auswählen</label>
                          
                          {table.fields.filter(f => f.type === 'INTEGER' || f.type === 'DECIMAL' || f.type === 'REAL').length === 0 ? (
                              <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-700 space-y-2">
                                  <div className="font-semibold flex items-center gap-1.5">
                                      <HelpCircle size={14} /> Keine numerische Spalte vorhanden
                                  </div>
                                  <p>Es gibt aktuell keine Zahlenspalte (z. B. SortOrder, Nr) für die Sortierung.</p>
                                  <button 
                                      type="button"
                                      onClick={createNewSortOrderField}
                                      className="w-full bg-amber-600 hover:bg-amber-700 text-white font-bold py-1.5 px-3 rounded-lg transition-colors shadow-xs"
                                  >
                                      + Neue Spalte 'SortOrder' automatisch anlegen
                                  </button>
                              </div>
                          ) : (
                              <div className="flex gap-2 items-center">
                                  <select 
                                      value={selectedSortField} 
                                      onChange={e => setSelectedSortField(e.target.value)}
                                      className="flex-1 border border-slate-200 rounded-xl px-3 py-2 text-sm bg-slate-50 focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                                  >
                                      <option value="">-- Keine Spalte aktualisieren (nur im Array schieben) --</option>
                                      {table.fields.filter(f => f.type === 'INTEGER' || f.type === 'DECIMAL' || f.type === 'REAL').map(f => (
                                          <option key={f.id} value={f.name}>{f.name} ({f.type})</option>
                                      ))}
                                  </select>
                                  <button 
                                      type="button" 
                                      onClick={createNewSortOrderField}
                                      className="px-3 py-2 text-xs font-semibold bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-700 rounded-xl transition-colors"
                                      title="Eine neue Sortier-Spalte erstellen"
                                  >
                                      + Neu
                                  </button>
                              </div>
                          )}
                      </div>

                      {/* Step 2: Select update method */}
                      {selectedSortField && (
                          <div className="space-y-2.5">
                              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block">2. Aktualisierungs-Verfahren</label>
                              
                              <div className="space-y-2">
                                  {/* Cascade Option */}
                                  <label className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-all ${reorderMethod === 'cascade' ? 'border-indigo-500 bg-indigo-50/50' : 'border-slate-200 hover:bg-slate-50'}`}>
                                      <input 
                                          type="radio" 
                                          name="reorder_method" 
                                          value="cascade" 
                                          checked={reorderMethod === 'cascade'}
                                          onChange={() => setReorderMethod('cascade')}
                                          className="mt-1 text-indigo-600 focus:ring-indigo-500"
                                      />
                                      <div>
                                          <span className="text-xs font-bold text-slate-800 block">Kaskadierende Neunummerierung (Empfohlen)</span>
                                          <span className="text-[10px] text-slate-500">Alle Zeilen werden fortlaufend durchnummeriert (1, 2, 3...), um die neue Reihenfolge sauber zu speichern.</span>
                                      </div>
                                  </label>

                                  {/* Swap Option */}
                                  <label className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-all ${reorderMethod === 'swap' ? 'border-indigo-500 bg-indigo-50/50' : 'border-slate-200 hover:bg-slate-50'}`}>
                                      <input 
                                          type="radio" 
                                          name="reorder_method" 
                                          value="swap" 
                                          checked={reorderMethod === 'swap'}
                                          onChange={() => setReorderMethod('swap')}
                                          className="mt-1 text-indigo-600 focus:ring-indigo-500"
                                      />
                                      <div>
                                          <span className="text-xs font-bold text-slate-800 block">Werte tauschen (Swap)</span>
                                          <span className="text-[10px] text-slate-500">Tauscht lediglich den Sortier-Wert der verschobenen Zeile mit dem der Zielzeile aus.</span>
                                      </div>
                                  </label>

                                  {/* Only This Option */}
                                  <label className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-all ${reorderMethod === 'only_this' ? 'border-indigo-500 bg-indigo-50/50' : 'border-slate-200 hover:bg-slate-50'}`}>
                                      <input 
                                          type="radio" 
                                          name="reorder_method" 
                                          value="only_this" 
                                          checked={reorderMethod === 'only_this'}
                                          onChange={() => setReorderMethod('only_this')}
                                          className="mt-1 text-indigo-600 focus:ring-indigo-500"
                                      />
                                      <div>
                                          <span className="text-xs font-bold text-slate-800 block">Nur verschobene Zeile updaten</span>
                                          <span className="text-[10px] text-slate-500">Setzt nur den Sortier-Wert der verschobenen Zeile auf den Wert der Ziel-Zeile.</span>
                                      </div>
                                  </label>
                              </div>
                          </div>
                      )}

                      {/* Step 3: Keep option */}
                      <div className="pt-2 border-t border-slate-100 flex items-center gap-2">
                          <input 
                              type="checkbox" 
                              id="remember_reorder" 
                              checked={rememberReorderRule}
                              onChange={e => setRememberReorderRule(e.target.checked)}
                              className="w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500"
                          />
                          <label htmlFor="remember_reorder" className="text-xs text-slate-600 font-medium select-none cursor-pointer">
                              Diese Auswahl als Standard-Regel für diese Tabelle merken (Zukünftige Drags erfolgen automatisch)
                          </label>
                      </div>
                  </div>

                  {/* Footer */}
                  <div className="bg-slate-50 px-6 py-4 flex justify-between items-center border-t border-slate-100 shrink-0">
                      {localStorage.getItem(`table_reorder_rule_${table.id}`) && (
                          <button 
                              type="button" 
                              onClick={() => {
                                  localStorage.removeItem(`table_reorder_rule_${table.id}`);
                                  alert("Gespeicherte Regel gelöscht.");
                              }}
                              className="text-xs text-red-600 hover:text-red-800 underline font-medium"
                          >
                              Regel zurücksetzen
                          </button>
                      )}
                      <div className="flex gap-2 ml-auto">
                          <button 
                              type="button" 
                              onClick={() => setPendingReorder(null)} 
                              className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 text-sm font-semibold rounded-xl transition-colors"
                          >
                              Abbrechen
                          </button>
                          <button 
                              type="button" 
                              onClick={() => executeReorder(pendingReorder.srcIdx, pendingReorder.targetIdx, selectedSortField, selectedSortField ? reorderMethod : 'cascade')} 
                              className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-xl transition-colors shadow-sm"
                          >
                              Speichern & Anwenden
                          </button>
                      </div>
                  </div>
              </div>
          </div>
      )}

      {showAdvancedFilterModal && (
        <AdvancedFilterModal
          fields={table.fields}
          totalRecordsCount={rawData.length}
          filteredRecordsCount={filteredData.length}
          rules={advancedRules}
          matchMode={matchMode}
          onApply={(rules, mode) => {
            setAdvancedRules(rules);
            setMatchMode(mode);
            setShowAdvancedFilterModal(false);
          }}
          onClose={() => setShowAdvancedFilterModal(false)}
          onReset={() => {
            setAdvancedRules([]);
            setMatchMode('AND');
          }}
        />
      )}

      {showCascadeDeleteModal && recordForDelete && (
        <CascadeDeleteModal
          parentTable={table}
          recordToDelete={recordForDelete}
          allTables={allTables}
          relationships={relationships}
          onConfirmDelete={handleCascadeDeleteConfirm}
          onClose={() => {
            setShowCascadeDeleteModal(false);
            setRecordForDelete(null);
          }}
        />
      )}
    </div>
  );
};
