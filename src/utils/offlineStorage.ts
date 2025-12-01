import { encryptData, decryptData } from "./encryption";

const DB_NAME = "ProctoringLogsDB";
const DB_VERSION = 1;
const STORE_NAME = "offline_logs";

export interface OfflineLog {
  id?: number;
  submissionId: number;
  logType: string;
  encryptedData: string;
  timestamp: number;
  uploadAttempts: number;
}

/**
 * Opens the IndexedDB database
 */
function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => {
      reject(new Error("Failed to open IndexedDB"));
    };

    request.onsuccess = () => {
      resolve(request.result);
    };

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;

      // Create object store if it doesn't exist
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const objectStore = db.createObjectStore(STORE_NAME, {
          keyPath: "id",
          autoIncrement: true,
        });

        // Create indexes
        objectStore.createIndex("submissionId", "submissionId", { unique: false });
        objectStore.createIndex("timestamp", "timestamp", { unique: false });
        objectStore.createIndex("logType", "logType", { unique: false });
      }
    };
  });
}

/**
 * Stores a log entry in IndexedDB with encryption
 */
export async function storeOfflineLog(
  submissionId: number,
  logType: string,
  data: unknown,
): Promise<number> {
  try {
    // Encrypt the data
    const encryptedData = await encryptData(data, submissionId);

    const db = await openDatabase();

    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORE_NAME], "readwrite");
      const store = transaction.objectStore(STORE_NAME);

      const log: Omit<OfflineLog, "id"> = {
        submissionId,
        logType,
        encryptedData,
        timestamp: Date.now(),
        uploadAttempts: 0,
      };

      const request = store.add(log);

      request.onsuccess = () => {
        resolve(request.result as number);
      };

      request.onerror = () => {
        reject(new Error("Failed to store offline log"));
      };

      transaction.oncomplete = () => {
        db.close();
      };
    });
  } catch (error) {
    console.error("Failed to store offline log:", error);
    throw error;
  }
}

/**
 * Retrieves all offline logs for a specific submission
 */
export async function getOfflineLogs(submissionId: number): Promise<OfflineLog[]> {
  try {
    const db = await openDatabase();

    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORE_NAME], "readonly");
      const store = transaction.objectStore(STORE_NAME);
      const index = store.index("submissionId");
      const request = index.getAll(submissionId);

      request.onsuccess = () => {
        resolve(request.result || []);
      };

      request.onerror = () => {
        reject(new Error("Failed to retrieve offline logs"));
      };

      transaction.oncomplete = () => {
        db.close();
      };
    });
  } catch (error) {
    console.error("Failed to get offline logs:", error);
    return [];
  }
}

/**
 * Retrieves and decrypts a specific offline log
 */
export async function getDecryptedLog<T = unknown>(
  logId: number,
  submissionId: number,
): Promise<T | null> {
  try {
    const db = await openDatabase();

    const log = await new Promise<OfflineLog | null>((resolve, reject) => {
      const transaction = db.transaction([STORE_NAME], "readonly");
      const store = transaction.objectStore(STORE_NAME);
      const request = store.get(logId);

      request.onsuccess = () => {
        resolve(request.result || null);
      };

      request.onerror = () => {
        reject(new Error("Failed to retrieve log"));
      };

      transaction.oncomplete = () => {
        db.close();
      };
    });

    if (!log) return null;

    // Decrypt the data
    return await decryptData<T>(log.encryptedData, submissionId);
  } catch (error) {
    console.error("Failed to get decrypted log:", error);
    return null;
  }
}

/**
 * Deletes a specific offline log
 */
export async function deleteOfflineLog(logId: number): Promise<void> {
  try {
    const db = await openDatabase();

    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORE_NAME], "readwrite");
      const store = transaction.objectStore(STORE_NAME);
      const request = store.delete(logId);

      request.onsuccess = () => {
        resolve();
      };

      request.onerror = () => {
        reject(new Error("Failed to delete offline log"));
      };

      transaction.oncomplete = () => {
        db.close();
      };
    });
  } catch (error) {
    console.error("Failed to delete offline log:", error);
    throw error;
  }
}

/**
 * Deletes all offline logs for a specific submission
 */
export async function clearOfflineLogs(submissionId: number): Promise<void> {
  try {
    const logs = await getOfflineLogs(submissionId);
    const db = await openDatabase();

    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORE_NAME], "readwrite");
      const store = transaction.objectStore(STORE_NAME);

      let completed = 0;
      let hasError = false;

      logs.forEach((log) => {
        if (log.id) {
          const request = store.delete(log.id);

          request.onsuccess = () => {
            completed++;
            if (completed === logs.length && !hasError) {
              resolve();
            }
          };

          request.onerror = () => {
            hasError = true;
            reject(new Error("Failed to clear offline logs"));
          };
        }
      });

      if (logs.length === 0) {
        resolve();
      }

      transaction.oncomplete = () => {
        db.close();
      };
    });
  } catch (error) {
    console.error("Failed to clear offline logs:", error);
    throw error;
  }
}

/**
 * Increments the upload attempt counter for a log
 */
export async function incrementUploadAttempts(logId: number): Promise<void> {
  try {
    const db = await openDatabase();

    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORE_NAME], "readwrite");
      const store = transaction.objectStore(STORE_NAME);
      const getRequest = store.get(logId);

      getRequest.onsuccess = () => {
        const log = getRequest.result as OfflineLog;
        if (log) {
          log.uploadAttempts += 1;
          const updateRequest = store.put(log);

          updateRequest.onsuccess = () => {
            resolve();
          };

          updateRequest.onerror = () => {
            reject(new Error("Failed to update upload attempts"));
          };
        } else {
          resolve();
        }
      };

      getRequest.onerror = () => {
        reject(new Error("Failed to get log for update"));
      };

      transaction.oncomplete = () => {
        db.close();
      };
    });
  } catch (error) {
    console.error("Failed to increment upload attempts:", error);
  }
}

/**
 * Gets count of pending offline logs for a submission
 */
export async function getPendingLogsCount(submissionId: number): Promise<number> {
  try {
    const logs = await getOfflineLogs(submissionId);
    return logs.length;
  } catch (error) {
    console.error("Failed to get pending logs count:", error);
    return 0;
  }
}
