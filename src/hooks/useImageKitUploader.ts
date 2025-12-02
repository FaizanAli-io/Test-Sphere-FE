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

interface CachedSignature {
  signature: string;
  expire: number;
  token: string;
  fetchedAt: number;
}

export function useImageKitUploader() {
  const [config, setConfig] = useState<ImageKitConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [uploadInfo, setUploadInfo] = useState<UploadResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [cachedSignature, setCachedSignature] = useState<CachedSignature | null>(null);

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
    const now = Date.now();
    const ONE_MINUTE = 60 * 1000;

    // Return cached signature if less than 1 minute old
    if (cachedSignature && now - cachedSignature.fetchedAt < ONE_MINUTE) {
      debugLogger("✅ Using cached ImageKit signature");
      return {
        signature: cachedSignature.signature,
        expire: cachedSignature.expire,
        token: cachedSignature.token,
      };
    }

    // Fetch new signature
    debugLogger("📡 Fetching new ImageKit signature");
    const res = await api("/upload/signature", {
      method: "GET",
      auth: true,
    });
    if (!res.ok) throw new Error("Failed to get signature");
    const { signature, expire, token } = await res.json();

    // Cache the new signature
    setCachedSignature({
      signature,
      expire,
      token,
      fetchedAt: now,
    });

    return { signature, expire, token };
  }, [cachedSignature]);

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
