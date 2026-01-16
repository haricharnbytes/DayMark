
import { CalendarEvent } from '../types';

const DB_NAME = 'calendarDB';
const DB_VERSION = 2; // Incremented version
const STORE_NAME = 'events';
const NOTES_STORE = 'dailyNotes';

export const initDB = (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    try {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onerror = () => reject('Error opening database: ' + request.error?.message);
      request.onsuccess = () => resolve(request.result);

      request.onupgradeneeded = (event: IDBVersionChangeEvent) => {
        const db = (event.target as IDBOpenDBRequest).result;
        
        // Events Store
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          const store = db.createObjectStore(STORE_NAME, { keyPath: 'id' });
          store.createIndex('date', 'date', { unique: false });
          store.createIndex('createdAt', 'createdAt', { unique: false });
        }

        // Daily Notes Store
        if (!db.objectStoreNames.contains(NOTES_STORE)) {
          db.createObjectStore(NOTES_STORE, { keyPath: 'date' });
        }
      };
    } catch (e) {
      reject('IndexedDB is not supported');
    }
  });
};

export const getAllEvents = async (): Promise<CalendarEvent[]> => {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readonly');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.getAll();
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject('Error fetching events');
  });
};

export const saveEventToDB = async (event: CalendarEvent): Promise<void> => {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.put(event);
    request.onsuccess = () => resolve();
    request.onerror = () => reject('Error saving event');
  });
};

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

// --- Daily Notes Methods ---

export const getDailyNote = async (date: string): Promise<string> => {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(NOTES_STORE, 'readonly');
    const store = transaction.objectStore(NOTES_STORE);
    const request = store.get(date);
    request.onsuccess = () => resolve(request.result?.content || '');
    request.onerror = () => reject('Error fetching note');
  });
};

export const saveDailyNote = async (date: string, content: string): Promise<void> => {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(NOTES_STORE, 'readwrite');
    const store = transaction.objectStore(NOTES_STORE);
    const request = store.put({ date, content, updatedAt: Date.now() });
    request.onsuccess = () => resolve();
    request.onerror = () => reject('Error saving note');
  });
};
