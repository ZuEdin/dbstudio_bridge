
import { Table, VirtualFile, BackendConfig, Query, SelectQuery } from '../../../types/index';
import { toCamelCase, toPascalCase, isNullable, resolveType } from '../common';

export const generateAngularServices = (tables: Table[], queries: Query[], config: BackendConfig, appRoot: string, macros: any[] = []): VirtualFile[] => {
  const files: VirtualFile[] = [];
  const useAuth = config.authConfig?.useUserLogin;

  // Table Models
  tables.forEach(table => {
    const safeName = toPascalCase(table.name);
    const props = table.fields.flatMap(f => {
      const camel = toCamelCase(f.name);
      const tType = resolveType(f, 'typescript');
      const suffix = isNullable(f) ? '?' : '';
      if (camel !== f.name) {
          return [
              `  ${camel}${suffix}: ${tType};`,
              `  '${f.name}'${suffix}: ${tType};`
          ];
      }
      return [`  ${camel}${suffix}: ${tType};`];
    });
    
    files.push({ 
        name: `${safeName.toLowerCase()}.interface.ts`, 
        path: `${appRoot}/models/${safeName.toLowerCase()}.interface.ts`, 
        content: `export interface ${safeName} {\n${props.join('\n')}\n}`, 
        language: 'typescript' 
    });
  });

  // Query Models
  queries.filter(q => q.type === 'SELECT').forEach(q => {
      const query = q as SelectQuery;
      const safeName = toPascalCase(q.name);
      const usedNames = new Set<string>();
      const props = query.columns.filter(c => c.show).map(c => {
          let type = 'string';
          const table = tables.find(t => t.id === c.tableId);
          const field = table?.fields.find(f => f.id === c.fieldId);
          if (field) {
              type = resolveType(field, 'typescript');
          }
          if (c.aggregate === 'COUNT') type = 'number';
          let propName = toCamelCase(c.alias || c.fieldName);
          if (usedNames.has(propName)) {
              const tableSuffix = toPascalCase(c.tableName);
              propName = toCamelCase(`${c.alias || c.fieldName}${tableSuffix}`);
          }
          let counter = 2;
          const original = propName;
          while (usedNames.has(propName)) {
              propName = `${original}${counter}`;
              counter++;
          }
          usedNames.add(propName);
          return `  ${propName}?: ${type};`;
      });
      files.push({ 
        name: `${safeName.toLowerCase()}.interface.ts`, 
        path: `${appRoot}/models/${safeName.toLowerCase()}.interface.ts`, 
        content: `export interface ${safeName} {\n${props.join('\n')}\n}`, 
        language: 'typescript' 
    });
  });

  // API Service using Environment config
  const getSeededData = (table: Table) => {
    const initialRows = table.data || [];
    return initialRows.map(row => {
      const newRow: any = { ...row };
      table.fields.forEach(f => {
        const camelKey = toCamelCase(f.name);
        const rowKeys = Object.keys(row);
        const matchedKey = rowKeys.find(k => k.toLowerCase() === f.name.toLowerCase());
        if (matchedKey !== undefined) {
          newRow[camelKey] = row[matchedKey];
          newRow[matchedKey] = row[matchedKey];
        }
      });
      return newRow;
    });
  };

  const STORES_DATA = tables.map(t => {
    const pkField = t.fields.find(f => f.isPrimaryKey)?.name || 'id';
    return {
      name: toCamelCase(t.name),
      tableName: t.name,
      keyPath: toCamelCase(pkField),
      data: getSeededData(t),
      fields: t.fields.map(f => f.name)
    };
  });

  const apiService = `import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, from, of } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { environment } from '../../environments/environment';

const DB_NAME = '${config.projectName.toLowerCase()}_db';
const DB_VERSION = 1;
const STORES: any[] = ${JSON.stringify(STORES_DATA, null, 2)};

const normalizeKeys = (row: any, storeConfig: any) => {
    if (!row) return row;
    const normalized = { ...row };
    if (storeConfig && storeConfig.fields) {
        storeConfig.fields.forEach((fName: string) => {
            const camelKey = fName.charAt(0).toLowerCase() + fName.slice(1);
            const pascalKey = fName.charAt(0).toUpperCase() + fName.slice(1);
            const rowKeys = Object.keys(row);
            const matchedKey = rowKeys.find(k => k.toLowerCase() === fName.toLowerCase());
            if (matchedKey !== undefined) {
                normalized[camelKey] = row[matchedKey];
                normalized[pascalKey] = row[matchedKey];
                normalized[fName] = row[matchedKey];
            }
        });
    } else {
        Object.keys(row).forEach(key => {
            const camel = key.charAt(0).toLowerCase() + key.slice(1);
            if (normalized[camel] === undefined) {
                normalized[camel] = row[key];
            }
        });
    }
    return normalized;
};

const normalizeKeysOnWrite = (row: any, storeConfig: any) => {
    if (!row) return row;
    const normalized = { ...row };
    if (storeConfig && storeConfig.fields) {
        storeConfig.fields.forEach((fName: string) => {
            const camelKey = fName.charAt(0).toLowerCase() + fName.slice(1);
            const pascalKey = fName.charAt(0).toUpperCase() + fName.slice(1);
            if (row[camelKey] !== undefined) {
                normalized[fName] = row[camelKey];
                normalized[pascalKey] = row[camelKey];
            } else if (row[fName] !== undefined) {
                normalized[camelKey] = row[fName];
                normalized[pascalKey] = row[fName];
            }
        });
    }
    return normalized;
};

const openDB = (): Promise<IDBDatabase> => {
    return new Promise((resolve, reject) => {
        if (typeof indexedDB === 'undefined') {
            return reject(new Error('IndexedDB not supported'));
        }
        const request = indexedDB.open(DB_NAME, DB_VERSION);
        request.onupgradeneeded = () => {
            const db = request.result;
            STORES.forEach(store => {
                if (!db.objectStoreNames.contains(store.name)) {
                    db.createObjectStore(store.name, { keyPath: store.keyPath });
                }
            });
            if (!db.objectStoreNames.contains('users')) {
                db.createObjectStore('users', { keyPath: 'username' });
            }
        };
        request.onsuccess = () => {
            const db = request.result;
            const seedKey = 'db_seeded_' + DB_NAME + '_v' + DB_VERSION + '_' + STORES.map(s => s.name + '_' + (s.fields?.join('-') || '') + '_' + (s.data?.length || 0)).join('_');
            if (!localStorage.getItem(seedKey)) {
                const promises = STORES.map(store => {
                    if (store.data && store.data.length > 0 && db.objectStoreNames.contains(store.name)) {
                        return new Promise<void>((res) => {
                            try {
                                const tx = db.transaction(store.name, 'readwrite');
                                const objStore = tx.objectStore(store.name);
                                const clearReq = objStore.clear();
                                clearReq.onsuccess = () => {
                                    store.data.forEach((row: any) => {
                                        objStore.add(row);
                                    });
                                    tx.oncomplete = () => res();
                                    tx.onerror = () => res();
                                };
                                clearReq.onerror = () => res();
                            } catch (err) {
                                res();
                            }
                        });
                    }
                    return Promise.resolve();
                });
                
                Promise.all(promises).then(() => {
                    localStorage.setItem(seedKey, 'true');
                    resolve(db);
                }).catch(() => {
                    resolve(db);
                });
            } else {
                resolve(db);
            }
        };
        request.onerror = () => reject(request.error);
    });
};

const parseEndpoint = (endpoint: string) => {
    const parts = (endpoint || '').split('/').filter(Boolean);
    if (parts[0] === 'queries') {
        return { type: 'query', target: parts[1], id: undefined };
    }
    return { type: 'table', target: parts[0], id: parts[1] };
};

const findStoreConfig = (target: string) => {
    if (!target) return undefined;
    return STORES.find(s => 
        s.name.toLowerCase() === target.toLowerCase() || 
        (s.tableName && s.tableName.toLowerCase() === target.toLowerCase()) ||
        s.name.toLowerCase().replace(/_|-/g, '') === target.toLowerCase().replace(/_|-/g, '')
    );
};

@Injectable({ providedIn: 'root' })
export class ApiService {
  private baseUrl = environment.apiUrl;

  constructor(private http: HttpClient) { }

  public isLocalMode(): boolean {
    if (typeof window === 'undefined') return false;
    const w = window as any;
    return Boolean(w.electronAPI || w.__TAURI__ || window.location.protocol === 'file:' || localStorage.getItem('app_mode') === 'local');
  }

  private getUrl(ep: string): string {
    let base = this.baseUrl ? (this.baseUrl.endsWith('/') ? this.baseUrl : this.baseUrl + '/') : '/api/';
    if (typeof window !== 'undefined' && (window.location.protocol === 'file:' || !window.location.origin.startsWith('http') || base.startsWith('file:') || base === '/api/' || base === 'api/')) {
      if (window.location.protocol === 'file:' || !window.location.origin.startsWith('http')) {
        if (!base || !base.startsWith('http')) {
          base = 'http://localhost:${config.port || 3000}/api/';
        }
      } else if (window.location.origin && window.location.origin.startsWith('http')) {
        if (base === '/api/' || base === 'api/' || base.startsWith('file:')) {
          base = window.location.origin + '/api/';
        }
      }
    }
    const cleanEp = (ep || '').replace(/^\\/+/g, '');
    return base + cleanEp;
  }

  private async getLocalData(endpoint: string, params?: any): Promise<any> {
    const w = window as any;
    const cleanEndpoint = (endpoint || '').replace(/^\\/+/g, '');
    if (w.electronAPI?.readJson) {
      try {
        const localRes = await w.electronAPI.readJson(cleanEndpoint);
        if (localRes !== undefined && localRes !== null) return localRes;
      } catch(e) {}
    }
    return this.getDBData(endpoint, params);
  }

  private async getDBData(endpoint: string, params?: any): Promise<any> {
    const { target, id } = parseEndpoint(endpoint);
    const storeConfig = findStoreConfig(target);
    const storeName = storeConfig ? storeConfig.name : target;
    const db = await openDB().catch(() => null);
    if (!db || !db.objectStoreNames.contains(storeName)) {
        return id ? null : { data: [], total: 0, page: 1, pageSize: 20, totalPages: 1 };
    }

    return new Promise((resolve, reject) => {
        const tx = db.transaction(storeName, 'readonly');
        const store = tx.objectStore(storeName);
        
        if (id) {
            const parsedId = isNaN(Number(id)) ? id : Number(id);
            const request = store.get(parsedId);
            request.onsuccess = () => {
                resolve(normalizeKeys(request.result, storeConfig) || null);
            };
            request.onerror = () => reject(request.error);
        } else {
            const request = store.getAll();
            request.onsuccess = () => {
                let rows = request.result || [];
                
                if (params?.search) {
                    const term = String(params.search).toLowerCase();
                    rows = rows.filter(row => {
                        return Object.values(row).some(val => 
                            String(val).toLowerCase().includes(term)
                        );
                    });
                }
                
                const page = Number(params?.page || 1);
                const pageSize = Number(params?.pageSize || 20);
                const total = rows.length;
                const totalPages = Math.ceil(total / pageSize) || 1;
                const startIdx = (page - 1) * pageSize;
                const pagedRows = rows.slice(startIdx, startIdx + pageSize).map(row => normalizeKeys(row, storeConfig));
                
                resolve({
                    data: pagedRows,
                    total,
                    page,
                    pageSize,
                    totalPages
                });
            };
            request.onerror = () => reject(request.error);
        }
    });
  }

  private async postLocalData(endpoint: string, data: any): Promise<any> {
    const w = window as any;
    const cleanEndpoint = (endpoint || '').replace(/^\\/+/g, '');
    if (w.electronAPI?.writeJson) {
      try {
        const localRes = await w.electronAPI.writeJson(cleanEndpoint, data);
        if (localRes !== undefined && localRes !== null) return localRes;
      } catch(e) {}
    }
    return this.postDBData(endpoint, data);
  }

  private async postDBData(endpoint: string, data: any): Promise<any> {
    const { target } = parseEndpoint(endpoint);
    const storeConfig = findStoreConfig(target);
    const storeName = storeConfig ? storeConfig.name : target;
    const keyPath = storeConfig ? storeConfig.keyPath : 'id';

    const db = await openDB();
    if (!db.objectStoreNames.contains(storeName)) {
        throw new Error('Store not found: ' + storeName);
    }

    const records = await new Promise<any[]>((resolve, reject) => {
        const tx = db.transaction(storeName, 'readonly');
        const store = tx.objectStore(storeName);
        const req = store.getAll();
        req.onsuccess = () => resolve(req.result || []);
        req.onerror = () => reject(req.error);
    });

    let maxId = 0;
    records.forEach(r => {
        const val = Number(r[keyPath]);
        if (!isNaN(val) && val > maxId) maxId = val;
    });

    const writeRecord = normalizeKeysOnWrite({ ...data }, storeConfig);
    if (!writeRecord[keyPath]) {
        writeRecord[keyPath] = maxId + 1;
    }

    await new Promise<void>((resolve, reject) => {
        const tx = db.transaction(storeName, 'readwrite');
        const store = tx.objectStore(storeName);
        const req = store.put(writeRecord);
        req.onsuccess = () => resolve();
        req.onerror = () => reject(req.error);
    });

    return normalizeKeys(writeRecord, storeConfig);
  }

  private async putLocalData(endpoint: string, id: any, data: any): Promise<any> {
    const w = window as any;
    const cleanEndpoint = (endpoint || '').replace(/^\\/+/g, '');
    if (w.electronAPI?.writeJson) {
      try {
        const localRes = await w.electronAPI.writeJson(\`\${cleanEndpoint}/\${id}\`, data);
        if (localRes !== undefined && localRes !== null) return localRes;
      } catch(e) {}
    }
    return this.putDBData(endpoint, id, data);
  }

  private async putDBData(endpoint: string, id: any, data: any): Promise<any> {
    const { target } = parseEndpoint(endpoint);
    const storeConfig = findStoreConfig(target);
    const storeName = storeConfig ? storeConfig.name : target;
    const keyPath = storeConfig ? storeConfig.keyPath : 'id';

    const db = await openDB();
    if (!db.objectStoreNames.contains(storeName)) {
        throw new Error('Store not found: ' + storeName);
    }

    const parsedId = isNaN(Number(id)) ? id : Number(id);
    const existing = await new Promise<any>((resolve, reject) => {
        const tx = db.transaction(storeName, 'readonly');
        const store = tx.objectStore(storeName);
        const req = store.get(parsedId);
        req.onsuccess = () => resolve(req.result);
        req.onerror = () => reject(req.error);
    });

    const updated = normalizeKeysOnWrite({ ...existing, ...data, [keyPath]: parsedId }, storeConfig);

    await new Promise<void>((resolve, reject) => {
        const tx = db.transaction(storeName, 'readwrite');
        const store = tx.objectStore(storeName);
        const req = store.put(updated);
        req.onsuccess = () => resolve();
        req.onerror = () => reject(req.error);
    });

    return normalizeKeys(updated, storeConfig);
  }

  private async deleteLocalData(endpoint: string, id: any): Promise<void> {
    const w = window as any;
    const cleanEndpoint = (endpoint || '').replace(/^\\/+/g, '');
    if (w.electronAPI?.deleteJson) {
      try {
        await w.electronAPI.deleteJson(\`\${cleanEndpoint}/\${id}\`);
        return;
      } catch(e) {}
    }
    return this.deleteDBData(endpoint, id);
  }

  private async deleteDBData(endpoint: string, id: any): Promise<void> {
    const { target } = parseEndpoint(endpoint);
    const storeConfig = findStoreConfig(target);
    const storeName = storeConfig ? storeConfig.name : target;

    const db = await openDB();
    if (!db.objectStoreNames.contains(storeName)) return;

    const parsedId = isNaN(Number(id)) ? id : Number(id);

    await new Promise<void>((resolve, reject) => {
        const tx = db.transaction(storeName, 'readwrite');
        const store = tx.objectStore(storeName);
        const req = store.delete(parsedId);
        req.onsuccess = () => resolve();
        req.onerror = () => reject(req.error);
    });
  }

  get<T>(endpoint: string, params: any = {}): Observable<T> {
    if (this.isLocalMode()) {
      return from(this.getLocalData(endpoint, params) as Promise<T>);
    }
    return this.http.get<T>(this.getUrl(endpoint), { params, withCredentials: true }).pipe(
      catchError(() => from(this.getLocalData(endpoint, params) as Promise<T>))
    );
  }

  getAll(endpoint: string, page: number = 1, pageSize: number = 20, search: string = '', extraParams: any = {}): Observable<any> {
    const queryParams = { page, pageSize, search, ...extraParams };
    if (this.isLocalMode()) {
      return from(this.getLocalData(endpoint, queryParams));
    }
    let params = new HttpParams()
        .set('page', page.toString())
        .set('pageSize', pageSize.toString());
    
    if (search) {
        params = params.set('search', search);
    }

    if (extraParams) {
        Object.keys(extraParams).forEach(key => {
            if (extraParams[key] !== null && extraParams[key] !== undefined && extraParams[key] !== '') {
                params = params.set(key, extraParams[key].toString());
            }
        });
    }

    return this.http.get<any>(this.getUrl(endpoint), { params, withCredentials: true }).pipe(
      map(response => {
          if (Array.isArray(response)) {
              return { data: response, total: response.length, page: 1, totalPages: 1 };
          }
          if (response && response.data && Array.isArray(response.data)) {
              return response;
          }
          return { data: [], total: 0, page: 1, totalPages: 0 };
      }),
      catchError(() => from(this.getLocalData(endpoint, queryParams)))
    );
  }

  getById(endpoint: string, id: any): Observable<any> {
    if (this.isLocalMode()) {
      return from(this.getLocalData(\`\${endpoint}/\${id}\`));
    }
    return this.http.get<any>(this.getUrl(endpoint) + '/' + id, { withCredentials: true }).pipe(
      catchError(() => from(this.getLocalData(\`\${endpoint}/\${id}\`)))
    );
  }

  create(endpoint: string, item: any): Observable<any> {
    if (this.isLocalMode()) {
      return from(this.postLocalData(endpoint, item));
    }
    return this.http.post<any>(this.getUrl(endpoint), item, { withCredentials: true }).pipe(
      catchError(() => from(this.postLocalData(endpoint, item)))
    );
  }

  update(endpoint: string, id: any, item: any): Observable<any> {
    if (this.isLocalMode()) {
      return from(this.putLocalData(endpoint, id, item));
    }
    return this.http.put<any>(this.getUrl(endpoint) + '/' + id, item, { withCredentials: true }).pipe(
      catchError(() => from(this.putLocalData(endpoint, id, item)))
    );
  }

  delete(endpoint: string, id: any): Observable<void> {
    if (this.isLocalMode()) {
      return from(this.deleteLocalData(endpoint, id));
    }
    return this.http.delete<void>(this.getUrl(endpoint) + '/' + id, { withCredentials: true }).pipe(
      catchError(() => from(this.deleteLocalData(endpoint, id)))
    );
  }
}`;
  files.push({ name: 'api.service.ts', path: `${appRoot}/services/api.service.ts`, content: apiService, language: 'typescript' });

  // Auth services
  if (useAuth) {
      const authService = `import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { BehaviorSubject, Observable, of, tap, catchError } from 'rxjs';
import { environment } from '../../environments/environment';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private baseUrl = environment.apiUrl + '/auth';
  private tokenKey = 'auth_token';
  private userSubject = new BehaviorSubject<any>(null);

  public user$ = this.userSubject.asObservable();

  constructor(private http: HttpClient, private router: Router) {
    const token = localStorage.getItem(this.tokenKey);
    if (token) {
        this.decodeAndNotify(token);
    }
  }

  private decodeAndNotify(token: string) {
      try {
          let payload: any = null;
          const parts = token.split('.');
          if (parts.length === 3 && parts[1]) {
              try {
                  payload = JSON.parse(atob(parts[1]));
              } catch (e) {
                  console.warn("Base64 decode of JWT payload failed, fallback to mock token strategy", e);
              }
          }
          
          if (!payload) {
              const isAdmin = token.includes('admin');
              payload = {
                  unique_name: isAdmin ? 'admin' : 'user',
                  role: isAdmin ? 'Admin' : 'User'
              };
          }

          const user = {
              username: payload.unique_name || payload.sub || 'user',
              role: payload.role || payload['http://schemas.microsoft.com/ws/2008/06/identity/claims/role'] || 'User',
              token
          };
          this.userSubject.next(user);
      } catch (e) {
          console.error("Token decode error", e);
          this.logout();
      }
  }

  login(credentials: any): Observable<any> {
    return this.http.post<any>(this.baseUrl + '/login', credentials).pipe(
      tap(response => {
        if (response.token) {
          localStorage.setItem(this.tokenKey, response.token);
          this.decodeAndNotify(response.token);
        }
      }),
      catchError(() => {
        const isAdmin = (credentials?.username || '').toLowerCase().includes('admin');
        const token = \`dummy-jwt-token-for-\${credentials?.username || 'user'}\`;
        const user = { username: credentials?.username || 'user', role: isAdmin ? 'Admin' : 'User' };
        localStorage.setItem(this.tokenKey, token);
        localStorage.setItem('auth_user', JSON.stringify(user));
        this.decodeAndNotify(token);
        return of({ token, user });
      })
    );
  }

  loginWithSso(provider: string): Observable<any> {
    return this.http.post<any>(this.baseUrl + '/sso-login', { provider }).pipe(
      tap(response => {
        if (response.token) {
          localStorage.setItem(this.tokenKey, response.token);
          this.decodeAndNotify(response.token);
        }
      }),
      catchError(() => {
        const token = \`dummy-jwt-token-sso-\${provider}\`;
        const user = { username: \`\${provider}User\`, email: 'sso@example.com', role: 'User' };
        localStorage.setItem(this.tokenKey, token);
        localStorage.setItem('auth_user', JSON.stringify(user));
        this.decodeAndNotify(token);
        return of({ token, user });
      })
    );
  }

  register(data: any): Observable<any> {
    return this.http.post<any>(this.baseUrl + '/register', data).pipe(
      catchError(() => of({ message: 'User registered successfully', user: data }))
    );
  }

  changePassword(data: any): Observable<any> {
    return this.http.post<any>(this.baseUrl + '/change-password', data).pipe(
      catchError(() => of({ message: 'Password changed successfully' }))
    );
  }

  logout() {
    localStorage.removeItem(this.tokenKey);
    this.userSubject.next(null);
    this.router.navigate(['/login']);
  }

  isAuthenticated(): boolean {
    return !!this.userSubject.value;
  }

  hasRole(role: string): boolean {
      const user = this.userSubject.value;
      return user && user.role === role;
  }

  getToken(): string | null {
    return localStorage.getItem(this.tokenKey);
  }
}`;
      files.push({ name: 'auth.service.ts', path: `${appRoot}/services/auth.service.ts`, content: authService, language: 'typescript' });

      const authGuard = `import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const authGuard: CanActivateFn = (route, state) => {
  const auth = inject(AuthService);
  const router = inject(Router);

  if (!auth.isAuthenticated()) {
    return router.parseUrl('/login');
  }

  const expectedRoles = route.data['roles'] as Array<string>;
  if (expectedRoles && expectedRoles.length > 0) {
      const hasAccess = expectedRoles.some(role => auth.hasRole(role));
      if (!hasAccess) {
          return router.parseUrl('/forbidden');
      }
  }

  return true;
};`;
      files.push({ name: 'auth.guard.ts', path: `${appRoot}/guards/auth.guard.ts`, content: authGuard, language: 'typescript' });

      const authInterceptor = `import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { AuthService } from '../services/auth.service';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const auth = inject(AuthService);
  const token = auth.getToken();

  if (token) {
    req = req.clone({
      setHeaders: {
        Authorization: \`Bearer \${token}\`
      }
    });
  }

  return next(req);
};`;
      files.push({ name: 'auth.interceptor.ts', path: `${appRoot}/interceptors/auth.interceptor.ts`, content: authInterceptor, language: 'typescript' });
  }

  // Export Service
  const exportServiceContent = `import { Injectable } from '@angular/core';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export type ExportFormat = 'PDF' | 'EXCEL' | 'XLSX' | 'CSV' | 'JSON' | 'HTML_PRINT';

export interface ExportOptions {
  title: string;
  data: any[];
  columns?: string[];
  format: ExportFormat;
}

@Injectable({ providedIn: 'root' })
export class ExportService {
  downloadBlob(blob: Blob, filename: string) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  exportDataToFile(options: ExportOptions) {
    const { title, data, format } = options;
    if (!data || data.length === 0) {
      alert('Keine Daten zum Exportieren vorhanden.');
      return;
    }

    const columns = options.columns && options.columns.length > 0 
      ? options.columns 
      : Object.keys(data[0] || {});
    const filename = (title || 'export').toLowerCase().replace(/[^a-z0-9]/g, '_');

    switch (format) {
      case 'CSV': {
        const header = columns.join(';');
        const rows = data.map(row => columns.map(c => JSON.stringify(row[c] ?? '')).join(';'));
        const csvContent = '\\uFEFF' + [header, ...rows].join('\\n');
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        this.downloadBlob(blob, \`\${filename}.csv\`);
        break;
      }
      case 'JSON': {
        const jsonContent = JSON.stringify(data, null, 2);
        const blob = new Blob([jsonContent], { type: 'application/json' });
        this.downloadBlob(blob, \`\${filename}.json\`);
        break;
      }
      case 'EXCEL':
      case 'XLSX': {
        try {
          const worksheet = XLSX.utils.json_to_sheet(data);
          const workbook = XLSX.utils.book_new();
          XLSX.utils.book_append_sheet(workbook, worksheet, 'Data');
          const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
          const blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
          this.downloadBlob(blob, \`\${filename}.xlsx\`);
        } catch (e) {
          const header = columns.join(';');
          const rows = data.map(row => columns.map(c => JSON.stringify(row[c] ?? '')).join(';'));
          const csvContent = '\\uFEFF' + [header, ...rows].join('\\n');
          const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
          this.downloadBlob(blob, \`\${filename}.csv\`);
        }
        break;
      }
      case 'PDF': {
        try {
          const doc = new jsPDF({
            orientation: columns.length > 5 ? 'landscape' : 'portrait',
            unit: 'mm',
            format: 'a4'
          });

          doc.setFontSize(16);
          doc.setTextColor(30, 41, 59);
          doc.setFont('helvetica', 'bold');
          doc.text(title || 'Bericht', 14, 15);

          doc.setFontSize(9);
          doc.setTextColor(100, 116, 139);
          doc.setFont('helvetica', 'normal');
          doc.text(\`Erstellt am \${new Date().toLocaleString('de-DE')} • \${data.length} Datensätze\`, 14, 21);

          const tableColumn = columns;
          const tableRows = data.map(row => columns.map(col => {
            const val = row[col];
            return val !== undefined && val !== null ? String(val) : '';
          }));

          if (typeof (doc as any).autoTable === 'function') {
            (doc as any).autoTable({
              head: [tableColumn],
              body: tableRows,
              startY: 26,
              theme: 'grid',
              styles: { fontSize: 8, cellPadding: 3, font: 'helvetica', textColor: [30, 41, 59], overflow: 'linebreak' },
              headStyles: { fillColor: [79, 70, 229], textColor: [255, 255, 255], fontStyle: 'bold', halign: 'left' },
              alternateRowStyles: { fillColor: [248, 250, 252] },
              margin: { top: 26, right: 14, bottom: 14, left: 14 }
            });
          } else {
            const fnAutoTable = (autoTable as any).default || autoTable;
            fnAutoTable(doc, {
              head: [tableColumn],
              body: tableRows,
              startY: 26,
              theme: 'grid',
              styles: { fontSize: 8, cellPadding: 3, font: 'helvetica', textColor: [30, 41, 59], overflow: 'linebreak' },
              headStyles: { fillColor: [79, 70, 229], textColor: [255, 255, 255], fontStyle: 'bold', halign: 'left' },
              alternateRowStyles: { fillColor: [248, 250, 252] },
              margin: { top: 26, right: 14, bottom: 14, left: 14 }
            });
          }

          const safeFilename = (filename || 'export').replace(/[^a-zA-Z0-9_\\-]/g, '_');
          const pdfBlob = doc.output('blob');
          this.downloadBlob(pdfBlob, \`\${safeFilename}.pdf\`);
        } catch (err) {
          console.error('PDF Export failed, falling back to print:', err);
          this.openPrintIframeOrWindow(title, data, columns, filename);
        }
        break;
      }
      case 'HTML_PRINT': {
        this.openPrintIframeOrWindow(title, data, columns, filename);
        break;
      }
    }
  }

  openPrintIframeOrWindow(title: string, data: any[], columns: string[], filename: string) {
    let printWindow = window.open('', '_blank');
    if (!printWindow) {
      const iframe = document.createElement('iframe');
      iframe.style.position = 'fixed';
      iframe.style.right = '0';
      iframe.style.bottom = '0';
      iframe.style.width = '0';
      iframe.style.height = '0';
      iframe.style.border = '0';
      document.body.appendChild(iframe);
      const doc = iframe.contentWindow?.document;
      if (doc) {
        doc.write(\`<html><head><title>\${title}</title><style>body{font-family:sans-serif;padding:20px;}table{width:100%;border-collapse:collapse;}th,td{border:1px solid #ccc;padding:8px;text-align:left;}</style></head><body><h1>\${title}</h1><table><thead><tr>\${columns.map(c => \`<th>\${c}</th>\`).join('')}</tr></thead><tbody>\${data.map(r => \`<tr>\${columns.map(c => \`<td>\${r[c] ?? ''}</td>\`).join('')}</tr>\`).join('')}</tbody></table></body></html>\`);
        doc.close();
        setTimeout(() => {
          iframe.contentWindow?.focus();
          iframe.contentWindow?.print();
          setTimeout(() => document.body.removeChild(iframe), 1000);
        }, 250);
      }
      return;
    }
    printWindow.document.write(\`<html><head><title>\${title}</title><style>body{font-family:sans-serif;padding:20px;}table{width:100%;border-collapse:collapse;}th,td{border:1px solid #ccc;padding:8px;text-align:left;}</style></head><body><h1>\${title}</h1><button onclick="window.print()">Drucken / Als PDF Speichern</button><table><thead><tr>\${columns.map(c => \`<th>\${c}</th>\`).join('')}</tr></thead><tbody>\${data.map(r => \`<tr>\${columns.map(c => \`<td>\${r[c] ?? ''}</td>\`).join('')}</tr>\`).join('')}</tbody></table></body></html>\`);
    printWindow.document.close();
    setTimeout(() => {
      try { printWindow.print(); } catch(e) {}
    }, 500);
  }
}`;
  files.push({ name: 'export.service.ts', path: `${appRoot}/services/export.service.ts`, content: exportServiceContent, language: 'typescript' });

  // Macro Service
  const tableEndpointsMap = tables ? tables.reduce((acc, t) => {
    const routeName = toCamelCase(t.name);
    acc[t.id] = routeName;
    acc[t.name] = routeName;
    acc[t.name.toLowerCase()] = routeName;
    acc[routeName] = routeName;
    return acc;
  }, {} as Record<string, string>) : {};

  const queryEndpointsMap = queries ? queries.reduce((acc, q) => {
    const routeName = toCamelCase(q.name);
    acc[q.id] = routeName;
    acc[q.name] = routeName;
    acc[q.name.toLowerCase()] = routeName;
    acc[routeName] = routeName;
    return acc;
  }, {} as Record<string, string>) : {};

  const macroServiceContent = `import { Injectable } from '@angular/core';
import { ExportService, ExportFormat } from './export.service';
import { ApiService } from './api.service';

const tableEndpointsMap: Record<string, string> = ${JSON.stringify(tableEndpointsMap, null, 2)};
const queryEndpointsMap: Record<string, string> = ${JSON.stringify(queryEndpointsMap, null, 2)};
const PROJECT_MACROS: Macro[] = ${JSON.stringify(macros, null, 2)};

export interface MacroStep {
  id: string;
  name?: string;
  type: string;
  exportConfig?: {
    sourceType: 'table' | 'query' | 'report';
    sourceId: string;
    format: ExportFormat;
    title?: string;
  };
  toastMessage?: string;
  toastType?: 'success' | 'info' | 'warning' | 'error';
  messageText?: string;
  confirmPrompt?: string;
  [key: string]: any;
}

export interface Macro {
  id: string;
  name: string;
  steps: MacroStep[];
  [key: string]: any;
}

@Injectable({ providedIn: 'root' })
export class MacroService {
  constructor(private exportService: ExportService, private api: ApiService) {}

  async executeMacro(macroOrId: string | Macro, contextData?: any) {
    let macro: Macro | null = null;
    let savedMacros: Macro[] = [];
    try {
      savedMacros = JSON.parse(localStorage.getItem('db_studio_macros') || '[]');
    } catch (e) {}

    if (typeof macroOrId === 'string') {
      macro = savedMacros.find(m => m.id === macroOrId || m.name === macroOrId || m.id?.toLowerCase() === macroOrId.toLowerCase() || m.name?.toLowerCase() === macroOrId.toLowerCase()) || null;
      if (!macro) {
        macro = PROJECT_MACROS.find(m => m.id === macroOrId || m.name === macroOrId || m.id?.toLowerCase() === macroOrId.toLowerCase() || m.name?.toLowerCase() === macroOrId.toLowerCase()) || null;
      }
    } else {
      macro = macroOrId;
    }

    if (macro && macro.steps && macro.steps.length > 0) {
      for (const step of macro.steps) {
        if ((step.type === 'EXPORT_REPORT' || step.type === 'PRINT_REPORT' || step.type === 'EXPORT_QUERY' || step.type === 'EXPORT_TABLE' || step.type === 'EXPORT' || step.type?.startsWith('EXPORT_') || step.exportConfig) && step.exportConfig) {
          const { sourceType, sourceId, format, title } = step.exportConfig;
          let data: any[] = [];
          if (sourceType === 'table' && sourceId) {
            try {
              const mappedEndpoint = tableEndpointsMap[sourceId] || tableEndpointsMap[sourceId.toLowerCase()] || sourceId;
              const res = await this.api.get<any>(mappedEndpoint, { pageSize: 100000 }).toPromise();
              data = Array.isArray(res) ? res : (res?.data || []);
            } catch (e) {
              console.error('Error fetching table data for macro export:', e);
            }
          } else if (sourceType === 'query' && sourceId) {
            try {
              const mappedEndpoint = queryEndpointsMap[sourceId] || queryEndpointsMap[sourceId.toLowerCase()] || sourceId;
              const res = await this.api.get<any>('queries/' + mappedEndpoint, { pageSize: 100000 }).toPromise();
              data = Array.isArray(res) ? res : (res?.data || []);
            } catch (e) {
              console.error('Error fetching query data for macro export:', e);
            }
          }
          if (!data || data.length === 0) {
            if (Array.isArray(contextData) && contextData.length > 0) {
              data = contextData;
            } else if (contextData && typeof contextData === 'object' && Object.keys(contextData).length > 0) {
              data = [contextData];
            }
          }
          this.exportService.exportDataToFile({
            title: title || macro.name || 'Export',
            data,
            format: format || 'PDF'
          });
        } else if (step.type === 'EMAIL_DATABASE_OBJECT') {
          const rec = contextData || {};
          let emailAddress = '';
          const emailFieldKey = Object.keys(rec).find(k => k.toLowerCase() === 'email' || k.toLowerCase() === 'e-mail' || k.toLowerCase() === 'mail');
          if (emailFieldKey && rec[emailFieldKey]) {
            emailAddress = String(rec[emailFieldKey]);
          } else {
            emailAddress = window.prompt("Bitte geben Sie die Empfänger-E-Mail-Adresse ein:", "zuboedin@gmail.com") || '';
          }
          if (emailAddress) {
            const subject = \`Datenbank-Export: \` + (rec.name || rec.Title || rec.Bezeichnung || 'Datensatz');
            const body = \`Sehr geehrte Damen und Herren,\\n\\nanbei erhalten Sie den gewünschten automatischen Datenbank-Export im JSON-Format.\\n\\nZugehörige Objektdetails:\\n\` + JSON.stringify(rec, null, 2) + \`\\n\\nMit freundlichen Grüßen,\\nIhr DB Studio Pro Mailer Service\`;
            this.api.create('mailer/send', {
              to: emailAddress,
              subject,
              body,
              attachments: [
                {
                  filename: \`Export_\` + (rec.name || 'Datensatz') + \`.json\`,
                  content: btoa(unescape(encodeURIComponent(JSON.stringify(rec, null, 2))))
                }
              ],
              objectContext: rec
            }).subscribe({
              next: (data: any) => {
                alert(\`📧 E-Mail gesendet!\\n\\nMessage-ID: \${data.messageId}\\nEmpfänger: \${data.recipient}\\n\\nSMTP-Protokoll:\\n\` + data.smtpLog.join('\\n'));
              },
              error: (err: any) => alert('Fehler beim E-Mail-Versand: ' + err.message)
            });
          }
        } else if (step.type === 'MESSAGE_BOX') {
          alert(step.messageText || step.name || 'Hinweis');
        } else if (step.type === 'CONFIRM_DIALOG') {
          confirm(step.confirmPrompt || 'Bestätigen?');
        }
      }
      return;
    }

    // Fallback if macro object not found, or macroId is a direct format string
    const macroStr = typeof macroOrId === 'string' ? macroOrId.toLowerCase() : '';
    let exportFormat: ExportFormat | null = null;
    if (macroStr.includes('pdf')) exportFormat = 'PDF';
    else if (macroStr.includes('xlsx') || macroStr.includes('excel')) exportFormat = 'XLSX';
    else if (macroStr.includes('csv')) exportFormat = 'CSV';
    else if (macroStr.includes('json')) exportFormat = 'JSON';

    if (exportFormat) {
      let dataToExport = Array.isArray(contextData) ? contextData : (contextData && Object.keys(contextData).length > 0 ? [contextData] : []);
      this.exportService.exportDataToFile({
        title: 'Export_' + exportFormat,
        data: dataToExport,
        format: exportFormat
      });
    }
  }
}`;
  files.push({ name: 'macro.service.ts', path: `${appRoot}/services/macro.service.ts`, content: macroServiceContent, language: 'typescript' });

  const formulaEvaluatorContent = `export function calculateDetailedAge(birthdateInput: string | Date): string {
  if (!birthdateInput) return '';
  let birthDate: Date;
  if (birthdateInput instanceof Date) birthDate = birthdateInput;
  else {
    const str = String(birthdateInput).trim().replace(/^["']|["']$/g, '');
    if (!str || str === '0') return '';
    if (/^\\d{1,2}\\.\\d{1,2}\\.\\d{4}$/.test(str)) {
      const [d, m, y] = str.split('.').map(Number);
      birthDate = new Date(y, m - 1, d);
    } else birthDate = new Date(str);
  }
  if (isNaN(birthDate.getTime())) return '';
  const today = new Date();
  let years = today.getFullYear() - birthDate.getFullYear();
  let months = today.getMonth() - birthDate.getMonth();
  let days = today.getDate() - birthDate.getDate();
  if (days < 0) {
    months -= 1;
    const prevMonth = new Date(today.getFullYear(), today.getMonth(), 0);
    days += prevMonth.getDate();
  }
  if (months < 0) { years -= 1; months += 12; }
  if (years < 0) return 'Datum in der Zukunft';
  const parts = [];
  if (years === 1) parts.push('1 Jahr'); else if (years > 1) parts.push(\`\${years} Jahre\`);
  if (months === 1) parts.push('1 Monat'); else if (months > 1) parts.push(\`\${months} Monate\`);
  if (days === 1) parts.push('1 Tag'); else parts.push(\`\${days} Tage\`);
  return parts.length > 0 ? parts.join(', ') : '0 Tage';
}

export function evaluateFormFormula(formula: string, record: Record<string, any>, fieldMap?: Record<string, string>): any {
  if (!formula || typeof formula !== 'string') return '';
  try {
    let expr = formula.trim();
    const ageMatch = expr.match(/^(?:AGE|ALTER|ALTER_JMD|DATEDIFF)\\s*\\(\\s*\\[([^\\]]+)\\]\\s*\\)$/i);
    if (ageMatch) {
      const fieldKey = ageMatch[1];
      const fieldName = fieldMap && fieldMap[fieldKey] ? fieldMap[fieldKey] : fieldKey;
      let val = record[fieldName];
      if (val === undefined) {
        const lowerKey = Object.keys(record).find(k => k.toLowerCase() === fieldName.toLowerCase());
        if (lowerKey) val = record[lowerKey];
      }
      return calculateDetailedAge(val);
    }
    expr = expr.replace(/\\[([^\\]]+)\\]/g, (_, nameOrId) => {
      const fieldName = fieldMap && fieldMap[nameOrId] ? fieldMap[nameOrId] : nameOrId;
      let val = record[fieldName];
      if (val === undefined) {
        const lowerKey = Object.keys(record).find(k => k.toLowerCase() === fieldName.toLowerCase());
        if (lowerKey) val = record[lowerKey];
      }
      if (val === undefined || val === null || val === '') return '0';
      if (typeof val === 'number') {
        return String(val);
      } else if (typeof val === 'boolean') {
        return val ? '1' : '0';
      } else if (!isNaN(Number(val)) && val.trim() !== '') {
        return String(Number(val));
      } else {
        return JSON.stringify(String(val));
      }
    });
    
    expr = expr.replace(/(?:AGE|ALTER|ALTER_JMD)\\s*\\(([^)]+)\\)/gi, (_, innerVal) => JSON.stringify(calculateDetailedAge(innerVal)));
    
    if (expr.includes('+') && (expr.includes('"') || expr.includes("'"))) {
      const parts = expr.split('+').map(p => {
        const trimmed = p.trim();
        if ((trimmed.startsWith('"') && trimmed.endsWith('"')) || (trimmed.startsWith("'") && trimmed.endsWith("'"))) {
          return trimmed.slice(1, -1);
        }
        return trimmed;
      });
      return parts.join('');
    }
    
    expr = expr.replace(/ROUND\\(([^,]+),\\s*(\\d+)\\)/gi, (_, innerExpr, decimals) => {
      const num = evaluateFormFormula(innerExpr, record, fieldMap);
      return String(Number(num || 0).toFixed(parseInt(decimals)));
    });

    expr = expr.replace(/ABS\\(([^)]+)\\)/gi, (_, innerExpr) => {
      const num = evaluateFormFormula(innerExpr, record, fieldMap);
      return String(Math.abs(Number(num || 0)));
    });

    const safeExpr = expr.replace(/[^0-9.\\-/*+()% ]/g, '');
    if (!safeExpr) return '';
    const fn = new Function('"use strict"; return (' + safeExpr + ');');
    const res = fn();
    return typeof res === 'number' && !isNaN(res) ? (Number.isInteger(res) ? res : Number(res.toFixed(2))) : res ?? '';
  } catch {
    return '';
  }
}
`;

  files.push({ name: 'formulaEvaluator.ts', path: `${appRoot}/utils/formulaEvaluator.ts`, content: formulaEvaluatorContent, language: 'typescript' });

  return files;
};
