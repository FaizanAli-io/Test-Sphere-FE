"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import api from "./useApi";

const HEALTH_CHECK_INTERVAL = 10000; // Check every 10 seconds
const HEALTH_CHECK_TIMEOUT = 5000; // 5 second timeout for health check
const INITIAL_RETRY_DELAY = 2000; // Start with 2 seconds
const MAX_RETRY_DELAY = 30000; // Max 30 seconds between retries

interface UseConnectionMonitorResult {
  isOnline: boolean;
  isChecking: boolean;
  lastChecked: Date | null;
  checkConnection: () => Promise<boolean>;
}

export const useConnectionMonitor = (enabled: boolean = true): UseConnectionMonitorResult => {
  const [isOnline, setIsOnline] = useState(true);
  const [isChecking, setIsChecking] = useState(false);
  const [lastChecked, setLastChecked] = useState<Date | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const retryDelayRef = useRef<number>(INITIAL_RETRY_DELAY);
  const abortControllerRef = useRef<AbortController | null>(null);

  /**
   * Performs a health check against the backend
   */
  const checkConnection = useCallback(async (): Promise<boolean> => {
    // Cancel any ongoing check
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    abortControllerRef.current = new AbortController();
    setIsChecking(true);

    try {
      const timeoutId = setTimeout(() => {
        abortControllerRef.current?.abort();
      }, HEALTH_CHECK_TIMEOUT);

      const response = await api("/api/health", {
        method: "GET",
        signal: abortControllerRef.current.signal,
      });

      clearTimeout(timeoutId);

      const online = response.ok;
      setIsOnline(online);
      setLastChecked(new Date());

      // Reset retry delay on success
      if (online) {
        retryDelayRef.current = INITIAL_RETRY_DELAY;
      }

      return online;
    } catch (error) {
      console.warn("Health check failed:", error);
      setIsOnline(false);
      setLastChecked(new Date());
      return false;
    } finally {
      setIsChecking(false);
      abortControllerRef.current = null;
    }
  }, []);

  /**
   * Sets up periodic connection checking with exponential backoff when offline
   */
  useEffect(() => {
    if (!enabled) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      return;
    }

    // Initial check
    checkConnection();

    // Setup interval
    const setupInterval = () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }

      const delay = isOnline ? HEALTH_CHECK_INTERVAL : retryDelayRef.current;

      intervalRef.current = setInterval(async () => {
        const online = await checkConnection();

        // If offline, increase retry delay (exponential backoff)
        if (!online) {
          retryDelayRef.current = Math.min(retryDelayRef.current * 1.5, MAX_RETRY_DELAY);
          setupInterval(); // Reset interval with new delay
        }
      }, delay);
    };

    setupInterval();

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [enabled, checkConnection, isOnline]);

  /**
   * Listen to browser online/offline events as a fallback
   */
  useEffect(() => {
    if (!enabled) return;

    const handleOnline = () => {
      console.log("Browser reports online status");
      checkConnection();
    };

    const handleOffline = () => {
      console.log("Browser reports offline status");
      setIsOnline(false);
      setLastChecked(new Date());
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, [enabled, checkConnection]);

  return {
    isOnline,
    isChecking,
    lastChecked,
    checkConnection,
  };
};
