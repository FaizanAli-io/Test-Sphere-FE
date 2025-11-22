/**
 * Offline Exam System - React Hooks
 *
 * React hooks for integrating offline functionality into components.
 */

"use client";

import { useEffect, useState, useCallback } from "react";
import {
  NetworkStatus,
  SyncProgress,
  StorageStats,
  SyncFailureReport,
} from "./types";
import { getNetworkMonitor } from "./network-monitor";
import { getSyncEngine } from "./sync-engine";
import { getStorageStats } from "./storage";
import { API_BASE_URL } from "@/hooks/useApi";

/**
 * Hook to monitor network status and offline mode
 */
export function useNetworkStatus() {
  const [status, setStatus] = useState<NetworkStatus>({
    isOnline: true,
    isBackendReachable: true,
    lastChecked: new Date().toISOString(),
  });

  useEffect(() => {
    const monitor = getNetworkMonitor(API_BASE_URL);
    monitor.start();

    const unsubscribe = monitor.subscribe((newStatus) => {
      setStatus(newStatus);
    });

    return () => {
      unsubscribe();
      monitor.stop();
    };
  }, []);

  const checkNow = useCallback(async () => {
    const monitor = getNetworkMonitor();
    const newStatus = await monitor.checkNow();
    setStatus(newStatus);
  }, []);

  const isOfflineMode =
    status.isOnline === false || status.isBackendReachable === false;

  return {
    ...status,
    isOfflineMode,
    checkNow,
  };
}

/**
 * Hook to monitor sync progress
 */
export function useSyncProgress() {
  const [progress, setProgress] = useState<SyncProgress>({
    totalPending: 0,
    totalSynced: 0,
    totalFailed: 0,
    currentlySyncing: false,
    lastSyncAttempt: null,
    lastSuccessfulSync: null,
  });

  useEffect(() => {
    const syncEngine = getSyncEngine();
    const unsubscribe = syncEngine.subscribeToProgress((newProgress) => {
      setProgress(newProgress);
    });

    return unsubscribe;
  }, []);

  const syncNow = useCallback(async () => {
    const syncEngine = getSyncEngine();
    return await syncEngine.syncAll();
  }, []);

  const remainingCount = progress.totalPending - progress.totalSynced;
  const syncPercentage =
    progress.totalPending > 0
      ? (progress.totalSynced / progress.totalPending) * 100
      : 0;

  return {
    ...progress,
    remainingCount,
    syncPercentage,
    syncNow,
  };
}

/**
 * Hook to get offline storage statistics
 */
export function useOfflineStats() {
  const [stats, setStats] = useState<StorageStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const newStats = await getStorageStats();
      setStats(newStats);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to get storage stats"
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return {
    stats,
    loading,
    error,
    refresh,
  };
}

/**
 * Hook to monitor automatic failure recovery status
 */
export function useFailureStatus() {
  const [failureStatus, setFailureStatus] = useState<SyncFailureReport | null>(
    null
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refreshStatus = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const syncEngine = getSyncEngine();
      const status = await syncEngine.getFailureStatus();
      setFailureStatus(status);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to get failure status"
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshStatus();

    // Poll for failure status updates every 5 seconds
    const interval = setInterval(refreshStatus, 5000);

    return () => clearInterval(interval);
  }, [refreshStatus]);

  const hasRetryableFailures =
    failureStatus && failureStatus.retryableCount > 0;
  const hasPermanentFailures =
    failureStatus && failureStatus.permanentFailures > 0;
  const totalFailures =
    (failureStatus?.retryableCount ?? 0) +
    (failureStatus?.permanentFailures ?? 0);

  return {
    failureStatus,
    loading,
    error,
    hasRetryableFailures,
    hasPermanentFailures,
    totalFailures,
    refreshStatus,
  };
}

/**
 * Combined hook for offline system status
 */
export function useOfflineSystem() {
  const networkStatus = useNetworkStatus();
  const syncProgress = useSyncProgress();
  const offlineStats = useOfflineStats();
  const failureStatus = useFailureStatus();

  return {
    network: networkStatus,
    sync: syncProgress,
    storage: offlineStats,
    failures: failureStatus,
  };
}
