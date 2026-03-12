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
        <div className="flex flex-col gap-3 w-fit shrink-0">
          <button
            onClick={onBack}
            className="w-full px-6 py-3 bg-gradient-to-r from-gray-600 to-gray-700 text-white font-bold rounded-xl hover:from-gray-700 hover:to-gray-800 transition-all shadow-lg hover:shadow-xl whitespace-nowrap"
          >
            ← Back to Class
          </button>
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={handleInvigilate}
              className="px-6 py-3 bg-gradient-to-r from-purple-500 to-violet-600 text-white font-bold rounded-xl hover:from-purple-600 hover:to-violet-700 transition-all shadow-lg hover:shadow-xl whitespace-nowrap"
            >
              📹 Invigilate
            </button>
            {canEditTest ? (
              <button
                onClick={onConfigure}
                className="px-6 py-3 bg-gradient-to-r from-indigo-500 to-blue-600 text-white font-bold rounded-xl hover:from-indigo-600 hover:to-blue-700 transition-all shadow-lg hover:shadow-xl whitespace-nowrap"
              >
                ⚙️ Configure
              </button>
            ) : (
              <div />
            )}
            {canEditTest ? (
              <button
                onClick={onEdit}
                className="px-6 py-3 bg-gradient-to-r from-blue-500 to-cyan-500 text-white font-bold rounded-xl hover:from-blue-600 hover:to-cyan-600 transition-all shadow-lg hover:shadow-xl whitespace-nowrap"
              >
                ✏️ Edit Test
              </button>
            ) : (
              <div />
            )}
            {canDeleteTest ? (
              <button
                onClick={onDelete}
                className="px-6 py-3 bg-gradient-to-r from-red-500 to-rose-600 text-white font-bold rounded-xl hover:from-red-600 hover:to-rose-700 transition-all shadow-lg hover:shadow-xl whitespace-nowrap"
              >
                🗑️ Delete Test
              </button>
            ) : (
              <div />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
