import React from "react";
import {
  StudentSubmission,
  calculateSubmissionScore,
  calculateSubmissionMaxScore
} from "./types";

// Local utility functions for StudentSubmission
const formatDate = (dateString: string | undefined): string => {
  if (!dateString) return "Not available";
  return new Date(dateString).toLocaleString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit"
  });
};

const calculateTimeTaken = (startTime: string, endTime: string): number => {
  const start = new Date(startTime);
  const end = new Date(endTime);
  return Math.round((end.getTime() - start.getTime()) / (1000 * 60));
};

const formatAnswerText = (
  answer: string | undefined,
  questionType?: string,
  options?: string[]
): string => {
  if (!answer) return "No answer provided";

  if (questionType === "MULTIPLE_CHOICE" || questionType === "TRUE_FALSE") {
    const answerIndex = parseInt(answer);
    if (options && options[answerIndex]) {
      return options[answerIndex];
    }
  }

  return answer;
};

const getCorrectAnswerText = (
  correctAnswer: number | undefined,
  questionType?: string,
  options?: string[]
): string => {
  if (questionType === "MULTIPLE_CHOICE" || questionType === "TRUE_FALSE") {
    if (options && correctAnswer !== undefined && options[correctAnswer]) {
      return options[correctAnswer];
    }
  }
  return "Teacher will review";
};

interface StudentSubmissionViewModalProps {
  isOpen: boolean;
  onClose: () => void;
  submission: StudentSubmission | null;
}

export function StudentSubmissionViewModal({
  isOpen,
  onClose,
  submission
}: StudentSubmissionViewModalProps) {
  if (!isOpen || !submission) return null;

  const totalPossible = calculateSubmissionMaxScore(submission);
  const currentTotal = calculateSubmissionScore(submission);

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-3xl w-full max-w-5xl shadow-2xl overflow-hidden max-h-[90vh] overflow-y-auto">
        <div className="px-8 py-6 bg-gradient-to-r from-green-500 to-emerald-600 sticky top-0 z-10">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-2xl font-bold text-white">
                Your Test Submission
              </h3>
              <p className="text-green-100 mt-1">
                {submission.test?.title || "Test"} - Submitted:{" "}
                {formatDate(submission.submittedAt)}
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

        <div className="p-6 space-y-6">
          {/* Score Summary */}
          <div className="bg-gradient-to-r from-green-100 to-emerald-100 rounded-2xl p-8 border-2 border-green-300 shadow-lg">
            <div className="flex items-center justify-between mb-6">
              <h4 className="text-xl font-bold text-gray-900">📊 Your Score</h4>
              <div className="bg-white/70 rounded-lg p-4 text-center">
                <p className="text-3xl font-bold text-green-800">
                  {currentTotal}/{totalPossible}
                </p>
                <p className="text-base font-medium text-gray-900">
                  Total Marks
                </p>
              </div>
            </div>

            {submission.gradedAt && (
              <div className="text-center">
                <div
                  className={`inline-flex px-4 py-2 rounded-full font-medium ${
                    currentTotal / totalPossible >= 0.8
                      ? "bg-green-200 text-green-800"
                      : currentTotal / totalPossible >= 0.6
                        ? "bg-yellow-200 text-yellow-800"
                        : "bg-red-200 text-red-800"
                  }`}
                >
                  {totalPossible > 0
                    ? ((currentTotal / totalPossible) * 100).toFixed(1)
                    : "0"}
                  % Score
                </div>
              </div>
            )}
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
                    {submission.status}
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
          <div className="bg-gradient-to-r from-purple-100 to-pink-100 rounded-2xl p-8 border-2 border-purple-300 mb-6 shadow-lg">
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
              // Get question details from the answer object
              const question = answer.question;
              const studentAnswerText = answer.answer;
              // Get maxMarks from question.maxMarks
              const maxMarks = question?.maxMarks || 0;
              const isCorrect = answer.obtainedMarks === maxMarks;

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
                  className={`border-2 rounded-2xl p-6 ${isCorrect ? "border-green-200 bg-green-50" : "border-red-200 bg-red-50"}`}
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
                      </div>
                      <p className="text-gray-700 mb-4">
                        {question?.text || "Question text not available"}
                      </p>
                    </div>
                    <div className="text-right ml-4">
                      <div
                        className={`px-3 py-1 rounded-full text-sm font-bold ${
                          isCorrect
                            ? "bg-green-200 text-green-800"
                            : "bg-red-200 text-red-800"
                        }`}
                      >
                        {isCorrect ? "✓ Correct" : "✗ Incorrect"}
                      </div>
                      <p className="text-lg font-bold text-gray-900 mt-2">
                        {answer.obtainedMarks !== null
                          ? answer.obtainedMarks
                          : 0}
                        /{maxMarks}
                      </p>
                    </div>
                  </div>

                  {/* Your Answer */}
                  <div className="mb-4">
                    <h6 className="font-medium text-gray-700 mb-2">
                      Your Answer:
                    </h6>
                    <div
                      className={`p-4 rounded-lg border-2 ${
                        isCorrect
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
                </div>
              );
            })}
          </div>

          <div className="flex justify-center pt-6 border-t border-gray-200">
            <button
              onClick={onClose}
              className="px-8 py-3 bg-green-500 text-white font-bold rounded-xl hover:bg-green-600 transition-all"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
