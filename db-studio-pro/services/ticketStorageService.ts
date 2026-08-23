import { Ticket } from '../types/index';

const DB_NAME = 'DBStudioProTickets';
const STORE_NAME = 'tickets';
const DB_VERSION = 1;

const openTicketsDB = (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = (event) => {
      reject('IndexedDB error: ' + (event.target as any).error);
    };

    request.onsuccess = (event) => {
      resolve((event.target as IDBOpenDBRequest).result);
    };

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id' });
      }
    };
  });
};

export const getLocalTickets = async (): Promise<Ticket[]> => {
  try {
    const db = await openTicketsDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORE_NAME], 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.getAll();

      request.onsuccess = () => {
        const tickets = request.result as Ticket[];
        if (tickets.length === 0) {
          // If completely empty, return seeded tickets
          const seeded = getSeededTickets();
          // Write seeded to storage asynchronously
          seeded.forEach(t => saveLocalTicket(t));
          resolve(seeded);
        } else {
          // Sort by creation date desc
          tickets.sort((a, b) => b.createdAt - a.createdAt);
          resolve(tickets);
        }
      };
      request.onerror = (e) => reject((e.target as any).error);
    });
  } catch (error) {
    console.warn('Could not read tickets from IndexedDB, using fallback seed:', error);
    return getSeededTickets();
  }
};

export const saveLocalTicket = async (ticket: Ticket): Promise<void> => {
  try {
    const db = await openTicketsDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORE_NAME], 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.put(ticket);

      request.onsuccess = () => resolve();
      request.onerror = (e) => reject((e.target as any).error);
    });
  } catch (error) {
    console.error('Could not save ticket to IndexedDB:', error);
  }
};

export const deleteLocalTicket = async (id: string): Promise<void> => {
  try {
    const db = await openTicketsDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORE_NAME], 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.delete(id);

      request.onsuccess = () => resolve();
      request.onerror = (e) => reject((e.target as any).error);
    });
  } catch (error) {
    console.error('Could not delete ticket from IndexedDB:', error);
  }
};

export const getSeededTickets = (): Ticket[] => {
  const now = Date.now();
  return [
    {
      id: 'ticket-1',
      title: 'Datenbankschema für Kunden & Rechnungen anlegen',
      description: 'Bitte erstelle die Tabelle "sys_customers" mit Primärschlüssel und Verknüpfung zu "sys_invoices".',
      status: 'todo',
      priority: 'high',
      assignedTo: 'u2',
      assignedToName: 'Sarah Lee',
      createdBy: 'u1',
      createdByName: 'Me',
      createdAt: now - 3600000 * 2 // 2 hours ago
    },
    {
      id: 'ticket-2',
      title: 'Abfrage-Tuning für Umsatz-Reports',
      description: 'Die Auswertung der Monatsumsätze lädt noch etwas langsam. Prüfe Indizes auf dem Datumsfeld.',
      status: 'in_progress',
      priority: 'medium',
      assignedTo: 'u3',
      assignedToName: 'Tom H.',
      createdBy: 'u2',
      createdByName: 'Sarah Lee',
      createdAt: now - 3600000 * 5 // 5 hours ago
    },
    {
      id: 'ticket-3',
      title: 'Formular-Validierung einbauen',
      description: 'Das Eingabeformular für neue Mitarbeiter erlaubt leere E-Mail-Adressen. Bitte RegEx einbauen.',
      status: 'done',
      priority: 'low',
      assignedTo: 'u1',
      assignedToName: 'Me',
      createdBy: 'u3',
      createdByName: 'Tom H.',
      createdAt: now - 3600000 * 24 // 1 day ago
    }
  ];
};
