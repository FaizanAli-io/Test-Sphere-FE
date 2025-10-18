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
  requireWebcam = true
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
        audio: false
      });
      webcamStreamRef.current = stream;
      setWebcamStream(stream);

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
    } catch (err) {
      console.error("❌ Failed to initialize webcam:", err);
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
        audio: false
      });

      const track = stream.getVideoTracks()[0];
      const settings = track?.getSettings?.() as any;
      const surface: string | undefined = settings?.displaySurface;
      const isEntireScreen =
        surface === "monitor" ||
        (typeof track.label === "string" &&
          /entire screen|screen 1|screen 2|whole screen/i.test(track.label));

      if (!isEntireScreen) {
        stream.getTracks().forEach((t) => t.stop());
        return false;
      }

      screenStreamRef.current = stream;
      setScreenStream(stream);

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
    } catch (err) {
      console.error("❌ Screenshot capture failed:", err);
      return null;
    }
  }, []);

  const uploadToImageKit = useCallback(
    async (
      blob: Blob,
      type: "webcam" | "screenshot"
    ): Promise<{ fileId: string; url: string } | null> => {
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

        const authParams = await authenticator();
        formData.append("signature", authParams.signature);
        formData.append("expire", authParams.expire.toString());
        formData.append("token", authParams.token);
        formData.append("publicKey", config.publicKey);

        const response = await fetch(
          "https://upload.imagekit.io/api/v1/files/upload",
          {
            method: "POST",
            body: formData
          }
        );

        if (!response.ok) {
          throw new Error(`Upload failed with status ${response.status}`);
        }

        const result = await response.json();
        handleUploadSuccess(result);

        return {
          fileId: result.fileId,
          url: result.url
        };
      } catch (err) {
        console.error(`❌ ${type} upload failed:`, err);
        handleUploadError(err);
        return null;
      }
    },
    [config, authenticator, handleUploadSuccess, handleUploadError]
  );

  const captureAndUpload = useCallback(async () => {
    if (!submissionId || isCapturing) return;

    setIsCapturing(true);

    try {
      const [webcamBlob, screenshotBlob] = await Promise.all([
        requireWebcam ? captureWebcamPhoto() : Promise.resolve(null),
        captureScreenshot()
      ]);

      const [webcamData, screenshotData] = await Promise.all([
        webcamBlob
          ? uploadToImageKit(webcamBlob, "webcam")
          : Promise.resolve(null),
        screenshotBlob
          ? uploadToImageKit(screenshotBlob, "screenshot")
          : Promise.resolve(null)
      ]);

      const timestamp = new Date().toISOString();

      const newLogs: MonitoringLog[] = [];
      if (webcamData)
        newLogs.push({ image: webcamData.url, takenAt: timestamp });
      if (screenshotData)
        newLogs.push({ image: screenshotData.url, takenAt: timestamp });
      if (newLogs.length === 0) return;

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
                  takenAt: timestamp
                }
              ]
            })
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
                  takenAt: timestamp
                }
              ]
            })
          })
        );
      }

      await Promise.all(apiCalls);

      captureCountRef.current += 1;
      announcedNextRef.current = false;
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
    requireWebcam
  ]);

  useEffect(() => {
    if (!isTestActive || !submissionId) return;

    initializeWebcam();

    const scheduleNextCapture = () => {
      const nextInterval = getRandomInterval();

      if (!announcedNextRef.current && captureCountRef.current === 0) {
        announcedNextRef.current = true;
      }

      timeoutRef.current = setTimeout(() => {
        captureAndUpload().then(() => {
          scheduleNextCapture();
        });
      }, nextInterval);
    };

    scheduleNextCapture();

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
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
  }, [isTestActive, submissionId]);

  return {
    videoRef,
    canvasRef,
    requestScreenPermission,
    requestWebcamPermission,
    logs,
    isCapturing,
    webcamStream,
    checkWebcamAvailable,
    captureAndUpload
  };
};
