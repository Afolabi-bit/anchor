// Offline-First IndexedDB Persistence & Sync Engine
const DB_NAME = "anchor_offline_db";
const DB_VERSION = 1;
const STORE_PENDING = "pending_checkins";
const STORE_CACHE = "local_cache";

export interface PendingCheckIn {
  id: string;
  commitmentId?: string;
  date: string;
  type: "morning" | "evening";
  payload: any;
  createdAt: number;
}

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof window === "undefined" || !window.indexedDB) {
      return reject(new Error("IndexedDB is not supported"));
    }

    const request = window.indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_PENDING)) {
        db.createObjectStore(STORE_PENDING, { keyPath: "id" });
      }
      if (!db.objectStoreNames.contains(STORE_CACHE)) {
        db.createObjectStore(STORE_CACHE, { keyPath: "key" });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

// ----------------- QUEUE MANAGEMENT -----------------

export async function enqueuePendingCheckIn(data: {
  commitmentId?: string;
  date: string;
  type: "morning" | "evening";
  payload: any;
}): Promise<PendingCheckIn> {
  const db = await openDB();
  const item: PendingCheckIn = {
    id: `${data.date}_${data.type}_${data.commitmentId || "default"}_${Date.now()}`,
    commitmentId: data.commitmentId,
    date: data.date,
    type: data.type,
    payload: data.payload,
    createdAt: Date.now(),
  };

  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_PENDING, "readwrite");
    const store = tx.objectStore(STORE_PENDING);
    const req = store.put(item);
    req.onsuccess = () => resolve(item);
    req.onerror = () => reject(req.error);
  });
}

export async function getPendingCheckIns(): Promise<PendingCheckIn[]> {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_PENDING, "readonly");
      const store = tx.objectStore(STORE_PENDING);
      const req = store.getAll();
      req.onsuccess = () => resolve(req.result || []);
      req.onerror = () => reject(req.error);
    });
  } catch {
    return [];
  }
}

export async function removePendingCheckIn(id: string): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_PENDING, "readwrite");
    const store = tx.objectStore(STORE_PENDING);
    const req = store.delete(id);
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
}

export async function flushPendingCheckIns(): Promise<{
  syncedCount: number;
  failedCount: number;
}> {
  if (typeof window === "undefined" || !navigator.onLine) {
    return { syncedCount: 0, failedCount: 0 };
  }

  const items = await getPendingCheckIns();
  if (items.length === 0) return { syncedCount: 0, failedCount: 0 };

  let syncedCount = 0;
  let failedCount = 0;

  for (const item of items) {
    try {
      const res = await fetch("/api/checkins", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          date: item.date,
          type: item.type,
          commitmentId: item.commitmentId,
          ...item.payload,
        }),
      });

      if (res.ok) {
        await removePendingCheckIn(item.id);
        syncedCount++;
      } else {
        failedCount++;
      }
    } catch {
      failedCount++;
    }
  }

  return { syncedCount, failedCount };
}

// ----------------- LOCAL SNAPSHOT CACHE -----------------

export async function setLocalSnapshot(key: string, value: any): Promise<void> {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_CACHE, "readwrite");
      const store = tx.objectStore(STORE_CACHE);
      const req = store.put({ key, value, timestamp: Date.now() });
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  } catch (e) {
    console.error("Local cache write error:", e);
  }
}

export async function getLocalSnapshot<T>(key: string): Promise<T | null> {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_CACHE, "readonly");
      const store = tx.objectStore(STORE_CACHE);
      const req = store.get(key);
      req.onsuccess = () => resolve(req.result ? req.result.value : null);
      req.onerror = () => reject(req.error);
    });
  } catch {
    return null;
  }
}
