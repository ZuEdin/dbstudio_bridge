import { Table, Form, VirtualFile } from '../../../../types/index';
import { toCamelCase, toPascalCase } from '../../common';

export const generateListPage = (table: Table, forms: Form[], tables: Table[], root: string): VirtualFile => {
  const pascalName = toPascalCase(table.name);
  const camelName = toCamelCase(table.name);
  const listName = `${pascalName}List`;
  const pk = toCamelCase(table.fields.find(f => f.isPrimaryKey)?.name || 'id');
  
  const customForm = forms.find(f => f.sourceId === table.id && f.sourceType === 'table');
  const createLink = customForm ? `/forms/${toPascalCase(customForm.name).toLowerCase()}Form/new` : `/${camelName}/new`;
  const editLinkPrefix = customForm ? `/forms/${toPascalCase(customForm.name).toLowerCase()}Form/` : `/${camelName}/`;

  const lookups: any[] = [];
  if (customForm && customForm.layout) {
      const extractLookups = (node: any) => {
          if (node.type === 'field' && node.widgetType === 'select' && node.lookup) {
              const tableField = table.fields.find(f => f.id === node.fieldId);
              if (tableField) {
                  const lookupTable = tables.find(t => t.id === node.lookup.tableId);
                  const displayField = lookupTable?.fields.find(f => f.id === node.lookup.labelFields?.[0]);
                  if (lookupTable && displayField) {
                      lookups.push({
                          fieldName: toCamelCase(tableField.name),
                          lookupTableName: toCamelCase(lookupTable.name),
                          displayFieldName: toCamelCase(displayField.name),
                          lookupStateName: `lookup_${toCamelCase(tableField.name)}`
                      });
                  }
              }
          }
          if (node.children) {
              node.children.forEach(extractLookups);
          }
      };
      extractLookups(customForm.layout);
  }


  const fmtRules = (table.conditionalFormatting || []).map(r => {
      const f = table.fields.find(fi => fi.id === r.fieldId);
      return { ...r, propName: f ? toCamelCase(f.name) : '' };
  });

  const content = `import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ${pascalName} } from '../../types';
import { get, remove } from '../../services/api';
import { Trash2, Plus, Edit, Search, ChevronLeft, ChevronRight, ArrowUpDown, ArrowUp, ArrowDown, Filter, X, Eye } from 'lucide-react';
import { MarkdownViewer } from '../../components/common/MarkdownViewer';

export const ${listName} = () => {
  const [data, setData] = useState<{ data: ${pascalName}[], total: number, page: number, totalPages: number }>({ data: [], total: 0, page: 1, totalPages: 1 });
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [deleteId, setDeleteId] = useState<any | null>(null);
  const [massDeleteOpen, setMassDeleteOpen] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  // Double-click Detail modal and single-select keyboard selection states
  const [activeRecord, setActiveRecord] = useState<${pascalName} | null>(null);
  
  const [showDetail, setShowDetail] = useState(false);
  const [detailRecord, setDetailRecord] = useState<${pascalName} | null>(null);
  ${lookups.map(l => `const [${l.lookupStateName}, set_${l.lookupStateName}] = useState<any[]>([]);`).join('\n  ')}


  // Sorting & Filtering states
  const [columnFilters, setColumnFilters] = useState<Record<string, string>>({});
  const [showFilterBar, setShowFilterBar] = useState(false);
  const [sortField, setSortField] = useState<string | null>(null);
  const [sortDir, setSortDir] = useState<'asc' | 'desc' | null>(null);

  useEffect(() => { setPage(1); }, [searchTerm]);
  useEffect(() => { loadItems(); }, [searchTerm, page]);

  // Global keydown listener for Enter key triggers
  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Enter' && activeRecord) {
        e.preventDefault();
        setDetailRecord(activeRecord);
        setShowDetail(true);
      }
    };
    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, [activeRecord]);

  const loadItems = async () => {
    try {
      setLoading(true);
      const params: any = { page: page, pageSize: 20 };
      if (searchTerm && searchTerm.trim()) {
        params.search = searchTerm.trim();
      }
      const res = await get<${pascalName}>('${pascalName}', params);
      setData(res as any);
    } finally { setLoading(false); }
  };

  const handleDelete = async (id: any) => {
    setDeleteId(id);
  };

  const confirmDelete = async () => {
    if (deleteId) {
      await remove(\`${pascalName}/\${deleteId}\`);
      setDeleteId(null);
      loadItems();
    }
  };

  const getRowStyle = (item: any) => {
      const rules: any[] = ${JSON.stringify(fmtRules)};
      for(const r of rules) {
          if(!r.propName) continue;
          const val = String(item[r.propName]);
          if(r.operator === 'eq' && val === r.value) return r.style;
          if(r.operator === 'neq' && val !== r.value) return r.style;
          if(r.operator === 'contains' && val.includes(r.value)) return r.style;
          if(r.operator === 'gt' && Number(val) > Number(r.value)) return r.style;
          if(r.operator === 'lt' && Number(val) < Number(r.value)) return r.style;
      }
      return {};
  };

  const handleMassDelete = async () => {
      if(selectedIds.length === 0) return;
      setMassDeleteOpen(true);
  };
  
  const confirmMassDelete = async () => {
      for(const id of selectedIds) {
          await remove('${pascalName}/' + id);
      }
      setSelectedIds([]);
      setMassDeleteOpen(false);
      loadItems();
  };

  const handleSort = (field: string) => {
    if (sortField === field) {
      if (sortDir === 'asc') setSortDir('desc');
      else if (sortDir === 'desc') {
        setSortField(null);
        setSortDir(null);
      }
    } else {
      setSortField(field);
      setSortDir('asc');
    }
  };

  // Memoized local processing of items (local filtering and sorting)
  const processedItems = React.useMemo(() => {
    let items = [...data.data];
    
    // Apply column filters
    Object.keys(columnFilters).forEach(key => {
      const filterVal = columnFilters[key].toLowerCase().trim();
      if (filterVal) {
        const searchTerms = filterVal.split(/\\s+/).filter(Boolean);
        items = items.filter(item => {
          const val = item[key as keyof ${pascalName}];
          if (val === undefined || val === null) return false;
          const cellStr = String(val).toLowerCase();
          return searchTerms.every(term => cellStr.includes(term));
        });
      }
    });

    // Apply sorting
    if (sortField && sortDir) {
      items.sort((a, b) => {
        const valA = a[sortField as keyof ${pascalName}];
        const valB = b[sortField as keyof ${pascalName}];
        if (valA === undefined || valA === null) return 1;
        if (valB === undefined || valB === null) return -1;
        
        let comparison = 0;
        if (typeof valA === 'number' && typeof valB === 'number') {
          comparison = valA - valB;
        } else if (typeof valA === 'boolean' && typeof valB === 'boolean') {
          comparison = (valA ? 1 : 0) - (valB ? 1 : 0);
        } else {
          comparison = String(valA).localeCompare(String(valB));
        }
        return sortDir === 'asc' ? comparison : -comparison;
      });
    }

    return items;
  }, [data.data, columnFilters, sortField, sortDir]);

  return (
    <div className="p-8 max-w-[95%] mx-auto">
      <div className="flex flex-col sm:flex-row justify-between items-center mb-8 gap-4">
          <h1 className="text-3xl font-bold dark:text-white flex items-center gap-2">${table.name}</h1>
          <div className="flex gap-4 w-full sm:w-auto">
              ${table.enableMassUpdates ? `
              {selectedIds.length > 0 && (
                  <button onClick={handleMassDelete} className="bg-red-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-red-700 transition">
                      <Trash2 size={18}/> <span>{selectedIds.length} löschen</span>
                  </button>
              )}` : ''}
              
              <button 
                  onClick={() => setShowFilterBar(prev => !prev)} 
                  className={\`p-2 border rounded-lg flex items-center gap-2 hover:bg-slate-100 dark:hover:bg-slate-700 transition \${showFilterBar ? 'bg-blue-50 border-blue-300 text-blue-600 dark:bg-blue-900/20 dark:border-blue-800 dark:text-blue-400' : 'bg-white dark:bg-slate-800 dark:border-slate-700 dark:text-white'}\`}
                  title="Spaltenfilter anzeigen/ausblenden"
              >
                  <Filter size={18}/>
                  <span className="hidden sm:inline">Filter</span>
              </button>

              <div className="relative flex-1 sm:flex-initial">
                  <Search className="absolute left-3 top-2.5 text-slate-400" size={18} />
                  <input 
                    type="text" 
                    placeholder="Suchen..." 
                    className="pl-10 pr-4 py-2 border rounded-lg w-full bg-white dark:bg-slate-800 dark:border-slate-700 dark:text-white"
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                  />
              </div>
              <Link to="${createLink}" className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-blue-700 transition-colors shadow-sm whitespace-nowrap">
                <Plus size={18}/> <span className="hidden sm:inline">Neu anlegen</span>
              </Link>
          </div>
      </div>
      
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm overflow-hidden border border-slate-200 dark:border-slate-700 flex flex-col">
        <div className="overflow-x-auto">
            <table className="w-full text-left">
                <thead className="bg-slate-50 dark:bg-slate-900 border-b dark:border-slate-700 text-slate-500 uppercase text-xs font-semibold">
                    <tr>
                        ${table.enableMassUpdates ? `<th className="p-4 w-12"><input type="checkbox" onChange={(e) => { const ids = e.target.checked ? data.data.map(i => i.${pk}) : []; setSelectedIds(ids); }} /></th>` : ''}
                        <th className="p-4 w-12 text-center text-slate-400" title="Datensatz auswählen (Enter für Details)">Auswahl</th>
                        ${table.fields.map(f => `
                        <th className="p-4 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors" onClick={() => handleSort('${toCamelCase(f.name)}')}>
                            <div className="flex items-center gap-1.5 select-none">
                                <span>${f.name}</span>
                                {sortField === '${toCamelCase(f.name)}' ? (
                                    sortDir === 'asc' ? <ArrowUp size={14} className="text-blue-500 shrink-0" /> : <ArrowDown size={14} className="text-blue-500 shrink-0" />
                                ) : (
                                    <ArrowUpDown size={14} className="text-slate-300 dark:text-slate-600 shrink-0" />
                                )}
                            </div>
                        </th>`).join('')}
                        <th className="p-4 text-right">Aktionen</th>
                    </tr>
                    {showFilterBar && (
                        <tr className="bg-slate-100/50 dark:bg-slate-900/50 border-b dark:border-slate-700">
                            ${table.enableMassUpdates ? `<th className="p-2"></th>` : ''}
                            <th className="p-2"></th>
                            ${table.fields.map(f => `
                            <th className="p-2">
                                <input 
                                    type="text"
                                    placeholder="Filtern..."
                                    className="w-full px-2 py-1 text-xs font-normal border rounded bg-white dark:bg-slate-800 dark:border-slate-700 dark:text-white"
                                    value={columnFilters['${toCamelCase(f.name)}'] || ''}
                                    onChange={e => setColumnFilters({ ...columnFilters, '${toCamelCase(f.name)}': e.target.value })}
                                />
                            </th>`).join('')}
                            <th className="p-2 text-right">
                                {Object.keys(columnFilters).length > 0 && (
                                    <button onClick={() => setColumnFilters({})} className="text-red-500 hover:text-red-700 text-xs font-semibold flex items-center justify-end gap-1 ml-auto">
                                        <X size={12}/> Löschen
                                    </button>
                                )}
                            </th>
                        </tr>
                    )}
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                    {processedItems.length > 0 ? processedItems.map(i => (
                        <tr 
                            key={i.${pk}} 
                            className={\`hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors cursor-pointer \${activeRecord?.${pk} === i.${pk} ? 'bg-blue-50/70 dark:bg-blue-900/20' : ''}\`}
                            style={getRowStyle(i)}
                            onClick={() => setActiveRecord(i)}
                            onDoubleClick={() => { setDetailRecord(i); setShowDetail(true); }}
                            title="Doppelklick für Details, Einfacher Klick zur Auswahl (Enter für Details)"
                        >
                            ${table.enableMassUpdates ? `<td className="p-4" onClick={(e) => e.stopPropagation()}><input type="checkbox" checked={selectedIds.includes(i.${pk} as string)} onChange={(e) => { if(e.target.checked) setSelectedIds([...selectedIds, i.${pk} as string]); else setSelectedIds(selectedIds.filter(id => id !== i.${pk})); }} /></td>` : ''}
                            <td className="p-4 text-center" onClick={(e) => e.stopPropagation()}>
                                <input 
                                    type="checkbox" 
                                    checked={activeRecord?.${pk} === i.${pk}} 
                                    onChange={() => setActiveRecord(activeRecord?.${pk} === i.${pk} ? null : i)}
                                    className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 border-slate-300 dark:border-slate-600 dark:bg-slate-700"
                                />
                            </td>
                            ${table.fields.map(f => {
                                const fieldCamel = toCamelCase(f.name);
                                let val = `i.${fieldCamel}`;
                                
                                const lookup = lookups.find(l => l.fieldName === fieldCamel);
                                if (lookup) {
                                    val = `(() => { const m = ${lookup.lookupStateName}.find(r => String(r.id || r.Id) === String(${val})); if (m) { const disp = '${lookup.displayFieldName}'; return m[disp] !== undefined ? m[disp] : (m[disp.toLowerCase()] !== undefined ? m[disp.toLowerCase()] : m[disp.charAt(0).toUpperCase() + disp.slice(1)] || ${val}); } return ${val}; })()`;
                                }

                                if (f.rendererType === 'progress') {
                                    return `<td className="p-4"><div className="w-full bg-slate-200 rounded-full h-2.5 dark:bg-slate-700"><div className="bg-blue-600 h-2.5 rounded-full" style={{ width: \`\${Math.min(100, Math.max(0, Number(${val}))) }\%\` }}></div></div></td>`;
                                }
                                if (f.rendererType === 'status_pill') {
                                    return `<td className="p-4 text-sm"><span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200">{String(${val} ?? '')}</span></td>`;
                                }
                                if (f.rendererType === 'avatar') {
                                    return `<td className="p-4 text-sm flex items-center gap-2"><div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold">{String(${val} ?? '-').charAt(0).toUpperCase()}</div><span>{String(${val} ?? '')}</span></td>`;
                                }
                                if (f.rendererType === 'currency') {
                                    return `<td className="p-4 text-sm text-slate-700 dark:text-slate-300 font-mono">€ {Number(${val} || 0).toFixed(2)}</td>`;
                                }
                                return `<td className="p-4 text-sm text-slate-700 dark:text-slate-300 whitespace-nowrap">{String(${val} ?? '')}</td>`;
                            }).join('')}
                            <td className="p-4 text-right" onClick={(e) => e.stopPropagation()}>
                                <div className="flex justify-end gap-2">
                                    <button onClick={() => { setDetailRecord(i); setShowDetail(true); }} className="p-2 text-slate-600 hover:bg-slate-50 rounded dark:hover:bg-slate-700" title="Details"><Eye size={16}/></button>
                                    <Link to={'${editLinkPrefix}' + i.${pk}} className="p-2 text-blue-600 hover:bg-blue-50 rounded dark:hover:bg-slate-700" title="Bearbeiten"><Edit size={16}/></Link>
                                    <button onClick={()=>handleDelete(i.${pk})} className="p-2 text-red-600 hover:bg-red-50 rounded dark:hover:bg-slate-700" title="Löschen"><Trash2 size={16}/></button>
                                </div>
                            </td>
                        </tr>
                    )) : (
                        <tr><td colSpan={${table.fields.length + 2 + (table.enableMassUpdates ? 1 : 0)}} className="p-8 text-center text-slate-400 italic">Keine Einträge gefunden.</td></tr>
                    )}
                </tbody>
            </table>
        </div>
        <div className="p-4 border-t border-slate-100 dark:border-slate-700 flex items-center justify-between bg-slate-50 dark:bg-slate-900/50">
            <div className="text-sm text-slate-500 dark:text-slate-400">
                Seite <span className="font-bold">{data.page}</span> von <span className="font-bold">{data.totalPages}</span> ({data.total} Einträge)
            </div>
            <div className="flex gap-2">
                <button 
                    onClick={() => setPage(p => Math.max(1, p - 1))} 
                    disabled={data.page <= 1}
                    className="p-2 bg-white dark:bg-slate-800 border dark:border-slate-600 rounded disabled:opacity-50 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                >
                    <ChevronLeft size={16} />
                </button>
                <button 
                    onClick={() => setPage(p => Math.min(data.totalPages, p + 1))} 
                    disabled={data.page >= data.totalPages}
                    className="p-2 bg-white dark:bg-slate-800 border dark:border-slate-600 rounded disabled:opacity-50 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                >
                    <ChevronRight size={16} />
                </button>
            </div>
        </div>
      </div>

      {/* Double click / keyboard selection Detail View Modal */}
      {showDetail && detailRecord && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in" onClick={() => { setShowDetail(false); setDetailRecord(null); }}>
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-2xl max-w-2xl w-full border border-slate-200 dark:border-slate-700 overflow-hidden flex flex-col max-h-[85vh]" onClick={(e) => e.stopPropagation()}>
            {/* Modal Header */}
            <div className="p-6 border-b border-slate-100 dark:border-slate-700 flex items-center justify-between bg-slate-50 dark:bg-slate-900/50">
              <div>
                <h3 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <span>${table.name} Details</span>
                  <span className="text-sm font-normal text-slate-500 dark:text-slate-400">ID: {String(detailRecord.${pk})}</span>
                </h3>
              </div>
              <button 
                onClick={() => { setShowDetail(false); setDetailRecord(null); }}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
              >
                <X size={20} />
              </button>
            </div>
            
            {/* Modal Content */}
            <div className="p-6 overflow-y-auto space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                ${table.fields.map(f => {
                    const fieldCamel = toCamelCase(f.name);
                    const lookup = lookups.find(l => l.fieldName === fieldCamel);
                    let valAssignment = `let val: any = detailRecord.${fieldCamel};`;
                    if (lookup) {
                        valAssignment += `
                        const match = ${lookup.lookupStateName}.find(r => String(r.id || r.Id) === String(val));
                        if (match) {
                            const disp = '${lookup.displayFieldName}';
                            val = match[disp] !== undefined ? match[disp] : (match[disp.toLowerCase()] !== undefined ? match[disp.toLowerCase()] : match[disp.charAt(0).toUpperCase() + disp.slice(1)] || val);
                        }
                        `;
                    }
                    if (f.rendererType === 'markdown' || (f.type === 'TEXT' && f.comment?.toLowerCase().includes('markdown'))) {
                        return `
                        <div className="col-span-1 md:col-span-2 p-3 bg-slate-50 dark:bg-slate-900/40 rounded-lg border border-slate-100 dark:border-slate-700/50">
                          <div className="flex justify-between items-center mb-1.5">
                            <span className="block text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">${f.name}</span>
                            <span className="text-[10px] bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 font-bold px-2 py-0.5 rounded-full border border-indigo-200/60 font-mono">Markdown</span>
                          </div>
                          <div className="text-sm text-slate-800 dark:text-slate-200">
                            <MarkdownViewer content={String(detailRecord.${fieldCamel} || '')} />
                          </div>
                        </div>
                        `;
                    }
                    return `
                    <div className="p-3 bg-slate-50 dark:bg-slate-900/40 rounded-lg border border-slate-100 dark:border-slate-700/50">
                      <span className="block text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1">${f.name}</span>
                      <span className="text-sm text-slate-800 dark:text-slate-200 font-medium whitespace-pre-wrap break-all">
                        {(() => {
                            ${valAssignment}
                            return val === true ? '✅ Ja' : val === false ? '❌ Nein' : String(val ?? '-');
                        })()}
                      </span>
                    </div>
                    `;
                }).join('')}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-6 border-t border-slate-100 dark:border-slate-700 flex justify-end gap-3 bg-slate-50 dark:bg-slate-900/50">
              <Link 
                to={'${editLinkPrefix}' + detailRecord.${pk}} 
                onClick={() => { setShowDetail(false); setDetailRecord(null); }}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-blue-700 transition"
              >
                <Edit size={16} /> <span>Bearbeiten</span>
              </Link>
              <button 
                onClick={() => { setShowDetail(false); setDetailRecord(null); }}
                className="px-4 py-2 border border-slate-200 dark:border-slate-600 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-800"
              >
                Schließen
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteId && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-[2px]">
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-2xl border border-slate-200 dark:border-slate-700 max-w-md w-full overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="p-6">
              <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-2">Datensatz löschen</h3>
              <p className="text-sm text-slate-600 dark:text-slate-400">Sind Sie sicher, dass Sie diesen Datensatz unwiderruflich löschen möchten? Dieser Vorgang kann nicht rückgängig gemacht werden.</p>
            </div>
            <div className="p-4 bg-slate-50 dark:bg-slate-900/50 border-t border-slate-100 dark:border-slate-700 flex justify-end gap-3">
              <button 
                onClick={() => setDeleteId(null)}
                className="px-4 py-2 border border-slate-200 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition text-sm font-semibold"
              >
                Abbrechen
              </button>
              <button 
                onClick={confirmDelete}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-lg transition text-sm font-semibold shadow-sm"
              >
                Ja, löschen
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Mass Delete Confirmation Modal */}
      {massDeleteOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-[2px]">
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-2xl border border-slate-200 dark:border-slate-700 max-w-md w-full overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="p-6">
              <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-2">Mehrere Datensätze löschen</h3>
              <p className="text-sm text-slate-600 dark:text-slate-400">Sind Sie sicher, dass Sie {selectedIds.length} Datensätze unwiderruflich löschen möchten? Dieser Vorgang kann nicht rückgängig gemacht werden.</p>
            </div>
            <div className="p-4 bg-slate-50 dark:bg-slate-900/50 border-t border-slate-100 dark:border-slate-700 flex justify-end gap-3">
              <button 
                onClick={() => setMassDeleteOpen(false)}
                className="px-4 py-2 border border-slate-200 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition text-sm font-semibold"
              >
                Abbrechen
              </button>
              <button 
                onClick={confirmMassDelete}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-lg transition text-sm font-semibold shadow-sm"
              >
                Ausgewählte löschen
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};`;

  return { name: `${listName}.tsx`, path: `${root}/src/pages/${pascalName}/${listName}.tsx`, content, language: 'typescript' };
};
