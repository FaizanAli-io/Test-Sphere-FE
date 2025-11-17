import React, { useState, useMemo } from "react";
import { Camera, Monitor } from "lucide-react";
import Image from "next/image";

import { ProctoringLog, ImageMeta } from "./types";

interface ImageLogsViewProps {
  logs: ProctoringLog[];
  showFilters?: boolean;
  initialFilter?: "ALL" | "SCREENSHOT" | "WEBCAM_PHOTO";
}

type ImageFilterType = "ALL" | "SCREENSHOT" | "WEBCAM_PHOTO";

export const ImageLogsView: React.FC<ImageLogsViewProps> = ({
  logs,
  showFilters = false,
  initialFilter = "ALL",
}) => {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [internalFilter, setInternalFilter] = useState<ImageFilterType>("ALL");

  // Use initialFilter from parent when not showing internal filters, otherwise use internal state
  const activeFilter = showFilters ? internalFilter : initialFilter;

  // Filter and flatten image logs
  const filteredImages = useMemo(() => {
    const imageLogs = logs.filter(
      (log) => log.logType === "SCREENSHOT" || log.logType === "WEBCAM_PHOTO",
    );

    const filtered =
      activeFilter === "ALL" ? imageLogs : imageLogs.filter((log) => log.logType === activeFilter);

    const allImages = filtered.flatMap((log) =>
      log.meta.map((meta) => ({
        ...(meta as ImageMeta),
        logId: log.id,
        logType: log.logType,
      })),
    );

    return allImages.sort((a, b) => new Date(a.takenAt).getTime() - new Date(b.takenAt).getTime());
  }, [logs, activeFilter]);

  // Count images by type
  const imageCounts = useMemo(() => {
    const imageLogs = logs.filter(
      (log) => log.logType === "SCREENSHOT" || log.logType === "WEBCAM_PHOTO",
    );

    return imageLogs.reduce(
      (acc, log) => {
        const count = log.metaLength;
        if (log.logType === "SCREENSHOT") {
          acc.screenshot += count;
        } else if (log.logType === "WEBCAM_PHOTO") {
          acc.webcam += count;
        }
        acc.total += count;
        return acc;
      },
      { screenshot: 0, webcam: 0, total: 0 },
    );
  }, [logs]);

  if (filteredImages.length === 0) {
    return (
      <div className="flex justify-center items-center min-h-[300px]">
        <div className="text-center">
          <p className="text-gray-500 text-lg">No images found</p>
          <p className="text-gray-400 text-sm mt-2">
            {activeFilter === "ALL"
              ? "No screenshots or webcam photos have been captured yet"
              : `No ${activeFilter.toLowerCase().replace("_", " ")} found`}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Filter Buttons */}
      {showFilters && (
        <div className="flex flex-wrap gap-3">
          <button
            onClick={() => setInternalFilter("ALL")}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${
              internalFilter === "ALL"
                ? "bg-yellow-500 text-white shadow-md"
                : "bg-white text-gray-700 hover:bg-gray-100 border border-gray-300"
            }`}
          >
            <span>All Images</span>
            <span className="text-sm bg-white/20 px-2 py-0.5 rounded-full">
              {imageCounts.total}
            </span>
          </button>

          <button
            onClick={() => setInternalFilter("SCREENSHOT")}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${
              internalFilter === "SCREENSHOT"
                ? "bg-blue-500 text-white shadow-md"
                : "bg-white text-gray-700 hover:bg-gray-100 border border-gray-300"
            }`}
          >
            <Monitor size={18} />
            <span>Screenshots</span>
            <span className="text-sm bg-white/20 px-2 py-0.5 rounded-full">
              {imageCounts.screenshot}
            </span>
          </button>

          <button
            onClick={() => setInternalFilter("WEBCAM_PHOTO")}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${
              internalFilter === "WEBCAM_PHOTO"
                ? "bg-green-500 text-white shadow-md"
                : "bg-white text-gray-700 hover:bg-gray-100 border border-gray-300"
            }`}
          >
            <Camera size={18} />
            <span>Webcam Photos</span>
            <span className="text-sm bg-white/20 px-2 py-0.5 rounded-full">
              {imageCounts.webcam}
            </span>
          </button>
        </div>
      )}

      {/* Image Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
        {filteredImages.map((meta, idx) => (
          <div
            key={`${meta.logId}-${idx}`}
            className="group cursor-pointer border-2 rounded-lg overflow-hidden hover:shadow-xl transition-all duration-200 bg-white hover:border-yellow-400"
            onClick={() => setSelectedImage(meta.image)}
          >
            {/* Image Type Badge */}
            <div className="relative">
              <div className="absolute top-2 left-2 z-10">
                <div
                  className={`flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium shadow-md ${
                    meta.logType === "SCREENSHOT"
                      ? "bg-blue-500 text-white"
                      : "bg-green-500 text-white"
                  }`}
                >
                  {meta.logType === "SCREENSHOT" ? <Monitor size={12} /> : <Camera size={12} />}
                  <span>{meta.logType === "SCREENSHOT" ? "Screen" : "Webcam"}</span>
                </div>
              </div>

              <div className="relative w-full h-32 sm:h-36 md:h-40 bg-gray-100">
                <Image
                  src={meta.image}
                  alt={`${meta.logType} taken at ${meta.takenAt}`}
                  fill
                  className="object-cover transition-transform duration-200 group-hover:scale-110"
                  sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, (max-width: 1024px) 25vw, 20vw"
                  priority={false}
                />
              </div>
            </div>

            {/* Timestamp */}
            <div className="p-2 bg-gray-50 border-t">
              <p className="text-xs text-gray-600 font-medium truncate">
                {new Date(meta.takenAt).toLocaleTimeString()}
              </p>
              <p className="text-xs text-gray-400 truncate">
                {new Date(meta.takenAt).toLocaleDateString()}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Large Image Modal */}
      {selectedImage && (
        <div
          className="fixed inset-0 z-[70] flex items-center justify-center bg-black/90 backdrop-blur-sm p-4"
          onClick={() => setSelectedImage(null)}
        >
          <div className="relative max-h-[90vh] max-w-[95vw]">
            <button
              onClick={() => setSelectedImage(null)}
              className="absolute -top-12 right-0 text-white hover:text-gray-300 text-4xl font-bold focus:outline-none transition-colors"
              aria-label="Close"
            >
              &times;
            </button>
            <Image
              src={selectedImage}
              alt="Full size view"
              width={1600}
              height={900}
              className="h-auto w-auto max-h-[90vh] max-w-[95vw] rounded-lg shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            />
          </div>
        </div>
      )}
    </div>
  );
};
