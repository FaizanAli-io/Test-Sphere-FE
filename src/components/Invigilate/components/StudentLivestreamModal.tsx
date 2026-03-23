import React, { useEffect, useRef, useState } from 'react';
import { X, Camera, Mic, Loader2, Activity, AlertTriangle, Eye, EyeOff } from 'lucide-react';

import { debugLogger } from '@/utils/logger';
import { useWebRTC } from '@/hooks/useWebRTC';
import type { InvigilatingStudent } from '../hooks';
import type { ProctoringData } from '../hooks';
import { useConnectionMonitor } from '@/hooks/useConnectionMonitor';

function getScoreColor(score: number): string {
  const hue = (1 - Math.min(Math.max(score, 0), 1)) * 120;
  return `hsl(${hue}, 85%, 50%)`;
}

function getScoreLabel(score: number): string {
  if (score <= 0.3) return 'Safe';
  if (score <= 0.6) return 'Warning';
  return 'High Risk';
}

function formatFlag(flag: string): string {
  return flag.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

interface StudentLivestreamModalProps {
  student: InvigilatingStudent | null;
  teacherId: string;
  testId: string;
  onClose: () => void;
  proctoring?: ProctoringData;
}

export const StudentLivestreamModal: React.FC<StudentLivestreamModalProps> = ({
  student,
  teacherId,
  testId,
  onClose,
  proctoring,
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [selectedStreamType, setSelectedStreamType] = useState<'webcam' | 'screen'>('webcam');
  const [hasRequested, setHasRequested] = useState(false);
  const [currentStreamType, setCurrentStreamType] = useState<'webcam' | 'screen' | null>(null);
  const wasOfflineRef = useRef(false);

  const {
    isConnected,
    isStreaming,
    error,
    connectionState,
    remoteStream,
    requestStream,
    stopViewingStream,
    reconnect,
  } = useWebRTC({
    userId: teacherId,
    role: 'teacher',
    testId,
    enabled: !!student,
  });

  const { isOnline } = useConnectionMonitor(!!student);

  const handleRequestStream = async () => {
    if (!student || !isConnected || hasRequested) return;

    setHasRequested(true);
    setCurrentStreamType(selectedStreamType);
    try {
      await requestStream(student.id.toString(), selectedStreamType);
    } catch (error) {
      console.error('Failed to request stream:', error);
      setHasRequested(false);
      setCurrentStreamType(null);
    }
  };

  const handleStopStream = () => {
    if (student) {
      stopViewingStream(student.id.toString());
      setHasRequested(false);
      setCurrentStreamType(null);
    }
  };

  const handleSwitchStream = async (newType: 'webcam' | 'screen') => {
    if (!student) return;

    // Stop current stream
    stopViewingStream(student.id.toString());

    // Request new stream type
    setSelectedStreamType(newType);
    setCurrentStreamType(newType);
    try {
      await requestStream(student.id.toString(), newType);
    } catch (error) {
      console.error('Failed to switch stream:', error);
      setHasRequested(false);
      setCurrentStreamType(null);
    }
  };

  // Monitor connection status and trigger reconnection when connection is restored
  useEffect(() => {
    if (!student) return;

    if (!isOnline) {
      // Connection lost
      wasOfflineRef.current = true;
      debugLogger('[StudentLivestreamModal] Connection lost');
    } else if (wasOfflineRef.current && isOnline) {
      // Connection restored
      debugLogger('[StudentLivestreamModal] Connection restored, triggering WebRTC reconnection');
      wasOfflineRef.current = false;

      // Trigger WebRTC reconnection
      if (reconnect) {
        reconnect();
      }

      // If we were viewing a stream before disconnect, request it again
      if (hasRequested && currentStreamType) {
        setTimeout(() => {
          debugLogger('[StudentLivestreamModal] Re-requesting stream after reconnection');
          requestStream(student.id.toString(), currentStreamType);
        }, 2000); // Wait 2 seconds for socket to fully reconnect
      }
    }
  }, [isOnline, student, reconnect, hasRequested, currentStreamType, requestStream]);

  useEffect(() => {
    return () => {
      if (student) {
        stopViewingStream(student.id.toString());
      }
    };
  }, [student, stopViewingStream]);

  // Attach remote stream to video element
  useEffect(() => {
    if (videoRef.current && remoteStream) {
      videoRef.current.srcObject = remoteStream;
    }
  }, [remoteStream]);

  if (!student) return null;

  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      handleStopStream();
      onClose();
    }
  };

  const handleCloseButton = () => {
    handleStopStream();
    onClose();
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
            onClick={handleCloseButton}
            className="text-gray-400 hover:text-white transition-colors p-2 hover:bg-gray-700 rounded-lg"
          >
            <X size={24} />
          </button>
        </div>

        {/* Video Container */}
        <div className="relative bg-black aspect-video">
          <video ref={videoRef} autoPlay playsInline className="w-full h-full object-contain" />

          {/* Connection Status Overlay */}
          {!isConnected && (
            <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50">
              <div className="text-center">
                <Loader2 className="animate-spin h-16 w-16 text-yellow-500 mx-auto mb-4" />
                <p className="text-white text-lg">Connecting to server...</p>
              </div>
            </div>
          )}

          {isConnected && !hasRequested && !error && (
            <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50">
              <div className="text-center bg-gray-800 p-8 rounded-lg max-w-md mx-4">
                <p className="text-white text-lg font-semibold mb-4">Select Stream Type</p>
                <div className="flex flex-col gap-3 mb-6">
                  <button
                    onClick={() => setSelectedStreamType('webcam')}
                    className={`px-4 py-3 rounded-lg transition-all ${
                      selectedStreamType === 'webcam'
                        ? 'bg-yellow-500 text-white ring-2 ring-yellow-300'
                        : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                    }`}
                  >
                    <div className="flex items-center gap-2 justify-center">
                      <Camera size={20} />
                      <span className="font-medium">Webcam + Audio</span>
                    </div>
                  </button>
                  <button
                    onClick={() => setSelectedStreamType('screen')}
                    className={`px-4 py-3 rounded-lg transition-all ${
                      selectedStreamType === 'screen'
                        ? 'bg-yellow-500 text-white ring-2 ring-yellow-300'
                        : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                    }`}
                  >
                    <div className="flex items-center gap-2 justify-center">
                      <svg
                        className="w-5 h-5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <rect x="2" y="3" width="20" height="14" rx="2" strokeWidth="2" />
                        <line x1="8" y1="21" x2="16" y2="21" strokeWidth="2" />
                        <line x1="12" y1="17" x2="12" y2="21" strokeWidth="2" />
                      </svg>
                      <span className="font-medium">Screen Share</span>
                    </div>
                  </button>
                </div>
                <button
                  onClick={handleRequestStream}
                  className="w-full px-4 py-3 bg-green-500 hover:bg-green-600 text-white font-semibold rounded-lg transition-colors"
                >
                  Request Stream
                </button>
              </div>
            </div>
          )}

          {isConnected && hasRequested && !isStreaming && !error && (
            <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50">
              <div className="text-center">
                <Loader2 className="animate-spin h-16 w-16 text-yellow-500 mx-auto mb-4" />
                <p className="text-white text-lg">Requesting stream...</p>
                <p className="text-gray-300 text-sm mt-2">Waiting for student response</p>
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
            <>
              <div className="absolute top-4 right-4 z-10">
                <div className="flex items-center gap-2 bg-green-500 bg-opacity-90 text-white text-sm px-3 py-1 rounded-full">
                  <span className="w-2 h-2 bg-white rounded-full animate-pulse"></span>
                  <span className="font-medium">
                    {currentStreamType === 'screen' ? 'Screen Share' : 'Webcam'}
                  </span>
                </div>
              </div>

              {/* Stream Controls */}
              <div className="absolute top-4 left-4 z-10 flex gap-2">
                <button
                  onClick={() =>
                    handleSwitchStream(currentStreamType === 'webcam' ? 'screen' : 'webcam')
                  }
                  className="px-3 py-2 bg-blue-500 hover:bg-blue-600 text-white text-sm font-medium rounded-lg transition-colors flex items-center gap-2"
                  title={
                    currentStreamType === 'webcam' ? 'Switch to Screen Share' : 'Switch to Webcam'
                  }
                >
                  {currentStreamType === 'webcam' ? (
                    <>
                      <svg
                        className="w-4 h-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <rect x="2" y="3" width="20" height="14" rx="2" strokeWidth="2" />
                        <line x1="8" y1="21" x2="16" y2="21" strokeWidth="2" />
                        <line x1="12" y1="17" x2="12" y2="21" strokeWidth="2" />
                      </svg>
                      <span>Screen</span>
                    </>
                  ) : (
                    <>
                      <Camera size={16} />
                      <span>Webcam</span>
                    </>
                  )}
                </button>

                <button
                  onClick={handleStopStream}
                  className="px-3 py-2 bg-red-500 hover:bg-red-600 text-white text-sm font-medium rounded-lg transition-colors flex items-center gap-2"
                  title="Stop Stream"
                >
                  <X size={16} />
                  <span>Stop</span>
                </button>
              </div>
            </>
          )}

          {/* Device Status Indicators */}
          <div className="absolute bottom-4 left-4 flex gap-3">
            <div
              className={`flex items-center gap-2 px-3 py-2 rounded-lg ${
                student.cameraEnabled ? 'bg-green-500 bg-opacity-80' : 'bg-gray-700 bg-opacity-80'
              }`}
            >
              <Camera size={18} className="text-white" />
              <span className="text-white text-sm font-medium">
                {student.cameraEnabled ? 'Camera On' : 'Camera Off'}
              </span>
            </div>
            <div
              className={`flex items-center gap-2 px-3 py-2 rounded-lg ${
                student.microphoneEnabled
                  ? 'bg-green-500 bg-opacity-80'
                  : 'bg-gray-700 bg-opacity-80'
              }`}
            >
              <Mic size={18} className="text-white" />
              <span className="text-white text-sm font-medium">
                {student.microphoneEnabled ? 'Mic On' : 'Mic Off'}
              </span>
            </div>
          </div>
        </div>

        {/* Footer Info + Proctoring Metrics */}
        <div className="bg-gray-800 px-6 py-4 border-t border-gray-700">
          {/* Proctoring Metrics */}
          {proctoring && (
            <div className="mb-4 pb-4 border-b border-gray-700">
              <div className="flex items-center gap-2 mb-3">
                <Activity size={16} className="text-yellow-400" />
                <span className="text-white font-semibold text-sm">AI Proctoring</span>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {/* Risk Score */}
                <div className="bg-gray-900 rounded-lg p-3">
                  <div className="text-gray-400 text-xs mb-1">Risk Score</div>
                  <div className="flex items-center gap-2">
                    <span
                      className="text-xl font-bold"
                      style={{ color: getScoreColor(proctoring.score) }}
                    >
                      {Math.round(proctoring.score * 100)}%
                    </span>
                    <span
                      className="text-xs px-2 py-0.5 rounded-full font-semibold"
                      style={{
                        backgroundColor: `${getScoreColor(proctoring.score)}20`,
                        color: getScoreColor(proctoring.score),
                      }}
                    >
                      {getScoreLabel(proctoring.score)}
                    </span>
                  </div>
                  <div className="w-full bg-gray-700 rounded-full h-1.5 mt-2">
                    <div
                      className="h-1.5 rounded-full transition-all duration-500"
                      style={{
                        width: `${Math.min(proctoring.score * 100, 100)}%`,
                        backgroundColor: getScoreColor(proctoring.score),
                      }}
                    />
                  </div>
                </div>

                {/* Face Detection */}
                <div className="bg-gray-900 rounded-lg p-3">
                  <div className="text-gray-400 text-xs mb-1">Face</div>
                  <div className="flex items-center gap-2">
                    {proctoring.faceDetected ? (
                      <Eye size={18} className="text-green-400" />
                    ) : (
                      <EyeOff size={18} className="text-red-400" />
                    )}
                    <span
                      className={`font-semibold text-sm ${proctoring.faceDetected ? 'text-green-400' : 'text-red-400'}`}
                    >
                      {proctoring.faceDetected ? 'Detected' : 'Not Detected'}
                    </span>
                  </div>
                </div>

                {/* Head Pose */}
                <div className="bg-gray-900 rounded-lg p-3">
                  <div className="text-gray-400 text-xs mb-1">Head Pose</div>
                  <div className="flex items-center gap-3">
                    <div>
                      <span className="text-gray-500 text-[10px]">Pitch</span>
                      <div className="text-white font-mono text-sm">
                        {proctoring.headPose.pitch}°
                      </div>
                    </div>
                    <div>
                      <span className="text-gray-500 text-[10px]">Yaw</span>
                      <div className="text-white font-mono text-sm">{proctoring.headPose.yaw}°</div>
                    </div>
                  </div>
                </div>

                {/* Active Flags */}
                <div className="bg-gray-900 rounded-lg p-3">
                  <div className="text-gray-400 text-xs mb-1">Flags</div>
                  {proctoring.flags.length > 0 ? (
                    <div className="flex flex-wrap gap-1">
                      {proctoring.flags.map((flag) => (
                        <span
                          key={flag}
                          className="flex items-center gap-1 bg-red-500/20 text-red-400 text-[11px] font-semibold px-2 py-0.5 rounded-full"
                        >
                          <AlertTriangle size={10} />
                          {formatFlag(flag)}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <span className="text-green-400 text-sm font-medium">None</span>
                  )}
                </div>
              </div>

              <div className="mt-3 text-xs text-gray-300 flex flex-wrap gap-3">
                <span>Objects: {proctoring.detectedObjects?.length ?? 0}</span>
                <span>Suspicious: {proctoring.suspiciousObjects?.length ?? 0}</span>
                <span>Extra People: {proctoring.extraPeopleCount ?? 0}</span>
              </div>
            </div>
          )}

          <div className="flex items-center justify-between text-sm">
            <div className="text-gray-400">
              <span className="font-medium text-white">Email:</span> {student.email}
            </div>
            <div className="text-gray-400">
              <span className="font-medium text-white">Submission ID:</span> {student.submissionId}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
