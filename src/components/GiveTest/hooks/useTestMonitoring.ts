"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { useImageKitUploader } from "@/hooks/useImageKitUploader";
import api from "@/hooks/useApi";
import { TEST_SECURITY_CONFIG } from "../constants";
import { storeOfflineLog } from "@/utils/offlineStorage";
import { debugLogger } from "@/utils/logger";

interface MonitoringLog {
  image: string;
  takenAt: string;
}

interface CaptureStats {
  screenshots: { total: number; uploaded: number };
  webcamPhotos: { total: number; uploaded: number };
}

interface OfflineUploadedCounts {
  screenshots: number;
  webcamPhotos: number;
  focusChanges: number;
  clicks: number;
  keystrokes: number;
}

interface UseTestMonitoringProps {
  submissionId: number | null;
  isTestActive: boolean;
  requireWebcam?: boolean;
  isFullscreen?: boolean;
  initialScreenStream?: MediaStream;
  isOnline?: boolean;
  offlineUploadedCounts?: OfflineUploadedCounts;
}

export const useTestMonitoring = ({
  submissionId,
  isTestActive,
  requireWebcam = true,
  isFullscreen = false,
  initialScreenStream,
  isOnline = true,
  offlineUploadedCounts,
}: UseTestMonitoringProps) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const screenVideoRef = useRef<HTMLVideoElement | null>(null);
  const webcamIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const screenshotIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const webcamStreamRef = useRef<MediaStream | null>(null);
  const screenStreamRef = useRef<MediaStream | null>(null);
  const isUsingInitialScreenStreamRef = useRef<boolean>(false);
  const [webcamStream, setWebcamStream] = useState<MediaStream | null>(null);
  const [logs, setLogs] = useState<MonitoringLog[]>([]);
  const webcamCaptureCountRef = useRef(0);
  const screenshotCaptureCountRef = useRef(0);

  // Stats tracking
  const statsRef = useRef<CaptureStats>({
    screenshots: { total: 0, uploaded: 0 },
    webcamPhotos: { total: 0, uploaded: 0 },
  });
  const [stats, setStats] = useState<CaptureStats>(statsRef.current);

  // Update stats when offline logs are uploaded
  useEffect(() => {
    if (offlineUploadedCounts) {
      if (offlineUploadedCounts.screenshots > 0) {
        statsRef.current.screenshots.uploaded += offlineUploadedCounts.screenshots;
      }
      if (offlineUploadedCounts.webcamPhotos > 0) {
        statsRef.current.webcamPhotos.uploaded += offlineUploadedCounts.webcamPhotos;
      }
      if (offlineUploadedCounts.screenshots > 0 || offlineUploadedCounts.webcamPhotos > 0) {
        setStats({ ...statsRef.current });
      }
    }
  }, [offlineUploadedCounts]);

  const { config, authenticator, handleUploadSuccess, handleUploadError } = useImageKitUploader();

  const initializeWebcam = useCallback(async () => {
    try {
      if (!requireWebcam) return;
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 640, height: 480 },
        audio: false,
      });
      webcamStreamRef.current = stream;
      setWebcamStream(stream);

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
    } catch {
      // Failed to initialize webcam
    }
  }, [requireWebcam]);

  const checkWebcamAvailable = useCallback(async (): Promise<boolean> => {
    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      return devices.some((d) => d.kind === "videoinput");
    } catch {
      return false;
    }
  }, []);

  const stopWebcam = useCallback(() => {
    if (webcamStreamRef.current) {
      webcamStreamRef.current.getTracks().forEach((track) => track.stop());
      webcamStreamRef.current = null;
      setWebcamStream(null);
    }
  }, []);

  const requestScreenPermission = useCallback(async (): Promise<boolean> => {
    try {
      // If we already have a video element set up, we're good
      if (screenStreamRef.current && screenVideoRef.current) {
        debugLogger("[TestMonitoring] Screen stream already set up");
        return true;
      }

      // Use initialScreenStream if provided and still active
      let stream: MediaStream;
      if (initialScreenStream && initialScreenStream.active) {
        debugLogger("[TestMonitoring] Reusing initial screen stream for screenshots");
        stream = initialScreenStream;
        isUsingInitialScreenStreamRef.current = true;
      } else {
        debugLogger("[TestMonitoring] Requesting new screen share (fallback - should not happen)");
        stream = await navigator.mediaDevices.getDisplayMedia({
          video: {
            displaySurface: "monitor", // Request entire screen
          },
          audio: false,
        });
        isUsingInitialScreenStreamRef.current = false;
      }

      const track = stream.getVideoTracks()[0];
      const settings = track?.getSettings?.();
      // displaySurface is non-standard in TS, so read from settings via index signature
      const surface = (settings as Record<string, unknown> | undefined)?.["displaySurface"] as
        | string
        | undefined;
      const isEntireScreen =
        surface === "monitor" ||
        (typeof track.label === "string" &&
          /entire screen|screen 1|screen 2|whole screen/i.test(track.label));

      if (!isEntireScreen) {
        // Only stop tracks if this is a newly created stream
        if (!isUsingInitialScreenStreamRef.current) {
          stream.getTracks().forEach((t) => t.stop());
        }
        return false;
      }

      screenStreamRef.current = stream;

      const video = document.createElement("video");
      video.style.position = "fixed";
      video.style.right = "-9999px";
      video.style.bottom = "-9999px";
      video.muted = true;
      video.playsInline = true;
      video.srcObject = stream;
      await video.play().catch(() => {});
      screenVideoRef.current = video;

      stream.getVideoTracks().forEach((t) => {
        t.addEventListener("ended", () => {
          screenVideoRef.current = null;
          screenStreamRef.current = null;
        });
      });

      return true;
    } catch {
      // Failed to get screen capture permission
      screenStreamRef.current = null;
      screenVideoRef.current = null;
      return false;
    }
  }, [initialScreenStream]);

  // Initialize screen stream from initialScreenStream prop
  useEffect(() => {
    if (!initialScreenStream || !initialScreenStream.active) return;
    if (screenStreamRef.current) return; // Already initialized

    debugLogger("[TestMonitoring] Initializing screen stream from initial permission check");
    screenStreamRef.current = initialScreenStream;
    isUsingInitialScreenStreamRef.current = true;

    const video = document.createElement("video");
    video.style.position = "fixed";
    video.style.right = "-9999px";
    video.style.bottom = "-9999px";
    video.muted = true;
    video.playsInline = true;
    video.srcObject = initialScreenStream;
    video.play().catch(() => {});
    screenVideoRef.current = video;

    initialScreenStream.getVideoTracks().forEach((t) => {
      t.addEventListener("ended", () => {
        screenVideoRef.current = null;
        screenStreamRef.current = null;
      });
    });
  }, [initialScreenStream]);

  const requestWebcamPermission = useCallback(async (): Promise<boolean> => {
    try {
      await initializeWebcam();

      return !!webcamStreamRef.current;
    } catch {
      return false;
    }
  }, [initializeWebcam]);

  const captureWebcamPhoto = useCallback((): Promise<Blob | null> => {
    return new Promise((resolve) => {
      if (!requireWebcam || !videoRef.current || !canvasRef.current) {
        resolve(null);
        return;
      }

      const video = videoRef.current;
      const canvas = canvasRef.current;
      const context = canvas.getContext("2d");

      if (!context) {
        resolve(null);
        return;
      }

      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      context.drawImage(video, 0, 0, canvas.width, canvas.height);

      canvas.toBlob(
        (blob) => {
          resolve(blob);
        },
        "image/jpeg",
        0.8,
      );
    });
  }, [requireWebcam]);

  const captureScreenshot = useCallback(async (): Promise<Blob | null> => {
    try {
      const vid = screenVideoRef.current;
      if (!vid || vid.videoWidth === 0 || vid.videoHeight === 0) {
        return null;
      }

      const canvas = document.createElement("canvas");
      canvas.width = vid.videoWidth;
      canvas.height = vid.videoHeight;
      const context = canvas.getContext("2d");
      if (!context) return null;

      context.drawImage(vid, 0, 0, canvas.width, canvas.height);
      return await new Promise<Blob | null>((resolve) => {
        canvas.toBlob((blob) => resolve(blob), "image/jpeg", 0.8);
      });
    } catch {
      // Screenshot capture failed
      return null;
    }
  }, []);

  const uploadToImageKit = useCallback(
    async (
      blob: Blob,
      type: "webcam" | "screenshot",
    ): Promise<{ fileId: string; url: string } | null> => {
      if (!config) {
        // ImageKit config not loaded
        return null;
      }

      try {
        const formData = new FormData();
        const fileName = `${type}_${Date.now()}.jpg`;
        formData.append("file", blob, fileName);
        formData.append("fileName", fileName);
        formData.append("folder", "/test-monitoring");

        const authParams = await authenticator();
        formData.append("signature", authParams.signature);
        formData.append("expire", authParams.expire.toString());
        formData.append("token", authParams.token);
        formData.append("publicKey", config.publicKey);

        const response = await fetch("https://upload.imagekit.io/api/v1/files/upload", {
          method: "POST",
          body: formData,
        });

        if (!response.ok) {
          throw new Error(`Upload failed with status ${response.status}`);
        }

        const result = await response.json();
        handleUploadSuccess(result);

        return {
          fileId: result.fileId,
          url: result.url,
        };
      } catch (err) {
        // Upload failed
        handleUploadError(err);
        return null;
      }
    },
    [config, authenticator, handleUploadSuccess, handleUploadError],
  );

  // Separate capture functions for webcam and screenshot
  const captureAndUploadWebcam = useCallback(async () => {
    if (!submissionId || !requireWebcam) {
      return;
    }

    debugLogger("� Starting webcam capture...");

    try {
      const webcamBlob = await captureWebcamPhoto();
      if (!webcamBlob) {
        debugLogger("⚠️ No webcam data captured");
        return;
      }

      const timestamp = new Date().toISOString();

      // Check if online before attempting upload
      if (!isOnline) {
        debugLogger("🔌 Offline: Storing webcam photo in IndexedDB");
        await storeOfflineLog(submissionId, "WEBCAM_PHOTO", {
          submissionId,
          logType: "WEBCAM_PHOTO",
          meta: [
            {
              takenAt: timestamp,
              // Store blob as base64 for offline storage
              imageData: await new Promise<string>((resolve) => {
                const reader = new FileReader();
                reader.onloadend = () => resolve(reader.result as string);
                reader.readAsDataURL(webcamBlob);
              }),
            },
          ],
        });
        webcamCaptureCountRef.current += 1;
        statsRef.current.webcamPhotos.total++;
        setStats({ ...statsRef.current });
        debugLogger(`📦 Webcam capture #${webcamCaptureCountRef.current} stored offline`);
        return;
      }

      // Online: proceed with normal upload flow
      const webcamData = await uploadToImageKit(webcamBlob, "webcam");
      if (!webcamData) {
        debugLogger("⚠️ Failed to upload webcam photo to ImageKit");
        return;
      }

      setLogs((prev) => [...prev, { image: webcamData.url, takenAt: timestamp }]);

      debugLogger("📤 Uploading webcam photo to backend");
      await api("/proctoring-logs/batch", {
        auth: true,
        method: "POST",
        body: JSON.stringify({
          logs: [
            {
              submissionId,
              logType: "WEBCAM_PHOTO",
              meta: [
                {
                  fileId: webcamData.fileId,
                  image: webcamData.url,
                  takenAt: timestamp,
                },
              ],
            },
          ],
        }),
      });

      webcamCaptureCountRef.current += 1;
      statsRef.current.webcamPhotos.total++;
      statsRef.current.webcamPhotos.uploaded++;
      setStats({ ...statsRef.current });
      debugLogger(`✅ Webcam capture #${webcamCaptureCountRef.current} completed`);
    } catch (error) {
      console.error("❌ Webcam capture failed:", error);
      // On error, try to store offline as fallback
      if (submissionId) {
        try {
          const webcamBlob = await captureWebcamPhoto();
          if (webcamBlob) {
            debugLogger("💾 Error occurred: Storing webcam photo offline as fallback");
            await storeOfflineLog(submissionId, "WEBCAM_PHOTO", {
              submissionId,
              logType: "WEBCAM_PHOTO",
              meta: [
                {
                  takenAt: new Date().toISOString(),
                  imageData: await new Promise<string>((resolve) => {
                    const reader = new FileReader();
                    reader.onloadend = () => resolve(reader.result as string);
                    reader.readAsDataURL(webcamBlob);
                  }),
                },
              ],
            });
          }
        } catch (fallbackError) {
          console.error("❌ Failed to store offline as fallback:", fallbackError);
        }
      }
    }
  }, [submissionId, requireWebcam, captureWebcamPhoto, uploadToImageKit, isOnline]);

  const captureAndUploadScreenshot = useCallback(async () => {
    if (!submissionId || isFullscreen) {
      // Only capture screenshots when not in fullscreen
      return;
    }

    debugLogger("🖥️ Starting screenshot capture...");

    try {
      const screenshotBlob = await captureScreenshot();
      if (!screenshotBlob) {
        debugLogger("⚠️ No screenshot data captured");
        return;
      }

      const timestamp = new Date().toISOString();

      // Check if online before attempting upload
      if (!isOnline) {
        debugLogger("🔌 Offline: Storing screenshot in IndexedDB");
        await storeOfflineLog(submissionId, "SCREENSHOT", {
          submissionId,
          logType: "SCREENSHOT",
          meta: [
            {
              takenAt: timestamp,
              // Store blob as base64 for offline storage
              imageData: await new Promise<string>((resolve) => {
                const reader = new FileReader();
                reader.onloadend = () => resolve(reader.result as string);
                reader.readAsDataURL(screenshotBlob);
              }),
            },
          ],
        });
        screenshotCaptureCountRef.current += 1;
        statsRef.current.screenshots.total++;
        setStats({ ...statsRef.current });
        debugLogger(`📦 Screenshot capture #${screenshotCaptureCountRef.current} stored offline`);
        return;
      }

      // Online: proceed with normal upload flow
      const screenshotData = await uploadToImageKit(screenshotBlob, "screenshot");
      if (!screenshotData) {
        debugLogger("⚠️ Failed to upload screenshot to ImageKit");
        return;
      }

      setLogs((prev) => [...prev, { image: screenshotData.url, takenAt: timestamp }]);

      debugLogger("📤 Uploading screenshot to backend");
      await api("/proctoring-logs/batch", {
        auth: true,
        method: "POST",
        body: JSON.stringify({
          logs: [
            {
              submissionId,
              logType: "SCREENSHOT",
              meta: [
                {
                  fileId: screenshotData.fileId,
                  image: screenshotData.url,
                  takenAt: timestamp,
                },
              ],
            },
          ],
        }),
      });

      screenshotCaptureCountRef.current += 1;
      statsRef.current.screenshots.total++;
      statsRef.current.screenshots.uploaded++;
      setStats({ ...statsRef.current });
      debugLogger(`✅ Screenshot capture #${screenshotCaptureCountRef.current} completed`);
    } catch (error) {
      console.error("❌ Screenshot capture failed:", error);
      // On error, try to store offline as fallback
      if (submissionId) {
        try {
          const screenshotBlob = await captureScreenshot();
          if (screenshotBlob) {
            debugLogger("💾 Error occurred: Storing screenshot offline as fallback");
            await storeOfflineLog(submissionId, "SCREENSHOT", {
              submissionId,
              logType: "SCREENSHOT",
              meta: [
                {
                  takenAt: new Date().toISOString(),
                  imageData: await new Promise<string>((resolve) => {
                    const reader = new FileReader();
                    reader.onloadend = () => resolve(reader.result as string);
                    reader.readAsDataURL(screenshotBlob);
                  }),
                },
              ],
            });
          }
        } catch (fallbackError) {
          console.error("❌ Failed to store offline as fallback:", fallbackError);
        }
      }
    }
  }, [submissionId, isFullscreen, captureScreenshot, uploadToImageKit, isOnline]);

  // Webcam capture interval (runs every 10 seconds)
  useEffect(() => {
    if (!isTestActive || !submissionId || !requireWebcam) return;

    initializeWebcam();

    debugLogger(
      `📷 Starting webcam capture interval (every ${TEST_SECURITY_CONFIG.WEBCAM_CAPTURE_INTERVAL_SECONDS}s)`,
    );

    // Start immediately, then repeat
    captureAndUploadWebcam();

    webcamIntervalRef.current = setInterval(() => {
      captureAndUploadWebcam();
    }, TEST_SECURITY_CONFIG.WEBCAM_CAPTURE_INTERVAL_SECONDS * 1000);

    return () => {
      if (webcamIntervalRef.current) {
        clearInterval(webcamIntervalRef.current);
        webcamIntervalRef.current = null;
      }
    };
  }, [isTestActive, submissionId, requireWebcam, initializeWebcam, captureAndUploadWebcam]);

  // Screenshot capture interval (runs every 5 seconds when not in fullscreen)
  useEffect(() => {
    if (!isTestActive || !submissionId) return;

    debugLogger(
      `�️ Starting screenshot capture interval (every ${TEST_SECURITY_CONFIG.SCREENSHOT_CAPTURE_INTERVAL_SECONDS}s when not in fullscreen)`,
    );

    // Start immediately if not in fullscreen
    if (!isFullscreen) {
      captureAndUploadScreenshot();
    }

    screenshotIntervalRef.current = setInterval(() => {
      // Only capture if not in fullscreen
      if (!isFullscreen) {
        captureAndUploadScreenshot();
      }
    }, TEST_SECURITY_CONFIG.SCREENSHOT_CAPTURE_INTERVAL_SECONDS * 1000);

    return () => {
      if (screenshotIntervalRef.current) {
        clearInterval(screenshotIntervalRef.current);
        screenshotIntervalRef.current = null;
      }
    };
  }, [isTestActive, submissionId, isFullscreen, captureAndUploadScreenshot]);

  // Cleanup effect for streams
  useEffect(() => {
    return () => {
      stopWebcam();

      // Only stop screen stream tracks if this is NOT the initial screen stream
      if (screenStreamRef.current && !isUsingInitialScreenStreamRef.current) {
        debugLogger("[TestMonitoring] Stopping locally created screen stream tracks");
        screenStreamRef.current.getTracks().forEach((t) => t.stop());
      } else if (screenStreamRef.current) {
        debugLogger("[TestMonitoring] Preserving initial screen stream for reuse");
      }

      if (screenVideoRef.current) {
        screenVideoRef.current.srcObject = null;
        screenVideoRef.current = null;
      }
    };
  }, [stopWebcam]);

  return {
    videoRef,
    canvasRef,
    requestScreenPermission,
    requestWebcamPermission,
    logs,
    webcamStream,
    checkWebcamAvailable,
    stats,
  };
};
