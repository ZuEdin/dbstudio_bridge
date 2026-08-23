import { Table, FormElement, Form } from '../../../types/index';
import { toCamelCase, toPascalCase, toSubformSuffix } from '../common';
import { Plus, Layout, User, Search } from 'lucide-react';

export const collectLookups = (element: FormElement, tables: Table[], queries: any[] = [], accumulated: any[] = [], forms: Form[] = []) => {
    if (element.widgetType === 'select' && element.lookup && element.lookup.tableId) {
        let table: any = tables.find(t => t.id === element.lookup!.tableId);
        let isQuery = false;
        if (!table) {
            table = queries.find((q: any) => q.id === element.lookup!.tableId);
            if (table) isQuery = true;
        }
        if (table) {
            const variableName = `${toCamelCase(table.name)}List`;
            if (!accumulated.find(l => l.variableName === variableName)) {
                accumulated.push({ 
                    sort: element.lookup!.sort,
                    table,
                    variableName,
                    endpoint: isQuery ? `queries/${toCamelCase(table.name)}` : toPascalCase(table.name),
                    isQuery
                });
            }
        }
    }
    if (element.type === 'subform' && element.subform && forms.length > 0) {
        const subDef = forms.find(f => f.id === element.subform!.formId) || forms.find(f => f.sourceId === element.subform!.formId);
        if (subDef && subDef.layout) {
            collectLookups(subDef.layout, tables, queries, accumulated, forms);
        }
    }
    if (element.children) {
        element.children.forEach(child => collectLookups(child, tables, queries, accumulated, forms));
    }
    return accumulated;
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

// Returns JSX string AND potentially side-effect info (used by pages.ts to know which modals to create)
export const generateJsxForLayout = (element: FormElement, tables: Table[], forms: Form[], dataVar: string = "data", modals: any[] = [], queries: any[] = []): string => {
    if (element.type === 'container') {
        const childrenJsx = element.children?.map(c => generateJsxForLayout(c, tables, forms, dataVar, modals, queries)).join('\n') || '';
        let className = element.className || '';
        if (element.children && element.children.length > 1 && !className.includes('grid') && !className.includes('flex')) {
             className += ' space-y-4';
        }
        const widthClass = getTailwindWidthClass(element.width);
        if (widthClass) {
             className = `${className} ${widthClass}`.trim();
        }
        return `<div className="${className}">\n${childrenJsx}\n</div>`;
    } 
    else if (element.type === 'tabs') {
        const tabPages = element.children || [];
        const widthClass = getTailwindWidthClass(element.width);
        const tabsId = element.id.replace(/[^a-zA-Z0-9_]/g, '_');
        
        const headerButtons = tabPages.map((tab, idx) => {
            const tabId = tab.id;
            return `<button type="button" onClick={() => setActiveTabs(prev => ({ ...prev, '${tabsId}': '${tabId}' }))} className={\`px-4 py-2.5 text-xs md:text-sm font-semibold border-b-2 transition-all \${(activeTabs['${tabsId}'] || '${tabPages[0]?.id || ''}') === '${tabId}' ? 'border-blue-600 text-blue-600 bg-white dark:bg-slate-900 shadow-sm' : 'border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400'}\`}>${tab.label || `Tab ${idx + 1}`}</button>`;
        }).join('\n');

        const pagesContent = tabPages.map(tab => {
            const content = tab.children?.map(c => generateJsxForLayout(c, tables, forms, dataVar, modals, queries)).join('\n') || '';
            return `{(activeTabs['${tabsId}'] || '${tabPages[0]?.id || ''}') === '${tab.id}' && (
              <div className="p-4 bg-white dark:bg-slate-900 min-h-[60px]">
                ${content}
              </div>
            )}`;
        }).join('\n');

        return `<div className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-sm my-4 ${element.className || ''} ${widthClass}">
          <div className="flex border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 px-2 overflow-x-auto whitespace-nowrap">
            ${headerButtons}
          </div>
          ${pagesContent}
        </div>`;
    }
    else if (element.type === 'tab_page') {
        const content = element.children?.map(c => generateJsxForLayout(c, tables, forms, dataVar, modals, queries)).join('\n') || '';
        return `<div className="${element.className || 'space-y-4'}">\n${content}\n</div>`;
    }
    else if (element.type === 'label') {
        const widthClass = getTailwindWidthClass(element.width);
        const className = `${element.className || 'text-lg font-bold mb-3 text-slate-800 dark:text-white border-b border-slate-200 dark:border-slate-700 pb-2'} ${widthClass}`.trim();
        return `<div className="${className}">${element.label}</div>`;
    } 
    else if (element.type === 'button') {
        let onClickContent = '';
        if (element.actions && element.actions.length > 0) {
            const clickActions = element.actions.filter(a => a.trigger === 'OnClick').map(action => {
                if (action.actionType === 'RunMacro' && action.macroId) {
                    return `executeMacro('${action.macroId}', ${dataVar});`;
                }
                if (action.actionType === 'ShowToast') {
                    return `addToast('${action.toastMessage?.replace(/'/g, "\\'")}', '${action.toastType || 'info'}');`;
                }
                if (action.actionType === 'ExecuteAPI' && action.apiEndpoint) {
                    return `await fetch('${action.apiEndpoint}', { method: 'POST', body: JSON.stringify(${dataVar}) });`;
                }
                if (action.actionType === 'Navigate' && action.routeUrl) {
                    return `navigate('${action.routeUrl}');`;
                }
                if (action.actionType === 'SetState' && action.stateVariableId) {
                    return `setGlobalState('${action.stateVariableId}', '${action.stateValue}');`;
                }
                return '';
            }).filter(Boolean).join('\n            ');
            onClickContent = `onClick={async () => {\n            ${clickActions}\n        }}`;
        }
        const widthClass = getTailwindWidthClass(element.width);
        const className = `${element.className || 'bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded transition-colors shadow-sm'} ${widthClass}`.trim();
        return `<button type="button" className="${className}" ${onClickContent}>\n   ${element.label}\n</button>`;
    }
    else if (element.type === 'dropdown_button') {
        const items = element.dropdownItems || [];
        const itemsJsx = items.map(item => {
            let itemActions = '';
            if (item.actions && item.actions.length > 0) {
                itemActions = item.actions.map(act => {
                    if (act.actionType === 'RunMacro' && act.macroId) {
                        return `executeMacro('${act.macroId}', ${dataVar});`;
                    }
                    if (act.actionType === 'ShowToast') {
                        return `addToast('${act.toastMessage?.replace(/'/g, "\\'")}', '${act.toastType || 'info'}');`;
                    }
                    if (act.actionType === 'Navigate' && act.routeUrl) {
                        return `navigate('${act.routeUrl}');`;
                    }
                    return '';
                }).filter(Boolean).join(' ');
            }
            return `<button key="${item.id}" type="button" onClick={() => { ${itemActions} }} className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-100 flex items-center gap-2">\n        <span>${item.label}</span>\n      </button>`;
        }).join('\n      ');

        const widthClass = getTailwindWidthClass(element.width);
        const btnClass = element.className || 'bg-slate-800 text-white font-bold py-2 px-4 rounded-lg shadow-sm inline-flex items-center gap-2';
        return `<div className="relative inline-block text-left group ${widthClass}">\n  <button type="button" className="${btnClass}">\n    <span>${element.label || 'Aktionen'}</span>\n    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" /></svg>\n  </button>\n  <div className="hidden group-hover:block group-focus-within:block absolute left-0 mt-1 w-52 rounded-md shadow-lg bg-white border border-slate-200 z-50 py-1">\n      ${itemsJsx}\n  </div>\n</div>`;
    }
    else if (element.type === 'subform' && element.subform) {
        const subformDef = forms.find(f => f.id === element.subform!.formId);
        const subTable = tables.find(t => t.id === subformDef?.sourceId);
        
        if (subformDef && subTable) {
            const suffix = toSubformSuffix(element.id);
            const modalId = `sub_${suffix}`;
            // Register Modal Requirement
            if (!modals.find(m => m.id === modalId)) {
                const masterFieldObj = tables.find(t => t.fields.some(f => f.id === element.subform!.masterLinkFieldId))?.fields.find(f => f.id === element.subform!.masterLinkFieldId);
                const childFieldObj = subTable.fields.find(f => f.id === element.subform!.childLinkFieldId);
                modals.push({ 
                    id: modalId, 
                    type: 'subform', 
                    form: subformDef,
                    table: subTable,
                    masterField: element.subform.masterLinkFieldId,
                    masterFieldName: masterFieldObj?.name,
                    childField: element.subform.childLinkFieldId,
                    childFieldName: childFieldObj?.name
                });
            }

            // Generate List Display
            const camelSubTable = toCamelCase(subTable.name);
            const listVar = `${camelSubTable}SubList_${suffix}`; 
            
            const getSubLayoutFieldEls = (container: FormElement, acc: FormElement[] = []): FormElement[] => {
                if (container.type === 'field' && container.fieldId) acc.push(container);
                if (container.children) container.children.forEach(c => getSubLayoutFieldEls(c, acc));
                return acc;
            };
            const subLayoutEls = subformDef.layout ? getSubLayoutFieldEls(subformDef.layout) : [];

            // Display form fields or non-PK, non-FK fields
            const formFieldIds = (subformDef.fields || []).map(ff => ff.fieldId);
            let displayFields = subTable.fields.filter(f => !f.isPrimaryKey && f.id !== element.subform!.childLinkFieldId && f.name !== element.subform!.childLinkFieldId);
            if (formFieldIds.length > 0) {
                const matched = subTable.fields.filter(f => formFieldIds.includes(f.id) && f.id !== element.subform!.childLinkFieldId && f.name !== element.subform!.childLinkFieldId);
                if (matched.length > 0) displayFields = matched;
            }
            if (displayFields.length > 8) {
                displayFields = displayFields.slice(0, 8);
            }

            const widthClass = getTailwindWidthClass(element.width);
            return `
            <div className="border border-slate-300 dark:border-slate-600 rounded-md overflow-hidden mt-6 shadow-sm ${widthClass}">
                <div className="bg-slate-100 dark:bg-slate-800 p-3 flex justify-between items-center border-b border-slate-200 dark:border-slate-700">
                    <span className="font-bold text-sm text-slate-700 dark:text-slate-200 flex items-center gap-2">
                        <Layout size={16} className="text-indigo-500"/> ${element.label || subformDef.name}
                    </span>
                    ${element.subform.canAdd !== false ? `
                    <button 
                        type="button"
                        onClick={() => toggleModal('${modalId}', true)} 
                        className="bg-white dark:bg-slate-700 hover:bg-blue-50 dark:hover:bg-slate-600 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-slate-600 rounded px-3 py-1 text-xs font-semibold flex items-center gap-1 shadow-sm transition-colors"
                    >
                        <Plus size={14} strokeWidth={3}/> Neu
                    </button>` : ''}
                </div>
                <div className="p-0 bg-white dark:bg-slate-900">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-500">
                            <tr>
                                ${displayFields.map(f => {
                                    const matchingSubEl = subLayoutEls.find(e => e.fieldId === f.id);
                                    const headerLabel = matchingSubEl?.label || f.name;
                                    return `<th className="p-2 font-medium">${headerLabel}</th>`;
                                }).join('')}
                                <th className="p-2 text-right">Aktionen</th>
                            </tr>
                        </thead>
                        <tbody>
                            {${listVar} && ${listVar}.length > 0 ? ${listVar}.map((item: any, idx: number) => (
                                <tr key={idx} className="border-b dark:border-slate-800 last:border-0 hover:bg-slate-50 dark:hover:bg-slate-800/50">
                                    ${displayFields.map(f => {
                                        const fCamel = toCamelCase((f as any).name || (f as any).alias || (f as any).fieldName || '');
                                        const fPascal = toPascalCase((f as any).name || (f as any).alias || (f as any).fieldName || '');
                                        const fRaw = (f as any).name || (f as any).alias || (f as any).fieldName || '';

                                        const matchingSubEl = subLayoutEls.find(e => e.fieldId === f.id);
                                        if (matchingSubEl?.widgetType === 'select' && matchingSubEl?.lookup) {
                                            let lTable: any = tables.find(t => t.id === matchingSubEl.lookup!.tableId) || queries.find((q: any) => q.id === matchingSubEl.lookup!.tableId);
                                            if (lTable) {
                                                const lVar = `${toCamelCase(lTable.name)}List`;
                                                const labelFields = matchingSubEl.lookup.labelFields || [];
                                                let labelNames = labelFields.map((fid: string) => {
                                                    const lf = (lTable.fields || lTable.columns)?.find((field: any) => field.id === fid);
                                                    return lf ? (lf.name || lf.alias || lf.fieldName) : '';
                                                }).filter(Boolean);

                                                if (labelNames.length === 0) {
                                                    labelNames = ['bezeichnung', 'name', 'titel', 'title'];
                                                }

                                                const valField = (lTable.fields || lTable.columns)?.find((x: any) => x.id === matchingSubEl.lookup!.valueFieldId || x.isPrimaryKey);
                                                const valFieldName = valField ? (valField.name || valField.alias || valField.fieldName) : 'id';
                                                const valFieldCamel = toCamelCase(valFieldName);

                                                return `<td className="p-2">{(() => {
                                                    const rawVal = item?.['${fCamel}'] ?? item?.['${fRaw}'] ?? item?.['${fPascal}'];
                                                    if (rawVal === undefined || rawVal === null || rawVal === '') return '';
                                                    const match = ${lVar}?.find((r: any) => String(r.id ?? r.Id ?? r['${valFieldCamel}'] ?? r['${valFieldName}']) === String(rawVal));
                                                    if (!match) return String(rawVal);
                                                    return [${labelNames.map((n: string) => `match['${toCamelCase(n)}'] ?? match['${n}']`).join(', ')}].filter(Boolean).join(' ') || String(rawVal);
                                                })()}</td>`;
                                            }
                                        }

                                        return `<td className="p-2">{String(item?.['${fCamel}'] ?? item?.['${fRaw}'] ?? item?.['${fPascal}'] ?? '')}</td>`;
                                    }).join('')}
                                    <td className="p-2 text-right whitespace-nowrap space-x-2">
                                        ${element.subform.canEdit !== false ? `<button type="button" onClick={() => editSubformItem_${suffix}(item)} className="text-blue-600 dark:text-blue-400 hover:underline text-xs font-semibold">Bearbeiten</button>` : ''}
                                        ${element.subform.canDelete !== false ? `<button type="button" onClick={() => deleteSubformItem_${suffix}(item)} className="text-rose-600 dark:text-rose-400 hover:underline text-xs font-semibold">Löschen</button>` : ''}
                                    </td>
                                </tr>
                            )) : (
                                <tr><td colSpan={${displayFields.length + 1}} className="p-4 text-center text-slate-400 italic">Keine Einträge vorhanden.</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>`;
        }
    }
    else if (element.type === 'field' && element.fieldId) {
        let fieldName = '';
        let inputType = 'text';
        let foundField: any = null;
        
        for (const t of tables) {
            const f = t.fields.find(field => field.id === element.fieldId);
            if (f) {
                fieldName = f.name;
                foundField = f;
                if (f.type === 'INTEGER' || f.type === 'DECIMAL' || f.type === 'DOUBLE') inputType = 'number';
                else if (f.type === 'BOOLEAN') inputType = 'checkbox';
                else if (f.type === 'DATE') inputType = 'date';
                else if (f.type === 'TIME') inputType = 'time';
                else if (f.type === 'DATETIME' || f.type === 'TIMESTAMP') inputType = 'datetime-local';
                break;
            }
        }

        if (!fieldName) return `{/* Field not found: ${element.label} */}`;
        const bindProp = toCamelCase(fieldName);
        
        // Tailwind Classes Phase 5 logic
        const uxHidden = `\${isFieldHidden('${element.fieldId}') ? 'hidden' : ''}`;
        const uxDisabled = `isFieldDisabled('${element.fieldId}')`;
        const uxRequired = `isFieldRequired('${element.fieldId}')`;

        const labelClass = "block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5";
        const inputClass = `w-full border border-slate-300 dark:border-slate-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all placeholder-slate-400 dark:placeholder-slate-500 \${${uxDisabled} ? 'opacity-50 cursor-not-allowed bg-slate-100 dark:bg-slate-900' : ''}`;
        const widthClass = getTailwindWidthClass(element.width);
        const wrapperClass = `${element.className || ""} ${widthClass} ${uxHidden}`.trim();

        // Markdown Editor Widget
        if (element.widgetType === 'markdown' || foundField?.rendererType === 'markdown' || (foundField?.type === 'TEXT' && foundField?.comment?.toLowerCase().includes('markdown'))) {
            return `
            <div className={\`${wrapperClass}\`}>
                <div className="flex justify-between items-center mb-1">
                    <label className="${labelClass}">${element.label} {${uxRequired} && <span className="text-red-500">*</span>}</label>
                    <span className="text-[10px] bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 font-bold px-2 py-0.5 rounded-full border border-indigo-200/60 dark:border-indigo-800/60 font-mono">
                        Markdown
                    </span>
                </div>
                <MarkdownEditor
                    id="field_${element.id}"
                    value={${dataVar}.${bindProp} !== undefined && ${dataVar}.${bindProp} !== null ? String(${dataVar}.${bindProp}) : ''}
                    onChange={(val: string) => setData({ ...${dataVar}, ${bindProp}: val })}
                    disabled={${uxDisabled}}
                    minHeight="140px"
                />
            </div>`;
        }

        // Textarea Widget
        if (element.widgetType === 'textarea' || foundField?.type === 'TEXT') {
            return `
            <div className={\`${wrapperClass}\`}>
                <label className="${labelClass}">${element.label} {${uxRequired} && <span className="text-red-500">*</span>}</label>
                <textarea
                    rows={4}
                    disabled={${uxDisabled}}
                    required={${uxRequired}}
                    className={\`${inputClass}\`}
                    value={${dataVar}.${bindProp} !== undefined && ${dataVar}.${bindProp} !== null ? ${dataVar}.${bindProp} : ''}
                    onChange={e => setData({...${dataVar}, ${bindProp}: e.target.value})}
                />
            </div>`;
        }

        // Calculated Field Widget
        if (element.widgetType === 'calculated' || element.isCalculated || foundField?.isCalculated) {
            return `
            <div className={\`${wrapperClass}\`}>
                <div className="flex justify-between items-center mb-1">
                    <label className="${labelClass}">${element.label}</label>
                    <span className="text-[10px] bg-amber-100 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 font-bold px-2 py-0.5 rounded-full border border-amber-300/50 dark:border-amber-800/50">⚡ Berechnet</span>
                </div>
                <input
                    type="text"
                    readOnly
                    className={\`${inputClass} bg-amber-50 dark:bg-amber-950/20 text-amber-950 dark:text-amber-200 font-mono font-bold cursor-default\`}
                    value={${dataVar}.${bindProp} !== undefined && ${dataVar}.${bindProp} !== null ? ${dataVar}.${bindProp} : ''}
                    placeholder="(Berechnung)"
                />
            </div>`;
        }

        // Checkbox / Switch Widget
        if (element.widgetType === 'checkbox' || element.widgetType === 'switch' || inputType === 'checkbox') {
            return `
            <div className={\`${wrapperClass}\`}>
                <div className="flex items-center gap-2.5 mt-6 mb-2">
                    <input
                        type="checkbox"
                        id="field_${element.id}"
                        disabled={${uxDisabled}}
                        checked={!!${dataVar}.${bindProp}}
                        onChange={e => setData({...${dataVar}, ${bindProp}: e.target.checked})}
                        className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500 border-slate-300 dark:border-slate-600 dark:bg-slate-700 cursor-pointer"
                    />
                    <label htmlFor="field_${element.id}" className="text-sm font-semibold text-slate-700 dark:text-slate-300 cursor-pointer">${element.label} {${uxRequired} && <span className="text-red-500">*</span>}</label>
                </div>
            </div>`;
        }

        // Enum Dropdown Field (Standalone enum / fixed options)
        if (foundField?.type === 'ENUM' || (foundField?.enumValues && foundField.enumValues.length > 0) || (element.widgetType === 'select' && (!element.lookup || !element.lookup.tableId))) {
            const enumOptions = (foundField?.enumValues && foundField.enumValues.length > 0) 
                ? foundField.enumValues 
                : ['Option 1', 'Option 2'];
            const optionsJsx = enumOptions.map((opt: string) => `                    <option key="${opt}" value="${opt.replace(/"/g, '&quot;')}">${opt}</option>`).join('\n');
            const parentTable = tables.find(t => t.fields.some(f => f.id === element.fieldId));
            const tableName = parentTable ? parentTable.name : 'table';

            return `
            <div className={\`${wrapperClass}\`}>
                {/* ENUM DROPDOWN: ${fieldName} (${tableName}) */}
                {/* 1. FRONTEND: To add/modify options, add <option value="..."> tags below */}
                {/* 2. DATABASE: To alter enum in DB, update DB Studio or run: */}
                {/*    ALTER TABLE \`${tableName}\` MODIFY COLUMN \`${fieldName}\` ENUM(${enumOptions.map((o: string) => `'${o.replace(/'/g, "\\'")}'`).join(', ')}); */}
                <label className="${labelClass}">${element.label} {${uxRequired} && <span className="text-red-500">*</span>}</label>
                <div className="relative">
                    <select 
                        disabled={${uxDisabled}} required={${uxRequired}}
                        className={\`${inputClass} appearance-none pr-8 cursor-pointer\`}
                        value={${dataVar}.${bindProp} ?? ''}
                        onChange={e => setData({...${dataVar}, ${bindProp}: e.target.value})}
                    >
                        <option value="">-- Bitte wählen (${element.label}) --</option>
${optionsJsx}
                    </select>
                    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-slate-500">
                        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" /></svg>
                    </div>
                </div>
            </div>`;
        }

        // Select / Lookup
        if (element.widgetType === 'select' && element.lookup) {
             let lookupTable: any = tables.find(t => t.id === element.lookup!.tableId);
             if (!lookupTable) {
                 lookupTable = queries.find((q: any) => q.id === element.lookup!.tableId);
                 if (lookupTable) {
                     lookupTable = { ...lookupTable, fields: lookupTable.columns || [] };
                 }
             }
             if (lookupTable) {
                 const listVar = `${toCamelCase(lookupTable.name)}List`;
                 const valField = lookupTable.fields.find(f => f.id === element.lookup!.valueFieldId);
                 const valProp = valField ? toCamelCase((valField as any).name || (valField as any).alias || (valField as any).fieldName) : "id";
                 const modalId = `lookup_${element.id}`;

                 // --- DISPLAY LOGIC START ---
                 let displayExpression = `i.${valProp}`; // Default fallback
                 
                 if (element.lookup.displayFormat && element.lookup.displayFormat.length > 0) {
                     // Complex format with prefix/suffix
                     displayExpression = element.lookup.displayFormat.map(fmt => {
                         const f = lookupTable.fields.find((field: any) => field.id === fmt.fieldId);
                         if (!f) return '""';
                         const prop = toCamelCase(((f as any).name || (f as any).alias || (f as any).fieldName) || f.alias || f.fieldName);
                         return `"${fmt.prefix || ''}" + (i.${prop} !== undefined && i.${prop} !== null ? i.${prop} : (i.${prop}Value !== undefined && i.${prop}Value !== null ? i.${prop}Value : "")) + "${fmt.suffix || ''}"`;
                     }).join(' + ');
                 } else if (element.lookup.labelFields && element.lookup.labelFields.length > 0) {
                     // Simple list of fields
                     displayExpression = element.lookup.labelFields.map(fid => {
                         const f = lookupTable.fields.find((field: any) => field.id === fid);
                         const prop = f ? toCamelCase(((f as any).name || (f as any).alias || (f as any).fieldName) || f.alias || f.fieldName) : '';
                         return prop ? `(i.${prop} !== undefined && i.${prop} !== null ? i.${prop} : (i.${prop}Value !== undefined && i.${prop}Value !== null ? i.${prop}Value : ""))` : '""';
                      }).filter(Boolean).join(' + " " + ');
                 }
                 // --- DISPLAY LOGIC END ---

                 if (element.lookup.allowQuickCreate) {
                     // Check if not already added to avoid dups
                     if (!modals.find(m => m.id === modalId)) {
                        modals.push({
                            id: modalId,
                            type: 'lookup',
                            table: lookupTable
                        });
                     }
                 }
                 
                 return `
                 <div className={\`${wrapperClass}\`}>
                    <label className="${labelClass}">${element.label} {${uxRequired} && <span className="text-red-500">*</span>}</label>
                    <div className="flex gap-2">
                        <div className="relative flex-1">
                            <select 
                                disabled={${uxDisabled}} required={${uxRequired}}
                                className={\`${inputClass} appearance-none\`}
                                value={${dataVar}.${bindProp} || ''}
                                onChange={e => setData({...${dataVar}, ${bindProp}: e.target.value})}
                            >
                                <option value="">Bitte wählen...</option>
                                {${listVar}.map(i => <option key={i.${valProp}} value={i.${valProp}}>{${displayExpression}}</option>)}
                            </select>
                            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-slate-500">
                               <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" /></svg>
                            </div>
                        </div>
                        ${element.lookup.allowQuickCreate ? `
                        <button 
                            type="button"
                            onClick={() => toggleModal('${modalId}', true)}
                            className="bg-emerald-100 hover:bg-emerald-200 text-emerald-700 border border-emerald-300 rounded px-3 flex items-center justify-center transition-colors"
                            title="Neu erstellen"
                        >
                            <Plus size={18} strokeWidth={3} />
                        </button>` : ''}
                    </div>
                 </div>`;
             }
        }

        // Current User (WhoAmI)
        if (element.widgetType === 'current-user') {
            const modalId = `picker_me_${element.id}`;
            if (!modals.find(m => m.id === modalId)) {
                modals.push({ id: modalId, type: 'user-picker', mode: 'me', targetField: bindProp });
            }
            return `
            <div className={\`${wrapperClass}\`}>
                <label className="${labelClass}">${element.label} {${uxRequired} && <span className="text-red-500">*</span>}</label>
                <div className="flex gap-2">
                    <div className="relative flex-1">
                        <User className="absolute left-2 top-2.5 text-emerald-600" size={16} />
                        <input
                            type="text"
                            readOnly
                            disabled={${uxDisabled}} required={${uxRequired}}
                            value={${dataVar}.${bindProp} || ''}
                            className={\`${inputClass} pl-8 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-900 dark:text-emerald-100 font-mono\`}
                            placeholder="(Leer)"
                        />
                    </div>
                    <button 
                        type="button"
                        onClick={() => toggleModal('${modalId}', true)}
                        disabled={${uxDisabled}}
                        className="bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white px-3 py-1 rounded text-xs font-bold shadow-sm transition-colors whitespace-nowrap"
                        title="Mich selbst eintragen"
                    >
                        Ich (Auto)
                    </button>
                </div>
            </div>`;
        }

        // AD Search
        if (element.widgetType === 'ad-search') {
            const modalId = `picker_search_${element.id}`;
            if (!modals.find(m => m.id === modalId)) {
                modals.push({ id: modalId, type: 'user-picker', mode: 'search', targetField: bindProp });
            }
            return `
            <div className={\`${wrapperClass}\`}>
                <label className="${labelClass}">${element.label} {${uxRequired} && <span className="text-red-500">*</span>}</label>
                <div className="flex gap-2">
                    <div className="relative flex-1">
                        <Search className="absolute left-2 top-2.5 text-blue-500" size={16} />
                        <input
                            type="text"
                            disabled={${uxDisabled}} required={${uxRequired}}
                            value={${dataVar}.${bindProp} || ''}
                            onChange={e => setData({...${dataVar}, ${bindProp}: e.target.value})}
                            className={\`${inputClass} pl-8\`}
                            placeholder="Benutzer auswählen..."
                        />
                    </div>
                    <button 
                        type="button"
                        onClick={() => toggleModal('${modalId}', true)}
                        disabled={${uxDisabled}}
                        className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white px-3 py-1 rounded text-xs font-bold shadow-sm transition-colors whitespace-nowrap flex items-center gap-1"
                    >
                        <Search size={14}/> Suchen
                    </button>
                </div>
            </div>`;
        }

        let valExpr = `${dataVar}.${bindProp} !== undefined && ${dataVar}.${bindProp} !== null ? ${dataVar}.${bindProp} : ''`;
        if (inputType === 'date') {
            valExpr = `${dataVar}.${bindProp} ? String(${dataVar}.${bindProp}).split('T')[0].split(' ')[0] : ''`;
        } else if (inputType === 'datetime-local') {
            valExpr = `${dataVar}.${bindProp} ? (() => { try { return new Date(${dataVar}.${bindProp}).toISOString().slice(0, 16); } catch(e) { return ''; } })() : ''`;
        } else if (inputType === 'time') {
            valExpr = `${dataVar}.${bindProp} ? String(${dataVar}.${bindProp}).substring(0, 5) : ''`;
        }

        return `
        <div className={\`${wrapperClass}\`}>
            <label className="${labelClass}">${element.label} {${uxRequired} && <span className="text-red-500">*</span>}</label>
            <input type="${inputType}" disabled={${uxDisabled}} required={${uxRequired}} className={\`${inputClass}\`} value={${valExpr}} onChange={e => setData({...${dataVar}, ${bindProp}: e.target.value})} />
        </div>`;
    }
    return '';
};
