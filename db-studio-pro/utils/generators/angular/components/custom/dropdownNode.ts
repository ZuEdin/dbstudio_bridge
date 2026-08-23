import { NodeGeneratorContext } from './types';
import { toCamelCase, toKebabCase, toPascalCase } from '../../../common';

export const generateDropdownNode = (node: any, context: NodeGeneratorContext): string => {
    let classNameStr = node.props?.className || '';
    let styleAttr = node.props?.style ? `style="${Object.entries(node.props.style).map(([k,v]) => `${toKebabCase(k)}:${v}`).join(';')}"` : '';

    const stateName = `dropdownData_${node.id.replace(/-/g, '_')}`;
    const loadingState = `dropdownLoading_${node.id.replace(/-/g, '_')}`;
    context.states.push(`${stateName}: any[] = [];`);
    context.states.push(`${loadingState} = false;`);
    
    let fetchUrl = '';
    if (node.props?.queryId) {
        const qObj = context.queries.find(q => q.id === node.props.queryId);
        if (qObj) fetchUrl = `queries/${toCamelCase(qObj.name)}`;
    } else if (node.props?.dataSourceId) {
        const tObj = context.tables.find(t => t.id === node.props.dataSourceId);
        if (tObj) fetchUrl = `${toPascalCase(tObj.name)}`;
    }
    
    if (fetchUrl) {
        context.initCalls.push(`this.loadDropdown_${node.id.replace(/-/g, '_')}();`);
        context.methods.push(`
  loadDropdown_${node.id.replace(/-/g, '_')}() {
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
    
    const valueField = node.props?.valueField || 'id';
    const labelField = node.props?.labelField || 'name';
    
    if (context.isBootstrap) {
        return `
        <div class="p-2 ${classNameStr}" ${styleAttr}>
            <select class="form-select max-w-xs" style="max-width: 280px;">
                <option value="">${node.props?.placeholder || 'Bitte wählen...'}</option>
                <option *ngIf="${loadingState}" disabled>Lade Daten...</option>
                <ng-container *ngIf="!${loadingState}">
                    <option *ngFor="let row of ${stateName}; let idx = index" [value]="row['${toCamelCase(valueField)}'] || row['${valueField}'] || row.id || idx">
                        {{ row['${toCamelCase(labelField)}'] || row['${labelField}'] || row.id || idx }}
                    </option>
                </ng-container>
            </select>
        </div>`;
    } else {
        return `
        <div class="p-2 ${classNameStr}" ${styleAttr}>
            <select class="border border-slate-300 rounded px-3 py-2 bg-white w-full max-w-xs">
                <option value="">${node.props?.placeholder || 'Bitte wählen...'}</option>
                <option *ngIf="${loadingState}" disabled>Lade Daten...</option>
                <ng-container *ngIf="!${loadingState}">
                    <option *ngFor="let row of ${stateName}; let idx = index" [value]="row['${toCamelCase(valueField)}'] || row['${valueField}'] || row.id || idx">
                        {{ row['${toCamelCase(labelField)}'] || row['${labelField}'] || row.id || idx }}
                    </option>
                </ng-container>
            </select>
        </div>`;
    }
};
