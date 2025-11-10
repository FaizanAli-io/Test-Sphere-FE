"use client";

import { useEffect, useState, useCallback, useRef } from "react";

interface UseScreenSharingMonitoringProps {
  submissionId: number | null;
  isTestActive: boolean;
  onAutoSubmit: () => void;
}

export const useScreenSharingMonitoring = ({
  // submissionId is kept for API consistency but not used in frontend-only implementation
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  submissionId: _,
  isTestActive,
  onAutoSubmit,
}: UseScreenSharingMonitoringProps) => {
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [showViolationWarning, setShowViolationWarning] = useState(false);
  const [countdownSeconds, setCountdownSeconds] = useState(5);
  const screenStreamRef = useRef<MediaStream | null>(null);
  const screenVideoRef = useRef<HTMLVideoElement | null>(null);
  const hasStartedScreenSharing = useRef(false);
  const countdownInterval = useRef<NodeJS.Timeout | null>(null);
  const warningTimeout = useRef<NodeJS.Timeout | null>(null);
  const isProcessingViolation = useRef(false);

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
          // Time's up - auto submit test
          clearInterval(countdownInterval.current!);
          setShowViolationWarning(false);
          setTimeout(() => onAutoSubmit(), 0);
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
      setTimeout(() => onAutoSubmit(), 0);
    }, 5500);
  }, [onAutoSubmit]);

  // Handle when screen sharing ends
  const handleScreenSharingEnded = useCallback(() => {
    if (
      !isTestActive ||
      !hasStartedScreenSharing.current ||
      isProcessingViolation.current
    ) {
      return;
    }

    isProcessingViolation.current = true;
    setIsScreenSharing(false);
    screenStreamRef.current = null;
    screenVideoRef.current = null;

    // Start violation warning with countdown
    startViolationCountdown();
  }, [isTestActive, startViolationCountdown]);

  // Request screen sharing permission and setup monitoring
  const requestScreenPermission = useCallback(async (): Promise<boolean> => {
    try {
      if (screenStreamRef.current && screenVideoRef.current) return true;

      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: true,
        audio: false,
      });

      const track = stream.getVideoTracks()[0];
      const settings = track?.getSettings?.();
      // displaySurface is non-standard in TS, so read from settings via index signature
      const surface = (settings as Record<string, unknown> | undefined)?.[
        "displaySurface"
      ] as string | undefined;
      const isEntireScreen =
        surface === "monitor" ||
        (typeof track.label === "string" &&
          /entire screen|screen 1|screen 2|whole screen/i.test(track.label));

      if (!isEntireScreen) {
        stream.getTracks().forEach((t) => t.stop());
        return false;
      }

      screenStreamRef.current = stream;
      setIsScreenSharing(true);
      hasStartedScreenSharing.current = true;

      const video = document.createElement("video");
      video.style.position = "fixed";
      video.style.right = "-9999px";
      video.style.bottom = "-9999px";
      video.muted = true;
      video.playsInline = true;
      video.srcObject = stream;
      await video.play().catch(() => {});
      screenVideoRef.current = video;

      // Set up event listener for when screen sharing ends
      stream.getVideoTracks().forEach((t) => {
        t.addEventListener("ended", () => {
          handleScreenSharingEnded();
        });
      });

      return true;
    } catch {
      // Failed to get screen capture permission
      screenStreamRef.current = null;
      screenVideoRef.current = null;
      setIsScreenSharing(false);
      return false;
    }
  }, [handleScreenSharingEnded]);

  // Handle resharing screen (dismiss warning and request permission again)
  const handleReshareScreen = useCallback(async () => {
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

    // Request screen sharing permission again
    const success = await requestScreenPermission();
    if (!success) {
      // If they didn't share the entire screen, show warning again
      setTimeout(() => {
        if (isTestActive && hasStartedScreenSharing.current) {
          startViolationCountdown();
        }
      }, 1000);
    }
  }, [requestScreenPermission, startViolationCountdown, isTestActive]);

  // Clean up timers and streams
  useEffect(() => {
    return () => {
      if (warningTimeout.current) {
        clearTimeout(warningTimeout.current);
      }
      if (countdownInterval.current) {
        clearInterval(countdownInterval.current);
      }
      if (screenStreamRef.current) {
        screenStreamRef.current.getTracks().forEach((t) => t.stop());
      }
      if (screenVideoRef.current) {
        screenVideoRef.current.srcObject = null;
        screenVideoRef.current = null;
      }
    };
  }, []);

  // Reset state when test becomes inactive
  useEffect(() => {
    if (!isTestActive) {
      setIsScreenSharing(false);
      setShowViolationWarning(false);
      isProcessingViolation.current = false;
      hasStartedScreenSharing.current = false;
    }
  }, [isTestActive]);

  return {
    isScreenSharing,
    showViolationWarning,
    countdownSeconds,
    requestScreenPermission,
    handleReshareScreen,
    hasStartedScreenSharing: hasStartedScreenSharing.current,
  };
};
