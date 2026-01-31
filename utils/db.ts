
import { CalendarEvent } from '../types';

const DB_NAME = 'calendarDB';
const DB_VERSION = 2;
const STORE_NAME = 'events';
const NOTES_STORE = 'dailyNotes';

// Using a resilient public JSON endpoint for the demo sync feature.
const CLOUD_SYNC_URL = 'https://jsonblob.com/api/jsonBlob'; 

// Local communication channel for cross-tab synchronization
const syncChannel = new BroadcastChannel('daymark_sync_channel');

export const initDB = (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    try {
      const request = indexedDB.open(DB_NAME, DB_VERSION);
      request.onerror = () => reject('Error opening database: ' + request.error?.message);
      request.onsuccess = () => resolve(request.result);
      
      // Fixed: corrected parameter type to IDBVersionChangeEvent and accessed result via request.result
      request.onupgradeneeded = (event: IDBVersionChangeEvent) => {
        const db = request.result;
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

const notifyLocalTabs = () => {
  syncChannel.postMessage('refresh');
  window.dispatchEvent(new CustomEvent('daymark-local-update'));
};

export const saveEventToDB = async (event: CalendarEvent): Promise<void> => {
  const db = await initDB();
  return new Promise((resolve) => {
    const transaction = db.transaction(STORE_NAME, 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    if (!event.createdAt) event.createdAt = Date.now();
    store.put(event);
    transaction.oncomplete = () => {
      localStorage.setItem('daymark_needs_push', 'true');
      notifyLocalTabs();
      resolve();
      triggerAutoCloudSync(); 
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
      localStorage.setItem('daymark_needs_push', 'true');
      notifyLocalTabs();
      resolve();
      triggerAutoCloudSync();
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
      localStorage.setItem('daymark_needs_push', 'true');
      notifyLocalTabs();
      resolve();
      triggerAutoCloudSync();
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

// --- SMART BI-DIRECTIONAL CLOUD ENGINE ---

let isSyncing = false;

export const triggerAutoCloudSync = async () => {
  if (isSyncing || !navigator.onLine) return;
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

    const updatedAt = Date.now();
    const payload = { events, notes, updatedAt };
    
    const res = await fetch(`${CLOUD_SYNC_URL}/${cloudId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (res.ok) {
      localStorage.setItem('daymark_last_sync', updatedAt.toString());
      localStorage.removeItem('daymark_needs_push');
      window.dispatchEvent(new CustomEvent('daymark-sync-complete'));
    } else if (res.status === 404) {
      await createInitialCloudStorage(cloudId, payload);
      window.dispatchEvent(new CustomEvent('daymark-sync-complete'));
    }
  } catch (e) {
    window.dispatchEvent(new CustomEvent('daymark-sync-error'));
  } finally {
    isSyncing = false;
  }
};

export const checkAndPullCloudUpdates = async () => {
  if (isSyncing || !navigator.onLine) return;
  const cloudId = localStorage.getItem('daymark_cloud_id');
  if (!cloudId) return;

  try {
    const response = await fetch(`${CLOUD_SYNC_URL}/${cloudId}`);
    if (!response.ok) return;

    const cloudData = await response.json();
    const lastLocalSync = parseInt(localStorage.getItem('daymark_last_sync') || '0');

    // Only pull if cloud is strictly newer and we don't have pending local changes to push
    if (cloudData.updatedAt > lastLocalSync && !localStorage.getItem('daymark_needs_push')) {
      isSyncing = true;
      window.dispatchEvent(new CustomEvent('daymark-sync-start'));
      
      const db = await initDB();
      
      const restoreEvents = new Promise<void>((resolve) => {
        const eventTx = db.transaction(STORE_NAME, 'readwrite');
        const eventStore = eventTx.objectStore(STORE_NAME);
        eventStore.clear().onsuccess = () => {
          if (cloudData.events) {
            cloudData.events.forEach((e: any) => eventStore.put(e));
          }
          resolve();
        };
      });

      const restoreNotes = new Promise<void>((resolve) => {
        const noteTx = db.transaction(NOTES_STORE, 'readwrite');
        const noteStore = noteTx.objectStore(NOTES_STORE);
        noteStore.clear().onsuccess = () => {
          if (cloudData.notes) {
            cloudData.notes.forEach((n: any) => noteStore.put(n));
          }
          resolve();
        };
      });

      await Promise.all([restoreEvents, restoreNotes]);

      localStorage.setItem('daymark_last_sync', cloudData.updatedAt.toString());
      window.dispatchEvent(new CustomEvent('daymark-sync-complete'));
      isSyncing = false;
    }
  } catch (e) {
    isSyncing = false;
  }
};

const createInitialCloudStorage = async (cloudId: string, initialData: any) => {
  try {
    await fetch(CLOUD_SYNC_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(initialData)
    });
  } catch (e) {}
};

export const performCloudRestore = async (username: string): Promise<void> => {
  const cloudId = btoa(username).replace(/=/g, '').toLowerCase().substring(0, 24);
  localStorage.setItem('daymark_cloud_id', cloudId);

  if (!navigator.onLine) return;

  try {
    const response = await fetch(`${CLOUD_SYNC_URL}/${cloudId}`);
    if (response.ok) {
      const data = await response.json();
      const db = await initDB();

      const eventTx = db.transaction(STORE_NAME, 'readwrite');
      await new Promise(r => { eventTx.objectStore(STORE_NAME).clear().onsuccess = r; });
      if (data.events) data.events.forEach((e: any) => eventTx.objectStore(STORE_NAME).put(e));

      const noteTx = db.transaction(NOTES_STORE, 'readwrite');
      await new Promise(r => { noteTx.objectStore(NOTES_STORE).clear().onsuccess = r; });
      if (data.notes) data.notes.forEach((n: any) => noteTx.objectStore(NOTES_STORE).put(n));

      localStorage.setItem('daymark_last_sync', data.updatedAt.toString());
    } else {
      await createInitialCloudStorage(cloudId, { events: [], notes: [], updatedAt: Date.now() });
    }
  } catch (e) {}
};

export const exportDatabase = async (): Promise<string> => {
  return localStorage.getItem('daymark_cloud_id') || '';
};

export const importDatabase = async (token: string): Promise<void> => {
  localStorage.setItem('daymark_cloud_id', token);
  localStorage.setItem('daymark_last_sync', '0');
  await checkAndPullCloudUpdates();
};

// Listen for updates from other tabs
syncChannel.onmessage = (event) => {
  if (event.data === 'refresh') {
    window.dispatchEvent(new CustomEvent('daymark-sync-complete'));
  }
};
