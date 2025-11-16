import React, { useState, useEffect } from "react";
import { Question } from "../types";

interface EditQuestionModalProps {
  showEditQuestionModal: boolean;
  editingQuestion: Question | null;
  onClose: () => void;
  onUpdate: (question: Question) => Promise<boolean>;
  loadingQuestions: boolean;
}

export function EditQuestionModal({
  showEditQuestionModal,
  editingQuestion,
  onClose,
  onUpdate,
  loadingQuestions,
}: EditQuestionModalProps) {
  const [localEditingQuestion, setLocalEditingQuestion] = useState<Question | null>(null);

  useEffect(() => {
    setLocalEditingQuestion(editingQuestion);
  }, [editingQuestion]);

  const handleUpdateQuestion = async () => {
    if (!localEditingQuestion) return;

    const success = await onUpdate(localEditingQuestion);
    if (success) {
      onClose();
    }
  };

  const handleCancel = () => {
    setLocalEditingQuestion(null);
    onClose();
  };

  if (!showEditQuestionModal || !editingQuestion || !localEditingQuestion) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-3xl w-full max-w-3xl shadow-2xl overflow-hidden max-h-[90vh] overflow-y-auto">
        <div className="px-8 py-6 bg-gradient-to-r from-yellow-500 to-orange-500 sticky top-0 z-10">
          <h3 className="text-2xl font-bold text-white">Edit Question</h3>
        </div>
        <div className="p-8 space-y-6">
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">Question Text *</label>
            <textarea
              value={localEditingQuestion.text}
              onChange={(e) =>
                setLocalEditingQuestion({
                  ...localEditingQuestion,
                  text: e.target.value,
                })
              }
              rows={3}
              className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 transition-all text-gray-900 resize-none"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">Question Type</label>
              <select
                value={localEditingQuestion.type}
                disabled
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl bg-gray-100 text-gray-900 cursor-not-allowed"
              >
                <option value="MULTIPLE_CHOICE">Multiple Choice</option>
                <option value="TRUE_FALSE">True/False</option>
                <option value="SHORT_ANSWER">Short Answer</option>
                <option value="LONG_ANSWER">Long Answer</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">Maximum Marks *</label>
              <input
                type="number"
                min="1"
                value={localEditingQuestion.maxMarks}
                onChange={(e) =>
                  setLocalEditingQuestion({
                    ...localEditingQuestion,
                    maxMarks: Number(e.target.value),
                  })
                }
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 transition-all text-gray-900"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">
              Image URL (Optional)
            </label>
            <input
              type="text"
              value={localEditingQuestion.image || ""}
              onChange={(e) =>
                setLocalEditingQuestion({
                  ...localEditingQuestion,
                  image: e.target.value,
                })
              }
              placeholder="https://example.com/image.jpg"
              className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 transition-all text-gray-900"
            />
          </div>

          {localEditingQuestion.type === "MULTIPLE_CHOICE" && (
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-3">Answer Options</label>
              <div className="space-y-3">
                {localEditingQuestion.options?.map((option, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <input
                      type="radio"
                      name="editCorrectAnswer"
                      checked={localEditingQuestion.correctAnswer === i}
                      onChange={() =>
                        setLocalEditingQuestion({
                          ...localEditingQuestion,
                          correctAnswer: i,
                        })
                      }
                      className="w-5 h-5 text-yellow-600 focus:ring-yellow-500"
                    />
                    <input
                      type="text"
                      value={option}
                      onChange={(e) => {
                        const newOptions = [...(localEditingQuestion.options || [])];
                        newOptions[i] = e.target.value;
                        setLocalEditingQuestion({
                          ...localEditingQuestion,
                          options: newOptions,
                        });
                      }}
                      className="flex-1 px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 transition-all text-gray-900"
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          {localEditingQuestion.type === "TRUE_FALSE" && (
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-3">Correct Answer</label>
              <div className="flex gap-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="editTrueFalseAnswer"
                    checked={localEditingQuestion.correctAnswer === 0}
                    onChange={() =>
                      setLocalEditingQuestion({
                        ...localEditingQuestion,
                        correctAnswer: 0,
                      })
                    }
                    className="w-5 h-5 text-yellow-600 focus:ring-yellow-500"
                  />
                  <span className="text-gray-900 font-medium">True</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="editTrueFalseAnswer"
                    checked={localEditingQuestion.correctAnswer === 1}
                    onChange={() =>
                      setLocalEditingQuestion({
                        ...localEditingQuestion,
                        correctAnswer: 1,
                      })
                    }
                    className="w-5 h-5 text-yellow-600 focus:ring-yellow-500"
                  />
                  <span className="text-gray-900 font-medium">False</span>
                </label>
              </div>
            </div>
          )}

          <div className="flex gap-3 pt-4">
            <button
              onClick={handleCancel}
              className="flex-1 px-6 py-4 bg-gray-100 text-gray-700 font-bold rounded-xl hover:bg-gray-200 transition-all text-lg"
            >
              Cancel
            </button>
            <button
              onClick={handleUpdateQuestion}
              disabled={loadingQuestions}
              className="flex-1 px-6 py-4 bg-gradient-to-r from-yellow-500 to-orange-500 text-white font-bold rounded-xl hover:from-yellow-600 hover:to-orange-600 transition-all shadow-lg hover:shadow-xl disabled:opacity-50 text-lg"
            >
              {loadingQuestions ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
