
import { CalendarEvent } from '../types';

const DB_NAME = 'calendarDB';
const DB_VERSION = 1;
const STORE_NAME = 'events';

/**
 * Initializes the IndexedDB database.
 * Handles creation and version upgrades of the 'events' store.
 */
export const initDB = (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    try {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onerror = () => reject('Error opening database: ' + request.error?.message);
      request.onsuccess = () => resolve(request.result);

      request.onupgradeneeded = (event: IDBVersionChangeEvent) => {
        const db = (event.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          const store = db.createObjectStore(STORE_NAME, { keyPath: 'id' });
          // Index 'date' for fast lookup by YYYY-MM-DD
          store.createIndex('date', 'date', { unique: false });
          // Index 'createdAt' for sorting if needed
          store.createIndex('createdAt', 'createdAt', { unique: false });
        }
      };
    } catch (e) {
      reject('IndexedDB is not supported in this environment');
    }
  });
};

/**
 * Fetches all events from the database.
 */
export const getAllEvents = async (): Promise<CalendarEvent[]> => {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readonly');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.getAll();

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject('Error fetching all events');
  });
};

/**
 * Fetches events specifically for a given date using the index.
 */
export const getEventsByDate = async (date: string): Promise<CalendarEvent[]> => {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readonly');
    const store = transaction.objectStore(STORE_NAME);
    const index = store.index('date');
    const request = index.getAll(IDBKeyRange.only(date));

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject('Error fetching events by date');
  });
};

/**
 * Saves (Adds or Updates) an event in the database.
 */
export const saveEventToDB = async (event: CalendarEvent): Promise<void> => {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    
    const request = store.put(event);

    request.onsuccess = () => resolve();
    request.onerror = () => reject('Error saving event: ' + request.error?.message);
  });
};

/**
 * Deletes an event from the database by ID.
 */
export const deleteEventFromDB = async (id: string): Promise<void> => {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.delete(id);

    request.onsuccess = () => resolve();
    request.onerror = () => reject('Error deleting event');
  });
};
