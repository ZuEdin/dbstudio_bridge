
import { Project } from '../types/index';
import { useConfigStore } from '../stores/useConfigStore';

const DB_NAME = 'DBStudioProDB';
const STORE_METADATA = 'projects_meta';
const STORE_PAYLOAD = 'projects_data';
const STORE_LEGACY = 'projects';
const DB_VERSION = 3; 

// Helper to get remote URL
const getRemoteUrl = (path: string) => {
    const config = useConfigStore.getState().config;
    const baseUrl = config.apiUrl || '';
    return `${baseUrl}${path}`;
};

const openDB = (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = (event) => {
      reject('IndexedDB error: ' + (event.target as any).error);
    };

    request.onsuccess = (event) => {
      resolve((event.target as IDBOpenDBRequest).result);
    };

    request.onupgradeneeded = async (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      const transaction = (event.target as IDBOpenDBRequest).transaction!;

      // 1. Create new stores if they don't exist
      if (!db.objectStoreNames.contains(STORE_METADATA)) {
        db.createObjectStore(STORE_METADATA, { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains(STORE_PAYLOAD)) {
        db.createObjectStore(STORE_PAYLOAD, { keyPath: 'projectId' });
      }

      // 2. Migration Logic
      if (db.objectStoreNames.contains(STORE_LEGACY)) {
        const legacyStore = transaction.objectStore(STORE_LEGACY);
        const metaStore = transaction.objectStore(STORE_METADATA);
        const dataStore = transaction.objectStore(STORE_PAYLOAD);

        const getAllReq = legacyStore.getAll();
        getAllReq.onsuccess = () => {
            const oldProjects = getAllReq.result as Project[];
            for (const p of oldProjects) {
                // Save meta
                metaStore.put({
                    id: p.id,
                    name: p.name,
                    lastModified: p.lastModified,
                    dbType: p.data?.backendConfig?.dbType,
                    language: p.data?.backendConfig?.language
                });
                // Save data
                dataStore.put({
                    projectId: p.id,
                    data: p.data
                });
            }
            // Optional: delete legacy store after migration
            // db.deleteObjectStore(STORE_LEGACY); 
        };
      }
    };
  });
};

export const saveProjectToStorage = async (project: Project): Promise<void> => {
  const { storage } = useConfigStore.getState().config;
  
  if (storage === 'server') {
    try {
      const response = await fetch(getRemoteUrl('/projects'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(project)
      });
      if (!response.ok) throw new Error('Remote storage error');
      return;
    } catch (e) {
      console.warn('Remote storage failed, falling back to local', e);
      // Fallback allowed or strictly restricted? User said "switch between", so fallback is safe if it fails
    }
  }

  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_METADATA, STORE_PAYLOAD], 'readwrite');
    const metaStore = transaction.objectStore(STORE_METADATA);
    const dataStore = transaction.objectStore(STORE_PAYLOAD);
    
    // Save metadata with preview info
    const metadata = {
        id: project.id,
        name: project.name,
        lastModified: project.lastModified,
        isCloud: project.isCloud,
        owner: project.owner,
        dbType: project.data?.backendConfig?.dbType,
        language: project.data?.backendConfig?.language
    };
    metaStore.put(metadata);

    // Save payload separately
    const payload = {
        projectId: project.id,
        data: project.data
    };
    dataStore.put(payload);

    transaction.oncomplete = () => resolve();
    transaction.onerror = (e) => reject((e.target as any).error);
  });
};

export const getAllProjects = async (): Promise<Project[]> => {
  const { storage } = useConfigStore.getState().config;
  
  if (storage === 'server') {
     try {
       const response = await fetch(getRemoteUrl('/projects'));
       if (response.ok) return await response.json();
     } catch(e) {
       console.warn('Remote fetch failed', e);
     }
  }

  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_METADATA], 'readonly');
    const store = transaction.objectStore(STORE_METADATA);
    const request = store.getAll();

    request.onsuccess = () => {
        // Return meta-projects with enough info for the list view
        const metaList = request.result.map((m: any) => ({
            id: m.id,
            name: m.name,
            lastModified: m.lastModified,
            isCloud: m.isCloud,
            owner: m.owner,
            isMetadataOnly: true,
            data: {
                backendConfig: {
                    dbType: m.dbType,
                    language: m.language
                }
            } as any
        }));
        metaList.sort((a, b) => b.lastModified - a.lastModified);
        resolve(metaList);
    };
    request.onerror = (e) => reject((e.target as any).error);
  });
};

export const getProjectById = async (id: string): Promise<Project | undefined> => {
  const { storage } = useConfigStore.getState().config;
  
  if (storage === 'server') {
     try {
       const response = await fetch(getRemoteUrl(`/projects/${id}`));
       if (response.ok) return await response.json();
     } catch(e) {
       console.warn('Remote fetch failed', e);
     }
  }

  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_METADATA, STORE_PAYLOAD], 'readonly');
    const metaStore = transaction.objectStore(STORE_METADATA);
    const dataStore = transaction.objectStore(STORE_PAYLOAD);
    
    const metaReq = metaStore.get(id);
    const dataReq = dataStore.get(id);

    transaction.oncomplete = () => {
        if (!metaReq.result) {
            resolve(undefined);
            return;
        }
        const project: Project = {
            id: metaReq.result.id,
            name: metaReq.result.name,
            lastModified: metaReq.result.lastModified,
            isCloud: metaReq.result.isCloud,
            owner: metaReq.result.owner,
            data: dataReq.result?.data || {}
        };
        resolve(project);
    };
    transaction.onerror = (e) => reject((e.target as any).error);
  });
};

export const updateProjectScope = async (id: string, isCloud: boolean): Promise<void> => {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_METADATA, STORE_PAYLOAD], 'readwrite');
    const metaStore = transaction.objectStore(STORE_METADATA);
    const getReq = metaStore.get(id);

    getReq.onsuccess = () => {
      if (getReq.result) {
        const updatedMeta = { ...getReq.result, isCloud, lastModified: Date.now() };
        metaStore.put(updatedMeta);
      }
    };

    transaction.oncomplete = () => resolve();
    transaction.onerror = (e) => reject((e.target as any).error);
  });
};

export const deleteProjectFromStorage = async (id: string): Promise<void> => {
  const { storage } = useConfigStore.getState().config;
  
  if (storage === 'server') {
     try {
       const res = await fetch(getRemoteUrl(`/projects/${id}`), { method: 'DELETE' });
       if (!res.ok) {
         console.warn(`Remote server delete failed with status ${res.status}`);
       }
     } catch(e) {
       console.warn('Remote server delete failed', e);
     }
  }

  // Also try deleting via team projects API in case it is a team cloud project
  try {
     await (window as any).cloudService?.deleteProject(id);
  } catch (e) {
     console.warn('Cloud team delete failed', e);
  }

  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_METADATA, STORE_PAYLOAD], 'readwrite');
    transaction.objectStore(STORE_METADATA).delete(id);
    transaction.objectStore(STORE_PAYLOAD).delete(id);

    transaction.oncomplete = () => resolve();
    transaction.onerror = (e) => reject((e.target as any).error);
  });
};
