import { Table, FormElement, Form } from '../../../types/index';
import { toCamelCase, toPascalCase } from '../common';

const getBootstrapWidthClass = (width: string | undefined): string => {
  if (!width) return '';
  switch (width) {
    case '1/12': return 'col-1';
    case '1/6': return 'col-2';
    case '1/4': return 'col-3';
    case '1/3': return 'col-4';
    case '5/12': return 'col-5';
    case '1/2': return 'col-6';
    case '7/12': return 'col-7';
    case '2/3': return 'col-8';
    case '3/4': return 'col-9';
    case '5/6': return 'col-10';
    case '11/12': return 'col-11';
    case 'full': return 'col-12';
    default: return '';
  }
};

const getTailwindWidthClass = (width: string | undefined): string => {
  if (!width) return '';
  switch (width) {
    case '1/12': return 'col-span-1 w-full md:w-1/12';
    case '1/6': return 'col-span-2 w-full md:w-1/6';
    case '1/4': return 'col-span-3 w-full md:w-1/4';
    case '1/3': return 'col-span-4 w-full md:w-1/3';
    case '5/12': return 'col-span-5 w-full md:w-5/12';
    case '1/2': return 'col-span-6 w-full md:w-1/2';
    case '7/12': return 'col-span-7 w-full md:w-7/12';
    case '2/3': return 'col-span-8 w-full md:w-2/3';
    case '3/4': return 'col-span-9 w-full md:w-3/4';
    case '5/6': return 'col-span-10 w-full md:w-5/6';
    case '11/12': return 'col-span-11 w-full md:w-11/12';
    case 'full': return 'col-span-12 w-full';
    default: return '';
  }
};

