import React from "react";
import { Camera, Mic, MicOff, CameraOff } from "lucide-react";
import type { InvigilatingStudent } from "@/hooks/useInvigilateStudents";

interface StudentCardProps {
  student: InvigilatingStudent;
  onClick: () => void;
}

export const StudentCard: React.FC<StudentCardProps> = ({
  student,
  onClick,
}) => {
  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <div
      onClick={onClick}
      className="bg-gray-800 rounded-lg p-4 cursor-pointer hover:bg-gray-700 transition-all hover:scale-105 hover:shadow-xl border border-gray-700"
    >
      {/* Live Indicator */}
      <div className="flex justify-end mb-2">
        <div className="flex items-center gap-1 bg-red-500 text-white text-xs px-2 py-1 rounded-full">
          <span className="w-2 h-2 bg-white rounded-full animate-pulse"></span>
          <span className="font-medium">LIVE</span>
        </div>
      </div>

      {/* Profile Picture or Initials */}
      <div className="flex justify-center mb-3">
        {student.profilePicture ? (
          <img
            src={student.profilePicture}
            alt={student.name}
            className="w-20 h-20 rounded-full object-cover border-2 border-gray-600"
          />
        ) : (
          <div className="w-20 h-20 rounded-full bg-gradient-to-br from-yellow-500 to-orange-500 flex items-center justify-center text-white text-2xl font-bold border-2 border-gray-600">
            {getInitials(student.name)}
          </div>
        )}
      </div>

      {/* Student Name */}
      <h3 className="text-white text-center font-semibold text-lg mb-3 truncate">
        {student.name}
      </h3>

      {/* Camera and Mic Status */}
      <div className="flex justify-center gap-4">
        <div
          className={`flex items-center gap-1 ${
            student.cameraEnabled ? "text-green-400" : "text-gray-500"
          }`}
          title={student.cameraEnabled ? "Camera enabled" : "Camera disabled"}
        >
          {student.cameraEnabled ? (
            <Camera size={18} />
          ) : (
            <CameraOff size={18} />
          )}
        </div>
        <div
          className={`flex items-center gap-1 ${
            student.microphoneEnabled ? "text-green-400" : "text-gray-500"
          }`}
          title={
            student.microphoneEnabled
              ? "Microphone enabled"
              : "Microphone disabled"
          }
        >
          {student.microphoneEnabled ? <Mic size={18} /> : <MicOff size={18} />}
        </div>
      </div>
    </div>
  );
};
