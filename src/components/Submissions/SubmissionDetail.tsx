import React, { useState } from "react";
import { SubmissionItem } from "../TestDetail/types";
import { useNotification } from "../../hooks/useNotification";
import api from "../../hooks/useApi";
import {
  formatDate,
  calculateTotalPossibleMarks,
  calculateCurrentTotalMarks,
  calculateTimeTaken,
  formatAnswerText,
  getCorrectAnswerText,
} from "../TestDetail/utils";

interface SubmissionDetailProps {
  submission: SubmissionItem;
  onBack: () => void;
  onClose: () => void;
  loadingSubmissionDetails: boolean;
  fetchSubmissionDetails: (submissionId: number) => Promise<SubmissionItem>;
}

export default function SubmissionDetail({
  submission,
  onBack,
  onClose,
  loadingSubmissionDetails,
  fetchSubmissionDetails,
}: SubmissionDetailProps) {
  const [gradingScores, setGradingScores] = useState<Record<string, number>>(
    {}
  );
  const [loadingBulkUpdate, setLoadingBulkUpdate] = useState(false);
  const notifications = useNotification();

  const totalPossible = calculateTotalPossibleMarks(submission.answers);
  const currentTotal = calculateCurrentTotalMarks(submission.answers);

  const handleScoreChange = (
    submissionId: number,
    questionIndex: number,
    score: number
  ) => {
    const key = `${submissionId}-${questionIndex}`;
    setGradingScores((prev) => ({ ...prev, [key]: score }));
  };

  const handleBulkUpdateScores = async () => {
    if (!submission || Object.keys(gradingScores).length === 0) return;

    setLoadingBulkUpdate(true);
    try {
      // Build the answers payload for the API
      const answers = Object.entries(gradingScores).map(
        ([key, obtainedMarks]) => {
          const [, questionIndex] = key.split("-");
          const questionIdx = parseInt(questionIndex);

          // Get the answerId from the submission's answers array
          const answer = submission.answers?.[questionIdx];
          if (!answer) {
            throw new Error(
              `Answer not found for question index ${questionIdx}`
            );
          }

          return {
            answerId: answer.id,
            obtainedMarks,
          };
        }
      );

      // Make single API call to grade submission
      const response = await api(`/submissions/${submission.id}/grade`, {
        method: "POST",
        auth: true,
        body: JSON.stringify({ answers }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to update scores");
      }

      // Show success notification
      notifications.showSuccess(
        `Updated ${answers.length} score(s) successfully`
      );

      // Clear all grading scores after successful update
      setGradingScores({});

      // Optionally refresh the submission details
      await fetchSubmissionDetails(submission.id);
    } catch (error) {
      console.error("Failed to update scores:", error);
      notifications.showError(
        error instanceof Error ? error.message : "Failed to update scores"
      );
    } finally {
      setLoadingBulkUpdate(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-3xl w-full max-w-5xl shadow-2xl overflow-hidden max-h-[90vh] overflow-y-auto">
        <div className="px-8 py-6 bg-gradient-to-r from-purple-500 to-indigo-600 sticky top-0 z-10">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-2xl font-bold text-white">
                {submission.student?.name || "Unknown Student"}&apos;s
                Submission
                {submission.student?.id && (
                  <span className="text-lg font-normal text-purple-100 ml-2">
                    (ID: {submission.student.id})
                  </span>
                )}
              </h3>
              <p className="text-purple-100 mt-1">
                Submitted: {formatDate(submission.submittedAt)}
              </p>
            </div>
            <button
              onClick={onBack}
              className="px-4 py-2 bg-white/20 text-white rounded-lg hover:bg-white/30 transition-all"
            >
              ← Back to List
            </button>
          </div>
        </div>

        <div className="p-6 space-y-6">
          {/* Loading State */}
          {loadingSubmissionDetails && (
            <div className="bg-blue-50 rounded-2xl p-6 border border-blue-200">
              <div className="flex items-center justify-center space-x-2">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
                <span className="text-blue-700 font-medium">
                  Loading detailed submission data...
                </span>
              </div>
            </div>
          )}

          {/* Grading Summary */}
          <div className="bg-gradient-to-r from-purple-100 to-indigo-100 rounded-2xl p-8 border-2 border-purple-300 shadow-lg">
            <div className="flex items-center justify-between mb-6">
              <h4 className="text-xl font-bold text-gray-900">
                📊 Grading Summary
              </h4>
              <div className="bg-white/70 rounded-lg p-4 text-center">
                <p className="text-3xl font-bold text-purple-800">
                  {currentTotal}/{totalPossible}
                </p>
                <p className="text-base font-medium text-gray-900">
                  Total Marks
                </p>
              </div>
            </div>
          </div>

          {/* Test Information */}
          {submission.test && (
            <div className="bg-gradient-to-r from-blue-100 to-cyan-100 rounded-2xl p-8 border-2 border-blue-300 mb-6 shadow-lg">
              <h4 className="text-xl font-bold text-gray-900 mb-4">
                📋 Test Information
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-base">
                <div className="bg-white/70 rounded-lg p-3">
                  <span className="font-bold text-gray-900">Title:</span>{" "}
                  <span className="text-gray-800 font-medium">
                    {submission.test.title}
                  </span>
                </div>
                <div className="bg-white/70 rounded-lg p-3">
                  <span className="font-bold text-gray-900">Duration:</span>{" "}
                  <span className="text-gray-800 font-medium">
                    {submission.test.duration} minutes
                  </span>
                </div>
                <div className="bg-white/70 rounded-lg p-3">
                  <span className="font-bold text-gray-900">Class:</span>{" "}
                  <span className="text-gray-800 font-medium">
                    {submission.test.class?.name}
                  </span>
                </div>
                <div className="bg-white/70 rounded-lg p-3">
                  <span className="font-bold text-gray-900">Status:</span>{" "}
                  <span className="text-gray-800 font-medium">
                    {submission.test.status}
                  </span>
                </div>
              </div>
              {submission.test.description && (
                <div className="bg-white/70 rounded-lg p-4 mt-4">
                  <span className="font-bold text-gray-900">Description:</span>{" "}
                  <span className="text-gray-800 font-medium">
                    {submission.test.description}
                  </span>
                </div>
              )}
            </div>
          )}

          {/* Submission Timeline */}
          <div className="bg-gradient-to-r from-green-100 to-emerald-100 rounded-2xl p-8 border-2 border-green-300 mb-6 shadow-lg">
            <h4 className="text-xl font-bold text-gray-900 mb-4">
              ⏰ Submission Timeline
            </h4>
            <div className="space-y-4 text-base">
              <div className="bg-white/70 rounded-lg p-3 flex justify-between">
                <span className="font-bold text-gray-900">Started:</span>
                <span className="text-gray-800 font-medium">
                  {formatDate(submission.startedAt)}
                </span>
              </div>
              <div className="bg-white/70 rounded-lg p-3 flex justify-between">
                <span className="font-bold text-gray-900">Submitted:</span>
                <span className="text-gray-800 font-medium">
                  {formatDate(submission.submittedAt)}
                </span>
              </div>
              {submission.gradedAt && (
                <div className="bg-white/70 rounded-lg p-3 flex justify-between">
                  <span className="font-bold text-gray-900">Graded:</span>
                  <span className="text-gray-800 font-medium">
                    {formatDate(submission.gradedAt)}
                  </span>
                </div>
              )}
              <div className="bg-white/70 rounded-lg p-3 flex justify-between">
                <span className="font-bold text-gray-900">Time Taken:</span>
                <span className="text-gray-800 font-medium">
                  {submission.startedAt && submission.submittedAt
                    ? `${calculateTimeTaken(
                        submission.startedAt,
                        submission.submittedAt
                      )} minutes`
                    : "Not available"}
                </span>
              </div>
            </div>
          </div>

          {/* Questions and Answers */}
          <div className="space-y-6">
            {submission.answers?.map((answer, index) => {
              const key = `${submission.id}-${index}`;
              const localScore = gradingScores[key];
              const displayScore =
                localScore !== undefined
                  ? localScore
                  : answer.obtainedMarks || 0;

              // Get question details from the answer object
              const question = answer.question;
              const studentAnswerText = answer.answer;
              // Get maxMarks from either answer.maxMarks or question.maxMarks
              const maxMarks = answer.maxMarks || question?.maxMarks || 0;
              const isCorrect = answer.obtainedMarks === maxMarks;
              const isAutoGraded = answer.gradingStatus === "AUTOMATIC";
              const isPending =
                answer.gradingStatus === "PENDING" ||
                (answer.obtainedMarks === null &&
                  (question?.type === "SHORT_ANSWER" ||
                    question?.type === "LONG_ANSWER"));
              const isSubjectiveGraded =
                (question?.type === "SHORT_ANSWER" ||
                  question?.type === "LONG_ANSWER") &&
                answer.obtainedMarks !== null &&
                answer.gradingStatus === "GRADED";

              // Use utility functions for formatting
              const formattedStudentAnswer = formatAnswerText(
                studentAnswerText,
                question?.type,
                question?.options
              );

              const correctAnswerText = getCorrectAnswerText(
                question?.correctAnswer,
                question?.type,
                question?.options
              );

              return (
                <div
                  key={index}
                  className={`border-2 rounded-2xl p-6 ${
                    isPending
                      ? "border-yellow-200 bg-yellow-50"
                      : isSubjectiveGraded
                        ? "border-blue-200 bg-blue-50"
                        : isCorrect
                          ? "border-green-200 bg-green-50"
                          : "border-red-200 bg-red-50"
                  }`}
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h5 className="text-lg font-semibold text-gray-900">
                          Question {index + 1}
                        </h5>
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-medium ${
                            question?.type === "MULTIPLE_CHOICE"
                              ? "bg-blue-100 text-blue-800"
                              : question?.type === "TRUE_FALSE"
                                ? "bg-purple-100 text-purple-800"
                                : question?.type === "SHORT_ANSWER"
                                  ? "bg-orange-100 text-orange-800"
                                  : "bg-yellow-100 text-yellow-800"
                          }`}
                        >
                          {question?.type?.replace("_", " ") || "Unknown"}
                        </span>
                        {isAutoGraded && (
                          <span className="px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                            Auto-graded
                          </span>
                        )}
                      </div>
                      <p className="text-gray-700 mb-4">
                        {question?.text || "Question text not available"}
                      </p>
                    </div>
                    <div className="text-right ml-4">
                      <div
                        className={`px-3 py-1 rounded-full text-sm font-bold ${
                          isPending
                            ? "bg-yellow-200 text-yellow-800"
                            : isSubjectiveGraded
                              ? "bg-blue-200 text-blue-800"
                              : isCorrect
                                ? "bg-green-200 text-green-800"
                                : "bg-red-200 text-red-800"
                        }`}
                      >
                        {isPending
                          ? "⏳ Pending"
                          : isSubjectiveGraded
                            ? "📝 Graded"
                            : isCorrect
                              ? "✓ Correct"
                              : "✗ Incorrect"}
                      </div>
                      <p className="text-lg font-bold text-gray-900 mt-2">
                        {displayScore}/{maxMarks}
                      </p>
                    </div>
                  </div>

                  {/* Student's Answer */}
                  <div className="mb-4">
                    <h6 className="font-medium text-gray-700 mb-2">
                      Student&apos;s Answer:
                    </h6>
                    <div
                      className={`p-4 rounded-lg border-2 ${
                        isPending
                          ? "bg-yellow-100 border-yellow-300"
                          : isSubjectiveGraded
                            ? "bg-blue-100 border-blue-300"
                            : isCorrect
                              ? "bg-green-100 border-green-300"
                              : "bg-red-100 border-red-300"
                      }`}
                    >
                      <p className="text-gray-900 font-medium">
                        {formattedStudentAnswer}
                      </p>
                    </div>
                  </div>

                  {/* Correct Answer (for objective questions) */}
                  {(question?.type === "MULTIPLE_CHOICE" ||
                    question?.type === "TRUE_FALSE") && (
                    <div className="mb-4">
                      <h6 className="font-medium text-gray-700 mb-2">
                        Correct Answer:
                      </h6>
                      <div className="p-4 bg-green-100 border-2 border-green-300 rounded-lg">
                        <p className="text-green-900 font-medium">
                          {correctAnswerText}
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Answer Options (for multiple choice) */}
                  {question?.type === "MULTIPLE_CHOICE" && question.options && (
                    <div className="mb-4">
                      <h6 className="font-medium text-gray-700 mb-2">
                        All Options:
                      </h6>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                        {question.options.map(
                          (option: string, optIndex: number) => {
                            const isStudentChoice =
                              parseInt(studentAnswerText || "-1") === optIndex;
                            const isCorrectOption =
                              question.correctAnswer === optIndex;

                            return (
                              <div
                                key={optIndex}
                                className={`p-3 rounded-lg border text-sm ${
                                  isCorrectOption
                                    ? "bg-green-200 border-green-400 text-green-900"
                                    : isStudentChoice
                                      ? "bg-red-200 border-red-400 text-red-900"
                                      : "bg-gray-100 border-gray-300 text-gray-700"
                                }`}
                              >
                                <div className="flex items-center justify-between">
                                  <span>
                                    <strong>
                                      {String.fromCharCode(65 + optIndex)}.
                                    </strong>{" "}
                                    {option}
                                  </span>
                                  <div className="flex gap-1">
                                    {isCorrectOption && (
                                      <span className="text-green-600">✓</span>
                                    )}
                                    {isStudentChoice && !isCorrectOption && (
                                      <span className="text-red-600">✗</span>
                                    )}
                                  </div>
                                </div>
                              </div>
                            );
                          }
                        )}
                      </div>
                    </div>
                  )}

                  {/* Manual Grading Controls */}
                  <div className="flex items-center gap-4 pt-4 border-t border-gray-200">
                    <div className="flex items-center gap-2">
                      <label className="text-sm font-bold text-gray-900">
                        Override Marks:
                      </label>
                      <input
                        type="number"
                        min="0"
                        max={maxMarks}
                        value={displayScore}
                        onChange={(e) =>
                          handleScoreChange(
                            submission.id,
                            index,
                            Number(e.target.value)
                          )
                        }
                        className="w-24 px-4 py-3 border-2 border-gray-400 rounded-lg text-lg font-bold text-gray-900 bg-white focus:ring-2 focus:ring-purple-500 focus:border-purple-500 focus:bg-purple-50"
                      />
                      <span className="text-lg font-bold text-gray-900">
                        / {maxMarks}
                      </span>
                    </div>

                    {answer.obtainedMarks !== null &&
                      answer.obtainedMarks !== undefined &&
                      localScore === undefined && (
                        <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-medium">
                          Graded: {answer.obtainedMarks}/{maxMarks}
                        </span>
                      )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Single Update Button */}
          {Object.keys(gradingScores).length > 0 && (
            <div className="bg-gradient-to-r from-green-50 to-blue-50 rounded-2xl p-6 border border-green-200">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-lg font-bold text-gray-900 mb-1">
                    Ready to Update Scores
                  </h4>
                  <p className="text-gray-700">
                    {Object.keys(gradingScores).length} score(s) have been
                    modified
                  </p>
                </div>
                <button
                  onClick={handleBulkUpdateScores}
                  disabled={loadingBulkUpdate}
                  className="px-8 py-4 bg-green-600 text-white font-bold rounded-xl hover:bg-green-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed text-lg shadow-lg"
                >
                  {loadingBulkUpdate ? (
                    <div className="flex items-center gap-2">
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                      Updating...
                    </div>
                  ) : (
                    "Update All Scores"
                  )}
                </button>
              </div>
            </div>
          )}

          <div className="flex justify-between pt-6 border-t border-gray-200">
            <button
              onClick={onBack}
              className="px-6 py-3 bg-gray-100 text-gray-700 font-bold rounded-xl hover:bg-gray-200 transition-all"
            >
              ← Back to List
            </button>
            <button
              onClick={onClose}
              className="px-6 py-3 bg-purple-500 text-white font-bold rounded-xl hover:bg-purple-600 transition-all"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
