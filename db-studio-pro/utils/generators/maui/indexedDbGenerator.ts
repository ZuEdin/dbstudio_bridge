import { Table, VirtualFile } from '../../../types/index';

export const generateIndexedDbJs = (
  tables: Table[],
  root: string
): VirtualFile => {
  const storesSetup = tables.map(t => `
            if (!db.objectStoreNames.contains('${t.name}')) {
                db.createObjectStore('${t.name}', { keyPath: 'id', autoIncrement: true });
            }
  `).join('\n');

  const indexedDbJs = `
const DB_NAME = 'db_studio_pro_maui';
const DB_VERSION = 1;

function getDb() {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open(DB_NAME, DB_VERSION);
        request.onupgradeneeded = (e) => {
            const db = e.target.result;
            ${storesSetup}
        };
        request.onsuccess = (e) => resolve(e.target.result);
        request.onerror = (e) => reject(e.target.error);
    });
}

window.mauiIndexedDb = {
    getAll: async function(tableName) {
        const db = await getDb();
        return new Promise((resolve, reject) => {
            const tx = db.transaction(tableName, 'readonly');
            const store = tx.objectStore(tableName);
            const req = store.getAll();
            req.onsuccess = () => resolve(req.result);
            req.onerror = () => reject(req.error);
        });
    },

    getById: async function(tableName, id) {
        const db = await getDb();
        return new Promise((resolve, reject) => {
            const tx = db.transaction(tableName, 'readonly');
            const store = tx.objectStore(tableName);
            // Try numeric conversion first, otherwise use as is
            const key = isNaN(id) ? id : Number(id);
            const req = store.get(key);
            req.onsuccess = () => resolve(req.result);
            req.onerror = () => reject(req.error);
        });
    },

    add: async function(tableName, record) {
        const db = await getDb();
        return new Promise((resolve, reject) => {
            const tx = db.transaction(tableName, 'readwrite');
            const store = tx.objectStore(tableName);
            
            // Delete id if it's 0 or empty for auto-increment
            if (record.id === 0 || record.id === "0" || !record.id) {
                delete record.id;
            } else if (!isNaN(record.id)) {
                record.id = Number(record.id);
            }

            const req = store.add(record);
            req.onsuccess = () => resolve(req.result);
            req.onerror = () => reject(req.error);
        });
    },

    update: async function(tableName, id, record) {
        const db = await getDb();
        return new Promise((resolve, reject) => {
            const tx = db.transaction(tableName, 'readwrite');
            const store = tx.objectStore(tableName);
            
            const key = isNaN(id) ? id : Number(id);
            record.id = key;

            const req = store.put(record);
            req.onsuccess = () => resolve(true);
            req.onerror = () => reject(req.error);
        });
    },

    delete: async function(tableName, id) {
        const db = await getDb();
        return new Promise((resolve, reject) => {
            const tx = db.transaction(tableName, 'readwrite');
            const store = tx.objectStore(tableName);
            const key = isNaN(id) ? id : Number(id);
            const req = store.delete(key);
            req.onsuccess = () => resolve(true);
            req.onerror = () => reject(req.error);
        });
    }
};
`;

  return { name: 'indexeddb.js', path: `${root}/wwwroot/js/indexeddb.js`, content: indexedDbJs, language: 'javascript' };
};
