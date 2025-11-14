import React, { useEffect, useState, useMemo } from "react";
import Image from "next/image";
import { Camera, Monitor } from "lucide-react";
import api from "@/hooks/useApi";

interface LogMeta {
  image: string;
  takenAt: string;
}

interface ProctoringLog {
  id: number;
  submissionId: number;
  meta: LogMeta[];
  logType: "SCREENSHOT" | "WEBCAM_PHOTO" | "SYSTEM_EVENT";
  timestamp: string;
}

interface ProctoringLogsModalProps {
  open: boolean;
  submissionId: number | null;
  onClose: () => void;
}

type FilterType = "ALL" | "SCREENSHOT" | "WEBCAM_PHOTO";

const ProctoringLogsModal: React.FC<ProctoringLogsModalProps> = ({
  open,
  submissionId,
  onClose,
}) => {
  const [logs, setLogs] = useState<ProctoringLog[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [filterType, setFilterType] = useState<FilterType>("ALL");

  useEffect(() => {
    if (!open || !submissionId) return;
    setLoading(true);
    setError(null);
    setLogs(null);
    setFilterType("ALL");

    api(`/proctoring-logs/${submissionId}`, { auth: true })
      .then(async (res) => {
        if (!res.ok) throw new Error("Failed to fetch logs");
        return res.json();
      })
      .then(setLogs)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [open, submissionId]);

  // Filter and sort logs based on selected filter
  const filteredLogs = useMemo(() => {
    if (!logs) return [];

    const filtered =
      filterType === "ALL"
        ? logs
        : logs.filter((log) => log.logType === filterType);

    const allMeta = filtered.flatMap((log) =>
      log.meta.map((meta) => ({
        ...meta,
        logId: log.id,
        logType: log.logType,
      }))
    );

    return allMeta.sort(
      (a, b) => new Date(a.takenAt).getTime() - new Date(b.takenAt).getTime()
    );
  }, [logs, filterType]);

  // Count logs by type
  const logCounts = useMemo(() => {
    if (!logs) return { screenshot: 0, webcam: 0, total: 0 };

    const counts = logs.reduce(
      (acc, log) => {
        const metaCount = log.meta.length;
        if (log.logType === "SCREENSHOT") {
          acc.screenshot += metaCount;
        } else if (log.logType === "WEBCAM_PHOTO") {
          acc.webcam += metaCount;
        }
        acc.total += metaCount;
        return acc;
      },
      { screenshot: 0, webcam: 0, total: 0 }
    );

    return counts;
  }, [logs]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-5xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b bg-gradient-to-r from-yellow-50 to-orange-50">
          <h2 className="text-xl font-bold text-gray-800">Proctoring Logs</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-800 text-2xl font-bold focus:outline-none transition-colors"
            aria-label="Close"
          >
            &times;
          </button>
        </div>

        {/* Filter Buttons */}
        {!loading && logs && logs.length > 0 && (
          <div className="px-6 py-4 border-b bg-gray-50">
            <div className="flex flex-wrap gap-3">
              <button
                onClick={() => setFilterType("ALL")}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${
                  filterType === "ALL"
                    ? "bg-yellow-500 text-white shadow-md"
                    : "bg-white text-gray-700 hover:bg-gray-100 border border-gray-300"
                }`}
              >
                <span>All</span>
                <span className="text-sm bg-white/20 px-2 py-0.5 rounded-full">
                  {logCounts.total}
                </span>
              </button>

              <button
                onClick={() => setFilterType("SCREENSHOT")}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${
                  filterType === "SCREENSHOT"
                    ? "bg-blue-500 text-white shadow-md"
                    : "bg-white text-gray-700 hover:bg-gray-100 border border-gray-300"
                }`}
              >
                <Monitor size={18} />
                <span>Screenshots</span>
                <span className="text-sm bg-white/20 px-2 py-0.5 rounded-full">
                  {logCounts.screenshot}
                </span>
              </button>

              <button
                onClick={() => setFilterType("WEBCAM_PHOTO")}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${
                  filterType === "WEBCAM_PHOTO"
                    ? "bg-green-500 text-white shadow-md"
                    : "bg-white text-gray-700 hover:bg-gray-100 border border-gray-300"
                }`}
              >
                <Camera size={18} />
                <span>Webcam Photos</span>
                <span className="text-sm bg-white/20 px-2 py-0.5 rounded-full">
                  {logCounts.webcam}
                </span>
              </button>
            </div>
          </div>
        )}

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 min-h-[300px]">
          {loading && (
            <div className="flex justify-center items-center min-h-[200px]">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-600 mx-auto mb-4"></div>
                <p className="text-gray-600">Loading proctoring logs...</p>
              </div>
            </div>
          )}

          {error && (
            <div className="flex justify-center items-center min-h-[200px]">
              <div className="text-center">
                <p className="text-red-500 text-lg mb-2">Error loading logs</p>
                <p className="text-gray-600">{error}</p>
              </div>
            </div>
          )}

          {!loading && logs && logs.length === 0 && (
            <div className="flex justify-center items-center min-h-[200px]">
              <div className="text-center">
                <p className="text-gray-500 text-lg">
                  No proctoring logs found
                </p>
                <p className="text-gray-400 text-sm mt-2">
                  Logs will appear here once the student starts the test
                </p>
              </div>
            </div>
          )}

          {!loading && logs && logs.length > 0 && filteredLogs.length === 0 && (
            <div className="flex justify-center items-center min-h-[200px]">
              <div className="text-center">
                <p className="text-gray-500 text-lg">
                  No {filterType.toLowerCase().replace("_", " ")} found
                </p>
                <p className="text-gray-400 text-sm mt-2">
                  Try selecting a different filter
                </p>
              </div>
            </div>
          )}

          {!loading && logs && logs.length > 0 && filteredLogs.length > 0 && (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {filteredLogs.map((meta, idx) => (
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
                        {meta.logType === "SCREENSHOT" ? (
                          <Monitor size={12} />
                        ) : (
                          <Camera size={12} />
                        )}
                        <span>
                          {meta.logType === "SCREENSHOT" ? "Screen" : "Webcam"}
                        </span>
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
          )}
        </div>
      </div>

      {/* Large Image Modal */}
      {selectedImage && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/90 backdrop-blur-sm p-4"
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

export default ProctoringLogsModal;
