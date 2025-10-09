"use client";

import React from "react";
import { IKContext, IKUpload } from "imagekitio-react";
import { useImageKitUploader } from "@/hooks/useImageKitUploader";

export default function UploadPage() {
  const {
    config,
    authenticator,
    uploadInfo,
    error,
    loading,
    handleUploadSuccess,
    handleUploadError
  } = useImageKitUploader();

  if (loading) return <p>⚙️ Loading ImageKit...</p>;
  if (error) return <p className="text-red-600">❌ {error}</p>;
  if (!config) return null;

  return (
    <IKContext
      publicKey={config.publicKey}
      urlEndpoint={config.urlEndpoint}
      authenticator={authenticator}
    >
      <div className="p-4">
        <h2 className="font-semibold text-lg mb-2">📸 Upload Image</h2>

        <IKUpload
          fileName="sample.jpg"
          onSuccess={handleUploadSuccess}
          onError={handleUploadError}
        />

        {uploadInfo && (
          <div className="mt-4">
            <p>✅ Uploaded: {uploadInfo.name}</p>
            <img
              src={uploadInfo.thumbnailUrl || uploadInfo.url}
              alt="Uploaded file"
              className="w-64 mt-2 rounded border"
            />
          </div>
        )}
      </div>
    </IKContext>
  );
}
