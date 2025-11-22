import React from "react";
import { formatDate } from "../utils";
import { SubmissionDetailProps, Submission } from "../types";

type Props = Pick<SubmissionDetailProps, "onBack" | "onClose"> & {
  isTeacherView: boolean;
  submission: Submission;
};

export default function SubmissionHeader({
  submission,
  onBack,
  onClose,
  isTeacherView,
}: Props) {
  const getHeaderGradient = () =>
    isTeacherView
      ? "bg-gradient-to-r from-purple-500 to-indigo-600"
      : "bg-gradient-to-r from-green-500 to-emerald-600";

  const getHeaderTextColor = () =>
    isTeacherView ? "text-purple-100" : "text-green-100";

  return (
    <div className={`px-8 py-6 ${getHeaderGradient()} sticky top-0 z-10`}>
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-2xl font-bold text-white">
            {isTeacherView
              ? `${submission.student?.name || submission.user?.name || "Unknown Student"}'s Submission`
              : `Your Test Submission - (ID: ${submission.id})`}
          </h3>
          <p className={`${getHeaderTextColor()} mt-1`}>
            {submission.test?.title || "Test"} - Submitted:{" "}
            {formatDate(submission.submittedAt)}
          </p>
        </div>
        <div className="flex space-x-2">
          {isTeacherView && onBack && (
            <button
              onClick={onBack}
              className="px-4 py-2 bg-white/20 text-white rounded-lg hover:bg-white/30 transition-all"
            >
              ← Back to List
            </button>
          )}
          <button
            onClick={onClose}
            className="px-4 py-2 bg-white/20 text-white rounded-lg hover:bg-white/30 transition-all"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
