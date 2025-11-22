/**
 * Offline Exam System - Main Entry Point
 *
 * Exports all public APIs for the offline exam functionality.
 */

// Types
export type {
  ProctoringLog,
  ProctoringLogType,
  WebcamPhotoLog,
  ScreenshotLog,
  FocusChangeLog,
  MouseClickLog,
  KeystrokeLog,
  OfflineSubmission,
  Answer,
  NetworkStatus,
  SyncProgress,
  SyncResult,
  StorageStats,
} from "./types";

// Configuration
export { OFFLINE_CONFIG, STORES, METADATA_KEYS } from "./config";

// Network Monitor
export { NetworkMonitor, getNetworkMonitor } from "./network-monitor";

// Storage
export {
  openDatabase,
  getOrCreateEncryptionKey,
  storeProctoringLog,
  storeOfflineSubmission,
  getPendingLogs,
  getUnsyncedSubmissions,
  markLogAsSynced,
  markSubmissionAsSynced,
  getStorageStats,
  clearAllOfflineData,
} from "./storage";

// Proctoring Manager
export {
  saveWebcamPhotoOffline,
  saveScreenshotOffline,
  saveFocusChangesOffline,
  saveMouseClicksOffline,
  saveKeystrokesOffline,
  shouldStoreOffline,
} from "./proctoring-manager";

// Submission Manager
export { saveSubmissionOffline, shouldStoreSubmissionOffline } from "./submission-manager";

// Sync Engine
export { SyncEngine, getSyncEngine } from "./sync-engine";

// React Hooks
export { useNetworkStatus, useSyncProgress, useOfflineStats, useOfflineSystem } from "./hooks";
