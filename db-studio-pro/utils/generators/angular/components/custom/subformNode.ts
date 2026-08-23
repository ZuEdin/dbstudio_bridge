import { NodeGeneratorContext } from './types';
import { toCamelCase, toPascalCase } from '../../../common';

export const generateSubformNode = (node: any, context: NodeGeneratorContext): string => {
  const { states, initCalls, methods, tables, isBootstrap } = context;
  const props = node.props || {};
  const tableId = props.dataSourceId || props.targetTableId;
  const targetTable = tables.find(t => t.id === tableId);

  if (!targetTable) {
    return `<div class="p-3 text-muted text-center border border-dashed rounded italic">Subform: Bitte Zieltabelle in den Eigenschaften auswählen</div>`;
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

  const parentIdExpr = context.currentContextVar 
    ? `(this.${context.currentContextVar}?.['${parentFieldCamel}'] ?? this.${context.currentContextVar}?.['${parentField}'] ?? this.${context.currentContextVar}?.['${parentFieldPascal}'] ?? this.${context.currentContextVar}?.id ?? this.${context.currentContextVar}?.Id ?? this.queryParams['selectedId'] ?? '')`
    : `(this.queryParams['selectedId'] || this.queryParams['id'] || '')`;

  // State definitions
  states.push(`${listVar}: any[] = [];`);
  states.push(`${loadingVar}: boolean = false;`);
  states.push(`${editingIdVar}: any = null;`);
  states.push(`${formDataVar}: any = {};`);
  states.push(`${showModalVar}: boolean = false;`);

  // Loading method
  initCalls.push(`this.loadSubData_${subSuffix}();`);

  methods.push(`
  loadSubData_${subSuffix}() {
    const pId = ${parentIdExpr};
    if (!pId) {
      this.${listVar} = [];
      return;
    }
    this.${loadingVar} = true;
    this.api.getAll('${tablePascal}', 1, 10000).subscribe({
      next: (res: any) => {
        const items = res.data || res || [];
        this.${listVar} = items.filter((item: any) => {
          const childVal = item?.['${fkField}'] ?? item?.['${fkFieldCamel}'] ?? item?.['${fkFieldPascal}'];
          return childVal !== undefined && childVal !== null && String(childVal) === String(pId);
        });
        this.${loadingVar} = false;
      },
      error: (err) => {
        console.error('Error fetching subform items:', err);
        this.${loadingVar} = false;
      }
    });
  }`);

  // Save method
  methods.push(`
  saveSubform_${subSuffix}() {
    const pId = ${parentIdExpr};
    if (!pId) {
      alert('Bitte zuerst den übergeordneten Hauptdatensatz anlegen oder auswählen.');
      return;
    }
    const payload = { ...this.${formDataVar}, ${fkField}: pId, ${fkFieldCamel}: pId };
    
    if (this.${editingIdVar}) {
      this.api.update('${tablePascal}', this.${editingIdVar}, payload).subscribe({
        next: () => {
          this.${showModalVar} = false;
          this.${editingIdVar} = null;
          this.${formDataVar} = {};
          this.loadSubData_${subSuffix}();
        },
        error: (err) => {
          console.error(err);
          alert('Fehler beim Aktualisieren der Position.');
        }
      });
    } else {
      this.api.create('${tablePascal}', payload).subscribe({
        next: () => {
          this.${showModalVar} = false;
          this.${formDataVar} = {};
          this.loadSubData_${subSuffix}();
        },
        error: (err) => {
          console.error(err);
          alert('Fehler beim Erstellen der Position.');
        }
      });
    }
  }`);

  // Delete method
  methods.push(`
  deleteSubform_${subSuffix}(id: any) {
    if (!confirm('Möchten Sie diesen Eintrag wirklich löschen?')) return;
    this.api.delete('${tablePascal}', id).subscribe({
      next: () => {
        this.${listVar} = this.${listVar}.filter(x => (x.id || x.Id || x.ID) !== id);
      },
      error: (err) => {
        console.error(err);
        alert('Fehler beim Löschen.');
      }
    });
  }`);

  const visibleFields = targetTable.fields.filter((f: any) => !f.isPrimaryKey && !f.isAutoIncrement && f.name !== fkField && f.id !== fkField && f.name !== fkFieldCamel);
  const allowAdd = props.allowAdd !== false;
  const allowEdit = props.allowEdit !== false;
  const allowDelete = props.allowDelete !== false;
  const showTotalRow = !!props.showTotalRow;
  const title = props.title || `Positionen (${targetTable.name})`;
  const numericFields = visibleFields.filter((f: any) => f.type === 'DECIMAL' || f.type === 'INTEGER' || f.type === 'FLOAT' || f.type === 'DOUBLE');

  numericFields.forEach(nf => {
    const colName = toCamelCase(nf.name);
    methods.push(`
  get total_${colName}_${subSuffix}(): number {
    return (this.${listVar} || []).reduce((acc: number, curr: any) => acc + Number(curr['${nf.name}'] ?? curr['${colName}'] ?? 0), 0);
  }`);
  });

  if (isBootstrap) {
    return `
    <div class="card shadow-sm border rounded-3 mb-4 overflow-hidden w-100">
        <div class="card-header bg-light d-flex justify-content-between align-items-center py-2 px-3">
            <div class="d-flex align-items-center gap-2">
                <span class="fw-bold small text-dark">${title}</span>
                <span class="badge bg-secondary rounded-pill">{{ ${listVar}.length }}</span>
            </div>
            ${allowAdd ? `
            <button
                type="button"
                (click)="${editingIdVar} = null; ${formDataVar} = {}; ${showModalVar} = true"
                class="btn btn-sm btn-primary d-flex align-items-center gap-1"
            >
                + Position hinzufügen
            </button>` : ''}
        </div>

        <div class="table-responsive">
            <table class="table table-hover table-striped align-middle mb-0 small">
                <thead class="table-light text-secondary">
                    <tr>
                        ${visibleFields.map((f: any) => `<th>${f.name}</th>`).join('\n')}
                        ${(allowEdit || allowDelete) ? `<th class="text-end">Aktionen</th>` : ''}
                    </tr>
                </thead>
                <tbody>
                    <tr *ngIf="${loadingVar}">
                        <td colspan="${visibleFields.length + 1}" class="text-center py-4 text-muted">
                            <span class="spinner-border spinner-border-sm me-2" role="status"></span> Positionen werden geladen...
                        </td>
                    </tr>
                    <tr *ngIf="!${loadingVar} && ${listVar}.length === 0">
                        <td colspan="${visibleFields.length + 1}" class="text-center py-4 text-muted fst-italic">
                            Keine Einträge vorhanden.
                        </td>
                    </tr>
                    <tr *ngFor="let row of ${listVar}">
                        ${visibleFields.map((f: any) => {
                            const colName = toCamelCase(f.name);
                            return `<td>{{ row['${f.name}'] ?? row['${colName}'] ?? row['${toPascalCase(f.name)}'] ?? '-' }}</td>`;
                        }).join('\n')}
                        ${(allowEdit || allowDelete) ? `
                        <td class="text-end">
                            <div class="btn-group btn-group-sm">
                                ${allowEdit ? `
                                <button
                                    type="button"
                                    (click)="${editingIdVar} = row.id || row.Id || row.ID; ${formDataVar} = { ...row }; ${showModalVar} = true"
                                    class="btn btn-outline-secondary"
                                    title="Bearbeiten"
                                >
                                    ✎
                                </button>` : ''}
                                ${allowDelete ? `
                                <button
                                    type="button"
                                    (click)="deleteSubform_${subSuffix}(row.id || row.Id || row.ID)"
                                    class="btn btn-outline-danger"
                                    title="Löschen"
                                >
                                    🗑
                                </button>` : ''}
                            </div>
                        </td>` : ''}
                    </tr>
                </tbody>
                ${showTotalRow && numericFields.length > 0 ? `
                <tfoot class="table-light fw-bold">
                    <tr>
                        ${visibleFields.map((f: any, idx: number) => {
                            if (idx === 0) return `<td>Gesamt:</td>`;
                            if (numericFields.some(nf => nf.name === f.name)) {
                                const colName = toCamelCase(f.name);
                                return `<td>{{ total_${colName}_${subSuffix} | number:'1.2-2' }}</td>`;
                            }
                            return `<td></td>`;
                        }).join('\n')}
                        ${(allowEdit || allowDelete) ? `<td></td>` : ''}
                    </tr>
                </tfoot>` : ''}
            </table>
        </div>

        <!-- Modal Dialog -->
        <div *ngIf="${showModalVar}" class="modal show d-block" style="background: rgba(0,0,0,0.5);" tabindex="-1">
            <div class="modal-dialog modal-dialog-centered">
                <div class="modal-content shadow-lg">
                    <div class="modal-header py-2 px-3 bg-light">
                        <h6 class="modal-title fw-bold">{{ ${editingIdVar} ? 'Position bearbeiten' : 'Neue Position hinzufügen' }}</h6>
                        <button type="button" class="btn-close" (click)="${showModalVar} = false"></button>
                    </div>
                    <form (ngSubmit)="saveSubform_${subSuffix}()">
                        <div class="modal-body p-3">
                            ${visibleFields.map((f: any) => {
                                const colName = toCamelCase(f.name);
                                const isNumber = f.type === 'DECIMAL' || f.type === 'INTEGER' || f.type === 'FLOAT' || f.type === 'DOUBLE';
                                const isDate = f.type === 'DATE';
                                return `
                                <div class="mb-2">
                                    <label class="form-label small fw-semibold text-secondary mb-1">${f.name}</label>
                                    <input
                                        type="${isNumber ? 'number' : isDate ? 'date' : 'text'}"
                                        step="${f.type === 'INTEGER' ? '1' : 'any'}"
                                        [(ngModel)]="${formDataVar}['${colName}']"
                                        name="${colName}_${subSuffix}"
                                        class="form-control form-control-sm"
                                    />
                                </div>`;
                            }).join('\n')}
                        </div>
                        <div class="modal-footer py-2 px-3 bg-light">
                            <button type="button" class="btn btn-sm btn-secondary" (click)="${showModalVar} = false">Abbrechen</button>
                            <button type="submit" class="btn btn-sm btn-primary">Speichern</button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    </div>`;
  }

  // Tailwind Version
  return `
  <div class="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden w-full my-4">
      <div class="p-3.5 px-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <div class="flex items-center gap-2">
              <span class="font-bold text-slate-800 text-xs">${title}</span>
              <span class="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-200 text-slate-700">
                  {{ ${listVar}.length }}
              </span>
          </div>
          ${allowAdd ? `
          <button
              type="button"
              (click)="${editingIdVar} = null; ${formDataVar} = {}; ${showModalVar} = true"
              class="px-2.5 py-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold flex items-center gap-1 shadow-xs transition"
          >
              + Position hinzufügen
          </button>` : ''}
      </div>

      <div class="overflow-x-auto">
          <table class="w-full text-left text-xs border-collapse">
              <thead>
                  <tr class="border-b border-slate-200 bg-slate-50/50 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                      ${visibleFields.map((f: any) => `<th class="p-2.5 px-3">${f.name}</th>`).join('\n')}
                      ${(allowEdit || allowDelete) ? `<th class="p-2.5 px-3 text-right">Aktionen</th>` : ''}
                  </tr>
              </thead>
              <tbody class="divide-y divide-slate-100">
                  <tr *ngIf="${loadingVar}">
                      <td colspan="${visibleFields.length + 1}" class="p-6 text-center text-slate-400">
                          Positionen werden geladen...
                      </td>
                  </tr>
                  <tr *ngIf="!${loadingVar} && ${listVar}.length === 0">
                      <td colspan="${visibleFields.length + 1}" class="p-6 text-center text-slate-400 italic">
                          Keine Einträge vorhanden.
                      </td>
                  </tr>
                  <tr *ngFor="let row of ${listVar}" class="hover:bg-slate-50/70 transition">
                      ${visibleFields.map((f: any) => {
                          const colName = toCamelCase(f.name);
                          return `<td class="p-2.5 px-3 text-slate-700 font-medium">{{ row['${f.name}'] ?? row['${colName}'] ?? row['${toPascalCase(f.name)}'] ?? '-' }}</td>`;
                      }).join('\n')}
                      ${(allowEdit || allowDelete) ? `
                      <td class="p-2.5 px-3 text-right">
                          <div class="flex items-center justify-end gap-1">
                              ${allowEdit ? `
                              <button
                                  type="button"
                                  (click)="${editingIdVar} = row.id || row.Id || row.ID; ${formDataVar} = { ...row }; ${showModalVar} = true"
                                  class="p-1 text-slate-500 hover:text-indigo-600 rounded hover:bg-slate-100 transition"
                                  title="Bearbeiten"
                              >
                                  ✎
                              </button>` : ''}
                              ${allowDelete ? `
                              <button
                                  type="button"
                                  (click)="deleteSubform_${subSuffix}(row.id || row.Id || row.ID)"
                                  class="p-1 text-slate-500 hover:text-rose-600 rounded hover:bg-rose-50 transition"
                                  title="Löschen"
                              >
                                  🗑
                              </button>` : ''}
                          </div>
                      </td>` : ''}
                  </tr>
              </tbody>
              ${showTotalRow && numericFields.length > 0 ? `
              <tfoot>
                  <tr class="border-t-2 border-slate-200 bg-slate-50 font-bold text-slate-900">
                      ${visibleFields.map((f: any, idx: number) => {
                          if (idx === 0) return `<td class="p-2.5 px-3">Gesamt:</td>`;
                          if (numericFields.some(nf => nf.name === f.name)) {
                              const colName = toCamelCase(f.name);
                              return `<td class="p-2.5 px-3">{{ total_${colName}_${subSuffix} | number:'1.2-2' }}</td>`;
                          }
                          return `<td class="p-2.5 px-3"></td>`;
                      }).join('\n')}
                      ${(allowEdit || allowDelete) ? `<td class="p-2.5 px-3"></td>` : ''}
                  </tr>
              </tfoot>` : ''}
          </table>
      </div>

      <!-- Modal Dialog -->
      <div *ngIf="${showModalVar}" class="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
          <div class="bg-white rounded-xl shadow-2xl max-w-md w-full p-5 overflow-hidden animate-in fade-in zoom-in duration-150">
              <h3 class="text-sm font-bold text-slate-900 mb-3">
                  {{ ${editingIdVar} ? 'Position bearbeiten' : 'Neue Position hinzufügen' }}
              </h3>
              <form (ngSubmit)="saveSubform_${subSuffix}()" class="space-y-3">
                  ${visibleFields.map((f: any) => {
                      const colName = toCamelCase(f.name);
                      const isNumber = f.type === 'DECIMAL' || f.type === 'INTEGER' || f.type === 'FLOAT' || f.type === 'DOUBLE';
                      const isDate = f.type === 'DATE';
                      return `
                      <div>
                          <label class="block text-xs font-semibold text-slate-700 mb-1">${f.name}</label>
                          <input
                              type="${isNumber ? 'number' : isDate ? 'date' : 'text'}"
                              step="${f.type === 'INTEGER' ? '1' : 'any'}"
                              [(ngModel)]="${formDataVar}['${colName}']"
                              name="${colName}_${subSuffix}"
                              class="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg text-xs focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                          />
                      </div>`;
                  }).join('\n')}
                  <div class="flex justify-end gap-2 pt-3 border-t border-slate-100">
                      <button
                          type="button"
                          (click)="${showModalVar} = false"
                          class="px-3 py-1.5 border border-slate-200 rounded-lg text-xs font-semibold text-slate-600 hover:bg-slate-50 transition"
                      >
                          Abbrechen
                      </button>
                      <button
                          type="submit"
                          class="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold transition shadow-xs"
                      >
                          Speichern
                      </button>
                  </div>
              </form>
          </div>
      </div>
  </div>`;
};
