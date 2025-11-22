/**
 * Offline Exam System - Submission Manager
 *
 * Manages offline storage of test submissions when backend is unreachable.
 */

import { OfflineSubmission, Answer } from "./types";
import { storeOfflineSubmission } from "./storage";
import { getNetworkMonitor } from "./network-monitor";

/**
 * Generate a UUID using crypto.randomUUID
 */
function generateUUID(): string {
  return crypto.randomUUID();
}

/**
 * Save a test submission offline
 */
export async function saveSubmissionOffline(
  submissionId: number,
  testId: number,
  answers: Answer[],
): Promise<void> {
  try {
    const submission: OfflineSubmission = {
      id: generateUUID(),
      submissionId,
      testId,
      answers,
      timestamp: new Date().toISOString(),
      synced: false,
    };

    await storeOfflineSubmission(submission);
    console.log("✅ Saved submission offline:", submission.id);
  } catch (error) {
    console.error("❌ Failed to save submission offline:", error);
    throw error;
  }
}

/**
 * Check if system should store submission offline
 */
export function shouldStoreSubmissionOffline(): boolean {
  try {
    const monitor = getNetworkMonitor();
    return monitor.isOfflineMode();
  } catch {
    // If monitor not initialized, assume online
    return false;
  }
}
