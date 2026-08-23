import { NodeGeneratorContext } from './types';
import { toKebabCase, toPascalCase } from '../../../common';

const toCamelCase = (str: string): string => {
  if (!str) return '';
  return str
    .replace(/[^a-zA-Z0-9]+(.)/g, (m, chr) => chr.toUpperCase())
    .replace(/^[A-Z]/, (chr) => chr.toLowerCase());
};

export const compileAngularPlaceholders = (text: string, contextVar?: string): string => {
  if (!text) return '';
  const normalized = text.replace(/\{\{/g, '{').replace(/\}\}/g, '}');
  if (!normalized.includes('{')) return normalized;
  
  return normalized.replace(/\{([^{}]+)\}/g, (match, key) => {
    const trimmedKey = key.trim();
    if (contextVar) {
      return `{{ ${contextVar}?.['${trimmedKey}'] || ${contextVar}?.['${toCamelCase(trimmedKey)}'] || ${contextVar}?.${trimmedKey} || ${contextVar}?.${toCamelCase(trimmedKey)} || queryParams?.['${trimmedKey}'] || '' }}`;
    } else {
      return `{{ queryParams?.['${trimmedKey}'] || '' }}`;
    }
  });
};

export const generateContainerNode = (node: any, context: NodeGeneratorContext, generateNode: (node: any, ctx: NodeGeneratorContext) => string): string => {
    let classNameStr = node.props?.className || '';
    let styleAttr = node.props?.style ? `style="${Object.entries(node.props.style).map(([k,v]) => `${toKebabCase(k)}:${v}`).join(';')}"` : '';
    const childrenStr = (node.children || []).map((c: any) => generateNode(c, context)).join('\n');
    const defaultClass = context.isBootstrap ? 'p-3 border rounded bg-white' : 'p-4 border rounded';
    return `<div class="${classNameStr || defaultClass}" ${styleAttr}>${childrenStr}</div>`;
};

export const generateTextNode = (node: any, context: NodeGeneratorContext): string => {
    let classNameStr = node.props?.className || '';
    let styleAttr = node.props?.style ? `style="${Object.entries(node.props.style).map(([k,v]) => `${toKebabCase(k)}:${v}`).join(';')}"` : '';
    const defaultClass = context.isBootstrap ? 'text-break' : 'break-words';
    const compiledText = compileAngularPlaceholders(node.props?.text || '', context.currentContextVar);
    return `<div class="${defaultClass} ${classNameStr}" ${styleAttr}>${compiledText}</div>`;
};

