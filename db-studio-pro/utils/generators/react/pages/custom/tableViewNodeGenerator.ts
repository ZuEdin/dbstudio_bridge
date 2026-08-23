import { GeneratorContext } from './types';
import { toCamelCase, toPascalCase } from '../../../common';

export const generateTableViewNode = (node: any, ctx: GeneratorContext): string => {
  const classNameStr = node.props?.className || '';
  const styleStr = JSON.stringify(node.props?.style || {});
  
  let cleanName = 'table';
  if (node.props?.dataSourceType === 'table' && node.props?.dataSourceId) {
      const tObj = ctx.tables.find(t => t.id === node.props.dataSourceId);
      if (tObj) cleanName = tObj.name;
  } else if (node.props?.dataSourceType === 'query' && node.props?.dataSourceId) {
      const qObj = ctx.queries.find(q => q.id === node.props.dataSourceId);
      if (qObj) cleanName = qObj.name;
  }
  const shortId = node.id ? (node.id.split('-')[0] || '') : '';
  const idSuffix = `${toCamelCase(cleanName)}_${shortId}`;
  const stateName = `tableData_${idSuffix}`;
  const loadingState = `tableLoading_${idSuffix}`;
  const searchState = `tableSearch_${idSuffix}`;
  const columnFiltersState = `columnFilters_${idSuffix}`;
  const showFiltersState = `showFilters_${idSuffix}`;
  const sortFieldState = `sortField_${idSuffix}`;
  const sortDirState = `sortDir_${idSuffix}`;
  const processedName = `processedTableData_${idSuffix}`;
  const pageState = `currentPage_${idSuffix}`;
  const paginatedName = `paginatedTableData_${idSuffix}`;
  const selectedRowState = `selectedRow_${idSuffix}`;

  ctx.states.push(`const [${stateName}, set_${stateName}] = useState<any[]>([]);`);
  ctx.states.push(`const [${loadingState}, set_${loadingState}] = useState(false);`);
  ctx.states.push(`const [${searchState}, set_${searchState}] = useState('');`);
  ctx.states.push(`const [${columnFiltersState}, set_${columnFiltersState}] = useState<Record<string, string>>({});`);
  ctx.states.push(`const [${showFiltersState}, set_${showFiltersState}] = useState(false);`);
  ctx.states.push(`const [${sortFieldState}, set_${sortFieldState}] = useState<string | null>(null);`);
  ctx.states.push(`const [${sortDirState}, set_${sortDirState}] = useState<'asc' | 'desc' | null>(null);`);
  ctx.states.push(`const [${pageState}, set_${pageState}] = useState(1);`);
  ctx.states.push(`const [${selectedRowState}, set_${selectedRowState}] = useState<any>(null);`);
  
  let fetchUrl = '';
  if (node.props?.dataSourceType === 'table' && node.props?.dataSourceId) {
      const tObj = ctx.tables.find(t => t.id === node.props.dataSourceId);
      if (tObj) fetchUrl = `${toPascalCase(tObj.name)}`;
  } else if (node.props?.dataSourceType === 'query' && node.props?.dataSourceId) {
      const qObj = ctx.queries.find(q => q.id === node.props.dataSourceId);
      if (qObj) fetchUrl = `queries/${toCamelCase(qObj.name)}`;
  }
  
  if (fetchUrl) {
      ctx.imports.add('get');
      ctx.imports.add('Loader2');
      ctx.effects.push(`
  useEffect(() => {
    const fetchTableData = async () => {
      try {
        set_${loadingState}(true);
        const params = Object.fromEntries(searchParams.entries());
        const res = await get<any>('${fetchUrl}', { pageSize: 10, ...params });
        const items = Array.isArray(res) ? res : (res?.data || res?.Data || res?.items || res?.Items || []);
        set_${stateName}(items);
      } catch (err) {
        console.error(err);
      } finally {
        set_${loadingState}(false);
      }
    };
    fetchTableData();
  }, [searchParams]);`);
  }
  
  const columnsStr = node.props?.columns || '';
  const columns = columnsStr ? columnsStr.split(',').map((c: string) => c.trim()) : [];
  
  const filterParamField = node.props?.filterParamField;
  const filterParamName = node.props?.filterParamName;
  let filterSnippet = '';
  if (filterParamField && filterParamName) {
      filterSnippet = `
    const filterVal = searchParams.get('${filterParamName}');
    if (filterVal !== undefined && filterVal !== null && filterVal !== '') {
      items = items.filter(row => String(row['${toCamelCase(filterParamField)}'] || row['${filterParamField}'] || '') === String(filterVal));
    } else {
      items = [];
    }`;
  }

  ctx.effects.push(`
  const ${processedName} = useMemo(() => {
    let items = [...${stateName}];
    ${filterSnippet}
    const globalSearch = ${searchState}.toLowerCase().trim();
    if (globalSearch) {
      const searchTerms = globalSearch.split(/\\s+/).filter(Boolean);
      items = items.filter(row => {
        return searchTerms.every(term => {
          return Object.values(row).some(val => 
            val !== undefined && val !== null && String(val).toLowerCase().includes(term)
          );
        });
      });
    }

    Object.keys(${columnFiltersState}).forEach(key => {
      const filterVal = ${columnFiltersState}[key].toLowerCase().trim();
      if (filterVal) {
        const searchTerms = filterVal.split(/\\s+/).filter(Boolean);
        items = items.filter(row => {
          const val = row[key];
          if (val === undefined || val === null) return false;
          const cellStr = String(val).toLowerCase();
          return searchTerms.every(term => cellStr.includes(term));
        });
      }
    });

    if (${sortFieldState} && ${sortDirState}) {
      items.sort((a, b) => {
        const valA = a[${sortFieldState}];
        const valB = b[${sortFieldState}];
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
        return ${sortDirState} === 'asc' ? comparison : -comparison;
      });
    }

    return items;
  }, [${stateName}, ${searchState}, ${columnFiltersState}, ${sortFieldState}, ${sortDirState}, searchParams]);`);

  ctx.effects.push(`
  const ${paginatedName} = useMemo(() => {
    const startIndex = (${pageState} - 1) * 10;
    return ${processedName}.slice(startIndex, startIndex + 10);
  }, [${processedName}, ${pageState}]);`);

  const targetTable = node.props?.dataSourceType === 'table' && node.props?.dataSourceId 
      ? ctx.tables.find(t => t.id === node.props.dataSourceId) 
      : null;
  const pkField = targetTable?.fields.find(f => f.isPrimaryKey) || targetTable?.fields[0];
  const pkFieldName = pkField ? toCamelCase(pkField.name) : 'id';

  const detailsPage = node.props?.detailsPageId 
      ? ctx.pages.find(p => p.id === node.props.detailsPageId) 
      : null;
  const detailsPageRoute = detailsPage ? `/custom/${toCamelCase(detailsPage.name)}` : '';

  const editForm = node.props?.editFormId 
      ? ctx.forms.find(f => f.id === node.props.editFormId) 
      : null;
  const formRoute = editForm ? `/forms/${toPascalCase(editForm.name).toLowerCase()}Form` : '';

  const paramKey = node.props?.selectionParamName || 'selectedId';
  const clickTrigger = node.props?.rowClickTrigger || 'click';
  const dblclickTrigger = node.props?.rowDoubleClickTrigger || 'dblclick';

  let clickActionCode = '';
  let dblclickActionCode = '';

  if (detailsPageRoute) {
      const code = `navigate(\`${detailsPageRoute}?${paramKey}=\${idVal}\`);`;
      if (clickTrigger === 'click') clickActionCode = code;
      if (dblclickTrigger === 'dblclick') dblclickActionCode = code;
  } else if (formRoute) {
      const code = `navigate(\`${formRoute}/\${idVal}\`);`;
      if (clickTrigger === 'click') clickActionCode = code;
      if (dblclickTrigger === 'dblclick') dblclickActionCode = code;
  } else {
      const code = `const searchParamsCopy = new URLSearchParams(window.location.search); searchParamsCopy.set('${paramKey}', String(idVal)); navigate({ search: '?' + searchParamsCopy.toString() });`;
      if (clickTrigger === 'click') clickActionCode = code;
      if (dblclickTrigger === 'dblclick') dblclickActionCode = code;
  }

  let headerCells = '';
  let bodyCells = '';
  let filterRow = '';
  
  if (columns.length > 0) {
      headerCells = columns.map((col: string) => `
                                      <th 
                                          key="${col}" 
                                          className="px-3 py-2 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700 select-none"
                                          onClick={() => {
                                              if (${sortFieldState} === '${toCamelCase(col)}') {
                                                  set_${sortDirState}(${sortDirState} === 'asc' ? 'desc' : ${sortDirState} === 'desc' ? null : 'asc');
                                                  if (${sortDirState} === 'desc') set_${sortFieldState}(null);
                                              } else {
                                                  set_${sortFieldState}('${toCamelCase(col)}');
                                                  set_${sortDirState}('asc');
                                              }
                                          }}
                                      >
                                          <div className="flex items-center gap-1.5">
                                              <span>${col}</span>
                                              {${sortFieldState} === '${toCamelCase(col)}' ? (
                                                  ${sortDirState} === 'asc' ? <ArrowUp size={12} className="text-blue-500" /> : <ArrowDown size={12} className="text-blue-500" />
                                              ) : (
                                                  <ArrowUpDown size={12} className="text-slate-300 dark:text-slate-600" />
                                              )}
                                          </div>
                                      </th>`).join('\n');
      
      bodyCells = columns.map((col: string) => `<td key="${col}" className="px-3 py-2 whitespace-nowrap text-sm text-slate-600 dark:text-slate-300">{String(row['${toCamelCase(col)}'] || row['${col}'] || '')}</td>`).join('\n');
      
      filterRow = `
                              {${showFiltersState} && (
                                  <tr className="bg-slate-100/50 dark:bg-slate-900/50">
                                      ${columns.map((col: string) => `
                                      <th className="p-2">
                                          <input 
                                              type="text"
                                              placeholder="Filtern..."
                                              className="w-full px-2 py-1 text-xs font-normal border rounded bg-white dark:bg-slate-800 dark:border-slate-700 dark:text-white"
                                              value={${columnFiltersState}['${toCamelCase(col)}'] || ''}
                                              onChange={e => {
                                                  set_${columnFiltersState}({ ...${columnFiltersState}, '${toCamelCase(col)}': e.target.value });
                                                  set_${pageState}(1);
                                              }}
                                          />
                                      </th>`).join('\n')}
                                  </tr>
                              )}`;
  } else {
      headerCells = `
                                  {${stateName}.length > 0 ? Object.keys(${stateName}[0]).map(k => (
                                      <th 
                                          key={k} 
                                          className="px-3 py-2 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700 select-none"
                                          onClick={() => {
                                              if (${sortFieldState} === k) {
                                                  set_${sortDirState}(${sortDirState} === 'asc' ? 'desc' : ${sortDirState} === 'desc' ? null : 'asc');
                                                  if (${sortDirState} === 'desc') set_${sortFieldState}(null);
                                              } else {
                                                  set_${sortFieldState}(k);
                                                  set_${sortDirState}('asc');
                                              }
                                          }}
                                      >
                                          <div className="flex items-center gap-1.5">
                                              <span>{k}</span>
                                              {${sortFieldState} === k ? (
                                                  ${sortDirState} === 'asc' ? <ArrowUp size={12} className="text-blue-500" /> : <ArrowDown size={12} className="text-blue-500" />
                                              ) : (
                                                  <ArrowUpDown size={12} className="text-slate-300 dark:text-slate-600" />
                                              )}
                                          </div>
                                      </th>
                                  )) : <th className="px-3 py-2 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Keine Daten</th>}`;
      
      bodyCells = `
                                  {Object.values(row).map((val: any, vIdx) => (
                                      <td key={vIdx} className="px-3 py-2 whitespace-nowrap text-sm text-slate-600 dark:text-slate-300">{String(val)}</td>
                                  ))}`;
      
      filterRow = `
                              {${showFiltersState} && ${stateName}.length > 0 && (
                                  <tr className="bg-slate-100/50 dark:bg-slate-900/50">
                                      {Object.keys(${stateName}[0]).map(k => (
                                          <th key={k} className="p-2">
                                              <input 
                                                  type="text"
                                                  placeholder="Filtern..."
                                                  className="w-full px-2 py-1 text-xs font-normal border rounded bg-white dark:bg-slate-800 dark:border-slate-700 dark:text-white"
                                                  value={${columnFiltersState}[k] || ''}
                                                  onChange={e => {
                                                      set_${columnFiltersState}({ ...${columnFiltersState}, [k]: e.target.value });
                                                      set_${pageState}(1);
                                                  }}
                                              />
                                          </th>
                                      ))}
                                  </tr>
                              )}`;
  }

  const totalItems = `${processedName}.length`;
  const totalPages = `Math.max(1, Math.ceil(${totalItems} / 10))`;
  const startIndex = `(${pageState} - 1) * 10`;
  const endIndex = `Math.min(${startIndex} + 10, ${totalItems})`;
  
  return `
              <div className="p-4 w-full flex flex-col gap-4 ${classNameStr}" style={${styleStr}}>
                  <div className="flex justify-between items-center gap-4">
                      <button 
                          onClick={() => set_${showFiltersState}(prev => !prev)} 
                          className={\`p-1.5 border rounded-lg flex items-center gap-1.5 text-xs hover:bg-slate-100 dark:hover:bg-slate-700 transition \${${showFiltersState} ? 'bg-blue-50 border-blue-300 text-blue-600 dark:bg-blue-900/20' : 'bg-white dark:bg-slate-800 dark:border-slate-700 dark:text-white'}\`}
                          title="Spaltenfilter anzeigen/ausblenden"
                      >
                          <Filter size={14}/>
                          <span>Filter</span>
                      </button>
                      
                      <div className="relative flex-1 max-w-xs">
                          <Search className="absolute left-3 top-2 text-slate-400" size={14} />
                          <input 
                              type="text" 
                              placeholder="Suchen..." 
                              className="pl-9 pr-3 py-1.5 border rounded-lg text-xs w-full bg-white dark:bg-slate-800 dark:border-slate-700 dark:text-white"
                              value={${searchState}}
                              onChange={e => {
                                  set_${searchState}(e.target.value);
                                  set_${pageState}(1);
                              }}
                          />
                      </div>
                  </div>

                  {${loadingState} ? (
                      <div className="flex items-center justify-center p-8"><Loader2 className="animate-spin text-slate-400" /></div>
                  ) : (
                      <div className="flex flex-col gap-3">
                          <div className="overflow-x-auto border rounded-lg dark:border-slate-700">
                              <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-700">
                                  <thead className="bg-slate-50 dark:bg-slate-900">
                                      <tr>
                                          ${headerCells}
                                      </tr>
                                      ${filterRow}
                                  </thead>
                                  <tbody className="bg-white dark:bg-slate-800 divide-y divide-slate-200 dark:divide-slate-700">
                                      {${paginatedName}.map((row: any, idx: number) => {
                                          const idVal = row['${pkFieldName}'] || row.id || row.ID || idx;
                                          return (
                                              <tr 
                                                  key={row.id || row.ID || row.uuid || idx} 
                                                  onClick={() => {
                                                      set_${selectedRowState}(idVal);
                                                      ${clickActionCode ? `const idVal = row['${pkFieldName}'] || row.id || row.ID || idx; ${clickActionCode}` : ''}
                                                  }}
                                                  ${dblclickActionCode ? `onDoubleClick={() => {
                                                      const idVal = row['${pkFieldName}'] || row.id || row.ID || idx;
                                                      ${dblclickActionCode}
                                                  }}` : ''}
                                                  className={\`hover:bg-slate-50 dark:hover:bg-slate-700/50 cursor-pointer transition select-none \${${selectedRowState} === idVal ? 'bg-blue-50/50 dark:bg-blue-900/20' : ''}\`}
                                              >
                                                  ${bodyCells}
                                              </tr>
                                          );
                                      })}
                                  </tbody>
                              </table>
                          </div>

                          {/* Pagination Footer */}
                          {${totalItems} > 0 && (
                              <div className="flex flex-col sm:flex-row items-center justify-between border-t border-slate-100 dark:border-slate-700 pt-3 px-1 gap-2 text-xs text-slate-500 dark:text-slate-400 select-none">
                                  <div>
                                      Zeige <span className="font-semibold text-slate-700 dark:text-slate-300">{${startIndex} + 1}</span> bis <span className="font-semibold text-slate-700 dark:text-slate-300">{${endIndex}}</span> von <span className="font-semibold text-slate-700 dark:text-slate-300">{${totalItems}}</span> Einträgen
                                  </div>
                                  <div className="flex items-center gap-1.5">
                                      <button 
                                          onClick={() => set_${pageState}(1)} 
                                          disabled={${pageState} <= 1}
                                          className="px-2 py-1 border dark:border-slate-700 rounded bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 disabled:opacity-50 transition"
                                      >
                                          Erste
                                      </button>
                                      <button 
                                          onClick={() => set_${pageState}(p => Math.max(1, p - 1))} 
                                          disabled={${pageState} <= 1}
                                          className="p-1 border dark:border-slate-700 rounded bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 disabled:opacity-50 transition flex items-center justify-center"
                                      >
                                          <ChevronLeft size={14} />
                                      </button>
                                      <span className="px-3 py-1 font-medium text-slate-700 dark:text-slate-300 bg-slate-50 dark:bg-slate-900 border dark:border-slate-700 rounded">
                                          Seite {${pageState}} von {${totalPages}}
                                      </span>
                                      <button 
                                          onClick={() => set_${pageState}(p => Math.min(${totalPages}, p + 1))} 
                                          disabled={${pageState} >= ${totalPages}}
                                          className="p-1 border dark:border-slate-700 rounded bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 disabled:opacity-50 transition flex items-center justify-center"
                                      >
                                          <ChevronRight size={14} />
                                      </button>
                                      <button 
                                          onClick={() => set_${pageState}(${totalPages})} 
                                          disabled={${pageState} >= ${totalPages}}
                                          className="px-2 py-1 border dark:border-slate-700 rounded bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 disabled:opacity-50 transition"
                                      >
                                          Letzte
                                      </button>
                                  </div>
                              </div>
                          )}
                      </div>
                  )}
              </div>`;
};
