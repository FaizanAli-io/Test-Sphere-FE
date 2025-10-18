"use client";

import Image from "next/image";
import { Upload, AlertCircle } from "lucide-react";
import React, { useState, useCallback } from "react";
import { IKContext, IKUpload } from "imagekitio-react";

import { useImageKitUploader } from "@/hooks/useImageKitUploader";

interface ProfileImageUploadProps {
  profileImage: string;
  onImageChange: (url: string) => void;
  className?: string;
}

export default function ProfileImageUpload({
  profileImage,
  onImageChange,
  className = ""
}: ProfileImageUploadProps) {
  const {
    config,
    authenticator,
    error: uploadError,
    loading: configLoading,
    handleUploadSuccess,
    handleUploadError
  } = useImageKitUploader();

  const [isUploading, setIsUploading] = useState(false);

  // Handle upload events
  const onUploadStart = useCallback(() => {
    setIsUploading(true);
  }, []);

  const onUploadSuccess = useCallback(
    (res: {
      fileId: string;
      url: string;
      name: string;
      size: number;
      width: number;
      height: number;
      thumbnailUrl: string;
      filePath: string;
    }) => {
      onImageChange(res.url);
      setIsUploading(false);
      handleUploadSuccess(res);
    },
    [onImageChange, handleUploadSuccess]
  );

  const onUploadError = useCallback(
    (err: Error | { message: string; [key: string]: unknown }) => {
      console.error("❌ Upload failed:", err);
      setIsUploading(false);
      handleUploadError(err);
    },
    [handleUploadError]
  );

  return (
    <div className={className}>
      <label className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
        <span className="w-1 h-4 bg-indigo-500 rounded-full inline-block"></span>
        Profile image
      </label>

      {/* Image preview */}
      <div className="flex items-center gap-4 mb-3">
        {profileImage ? (
          <div className="relative w-20 h-20">
            <Image
              src={profileImage}
              alt="Profile preview"
              fill
              className="rounded-xl object-cover border border-gray-200 shadow-sm"
            />
          </div>
        ) : (
          <div className="w-20 h-20 flex items-center justify-center rounded-xl bg-gray-100 border border-gray-200 text-gray-500 text-sm">
            No Image
          </div>
        )}

        <div className="flex flex-col gap-2">
          {/* ImageKit Upload */}
          {config && !configLoading ? (
            <IKContext
              publicKey={config.publicKey}
              urlEndpoint={config.urlEndpoint}
              authenticator={authenticator}
            >
              <div className="relative">
                <IKUpload
                  fileName="profile-image.jpg"
                  onUploadStart={onUploadStart}
                  onSuccess={onUploadSuccess}
                  onError={onUploadError}
                  style={{
                    position: "absolute",
                    opacity: 0,
                    width: "100%",
                    height: "100%",
                    cursor: "pointer"
                  }}
                />
                <div className="inline-flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg shadow hover:bg-indigo-700 cursor-pointer transition-colors">
                  {isUploading ? (
                    <>
                      <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24">
                        <circle
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="white"
                          strokeWidth="3"
                          strokeOpacity="0.25"
                          fill="none"
                        />
                        <path
                          d="M22 12a10 10 0 0 1-10 10"
                          stroke="white"
                          strokeWidth="3"
                          strokeLinecap="round"
                          fill="none"
                        />
                      </svg>
                      Uploading...
                    </>
                  ) : (
                    <>
                      <Upload className="w-4 h-4" /> Upload Image
                    </>
                  )}
                </div>
              </div>
            </IKContext>
          ) : (
            <div className="inline-flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-gray-400 bg-gray-200 rounded-lg">
              <Upload className="w-4 h-4" /> Loading...
            </div>
          )}

          {/* Manual URL fallback */}
          <input
            value={profileImage}
            onChange={(e) => onImageChange(e.target.value)}
            placeholder="Or paste image URL"
            className="block w-full rounded-lg border border-gray-200 shadow-sm focus:ring-2 focus:ring-indigo-300 focus:border-indigo-300 px-3 py-2 text-gray-700 bg-white text-sm"
          />
        </div>
      </div>

      {/* Upload feedback */}
      {uploadError && (
        <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
          <AlertCircle className="w-3 h-3" /> {uploadError}
        </p>
      )}
      {isUploading && (
        <p className="text-xs text-indigo-500 mt-1">Uploading image...</p>
      )}
    </div>
  );
}
