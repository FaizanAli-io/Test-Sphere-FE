/**
 * Offline Exam System - IndexedDB Storage Manager
 *
 * Manages all IndexedDB operations for storing proctoring logs,
 * submissions, and sync metadata.
 */

import { OFFLINE_CONFIG, STORES, METADATA_KEYS } from "./config";
import {
  ProctoringLog,
  OfflineSubmission,
  LogSyncCheckpoint,
  StorageStats,
  ProctoringLogType,
} from "./types";
import { generateEncryptionKey, exportKey, importKey } from "./encryption";

/**
 * Initialize and open IndexedDB database
 */
export async function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(
      OFFLINE_CONFIG.dbName,
      OFFLINE_CONFIG.dbVersion
    );

    request.onerror = () => {
      reject(new Error("Failed to open IndexedDB"));
    };

    request.onsuccess = () => {
      resolve(request.result);
    };

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;

      // Create object stores if they don't exist
      if (!db.objectStoreNames.contains(STORES.PROCTORING_LOGS)) {
        const logStore = db.createObjectStore(STORES.PROCTORING_LOGS, {
          keyPath: "id",
        });
        logStore.createIndex("submissionId", "submissionId", { unique: false });
        logStore.createIndex("logType", "logType", { unique: false });
        logStore.createIndex("timestamp", "timestamp", { unique: false });
      }

      if (!db.objectStoreNames.contains(STORES.SUBMISSIONS)) {
        const submissionStore = db.createObjectStore(STORES.SUBMISSIONS, {
          keyPath: "id",
        });
        submissionStore.createIndex("submissionId", "submissionId", {
          unique: false,
        });
        submissionStore.createIndex("synced", "synced", { unique: false });
      }

      if (!db.objectStoreNames.contains(STORES.SYNC_CHECKPOINTS)) {
        const checkpointStore = db.createObjectStore(STORES.SYNC_CHECKPOINTS, {
          keyPath: "logId",
        });
        checkpointStore.createIndex("status", "status", { unique: false });
      }

      if (!db.objectStoreNames.contains(STORES.METADATA)) {
        db.createObjectStore(STORES.METADATA);
      }
    };
  });
}

/**
 * Get or create encryption key from metadata store
 */
export async function getOrCreateEncryptionKey(): Promise<CryptoKey> {
  const db = await openDatabase();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORES.METADATA], "readwrite");
    const store = transaction.objectStore(STORES.METADATA);
    const getRequest = store.get(METADATA_KEYS.ENCRYPTION_KEY);

    getRequest.onsuccess = async () => {
      if (getRequest.result) {
        // Key exists, import and return it
        try {
          const key = await importKey(getRequest.result);
          resolve(key);
        } catch (error) {
          reject(error);
        }
      } else {
        // Generate new key
        try {
          const key = await generateEncryptionKey();
          const jwk = await exportKey(key);

          // Store the key
          const putRequest = store.put(jwk, METADATA_KEYS.ENCRYPTION_KEY);
          putRequest.onsuccess = () => resolve(key);
          putRequest.onerror = () =>
            reject(new Error("Failed to store encryption key"));
        } catch (error) {
          reject(error);
        }
      }
    };

    getRequest.onerror = () => {
      reject(new Error("Failed to retrieve encryption key"));
    };
  });
}

/**
 * Store a proctoring log in IndexedDB
 */
export async function storeProctoringLog(log: ProctoringLog): Promise<void> {
  const db = await openDatabase();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction(
      [STORES.PROCTORING_LOGS, STORES.SYNC_CHECKPOINTS],
      "readwrite"
    );
    const logStore = transaction.objectStore(STORES.PROCTORING_LOGS);
    const checkpointStore = transaction.objectStore(STORES.SYNC_CHECKPOINTS);

    // Store the log
    const logRequest = logStore.add(log);

    logRequest.onsuccess = () => {
      // Create sync checkpoint
      const checkpoint: LogSyncCheckpoint = {
        logId: log.id,
        logType: log.logType,
        status: "pending",
        attemptCount: 0,
        lastAttempt: null,
      };

      const checkpointRequest = checkpointStore.add(checkpoint);

      checkpointRequest.onsuccess = () => {
        console.log(`✅ Stored ${log.logType} log offline:`, log.id);
        resolve();
      };

      checkpointRequest.onerror = () => {
        reject(new Error("Failed to create sync checkpoint"));
      };
    };

    logRequest.onerror = () => {
      reject(new Error("Failed to store proctoring log"));
    };
  });
}

