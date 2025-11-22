/**
 * Offline Exam System - Configuration
 *
 * Central configuration for the offline exam functionality.
 */

import { OfflineConfig } from "./types";

export const OFFLINE_CONFIG: OfflineConfig = {
  // Enable/disable encryption for stored data
  encryptionEnabled: true,

  // Maximum number of retry attempts for failed uploads
  maxRetryAttempts: 5,

  // Delay between retry attempts (exponential backoff will be applied)
  retryDelayMs: 2000,

  // Number of logs to sync in each batch
  syncBatchSize: 10,

  // How often to check backend health when online (30 seconds)
  backendHealthCheckIntervalMs: 30000,

  // IndexedDB database name
  dbName: "OfflineExamDB",

  // IndexedDB database version
  dbVersion: 1,

  // Automatic retry configuration
  autoRetryEnabled: true, // Enable automatic retry of failed items
  autoRetryIntervalMs: 5000, // Retry every 5 seconds if failures exist
  permanentFailureThreshold: 7, // Give up after 7 days
};

// Store names in IndexedDB
export const STORES = {
  PROCTORING_LOGS: "proctoringLogs",
  SUBMISSIONS: "submissions",
  SYNC_CHECKPOINTS: "syncCheckpoints",
  METADATA: "metadata",
} as const;

// Keys for metadata store
export const METADATA_KEYS = {
  LAST_SYNC: "lastSync",
  NETWORK_STATUS: "networkStatus",
  ENCRYPTION_KEY: "encryptionKey",
} as const;
