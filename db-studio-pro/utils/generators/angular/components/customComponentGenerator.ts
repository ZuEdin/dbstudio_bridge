import { Table, Form, VirtualFile, Query } from '../../../../types/index';
import { toCamelCase, toKebabCase, toPascalCase } from '../../common';
import { NodeGeneratorContext, RouteInfo } from './custom/types';
import { generateNode } from './custom/nodeRouter';

export const generateCustomPageComponents = (
  pages: any[],
  tables: Table[],
  queries: Query[],
  forms: Form[],
  appRoot: string,
  isBootstrap: boolean = false,
  customComponents: any[] = []
): { files: VirtualFile[]; routes: RouteInfo[] } => {
  const files: VirtualFile[] = [];
  const routes: RouteInfo[] = [];

  pages.forEach(page => {
      const pascalName = toPascalCase(page.name);
      const kebabName = toKebabCase(page.name);
      const folder = 'custom';
      const compName = `${pascalName}CustomComponent`;

      const allTablesStr = JSON.stringify(tables.map(t => ({ name: t.name, camelName: toCamelCase(t.name), fields: t.fields.map(f => ({ id: f.id, name: f.name, camelName: toCamelCase(f.name), type: f.type })) })));

      const states: string[] = [
          'queryParams: any = {};',
          'userPickerOpen: boolean = false;',
          "userPickerMode: 'me' | 'search' = 'me';",
          "userPickerTargetField: string = '';",
          'editingSubformId: any = null;',
          'tempSubData: any = {};',
          'modals: any = {};',
          'tabs: any = {};',
          'dropdowns: any = {};',
          `private allTables: any[] = ${allTablesStr};`,
          `get isNew(): boolean { const editId = this.queryParams['selectedId'] || this.queryParams['id']; return !editId || editId === 'new'; }`
      ];
      const initCalls: string[] = ['this.route.queryParams.subscribe(params => { this.queryParams = params; });'];
      const methods: string[] = [
          `openUserPicker(mode: 'me' | 'search', field: string) {
      this.userPickerMode = mode;
      this.userPickerTargetField = field;
      this.userPickerOpen = true;
  }`,
          `handleUserPicked(event: {username: string, displayName: string}) {
      if (this.userPickerTargetField) {
          const parts = this.userPickerTargetField.split('.');
          if (parts.length > 1) {
              let currentObj = (this as any);
              for (let i = 0; i < parts.length - 1; i++) {
                  if (currentObj[parts[i]]) {
                      currentObj = currentObj[parts[i]];
                  }
              }
              currentObj[parts[parts.length - 1]] = event.username;
          } else {
              const field = this.userPickerTargetField;
              let found = false;
              for (const prop of Object.keys(this)) {
                  if (prop.startsWith('formData_') && (this as any)[prop]) {
                      (this as any)[prop][field] = event.username;
                      found = true;
                  }
              }
              if (!found) {
                  (this as any)[field] = event.username;
              }
          }
      }
      this.userPickerOpen = false;
  }`,
          `openModal(modalId: string) {
      this.modals[modalId] = true;
  }`,
          `closeModal(modalId: string) {
      this.modals[modalId] = false;
  }`,
          `openAddSubformModal(modalId: string) {
      this.editingSubformId = null;
      this.tempSubData = {};
      this.openModal(modalId);
  }`,
          `editSubformItem(table: string, childFieldId: string, modalId: string, item: any) {
      this.editingSubformId = item.id || item.Id;
      this.tempSubData = { ...item };
      this.openModal(modalId);
  }`,
          `deleteSubformItem(table: string, childFieldId: string, modalId: string, item: any, masterFieldId?: string) {
      if(!confirm('Möchten Sie diesen Eintrag wirklich löschen?')) return;
      const itemId = item.id || item.Id || item.ID;
      this.api.delete(table, itemId).subscribe(() => {
          const parentId = this.queryParams['selectedId'] || this.queryParams['id'];
          this.refreshSubformList(table, childFieldId, modalId, parentId, masterFieldId);
      });
  }`,
          `saveSubform(table: string, childFieldId: string, modalId: string, masterFieldId?: string) {
      const parentId = this.queryParams['selectedId'] || this.queryParams['id'];
      if(!parentId || parentId === 'new') { 
          alert('Bitte erst Hauptdatensatz speichern, bevor Sie Details hinzufügen.'); 
          return; 
      }
      
      const targetTable = this.allTables?.find((t: any) => t.camelName === table || t.name === table);
      const childFieldObj = targetTable?.fields?.find((f: any) => f.id === childFieldId || f.name === childFieldId || f.camelName === childFieldId);
      const childProp = childFieldObj ? childFieldObj.camelName : (childFieldId ? childFieldId.charAt(0).toLowerCase() + childFieldId.slice(1) : 'id');
      
      let masterVal: any = parentId;
      if (masterFieldId) {
          for (const prop of Object.keys(this)) {
              if (prop.startsWith('formData_') && (this as any)[prop]) {
                  const dataObj = (this as any)[prop];
                  const mVal = dataObj[masterFieldId] ?? dataObj[toCamelCase(masterFieldId)];
                  if (mVal !== undefined && mVal !== null && mVal !== '') {
                      masterVal = mVal;
                      break;
                  }
              }
          }
      }

      let parsedVal: any = masterVal;
      if (childFieldObj && (childFieldObj.type === 'INTEGER' || childFieldObj.type === 'DECIMAL' || childFieldObj.type === 'DOUBLE')) {
          const num = Number(masterVal);
          if (!isNaN(num)) parsedVal = num;
      }
      this.tempSubData[childProp] = parsedVal;
      if (childFieldObj && childFieldObj.name) {
          this.tempSubData[childFieldObj.name] = parsedVal;
      }
      
      if (this.editingSubformId) {
          this.api.update(table, this.editingSubformId, this.tempSubData).subscribe(() => {
              this.editingSubformId = null;
              this.closeModal(modalId);
              this.refreshSubformList(table, childFieldId, modalId, parentId, masterFieldId);
          });
      } else {
          this.api.create(table, this.tempSubData).subscribe(() => {
              this.closeModal(modalId);
              this.refreshSubformList(table, childFieldId, modalId, parentId, masterFieldId);
          });
      }
  }`,
          `refreshSubformList(table: string, childFieldId: string, modalId: string, parentId: any, masterFieldId?: string) {
      this.api.getAll(table, 1, 10000).subscribe((res: any) => {
          const listKeyPrefix = table + 'SubList_';
          const modalHash = modalId.replace('sub_','').substring(0,8);
          const targetKey = Object.keys(this).find(k => k.startsWith(listKeyPrefix) && k.includes(modalHash));
          if(targetKey) {
              const targetTable = this.allTables?.find((t: any) => t.camelName === table || t.name === table);
              const childFieldObj = targetTable?.fields?.find((f: any) => f.id === childFieldId || f.name === childFieldId || f.camelName === childFieldId);
              const childProp = childFieldObj ? childFieldObj.camelName : (childFieldId ? childFieldId.charAt(0).toLowerCase() + childFieldId.slice(1) : 'id');
              const originalName = childFieldObj ? childFieldObj.name : childProp;

              let masterVal: any = parentId;
              if (masterFieldId) {
                  for (const prop of Object.keys(this)) {
                      if (prop.startsWith('formData_') && (this as any)[prop]) {
                          const dataObj = (this as any)[prop];
                          const mVal = dataObj[masterFieldId] ?? dataObj[toCamelCase(masterFieldId)];
                          if (mVal !== undefined && mVal !== null && mVal !== '') {
                              masterVal = mVal;
                              break;
                          }
                      }
                  }
              }

              const allItems = res.data || res || [];
              (this as any)[targetKey] = allItems.filter((x: any) => {
                const cVal = x?.[childProp] ?? x?.[originalName] ?? x?.[childFieldId];
                return cVal !== undefined && cVal !== null && String(cVal) === String(masterVal);
              });
          }
      });
  }`
      ];

      const context: NodeGeneratorContext = {
          isBootstrap,
          tables,
          queries,
          forms,
          customComponents,
          states,
          initCalls,
          methods,
          pages,
          nodeNameCache: new Map<string, string>(),
          usedSuffixes: new Set<string>()
      };

      const nodesHtml = generateNode(page.layout, context, pages);

      let customHtml = '';
      if (isBootstrap) {
          customHtml = `
          <div class="container py-4">
              <div class="mb-4">
                  <h1 class="h2 text-dark">${page.name}</h1>
              </div>
              <div class="card shadow-sm border p-4">
                  ${nodesHtml}
              </div>
          </div>`;
      } else {
          customHtml = `
          <div class="p-8">
              <div class="mb-6 flex justify-between items-center">
                  <h1 class="text-3xl font-bold text-slate-800">${page.name}</h1>
              </div>
              <div class="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                  ${nodesHtml}
              </div>
          </div>`;
      }

      customHtml += `
      <app-user-picker 
          [isOpen]="userPickerOpen" 
          [initialTab]="userPickerMode"
          (userSelected)="handleUserPicked($event)"
          (closed)="userPickerOpen = false"
      ></app-user-picker>
      `;

      
      const checkHasCalendar = (node: any): boolean => {
          if (!node) return false;
          if (node.type === 'calendar_view') return true;
          if (node.type === 'custom_component' && node.props?.customComponentId) {
              const comp = (customComponents || []).find(c => c.id === node.props.customComponentId);
              if (comp && comp.type === 'calendar_view') {
                  return true;
              }
          }
          if (node.children && Array.isArray(node.children)) {
              return node.children.some(checkHasCalendar);
          }
          return false;
      };
      const hasCalendar = checkHasCalendar(page.layout) || JSON.stringify(page.layout).includes('calendar_view');
      const calendarImports = hasCalendar ? 
        "import { FullCalendarModule } from '@fullcalendar/angular';\n" +
        "import { CalendarOptions } from '@fullcalendar/core';\n" +
        "import dayGridPlugin from '@fullcalendar/daygrid';\n" +
        "import timeGridPlugin from '@fullcalendar/timegrid';\n" +
        "import interactionPlugin from '@fullcalendar/interaction';\n" +
        "import listPlugin from '@fullcalendar/list';" : '';
      const moduleImports = hasCalendar ? ', FullCalendarModule' : '';

      const customTs = `
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute, RouterModule } from '@angular/router';
import { ApiService } from '../../services/api.service';
import { MacroService } from '../../services/macro.service';
import { UserPickerComponent } from '../../components/user-picker/user-picker.component';
${calendarImports}

@Component({
  selector: 'app-${kebabName}-custom',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, UserPickerComponent${moduleImports}],
  templateUrl: './${kebabName}-custom.component.html'
})
export class ${pascalName}CustomComponent implements OnInit {
  ${states.join('\n  ')}

  constructor(private api: ApiService, private router: Router, private route: ActivatedRoute, private macroService: MacroService) {}

  ngOnInit() {
    ${initCalls.join('\n    ')}
  }

  executeMacro(macroId: string, contextData?: any) {
    this.macroService.executeMacro(macroId, contextData);
  }

  ${methods.join('\n\n  ')}
}`;


      files.push({ name: `${kebabName}-custom.component.html`, path: `${appRoot}/pages/${folder}/${kebabName}-custom.component.html`, content: customHtml, language: 'html' });
      files.push({ name: `${kebabName}-custom.component.ts`, path: `${appRoot}/pages/${folder}/${kebabName}-custom.component.ts`, content: customTs, language: 'typescript' });
      routes.push({ path: `custom/${kebabName}`, component: compName, folder: folder, file: `${kebabName}-custom.component` });
  });

  return { files, routes };
};
