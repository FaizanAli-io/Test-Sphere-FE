"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { useImageKitUploader } from "@/hooks/useImageKitUploader";
import api from "@/hooks/useApi";

interface MonitoringLog {
  image: string;
  takenAt: string;
}

interface UseTestMonitoringProps {
  submissionId: number | null;
  isTestActive: boolean;
  /**
   * When false, the hook won't request camera permissions or capture webcam photos.
   * Screenshots (screen share) will continue to work if permitted.
   */
  requireWebcam?: boolean;
}

export const useTestMonitoring = ({
  submissionId,
  isTestActive,
  requireWebcam = true,
}: UseTestMonitoringProps) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const screenVideoRef = useRef<HTMLVideoElement | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const webcamStreamRef = useRef<MediaStream | null>(null);
  const screenStreamRef = useRef<MediaStream | null>(null);
  const [webcamStream, setWebcamStream] = useState<MediaStream | null>(null);
  const [screenStream, setScreenStream] = useState<MediaStream | null>(null);
  const [logs, setLogs] = useState<MonitoringLog[]>([]);
  const [isCapturing, setIsCapturing] = useState(false);
  const announcedNextRef = useRef(false); // control 'next capture' logging
  const captureCountRef = useRef(0); // count successful captures

  const { config, authenticator, handleUploadSuccess, handleUploadError } =
    useImageKitUploader();

  // Generate random interval between 5-10 seconds
  const getRandomInterval = useCallback(() => {
    return Math.floor(Math.random() * 6 + 5) * 1000; // 5000-10000ms
  }, []);

  // Initialize webcam
  const initializeWebcam = useCallback(async () => {
    try {
      if (!requireWebcam) return; // Do not initialize if not required
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

      // Webcam initialized
    } catch (err) {
      console.error("❌ Failed to initialize webcam:", err);
    }
  }, [requireWebcam]);

  // Check if a webcam device is available without prompting for permission
  const checkWebcamAvailable = useCallback(async (): Promise<boolean> => {
    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      return devices.some((d) => d.kind === "videoinput");
    } catch {
      return false;
    }
  }, []);

  // Stop webcam
  const stopWebcam = useCallback(() => {
    if (webcamStreamRef.current) {
      webcamStreamRef.current.getTracks().forEach((track) => track.stop());
      webcamStreamRef.current = null;
      setWebcamStream(null);
      // Webcam stopped
    }
  }, []);

  // Request screen capture permission once and keep the stream alive
  const requestScreenPermission = useCallback(async () => {
    try {
      // If already active, do nothing
      if (screenStreamRef.current && screenVideoRef.current) return true;

      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: true,
        audio: false,
      });

      screenStreamRef.current = stream;
      setScreenStream(stream);

      // Create and attach hidden video element to hold the stream
      const video = document.createElement("video");
      video.style.position = "fixed";
      video.style.right = "-9999px"; // keep offscreen
      video.style.bottom = "-9999px";
      video.muted = true;
      video.playsInline = true;
      video.srcObject = stream;
      await video.play().catch(() => {});
      screenVideoRef.current = video;

      // When the user stops sharing, clean up
      stream.getVideoTracks().forEach((t) => {
        t.addEventListener("ended", () => {
          screenVideoRef.current = null;
          screenStreamRef.current = null;
          setScreenStream(null);
        });
      });

      return true;
    } catch (err) {
      console.error("❌ Failed to get screen capture permission:", err);
      screenStreamRef.current = null;
      setScreenStream(null);
      screenVideoRef.current = null;
      return false;
    }
  }, []);

  // Capture webcam photo
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
        0.8
      );
    });
  }, [requireWebcam]);

  // Capture screenshot from the persistent screen video (if available)
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
    } catch (err) {
      console.error("❌ Screenshot capture failed:", err);
      return null;
    }
  }, []);

  // Upload image to ImageKit
  const uploadToImageKit = useCallback(
    async (
      blob: Blob,
      type: "webcam" | "screenshot"
    ): Promise<string | null> => {
      if (!config) {
        console.error("❌ ImageKit config not loaded");
        return null;
      }

      try {
        const formData = new FormData();
        const fileName = `${type}_${Date.now()}.jpg`;
        formData.append("file", blob, fileName);
        formData.append("fileName", fileName);
        formData.append("folder", "/test-monitoring");

        // Get auth params
        const authParams = await authenticator();
        formData.append("signature", authParams.signature);
        formData.append("expire", authParams.expire.toString());
        formData.append("token", authParams.token);
        formData.append("publicKey", config.publicKey);

        const response = await fetch(
          `https://upload.imagekit.io/api/v1/files/upload`,
          {
            method: "POST",
            body: formData,
          }
        );

        if (!response.ok) {
          throw new Error("Upload failed");
        }

        const result = await response.json();
        handleUploadSuccess(result);
        return result.url;
      } catch (err) {
        console.error(`❌ ${type} upload failed:`, err);
        handleUploadError(err);
        return null;
      }
    },
    [config, authenticator, handleUploadSuccess, handleUploadError]
  );

  // Single function: capture and upload both webcam and screenshot
  const captureAndUpload = useCallback(async () => {
    if (!submissionId || isCapturing) return;

    setIsCapturing(true);

    try {
      // Capture in parallel
      const [webcamBlob, screenshotBlob] = await Promise.all([
        requireWebcam ? captureWebcamPhoto() : Promise.resolve(null),
        captureScreenshot(),
      ]);

      // Upload whichever were captured
      const [webcamUrl, screenshotUrl] = await Promise.all([
        webcamBlob
          ? uploadToImageKit(webcamBlob, "webcam")
          : Promise.resolve(null),
        screenshotBlob
          ? uploadToImageKit(screenshotBlob, "screenshot")
          : Promise.resolve(null),
      ]);

      const timestamp = new Date().toISOString();
      const newLogs: MonitoringLog[] = [];
      if (webcamUrl) newLogs.push({ image: webcamUrl, takenAt: timestamp });
      if (screenshotUrl)
        newLogs.push({ image: screenshotUrl, takenAt: timestamp });

      if (newLogs.length === 0) return;

      // Update local logs state
      setLogs((prev) => [...prev, ...newLogs]);

      // Build and send API payload
      const apiPayload = {
        submissionId,
        logType: "SCREENSHOT",
        meta: newLogs,
      };

      const response = await api("/proctoring-logs", {
        method: "POST",
        auth: true,
        body: JSON.stringify(apiPayload),
      });

      // Simple capture log
      console.log("📸 Captured");
      captureCountRef.current += 1;
      announcedNextRef.current = false; // allow next schedule to announce once if desired
    } catch (err) {
      console.error("❌ Capture/upload cycle failed:", err);
    } finally {
      setIsCapturing(false);
    }
  }, [
    submissionId,
    isCapturing,
    captureWebcamPhoto,
    captureScreenshot,
    uploadToImageKit,
    requireWebcam,
  ]);

  // Set up randomized interval for automatic capture
  useEffect(() => {
    if (!isTestActive || !submissionId) return;

    // Initialize webcam when test starts
    initializeWebcam();

    // Schedule next capture with random interval
    const scheduleNextCapture = () => {
      const nextInterval = getRandomInterval();
      // Announce only before the first capture
      if (!announcedNextRef.current && captureCountRef.current === 0) {
        console.log(
          `⏰ Next capture in ${Math.floor(nextInterval / 1000)} seconds`
        );
        announcedNextRef.current = true;
      }

      timeoutRef.current = setTimeout(() => {
        captureAndUpload().then(() => {
          // Schedule the next capture after this one completes
          scheduleNextCapture();
        });
      }, nextInterval);
    };

    // Start the first capture cycle
    scheduleNextCapture();

    // Cleanup
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      stopWebcam();
      // stop screen stream
      if (screenStreamRef.current) {
        screenStreamRef.current.getTracks().forEach((t) => t.stop());
      }
      if (screenVideoRef.current) {
        screenVideoRef.current.srcObject = null;
        screenVideoRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isTestActive, submissionId]);

  return {
    videoRef,
    canvasRef,
    requestScreenPermission,
    logs,
    isCapturing,
    webcamStream,
    checkWebcamAvailable,
    captureAndUpload, // Manual trigger if needed
  };
};
