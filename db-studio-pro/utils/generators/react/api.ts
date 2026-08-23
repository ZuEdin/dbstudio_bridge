
import { Table, VirtualFile, BackendConfig, Query, SelectQuery, Report } from '../../../types/index';
import { toCamelCase, toPascalCase, isNullable, resolveType } from '../common';

const mapPermissionObjectId = (row: any, tables: Table[], queries: Query[], isSql: boolean): any => {
    if (!row || typeof row !== 'object') return row;
    const newRow = { ...row };
    const key = Object.keys(newRow).find(k => k.toLowerCase() === 'objectid');
    if (!key) return row;

    const objectId = newRow[key];
    const objectTypeKey = Object.keys(newRow).find(k => k.toLowerCase() === 'objecttype');
    const objectType = objectTypeKey ? String(newRow[objectTypeKey]).toLowerCase() : '';

    if (objectType === 'table') {
        const matchedTable = tables.find(t => t.id === objectId);
        if (matchedTable) {
            newRow[key] = isSql ? toPascalCase(matchedTable.name) : matchedTable.name;
        }
    } else if (objectType === 'query') {
        const matchedQuery = queries.find(q => q.id === objectId);
        if (matchedQuery) {
            newRow[key] = isSql ? toPascalCase(matchedQuery.name) : matchedQuery.name;
        }
    } else if (objectType === 'field') {
        let matchedFieldName = '';
        for (const t of tables) {
            const f = t.fields.find(field => field.id === objectId);
            if (f) {
                matchedFieldName = f.name;
                break;
            }
        }
        if (matchedFieldName) {
            newRow[key] = matchedFieldName;
        }
    }
    return newRow;
};

