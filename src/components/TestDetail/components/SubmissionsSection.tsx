import React from "react";
import { Trash2 } from "lucide-react";
import type { Submission } from "../../Submissions/types";
import { calculateCurrentTotalMarks } from "../../Submissions/utils";

interface SubmissionsSectionProps {
  submissions: Submission[];
  loadingSubmissions: boolean;
  onViewSubmissions: () => void;
  onViewIndividualSubmission: (id: number) => void;
  onDeleteSubmission?: (id: number) => void | Promise<void>;
}

const calculateObjectiveMarks = (submission: Submission) => {
  if (!submission.answers) return { obtained: 0, total: 0 };
  const objectiveAnswers = submission.answers.filter(
    (answer) =>
      answer.question?.type === "MULTIPLE_CHOICE" || answer.question?.type === "TRUE_FALSE",
  );
  const obtained = objectiveAnswers.reduce((sum, answer) => sum + (answer.obtainedMarks || 0), 0);
  const total = objectiveAnswers.reduce((sum, answer) => sum + (answer.question?.maxMarks || 0), 0);
  return { obtained, total };
};

const calculateSubjectiveMarks = (submission: Submission) => {
  if (!submission.answers) return { obtained: 0, total: 0 };
  const subjectiveAnswers = submission.answers.filter(
    (answer) => answer.question?.type === "SHORT_ANSWER" || answer.question?.type === "LONG_ANSWER",
  );
  const obtained = subjectiveAnswers.reduce((sum, answer) => sum + (answer.obtainedMarks || 0), 0);
  const total = subjectiveAnswers.reduce(
    (sum, answer) => sum + (answer.question?.maxMarks || 0),
    0,
  );
  return { obtained, total };
};

const calculatePercentage = (obtained: number, total: number) => {
  if (total === 0) return 0;
  return Math.round((obtained / total) * 100);
};

const countAnsweredQuestions = (submission: Submission) => {
  if (!submission.answers) return 0;
  return submission.answers.filter((a) => a.answer != null && a.answer !== "").length;
};

