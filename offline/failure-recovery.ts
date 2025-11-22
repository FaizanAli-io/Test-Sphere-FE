/**
 * Offline Exam System - Failure Recovery Manager
 *
 * Manages automatic recovery from sync failures with intelligent retry strategies.
 * Tracks failed items, manages retry queues, and implements exponential backoff.
 */

import { OFFLINE_CONFIG } from "./config";
import { FailedSyncItem, SyncFailureReport } from "./types";
import { openDatabase } from "./storage";

const FAILURE_QUEUE_STORE = "failureRetryQueue";

/**
 * Initialize failure recovery store
 */
export async function initializeFailureStore(): Promise<void> {
  const db = await openDatabase();

  // Create stores if they don't exist
  if (!db.objectStoreNames.contains(FAILURE_QUEUE_STORE)) {
    // Note: This should ideally be in the upgrade handler, but we'll try to create it if needed
    console.log("⚠️ Failure queue store should be created in db upgrade");
  }
}

/**
 * Add a failed item to the retry queue
 */
export async function addToFailureQueue(
  id: string,
  type: "log" | "submission",
  failureReason: string,
  attemptCount: number,
  logType?: string
): Promise<void> {
  const db = await openDatabase();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction([FAILURE_QUEUE_STORE], "readwrite");
    const store = transaction.objectStore(FAILURE_QUEUE_STORE);

    // Calculate next retry time with exponential backoff
    const baseDelay = OFFLINE_CONFIG.retryDelayMs;
    const exponentialDelay = baseDelay * Math.pow(2, attemptCount - 1);
    const nextRetryTime = new Date(Date.now() + exponentialDelay).toISOString();

    // Check if error is retryable
    const isRetryable =
      !failureReason.includes("Unauthorized") &&
      !failureReason.includes("Forbidden") &&
      !failureReason.includes("Not found");

    const failedItem: FailedSyncItem = {
      id,
      type,
      logType: logType as
        | "WEBCAM_PHOTO"
        | "SCREENSHOT"
        | "FOCUS_CHANGE"
        | "MOUSECLICK"
        | "KEYSTROKE"
        | undefined,
      failureReason,
      attemptCount,
      lastAttemptTime: new Date().toISOString(),
      nextRetryTime,
      isRetryable,
    };

    const request = store.put(failedItem);

    request.onsuccess = () => {
      console.log(`📋 Added to retry queue: ${id} (attempt ${attemptCount})`);
      resolve();
    };

    request.onerror = () => {
      reject(new Error("Failed to add item to failure queue"));
    };
  });
}

/**
 * Get all items ready for retry
 */
export async function getItemsReadyForRetry(): Promise<FailedSyncItem[]> {
  const db = await openDatabase();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction([FAILURE_QUEUE_STORE], "readonly");
    const store = transaction.objectStore(FAILURE_QUEUE_STORE);
    const request = store.getAll();

    request.onsuccess = () => {
      const allItems = request.result as FailedSyncItem[];
      const now = new Date();

      // Filter items that are:
      // 1. Retryable
      // 2. Not exceeding max attempts
      // 3. Ready for retry (nextRetryTime has passed)
      const readyItems = allItems.filter((item) => {
        const nextRetryTime = new Date(item.nextRetryTime);
        return (
          item.isRetryable &&
          item.attemptCount < OFFLINE_CONFIG.maxRetryAttempts &&
          nextRetryTime <= now
        );
      });

      resolve(readyItems);
    };

    request.onerror = () => {
      reject(new Error("Failed to retrieve items for retry"));
    };
  });
}

/**
 * Remove item from failure queue (after successful retry)
 */
export async function removeFromFailureQueue(id: string): Promise<void> {
  const db = await openDatabase();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction([FAILURE_QUEUE_STORE], "readwrite");
    const store = transaction.objectStore(FAILURE_QUEUE_STORE);
    const request = store.delete(id);

    request.onsuccess = () => {
      console.log(`✅ Removed from retry queue: ${id}`);
      resolve();
    };

    request.onerror = () => {
      reject(new Error("Failed to remove item from failure queue"));
    };
  });
}

/**
 * Update failure item attempt count
 */
export async function updateFailureRetryCount(
  id: string,
  newAttemptCount: number
): Promise<void> {
  const db = await openDatabase();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction([FAILURE_QUEUE_STORE], "readwrite");
    const store = transaction.objectStore(FAILURE_QUEUE_STORE);
    const getRequest = store.get(id);

    getRequest.onsuccess = () => {
      const item = getRequest.result as FailedSyncItem;
      if (!item) {
        reject(new Error("Item not found in failure queue"));
        return;
      }

      // Calculate next retry time
      const baseDelay = OFFLINE_CONFIG.retryDelayMs;
      const exponentialDelay = baseDelay * Math.pow(2, newAttemptCount - 1);
      const nextRetryTime = new Date(
        Date.now() + exponentialDelay
      ).toISOString();

      item.attemptCount = newAttemptCount;
      item.lastAttemptTime = new Date().toISOString();
      item.nextRetryTime = nextRetryTime;

      const putRequest = store.put(item);
      putRequest.onsuccess = () => resolve();
      putRequest.onerror = () =>
        reject(new Error("Failed to update retry count"));
    };

    getRequest.onerror = () => {
      reject(new Error("Failed to retrieve item from failure queue"));
    };
  });
}

/**
 * Get failure report with stats
 */
export async function getFailureReport(): Promise<SyncFailureReport> {
  const db = await openDatabase();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction([FAILURE_QUEUE_STORE], "readonly");
    const store = transaction.objectStore(FAILURE_QUEUE_STORE);
    const request = store.getAll();

    request.onsuccess = () => {
      const allItems = request.result as FailedSyncItem[];

      const retryableCount = allItems.filter((item) => item.isRetryable).length;
      const permanentFailures = allItems.filter(
        (item) => !item.isRetryable
      ).length;

      resolve({
        totalFailed: allItems.length,
        failedItems: allItems,
        retryableCount,
        permanentFailures,
        lastFailureTime:
          allItems.length > 0
            ? allItems[allItems.length - 1].lastAttemptTime
            : "",
      });
    };

    request.onerror = () => {
      reject(new Error("Failed to generate failure report"));
    };
  });
}

/**
 * Clear all failures (manual reset)
 */
export async function clearAllFailures(): Promise<void> {
  const db = await openDatabase();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction([FAILURE_QUEUE_STORE], "readwrite");
    const store = transaction.objectStore(FAILURE_QUEUE_STORE);
    const request = store.clear();

    request.onsuccess = () => {
      console.log("✅ Cleared all failure records");
      resolve();
    };

    request.onerror = () => {
      reject(new Error("Failed to clear failures"));
    };
  });
}

/**
 * Check if permanent failures exist (non-retryable)
 */
export async function hasPermanentFailures(): Promise<boolean> {
  const report = await getFailureReport();
  return report.permanentFailures > 0;
}

/**
 * Get count of items ready for retry
 */
export async function getReadyForRetryCount(): Promise<number> {
  const readyItems = await getItemsReadyForRetry();
  return readyItems.length;
}
