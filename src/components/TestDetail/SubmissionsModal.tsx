import React, { useState } from "react";
import { SubmissionItem, SubmissionAnswer } from "./types";

interface SubmissionsModalProps {
  showSubmissionsModal: boolean;
  submissions: SubmissionItem[];
  onClose: () => void;
  onGradeSubmission: (submissionId: string, marks: number) => Promise<void>;
  onUpdateIndividualScore: (
    submissionId: string,
    questionIndex: number,
    score: number,
  ) => Promise<void>;
  loadingSubmissions: boolean;
}

export default function SubmissionsModal({
  showSubmissionsModal,
  submissions,
  onClose,
  onGradeSubmission,
  onUpdateIndividualScore,
  loadingSubmissions,
}: SubmissionsModalProps) {
  const [selectedSubmission, setSelectedSubmission] =
    useState<SubmissionItem | null>(null);
  const [gradingScores, setGradingScores] = useState<{ [key: string]: number }>(
    {},
  );

  if (!showSubmissionsModal) return null;

  const handleBackToList = () => {
    setSelectedSubmission(null);
    setGradingScores({});
  };

  const handleScoreChange = (
    submissionId: number,
    questionIndex: number,
    score: number,
  ) => {
    const key = `${submissionId}-${questionIndex}`;
    setGradingScores((prev) => ({ ...prev, [key]: score }));
  };

  const handleUpdateScore = async (
    submissionId: number,
    questionIndex: number,
  ) => {
    const key = `${submissionId}-${questionIndex}`;
    const score = gradingScores[key];
    if (score !== undefined) {
      await onUpdateIndividualScore(
        submissionId.toString(),
        questionIndex,
        score,
      );
      // Remove from local state after successful update
      setGradingScores((prev) => {
        const newScores = { ...prev };
        delete newScores[key];
        return newScores;
      });
    }
  };

  const handleGradeSubmission = async (
    submissionId: number,
    totalMarks: number,
  ) => {
    await onGradeSubmission(submissionId.toString(), totalMarks);
  };

  const formatDate = (dateString: string | undefined) => {
    if (!dateString) return "Unknown";
    return new Date(dateString).toLocaleString();
  };

  const getSubmissionStatus = (submission: SubmissionItem) => {
    if (submission.totalMarks !== null && submission.totalMarks !== undefined) {
      return "Graded";
    }
    return "Pending";
  };

  const getSubmissionStatusColor = (status: string) => {
    switch (status) {
      case "Graded":
        return "bg-green-100 text-green-800";
      case "Pending":
        return "bg-yellow-100 text-yellow-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const calculateTotalPossibleMarks = (
    answers: SubmissionAnswer[] | undefined,
  ) => {
    if (!answers) return 0;
    return answers.reduce((total, answer) => total + (answer.maxMarks || 0), 0);
  };

  const calculateCurrentTotalMarks = (
    answers: SubmissionAnswer[] | undefined,
  ) => {
    if (!answers) return 0;
    return answers.reduce(
      (total, answer) => total + (answer.obtainedMarks || 0),
      0,
    );
  };

  // List View
  if (!selectedSubmission) {
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
                    submission.answers,
                  );

                  return (
                    <div
                      key={submission.id}
                      className="border-2 border-gray-200 rounded-2xl p-6 hover:border-purple-300 transition-all"
                    >
                      <div className="flex items-center justify-between mb-4">
                        <div>
                          <h4 className="text-lg font-bold text-gray-900 mb-1">
                            {submission.student?.name || "Unknown Student"}
                          </h4>
                          <p className="text-gray-600 text-sm">
                            Submitted: {formatDate(submission.submittedAt)}
                          </p>
                        </div>
                        <div className="text-right">
                          <span
                            className={`px-3 py-1 rounded-full text-sm font-medium ${getSubmissionStatusColor(
                              status,
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

                      <div className="flex items-center justify-between">
                        <div className="text-sm text-gray-600">
                          {submission.answers?.length || 0} questions answered
                        </div>
                        <button
                          onClick={() => setSelectedSubmission(submission)}
                          className="px-4 py-2 bg-purple-500 text-white font-medium rounded-lg hover:bg-purple-600 transition-all"
                        >
                          View Details
                        </button>
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

  // Detail View
  const totalPossible = calculateTotalPossibleMarks(selectedSubmission.answers);
  const currentTotal = calculateCurrentTotalMarks(selectedSubmission.answers);

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-3xl w-full max-w-5xl shadow-2xl overflow-hidden max-h-[90vh] overflow-y-auto">
        <div className="px-8 py-6 bg-gradient-to-r from-purple-500 to-indigo-600 sticky top-0 z-10">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-2xl font-bold text-white">
                {selectedSubmission.student?.name || "Unknown Student"}&apos;s
                Submission
              </h3>
              <p className="text-purple-100 mt-1">
                Submitted: {formatDate(selectedSubmission.submittedAt)}
              </p>
            </div>
            <button
              onClick={handleBackToList}
              className="px-4 py-2 bg-white/20 text-white rounded-lg hover:bg-white/30 transition-all"
            >
              ← Back to List
            </button>
          </div>
        </div>

        <div className="p-6 space-y-6">
          {/* Grading Summary */}
          <div className="bg-gradient-to-r from-purple-50 to-indigo-50 rounded-2xl p-6 border border-purple-200">
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-lg font-bold text-gray-900">
                Grading Summary
              </h4>
              <div className="text-right">
                <p className="text-2xl font-bold text-purple-600">
                  {currentTotal}/{totalPossible}
                </p>
                <p className="text-sm text-gray-600">Total Marks</p>
              </div>
            </div>

            {selectedSubmission.totalMarks === null ||
            selectedSubmission.totalMarks === undefined ? (
              <button
                onClick={() =>
                  handleGradeSubmission(selectedSubmission.id, currentTotal)
                }
                disabled={loadingSubmissions}
                className="w-full px-4 py-3 bg-gradient-to-r from-green-500 to-emerald-500 text-white font-bold rounded-xl hover:from-green-600 hover:to-emerald-600 transition-all shadow-lg hover:shadow-xl disabled:opacity-50"
              >
                {loadingSubmissions ? "Finalizing..." : "Finalize Grade"}
              </button>
            ) : (
              <div className="text-center py-2">
                <span className="px-4 py-2 bg-green-100 text-green-800 rounded-full font-medium">
                  Grade Finalized: {selectedSubmission.totalMarks}/
                  {totalPossible}
                </span>
              </div>
            )}
          </div>

          {/* Questions and Answers */}
          <div className="space-y-6">
            {selectedSubmission.answers?.map((answer, index) => {
              const key = `${selectedSubmission.id}-${index}`;
              const localScore = gradingScores[key];
              const displayScore =
                localScore !== undefined
                  ? localScore
                  : answer.obtainedMarks || 0;

              return (
                <div
                  key={index}
                  className="border-2 border-gray-200 rounded-2xl p-6"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <h5 className="text-lg font-semibold text-gray-900 mb-2">
                        Question {index + 1}
                      </h5>
                      <p className="text-gray-700 mb-3">
                        {answer.questionText}
                      </p>
                    </div>
                    <div className="text-right ml-4">
                      <p className="text-sm text-gray-600">Max Marks</p>
                      <p className="text-lg font-bold text-gray-900">
                        {answer.maxMarks}
                      </p>
                    </div>
                  </div>
                  <div className="mb-4">
                    <h6 className="font-medium text-gray-700 mb-2">
                      Student&apos;s Answer:
                    </h6>
                    <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                      <p className="text-gray-900">
                        {answer.answer || "No answer provided"}
                      </p>
                    </div>
                  </div>{" "}
                  <div className="flex items-center gap-4 pt-4 border-t border-gray-200">
                    <div className="flex items-center gap-2">
                      <label className="text-sm font-medium text-gray-700">
                        Marks:
                      </label>
                      <input
                        type="number"
                        min="0"
                        max={answer.maxMarks}
                        value={displayScore}
                        onChange={(e) =>
                          handleScoreChange(
                            selectedSubmission.id,
                            index,
                            Number(e.target.value),
                          )
                        }
                        className="w-20 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                      />
                      <span className="text-gray-600">/ {answer.maxMarks}</span>
                    </div>

                    {localScore !== undefined &&
                      localScore !== (answer.obtainedMarks || 0) && (
                        <button
                          onClick={() =>
                            handleUpdateScore(selectedSubmission.id, index)
                          }
                          disabled={loadingSubmissions}
                          className="px-4 py-2 bg-purple-500 text-white font-medium rounded-lg hover:bg-purple-600 transition-all disabled:opacity-50"
                        >
                          {loadingSubmissions ? "Saving..." : "Update"}
                        </button>
                      )}

                    {answer.obtainedMarks !== null &&
                      answer.obtainedMarks !== undefined &&
                      localScore === undefined && (
                        <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-medium">
                          Graded
                        </span>
                      )}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="flex justify-between pt-6 border-t border-gray-200">
            <button
              onClick={handleBackToList}
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