export default function SubmissionsSection({
  submissions,
  loadingSubmissions,
  onViewSubmissions,
  onViewIndividualSubmission,
  onDeleteSubmission,
}: SubmissionsSectionProps) {
  return (
    <div className="bg-white rounded-3xl shadow-xl p-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Submissions ({submissions.length})</h2>
        <button
          onClick={onViewSubmissions}
          className="px-6 py-3 bg-gradient-to-r from-purple-500 to-indigo-500 text-white font-bold rounded-xl hover:from-purple-600 hover:to-indigo-600 transition-all shadow-lg hover:shadow-xl"
        >
          View All Submissions
        </button>
      </div>

      {loadingSubmissions ? (
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading submissions...</p>
        </div>
      ) : submissions.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-6xl mb-4">📝</div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">No Submissions Yet</h3>
          <p className="text-gray-600">Students haven{"'"}t submitted their tests yet.</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full bg-white border-collapse">
            <thead>
              <tr className="bg-gradient-to-r from-purple-50 to-indigo-50 border-b-2 border-purple-200">
                <th className="text-left p-4 font-bold text-gray-900 border-r border-purple-100">
                  Submission ID
                </th>
                <th className="text-left p-4 font-bold text-gray-900 border-r border-purple-100">
                  Student ID
                </th>
                <th className="text-center p-4 font-bold text-gray-900 border-r border-purple-100">
                  Objective Marks
                </th>
                <th className="text-center p-4 font-bold text-gray-900 border-r border-purple-100">
                  Subjective Marks
                </th>
                <th className="text-center p-4 font-bold text-gray-900 border-r border-purple-100">
                  Total Marks
                </th>
                <th className="text-center p-4 font-bold text-gray-900 border-r border-purple-100">
                  Percentage
                </th>
                <th className="text-center p-4 font-bold text-gray-900 border-r border-purple-100">
                  Grading Status
                </th>
                <th className="text-center p-4 font-bold text-gray-900 w-20">Actions</th>
              </tr>
            </thead>
            <tbody>
              {submissions.map((submission, index) => {
                const objectiveMarks = calculateObjectiveMarks(submission);
                const subjectiveMarks = calculateSubjectiveMarks(submission);
                const currentTotal = calculateCurrentTotalMarks(submission.answers);
                const totalMarks = objectiveMarks.total + subjectiveMarks.total;
                const percentage = calculatePercentage(currentTotal, totalMarks);
                const gradingStatus = submission.status;

                return (
                  <tr
                    key={submission.id}
                    className={`border-b border-gray-200 hover:bg-purple-50 transition-all cursor-pointer ${index % 2 === 0 ? "bg-gray-50" : "bg-white"}`}
                    onClick={() => onViewIndividualSubmission(submission.id)}
                  >
                    <td className="p-4 border-r border-gray-200">
                      <span className="px-3 py-1 bg-purple-100 text-purple-800 rounded-full text-sm font-medium">
                        #{submission.id}
                      </span>
                    </td>
                    <td className="p-4 border-r border-gray-200">
                      <div className="flex flex-col">
                        <span className="font-semibold text-gray-900">
                          {submission.student?.name || "Unknown Student"}
                        </span>
                        <span className="text-sm text-gray-600">
                          ID: {submission.student?.id || "N/A"}
                        </span>
                      </div>
                    </td>
                    <td className="p-4 text-center border-r border-gray-200">
                      {objectiveMarks.total > 0 ? (
                        <div className="flex flex-col items-center">
                          <span className="font-bold text-lg text-gray-900">
                            {objectiveMarks.obtained}/{objectiveMarks.total}
                          </span>
                          <span className="text-xs text-gray-600">MCQ & T/F</span>
                        </div>
                      ) : (
                        <span className="text-gray-400 text-sm">No objective</span>
                      )}
                    </td>
                    <td className="p-4 text-center border-r border-gray-200">
                      {subjectiveMarks.total > 0 ? (
                        <div className="flex flex-col items-center">
                          <span className="font-bold text-lg text-gray-900">
                            {subjectiveMarks.obtained}/{subjectiveMarks.total}
                          </span>
                          <span className="text-xs text-gray-600">Short & Long</span>
                        </div>
                      ) : (
                        <span className="text-gray-400 text-sm">No subjective</span>
                      )}
                    </td>
                    <td className="p-4 text-center border-r border-gray-200">
                      <div className="flex flex-col items-center">
                        <span className="font-bold text-xl text-indigo-600">
                          {currentTotal}/{totalMarks}
                        </span>
                        <span className="text-xs text-gray-600">
                          {countAnsweredQuestions(submission)} questions answered
                        </span>
                      </div>
                    </td>
                    <td className="p-4 text-center border-r border-gray-200">
                      <div className="flex flex-col items-center">
                        <div
                          className={`w-16 h-16 rounded-full flex items-center justify-center font-bold text-lg ${
                            percentage >= 80
                              ? "bg-green-100 text-green-800"
                              : percentage >= 60
                                ? "bg-yellow-100 text-yellow-800"
                                : percentage >= 40
                                  ? "bg-orange-100 text-orange-800"
                                  : "bg-red-100 text-red-800"
                          }`}
                        >
                          {percentage}%
                        </div>
                      </div>
                    </td>
                    <td className="p-4 text-center border-r border-gray-200">
                      <span
                        className={`px-3 py-1 rounded-full text-sm font-medium ${
                          gradingStatus === "GRADED"
                            ? "bg-green-100 text-green-800"
                            : gradingStatus === "SUBMITTED"
                              ? "bg-blue-100 text-blue-800"
                              : "bg-yellow-100 text-yellow-800"
                        }`}
                      >
                        {gradingStatus}
                      </span>
                    </td>
                    <td className="p-4 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          type="button"
                          title="Delete submission"
                          aria-label={`Delete submission #${submission.id}`}
                          className="inline-flex items-center justify-center w-9 h-9 rounded-lg border border-red-200 text-red-600 hover:bg-red-50 hover:border-red-300 hover:text-red-700 transition-colors shadow-sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            if (onDeleteSubmission) {
                              onDeleteSubmission(submission.id);
                            }
                          }}
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          {submissions.length === 0 && (
            <div className="text-center py-8 text-gray-500">No submissions found</div>
          )}
        </div>
      )}
    </div>
  );
}