export const generateReactApi = (tables: Table[], queries: Query[], config: BackendConfig, root: string, reports: Report[] = [], macros: any[] = []): VirtualFile[] => {
  const files: VirtualFile[] = [];
  const useAuth = config.authConfig?.useUserLogin;

  const getSeededData = (table: Table) => {
    const initialRows = table.data || [];
    const isPermissionsTable = table.name.toLowerCase() === 'sys_permissions';
    return initialRows.map(row => {
      const mappedRow = isPermissionsTable ? mapPermissionObjectId(row, tables, queries || [], false) : row;
      const newRow: any = { ...mappedRow };
      table.fields.forEach(f => {
        const camelKey = toCamelCase(f.name);
        const rowKeys = Object.keys(mappedRow);
        const matchedKey = rowKeys.find(k => k.toLowerCase() === f.name.toLowerCase());
        if (matchedKey !== undefined) {
          newRow[camelKey] = mappedRow[matchedKey];
          newRow[matchedKey] = mappedRow[matchedKey];
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
  
  const apiService = `import axios from 'axios';
const getApiUrl = () => {
    let raw = (import.meta as any).env?.VITE_API_URL || '';
    if (raw) {
        let u = raw.trim();
        if (!u.endsWith('/')) u += '/';
        if (!u.includes('/api/')) u = u.replace(/\\/+$/, '') + '/api/';
        return u;
    }
    return typeof window !== 'undefined' && window.location.protocol.startsWith('http')
        ? (window.location.origin.includes('localhost') || window.location.origin.includes('127.0.0.1') ? 'http://localhost:${config.port}/api/' : window.location.origin + '/api/')
        : 'http://localhost:${config.port}/api/';
};
export const isLocalMode = (): boolean => {
    if (typeof window === 'undefined') return false;
    const w = window as any;
    if (w.electronAPI || w.__TAURI__ || window.location.protocol === 'file:') return true;
    if (localStorage.getItem('app_mode') === 'local') return true;
    return false;
};
const API_URL = getApiUrl();

// withCredentials: true is required for Windows Auth (Negotiate) to work cross-origin
export const api = axios.create({ 
    baseURL: API_URL,
    withCredentials: true 
});

const DB_NAME = '${config.projectName.toLowerCase()}_db';
const DB_VERSION = 1;

const STORES = ${JSON.stringify(STORES_DATA, null, 2)};

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

export interface PagedResponse<T> {
    data: T[];
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;
}

const openDB = (): Promise<IDBDatabase> => {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open(DB_NAME, DB_VERSION);
        request.onupgradeneeded = (e) => {
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
const generateSimulatedJwt = (payload: any) => {
    try {
        const jsonStr = JSON.stringify(payload);
        const encodedPayload = btoa(encodeURIComponent(jsonStr).replace(/%([0-9A-F]{2})/g, (match, p1) => {
            return String.fromCharCode(parseInt(p1, 16));
        }));
        const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
        const signature = 'simulated-signature';
        return \`\${header}.\${encodedPayload}.\${signature}\`;
    } catch (e) {
        return 'mock.jwt.token';
    }
};

const getUserStoreName = (db: IDBDatabase): string => {
    const names = Array.from(db.objectStoreNames);
    const found = names.find(n => {
        const ln = n.toLowerCase().replace(/_|-/g, '');
        return ln === 'sysusers' || ln === 'users';
    });
    return found || 'users';
};

const parseEndpoint = (endpoint: string) => {
    const parts = endpoint.split('/').filter(Boolean);
    if (parts[0] === 'queries') {
        return { type: 'query', target: parts[1], id: undefined };
    }
    return { type: 'table', target: parts[0], id: parts[1] };
};

const findStoreConfig = (target: string) => {
    return STORES.find(s => 
        s.name.toLowerCase() === target.toLowerCase() || 
        (s.tableName && s.tableName.toLowerCase() === target.toLowerCase()) ||
        s.name.toLowerCase().replace(/_|-/g, '') === target.toLowerCase().replace(/_|-/g, '')
    );
};

export const get = async <T>(endpoint: string, params?: any): Promise<PagedResponse<T> | any> => {
    if (endpoint.startsWith('auth/')) {
        if (endpoint === 'auth/me') {
            const token = localStorage.getItem('auth_token');
            const savedUser = localStorage.getItem('auth_user');
            if (token && savedUser) {
                return { user: JSON.parse(savedUser) };
            }
            return null;
        }
        return null;
    }

    const cleanEndpoint = (endpoint || '').replace(/^\\/+/g, '');
    const cleanParams: any = {};
    if (params) {
        Object.keys(params).forEach(k => {
            const val = params[k];
            if (val !== undefined && val !== null && val !== '') {
                cleanParams[k] = val;
            }
        });
    }

    if (!isLocalMode()) {
        try {
            const token = localStorage.getItem('auth_token');
            const headers: any = {};
            if (token) {
                headers['Authorization'] = 'Bearer ' + token;
            }
            const response = await api.get(cleanEndpoint, { params: cleanParams, headers });
            if (response && response.data !== undefined && response.data !== null) {
                return response.data;
            }
        } catch (apiErr) {
            // Fallback to IndexedDB simulation if server API request fails or is offline
        }
    } else {
        const w = window as any;
        if (w.electronAPI?.readJson) {
            try {
                const localRes = await w.electronAPI.readJson(cleanEndpoint);
                if (localRes !== undefined && localRes !== null) return localRes;
            } catch(e) {}
        }
    }

    const { type, target, id } = parseEndpoint(endpoint);
    
    if (type === 'query') {
        const storeConfig = findStoreConfig(target);
        if (storeConfig) {
            const db = await openDB();
            if (db.objectStoreNames.contains(storeConfig.name)) {
                return new Promise((resolve, reject) => {
                    const tx = db.transaction(storeConfig.name, 'readonly');
                    const store = tx.objectStore(storeConfig.name);
                    const request = store.getAll();
                    request.onsuccess = () => {
                        let rows = request.result || [];
                        if (params?.search) {
                            const term = String(params.search).toLowerCase();
                            rows = rows.filter(row => Object.values(row).some(val => String(val).toLowerCase().includes(term)));
                        }
                        const page = Number(params?.page || 1);
                        const pageSize = Number(params?.pageSize || 20);
                        const total = rows.length;
                        const totalPages = Math.ceil(total / pageSize) || 1;
                        const startIdx = (page - 1) * pageSize;
                        const pagedRows = rows.slice(startIdx, startIdx + pageSize).map(row => normalizeKeys(row, storeConfig));
                        resolve({ data: pagedRows, total, page, pageSize, totalPages });
                    };
                    request.onerror = () => reject(request.error);
                });
            }
        }
        return { data: [], total: 0, page: 1, pageSize: 20, totalPages: 1 };
    }

    const storeConfig = findStoreConfig(target);
    const storeName = storeConfig ? storeConfig.name : target;

    const db = await openDB();
    if (!db.objectStoreNames.contains(storeName)) {
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
                const totalPages = Math.ceil(total / pageSize);
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
};

export const post = async <T>(endpoint: string, data: any): Promise<T> => {
    const cleanEndpoint = (endpoint || '').replace(/^\\/+/g, '');
    if (endpoint.startsWith('auth/')) {
        if (!isLocalMode()) {
            try {
                const response = await api.post(cleanEndpoint, data);
                if (response && response.data) {
                    if (response.data.token) {
                        localStorage.setItem('auth_token', response.data.token);
                        if (response.data.user) localStorage.setItem('auth_user', JSON.stringify(response.data.user));
                    }
                    return response.data;
                }
            } catch (err) {
                // fallback
            }
        }
        if (endpoint === 'auth/login') {
            return loginUser(data) as any;
        }
        if (endpoint === 'auth/register') {
            return registerUser(data) as any;
        }
        if (endpoint === 'auth/login-sso') {
            const token = generateSimulatedJwt({ unique_name: data.provider || 'sso', role: 'User' });
            const user = { username: (data.provider || 'sso') + 'User', email: 'sso@example.com', role: 'User' };
            localStorage.setItem('auth_token', token);
            localStorage.setItem('auth_user', JSON.stringify(user));
            return { token, user } as any;
        }
        throw new Error('Unsupported auth endpoint: ' + endpoint);
    }

    if (!isLocalMode()) {
        try {
            const token = localStorage.getItem('auth_token');
            const headers: any = {};
            if (token) headers['Authorization'] = 'Bearer ' + token;
            const response = await api.post(cleanEndpoint, data, { headers });
            if (response && response.data !== undefined) {
                return response.data;
            }
        } catch (apiErr) {
            // Fallback to IndexedDB simulation
        }
    }

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

    const payload = normalizeKeysOnWrite({ ...data }, storeConfig);
    
    if (payload[keyPath] === undefined || payload[keyPath] === null || payload[keyPath] === '') {
        const numericKeys = records.map(r => Number(r[keyPath])).filter(n => !isNaN(n));
        if (numericKeys.length > 0) {
            payload[keyPath] = Math.max(...numericKeys) + 1;
        } else {
            payload[keyPath] = Date.now();
        }
    }

    return new Promise((resolve, reject) => {
        const tx = db.transaction(storeName, 'readwrite');
        const store = tx.objectStore(storeName);
        const request = store.add(payload);
        request.onsuccess = () => resolve(normalizeKeys(payload, storeConfig) as T);
        request.onerror = () => reject(request.error);
    });
};

export const put = async <T>(endpoint: string, dataOrId?: any, dataPayload?: any): Promise<T> => {
    let endpointPath = endpoint || '';
    let payloadData = dataOrId;
    if (dataPayload !== undefined) {
        endpointPath = endpointPath + '/' + dataOrId;
        payloadData = dataPayload;
    }
    const cleanEndpoint = endpointPath.replace(/^\\/+/g, '');
    if (!isLocalMode()) {
        try {
            const token = localStorage.getItem('auth_token');
            const headers: any = {};
            if (token) headers['Authorization'] = 'Bearer ' + token;
            const response = await api.put(cleanEndpoint, payloadData, { headers });
            if (response && response.data !== undefined) {
                return response.data;
            }
        } catch (apiErr) {
            // Fallback to IndexedDB simulation
        }
    }

    const { target, id } = parseEndpoint(cleanEndpoint);
    const storeConfig = findStoreConfig(target);
    const storeName = storeConfig ? storeConfig.name : target;
    const keyPath = storeConfig ? storeConfig.keyPath : 'id';

    const db = await openDB();
    if (!db.objectStoreNames.contains(storeName)) {
        throw new Error('Store not found: ' + storeName);
    }

    const payload = normalizeKeysOnWrite({ ...payloadData }, storeConfig);
    if (id) {
        payload[keyPath] = isNaN(Number(id)) ? id : Number(id);
    }

    return new Promise((resolve, reject) => {
        const tx = db.transaction(storeName, 'readwrite');
        const store = tx.objectStore(storeName);
        const request = store.put(payload);
        request.onsuccess = () => resolve(normalizeKeys(payload, storeConfig) as T);
        request.onerror = () => reject(request.error);
    });
};

export const remove = async (endpoint: string, itemId?: any): Promise<any> => {
    let endpointPath = endpoint || '';
    if (itemId !== undefined && itemId !== null) {
        endpointPath = endpointPath + '/' + itemId;
    }
    const cleanEndpoint = endpointPath.replace(/^\\/+/g, '');
    if (!isLocalMode()) {
        try {
            const token = localStorage.getItem('auth_token');
            const headers: any = {};
            if (token) headers['Authorization'] = 'Bearer ' + token;
            const response = await api.delete(cleanEndpoint, { headers });
            if (response && response.data !== undefined) {
                return response.data;
            }
        } catch (apiErr) {
            // Fallback to IndexedDB simulation
        }
    }

    const { target, id } = parseEndpoint(cleanEndpoint);
    const storeConfig = findStoreConfig(target);
    const storeName = storeConfig ? storeConfig.name : target;

    if (!id) throw new Error('Delete requires an ID');

    const db = await openDB();
    if (!db.objectStoreNames.contains(storeName)) {
        throw new Error('Store not found: ' + storeName);
    }

    return new Promise((resolve, reject) => {
        const tx = db.transaction(storeName, 'readwrite');
        const store = tx.objectStore(storeName);
        const parsedId = isNaN(Number(id)) ? id : Number(id);
        const request = store.delete(parsedId);
        request.onsuccess = () => resolve({ success: true });
        request.onerror = () => reject(request.error);
    });
};

export const del = remove;

// Local Auth API using IndexedDB
export const loginUser = async (credentials: any) => {
    const db = await openDB();
    const storeName = getUserStoreName(db);
    return new Promise((resolve, reject) => {
        const tx = db.transaction(storeName, 'readonly');
        const store = tx.objectStore(storeName);
        const request = store.getAll();
        request.onsuccess = () => {
            const users = request.result || [];
            const user = users.find((u: any) => {
                const uName = (u.Username || u.username || '').toLowerCase();
                return uName === credentials.username.toLowerCase();
            });

            const passwordMatches = user && (
                user.PasswordHash === credentials.password ||
                user.passwordHash === credentials.password ||
                user.Password === credentials.password ||
                user.password === credentials.password
            );

            if (user && passwordMatches) {
                const uName = user.Username || user.username || credentials.username;
                const uEmail = user.Email || user.email || (uName + '@demo.com');
                const roleId = user.RoleId !== undefined ? user.RoleId : (user.roleId !== undefined ? user.roleId : 4);
                let role = user.Role || user.role || 'User';
                if (roleId === 1) role = 'Admin';
                else if (roleId === 2) role = 'Manager';
                else if (roleId === 3) role = 'Editor';
                else if (roleId === 4) role = 'User';

                const token = generateSimulatedJwt({ unique_name: uName, role });
                localStorage.setItem('auth_token', token);
                localStorage.setItem('auth_user', JSON.stringify({ username: uName, email: uEmail, role }));
                resolve({ token, user: { username: uName, email: uEmail, role } });
            } else {
                if (credentials.username === 'admin' && (credentials.password === 'admin' || credentials.password === 'admin123')) {
                    const token = generateSimulatedJwt({ unique_name: 'admin', role: 'Admin' });
                    localStorage.setItem('auth_token', token);
                    localStorage.setItem('auth_user', JSON.stringify({ username: 'admin', email: 'admin@example.com', role: 'Admin' }));
                    resolve({ token, user: { username: 'admin', email: 'admin@example.com', role: 'Admin' } });
                } else if (credentials.username === 'user' && (credentials.password === 'user' || credentials.password === 'user123')) {
                    const token = generateSimulatedJwt({ unique_name: 'user', role: 'User' });
                    localStorage.setItem('auth_token', token);
                    localStorage.setItem('auth_user', JSON.stringify({ username: 'user', email: 'user@example.com', role: 'User' }));
                    resolve({ token, user: { username: 'user', email: 'user@example.com', role: 'User' } });
                } else {
                    reject(new Error('Ungültige Anmeldedaten'));
                }
            }
        };
        request.onerror = () => reject(request.error);
    });
};

export const registerUser = async (userData: any) => {
    const db = await openDB();
    const storeName = getUserStoreName(db);
    return new Promise((resolve, reject) => {
        const tx = db.transaction(storeName, 'readwrite');
        const store = tx.objectStore(storeName);
        
        const pkField: any = (Array.isArray(store.keyPath) ? store.keyPath[0] : store.keyPath) || 'id';
        const payload: any = {};
        
        payload[pkField] = Date.now();
        payload.Username = userData.username;
        payload.username = userData.username;
        payload.PasswordHash = userData.password;
        payload.password = userData.password;
        payload.Email = userData.email;
        payload.email = userData.email;
        payload.RoleId = 4;
        payload.roleId = 4;
        payload.IsActive = true;
        payload.isActive = true;

        const request = store.add(payload);
        request.onsuccess = () => resolve({ success: true });
        request.onerror = () => reject(request.error);
    });
};

export const changePassword = async (data: any) => {
    const db = await openDB();
    const savedUser = localStorage.getItem('auth_user');
    if (!savedUser) throw new Error('Not logged in');
    const { username } = JSON.parse(savedUser);
    const storeName = getUserStoreName(db);

    return new Promise((resolve, reject) => {
        const tx = db.transaction(storeName, 'readwrite');
        const store = tx.objectStore(storeName);
        const getReq = store.getAll();
        getReq.onsuccess = () => {
            const users = getReq.result || [];
            const user = users.find((u: any) => {
                const uName = (u.Username || u.username || '').toLowerCase();
                return uName === username.toLowerCase();
            });

            if (user) {
                if (user.PasswordHash !== undefined) user.PasswordHash = data.newPassword;
                if (user.passwordHash !== undefined) user.passwordHash = data.newPassword;
                if (user.Password !== undefined) user.Password = data.newPassword;
                if (user.password !== undefined) user.password = data.newPassword;
                
                const putReq = store.put(user);
                putReq.onsuccess = () => resolve({ success: true });
                putReq.onerror = () => reject(putReq.error);
            } else {
                reject(new Error('User not found'));
            }
        };
        getReq.onerror = () => reject(getReq.error);
    });
};

export const logoutUser = () => {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('auth_user');
    window.location.href = '/login';
};

`;;
  
  files.push({ name: 'api.ts', path: `${root}/src/services/api.ts`, content: apiService, language: 'typescript' });

  let typesContent = `export interface NavigationItem {
  id: string;
  title?: string;
  label?: string;
  icon?: string;
  type?: string;
  route?: string;
  path?: string;
  targetType?: string;
  targetId?: string;
  requiredRoles?: string[];
  roles?: string[];
  children?: NavigationItem[];
  badgeCountQuery?: string;
  translations?: Record<string, string>;
}\n\n`;
  
  // Table Interfaces
  tables.forEach(table => {
    const safeName = toPascalCase(table.name);
    const props = table.fields.map(f => `  ${toCamelCase(f.name)}${isNullable(f) ? '?' : ''}: ${resolveType(f, 'typescript')};`);
    typesContent += `export interface ${safeName} {\n${props.join('\n')}\n}\n\n`;
  });

  // Query Interfaces
  queries.filter(q => q.type === 'SELECT').forEach(q => {
      const query = q as SelectQuery;
      const safeName = toPascalCase(q.name);
      const usedNames = new Set<string>(); // Track used property names to prevent duplicates
      
      const props = query.columns.filter(c => c.show !== false).map(c => {
          let type = 'string';
          const table = tables.find(t => t.id === c.tableId);
          const field = table?.fields.find(f => f.id === c.fieldId);
          if (field) {
              type = resolveType(field, 'typescript');
          }
          if (c.aggregate === 'COUNT') type = 'number';
          
          // Naming Logic: Alias -> FieldName -> FieldName + TableName -> FieldName + Counter
          let rawName = c.alias && c.alias.trim() !== '' ? c.alias : c.fieldName;
          let propName = toCamelCase(rawName);

          if (usedNames.has(propName)) {
              // Collision detected! Try appending TableName
              const tableSuffix = toPascalCase(c.tableName);
              propName = toCamelCase(`${rawName}${tableSuffix}`);
          }

          // If still collision, append number
          let counter = 2;
          const originalPropName = propName;
          while (usedNames.has(propName)) {
              propName = `${originalPropName}${counter}`;
              counter++;
          }

          usedNames.add(propName);
          return `  ${propName}?: ${type};`;
      });
      
      typesContent += `export interface ${safeName} {\n${props.join('\n')}\n}\n\n`;
  });

  files.push({ name: 'types.ts', path: `${root}/src/types/index.ts`, content: typesContent, language: 'typescript' });

  // Export Helpers & Macro Services for Generated Sites
  const exportHelperContent = `import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export type ExportFormat = 'PDF' | 'XLSX' | 'XML' | 'JSON' | 'CSV' | 'HTML_PRINT';

export interface ExportDataOptions {
  title?: string;
  data: Record<string, any>[];
  columns?: string[];
  filename?: string;
  format: ExportFormat;
}

export function exportDataToFile(options: ExportDataOptions) {
  const { title = 'Bericht_Export', data, filename = \`export_\${Date.now()}\`, format } = options;

  if (!data || data.length === 0) {
    alert('Keine Daten für den Export vorhanden.');
    return;
  }

  const columns = options.columns && options.columns.length > 0 ? options.columns : Object.keys(data[0] || {});

  switch (format) {
    case 'CSV': {
      let csvContent = '\\uFEFF';
      csvContent += columns.map(c => \`"\${String(c).replace(/"/g, '""')}"\`).join(';') + '\\n';
      data.forEach(row => {
        const line = columns.map(c => \`"\${String(row[c] ?? '').replace(/"/g, '""')}"\`).join(';');
        csvContent += line + '\\n';
      });
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      downloadBlob(blob, \`\${filename}.csv\`);
      break;
    }
    case 'JSON': {
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json;charset=utf-8;' });
      downloadBlob(blob, \`\${filename}.json\`);
      break;
    }
    case 'XLSX': {
      try {
        const rowsToExport = data.map(row => {
          const formattedRow: Record<string, any> = {};
          columns.forEach(col => {
            formattedRow[col] = row[col] !== undefined && row[col] !== null ? row[col] : '';
          });
          return formattedRow;
        });
        const worksheet = XLSX.utils.json_to_sheet(rowsToExport);
        const workbook = XLSX.utils.book_new();
        const sheetName = (title || 'Daten').replace(/[\\/*?:[\]]/g, '').substring(0, 31) || 'Daten';
        XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
        const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
        const blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
        downloadBlob(blob, \`\${filename}.xlsx\`);
      } catch (err) {
        let csvContent = '\\uFEFF';
        csvContent += columns.map(c => \`"\${String(c).replace(/"/g, '""')}"\`).join(';') + '\\n';
        data.forEach(row => {
          const line = columns.map(c => \`"\${String(row[c] ?? '').replace(/"/g, '""')}"\`).join(';');
          csvContent += line + '\\n';
        });
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        downloadBlob(blob, \`\${filename}.csv\`);
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
        downloadBlob(pdfBlob, \`\${safeFilename}.pdf\`);
      } catch (err) {
        console.error('PDF Export failed, falling back to print:', err);
        openPrintIframeOrWindow(title, data, columns);
      }
      break;
    }
    case 'HTML_PRINT': {
      openPrintIframeOrWindow(title, data, columns);
      break;
    }
  }
}

function openPrintIframeOrWindow(title: string, data: any[], columns: string[]) {
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

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
`;

  files.push({ name: 'exportHelper.ts', path: `${root}/src/utils/exportHelper.ts`, content: exportHelperContent, language: 'typescript' });

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
      const actualFieldName = fieldMap && fieldMap[fieldKey] ? fieldMap[fieldKey] : fieldKey;
      let val = record[actualFieldName];
      if (val === undefined) {
        const lowerKey = Object.keys(record).find(k => k.toLowerCase() === actualFieldName.toLowerCase());
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
      return typeof val === 'number' ? String(val) : JSON.stringify(String(val));
    });
    expr = expr.replace(/(?:AGE|ALTER|ALTER_JMD)\\s*\\(([^)]+)\\)/gi, (_, innerVal) => JSON.stringify(calculateDetailedAge(innerVal)));
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

  files.push({ name: 'formulaEvaluator.ts', path: `${root}/src/utils/formulaEvaluator.ts`, content: formulaEvaluatorContent, language: 'typescript' });

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

  const reportSourcesMap = reports ? reports.reduce((acc, r) => {
    acc[r.id] = { sourceType: r.sourceType, sourceId: r.sourceId };
    acc[r.name.toLowerCase()] = { sourceType: r.sourceType, sourceId: r.sourceId };
    return acc;
  }, {} as Record<string, { sourceType: string; sourceId: string }>) : {};

  const queryParamRefs: Record<string, Array<{ formName: string; fieldName: string; paramName: string }>> = {};
  if (queries) {
    queries.forEach(q => {
      const refs: Array<{ formName: string; fieldName: string; paramName: string }> = [];
      const selectQ = q as SelectQuery;
      if (selectQ.columns) {
        selectQ.columns.forEach(c => {
          if (c.criteria) {
            c.criteria.forEach(cr => {
              if (cr && /(?:\[?Forms\]?!)/i.test(cr)) {
                const formMatch = cr.match(/(?:\[?Forms\]?!\s*\[?([^!\]]+)\]?!\s*\[?([^!\]\s]+)\]?)/i);
                if (formMatch && formMatch.length >= 3) {
                  const formName = formMatch[1].toLowerCase();
                  const fieldName = formMatch[2].toLowerCase();
                  refs.push({
                    formName,
                    fieldName,
                    paramName: `form_${formName}_${fieldName}`
                  });
                }
              }
            });
          }
        });
      }
      if (refs.length > 0) {
        queryParamRefs[q.id] = refs;
        queryParamRefs[q.name.toLowerCase()] = refs;
      }
    });
  }

  const macroServiceContent = `import { exportDataToFile, ExportFormat } from '../utils/exportHelper';
import { get } from './api';

const tableEndpointsMap: Record<string, string> = ${JSON.stringify(tableEndpointsMap, null, 2)};
const queryEndpointsMap: Record<string, string> = ${JSON.stringify(queryEndpointsMap, null, 2)};
const reportSourcesMap: Record<string, { sourceType: string; sourceId: string }> = ${JSON.stringify(reportSourcesMap, null, 2)};
const queryParamRefs: Record<string, Array<{ formName: string; fieldName: string; paramName: string }>> = ${JSON.stringify(queryParamRefs, null, 2)};
const PROJECT_MACROS: Macro[] = ${JSON.stringify(macros, null, 2)};

export interface MacroStep {
  id: string;
  name: string;
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
  pageId?: string;
  jsCode?: string;
  [key: string]: any;
}

export interface Macro {
  id: string;
  name: string;
  steps: MacroStep[];
  [key: string]: any;
}

export async function executeGeneratedMacro(
  macroOrId: string | Macro, 
  contextData?: any, 
  addToast?: (msg: string, type?: any) => void
) {
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
        
        let currentSourceType = sourceType;
        let currentSourceId = sourceId;

        if (sourceType === 'report' && sourceId) {
          const reportConfig = reportSourcesMap[sourceId] || reportSourcesMap[sourceId.toLowerCase()];
          if (reportConfig) {
            currentSourceType = reportConfig.sourceType as any;
            currentSourceId = reportConfig.sourceId;
          }
        }

        let data: any[] = [];
        if (currentSourceType === 'table' && currentSourceId) {
          try {
            const mappedEndpoint = tableEndpointsMap[currentSourceId] || tableEndpointsMap[currentSourceId.toLowerCase()] || currentSourceId;
            const res = await get<any>(mappedEndpoint, { pageSize: 100000 });
            data = Array.isArray(res) ? res : (res?.data || []);
          } catch (e) {
            console.error('Error fetching table data for macro export:', e);
          }
        } else if (currentSourceType === 'query' && currentSourceId) {
          try {
            const mappedEndpoint = queryEndpointsMap[currentSourceId] || queryEndpointsMap[currentSourceId.toLowerCase()] || currentSourceId;
            const queryParams: Record<string, any> = { pageSize: 100000 };
            
            // Extract and append referenced Form parameters from contextData
            const refs = queryParamRefs[currentSourceId] || queryParamRefs[currentSourceId.toLowerCase()] || [];
            if (refs.length > 0 && contextData) {
              refs.forEach(ref => {
                const foundKey = Object.keys(contextData).find(k => k.toLowerCase() === ref.fieldName.toLowerCase());
                if (foundKey) {
                  queryParams[ref.paramName] = contextData[foundKey];
                }
              });
            }

            // Fallback: Also try to infer form name from current URL path
            try {
              const pathParts = window.location.pathname.split('/').filter(Boolean);
              const formPart = pathParts.find(p => p.toLowerCase().includes('form'));
              if (formPart && contextData) {
                const inferredFormName = formPart.toLowerCase().replace('form', '');
                Object.keys(contextData).forEach(key => {
                  const paramName = 'form_' + inferredFormName + '_' + key.toLowerCase();
                  if (queryParams[paramName] === undefined) {
                    queryParams[paramName] = contextData[key];
                  }
                });
              }
            } catch (e) {}

            const res = await get<any>('queries/' + mappedEndpoint, queryParams);
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
        exportDataToFile({
          title: title || macro.name || 'Export',
          data,
          format: format || 'PDF'
        });
      } else if (step.type === 'SHOW_TOAST') {
        if (addToast) addToast(step.toastMessage || 'Aktion ausgeführt', step.toastType || 'info');
      } else if (step.type === 'MESSAGE_BOX') {
        alert(step.messageText || step.name || 'Hinweis');
      } else if (step.type === 'CONFIRM_DIALOG') {
        confirm(step.confirmPrompt || 'Bestätigen?');
      }
    }
    if (addToast) addToast(\`Makro '\${macro.name || macro.id}' wurde ausgeführt\`, 'success');
    return;
  }

  // Fallback if macro object not found, or macroId is a direct command/format name
  const macroStr = typeof macroOrId === 'string' ? macroOrId.toLowerCase() : '';
  let exportFormat: ExportFormat | null = null;
  if (macroStr.includes('pdf')) exportFormat = 'PDF';
  else if (macroStr.includes('xlsx') || macroStr.includes('excel')) exportFormat = 'XLSX';
  else if (macroStr.includes('csv')) exportFormat = 'CSV';
  else if (macroStr.includes('json')) exportFormat = 'JSON';

  if (exportFormat) {
    let dataToExport = Array.isArray(contextData) ? contextData : (contextData && Object.keys(contextData).length > 0 ? [contextData] : []);
    exportDataToFile({
      title: 'Export_' + exportFormat,
      data: dataToExport,
      format: exportFormat
    });
    if (addToast) addToast(\`Export als \${exportFormat} gestartet\`, 'success');
  } else {
    if (addToast) addToast(\`Makro '\${typeof macroOrId === 'string' ? macroOrId : macroOrId.name}' ausgeführt\`, 'info');
  }
}
`;

  files.push({ name: 'macroService.ts', path: `${root}/src/services/macroService.ts`, content: macroServiceContent, language: 'typescript' });

  return files;
};
