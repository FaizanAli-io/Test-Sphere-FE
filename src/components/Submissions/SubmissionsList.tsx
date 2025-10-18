import React from "react";

import { Submission } from "./types";
import {
  formatDate,
  getSubmissionStatus,
  getSubmissionStatusColor,
  calculateTotalPossibleMarks,
  calculateCurrentTotalMarks,
} from "./utils";

interface SubmissionsListProps {
  submissions: Submission[];
  onClose: () => void;
  onSelectSubmission: (submission: Submission) => void;
  viewContext?: "teacher" | "student";
  loading?: boolean;
  error?: string | null;
  classFilter?: number | null;
}

export default function SubmissionsList({
  submissions,
  onClose,
  onSelectSubmission,
  viewContext = "teacher",
  loading = false,
  error = null,
  classFilter = null,
}: SubmissionsListProps) {
  const isStudentView = viewContext === "student";

  // Filter submissions by class if specified
  const filteredSubmissions = classFilter
    ? submissions.filter((sub) => sub.test?.class?.id === Number(classFilter))
    : submissions;
  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-3xl w-full max-w-5xl shadow-2xl overflow-hidden max-h-[90vh] overflow-y-auto">
        <div className="px-8 py-6 bg-gradient-to-r from-purple-500 to-indigo-600 sticky top-0 z-10">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-2xl font-bold text-white">
                {isStudentView ? "Your Submissions" : "Test Submissions"} (
                {filteredSubmissions.length})
              </h3>
              <p className="text-purple-100 mt-1">
                {isStudentView
                  ? classFilter
                    ? "View your submissions for this class"
                    : "Review all your test submissions and scores"
                  : "Review and grade student submissions"}
              </p>
            </div>
            <button
              onClick={onClose}
              className="px-4 py-2 bg-white/20 text-white rounded-lg hover:bg-white/30 transition-all"
            >
              Close
            </button>
          </div>
        </div>

        <div className="p-6">
          {loading && (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
              <p className="text-gray-600">
                Loading {isStudentView ? "your" : ""} submissions...
              </p>
            </div>
          )}

          {error && (
            <div className="text-center py-12">
              <p className="text-red-600 mb-4">{error}</p>
              <button
                onClick={onClose}
                className="px-6 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-all"
              >
                Close
              </button>
            </div>
          )}

          {!loading && !error && filteredSubmissions.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">📝</div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                No Submissions Yet
              </h3>
              <p className="text-gray-600">
                {isStudentView
                  ? classFilter
                    ? "You haven't submitted any tests for this class yet."
                    : "You haven't submitted any tests yet. Take a test to see your submissions here."
                  : "Students haven't submitted their tests yet."}
              </p>
            </div>
          ) : (
            !loading &&
            !error && (
              <div className="space-y-4">
                {filteredSubmissions.map((submission) => {
                  const status = getSubmissionStatus(submission);
                  const currentScore = calculateCurrentTotalMarks(
                    submission.answers
                  );
                  const totalPossible = calculateTotalPossibleMarks(
                    submission.answers
                  );
                  const percentage =
                    totalPossible > 0
                      ? (currentScore / totalPossible) * 100
                      : 0;

                  return (
                    <div
                      key={submission.id}
                      className="border-2 border-gray-200 rounded-2xl p-6 hover:border-purple-300 hover:shadow-lg transition-all cursor-pointer"
                      onClick={() => onSelectSubmission(submission)}
                    >
                      <div className="flex items-center justify-between mb-4">
                        <div>
                          <h4 className="text-lg font-bold text-gray-900 mb-1">
                            {isStudentView
                              ? submission.test?.title || "Unknown Test"
                              : submission.student?.name ||
                                submission.user?.name ||
                                "Unknown Student"}
                            {!isStudentView &&
                              (submission.student?.id ||
                                submission.user?.id) && (
                                <span className="text-sm font-normal text-gray-600 ml-2">
                                  (ID:{" "}
                                  {submission.student?.id ||
                                    submission.user?.id}
                                  )
                                </span>
                              )}
                          </h4>
                          <p className="text-gray-600 text-sm">
                            {isStudentView
                              ? submission.test?.class?.name || "Unknown Class"
                              : `Submitted: ${formatDate(submission.submittedAt)}`}
                          </p>
                        </div>
                        <div className="text-right">
                          <span
                            className={`px-3 py-1 rounded-full text-sm font-medium ${getSubmissionStatusColor(
                              status
                            )}`}
                          >
                            {status}
                          </span>
                          {(submission.gradedAt ||
                            submission.status === "GRADED") && (
                            <p className="text-lg font-bold text-gray-900 mt-2">
                              {currentScore}/{totalPossible} marks
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="text-sm text-gray-600">
                        {submission.answers?.length || 0} questions answered
                      </div>
                    </div>
                  );
                })}
              </div>
            )
          )}

          {!loading && !error && (
            <div className="flex justify-end pt-6 border-t border-gray-200 mt-6">
              <button
                onClick={onClose}
                className="px-6 py-3 bg-gray-100 text-gray-700 font-bold rounded-xl hover:bg-gray-200 transition-all"
              >
                Close
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
