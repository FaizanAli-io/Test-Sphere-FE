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
  // Removed unused screenStream state; using refs only
  const [logs, setLogs] = useState<MonitoringLog[]>([]);
  const [isCapturing, setIsCapturing] = useState(false);
  const announcedNextRef = useRef(false);
  const captureCountRef = useRef(0);

  const { config, authenticator, handleUploadSuccess, handleUploadError } =
    useImageKitUploader();

  const getRandomInterval = useCallback(() => {
    return Math.floor(Math.random() * 6 + 10) * 1000;
  }, []);

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
  }, []);

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
        0.8
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
      type: "webcam" | "screenshot"
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

        const response = await fetch(
          "https://upload.imagekit.io/api/v1/files/upload",
          {
            method: "POST",
            body: formData,
          }
        );

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
    [config, authenticator, handleUploadSuccess, handleUploadError]
  );

  const captureAndUpload = useCallback(async () => {
    if (!submissionId || isCapturing) {
      console.log("⏭️ Skipping capture:", { submissionId, isCapturing });
      return;
    }

    console.log("📸 Starting capture and upload process...");
    setIsCapturing(true);

    try {
      const [webcamBlob, screenshotBlob] = await Promise.all([
        requireWebcam ? captureWebcamPhoto() : Promise.resolve(null),
        captureScreenshot(),
      ]);

      const [webcamData, screenshotData] = await Promise.all([
        webcamBlob
          ? uploadToImageKit(webcamBlob, "webcam")
          : Promise.resolve(null),
        screenshotBlob
          ? uploadToImageKit(screenshotBlob, "screenshot")
          : Promise.resolve(null),
      ]);

      const timestamp = new Date().toISOString();

      const newLogs: MonitoringLog[] = [];
      if (webcamData)
        newLogs.push({ image: webcamData.url, takenAt: timestamp });
      if (screenshotData)
        newLogs.push({ image: screenshotData.url, takenAt: timestamp });

      console.log("📊 Captured data:", {
        webcamData: !!webcamData,
        screenshotData: !!screenshotData,
        newLogsCount: newLogs.length,
      });

      if (newLogs.length === 0) {
        console.log("⚠️ No data captured, skipping upload");
        return;
      }

      setLogs((prev) => [...prev, ...newLogs]);

      const apiCalls = [];

      if (screenshotData) {
        apiCalls.push(
          api("/proctoring-logs", {
            auth: true,
            method: "POST",
            body: JSON.stringify({
              submissionId,
              logType: "SCREENSHOT",
              meta: [
                {
                  fileId: screenshotData.fileId,
                  image: screenshotData.url,
                  takenAt: timestamp,
                },
              ],
            }),
          })
        );
      }

      if (webcamData) {
        apiCalls.push(
          api("/proctoring-logs", {
            auth: true,
            method: "POST",
            body: JSON.stringify({
              submissionId,
              logType: "WEBCAM_PHOTO",
              meta: [
                {
                  fileId: webcamData.fileId,
                  image: webcamData.url,
                  takenAt: timestamp,
                },
              ],
            }),
          })
        );
      }

      await Promise.all(apiCalls);

      captureCountRef.current += 1;
      announcedNextRef.current = false;
    } catch {
      // Capture/upload cycle failed
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

  useEffect(() => {
    if (!isTestActive || !submissionId) return;

    initializeWebcam();

    const scheduleNextCapture = () => {
      const nextInterval = getRandomInterval();

      console.log(
        `📸 Scheduling next capture in ${nextInterval / 1000}s (capture #${captureCountRef.current + 1})`
      );

      if (!announcedNextRef.current && captureCountRef.current === 0) {
        announcedNextRef.current = true;
      }

      timeoutRef.current = setTimeout(async () => {
        console.log(`🔄 Starting capture #${captureCountRef.current + 1}`);
        try {
          await captureAndUpload();
          console.log(
            `✅ Capture #${captureCountRef.current} completed successfully`
          );
        } catch (error) {
          console.error("❌ Capture failed:", error);
        }
        // Always schedule next capture, even if current one failed
        if (isTestActive && submissionId) {
          console.log("🔄 Scheduling next capture...");
          scheduleNextCapture();
        } else {
          console.log(
            "⏹️ Stopping capture cycle (test not active or no submission ID)"
          );
        }
      }, nextInterval);
    };

    // Start the first capture cycle
    scheduleNextCapture();

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
      stopWebcam();

      if (screenStreamRef.current) {
        screenStreamRef.current.getTracks().forEach((t) => t.stop());
      }
      if (screenVideoRef.current) {
        screenVideoRef.current.srcObject = null;
        screenVideoRef.current = null;
      }
    };
  }, [isTestActive, submissionId]); // Removed function dependencies to prevent re-runs

  return {
    videoRef,
    canvasRef,
    requestScreenPermission,
    requestWebcamPermission,
    logs,
    isCapturing,
    webcamStream,
    checkWebcamAvailable,
    captureAndUpload,
  };
};
