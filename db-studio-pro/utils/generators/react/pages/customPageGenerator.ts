import { CustomPage, Table, Query, Form, VirtualFile } from '../../../../types/index';
import { toCamelCase, toPascalCase, toSubformSuffix } from '../../common';
import { GeneratorContext } from './custom/types';
import { generateSimpleNode, compilePlaceholders } from './custom/simpleNodeGenerator';
import { generateDropdownNode } from './custom/dropdownNodeGenerator';
import { generateTableViewNode } from './custom/tableViewNodeGenerator';
import { generateCustomComponentNode } from './custom/customComponentNodeGenerator';
import { generateSubformNode } from './custom/subformNodeGenerator';
import { generateWidgetNode } from './custom/widgetNodeGenerator';
import { collectLookups, generateJsxForLayout } from '../layoutHelper';

export const generateCustomPage = (
  page: CustomPage,
  tables: Table[],
  queries: Query[],
  forms: Form[],
  root: string,
  pages: CustomPage[],
  customComponents: any[] = []
): VirtualFile => {
  const compName = `${toPascalCase(page.name)}Page`;
  
  const nodeNameCache = new Map<string, string>();
  const usedSuffixes = new Set<string>();

  const getCleanSuffix = (node: any, defaultPrefix = 'node'): string => {
      const nodeId = node.id || 'unknown';
      if (nodeNameCache.has(nodeId)) {
          return nodeNameCache.get(nodeId)!;
      }

      let cleanName = defaultPrefix;
      if (node.props?.dataSourceType === 'table' && node.props?.dataSourceId) {
          const tObj = tables.find(t => t.id === node.props.dataSourceId);
          if (tObj) cleanName = tObj.name;
      } else if (node.props?.dataSourceType === 'query' && node.props?.dataSourceId) {
          const qObj = queries.find(q => q.id === node.props.dataSourceId);
          if (qObj) cleanName = qObj.name;
      }
      cleanName = cleanName.replace(/[^a-zA-Z0-9]/g, '_');
      
      let baseName = toCamelCase(cleanName);
      if (!baseName) {
          baseName = defaultPrefix;
      }
      
      let finalSuffix = baseName;
      let counter = 2;
      while (usedSuffixes.has(finalSuffix)) {
          finalSuffix = `${baseName}_${counter}`;
          counter++;
      }
      
      usedSuffixes.add(finalSuffix);
      nodeNameCache.set(nodeId, finalSuffix);
      return finalSuffix;
  };
  
  const states: string[] = [];
  const effects: string[] = [];
  const imports = new Set<string>(['React', 'useEffect', 'useState']);
  const pageModals: string[] = [];

  const generateNode = (node: any, ctx: GeneratorContext): string => {
      if (!node) return '';
      
      const evaluateBaseNode = (node: any, ctx: GeneratorContext): string => {
          switch(node.type) {
              case 'container': {
                  const hasDataSource = !!node.props?.dataSourceId;
                  if (hasDataSource) {
                      const suffix = getCleanSuffix(node, 'container');
                      const stateName = `data_${suffix}`;
                      const loadingState = `loading_${suffix}`;
                      const paginatedName = `finalData_${suffix}`;
                      const containerContext = `containerContext_${suffix}`;
    
                      states.push(`const [${stateName}, set_${stateName}] = useState<any[]>([]);`);
                      states.push(`const [${loadingState}, set_${loadingState}] = useState(false);`);
    
                      let fetchUrl = '';
                      if (node.props?.dataSourceType === 'table' && node.props?.dataSourceId) {
                          const tObj = tables.find(t => t.id === node.props.dataSourceId);
                          if (tObj) fetchUrl = `${toPascalCase(tObj.name)}`;
                      } else if (node.props?.dataSourceType === 'query' && node.props?.dataSourceId) {
                          const qObj = queries.find(q => q.id === node.props.dataSourceId);
                          if (qObj) fetchUrl = `queries/${toCamelCase(qObj.name)}`;
                      }
    
                      if (fetchUrl) {
                          imports.add('get');
                          effects.push(`
      useEffect(() => {
        const fetchData = async () => {
          try {
            set_${loadingState}(true);
            const params = Object.fromEntries(searchParams.entries());
            const res = await get<any>('${fetchUrl}', { pageSize: 10000, ...params });
            const items = Array.isArray(res) ? res : (res?.data || res?.Data || res?.items || res?.Items || []);
            set_${stateName}(items);
          } catch (err) {
            console.error(err);
          } finally {
            set_${loadingState}(false);
          }
        };
        fetchData();
      }, [searchParams]);`);
                      }
    
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
    
                      effects.push(`
      const ${paginatedName} = useMemo(() => {
        let items = ${stateName};
        ${filterSnippet}
        return items;
      }, [${stateName}, searchParams]);`);
    
                      effects.push(`
      const ${containerContext} = useMemo(() => {
        return ${paginatedName} && ${paginatedName}.length > 0 ? ${paginatedName}[0] : null;
      }, [${paginatedName}]);`);
    
                      const innerCtx = { ...ctx, currentContextVar: containerContext };
                      const childrenStr = (node.children || []).map((c: any) => generateNode(c, innerCtx)).join('\n');
                      const classNameStr = node.props?.className || '';
                      const styleStr = JSON.stringify(node.props?.style || {});
    
                      return `
                      <div className="${classNameStr || 'p-4 border rounded'}" style={${styleStr}}>
                          {${loadingState} ? (
                              <div className="flex items-center justify-center p-4"><Loader2 className="animate-spin text-indigo-500" /></div>
                          ) : (
                              <React.Fragment>
                                  ${childrenStr}
                              </React.Fragment>
                          )}
                      </div>`;
                  } else {
                      return generateSimpleNode(node, ctx);
                  }
              }
          case 'text':
          case 'button':
          case 'divider':
          case 'image':
          case 'html':
              return generateSimpleNode(node, ctx);
              
          case 'dropdown':
              return generateDropdownNode(node, ctx);
              
          case 'table_view':
              return generateTableViewNode(node, ctx);
              
          case 'custom_component':
              return generateCustomComponentNode(node, ctx);
              
          case 'subform':
              return generateSubformNode(node, ctx);

          case 'grid_layout':
          case 'tabs_container':
          case 'stat_card':
          case 'kpi_widget':
          case 'alert_box':
          case 'badge_pill':
          case 'action_group':
          case 'search_filter_bar':
              return generateWidgetNode(node, ctx);

          case 'row': {
              const childrenStr = (node.children || []).map((c: any) => generateNode(c, ctx)).join('\n');
              return `<div className="w-full flex flex-row gap-4 items-start justify-start flex-wrap">${childrenStr}</div>`;
          }
          case 'column': {
              const childrenStr = (node.children || []).map((c: any) => generateNode(c, ctx)).join('\n');
              return `<div className="flex flex-col gap-4 items-stretch justify-start flex-1">${childrenStr}</div>`;
          }
          case 'card': {
              const childrenStr = (node.children || []).map((c: any) => generateNode(c, ctx)).join('\n');
              const titleHtml = node.props?.title 
                ? `<div className="px-4 py-3 border-b border-slate-200 bg-slate-50 font-medium text-slate-800">{${compilePlaceholders(node.props.title, ctx.currentContextVar)}}</div>` 
                : '';
              return `
              <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden">
                  ${titleHtml}
                  <div className="p-4">
                      ${childrenStr}
                  </div>
              </div>`;
          }
          case 'list_repeater': {
              const suffix = getCleanSuffix(node, 'repeater');
              const stateName = `data_${suffix}`;
              const loadingState = `loading_${suffix}`;
              const paginatedName = `finalData_${suffix}`;

              states.push(`const [${stateName}, set_${stateName}] = useState<any[]>([]);`);
              states.push(`const [${loadingState}, set_${loadingState}] = useState(false);`);

              let fetchUrl = '';
              if (node.props?.dataSourceType === 'table' && node.props?.dataSourceId) {
                  const tObj = tables.find(t => t.id === node.props.dataSourceId);
                  if (tObj) fetchUrl = `${toPascalCase(tObj.name)}`;
              } else if (node.props?.dataSourceType === 'query' && node.props?.dataSourceId) {
                  const qObj = queries.find(q => q.id === node.props.dataSourceId);
                  if (qObj) fetchUrl = `queries/${toCamelCase(qObj.name)}`;
              }

              if (fetchUrl) {
                  imports.add('get');
                  effects.push(`
  useEffect(() => {
    const fetchData = async () => {
      try {
        set_${loadingState}(true);
        const params = Object.fromEntries(searchParams.entries());
        const res = await get<any>('${fetchUrl}', { pageSize: 10000, ...params });
        const items = Array.isArray(res) ? res : (res?.data || res?.Data || res?.items || res?.Items || []);
        set_${stateName}(items);
      } catch (err) {
        console.error(err);
      } finally {
        set_${loadingState}(false);
      }
    };
    fetchData();
  }, [searchParams]);`);
              }

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

              effects.push(`
  const ${paginatedName} = useMemo(() => {
    let items = ${stateName};
    ${filterSnippet}
    return items;
  }, [${stateName}, searchParams]);`);

              const rowVar = `row_${suffix}`;
              const innerCtx = { ...ctx, currentContextVar: rowVar };
              const childrenStr = (node.children || []).map((c: any) => generateNode(c, innerCtx)).join('\n');
              const classNameStr = node.props?.className || 'space-y-4';
              const styleStr = JSON.stringify(node.props?.style || {});

              return `
              <div className="${classNameStr}" style={${styleStr}}>
                  {${loadingState} ? (
                      <div className="flex items-center justify-center p-4"><Loader2 className="animate-spin text-indigo-500" /></div>
                  ) : (
                      <>
                          {${paginatedName}.map((${rowVar}, idx_${suffix}) => (
                              <div key={idx_${suffix}} className="bg-slate-50/50 p-4 rounded-lg border border-slate-200 relative hover:border-slate-300 hover:bg-slate-50 transition">
                                  ${childrenStr}
                              </div>
                          ))}
                          {!${loadingState} && ${paginatedName}.length === 0 && (
                              <div className="text-center p-4 text-xs text-slate-400 italic">Keine Einträge für Repeater</div>
                          )}
                      </>
                  )}
              </div>`;
          }
          case 'form_view': {
              const formId = node.props?.formId;
              const fObj = forms.find(f => f.id === formId);
              if (!fObj) {
                  return `<div className="p-4 border border-dashed border-slate-200 rounded text-slate-400 italic">Kein Formular ausgewählt</div>`;
              }
              const tObj = tables.find(t => t.id === fObj.sourceId);
              if (!tObj) {
                  return `<div className="p-4 border border-dashed border-red-200 rounded text-red-500 italic">Tabelle für Formular nicht gefunden</div>`;
              }

              const suffix = getCleanSuffix(node, 'form');
              const stateName = `formData_${suffix}`;
              const loadingState = `formLoading_${suffix}`;
              const savingState = `formSaving_${suffix}`;
              const statusState = `formStatus_${suffix}`; // 'idle' | 'success' | 'error'
              
              states.push(`const [${stateName}, set_${stateName}] = useState<any>({});`);
              states.push(`const [${loadingState}, set_${loadingState}] = useState(false);`);
              states.push(`const [${savingState}, set_${savingState}] = useState(false);`);
              states.push(`const [${statusState}, set_${statusState}] = useState<{ type: 'success' | 'error' | null; message: string }>({ type: null, message: '' });`);

              // Fields to render
              const formFields = tObj.fields.filter(f => !f.isAutoIncrement);
              
              // Mode: 'create' or 'edit'
              const formMode = node.props?.formMode || 'create';
              const filterField = node.props?.filterParamField;
              const filterParam = node.props?.filterParamName;

              // Register lookup states if layout is present
              const requiredModals: any[] = [];
              const lookups = fObj.layout ? collectLookups(fObj.layout, tables, queries, [], forms) : [];
              
              lookups.forEach(l => {
                  const varName = l.variableName;
                  states.push(`const [${varName}, set${toPascalCase(varName)}] = useState<any[]>([]);`);
                  effects.push(`
  useEffect(() => {
    const loadLookup = async () => {
      try {
        const res = await get<any>('${l.endpoint}', { pageSize: 10000 });
        set${toPascalCase(varName)}(Array.isArray(res) ? res : (res?.data || []));
      } catch (err) {
        console.error(err);
      }
    };
    loadLookup();
  }, []);`);
              });

              // Initial defaults & loading logic
              const defaultFields: string[] = [];
              tObj.fields.forEach(f => {
                  const fCamel = toCamelCase(f.name);
                  if (f.defaultValue !== undefined && f.defaultValue !== null && f.defaultValue !== '') {
                      if (f.type === 'BOOLEAN') {
                          defaultFields.push(`${fCamel}: ${f.defaultValue.toLowerCase() === 'true' || f.defaultValue === '1'}`);
                      } else if (f.type === 'INTEGER' || f.type === 'DECIMAL' || f.type === 'DOUBLE') {
                          defaultFields.push(`${fCamel}: ${f.defaultValue}`);
                      } else {
                          defaultFields.push(`${fCamel}: "${f.defaultValue.replace(/"/g, '\\"')}"`);
                      }
                  }
              });

              // We also want to support pre-filling from parameters
              effects.push(`
  useEffect(() => {
    const initForm = async () => {
      set_${statusState}({ type: null, message: '' });
      let initialData: any = { ${defaultFields.join(', ')} };
      
      // Filter parameter pre-filling
      ${filterField && filterParam ? `
      const filterVal = searchParams.get('${filterParam}');
      if (filterVal) {
        initialData.${toCamelCase(filterField)} = isNaN(Number(filterVal)) ? filterVal : Number(filterVal);
      }
      ` : ''}

      // If in edit mode, fetch the record
      ${formMode === 'edit' ? `
      const editId = searchParams.get('selectedId') || searchParams.get('${filterParam || 'id'}');
      if (editId && editId !== 'new') {
        set_${loadingState}(true);
        try {
          const res = await get<any>('${toPascalCase(tObj.name)}/' + editId);
          initialData = { ...initialData, ...(res.data || res) };
        } catch (err) {
          console.error(err);
          set_${statusState}({ type: 'error', message: 'Fehler beim Laden des Datensatzes' });
        } finally {
          set_${loadingState}(false);
        }
      }
      ` : ''}

      set_${stateName}(initialData);
    };
    initForm();
  }, [searchParams]);`);

              // Form submission logic
              const handleSubmitFunc = `handleSubmit_${suffix}`;
              effects.push(`
  const ${handleSubmitFunc} = async (e: React.FormEvent) => {
    e.preventDefault();
    set_${savingState}(true);
    set_${statusState}({ type: null, message: '' });
    try {
      const editId = searchParams.get('selectedId') || searchParams.get('${filterParam || 'id'}');
      const isEdit = ${formMode === 'edit'} && editId && editId !== 'new';
      
      let payload = { ...${stateName} };
      
      if (isEdit) {
        await put('${toPascalCase(tObj.name)}/' + editId, payload);
        set_${statusState}({ type: 'success', message: 'Datensatz erfolgreich aktualisiert!' });
      } else {
        await post('${toPascalCase(tObj.name)}', payload);
        set_${statusState}({ type: 'success', message: 'Datensatz erfolgreich erstellt!' });
        // Reset form to defaults in create mode
        set_${stateName}({ ${defaultFields.join(', ')} });
      }
    } catch (err) {
      console.error(err);
      set_${statusState}({ type: 'error', message: 'Fehler beim Speichern des Datensatzes' });
    } finally {
      set_${savingState}(false);
    }
  };`);

              // Let's generate the fields JSX
              let fieldsJsx = '';
              if (fObj.layout) {
                  // Generate layout fields
                  fieldsJsx = generateJsxForLayout(fObj.layout, tables, forms, stateName, requiredModals, queries);

                  // Alias setData to set_stateName for onChange handlers generated by layoutHelper
                  if (!states.some(s => s.includes('const setData ='))) {
                      states.push(`const setData = (newDataOrFn: any) => set_${stateName}(newDataOrFn);`);
                  }

                  // Register UX Rules helpers
                  const uxRulesJson = JSON.stringify(fObj.crossFieldValidations || []);
                  states.push(`const UXRules_${suffix}: any[] = ${uxRulesJson};`);
                  states.push(`const evaluateUXRule_${suffix} = (rule: any, currentData: any) => {
                      if (!currentData) return false;
                      const val = currentData[rule.triggerFieldId];
                      if(rule.condition === 'equals') return String(val) === String(rule.triggerValue);
                      if(rule.condition === 'not_equals') return String(val) !== String(rule.triggerValue);
                      if(rule.condition === 'greater_than') return Number(val) > Number(rule.triggerValue);
                      if(rule.condition === 'less_than') return Number(val) < Number(rule.triggerValue);
                      if(rule.condition === 'not_empty') return val !== undefined && val !== null && val !== '';
                      if(rule.condition === 'is_empty') return val === undefined || val === null || val === '';
                      if(rule.condition === 'is_true') return !!val === true;
                      if(rule.condition === 'is_false') return !!val === false;
                      return false;
                  };`);
                  if (!states.some(s => s.includes('const isFieldRequired ='))) {
                      states.push(`const isFieldRequired = (fieldId: string) => (UXRules_${suffix} || []).some((r: any) => r.targetFieldId === fieldId && r.action === 'require' && evaluateUXRule_${suffix}(r, ${stateName}));`);
                      states.push(`const isFieldHidden = (fieldId: string) => (UXRules_${suffix} || []).some((r: any) => r.targetFieldId === fieldId && r.action === 'hide' && evaluateUXRule_${suffix}(r, ${stateName}));`);
                      states.push(`const isFieldDisabled = (fieldId: string) => (UXRules_${suffix} || []).some((r: any) => r.targetFieldId === fieldId && r.action === 'disable' && evaluateUXRule_${suffix}(r, ${stateName}));`);
                  }

                  if (requiredModals.length > 0) {
                      if (!states.some(s => s.includes('const [modals, setModals]'))) {
                          states.push(`const [modals, setModals] = useState<Record<string, boolean>>({});`);
                          states.push(`const toggleModal = (id: string, state: boolean) => setModals(prev => ({...prev, [id]: state}));`);
                      }

                      requiredModals.forEach(m => {
                          if (m.type === 'subform') {
                              const camelChild = toCamelCase(m.table.name);
                              const subSuffix = toSubformSuffix(m.id);
                              const listVar = `${camelChild}SubList_${subSuffix}`;
                              const childTableCamel = toCamelCase(m.table.name);
                              const childTablePascal = toPascalCase(m.table.name);

                              const masterFieldObj = tObj.fields.find((f: any) => f.id === m.masterField || f.name === m.masterField);
                              const masterFieldName = masterFieldObj ? masterFieldObj.name : (m.masterFieldName || m.masterField || 'id');
                              const masterFieldCamel = toCamelCase(masterFieldName);
                              const masterFieldPascal = toPascalCase(masterFieldName);

                              const childFieldObj = m.table.fields.find((f: any) => f.id === m.childField || f.name === m.childField);
                              const childFieldName = childFieldObj ? childFieldObj.name : (m.childFieldName || m.childField || 'id');
                              const childFieldCamel = toCamelCase(childFieldName);
                              const childFieldPascal = toPascalCase(childFieldName);

                              if (!states.some(s => s.includes(`const [${listVar},`))) {
                                  states.push(`const [${listVar}, set${toPascalCase(listVar)}] = useState<any[]>([]);`);
                                  states.push(`const [${listVar}_editingId, set${toPascalCase(listVar)}_editingId] = useState<any>(null);`);
                                  states.push(`const [${listVar}_subData, set${toPascalCase(listVar)}_subData] = useState<any>({});`);

                                  states.push(`const editSubformItem_${subSuffix} = (item: any) => {
                                      set${toPascalCase(listVar)}_editingId(item.id || item.Id || item.ID);
                                      const normalizedItem: any = { ...item };
                                      ${m.table.fields.map((f: any) => {
                                          const cName = toCamelCase(f.name);
                                          const pName = toPascalCase(f.name);
                                          return `if (normalizedItem['${cName}'] === undefined) normalizedItem['${cName}'] = item['${f.name}'] ?? item['${pName}'];`;
                                      }).join('\n                                      ')}
                                      set${toPascalCase(listVar)}_subData(normalizedItem);
                                      toggleModal('${m.id}', true);
                                  };`);

                                  states.push(`const deleteSubformItem_${subSuffix} = async (item: any) => {
                                      if (!window.confirm('Möchten Sie diesen Eintrag wirklich löschen?')) return;
                                      const itemId = item.id || item.Id || item.ID;
                                      try {
                                          await del('${childTableCamel}', itemId);
                                          set${toPascalCase(listVar)}(prev => prev.filter(x => (x.id || x.Id || x.ID) !== itemId));
                                      } catch (err) {
                                          alert('Fehler beim Löschen');
                                      }
                                  };`);
                                  imports.add('del');

                                  effects.push(`
  useEffect(() => {
    const fetchSubData_${subSuffix} = async () => {
      const masterVal = ${stateName}?.['${masterFieldCamel}'] ?? ${stateName}?.['${masterFieldName}'] ?? ${stateName}?.['${masterFieldPascal}'] ?? searchParams.get('selectedId') ?? searchParams.get('${filterParam || 'id'}');
      if (!masterVal || masterVal === 'new') {
        set${toPascalCase(listVar)}([]);
        return;
      }
      try {
        const subRes = await get<any>('${childTablePascal}', { pageSize: 10000 });
        const allSubItems = Array.isArray(subRes) ? subRes : (subRes?.data || subRes?.Data || subRes?.items || []);
        set${toPascalCase(listVar)}(allSubItems.filter((x: any) => {
          const childVal = x?.['${childFieldCamel}'] ?? x?.['${childFieldName}'] ?? x?.['${childFieldPascal}'] ?? x?.['${m.childField}'];
          return childVal !== undefined && childVal !== null && String(childVal) === String(masterVal);
        }));
      } catch (err) {
        console.error('Error loading subform data:', err);
      }
    };
    fetchSubData_${subSuffix}();
  }, [${stateName}?.['${masterFieldCamel}'], ${stateName}?.['${masterFieldName}'], searchParams]);`);
                              }
                          }

                          if (m.type === 'lookup' || m.type === 'subform') {
                              imports.add('Modal');
                          }
                          if (m.type === 'user-picker') {
                              imports.add('UserPickerModal');
                          }

                          let modalJsx = '';
                          if (m.type === 'lookup') {
                              const fields = m.table.fields.filter((f: any) => !f.isAutoIncrement).map((f: any) => {
                                  const label = f.name;
                                  const name = toCamelCase(f.name);
                                  let input = `<input name="${name}" className="w-full border p-2 rounded text-slate-800 dark:text-white bg-white dark:bg-slate-700 dark:border-slate-600" />`;
                                  if (f.type === 'BOOLEAN') input = `<div className="flex items-center gap-2 mt-2"><input type="checkbox" name="${name}" value="true" className="w-4 h-4" /> <span className="text-sm">Aktivieren</span></div>`;
                                  else if (f.type === 'INTEGER' || f.type === 'DECIMAL' || f.type === 'DOUBLE') input = `<input type="number" name="${name}" className="w-full border p-2 rounded text-slate-800 dark:text-white bg-white dark:bg-slate-700 dark:border-slate-600" step="${f.type === 'INTEGER' ? '1' : '0.01'}" />`;
                                  else if (f.type === 'DATE') input = `<input type="date" name="${name}" className="w-full border p-2 rounded text-slate-800 dark:text-white bg-white dark:bg-slate-700 dark:border-slate-600" />`;
                                  else if (f.type === 'TIME') input = `<input type="time" name="${name}" className="w-full border p-2 rounded text-slate-800 dark:text-white bg-white dark:bg-slate-700 dark:border-slate-600" />`;
                                  else if (f.type === 'DATETIME' || f.type === 'TIMESTAMP') input = `<input type="datetime-local" name="${name}" className="w-full border p-2 rounded text-slate-800 dark:text-white bg-white dark:bg-slate-700 dark:border-slate-600" />`;
                                  return `<div className="mb-3"><label className="block text-sm font-bold mb-1 text-slate-700 dark:text-slate-300">${label}</label>${input}</div>`;
                              }).join('');
                              
                              modalJsx = `<Modal isOpen={modals['${m.id}']} onClose={() => toggleModal('${m.id}', false)} title="Neu: ${m.table.name}"><form onSubmit={async (e) => { e.preventDefault(); const formData = new FormData(e.currentTarget); const payload: any = {}; formData.forEach((value, key) => { if(value==='true') payload[key]=true; else if(value==='false') payload[key]=false; else payload[key]=value; }); try { await post('${toCamelCase(m.table.name)}', payload); const res = await get('${toCamelCase(m.table.name)}', { pageSize: 10000 }); set${toPascalCase(toCamelCase(m.table.name))}List(res.data || res); toggleModal('${m.id}', false); } catch (err) { alert('Fehler'); } }}><div className="space-y-2">${fields}</div><div className="mt-6 flex justify-end gap-2"><button type="button" onClick={() => toggleModal('${m.id}', false)} className="px-4 py-2 border rounded text-slate-600 dark:text-slate-300 dark:border-slate-600">Abbrechen</button><button className="bg-blue-600 text-white px-4 py-2 rounded font-bold hover:bg-blue-700">Speichern</button></div></form></Modal>`;
                          } else if (m.type === 'subform') {
                              const childTablePascal = toPascalCase(m.table.name);
                              const childTableCamel = toCamelCase(m.table.name);
                              const childFieldObj = m.table.fields.find((f: any) => f.id === m.childField || f.name === m.childField);
                              const childFieldName = childFieldObj ? childFieldObj.name : (m.childFieldName || m.childField || 'id');
                              const childFieldCamel = toCamelCase(childFieldName);
                              const childFieldPascal = toPascalCase(childFieldName);

                              const masterFieldObj = tObj.fields.find((f: any) => f.id === m.masterField || f.name === m.masterField);
                              const masterFieldName = masterFieldObj ? masterFieldObj.name : (m.masterFieldName || m.masterField || 'id');
                              const masterFieldCamel = toCamelCase(masterFieldName);
                              const masterFieldPascal = toPascalCase(masterFieldName);

                              const subSuffix = toSubformSuffix(m.id);
                              const listVar = `${childTableCamel}SubList_${subSuffix}`;

                              const fieldsJsx = m.table.fields.filter((f: any) => !f.isPrimaryKey && !f.isAutoIncrement && f.id !== m.childField && f.name !== m.childField && toCamelCase(f.name) !== childFieldCamel).map((f: any) => {
                                  const label = f.name;
                                  const name = toCamelCase(f.name);
                                  let input = `<input value={${listVar}_subData['${name}'] || ''} onChange={(e) => set${toPascalCase(listVar)}_subData((prev: any) => ({ ...prev, ${name}: e.target.value }))} className="w-full border p-2 rounded text-sm text-slate-800 dark:text-white bg-white dark:bg-slate-700 dark:border-slate-600" />`;
                                  if (f.type === 'BOOLEAN') input = `<div className="flex items-center gap-2 mt-2"><input type="checkbox" checked={!!${listVar}_subData['${name}']} onChange={(e) => set${toPascalCase(listVar)}_subData((prev: any) => ({ ...prev, ${name}: e.target.checked }))} className="w-4 h-4" /> <span className="text-sm">Aktivieren</span></div>`;
                                  else if (f.type === 'INTEGER' || f.type === 'DECIMAL' || f.type === 'DOUBLE') input = `<input type="number" value={${listVar}_subData['${name}'] ?? ''} onChange={(e) => set${toPascalCase(listVar)}_subData((prev: any) => ({ ...prev, ${name}: e.target.value === '' ? '' : Number(e.target.value) }))} className="w-full border p-2 rounded text-sm text-slate-800 dark:text-white bg-white dark:bg-slate-700 dark:border-slate-600" step="${f.type === 'INTEGER' ? '1' : '0.01'}" />`;
                                  else if (f.type === 'DATE') input = `<input type="date" value={${listVar}_subData['${name}'] || ''} onChange={(e) => set${toPascalCase(listVar)}_subData((prev: any) => ({ ...prev, ${name}: e.target.value }))} className="w-full border p-2 rounded text-sm text-slate-800 dark:text-white bg-white dark:bg-slate-700 dark:border-slate-600" />`;
                                  return `<div className="mb-3"><label className="block text-xs font-bold mb-1 text-slate-700 dark:text-slate-300">${label}</label>${input}</div>`;
                              }).join('');

                              modalJsx = `<Modal isOpen={modals['${m.id}']} onClose={() => { toggleModal('${m.id}', false); set${toPascalCase(listVar)}_editingId(null); set${toPascalCase(listVar)}_subData({}); }} title={${listVar}_editingId ? "Eintrag bearbeiten" : "Eintrag hinzufügen"}><form onSubmit={async (e) => { e.preventDefault(); const editId = ${stateName}?.['${masterFieldCamel}'] ?? ${stateName}?.['${masterFieldName}'] ?? ${stateName}?.['${masterFieldPascal}'] ?? searchParams.get('selectedId') ?? searchParams.get('${filterParam || 'id'}'); if (!editId || editId === 'new') { alert('Bitte erst Hauptdatensatz speichern.'); return; } const payload = { ...${listVar}_subData, ${childFieldCamel}: editId, ['${childFieldName}']: editId }; try { if (${listVar}_editingId) { await put('${childTableCamel}', ${listVar}_editingId, payload); } else { await post('${childTableCamel}', payload); } const subRes = await get('${childTablePascal}', { search: '', pageSize: 10000 }); const allSubItems = subRes.data || subRes || []; set${toPascalCase(listVar)}(allSubItems.filter((x: any) => { const childVal = x?.['${childFieldCamel}'] ?? x?.['${childFieldName}'] ?? x?.['${childFieldPascal}'] ?? x?.['${m.childField}']; return childVal !== undefined && childVal !== null && String(childVal) === String(editId); })); toggleModal('${m.id}', false); set${toPascalCase(listVar)}_editingId(null); set${toPascalCase(listVar)}_subData({}); } catch (err) { alert('Fehler beim Speichern'); } }}><div className="space-y-2">${fieldsJsx}</div><div className="mt-6 flex justify-end gap-2"><button type="button" onClick={() => { toggleModal('${m.id}', false); set${toPascalCase(listVar)}_editingId(null); set${toPascalCase(listVar)}_subData({}); }} className="px-4 py-2 border rounded text-slate-600 dark:text-slate-300 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-700 text-sm">Abbrechen</button><button className="bg-blue-600 text-white px-4 py-2 rounded font-bold hover:bg-blue-700 text-sm">Speichern</button></div></form></Modal>`;
                          } else if (m.type === 'user-picker') {
                              modalJsx = `<UserPickerModal isOpen={modals['${m.id}']} initialTab="${m.mode}" onSelect={(username, displayName) => { set_${stateName}(prev => ({ ...prev, ${m.targetField}: username })); toggleModal('${m.id}', false); }} onClose={() => toggleModal('${m.id}', false)} />`;
                          }
                          if (modalJsx && !pageModals.includes(modalJsx)) pageModals.push(modalJsx);
                      });
                  }
              } else {
                  // Fallback to auto fields
                  fieldsJsx = formFields.map(f => {
                      const fCamel = toCamelCase(f.name);
                      const label = f.comment || f.name;
                      let input = '';
                      if (f.type === 'BOOLEAN') {
                          input = `
                          <div className="flex items-center gap-2 mt-2">
                              <input 
                                  type="checkbox" 
                                  id="${fCamel}_${suffix}"
                                  checked={!!${stateName}.${fCamel}} 
                                  onChange={e => set_${stateName}({ ...${stateName}, ${fCamel}: e.target.checked })}
                                  className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 border-slate-300 dark:border-slate-600 dark:bg-slate-700" 
                              />
                              <label htmlFor="${fCamel}_${suffix}" className="text-sm font-medium text-slate-700 dark:text-slate-300">${label}</label>
                          </div>`;
                      } else if (f.type === 'INTEGER' || f.type === 'DECIMAL' || f.type === 'DOUBLE') {
                          input = `
                          <label className="block text-sm font-semibold mb-1 text-slate-700 dark:text-slate-300">${label}</label>
                          <input 
                              type="number" 
                              value={${stateName}.${fCamel} ?? ''} 
                              onChange={e => set_${stateName}({ ...${stateName}, ${fCamel}: e.target.value === '' ? null : Number(e.target.value) })}
                              className="w-full border rounded-lg p-2 bg-white dark:bg-slate-800 dark:border-slate-700 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none" 
                              step="${f.type === 'INTEGER' ? '1' : 'any'}"
                          />`;
                      } else if (f.type === 'DATE') {
                          input = `
                          <label className="block text-sm font-semibold mb-1 text-slate-700 dark:text-slate-300">${label}</label>
                          <input 
                              type="date" 
                              value={${stateName}.${fCamel} ? String(${stateName}.${fCamel}).split('T')[0] : ''} 
                              onChange={e => set_${stateName}({ ...${stateName}, ${fCamel}: e.target.value })}
                              className="w-full border rounded-lg p-2 bg-white dark:bg-slate-800 dark:border-slate-700 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none" 
                          />`;
                      } else {
                          input = `
                          <label className="block text-sm font-semibold mb-1 text-slate-700 dark:text-slate-300">${label}</label>
                          <input 
                              type="text" 
                              value={${stateName}.${fCamel} ?? ''} 
                              onChange={e => set_${stateName}({ ...${stateName}, ${fCamel}: e.target.value })}
                              className="w-full border rounded-lg p-2 bg-white dark:bg-slate-800 dark:border-slate-700 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none" 
                          />`;
                      }
                      return `<div className="mb-4">${input}</div>`;
                  }).join('\n');
              }

              imports.add('post');
              imports.add('put');
              imports.add('get');

              return `
              <div className="bg-slate-50 dark:bg-slate-900/40 border border-slate-200 dark:border-slate-700 rounded-xl p-6 mb-6 text-start">
                  ${node.props?.hideHeader ? '' : `
                  <div className="mb-6 border-b border-slate-100 dark:border-slate-800 pb-4">
                      <h3 className="text-xl font-bold text-slate-800 dark:text-white">${fObj.name}</h3>
                      <p className="text-sm text-slate-500">{${formMode === 'edit'} ? 'Eintrag bearbeiten' : 'Neuen Eintrag erstellen'}</p>
                  </div>
                  `}

                  {${statusState}.type && (
                      <div className={\`p-4 mb-6 rounded-lg text-sm font-medium \${${statusState}.type === 'success' ? 'bg-emerald-50 text-emerald-800 border border-emerald-100' : 'bg-rose-50 text-rose-800 border border-rose-100'}\`}>
                          {${statusState}.message}
                      </div>
                  )}

                  {${loadingState} ? (
                      <div className="flex items-center justify-center p-8"><Loader2 className="animate-spin text-indigo-500" /></div>
                  ) : (
                      <form onSubmit={${handleSubmitFunc}} className="space-y-4">
                          ${fieldsJsx}
                          
                          ${node.props?.hideActions ? '' : `
                          <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-slate-100 dark:border-slate-800">
                              <button 
                                  type="submit" 
                                  disabled={${savingState}}
                                  className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-6 rounded-lg transition-colors flex items-center gap-2 disabled:opacity-50 cursor-pointer"
                              >
                                  {${savingState} && <Loader2 className="animate-spin w-4 h-4" />}
                                  Speichern
                              </button>
                          </div>
                          `}
                      </form>
                  )}
              </div>
              `;
          }
          case 'navbar': {
              return `
                <div className={"w-full flex items-center justify-between p-4 bg-white border-b border-slate-200 shadow-sm " + ("${node.props?.className || ''}")}>
                     <div className="font-bold text-slate-800 text-lg">${node.props?.brandName || 'BrandLogo'}</div>
                     <div className="flex gap-4 text-sm text-slate-600 font-medium">
                         <a href="#" className="hover:text-blue-600 transition-colors">Home</a>
                         <a href="#" className="hover:text-blue-600 transition-colors">Features</a>
                         <a href="#" className="hover:text-blue-600 transition-colors">Pricing</a>
                         <a href="#" className="hover:text-blue-600 transition-colors">Contact</a>
                     </div>
                 </div>
              `;
          }
          case 'hero_section': {
              return `
                 <div className={"w-full p-12 py-24 flex flex-col items-center text-center bg-gradient-to-b from-slate-50 to-white " + ("${node.props?.className || ''}")}>
                     <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight text-slate-900 mb-6">${node.props?.headline || 'Catchy Headline Here'}</h1>
                     <p className="text-lg text-slate-600 max-w-2xl mb-8">${node.props?.subheadline || 'A compelling subheadline that explains the value proposition of your product or service.'}</p>
                     <div className="flex gap-4">
                         <button className="px-6 py-3 bg-blue-600 text-white font-bold rounded-lg shadow-md hover:bg-blue-700 transition-colors">${node.props?.primaryButtonText || 'Get Started'}</button>
                         <button className="px-6 py-3 bg-white text-slate-700 font-bold border border-slate-200 rounded-lg shadow-sm hover:bg-slate-50 transition-colors">${node.props?.secondaryButtonText || 'Learn More'}</button>
                     </div>
                 </div>
              `;
          }
          case 'feature_grid': {
              return `
                 <div className={"w-full p-12 bg-white " + ("${node.props?.className || ''}")}>
                     <div className="text-center mb-12">
                         <h2 className="text-3xl font-bold text-slate-900">${node.props?.title || 'Amazing Features'}</h2>
                         <p className="text-slate-500 mt-2">${node.props?.subtitle || 'Everything you need to succeed.'}</p>
                     </div>
                     <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                         {[1, 2, 3].map(i => (
                             <div key={i} className="flex flex-col items-center text-center p-6 border border-slate-100 rounded-xl bg-slate-50 hover:shadow-md transition-shadow">
                                 <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-lg flex items-center justify-center mb-4">✨</div>
                                 <h3 className="font-bold text-lg mb-2">Feature {i}</h3>
                                 <p className="text-slate-500 text-sm">Description for this amazing feature that will help users.</p>
                             </div>
                         ))}
                     </div>
                 </div>
              `;
          }
          case 'pricing_table': {
              return `
                 <div className={"w-full p-12 bg-slate-50 " + ("${node.props?.className || ''}")}>
                     <div className="text-center mb-12">
                         <h2 className="text-3xl font-bold text-slate-900">Simple Pricing</h2>
                     </div>
                     <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
                         {['Basic', 'Pro', 'Enterprise'].map((plan, i) => (
                             <div key={plan} className={"p-8 rounded-2xl border transition-all " + (i === 1 ? 'border-blue-500 shadow-xl bg-white relative scale-105' : 'border-slate-200 bg-white shadow-sm')}>
                                 {i === 1 && <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-blue-500 text-white px-3 py-1 text-xs font-bold rounded-full">MOST POPULAR</div>}
                                 <h3 className="text-xl font-bold mb-2">{plan}</h3>
                                 <div className="text-4xl font-extrabold mb-6">$\{ (i + 1) * 19 }<span className="text-sm font-normal text-slate-500">/mo</span></div>
                                 <ul className="space-y-3 mb-8 text-sm text-slate-600">
                                     <li className="flex items-center gap-2"><svg className="w-4 h-4 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg> Feature A</li>
                                     <li className="flex items-center gap-2"><svg className="w-4 h-4 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg> Feature B</li>
                                     <li className="flex items-center gap-2"><svg className="w-4 h-4 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg> Feature C</li>
                                 </ul>
                                 <button className={"w-full py-2 rounded-lg font-bold transition-colors " + (i === 1 ? 'bg-blue-600 text-white hover:bg-blue-700' : 'bg-slate-100 text-slate-700 hover:bg-slate-200')}>Choose Plan</button>
                             </div>
                         ))}
                     </div>
                 </div>
              `;
          }
          case 'testimonial': {
              return `
                 <div className={"w-full p-12 bg-white " + ("${node.props?.className || ''}")}>
                     <div className="max-w-3xl mx-auto text-center">
                         <div className="text-4xl text-blue-500 mb-4 font-serif">"</div>
                         <p className="text-2xl font-medium text-slate-800 mb-8 italic">${node.props?.quote || 'This product completely transformed how we work. Highly recommended!'}</p>
                         <div className="flex items-center justify-center gap-3">
                             <div className="w-10 h-10 bg-slate-200 rounded-full flex items-center justify-center text-slate-500 font-bold">${(node.props?.author || 'Jane Doe').charAt(0)}</div>
                             <div className="text-left">
                                 <div className="font-bold text-slate-900">${node.props?.author || 'Jane Doe'}</div>
                                 <div className="text-sm text-slate-500">${node.props?.role || 'CEO, Company Inc'}</div>
                             </div>
                         </div>
                     </div>
                 </div>
              `;
          }
          case 'footer': {
              return `
                 <div className={"w-full p-12 bg-slate-900 text-slate-400 " + ("${node.props?.className || ''}")}>
                     <div className="flex flex-col md:flex-row justify-between items-start gap-8 border-b border-slate-800 pb-8 mb-8">
                         <div className="max-w-xs">
                             <div className="font-bold text-white text-xl mb-4">${node.props?.brandName || 'BrandLogo'}</div>
                             <p className="text-sm leading-relaxed">Making the world a better place through constructing elegant hierarchies and building amazing products.</p>
                         </div>
                         <div className="flex gap-16">
                             <div>
                                 <h4 className="text-white font-bold mb-4">Product</h4>
                                 <ul className="space-y-3 text-sm">
                                     <li><a href="#" className="hover:text-white transition-colors">Features</a></li>
                                     <li><a href="#" className="hover:text-white transition-colors">Pricing</a></li>
                                     <li><a href="#" className="hover:text-white transition-colors">Docs</a></li>
                                 </ul>
                             </div>
                             <div>
                                 <h4 className="text-white font-bold mb-4">Company</h4>
                                 <ul className="space-y-3 text-sm">
                                     <li><a href="#" className="hover:text-white transition-colors">About</a></li>
                                     <li><a href="#" className="hover:text-white transition-colors">Blog</a></li>
                                     <li><a href="#" className="hover:text-white transition-colors">Contact</a></li>
                                 </ul>
                             </div>
                         </div>
                     </div>
                     <div className="text-sm flex flex-col md:flex-row justify-between items-center gap-4">
                         <p>© {new Date().getFullYear()} Your Company. All rights reserved.</p>
                         <div className="flex gap-6">
                             <a href="#" className="hover:text-white transition-colors">Twitter</a>
                             <a href="#" className="hover:text-white transition-colors">GitHub</a>
                         </div>
                     </div>
                 </div>
              `;
          }
          case 'subpage_container': {
              const subPage = ctx.pages.find(p => p.id === node.props?.subPageId);
              if (!subPage) {
                  return `<div className="p-4 border border-dashed border-red-200 rounded text-red-500 italic">Subpage [${node.props?.subPageId || ''}] nicht gefunden</div>`;
              }
              const subpageLayoutHtml = ctx.generateNode(subPage.layout, ctx);
              return `
              <div className="w-full bg-slate-50/20 border border-dashed border-slate-200 hover:border-slate-300 rounded-lg p-3 transition relative">
                  ${subpageLayoutHtml}
              </div>`;
          }
          default:
              return `<div className="p-4 bg-slate-50 rounded border text-sm text-slate-400">${node.type} Component</div>`;
          }
      };

      let nodeHtml = evaluateBaseNode(node, ctx);

      if (node.props?.visibilityField) {
          const vField = node.props.visibilityField;
          const vOperator = node.props.visibilityOperator || '==';
          const vExpected = node.props.visibilityValue || '';
          
          let valExpr = '';
          if (ctx.currentContextVar) {
              valExpr = `(${ctx.currentContextVar}?\\['${vField}'\\] !== undefined ? String(${ctx.currentContextVar}?\\['${vField}'\\] ?? '') : (${ctx.currentContextVar}?\\['${toCamelCase(vField)}'\\] !== undefined ? String(${ctx.currentContextVar}?\\['${toCamelCase(vField)}'\\] ?? '') : String(searchParams.get('${vField}') ?? '')))`;
          } else {
              valExpr = `String(searchParams.get('${vField}') ?? '')`;
          }
          
          let cond = 'true';
          if (vOperator === '==') {
              cond = `${valExpr} === "${vExpected.replace(/"/g, '\\\\"')}"`;
          } else if (vOperator === '!=') {
              cond = `${valExpr} !== "${vExpected.replace(/"/g, '\\\\"')}"`;
          } else if (vOperator === '>') {
              cond = `parseFloat(${valExpr}) > parseFloat("${vExpected}")`;
          } else if (vOperator === '<') {
              cond = `parseFloat(${valExpr}) < parseFloat("${vExpected}")`;
          } else if (vOperator === 'contains') {
              cond = `${valExpr}.toLowerCase().includes("${vExpected.replace(/"/g, '\\\\"')}".toLowerCase())`;
          } else if (vOperator === 'not_empty') {
              cond = `${valExpr} !== '' && ${valExpr} !== 'undefined' && ${valExpr} !== 'null'`;
          } else if (vOperator === 'empty') {
              cond = `${valExpr} === '' || ${valExpr} === 'undefined' || ${valExpr} === 'null'`;
          }
          
          nodeHtml = `{(${cond}) ? (<React.Fragment>${nodeHtml}</React.Fragment>) : null}`;
      }

      return nodeHtml;
  };

  const context: GeneratorContext = {
      states,
      effects,
      imports,
      tables,
      queries,
      forms,
      pages,
      customComponents,
      generateNode
  };

  const layoutHtml = generateNode(page.layout, context);
  
  const apiMethods = new Set<string>();
  if (imports.has('get')) apiMethods.add('get');
  if (imports.has('post')) apiMethods.add('post');
  if (imports.has('put')) apiMethods.add('put');
  if (imports.has('del')) apiMethods.add('del');
  if (imports.has('remove')) apiMethods.add('remove');

  let apiImportLine = '';
  if (apiMethods.size > 0) {
      apiImportLine = `import { ${Array.from(apiMethods).join(', ')} } from '../../services/api';`;
  }

  const componentImportLines: string[] = [];
  if (imports.has('Modal')) {
      componentImportLines.push("import { Modal } from '../../components/Modal';");
  }
  if (imports.has('UserPickerModal')) {
      componentImportLines.push("import { UserPickerModal } from '../../components/UserPickerModal';");
  }

  const otherImportLines = Array.from(imports).map(imp => {
      if (['React', 'useEffect', 'useState', 'get', 'post', 'put', 'del', 'remove', 'Modal', 'UserPickerModal', 'Loader2'].includes(imp)) return '';
      if (['ResponsiveContainer', 'BarChart', 'Bar', 'LineChart', 'Line', 'AreaChart', 'Area', 'PieChart', 'Pie', 'XAxis', 'YAxis', 'CartesianGrid', 'Tooltip', 'Legend'].includes(imp)) {
        return '';
      }
      if (imp.includes('from') || imp.startsWith("'") || imp.startsWith('"')) {
        return `import ${imp};`;
      }
      return '';
  }).filter(Boolean);

  const importsStr = [apiImportLine, ...componentImportLines, ...otherImportLines].filter(Boolean).join('\n');

  // Add Recharts imports if needed
  const rechartsImports = Array.from(imports).filter(imp => 
    ['ResponsiveContainer', 'BarChart', 'Bar', 'LineChart', 'Line', 'AreaChart', 'Area', 'PieChart', 'Pie', 'XAxis', 'YAxis', 'CartesianGrid', 'Tooltip', 'Legend'].includes(imp)
  );
  
  let rechartsImportsStr = '';
  if (rechartsImports.length > 0) {
      rechartsImportsStr = `import { ${rechartsImports.join(', ')} } from 'recharts';`;
  }

  
  const content = `import React, { useEffect, useState, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Search, ArrowUpDown, ArrowUp, ArrowDown, Filter, X, Loader2, ChevronLeft, ChevronRight, Layout, Plus, User, Save, ArrowLeft, ChevronDown } from 'lucide-react';
import { exportDataToFile } from '../../utils/exportHelper';
${importsStr}\n${rechartsImportsStr}

export const ${compName} = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  ${states.join('\n  ')}

  ${effects.join('\n  ')}

  return (
    <div className="p-8 max-w-[95%] mx-auto">
        <h1 className="text-3xl font-bold dark:text-white mb-6">${page.name}</h1>
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm overflow-hidden border border-slate-200 dark:border-slate-700 p-6">
            ${layoutHtml}
        </div>
        ${pageModals.join('\n')}
    </div>
  );
};`;

  return { name: `${compName}.tsx`, path: `${root}/src/pages/custom/${compName}.tsx`, content, language: 'typescript' };
};
