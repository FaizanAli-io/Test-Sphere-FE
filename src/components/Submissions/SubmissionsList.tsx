import React from "react";

import { Submission } from "./types";
import {
  formatDate,
  getSubmissionStatus,
  getSubmissionStatusColor,
  calculateTotalPossibleMarks
} from "./utils";

interface SubmissionsListProps {
  submissions: Submission[];
  onClose: () => void;
  onSelectSubmission: (submission: Submission) => void;
}

export default function SubmissionsList({
  submissions,
  onClose,
  onSelectSubmission
}: SubmissionsListProps) {
  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-3xl w-full max-w-5xl shadow-2xl overflow-hidden max-h-[90vh] overflow-y-auto">
        <div className="px-8 py-6 bg-gradient-to-r from-purple-500 to-indigo-600 sticky top-0 z-10">
          <h3 className="text-2xl font-bold text-white">
            Test Submissions ({submissions.length})
          </h3>
          <p className="text-purple-100 mt-1">
            Review and grade student submissions
          </p>
        </div>

        <div className="p-6">
          {submissions.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">📝</div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                No Submissions Yet
              </h3>
              <p className="text-gray-600">
                Students haven&apos;t submitted their tests yet.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {submissions.map((submission) => {
                const status = getSubmissionStatus(submission);
                const totalPossible = calculateTotalPossibleMarks(
                  submission.answers
                );

                return (
                  <div
                    key={submission.id}
                    className="border-2 border-gray-200 rounded-2xl p-6 hover:border-purple-300 hover:shadow-lg transition-all cursor-pointer"
                    onClick={() => onSelectSubmission(submission)}
                  >
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h4 className="text-lg font-bold text-gray-900 mb-1">
                          {submission.student?.name ||
                            submission.user?.name ||
                            "Unknown Student"}
                          {(submission.student?.id || submission.user?.id) && (
                            <span className="text-sm font-normal text-gray-600 ml-2">
                              (ID:{" "}
                              {submission.student?.id || submission.user?.id})
                            </span>
                          )}
                        </h4>
                        <p className="text-gray-600 text-sm">
                          Submitted: {formatDate(submission.submittedAt)}
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
                        {submission.totalMarks !== null &&
                          submission.totalMarks !== undefined && (
                            <p className="text-lg font-bold text-gray-900 mt-2">
                              {submission.totalMarks}/{totalPossible} marks
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
          )}

          <div className="flex justify-end pt-6 border-t border-gray-200 mt-6">
            <button
              onClick={onClose}
              className="px-6 py-3 bg-gray-100 text-gray-700 font-bold rounded-xl hover:bg-gray-200 transition-all"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
