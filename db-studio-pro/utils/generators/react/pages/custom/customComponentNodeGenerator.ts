import { GeneratorContext } from './types';
import { toCamelCase, toPascalCase } from '../../../common';

export const generateCustomComponentNode = (node: any, ctx: GeneratorContext): string => {
   const customComponents = ctx.customComponents || [];
   const tables = ctx.tables || [];
   const queries = ctx.queries || [];
   const forms = ctx.forms || [];
   const pages = ctx.pages || [];
   const states = ctx.states;
   const effects = ctx.effects;
   const imports = ctx.imports;

   const comp = (customComponents || []).find(c => c.id === node.props?.customComponentId);
   if (!comp) {
       return `<div className="p-3 bg-amber-50 text-amber-700 text-xs border border-amber-200 rounded italic text-center">Custom Component nicht verknüpft oder nicht gefunden</div>`;
   }
   
   const conf = comp.configuration || {};
   const idSuffix = node.id.replace(/-/g, '_');
   const stateName = `compData_${idSuffix}`;
   const loadingState = `compLoading_${idSuffix}`;
   
   const dsType = conf.dataSourceType || (conf.tableId ? 'table' : '');
   const dsId = conf.dataSourceId || conf.tableId;
   let fetchUrl = '';
   let tbl: any = null;
   if (dsType === 'table' && dsId) {
       const tObj = tables.find(t => t.id === dsId);
       if (tObj) {
           fetchUrl = `${toPascalCase(tObj.name)}`;
           tbl = tObj;
       }
   } else if (dsType === 'query' && dsId) {
       const qObj = queries.find(q => q.id === dsId);
       if (qObj) fetchUrl = `queries/${toCamelCase(qObj.name)}`;
   }
   
   if (fetchUrl) {
       states.push(`const [${stateName}, set_${stateName}] = useState<any[]>([]);`);
       states.push(`const [${loadingState}, set_${loadingState}] = useState(false);`);
       imports.add('get');
       imports.add('Loader2');
       effects.push(`
  useEffect(() => {
    const fetch_${stateName} = async () => {
      try {
        set_${loadingState}(true);
        const res = await get<any>('${fetchUrl}', { pageSize: ${conf.pageSize || 10000} });
        set_${stateName}(res.data || res || []);
      } catch (err) {
        console.error(err);
      } finally {
        set_${loadingState}(false);
      }
    };
    fetch_${stateName}();
  }, []);`);
   }

   if (comp.type === 'table_view') {
       const searchState = `search_${idSuffix}`;
       const selectedFiltersState = `selectedFilters_${idSuffix}`;
       const sortFieldState = `sortField_${idSuffix}`;
       const sortOrderState = `sortOrder_${idSuffix}`;
       
       states.push(`const [${searchState}, set_${searchState}] = useState('');`);
       states.push(`const [${selectedFiltersState}, set_${selectedFiltersState}] = useState<Record<string, string>>({});`);
       states.push(`const [${sortFieldState}, set_${sortFieldState}] = useState('${conf.defaultSortField || ''}');`);
       states.push(`const [${sortOrderState}, set_${sortOrderState}] = useState<'asc' | 'desc'>('${conf.defaultSortOrder || 'asc'}');`);
       
       const cols = conf.columns || [];
       const processedDataName = `processed_${idSuffix}`;
       states.push(`
  const ${processedDataName} = useMemo(() => {
    let items = [...${stateName}];
    if (${searchState}.trim()) {
      const q = ${searchState}.toLowerCase().trim();
      items = items.filter(row => Object.values(row).some(v => String(v).toLowerCase().includes(q)));
    }
    Object.entries(${selectedFiltersState}).forEach(([field, val]) => {
      if (val) {
        items = items.filter(row => String(row[field] || '') === val);
      }
    });
    if (${sortFieldState}) {
      items.sort((a, b) => {
        const valA = a[${sortFieldState}];
        const valB = b[${sortFieldState}];
        if (valA === undefined || valA === null) return 1;
        if (valB === undefined || valB === null) return -1;
        const res = typeof valA === 'number' && typeof valB === 'number' 
          ? valA - valB 
          : String(valA).localeCompare(String(valB));
        return ${sortOrderState} === 'asc' ? res : -res;
      });
    }
    return items;
  }, [${stateName}, ${searchState}, ${selectedFiltersState}, ${sortFieldState}, ${sortOrderState}]);`);

       let tableHeaderCols = '';
       let tableBodyCells = '';
       if (cols.length > 0) {
           tableHeaderCols = cols.map((col: any) => `
                                   <th className="px-6 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wider cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-700 select-none" onClick={() => {
                                       if (${sortFieldState} === '${col.field}') {
                                           set_${sortOrderState}(${sortOrderState} === 'asc' ? 'desc' : 'asc');
                                       } else {
                                           set_${sortFieldState}('${col.field}');
                                           set_${sortOrderState}('asc');
                                       }
                                   }}>
                                       <div className="flex items-center gap-1.5">
                                           <span>${col.title || col.field}</span>
                                       </div>
                                   </th>`).join('\\n');
           tableBodyCells = cols.map((col: any) => `
                                           <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-700 dark:text-slate-300">
                                               {String(row['${col.field}'] ?? '-')}
                                           </td>`).join('\\n');
       } else {
           tableHeaderCols = `<th className="px-6 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Daten</th>`;
           tableBodyCells = `<td className="px-6 py-4 text-sm text-slate-700 dark:text-slate-300">{JSON.stringify(row)}</td>`;
       }

       let filtersHtml = '';
       if (conf.enableFilters && conf.filterFields && conf.filterFields.length > 0) {
           filtersHtml = `
                   <div className="flex flex-wrap gap-4 items-center">
                       ${conf.filterFields.map((field: string) => {
                           const uniqueOptsState = `uniqueOpts_${idSuffix}_${field.replace(/[^a-zA-Z0-9]/g, '_')}`;
                           states.push(`
  const ${uniqueOptsState} = useMemo(() => {
    const vals = ${stateName}.map(r => String(r['${field}'] || '')).filter(Boolean);
    return Array.from(new Set(vals));
  }, [${stateName}]);`);
                           return `
                           <div key="${field}" className="flex flex-col gap-1 text-left min-w-[150px]">
                               <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">${field}</label>
                               <select 
                                   value={${selectedFiltersState}['${field}'] || ''}
                                   onChange={(e) => set_${selectedFiltersState}(prev => ({ ...prev, '${field}': e.target.value }))}
                                   className="border border-slate-200 dark:border-slate-700 rounded-lg px-2 py-1.5 text-xs bg-white dark:bg-slate-800"
                               >
                                   <option value="">Alle</option>
                                   {${uniqueOptsState}.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                               </select>
                           </div>`;
                       }).join('\\n')}
                   </div>`;
       }

       let searchHtml = '';
       if (conf.enableSearch) {
           searchHtml = `
                   <div className="relative max-w-xs">
                       <input 
                           type="text" 
                           placeholder="${conf.searchPlaceholder || 'Suchen...'}"
                           value={${searchState}}
                           onChange={(e) => set_${searchState}(e.target.value)}
                           className="px-4 py-1.5 w-full text-xs border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                       />
                   </div>`;
       }

       if (conf.layoutMode === 'grid') {
           return `
           <div className="space-y-4">
               <div className="flex flex-wrap justify-between items-center gap-4 border-b border-slate-100 dark:border-slate-700 pb-3">
                   <h3 className="text-base font-bold text-slate-800 dark:text-slate-100">${conf.title || comp.name}</h3>
                   <div className="flex items-center gap-4">
                       ${searchHtml}
                   </div>
               </div>
               ${filtersHtml}
               {${loadingState} ? (
                   <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-slate-400" /></div>
               ) : ${processedDataName}.length === 0 ? (
                   <div className="text-center py-12 text-sm text-slate-400 italic">Keine Einträge gefunden.</div>
               ) : (
                   <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                       {${processedDataName}.map((row, idx) => (
                           <div key={idx} className="bg-white dark:bg-slate-800 p-5 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm space-y-2 text-left">
                               ${cols.length > 0 ? cols.map((col: any, cIdx: number) => {
                                   if (cIdx === 0) {
                                       return `<h4 className="text-sm font-bold text-slate-800 dark:text-slate-100">{String(row['${col.field}'] ?? '-')}</h4>`;
                                   } else {
                                       return `
                                       <div className="flex justify-between text-xs border-b border-slate-50 dark:border-slate-700 pb-1">
                                           <span className="text-slate-400 font-semibold uppercase tracking-wider text-[10px]">${col.title || col.field}</span>
                                           <span className="text-slate-700 dark:text-slate-300 font-medium">{String(row['${col.field}'] ?? '-')}</span>
                                       </div>`;
                                   }
                               }).join('\\n') : `<div>{JSON.stringify(row)}</div>`}
                           </div>
                           );
                       })}
                   </div>
               )}
           </div>`;
       } else {
           return `
           <div className="space-y-4">
               <div className="flex flex-wrap justify-between items-center gap-4 border-b border-slate-100 dark:border-slate-700 pb-3">
                   <h3 className="text-base font-bold text-slate-800 dark:text-slate-100">${conf.title || comp.name}</h3>
                   <div className="flex items-center gap-4">
                       ${searchHtml}
                   </div>
               </div>
               ${filtersHtml}
               {${loadingState} ? (
                   <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-slate-400" /></div>
               ) : ${processedDataName}.length === 0 ? (
                   <div className="text-center py-12 text-sm text-slate-400 italic">Keine Einträge gefunden.</div>
               ) : (
                   <div className="border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden shadow-sm bg-white dark:bg-slate-800">
                       <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-700">
                           <thead className="bg-slate-50 dark:bg-slate-900/60">
                               <tr>
                                   ${tableHeaderCols}
                               </tr>
                           </thead>
                           <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                               {${processedDataName}.map((row, idx) => (
                                   <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-slate-700/50 transition">
                                       ${tableBodyCells}
                                   </tr>
                               ))}
                           </tbody>
                       </table>
                   </div>
               )}
           </div>`;
       }
   }

   if (comp.type === 'chart_view') {
       imports.add('ResponsiveContainer');
       imports.add('XAxis');
       imports.add('YAxis');
       imports.add('Tooltip');
       imports.add('CartesianGrid');
       imports.add('Legend');
       
       let chartComponent = '';
       let seriesHtml = '';
       
       const chartType = conf.chartType || 'bar';
       const xAxisKey = conf.xAxisKey || 'id';
       const series = conf.series || [{ key: 'value', label: 'Value', color: '#3b82f6' }];
       
       if (chartType === 'bar') {
           imports.add('BarChart');
           imports.add('Bar');
           chartComponent = 'BarChart';
           seriesHtml = series.map((s, idx) => 
               `<Bar key={idx} dataKey="${s.key}" name="${s.label || s.key}" fill="${s.color || '#3b82f6'}" />`
           ).join('\\n');
       } else if (chartType === 'line') {
           imports.add('LineChart');
           imports.add('Line');
           chartComponent = 'LineChart';
           seriesHtml = series.map((s, idx) => 
               `<Line key={idx} type="monotone" dataKey="${s.key}" name="${s.label || s.key}" stroke="${s.color || '#3b82f6'}" />`
           ).join('\\n');
       } else if (chartType === 'area') {
           imports.add('AreaChart');
           imports.add('Area');
           chartComponent = 'AreaChart';
           seriesHtml = series.map((s, idx) => 
               `<Area key={idx} type="monotone" dataKey="${s.key}" name="${s.label || s.key}" stroke="${s.color || '#3b82f6'}" fill="${s.color || '#3b82f6'}" fillOpacity={0.3} />`
           ).join('\\n');
       } else if (chartType === 'pie') {
           imports.add('PieChart');
           imports.add('Pie');
           chartComponent = 'PieChart';
           seriesHtml = series.map((s, idx) => 
               `<Pie key={idx} dataKey="${s.key}" nameKey="${xAxisKey}" cx="50%" cy="50%" outerRadius={80} fill="${s.color || '#3b82f6'}" label />`
           ).join('\\n');
       }
       
       return `
           <div className="p-4 w-full text-left bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 space-y-4">
               <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-700 pb-2">
                   <h4 className="text-sm font-bold text-slate-800 dark:text-slate-100">${conf.title || 'Diagramm'}</h4>
                   <span className="text-[10px] bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-300 px-2 py-0.5 rounded font-mono font-medium">
                       Typ: ${chartType}
                   </span>
               </div>
               { ${loadingState} ? (
                   <div className="h-64 flex items-center justify-center">
                       <Loader2 className="w-8 h-8 animate-spin text-slate-400" />
                   </div>
               ) : ${stateName}.length === 0 ? (
                   <div className="h-64 flex items-center justify-center text-xs text-slate-400 italic">Keine Daten verfügbar</div>
               ) : (
                   <div className="h-64 w-full">
                       <ResponsiveContainer width="100%" height="100%">
                           <${chartComponent} 
                             data={${stateName}.map((row: any) => {
                               const newRow = { ...row };
                               [${conf.series ? conf.series.map(s => `'${s.key}'`).join('\\n,') : ''}].forEach(k => {
                                 if (newRow[k] !== undefined) newRow[k] = Number(newRow[k]) || 0;
                               });
                               return newRow;
                             })} 
                             margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                               <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                               {'${chartType}' !== 'pie' && <XAxis dataKey="${xAxisKey}" tick={{ fontSize: 10, fill: '#64748b' }} axisLine={false} tickLine={false} />}
                               {'${chartType}' !== 'pie' && <YAxis tick={{ fontSize: 10, fill: '#64748b' }} axisLine={false} tickLine={false} />}
                               <Tooltip contentStyle={{ borderRadius: '8px', fontSize: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                               <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                               ${seriesHtml}
                           </${chartComponent}>
                       </ResponsiveContainer>
                   </div>
               )}
           </div>`;
   }

   if (comp.type === 'form_view') {
       const formObj = forms.find(f => f.id === conf.formId);
       const tbl = formObj ? tables.find(t => t.id === formObj.sourceId) : null;
       
       if (tbl) {
           const tblCamel = toCamelCase(tbl.name);
           const fieldsToRender = tbl.fields.filter(f => !f.isAutoIncrement);
           const formDataState = `formData_${idSuffix}`;
           states.push(`const [${formDataState}, set_${formDataState}] = useState<Record<string, any>>({});`);
           imports.add('post');
           
           return `
           <div className="bg-white dark:bg-slate-800 p-6 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm space-y-4">
               {!${conf.hideHeader ? 'true' : 'false'} && (
                   <h3 className="text-base font-bold text-slate-800 dark:text-slate-100">${formObj?.name || comp.name}</h3>
               )}
               <form onSubmit={async (e) => {
                   e.preventDefault();
                   try {
                       await post('${tblCamel}', ${formDataState});
                       alert('Erfolgreich gespeichert!');
                       set_${formDataState}({});
                   } catch (err) {
                       console.error(err);
                       alert('Fehler beim Speichern.');
                   }
               }} className="space-y-4 text-left">
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                       ${fieldsToRender.map(f => {
                           const fCamel = toCamelCase(f.name);
                           return `
                           <div key="${f.id}" className="space-y-1">
                               <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">${f.name}</label>
                               <input 
                                   type="text"
                                   value={${formDataState}['${fCamel}'] || ''}
                                   onChange={(e) => set_${formDataState}(prev => ({ ...prev, '${fCamel}': e.target.value }))}
                                   className="w-full text-sm border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 bg-white dark:bg-slate-900"
                               />
                           </div>`;
                       }).join('\\n')}
                   </div>
                   {!${conf.hideActions ? 'true' : 'false'} && (
                       <div className="flex justify-end pt-2">
                           <button type="submit" className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-semibold shadow transition">
                               Speichern
                           </button>
                       </div>
                   )}
               </form>
           </div>`;
       } else {
           return `<div className="p-4 bg-slate-50 rounded border text-sm text-slate-400">Formular-Datenquelle nicht gefunden</div>`;
       }
   }

   if (comp.type === 'text') {
       const txtSize = conf.fontSize || 'text-base';
       const txtWeight = conf.fontWeight || 'font-normal';
       const txtColor = conf.colorClass || 'text-slate-700';
       const txtAlign = conf.alignment || 'text-left';
       const escapedText = (conf.text || '').replace(/'/g, "\\'");
       return `<div className="w-full ${txtSize} ${txtWeight} ${txtColor} ${txtAlign} p-2">${escapedText}</div>`;
   }

   if (comp.type === 'button') {
       const variantClasses = 
           conf.variant === 'secondary' ? 'bg-slate-100 text-slate-700 border hover:bg-slate-200' :
           conf.variant === 'danger' ? 'bg-red-600 hover:bg-red-700 text-white' :
           conf.variant === 'outline' ? 'bg-white text-slate-600 border border-slate-300 hover:bg-slate-50' : 'bg-indigo-600 text-white hover:bg-indigo-700';
       
       let clickHandler = '';
       if (conf.actionType === 'navigate' && conf.targetPageId) {
           const targetPage = pages.find(p => p.id === conf.targetPageId);
           if (targetPage) {
               clickHandler = `navigate('/pages/${toCamelCase(targetPage.name)}')`;
           }
       } else if (conf.actionType === 'setParam' && conf.targetParamKey) {
           clickHandler = `console.log('Param set: ${conf.targetParamKey} = ${conf.targetParamVal}')`;
       }
       
       return `
           <button 
               onClick={() => ${clickHandler || "console.log('Button geklickt')"}}
               className="px-4 py-2 rounded font-medium shadow-sm transition-colors m-2 ${variantClasses}"
           >
               ${conf.label || 'Aktions-Button'}
           </button>`;
   }

   if (comp.type === 'dropdown') {
       const valueField = toCamelCase(conf.valueField || 'id');
       const labelField = toCamelCase(conf.displayField || 'Name');
       return `
           <div className="p-2 w-full text-left">
               ${conf.label ? `<label className="block text-xs font-semibold text-slate-600 mb-1">${conf.label}</label>` : ''}
               <select 
                   className="border border-slate-300 dark:border-slate-700 rounded px-3 py-2 bg-white dark:bg-slate-800 w-full max-w-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none text-xs text-slate-800 dark:text-slate-100"
                   onChange={(e) => console.log('Dropdown changed: ' + e.target.value)}
               >
                   <option value="">${conf.placeholder || '-- Bitte wählen --'}</option>
                   {${loadingState} && <option disabled>Lade Daten...</option>}
                   {!${loadingState} && ${stateName}.map((row, idx) => (
                       <option key={idx} value={row['${valueField}'] || row.id || idx}>
                           {String(row['${labelField}'] || row.name || Object.values(row)[0] || '')}
                       </option>
                   ))}
               </select>
           </div>`;
   }

   if (comp.type === 'metric_card') {
       const theme = conf.themeColor || 'indigo';
       const themeClasses = {
           indigo: 'bg-indigo-50/40 border-indigo-100 text-indigo-700 dark:bg-indigo-950/20 dark:border-indigo-900/40 dark:text-indigo-400',
           emerald: 'bg-emerald-50/40 border-emerald-100 text-emerald-700 dark:bg-emerald-950/20 dark:border-emerald-900/40 dark:text-emerald-400',
           rose: 'bg-rose-50/40 border-rose-100 text-rose-700 dark:bg-rose-950/20 dark:border-rose-900/40 dark:text-rose-400',
           sky: 'bg-sky-50/40 border-sky-100 text-sky-700 dark:bg-sky-950/20 dark:border-sky-900/40 dark:text-sky-400',
           amber: 'bg-amber-50/40 border-amber-100 text-amber-700 dark:bg-amber-950/20 dark:border-amber-900/40 dark:text-amber-400',
           slate: 'bg-slate-50/40 border-slate-200 text-slate-700 dark:bg-slate-900/30 dark:border-slate-800 dark:text-slate-400'
       };

       const iconBgClasses = {
           indigo: 'bg-indigo-100 dark:bg-indigo-900/40',
           emerald: 'bg-emerald-100 dark:bg-emerald-900/40',
           rose: 'bg-rose-100 dark:bg-rose-900/40',
           sky: 'bg-sky-100 dark:bg-sky-900/40',
           amber: 'bg-amber-100 dark:bg-amber-900/40',
           slate: 'bg-slate-200 dark:bg-slate-800'
       };

       const computedValFn = `computeMetric_${idSuffix}`;
       const aggFieldCamel = toCamelCase(conf.aggField || '');
       
       states.push(`
  const ${computedValFn} = useMemo(() => {
    if ('${conf.aggType}' === 'custom') return '${conf.customValue || '0'}';
    if (!${stateName} || ${stateName}.length === 0) return '0';
    if ('${conf.aggType}' === 'count') return ${stateName}.length.toString();
    
    const f = '${aggFieldCamel}';
    const numbers = ${stateName}.map(r => Number(r[f])).filter(val => !isNaN(val));
    if (numbers.length === 0) return '0,00';
    
    let res = 0;
    if ('${conf.aggType}' === 'sum') {
      res = numbers.reduce((a, b) => a + b, 0);
    } else if ('${conf.aggType}' === 'avg') {
      res = numbers.reduce((a, b) => a + b, 0) / numbers.length;
    } else if ('${conf.aggType}' === 'min') {
      res = Math.min(...numbers);
    } else if ('${conf.aggType}' === 'max') {
      res = Math.max(...numbers);
    }
    return res.toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }, [${stateName}]);`);

       return `
           <div className="p-4 w-full flex justify-center text-left">
               {${loadingState} ? (
                   <div className="w-full max-w-sm bg-slate-50 dark:bg-slate-900 border border-slate-200 animate-pulse rounded-2xl p-5 h-28"></div>
               ) : (
                   <div className="w-full max-w-sm border-2 p-5 rounded-2xl shadow-sm ${(themeClasses as any)[theme] || themeClasses.indigo}">
                       <div className="flex justify-between items-start">
                           <div>
                               <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">${conf.title || 'Kennzahl'}</p>
                               <h4 className="text-3xl font-bold tracking-tight mt-1 text-slate-900 dark:text-white font-sans">
                                   ${conf.prefix || ''}{${computedValFn}}${conf.suffix || ''}
                               </h4>
                           </div>
                           <div className="p-2.5 rounded-xl ${(iconBgClasses as any)[theme] || iconBgClasses.indigo}">
                               <span className="text-sm font-bold uppercase font-mono">${(conf.iconName || 'Up').substring(0, 3)}</span>
                           </div>
                       </div>
                       ${conf.subtext ? `
                       <div className="mt-3 text-[10px] text-slate-500 dark:text-slate-400 border-t border-slate-200/50 dark:border-slate-800/50 pt-2 flex items-center gap-1">
                           <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                           <span>${conf.subtext}</span>
                       </div>` : ''}
                   </div>
               )}
           </div>`;
   }

         if (comp.type === 'calendar_view') {
       imports.add('{ Calendar, dateFnsLocalizer } from \'react-big-calendar\'');
       imports.add('{ format, parse, startOfWeek, getDay } from \'date-fns\'');
       imports.add('de from \'date-fns/locale/de\'');
       imports.add('\'react-big-calendar/lib/css/react-big-calendar.css\'');

       const titleField = conf.titleField || 'name';
       const startField = conf.startDateField || 'date';
       const endField = conf.endDateField || startField;
       const colorField = conf.colorField || '';
       const defaultView = conf.defaultView || 'month';
       const availableViews = conf.views ? conf.views.join(', ') : 'month, week, work_week, day, agenda';

       return `
           <div className="p-4 w-full bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 h-[600px] flex flex-col space-y-4">
               <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-700 pb-2 shrink-0">
                   <h4 className="text-sm font-bold text-slate-800 dark:text-slate-100">${conf.title || 'Kalender'}</h4>
               </div>
               <div className="flex-1 overflow-hidden" style={{ minHeight: 0 }}>
                   {(() => {
                       const locales = { 'de': de };
                       const localizer = dateFnsLocalizer({ format, parse, startOfWeek, getDay, locales });
                       
                       const combineDateTime = (dateVal: any, timeVal: any) => {
							if (!dateVal) return new Date();
							if (!timeVal) return new Date(dateVal);
							let dateStr = '';
							if (typeof dateVal === 'string') {
								dateStr = dateVal.split('T')[0].split(' ')[0];
							} else if (dateVal instanceof Date) {
								dateStr = dateVal.toISOString().split('T')[0];
							} else {
								dateStr = String(dateVal).split(' ')[0];
							}
							let timeStr = String(timeVal);
							const match = timeStr.match(/(\d{1,2}):(\d{2})(?::(\d{2}))?/);
							if (match) {
								const h = match[1].padStart(2, '0');
								const m = match[2].padStart(2, '0');
								const s = match[3] ? match[3].padStart(2, '0') : '00';
								return new Date(dateStr + 'T' + h + ':' + m + ':' + s);
							}
							return new Date(dateStr);
						};

						const events = (${stateName} || []).map((row: any) => {
							const startVal = row['${startField}'];
							const startTimeVal = '${conf.startTimeField || ""}' ? row['${conf.startTimeField || ""}'] : undefined;
							const endVal = '${conf.endDateField || ""}' ? row['${conf.endDateField || ""}'] : startVal;
							const endTimeVal = '${conf.endTimeField || ""}' ? row['${conf.endTimeField || ""}'] : undefined;

							return {
								title: row['${titleField}'] || 'Termin',
								start: combineDateTime(startVal, startTimeVal),
								end: combineDateTime(endVal, endTimeVal),
								resource: row,
								color: '${colorField}' ? row['${colorField}'] : undefined
							};
						});

                       return (
                           <Calendar
                               localizer={localizer}
                               events={events}
                               startAccessor="start"
                               endAccessor="end"
                               defaultView="${defaultView}"
                               views={[${availableViews.split(',').map(v => `'${v.trim()}'`).join(',')}]}
                               culture="de"
                               style={{ height: '100%' }}
                               eventPropGetter={(event: any) => ({
                                   style: {
                                       backgroundColor: event.color || '#4f46e5',
                                       borderRadius: '4px',
                                       opacity: 0.9,
                                       color: 'white',
                                       border: '0',
                                       display: 'block'
                                   }
                               })}
                           />
                       );
                   })()}
               </div>
           </div>`;
   }


   if (comp.type === 'kanban_board') {
       const groupBy = toCamelCase(conf.groupByField || 'Status');
       const titleF = toCamelCase(conf.titleField || 'Name');
       const descF = toCamelCase(conf.descField || 'Email');
       const accentF = toCamelCase(conf.cardAccentField || 'Umsatz');

       const groupsState = `kanbanGroups_${idSuffix}`;
       const colKeysState = `kanbanCols_${idSuffix}`;
       const activeDragItemState = `activeDragItem_${idSuffix}`;
       const targetDragOverItemState = `targetDragOverItem_${idSuffix}`;
       const kanbanNotificationState = `kanbanNotification_${idSuffix}`;

       if (fetchUrl && dsType === 'table') {
           imports.add('put');
       }

       
       const groupByFieldObj = tbl ? tbl.fields.find(f => toCamelCase(f.name) === groupBy) : null;
       const isNumericGroup = groupByFieldObj && ['INTEGER', 'DECIMAL', 'DOUBLE'].includes(groupByFieldObj.type);

       let kanbanLookupDataState = '';
       let lookupLogic = '';
       let columnDisplayField = '';
       let lookupTableVar = '';
       if (conf.columnSourceTableId && conf.columnDisplayField) {
           const lookupTable = tables.find((t) => t.id === conf.columnSourceTableId);
           if (lookupTable) {
               kanbanLookupDataState = `kanbanLookupData_${idSuffix}`;
               columnDisplayField = toCamelCase(conf.columnDisplayField);
               lookupTableVar = toCamelCase(lookupTable.name);
               lookupLogic = `
  const [${kanbanLookupDataState}, set_${kanbanLookupDataState}] = useState<any[]>([]);
  useEffect(() => {
    const fetchLookup = async () => {
      try {
        const res = await get<any>('${lookupTableVar}', { pageSize: 1000 });
        set_${kanbanLookupDataState}(res.data || res || []);
      } catch (e) {
        console.error(e);
      }
    };
    fetchLookup();
  }, []);`;
           }
       }

       states.push(`
  const [${colKeysState}, set_${colKeysState}] = useState<string[]>(${isNumericGroup ? '[]' : "['Offen', 'In Arbeit', 'Erledigt']"});
  const [${activeDragItemState}, set_${activeDragItemState}] = useState<any>(null);
  const [${targetDragOverItemState}, set_${targetDragOverItemState}] = useState<any>(null);
  const [${kanbanNotificationState}, set_${kanbanNotificationState}] = useState<string>('');
  ${lookupLogic}

  useEffect(() => {
    if (${kanbanLookupDataState ? `${kanbanLookupDataState}.length > 0` : 'true'}) {
        let uniqueVals: string[] = [];
        if (${kanbanLookupDataState ? 'true' : 'false'}) {
            uniqueVals = ${kanbanLookupDataState ? kanbanLookupDataState : '[]'}.map(r => String(r.id || r.Id));
        } else {
            uniqueVals = Array.from(new Set(${stateName}.map((r: any) => String(r['${groupBy}'] || 'Unassigned'))));
        }
        set_${colKeysState}(prev => Array.from(new Set([...prev, ...uniqueVals])));
    } else {
        const uniqueVals = Array.from(new Set(${stateName}.map((r: any) => String(r['${groupBy}'] || 'Unassigned'))));
        set_${colKeysState}(prev => Array.from(new Set([...prev, ...uniqueVals])));
    }
  }, [${stateName}${kanbanLookupDataState ? `, ${kanbanLookupDataState}` : ''}]);

  const ${groupsState} = useMemo(() => {
    const groups: Record<string, any[]> = {};
    ${colKeysState}.forEach(col => { groups[col] = []; });
    
    ${stateName}.forEach(row => {
      const val = String(row['${groupBy}'] || 'Unassigned');
      if (!groups[val]) groups[val] = [];
      groups[val].push(row);
    });
    return groups;
  }, [${stateName}, ${colKeysState}]);

  const handleDragStart_${idSuffix} = (item: any) => {
    set_${activeDragItemState}(item);
  };

  const handleDragEnterItem_${idSuffix} = (item: any) => {
    set_${targetDragOverItemState}(item);
  };

  const handleDragOver_${idSuffix} = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop_${idSuffix} = async (targetColumn: string) => {
    const item = ${activeDragItemState};
    if (!item) return;

    const fallbackOld = ${isNumericGroup ? "'Unassigned'" : "'Offen'"};
    const oldColumn = String(item['${groupBy}'] || fallbackOld);
    const itemTitle = item['${titleF}'] || item.name || item.title || 'ID: ' + (item.id || item.Id);
    
    const previousState = [...${stateName}];
    const parsedTarget = ${isNumericGroup} ? (isNaN(Number(targetColumn)) ? targetColumn : Number(targetColumn)) : targetColumn;
    const updatedItem = { ...item, '${groupBy}': parsedTarget };

    let updatedList = ${stateName}.filter((t: any) => (t.id || t.Id) !== (item.id || item.Id));
    let newIndex = updatedList.length;

    if (${targetDragOverItemState}) {
      const idx = updatedList.findIndex((t: any) => (t.id || t.Id) === (${targetDragOverItemState}.id || ${targetDragOverItemState}.Id));
      if (idx !== -1) {
        newIndex = idx;
      }
    }

    updatedList.splice(newIndex, 0, updatedItem);

    ${tbl ? `
    const positionField = ${JSON.stringify(tbl.fields)}.find((f: any) => 
        ['position', 'sort_order', 'sort', 'order', 'priority_order', 'sortorder'].includes(f.name.toLowerCase())
    );
    if (positionField) {
        let posCounter = 0;
        updatedList = updatedList.map((t: any) => {
            if (String(t['${groupBy}'] || 'Offen') === targetColumn) {
                return { ...t, [positionField.name]: posCounter++ };
            }
            return t;
        });
    }
    ` : ''}

    set_${stateName}(updatedList);

    let msg = '';
    if (oldColumn === targetColumn) {
      msg = "Reihenfolge geändert: '" + itemTitle + "' innerhalb von '" + targetColumn + "' auf Position " + (newIndex + 1) + " verschoben.";
    } else {
      msg = "Erfolgreich verschoben: '" + itemTitle + "' von '" + oldColumn + "' nach '" + targetColumn + "' auf Position " + (newIndex + 1) + ".";
    }

    set_${kanbanNotificationState}(msg);
    setTimeout(() => {
      set_${kanbanNotificationState}(prev => prev === msg ? '' : prev);
    }, 4000);

    ${tbl ? `
    try {
      await put('${toCamelCase(tbl.name)}/' + (item.id || item.Id), updatedItem);
    } catch (err) {
      console.error(err);
      set_${kanbanNotificationState}("Fehler beim Verschieben von '" + itemTitle + "'");
      set_${stateName}(previousState);
    }
    ` : ''}

    set_${activeDragItemState}(null);
    set_${targetDragOverItemState}(null);
  };
`);

       return `
           <div className="p-4 w-full space-y-4 text-left">
               <div className="flex justify-between items-center border-b border-slate-200/60 dark:border-slate-800 pb-2">
                   <h4 className="text-sm font-bold text-slate-800 dark:text-slate-100">${conf.title || 'Kanban-Board'}</h4>
                   <span className="text-[10px] bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400 px-2 py-0.5 rounded font-mono font-medium">
                       Spalte: ${groupBy}
                   </span>
               </div>
               {${kanbanNotificationState} && (
                   <div className="mb-4 bg-blue-50 dark:bg-blue-950/40 border-l-4 border-blue-500 text-blue-700 dark:text-blue-300 p-3 rounded-lg shadow-sm flex items-center gap-2 animate-pulse text-xs">
                       <span className="font-semibold">{${kanbanNotificationState}}</span>
                   </div>
               )}
               {${loadingState} ? (
                   <div className="grid grid-cols-3 gap-3">
                       <div className="h-48 bg-slate-100 dark:bg-slate-800 animate-pulse rounded-xl"></div>
                       <div className="h-48 bg-slate-100 dark:bg-slate-800 animate-pulse rounded-xl"></div>
                       <div className="h-48 bg-slate-100 dark:bg-slate-800 animate-pulse rounded-xl"></div>
                   </div>
               ) : ${colKeysState}.length === 0 ? (
                   <div className="text-center p-8 bg-slate-50 dark:bg-slate-900/10 border border-dashed border-slate-200 dark:border-slate-800 text-slate-400 text-xs italic rounded-xl">
                       Keine Daten gefunden.
                   </div>
               ) : (
                   <div className="grid grid-cols-1 md:grid-cols-3 xl:grid-cols-4 gap-4 overflow-x-auto pb-2">
                       {${colKeysState}.map(colKey => {
                           let colDisplayName = colKey;
                           if (${kanbanLookupDataState ? 'true' : 'false'} && ${kanbanLookupDataState ? kanbanLookupDataState : '[]'}.length > 0) {
                               const match = ${kanbanLookupDataState ? kanbanLookupDataState : '[]'}.find((r: any) => String(r.id || r.Id) === String(colKey));
                               if (match) {
                                   const disp = '${columnDisplayField ? columnDisplayField : ''}';
                                   const dispLower = disp.toLowerCase();
                                   const dispCap = disp.charAt(0).toUpperCase() + disp.slice(1);
                                   let val = match[disp] !== undefined ? match[disp] : (match[dispLower] !== undefined ? match[dispLower] : match[dispCap]);
                                   if (val !== undefined && val !== null) {
                                       colDisplayName = String(val);
                                   }
                               }
                           }
                           return (
                           <div 
                               key={colKey} 
                               className="bg-slate-50 dark:bg-slate-900/30 p-3 rounded-2xl border border-slate-200/60 dark:border-slate-800 flex flex-col min-w-[250px] min-h-[450px]"
                               onDragOver={handleDragOver_${idSuffix}}
                               onDrop={() => handleDrop_${idSuffix}(colKey)}
                           >
                               <div className="flex justify-between items-center mb-3 px-1">
                                   <span className="text-xs font-bold text-slate-700 dark:text-slate-300 truncate max-w-[80%]">{colDisplayName}</span>
                                   <span className="text-xs font-bold bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400 px-2 py-0.5 rounded-full">
                                       {(${groupsState}[colKey] || []).length}
                                   </span>
                               </div>
                               <div className="space-y-2.5 flex-1">
                                   {(${groupsState}[colKey] || []).map((row, rIdx) => {
                                       const cardTitle = row['${titleF}'] ? String(row['${titleF}']) : 'Task #' + (rIdx + 1);
                                       const cardDesc = row['${descF}'] ? String(row['${descF}']) : '';
                                       const cardAccent = row['${accentF}'];
                                       return (
                                           <div 
                                               key={row.id || row.Id || rIdx} 
                                               draggable="true"
                                               onDragStart={() => handleDragStart_${idSuffix}(row)}
                                               onDragEnter={() => handleDragEnterItem_${idSuffix}(row)}
                                               className="bg-white dark:bg-slate-800 p-3 rounded-xl border border-slate-200 dark:border-slate-700 shadow-xs hover:shadow-md hover:border-indigo-400 dark:hover:border-indigo-500 transition-all cursor-grab active:cursor-grabbing space-y-2 select-none text-left"
                                           >
                                               <div className="flex justify-between items-start gap-2">
                                                   <h5 className="text-xs font-bold text-slate-800 dark:text-slate-100 leading-tight truncate flex-1">{cardTitle}</h5>
                                                   <svg className="w-3.5 h-3.5 text-slate-400 dark:text-slate-600 cursor-move shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M4 8h16M4 16h16"></path></svg>
                                               </div>
                                               {cardDesc && <p className="text-[10px] text-slate-500 dark:text-slate-400 leading-relaxed line-clamp-3">{cardDesc}</p>}
                                               {cardAccent !== undefined && cardAccent !== null && (
                                                   <div className="flex justify-end pt-1">
                                                       <span className="text-[9px] font-bold bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 px-2 py-0.5 rounded font-mono">
                                                           {typeof cardAccent === 'number' ? cardAccent.toLocaleString('de-DE') : String(cardAccent)}
                                                       </span>
                                                   </div>
                                               )}
                                           </div>
                                       );
                                   })}
                               </div>
                           </div>
                           );
                       })}
                   </div>
               )}
           </div>`;
   }

   return `<div className="p-3 bg-slate-50 text-slate-500 text-xs italic border rounded text-center">[Custom Component {comp.name} ({comp.type}) geladen]</div>`;
};
