"use client";

import { useEffect, useRef, useCallback } from "react";

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
import {
  shouldStoreOffline,
  saveFocusChangesOffline,
  saveMouseClicksOffline,
  saveKeystrokesOffline,
} from "../../../../offline";

interface UseSystemEventMonitoringProps {
  submissionId: number | null;
  isTestActive: boolean;
}

export const useSystemEventMonitoring = ({
  submissionId,
  isTestActive,
}: UseSystemEventMonitoringProps) => {
  // Event buffers for each event type
  const focusChangeBufferRef = useRef<FocusChangeEvent[]>([]);
  const mouseClickBufferRef = useRef<MouseClickEvent[]>([]);
  const keystrokeBufferRef = useRef<KeystrokeEvent[]>([]);

  // Track focus state
  const lastFocusLostTimeRef = useRef<number | null>(null);
  const uploadIntervalRef = useRef<NodeJS.Timeout | null>(null);

  /**
   * Upload buffered events to backend
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

    // Check if we should store offline
    if (shouldStoreOffline()) {
      console.log("📴 Storing system events offline");

      try {
        if (focusChanges.length > 0) {
          await saveFocusChangesOffline(
            submissionId,
            focusChanges.map((e) => ({
              duration: e.duration,
              loggedAt: e.loggedAt,
            }))
          );
        }

        if (mouseClicks.length > 0) {
          await saveMouseClicksOffline(
            submissionId,
            mouseClicks.map((e) => ({
              type: e.buttonType,
              position: e.position,
              loggedAt: e.loggedAt,
            }))
          );
        }

        if (keystrokes.length > 0) {
          await saveKeystrokesOffline(
            submissionId,
            keystrokes.map((e) => ({ key: e.key, loggedAt: e.loggedAt }))
          );
        }

        console.log("✅ System events stored offline");
      } catch (error) {
        console.error("❌ Failed to store system events offline:", error);
      }

      return;
    }

    // Online mode: Upload each event type if there are events
    try {
      if (focusChanges.length > 0) {
        console.log(`📤 Uploading ${focusChanges.length} focus change events`);
        const meta: FocusChangeMetaPayload[] = focusChanges.map((event) => ({
          duration: event.duration,
          loggedAt: event.loggedAt,
        }));

        const response = await api("/proctoring-logs", {
          auth: true,
          method: "POST",
          body: JSON.stringify({
            logType: "FOCUS_CHANGE",
            submissionId,
            meta: meta,
          }),
        });

        if (!response.ok) {
          console.log("⚠️ Focus change upload failed, storing offline");
          await saveFocusChangesOffline(
            submissionId,
            focusChanges.map((e) => ({
              duration: e.duration,
              loggedAt: e.loggedAt,
            }))
          );
        }
      }

      if (mouseClicks.length > 0) {
        console.log(`📤 Uploading ${mouseClicks.length} mouse click events`);
        const meta: MouseClickMetaPayload[] = mouseClicks.map((event) => ({
          type: event.buttonType,
          position: event.position,
          loggedAt: event.loggedAt,
        }));

        const response = await api("/proctoring-logs", {
          auth: true,
          method: "POST",
          body: JSON.stringify({
            logType: "MOUSECLICK",
            submissionId,
            meta: meta,
          }),
        });

        if (!response.ok) {
          console.log("⚠️ Mouse click upload failed, storing offline");
          await saveMouseClicksOffline(
            submissionId,
            mouseClicks.map((e) => ({
              type: e.buttonType,
              position: e.position,
              loggedAt: e.loggedAt,
            }))
          );
        }
      }

      if (keystrokes.length > 0) {
        console.log(`📤 Uploading ${keystrokes.length} keystroke events`);
        const meta: KeystrokeMetaPayload[] = keystrokes.map((event) => ({
          key: event.key,
          loggedAt: event.loggedAt,
        }));

        const response = await api("/proctoring-logs", {
          auth: true,
          method: "POST",
          body: JSON.stringify({
            logType: "KEYSTROKE",
            submissionId,
            meta: meta,
          }),
        });

        if (!response.ok) {
          console.log("⚠️ Keystroke upload failed, storing offline");
          await saveKeystrokesOffline(
            submissionId,
            keystrokes.map((e) => ({ key: e.key, loggedAt: e.loggedAt }))
          );
        }
      }

      if (
        focusChanges.length > 0 ||
        mouseClicks.length > 0 ||
        keystrokes.length > 0
      ) {
        console.log("✅ System events uploaded successfully");
      }
    } catch (error) {
      console.error("❌ Failed to upload system events:", error);
    }
  }, [submissionId]);

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
    },
    [isTestActive]
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
    },
    [isTestActive]
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
    },
    [isTestActive]
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
      `⏱️ Starting system events upload interval (every ${TEST_SECURITY_CONFIG.SYSTEM_EVENTS_UPLOAD_INTERVAL_SECONDS}s)`
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

  return {
    // Return event counts for debugging/display if needed
    getFocusChangeCount: () => focusChangeBufferRef.current.length,
    getMouseClickCount: () => mouseClickBufferRef.current.length,
    getKeystrokeCount: () => keystrokeBufferRef.current.length,
  };
};
