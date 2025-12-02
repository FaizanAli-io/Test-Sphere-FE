"use client";

import { useEffect, useCallback, useRef, useState } from "react";

import api from "@/hooks/useApi";
import {
  getOfflineLogs,
  deleteOfflineLog,
  getPendingLogsCount,
  incrementUploadAttempts,
} from "@/utils/offlineStorage";
import { debugLogger } from "@/utils/logger";
import { decryptData } from "@/utils/encryption";
import type { OfflineLog } from "@/utils/offlineStorage";

const MAX_UPLOAD_ATTEMPTS = 5;

interface ImageKitAuthParams {
  signature: string;
  expire: number;
  token: string;
  publicKey: string;
  urlEndpoint: string;
}

interface ImageKitUploadResult {
  fileId: string;
  url: string;
}

interface UseOfflineQueueManagerProps {
  submissionId: number | null;
  isOnline: boolean;
  isTestActive: boolean;
}

interface UploadedLogCounts {
  screenshots: number;
  webcamPhotos: number;
  focusChanges: number;
  clicks: number;
  keystrokes: number;
}

interface UseOfflineQueueManagerResult {
  pendingCount: number;
  isSyncing: boolean;
  syncNow: () => Promise<void>;
  hasPendingLogs: boolean;
  lastUploadedCounts: UploadedLogCounts;
}

