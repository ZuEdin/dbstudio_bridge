import { GeneratorContext } from './types';

const toCamelCase = (str: string): string => {
  if (!str) return '';
  return str
    .replace(/[^a-zA-Z0-9]+(.)/g, (m, chr) => chr.toUpperCase())
    .replace(/^[A-Z]/, (chr) => chr.toLowerCase());
};

const toPascalCase = (str: string): string => {
  if (!str) return '';
  const camel = toCamelCase(str);
  return camel.charAt(0).toUpperCase() + camel.slice(1);
};

export const compilePlaceholders = (text: string, contextVar?: string): string => {
  if (!text) return '""';
  const normalized = text.replace(/\{\{/g, '{').replace(/\}\}/g, '}');
  if (!normalized.includes('{')) return JSON.stringify(normalized);
  
  const replaced = normalized.replace(/\{([^{}]+)\}/g, (match, key) => {
    const trimmedKey = key.trim();
    if (contextVar) {
      return `\${${contextVar}?.\['${trimmedKey}'\] || ${contextVar}?.\['${toCamelCase(trimmedKey)}'\] || searchParams.get('${trimmedKey}') || ''}`;
    } else {
      return `\${searchParams.get('${trimmedKey}') || ''}`;
    }
  });
  
  return `\`${replaced}\``;
};

