import React, { useEffect, useState } from "react";
import { Camera, CameraOff, Loader2, Video } from "lucide-react";
import { useWebRTC } from "@/hooks/useWebRTC";

interface StreamingIndicatorProps {
  userId: string;
  testId: string;
  enabled: boolean;
}

export const StreamingIndicator: React.FC<StreamingIndicatorProps> = ({
  userId,
  testId,
  enabled,
}) => {
  const [isMinimized, setIsMinimized] = useState(false);

  const {
    isConnected,
    isStreaming,
    error,
    localStream,
    startStreaming,
    stopStreaming,
  } = useWebRTC({
    userId,
    role: "student",
    testId,
    enabled,
  });

  // Auto-start streaming when connected
  useEffect(() => {
    if (isConnected && !isStreaming && !localStream && enabled) {
      startStreaming().catch((err) => {
        console.error("Failed to start streaming:", err);
      });
    }
  }, [isConnected, isStreaming, localStream, enabled, startStreaming]);

  if (!enabled) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50">
      {!isMinimized ? (
        <div className="bg-gray-900 rounded-lg shadow-2xl border-2 border-gray-700 overflow-hidden w-80">
          {/* Header */}
          <div className="bg-gray-800 px-4 py-2 flex items-center justify-between border-b border-gray-700">
            <div className="flex items-center gap-2">
              <Video size={16} className="text-yellow-500" />
              <span className="text-white text-sm font-medium">
                Proctoring Active
              </span>
            </div>
            <button
              onClick={() => setIsMinimized(true)}
              className="text-gray-400 hover:text-white text-lg"
            >
              −
            </button>
          </div>

          {/* Content */}
          <div className="p-4">
            {/* Status */}
            <div className="mb-3">
              {!isConnected && (
                <div className="flex items-center gap-2 text-yellow-500 text-sm">
                  <Loader2 size={16} className="animate-spin" />
                  <span>Connecting to server...</span>
                </div>
              )}

              {isConnected && !isStreaming && !error && (
                <div className="flex items-center gap-2 text-blue-500 text-sm">
                  <Loader2 size={16} className="animate-spin" />
                  <span>Initializing camera...</span>
                </div>
              )}

              {isStreaming && (
                <div className="flex items-center gap-2 text-green-500 text-sm">
                  <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                  <span className="font-medium">Streaming Active</span>
                </div>
              )}

              {error && (
                <div className="flex items-center gap-2 text-red-500 text-sm">
                  <CameraOff size={16} />
                  <span>{error}</span>
                </div>
              )}
            </div>

            {/* Info */}
            <div className="text-gray-400 text-xs space-y-1">
              <p>• Your test session is being monitored</p>
              <p>• Camera and screen are being recorded</p>
              <p>• Do not close this window</p>
            </div>

            {/* Retry Button */}
            {error && (
              <button
                onClick={() => startStreaming()}
                className="mt-3 w-full px-3 py-2 bg-yellow-500 hover:bg-yellow-600 text-white text-sm font-medium rounded-lg transition-colors"
              >
                Retry Connection
              </button>
            )}
          </div>
        </div>
      ) : (
        <button
          onClick={() => setIsMinimized(false)}
          className={`px-4 py-2 rounded-full shadow-lg flex items-center gap-2 ${
            isStreaming
              ? "bg-green-500 hover:bg-green-600"
              : error
                ? "bg-red-500 hover:bg-red-600"
                : "bg-yellow-500 hover:bg-yellow-600"
          } text-white transition-colors`}
        >
          {isStreaming ? (
            <>
              <Camera size={18} />
              <span className="text-sm font-medium">Streaming</span>
            </>
          ) : error ? (
            <>
              <CameraOff size={18} />
              <span className="text-sm font-medium">Error</span>
            </>
          ) : (
            <>
              <Loader2 size={18} className="animate-spin" />
              <span className="text-sm font-medium">Connecting</span>
            </>
          )}
        </button>
      )}
    </div>
  );
};
