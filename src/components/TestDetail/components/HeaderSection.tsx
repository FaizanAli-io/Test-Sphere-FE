import React from "react";
import type { Test } from "../types";
import { canEdit as checkCanEdit, canDelete as checkCanDelete } from "@/utils/rolePermissions";
import type { TeacherRole } from "@/utils/rolePermissions";

interface HeaderSectionProps {
  test: Test;
  onBack: () => void;
  onEdit: () => void;
  onConfigure: () => void;
  onDelete: () => void;
  mode?: "STATIC" | "POOL";
  onModeChange?: (mode: "STATIC" | "POOL") => void;
  teacherRole?: TeacherRole;
}

const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
  });
};

const getStatusColor = (status: string) => {
  switch (status) {
    case "DRAFT":
      return "bg-gray-100 text-gray-800";
    case "ACTIVE":
      return "bg-green-100 text-green-800";
    case "COMPLETED":
      return "bg-blue-100 text-blue-800";
    case "ARCHIVED":
      return "bg-yellow-100 text-yellow-800";
    default:
      return "bg-gray-100 text-gray-800";
  }
};

export default function HeaderSection({
  test,
  onBack,
  onEdit,
  onConfigure,
  onDelete,
  mode,
  onModeChange,
  teacherRole = "VIEWER",
}: HeaderSectionProps) {
  const handleInvigilate = () => {
    window.open(`/test/${test.id}/invigilate`, "_blank");
  };

  const canEditTest = checkCanEdit(teacherRole);
  const canDeleteTest = checkCanDelete(teacherRole);

  return (
    <div className="bg-white rounded-3xl shadow-xl p-8 mb-8">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-3">
            <h1 className="text-3xl font-bold text-gray-900">{test.title}</h1>
            <span
              className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(test.status)}`}
            >
              {test.status}
            </span>
          </div>
          <p className="text-gray-600 text-lg mb-4">{test.description}</p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div className="flex items-center gap-2">
              <span className="text-2xl">⏱️</span>
              <div>
                <p className="font-medium text-gray-900">Duration</p>
                <p className="text-gray-600">{test.duration} minutes</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-2xl">🚀</span>
              <div>
                <p className="font-medium text-gray-900">Start Time</p>
                <p className="text-gray-600">{formatDate(test.startAt)}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-2xl">🏁</span>
              <div>
                <p className="font-medium text-gray-900">End Time</p>
                <p className="text-gray-600">{formatDate(test.endAt)}</p>
              </div>
            </div>
            {test.numQuestions && test.numQuestions > 0 && (
              <div className="flex items-center gap-2">
                <span className="text-2xl">🎯</span>
                <div>
                  <p className="font-medium text-gray-900">Questions Shown</p>
                  <p className="text-gray-600">{test.numQuestions} from pool</p>
                </div>
              </div>
            )}
          </div>
        </div>
        <div className="flex flex-col gap-4 w-fit shrink-0">
          <div className="flex items-center gap-3">
            <div className="inline-flex rounded-xl bg-gray-100 p-1">
              <button
                onClick={() => onModeChange?.("STATIC")}
                className={`px-4 py-2 rounded-lg font-medium transition-all ${
                  ("STATIC" as string) === mode ? "bg-white shadow" : "text-gray-600"
                }`}
              >
                Static
              </button>
              <button
                onClick={() => onModeChange?.("POOL")}
                className={`px-4 py-2 rounded-lg font-medium transition-all ${
                  ("POOL" as string) === mode ? "bg-white shadow" : "text-gray-600"
                }`}
              >
                Pool
              </button>
            </div>
            <button
              onClick={onBack}
              className="px-6 py-3 bg-gray-100 text-gray-900 font-bold rounded-xl hover:bg-gray-200 transition-all shadow-lg hover:shadow-xl whitespace-nowrap"
            >
              ← Back to Class
            </button>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={handleInvigilate}
              className="px-6 py-3 bg-purple-500 text-white font-bold rounded-xl hover:bg-purple-600 transition-all shadow-lg hover:shadow-xl whitespace-nowrap"
            >
              📹 Invigilate
            </button>
            {canEditTest && (
              <button
                onClick={onConfigure}
                className="px-6 py-3 bg-indigo-500 text-white font-bold rounded-xl hover:bg-indigo-600 transition-all shadow-lg hover:shadow-xl whitespace-nowrap"
              >
                ⚙️ Configure
              </button>
            )}
            {canEditTest && (
              <button
                onClick={onEdit}
                className="px-6 py-3 bg-blue-500 text-white font-bold rounded-xl hover:bg-blue-600 transition-all shadow-lg hover:shadow-xl whitespace-nowrap"
              >
                ✏️ Edit Test
              </button>
            )}
            {canDeleteTest && (
              <button
                onClick={onDelete}
                className="px-6 py-3 bg-red-500 text-white font-bold rounded-xl hover:bg-red-600 transition-all shadow-lg hover:shadow-xl whitespace-nowrap"
              >
                🗑️ Delete Test
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
