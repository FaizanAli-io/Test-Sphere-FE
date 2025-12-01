"use client";

import { useEffect, useRef, useCallback, useState } from "react";

import api from "@/hooks/useApi";
import {
  FocusChangeEvent,
  MouseClickEvent,
  KeystrokeEvent,
  FocusChangeMetaPayload,
  MouseClickMetaPayload,
  KeystrokeMetaPayload,
} from "../types/systemEvents";
import { TEST_SECURITY_CONFIG } from "../constants";
import { storeOfflineLog } from "@/utils/offlineStorage";

interface OfflineUploadedCounts {
  screenshots: number;
  webcamPhotos: number;
  focusChanges: number;
  clicks: number;
  keystrokes: number;
}

interface UseSystemEventMonitoringProps {
  submissionId: number | null;
  isTestActive: boolean;
  isOnline?: boolean;
  offlineUploadedCounts?: OfflineUploadedCounts;
}

interface SystemEventStats {
  focusChanges: { total: number; uploaded: number };
  clicks: { total: number; uploaded: number };
  keystrokes: { total: number; uploaded: number };
}

export const useSystemEventMonitoring = ({
  submissionId,
  isTestActive,
  isOnline = true,
  offlineUploadedCounts,
}: UseSystemEventMonitoringProps): SystemEventStats => {
  // Event buffers for each event type
  const focusChangeBufferRef = useRef<FocusChangeEvent[]>([]);
  const mouseClickBufferRef = useRef<MouseClickEvent[]>([]);
  const keystrokeBufferRef = useRef<KeystrokeEvent[]>([]);

  // Stats tracking
  const statsRef = useRef<SystemEventStats>({
    focusChanges: { total: 0, uploaded: 0 },
    clicks: { total: 0, uploaded: 0 },
    keystrokes: { total: 0, uploaded: 0 },
  });

  // Track focus state
  const lastFocusLostTimeRef = useRef<number | null>(null);
  const uploadIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const [stats, setStats] = useState<SystemEventStats>(statsRef.current);

  // Update stats when offline logs are uploaded
  useEffect(() => {
    if (offlineUploadedCounts) {
      if (offlineUploadedCounts.focusChanges > 0) {
        statsRef.current.focusChanges.uploaded += offlineUploadedCounts.focusChanges;
      }
      if (offlineUploadedCounts.clicks > 0) {
        statsRef.current.clicks.uploaded += offlineUploadedCounts.clicks;
      }
      if (offlineUploadedCounts.keystrokes > 0) {
        statsRef.current.keystrokes.uploaded += offlineUploadedCounts.keystrokes;
      }
      if (
        offlineUploadedCounts.focusChanges > 0 ||
        offlineUploadedCounts.clicks > 0 ||
        offlineUploadedCounts.keystrokes > 0
      ) {
        setStats({ ...statsRef.current });
      }
    }
  }, [offlineUploadedCounts]);

  /**
   * Upload buffered events to backend (or store offline if disconnected)
   */
  const uploadBufferedEvents = useCallback(async () => {
    if (!submissionId) return;

    const focusChanges = [...focusChangeBufferRef.current];
    const mouseClicks = [...mouseClickBufferRef.current];
    const keystrokes = [...keystrokeBufferRef.current];

    // Clear buffers immediately after copying
    focusChangeBufferRef.current = [];
    mouseClickBufferRef.current = [];
    keystrokeBufferRef.current = [];

    // If offline, store all events in IndexedDB
    if (!isOnline) {
      console.log("🔌 Offline: Storing system events in IndexedDB");
      try {
        const promises = [];

        if (focusChanges.length > 0) {
          const meta: FocusChangeMetaPayload[] = focusChanges.map((event) => ({
            duration: event.duration,
            loggedAt: event.loggedAt,
          }));
          promises.push(
            storeOfflineLog(submissionId, "FOCUS_CHANGE", {
              submissionId,
              logType: "FOCUS_CHANGE",
              meta,
            }),
          );
        }

        if (mouseClicks.length > 0) {
          const meta: MouseClickMetaPayload[] = mouseClicks.map((event) => ({
            type: event.buttonType,
            position: event.position,
            loggedAt: event.loggedAt,
          }));
          promises.push(
            storeOfflineLog(submissionId, "MOUSECLICK", {
              submissionId,
              logType: "MOUSECLICK",
              meta,
            }),
          );
        }

        if (keystrokes.length > 0) {
          const meta: KeystrokeMetaPayload[] = keystrokes.map((event) => ({
            key: event.key,
            loggedAt: event.loggedAt,
          }));
          promises.push(
            storeOfflineLog(submissionId, "KEYSTROKE", {
              submissionId,
              logType: "KEYSTROKE",
              meta,
            }),
          );
        }

        await Promise.all(promises);
        console.log(`📦 Stored ${promises.length} system event batch(es) offline`);
      } catch (error) {
        console.error("❌ Failed to store system events offline:", error);
      }
      return;
    }

    // Online: upload all event types in a single batch array
    try {
      const logsToUpload = [];

      if (focusChanges.length > 0) {
        const meta: FocusChangeMetaPayload[] = focusChanges.map((event) => ({
          duration: event.duration,
          loggedAt: event.loggedAt,
        }));
        logsToUpload.push({
          logType: "FOCUS_CHANGE",
          submissionId,
          meta,
        });
      }

      if (mouseClicks.length > 0) {
        const meta: MouseClickMetaPayload[] = mouseClicks.map((event) => ({
          type: event.buttonType,
          position: event.position,
          loggedAt: event.loggedAt,
        }));
        logsToUpload.push({
          logType: "MOUSECLICK",
          submissionId,
          meta,
        });
      }

      if (keystrokes.length > 0) {
        const meta: KeystrokeMetaPayload[] = keystrokes.map((event) => ({
          key: event.key,
          loggedAt: event.loggedAt,
        }));
        logsToUpload.push({
          logType: "KEYSTROKE",
          submissionId,
          meta,
        });
      }

      if (logsToUpload.length > 0) {
        console.log(`📤 Uploading ${logsToUpload.length} log type(s) in batch`);
        const response = await api("/proctoring-logs/batch", {
          auth: true,
          method: "POST",
          body: JSON.stringify({ logs: logsToUpload }),
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({ message: response.statusText }));
          console.error("❌ System events upload failed:", errorData);
          throw new Error(`Failed to upload system events: ${JSON.stringify(errorData)}`);
        }

        console.log("✅ System events uploaded successfully");

        // Update stats on successful upload
        statsRef.current.focusChanges.uploaded += focusChanges.length;
        statsRef.current.clicks.uploaded += mouseClicks.length;
        statsRef.current.keystrokes.uploaded += keystrokes.length;
        setStats({ ...statsRef.current });
      }
    } catch (error) {
      console.error("❌ Failed to upload system events:", error);
      // On error, store offline as fallback
      try {
        const promises = [];

        if (focusChanges.length > 0) {
          const meta: FocusChangeMetaPayload[] = focusChanges.map((event) => ({
            duration: event.duration,
            loggedAt: event.loggedAt,
          }));
          promises.push(
            storeOfflineLog(submissionId, "FOCUS_CHANGE", {
              submissionId,
              logType: "FOCUS_CHANGE",
              meta,
            }),
          );
        }

        if (mouseClicks.length > 0) {
          const meta: MouseClickMetaPayload[] = mouseClicks.map((event) => ({
            type: event.buttonType,
            position: event.position,
            loggedAt: event.loggedAt,
          }));
          promises.push(
            storeOfflineLog(submissionId, "MOUSECLICK", {
              submissionId,
              logType: "MOUSECLICK",
              meta,
            }),
          );
        }

        if (keystrokes.length > 0) {
          const meta: KeystrokeMetaPayload[] = keystrokes.map((event) => ({
            key: event.key,
            loggedAt: event.loggedAt,
          }));
          promises.push(
            storeOfflineLog(submissionId, "KEYSTROKE", {
              submissionId,
              logType: "KEYSTROKE",
              meta,
            }),
          );
        }

        await Promise.all(promises);
        console.log("💾 Stored failed uploads offline as fallback");
      } catch (fallbackError) {
        console.error("❌ Failed to store offline as fallback:", fallbackError);
      }
    }
  }, [submissionId, isOnline]);

  /**
   * Handle window/tab focus change
   */
  const handleVisibilityChange = useCallback(() => {
    if (!isTestActive) return;

    if (document.hidden) {
      // User switched away from the test tab
      lastFocusLostTimeRef.current = Date.now();
      console.log("👁️ User lost focus at:", new Date().toISOString());
    } else {
      // User returned to the test tab
      if (lastFocusLostTimeRef.current !== null) {
        const duration = Date.now() - lastFocusLostTimeRef.current;
        const event: FocusChangeEvent = {
          type: "FOCUS_CHANGE",
          duration,
          loggedAt: new Date().toISOString(),
        };
        focusChangeBufferRef.current.push(event);
        statsRef.current.focusChanges.total++;
        setStats({ ...statsRef.current });
        console.log(`👁️ User regained focus after ${duration}ms`);
        lastFocusLostTimeRef.current = null;
      }
    }
  }, [isTestActive]);

  /**
   * Handle blur event (window lost focus)
   */
  const handleBlur = useCallback(() => {
    if (!isTestActive) return;

    if (lastFocusLostTimeRef.current === null) {
      lastFocusLostTimeRef.current = Date.now();
      console.log("👁️ Window lost focus at:", new Date().toISOString());
    }
  }, [isTestActive]);

  /**
   * Handle focus event (window gained focus)
   */
  const handleFocus = useCallback(() => {
    if (!isTestActive) return;

    if (lastFocusLostTimeRef.current !== null) {
      const duration = Date.now() - lastFocusLostTimeRef.current;
      const event: FocusChangeEvent = {
        type: "FOCUS_CHANGE",
        duration,
        loggedAt: new Date().toISOString(),
      };
      focusChangeBufferRef.current.push(event);
      statsRef.current.focusChanges.total++;
      setStats({ ...statsRef.current });
      console.log(`👁️ Window regained focus after ${duration}ms`);
      lastFocusLostTimeRef.current = null;
    }
  }, [isTestActive]);

  /**
   * Handle mouse clicks
   */
  const handleMouseClick = useCallback(
    (e: MouseEvent) => {
      if (!isTestActive) return;

      const buttonType = e.button === 2 ? "RIGHT" : "LEFT";
      const event: MouseClickEvent = {
        type: "MOUSECLICK",
        buttonType,
        position: [e.clientX, e.clientY],
        loggedAt: new Date().toISOString(),
      };

      mouseClickBufferRef.current.push(event);
      statsRef.current.clicks.total++;
      setStats({ ...statsRef.current });
    },
    [isTestActive],
  );

  /**
   * Handle context menu (right-click)
   */
  const handleContextMenu = useCallback(
    (e: MouseEvent) => {
      if (!isTestActive) return;

      const event: MouseClickEvent = {
        type: "MOUSECLICK",
        buttonType: "RIGHT",
        position: [e.clientX, e.clientY],
        loggedAt: new Date().toISOString(),
      };

      mouseClickBufferRef.current.push(event);
      statsRef.current.clicks.total++;
      setStats({ ...statsRef.current });
    },
    [isTestActive],
  );

  /**
   * Handle keystrokes
   */
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (!isTestActive) return;

      const event: KeystrokeEvent = {
        type: "KEYSTROKE",
        key: e.key,
        loggedAt: new Date().toISOString(),
      };

      keystrokeBufferRef.current.push(event);
      statsRef.current.keystrokes.total++;
      setStats({ ...statsRef.current });
    },
    [isTestActive],
  );

  /**
   * Set up event listeners when test is active
   */
  useEffect(() => {
    if (!isTestActive || !submissionId) return;

    console.log("🎯 Starting system event monitoring");

    // Attach event listeners
    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("blur", handleBlur);
    window.addEventListener("focus", handleFocus);
    document.addEventListener("click", handleMouseClick);
    document.addEventListener("contextmenu", handleContextMenu);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      // Clean up event listeners
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("blur", handleBlur);
      window.removeEventListener("focus", handleFocus);
      document.removeEventListener("click", handleMouseClick);
      document.removeEventListener("contextmenu", handleContextMenu);
      document.removeEventListener("keydown", handleKeyDown);

      console.log("🛑 Stopped system event monitoring");
    };
  }, [
    isTestActive,
    submissionId,
    handleVisibilityChange,
    handleBlur,
    handleFocus,
    handleMouseClick,
    handleContextMenu,
    handleKeyDown,
  ]);

  /**
   * Set up periodic upload interval
   */
  useEffect(() => {
    if (!isTestActive || !submissionId) return;

    console.log(
      `⏱️ Starting system events upload interval (every ${TEST_SECURITY_CONFIG.SYSTEM_EVENTS_UPLOAD_INTERVAL_SECONDS}s)`,
    );

    // Upload immediately on start, then at intervals
    uploadBufferedEvents();

    uploadIntervalRef.current = setInterval(() => {
      uploadBufferedEvents();
    }, TEST_SECURITY_CONFIG.SYSTEM_EVENTS_UPLOAD_INTERVAL_SECONDS * 1000);

    return () => {
      if (uploadIntervalRef.current) {
        clearInterval(uploadIntervalRef.current);
        uploadIntervalRef.current = null;
      }

      // Upload any remaining buffered events on cleanup
      uploadBufferedEvents();
    };
  }, [isTestActive, submissionId, uploadBufferedEvents]);

  return stats;
};
