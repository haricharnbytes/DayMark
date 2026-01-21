
import { CalendarEvent } from '../types';

const DB_NAME = 'calendarDB';
const DB_VERSION = 2;
const STORE_NAME = 'events';
const NOTES_STORE = 'dailyNotes';

// We use a public, keyless JSON bin service for this demo to enable real cross-device sync.
// In a production environment, this would be replaced with a secure Supabase or Firebase endpoint.
const CLOUD_SYNC_URL = 'https://jsonblob.com/api/jsonBlob'; 

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
          store.createIndex('date', 'date', { unique: false });
        }
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
  return new Promise((resolve) => {
    const transaction = db.transaction(STORE_NAME, 'readonly');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.getAll();
    request.onsuccess = () => resolve(request.result || []);
  });
};

export const saveEventToDB = async (event: CalendarEvent): Promise<void> => {
  const db = await initDB();
  return new Promise((resolve) => {
    const transaction = db.transaction(STORE_NAME, 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    store.put(event);
    transaction.oncomplete = () => {
      resolve();
      triggerAutoCloudSync(); // Background sync
    };
  });
};

export const deleteEventFromDB = async (id: string): Promise<void> => {
  const db = await initDB();
  return new Promise((resolve) => {
    const transaction = db.transaction(STORE_NAME, 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    store.delete(id);
    transaction.oncomplete = () => {
      resolve();
      triggerAutoCloudSync(); // Background sync
    };
  });
};

export const getDailyNote = async (date: string): Promise<string> => {
  const db = await initDB();
  return new Promise((resolve) => {
    const transaction = db.transaction(NOTES_STORE, 'readonly');
    const store = transaction.objectStore(NOTES_STORE);
    const request = store.get(date);
    request.onsuccess = () => resolve(request.result?.content || '');
  });
};

export const saveDailyNote = async (date: string, content: string): Promise<void> => {
  const db = await initDB();
  return new Promise((resolve) => {
    const transaction = db.transaction(NOTES_STORE, 'readwrite');
    const store = transaction.objectStore(NOTES_STORE);
    store.put({ date, content, updatedAt: Date.now() });
    transaction.oncomplete = () => {
      resolve();
      triggerAutoCloudSync(); // Background sync
    };
  });
};

export const getAllNoteDates = async (): Promise<string[]> => {
  const db = await initDB();
  return new Promise((resolve) => {
    const transaction = db.transaction(NOTES_STORE, 'readonly');
    const store = transaction.objectStore(NOTES_STORE);
    const request = store.getAll();
    request.onsuccess = () => {
      const results = request.result || [];
      resolve(results.filter((r: any) => r.content && r.content.trim().length > 0).map((r: any) => r.date));
    };
  });
};

// --- AUTOMATIC CLOUD SYNC ENGINE ---

let isSyncing = false;

const triggerAutoCloudSync = async () => {
  if (isSyncing) return;
  const cloudId = localStorage.getItem('daymark_cloud_id');
  if (!cloudId) return;

  isSyncing = true;
  window.dispatchEvent(new CustomEvent('daymark-sync-start'));

  try {
    const events = await getAllEvents();
    const db = await initDB();
    const notesTx = db.transaction(NOTES_STORE, 'readonly');
    const notesStore = notesTx.objectStore(NOTES_STORE);
    const notes = await new Promise<any[]>((resolve) => {
      const req = notesStore.getAll();
      req.onsuccess = () => resolve(req.result);
    });

    const payload = { events, notes, updatedAt: Date.now() };
    
    // Using jsonblob as a free cloud orchestrator
    await fetch(`${CLOUD_SYNC_URL}/${cloudId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    localStorage.setItem('daymark_last_sync', Date.now().toString());
    window.dispatchEvent(new CustomEvent('daymark-sync-complete'));
  } catch (e) {
    console.error('Cloud Sync Failed:', e);
    window.dispatchEvent(new CustomEvent('daymark-sync-error'));
  } finally {
    isSyncing = false;
  }
};

/**
 * Cloud Restore - Called on Login
 * Pulls all data for the user and populates local storage/IndexedDB
 */
export const performCloudRestore = async (username: string): Promise<void> => {
  // Generate a predictable Cloud ID from username (in production this would be handled by auth)
  const cloudId = btoa(username).replace(/=/g, '').toLowerCase().substring(0, 24);
  localStorage.setItem('daymark_cloud_id', cloudId);

  try {
    const response = await fetch(`${CLOUD_SYNC_URL}/${cloudId}`);
    if (!response.ok) {
      // If first time, we create the initial cloud bin
      await fetch(CLOUD_SYNC_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Location': `${CLOUD_SYNC_URL}/${cloudId}` },
        body: JSON.stringify({ events: [], notes: [], updatedAt: Date.now() })
      });
      return;
    }

    const data = await response.json();
    const db = await initDB();

    // Clear local first to avoid duplicates or stale data
    const clearEvents = db.transaction(STORE_NAME, 'readwrite').objectStore(STORE_NAME).clear();
    const clearNotes = db.transaction(NOTES_STORE, 'readwrite').objectStore(NOTES_STORE).clear();

    await Promise.all([
      new Promise(r => clearEvents.onsuccess = r),
      new Promise(r => clearNotes.onsuccess = r)
    ]);

    // Restore Events
    if (data.events && data.events.length > 0) {
      const eventTx = db.transaction(STORE_NAME, 'readwrite');
      const store = eventTx.objectStore(STORE_NAME);
      data.events.forEach((e: any) => store.put(e));
    }

    // Restore Notes
    if (data.notes && data.notes.length > 0) {
      const noteTx = db.transaction(NOTES_STORE, 'readwrite');
      const store = noteTx.objectStore(NOTES_STORE);
      data.notes.forEach((n: any) => store.put(n));
    }

    localStorage.setItem('daymark_last_sync', Date.now().toString());
  } catch (e) {
    console.warn('Restore failed, starting with fresh workspace:', e);
  }
};

// Fix: Added missing exportDatabase to handle sync token generation for manual transfers
export const exportDatabase = async (): Promise<string> => {
  // Trigger a fresh sync before exporting to ensure the cloud bin is up to date
  await triggerAutoCloudSync();
  return localStorage.getItem('daymark_cloud_id') || '';
};

// Fix: Added missing importDatabase to support manual workspace restoration via token
export const importDatabase = async (token: string): Promise<void> => {
  if (!token) throw new Error('No sync token provided');
  
  try {
    const response = await fetch(`${CLOUD_SYNC_URL}/${token}`);
    if (!response.ok) throw new Error('Cloud workspace not found');

    const data = await response.json();
    const db = await initDB();

    // Clear local database before applying imported data
    const clearEvents = db.transaction(STORE_NAME, 'readwrite').objectStore(STORE_NAME).clear();
    const clearNotes = db.transaction(NOTES_STORE, 'readwrite').objectStore(NOTES_STORE).clear();

    await Promise.all([
      new Promise(r => clearEvents.onsuccess = r),
      new Promise(r => clearNotes.onsuccess = r)
    ]);

    // Populate events from imported cloud data
    if (data.events && data.events.length > 0) {
      const eventTx = db.transaction(STORE_NAME, 'readwrite');
      const store = eventTx.objectStore(STORE_NAME);
      data.events.forEach((e: any) => store.put(e));
    }

    // Populate notes from imported cloud data
    if (data.notes && data.notes.length > 0) {
      const noteTx = db.transaction(NOTES_STORE, 'readwrite');
      const store = noteTx.objectStore(NOTES_STORE);
      data.notes.forEach((n: any) => store.put(n));
    }

    // Persist the new cloud ID and update sync timestamp
    localStorage.setItem('daymark_cloud_id', token);
    localStorage.setItem('daymark_last_sync', Date.now().toString());
  } catch (e) {
    console.error('Manual restoration failed:', e);
    throw e;
  }
};