export const generateHtmlForLayout = (
    element: FormElement, 
    tables: Table[], 
    forms: Form[], 
    dataObjName: string = "data", 
    queries: any[] = [],
    isBootstrap: boolean = false,
    ignoredFieldIds: string[] = [],
    visitedForms: Set<string> = new Set(),
    depth: number = 0,
    visitedElements: Set<any> = new Set()
): string => {
    if (!element || depth > 12 || visitedElements.has(element)) return '';
    visitedElements.add(element);

    if (element.type === 'container') {
        const children = element.children?.map(c => generateHtmlForLayout(c, tables, forms, dataObjName, queries, isBootstrap, ignoredFieldIds, visitedForms, depth + 1, visitedElements)).join('\n') || '';
        const defaultClass = isBootstrap ? 'row g-3' : 'space-y-4';
        const widthClass = isBootstrap ? getBootstrapWidthClass(element.width) : getTailwindWidthClass(element.width);
        let className = element.className || defaultClass;
        if (widthClass) {
             className = `${className} ${widthClass}`.trim();
        }
        return `<div class="${className}">\n${children}\n</div>`;
    }
    if (element.type === 'tabs') {
        const tabPages = element.children || [];
        const widthClass = isBootstrap ? getBootstrapWidthClass(element.width) : getTailwindWidthClass(element.width);
        const tabsId = element.id.replace(/[^a-zA-Z0-9_]/g, '_');
        
        if (isBootstrap) {
            const navItems = tabPages.map((tab, idx) => `
                <li class="nav-item">
                    <button class="nav-link" [class.active]="(tabs['${tabsId}'] || '${tabPages[0]?.id || ''}') === '${tab.id}'" (click)="tabs['${tabsId}'] = '${tab.id}'" type="button">
                        ${tab.label || `Tab ${idx + 1}`}
                    </button>
                </li>
            `).join('\n');
            const pagesHtml = tabPages.map(tab => {
                const content = tab.children?.map(c => generateHtmlForLayout(c, tables, forms, dataObjName, queries, isBootstrap, ignoredFieldIds, visitedForms, depth + 1, visitedElements)).join('\n') || '';
                return `
                <div *ngIf="(tabs['${tabsId}'] || '${tabPages[0]?.id || ''}') === '${tab.id}'" class="p-3">
                    ${content}
                </div>`;
            }).join('\n');
            return `
            <div class="card my-3 ${widthClass}">
                <div class="card-header">
                    <ul class="nav nav-tabs card-header-tabs">
                        ${navItems}
                    </ul>
                </div>
                <div class="card-body">
                    ${pagesHtml}
                </div>
            </div>`;
        } else {
            const navItems = tabPages.map((tab, idx) => `
                <button type="button" (click)="tabs['${tabsId}'] = '${tab.id}'" class="px-4 py-2.5 text-xs md:text-sm font-semibold border-b-2 transition-all" [class.border-blue-600]="(tabs['${tabsId}'] || '${tabPages[0]?.id || ''}') === '${tab.id}'" [class.text-blue-600]="(tabs['${tabsId}'] || '${tabPages[0]?.id || ''}') === '${tab.id}'" [class.bg-white]="(tabs['${tabsId}'] || '${tabPages[0]?.id || ''}') === '${tab.id}'" [class.border-transparent]="(tabs['${tabsId}'] || '${tabPages[0]?.id || ''}') !== '${tab.id}'" [class.text-slate-500]="(tabs['${tabsId}'] || '${tabPages[0]?.id || ''}') !== '${tab.id}'">
                    ${tab.label || `Tab ${idx + 1}`}
                </button>
            `).join('\n');
            const pagesHtml = tabPages.map(tab => {
                const content = tab.children?.map(c => generateHtmlForLayout(c, tables, forms, dataObjName, queries, isBootstrap, ignoredFieldIds, visitedForms, depth + 1, visitedElements)).join('\n') || '';
                return `
                <div *ngIf="(tabs['${tabsId}'] || '${tabPages[0]?.id || ''}') === '${tab.id}'" class="p-4 bg-white">
                    ${content}
                </div>`;
            }).join('\n');
            return `
            <div class="w-full bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm my-4 ${element.className || ''} ${widthClass}">
                <div class="flex border-b border-slate-200 bg-slate-50 px-2 overflow-x-auto whitespace-nowrap">
                    ${navItems}
                </div>
                ${pagesHtml}
            </div>`;
        }
    }
    if (element.type === 'tab_page') {
        const content = element.children?.map(c => generateHtmlForLayout(c, tables, forms, dataObjName, queries, isBootstrap, ignoredFieldIds, visitedForms, depth + 1, visitedElements)).join('\n') || '';
        return `<div class="${element.className || 'space-y-4'}">\n${content}\n</div>`;
    }
    if (element.type === 'label') {
        const labelClass = isBootstrap ? 'h5 mb-3 pb-2 border-bottom text-dark mt-3' : 'font-bold text-lg mb-2 text-slate-800 border-b pb-1';
        const widthClass = isBootstrap ? getBootstrapWidthClass(element.width) : getTailwindWidthClass(element.width);
        const className = `${element.className || labelClass} ${widthClass}`.trim();
        return `<div class="${className}">${element.label}</div>`;
    }
    if (element.type === 'field' && element.fieldId) {
        if (ignoredFieldIds && ignoredFieldIds.includes(element.fieldId)) {
            return `<!-- Hidden parent link field: ${element.label} -->`;
        }
        let fieldName = '';
        let inputType = 'text';
        let foundField: any = null;
        
        for (const t of tables) {
            const f = t.fields.find(field => field.id === element.fieldId);
            if (f) {
                foundField = f;
                fieldName = ((f as any).name || (f as any).alias || (f as any).fieldName);
                if (f.type === 'INTEGER' || f.type === 'DECIMAL' || f.type === 'DOUBLE') inputType = 'number';
                if (f.type === 'DATE') inputType = 'date';
                else if (f.type === 'TIME') inputType = 'time';
                else if (f.type === 'DATETIME' || f.type === 'TIMESTAMP') inputType = 'datetime-local';
                if (f.type === 'BOOLEAN') inputType = 'checkbox';
                break;
            }
        }
        if (!fieldName) return `<!-- Field not found: ${element.label} -->`;
        
        const bindProp = toCamelCase(fieldName);
        const widthClass = isBootstrap ? getBootstrapWidthClass(element.width) : getTailwindWidthClass(element.width);
        const wrapperClass = isBootstrap 
            ? `${element.className || 'mb-3'} ${widthClass}`.trim() 
            : `${element.className || 'mb-4'} ${widthClass}`.trim();
        const labelClass = isBootstrap ? "form-label fw-bold text-secondary small" : "block text-sm font-semibold text-slate-700 mb-1";
        const inputClass = isBootstrap 
            ? "form-control" 
            : "w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all";

        // Current User (WhoAmI)
        if (element.widgetType === 'current-user') {
            if (isBootstrap) {
                return `
                <div class="${wrapperClass}">
                    <label class="${labelClass}">${element.label}</label>
                    <div class="input-group">
                        <input type="text" readonly [(ngModel)]="${dataObjName}['${bindProp}']" name="${dataObjName}_${bindProp}" class="form-control bg-light font-monospace" placeholder="(Leer)"/>
                        <button type="button" (click)="openUserPicker('me', '${bindProp}')" class="btn btn-success">Ich (Auto)</button>
                    </div>
                </div>`;
            }
            return `
            <div class="${wrapperClass}">
                <label class="${labelClass}">${element.label}</label>
                <div class="flex gap-2">
                    <input type="text" readonly [(ngModel)]="${dataObjName}['${bindProp}']" name="${dataObjName}_${bindProp}" class="${inputClass} bg-emerald-50 text-emerald-900 font-mono" placeholder="(Leer)"/>
                    <button type="button" (click)="openUserPicker('me', '${bindProp}')" class="bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-1 rounded text-xs font-bold shadow-sm transition-colors whitespace-nowrap">Ich (Auto)</button>
                </div>
            </div>`;
        }

        // AD Search
        if (element.widgetType === 'ad-search') {
            if (isBootstrap) {
                return `
                <div class="${wrapperClass}">
                    <label class="${labelClass}">${element.label}</label>
                    <div class="input-group">
                        <input type="text" [(ngModel)]="${dataObjName}['${bindProp}']" name="${dataObjName}_${bindProp}" class="form-control" placeholder="Benutzer auswählen..."/>
                        <button type="button" (click)="openUserPicker('search', '${bindProp}')" class="btn btn-primary">Suchen</button>
                    </div>
                </div>`;
            }
            return `
            <div class="${wrapperClass}">
                <label class="${labelClass}">${element.label}</label>
                <div class="flex gap-2">
                    <input type="text" [(ngModel)]="${dataObjName}['${bindProp}']" name="${dataObjName}_${bindProp}" class="${inputClass} pl-8" placeholder="Benutzer auswählen..."/>
                    <button type="button" (click)="openUserPicker('search', '${bindProp}')" class="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded text-xs font-bold shadow-sm transition-colors whitespace-nowrap">Suchen</button>
                </div>
            </div>`;
        }

        if (element.widgetType === 'select' && element.lookup) {
             let lookupTable: any = tables.find(t => t.id === element.lookup!.tableId);
             let isQuery = false;
             if (!lookupTable) {
                 lookupTable = queries.find((q: any) => q.id === element.lookup!.tableId);
                 if (lookupTable) {
                     isQuery = true;
                     lookupTable = { ...lookupTable, fields: lookupTable.columns || [] };
                 }
             }
             if (lookupTable) {
                  const listVar = `${toCamelCase(lookupTable.name)}List`;
                  const valField = lookupTable.fields.find((f: any) => f.id === element.lookup!.valueFieldId || f.fieldId === element.lookup!.valueFieldId);
                  const valPropCamel = valField ? toCamelCase((valField as any).name || (valField as any).alias || (valField as any).fieldName) : "id";
                  const valPropOrig = valField ? ((valField as any).name || (valField as any).alias || (valField as any).fieldName) : "id";
                  const valPropPascal = toPascalCase(valPropOrig);
                  
                  const valKeys = new Set<string>();
                  valKeys.add(valPropOrig);
                  valKeys.add(valPropCamel);
                  valKeys.add(valPropPascal);
                  valKeys.add(valPropOrig.toLowerCase());
                  valKeys.add(valPropCamel.toLowerCase());
                  valKeys.add(valPropOrig.charAt(0).toLowerCase() + valPropOrig.slice(1));
                  valKeys.add(valPropOrig.charAt(0).toUpperCase() + valPropOrig.slice(1));
                  if (/^[A-Z]{2,}/.test(valPropOrig)) {
                      valKeys.add(valPropOrig.replace(/^[A-Z]+/, match => match.toLowerCase()));
                      valKeys.add(valPropOrig.replace(/^[A-Z]+/, match => match.charAt(0).toLowerCase() + match.slice(1).toLowerCase()));
                  }
                  valKeys.add('id');
                  valKeys.add('ID');
                  valKeys.add('Id');
                  const valExpression = Array.from(valKeys).map(k => `item['${k}']`).join(' ?? ');
                  
                  // --- DISPLAY LOGIC START ---
                  let displayExpression = `{{${valExpression}}}`; // Default fallback
                  
                  if (element.lookup.displayFormat && element.lookup.displayFormat.length > 0) {
                      // Complex format with prefix/suffix
                      displayExpression = element.lookup.displayFormat.map(fmt => {
                          const f = lookupTable.fields.find((field: any) => field.id === fmt.fieldId);
                          if (!f) return '';
                          const propOrig = ((f as any).name || (f as any).alias || (f as any).fieldName) || f.alias || f.fieldName;
                          const propCamel = toCamelCase(propOrig);
                          const propPascal = toPascalCase(propOrig);
                          const keys = new Set<string>();
                          keys.add(propOrig);
                          keys.add(propCamel);
                          keys.add(propPascal); keys.add(propCamel + "Value"); keys.add(propOrig + "Value"); keys.add(propPascal + "Value");
                          keys.add(propOrig.toLowerCase());
                          keys.add(propCamel.toLowerCase());
                          keys.add(propOrig.charAt(0).toLowerCase() + propOrig.slice(1));
                          keys.add(propOrig.charAt(0).toUpperCase() + propOrig.slice(1));
                          if (/^[A-Z]{2,}/.test(propOrig)) {
                              keys.add(propOrig.replace(/^[A-Z]+/, match => match.toLowerCase()));
                              keys.add(propOrig.replace(/^[A-Z]+/, match => match.charAt(0).toLowerCase() + match.slice(1).toLowerCase()));
                          }
                          const expr = Array.from(keys).map(k => `item['${k}']`).join(' ?? ');
                          return `${fmt.prefix || ''}{{(${expr} ?? '')}}${fmt.suffix || ''}`;
                      }).join('');
                  } else if (element.lookup.labelFields && element.lookup.labelFields.length > 0) {
                      // Simple list of fields
                      displayExpression = element.lookup.labelFields.map(fid => {
                          const f = lookupTable.fields.find((field: any) => field.id === fid);
                          if (!f) return '';
                          const propOrig = ((f as any).name || (f as any).alias || (f as any).fieldName) || f.alias || f.fieldName;
                          const propCamel = toCamelCase(propOrig);
                          const propPascal = toPascalCase(propOrig);
                          const keys = new Set<string>();
                          keys.add(propOrig);
                          keys.add(propCamel);
                          keys.add(propPascal); keys.add(propCamel + "Value"); keys.add(propOrig + "Value"); keys.add(propPascal + "Value");
                          keys.add(propOrig.toLowerCase());
                          keys.add(propCamel.toLowerCase());
                          keys.add(propOrig.charAt(0).toLowerCase() + propOrig.slice(1));
                          keys.add(propOrig.charAt(0).toUpperCase() + propOrig.slice(1));
                          if (/^[A-Z]{2,}/.test(propOrig)) {
                              keys.add(propOrig.replace(/^[A-Z]+/, match => match.toLowerCase()));
                              keys.add(propOrig.replace(/^[A-Z]+/, match => match.charAt(0).toLowerCase() + match.slice(1).toLowerCase()));
                          }
                          const expr = Array.from(keys).map(k => `item['${k}']`).join(' ?? ');
                          return `{{(${expr} ?? '')}}`;
                      }).join(' ');
                  }
                  // --- DISPLAY LOGIC END ----

                  const changeHandler = dataObjName === 'data' ? `(ngModelChange)="onFieldChange('${bindProp}', $event); onFieldChange('${fieldName}', $event)"` : '';

                  if (isBootstrap) {
                      const quickCreateBtn = element.lookup.allowQuickCreate 
                         ? `<button type="button" (click)="openModal('lookup_${element.id}')" class="btn btn-outline-success">+</button>` 
                         : '';

                      const lookupModal = element.lookup.allowQuickCreate ? `
                      <div *ngIf="modals['lookup_${element.id}']" class="modal show d-block" style="background: rgba(0, 0, 0, 0.5);" (click)="closeModal('lookup_${element.id}')">
                         <div class="modal-dialog modal-dialog-centered" (click)="$event.stopPropagation()">
                             <div class="modal-content">
                                 <div class="modal-header bg-light">
                                     <h5 class="modal-title">Neu: ${lookupTable.name}</h5>
                                     <button type="button" class="btn-close" (click)="closeModal('lookup_${element.id}')"></button>
                                 </div>
                                 <div class="modal-body">
                                     ${lookupTable.fields.filter(f=>!f.isAutoIncrement).map(f => {
                                         const fName = toCamelCase(((f as any).name || (f as any).alias || (f as any).fieldName) || f.alias || f.fieldName);
                                         if (f.type === 'BOOLEAN') {
                                             return `
                                             <div class="form-check mb-3">
                                                 <input type="checkbox" [(ngModel)]="tempData.${fName}" name="temp_${fName}" class="form-check-input" id="check_${fName}"/>
                                                 <label class="form-check-label" for="check_${fName}">${((f as any).name || (f as any).alias || (f as any).fieldName)}</label>
                                             </div>`;
                                         }
                                         const fType = f.type === 'INTEGER' || f.type === 'DECIMAL' ? 'number' : f.type === 'DATE' ? 'date' : 'text';
                                         return `
                                         <div class="mb-3">
                                             <label class="form-label text-secondary small fw-bold">${((f as any).name || (f as any).alias || (f as any).fieldName)}</label>
                                             <input type="${fType}" [(ngModel)]="tempData.${fName}" name="temp_${fName}" class="form-control"/>
                                         </div>`;
                                     }).join('')}
                                 </div>
                                 <div class="modal-footer bg-light">
                                     <button type="button" (click)="closeModal('lookup_${element.id}')" class="btn btn-secondary">Abbrechen</button>
                                     <button type="button" (click)="saveLookup('${toCamelCase(lookupTable.name)}', 'lookup_${element.id}')" class="btn btn-primary">Speichern</button>
                                 </div>
                             </div>
                         </div>
                      </div>` : '';

                      return `<div class="${wrapperClass}">
                        <label class="${labelClass}">${element.label}</label>
                        <div class="input-group">
                            <select class="form-select" [(ngModel)]="${dataObjName}['${bindProp}']" name="${dataObjName}_${bindProp}" ${changeHandler}>
                                <option value="">Bitte wählen...</option>
                                <option *ngFor="let item of ${listVar}" [value]="${valExpression}">${displayExpression}</option>
                            </select>
                            ${quickCreateBtn}
                        </div>
                        ${lookupModal}
                    </div>`;
                  } else {
                      const quickCreateBtn = element.lookup.allowQuickCreate 
                         ? `<button type="button" (click)="openModal('lookup_${element.id}')" class="bg-emerald-100 hover:bg-emerald-200 text-emerald-700 px-3 border border-emerald-300 rounded ml-2 font-bold flex items-center justify-center transition-colors" title="Neu">+</button>` 
                         : '';

                      const lookupModal = element.lookup.allowQuickCreate ? `
                      <div *ngIf="modals['lookup_${element.id}']" class="fixed inset-0 bg-black/50 flex items-center justify-center z-50 backdrop-blur-sm">
                         <div class="bg-white p-6 rounded-xl w-96 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95">
                             <h3 class="font-bold mb-4 text-lg border-b pb-2 text-slate-800">Neu: ${lookupTable.name}</h3>
                             <div class="space-y-3">
                                 ${lookupTable.fields.filter(f=>!f.isAutoIncrement).map(f => {
                                     const fName = toCamelCase(((f as any).name || (f as any).alias || (f as any).fieldName) || f.alias || f.fieldName);
                                     if (f.type === 'BOOLEAN') {
                                         return `
                                         <div class="flex items-center gap-2">
                                             <input type="checkbox" [(ngModel)]="tempData.${fName}" name="temp_${fName}" class="w-4 h-4 text-blue-600 rounded"/>
                                             <label class="text-sm font-medium text-slate-700">${((f as any).name || (f as any).alias || (f as any).fieldName)}</label>
                                         </div>`;
                                     }
                                     const fType = f.type === 'INTEGER' || f.type === 'DECIMAL' ? 'number' : f.type === 'DATE' ? 'date' : 'text';
                                     return `
                                     <div>
                                         <label class="block text-xs font-bold text-slate-500 uppercase mb-1">${((f as any).name || (f as any).alias || (f as any).fieldName)}</label>
                                         <input type="${fType}" [(ngModel)]="tempData.${fName}" name="temp_${fName}" class="w-full border border-slate-300 rounded p-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"/>
                                     </div>`;
                                 }).join('')}
                             </div>
                             <div class="flex justify-end gap-2 mt-6 pt-2 border-t border-slate-100">
                                 <button type="button" (click)="closeModal('lookup_${element.id}')" class="px-4 py-2 border rounded text-slate-600 hover:bg-slate-50 text-sm">Abbrechen</button>
                                 <button type="button" (click)="saveLookup('${toCamelCase(lookupTable.name)}', 'lookup_${element.id}')" class="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded text-sm font-bold shadow-sm">Speichern</button>
                             </div>
                         </div>
                      </div>` : '';

                      return `<div class="${wrapperClass}">
                        <label class="${labelClass}">${element.label}</label>
                        <div class="flex gap-2">
                            <select class="${inputClass} bg-white flex-1" [(ngModel)]="${dataObjName}['${bindProp}']" name="${dataObjName}_${bindProp}" ${changeHandler}>
                                <option value="">Bitte wählen...</option>
                                <option *ngFor="let item of ${listVar}" [value]="${valExpression}">${displayExpression}</option>
                            </select>
                            ${quickCreateBtn}
                        </div>
                        ${lookupModal}
                    </div>`;
                  }
             }
        }

        const changeHandler = dataObjName === 'data' ? `(ngModelChange)="onFieldChange('${bindProp}', $event); onFieldChange('${fieldName}', $event)"` : '';

        // Markdown Editor Widget
        const isMarkdownWidget = element.widgetType === 'markdown' || 
          tables.some(t => t.fields.some(f => f.id === element.fieldId && ((f as any).rendererType === 'markdown' || (f.comment && f.comment.toLowerCase().includes('markdown')))));

        if (isMarkdownWidget) {
            return `<div class="${wrapperClass}">
                <label class="${labelClass}">${element.label}</label>
                <app-markdown-editor [(value)]="${dataObjName}['${bindProp}']" [placeholder]="'${element.label || 'Markdown-Inhalt hier eingeben...'}'"></app-markdown-editor>
            </div>`;
        }

        // Enum Dropdown Field
        if (foundField?.type === 'ENUM' || (foundField?.enumValues && foundField.enumValues.length > 0) || (element.widgetType === 'select' && (!element.lookup || !element.lookup.tableId))) {
            const enumOptions = (foundField?.enumValues && foundField.enumValues.length > 0) 
                ? foundField.enumValues 
                : ['Option 1', 'Option 2'];
            const parentTable = tables.find(t => t.fields.some(f => f.id === element.fieldId));
            const tableName = parentTable ? parentTable.name : 'table';
            const optHtml = enumOptions.map((opt: string) => `<option value="${opt.replace(/"/g, '&quot;')}">${opt}</option>`).join('\n                ');

            if (isBootstrap) {
                return `
                <!-- ============================================================= -->
                <!-- ENUM DROPDOWN: ${fieldName} (${tableName}) -->
                <!-- 1. Frontend: Add <option> here or update options in component -->
                <!-- 2. Database: ALTER TABLE \`${tableName}\` MODIFY COLUMN \`${fieldName}\` ENUM(...) -->
                <!-- ============================================================= -->
                <div class="${wrapperClass}">
                    <label class="${labelClass}">${element.label} <span class="badge bg-light text-primary border">Auswahl</span></label>
                    <select class="form-select" [(ngModel)]="${dataObjName}['${bindProp}']" name="${dataObjName}_${bindProp}" ${changeHandler}>
                        <option value="">-- Bitte wählen (${element.label}) --</option>
                        ${optHtml}
                    </select>
                </div>`;
            }

            return `
            <!-- ============================================================= -->
            <!-- ENUM DROPDOWN: ${fieldName} (${tableName}) -->
            <!-- 1. Frontend: Add <option> here or update options in component -->
            <!-- 2. Database: ALTER TABLE \`${tableName}\` MODIFY COLUMN \`${fieldName}\` ENUM(...) -->
            <!-- ============================================================= -->
            <div class="${wrapperClass}">
                <label class="${labelClass}">${element.label} <span class="text-xs text-indigo-500 font-normal">(Auswahl)</span></label>
                <div class="relative">
                    <select class="${inputClass} bg-white appearance-none pr-8 cursor-pointer" [(ngModel)]="${dataObjName}['${bindProp}']" name="${dataObjName}_${bindProp}" ${changeHandler}>
                        <option value="">-- Bitte wählen (${element.label}) --</option>
                        ${optHtml}
                    </select>
                </div>
            </div>`;
        }

        // Textarea / Richtext Widget
        if ((element.widgetType as string) === 'textarea' || (element.widgetType as string) === 'richtext') {
            return `<div class="${wrapperClass}">
                <label class="${labelClass}">${element.label}</label>
                <textarea rows="4" [(ngModel)]="${dataObjName}['${bindProp}']" name="${dataObjName}_${bindProp}" ${changeHandler} class="${inputClass}"></textarea>
            </div>`;
        }

        if (inputType === 'checkbox') {
            if (isBootstrap) {
                return `<div class="${wrapperClass}">
                    <div class="form-check p-2 bg-light border rounded">
                        <input type="checkbox" [(ngModel)]="${dataObjName}['${bindProp}']" name="${dataObjName}_${bindProp}" ${changeHandler} class="form-check-input ms-0 me-2" id="check_field_${element.id}" />
                        <label class="form-check-label fw-semibold text-secondary" for="check_field_${element.id}">${element.label}</label>
                    </div>
                </div>`;
            }
            return `<div class="${wrapperClass} flex items-center gap-2 p-2 bg-slate-50 rounded border border-slate-200">
                <input type="checkbox" [(ngModel)]="${dataObjName}['${bindProp}']" name="${dataObjName}_${bindProp}" ${changeHandler} class="w-5 h-5 text-blue-600 rounded focus:ring-blue-500" />
                <label class="text-sm font-semibold text-slate-700 cursor-pointer select-none">${element.label}</label>
            </div>`;
        }

        return `<div class="${wrapperClass}">
            <label class="${labelClass}">${element.label}</label>
            <input type="${inputType}" [(ngModel)]="${dataObjName}['${bindProp}']" name="${dataObjName}_${bindProp}" ${changeHandler} class="${inputClass}" />
        </div>`;
    }

    if (element.type === 'button') {
        let clickHandler = '';
        if (element.actions && element.actions.length > 0) {
            const runMacroAct = element.actions.find(a => a.actionType === 'RunMacro' && a.macroId);
            if (runMacroAct) {
                clickHandler = `(click)="executeMacro('${runMacroAct.macroId}', ${dataObjName})"`;
            } else {
                const toastAct = element.actions.find(a => a.actionType === 'ShowToast');
                if (toastAct) {
                    clickHandler = `(click)="showToast('${toastAct.toastMessage?.replace(/'/g, "\\'") || ''}')"`;
                }
            }
        }
        const widthClass = isBootstrap ? getBootstrapWidthClass(element.width) : getTailwindWidthClass(element.width);
        const btnClass = isBootstrap 
            ? `${element.className || 'btn btn-primary my-2'} ${widthClass}`.trim() 
            : `${element.className || 'px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded transition my-2 font-bold cursor-pointer'} ${widthClass}`.trim();
        return `<button type="button" ${clickHandler} class="${btnClass}">${element.label || 'Aktion'}</button>`;
    }

    if (element.type === 'dropdown_button') {
        const items = element.dropdownItems || [];
        let itemsHtml = '';
        const widthClass = isBootstrap ? getBootstrapWidthClass(element.width) : getTailwindWidthClass(element.width);
        if (isBootstrap) {
            itemsHtml = items.map(item => `
                <li>
                    <button class="dropdown-item d-flex align-items-center gap-2" type="button" (click)="executeDropdownItem('${item.id}', ${dataObjName}); dropdowns['${element.id}'] = false">
                        <i class="fas fa-bolt text-warning"></i>
                        ${item.label}
                    </button>
                </li>`).join('\n');
            return `
            <div class="dropdown d-inline-block my-2 ${widthClass}">
                <button class="btn btn-secondary dropdown-toggle" type="button" (click)="dropdowns['${element.id}'] = !dropdowns['${element.id}']">
                    ${element.label || 'Aktionen'}
                </button>
                <ul class="dropdown-menu show" *ngIf="dropdowns['${element.id}']" style="display: block; position: absolute; z-index: 1050;">
                    ${itemsHtml || '<li><span class="dropdown-item-text text-muted italic">Keine Optionen</span></li>'}
                </ul>
            </div>`;
        } else {
            itemsHtml = items.map(item => `
                <button type="button" (click)="executeDropdownItem('${item.id}', ${dataObjName}); dropdowns['${element.id}'] = false" class="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-100 flex items-center gap-2 transition-colors border-b border-slate-100 last:border-none">
                    <i class="fas fa-bolt text-indigo-500"></i>
                    <span>${item.label}</span>
                </button>`).join('\n');
            return `
            <div class="relative inline-block text-left my-2 ${widthClass}">
                <button type="button" (click)="dropdowns['${element.id}'] = !dropdowns['${element.id}']" class="inline-flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white text-sm font-semibold rounded-lg shadow transition-colors cursor-pointer">
                    <span>${element.label || 'Aktionen'}</span>
                    <i class="fas fa-chevron-down text-xs transition-transform duration-200" [class.rotate-180]="dropdowns['${element.id}']"></i>
                </button>
                <div *ngIf="dropdowns['${element.id}']" class="absolute left-0 mt-2 w-56 rounded-lg bg-white shadow-xl border border-slate-200 py-1 z-[150]">
                    ${itemsHtml || '<div class="px-3 py-2 text-xs text-slate-400 italic">Keine Optionen vorhanden</div>'}
                </div>
            </div>`;
        }
    }
    
    // Subform Rendering...
    if (element.type === 'subform' && element.subform) {
        const subFormDef = forms.find(f => f.id === element.subform!.formId);
        const subTable = tables.find(t => t.id === subFormDef?.sourceId);
        
        if (subTable) {
            const modalId = `sub_${element.id}`;
            let subFormHtml = '<p class="text-muted p-2">Leer</p>';
            if (subFormDef && subFormDef.layout) {
                if (visitedForms.has(subFormDef.id) || depth >= 8) {
                    subFormHtml = `<!-- Subform ${subFormDef.name || subTable.name} cycle/depth guard -->`;
                } else {
                    const nextVisitedForms = new Set(visitedForms);
                    nextVisitedForms.add(subFormDef.id);
                    subFormHtml = generateHtmlForLayout(
                        subFormDef.layout, 
                        tables, 
                        forms, 
                        "tempSubData", 
                        queries, 
                        isBootstrap, 
                        [element.subform.childLinkFieldId],
                        nextVisitedForms,
                        depth + 1,
                        visitedElements
                    );
                }
            }
            const subTableCamel = toCamelCase(subTable.name);
            const listVariable = `${subTableCamel}SubList_${element.id.substring(0,8)}`;
            const widthClass = isBootstrap ? getBootstrapWidthClass(element.width) : getTailwindWidthClass(element.width);

            let displayFields = subTable.fields.filter(f => !f.isPrimaryKey && f.id !== element.subform?.childLinkFieldId && f.name !== element.subform?.childLinkFieldId && f.id !== element.subform?.masterLinkFieldId).slice(0, 5);
            if (displayFields.length === 0) {
                displayFields = subTable.fields.filter(f => !f.isPrimaryKey).slice(0, 4);
            }
            if (displayFields.length === 0) {
                displayFields = subTable.fields.slice(0, 4);
            }

            if (isBootstrap) {
                const subModal = `
                <div *ngIf="modals['${modalId}']" class="modal show d-block" style="background: rgba(0, 0, 0, 0.5);" (click)="closeModal('${modalId}')">
                    <div class="modal-dialog modal-dialog-centered modal-lg" (click)="$event.stopPropagation()">
                        <div class="modal-content">
                            <div class="modal-header bg-light">
                                <h5 class="modal-title">{{editingSubformId ? 'Eintrag bearbeiten' : 'Eintrag hinzufügen'}}</h5>
                                <button type="button" class="btn-close" (click)="closeModal('${modalId}')"></button>
                            </div>
                            <div class="modal-body subform-content">
                                <!-- Bind to tempSubData -->
                                ${subFormHtml}
                            </div>
                            <div class="modal-footer bg-light">
                                <button type="button" (click)="closeModal('${modalId}')" class="btn btn-secondary">Abbrechen</button>
                                <button type="button" (click)="saveSubform('${subTableCamel}', '${element.subform.childLinkFieldId}', '${modalId}', '${element.subform.masterLinkFieldId}')" class="btn btn-primary">Speichern</button>
                            </div>
                        </div>
                    </div>
                </div>`;

                return `
                <div class="card mt-4 shadow-sm ${widthClass}">
                    <div class="card-header bg-light d-flex justify-content-between align-items-center">
                        <h5 class="card-title h6 mb-0 text-dark">📄 ${element.label || subFormDef?.name}</h5>
                        <div *ngIf="!isNew">
                            ${element.subform.canAdd !== false ? `<button type="button" (click)="openAddSubformModal('${modalId}')" class="btn btn-sm btn-outline-primary">+ Neu</button>` : ''}
                        </div>
                        <div *ngIf="isNew" class="badge bg-warning text-dark">
                            Bitte speichern um Einträge hinzuzufügen
                        </div>
                    </div>
                    <div class="table-responsive">
                        <table class="table table-hover align-middle mb-0">
                            <thead class="table-light">
                                <tr>
                                    ${displayFields.map(f => `<th class="px-3">${f.name}</th>`).join('')}
                                    <th class="text-end px-3">Aktionen</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr *ngFor="let item of ${listVariable}">
                                    ${displayFields.map(f => `<td class="px-3">{{item['${toCamelCase(f.name)}'] ?? item['${f.name}'] ?? item['${toPascalCase(f.name)}'] ?? '-'}}</td>`).join('')}
                                    <td class="text-end px-3 text-nowrap">
                                        ${element.subform.canEdit !== false ? `<button type="button" (click)="editSubformItem('${subTableCamel}', '${element.subform.childLinkFieldId}', '${modalId}', item)" class="btn btn-sm btn-link text-primary p-0 me-2">Bearbeiten</button>` : ''}
                                        ${element.subform.canDelete !== false ? `<button type="button" (click)="deleteSubformItem('${subTableCamel}', '${element.subform.childLinkFieldId}', '${modalId}', item, '${element.subform.masterLinkFieldId}')" class="btn btn-sm btn-link text-danger p-0">Löschen</button>` : ''}
                                    </td>
                                </tr>
                                <tr *ngIf="!${listVariable}?.length"><td colSpan="${displayFields.length + 1}" class="p-4 text-center text-muted fst-italic">Keine Einträge vorhanden.</td></tr>
                            </tbody>
                        </table>
                    </div>
                    ${subModal}
                </div>`;
            } else {
                const subModal = `
                <div *ngIf="modals['${modalId}']" class="fixed inset-0 bg-black/50 flex items-center justify-center z-50 backdrop-blur-sm">
                    <div class="bg-white p-6 rounded-xl w-[600px] max-h-[90vh] overflow-y-auto shadow-2xl border border-slate-200">
                        <h3 class="font-bold mb-4 text-lg border-b pb-2 text-slate-800">{{editingSubformId ? 'Eintrag bearbeiten' : 'Eintrag hinzufügen'}}</h3>
                        <div class="subform-content space-y-4">
                            <!-- Bind to tempSubData -->
                            ${subFormHtml}
                        </div>
                        <div class="flex justify-end gap-2 mt-6 pt-4 border-t border-slate-100">
                            <button type="button" (click)="closeModal('${modalId}')" class="px-4 py-2 border rounded text-slate-600 hover:bg-slate-50 text-sm">Abbrechen</button>
                            <button type="button" (click)="saveSubform('${subTableCamel}', '${element.subform.childLinkFieldId}', '${modalId}', '${element.subform.masterLinkFieldId}')" class="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded text-sm font-bold shadow-sm">Speichern</button>
                        </div>
                    </div>
                </div>`;

                return `
                <div class="${element.className || 'border border-slate-300 rounded-lg overflow-hidden mt-6 shadow-sm'} ${widthClass}">
                    <div class="bg-slate-100 p-3 flex justify-between items-center border-b border-slate-200">
                        <h4 class="font-bold text-sm text-slate-700 flex items-center gap-2">📄 ${element.label || subFormDef?.name}</h4>
                        <div *ngIf="!isNew">
                            ${element.subform.canAdd !== false ? `<button type="button" (click)="openAddSubformModal('${modalId}')" class="bg-white text-blue-600 px-3 py-1 text-xs font-bold border border-blue-200 rounded shadow-sm hover:bg-blue-50 transition-colors">+ Neu</button>` : ''}
                        </div>
                        <div *ngIf="isNew" class="text-xs text-orange-600 font-semibold bg-orange-100 px-2 py-1 rounded">
                            Bitte speichern um Einträge hinzuzufügen
                        </div>
                    </div>
                    <div class="p-0">
                        <table class="w-full text-sm text-left">
                            <thead class="bg-slate-50 text-slate-500 text-xs uppercase">
                                <tr>
                                    ${displayFields.map(f => `<th class="p-3">${f.name}</th>`).join('')}
                                    <th class="p-3 text-right">Aktionen</th>
                                </tr>
                            </thead>
                            <tbody class="divide-y divide-slate-100">
                                <tr *ngFor="let item of ${listVariable}" class="hover:bg-slate-50">
                                    ${displayFields.map(f => `<td class="p-3 text-slate-700">{{item['${toCamelCase(f.name)}'] ?? item['${f.name}'] ?? item['${toPascalCase(f.name)}'] ?? '-'}}</td>`).join('')}
                                    <td class="p-3 text-right whitespace-nowrap space-x-2">
                                        ${element.subform.canEdit !== false ? `<button type="button" (click)="editSubformItem('${subTableCamel}', '${element.subform.childLinkFieldId}', '${modalId}', item)" class="text-blue-600 hover:underline text-xs font-semibold">Bearbeiten</button>` : ''}
                                        ${element.subform.canDelete !== false ? `<button type="button" (click)="deleteSubformItem('${subTableCamel}', '${element.subform.childLinkFieldId}', '${modalId}', item, '${element.subform.masterLinkFieldId}')" class="text-rose-600 hover:underline text-xs font-semibold">Löschen</button>` : ''}
                                    </td>
                                </tr>
                                <tr *ngIf="!${listVariable}?.length"><td colSpan="${displayFields.length + 1}" class="p-6 text-center text-slate-400 italic">Keine Einträge vorhanden.</td></tr>
                            </tbody>
                        </table>
                    </div>
                    ${subModal}
                </div>`;
            }
        }
    }

    return '';
};
