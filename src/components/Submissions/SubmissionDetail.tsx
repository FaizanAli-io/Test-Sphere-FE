import Image from "next/image";
import React, { useState } from "react";

import api from "@/hooks/useApi";
import { useNotification } from "@/hooks/useNotification";
import { SubmissionDetailProps, SubmissionStatus } from "./types";
import {
  formatDate,
  getAnswerStatus,
  formatAnswerText,
  calculateTimeTaken,
  getCorrectAnswerText,
  calculateCurrentTotalMarks,
  calculateTotalPossibleMarks
} from "./utils";

export default function SubmissionDetail(props: SubmissionDetailProps) {
  const {
    isOpen,
    onClose,
    onBack,
    submission,
    viewContext,
    onUpdateStatus,
    onUpdateScores,
    topExtraContent
  } = props;
  const [gradingScores, setGradingScores] = useState<Record<string, number>>(
    {}
  );
  const [loadingBulkUpdate, setLoadingBulkUpdate] = useState(false);
  const notifications = useNotification();

  if (!isOpen || !submission) return null;

  const isTeacherView = viewContext === "teacher";
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
      const answers = Object.entries(gradingScores).map(
        ([key, obtainedMarks]) => {
          const [, questionIndex] = key.split("-");
          const questionIdx = parseInt(questionIndex);

          const answer = submission.answers?.[questionIdx];
          if (!answer) {
            throw new Error(
              `Answer not found for question index ${questionIdx}`
            );
          }

          return { answerId: answer.id, obtainedMarks };
        }
      );

      const response = await api(`/submissions/${submission.id}/grade`, {
        body: JSON.stringify({ answers }),
        method: "POST",
        auth: true
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to update scores");
      }

      await response.json();

      notifications.showSuccess(
        `Updated ${answers.length} score(s) successfully`
      );

      // Update parent state with new scores
      if (onUpdateScores && submission.answers) {
        const updatedAnswers = submission.answers.map((answer, idx) => {
          const key = `${submission.id}-${idx}`;
          const newScore = gradingScores[key];
          if (newScore !== undefined) {
            return { ...answer, obtainedMarks: newScore };
          }
          return answer;
        });
        onUpdateScores(submission.id, updatedAnswers);
      }

      setGradingScores({});
    } catch (error) {
      console.error("Failed to update scores:", error);
      notifications.showError(
        error instanceof Error ? error.message : "Failed to update scores"
      );
    } finally {
      setLoadingBulkUpdate(false);
    }
  };

  const handleStatusUpdate = async (newStatus: SubmissionStatus) => {
    if (!submission) return;

    try {
      const response = await api(`/submissions/${submission.id}/status`, {
        method: "PATCH",
        auth: true,
        body: JSON.stringify({ status: newStatus })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to update status");
      }

      notifications.showSuccess(
        `Submission marked as ${newStatus.toLowerCase()} successfully`
      );

      // Update status in parent state
      if (onUpdateStatus) {
        onUpdateStatus(submission.id, newStatus);
      }
    } catch (error) {
      console.error("Failed to update status:", error);
      notifications.showError(
        error instanceof Error ? error.message : "Failed to update status"
      );
    }
  };

  const getHeaderGradient = () => {
    if (isTeacherView) {
      return "bg-gradient-to-r from-purple-500 to-indigo-600";
    }
    return "bg-gradient-to-r from-green-500 to-emerald-600";
  };

  const getHeaderTextColor = () => {
    if (isTeacherView) {
      return "text-purple-100";
    }
    return "text-green-100";
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-3xl w-full max-w-5xl shadow-2xl overflow-hidden max-h-[90vh] overflow-y-auto relative">
        {/* Loading Overlay */}
        {loadingBulkUpdate && (
          <div className="absolute inset-0 bg-white/80 backdrop-blur-sm flex items-center justify-center z-50 rounded-3xl">
            <div className="bg-white rounded-2xl shadow-2xl p-8 flex flex-col items-center">
              <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-purple-600 mb-4"></div>
              <p className="text-lg font-semibold text-gray-900">
                Updating scores...
              </p>
              <p className="text-sm text-gray-600 mt-2">Please wait</p>
            </div>
          </div>
        )}

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

        <div className="p-6 space-y-6">
          {/* Removed loading state - using rich data from list API */}

          {/* Score Summary */}
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
              {/* Score Display */}
              <div className="bg-white/80 rounded-xl p-4 text-center">
                <p
                  className={`text-3xl font-bold ${
                    isTeacherView ? "text-purple-800" : "text-green-800"
                  }`}
                >
                  {currentTotal}/{totalPossible}
                </p>
                <p className="text-sm font-medium text-gray-700">Total Marks</p>
              </div>

              {/* Percentage Display (always visible) */}
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

              {/* Submission Info */}
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
                {submission.test.duration && (
                  <div className="bg-white/70 rounded-lg p-3">
                    <span className="font-bold text-gray-900">Duration:</span>{" "}
                    <span className="text-gray-800 font-medium">
                      {submission.test.duration} minutes
                    </span>
                  </div>
                )}
                {submission.test.class && (
                  <div className="bg-white/70 rounded-lg p-3">
                    <span className="font-bold text-gray-900">Class:</span>{" "}
                    <span className="text-gray-800 font-medium">
                      {submission.test.class.name}
                    </span>
                  </div>
                )}
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
          <div
            className={`rounded-2xl p-8 border-2 mb-6 shadow-lg ${
              isTeacherView
                ? "bg-gradient-to-r from-green-100 to-emerald-100 border-green-300"
                : "bg-gradient-to-r from-purple-100 to-pink-100 border-purple-300"
            }`}
          >
            <h4 className="text-xl font-bold text-gray-900 mb-4">
              ⏰ Submission Timeline
            </h4>
            <div className="space-y-4 text-base">
              {submission.startedAt && (
                <div className="bg-white/70 rounded-lg p-3 flex justify-between">
                  <span className="font-bold text-gray-900">Started:</span>
                  <span className="text-gray-800 font-medium">
                    {formatDate(submission.startedAt)}
                  </span>
                </div>
              )}
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
              {submission.startedAt && submission.submittedAt && (
                <div className="bg-white/70 rounded-lg p-3 flex justify-between">
                  <span className="font-bold text-gray-900">Time Taken:</span>
                  <span className="text-gray-800 font-medium">
                    {calculateTimeTaken(
                      submission.startedAt,
                      submission.submittedAt
                    )}{" "}
                    minutes
                  </span>
                </div>
              )}
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

              const question = answer.question;
              const studentAnswerText = answer.answer;
              const maxMarks = answer.maxMarks || question?.maxMarks || 0;

              const answerStatus = getAnswerStatus(answer);

              const effectiveOptions =
                question?.options && question.options.length > 0
                  ? question.options
                  : question?.type === "TRUE_FALSE"
                    ? ["True", "False"]
                    : question?.options;

              const formattedStudentAnswer = formatAnswerText(
                studentAnswerText,
                question?.type,
                effectiveOptions
              );

              const correctAnswerText = getCorrectAnswerText(
                question?.correctAnswer ?? undefined,
                question?.type,
                effectiveOptions
              );

              return (
                <div
                  key={index}
                  className={`border-2 rounded-2xl p-6 ${answerStatus.color}`}
                >
                  {/* Question Header */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-2xl">{answerStatus.icon}</span>
                        <h5 className="text-lg font-bold text-gray-900">
                          Question {index + 1}
                          {question?.type && (
                            <span className="ml-2 text-sm bg-gray-200 px-2 py-1 rounded">
                              {question.type.replace("_", " ")}
                            </span>
                          )}
                        </h5>
                      </div>
                      <p className="text-gray-800 font-medium leading-relaxed">
                        {question?.text || "Question text not available"}
                      </p>
                      {question?.image && (
                        <div className="mt-3 max-w-md rounded-lg overflow-hidden shadow-md relative">
                          <Image
                            src={question.image}
                            alt="Question"
                            width={500}
                            height={300}
                            className="w-full h-auto object-contain"
                            priority={false}
                          />
                        </div>
                      )}
                    </div>
                    <div className="text-right ml-4">
                      <div className="text-sm text-gray-600 mb-1">Score</div>
                      {isTeacherView ? (
                        <div className="flex items-center space-x-2">
                          <input
                            type="number"
                            min="0"
                            max={maxMarks}
                            value={
                              localScore !== undefined
                                ? localScore
                                : answer.obtainedMarks || 0
                            }
                            onChange={(e) =>
                              handleScoreChange(
                                submission.id,
                                index,
                                Math.min(
                                  maxMarks,
                                  Math.max(0, parseInt(e.target.value) || 0)
                                )
                              )
                            }
                            className="w-16 px-3 py-2 border-2 border-gray-400 rounded-lg text-center font-semibold text-gray-900 bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-200 focus:outline-none transition-all"
                          />
                          <span className="text-sm text-gray-600">
                            / {maxMarks}
                          </span>
                        </div>
                      ) : (
                        <div className="text-lg font-bold text-gray-900">
                          {displayScore} / {maxMarks}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Student Answer */}
                  <div className="bg-white/80 rounded-xl p-4 mb-4">
                    <h6 className="font-semibold text-gray-900 mb-2">
                      {isTeacherView ? "Student's Answer:" : "Your Answer:"}
                    </h6>
                    <p className="text-gray-800 font-medium">
                      {formattedStudentAnswer}
                    </p>
                  </div>

                  {/* Correct Answer (for objective questions) */}
                  {(question?.type === "MULTIPLE_CHOICE" ||
                    question?.type === "TRUE_FALSE") && (
                    <div className="bg-white/80 rounded-xl p-4 mb-4">
                      <h6 className="font-semibold text-green-800 mb-2">
                        Correct Answer:
                      </h6>
                      <p className="text-green-700 font-medium">
                        {correctAnswerText}
                      </p>
                    </div>
                  )}

                  {/* Multiple Choice Options */}
                  {question?.type === "MULTIPLE_CHOICE" && effectiveOptions && (
                    <div className="bg-white/80 rounded-xl p-4">
                      <h6 className="font-semibold text-gray-900 mb-3">
                        Options:
                      </h6>
                      <div className="space-y-2">
                        {effectiveOptions.map((option, optIndex) => {
                          const isStudentChoice =
                            parseInt(studentAnswerText) === optIndex;
                          const isCorrectOption =
                            question.correctAnswer === optIndex;

                          return (
                            <div
                              key={optIndex}
                              className={`p-3 rounded-lg border-2 ${
                                isStudentChoice && isCorrectOption
                                  ? "border-green-400 bg-green-100"
                                  : isStudentChoice && !isCorrectOption
                                    ? "border-red-400 bg-red-100"
                                    : isCorrectOption
                                      ? "border-green-300 bg-green-50"
                                      : "border-gray-200 bg-gray-50"
                              }`}
                            >
                              <div className="flex items-center justify-between">
                                <span className="text-gray-800 font-medium">
                                  {String.fromCharCode(65 + optIndex)}. {option}
                                </span>
                                <div className="flex space-x-2">
                                  {isStudentChoice && (
                                    <span className="text-xs bg-blue-500 text-white px-2 py-1 rounded">
                                      Student{"'"}s Choice
                                    </span>
                                  )}
                                  {isCorrectOption && (
                                    <span className="text-xs bg-green-500 text-white px-2 py-1 rounded">
                                      Correct
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Teacher Grading Actions */}
          {isTeacherView && Object.keys(gradingScores).length > 0 && (
            <div className="bg-gradient-to-r from-green-50 to-blue-50 rounded-2xl p-6 border border-green-200">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-lg font-bold text-gray-900 mb-2">
                    📝 Update Scores
                  </h4>
                  <p className="text-gray-700">
                    You have {Object.keys(gradingScores).length} pending score
                    update(s).
                  </p>
                </div>
                <button
                  onClick={handleBulkUpdateScores}
                  disabled={loadingBulkUpdate}
                  className="px-6 py-3 bg-green-500 text-white font-bold rounded-xl hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                >
                  {loadingBulkUpdate ? (
                    <div className="flex items-center space-x-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      <span>Updating...</span>
                    </div>
                  ) : (
                    "Update Scores"
                  )}
                </button>
              </div>
            </div>
          )}

          {/* Footer Actions */}
          <div className="flex justify-between pt-6 border-t border-gray-200">
            {isTeacherView && onBack ? (
              <button
                onClick={onBack}
                className="px-6 py-3 bg-gray-100 text-gray-700 font-bold rounded-xl hover:bg-gray-200 transition-all"
              >
                ← Back to List
              </button>
            ) : (
              <div></div>
            )}
            <button
              onClick={onClose}
              className={`px-6 py-3 font-bold rounded-xl transition-all ${
                isTeacherView
                  ? "bg-purple-500 text-white hover:bg-purple-600"
                  : "bg-green-500 text-white hover:bg-green-600"
              }`}
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
