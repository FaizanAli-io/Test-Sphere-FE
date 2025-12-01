import React from "react";
import { formatDate, calculateTimeTaken } from "../utils";

interface TimelineSubmission {
  startedAt?: string;
  submittedAt?: string;
  endedAt?: string;
  gradedAt?: string | null;
}

type Props = { submission: TimelineSubmission; isTeacherView: boolean };

export default function Timeline({ submission }: Props) {
  return (
    <div className={`rounded-2xl p-8 border-2 mb-6 shadow-lg`}>
      <h4 className="text-xl font-bold text-gray-900 mb-4">⏰ Submission Timeline</h4>
      <div className="space-y-4 text-base">
        {submission.startedAt && (
          <div className="bg-white/70 rounded-lg p-3 flex justify-between">
            <span className="font-bold text-gray-900">Started:</span>
            <span className="text-gray-800 font-medium">{formatDate(submission.startedAt)}</span>
          </div>
        )}
        <div className="bg-white/70 rounded-lg p-3 flex justify-between">
          <span className="font-bold text-gray-900">Submitted:</span>
          <span className="text-gray-800 font-medium">{formatDate(submission.submittedAt)}</span>
        </div>
        {submission.gradedAt && (
          <div className="bg-white/70 rounded-lg p-3 flex justify-between">
            <span className="font-bold text-gray-900">Graded:</span>
            <span className="text-gray-800 font-medium">{formatDate(submission.gradedAt)}</span>
          </div>
        )}
        {submission.startedAt && submission.submittedAt && (
          <div className="bg-white/70 rounded-lg p-3 flex justify-between">
            <span className="font-bold text-gray-900">Time Taken:</span>
            <span className="text-gray-800 font-medium">
              {calculateTimeTaken(submission.startedAt, submission.submittedAt)} minutes
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