export const generateSimpleNode = (node: any, ctx: GeneratorContext): string => {
  if (!node) return '';
  
  const classNameStr = node.props?.className || '';
  const styleStr = JSON.stringify(node.props?.style || {});
  const suffix = node.id ? node.id.replace(/-/g, '_') : Math.random().toString(36).substring(2, 9);
  
  switch (node.type) {
      case 'container': {
          const childrenStr = (node.children || []).map((c: any) => ctx.generateNode(c, ctx)).join('\n');
          return `<div className="${classNameStr || 'p-4 border rounded'}" style={${styleStr}}>${childrenStr}</div>`;
      }
      case 'text': {
          const compiledText = compilePlaceholders(node.props?.text || '', ctx.currentContextVar);
          return `<div className="break-words ${classNameStr}" style={${styleStr}}>{${compiledText}}</div>`;
      }
      case 'button': {
          const actType = node.props?.actionType;
          
          if (actType === 'export_report') {
            const fmt = node.props?.exportFormat || 'PDF';
            return `<button onClick={() => exportDataToFile({ title: '${node.props?.label || 'Bericht Export'}', data: [], format: '${fmt}' })} className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded transition cursor-pointer font-bold ${classNameStr}" style={${styleStr}}>${node.props?.label || '📊 Bericht Exportieren'}</button>`;
          }
          
          if (actType === 'run_macro' || actType === 'smart_import') {
            const macroId = node.props?.macroId || node.props?.exportFormat || 'macro';
            return `<button onClick={() => executeMacro('${macroId}')} className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded transition cursor-pointer font-bold ${classNameStr}" style={${styleStr}}>${node.props?.label || '⚡ Makro / Import Starten'}</button>`;
          }

          if (actType === 'open_form') {
            const formId = node.props?.formId;
            const fObj = ctx.forms.find(f => f.id === formId);
            const tblObj = fObj ? ctx.tables.find(t => t.id === fObj.sourceId) : null;
            let path = '';
            if (fObj) {
              path = `/forms/${fObj.id}`;
            } else if (node.props?.targetTableId) {
              const tObj = ctx.tables.find(t => t.id === node.props.targetTableId);
              if (tObj) path = `/${toCamelCase(tObj.name)}`;
            }

            const clickHandler = `() => {
              let targetId = 'new';
              ${node.props?.formMode === 'edit' ? `
              targetId = ${ctx.currentContextVar ? `String(${ctx.currentContextVar}?.id || ${ctx.currentContextVar}?.\['id'\] || ${ctx.currentContextVar}?.\['${toCamelCase(tblObj?.fields?.find(f => f.isPrimaryKey)?.name || 'id')}'\] || '')` : `searchParams.get('selectedId')`} || 'new';
              ` : ''}
              
              const qParams = new URLSearchParams();
              ${(node.props?.navigateTargetParams || []).map((m: any) => {
                  const src = m.sourceKey;
                  const tgt = m.targetKey;
                  if (!src || !tgt) return '';
                  let resolvedVal = '';
                  if (ctx.currentContextVar) {
                      resolvedVal = `String(${ctx.currentContextVar}?.\['${src}'\] ?? ${ctx.currentContextVar}?.\['${toCamelCase(src)}'\] ?? searchParams.get('${src}') ?? '${src}')`;
                  } else {
                      resolvedVal = `String(searchParams.get('${src}') ?? '${src}')`;
                  }
                  return `qParams.set('${tgt}', ${resolvedVal});`;
              }).join('\n              ')}
              
              const qStr = qParams.toString();
              navigate(\`${path}/\${targetId}\${qStr ? '?' + qStr : ''}\`);
            }`;

            return `<button onClick={${clickHandler}} className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition font-semibold cursor-pointer ${classNameStr}" style={${styleStr}}>${node.props?.label || 'Formular öffnen'}</button>`;
          }

          if (actType === 'navigate_to_page') {
            const targetPageId = node.props?.targetPageId;
            const pObj = ctx.pages.find(p => p.id === targetPageId);
            let path = pObj ? `/custom/${toCamelCase(pObj.name)}` : '/';

            const clickHandler = `() => {
              const qParams = new URLSearchParams();
              ${(node.props?.navigateTargetParams || []).map((m: any) => {
                  const src = m.sourceKey;
                  const tgt = m.targetKey;
                  if (!src || !tgt) return '';
                  let resolvedVal = '';
                  if (ctx.currentContextVar) {
                      resolvedVal = `String(${ctx.currentContextVar}?.\['${src}'\] ?? ${ctx.currentContextVar}?.\['${toCamelCase(src)}'\] ?? searchParams.get('${src}') ?? '${src}')`;
                  } else {
                      resolvedVal = `String(searchParams.get('${src}') ?? '${src}')`;
                  }
                  return `qParams.set('${tgt}', ${resolvedVal});`;
              }).join('\n              ')}
              
              const qStr = qParams.toString();
              navigate(\`${path}\${qStr ? '?' + qStr : ''}\`);
            }`;

            return `<button onClick={${clickHandler}} className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition font-semibold cursor-pointer ${classNameStr}" style={${styleStr}}>${node.props?.label || 'Seite öffnen'}</button>`;
          }

          if (actType === 'set_parameter') {
            const paramName = node.props?.paramName;
            const paramValue = node.props?.paramValue;
            
            if (paramName) {
              const clickHandler = `() => {
                const newParams = new URLSearchParams(searchParams);
                newParams.set('${paramName}', ${compilePlaceholders(paramValue || '', ctx.currentContextVar)});
                navigate('?' + newParams.toString(), { replace: true });
              }`;
              return `<button onClick={${clickHandler}} className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg transition font-semibold cursor-pointer ${classNameStr}" style={${styleStr}}>${node.props?.label || 'Parameter setzen'}</button>`;
            }
          }

          if (actType === 'delete_record') {
            const targetTableId = node.props?.targetTableId;
            const tObj = ctx.tables.find(t => t.id === targetTableId);
            const tblPascal = tObj ? toPascalCase(tObj.name) : '';
            const pkField = tObj?.fields?.find(f => f.isPrimaryKey)?.name || 'id';

            if (tObj) {
              ctx.imports.add('remove');
              
              const showState = `showDelete_${suffix}`;
              const idState = `deleteId_${suffix}`;
              const setShowState = `setShowDelete_${suffix}`;
              const setIdState = `setDeleteId_${suffix}`;

              ctx.states.push(`const [${showState}, ${setShowState}] = useState(false);`);
              ctx.states.push(`const [${idState}, ${setIdState}] = useState<any>(null);`);

              ctx.effects.push(`
  const confirmDelete_${suffix} = async () => {
    if (${idState}) {
      try {
        await remove('${tblPascal}/' + ${idState});
        navigate('.', { replace: true });
      } catch(e) {
        console.error(e);
      } finally {
        ${setShowState}(false);
        ${setIdState}(null);
      }
    }
  };`);

              const clickHandler = `() => {
                const idVal = ${ctx.currentContextVar ? `String(${ctx.currentContextVar}?.id || ${ctx.currentContextVar}?.\['id'\] || ${ctx.currentContextVar}?.\['${toCamelCase(pkField)}'\] || '')` : `searchParams.get('${node.props?.paramKey || 'selectedId'}')`};
                if (idVal) {
                  ${setIdState}(idVal);
                  ${setShowState}(true);
                }
              }`;

              return `
              <>
                <button onClick={${clickHandler}} className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-lg transition font-semibold cursor-pointer ${classNameStr}" style={${styleStr}}>
                  {node.props?.label || 'Löschen'}
                </button>
                {${showState} && (
                  <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-[2px]">
                    <div className="bg-white dark:bg-slate-800 rounded-xl shadow-2xl border border-slate-200 dark:border-slate-700 max-w-md w-full overflow-hidden animate-in fade-in zoom-in-95 duration-150">
                      <div className="p-6 text-start">
                        <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-2">Datensatz löschen</h3>
                        <p className="text-sm text-slate-600 dark:text-slate-400">Sind Sie sicher, dass Sie diesen Datensatz unwiderruflich löschen möchten? Dieser Vorgang kann nicht rückgängig gemacht werden.</p>
                      </div>
                      <div className="p-4 bg-slate-50 dark:bg-slate-900/50 border-t border-slate-100 dark:border-slate-700 flex justify-end gap-3">
                        <button 
                          onClick={() => ${setShowState}(false)}
                          className="px-4 py-2 border border-slate-200 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition text-sm font-semibold cursor-pointer"
                        >
                          Abbrechen
                        </button>
                        <button 
                          onClick={confirmDelete_${suffix}}
                          className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-lg transition text-sm font-semibold shadow-sm cursor-pointer"
                        >
                          Ja, löschen
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </>
              `;
            }
          }

          return `<button className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition font-semibold ${classNameStr}" style={${styleStr}}>${node.props?.label || 'Button'}</button>`;
      }
      case 'divider': {
          return `<hr className="border-slate-200 my-4 ${classNameStr}" style={${styleStr}} />`;
      }
      case 'image': {
          return `<img referrerPolicy="no-referrer" src="${node.props?.src || ''}" className="max-w-full h-auto rounded ${classNameStr}" style={${styleStr}} alt="${node.props?.alt || ''}" />`;
      }
      case 'html': {
          return `<div dangerouslySetInnerHTML={{ __html: ${JSON.stringify(node.props?.html || '')} }} className="${classNameStr}" style={${styleStr}} />`;
      }
      default:
          return '';
  }
};
