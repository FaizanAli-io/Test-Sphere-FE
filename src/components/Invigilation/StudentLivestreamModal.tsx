import React, { useEffect, useRef, useState } from "react";
import { X, Camera, Mic } from "lucide-react";
import type { InvigilatingStudent } from "@/hooks/useInvigilateStudents";

interface StudentLivestreamModalProps {
  student: InvigilatingStudent | null;
  onClose: () => void;
}

export const StudentLivestreamModal: React.FC<StudentLivestreamModalProps> = ({
  student,
  onClose,
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [connectionStatus, setConnectionStatus] = useState<
    "connecting" | "connected" | "failed"
  >("connecting");

  useEffect(() => {
    if (!student) return;

    // Placeholder WebRTC connection logic
    const startWebRTCConnection = async (studentId: number) => {
      console.log(`Starting WebRTC connection for student ${studentId}`);
      setConnectionStatus("connecting");

      // Simulate connection delay
      await new Promise((resolve) => setTimeout(resolve, 2000));

      // TODO: Implement actual WebRTC signaling here
      // This is where you would:
      // 1. Create RTCPeerConnection
      // 2. Exchange SDP offers/answers with the backend
      // 3. Handle ICE candidates
      // 4. Attach the remote stream to the video element

      // For now, just simulate a connection
      setConnectionStatus("connected");

      // Example of how to attach a stream when implemented:
      // if (videoRef.current && remoteStream) {
      //   videoRef.current.srcObject = remoteStream;
      // }
    };

    startWebRTCConnection(student.id);

    // Cleanup function
    return () => {
      console.log(`Cleaning up WebRTC connection for student ${student.id}`);
      // TODO: Close peer connection and clean up resources
    };
  }, [student]);

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
          {connectionStatus === "connecting" && (
            <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50">
              <div className="text-center">
                <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-yellow-500 mx-auto mb-4"></div>
                <p className="text-white text-lg">
                  Connecting to livestream...
                </p>
              </div>
            </div>
          )}

          {connectionStatus === "failed" && (
            <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50">
              <div className="text-center">
                <p className="text-red-500 text-lg mb-2">Connection failed</p>
                <p className="text-gray-400">
                  Unable to connect to student stream
                </p>
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