export const useOfflineQueueManager = ({
  submissionId,
  isOnline,
  isTestActive,
}: UseOfflineQueueManagerProps): UseOfflineQueueManagerResult => {
  const [pendingCount, setPendingCount] = useState(0);
  const [isSyncing, setIsSyncing] = useState(false);
  const syncingRef = useRef(false);
  const syncTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [lastUploadedCounts, setLastUploadedCounts] = useState<UploadedLogCounts>({
    screenshots: 0,
    webcamPhotos: 0,
    focusChanges: 0,
    clicks: 0,
    keystrokes: 0,
  });

  /**
   * Updates the pending count
   */
  const updatePendingCount = useCallback(async () => {
    if (!submissionId) return;
    const count = await getPendingLogsCount(submissionId);
    setPendingCount(count);
  }, [submissionId]);

  /**
   * Gets ImageKit authentication parameters
   */
  const getImageKitAuth = useCallback(async (): Promise<ImageKitAuthParams | null> => {
    try {
      const res = await api("/upload/signature", {
        method: "GET",
        auth: true,
      });
      if (!res.ok) return null;
      const data = await res.json();
      return {
        signature: data.signature,
        expire: data.expire,
        token: data.token,
        publicKey: data.publicKey,
        urlEndpoint: data.urlEndpoint,
      };
    } catch (error) {
      console.error("Failed to get ImageKit auth:", error);
      return null;
    }
  }, []);

  /**
   * Uploads base64 image to ImageKit
   */
  const uploadImageToImageKit = useCallback(
    async (
      base64Data: string,
      type: "webcam" | "screenshot",
    ): Promise<ImageKitUploadResult | null> => {
      try {
        const auth = await getImageKitAuth();
        if (!auth) return null;

        // Convert base64 to Blob
        const response = await fetch(base64Data);
        const blob = await response.blob();

        const formData = new FormData();
        const fileName = `${type}_${Date.now()}.jpg`;
        formData.append("file", blob, fileName);
        formData.append("fileName", fileName);
        formData.append("folder", "/test-monitoring");
        formData.append("signature", auth.signature);
        formData.append("expire", auth.expire.toString());
        formData.append("token", auth.token);
        formData.append("publicKey", auth.publicKey);

        const uploadResponse = await fetch("https://upload.imagekit.io/api/v1/files/upload", {
          method: "POST",
          body: formData,
        });

        if (!uploadResponse.ok) {
          throw new Error(`ImageKit upload failed with status ${uploadResponse.status}`);
        }

        const result = await uploadResponse.json();
        return {
          fileId: result.fileId,
          url: result.url,
        };
      } catch (error) {
        console.error("Failed to upload image to ImageKit:", error);
        return null;
      }
    },
    [getImageKitAuth],
  );

  /**
   * Processes and prepares a log for upload (handles ImageKit uploads for images)
   */
  const processLog = useCallback(
    async (
      log: OfflineLog,
    ): Promise<{ logType: string; submissionId: number; meta?: unknown[] } | null> => {
      if (!submissionId) return null;

      try {
        // Decrypt the log data
        const decryptedData = (await decryptData(log.encryptedData, submissionId)) as {
          logType: string;
          submissionId: number;
          meta?: Array<{ imageData?: string; takenAt?: string; [key: string]: unknown }>;
        };

        // Check if this is an image log that needs ImageKit upload
        const isImageLog = log.logType === "WEBCAM_PHOTO" || log.logType === "SCREENSHOT";

        if (isImageLog && decryptedData.meta && Array.isArray(decryptedData.meta)) {
          // Process each image in the meta array
          const processedMeta = await Promise.all(
            decryptedData.meta.map(
              async (item: { imageData?: string; takenAt?: string; [key: string]: unknown }) => {
                if (item.imageData) {
                  // Upload to ImageKit first
                  const imageType = log.logType === "WEBCAM_PHOTO" ? "webcam" : "screenshot";
                  const uploadResult = await uploadImageToImageKit(item.imageData, imageType);

                  if (!uploadResult) {
                    throw new Error("Failed to upload image to ImageKit");
                  }

                  // Replace imageData with fileId and image URL
                  return {
                    fileId: uploadResult.fileId,
                    image: uploadResult.url,
                    takenAt: item.takenAt,
                  };
                }
                return item;
              },
            ),
          );

          decryptedData.meta = processedMeta;
        }

        return decryptedData;
      } catch (error) {
        console.error(`❌ Error processing log (${log.logType}):`, error);
        if (log.id) {
          await incrementUploadAttempts(log.id);
        }
        return null;
      }
    },
    [submissionId, uploadImageToImageKit],
  );

  /**
   * Uploads a batch of logs to the backend
   */
  const uploadLogBatch = useCallback(
    async (logs: OfflineLog[]): Promise<OfflineLog[]> => {
      if (!submissionId || logs.length === 0) return [];

      try {
        // Process all logs (decrypt and handle ImageKit uploads)
        const processedLogs = await Promise.all(
          logs.map(async (log) => ({
            log,
            data: await processLog(log),
          })),
        );

        // Filter out failed processing
        const successfulLogs = processedLogs.filter((item) => item.data !== null);

        if (successfulLogs.length === 0) {
          return logs; // All failed processing
        }

        // Send all logs in one batch to backend
        const logsArray = successfulLogs.map((item) => item.data);
        debugLogger("📋 Offline logs being uploaded in batch:", logsArray.length);

        const response = await api("/proctoring-logs/batch", {
          auth: true,
          method: "POST",
          body: JSON.stringify({ logs: logsArray }),
        });

        if (response.ok) {
          // Count uploaded logs by type
          const counts = {
            screenshots: 0,
            webcamPhotos: 0,
            focusChanges: 0,
            clicks: 0,
            keystrokes: 0,
          };

          successfulLogs.forEach((item) => {
            const logType = item.data?.logType;
            const metaCount = Array.isArray(item.data?.meta) ? item.data.meta.length : 1;

            if (logType === "SCREENSHOT") {
              counts.screenshots += metaCount;
            } else if (logType === "WEBCAM_PHOTO") {
              counts.webcamPhotos += metaCount;
            } else if (logType === "FOCUS_CHANGE") {
              counts.focusChanges += metaCount;
            } else if (logType === "MOUSECLICK") {
              counts.clicks += metaCount;
            } else if (logType === "KEYSTROKE") {
              counts.keystrokes += metaCount;
            }
          });

          // Update the counts state to notify monitoring hooks
          setLastUploadedCounts(counts);

          // Successfully uploaded all, delete from IndexedDB
          await Promise.all(
            successfulLogs.map(async (item) => {
              if (item.log.id) {
                await deleteOfflineLog(item.log.id);
              }
            }),
          );
          debugLogger(`✅ Successfully uploaded batch of ${successfulLogs.length} offline log(s)`);
          return []; // All successful
        } else {
          // Batch upload failed, get detailed error
          const errorData = await response.json().catch(() => ({ message: response.statusText }));
          console.error(`❌ Offline batch upload failed:`, errorData);

          // Increment attempt counter for all logs in the failed batch
          await Promise.all(
            logs.map(async (log) => {
              if (log.id) {
                await incrementUploadAttempts(log.id);
              }
            }),
          );
          console.warn(`⚠️ Failed to upload batch:`, response.statusText);
          return logs; // All failed
        }
      } catch (error) {
        console.error(`❌ Error uploading batch:`, error);
        await Promise.all(
          logs.map(async (log) => {
            if (log.id) {
              await incrementUploadAttempts(log.id);
            }
          }),
        );
        return logs; // All failed
      }
    },
    [submissionId, processLog],
  );

  /**
   * Syncs all pending offline logs with the backend
   */
  const syncOfflineLogs = useCallback(async () => {
    if (!submissionId || !isOnline || syncingRef.current) {
      return;
    }

    syncingRef.current = true;
    setIsSyncing(true);

    try {
      debugLogger("📤 Starting offline logs sync...");

      // Get all pending logs
      const logs = await getOfflineLogs(submissionId);

      if (logs.length === 0) {
        debugLogger("✅ No offline logs to sync");
        setPendingCount(0);
        return;
      }

      debugLogger(`📦 Found ${logs.length} offline logs to sync`);

      // Filter out logs that have exceeded max attempts
      const validLogs = logs.filter((log) => log.uploadAttempts < MAX_UPLOAD_ATTEMPTS);
      const failedLogs = logs.filter((log) => log.uploadAttempts >= MAX_UPLOAD_ATTEMPTS);

      // Delete logs that have exceeded max attempts
      for (const log of failedLogs) {
        if (log.id) {
          await deleteOfflineLog(log.id);
          console.warn(`⚠️ Deleted log after ${MAX_UPLOAD_ATTEMPTS} failed attempts`);
        }
      }

      // Upload all logs in one batch
      if (validLogs.length > 0) {
        await uploadLogBatch(validLogs);
      }

      // Update pending count
      await updatePendingCount();

      debugLogger("✅ Offline logs sync completed");
    } catch (error) {
      console.error("❌ Error syncing offline logs:", error);
    } finally {
      syncingRef.current = false;
      setIsSyncing(false);
    }
  }, [submissionId, isOnline, uploadLogBatch, updatePendingCount]);

  /**
   * Trigger immediate sync
   */
  const syncNow = useCallback(async () => {
    await syncOfflineLogs();
  }, [syncOfflineLogs]);

  /**
   * Auto-sync when coming back online
   */
  useEffect(() => {
    if (isOnline && isTestActive && submissionId) {
      // Delay sync by 2 seconds to ensure connection is stable
      syncTimeoutRef.current = setTimeout(() => {
        syncOfflineLogs();
      }, 2000);
    }

    return () => {
      if (syncTimeoutRef.current) {
        clearTimeout(syncTimeoutRef.current);
      }
    };
  }, [isOnline, isTestActive, submissionId, syncOfflineLogs]);

  /**
   * Periodically update pending count
   */
  useEffect(() => {
    if (!submissionId || !isTestActive) return;

    updatePendingCount();

    const interval = setInterval(() => {
      updatePendingCount();
    }, 5000); // Update every 5 seconds

    return () => clearInterval(interval);
  }, [submissionId, isTestActive, updatePendingCount]);

  /**
   * Sync periodically when online
   */
  useEffect(() => {
    if (!isOnline || !isTestActive || !submissionId) return;

    const interval = setInterval(() => {
      syncOfflineLogs();
    }, 30000); // Sync every 30 seconds when online

    return () => clearInterval(interval);
  }, [isOnline, isTestActive, submissionId, syncOfflineLogs]);

  return {
    pendingCount,
    isSyncing,
    syncNow,
    hasPendingLogs: pendingCount > 0,
    lastUploadedCounts,
  };
};
