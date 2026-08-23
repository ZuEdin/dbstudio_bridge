import { Table, VirtualFile } from '../../../../types/index';
import { toCamelCase, toPascalCase } from '../../common';

export const generateFormPage = (table: Table, root: string): VirtualFile => {
  const pascalName = toPascalCase(table.name);
  const camelName = toCamelCase(table.name);
  const formCompName = `${pascalName}Form`;

  const formFieldsJsx = table.fields.filter(f => !f.isAutoIncrement).map(f => {
      const fCamel = toCamelCase(f.name);
      const label = f.comment || f.name;
      let inputJsx = '';
      if (f.type === 'BOOLEAN') {
          inputJsx = `
          <div className="flex items-center gap-2 mt-2">
              <input 
                  type="checkbox" 
                  id="${fCamel}"
                  checked={!!data.${fCamel}} 
                  onChange={e => setData({ ...data, ${fCamel}: e.target.checked })}
                  className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 border-slate-300 dark:border-slate-600 dark:bg-slate-700" 
              />
              <label htmlFor="${fCamel}" className="text-sm font-medium text-slate-700 dark:text-slate-300">${label}</label>
          </div>`;
      } else if (f.type === 'INTEGER' || f.type === 'DECIMAL' || f.type === 'DOUBLE') {
          inputJsx = `
          <label className="block text-sm font-semibold mb-1 text-slate-700 dark:text-slate-300">${label}</label>
          <input 
              type="number" 
              value={data.${fCamel} ?? ''} 
              onChange={e => setData({ ...data, ${fCamel}: e.target.value === '' ? null : Number(e.target.value) })}
              className="w-full border rounded-lg p-2 bg-white dark:bg-slate-800 dark:border-slate-700 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none" 
              step="${f.type === 'INTEGER' ? '1' : 'any'}"
          />`;
      } else if (f.type === 'DATE') {
          inputJsx = `
          <label className="block text-sm font-semibold mb-1 text-slate-700 dark:text-slate-300">${label}</label>
          <input 
              type="date" 
              value={data.${fCamel} ? String(data.${fCamel}).split('T')[0] : ''} 
              onChange={e => setData({ ...data, ${fCamel}: e.target.value })}
              className="w-full border rounded-lg p-2 bg-white dark:bg-slate-800 dark:border-slate-700 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none" 
          />`;
      } else if (f.type === 'TIME') {
          inputJsx = `
          <label className="block text-sm font-semibold mb-1 text-slate-700 dark:text-slate-300">${label}</label>
          <input 
              type="time" 
              value={data.${fCamel} ? String(data.${fCamel}).substring(0, 5) : ''} 
              onChange={e => setData({ ...data, ${fCamel}: e.target.value })}
              className="w-full border rounded-lg p-2 bg-white dark:bg-slate-800 dark:border-slate-700 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none" 
          />`;
      } else if (f.type === 'DATETIME' || f.type === 'TIMESTAMP') {
          inputJsx = `
          <label className="block text-sm font-semibold mb-1 text-slate-700 dark:text-slate-300">${label}</label>
          <input 
              type="datetime-local" 
              value={data.${fCamel} ? new Date(data.${fCamel}).toISOString().slice(0, 16) : ''} 
              onChange={e => setData({ ...data, ${fCamel}: e.target.value })}
              className="w-full border rounded-lg p-2 bg-white dark:bg-slate-800 dark:border-slate-700 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none" 
          />`;
      } else if (f.type === 'ENUM' || (f.enumValues && f.enumValues.length > 0)) {
          const enumOptions = (f.enumValues && f.enumValues.length > 0) ? f.enumValues : ['Option 1', 'Option 2'];
          const optionsJsx = enumOptions.map(opt => `                  <option value="${opt.replace(/"/g, '&quot;')}">${opt}</option>`).join('\n');
          inputJsx = `
          {/* ========================================================================= */}
          {/* ENUM DROPDOWN: ${f.name} (${table.name}) */}
          {/* 1. FRONTEND: To add/modify options here, add new <option value="..."> tags */}
          {/* 2. DATABASE: To alter enum in DB, update DB Studio or run: */}
          {/*    MySQL:      ALTER TABLE \`${table.name}\` MODIFY COLUMN \`${f.name}\` ENUM(${enumOptions.map(o => `'${o.replace(/'/g, "\\'")}'`).join(', ')}); */}
          {/*    PostgreSQL: ALTER TYPE enum_${table.name.toLowerCase()}_${f.name.toLowerCase()} ADD VALUE 'NEW_VALUE'; */}
          {/*    SQL Server: ALTER TABLE [${table.name}] DROP CONSTRAINT CK_... ; ALTER TABLE [${table.name}] ADD CHECK ([${f.name}] IN (${enumOptions.map(o => `'${o.replace(/'/g, "''")}'`).join(', ')})); */}
          {/* ========================================================================= */}
          <label className="block text-sm font-semibold mb-1 text-slate-700 dark:text-slate-300">
              ${label} <span className="text-xs text-indigo-500 font-normal">(Auswahl)</span>
          </label>
          <div className="relative">
              <select 
                  id="${fCamel}"
                  value={data.${fCamel} ?? ''} 
                  onChange={e => setData({ ...data, ${fCamel}: e.target.value })}
                  className="w-full border rounded-lg p-2.5 bg-white dark:bg-slate-800 dark:border-slate-700 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none appearance-none pr-8 cursor-pointer"
              >
                  <option value="">-- Bitte wählen (${label}) --</option>
${optionsJsx}
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2.5 text-slate-500">
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" /></svg>
              </div>
          </div>`;
      } else if (f.rendererType === 'markdown' || (f.type === 'TEXT' && f.comment?.toLowerCase().includes('markdown'))) {
          inputJsx = `
          <div className="flex justify-between items-center mb-1">
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300">${label}</label>
              <span className="text-[10px] bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 font-bold px-2 py-0.5 rounded-full border border-indigo-200/60 font-mono">Markdown</span>
          </div>
          <MarkdownEditor 
              id="${fCamel}"
              value={data.${fCamel} ?? ''} 
              onChange={val => setData({ ...data, ${fCamel}: val })}
              minHeight="140px"
          />`;
      } else if (f.type === 'TEXT') {
          inputJsx = `
          <label className="block text-sm font-semibold mb-1 text-slate-700 dark:text-slate-300">${label}</label>
          <textarea 
              rows={4}
              value={data.${fCamel} ?? ''} 
              onChange={e => setData({ ...data, ${fCamel}: e.target.value })}
              className="w-full border rounded-lg p-2 bg-white dark:bg-slate-800 dark:border-slate-700 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none" 
          />`;
      } else {
          inputJsx = `
          <label className="block text-sm font-semibold mb-1 text-slate-700 dark:text-slate-300">${label}</label>
          <input 
              type="text" 
              value={data.${fCamel} ?? ''} 
              onChange={e => setData({ ...data, ${fCamel}: e.target.value })}
              className="w-full border rounded-lg p-2 bg-white dark:bg-slate-800 dark:border-slate-700 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none" 
          />`;
      }

      return `              <div className="mb-4">
                  ${inputJsx}
              </div>`;
  }).join('\n');

  const defaultFields: string[] = [];
  const payloadSetups: string[] = [];
  table.fields.forEach(f => {
      const fCamel = toCamelCase(f.name);
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
              defaultFields.push(`${fCamel}: new Date().toISOString().split('T')[0]`);
              payloadSetups.push(`if (!payload.${fCamel}) payload.${fCamel} = new Date().toISOString().split('T')[0];`);
          } else if (f.type === 'TIME') {
              defaultFields.push(`${fCamel}: new Date().toTimeString().slice(0, 5)`);
              payloadSetups.push(`if (!payload.${fCamel}) payload.${fCamel} = new Date().toTimeString().slice(0, 5);`);
          } else {
              defaultFields.push(`${fCamel}: new Date().toISOString().slice(0, 16)`);
              payloadSetups.push(`if (!payload.${fCamel}) payload.${fCamel} = new Date().toISOString().slice(0, 16);`);
          }
      } else if (isCreatedByField) {
          defaultFields.push(`${fCamel}: getLoggedInUser()`);
          payloadSetups.push(`if (!payload.${fCamel}) payload.${fCamel} = getLoggedInUser();`);
      } else if (f.defaultValue !== undefined && f.defaultValue !== null && f.defaultValue !== '') {
          if (f.type === 'BOOLEAN') {
              const bVal = f.defaultValue.toLowerCase() === 'true' || f.defaultValue === '1';
              defaultFields.push(`${fCamel}: ${bVal}`);
          } else if (f.type === 'INTEGER' || f.type === 'DECIMAL' || f.type === 'DOUBLE') {
              defaultFields.push(`${fCamel}: ${f.defaultValue}`);
          } else {
              defaultFields.push(`${fCamel}: "${f.defaultValue.replace(/"/g, '\\"')}"`);
          }
      }
  });

  const calculatedFields: { fieldName: string; formula: string }[] = [];
  table.fields.forEach(f => {
      if (f.isCalculated || f.calculationFormula) {
          calculatedFields.push({ fieldName: toCamelCase(f.name), formula: f.calculationFormula || '' });
      }
  });

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
                ${JSON.stringify(table.fields.map(f => ({ name: f.name, camel: toCamelCase(f.name) })))}.forEach(m => {
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

  const initialDataObjStr = defaultFields.length > 0 ? `{\n      ${defaultFields.join(',\n      ')}\n    }` : '{}';
  const payloadSetupsCode = payloadSetups.length > 0 ? `const payload = { ...data };\n    ${payloadSetups.join('\n    ')}` : 'const payload = { ...data };';

  const formContent = `import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { get, post, put } from '../../services/api';
import { Save, ArrowLeft, Loader2 } from 'lucide-react';
import { MarkdownEditor } from '../../components/common/MarkdownEditor';
import { evaluateFormFormula } from '../../utils/formulaEvaluator';

export const ${formCompName} = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [data, setRawData] = useState<any>({});
  const [loading, setLoading] = useState(false);

  ${recalculateCode}

  const setData = (newDataOrFn: any) => {
    setRawData(prev => {
        const next = typeof newDataOrFn === 'function' ? newDataOrFn(prev) : newDataOrFn;
        return recalculateCalculatedFields(next);
    });
  };


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

  useEffect(() => {
      const init = async () => {
        if (id && id !== 'new') {
            setLoading(true);
            try {
                const res = await get(\`${pascalName}/\${id}\`);
                setData(res.data || res);
            } catch (e) { 
                console.error(e); 
            }
            setLoading(false);
        } else {
            setData(${initialDataObjStr});
        }
      };
      init();
  }, [id]);

  const handleSubmit = async (e: React.FormEvent) => { 
    e.preventDefault(); 
    try { 
      ${payloadSetupsCode}
      if (id && id !== 'new') {
          await put(\`${pascalName}/\${id}\`, payload); 
      } else {
          await post('${pascalName}', payload); 
      }
      navigate(-1); 
    } catch (e) { 
      alert('Fehler beim Speichern'); 
    } 
  };

  if (loading) return <div className="p-10 text-center"><Loader2 className="animate-spin inline-block mr-2 text-blue-500"/> Lade...</div>;

  return (
    <div className="max-w-2xl mx-auto p-4 sm:p-8">
      <button onClick={() => navigate(-1)} className="mb-4 text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white flex items-center gap-2 transition-colors font-medium text-sm"><ArrowLeft size={16}/> Zurück</button>
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg border border-slate-200 dark:border-slate-700 overflow-hidden">
          <div className="p-6 border-b border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50">
              <h1 className="text-2xl font-bold text-slate-800 dark:text-white">
                  {id === 'new' ? '${table.name} erstellen' : '${table.name} bearbeiten'}
              </h1>
          </div>
          <form onSubmit={handleSubmit} className="p-6 sm:p-8">
            <div className="space-y-4">
                ${formFieldsJsx}
            </div>
            <div className="mt-10 pt-6 border-t border-slate-100 dark:border-slate-700 flex justify-end gap-3">
                <button type="button" onClick={() => navigate(-1)} className="px-6 py-2.5 rounded-lg border border-slate-300 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-medium transition-colors">Abbrechen</button>
                <button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-2.5 rounded-lg font-bold flex items-center gap-2 shadow-lg shadow-blue-500/20 transition-all transform hover:-translate-y-0.5"><Save size={18}/> Speichern</button>
            </div>
          </form>
      </div>
    </div>
  );
};`;

  return { name: `${formCompName}.tsx`, path: `${root}/src/pages/${pascalName}/${formCompName}.tsx`, content: formContent, language: 'typescript' };
};
