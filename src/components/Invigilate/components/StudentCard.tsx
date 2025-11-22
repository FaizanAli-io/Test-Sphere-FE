import React from "react";
import { Camera, Mic, MicOff, CameraOff, Eye, FileText } from "lucide-react";

import type { InvigilatingStudent } from "../hooks";

interface StudentCardProps {
  student: InvigilatingStudent;
  onClick: () => void;
  onViewLogs?: (student: InvigilatingStudent) => void;
}

export const StudentCard: React.FC<StudentCardProps> = ({
  student,
  onClick,
  onViewLogs,
}) => {
  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
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

  return (
    <div className="bg-white rounded-xl shadow-lg hover:shadow-xl transition-all border border-gray-200 overflow-hidden hover:scale-[1.02] group">
      <div className="p-5">
        {/* Live Indicator */}
        <div className="flex justify-end mb-3">
          <div className="flex items-center gap-1.5 bg-red-500 text-white text-xs px-3 py-1.5 rounded-full shadow-md">
            <span className="w-2 h-2 bg-white rounded-full animate-pulse"></span>
            <span className="font-bold">LIVE</span>
          </div>
        </div>

        {/* Profile Picture or Initials */}
        <div className="flex justify-center mb-4">
          {student.profilePicture ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={student.profilePicture}
              alt={student.name}
              className="w-24 h-24 rounded-full object-cover border-4 border-indigo-100 shadow-md"
            />
          ) : (
            <div className="w-24 h-24 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-2xl font-bold border-4 border-indigo-100 shadow-md">
              {getInitials(student.name)}
            </div>
          )}
        </div>

        {/* Student Name */}
        <h3 className="text-gray-900 text-center font-bold text-lg mb-1 truncate">
          {student.name}
        </h3>
        <p className="text-gray-500 text-center text-sm mb-4 truncate">
          {student.email}
        </p>

        {/* Camera and Mic Status */}
        <div className="flex justify-center gap-6 mb-4 pb-4 border-b border-gray-200">
          <div
            className={`flex items-center gap-2 ${
              student.cameraEnabled ? "text-green-600" : "text-gray-400"
            }`}
            title={student.cameraEnabled ? "Camera enabled" : "Camera disabled"}
          >
            {student.cameraEnabled ? (
              <Camera size={20} />
            ) : (
              <CameraOff size={20} />
            )}
            <span className="text-xs font-semibold">
              {student.cameraEnabled ? "ON" : "OFF"}
            </span>
          </div>
          <div
            className={`flex items-center gap-2 ${
              student.microphoneEnabled ? "text-green-600" : "text-gray-400"
            }`}
            title={
              student.microphoneEnabled
                ? "Microphone enabled"
                : "Microphone disabled"
            }
          >
            {student.microphoneEnabled ? (
              <Mic size={20} />
            ) : (
              <MicOff size={20} />
            )}
            <span className="text-xs font-semibold">
              {student.microphoneEnabled ? "ON" : "OFF"}
            </span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={handleViewLive}
            className="flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 text-white rounded-lg transition-all shadow-md hover:shadow-lg font-semibold text-sm"
          >
            <Eye size={16} />
          </button>
          <button
            onClick={handleViewLogs}
            className="flex items-center justify-center gap-2 px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-all shadow-sm hover:shadow-md font-semibold text-sm border border-gray-300"
          >
            <FileText size={16} />
          </button>
        </div>
      </div>
    </div>
  );
};