export const generateButtonNode = (node: any, context: NodeGeneratorContext): string => {
    let classNameStr = node.props?.className || '';
    let styleAttr = node.props?.style ? `style="${Object.entries(node.props.style).map(([k,v]) => `${toKebabCase(k)}:${v}`).join(';')}"` : '';
    const defaultClass = context.isBootstrap ? 'btn btn-primary' : 'px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded transition cursor-pointer font-bold';
    
    const suffix = node.id ? node.id.replace(/-/g, '_') : Math.random().toString(36).substring(2, 9);
    const clickMethodName = `clickButton_${suffix}`;
    let clickAttr = `(click)="${clickMethodName}()"`;
    
    const actType = node.props?.actionType;

    const compileTypeScriptPlaceholder = (text: string, contextVar?: string): string => {
      if (!text) return "''";
      const normalized = text.replace(/\{\{/g, '{').replace(/\}\}/g, '}');
      if (!normalized.includes('{')) return `'${normalized.replace(/'/g, "\\'")}'`;
      
      const replaced = normalized.replace(/\{([^{}]+)\}/g, (match, key) => {
        const trimmedKey = key.trim();
        if (contextVar) {
          return `\${this.${contextVar}?.['${trimmedKey}'] || this.${contextVar}?.['${toCamelCase(trimmedKey)}'] || this.${contextVar}?.${trimmedKey} || this.${contextVar}?.${toCamelCase(trimmedKey)} || this.queryParams['${trimmedKey}'] || ''}`;
        } else {
          return `\${this.queryParams['${trimmedKey}'] || ''}`;
        }
      });
      return `\`${replaced}\``;
    };

    if (actType === 'run_macro' || actType === 'smart_import' || node.props?.macroId || node.props?.exportFormat) {
        const mId = node.props?.macroId || node.props?.exportFormat || 'macro';
        clickAttr = `(click)="executeMacro('${mId}')"`;
    } else if (actType === 'export_report') {
        const fmt = node.props?.exportFormat || 'PDF';
        clickAttr = `(click)="executeMacro('${fmt}')"`;
    } else if (actType === 'open_form') {
        const formId = node.props?.formId;
        const fObj = context.forms.find(f => f.id === formId);
        const tblObj = fObj ? context.tables.find(t => t.id === fObj.sourceId) : null;
        let path = '';
        if (fObj) {
            path = `/forms/${fObj.id}`;
        } else if (node.props?.targetTableId) {
            const tObj = context.tables.find(t => t.id === node.props.targetTableId);
            if (tObj) path = `/${toCamelCase(tObj.name)}`;
        }

        context.methods.push(`
  ${clickMethodName}() {
    const qParams: any = {};
    ${(node.props?.navigateTargetParams || []).map((m: any) => {
        const src = m.sourceKey;
        const tgt = m.targetKey;
        if (!src || !tgt) return '';
        let valStr = '';
        if (context.currentContextVar) {
            valStr = `String(this.${context.currentContextVar}?.['${src}'] ?? this.${context.currentContextVar}?.['${toCamelCase(src)}'] ?? this.queryParams['${src}'] ?? '${src}')`;
        } else {
            valStr = `String(this.queryParams['${src}'] ?? '${src}')`;
        }
        return `qParams['${tgt}'] = ${valStr};`;
    }).join('\n    ')}

    let targetId = 'new';
    ${node.props?.formMode === 'edit' ? `
    targetId = ${context.currentContextVar ? `String(this.${context.currentContextVar}?.id || this.${context.currentContextVar}?.['id'] || this.${context.currentContextVar}?.['${toCamelCase(tblObj?.fields?.find(f => f.isPrimaryKey)?.name || 'id')}'])` : `this.queryParams['selectedId']`} || 'new';
    ` : ''}

    this.router.navigate(['${path}', targetId], { queryParams: qParams });
  }`);
    } else if (actType === 'navigate_to_page') {
        const targetPageId = node.props?.targetPageId;
        const pObj = (context.pages || []).find(p => p.id === targetPageId);
        let path = pObj ? `/custom/${toKebabCase(pObj.name)}` : '/';

        context.methods.push(`
  ${clickMethodName}() {
    const qParams: any = {};
    ${(node.props?.navigateTargetParams || []).map((m: any) => {
        const src = m.sourceKey;
        const tgt = m.targetKey;
        if (!src || !tgt) return '';
        let valStr = '';
        if (context.currentContextVar) {
            valStr = `String(this.${context.currentContextVar}?.['${src}'] ?? this.${context.currentContextVar}?.['${toCamelCase(src)}'] ?? this.queryParams['${src}'] ?? '${src}')`;
        } else {
            valStr = `String(this.queryParams['${src}'] ?? '${src}')`;
        }
        return `qParams['${tgt}'] = ${valStr};`;
    }).join('\n    ')}

    this.router.navigate(['${path}'], { queryParams: qParams });
  }`);
    } else if (actType === 'set_parameter') {
        const paramName = node.props?.paramName;
        const paramValue = node.props?.paramValue;
        if (paramName) {
            context.methods.push(`
  ${clickMethodName}() {
    const qParams = { ...this.queryParams };
    qParams['${paramName}'] = ${compileTypeScriptPlaceholder(paramValue || '', context.currentContextVar)};
    this.router.navigate([], { queryParams: qParams, queryParamsHandling: 'merge' });
  }`);
        }
    } else if (actType === 'delete_record') {
        const targetTableId = node.props?.targetTableId;
        const tObj = context.tables.find(t => t.id === targetTableId);
        const tblPascal = tObj ? toPascalCase(tObj.name) : '';
        const pkField = tObj?.fields?.find(f => f.isPrimaryKey)?.name || 'id';

        if (tObj) {
            context.states.push(`showDelete_${suffix}: boolean = false;`);
            context.states.push(`deleteId_${suffix}: any = null;`);

            context.methods.push(`
  ${clickMethodName}() {
    const idVal = ${context.currentContextVar ? `String(this.${context.currentContextVar}?.id || this.${context.currentContextVar}?.['id'] || this.${context.currentContextVar}?.['${toCamelCase(pkField)}'])` : `this.queryParams['selectedId']`};
    if (idVal) {
      this.deleteId_${suffix} = idVal;
      this.showDelete_${suffix} = true;
    }
  }

  confirmDelete_${suffix}() {
    if (this.deleteId_${suffix}) {
      this.api.delete('${tblPascal}', this.deleteId_${suffix}).subscribe({
        next: () => {
          this.showDelete_${suffix} = false;
          this.deleteId_${suffix} = null;
          const currentUrl = this.router.url;
          this.router.navigateByUrl('/', { skipLocationChange: true }).then(() => {
            this.router.navigateByUrl(currentUrl);
          });
        },
        error: (err: any) => {
          console.error(err);
          this.showDelete_${suffix} = false;
        }
      });
    }
  }`);

            const modalHtml = context.isBootstrap ? `
            <div *ngIf="showDelete_${suffix}" class="modal fade show d-block" style="background: rgba(0,0,0,0.5); z-index: 1050;" tabindex="-1">
                <div class="modal-dialog modal-dialog-centered">
                    <div class="modal-content">
                        <div class="modal-header">
                            <h5 class="modal-title">Datensatz löschen</h5>
                            <button type="button" class="btn-close" (click)="showDelete_${suffix} = false"></button>
                        </div>
                        <div class="modal-body text-start text-dark">
                            <p>Sind Sie sicher, dass Sie diesen Datensatz unwiderruflich löschen möchten? Dieser Vorgang kann nicht rückgängig gemacht werden.</p>
                        </div>
                        <div class="modal-footer">
                            <button type="button" class="btn btn-secondary" (click)="showDelete_${suffix} = false">Abbrechen</button>
                            <button type="button" class="btn btn-danger" (click)="confirmDelete_${suffix}()">Ja, löschen</button>
                        </div>
                    </div>
                </div>
            </div>` : `
            <div *ngIf="showDelete_${suffix}" class="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                <div class="bg-white rounded-xl shadow-xl max-w-md w-full overflow-hidden border border-slate-200">
                    <div class="p-6 text-start">
                        <h3 class="text-lg font-bold text-slate-800 mb-2">Datensatz löschen</h3>
                        <p class="text-sm text-slate-600">Sind Sie sicher, dass Sie diesen Datensatz unwiderruflich löschen möchten? Dieser Vorgang kann nicht rückgängig gemacht werden.</p>
                    </div>
                    <div class="p-4 bg-slate-50 border-t border-slate-100 flex justify-end gap-2">
                        <button (click)="showDelete_${suffix} = false" class="bg-slate-200 hover:bg-slate-300 text-slate-700 px-4 py-2 rounded text-sm font-semibold transition cursor-pointer">Abbrechen</button>
                        <button (click)="confirmDelete_${suffix}()" class="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded text-sm font-semibold shadow-sm transition cursor-pointer">Ja, löschen</button>
                    </div>
                </div>
            </div>`;

            return `<button type="button" ${clickAttr} class="${defaultClass} ${classNameStr}" ${styleAttr}>${node.props?.label || 'Löschen'}</button>${modalHtml}`;
        }
    } else {
        clickAttr = '';
    }

    return `<button type="button" ${clickAttr} class="${defaultClass} ${classNameStr}" ${styleAttr}>${node.props?.label || 'Button'}</button>`;
};

