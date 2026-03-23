import React, { useState } from 'react';
import Image from 'next/image';
import {
  Camera,
  Mic,
  MicOff,
  CameraOff,
  Eye,
  FileText,
  X,
  Activity,
  ArrowLeft,
  ArrowRight,
  ArrowUp,
  ArrowDown,
  Crosshair,
  UserX,
} from 'lucide-react';

import type { InvigilatingStudent } from '../hooks';
import type { ProctoringData } from '../hooks';

interface StudentCardProps {
  student: InvigilatingStudent;
  onClick: () => void;
  onViewLogs?: (student: InvigilatingStudent) => void;
  proctoring?: ProctoringData;
}

// HSL color interpolation: 0 = green (120°), 1 = red (0°)
function getScoreColor(score: number): string {
  const hue = (1 - Math.min(Math.max(score, 0), 1)) * 120;
  return `hsl(${hue}, 85%, 50%)`;
}

function getScoreBg(score: number): string {
  const hue = (1 - Math.min(Math.max(score, 0), 1)) * 120;
  return `hsl(${hue}, 85%, 95%)`;
}

function getScoreLabel(score: number): string {
  if (score <= 0.3) return 'Safe';
  if (score <= 0.6) return 'Warning';
  return 'High Risk';
}

function formatFlag(flag: string): string {
  return flag.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

function GazeIcon({ flags }: { flags: string[] }) {
  if (flags.includes('no_face'))
    return (
      <div title="No face">
        <UserX size={13} className="text-red-500" />
      </div>
    );
  if (flags.includes('gaze_left'))
    return (
      <div title="Gaze left">
        <ArrowLeft size={13} className="text-orange-500" />
      </div>
    );
  if (flags.includes('gaze_right'))
    return (
      <div title="Gaze right">
        <ArrowRight size={13} className="text-orange-500" />
      </div>
    );
  if (flags.includes('gaze_up'))
    return (
      <div title="Gaze up">
        <ArrowUp size={13} className="text-orange-500" />
      </div>
    );
  if (flags.includes('gaze_down'))
    return (
      <div title="Gaze down">
        <ArrowDown size={13} className="text-orange-500" />
      </div>
    );
  return (
    <div title="Gaze center">
      <Crosshair size={13} className="text-green-500" />
    </div>
  );
}

export const StudentCard: React.FC<StudentCardProps> = ({
  student,
  onClick,
  onViewLogs,
  proctoring,
}) => {
  const [showTelemetry, setShowTelemetry] = useState(false);

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const handleViewLive = (e: React.MouseEvent) => {
    e.stopPropagation();
    onClick();
  };

  const handleViewLogs = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onViewLogs) {
      onViewLogs(student);
    }
  };

  const handleTelemetry = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowTelemetry((prev) => !prev);
  };

  const score = proctoring?.score ?? 0;
  const borderColor = proctoring ? getScoreColor(score) : undefined;

  return (
    <div
      className="bg-white rounded-xl shadow-lg hover:shadow-xl transition-all overflow-hidden hover:scale-[1.02] group relative"
      style={{
        borderWidth: 2,
        borderStyle: 'solid',
        borderColor: borderColor ?? '#e5e7eb',
      }}
    >
      {/* Risk Score Bar */}
      {proctoring && (
        <div
          className="h-1.5 w-full transition-all duration-500"
          style={{ backgroundColor: getScoreColor(score) }}
        />
      )}

      <div className="p-5">
        {/* Top Row: Score badge + LIVE badge */}
        <div className="flex items-center justify-between mb-4">
          {proctoring ? (
            <button
              onClick={handleTelemetry}
              className="flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full font-bold transition-colors text-gray-800"
              style={{
                backgroundColor: getScoreBg(score),
              }}
              title="Click for live telemetry"
            >
              <Activity size={12} style={{ color: getScoreColor(score) }} />
              {Math.round(score * 100)}%
              <span className="opacity-70 font-medium ml-0.5">— {getScoreLabel(score)}</span>
            </button>
          ) : (
            <span className="text-xs text-gray-400 italic">No AI data</span>
          )}
          <div className="flex items-center gap-1.5 bg-red-500 text-white text-xs px-2.5 py-1 rounded-full shadow-md">
            <span className="w-1.5 h-1.5 bg-white rounded-full animate-pulse"></span>
            <span className="font-bold">LIVE</span>
          </div>
        </div>

        {/* Risk Score Progress Bar */}
        {proctoring && (
          <div className="mb-4">
            <div className="w-full bg-gray-100 rounded-full h-2">
              <div
                className="h-2 rounded-full transition-all duration-500"
                style={{
                  width: `${Math.min(score * 100, 100)}%`,
                  backgroundColor: getScoreColor(score),
                }}
              />
            </div>
          </div>
        )}

        {/* Profile Picture or Initials */}
        <div className="flex justify-center mb-4">
          {student.profilePicture ? (
            <div className="relative w-24 h-24">
              <Image
                src={student.profilePicture}
                alt={student.name}
                fill
                className="rounded-full object-cover shadow-md"
                style={{
                  borderWidth: 4,
                  borderStyle: 'solid',
                  borderColor: borderColor ?? '#e0e7ff',
                }}
              />
            </div>
          ) : (
            <div
              className="w-24 h-24 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-2xl font-bold shadow-md"
              style={{
                borderWidth: 4,
                borderStyle: 'solid',
                borderColor: borderColor ?? '#e0e7ff',
              }}
            >
              {getInitials(student.name)}
            </div>
          )}
        </div>

        {/* Student Name & Email */}
        <h3 className="text-gray-900 text-center font-bold text-lg mb-1 truncate">
          {student.name}
        </h3>
        <p className="text-gray-500 text-center text-sm mb-4 truncate">{student.email}</p>

        {/* Status Row: cam/mic + gaze/face indicators */}
        <div className="flex items-center justify-between mb-4 pb-3 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div
              className={`flex items-center gap-1 ${
                student.cameraEnabled ? 'text-green-600' : 'text-gray-400'
              }`}
              title={student.cameraEnabled ? 'Camera on' : 'Camera off'}
            >
              {student.cameraEnabled ? <Camera size={16} /> : <CameraOff size={16} />}
            </div>
            <div
              className={`flex items-center gap-1 ${
                student.microphoneEnabled ? 'text-green-600' : 'text-gray-400'
              }`}
              title={student.microphoneEnabled ? 'Mic on' : 'Mic off'}
            >
              {student.microphoneEnabled ? <Mic size={16} /> : <MicOff size={16} />}
            </div>
          </div>

          {/* AI indicators: face detection + gaze direction */}
          {proctoring && (
            <div className="flex items-center gap-2">
              <span
                className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${
                  proctoring.faceDetected
                    ? 'bg-green-100 text-green-700'
                    : 'bg-red-100 text-red-600'
                }`}
                title={proctoring.faceDetected ? 'Face detected' : 'Face not detected'}
              >
                {proctoring.faceDetected ? 'FACE ✓' : 'NO FACE'}
              </span>
              {(proctoring.extraPeopleCount ?? 0) > 0 && (
                <span
                  className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-red-100 text-red-700"
                  title="Extra person detected"
                >
                  +PERSON
                </span>
              )}
              {(proctoring.suspiciousObjects?.length ?? 0) > 0 && (
                <span
                  className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-red-100 text-red-700"
                  title="Suspicious object detected"
                >
                  OBJECT
                </span>
              )}
              <GazeIcon flags={proctoring.flags} />
            </div>
          )}
        </div>

        {/* Active Flags — top 3 max, +N overflow */}
        {proctoring && proctoring.flags.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-4 justify-center">
            {proctoring.flags.slice(0, 3).map((flag) => (
              <span
                key={flag}
                className="text-[10px] font-semibold px-2 py-0.5 rounded-full text-gray-800"
                style={{
                  backgroundColor: getScoreBg(score),
                }}
              >
                {formatFlag(flag)}
              </span>
            ))}
            {proctoring.flags.length > 3 && (
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-gray-100 text-gray-500">
                +{proctoring.flags.length - 3}
              </span>
            )}
          </div>
        )}

        {/* Action Buttons */}
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={handleViewLive}
            className="flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 text-white rounded-lg transition-all shadow-md hover:shadow-lg font-semibold text-sm"
          >
            <Eye size={16} />
            <span>Live</span>
          </button>
          <button
            onClick={handleViewLogs}
            className="flex items-center justify-center gap-2 px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-all shadow-sm hover:shadow-md font-semibold text-sm border border-gray-300"
          >
            <FileText size={16} />
            <span>Logs</span>
          </button>
        </div>
      </div>

      {/* Live Telemetry Overlay */}
      {showTelemetry && proctoring && (
        <div className="absolute inset-0 bg-gray-900/95 rounded-xl z-10 p-4 flex flex-col">
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-white font-bold text-sm flex items-center gap-2">
              <Activity size={14} className="text-yellow-400" />
              Live Telemetry
            </h4>
            <button onClick={handleTelemetry} className="text-gray-400 hover:text-white p-1">
              <X size={16} />
            </button>
          </div>

          <div className="flex-1 space-y-2.5 text-xs">
            {/* Risk Score */}
            <div>
              <div className="flex justify-between text-gray-400 mb-1">
                <span>Risk Score</span>
                <span className="font-bold" style={{ color: getScoreColor(score) }}>
                  {Math.round(score * 100)}%
                </span>
              </div>
              <div className="w-full bg-gray-700 rounded-full h-2">
                <div
                  className="h-2 rounded-full transition-all duration-500"
                  style={{
                    width: `${score * 100}%`,
                    backgroundColor: getScoreColor(score),
                  }}
                />
              </div>
            </div>

            {/* Face Detection */}
            <div className="flex justify-between text-gray-300">
              <span className="text-gray-400">Face</span>
              <span className={proctoring.faceDetected ? 'text-green-400' : 'text-red-400'}>
                {proctoring.faceDetected ? 'Detected' : 'Not Detected'}
              </span>
            </div>

            {/* Head Pose */}
            <div>
              <span className="text-gray-400 block mb-1">Head Pose</span>
              <div className="grid grid-cols-2 gap-1">
                <div className="bg-gray-800 rounded px-2 py-1 text-center">
                  <div className="text-gray-500 text-[10px]">Pitch</div>
                  <div className="text-white font-mono">{proctoring.headPose.pitch}°</div>
                </div>
                <div className="bg-gray-800 rounded px-2 py-1 text-center">
                  <div className="text-gray-500 text-[10px]">Yaw</div>
                  <div className="text-white font-mono">{proctoring.headPose.yaw}°</div>
                </div>
              </div>
            </div>

            {/* Gaze */}
            <div className="flex justify-between text-gray-300">
              <span className="text-gray-400">Gaze</span>
              <span>
                x: {proctoring.gazeDelta.x.toFixed(2)}, y: {proctoring.gazeDelta.y.toFixed(2)}
              </span>
            </div>

            {/* Objects */}
            <div className="flex justify-between text-gray-300">
              <span className="text-gray-400">Objects</span>
              <span>
                {(proctoring.suspiciousObjects?.length ?? 0) > 0
                  ? `${proctoring.suspiciousObjects?.length} suspicious`
                  : 'none'}
                {(proctoring.extraPeopleCount ?? 0) > 0
                  ? `, +${proctoring.extraPeopleCount} extra person`
                  : ''}
              </span>
            </div>

            {/* Flags */}
            {proctoring.flags.length > 0 && (
              <div>
                <span className="text-gray-400 block mb-1">Active Flags</span>
                <div className="flex flex-wrap gap-1">
                  {proctoring.flags.map((flag) => (
                    <span
                      key={flag}
                      className="bg-red-500/20 text-red-400 text-[10px] font-semibold px-2 py-0.5 rounded-full"
                    >
                      {formatFlag(flag)}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
