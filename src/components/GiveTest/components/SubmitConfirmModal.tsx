import React from "react";

interface SubmitConfirmModalProps {
  isOpen: boolean;
  answeredCount: number;
  totalQuestions: number;
  submitting: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export const SubmitConfirmModal: React.FC<SubmitConfirmModalProps> = ({
  isOpen,
  answeredCount,
  totalQuestions,
  submitting,
  onConfirm,
  onCancel,
}) => {
  if (!isOpen) return null;

  const unansweredCount = totalQuestions - answeredCount;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl overflow-hidden">
        <div className="px-8 py-6 bg-gradient-to-r from-orange-500 to-red-500">
          <h3 className="text-2xl font-bold text-white">Submit Test?</h3>
        </div>
        <div className="p-8">
          <div className="text-center mb-6">
            <div className="w-20 h-20 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-4xl">⚠️</span>
            </div>
            <p className="text-gray-900 font-semibold text-lg mb-2">
              Are you sure you want to submit?
            </p>
            <p className="text-gray-600 mb-4">
              You have answered <span className="font-bold text-indigo-600">{answeredCount}</span>{" "}
              out of <span className="font-bold">{totalQuestions}</span> questions.
            </p>
            {unansweredCount > 0 && (
              <p className="text-red-600 font-medium text-sm">
                {unansweredCount} question
                {unansweredCount !== 1 ? "s" : ""} unanswered!
              </p>
            )}
          </div>

          <div className="bg-yellow-50 border-2 border-yellow-200 rounded-xl p-4 mb-6">
            <p className="text-sm text-gray-700">
              <span className="font-bold">Note:</span> Once submitted, you cannot change your
              answers.
            </p>
          </div>

          <div className="flex gap-3">
            <button
              onClick={onCancel}
              className="flex-1 px-6 py-4 bg-gray-100 text-gray-700 font-bold rounded-xl hover:bg-gray-200 transition-all text-lg"
            >
              Review Answers
            </button>
            <button
              onClick={onConfirm}
              disabled={submitting}
              className="flex-1 px-6 py-4 bg-gradient-to-r from-green-500 to-emerald-600 text-white font-bold rounded-xl hover:from-green-600 hover:to-emerald-700 transition-all shadow-lg hover:shadow-xl disabled:opacity-50 text-lg"
            >
              {submitting ? "Submitting..." : "Submit Now"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
