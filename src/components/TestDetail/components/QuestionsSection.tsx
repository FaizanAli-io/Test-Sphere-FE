import React from "react";
import Image from "next/image";
import type { Question } from "../types";

interface QuestionsSectionProps {
  questions: Question[];
  loadingQuestions: boolean;
  onAddQuestion: () => void;
  onEditQuestion: (q: Question) => void;
  onDeleteQuestion: (id: number) => void;
}

export default function QuestionsSection({
  questions,
  loadingQuestions,
  onAddQuestion,
  onEditQuestion,
  onDeleteQuestion
}: QuestionsSectionProps) {
  const [isSectionOpen, setIsSectionOpen] = React.useState(true);
  // Track which questions are expanded without using hooks inside a loop
  const [openQuestionIds, setOpenQuestionIds] = React.useState<Set<number>>(
    () => new Set()
  );
  const toggleQuestionOpen = (id: number) => {
    setOpenQuestionIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  return (
    <div className="bg-white rounded-3xl shadow-xl p-8 mb-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div
          className="flex flex-col cursor-pointer select-none"
          onClick={() => setIsSectionOpen((prev) => !prev)}
        >
          <div className="flex items-center gap-2">
            <h2 className="text-2xl font-bold text-gray-900">
              Questions ({questions.length})
            </h2>
            <span
              className={`text-gray-500 transition-transform ${
                isSectionOpen ? "rotate-180" : ""
              }`}
            >
              ▼
            </span>
          </div>
        </div>

        <button
          onClick={onAddQuestion}
          className="px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-500 text-white font-bold rounded-xl hover:from-green-600 hover:to-emerald-600 transition-all shadow-lg hover:shadow-xl"
        >
          + Add Question
        </button>
      </div>

      {/* Collapsible Content */}
      <div
        className={`transition-all duration-300 ease-in-out overflow-hidden ${
          isSectionOpen ? "max-h-[5000px] opacity-100" : "max-h-0 opacity-0"
        }`}
      >
        {loadingQuestions ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading questions...</p>
          </div>
        ) : questions.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">❓</div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              No Questions Yet
            </h3>
            <p className="text-gray-600 mb-6">
              Add some questions to get started with your test.
            </p>
            <button
              onClick={onAddQuestion}
              className="px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-500 text-white font-bold rounded-xl hover:from-green-600 hover:to-emerald-600 transition-all shadow-lg hover:shadow-xl"
            >
              Add Your First Question
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {questions.map((question, index) => {
              const isOpen = openQuestionIds.has(question.id);
              return (
                <div
                  key={question.id}
                  className="border-2 border-gray-200 rounded-2xl p-6 hover:border-yellow-300 transition-all"
                >
                  <div
                    className="flex items-start justify-between cursor-pointer select-none"
                    onClick={() => toggleQuestionOpen(question.id)}
                  >
                    <div className="flex items-center gap-3">
                      <span className="px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-sm font-medium">
                        Q{index + 1}
                      </span>
                      <h3 className="text-lg font-semibold text-gray-900">
                        {question.text}
                      </h3>
                    </div>
                    <span
                      className={`text-gray-500 transition-transform ${
                        isOpen ? "rotate-180" : ""
                      }`}
                    >
                      ▼
                    </span>
                  </div>

                  {isOpen && (
                    <div className="mt-4 border-t pt-4">
                      <div className="flex items-center gap-3 mb-2">
                        <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
                          {question.type === "MULTIPLE_CHOICE"
                            ? "Multiple Choice"
                            : question.type === "TRUE_FALSE"
                              ? "True/False"
                              : question.type === "SHORT_ANSWER"
                                ? "Short Answer"
                                : "Long Answer"}
                        </span>
                        <span className="text-sm text-gray-600">
                          {question.maxMarks}{" "}
                          {question.maxMarks === 1 ? "mark" : "marks"}
                        </span>
                      </div>

                      {question.image && (
                        <div
                          className="mb-4 relative w-full"
                          style={{ maxHeight: "300px" }}
                        >
                          <Image
                            src={question.image}
                            alt="Question image"
                            width={0}
                            height={0}
                            sizes="100vw"
                            className="w-full h-auto rounded-lg border border-gray-200"
                            style={{ maxHeight: "300px", width: "auto" }}
                          />
                        </div>
                      )}

                      {question.type === "MULTIPLE_CHOICE" &&
                        question.options && (
                          <div className="space-y-2">
                            {question.options.map((option, optIndex) => (
                              <div
                                key={optIndex}
                                className={`p-3 rounded-lg border ${
                                  question.correctAnswer === optIndex
                                    ? "bg-green-50 border-green-200 text-green-800"
                                    : "bg-gray-50 border-gray-200 text-gray-900"
                                }`}
                              >
                                <span className="font-medium">
                                  {String.fromCharCode(65 + optIndex)}.
                                </span>{" "}
                                {option}
                                {question.correctAnswer === optIndex && (
                                  <span className="text-green-600 font-bold ml-2">
                                    ✓
                                  </span>
                                )}
                              </div>
                            ))}
                          </div>
                        )}

                      {question.type === "TRUE_FALSE" && (
                        <div className="flex gap-4">
                          <div
                            className={`p-3 rounded-lg border ${
                              question.correctAnswer === 1
                                ? "bg-green-50 border-green-200 text-green-800"
                                : "bg-gray-50 border-gray-200 text-gray-900"
                            }`}
                          >
                            True{" "}
                            {question.correctAnswer === 1 && (
                              <span className="text-green-600 font-bold">
                                ✓
                              </span>
                            )}
                          </div>
                          <div
                            className={`p-3 rounded-lg border ${
                              question.correctAnswer === 0
                                ? "bg-green-50 border-green-200 text-green-800"
                                : "bg-gray-50 border-gray-200 text-gray-900"
                            }`}
                          >
                            False{" "}
                            {question.correctAnswer === 0 && (
                              <span className="text-green-600 font-bold">
                                ✓
                              </span>
                            )}
                          </div>
                        </div>
                      )}

                      <div className="flex gap-2 mt-4">
                        <button
                          onClick={() => onEditQuestion(question)}
                          className="px-4 py-2 bg-blue-100 text-blue-700 font-medium rounded-lg hover:bg-blue-200 transition-all"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => onDeleteQuestion(question.id)}
                          className="px-4 py-2 bg-red-100 text-red-700 font-medium rounded-lg hover:bg-red-200 transition-all"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
