"use client";

import { useEffect, useState, useCallback } from "react";

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

export function useImageKitUploader() {
  const [config, setConfig] = useState<ImageKitConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [uploadInfo, setUploadInfo] = useState<UploadResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  // 🔧 Load config once from backend
  useEffect(() => {
    const fetchConfig = async () => {
      try {
        const res = await fetch("http://localhost:3000/upload/signature");
        if (!res.ok) throw new Error("Failed to load ImageKit config");
        const data = await res.json();
        setConfig({
          publicKey: data.publicKey,
          urlEndpoint: data.urlEndpoint
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

  // 🔑 Authenticator function for IKContext
  const authenticator = useCallback(async () => {
    const res = await fetch("http://localhost:3000/upload/signature");
    if (!res.ok) throw new Error("Failed to get signature");
    const { signature, expire, token } = await res.json();
    return { signature, expire, token };
  }, []);

  // 📤 Track upload result
  const handleUploadSuccess = useCallback((res: UploadResponse) => {
    console.log("✅ Uploaded:", res);
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
    handleUploadError
  };
}
