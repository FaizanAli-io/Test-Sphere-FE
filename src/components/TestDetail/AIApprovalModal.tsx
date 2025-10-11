import React, { useState } from "react";
import { Question } from "./types";

interface AIApprovalModalProps {
  showAIApprovalModal: boolean;
  pendingAIQuestions: Question[];
  onClose: () => void;
  onApproveAIQuestion: (questionData: Question) => Promise<void>;
  onApproveMultipleQuestions?: (questions: Question[]) => Promise<void>;
  onRejectAIQuestion: (index: number) => void;
  loadingQuestions: boolean;
}

export default function AIApprovalModal({
  showAIApprovalModal,
  pendingAIQuestions,
  onClose,
  onApproveAIQuestion,
  onApproveMultipleQuestions,
  onRejectAIQuestion,
  loadingQuestions
}: AIApprovalModalProps) {
  const [selectedQuestions, setSelectedQuestions] = useState<number[]>([]);

  if (!showAIApprovalModal || pendingAIQuestions.length === 0) return null;

  const handleToggleSelection = (index: number) => {
    setSelectedQuestions((prev) =>
      prev.includes(index) ? prev.filter((i) => i !== index) : [...prev, index]
    );
  };

  const handleSelectAll = () => {
    setSelectedQuestions(pendingAIQuestions.map((_, index) => index));
  };

  const handleDeselectAll = () => {
    setSelectedQuestions([]);
  };

  const handleAddSelected = async () => {
    if (selectedQuestions.length === 0) return;

    const questionsToAdd = selectedQuestions.map(
      (index) => pendingAIQuestions[index]
    );

    if (onApproveMultipleQuestions) {
      // Use batch approval if available
      await onApproveMultipleQuestions(questionsToAdd);
    } else {
      // Fallback to individual approval
      for (const question of questionsToAdd) {
        await onApproveAIQuestion(question);
      }
    }

    // Remove selected questions from pendingAIQuestions (in reverse order to maintain indices)
    const sortedIndices = [...selectedQuestions].sort((a, b) => b - a);
    for (const index of sortedIndices) {
      onRejectAIQuestion(index);
    }
    setSelectedQuestions([]);
  };

  const handleApproveAll = async () => {
    if (onApproveMultipleQuestions) {
      // Use batch approval if available
      await onApproveMultipleQuestions(pendingAIQuestions);
    } else {
      // Fallback to individual approval
      for (const question of pendingAIQuestions) {
        await onApproveAIQuestion(question);
      }
    }

    // Clear all questions
    for (let i = pendingAIQuestions.length - 1; i >= 0; i--) {
      onRejectAIQuestion(i);
    }
    setSelectedQuestions([]);
  };

  const handleRejectAll = () => {
    for (let i = pendingAIQuestions.length - 1; i >= 0; i--) {
      onRejectAIQuestion(i);
    }
    setSelectedQuestions([]);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-3xl w-full max-w-4xl shadow-2xl overflow-hidden max-h-[90vh] overflow-y-auto">
        <div className="px-8 py-6 bg-gradient-to-r from-blue-500 to-indigo-600 sticky top-0 z-10">
          <h3 className="text-2xl font-bold text-white">
            AI Generated Questions ({pendingAIQuestions.length})
          </h3>
          <p className="text-blue-100 mt-1">
            Select questions to add to your test
          </p>
          <div className="mt-3 flex gap-3">
            <button
              onClick={handleSelectAll}
              className="px-3 py-1.5 bg-white/20 text-white text-sm font-medium rounded-lg hover:bg-white/30 transition-all"
            >
              Select All
            </button>
            <button
              onClick={handleDeselectAll}
              className="px-3 py-1.5 bg-white/20 text-white text-sm font-medium rounded-lg hover:bg-white/30 transition-all"
            >
              Deselect All
            </button>
            <span className="text-white/80 text-sm self-center">
              {selectedQuestions.length} selected
            </span>
          </div>
        </div>

        <div className="p-6 space-y-6">
          {pendingAIQuestions.map((question, index) => (
            <div
              key={index}
              className={`border-2 rounded-2xl p-6 transition-all cursor-pointer ${
                selectedQuestions.includes(index)
                  ? "border-blue-500 bg-blue-50"
                  : "border-gray-200 hover:border-blue-300"
              }`}
              onClick={() => handleToggleSelection(index)}
            >
              <div className="mb-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      checked={selectedQuestions.includes(index)}
                      onChange={() => handleToggleSelection(index)}
                      className="w-5 h-5 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 focus:ring-2"
                    />
                    <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
                      {question.type === "MULTIPLE_CHOICE"
                        ? "Multiple Choice"
                        : question.type === "TRUE_FALSE"
                          ? "True/False"
                          : question.type === "SHORT_ANSWER"
                            ? "Short Answer"
                            : "Long Answer"}
                    </span>
                  </div>
                  <span className="text-sm text-gray-900 font-medium">
                    Max Marks: {question.maxMarks}
                  </span>
                </div>
                <h4 className="text-lg font-semibold text-gray-900 mb-3">
                  {question.text}
                </h4>
              </div>

              {question.type === "MULTIPLE_CHOICE" && question.options && (
                <div className="mb-4">
                  <h5 className="font-medium text-gray-700 mb-2">Options:</h5>
                  <div className="space-y-2">
                    {question.options.map((option, optIndex) => {
                      const isCorrect = question.correctAnswer === optIndex;
                      return (
                        <div
                          key={optIndex}
                          className={`p-3 rounded-lg border ${
                            isCorrect
                              ? "bg-green-50 border-green-200 text-green-800"
                              : "bg-gray-50 border-gray-200 text-gray-900"
                          }`}
                        >
                          <span className="font-medium text-gray-900">
                            {String.fromCharCode(65 + optIndex)}.
                          </span>{" "}
                          <span className="text-gray-900">{option}</span>
                          {isCorrect && (
                            <span className="ml-2 text-green-600 font-bold">
                              ✓ Correct
                            </span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {question.type === "TRUE_FALSE" && (
                <div className="mb-4">
                  <h5 className="font-medium text-gray-700 mb-2">
                    Correct Answer:
                  </h5>
                  <div className="flex gap-4">
                    <div
                      className={`p-3 rounded-lg border ${
                        question.correctAnswer === 1
                          ? "bg-green-50 border-green-200 text-green-800"
                          : "bg-gray-50 border-gray-200 text-gray-900"
                      }`}
                    >
                      <span className="text-gray-900 font-medium">True</span>{" "}
                      {question.correctAnswer === 1 && (
                        <span className="text-green-600 font-bold">✓</span>
                      )}
                    </div>
                    <div
                      className={`p-3 rounded-lg border ${
                        question.correctAnswer === 0
                          ? "bg-green-50 border-green-200 text-green-800"
                          : "bg-gray-50 border-gray-200 text-gray-900"
                      }`}
                    >
                      <span className="text-gray-900 font-medium">False</span>{" "}
                      {question.correctAnswer === 0 && (
                        <span className="text-green-600 font-bold">✓</span>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {(question.type === "SHORT_ANSWER" ||
                question.type === "LONG_ANSWER") && (
                <div className="mb-4 bg-blue-50 border-2 border-blue-200 rounded-xl p-4">
                  <p className="text-sm text-blue-800 font-medium">
                    ℹ️ This question requires manual grading. Students will
                    provide written answers that you&apos;ll need to evaluate.
                  </p>
                </div>
              )}
            </div>
          ))}

          <div className="flex gap-3 pt-4 border-t border-gray-200">
            <button
              onClick={handleAddSelected}
              disabled={selectedQuestions.length === 0 || loadingQuestions}
              className="flex-1 px-6 py-4 bg-gradient-to-r from-blue-500 to-indigo-600 text-white font-bold rounded-xl hover:from-blue-600 hover:to-indigo-700 transition-all text-lg disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loadingQuestions
                ? "Adding..."
                : `Add Selected (${selectedQuestions.length})`}
            </button>
            <button
              onClick={handleApproveAll}
              disabled={loadingQuestions}
              className="flex-1 px-6 py-4 bg-gradient-to-r from-green-500 to-emerald-600 text-white font-bold rounded-xl hover:from-green-600 hover:to-emerald-700 transition-all text-lg disabled:opacity-50"
            >
              {loadingQuestions ? "Adding..." : "Approve All"}
            </button>
            <button
              onClick={handleRejectAll}
              disabled={loadingQuestions}
              className="flex-1 px-6 py-4 bg-red-500 text-white font-bold rounded-xl hover:bg-red-600 transition-all text-lg disabled:opacity-50"
            >
              Reject All
            </button>
            <button
              onClick={onClose}
              className="flex-1 px-6 py-4 bg-gray-100 text-gray-900 font-bold rounded-xl hover:bg-gray-200 transition-all text-lg"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
