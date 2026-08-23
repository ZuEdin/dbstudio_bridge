import { NodeGeneratorContext } from './types';
import { generateContainerNode, generateTextNode, generateButtonNode, generateDividerNode, generateImageNode, generateHtmlNode, compileAngularPlaceholders } from './basicNodes';
import { generateDropdownNode } from './dropdownNode';
import { generateTableViewNode } from './tableViewNode';
import { generateCustomComponentNode } from './customComponentNode';
import { generateSubformNode } from './subformNode';
import { generateWidgetNode } from './widgetNodes';
import { toCamelCase, toPascalCase, toKebabCase } from '../../../common';
import { generateHtmlForLayout } from '../../layoutHelper';
import { Table, Form, Query } from '../../../../../types/index';

const collectAngularSubforms = (
  element: any,
  tables: Table[],
  forms: Form[],
  accumulated: any[] = [],
  visitedNodes: Set<any> = new Set()
): any[] => {
  if (!element || visitedNodes.has(element)) return accumulated;
  visitedNodes.add(element);
  if (element.type === 'subform' && element.subform) {
      const subFormDef = forms.find(f => f.id === element.subform!.formId);
      const subTable = tables.find(t => t.id === subFormDef?.sourceId);
      if (subTable) {
          accumulated.push({ 
              id: element.id, 
              tableName: subTable.name, 
              childField: tables.find(t => t.id === subFormDef!.sourceId)?.fields.find(f => f.id === element.subform!.childLinkFieldId)?.name 
          });
      }
  }
  if (element.children) {
      element.children.forEach(child => collectAngularSubforms(child, tables, forms, accumulated, visitedNodes));
  }
  return accumulated;
};

const collectAngularLookups = (
  element: any,
  tables: Table[],
  queries: Query[] = [],
  accumulated: Map<string, any> = new Map(),
  visitedNodes: Set<any> = new Set()
): any[] => {
  if (!element || visitedNodes.has(element)) return Array.from(accumulated.values());
  visitedNodes.add(element);
  
  if (element.widgetType === 'select' && element.lookup?.tableId) {
      const table = tables.find(t => t.id === element.lookup!.tableId);
      
      let targetName = '';
      let sortInfo = undefined;
      let isQuery = false;
      if (table) {
          targetName = table.name;
          if (element.lookup!.sort) {
              const sortField = table.fields.find(f => f.id === element.lookup!.sort!.fieldId);
              if (sortField) sortInfo = { field: toCamelCase(sortField.name), dir: element.lookup!.sort!.direction };
          }
      } else {
          const query = queries.find(q => q.id === element.lookup!.tableId);
          if (query) {
              targetName = query.name;
              isQuery = true;
              if (element.lookup!.sort) {
                  const sortField = (query as any).columns?.find((c: any) => c.id === element.lookup!.sort!.fieldId);
                  if (sortField) sortInfo = { field: toCamelCase(sortField.alias || sortField.fieldName), dir: element.lookup!.sort!.direction };
              }
          }
      }
      if (targetName && !accumulated.has(targetName)) {
          accumulated.set(targetName, { 
              name: targetName, 
              sort: sortInfo, 
              isQuery,
              table: table || queries.find(q => q.id === element.lookup!.tableId)
          });
      }
  }
  if (element.children) {
      element.children.forEach((c: any) => collectAngularLookups(c, tables, queries, accumulated));
  }
  return Array.from(accumulated.values());
};

const getCleanSuffix = (node: any, context: NodeGeneratorContext, defaultPrefix = 'node'): string => {
    const nodeId = node.id || 'unknown';
    const cache = context.nodeNameCache;
    const used = context.usedSuffixes;

    if (cache && cache.has(nodeId)) {
        return cache.get(nodeId)!;
    }

    let cleanName = defaultPrefix;
    if (node.props?.dataSourceType === 'table' && node.props?.dataSourceId) {
        const tObj = context.tables.find(t => t.id === node.props.dataSourceId);
        if (tObj) cleanName = tObj.name;
    } else if (node.props?.dataSourceType === 'query' && node.props?.dataSourceId) {
        const qObj = context.queries.find(q => q.id === node.props.dataSourceId);
        if (qObj) cleanName = qObj.name;
    }
    cleanName = cleanName.replace(/[^a-zA-Z0-9]/g, '_');
    
    let baseName = toCamelCase(cleanName);
    if (!baseName) {
        baseName = defaultPrefix;
    }
    
    let finalSuffix = baseName;
    let counter = 2;
    if (used) {
        while (used.has(finalSuffix)) {
            finalSuffix = `${baseName}_${counter}`;
            counter++;
        }
        used.add(finalSuffix);
    }
    
    if (cache) {
        cache.set(nodeId, finalSuffix);
    }
    return finalSuffix;
};

