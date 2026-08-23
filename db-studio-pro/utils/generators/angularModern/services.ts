import { Table, Query, BackendConfig, VirtualFile } from '../../../types/index';
import { toPascalCase, toCamelCase, toKebabCase } from '../common';

export const generateAngularModernServices = (
  tables: Table[],
  queries: Query[],
  config: BackendConfig,
  appRoot: string
): VirtualFile[] => {
  const files: VirtualFile[] = [];

  // 1. Generate Models (models/schema.models.ts)
  let modelsContent = `// Auto-generated TypeScript Data Models\n\n`;

  tables.forEach(table => {
    const interfaceName = toPascalCase(table.name);
    modelsContent += `export interface ${interfaceName} {\n`;
    table.fields.forEach(field => {
      let tsType = 'string';
      const fType = (field.type || '').toUpperCase();
      if (['INT', 'INTEGER', 'DOUBLE', 'DECIMAL', 'NUMERIC', 'BIGINT', 'FLOAT', 'REAL', 'TINYINT'].includes(fType)) {
        tsType = 'number';
      } else if (['BOOL', 'BOOLEAN', 'BIT'].includes(fType)) {
        tsType = 'boolean';
      } else if (['DATE', 'DATETIME', 'TIMESTAMP'].includes(fType)) {
        tsType = 'string | Date';
      } else if (['JSON', 'JSONB'].includes(fType)) {
        tsType = 'Record<string, any>';
      }
      const isOpt = field.isPrimaryKey ? '?' : (field.allowNull !== false ? '?' : '');
      modelsContent += `  ${field.name}${isOpt}: ${tsType};\n`;
    });
    modelsContent += `}\n\n`;
  });

  queries.forEach(query => {
    const qName = toPascalCase(query.name) + 'Result';
    modelsContent += `export interface ${qName} {\n`;
    const selectQuery = query as any;
    if (selectQuery.columns && selectQuery.columns.length > 0) {
      selectQuery.columns.forEach((col: any) => {
        modelsContent += `  ${col.label || col.alias || col.fieldName}?: any;\n`;
      });
    } else {
      modelsContent += `  [key: string]: any;\n`;
    }
    modelsContent += `}\n\n`;
  });

  files.push({
    name: 'schema.models.ts',
    path: `${appRoot}/models/schema.models.ts`,
    content: modelsContent,
    language: 'typescript'
  });

  // 2. Generate Base API Service (services/base-api.service.ts)
  const baseApiServiceTs = `import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { environment } from '../../environments/environment';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class BaseApiService {
  protected readonly http = inject(HttpClient);
  protected readonly baseUrl = environment.apiUrl;

  protected getUrl(endpoint: string): string {
    const cleanEndpoint = endpoint.startsWith('/') ? endpoint.slice(1) : endpoint;
    const cleanBase = this.baseUrl.endsWith('/') ? this.baseUrl : \`\${this.baseUrl}/\`;
    return \`\${cleanBase}\${cleanEndpoint}\`;
  }
}
`;
  files.push({
    name: 'base-api.service.ts',
    path: `${appRoot}/services/base-api.service.ts`,
    content: baseApiServiceTs,
    language: 'typescript'
  });

  // 3. Generate Reactive Table Services with Angular Signals (services/[table].service.ts)
  tables.forEach(table => {
    const entityName = toPascalCase(table.name);
    const serviceName = `${entityName}Service`;
    const fileName = `${toKebabCase(table.name)}.service.ts`;
    const pkField = table.fields.find(f => f.isPrimaryKey)?.name || 'id';
    const endpoint = toCamelCase(table.name);

    const serviceCode = `import { Injectable, signal, computed, inject } from '@angular/core';
import { BaseApiService } from './base-api.service';
import { ToastService } from '../core/services/toast.service';
import { ${entityName} } from '../models/schema.models';
import { catchError, tap, finalize } from 'rxjs/operators';
import { of } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ${serviceName} extends BaseApiService {
  private readonly toast = inject(ToastService);
  private readonly endpoint = '${endpoint}';

  // Signals State
  private readonly _items = signal<${entityName}[]>([]);
  private readonly _loading = signal<boolean>(false);
  private readonly _error = signal<string | null>(null);
  private readonly _selectedItem = signal<${entityName} | null>(null);

  // Readonly Signals for View Consumers
  readonly items = this._items.asReadonly();
  readonly loading = this._loading.asReadonly();
  readonly error = this._error.asReadonly();
  readonly selectedItem = this._selectedItem.asReadonly();

  // Computed State
  readonly count = computed(() => this._items().length);

  loadAll() {
    this._loading.set(true);
    this._error.set(null);

    return this.http.get<${entityName}[]>(this.getUrl(this.endpoint)).pipe(
      tap({
        next: (data) => {
          this._items.set(data || []);
        },
        error: (err) => {
          const errMsg = err?.message || 'Fehler beim Laden der Datensätze';
          this._error.set(errMsg);
          this.toast.error('Ladefehler', errMsg);
        }
      }),
      finalize(() => this._loading.set(false))
    );
  }

  getById(id: string | number) {
    return this.http.get<${entityName}>(this.getUrl(\`\${this.endpoint}/\${id}\`)).pipe(
      tap({
        next: (item) => this._selectedItem.set(item),
        error: (err) => this.toast.error('Ladefehler', err?.message)
      })
    );
  }

  create(record: Partial<${entityName}>) {
    this._loading.set(true);
    return this.http.post<${entityName}>(this.getUrl(this.endpoint), record).pipe(
      tap({
        next: (created) => {
          this._items.update(list => [created, ...list]);
          this.toast.success('${entityName} erstellt', 'Datensatz erfolgreich hinzugefügt');
        },
        error: (err) => this.toast.error('Erstellfehler', err?.message)
      }),
      finalize(() => this._loading.set(false))
    );
  }

  update(id: string | number, record: Partial<${entityName}>) {
    this._loading.set(true);
    return this.http.put<${entityName}>(this.getUrl(\`\${this.endpoint}/\${id}\`), record).pipe(
      tap({
        next: (updated) => {
          this._items.update(list => list.map(item => ((item as any).${pkField} === id ? { ...item, ...updated } : item)));
          if ((this._selectedItem() as any)?.${pkField} === id) {
            this._selectedItem.set({ ...this._selectedItem()!, ...updated });
          }
          this.toast.success('${entityName} aktualisiert', 'Änderungen gespeichert');
        },
        error: (err) => this.toast.error('Speicherfehler', err?.message)
      }),
      finalize(() => this._loading.set(false))
    );
  }

  delete(id: string | number) {
    this._loading.set(true);
    return this.http.delete(this.getUrl(\`\${this.endpoint}/\${id}\`)).pipe(
      tap({
        next: () => {
          this._items.update(list => list.filter(item => (item as any).${pkField} !== id));
          if ((this._selectedItem() as any)?.${pkField} === id) {
            this._selectedItem.set(null);
          }
          this.toast.info('${entityName} gelöscht', 'Datensatz entfernt');
        },
        error: (err) => this.toast.error('Löschfehler', err?.message)
      }),
      finalize(() => this._loading.set(false))
    );
  }

  select(item: ${entityName} | null) {
    this._selectedItem.set(item);
  }
}
`;

    files.push({
      name: fileName,
      path: `${appRoot}/services/${fileName}`,
      content: serviceCode,
      language: 'typescript'
    });
  });

  // 4. Generate Query Execution Service (services/query-runner.service.ts)
  const queryRunnerTs = `import { Injectable, signal, inject } from '@angular/core';
import { BaseApiService } from './base-api.service';
import { ToastService } from '../core/services/toast.service';
import { finalize, tap } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class QueryRunnerService extends BaseApiService {
  private readonly toast = inject(ToastService);
  private readonly _loading = signal<boolean>(false);
  readonly loading = this._loading.asReadonly();

  executeQuery<T = any>(queryId: string, params: Record<string, any> = {}) {
    this._loading.set(true);
    return this.http.post<T[]>(this.getUrl(\`queries/\${queryId}/execute\`), params).pipe(
      tap({
        error: (err) => this.toast.error('Abfragefehler', err?.message)
      }),
      finalize(() => this._loading.set(false))
    );
  }
}
`;
  files.push({
    name: 'query-runner.service.ts',
    path: `${appRoot}/services/query-runner.service.ts`,
    content: queryRunnerTs,
    language: 'typescript'
  });

  return files;
};
