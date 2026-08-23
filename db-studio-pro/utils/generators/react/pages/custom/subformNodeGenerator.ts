import { GeneratorContext } from './types';
import { toCamelCase, toPascalCase } from '../../../common';

export const generateSubformNode = (node: any, ctx: GeneratorContext): string => {
  const { states, effects, imports, tables } = ctx;
  const props = node.props || {};
  const tableId = props.dataSourceId || props.targetTableId;
  const targetTable = tables.find(t => t.id === tableId);

  if (!targetTable) {
    return `<div className="p-4 border border-dashed border-slate-300 rounded-xl bg-slate-50 text-slate-500 text-xs italic text-center">Subform: Bitte Zieltabelle in den Eigenschaften auswählen</div>`;
  }

  const subSuffix = (node.id || 'subform').replace(/[^a-zA-Z0-9]/g, '_');
  const tablePascal = toPascalCase(targetTable.name);
  const tableCamel = toCamelCase(targetTable.name);
  const listVar = `${tableCamel}SubList_${subSuffix}`;
  const loadingVar = `subLoading_${subSuffix}`;
  const editingIdVar = `subEditingId_${subSuffix}`;
  const formDataVar = `subFormData_${subSuffix}`;
  const showModalVar = `showSubModal_${subSuffix}`;

  const fkField = props.foreignKeyField || props.childLinkFieldId || 'parent_id';
  const fkFieldCamel = toCamelCase(fkField);
  const fkFieldPascal = toPascalCase(fkField);

  const parentField = props.parentField || props.masterKeyField || props.masterLinkFieldId || props.parentKeyField || 'id';
  const parentFieldCamel = toCamelCase(parentField);
  const parentFieldPascal = toPascalCase(parentField);

  const parentIdExpr = ctx.currentContextVar 
    ? `(${ctx.currentContextVar}?.['${parentFieldCamel}'] ?? ${ctx.currentContextVar}?.['${parentField}'] ?? ${ctx.currentContextVar}?.['${parentFieldPascal}'] ?? ${ctx.currentContextVar}?.id ?? ${ctx.currentContextVar}?.Id ?? searchParams.get('selectedId') ?? '')`
    : `(searchParams.get('selectedId') || searchParams.get('id') || '')`;

  imports.add('get');
  imports.add('post');
  imports.add('put');
  imports.add('del');
  imports.add('Plus');
  imports.add('Trash2');
  imports.add('Edit');
  imports.add('Loader2');

  // State variables
  states.push(`const [${listVar}, set${toPascalCase(listVar)}] = useState<any[]>([]);`);
  states.push(`const [${loadingVar}, set${toPascalCase(loadingVar)}] = useState(false);`);
  states.push(`const [${editingIdVar}, set${toPascalCase(editingIdVar)}] = useState<any>(null);`);
  states.push(`const [${formDataVar}, set${toPascalCase(formDataVar)}] = useState<any>({});`);
  states.push(`const [${showModalVar}, set${toPascalCase(showModalVar)}] = useState(false);`);

  // Fetch subform data
  effects.push(`
  useEffect(() => {
    const fetchSubData = async () => {
      const pId = ${parentIdExpr};
      if (!pId) {
        set${toPascalCase(listVar)}([]);
        return;
      }
      try {
        set${toPascalCase(loadingVar)}(true);
        const res = await get<any>('${tablePascal}', { pageSize: 10000 });
        const items = Array.isArray(res) ? res : (res?.data || res?.Data || res?.items || []);
        const filtered = items.filter((item: any) => {
          const childVal = item?.['${fkField}'] ?? item?.['${fkFieldCamel}'] ?? item?.['${fkFieldPascal}'];
          return childVal !== undefined && childVal !== null && String(childVal) === String(pId);
        });
        set${toPascalCase(listVar)}(filtered);
      } catch (err) {
        console.error('Error fetching subform data:', err);
      } finally {
        set${toPascalCase(loadingVar)}(false);
      }
    };
    fetchSubData();
  }, [searchParams, ${ctx.currentContextVar ? `${ctx.currentContextVar}?.['${parentFieldCamel}'], ${ctx.currentContextVar}?.['${parentField}']` : `searchParams.get('selectedId')`}]);`);

  // Handlers
  effects.push(`
  const handleSaveSubform_${subSuffix} = async (e: React.FormEvent) => {
    e.preventDefault();
    const pId = ${parentIdExpr};
    if (!pId) {
      alert('Bitte zuerst den übergeordneten Hauptdatensatz anlegen oder auswählen.');
      return;
    }
    const payload = { ...${formDataVar}, ${fkField}: pId, ${fkFieldCamel}: pId };
    try {
      if (${editingIdVar}) {
        await put('${tableCamel}', ${editingIdVar}, payload);
      } else {
        await post('${tableCamel}', payload);
      }
      // Refresh list
      const res = await get<any>('${tablePascal}', { pageSize: 10000 });
      const items = Array.isArray(res) ? res : (res?.data || res?.Data || res?.items || []);
      const filtered = items.filter((item: any) => {
        const childVal = item?.['${fkField}'] ?? item?.['${fkFieldCamel}'] ?? item?.['${fkFieldPascal}'];
        return childVal !== undefined && childVal !== null && String(childVal) === String(pId);
      });
      set${toPascalCase(listVar)}(filtered);
      set${toPascalCase(showModalVar)}(false);
      set${toPascalCase(editingIdVar)}(null);
      set${toPascalCase(formDataVar)}({});
    } catch (err) {
      console.error(err);
      alert('Fehler beim Speichern der Position.');
    }
  };

  const handleDeleteSubform_${subSuffix} = async (id: any) => {
    if (!window.confirm('Möchten Sie diesen Eintrag wirklich löschen?')) return;
    try {
      await del('${tableCamel}', id);
      set${toPascalCase(listVar)}(prev => prev.filter(x => (x.id || x.Id || x.ID) !== id));
    } catch (err) {
      console.error(err);
      alert('Fehler beim Löschen des Eintrags.');
    }
  };`);

  const visibleFields = targetTable.fields.filter((f: any) => !f.isPrimaryKey && !f.isAutoIncrement && f.name !== fkField);
  const allowAdd = props.allowAdd !== false;
  const allowEdit = props.allowEdit !== false;
  const allowDelete = props.allowDelete !== false;
  const showTotalRow = !!props.showTotalRow;
  const title = props.title || `Positionen (${targetTable.name})`;

  // Total summary for decimal/integer fields
  const numericFields = visibleFields.filter((f: any) => f.type === 'DECIMAL' || f.type === 'INTEGER' || f.type === 'FLOAT');

  return `
  <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden w-full my-4">
      <div className="p-3.5 px-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
              <span className="font-bold text-slate-800 text-xs">${title}</span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-200 text-slate-700">
                  {${listVar}.length}
              </span>
          </div>
          ${allowAdd ? `
          <button
              type="button"
              onClick={() => {
                  set${toPascalCase(editingIdVar)}(null);
                  set${toPascalCase(formDataVar)}({});
                  set${toPascalCase(showModalVar)}(true);
              }}
              className="px-2.5 py-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold flex items-center gap-1 shadow-xs transition"
          >
              <Plus size={13} /> Position hinzufügen
          </button>` : ''}
      </div>

      <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
              <thead>
                  <tr className="border-b border-slate-200 bg-slate-50/50 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                      ${visibleFields.map((f: any) => `<th className="p-2.5 px-3">${f.name}</th>`).join('\n')}
                      ${(allowEdit || allowDelete) ? `<th className="p-2.5 px-3 text-right">Aktionen</th>` : ''}
                  </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                  {${loadingVar} ? (
                      <tr>
                          <td colSpan={${visibleFields.length + 1}} className="p-6 text-center text-slate-400">
                              <Loader2 className="animate-spin inline-block w-4 h-4 mr-2 text-indigo-600" /> Positionen werden geladen...
                          </td>
                      </tr>
                  ) : ${listVar}.length === 0 ? (
                      <tr>
                          <td colSpan={${visibleFields.length + 1}} className="p-6 text-center text-slate-400 italic">
                              Keine Einträge vorhanden.
                          </td>
                      </tr>
                  ) : (
                      ${listVar}.map((row, idx) => (
                          <tr key={row.id || row.Id || idx} className="hover:bg-slate-50/70 transition">
                              ${visibleFields.map((f: any) => {
                                  const colName = toCamelCase(f.name);
                                  return `<td className="p-2.5 px-3 text-slate-700 font-medium">{String(row['${f.name}'] ?? row['${colName}'] ?? '-')}</td>`;
                              }).join('\n')}
                              ${(allowEdit || allowDelete) ? `
                              <td className="p-2.5 px-3 text-right">
                                  <div className="flex items-center justify-end gap-1">
                                      ${allowEdit ? `
                                      <button
                                          type="button"
                                          onClick={() => {
                                              set${toPascalCase(editingIdVar)}(row.id || row.Id);
                                              set${toPascalCase(formDataVar)}({ ...row });
                                              set${toPascalCase(showModalVar)}(true);
                                          }}
                                          className="p-1 text-slate-500 hover:text-indigo-600 rounded hover:bg-slate-100 transition"
                                          title="Bearbeiten"
                                      >
                                          <Edit size={13} />
                                      </button>` : ''}
                                      ${allowDelete ? `
                                      <button
                                          type="button"
                                          onClick={() => handleDeleteSubform_${subSuffix}(row.id || row.Id)}
                                          className="p-1 text-slate-500 hover:text-rose-600 rounded hover:bg-rose-50 transition"
                                          title="Löschen"
                                      >
                                          <Trash2 size={13} />
                                      </button>` : ''}
                                  </div>
                              </td>` : ''}
                          </tr>
                      ))
                  )}
              </tbody>
              ${showTotalRow && numericFields.length > 0 ? `
              <tfoot>
                  <tr className="border-t-2 border-slate-200 bg-slate-50 font-bold text-slate-900">
                      ${visibleFields.map((f: any, idx: number) => {
                          if (idx === 0) return `<td className="p-2.5 px-3">Gesamt:</td>`;
                          if (numericFields.some(nf => nf.name === f.name)) {
                              const colName = toCamelCase(f.name);
                              return `<td className="p-2.5 px-3">{${listVar}.reduce((acc, curr) => acc + Number(curr['${f.name}'] ?? curr['${colName}'] ?? 0), 0).toLocaleString('de-DE', { minimumFractionDigits: 2 })}</td>`;
                          }
                          return `<td className="p-2.5 px-3"></td>`;
                      }).join('\n')}
                      ${(allowEdit || allowDelete) ? `<td className="p-2.5 px-3"></td>` : ''}
                  </tr>
              </tfoot>` : ''}
          </table>
      </div>

      {/* Inline / Modal Dialog for Subform Entry */}
      {${showModalVar} && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
              <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-5 overflow-hidden animate-in fade-in zoom-in duration-150">
                  <h3 className="text-sm font-bold text-slate-900 mb-3">
                      {${editingIdVar} ? 'Position bearbeiten' : 'Neue Position hinzufügen'}
                  </h3>
                  <form onSubmit={handleSaveSubform_${subSuffix}} className="space-y-3">
                      ${visibleFields.map((f: any) => {
                          const colName = toCamelCase(f.name);
                          const isNumber = f.type === 'DECIMAL' || f.type === 'INTEGER' || f.type === 'FLOAT';
                          const isDate = f.type === 'DATE';
                          return `
                          <div>
                              <label className="block text-xs font-semibold text-slate-700 mb-1">${f.name}</label>
                              <input
                                  type="${isNumber ? 'number' : isDate ? 'date' : 'text'}"
                                  step="${f.type === 'INTEGER' ? '1' : 'any'}"
                                  value={${formDataVar}['${colName}'] ?? ${formDataVar}['${f.name}'] ?? ''}
                                  onChange={(e) => set${toPascalCase(formDataVar)}(prev => ({ ...prev, ${colName}: ${isNumber ? 'e.target.value === "" ? "" : Number(e.target.value)' : 'e.target.value'} }))}
                                  className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg text-xs focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                              />
                          </div>`;
                      }).join('\n')}
                      <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                          <button
                              type="button"
                              onClick={() => set${toPascalCase(showModalVar)}(false)}
                              className="px-3 py-1.5 border border-slate-200 rounded-lg text-xs font-semibold text-slate-600 hover:bg-slate-50 transition"
                          >
                              Abbrechen
                          </button>
                          <button
                              type="submit"
                              className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold transition shadow-xs"
                          >
                              Speichern
                          </button>
                      </div>
                  </form>
              </div>
          </div>
      )}
  </div>
  `;
};
