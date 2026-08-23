import { Query, Table, VirtualFile, SelectQuery } from '../../../../types/index';
import { toCamelCase, toPascalCase, toKebabCase } from '../../common';

interface RouteInfo {
  path: string;
  component: string;
  folder: string;
  file: string;
}

export const generateQueryComponents = (
  queries: Query[],
  tables: Table[],
  appRoot: string
): { files: VirtualFile[]; routes: RouteInfo[] } => {
  const files: VirtualFile[] = [];
  const routes: RouteInfo[] = [];

  queries.forEach(query => {
    const pascalName = toPascalCase(query.name);
    const kebabName = toKebabCase(query.name);
    const camelName = toCamelCase(query.name);
    const compName = `${pascalName}QueryComponent`;
    const folder = 'queries';
    const fileName = `${kebabName}-query.component`;

    if (query.type === 'SELECT') {
      const q = query as SelectQuery;
      const visibleCols = q.columns.filter(c => c.show);

      const columnsHeader = visibleCols.map(c => 
        `<th class="p-4">${c.alias || c.fieldName}</th>`
      ).join('\n                ');

      const cellsBody = visibleCols.map(c => {
        const rawKey = c.alias || c.fieldName || '';
        const fieldName = c.fieldName || '';
        return `<td class="p-4 text-sm text-slate-700 dark:text-slate-300 whitespace-nowrap">{{ getCellValue(item, ${JSON.stringify(rawKey)}, ${JSON.stringify(fieldName)}) }}</td>`;
      }).join('\n                ');

      const content = `import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../services/api.service';

@Component({
  selector: 'app-${kebabName}-query',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: \`
    <div class="p-8 max-w-[95%] mx-auto">
      <div class="flex justify-between items-center mb-8">
        <h1 class="text-3xl font-bold dark:text-white">${q.name}</h1>
        <div class="flex gap-4">
          <input 
            type="text" 
            placeholder="Suchen..." 
            class="px-4 py-2 border rounded-lg bg-white dark:bg-slate-800 dark:border-slate-700 dark:text-white"
            [(ngModel)]="search"
            (ngModelChange)="onSearchChange()"
          />
        </div>
      </div>
      <div class="bg-white dark:bg-slate-800 rounded-xl shadow-sm overflow-hidden border border-slate-200 dark:border-slate-700">
        <div class="overflow-x-auto">
          <table class="w-full text-left">
            <thead class="bg-slate-50 dark:bg-slate-900 border-b dark:border-slate-700 text-slate-500 uppercase text-xs font-semibold">
              <tr>
                ${columnsHeader}
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100 dark:divide-slate-700">
              <tr *ngFor="let item of data" class="hover:bg-slate-50 dark:hover:bg-slate-700/50">
                ${cellsBody}
              </tr>
              <tr *ngIf="!loading && data.length === 0">
                <td colSpan="${visibleCols.length || 1}" class="p-8 text-center text-slate-400">Keine Daten.</td>
              </tr>
            </tbody>
          </table>
        </div>
        <div class="p-4 border-t border-slate-100 dark:border-slate-700 flex items-center justify-between bg-slate-50 dark:bg-slate-900/50">
          <div class="text-sm text-slate-500">Seite {{page}} von {{totalPages}}</div>
          <div class="flex gap-2">
            <button (click)="prevPage()" [disabled]="page <= 1" class="p-2 border rounded bg-white hover:bg-slate-50 disabled:opacity-50">Zurück</button>
            <button (click)="nextPage()" [disabled]="page >= totalPages" class="p-2 border rounded bg-white hover:bg-slate-50 disabled:opacity-50">Weiter</button>
          </div>
        </div>
      </div>
    </div>
  \`
})
export class ${compName} implements OnInit {
  data: any[] = [];
  total = 0;
  page = 1;
  totalPages = 1;
  search = '';
  loading = true;

  constructor(private api: ApiService) {}

  ngOnInit() {
    this.load();
  }

  onSearchChange() {
    this.page = 1;
    this.load();
  }

  load() {
    this.loading = true;
    this.api.getAll('queries/${camelName}', this.page, 20, this.search).subscribe({
      next: (res: any) => {
        let items: any[] = [];
        let total = 0;
        let curPage = this.page;
        let totalPages = 1;

        if (Array.isArray(res)) {
          items = res;
          total = res.length;
        } else if (res && typeof res === 'object') {
          items = res.data || res.Data || res.items || res.Items || [];
          total = res.total ?? res.Total ?? items.length;
          curPage = res.page ?? res.Page ?? this.page;
          totalPages = (res.totalPages ?? res.TotalPages ?? Math.ceil(total / 20)) || 1;
        }
        this.data = items;
        this.total = total;
        this.page = curPage;
        this.totalPages = totalPages;
        this.loading = false;
      },
      error: () => {
        this.loading = false;
      }
    });
  }

  getCellValue(item: any, alias: string, fieldName: string): string {
    if (!item) return '';
    if (item[alias] !== undefined && item[alias] !== null) return String(item[alias]);
    const camelAlias = alias ? alias.charAt(0).toLowerCase() + alias.slice(1) : '';
    if (camelAlias && item[camelAlias] !== undefined && item[camelAlias] !== null) return String(item[camelAlias]);
    if (fieldName && item[fieldName] !== undefined && item[fieldName] !== null) return String(item[fieldName]);
    const camelField = fieldName ? fieldName.charAt(0).toLowerCase() + fieldName.slice(1) : '';
    if (camelField && item[camelField] !== undefined && item[camelField] !== null) return String(item[camelField]);
    const target = (alias || fieldName).toLowerCase();
    const foundKey = Object.keys(item).find(k => k.toLowerCase() === target);
    return foundKey ? String(item[foundKey]) : '';
  }

  prevPage() {
    if (this.page > 1) {
      this.page--;
      this.load();
    }
  }

  nextPage() {
    if (this.page < this.totalPages) {
      this.page++;
      this.load();
    }
  }
}
`;

      files.push({
        name: `${fileName}.ts`,
        path: `${appRoot}/pages/${folder}/${fileName}.ts`,
        content,
        language: 'typescript'
      });

      routes.push({
        path: `queries/${kebabName}`,
        component: compName,
        folder,
        file: fileName
      });
    }
  });

  return { files, routes };
};
