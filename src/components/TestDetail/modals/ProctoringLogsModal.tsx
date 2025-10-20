import React, { useEffect, useState } from "react";
import Image from "next/image";
import api from "@/hooks/useApi";

interface LogMeta {
  image: string;
  takenAt: string;
}

interface ProctoringLog {
  id: number;
  submissionId: number;
  meta: LogMeta[];
  logType: string;
  timestamp: string;
}

interface ProctoringLogsModalProps {
  open: boolean;
  submissionId: number | null;
  onClose: () => void;
}

const ProctoringLogsModal: React.FC<ProctoringLogsModalProps> = ({
  open,
  submissionId,
  onClose,
}) => {
  const [logs, setLogs] = useState<ProctoringLog[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  useEffect(() => {
    if (!open || !submissionId) return;
    setLoading(true);
    setError(null);
    setLogs(null);

    api(`/proctoring-logs/${submissionId}`, { auth: true })
      .then(async (res) => {
        if (!res.ok) throw new Error("Failed to fetch logs");
        return res.json();
      })
      .then(setLogs)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [open, submissionId]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto relative">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b">
          <h2 className="text-xl font-bold text-gray-800">Proctoring Logs</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-800 text-2xl font-bold focus:outline-none"
            aria-label="Close"
          >
            &times;
          </button>
        </div>
        <div className="p-4 min-h-[300px]">
          {loading && (
            <div className="flex justify-center items-center min-h-[200px]">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-yellow-600"></div>
            </div>
          )}
          {error && (
            <div className="text-red-500 text-center py-4">{error}</div>
          )}
          {!loading && logs && logs.length === 0 && (
            <div className="text-gray-500 text-center py-4">No logs found.</div>
          )}
          {!loading &&
            logs &&
            logs.length > 0 &&
            (() => {
              const allMeta = logs.flatMap((log) =>
                log.meta.map((meta) => ({
                  ...meta,
                  logId: log.id,
                }))
              );

              const sortedMeta = allMeta.sort(
                (a, b) =>
                  new Date(a.takenAt).getTime() - new Date(b.takenAt).getTime()
              );

              return (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                  {sortedMeta.map((meta, idx) => (
                    <div
                      key={`${meta.logId}-${idx}`}
                      className="cursor-pointer border rounded-lg overflow-hidden hover:shadow-lg bg-white"
                      onClick={() => setSelectedImage(meta.image)}
                    >
                      <div className="relative w-full h-32 sm:h-36 md:h-40">
                        <Image
                          src={meta.image}
                          alt={`Screenshot taken at ${meta.takenAt}`}
                          fill
                          className="object-cover transition-transform duration-200 hover:scale-105"
                          sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, 25vw"
                          priority={false}
                        />
                      </div>
                      <div className="text-xs text-gray-500 p-1 truncate">
                        {new Date(meta.takenAt).toLocaleString()}
                      </div>
                    </div>
                  ))}
                </div>
              );
            })()}
        </div>
        {/* Large image modal */}
        {selectedImage && (
          <div
            className="fixed inset-0 z-60 flex items-center justify-center bg-black bg-opacity-80"
            onClick={() => setSelectedImage(null)}
          >
            <div className="relative max-h-[80vh] max-w-[90vw]">
              <Image
                src={selectedImage}
                alt="Screenshot"
                width={1600}
                height={900}
                className="h-auto w-auto max-h-[80vh] max-w-[90vw] rounded-lg border-4 border-white shadow-2xl"
                onClick={(e) => e.stopPropagation()}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProctoringLogsModal;
