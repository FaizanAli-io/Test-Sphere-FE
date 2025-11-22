/**
 * Offline Exam System - Type Definitions
 *
 * This module defines all TypeScript types and interfaces for the offline exam functionality.
 */

// ==================== Proctoring Log Types ====================

export type ProctoringLogType =
  | "WEBCAM_PHOTO"
  | "SCREENSHOT"
  | "FOCUS_CHANGE"
  | "MOUSECLICK"
  | "KEYSTROKE";

export interface BaseProctoringLog {
  id: string; // UUID generated on client
  submissionId: number;
  logType: ProctoringLogType;
  timestamp: string; // ISO timestamp when log was created
  encrypted: boolean; // Whether the data is encrypted
}

export interface WebcamPhotoLog extends BaseProctoringLog {
  logType: "WEBCAM_PHOTO";
  data: {
    blob: Blob; // Encrypted blob
    fileId?: string; // Will be set after upload
    url?: string; // Will be set after upload
    takenAt: string;
  };
}

export interface ScreenshotLog extends BaseProctoringLog {
  logType: "SCREENSHOT";
  data: {
    blob: Blob; // Encrypted blob
    fileId?: string;
    url?: string;
    takenAt: string;
  };
}

export interface FocusChangeLog extends BaseProctoringLog {
  logType: "FOCUS_CHANGE";
  data: {
    duration: number;
    loggedAt: string;
  };
}

export interface MouseClickLog extends BaseProctoringLog {
  logType: "MOUSECLICK";
  data: {
    type: "LEFT" | "RIGHT";
    position: [number, number];
    loggedAt: string;
  };
}

export interface KeystrokeLog extends BaseProctoringLog {
  logType: "KEYSTROKE";
  data: {
    key: string;
    loggedAt: string;
  };
}

export type ProctoringLog =
  | WebcamPhotoLog
  | ScreenshotLog
  | FocusChangeLog
  | MouseClickLog
  | KeystrokeLog;

// ==================== Submission Types ====================

export interface Answer {
  questionId: number;
  answer: string | null;
}

export interface OfflineSubmission {
  id: string; // UUID generated on client
  submissionId: number;
  testId: number;
  answers: Answer[];
  timestamp: string;
  synced: boolean;
}

// ==================== Sync Status Types ====================

export interface SyncProgress {
  totalPending: number;
  totalSynced: number;
  totalFailed: number;
  currentlySyncing: boolean;
  lastSyncAttempt: string | null;
  lastSuccessfulSync: string | null;
}

export interface SyncResult {
  success: boolean;
  syncedCount: number;
  failedCount: number;
  errors: string[];
}

export interface LogSyncCheckpoint {
  logId: string;
  logType: ProctoringLogType;
  status: "pending" | "syncing" | "synced" | "failed";
  attemptCount: number;
  lastAttempt: string | null;
  error?: string;
}

// ==================== Network Status Types ====================

export interface NetworkStatus {
  isOnline: boolean;
  isBackendReachable: boolean;
  lastChecked: string;
}

// ==================== Storage Types ====================

export interface StorageStats {
  totalLogs: number;
  logsByType: Record<ProctoringLogType, number>;
  totalSubmissions: number;
  estimatedSizeBytes: number;
}

// ==================== Sync Failure Types ====================

export interface FailedSyncItem {
  id: string; // Log or submission ID
  type: "log" | "submission";
  logType?: ProctoringLogType; // Only for logs
  failureReason: string;
  attemptCount: number;
  lastAttemptTime: string;
  nextRetryTime: string;
  isRetryable: boolean; // Some errors are not retryable
}

export interface SyncFailureReport {
  totalFailed: number;
  failedItems: FailedSyncItem[];
  retryableCount: number;
  permanentFailures: number;
  lastFailureTime: string;
}

// ==================== Configuration ====================

export interface OfflineConfig {
  encryptionEnabled: boolean;
  maxRetryAttempts: number;
  retryDelayMs: number;
  syncBatchSize: number;
  backendHealthCheckIntervalMs: number;
  dbName: string;
  dbVersion: number;
  // Automatic retry configuration
  autoRetryEnabled: boolean;
  autoRetryIntervalMs: number; // How often to retry failed items
  permanentFailureThreshold: number; // Days after which to give up
}
