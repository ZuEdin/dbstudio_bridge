import { Table, Form, Report, Query, VirtualFile, BackendConfig } from '../../../types/index';
import { toPascalCase, toCamelCase, toKebabCase } from '../common';

export interface ModernRouteInfo {
  path: string;
  component: string;
  folder: string;
  file: string;
}

export const generateAngularModernComponents = (
  tables: Table[],
  forms: Form[],
  reports: Report[],
  queries: Query[],
  config: BackendConfig,
  appRoot: string
): { files: VirtualFile[]; routes: ModernRouteInfo[] } => {
  const files: VirtualFile[] = [];
  const routes: ModernRouteInfo[] = [];

  // 1. Generate Standalone Table Components
  tables.forEach(table => {
    const entityName = toPascalCase(table.name);
    const serviceName = `${entityName}Service`;
    const componentName = `${entityName}ListComponent`;
    const folder = `tables/${toKebabCase(table.name)}`;
    const fileName = `${toKebabCase(table.name)}-list.component.ts`;
    const pkField = table.fields.find(f => f.isPrimaryKey)?.name || 'id';

    const columns = table.fields.slice(0, 7); // Display primary columns

    const componentCode = `import { Component, ChangeDetectionStrategy, signal, computed, inject, OnInit } from '@angular/core';
import { FormsModule, ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { ${serviceName} } from '../../services/${toKebabCase(table.name)}.service';
import { ${entityName} } from '../../models/schema.models';
import * as XLSX from 'xlsx';

@Component({
  selector: 'app-${toKebabCase(table.name)}-list',
  standalone: true,
  imports: [FormsModule, ReactiveFormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: \`
    <div class="p-6 space-y-6">
      <!-- Header Bar -->
      <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
        <div>
          <h1 class="text-xl font-black text-slate-800 tracking-tight">${table.name}</h1>
          <p class="text-xs text-slate-500 mt-0.5">Verwaltung und Echtzeit-Übersicht aller Datensätze</p>
        </div>

        <div class="flex items-center gap-2.5 w-full sm:w-auto">
          <!-- Search Input -->
          <div class="relative flex-1 sm:w-64">
            <input 
              type="text" 
              [ngModel]="searchQuery()" 
              (ngModelChange)="searchQuery.set($event)"
              placeholder="Suche..." 
              class="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            />
          </div>

          <!-- Export Button -->
          <button 
            (click)="exportToExcel()"
            class="p-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-colors"
            title="Excel Export"
          >
            📊 Excel
          </button>

          <!-- New Record Button -->
          <button 
            (click)="openCreateModal()"
            class="bg-blue-600 hover:bg-blue-700 text-white font-bold px-4 py-2 rounded-xl text-xs shadow-md shadow-blue-600/20 transition-all flex items-center gap-1.5"
          >
            <span>+ Neu</span>
          </button>
        </div>
      </div>

      <!-- Main Data Table Card -->
      <div class="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
        @if (service.loading()) {
          <div class="p-12 text-center text-slate-400 space-y-2">
            <div class="inline-block animate-spin text-2xl">⏳</div>
            <p class="text-xs font-semibold">Datensätze werden geladen...</p>
          </div>
        } @else {
          <div class="overflow-x-auto">
            <table class="w-full text-left text-xs">
              <thead class="bg-slate-50/80 border-b border-slate-200/80 text-[11px] font-extrabold uppercase tracking-wider text-slate-500">
                <tr>
                  ${columns.map(c => `<th class="py-3 px-4">${c.name}</th>`).join('\n                  ')}
                  <th class="py-3 px-4 text-right">Aktionen</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-100">
                @for (row of filteredItems(); track row.${pkField}) {
                  <tr class="hover:bg-slate-50/60 transition-colors group">
                    ${columns.map(c => `<td class="py-3 px-4 text-slate-700 font-medium whitespace-nowrap">{{ row.${c.name} ?? '-' }}</td>`).join('\n                    ')}
                    <td class="py-3 px-4 text-right space-x-2 whitespace-nowrap">
                      <button 
                        (click)="openEditModal(row)" 
                        class="text-blue-600 hover:text-blue-800 font-bold text-[11px] hover:underline"
                      >
                        Bearbeiten
                      </button>
                      <button 
                        (click)="deleteItem(row.${pkField})" 
                        class="text-rose-500 hover:text-rose-700 font-bold text-[11px] hover:underline"
                      >
                        Löschen
                      </button>
                    </td>
                  </tr>
                } @empty {
                  <tr>
                    <td colspan="${columns.length + 1}" class="p-8 text-center text-slate-400">
                      <p class="text-sm font-semibold">Keine Datensätze gefunden.</p>
                      <p class="text-xs mt-1">Erstellen Sie den ersten Eintrag mit dem Button oben.</p>
                    </td>
                  </tr>
                }
              </tbody>
            </table>
          </div>

          <!-- Table Footer -->
          <div class="p-4 bg-slate-50/50 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span>Gesamt: <strong>{{ service.count() }}</strong> Einträge</span>
            <span>Gefiltert: <strong>{{ filteredItems().length }}</strong></span>
          </div>
        }
      </div>

      <!-- Create / Edit Modal -->
      @if (isModalOpen()) {
        <div class="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div class="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-lg w-full p-6 space-y-4 animate-in fade-in zoom-in-95">
            <div class="flex justify-between items-center pb-3 border-b border-slate-100">
              <h3 class="font-extrabold text-sm text-slate-800">
                {{ isEditing() ? 'Datensatz bearbeiten' : 'Neuen Datensatz anlegen' }}
              </h3>
              <button (click)="closeModal()" class="text-slate-400 hover:text-slate-600 text-lg leading-none">✕</button>
            </div>

            <form [formGroup]="itemForm" (ngSubmit)="saveItem()" class="space-y-3.5">
              <div class="grid grid-cols-1 gap-3 max-h-[60vh] overflow-y-auto pr-1">
                ${table.fields.filter(f => !f.isPrimaryKey).map(f => {
                  if (f.type === 'ENUM' || (f.enumValues && f.enumValues.length > 0)) {
                    const enumOptions = (f.enumValues && f.enumValues.length > 0) ? f.enumValues : ['Option 1', 'Option 2'];
                    const optHtml = enumOptions.map(o => `<option value="${o.replace(/"/g, '&quot;')}">${o}</option>`).join('');
                    return `
                <!-- ENUM: ${f.name} (Add <option> in template or ALTER TABLE in DB) -->
                <div>
                  <label class="block text-[11px] font-bold text-slate-600 mb-1">${f.name} <span class="text-indigo-500 font-normal">(Auswahl)</span></label>
                  <select 
                    formControlName="${f.name}"
                    class="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
                  >
                    <option value="">-- Bitte wählen (${f.name}) --</option>
                    ${optHtml}
                  </select>
                </div>`;
                  }
                  return `
                <div>
                  <label class="block text-[11px] font-bold text-slate-600 mb-1">${f.name}</label>
                  <input 
                    type="${['INT', 'INTEGER', 'DOUBLE', 'DECIMAL', 'NUMERIC'].includes((f.type || '').toUpperCase()) ? 'number' : 'text'}" 
                    formControlName="${f.name}"
                    class="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
                  />
                </div>`;
                }).join('')}
              </div>

              <div class="pt-3 border-t border-slate-100 flex justify-end gap-2">
                <button 
                  type="button" 
                  (click)="closeModal()"
                  class="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold text-xs rounded-xl"
                >
                  Abbrechen
                </button>
                <button 
                  type="submit" 
                  class="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-md shadow-blue-600/20"
                >
                  Speichern
                </button>
              </div>
            </form>
          </div>
        </div>
      }
    </div>
  \`
})
export class ${componentName} implements OnInit {
  readonly service = inject(${serviceName});
  private readonly fb = inject(FormBuilder);

  // Local Signals
  readonly searchQuery = signal<string>('');
  readonly isModalOpen = signal<boolean>(false);
  readonly isEditing = signal<boolean>(false);
  private currentEditId: any = null;

  // Form
  readonly itemForm = this.fb.group({
    ${table.fields.filter(f => !f.isPrimaryKey).map(f => `${f.name}: [''${f.allowNull === false ? ', Validators.required' : ''}]`).join(',\n    ')}
  });

  // Computed Search Filter with Signals
  readonly filteredItems = computed(() => {
    const q = this.searchQuery().toLowerCase().trim();
    const list = this.service.items();
    if (!q) return list;

    return list.filter(item => {
      return Object.values(item).some(val => 
        val !== null && val !== undefined && String(val).toLowerCase().includes(q)
      );
    });
  });

  ngOnInit() {
    this.service.loadAll().subscribe();
  }

  openCreateModal() {
    this.isEditing.set(false);
    this.currentEditId = null;
    this.itemForm.reset();
    this.isModalOpen.set(true);
  }

  openEditModal(item: ${entityName}) {
    this.isEditing.set(true);
    this.currentEditId = (item as any).${pkField};
    this.itemForm.patchValue(item as any);
    this.isModalOpen.set(true);
  }

  closeModal() {
    this.isModalOpen.set(false);
  }

  saveItem() {
    if (this.itemForm.invalid) return;
    const val = this.itemForm.value;

    if (this.isEditing()) {
      this.service.update(this.currentEditId, val as any).subscribe(() => this.closeModal());
    } else {
      this.service.create(val as any).subscribe(() => this.closeModal());
    }
  }

  deleteItem(id: any) {
    if (confirm('Datensatz wirklich unwiderruflich löschen?')) {
      this.service.delete(id).subscribe();
    }
  }

  exportToExcel() {
    const ws = XLSX.utils.json_to_sheet(this.filteredItems());
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, '${table.name}');
    XLSX.writeFile(wb, '${table.name}_export.xlsx');
  }
}
`;

    files.push({
      name: fileName,
      path: `${appRoot}/pages/${folder}/${fileName}`,
      content: componentCode,
      language: 'typescript'
    });

    routes.push({
      path: toKebabCase(table.name),
      component: componentName,
      folder: folder,
      file: fileName.replace('.ts', '')
    });
  });

  // 2. Generate Reports Components
  reports.forEach(report => {
    const entityName = toPascalCase(report.name);
    const componentName = `${entityName}ReportComponent`;
    const folder = `reports/${toKebabCase(report.name)}`;
    const fileName = `${toKebabCase(report.name)}-report.component.ts`;
    const sourceTable = tables.find(t => t.id === report.sourceId);

    const reportCode = `import { Component, ChangeDetectionStrategy, signal, computed, inject, OnInit } from '@angular/core';
import { ${sourceTable ? toPascalCase(sourceTable.name) + 'Service' : 'BaseApiService'} } from '../../services/${sourceTable ? toKebabCase(sourceTable.name) + '.service' : 'base-api.service'}';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

@Component({
  selector: 'app-${toKebabCase(report.name)}-report',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: \`
    <div class="p-6 space-y-6">
      <div class="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm flex justify-between items-center">
        <div>
          <h1 class="text-xl font-black text-slate-800">${report.name}</h1>
          <p class="text-xs text-slate-500 mt-1">${(report as any).description || 'Automatisch generierter Bericht mit Aggregaten'}</p>
        </div>
        <button 
          (click)="exportPDF()"
          class="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold shadow transition-all"
        >
          📄 PDF Drucken
        </button>
      </div>

      <!-- KPI Summary Cards -->
      <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div class="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
          <span class="text-[10px] font-extrabold uppercase text-slate-400 tracking-wider">Gesamtanzahl</span>
          <div class="text-2xl font-black text-slate-800 mt-1">{{ totalCount() }}</div>
        </div>
      </div>
    </div>
  \`
})
export class ${componentName} implements OnInit {
  ${sourceTable ? `readonly service = inject(${toPascalCase(sourceTable.name)}Service);` : ''}

  readonly totalCount = computed(() => ${sourceTable ? 'this.service.items().length' : '0'});

  ngOnInit() {
    ${sourceTable ? 'this.service.loadAll().subscribe();' : ''}
  }

  exportPDF() {
    const doc = new jsPDF();
    doc.text('${report.name}', 14, 15);
    doc.save('${toKebabCase(report.name)}_report.pdf');
  }
}
`;

    files.push({
      name: fileName,
      path: `${appRoot}/pages/${folder}/${fileName}`,
      content: reportCode,
      language: 'typescript'
    });

    routes.push({
      path: `reports/${toKebabCase(report.name)}`,
      component: componentName,
      folder: folder,
      file: fileName.replace('.ts', '')
    });
  });

  return { files, routes };
};