export const generateDividerNode = (node: any, context: NodeGeneratorContext): string => {
    let classNameStr = node.props?.className || '';
    let styleAttr = node.props?.style ? `style="${Object.entries(node.props.style).map(([k,v]) => `${toKebabCase(k)}:${v}`).join(';')}"` : '';
    const defaultClass = context.isBootstrap ? 'my-4' : 'border-slate-200 my-4';
    return `<hr class="${defaultClass} ${classNameStr}" ${styleAttr} />`;
};

export const generateImageNode = (node: any, context: NodeGeneratorContext): string => {
    let classNameStr = node.props?.className || '';
    let styleAttr = node.props?.style ? `style="${Object.entries(node.props.style).map(([k,v]) => `${toKebabCase(k)}:${v}`).join(';')}"` : '';
    return `<img referrerPolicy="no-referrer" src="${node.props?.src || ''}" class="max-w-full h-auto rounded ${classNameStr}" ${styleAttr} alt="${node.props?.alt || ''}" />`;
};

export const generateHtmlNode = (node: any, context: NodeGeneratorContext): string => {
    let classNameStr = node.props?.className || '';
    let styleAttr = node.props?.style ? `style="${Object.entries(node.props.style).map(([k,v]) => `${toKebabCase(k)}:${v}`).join(';')}"` : '';
    const escapedHtml = (node.props?.html || '').replace(/'/g, "\\'");
    return `<div [innerHTML]="'${escapedHtml}'" class="${classNameStr}" ${styleAttr}></div>`;
};