/**
 * Store an offline submission in IndexedDB
 */
export async function storeOfflineSubmission(
  submission: OfflineSubmission
): Promise<void> {
  const db = await openDatabase();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORES.SUBMISSIONS], "readwrite");
    const store = transaction.objectStore(STORES.SUBMISSIONS);

    const request = store.add(submission);

    request.onsuccess = () => {
      console.log("✅ Stored offline submission:", submission.id);
      resolve();
    };

    request.onerror = () => {
      reject(new Error("Failed to store offline submission"));
    };
  });
}

/**
 * Get all pending (unsynced) proctoring logs
 */
export async function getPendingLogs(): Promise<ProctoringLog[]> {
  const db = await openDatabase();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction(
      [STORES.PROCTORING_LOGS, STORES.SYNC_CHECKPOINTS],
      "readonly"
    );
    const checkpointStore = transaction.objectStore(STORES.SYNC_CHECKPOINTS);
    const logStore = transaction.objectStore(STORES.PROCTORING_LOGS);

    // Get all pending checkpoints
    const checkpointIndex = checkpointStore.index("status");
    const checkpointRequest = checkpointIndex.getAll("pending");

    checkpointRequest.onsuccess = () => {
      const checkpoints = checkpointRequest.result as LogSyncCheckpoint[];
      const logPromises = checkpoints.map((checkpoint) => {
        return new Promise<ProctoringLog | null>((res) => {
          const logRequest = logStore.get(checkpoint.logId);
          logRequest.onsuccess = () => res(logRequest.result as ProctoringLog);
          logRequest.onerror = () => res(null);
        });
      });

      Promise.all(logPromises).then((logs) => {
        resolve(logs.filter((log) => log !== null) as ProctoringLog[]);
      });
    };

    checkpointRequest.onerror = () => {
      reject(new Error("Failed to retrieve pending logs"));
    };
  });
}

/**
 * Get all unsynced submissions
 */
export async function getUnsyncedSubmissions(): Promise<OfflineSubmission[]> {
  const db = await openDatabase();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORES.SUBMISSIONS], "readonly");
    const store = transaction.objectStore(STORES.SUBMISSIONS);
    const request = store.getAll();

    request.onsuccess = () => {
      const allSubmissions = request.result as OfflineSubmission[];
      // Filter for unsynced submissions
      const unsynced = allSubmissions.filter(
        (submission) => !submission.synced
      );
      resolve(unsynced);
    };

    request.onerror = () => {
      reject(new Error("Failed to retrieve unsynced submissions"));
    };
  });
}

/**
 * Update sync checkpoint status
 */
export async function updateSyncCheckpoint(
  logId: string,
  status: LogSyncCheckpoint["status"],
  error?: string
): Promise<void> {
  const db = await openDatabase();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORES.SYNC_CHECKPOINTS], "readwrite");
    const store = transaction.objectStore(STORES.SYNC_CHECKPOINTS);
    const getRequest = store.get(logId);

    getRequest.onsuccess = () => {
      const checkpoint = getRequest.result as LogSyncCheckpoint;
      if (!checkpoint) {
        reject(new Error("Checkpoint not found"));
        return;
      }

      checkpoint.status = status;
      checkpoint.attemptCount += 1;
      checkpoint.lastAttempt = new Date().toISOString();
      if (error) {
        checkpoint.error = error;
      }

      const updateRequest = store.put(checkpoint);
      updateRequest.onsuccess = () => resolve();
      updateRequest.onerror = () =>
        reject(new Error("Failed to update checkpoint"));
    };

    getRequest.onerror = () => {
      reject(new Error("Failed to retrieve checkpoint"));
    };
  });
}

/**
 * Mark a log as synced and remove it from storage
 */
export async function markLogAsSynced(logId: string): Promise<void> {
  const db = await openDatabase();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction(
      [STORES.PROCTORING_LOGS, STORES.SYNC_CHECKPOINTS],
      "readwrite"
    );
    const logStore = transaction.objectStore(STORES.PROCTORING_LOGS);
    const checkpointStore = transaction.objectStore(STORES.SYNC_CHECKPOINTS);

    // Delete log
    const deleteLogRequest = logStore.delete(logId);
    deleteLogRequest.onsuccess = () => {
      // Delete checkpoint
      const deleteCheckpointRequest = checkpointStore.delete(logId);
      deleteCheckpointRequest.onsuccess = () => {
        console.log("✅ Marked log as synced and removed:", logId);
        resolve();
      };
      deleteCheckpointRequest.onerror = () => {
        reject(new Error("Failed to delete checkpoint"));
      };
    };

    deleteLogRequest.onerror = () => {
      reject(new Error("Failed to delete log"));
    };
  });
}

