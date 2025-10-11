import React, { useState } from "react";
import { Question } from "./types";

interface AddQuestionModalProps {
  showAddQuestionModal: boolean;
  onClose: () => void;
  onAdd: (question: Question) => Promise<boolean>;
  aiPrompt: string;
  setAiPrompt: (prompt: string) => void;
  aiGenerating: boolean;
  aiPdfUploading: boolean;
  aiDesiredCount: number;
  setAiDesiredCount: (count: number) => void;
  aiMessages: string[];
  showAiSection: boolean;
  setShowAiSection: (show: boolean) => void;
  handleGenerateFromPrompt: () => void;
  handleGenerateFromPdf: (file: File | null) => void;
  loadingQuestions: boolean;
}

export default function AddQuestionModal({
  showAddQuestionModal,
  onClose,
  onAdd,
  aiPrompt,
  setAiPrompt,
  aiGenerating,
  aiPdfUploading,
  aiDesiredCount,
  setAiDesiredCount,
  aiMessages,
  showAiSection,
  setShowAiSection,
  handleGenerateFromPrompt,
  handleGenerateFromPdf,
  loadingQuestions,
}: AddQuestionModalProps) {
  const [newQuestion, setNewQuestion] = useState<Question>({
    id: 0,
    testId: 0,
    text: "",
    type: "MULTIPLE_CHOICE",
    options: ["Option A", "Option B", "Option C", "Option D"],
    correctAnswer: 0,
    maxMarks: 1,
    image: "",
  });

  const handleAddQuestion = async () => {
    const success = await onAdd(newQuestion);
    if (success) {
      setNewQuestion({
        id: 0,
        testId: 0,
        text: "",
        type: "MULTIPLE_CHOICE",
        options: ["Option A", "Option B", "Option C", "Option D"],
        correctAnswer: 0,
        maxMarks: 1,
        image: "",
      });
      onClose();
    }
  };

  const handleCancel = () => {
    setNewQuestion({
      id: 0,
      testId: 0,
      text: "",
      type: "MULTIPLE_CHOICE",
      options: ["Option A", "Option B", "Option C", "Option D"],
      correctAnswer: 0,
      maxMarks: 1,
      image: "",
    });
    onClose();
  };

  if (!showAddQuestionModal) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-3xl w-full max-w-3xl shadow-2xl overflow-hidden max-h-[90vh] overflow-y-auto">
        <div className="px-8 py-6 bg-gradient-to-r from-green-500 to-emerald-600 sticky top-0 z-10">
          <h3 className="text-2xl font-bold text-white">Add New Question</h3>
        </div>
        <div className="p-8 space-y-6">
          {/* AI Section Toggle */}
          <div className="border-2 border-emerald-200 rounded-2xl p-4 bg-gradient-to-br from-green-50 to-emerald-50">
            <button
              type="button"
              onClick={() => setShowAiSection(!showAiSection)}
              className="w-full flex items-center justify-between px-4 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-bold rounded-xl shadow hover:shadow-lg transition-all"
            >
              <span className="flex items-center gap-2">
                <span>🧠</span>
                {showAiSection
                  ? "Hide AI Question Generator"
                  : "AI Question Generator"}
              </span>
              <span>{showAiSection ? "▲" : "▼"}</span>
            </button>
            {showAiSection && (
              <div className="mt-4 space-y-4">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">
                    Topic or Prompt for AI Generation
                  </label>
                  <textarea
                    value={aiPrompt}
                    onChange={(e) => setAiPrompt(e.target.value)}
                    rows={3}
                    placeholder="e.g., Algebra linear equations basics"
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all text-gray-900 resize-none"
                  />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">
                      Number of Questions
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="20"
                      value={aiDesiredCount}
                      onChange={(e) =>
                        setAiDesiredCount(Number(e.target.value))
                      }
                      className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all text-gray-900"
                    />
                  </div>
                  <div className="flex items-end">
                    <button
                      onClick={handleGenerateFromPrompt}
                      disabled={aiGenerating}
                      className="w-full px-4 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-bold rounded-xl hover:from-indigo-700 hover:to-purple-700 transition-all shadow-lg hover:shadow-xl disabled:opacity-50"
                    >
                      {aiGenerating ? "Generating..." : "Generate from Prompt"}
                    </button>
                  </div>
                </div>
                <div className="text-center">
                  <p className="text-sm text-gray-600 mb-3">OR</p>
                  <input
                    type="file"
                    accept=".pdf"
                    onChange={(e) =>
                      handleGenerateFromPdf(e.target.files?.[0] || null)
                    }
                    className="hidden"
                    id="pdf-upload"
                  />
                  <label htmlFor="pdf-upload">
                    <button
                      type="button"
                      onClick={() =>
                        document.getElementById("pdf-upload")?.click()
                      }
                      disabled={aiPdfUploading}
                      className="px-6 py-3 bg-gradient-to-r from-orange-500 to-red-500 text-white font-bold rounded-xl hover:from-orange-600 hover:to-red-600 transition-all shadow-lg hover:shadow-xl disabled:opacity-50"
                    >
                      {aiPdfUploading
                        ? "Processing PDF..."
                        : "Generate from PDF"}
                    </button>
                  </label>
                </div>
                {aiMessages.length > 0 && (
                  <div className="bg-gray-50 rounded-xl p-4 max-h-32 overflow-y-auto">
                    {aiMessages.map((msg, i) => (
                      <p key={i} className="text-sm text-gray-700 mb-1">
                        {msg}
                      </p>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">
              Question Text *
            </label>
            <textarea
              value={newQuestion.text}
              onChange={(e) =>
                setNewQuestion({ ...newQuestion, text: e.target.value })
              }
              placeholder="Enter your question here..."
              rows={3}
              className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all text-gray-900 resize-none"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">
                Question Type *
              </label>
              <select
                value={newQuestion.type}
                onChange={(e) => {
                  const type = e.target.value as Question["type"];
                  setNewQuestion({
                    ...newQuestion,
                    type,
                    options:
                      type === "MULTIPLE_CHOICE"
                        ? ["Option A", "Option B", "Option C", "Option D"]
                        : type === "TRUE_FALSE"
                          ? ["True", "False"]
                          : undefined,
                    correctAnswer:
                      type === "MULTIPLE_CHOICE" || type === "TRUE_FALSE"
                        ? 0
                        : undefined,
                  });
                }}
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all text-gray-900 bg-white"
              >
                <option value="MULTIPLE_CHOICE">Multiple Choice</option>
                <option value="TRUE_FALSE">True/False</option>
                <option value="SHORT_ANSWER">Short Answer</option>
                <option value="LONG_ANSWER">Long Answer</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">
                Maximum Marks *
              </label>
              <input
                type="number"
                min="1"
                value={newQuestion.maxMarks}
                onChange={(e) =>
                  setNewQuestion({
                    ...newQuestion,
                    maxMarks: Number(e.target.value),
                  })
                }
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all text-gray-900"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">
              Image URL (Optional)
            </label>
            <input
              type="text"
              value={newQuestion.image || ""}
              onChange={(e) =>
                setNewQuestion({ ...newQuestion, image: e.target.value })
              }
              placeholder="https://example.com/image.jpg"
              className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all text-gray-900"
            />
          </div>

          {newQuestion.type === "MULTIPLE_CHOICE" && (
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-3">
                Answer Options *
              </label>
              <div className="space-y-3">
                {newQuestion.options?.map((option, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <input
                      type="radio"
                      name="correctAnswer"
                      checked={newQuestion.correctAnswer === i}
                      onChange={() =>
                        setNewQuestion({ ...newQuestion, correctAnswer: i })
                      }
                      className="w-5 h-5 text-green-600 focus:ring-green-500"
                    />
                    <input
                      type="text"
                      value={option}
                      onChange={(e) => {
                        const newOptions = [...(newQuestion.options || [])];
                        newOptions[i] = e.target.value;
                        setNewQuestion({ ...newQuestion, options: newOptions });
                      }}
                      placeholder={`Option ${String.fromCharCode(65 + i)}`}
                      className="flex-1 px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all text-gray-900"
                    />
                    {(newQuestion.options?.length || 0) > 2 && (
                      <button
                        onClick={() => {
                          const newOptions = newQuestion.options?.filter(
                            (_, idx) => idx !== i,
                          );
                          setNewQuestion({
                            ...newQuestion,
                            options: newOptions,
                            correctAnswer:
                              newQuestion.correctAnswer === i
                                ? 0
                                : newQuestion.correctAnswer &&
                                    newQuestion.correctAnswer > i
                                  ? newQuestion.correctAnswer - 1
                                  : newQuestion.correctAnswer,
                          });
                        }}
                        className="px-3 py-2 text-red-600 hover:bg-red-100 rounded-lg font-bold"
                      >
                        ✕
                      </button>
                    )}
                  </div>
                ))}
              </div>
              <button
                onClick={() => {
                  const currentOptions = newQuestion.options || [];
                  if (currentOptions.length < 6) {
                    setNewQuestion({
                      ...newQuestion,
                      options: [
                        ...currentOptions,
                        `Option ${String.fromCharCode(65 + currentOptions.length)}`,
                      ],
                    });
                  }
                }}
                className="mt-3 px-5 py-2.5 text-green-600 hover:bg-green-100 rounded-xl font-bold border-2 border-green-200"
              >
                + Add Option
              </button>
            </div>
          )}

          {newQuestion.type === "TRUE_FALSE" && (
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-3">
                Correct Answer *
              </label>
              <div className="flex gap-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="trueFalseAnswer"
                    checked={newQuestion.correctAnswer === 0}
                    onChange={() =>
                      setNewQuestion({ ...newQuestion, correctAnswer: 0 })
                    }
                    className="w-5 h-5 text-green-600 focus:ring-green-500"
                  />
                  <span className="text-gray-900 font-medium">True</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="trueFalseAnswer"
                    checked={newQuestion.correctAnswer === 1}
                    onChange={() =>
                      setNewQuestion({ ...newQuestion, correctAnswer: 1 })
                    }
                    className="w-5 h-5 text-green-600 focus:ring-green-500"
                  />
                  <span className="text-gray-900 font-medium">False</span>
                </label>
              </div>
            </div>
          )}

          {(newQuestion.type === "SHORT_ANSWER" ||
            newQuestion.type === "LONG_ANSWER") && (
            <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-4">
              <p className="text-sm text-blue-800 font-medium">
                ℹ️ This question type requires manual grading. Students will
                provide written answers that you&apos;ll need to evaluate and
                grade manually.
              </p>
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
              onClick={handleAddQuestion}
              disabled={loadingQuestions}
              className="flex-1 px-6 py-4 bg-gradient-to-r from-green-500 to-emerald-600 text-white font-bold rounded-xl hover:from-green-600 hover:to-emerald-700 transition-all shadow-lg hover:shadow-xl disabled:opacity-50 text-lg"
            >
              {loadingQuestions ? "Adding..." : "Add Question"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
