"use client";

import { useEffect, useState, useCallback } from "react";

import api from "./useApi";
import { debugLogger } from "@/utils/logger";

interface ImageKitConfig {
  publicKey: string;
  urlEndpoint: string;
}

interface UploadResponse {
  fileId: string;
  url: string;
  name: string;
  size: number;
  width: number;
  height: number;
  thumbnailUrl: string;
  filePath: string;
}

// Note: ImageKit requires a unique token per upload. Do NOT cache tokens.

export function useImageKitUploader() {
  const [config, setConfig] = useState<ImageKitConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [uploadInfo, setUploadInfo] = useState<UploadResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  // Deprecated: caching of tokens/signatures removed to avoid token reuse

  useEffect(() => {
    const fetchConfig = async () => {
      try {
        const res = await api("/upload/signature", {
          method: "GET",
          auth: true,
        });
        if (!res.ok) throw new Error("Failed to load ImageKit config");
        const data = await res.json();
        setConfig({
          publicKey: data.publicKey,
          urlEndpoint: data.urlEndpoint,
        });
      } catch (err: unknown) {
        console.error("⚠️ Failed to load ImageKit config:", err);
        setError(err instanceof Error ? err.message : "Unknown error occurred");
      } finally {
        setLoading(false);
      }
    };
    fetchConfig();
  }, []);

  const authenticator = useCallback(async () => {
    // Always fetch a fresh signature+token for each upload to ensure uniqueness
    debugLogger("📡 Fetching fresh ImageKit signature/token");
    const res = await api("/upload/signature", {
      method: "GET",
      auth: true,
    });
    if (!res.ok) throw new Error("Failed to get signature");
    const { signature, expire, token } = await res.json();
    return { signature, expire, token };
  }, []);

  const handleUploadSuccess = useCallback((res: UploadResponse) => {
    setUploadInfo(res);
  }, []);

  const handleUploadError = useCallback((err: unknown) => {
    console.error("❌ Upload error:", err);
    setError(err instanceof Error ? err.message : "Upload failed");
  }, []);

  return {
    config,
    authenticator,
    uploadInfo,
    error,
    loading,
    handleUploadSuccess,
    handleUploadError,
  };
}
