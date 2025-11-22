import React from "react";
import { formatDate } from "../utils";
import { SubmissionStatus, Submission } from "../types";

type Props = {
  isTeacherView: boolean;
  submission: Submission;
  totalPossible: number;
  currentTotal: number;
  handleStatusUpdate: (newStatus: SubmissionStatus) => void;
  topExtraContent?: React.ReactNode;
};

export default function ScoreSummary({
  isTeacherView,
  submission,
  totalPossible,
  currentTotal,
  handleStatusUpdate,
  topExtraContent,
}: Props) {
  return (
    <div
      className={`rounded-2xl p-6 border-2 shadow-lg ${
        isTeacherView
          ? "bg-gradient-to-r from-purple-100 to-indigo-100 border-purple-300"
          : "bg-gradient-to-r from-green-100 to-emerald-100 border-green-300"
      }`}
    >
      <div className="flex items-center justify-between mb-4">
        <h4 className="text-xl font-bold text-gray-900">
          📊 {isTeacherView ? "Grading Summary" : "Your Score"}
        </h4>

        {/* Status Actions for Teachers */}
        {isTeacherView && (
          <div className="flex items-center gap-3">
            <span
              className={`px-3 py-1 rounded-full text-sm font-medium ${
                submission.status === "GRADED"
                  ? "bg-green-500/90 text-white"
                  : submission.status === "SUBMITTED"
                    ? "bg-yellow-500/90 text-white"
                    : "bg-gray-500/90 text-white"
              }`}
            >
              {submission.status}
            </span>

            {submission.status !== "GRADED" ? (
              <button
                onClick={() => handleStatusUpdate("GRADED")}
                className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-all font-medium text-sm"
              >
                Mark as Graded
              </button>
            ) : (
              <button
                onClick={() => handleStatusUpdate("SUBMITTED")}
                className="px-4 py-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 transition-all font-medium text-sm"
              >
                Mark as Submitted
              </button>
            )}
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
        <div className="bg-white/80 rounded-xl p-4 text-center">
          <p
            className={`text-3xl font-bold ${isTeacherView ? "text-purple-800" : "text-green-800"}`}
          >
            {currentTotal}/{totalPossible}
          </p>
          <p className="text-sm font-medium text-gray-700">Total Marks</p>
        </div>

        <div className="text-center">
          <div
            className={`inline-flex px-4 py-3 rounded-full font-bold text-lg ${
              totalPossible > 0
                ? currentTotal / totalPossible >= 0.8
                  ? "bg-green-500 text-white"
                  : currentTotal / totalPossible >= 0.6
                    ? "bg-yellow-500 text-white"
                    : "bg-red-500 text-white"
                : "bg-gray-400 text-white"
            }`}
          >
            {totalPossible > 0
              ? `${((currentTotal / totalPossible) * 100).toFixed(1)}%`
              : "---%"}
          </div>
          <p className="text-sm text-gray-700 mt-1 font-medium">
            Score Percentage
          </p>
        </div>

        <div className="bg-white/80 rounded-xl p-4 space-y-2">
          <div className="flex justify-between text-sm">
            <span className="font-medium text-gray-700">Questions:</span>
            <span className="text-gray-900 font-semibold">
              {submission.answers?.length || 0}
            </span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="font-medium text-gray-700">Submitted:</span>
            <span className="text-gray-900 font-semibold">
              {formatDate(submission.submittedAt)}
            </span>
          </div>
          {submission.gradedAt && (
            <div className="flex justify-between text-sm">
              <span className="font-medium text-gray-700">Graded:</span>
              <span className="text-gray-900 font-semibold">
                {formatDate(submission.gradedAt)}
              </span>
            </div>
          )}
          {topExtraContent && isTeacherView && (
            <div className="pt-2 border-t border-gray-300">
              {topExtraContent}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
