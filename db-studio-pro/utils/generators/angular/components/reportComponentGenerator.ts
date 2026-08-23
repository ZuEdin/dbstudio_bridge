import { Table, Report, VirtualFile, Query } from '../../../../types/index';
import { toCamelCase, toKebabCase, toPascalCase } from '../../common';

interface RouteInfo {
  path: string;
  component: string;
  folder: string;
  file: string;
}

export const generateReportComponents = (
  reports: Report[],
  tables: Table[],
  queries: Query[],
  appRoot: string
): { files: VirtualFile[]; routes: RouteInfo[] } => {
  const files: VirtualFile[] = [];
  const routes: RouteInfo[] = [];

  reports.forEach(report => {
      const pascalName = toPascalCase(report.name);
      const kebabName = toKebabCase(report.name);
      const folder = 'reports';
      const sourceName = report.sourceType === 'table' 
          ? toCamelCase(tables.find(t => t.id === report.sourceId)?.name || '') 
          : `queries/${toCamelCase(queries.find(q => q.id === report.sourceId)?.name || '')}`;
      const groupingField = tables.find(t => t.id === report.sourceId)?.fields.find(f => f.id === report.groupingFieldId)?.name;
      const groupingProp = groupingField ? toCamelCase(groupingField) : null;
      const orientation = report.settings?.orientation || 'portrait';
      const widthClass = orientation === 'landscape' ? 'max-w-[297mm]' : 'max-w-[210mm]';

      const reportHtml = `
      <style>
          @media print {
              @page {
                  size: ${orientation};
                  margin: 15mm;
              }
              body {
                  -webkit-print-color-adjust: exact;
              }
          }
      </style>
      <div class="p-8 ${widthClass} mx-auto bg-white shadow-lg min-h-screen my-8 print:shadow-none print:m-0">
          <header class="border-b-4 border-slate-800 pb-4 mb-8">
              <h1 class="text-3xl font-bold">${report.name}</h1>
              <p class="text-slate-500">Erstellt am: {{ today | date }}</p>
          </header>
          <main>
              <div *ngFor="let group of reportData" class="mb-8 break-inside-avoid">
                  <div *ngIf="group.groupValue !== 'Gesamt'" class="bg-slate-100 p-2 border border-slate-200 rounded-t-md font-bold text-lg text-slate-700">
                      ${groupingField}: {{ group.groupValue }}
                  </div>
                  <table class="w-full border-collapse text-sm">
                      <thead>
                          <tr class="border-b border-slate-400 text-left">
                              ${report.columns?.filter(c => c.visible).map(c => `<th class="p-2 font-bold uppercase text-slate-600 text-xs">${c.label}</th>`).join('')}
                          </tr>
                      </thead>
                      <tbody>
                          <tr *ngFor="let item of group.items" class="border-b border-slate-200">
                              ${report.columns?.filter(c => c.visible).map(c => {
                                  let fieldName = '';
                                  if(report.sourceType === 'table') { fieldName = tables.find(t=>t.id===report.sourceId)?.fields.find(f=>f.id===c.fieldId)?.name || ''; } else { fieldName = c.label; }
                                  return `<td class="p-2 whitespace-nowrap">{{ item.${toCamelCase(fieldName)} }}</td>`;
                              }).join('')}
                          </tr>
                      </tbody>
                  </table>
                  <div *ngIf="group.summaries" class="bg-slate-50 p-2 mt-2 border-t-2 border-slate-300 rounded-b-md text-right text-sm">
                      <span *ngFor="let sum of group.summaries | keyvalue" class="ml-4"><strong>{{ sum.key }}:</strong> {{ sum.value }}</span>
                  </div>
              </div>
              <div *ngIf="reportData.length === 0" class="p-6 text-center text-slate-500">Keine Daten.</div>
          </main>
      </div>`;

      const reportTs = `import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ApiService } from '../../services/api.service';

@Component({
  selector: 'app-${kebabName}-report',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './${kebabName}-report.component.html'
})
export class ${pascalName}ReportComponent implements OnInit {
  reportData: any[] = [];
  today = new Date();
  constructor(private api: ApiService) {}
  ngOnInit() { this.api.getAll('${sourceName}', 1, 10000).subscribe((res: any) => { this.processData(res.data || res); }); }
  processData(data: any[]) {
      const groupingProp: string | null = ${groupingProp ? `'${groupingProp}'` : 'null'};
      if (!groupingProp) {
          this.reportData = [{ groupValue: 'Gesamt', items: data, summaries: this.calcSummaries(data) }];
          return;
      }
      const groups: any = {};
      data.forEach(row => { const key = row[groupingProp] || 'Unbekannt'; if (!groups[key]) groups[key] = []; groups[key].push(row); });
      this.reportData = Object.keys(groups).sort().map(key => ({ groupValue: key, items: groups[key], summaries: this.calcSummaries(groups[key]) }));
  }
  calcSummaries(items: any[]) {
      const summaries: any = {};
      ${report.summaries.map(s => {
          const prop = toCamelCase(s.fieldName);
          if (s.calculation === 'COUNT') return `summaries['Anzahl ${s.fieldName}'] = items.length;`;
          if (s.calculation === 'SUM') return `summaries['Summe ${s.fieldName}'] = items.reduce((acc, curr) => acc + (Number(curr.${prop}) || 0), 0);`;
          return '';
      }).join('\n      ')}
      return summaries;
  }
}`;
      files.push({ name: `${kebabName}-report.component.html`, path: `${appRoot}/pages/${folder}/${kebabName}-report.component.html`, content: reportHtml, language: 'html' });
      files.push({ name: `${kebabName}-report.component.ts`, path: `${appRoot}/pages/${folder}/${kebabName}-report.component.ts`, content: reportTs, language: 'typescript' });
      routes.push({ path: `reports/${kebabName}`, component: `${pascalName}ReportComponent`, folder: folder, file: `${kebabName}-report.component` });
  });

  return { files, routes };
};
