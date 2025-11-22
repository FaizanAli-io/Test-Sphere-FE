/**
 * Offline Exam System - Sync Engine
 *
 * Handles synchronization of offline data to backend when connection is restored.
 * Includes retry logic, checkpointing, and progress tracking.
 */

import {
  ProctoringLog,
  WebcamPhotoLog,
  ScreenshotLog,
  FocusChangeLog,
  MouseClickLog,
  KeystrokeLog,
  OfflineSubmission,
  SyncProgress,
  SyncResult,
  FailedSyncItem,
  SyncFailureReport,
} from "./types";
import {
  getPendingLogs,
  getUnsyncedSubmissions,
  markLogAsSynced,
  markSubmissionAsSynced,
  updateSyncCheckpoint,
  getOrCreateEncryptionKey,
  getLogById,
  getSubmissionById,
} from "./storage";
import { decryptBlob } from "./encryption";
import { getNetworkMonitor } from "./network-monitor";
import { OFFLINE_CONFIG } from "./config";
import api from "@/hooks/useApi";
import {
  addToFailureQueue,
  getItemsReadyForRetry,
  removeFromFailureQueue,
  updateFailureRetryCount,
  getFailureReport,
} from "./failure-recovery";

type SyncProgressCallback = (progress: SyncProgress) => void;

export class SyncEngine {
  private isSyncing = false;
  private autoRetryInterval: number | null = null;
  private progressListeners: Set<SyncProgressCallback> = new Set();
  private currentProgress: SyncProgress = {
    totalPending: 0,
    totalSynced: 0,
    totalFailed: 0,
    currentlySyncing: false,
    lastSyncAttempt: null,
    lastSuccessfulSync: null,
  };

  constructor() {
    // Subscribe to network status changes
    const monitor = getNetworkMonitor();
    monitor.subscribe((status) => {
      if (status.isOnline && status.isBackendReachable && !this.isSyncing) {
        console.log("🌐 Connection restored, starting automatic sync...");
        this.syncAll().catch((error) => {
          console.error("❌ Automatic sync failed:", error);
        });
      }
    });

    // Start automatic retry loop for failed items
    this.startAutoRetryLoop();
  }

  /**
   * Subscribe to sync progress updates
   */
  public subscribeToProgress(callback: SyncProgressCallback): () => void {
    this.progressListeners.add(callback);

    // Immediately call with current progress
    callback(this.currentProgress);

    // Return unsubscribe function
    return () => {
      this.progressListeners.delete(callback);
    };
  }

  /**
   * Update sync progress and notify listeners
   */
  private updateProgress(updates: Partial<SyncProgress>): void {
    this.currentProgress = {
      ...this.currentProgress,
      ...updates,
    };

    this.progressListeners.forEach((callback) => {
      try {
        callback(this.currentProgress);
      } catch (error) {
        console.error("❌ Error in sync progress listener:", error);
      }
    });
  }

