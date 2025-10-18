import React, { useState } from "react";
import { Question } from "../types";

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
  loadingQuestions,
}: AIApprovalModalProps) {
  const [selectedQuestions, setSelectedQuestions] = useState<number[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);

  if (!showAIApprovalModal || pendingAIQuestions.length === 0) return null;

  const isDisabled = loadingQuestions || isProcessing;

  const handleToggleSelection = (index: number) => {
    setSelectedQuestions((prev) =>
      prev.includes(index) ? prev.filter((i) => i !== index) : [...prev, index]
    );
  };

  const handleBulkAction = async (questions: Question[]) => {
    setIsProcessing(true);
    if (onApproveMultipleQuestions) {
      await onApproveMultipleQuestions(questions);
    } else {
      for (const q of questions) await onApproveAIQuestion(q);
    }

    for (let i = pendingAIQuestions.length - 1; i >= 0; i--) {
      if (questions.includes(pendingAIQuestions[i])) onRejectAIQuestion(i);
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-3xl w-full max-w-4xl shadow-2xl overflow-hidden max-h-[90vh] overflow-y-auto">
        <div className="px-8 py-6 bg-gradient-to-r from-blue-500 to-indigo-600 sticky top-0 z-10">
          <h3 className="text-2xl font-bold text-white">
            AI Generated Questions ({pendingAIQuestions.length})
          </h3>
          <div className="mt-3 flex gap-3 items-center">
            <button
              onClick={() =>
                setSelectedQuestions(pendingAIQuestions.map((_, i) => i))
              }
              disabled={isDisabled}
              className="px-3 py-1.5 bg-white/20 text-white text-sm rounded-lg hover:bg-white/30 transition-all disabled:opacity-40"
            >
              Select All
            </button>
            <button
              onClick={() => setSelectedQuestions([])}
              disabled={isDisabled}
              className="px-3 py-1.5 bg-white/20 text-white text-sm rounded-lg hover:bg-white/30 transition-all disabled:opacity-40"
            >
              Deselect All
            </button>
            <span className="text-white/80 text-sm">
              {selectedQuestions.length} selected
            </span>
          </div>
        </div>

        <div className="p-6 space-y-6 text-gray-800">
          {pendingAIQuestions.map((q, index) => (
            <div
              key={index}
              className={`border-2 rounded-2xl p-6 transition-all cursor-pointer ${
                selectedQuestions.includes(index)
                  ? "border-blue-500 bg-blue-50"
                  : "border-gray-200 hover:border-blue-300"
              }`}
              onClick={() => !isDisabled && handleToggleSelection(index)}
            >
              <div className="flex justify-between">
                <input
                  type="checkbox"
                  checked={selectedQuestions.includes(index)}
                  disabled={isDisabled}
                  onChange={() => handleToggleSelection(index)}
                  className="w-5 h-5 text-blue-600"
                />
                <span className="text-sm font-medium">
                  Max Marks: {q.maxMarks}
                </span>
              </div>
              <h4 className="text-lg font-semibold mt-3">{q.text}</h4>
              {q.type === "MULTIPLE_CHOICE" &&
                q.options?.map((opt, i) => (
                  <div
                    key={i}
                    className={`p-3 mt-2 rounded-lg border ${q.correctAnswer === i ? "bg-green-50 border-green-200" : "bg-gray-50 border-gray-200"}`}
                  >
                    {String.fromCharCode(65 + i)}. {opt}{" "}
                    {q.correctAnswer === i && "✓"}
                  </div>
                ))}

              {q.type === "TRUE_FALSE" && (
                <div className="flex gap-4 mt-3">
                  <div
                    className={`p-3 rounded-lg border ${
                      q.correctAnswer === 1
                        ? "bg-green-50 border-green-200 text-green-800"
                        : "bg-gray-50 border-gray-200 text-gray-900"
                    }`}
                  >
                    True{" "}
                    {q.correctAnswer === 1 && (
                      <span className="font-bold">✓</span>
                    )}
                  </div>
                  <div
                    className={`p-3 rounded-lg border ${
                      q.correctAnswer === 0
                        ? "bg-green-50 border-green-200 text-green-800"
                        : "bg-gray-50 border-gray-200 text-gray-900"
                    }`}
                  >
                    False{" "}
                    {q.correctAnswer === 0 && (
                      <span className="font-bold">✓</span>
                    )}
                  </div>
                </div>
              )}

              {q.type !== "MULTIPLE_CHOICE" && q.type !== "TRUE_FALSE" && (
                <p className="mt-3 text-sm text-blue-800 bg-blue-50 p-3 rounded-lg">
                  Requires manual grading.
                </p>
              )}
            </div>
          ))}

          <div className="flex gap-3 pt-4 border-t border-gray-200">
            <button
              disabled={isDisabled || selectedQuestions.length === 0}
              onClick={() =>
                handleBulkAction(
                  selectedQuestions.map((i) => pendingAIQuestions[i])
                )
              }
              className="flex-1 py-4 bg-blue-600 text-white font-bold rounded-xl disabled:opacity-50"
            >
              Add Selected ({selectedQuestions.length})
            </button>
            <button
              disabled={isDisabled}
              onClick={() => handleBulkAction(pendingAIQuestions)}
              className="flex-1 py-4 bg-green-600 text-white font-bold rounded-xl disabled:opacity-50"
            >
              Approve All
            </button>
            <button
              disabled={isDisabled}
              onClick={() => {
                setIsProcessing(true);
                pendingAIQuestions.forEach((_, i) => onRejectAIQuestion(i));
                onClose();
              }}
              className="flex-1 py-4 bg-red-500 text-white font-bold rounded-xl disabled:opacity-50"
            >
              Reject All
            </button>
            <button
              disabled={isDisabled}
              onClick={() => {
                setIsProcessing(true);
                onClose();
              }}
              className="flex-1 py-4 bg-gray-200 text-gray-900 font-bold rounded-xl disabled:opacity-50"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
