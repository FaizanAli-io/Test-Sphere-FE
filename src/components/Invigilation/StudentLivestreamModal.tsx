import React, { useEffect, useRef, useState } from "react";
import { X, Camera, Mic, Loader2 } from "lucide-react";
import type { InvigilatingStudent } from "@/hooks/useInvigilateStudents";
import { useWebRTC } from "@/hooks/useWebRTC";

interface StudentLivestreamModalProps {
  student: InvigilatingStudent | null;
  teacherId: string;
  testId: string;
  onClose: () => void;
}

export const StudentLivestreamModal: React.FC<StudentLivestreamModalProps> = ({
  student,
  teacherId,
  testId,
  onClose,
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isRequesting, setIsRequesting] = useState(false);

  const {
    isConnected,
    isStreaming,
    error,
    connectionState,
    remoteStream,
    requestStream,
    stopViewingStream,
  } = useWebRTC({
    userId: teacherId,
    role: "teacher",
    testId,
    enabled: !!student,
  });

  useEffect(() => {
    if (!student || !isConnected) return;

    const initStream = async () => {
      setIsRequesting(true);
      try {
        await requestStream(student.id.toString());
      } catch (error) {
        console.error("Failed to request stream:", error);
      } finally {
        setIsRequesting(false);
      }
    };

    initStream();

    return () => {
      if (student) {
        stopViewingStream(student.id.toString());
      }
    };
  }, [student, isConnected]);

  // Attach remote stream to video element
  useEffect(() => {
    if (videoRef.current && remoteStream) {
      videoRef.current.srcObject = remoteStream;
    }
  }, [remoteStream]);

  if (!student) return null;

  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4"
      onClick={handleBackdropClick}
    >
      <div className="bg-gray-900 rounded-lg w-full max-w-4xl max-h-[90vh] overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="bg-gray-800 px-6 py-4 flex items-center justify-between border-b border-gray-700">
          <div className="flex items-center gap-4">
            <h2 className="text-white text-xl font-semibold">{student.name}</h2>
            <div className="flex items-center gap-2 bg-red-500 text-white text-xs px-3 py-1 rounded-full">
              <span className="w-2 h-2 bg-white rounded-full animate-pulse"></span>
              <span className="font-medium">LIVE</span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors p-2 hover:bg-gray-700 rounded-lg"
          >
            <X size={24} />
          </button>
        </div>

        {/* Video Container */}
        <div className="relative bg-black aspect-video">
          <video
            ref={videoRef}
            autoPlay
            playsInline
            className="w-full h-full object-contain"
          />

          {/* Connection Status Overlay */}
          {!isConnected && (
            <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50">
              <div className="text-center">
                <Loader2 className="animate-spin h-16 w-16 text-yellow-500 mx-auto mb-4" />
                <p className="text-white text-lg">Connecting to server...</p>
              </div>
            </div>
          )}

          {isConnected && !isStreaming && !error && (
            <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50">
              <div className="text-center">
                <Loader2 className="animate-spin h-16 w-16 text-yellow-500 mx-auto mb-4" />
                <p className="text-white text-lg">Requesting stream...</p>
                <p className="text-gray-300 text-sm mt-2">
                  Waiting for student to accept
                </p>
              </div>
            </div>
          )}

          {error && (
            <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50">
              <div className="text-center">
                <p className="text-red-500 text-lg mb-2">Connection Error</p>
                <p className="text-gray-400">{error}</p>
                <button
                  onClick={() => window.location.reload()}
                  className="mt-4 px-4 py-2 bg-yellow-500 hover:bg-yellow-600 text-white rounded-lg transition-colors"
                >
                  Retry
                </button>
              </div>
            </div>
          )}

          {isStreaming && connectionState && (
            <div className="absolute top-4 right-4 z-10">
              <div className="flex items-center gap-2 bg-green-500 bg-opacity-90 text-white text-sm px-3 py-1 rounded-full">
                <span className="w-2 h-2 bg-white rounded-full animate-pulse"></span>
                <span className="font-medium">Streaming</span>
              </div>
            </div>
          )}

          {/* Device Status Indicators */}
          <div className="absolute bottom-4 left-4 flex gap-3">
            <div
              className={`flex items-center gap-2 px-3 py-2 rounded-lg ${
                student.cameraEnabled
                  ? "bg-green-500 bg-opacity-80"
                  : "bg-gray-700 bg-opacity-80"
              }`}
            >
              <Camera size={18} className="text-white" />
              <span className="text-white text-sm font-medium">
                {student.cameraEnabled ? "Camera On" : "Camera Off"}
              </span>
            </div>
            <div
              className={`flex items-center gap-2 px-3 py-2 rounded-lg ${
                student.microphoneEnabled
                  ? "bg-green-500 bg-opacity-80"
                  : "bg-gray-700 bg-opacity-80"
              }`}
            >
              <Mic size={18} className="text-white" />
              <span className="text-white text-sm font-medium">
                {student.microphoneEnabled ? "Mic On" : "Mic Off"}
              </span>
            </div>
          </div>
        </div>

        {/* Footer Info */}
        <div className="bg-gray-800 px-6 py-4 border-t border-gray-700">
          <div className="flex items-center justify-between text-sm">
            <div className="text-gray-400">
              <span className="font-medium text-white">Email:</span>{" "}
              {student.email}
            </div>
            <div className="text-gray-400">
              <span className="font-medium text-white">Submission ID:</span>{" "}
              {student.submissionId}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
