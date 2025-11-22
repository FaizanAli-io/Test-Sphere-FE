/**
 * Offline Exam System - Proctoring Manager
 *
 * Manages offline storage of proctoring logs (screenshots, webcam, events).
 * Automatically stores logs locally when backend is unreachable.
 */

import {
  WebcamPhotoLog,
  ScreenshotLog,
  FocusChangeLog,
  MouseClickLog,
  KeystrokeLog,
} from "./types";
import { getOrCreateEncryptionKey, storeProctoringLog } from "./storage";
import { encryptBlob } from "./encryption";
import { getNetworkMonitor } from "./network-monitor";

/**
 * Generate a UUID using crypto.randomUUID
 */
function generateUUID(): string {
  return crypto.randomUUID();
}

/**
 * Save a webcam photo offline
 */
export async function saveWebcamPhotoOffline(
  submissionId: number,
  blob: Blob,
  takenAt: string
): Promise<void> {
  try {
    const key = await getOrCreateEncryptionKey();
    const encryptedBlob = await encryptBlob(blob, key);

    const log: WebcamPhotoLog = {
      id: generateUUID(),
      submissionId,
      logType: "WEBCAM_PHOTO",
      timestamp: new Date().toISOString(),
      encrypted: true,
      data: {
        blob: encryptedBlob,
        takenAt,
      },
    };

    await storeProctoringLog(log);
    console.log("📷 Saved webcam photo offline");
  } catch (error) {
    console.error("❌ Failed to save webcam photo offline:", error);
    throw error;
  }
}

/**
 * Save a screenshot offline
 */
export async function saveScreenshotOffline(
  submissionId: number,
  blob: Blob,
  takenAt: string
): Promise<void> {
  try {
    const key = await getOrCreateEncryptionKey();
    const encryptedBlob = await encryptBlob(blob, key);

    const log: ScreenshotLog = {
      id: generateUUID(),
      submissionId,
      logType: "SCREENSHOT",
      timestamp: new Date().toISOString(),
      encrypted: true,
      data: {
        blob: encryptedBlob,
        takenAt,
      },
    };

    await storeProctoringLog(log);
    console.log("🖥️ Saved screenshot offline");
  } catch (error) {
    console.error("❌ Failed to save screenshot offline:", error);
    throw error;
  }
}

/**
 * Save focus change events offline (batched)
 */
export async function saveFocusChangesOffline(
  submissionId: number,
  events: Array<{ duration: number; loggedAt: string }>
): Promise<void> {
  try {
    for (const event of events) {
      const log: FocusChangeLog = {
        id: generateUUID(),
        submissionId,
        logType: "FOCUS_CHANGE",
        timestamp: new Date().toISOString(),
        encrypted: false,
        data: {
          duration: event.duration,
          loggedAt: event.loggedAt,
        },
      };

      await storeProctoringLog(log);
    }
    console.log(`👁️ Saved ${events.length} focus change events offline`);
  } catch (error) {
    console.error("❌ Failed to save focus changes offline:", error);
    throw error;
  }
}

/**
 * Save mouse click events offline (batched)
 */
export async function saveMouseClicksOffline(
  submissionId: number,
  events: Array<{
    type: "LEFT" | "RIGHT";
    position: [number, number];
    loggedAt: string;
  }>
): Promise<void> {
  try {
    for (const event of events) {
      const log: MouseClickLog = {
        id: generateUUID(),
        submissionId,
        logType: "MOUSECLICK",
        timestamp: new Date().toISOString(),
        encrypted: false,
        data: {
          type: event.type,
          position: event.position,
          loggedAt: event.loggedAt,
        },
      };

      await storeProctoringLog(log);
    }
    console.log(`🖱️ Saved ${events.length} mouse click events offline`);
  } catch (error) {
    console.error("❌ Failed to save mouse clicks offline:", error);
    throw error;
  }
}

/**
 * Save keystroke events offline (batched)
 */
export async function saveKeystrokesOffline(
  submissionId: number,
  events: Array<{ key: string; loggedAt: string }>
): Promise<void> {
  try {
    for (const event of events) {
      const log: KeystrokeLog = {
        id: generateUUID(),
        submissionId,
        logType: "KEYSTROKE",
        timestamp: new Date().toISOString(),
        encrypted: false,
        data: {
          key: event.key,
          loggedAt: event.loggedAt,
        },
      };

      await storeProctoringLog(log);
    }
    console.log(`⌨️ Saved ${events.length} keystroke events offline`);
  } catch (error) {
    console.error("❌ Failed to save keystrokes offline:", error);
    throw error;
  }
}

/**
 * Check if system should store logs offline
 */
export function shouldStoreOffline(): boolean {
  try {
    const monitor = getNetworkMonitor();
    const status = monitor.getStatus();

    // Store offline if:
    // 1. Browser thinks it's offline, OR
    // 2. Backend is not reachable
    const isOffline = !status.isOnline || !status.isBackendReachable;

    return isOffline;
  } catch {
    // If monitor not initialized yet, assume we should store offline to be safe
    // This ensures logs are captured from the very start
    console.log(
      "⚠️ Network monitor not initialized yet, storing logs offline as precaution"
    );
    return true;
  }
}
