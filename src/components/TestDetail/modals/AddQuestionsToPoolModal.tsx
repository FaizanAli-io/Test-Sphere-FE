import React, { useState } from "react";
import { Question, QuestionPool } from "../types";

interface AddQuestionsToPoolModalProps {
  isOpen: boolean;
  onClose: () => void;
  pool: QuestionPool;
  allQuestions: Question[];
  pools: QuestionPool[];
  onAddQuestions: (poolId: number, questionIds: number[]) => Promise<void>;
  loading?: boolean;
}

export default function AddQuestionsToPoolModal({
  isOpen,
  onClose,
  pool,
  allQuestions,
  pools,
  onAddQuestions,
  loading,
}: AddQuestionsToPoolModalProps) {
  const [selectedQuestionIds, setSelectedQuestionIds] = useState<Set<number>>(new Set());
  const [showUnassignedOnly, setShowUnassignedOnly] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const toggleQuestion = (questionId: number) => {
    setSelectedQuestionIds((prev) => {
      const next = new Set(prev);
      if (next.has(questionId)) {
        next.delete(questionId);
      } else {
        next.add(questionId);
      }
      return next;
    });
  };

  const selectAll = () => {
    const questionsToSelect = showUnassignedOnly 
      ? allQuestions.filter(q => !q.questionPoolId)
      : allQuestions;
    setSelectedQuestionIds(new Set(questionsToSelect.map((q) => q.id)));
  };

  const clearSelection = () => {
    setSelectedQuestionIds(new Set());
  };

  const getPoolTitle = (poolId: number | null) => {
    if (!poolId) return "Unassigned";
    return pools?.find((p) => p.id === poolId)?.title || `Pool #${poolId}`;
  };

  const handleSubmit = async () => {
    if (selectedQuestionIds.size === 0) return;

    setIsSubmitting(true);
    try {
      await onAddQuestions(pool.id, Array.from(selectedQuestionIds));
      setSelectedQuestionIds(new Set());
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-3xl shadow-2xl p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-900">Add Questions to {pool.title}</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 text-2xl"
          >
            ✕
          </button>
        </div>

        {/* Selection Controls */}
        <div className="flex flex-wrap gap-2 mb-6 pb-4 border-b items-center">
          <button
            onClick={selectAll}
            className="px-4 py-2 bg-blue-100 text-blue-700 font-medium rounded-lg hover:bg-blue-200 transition-all"
          >
            Select All
          </button>
          <button
            onClick={clearSelection}
            className="px-4 py-2 bg-gray-100 text-gray-700 font-medium rounded-lg hover:bg-gray-200 transition-all"
          >
            Clear Selection
          </button>
          
          <label className="flex items-center gap-2 ml-4 cursor-pointer select-none">
            <input 
              type="checkbox"
              checked={showUnassignedOnly}
              onChange={(e) => setShowUnassignedOnly(e.target.checked)}
              className="w-5 h-5 rounded border-gray-300 text-purple-600 focus:ring-purple-500"
            />
            <span className="text-gray-700 font-medium">Unassigned Only</span>
          </label>

          <span className="ml-auto text-sm text-gray-600 py-2">
            {selectedQuestionIds.size} selected
          </span>
        </div>

        {/* Questions List */}
        <div className="space-y-3 mb-6">
          {allQuestions.filter(q => !showUnassignedOnly || !q.questionPoolId).length === 0 ? (
            <div className="text-center py-8 text-gray-600">
              No questions available {showUnassignedOnly ? "matching filter" : "for this test"}.
            </div>
          ) : (
            allQuestions
              .filter(q => !showUnassignedOnly || !q.questionPoolId)
              .map((question) => {
              const isSelected = selectedQuestionIds.has(question.id);
              const currentPool = pools?.find((p) => p.id === question.questionPoolId);

              return (
                <div
                  key={question.id}
                  className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                    isSelected
                      ? "bg-blue-50 border-blue-400"
                      : "bg-white border-gray-200 hover:border-gray-300"
                  }`}
                  onClick={() => toggleQuestion(question.id)}
                >
                  <div className="flex items-start gap-3">
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => toggleQuestion(question.id)}
                      className="mt-1 w-5 h-5 rounded border-gray-300 cursor-pointer"
                      onClick={(e) => e.stopPropagation()}
                    />
                    <div className="flex-1">
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <h3 className="font-semibold text-gray-900">{question.text}</h3>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <span className="px-2 py-1 bg-blue-50 rounded text-blue-700 text-xs font-medium">
                            {question.type === "MULTIPLE_CHOICE"
                              ? "MC"
                              : question.type === "TRUE_FALSE"
                                ? "T/F"
                                : question.type === "SHORT_ANSWER"
                                  ? "SA"
                                  : "LA"}
                          </span>
                          <span className="text-xs text-gray-600">{question.maxMarks}m</span>
                        </div>
                      </div>
                      <div className="text-sm text-gray-600">
                        Current pool:{" "}
                        <span className="font-medium text-gray-900">{getPoolTitle(question.questionPoolId ?? null)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="flex gap-3 pt-6 border-t">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-3 bg-gray-100 text-gray-700 font-bold rounded-xl hover:bg-gray-200 transition-all"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={selectedQuestionIds.size === 0 || isSubmitting || loading}
            className="flex-1 px-4 py-3 bg-gradient-to-r from-green-500 to-emerald-500 text-white font-bold rounded-xl hover:from-green-600 hover:to-emerald-600 disabled:from-gray-400 disabled:to-gray-400 disabled:cursor-not-allowed transition-all"
          >
            {isSubmitting || loading ? "Adding..." : `Add ${selectedQuestionIds.size} Question${selectedQuestionIds.size !== 1 ? "s" : ""}`}
          </button>
        </div>
      </div>
    </div>
  );
}
