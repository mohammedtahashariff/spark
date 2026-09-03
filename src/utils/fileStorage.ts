/**
 * IndexedDB Permanent File Storage for Resumes & Documents
 * Eliminates browser localStorage quota limitations by storing binary/PDF data in IndexedDB.
 */

const DB_NAME = 'SparkEnterpriseFileDB';
const DB_VERSION = 1;
const STORE_NAME = 'trainer_resumes';

function openFileDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !window.indexedDB) {
      reject(new Error('IndexedDB is not available in this environment.'));
      return;
    }

    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export interface StoredResumeFile {
  name: string;
  url: string; // Base64 Data URL or Blob URL
  size: string;
  uploadedAt: string;
}

export async function savePermanentResume(trainerId: string, fileData: StoredResumeFile): Promise<void> {
  try {
    const db = await openFileDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      store.put(fileData, `resume_${trainerId}`);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  } catch (err) {
    console.error('[FileStorage] Error saving resume to IndexedDB:', err);
  }
}

export async function getPermanentResume(trainerId: string): Promise<StoredResumeFile | null> {
  try {
    const db = await openFileDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const req = store.get(`resume_${trainerId}`);
      req.onsuccess = () => resolve(req.result || null);
      req.onerror = () => reject(req.error);
    });
  } catch (err) {
    console.error('[FileStorage] Error reading resume from IndexedDB:', err);
    return null;
  }
}

export async function deletePermanentResume(trainerId: string): Promise<void> {
  try {
    const db = await openFileDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      store.delete(`resume_${trainerId}`);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  } catch (err) {
    console.error('[FileStorage] Error deleting resume from IndexedDB:', err);
  }
}
