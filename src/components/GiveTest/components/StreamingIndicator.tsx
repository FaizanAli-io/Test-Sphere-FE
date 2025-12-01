import React, { useEffect, useState, useRef } from "react";
import { Camera, CameraOff, Loader2, Video } from "lucide-react";
import { useWebRTC } from "@/hooks/useWebRTC";
import { useConnectionMonitor } from "@/hooks/useConnectionMonitor";

interface StreamingIndicatorProps {
  userId: string;
  testId: string;
  enabled: boolean;
  initialStream?: MediaStream;
  initialScreenStream?: MediaStream;
}

export const StreamingIndicator: React.FC<StreamingIndicatorProps> = ({
  userId,
  testId,
  enabled,
  initialStream,
  initialScreenStream,
}) => {
  const [isMinimized, setIsMinimized] = useState(false);
  const wasOfflineRef = useRef(false);

  const { isConnected, isStreaming, error, stopStreaming, reconnect } = useWebRTC({
    userId,
    role: "student",
    testId,
    enabled,
    initialStream,
    initialScreenStream,
  });

  const { isOnline } = useConnectionMonitor(enabled);

  // Monitor connection status and trigger reconnection when connection is restored
  useEffect(() => {
    if (!enabled) return;

    if (!isOnline) {
      // Connection lost
      wasOfflineRef.current = true;
      console.log("[StreamingIndicator] Connection lost");
    } else if (wasOfflineRef.current && isOnline) {
      // Connection restored
      console.log("[StreamingIndicator] Connection restored, triggering WebRTC reconnection");
      wasOfflineRef.current = false;

      // Trigger WebRTC reconnection
      if (reconnect) {
        reconnect();
      }
    }
  }, [isOnline, enabled, reconnect]);

  // Stop streaming when component unmounts (leaving the test)
  useEffect(() => {
    return () => {
      try {
        stopStreaming();
      } catch {}
    };
  }, [stopStreaming]);

  if (!enabled) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50">
      {!isMinimized ? (
        <div className="bg-gray-900 rounded-lg shadow-2xl border-2 border-gray-700 overflow-hidden w-80">
          {/* Header */}
          <div className="bg-gray-800 px-4 py-2 flex items-center justify-between border-b border-gray-700">
            <div className="flex items-center gap-2">
              <Video size={16} className="text-yellow-500" />
              <span className="text-white text-sm font-medium">Proctoring Active</span>
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
                <div className="flex items-center gap-2 text-green-500 text-sm">
                  <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                  <span className="font-medium">Ready</span>
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
              {isStreaming ? (
                <>
                  <p>• Your test session is being monitored</p>
                  <p>• Camera/screen may be viewed by teacher</p>
                  <p>• Do not close this window</p>
                </>
              ) : (
                <>
                  <p>• Ready for proctoring</p>
                  <p>• Teacher can request camera or screen view</p>
                  <p>• You will be notified when streaming starts</p>
                </>
              )}
            </div>
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