  /**
   * Sync all pending data (logs and submissions)
   */
  public async syncAll(): Promise<SyncResult> {
    if (this.isSyncing) {
      console.log("⏳ Sync already in progress");
      return {
        success: false,
        syncedCount: 0,
        failedCount: 0,
        errors: ["Sync already in progress"],
      };
    }

    // Check if backend is reachable
    const monitor = getNetworkMonitor();
    if (monitor.isOfflineMode()) {
      console.log("📴 Backend is not reachable, skipping sync");
      return {
        success: false,
        syncedCount: 0,
        failedCount: 0,
        errors: ["Backend is not reachable"],
      };
    }

    this.isSyncing = true;
    this.updateProgress({
      currentlySyncing: true,
      lastSyncAttempt: new Date().toISOString(),
    });

    try {
      console.log("🔄 Starting sync of all offline data...");

      // Get all pending data
      const [pendingLogs, unsyncedSubmissions] = await Promise.all([
        getPendingLogs(),
        getUnsyncedSubmissions(),
      ]);

      const totalPending = pendingLogs.length + unsyncedSubmissions.length;
      this.updateProgress({ totalPending });

      console.log(
        `📊 Found ${pendingLogs.length} logs and ${unsyncedSubmissions.length} submissions to sync`
      );

      let syncedCount = 0;
      let failedCount = 0;
      const errors: string[] = [];

      // Sync proctoring logs
      for (const log of pendingLogs) {
        try {
          await this.syncLog(log);
          syncedCount++;
          this.updateProgress({ totalSynced: syncedCount });
        } catch (error) {
          failedCount++;
          const errorMsg =
            error instanceof Error ? error.message : "Unknown error";
          errors.push(`Failed to sync log ${log.id}: ${errorMsg}`);
          console.error(`❌ Failed to sync log ${log.id}:`, error);

          // Queue for automatic retry with exponential backoff
          await addToFailureQueue(log.id, "log", errorMsg, 0, log.logType);
        }
      }

      // Sync submissions
      for (const submission of unsyncedSubmissions) {
        try {
          await this.syncSubmission(submission);
          syncedCount++;
          this.updateProgress({ totalSynced: syncedCount });
        } catch (error) {
          failedCount++;
          const errorMsg =
            error instanceof Error ? error.message : "Unknown error";
          errors.push(
            `Failed to sync submission ${submission.id}: ${errorMsg}`
          );
          console.error(
            `❌ Failed to sync submission ${submission.id}:`,
            error
          );

          // Queue for automatic retry with exponential backoff
          await addToFailureQueue(
            submission.id,
            "submission",
            errorMsg,
            0,
            undefined
          );
        }
      }

      const success = failedCount === 0;
      this.updateProgress({
        totalFailed: failedCount,
        lastSuccessfulSync: success
          ? new Date().toISOString()
          : this.currentProgress.lastSuccessfulSync,
      });

      console.log(
        `✅ Sync complete: ${syncedCount} synced, ${failedCount} failed`
      );

      return { success, syncedCount, failedCount, errors };
    } finally {
      this.isSyncing = false;
      this.updateProgress({ currentlySyncing: false });
    }
  }

