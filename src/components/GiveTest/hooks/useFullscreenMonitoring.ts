"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { FullscreenElement, FullscreenDocument } from "../types/fullscreen";

interface UseFullscreenMonitoringProps {
  submissionId: number | null; // Not used in frontend-only implementation but kept for API consistency
  isTestActive: boolean;
  onViolationLimit: () => void;
}

interface ViolationLog {
  type: "FULLSCREEN_EXIT";
  timestamp: string;
  details: string;
}

export const useFullscreenMonitoring = ({
  // submissionId intentionally unused in frontend-only implementation
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  submissionId: _,
  isTestActive,
  onViolationLimit,
}: UseFullscreenMonitoringProps) => {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [violationCount, setViolationCount] = useState(0);
  const [showViolationWarning, setShowViolationWarning] = useState(false);
  const [countdownSeconds, setCountdownSeconds] = useState(5);
  const [violationLogs, setViolationLogs] = useState<ViolationLog[]>([]);
  const hasEnteredFullscreen = useRef(false);
  const warningTimeout = useRef<NodeJS.Timeout | null>(null);
  const countdownInterval = useRef<NodeJS.Timeout | null>(null);
  const isProcessingViolation = useRef(false);
  const reentryAttemptRef = useRef<NodeJS.Timeout | null>(null);

  const MAX_VIOLATIONS = 2;

  // Check if fullscreen is supported
  const isFullscreenSupported = useCallback(() => {
    const doc = document as FullscreenDocument;
    return !!(
      document.fullscreenEnabled ||
      doc.webkitFullscreenEnabled ||
      doc.mozFullScreenEnabled ||
      doc.msFullscreenEnabled
    );
  }, []);

  // Check current fullscreen status
  const checkFullscreenStatus = useCallback(() => {
    const doc = document as FullscreenDocument;
    const isCurrentlyFullscreen = !!(
      document.fullscreenElement ||
      doc.webkitFullscreenElement ||
      doc.mozFullScreenElement ||
      doc.msFullscreenElement
    );

    return isCurrentlyFullscreen;
  }, []);

  // Enter fullscreen mode with enhanced monitoring
  const enterFullscreen = useCallback(async (): Promise<boolean> => {
    try {
      const element = document.documentElement as FullscreenElement;

      if (element.requestFullscreen) {
        await element.requestFullscreen();
      } else if (element.webkitRequestFullscreen) {
        await element.webkitRequestFullscreen();
      } else if (element.mozRequestFullScreen) {
        await element.mozRequestFullScreen();
      } else if (element.msRequestFullscreen) {
        await element.msRequestFullscreen();
      } else {
        return false;
      }

      // Wait a bit and then check if fullscreen was successful
      setTimeout(() => {
        const isNowFullscreen = checkFullscreenStatus();
        if (isNowFullscreen) {
          hasEnteredFullscreen.current = true;
          setIsFullscreen(true);
        }
      }, 200);

      return true;
    } catch {
      return false;
    }
  }, [checkFullscreenStatus]);

  // Force immediate fullscreen re-entry with retry logic
  const forceFullscreenReentry = useCallback(async () => {
    if (!isTestActive || !hasEnteredFullscreen.current) return;

    // Clear any existing reentry timeout
    if (reentryAttemptRef.current) {
      clearTimeout(reentryAttemptRef.current);
    }

    // Attempt immediate re-entry
    await enterFullscreen();

    // Set up retry mechanism
    reentryAttemptRef.current = setTimeout(async () => {
      const currentStatus = checkFullscreenStatus();
      if (!currentStatus && isTestActive && hasEnteredFullscreen.current) {
        await enterFullscreen();
      }
    }, 300);
  }, [isTestActive, enterFullscreen, checkFullscreenStatus]);

  // Exit fullscreen mode
  const exitFullscreen = useCallback(async () => {
    try {
      const doc = document as FullscreenDocument;

      if (document.exitFullscreen) {
        await document.exitFullscreen();
      } else if (doc.webkitExitFullscreen) {
        await doc.webkitExitFullscreen();
      } else if (doc.mozCancelFullScreen) {
        await doc.mozCancelFullScreen();
      } else if (doc.msExitFullscreen) {
        await doc.msExitFullscreen();
      }
    } catch {
      // Failed to exit fullscreen
    }
  }, []);

  // Log violation locally (frontend only)
  const logViolation = useCallback(() => {
    // Only frontend logging - no backend calls needed
  }, []);

  // Start countdown timer for violation warning
  const startViolationCountdown = useCallback(() => {
    setCountdownSeconds(5);
    setShowViolationWarning(true);

    // Clear any existing countdown
    if (countdownInterval.current) {
      clearInterval(countdownInterval.current);
    }

    // Start countdown
    countdownInterval.current = setInterval(() => {
      setCountdownSeconds((prev) => {
        if (prev <= 1) {
          // Time's up - auto submit test - defer to avoid render-phase state update
          clearInterval(countdownInterval.current!);
          setShowViolationWarning(false);
          setTimeout(() => onViolationLimit(), 0);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    // Backup timeout as failsafe
    if (warningTimeout.current) {
      clearTimeout(warningTimeout.current);
    }
    warningTimeout.current = setTimeout(() => {
      setShowViolationWarning(false);
      isProcessingViolation.current = false;
      // Defer to avoid render-phase state update
      setTimeout(() => onViolationLimit(), 0);
    }, 5500);
  }, [onViolationLimit]);

  // Handle fullscreen exit violation
  const handleFullscreenViolation = useCallback(async () => {
    if (
      !isTestActive ||
      !hasEnteredFullscreen.current ||
      isProcessingViolation.current
    ) {
      return;
    }

    isProcessingViolation.current = true;

    const newViolationCount = violationCount + 1;
    const violationLog: ViolationLog = {
      type: "FULLSCREEN_EXIT",
      timestamp: new Date().toISOString(),
      details: `User exited fullscreen mode. Violation ${newViolationCount}/${MAX_VIOLATIONS}`,
    };

    setViolationCount(newViolationCount);
    setViolationLogs((prev) => [...prev, violationLog]);

    // Log locally (frontend only)
    logViolation();

    if (newViolationCount >= MAX_VIOLATIONS) {
      // Auto-submit test immediately - defer to avoid render-phase state update
      setTimeout(() => onViolationLimit(), 0);
    } else {
      // Start countdown warning with auto-submission
      startViolationCountdown();
    }
  }, [
    isTestActive,
    violationCount,
    logViolation,
    onViolationLimit,
    startViolationCountdown,
  ]);

  // Dismiss violation warning manually and re-enter fullscreen
  const dismissWarning = useCallback(() => {
    // Clear countdown and warning
    if (countdownInterval.current) {
      clearInterval(countdownInterval.current);
      countdownInterval.current = null;
    }
    if (warningTimeout.current) {
      clearTimeout(warningTimeout.current);
      warningTimeout.current = null;
    }

    setShowViolationWarning(false);
    setCountdownSeconds(5);
    isProcessingViolation.current = false;

    // Re-enter fullscreen mode
    enterFullscreen();
  }, [enterFullscreen]);

  // Handle fullscreen change events with immediate re-entry
  const handleFullscreenChange = useCallback(() => {
    const isCurrentlyFullscreen = checkFullscreenStatus();
    const wasFullscreen = isFullscreen;

    setIsFullscreen(isCurrentlyFullscreen);

    // If we were in fullscreen and now we're not - immediate action
    if (
      wasFullscreen &&
      !isCurrentlyFullscreen &&
      hasEnteredFullscreen.current &&
      isTestActive
    ) {
      // 1. Immediately try to re-enter fullscreen
      forceFullscreenReentry();

      // 2. Handle the violation (if not already processing)
      if (!isProcessingViolation.current) {
        handleFullscreenViolation();
      }
    }
  }, [
    isFullscreen,
    handleFullscreenViolation,
    checkFullscreenStatus,
    isTestActive,
    forceFullscreenReentry,
  ]);

  // Initialize fullscreen status when test becomes active
  useEffect(() => {
    if (isTestActive && !hasEnteredFullscreen.current) {
      const currentStatus = checkFullscreenStatus();
      setIsFullscreen(currentStatus);
    }
  }, [isTestActive, checkFullscreenStatus]);

  // Set up comprehensive fullscreen monitoring
  useEffect(() => {
    if (!isTestActive) return;

    const events = [
      "fullscreenchange",
      "webkitfullscreenchange",
      "mozfullscreenchange",
      "msfullscreenchange",
    ];

    events.forEach((event) => {
      document.addEventListener(event, handleFullscreenChange, {
        passive: true,
      });
    });

    // Backup monitoring strategies
    const handleKeyDown = (event: KeyboardEvent) => {
      if (
        event.key === "Escape" &&
        isTestActive &&
        hasEnteredFullscreen.current
      ) {
        setTimeout(() => {
          const currentStatus = checkFullscreenStatus();
          if (!currentStatus) {
            forceFullscreenReentry();
          }
        }, 100);
      }
    };

    // Periodic check for immediate detection
    const intervalCheck = setInterval(() => {
      if (isTestActive && hasEnteredFullscreen.current) {
        const currentStatus = checkFullscreenStatus();
        if (currentStatus !== isFullscreen) {
          handleFullscreenChange();
        }
      }
    }, 1000); // Check every second

    document.addEventListener("keydown", handleKeyDown, { passive: true });

    return () => {
      events.forEach((event) => {
        document.removeEventListener(event, handleFullscreenChange);
      });
      document.removeEventListener("keydown", handleKeyDown);
      clearInterval(intervalCheck);
    };
  }, [
    isTestActive,
    handleFullscreenChange,
    isFullscreen,
    checkFullscreenStatus,
    forceFullscreenReentry,
  ]);

  // Clean up timers on unmount
  useEffect(() => {
    return () => {
      if (warningTimeout.current) {
        clearTimeout(warningTimeout.current);
      }
      if (countdownInterval.current) {
        clearInterval(countdownInterval.current);
      }
      if (reentryAttemptRef.current) {
        clearTimeout(reentryAttemptRef.current);
      }
    };
  }, []);

  return {
    isFullscreen,
    violationCount,
    showViolationWarning,
    countdownSeconds,
    violationLogs,
    maxViolations: MAX_VIOLATIONS,
    isFullscreenSupported,
    enterFullscreen,
    exitFullscreen,
    dismissWarning,
    hasEnteredFullscreen: hasEnteredFullscreen.current,
  };
};