/**
 * Mark a submission as synced
 */
export async function markSubmissionAsSynced(
  submissionId: string
): Promise<void> {
  const db = await openDatabase();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORES.SUBMISSIONS], "readwrite");
    const store = transaction.objectStore(STORES.SUBMISSIONS);
    const getRequest = store.get(submissionId);

    getRequest.onsuccess = () => {
      const submission = getRequest.result as OfflineSubmission;
      if (!submission) {
        reject(new Error("Submission not found"));
        return;
      }

      submission.synced = true;
      const updateRequest = store.put(submission);
      updateRequest.onsuccess = () => {
        console.log("✅ Marked submission as synced:", submissionId);
        resolve();
      };
      updateRequest.onerror = () =>
        reject(new Error("Failed to update submission"));
    };

    getRequest.onerror = () => {
      reject(new Error("Failed to retrieve submission"));
    };
  });
}

/**
 * Get storage statistics
 */
export async function getStorageStats(): Promise<StorageStats> {
  const db = await openDatabase();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction(
      [STORES.PROCTORING_LOGS, STORES.SUBMISSIONS],
      "readonly"
    );
    const logStore = transaction.objectStore(STORES.PROCTORING_LOGS);
    const submissionStore = transaction.objectStore(STORES.SUBMISSIONS);

    const logCountRequest = logStore.count();
    const submissionCountRequest = submissionStore.count();

    let totalLogs = 0;
    let totalSubmissions = 0;
    const logsByType: Record<ProctoringLogType, number> = {
      WEBCAM_PHOTO: 0,
      SCREENSHOT: 0,
      FOCUS_CHANGE: 0,
      MOUSECLICK: 0,
      KEYSTROKE: 0,
    };

    logCountRequest.onsuccess = () => {
      totalLogs = logCountRequest.result;

      // Count by type
      const getAllRequest = logStore.getAll();
      getAllRequest.onsuccess = () => {
        const logs = getAllRequest.result as ProctoringLog[];
        logs.forEach((log) => {
          logsByType[log.logType]++;
        });

        submissionCountRequest.onsuccess = () => {
          totalSubmissions = submissionCountRequest.result;

          resolve({
            totalLogs,
            logsByType,
            totalSubmissions,
            estimatedSizeBytes: 0, // TODO: Calculate actual size if needed
          });
        };
      };
    };

    logCountRequest.onerror = () => {
      reject(new Error("Failed to get storage stats"));
    };
  });
}

/**
 * Clear all offline data (for testing or cleanup)
 */
export async function clearAllOfflineData(): Promise<void> {
  const db = await openDatabase();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction(
      [STORES.PROCTORING_LOGS, STORES.SUBMISSIONS, STORES.SYNC_CHECKPOINTS],
      "readwrite"
    );

    transaction.oncomplete = () => {
      console.log("✅ Cleared all offline data");
      resolve();
    };

    transaction.onerror = () => {
      reject(new Error("Failed to clear offline data"));
    };

    transaction.objectStore(STORES.PROCTORING_LOGS).clear();
    transaction.objectStore(STORES.SUBMISSIONS).clear();
    transaction.objectStore(STORES.SYNC_CHECKPOINTS).clear();
  });
}

/**
 * Get a specific proctoring log by ID
 */
export async function getLogById(logId: string): Promise<ProctoringLog | null> {
  const db = await openDatabase();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORES.PROCTORING_LOGS], "readonly");
    const store = transaction.objectStore(STORES.PROCTORING_LOGS);
    const request = store.get(logId);

    request.onsuccess = () => {
      const log = request.result as ProctoringLog | undefined;
      resolve(log || null);
    };

    request.onerror = () => {
      reject(new Error(`Failed to retrieve log ${logId}`));
    };
  });
}

/**
 * Get a specific submission by ID
 */
export async function getSubmissionById(
  submissionId: string
): Promise<OfflineSubmission | null> {
  const db = await openDatabase();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORES.SUBMISSIONS], "readonly");
    const store = transaction.objectStore(STORES.SUBMISSIONS);
    const request = store.get(submissionId);

    request.onsuccess = () => {
      const submission = request.result as OfflineSubmission | undefined;
      resolve(submission || null);
    };

    request.onerror = () => {
      reject(new Error(`Failed to retrieve submission ${submissionId}`));
    };
  });
}
