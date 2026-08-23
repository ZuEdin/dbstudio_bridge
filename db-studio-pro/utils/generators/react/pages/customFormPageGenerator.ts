import { Table, Form, Query, VirtualFile } from '../../../../types/index';
import { toCamelCase, toPascalCase, toSubformSuffix } from '../../common';
import { collectLookups, generateJsxForLayout } from '../layoutHelper';

const getFormParametersFromQuery = (query: any): { formName: string; fieldName: string; paramName: string }[] => {
    const params: { formName: string; fieldName: string; paramName: string }[] = [];
    if (query && query.type === 'SELECT') {
        query.columns?.forEach((c: any) => {
            c.criteria?.forEach((cr: any) => {
                if (cr) {
                    const match = cr.match(/(?:\[?Forms\]?!\s*\[?([^!\]]+)\]?!\s*\[?([^!\]\s]+)\]?)/i);
                    if (match && match.length >= 3) {
                        const formName = match[1].toLowerCase();
                        const fieldName = match[2].toLowerCase();
                        const paramName = `form_${formName}_${fieldName}`;
                        if (!params.some(p => p.paramName === paramName)) {
                            params.push({ formName, fieldName, paramName });
                        }
                    }
                }
            });
        });
    }
    return params;
};

export const generateCustomFormPage = (
  form: Form,
  tables: Table[],
  queries: Query[],
  root: string,
  forms: Form[] = []
): VirtualFile | null => {
  const compName = `${toPascalCase(form.name)}Form`;
  const sourceTable = tables.find(t => t.id === form.sourceId);
  if (!sourceTable) return null;
  
  const sourceTablePascal = toPascalCase(sourceTable.name);
  const lookups = form.layout ? collectLookups(form.layout, tables, queries, [], forms) : [];
  const requiredModals: any[] = [];
  const layoutJsx = form.layout ? generateJsxForLayout(form.layout, tables, forms.length > 0 ? forms : [form], "data", requiredModals, queries) : '<div>Kein Layout definiert.</div>';
  
  const subformStateDecls = requiredModals.filter(m => m.type === 'subform').map(m => {
        const camelChild = toCamelCase(m.table.name);
        const suffix = toSubformSuffix(m.id);
        const listVar = `${camelChild}SubList_${suffix}`;
        const childTableCamel = toCamelCase(m.table.name);

        return `const [${listVar}, set${toPascalCase(listVar)}] = useState<any[]>([]);
  const [${listVar}_editingId, set${toPascalCase(listVar)}_editingId] = useState<any>(null);
  const [${listVar}_subData, set${toPascalCase(listVar)}_subData] = useState<any>({});

  const editSubformItem_${suffix} = (item: any) => {
      set${toPascalCase(listVar)}_editingId(item.id || item.Id || item.ID);
      const normalizedItem: any = { ...item };
      ${m.table.fields.map((f: any) => {
          const cName = toCamelCase(f.name);
          const pName = toPascalCase(f.name);
          return `if (normalizedItem['${cName}'] === undefined) normalizedItem['${cName}'] = item['${f.name}'] ?? item['${pName}'];`;
      }).join('\n      ')}
      set${toPascalCase(listVar)}_subData(normalizedItem);
      toggleModal('${m.id}', true);
  };

  const deleteSubformItem_${suffix} = async (item: any) => {
      if (!window.confirm('Möchten Sie diesen Eintrag wirklich löschen?')) return;
      const itemId = item.id || item.Id || item.ID;
      try {
          await del('${childTableCamel}', itemId);
          set${toPascalCase(listVar)}(prev => prev.filter(x => (x.id || x.Id || x.ID) !== itemId));
      } catch (err) {
          alert('Fehler beim Löschen');
      }
  };`;
    }).join('\n  ');

  const subformLoadLogic = requiredModals.filter(m => m.type === 'subform').map(m => {
        const childTablePascal = toPascalCase(m.table.name);
        const childTableCamel = toCamelCase(m.table.name);
        const childFieldObj = m.table.fields.find((f: any) => f.id === m.childField || f.name === m.childField);
        const childFieldName = childFieldObj ? childFieldObj.name : (m.childFieldName || m.childField || 'id');
        const childFieldCamel = toCamelCase(childFieldName);
        const childFieldPascal = toPascalCase(childFieldName);
        
        const masterFieldObj = sourceTable.fields.find(f => f.id === m.masterField || f.name === m.masterField);
        const masterFieldName = masterFieldObj ? masterFieldObj.name : (m.masterFieldName || m.masterField || 'id');
        const masterFieldCamel = toCamelCase(masterFieldName);
        const masterFieldPascal = toPascalCase(masterFieldName);

        const suffix = toSubformSuffix(m.id);
        const varName = `${childTableCamel}SubList_${suffix}`;
        return `if (id && id !== 'new') {
            const masterVal_${suffix} = (masterRecord as any)?.['${masterFieldCamel}'] ?? (masterRecord as any)?.['${masterFieldName}'] ?? (masterRecord as any)?.['${masterFieldPascal}'] ?? id;
            if (masterVal_${suffix} !== undefined && masterVal_${suffix} !== null && masterVal_${suffix} !== '' && masterVal_${suffix} !== 'new') {
                const subRes = await get('${childTablePascal}', { pageSize: 10000 });
                const allSubItems = subRes.data || subRes || [];
                set${toPascalCase(varName)}(allSubItems.filter((x: any) => {
                    const childVal = x?.['${childFieldCamel}'] ?? x?.['${childFieldName}'] ?? x?.['${childFieldPascal}'] ?? x?.['${m.childField}'];
                    return childVal !== undefined && childVal !== null && String(childVal) === String(masterVal_${suffix});
                }));
            }
        }`;
    }).join('\n        ');

  const modalJsx = requiredModals.map(m => {
      if (m.type === 'lookup') {
          const fields = m.table.fields.filter((f: any) => !f.isAutoIncrement).map((f: any) => {
              const label = f.name;
              const name = toCamelCase(f.name);
              let input = `<input name="${name}" className="w-full border border-slate-300 dark:border-slate-600 rounded p-2 text-slate-900 dark:text-white bg-white dark:bg-slate-700 focus:ring-2 focus:ring-blue-500 outline-none" />`;
              if (f.type === 'BOOLEAN') input = `<div className="flex items-center gap-2 mt-2"><input type="checkbox" name="${name}" value="true" className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 border-slate-300 dark:border-slate-600 dark:bg-slate-700" /> <span className="text-sm text-slate-700 dark:text-slate-300">Aktivieren</span></div>`;
              else if (f.type === 'ENUM' || (f.enumValues && f.enumValues.length > 0)) {
                  const enumOptions = (f.enumValues && f.enumValues.length > 0) ? f.enumValues : ['Option 1', 'Option 2'];
                  const optHtml = enumOptions.map((o: string) => `<option value="${o.replace(/"/g, '&quot;')}">${o}</option>`).join('');
                  input = `<select name="${name}" className="w-full border border-slate-300 dark:border-slate-600 rounded p-2 text-slate-900 dark:text-white bg-white dark:bg-slate-700 focus:ring-2 focus:ring-blue-500 outline-none"><option value="">-- Bitte wählen --</option>${optHtml}</select>`;
              }
              else if (f.type === 'INTEGER' || f.type === 'DECIMAL' || f.type === 'DOUBLE') input = `<input type="number" name="${name}" className="w-full border border-slate-300 dark:border-slate-600 rounded p-2 text-slate-900 dark:text-white bg-white dark:bg-slate-700 focus:ring-2 focus:ring-blue-500 outline-none" step="${f.type === 'INTEGER' ? '1' : '0.01'}" />`;
              else if (f.type === 'DATE') input = `<input type="date" name="${name}" className="w-full border border-slate-300 dark:border-slate-600 rounded p-2 text-slate-900 dark:text-white bg-white dark:bg-slate-700 focus:ring-2 focus:ring-blue-500 outline-none" />`;
              else if (f.type === 'TIME') input = `<input type="time" name="${name}" className="w-full border border-slate-300 dark:border-slate-600 rounded p-2 text-slate-900 dark:text-white bg-white dark:bg-slate-700 focus:ring-2 focus:ring-blue-500 outline-none" />`;
              else if (f.type === 'DATETIME' || f.type === 'TIMESTAMP') input = `<input type="datetime-local" name="${name}" className="w-full border border-slate-300 dark:border-slate-600 rounded p-2 text-slate-900 dark:text-white bg-white dark:bg-slate-700 focus:ring-2 focus:ring-blue-500 outline-none" />`;
              return `<div className="mb-3"><label className="block text-sm font-bold mb-1 text-slate-700 dark:text-slate-300">${label}</label>${input}</div>`;
          }).join('');
          
          return `<Modal isOpen={modals['${m.id}']} onClose={() => toggleModal('${m.id}', false)} title="Neu: ${m.table.name}"><form onSubmit={async (e) => { e.preventDefault(); const formData = new FormData(e.currentTarget); const payload: any = {}; formData.forEach((value, key) => { if(value==='true') payload[key]=true; else if(value==='false') payload[key]=false; else payload[key]=value; }); try { await post('${toCamelCase(m.table.name)}', payload); const res = await get('${toCamelCase(m.table.name)}', { pageSize: 10000 }); set${toPascalCase(toCamelCase(m.table.name))}List(res.data || res); toggleModal('${m.id}', false); } catch (err) { alert('Fehler'); } }}><div className="space-y-2">${fields}</div><div className="mt-6 flex justify-end gap-2"><button type="button" onClick={() => toggleModal('${m.id}', false)} className="px-4 py-2 border rounded text-slate-600 dark:text-slate-300 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-700">Abbrechen</button><button className="bg-blue-600 text-white px-4 py-2 rounded font-bold hover:bg-blue-700">Speichern</button></div></form></Modal>`;
      }
      if (m.type === 'subform') {
          const childTablePascal = toPascalCase(m.table.name);
          const childTableCamel = toCamelCase(m.table.name);
          const childFieldObj = m.table.fields.find((f: any) => f.id === m.childField || f.name === m.childField);
          const childFieldName = childFieldObj ? childFieldObj.name : (m.childFieldName || m.childField || 'id');
          const childFieldCamel = toCamelCase(childFieldName);
          const childFieldPascal = toPascalCase(childFieldName);

          const masterFieldObj = sourceTable.fields.find(f => f.id === m.masterField || f.name === m.masterField);
          const masterFieldName = masterFieldObj ? masterFieldObj.name : (m.masterFieldName || m.masterField || 'id');
          const masterFieldCamel = toCamelCase(masterFieldName);
          const masterFieldPascal = toPascalCase(masterFieldName);

          const suffix = toSubformSuffix(m.id);
          const listVar = `${childTableCamel}SubList_${suffix}`;

          const fieldsJsx = m.table.fields.filter((f: any) => !f.isPrimaryKey && !f.isAutoIncrement && f.id !== m.childField && f.name !== m.childField && toCamelCase(f.name) !== childFieldCamel).map((f: any) => {
              const label = f.name;
              const name = toCamelCase(f.name);
              let input = `<input value={${listVar}_subData['${name}'] || ''} onChange={(e) => set${toPascalCase(listVar)}_subData((prev: any) => ({ ...prev, ${name}: e.target.value }))} className="w-full border border-slate-300 dark:border-slate-600 rounded p-2 text-sm text-slate-900 dark:text-white bg-white dark:bg-slate-700 focus:ring-2 focus:ring-blue-500 outline-none" />`;
              if (f.type === 'BOOLEAN') input = `<div className="flex items-center gap-2 mt-2"><input type="checkbox" checked={!!${listVar}_subData['${name}']} onChange={(e) => set${toPascalCase(listVar)}_subData((prev: any) => ({ ...prev, ${name}: e.target.checked }))} className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 border-slate-300 dark:border-slate-600 dark:bg-slate-700" /> <span className="text-sm text-slate-700 dark:text-slate-300">Aktivieren</span></div>`;
              else if (f.type === 'INTEGER' || f.type === 'DECIMAL' || f.type === 'DOUBLE') input = `<input type="number" value={${listVar}_subData['${name}'] ?? ''} onChange={(e) => set${toPascalCase(listVar)}_subData((prev: any) => ({ ...prev, ${name}: e.target.value === '' ? '' : Number(e.target.value) }))} className="w-full border border-slate-300 dark:border-slate-600 rounded p-2 text-sm text-slate-900 dark:text-white bg-white dark:bg-slate-700 focus:ring-2 focus:ring-blue-500 outline-none" step="${f.type === 'INTEGER' ? '1' : '0.01'}" />`;
              else if (f.type === 'DATE') input = `<input type="date" value={${listVar}_subData['${name}'] || ''} onChange={(e) => set${toPascalCase(listVar)}_subData((prev: any) => ({ ...prev, ${name}: e.target.value }))} className="w-full border border-slate-300 dark:border-slate-600 rounded p-2 text-sm text-slate-900 dark:text-white bg-white dark:bg-slate-700 focus:ring-2 focus:ring-blue-500 outline-none" />`;
              return `<div className="mb-3"><label className="block text-xs font-bold mb-1 text-slate-700 dark:text-slate-300">${label}</label>${input}</div>`;
          }).join('');

          return `<Modal isOpen={modals['${m.id}']} onClose={() => { toggleModal('${m.id}', false); set${toPascalCase(listVar)}_editingId(null); set${toPascalCase(listVar)}_subData({}); }} title={${listVar}_editingId ? "Eintrag bearbeiten" : "Eintrag hinzufügen"}><form onSubmit={async (e) => { e.preventDefault(); const masterVal = data?.['${masterFieldCamel}'] ?? data?.['${masterFieldName}'] ?? data?.['${masterFieldPascal}'] ?? id; if (!masterVal || id === 'new') { alert('Bitte erst Hauptdatensatz speichern.'); return; } const payload = { ...${listVar}_subData, ${childFieldCamel}: masterVal, ['${childFieldName}']: masterVal }; try { if (${listVar}_editingId) { await put('${childTableCamel}', ${listVar}_editingId, payload); } else { await post('${childTableCamel}', payload); } const subRes = await get('${childTablePascal}', { search: '', pageSize: 10000 }); const allSubItems = subRes.data || subRes || []; set${toPascalCase(listVar)}(allSubItems.filter((x: any) => { const childVal = x?.['${childFieldCamel}'] ?? x?.['${childFieldName}'] ?? x?.['${childFieldPascal}'] ?? x?.['${m.childField}']; return childVal !== undefined && childVal !== null && String(childVal) === String(masterVal); })); toggleModal('${m.id}', false); set${toPascalCase(listVar)}_editingId(null); set${toPascalCase(listVar)}_subData({}); } catch (err) { alert('Fehler beim Speichern'); } }}><div className="space-y-2">${fieldsJsx}</div><div className="mt-6 flex justify-end gap-2"><button type="button" onClick={() => { toggleModal('${m.id}', false); set${toPascalCase(listVar)}_editingId(null); set${toPascalCase(listVar)}_subData({}); }} className="px-4 py-2 border rounded text-slate-600 dark:text-slate-300 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-700 text-sm">Abbrechen</button><button className="bg-blue-600 text-white px-4 py-2 rounded font-bold hover:bg-blue-700 text-sm">Speichern</button></div></form></Modal>`;
      }
      if (m.type === 'user-picker') {
          return `<UserPickerModal isOpen={modals['${m.id}']} initialTab="${m.mode}" onSelect={(username, displayName) => { setData(prev => ({ ...prev, ${m.targetField}: username })); toggleModal('${m.id}', false); }} onClose={() => toggleModal('${m.id}', false)} />`;
      }
      return '';
  }).join('\n');

  const defaultFields: string[] = [];
  const payloadSetups: string[] = [];

  sourceTable.fields.forEach(f => {
      const camelName = toCamelCase(f.name);
      const isDateType = ['DATETIME', 'TIMESTAMP', 'DATE', 'TIME'].includes(f.type);
      const hasNowDefault = f.defaultValue && (
          f.defaultValue.toLowerCase().includes('now') ||
          f.defaultValue.toLowerCase().includes('current_timestamp') ||
          f.defaultValue.toLowerCase().includes('getdate')
      );
      const isCreatedAtField = ['created_at', 'createdat', 'erstellt_am', 'created_date', 'createddate'].includes(f.name.toLowerCase());
      const isCreatedByField = ['created_by', 'createdby', 'erstellt_von', 'created_user', 'createduser'].includes(f.name.toLowerCase());

      if (isDateType && (hasNowDefault || isCreatedAtField)) {
          if (f.type === 'DATE') {
              defaultFields.push(`${camelName}: new Date().toISOString().split('T')[0]`);
              payloadSetups.push(`if (!payload.${camelName}) payload.${camelName} = new Date().toISOString().split('T')[0];`);
          } else if (f.type === 'TIME') {
              defaultFields.push(`${camelName}: new Date().toTimeString().slice(0, 5)`);
              payloadSetups.push(`if (!payload.${camelName}) payload.${camelName} = new Date().toTimeString().slice(0, 5);`);
          } else {
              defaultFields.push(`${camelName}: new Date().toISOString().slice(0, 16)`);
              payloadSetups.push(`if (!payload.${camelName}) payload.${camelName} = new Date().toISOString().slice(0, 16);`);
          }
      } else if (isCreatedByField) {
          defaultFields.push(`${camelName}: getLoggedInUser()`);
          payloadSetups.push(`if (!payload.${camelName}) payload.${camelName} = getLoggedInUser();`);
      } else if (f.defaultValue !== undefined && f.defaultValue !== null && f.defaultValue !== '') {
          if (f.type === 'BOOLEAN') {
              const bVal = f.defaultValue.toLowerCase() === 'true' || f.defaultValue === '1';
              defaultFields.push(`${camelName}: ${bVal}`);
          } else if (f.type === 'INTEGER' || f.type === 'DECIMAL') {
              defaultFields.push(`${camelName}: ${f.defaultValue}`);
          } else {
              defaultFields.push(`${camelName}: "${f.defaultValue.replace(/"/g, '\\"')}"`);
          }
      }
  });
  const initialDataObjStr = defaultFields.length > 0 ? `{\n      ${defaultFields.join(',\n      ')}\n    }` : '{}';
  const payloadSetupsCode = payloadSetups.length > 0 ? `const payload = { ...data };\n    ${payloadSetups.join('\n    ')}` : 'const payload = { ...data };';

  const calculatedFields: { fieldName: string; formula: string }[] = [];
  sourceTable.fields.forEach(f => {
      if (f.isCalculated || f.calculationFormula) {
          calculatedFields.push({ fieldName: toCamelCase(f.name), formula: f.calculationFormula || '' });
      }
  });

  const walk = (el: any) => {
      if (!el) return;
      if ((el.widgetType === 'calculated' || el.isCalculated) && el.calculationFormula && el.fieldId) {
          const field = sourceTable.fields.find(f => f.id === el.fieldId);
          if (field) {
              const camelName = toCamelCase(field.name);
              if (!calculatedFields.some(cf => cf.fieldName === camelName)) {
                  calculatedFields.push({ fieldName: camelName, formula: el.calculationFormula });
              }
          }
      }
      if (Array.isArray(el.children)) {
          el.children.forEach(walk);
      }
  };
  if (form.layout) walk(form.layout);

  const recalculateCode = `const recalculateCalculatedFields = (record: Record<string, any>): Record<string, any> => {
    const updatedRecord = { ...record };
    const calcFields = ${JSON.stringify(calculatedFields)};
    let changed = true;
    let passes = 0;
    while (changed && passes < 5) {
        changed = false;
        passes++;
        for (const cf of calcFields) {
            if (cf.formula) {
                const fieldMap: Record<string, string> = {};
                ${JSON.stringify(sourceTable.fields.map(f => ({ name: f.name, camel: toCamelCase(f.name) })))}.forEach(m => {
                    fieldMap[m.name] = m.camel;
                });
                const calculatedVal = evaluateFormFormula(cf.formula, updatedRecord, fieldMap);
                if (updatedRecord[cf.fieldName] !== calculatedVal) {
                    updatedRecord[cf.fieldName] = calculatedVal;
                    changed = true;
                }
            }
        }
    }
    return updatedRecord;
  };`;

  const queryBasedEffectsCode = lookups.filter(l => l.isQuery).map(l => {
      const queryParams = getFormParametersFromQuery(l.table);
      const formName = form.name.toLowerCase();
      const localDeps = queryParams.filter(p => p.formName === formName).map(p => `data.${toCamelCase(p.fieldName)}`);
      const depArrayStr = localDeps.length > 0 ? localDeps.join(', ') : '';
      
      const paramMapping = queryParams.map(p => {
          const camelField = toCamelCase(p.fieldName);
          return `if (data.${camelField} !== undefined && data.${camelField} !== null && data.${camelField} !== '') params['${p.paramName}'] = data.${camelField};`;
      }).join('\n      ');

      let sortLogic = '';
      if (l.sort) {
          const sortFieldObj = (l.table.fields || l.table.columns || []).find((f: any) => f.id === l.sort.fieldId);
          const sortProp = sortFieldObj ? toCamelCase(sortFieldObj.name || sortFieldObj.alias || sortFieldObj.fieldName) : 'null';
          if (sortProp !== 'null') {
              sortLogic = `\n          resData = resData.sort((a: any, b: any) => (a['${sortProp}'] > b['${sortProp}'] ? ${l.sort.direction === 'DESC' ? -1 : 1} : -1 * ${l.sort.direction === 'DESC' ? -1 : 1}));`;
          }
      }

      return `  useEffect(() => {
    const load = async () => {
      const params: any = { pageSize: 10000 };
      ${paramMapping}
      try {
          const res = await get('${l.endpoint}', params);
          let resData = res.data || res;${sortLogic}
          set${toPascalCase(l.variableName)}(resData);
      } catch (e) { console.error(e); }
    };
    ${localDeps.length > 0 ? `if (${localDeps.map(dep => `${dep} !== undefined && ${dep} !== null && ${dep} !== ''`).join(' && ')}) { load(); } else { set${toPascalCase(l.variableName)}([]); }` : 'load();'}
  }, [${depArrayStr}]);`;
  }).join('\n\n  ');

  const content = `import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { get, post, put, del } from '../../services/api';
import { Save, ArrowLeft, Loader2, Plus, Layout, User, Search, ChevronDown } from 'lucide-react';
import { Modal } from '../../components/Modal';
import { UserPickerModal } from '../../components/UserPickerModal';
import { MarkdownEditor } from '../../components/common/MarkdownEditor';
import { MarkdownViewer } from '../../components/common/MarkdownViewer';
import { useGlobalState } from '../../context/GlobalStateContext';
import { evaluateFormFormula } from '../../utils/formulaEvaluator';

const SubFormWrapper = ({ children, onSave }: any) => {
    const [subData, setData] = useState<any>({});
    const injectedChildren = React.Children.map(children, child => React.isValidElement(child) ? child : child);
    return (<div>{children}<div className="mt-6 flex justify-end gap-2"><button type="button" onClick={() => onSave(subData)} className="bg-blue-600 text-white px-4 py-2 rounded font-bold hover:bg-blue-700">Speichern</button></div></div>);
}

export const ${compName} = () => {
  const { id } = useParams(); const navigate = useNavigate();
  const [data, setRawData] = useState<any>({});
  const [loading, setLoading] = useState(false);

  ${recalculateCode}

  const setData = (newDataOrFn: any) => {
    setRawData(prev => {
        const next = typeof newDataOrFn === 'function' ? newDataOrFn(prev) : newDataOrFn;
        return recalculateCalculatedFields(next);
    });
  };

  const [modals, setModals] = useState<Record<string, boolean>>({});
  const [activeTabs, setActiveTabs] = useState<Record<string, string>>({});
  const { states, setGlobalState, addToast, executeMacro = (macroId: string) => console.log('Macro executed:', macroId) } = useGlobalState() || { states: {}, setGlobalState: () => {}, addToast: () => {}, executeMacro: () => {} };
  
  const UXRules: any[] = ${JSON.stringify(form.crossFieldValidations || [])};

  const getLoggedInUser = () => {
      try {
          const savedUser = localStorage.getItem('auth_user');
          if (savedUser) {
              const parsed = JSON.parse(savedUser);
              return parsed.username || 'Admin';
          }
      } catch (e) {}
      return 'Admin';
  };

  // Phase 5: Cross-field rule evaluator
  const evaluateUXRule = (rule: any, currentData: any) => {
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
  };

  const isFieldRequired = (fieldId: string) => UXRules.some((r: any) => r.targetFieldId === fieldId && r.action === 'require' && evaluateUXRule(r, data));
  const isFieldHidden = (fieldId: string) => UXRules.some((r: any) => r.targetFieldId === fieldId && r.action === 'hide' && evaluateUXRule(r, data));
  const isFieldDisabled = (fieldId: string) => UXRules.some((r: any) => r.targetFieldId === fieldId && r.action === 'disable' && evaluateUXRule(r, data));

  ${lookups.map(l => `const [${l.variableName}, set${toPascalCase(l.variableName)}] = useState<any[]>([]);`).join('\n  ')}
  ${subformStateDecls}

  const toggleModal = (id: string, state: boolean) => setModals(prev => ({...prev, [id]: state}));

  useEffect(() => {
      const init = async () => {
        setLoading(true);
        try {
            ${lookups.filter(l => !l.isQuery).map(l => `{
                const ${l.variableName}Res = await get('${l.endpoint}', { pageSize: 10000 });
                let ${l.variableName}Data = ${l.variableName}Res.data || ${l.variableName}Res;
                ${(() => {
                    if (!l.sort) return '';
                    const sortFieldObj = (l.table.fields || l.table.columns || []).find((f: any) => f.id === l.sort.fieldId);
                    if (!sortFieldObj) return '';
                    const sortField = toCamelCase(sortFieldObj.name || sortFieldObj.alias || sortFieldObj.fieldName);
                    return `
                    ${l.variableName}Data = ${l.variableName}Data.sort((a: any, b: any) => (a['${sortField}'] > b['${sortField}'] ? ${l.sort.direction === 'DESC' ? -1 : 1} : -1 * ${l.sort.direction === 'DESC' ? -1 : 1}));
                    `;
                })()}
                set${toPascalCase(l.variableName)}(${l.variableName}Data);
            }`).join('\n            ')}
            if (id && id !== 'new') {
                const res = await get(\`${sourceTablePascal}/\${id}\`);
                const masterRecord = res.data || res;
                setData(masterRecord);
                ${subformLoadLogic}
            } else {
                setData(${initialDataObjStr});
            }
        } catch (e) { console.error(e); }
        setLoading(false);
      };
      init();
  }, [id]);

  ${queryBasedEffectsCode}

  const handleSubmit = async (e: React.FormEvent) => { 
    e.preventDefault(); 
    try { 
      ${payloadSetupsCode}
      if (id && id !== 'new') {
          await put(\`${sourceTablePascal}/\${id}\`, payload); 
      } else {
          await post('${sourceTablePascal}', payload); 
      }
      navigate(-1); 
    } catch (e) { 
      alert('Fehler'); 
    } 
  };

  if (loading) return <div className="p-10 text-center"><Loader2 className="animate-spin inline-block mr-2 text-blue-500"/> Lade...</div>;
  const subData: any = {}; const setSubData = (d: any) => {};

  return (
    <div className="max-w-5xl mx-auto p-4 sm:p-8">
      <button onClick={() => navigate(-1)} className="mb-4 text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white flex items-center gap-2 transition-colors font-medium text-sm"><ArrowLeft size={16}/> Zurück</button>
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg border border-slate-200 dark:border-slate-700 overflow-hidden">
          <div className="p-6 border-b border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50"><h1 className="text-2xl font-bold text-slate-800 dark:text-white">${form.name}</h1></div>
          <form onSubmit={handleSubmit} className="p-6 sm:p-8">
            ${layoutJsx}
            <div className="mt-10 pt-6 border-t border-slate-100 dark:border-slate-700 flex justify-end gap-3">
                <button type="button" onClick={() => navigate(-1)} className="px-6 py-2.5 rounded-lg border border-slate-300 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-medium transition-colors">Abbrechen</button>
                <button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-2.5 rounded-lg font-bold flex items-center gap-2 shadow-lg shadow-blue-500/20 transition-all transform hover:-translate-y-0.5"><Save size={18}/> Speichern</button>
            </div>
          </form>
      </div>
      ${modalJsx}
    </div>
  );
};`;

  return { name: `${compName}.tsx`, path: `${root}/src/pages/forms/${compName}.tsx`, content, language: 'typescript' };
};
