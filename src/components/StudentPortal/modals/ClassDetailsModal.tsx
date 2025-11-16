import React from "react";
import { ClassData } from "../types";
import { Test } from "../types";
import {
  Submission,
  calculateCurrentTotalMarks,
  calculateTotalPossibleMarks,
} from "../../Submissions";

interface ClassDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedClass: ClassData | null;
  loadingDetails: boolean;
  tests?: Test[];
  submissions?: Submission[];
  onViewTests?: () => void;
  onViewSubmissions?: () => void;
}

export default function ClassDetailsModal({
  isOpen,
  onClose,
  selectedClass,
  loadingDetails,
  tests = [],
  submissions = [],
  onViewTests,
  onViewSubmissions,
}: ClassDetailsModalProps) {
  if (!isOpen || !selectedClass) return null;

  // Filter tests and submissions for this class
  const classTests = tests.filter((test) => test.classId === selectedClass.id);
  const classSubmissions = submissions.filter((sub) => sub.test?.class?.id === selectedClass.id);

  // Calculate statistics
  const activeTests = classTests.filter((t) => t.status?.toUpperCase() === "ACTIVE").length;
  const completedSubmissions = classSubmissions.filter(
    (s) => s.status === "GRADED" || s.gradedAt,
  ).length;
  const pendingSubmissions = classSubmissions.filter(
    (s) => s.status === "SUBMITTED" && !s.gradedAt,
  ).length;

  // Calculate average score
  const gradedSubmissions = classSubmissions.filter((s) => s.gradedAt);
  const averageScore =
    gradedSubmissions.length > 0
      ? gradedSubmissions.reduce((sum, sub) => {
          const score = calculateCurrentTotalMarks(sub.answers);
          const maxScore = calculateTotalPossibleMarks(sub.answers);
          return sum + (maxScore > 0 ? (score / maxScore) * 100 : 0);
        }, 0) / gradedSubmissions.length
      : 0;

  const formatDate = (dateString?: string) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-md flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-3xl transform transition-all duration-300 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="bg-gradient-to-r from-indigo-600 to-blue-600 px-8 py-6 rounded-t-3xl sticky top-0 z-10">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h2 className="text-3xl font-bold text-white mb-2">{selectedClass.name}</h2>
              <div className="flex items-center gap-3 flex-wrap">
                <span className="px-3 py-1 bg-white/20 text-white text-sm font-bold rounded-lg backdrop-blur-sm">
                  Code: {selectedClass.code}
                </span>
                {selectedClass.approved === false && (
                  <span className="px-3 py-1 bg-yellow-400 text-yellow-900 text-sm font-bold rounded-lg">
                    Pending Approval
                  </span>
                )}
              </div>
            </div>
            <button
              onClick={onClose}
              className="px-4 py-2 bg-white/20 text-white rounded-lg hover:bg-white/30 transition-all backdrop-blur-sm ml-4"
            >
              Close
            </button>
          </div>
        </div>

        {loadingDetails ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading class details...</p>
          </div>
        ) : (
          <div className="p-8">
            {/* Description */}
            {selectedClass.description && (
              <div className="mb-6 p-4 bg-gradient-to-r from-gray-50 to-blue-50 rounded-xl border border-gray-200">
                <p className="text-gray-700 leading-relaxed">{selectedClass.description}</p>
              </div>
            )}

            {/* Statistics Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-4 border-2 border-blue-200">
                <div className="text-3xl mb-2">📚</div>
                <div className="text-2xl font-bold text-gray-900">{classTests.length}</div>
                <div className="text-sm text-gray-600 font-medium">Total Tests</div>
              </div>

              <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-4 border-2 border-green-200">
                <div className="text-3xl mb-2">✅</div>
                <div className="text-2xl font-bold text-gray-900">{activeTests}</div>
                <div className="text-sm text-gray-600 font-medium">Active</div>
              </div>

              <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl p-4 border-2 border-purple-200">
                <div className="text-3xl mb-2">📝</div>
                <div className="text-2xl font-bold text-gray-900">{classSubmissions.length}</div>
                <div className="text-sm text-gray-600 font-medium">Submissions</div>
              </div>

              <div className="bg-gradient-to-br from-orange-50 to-yellow-50 rounded-xl p-4 border-2 border-orange-200">
                <div className="text-3xl mb-2">⭐</div>
                <div className="text-2xl font-bold text-gray-900">
                  {averageScore > 0 ? averageScore.toFixed(1) : "—"}
                  {averageScore > 0 && "%"}
                </div>
                <div className="text-sm text-gray-600 font-medium">Avg Score</div>
              </div>
            </div>

            {/* Class Information */}
            <div className="mb-6 bg-white rounded-xl border-2 border-gray-200 overflow-hidden">
              <div className="bg-gradient-to-r from-gray-100 to-gray-50 px-4 py-3 border-b-2 border-gray-200">
                <h3 className="text-lg font-bold text-gray-900">Class Information</h3>
              </div>
              <div className="p-4 space-y-3">
                <div className="flex items-center justify-between py-2 border-b border-gray-100">
                  <span className="text-gray-600 font-medium">Teacher</span>
                  <span className="text-gray-900 font-semibold">
                    {selectedClass.teacher?.name || "N/A"}
                  </span>
                </div>
                <div className="flex items-center justify-between py-2 border-b border-gray-100">
                  <span className="text-gray-600 font-medium">Students</span>
                  <span className="text-gray-900 font-semibold">
                    {selectedClass.studentCount || 0}
                  </span>
                </div>
                <div className="flex items-center justify-between py-2">
                  <span className="text-gray-600 font-medium">Created</span>
                  <span className="text-gray-900 font-semibold">
                    {formatDate(selectedClass.createdAt)}
                  </span>
                </div>
              </div>
            </div>

            {/* Recent Tests */}
            {classTests.length > 0 && (
              <div className="mb-6">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-lg font-bold text-gray-900">Recent Tests</h3>
                  {onViewTests && (
                    <button
                      onClick={onViewTests}
                      className="text-sm text-indigo-600 hover:text-indigo-700 font-medium"
                    >
                      View All →
                    </button>
                  )}
                </div>
                <div className="space-y-2">
                  {classTests.slice(0, 3).map((test) => (
                    <div
                      key={test.id}
                      className="flex items-center justify-between p-3 bg-gradient-to-r from-gray-50 to-orange-50 rounded-lg border border-gray-200 hover:border-orange-300 transition-all"
                    >
                      <div className="flex-1">
                        <p className="font-semibold text-gray-900">{test.title}</p>
                        {test.status && (
                          <span
                            className={`inline-block mt-1 px-2 py-0.5 rounded text-xs font-medium ${
                              test.status.toUpperCase() === "ACTIVE"
                                ? "bg-green-100 text-green-800"
                                : "bg-gray-100 text-gray-800"
                            }`}
                          >
                            {test.status}
                          </span>
                        )}
                      </div>
                      {test.duration && (
                        <span className="text-sm text-gray-600 ml-2">{test.duration} min</span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Submission Stats */}
            {classSubmissions.length > 0 && (
              <div className="mb-6">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-lg font-bold text-gray-900">Your Progress</h3>
                  {onViewSubmissions && (
                    <button
                      onClick={onViewSubmissions}
                      className="text-sm text-indigo-600 hover:text-indigo-700 font-medium"
                    >
                      View Submissions →
                    </button>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-lg p-4 border border-green-200">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-2xl">✓</span>
                      <span className="text-sm font-medium text-gray-700">Graded</span>
                    </div>
                    <div className="text-2xl font-bold text-gray-900">{completedSubmissions}</div>
                  </div>
                  <div className="bg-gradient-to-br from-yellow-50 to-orange-50 rounded-lg p-4 border border-yellow-200">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-2xl">⏳</span>
                      <span className="text-sm font-medium text-gray-700">Pending</span>
                    </div>
                    <div className="text-2xl font-bold text-gray-900">{pendingSubmissions}</div>
                  </div>
                </div>
              </div>
            )}

            {/* Quick Actions */}
            <div className="flex gap-3 pt-4 border-t-2 border-gray-200">
              {onViewTests && classTests.length > 0 && (
                <button
                  onClick={onViewTests}
                  className="flex-1 px-6 py-3 bg-gradient-to-r from-orange-500 to-amber-600 text-white font-bold rounded-xl hover:from-orange-600 hover:to-amber-700 transition-all shadow-lg hover:shadow-xl"
                >
                  View Tests
                </button>
              )}
              {onViewSubmissions && classSubmissions.length > 0 && (
                <button
                  onClick={onViewSubmissions}
                  className="flex-1 px-6 py-3 bg-gradient-to-r from-purple-500 to-indigo-600 text-white font-bold rounded-xl hover:from-purple-600 hover:to-indigo-700 transition-all shadow-lg hover:shadow-xl"
                >
                  View Scores
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