  /**
   * Sync a single proctoring log with retry logic
   */
  private async syncLog(log: ProctoringLog): Promise<void> {
    const maxAttempts = OFFLINE_CONFIG.maxRetryAttempts;

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        await updateSyncCheckpoint(log.id, "syncing");

        switch (log.logType) {
          case "WEBCAM_PHOTO":
            await this.syncWebcamPhoto(log as WebcamPhotoLog);
            break;
          case "SCREENSHOT":
            await this.syncScreenshot(log as ScreenshotLog);
            break;
          case "FOCUS_CHANGE":
            await this.syncFocusChange(log as FocusChangeLog);
            break;
          case "MOUSECLICK":
            await this.syncMouseClick(log as MouseClickLog);
            break;
          case "KEYSTROKE":
            await this.syncKeystroke(log as KeystrokeLog);
            break;
        }

        // Mark as synced and remove from storage
        await markLogAsSynced(log.id);
        console.log(`✅ Successfully synced ${log.logType} log: ${log.id}`);
        return;
      } catch (error) {
        console.error(
          `❌ Attempt ${attempt}/${maxAttempts} failed for log ${log.id}:`,
          error
        );

        if (attempt < maxAttempts) {
          // Exponential backoff
          const delay = OFFLINE_CONFIG.retryDelayMs * Math.pow(2, attempt - 1);
          console.log(`⏳ Retrying in ${delay}ms...`);
          await new Promise((resolve) => setTimeout(resolve, delay));
        } else {
          // Max attempts reached, mark as failed
          await updateSyncCheckpoint(
            log.id,
            "failed",
            error instanceof Error ? error.message : "Unknown error"
          );
          throw error;
        }
      }
    }
  }

  /**
   * Sync webcam photo log
   */
  private async syncWebcamPhoto(log: WebcamPhotoLog): Promise<void> {
    const key = await getOrCreateEncryptionKey();
    const decryptedBlob = await decryptBlob(log.data.blob, key, "image/jpeg");

    // Upload to ImageKit
    const uploadResult = await this.uploadToImageKit(decryptedBlob, "webcam");

    // Send to backend
    const response = await api("/proctoring-logs", {
      auth: true,
      method: "POST",
      body: JSON.stringify({
        submissionId: log.submissionId,
        logType: "WEBCAM_PHOTO",
        meta: [
          {
            fileId: uploadResult.fileId,
            image: uploadResult.url,
            takenAt: log.data.takenAt,
          },
        ],
      }),
    });

    if (!response.ok) {
      throw new Error(`Failed to sync webcam photo: ${response.statusText}`);
    }
  }

  /**
   * Sync screenshot log
   */
  private async syncScreenshot(log: ScreenshotLog): Promise<void> {
    const key = await getOrCreateEncryptionKey();
    const decryptedBlob = await decryptBlob(log.data.blob, key, "image/jpeg");

    // Upload to ImageKit
    const uploadResult = await this.uploadToImageKit(
      decryptedBlob,
      "screenshot"
    );

    // Send to backend
    const response = await api("/proctoring-logs", {
      auth: true,
      method: "POST",
      body: JSON.stringify({
        submissionId: log.submissionId,
        logType: "SCREENSHOT",
        meta: [
          {
            fileId: uploadResult.fileId,
            image: uploadResult.url,
            takenAt: log.data.takenAt,
          },
        ],
      }),
    });

    if (!response.ok) {
      throw new Error(`Failed to sync screenshot: ${response.statusText}`);
    }
  }

  /**
   * Sync focus change log
   */
  private async syncFocusChange(log: FocusChangeLog): Promise<void> {
    const response = await api("/proctoring-logs", {
      auth: true,
      method: "POST",
      body: JSON.stringify({
        submissionId: log.submissionId,
        logType: "FOCUS_CHANGE",
        meta: [
          {
            duration: log.data.duration,
            loggedAt: log.data.loggedAt,
          },
        ],
      }),
    });

    if (!response.ok) {
      throw new Error(`Failed to sync focus change: ${response.statusText}`);
    }
  }

  /**
   * Sync mouse click log
   */
  private async syncMouseClick(log: MouseClickLog): Promise<void> {
    const response = await api("/proctoring-logs", {
      auth: true,
      method: "POST",
      body: JSON.stringify({
        submissionId: log.submissionId,
        logType: "MOUSECLICK",
        meta: [
          {
            type: log.data.type,
            position: log.data.position,
            loggedAt: log.data.loggedAt,
          },
        ],
      }),
    });

    if (!response.ok) {
      throw new Error(`Failed to sync mouse click: ${response.statusText}`);
    }
  }

  /**
   * Sync keystroke log
   */
  private async syncKeystroke(log: KeystrokeLog): Promise<void> {
    const response = await api("/proctoring-logs", {
      auth: true,
      method: "POST",
      body: JSON.stringify({
        submissionId: log.submissionId,
        logType: "KEYSTROKE",
        meta: [
          {
            key: log.data.key,
            loggedAt: log.data.loggedAt,
          },
        ],
      }),
    });

    if (!response.ok) {
      throw new Error(`Failed to sync keystroke: ${response.statusText}`);
    }
  }

  /**
   * Sync submission
   */
  private async syncSubmission(submission: OfflineSubmission): Promise<void> {
    const response = await api("/submissions/submit", {
      auth: true,
      method: "POST",
      body: JSON.stringify({
        answers: submission.answers,
      }),
    });

    if (!response.ok) {
      throw new Error(`Failed to sync submission: ${response.statusText}`);
    }

    await markSubmissionAsSynced(submission.id);
  }

  /**
   * Upload blob to ImageKit
   */
  private async uploadToImageKit(
    blob: Blob,
    type: "webcam" | "screenshot"
  ): Promise<{ fileId: string; url: string }> {
    // Get ImageKit signature from backend
    const signatureResponse = await api("/upload/signature", {
      method: "GET",
      auth: true,
    });

    if (!signatureResponse.ok) {
      throw new Error("Failed to get ImageKit signature");
    }

    const { signature, expire, token, publicKey } =
      await signatureResponse.json();

    // Upload to ImageKit
    const formData = new FormData();
    const fileName = `${type}_${Date.now()}.jpg`;
    formData.append("file", blob, fileName);
    formData.append("fileName", fileName);
    formData.append("folder", "/test-monitoring");
    formData.append("signature", signature);
    formData.append("expire", expire.toString());
    formData.append("token", token);
    formData.append("publicKey", publicKey);

    const uploadResponse = await fetch(
      "https://upload.imagekit.io/api/v1/files/upload",
      {
        method: "POST",
        body: formData,
      }
    );

    if (!uploadResponse.ok) {
      throw new Error(`ImageKit upload failed: ${uploadResponse.statusText}`);
    }

    const result = await uploadResponse.json();
    return {
      fileId: result.fileId,
      url: result.url,
    };
  }

  /**
   * Start automatic retry loop for failed items
   * Continuously checks for failed items ready to retry and attempts sync
   */
  private startAutoRetryLoop(): void {
    // Clear existing interval if any
    if (this.autoRetryInterval !== null) {
      clearInterval(this.autoRetryInterval);
    }

    this.autoRetryInterval = window.setInterval(async () => {
      try {
        const monitor = getNetworkMonitor();
        const status = monitor.getStatus();

        // Only retry if backend is reachable and not already syncing
        if (!status.isOnline || !status.isBackendReachable || this.isSyncing) {
          return;
        }

        // Get items ready for retry
        const readyItems = await getItemsReadyForRetry();

        if (readyItems.length === 0) {
          return;
        }

        console.log(
          `🔄 Found ${readyItems.length} items ready for automatic retry`
        );

        // Attempt to retry each item
        for (const item of readyItems) {
          try {
            await this.retryFailedItem(item);

            // Remove from failure queue on success
            await removeFromFailureQueue(item.id);
            console.log(`✅ Successfully retried failed item: ${item.id}`);
          } catch (error) {
            // Increment retry count with exponential backoff recalculation
            await updateFailureRetryCount(item.id, item.attemptCount + 1);
            console.error(`❌ Retry attempt failed for ${item.id}:`, error);
          }
        }
      } catch (error) {
        console.error("❌ Error in automatic retry loop:", error);
      }
    }, OFFLINE_CONFIG.autoRetryIntervalMs);
  }

  /**
   * Retry a failed item based on its type
   */
  private async retryFailedItem(item: FailedSyncItem): Promise<void> {
    if (item.type === "log") {
      // Retrieve the log from storage
      const log = await getLogById(item.id);
      if (!log) {
        throw new Error(`Log ${item.id} not found in storage`);
      }
      await this.syncLog(log);
    } else if (item.type === "submission") {
      // Retrieve the submission from storage
      const submission = await getSubmissionById(item.id);
      if (!submission) {
        throw new Error(`Submission ${item.id} not found in storage`);
      }
      await this.syncSubmission(submission);
    } else {
      throw new Error(`Unknown item type: ${item.type}`);
    }
  }

  /**
   * Get failure recovery status for UI monitoring
   */
  public async getFailureStatus(): Promise<SyncFailureReport> {
    return getFailureReport();
  }

  /**
   * Clean up resources (stop retry loop)
   */
  public destroy(): void {
    if (this.autoRetryInterval !== null) {
      clearInterval(this.autoRetryInterval);
      this.autoRetryInterval = null;
    }
    this.progressListeners.clear();
  }

  /**
   * Get current sync progress
   */
  public getProgress(): SyncProgress {
    return { ...this.currentProgress };
  }

  /**
   * Check if sync is currently running
   */
  public isSyncInProgress(): boolean {
    return this.isSyncing;
  }
}

// Singleton instance
let syncEngineInstance: SyncEngine | null = null;

/**
 * Get the singleton SyncEngine instance
 */
export function getSyncEngine(): SyncEngine {
  if (!syncEngineInstance) {
    syncEngineInstance = new SyncEngine();
  }
  return syncEngineInstance;
}