export const generateNode = (
    node: any, 
    context: NodeGeneratorContext, 
    pages: any[], 
    visitedPages: Set<string> = new Set(), 
    depth: number = 0,
    visitedNodes: Set<any> = new Set()
): string => {
    if (!node || depth > 15 || visitedNodes.has(node)) return '';
    visitedNodes.add(node);
    
    const evaluateBaseNode = (node: any, context: NodeGeneratorContext): string => {
        switch(node.type) {
            case 'row':
                return generateContainerNode({ ...node, props: { ...node.props, className: (node.props?.className || '') + ' row' } }, context, (n, ctx) => generateNode(n, ctx, pages, visitedPages, depth + 1, visitedNodes));
            case 'column':
                return generateContainerNode({ ...node, props: { ...node.props, className: (node.props?.className || '') + ' col' } }, context, (n, ctx) => generateNode(n, ctx, pages, visitedPages, depth + 1, visitedNodes));
        case 'card': {
            const childrenStr = (node.children || []).map((c: any) => generateNode(c, context, pages, visitedPages, depth + 1, visitedNodes)).join('\n');
            const titleText = node.props?.title ? compileAngularPlaceholders(node.props.title, context.currentContextVar) : '';
            const titleHtml = titleText 
                ? `<div class="card-header bg-light border-bottom font-weight-bold px-3 py-2 text-dark">${titleText}</div>`
                : '';
            return `
            <div class="card shadow-sm border overflow-hidden ${node.props?.className || ''}">
                ${titleHtml}
                <div class="card-body p-3">
                    ${childrenStr}
                </div>
            </div>`;
        }
        case 'sub_page':
            return generateContainerNode(node, context, (n, ctx) => generateNode(n, ctx, pages, visitedPages, depth + 1, visitedNodes));
        case 'form_view': {
            const formId = node.props?.formId;
            const fObj = context.forms.find(f => f.id === formId);
            if (!fObj) {
                return `<div class="p-3 text-muted text-center border border-dashed rounded">Kein Formular ausgewählt</div>`;
            }
            const tObj = context.tables.find(t => t.id === fObj.sourceId);
            if (!tObj) {
                return `<div class="p-3 text-danger text-center border border-dashed rounded">Tabelle für Formular nicht gefunden</div>`;
            }

            const formSubforms = fObj.layout ? collectAngularSubforms(fObj.layout, context.tables, context.forms) : [];
            formSubforms.forEach(s => {
                const listVar = `${toCamelCase(s.tableName)}SubList_${s.id.substring(0,8)}`;
                if (!context.states.some(st => st.startsWith(`${listVar}:`))) {
                    context.states.push(`${listVar}: any[] = [];`);
                }
            });

            const suffix = getCleanSuffix(node, context, 'form');
            const stateName = `formData_${suffix}`;
            const loadingState = `formLoading_${suffix}`;
            const savingState = `formSaving_${suffix}`;
            const statusState = `formStatus_${suffix}`; // { type: 'success' | 'error' | null, message: string }

            context.states.push(`${stateName}: any = {};`);
            context.states.push(`${loadingState}: boolean = false;`);
            context.states.push(`${savingState}: boolean = false;`);
            context.states.push(`${statusState}: { type: 'success' | 'error' | null, message: string } = { type: null, message: '' };`);

            // Fields to render
            const formFields = tObj.fields.filter(f => !f.isAutoIncrement);
            
            // Mode: 'create' or 'edit'
            const formMode = node.props?.formMode || 'create';
            const filterField = node.props?.filterParamField;
            const filterParam = node.props?.filterParamName;

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
                        defaultFields.push(`'${fCamel}': "${f.defaultValue.replace(/"/g, '\\"')}"`);
                    }
                }
            });

            // Init call for loading
            context.initCalls.push(`this.initForm_${suffix}();`);

            context.methods.push(`
  initForm_${suffix}() {
    this.${statusState} = { type: null, message: '' };
    let initialData: any = { ${defaultFields.join(', ')} };
    
    // Filter parameter pre-filling
    ${filterField && filterParam ? `
    const filterVal = this.queryParams['${filterParam}'];
    if (filterVal) {
      initialData['${toCamelCase(filterField)}'] = isNaN(Number(filterVal)) ? filterVal : Number(filterVal);
    }
    ` : ''}

    // If in edit mode, fetch record
    ${formMode === 'edit' ? `
    const editId = this.queryParams['selectedId'] || this.queryParams['${filterParam || 'id'}'];
    if (editId && editId !== 'new') {
      this.${loadingState} = true;
      this.api.getById('${toPascalCase(tObj.name)}', editId).subscribe({
        next: (res: any) => {
          this.${stateName} = { ...initialData, ...(res.data || res) };
          this.${loadingState} = false;
          
          // Load subforms
          ${formSubforms.map(s => {
              const tPascal = toPascalCase(s.tableName);
              const tName = toCamelCase(s.tableName);
              const fName = toCamelCase(s.childField);
              const listVar = `${tName}SubList_${s.id.substring(0,8)}`;
              return `
          this.api.getAll('${tPascal}', 1, 10000).subscribe((subRes: any) => {
            const allItems = subRes.data || subRes;
            this.${listVar} = allItems.filter((x: any) => String(x.${fName}) === String(editId) || String(x['${s.childField}']) === String(editId));
          });`;
          }).join('\n')}
        },
        error: (err: any) => {
          console.error(err);
          this.${statusState} = { type: 'error', message: 'Fehler beim Laden des Datensatzes' };
          this.${loadingState} = false;
        }
      });
      return;
    }
    ` : ''}

    this.${stateName} = initialData;
    ${formSubforms.map(s => {
        const tName = toCamelCase(s.tableName);
        const listVar = `${tName}SubList_${s.id.substring(0,8)}`;
        return `this.${listVar} = [];`;
    }).join('\n')}
  }`);

            // Submit logic
            const tblPascal = toPascalCase(tObj.name);
            context.methods.push(`
  submitForm_${suffix}() {
    this.${savingState} = true;
    this.${statusState} = { type: null, message: '' };
    const editId = this.queryParams['selectedId'] || this.queryParams['${filterParam || 'id'}'];
    const isEdit = ${formMode === 'edit'} && editId && editId !== 'new';
    
    const payload = { ...this.${stateName} };
    
    if (isEdit) {
      this.api.update('${tblPascal}', editId, payload).subscribe({
        next: () => {
          this.${statusState} = { type: 'success', message: 'Datensatz erfolgreich aktualisiert!' };
          this.${savingState} = false;
        },
        error: (err: any) => {
          console.error(err);
          this.${statusState} = { type: 'error', message: 'Fehler beim Speichern' };
          this.${savingState} = false;
        }
      });
    } else {
      this.api.create('${tblPascal}', payload).subscribe({
        next: () => {
          this.${statusState} = { type: 'success', message: 'Datensatz erfolgreich erstellt!' };
          this.${stateName} = { ${defaultFields.join(', ')} };
          this.${savingState} = false;
        },
        error: (err: any) => {
          console.error(err);
          this.${statusState} = { type: 'error', message: 'Fehler beim Erstellen' };
          this.${savingState} = false;
        }
      });
    }
  }`);

            const formLookups = fObj.layout ? collectAngularLookups(fObj.layout, context.tables, context.queries) : [];
            formLookups.forEach((l: any) => {
                const camel = toCamelCase(l.name);
                if (!context.states.some(s => s.startsWith(`${camel}List:`))) {
                    context.states.push(`${camel}List: any[] = [];`);
                    
                    let sortLogic = '';
                    if (l.sort) {
                        const dir = l.sort.dir === 'DESC' ? -1 : 1;
                        sortLogic = `.sort((a: any, b: any) => (a.${l.sort.field} > b.${l.sort.field} ? ${dir} : -1 * ${dir}))`;
                    }
                    
                    if (l.isQuery) {
                        context.methods.push(`
  loadLookup_${camel}() {
    const params: Record<string, any> = {};
    this.api.getAll('queries/${camel}', 1, 10000, '', params).subscribe((res: any) => this.${camel}List = (res.data || res)${sortLogic});
  }`);
                    } else {
                        context.methods.push(`
  loadLookup_${camel}() {
    this.api.getAll('${toPascalCase(l.name)}', 1, 10000).subscribe((res: any) => this.${camel}List = (res.data || res)${sortLogic});
  }`);
                    }
                    
                    context.initCalls.push(`this.loadLookup_${camel}();`);
                }
            });

            // Fields HTML
            let fieldsHtml = '';
            if (fObj.layout) {
                fieldsHtml = generateHtmlForLayout(fObj.layout, context.tables, context.forms, stateName, context.queries, context.isBootstrap);
            } else {
                // Generate simple template-driven inputs
                fieldsHtml = formFields.map(f => {
                    const fCamel = toCamelCase(f.name);
                    const label = f.comment || f.name;
                    let input = '';
                    if (f.type === 'BOOLEAN') {
                        if (context.isBootstrap) {
                            input = `
                            <div class="form-check mt-2">
                                <input 
                                    type="checkbox" 
                                    id="${fCamel}_${suffix}"
                                    [(ngModel)]="${stateName}['${fCamel}']"
                                    name="${fCamel}_${suffix}"
                                    class="form-check-input" 
                                />
                                <label for="${fCamel}_${suffix}" class="form-check-label fw-semibold">${label}</label>
                            </div>`;
                        } else {
                            input = `
                            <div class="flex items-center gap-2 mt-2">
                                <input 
                                    type="checkbox" 
                                    id="${fCamel}_${suffix}"
                                    [(ngModel)]="${stateName}['${fCamel}']"
                                    name="${fCamel}_${suffix}"
                                    class="h-4 w-4 text-blue-600 border-slate-300 rounded" 
                                />
                                <label for="${fCamel}_${suffix}" class="text-sm font-semibold text-slate-700">${label}</label>
                            </div>`;
                        }
                    } else if (f.type === 'INTEGER' || f.type === 'DECIMAL' || f.type === 'DOUBLE') {
                        if (context.isBootstrap) {
                            input = `
                            <label class="form-label fw-bold small text-muted text-uppercase mb-1">${label}</label>
                            <input 
                                type="number" 
                                [(ngModel)]="${stateName}['${fCamel}']"
                                name="${fCamel}_${suffix}"
                                class="form-control" 
                                step="${f.type === 'INTEGER' ? '1' : 'any'}"
                            />`;
                        } else {
                            input = `
                            <label class="block text-sm font-semibold text-slate-700 mb-1">${label}</label>
                            <input 
                                type="number" 
                                [(ngModel)]="${stateName}['${fCamel}']"
                                name="${fCamel}_${suffix}"
                                class="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all" 
                                step="${f.type === 'INTEGER' ? '1' : 'any'}"
                            />`;
                        }
                    } else if (f.type === 'DATE') {
                        if (context.isBootstrap) {
                            input = `
                            <label class="form-label fw-bold small text-muted text-uppercase mb-1">${label}</label>
                            <input 
                                type="date" 
                                [(ngModel)]="${stateName}['${fCamel}']"
                                name="${fCamel}_${suffix}"
                                class="form-control" 
                            />`;
                        } else {
                            input = `
                            <label class="block text-sm font-semibold text-slate-700 mb-1">${label}</label>
                            <input 
                                type="date" 
                                [(ngModel)]="${stateName}['${fCamel}']"
                                name="${fCamel}_${suffix}"
                                class="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all" 
                            />`;
                        }
                    } else {
                        if (context.isBootstrap) {
                            input = `
                            <label class="form-label fw-bold small text-muted text-uppercase mb-1">${label}</label>
                            <input 
                                type="text" 
                                [(ngModel)]="${stateName}['${fCamel}']"
                                name="${fCamel}_${suffix}"
                                class="form-control" 
                            />`;
                        } else {
                            input = `
                            <label class="block text-sm font-semibold text-slate-700 mb-1">${label}</label>
                            <input 
                                type="text" 
                                [(ngModel)]="${stateName}['${fCamel}']"
                                name="${fCamel}_${suffix}"
                                class="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all" 
                            />`;
                        }
                    }
                    if (context.isBootstrap) {
                        return `<div class="col-md-6 text-start mb-3">${input}</div>`;
                    } else {
                        return `<div class="text-start">${input}</div>`;
                    }
                }).join('\n');

                if (context.isBootstrap) {
                    fieldsHtml = `<div class="row">${fieldsHtml}</div>`;
                } else {
                    fieldsHtml = `<div class="grid grid-cols-1 md:grid-cols-2 gap-4">${fieldsHtml}</div>`;
                }
            }

            if (context.isBootstrap) {
                return `
                <div class="card p-4 mb-4 bg-white shadow-sm border rounded-3">
                    <div *ngIf="!${node.props?.hideHeader ? 'true' : 'false'}" class="border-bottom pb-2 mb-4 text-start">
                        <h4 class="h5 mb-1 text-dark fw-bold">${fObj.name}</h4>
                        <p class="text-muted small mb-0">${formMode === 'edit' ? 'Eintrag bearbeiten' : 'Neuen Eintrag erstellen'}</p>
                    </div>

                    <div *ngIf="${statusState}.type" class="alert mb-4 text-start" [ngClass]="{'alert-success': ${statusState}.type === 'success', 'alert-danger': ${statusState}.type === 'error'}">
                        {{ ${statusState}.message }}
                    </div>

                    <div *ngIf="${loadingState}" class="text-center p-4">
                        <div class="spinner-border text-primary" role="status">
                            <span class="visually-hidden">Lade...</span>
                        </div>
                    </div>

                    <form *ngIf="!${loadingState}" (ngSubmit)="submitForm_${suffix}()">
                        ${fieldsHtml}
                        
                        <div *ngIf="!${node.props?.hideActions ? 'true' : 'false'}" class="col-12 d-flex justify-content-end mt-4 pt-3 border-top">
                            <button type="submit" [disabled]="${savingState}" class="btn btn-primary px-4 fw-bold cursor-pointer">
                                <span *ngIf="${savingState}" class="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                                Speichern
                            </button>
                        </div>
                    </form>
                </div>
                `;
            } else {
                return `
                <div class="bg-white rounded-xl shadow-md border border-slate-200 overflow-hidden mb-6">
                    <div *ngIf="!${node.props?.hideHeader ? 'true' : 'false'}" class="bg-slate-50 border-b border-slate-200 px-6 py-4 text-start">
                        <h4 class="text-lg font-bold text-slate-800">${fObj.name}</h4>
                        <p class="text-xs text-slate-500 mt-1">${formMode === 'edit' ? 'Eintrag bearbeiten' : 'Neuen Eintrag erstellen'}</p>
                    </div>

                    <div class="p-6">
                        <div *ngIf="${statusState}.type" class="mb-4 text-start p-3 rounded-lg text-sm" [ngClass]="{'bg-emerald-50 text-emerald-800 border border-emerald-200': ${statusState}.type === 'success', 'bg-rose-50 text-rose-800 border border-rose-200': ${statusState}.type === 'error'}">
                            {{ ${statusState}.message }}
                        </div>

                        <div *ngIf="${loadingState}" class="flex justify-center py-6">
                            <svg class="animate-spin h-5 w-5 text-blue-600" fill="none" viewBox="0 0 24 24">
                                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                        </div>

                        <form *ngIf="!${loadingState}" (ngSubmit)="submitForm_${suffix}()">
                            ${fieldsHtml}
                            
                            <div *ngIf="!${node.props?.hideActions ? 'true' : 'false'}" class="flex justify-end mt-6 pt-4 border-t border-slate-200">
                                <button type="submit" [disabled]="${savingState}" class="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white px-5 py-2 rounded-lg text-sm font-semibold shadow-sm transition-colors cursor-pointer flex items-center flex-row">
                                    <svg *ngIf="${savingState}" class="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                                        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                                        <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                    Speichern
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
                `;
            }
        }
        case 'container': {
            const hasDataSource = !!node.props?.dataSourceId;
            if (hasDataSource) {
                const suffix = getCleanSuffix(node, context, 'container');
                const stateName = `data_${suffix}`;
                const loadingState = `loading_${suffix}`;
                const paginatedName = `finalData_${suffix}`;
                const containerContext = `containerContext_${suffix}`;

                context.states.push(`${stateName}: any[] = [];`);
                context.states.push(`${loadingState}: boolean = false;`);

                let fetchUrl = '';
                if (node.props?.dataSourceType === 'table' && node.props?.dataSourceId) {
                    const tObj = context.tables.find(t => t.id === node.props.dataSourceId);
                    if (tObj) fetchUrl = `${toPascalCase(tObj.name)}`;
                } else if (node.props?.dataSourceType === 'query' && node.props?.dataSourceId) {
                    const qObj = context.queries.find(q => q.id === node.props.dataSourceId);
                    if (qObj) fetchUrl = `queries/${toCamelCase(qObj.name)}`;
                }

                if (fetchUrl) {
                    context.initCalls.push(`this.loadData_${suffix}();`);
                    context.methods.push(`
  loadData_${suffix}() {
    this.${loadingState} = true;
    this.api.getAll('${fetchUrl}', 1, 10000).subscribe({
      next: (res: any) => {
        this.${stateName} = res.data || res || [];
        this.${loadingState} = false;
      },
      error: (err) => {
        console.error(err);
        this.${loadingState} = false;
      }
    });
  }`);
                }

                const filterParamField = node.props?.filterParamField;
                const filterParamName = node.props?.filterParamName;
                let filterSnippet = '';
                if (filterParamField && filterParamName) {
                    filterSnippet = `
    const filterVal = this.queryParams?.['${filterParamName}'];
    if (filterVal !== undefined && filterVal !== null && filterVal !== '') {
      items = items.filter(row => String(row['${toCamelCase(filterParamField)}'] || row['${filterParamField}'] || '') === String(filterVal));
    } else {
      items = [];
    }`;
                }

                context.methods.push(`
  get ${paginatedName}(): any[] {
    let items = this.${stateName} || [];
    ${filterSnippet}
    return items;
  }`);

                context.methods.push(`
  get ${containerContext}(): any {
    const items = this.${paginatedName};
    return items && items.length > 0 ? items[0] : null;
  }`);

                const innerCtx = { ...context, currentContextVar: containerContext };
                const childrenStr = (node.children || []).map((c: any) => generateNode(c, innerCtx, pages, visitedPages, depth + 1, visitedNodes)).join('\n');
                const classNameStr = node.props?.className || '';
                const styleAttr = node.props?.style ? `style="${Object.entries(node.props.style).map(([k,v]) => `${toKebabCase(k)}:${v}`).join(';')}"` : '';

                return `
                <div class="${classNameStr || 'p-3 border rounded bg-white'}" ${styleAttr}>
                    <div *ngIf="${loadingState}" class="text-center p-3">Lade Daten...</div>
                    <ng-container *ngIf="!${loadingState}">
                        ${childrenStr}
                    </ng-container>
                </div>`;
            } else {
                return generateContainerNode(node, context, (n, ctx) => generateNode(n, ctx, pages, visitedPages, depth + 1, visitedNodes));
            }
        }
        case 'text':
            return generateTextNode(node, context);
        case 'button':
            return generateButtonNode(node, context);
        case 'divider':
            return generateDividerNode(node, context);
        case 'image':
            return generateImageNode(node, context);
        case 'html':
            return generateHtmlNode(node, context);
        case 'dropdown':
            return generateDropdownNode(node, context);
        case 'table_view':
            return generateTableViewNode(node, context, pages);
        case 'custom_component':
            return generateCustomComponentNode(node, context);

        case 'subform':
            return generateSubformNode(node, context);

        case 'grid_layout':
        case 'tabs_container':
        case 'stat_card':
        case 'kpi_widget':
        case 'alert_box':
        case 'badge_pill':
        case 'action_group':
        case 'search_filter_bar':
            return generateWidgetNode(node, context, (n, ctx) => generateNode(n, ctx, pages, visitedPages, depth + 1, visitedNodes));

        case 'navbar': {
            return `
              <div class="w-100 d-flex align-items-center justify-content-between p-3 bg-white border-bottom shadow-sm ${node.props?.className || ''}">
                   <div class="fw-bold fs-5">${node.props?.brandName || 'BrandLogo'}</div>
                   <div class="d-flex gap-3 text-secondary fw-medium">
                       <a href="#" class="text-decoration-none">Home</a>
                       <a href="#" class="text-decoration-none">Features</a>
                       <a href="#" class="text-decoration-none">Pricing</a>
                       <a href="#" class="text-decoration-none">Contact</a>
                   </div>
               </div>
            `;
        }
        case 'hero_section': {
            return `
               <div class="w-100 p-5 text-center bg-light ${node.props?.className || ''}">
                   <h1 class="display-4 fw-bold mb-4">${node.props?.headline || 'Catchy Headline Here'}</h1>
                   <p class="lead text-secondary mx-auto mb-5" style="max-width: 600px;">${node.props?.subheadline || 'A compelling subheadline that explains the value proposition of your product or service.'}</p>
                   <div class="d-flex justify-content-center gap-3">
                       <button class="btn btn-primary btn-lg fw-bold px-4 shadow-sm">${node.props?.primaryButtonText || 'Get Started'}</button>
                       <button class="btn btn-light btn-lg fw-bold px-4 border shadow-sm">${node.props?.secondaryButtonText || 'Learn More'}</button>
                   </div>
               </div>
            `;
        }
        case 'feature_grid': {
            return `
               <div class="w-100 p-5 bg-white ${node.props?.className || ''}">
                   <div class="text-center mb-5">
                       <h2 class="fw-bold">${node.props?.title || 'Amazing Features'}</h2>
                       <p class="text-secondary">${node.props?.subtitle || 'Everything you need to succeed.'}</p>
                   </div>
                   <div class="row g-4">
                       <div class="col-md-4">
                           <div class="card h-100 text-center p-4 border-0 bg-light">
                               <div class="card-body">
                                   <div class="mb-3 fs-2">✨</div>
                                   <h5 class="card-title fw-bold">Feature 1</h5>
                                   <p class="card-text text-secondary small">Description for this amazing feature.</p>
                               </div>
                           </div>
                       </div>
                       <div class="col-md-4">
                           <div class="card h-100 text-center p-4 border-0 bg-light">
                               <div class="card-body">
                                   <div class="mb-3 fs-2">✨</div>
                                   <h5 class="card-title fw-bold">Feature 2</h5>
                                   <p class="card-text text-secondary small">Description for this amazing feature.</p>
                               </div>
                           </div>
                       </div>
                       <div class="col-md-4">
                           <div class="card h-100 text-center p-4 border-0 bg-light">
                               <div class="card-body">
                                   <div class="mb-3 fs-2">✨</div>
                                   <h5 class="card-title fw-bold">Feature 3</h5>
                                   <p class="card-text text-secondary small">Description for this amazing feature.</p>
                               </div>
                           </div>
                       </div>
                   </div>
               </div>
            `;
        }
        case 'pricing_table': {
            return `
               <div class="w-100 p-5 bg-light ${node.props?.className || ''}">
                   <div class="text-center mb-5">
                       <h2 class="fw-bold">Simple Pricing</h2>
                   </div>
                   <div class="row g-4 justify-content-center">
                       <div class="col-md-4">
                           <div class="card h-100 p-4 border-0 shadow-sm">
                               <div class="card-body">
                                   <h4 class="card-title fw-bold mb-3">Basic</h4>
                                   <h2 class="card-text fw-bold mb-4">$19<span class="fs-6 fw-normal text-secondary">/mo</span></h2>
                                   <ul class="list-unstyled mb-4">
                                       <li class="mb-2">✓ Feature A</li>
                                       <li class="mb-2">✓ Feature B</li>
                                       <li class="mb-2">✓ Feature C</li>
                                   </ul>
                                   <button class="btn btn-light w-100 fw-bold">Choose Plan</button>
                               </div>
                           </div>
                       </div>
                       <div class="col-md-4">
                           <div class="card h-100 p-4 border-primary shadow bg-white position-relative" style="transform: scale(1.05); z-index: 1;">
                               <div class="position-absolute top-0 start-50 translate-middle badge bg-primary rounded-pill px-3 py-2">MOST POPULAR</div>
                               <div class="card-body">
                                   <h4 class="card-title fw-bold mb-3">Pro</h4>
                                   <h2 class="card-text fw-bold mb-4">$38<span class="fs-6 fw-normal text-secondary">/mo</span></h2>
                                   <ul class="list-unstyled mb-4">
                                       <li class="mb-2">✓ Feature A</li>
                                       <li class="mb-2">✓ Feature B</li>
                                       <li class="mb-2">✓ Feature C</li>
                                   </ul>
                                   <button class="btn btn-primary w-100 fw-bold">Choose Plan</button>
                               </div>
                           </div>
                       </div>
                       <div class="col-md-4">
                           <div class="card h-100 p-4 border-0 shadow-sm">
                               <div class="card-body">
                                   <h4 class="card-title fw-bold mb-3">Enterprise</h4>
                                   <h2 class="card-text fw-bold mb-4">$57<span class="fs-6 fw-normal text-secondary">/mo</span></h2>
                                   <ul class="list-unstyled mb-4">
                                       <li class="mb-2">✓ Feature A</li>
                                       <li class="mb-2">✓ Feature B</li>
                                       <li class="mb-2">✓ Feature C</li>
                                   </ul>
                                   <button class="btn btn-light w-100 fw-bold">Choose Plan</button>
                               </div>
                           </div>
                       </div>
                   </div>
               </div>
            `;
        }
        case 'testimonial': {
            return `
               <div class="w-100 p-5 bg-white text-center ${node.props?.className || ''}">
                   <div class="mx-auto" style="max-width: 800px;">
                       <div class="display-4 text-primary mb-3">"</div>
                       <p class="fs-4 fst-italic mb-5">${node.props?.quote || 'This product completely transformed how we work. Highly recommended!'}</p>
                       <div class="d-flex align-items-center justify-content-center gap-3">
                           <div class="bg-secondary text-white rounded-circle d-flex align-items-center justify-content-center fw-bold" style="width: 40px; height: 40px;">${(node.props?.author || 'Jane Doe').charAt(0)}</div>
                           <div class="text-start">
                               <div class="fw-bold">${node.props?.author || 'Jane Doe'}</div>
                               <div class="small text-secondary">${node.props?.role || 'CEO, Company Inc'}</div>
                           </div>
                       </div>
                   </div>
               </div>
            `;
        }
        case 'footer': {
            return `
               <div class="w-100 p-5 bg-dark text-light ${node.props?.className || ''}">
                   <div class="row mb-4 border-bottom border-secondary pb-4">
                       <div class="col-md-6 mb-4 mb-md-0">
                           <h4 class="fw-bold text-white mb-3">${node.props?.brandName || 'BrandLogo'}</h4>
                           <p class="text-secondary small" style="max-width: 300px;">Making the world a better place through constructing elegant hierarchies and building amazing products.</p>
                       </div>
                       <div class="col-md-3 mb-4 mb-md-0">
                           <h5 class="text-white fw-bold mb-3">Product</h5>
                           <ul class="list-unstyled small text-secondary">
                               <li class="mb-2"><a href="#" class="text-decoration-none text-secondary">Features</a></li>
                               <li class="mb-2"><a href="#" class="text-decoration-none text-secondary">Pricing</a></li>
                               <li><a href="#" class="text-decoration-none text-secondary">Docs</a></li>
                           </ul>
                       </div>
                       <div class="col-md-3">
                           <h5 class="text-white fw-bold mb-3">Company</h5>
                           <ul class="list-unstyled small text-secondary">
                               <li class="mb-2"><a href="#" class="text-decoration-none text-secondary">About</a></li>
                               <li class="mb-2"><a href="#" class="text-decoration-none text-secondary">Blog</a></li>
                               <li><a href="#" class="text-decoration-none text-secondary">Contact</a></li>
                           </ul>
                       </div>
                   </div>
                   <div class="d-flex justify-content-between align-items-center small text-secondary">
                       <p class="mb-0">© 2024 Your Company. All rights reserved.</p>
                       <div class="d-flex gap-3">
                           <a href="#" class="text-secondary text-decoration-none">Twitter</a>
                           <a href="#" class="text-secondary text-decoration-none">GitHub</a>
                       </div>
                   </div>
               </div>
            `;
        }

        case 'list_repeater': {
            const suffix = getCleanSuffix(node, context, 'repeater');
            const stateName = `data_${suffix}`;
            const loadingState = `loading_${suffix}`;
            const paginatedName = `finalData_${suffix}`;

            context.states.push(`${stateName}: any[] = [];`);
            context.states.push(`${loadingState}: boolean = false;`);

            let fetchUrl = '';
            if (node.props?.dataSourceType === 'table' && node.props?.dataSourceId) {
                const tObj = context.tables.find(t => t.id === node.props.dataSourceId);
                if (tObj) fetchUrl = `${toPascalCase(tObj.name)}`;
            } else if (node.props?.dataSourceType === 'query' && node.props?.dataSourceId) {
                const qObj = context.queries.find(q => q.id === node.props.dataSourceId);
                if (qObj) fetchUrl = `queries/${toCamelCase(qObj.name)}`;
            }

            if (fetchUrl) {
                context.initCalls.push(`this.loadData_${suffix}();`);
                context.methods.push(`
  loadData_${suffix}() {
    this.${loadingState} = true;
    this.api.getAll('${fetchUrl}', 1, 10000).subscribe({
      next: (res: any) => {
        this.${stateName} = res.data || res || [];
        this.${loadingState} = false;
      },
      error: (err) => {
        console.error(err);
        this.${loadingState} = false;
      }
    });
  }`);
            }

            const filterParamField = node.props?.filterParamField;
            const filterParamName = node.props?.filterParamName;
            let filterSnippet = '';
            if (filterParamField && filterParamName) {
                filterSnippet = `
    const filterVal = this.queryParams?.['${filterParamName}'];
    if (filterVal !== undefined && filterVal !== null && filterVal !== '') {
      items = items.filter(row => String(row['${toCamelCase(filterParamField)}'] || row['${filterParamField}'] || '') === String(filterVal));
    } else {
      items = [];
    }`;
            }

            context.methods.push(`
  get ${paginatedName}(): any[] {
    let items = this.${stateName} || [];
    ${filterSnippet}
    return items;
  }`);

            const rowVar = `row_${suffix}`;
            const innerCtx = { ...context, currentContextVar: rowVar };
            const childrenStr = (node.children || []).map((c: any) => generateNode(c, innerCtx, pages, visitedPages, depth + 1, visitedNodes)).join('\n');
            const classNameStr = node.props?.className || 'space-y-3';
            const styleAttr = node.props?.style ? `style="${Object.entries(node.props.style).map(([k,v]) => `${toKebabCase(k)}:${v}`).join(';')}"` : '';

            return `
            <div class="${classNameStr}" ${styleAttr}>
                <div *ngIf="${loadingState}" class="text-center p-3">Lade Daten...</div>
                <ng-container *ngIf="!${loadingState}">
                    <div *ngFor="let ${rowVar} of ${paginatedName}; let idx_${suffix} = index" class="bg-light p-3 border rounded mb-3 position-relative">
                        ${childrenStr}
                    </div>
                    <div *ngIf="${paginatedName}.length === 0" class="text-center p-3 text-muted italic">Keine Einträge für Repeater</div>
                </ng-container>
            </div>`;
        }

        case 'subpage_container': {
            const subPageId = node.props?.subPageId;
            const subPage = pages?.find(p => p.id === subPageId);
            if (!subPage) {
                return `<div class="p-3 border border-dashed border-danger rounded text-danger italic">Subpage nicht gefunden</div>`;
            }
            if (visitedPages.has(subPage.id) || depth >= 10) {
                return `<!-- Subpage ${subPage.name || subPage.id} cycle/depth guard -->`;
            }
            const nextVisitedPages = new Set(visitedPages);
            nextVisitedPages.add(subPage.id);
            const subpageLayoutHtml = generateNode(subPage.layout, context, pages, nextVisitedPages, depth + 1, visitedNodes);
            return `
            <div class="w-100 bg-light border border-dashed rounded p-3 position-relative">
                ${subpageLayoutHtml}
            </div>`;
        }

        default:
            return `<div class="p-3 bg-light border rounded text-secondary small">${node.type} Component</div>`;
        }
    };

    let nodeHtml = evaluateBaseNode(node, context);

    if (node.props?.visibilityField) {
        const vField = node.props.visibilityField;
        const vOperator = node.props.visibilityOperator || '==';
        const vExpected = node.props.visibilityValue || '';
        
        let valExpr = '';
        if (context.currentContextVar) {
            valExpr = `(${context.currentContextVar}?.\['${vField}'\] !== undefined ? String(${context.currentContextVar}?.\['${vField}'\] ?? '') : (${context.currentContextVar}?.\['${toCamelCase(vField)}'\] !== undefined ? String(${context.currentContextVar}?.\['${toCamelCase(vField)}'\] ?? '') : String(queryParams?.\['${vField}'\] ?? '')))`;
        } else {
            valExpr = `String(queryParams?.\['${vField}'\] ?? '')`;
        }
        
        let cond = 'true';
        if (vOperator === '==') {
            cond = `${valExpr} === '${vExpected.replace(/'/g, "\\'")}'`;
        } else if (vOperator === '!=') {
            cond = `${valExpr} !== '${vExpected.replace(/'/g, "\\'")}'`;
        } else if (vOperator === '>') {
            cond = `parseFloat(${valExpr}) > parseFloat('${vExpected}')`;
        } else if (vOperator === '<') {
            cond = `parseFloat(${valExpr}) < parseFloat('${vExpected}')`;
        } else if (vOperator === 'contains') {
            cond = `${valExpr}.toLowerCase().includes('${vExpected.replace(/'/g, "\\'")}'.toLowerCase())`;
        } else if (vOperator === 'not_empty') {
            cond = `${valExpr} !== '' && ${valExpr} !== 'undefined' && ${valExpr} !== 'null'`;
        } else if (vOperator === 'empty') {
            cond = `${valExpr} === '' || ${valExpr} === 'undefined' || ${valExpr} === 'null'`;
        }
        
        nodeHtml = `<ng-container *ngIf="${cond}">${nodeHtml}</ng-container>`;
    }

    return nodeHtml;
};
