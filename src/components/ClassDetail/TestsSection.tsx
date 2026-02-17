"use client";
import React from "react";
import { canEdit as checkCanEdit } from "@/utils/rolePermissions";
import type { TeacherRole } from "@/utils/rolePermissions";

interface Test {
  id: number;
  title: string;
  description: string;
  duration: number;
  startAt: string;
  endAt: string;
  status: "DRAFT" | "ACTIVE" | "COMPLETED" | "ARCHIVED";
  questionCount?: number;
}

interface TimeStatus {
  text: string;
  color: string;
}

interface TestsSectionProps {
  tests: Test[];
  onCreateTest: () => void;
  onNavigate: (testId: number) => void;
  userRole?: TeacherRole;
}

const BUTTON_STYLES = {
  secondary:
    "px-6 py-3 bg-gradient-to-r from-orange-500 to-red-500 text-white font-bold rounded-xl hover:from-orange-600 hover:to-red-600 transition-all shadow-lg hover:shadow-xl",
};

const getStatusColor = (status: Test["status"]) => {
  const colors: Record<string, string> = {
    DRAFT: "bg-gray-100 text-gray-800 border-gray-300",
    ACTIVE: "bg-green-100 text-green-800 border-green-300",
    COMPLETED: "bg-blue-100 text-blue-800 border-blue-300",
    ARCHIVED: "bg-purple-100 text-purple-800 border-purple-300",
  };
  return colors[status] || colors.DRAFT;
};

const formatDateLocal = (dateString: string) => {
  const date = new Date(dateString);
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
  });
};

const getTimeStatus = (startAt: string, endAt: string): TimeStatus => {
  const now = new Date();
  const start = new Date(startAt);
  const end = new Date(endAt);
  if (now >= start && now <= end)
    return { text: "LIVE NOW", color: "bg-red-500 text-white animate-pulse" };
  if (start > now) return { text: "UPCOMING", color: "bg-yellow-500 text-white" };
  if (now > end) return { text: "ENDED", color: "bg-gray-500 text-white" };
  return { text: "DRAFT", color: "bg-gray-400 text-white" };
};

const TestsSection: React.FC<TestsSectionProps> = ({
  tests,
  onCreateTest,
  onNavigate,
  userRole = "VIEWER",
}) => {
  const canCreateTest = checkCanEdit(userRole);
  return (
    <div>
      <div className="flex justify-between items-center mb-6 flex-wrap gap-4">
        <h3 className="text-2xl font-bold text-gray-900">Scheduled Tests</h3>
        {canCreateTest && (
          <button onClick={onCreateTest} className={BUTTON_STYLES.secondary}>
            <span className="mr-2">+</span>
            Create Test
          </button>
        )}
      </div>
      {tests.length > 0 ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {tests.map((test) => {
            const timeStatus = getTimeStatus(test.startAt, test.endAt);
            return (
              <div
                key={test.id}
                className="group relative bg-white rounded-3xl p-6 border-2 border-gray-200 hover:border-indigo-300 hover:shadow-2xl transition-all duration-300 cursor-pointer transform hover:-translate-y-1"
                onClick={() => onNavigate(test.id)}
              >
                <div className="flex items-center justify-between mb-4">
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-bold border-2 ${getStatusColor(test.status)}`}
                  >
                    {test.status}
                  </span>
                  <span className={`px-3 py-1 rounded-full text-xs font-bold ${timeStatus.color}`}>
                    {timeStatus.text}
                  </span>
                </div>
                <h4 className="text-xl font-bold text-gray-900 mb-3 group-hover:text-indigo-700 transition-colors">
                  {test.title}
                </h4>
                <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                  {test.description || "No description provided"}
                </p>
                <div className="space-y-3 mb-6">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-indigo-500 rounded-lg flex items-center justify-center">
                      <span className="text-white text-sm">❓</span>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 uppercase font-semibold">Questions</p>
                      <p className="text-lg font-bold text-gray-900">{test.questionCount || 0}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-gradient-to-r from-orange-500 to-red-500 rounded-lg flex items-center justify-center">
                      <span className="text-white text-sm">⏱</span>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 uppercase font-semibold">Duration</p>
                      <p className="text-lg font-bold text-gray-900">{test.duration} min</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-gradient-to-r from-green-500 to-emerald-500 rounded-lg flex items-center justify-center">
                      <span className="text-white text-sm">📅</span>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 uppercase font-semibold">Schedule</p>
                      <p className="text-sm font-semibold text-gray-900">
                        {formatDateLocal(test.startAt)}
                      </p>
                    </div>
                  </div>
                </div>
                <div className="flex items-center justify-between pt-4 border-t-2 border-gray-100 group-hover:border-indigo-200 transition-colors">
                  <span className="text-sm text-gray-500 group-hover:text-indigo-600 transition-colors">
                    Click to manage test
                  </span>
                  <span className="text-gray-400 group-hover:text-indigo-600 font-bold transition-colors">
                    →
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-16 bg-gradient-to-br from-gray-50 to-orange-50 rounded-2xl border-2 border-dashed border-gray-300">
          <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4 text-4xl">
            📝
          </div>
          <p className="text-gray-600 font-bold text-lg">No tests created yet</p>
          <p className="text-gray-500 mt-2 mb-6">Create your first test to get started</p>
          <button onClick={onCreateTest} className={BUTTON_STYLES.secondary}>
            Create First Test
          </button>
        </div>
      )}
    </div>
  );
};

export default TestsSection;
