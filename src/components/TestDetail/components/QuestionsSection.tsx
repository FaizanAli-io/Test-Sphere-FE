import React from "react";
import Image from "next/image";
import type { Question, QuestionPool } from "../types";

interface QuestionsSectionProps {
  questions: Question[];
  loadingQuestions: boolean;
  onAddQuestion: () => void;
  onEditQuestion: (q: Question) => void;
  onDeleteQuestion: (id: number) => void;
  isPoolMode?: boolean;
  poolInfo?: { type: "warning" | "info"; message: string } | undefined;
  pools?: QuestionPool[];
  onUnassignQuestion?: (questionId: number, poolId: number) => void;
  onAddPool?: () => void;
  onEditPool?: (pool: QuestionPool) => void;
  onDeletePool?: (poolId: number) => void;
  onAssignQuestionsToPool?: (pool: QuestionPool) => void;
  isTeacher?: boolean;
}

const StatsBar = ({ questions }: { questions: Question[] }) => {
  const stats = React.useMemo(() => {
    const counts = {
      MULTIPLE_CHOICE: 0,
      TRUE_FALSE: 0,
      SHORT_ANSWER: 0,
      LONG_ANSWER: 0,
    };
    questions.forEach((q) => {
      if (counts[q.type] !== undefined) {
        counts[q.type]++;
      }
    });
    return counts;
  }, [questions]);

  if (questions.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-2 text-xs text-gray-600 bg-gray-50 px-3 py-2 rounded-lg border border-gray-100">
      <span className="font-semibold mr-1">Stats:</span>
      {stats.MULTIPLE_CHOICE > 0 && (
        <span className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full">
          MCQ: {stats.MULTIPLE_CHOICE}
        </span>
      )}
      {stats.TRUE_FALSE > 0 && (
        <span className="px-2 py-0.5 bg-green-100 text-green-700 rounded-full">
          T/F: {stats.TRUE_FALSE}
        </span>
      )}
      {stats.SHORT_ANSWER > 0 && (
        <span className="px-2 py-0.5 bg-purple-100 text-purple-700 rounded-full">
          Short: {stats.SHORT_ANSWER}
        </span>
      )}
      {stats.LONG_ANSWER > 0 && (
        <span className="px-2 py-0.5 bg-orange-100 text-orange-700 rounded-full">
          Long: {stats.LONG_ANSWER}
        </span>
      )}
    </div>
  );
};

export default function QuestionsSection({
  questions,
  loadingQuestions,
  onAddQuestion,
  onEditQuestion,
  onDeleteQuestion,
  isPoolMode,
  poolInfo,
  pools,
  onUnassignQuestion,
  onAddPool,
  onEditPool,
  onDeletePool,
  onAssignQuestionsToPool,
  isTeacher,
}: QuestionsSectionProps) {
  const [isSectionOpen, setIsSectionOpen] = React.useState(true);
  const [openQuestionIds, setOpenQuestionIds] = React.useState<Set<number>>(() => new Set());
  const [openPoolIds, setOpenPoolIds] = React.useState<Set<number>>(() => new Set());
  const [sortBy, setSortBy] = React.useState<"default" | "type">("default");

  const toggleQuestionOpen = (id: number) => {
    setOpenQuestionIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const togglePoolOpen = (poolId: number) => {
    setOpenPoolIds((prev) => {
      const next = new Set(prev);
      if (next.has(poolId)) next.delete(poolId);
      else next.add(poolId);
      return next;
    });
  };

  const sortedQuestions = React.useMemo(() => {
    if (sortBy === "default") return questions;
    return [...questions].sort((a, b) => a.type.localeCompare(b.type));
  }, [questions, sortBy]);

  // Group questions by pool when in POOL mode
  const groupedQuestions = React.useMemo(() => {
    if (!isPoolMode) return null;

    const groups: { [poolId: string]: Question[] } = { null: [] };

    // Initialize with all pools first so they show up even if empty
    pools?.forEach((pool) => {
      // Use string keys to match consistent access patterns
      groups[pool.id] = [];
    });

    sortedQuestions.forEach((q) => {
      const poolId = q.questionPoolId?.toString() ?? "null";
      // Fallback if question points to a pool that is not in the pools list (deleted?)
      if (!groups[poolId]) groups[poolId] = [];
      groups[poolId].push(q);
    });

    return groups;
  }, [sortedQuestions, isPoolMode, pools]);

  const getPoolTitle = (poolId: number | null) => {
    if (!poolId) return "Unassigned Questions";
    return pools?.find((p) => p.id === poolId)?.title || `Pool #${poolId}`;
  };

  const getPoolInfo = (poolId: number | null) => {
    return pools?.find((p) => p.id === poolId);
  };

  return (
    <div className="bg-white rounded-3xl shadow-xl p-8 mb-8">
      {/* Header */}
      <div className="flex flex-col gap-6 mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div
            className="flex flex-col cursor-pointer select-none"
            onClick={() => setIsSectionOpen((prev) => !prev)}
          >
            <div className="flex items-center gap-2">
              <h2 className="text-2xl font-bold text-gray-900">Questions ({questions.length})</h2>
              <span
                className={`text-gray-500 transition-transform ${isSectionOpen ? "rotate-180" : ""}`}
              >
                ▼
              </span>
            </div>
            {isPoolMode && (
              <p className="mt-1 text-sm text-gray-600">Questions are dynamically selected from pools on each request</p>
            )}
          </div>

          <div className="flex gap-3 items-center">
            {/* Sort Dropdown */}
            <div className="relative">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as "default" | "type")}
                className="px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-700 font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500 hover:bg-gray-100 transition-all cursor-pointer appearance-none pr-8"
              >
                <option value="default">Default Sort</option>
                <option value="type">Sort by Type</option>
              </select>
              <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-gray-500">
                ▼
              </div>
            </div>

            {isPoolMode && onAddPool && (
              <button
                onClick={onAddPool}
                className="px-6 py-3 bg-gradient-to-r from-indigo-500 to-purple-500 text-white font-bold rounded-xl hover:from-indigo-600 hover:to-purple-600 transition-all shadow-lg hover:shadow-xl flex items-center gap-2"
              >
                <span>+</span> Add Pool
              </button>
            )}
            <button
              onClick={onAddQuestion}
              className="px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-500 text-white font-bold rounded-xl hover:from-green-600 hover:to-emerald-600 transition-all shadow-lg hover:shadow-xl flex items-center gap-2"
            >
              <span>+</span> Add Question
            </button>
          </div>
        </div>

        {/* Global Stats Bar */}
        {isSectionOpen && (
          <div className="animate-in fade-in slide-in-from-top-2 duration-300">
            <StatsBar questions={questions} />
          </div>
        )}
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
        ) : questions.length === 0 && (!isPoolMode || !pools || pools.length === 0) ? (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">❓</div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No Questions Yet</h3>
            <p className="text-gray-600 mb-6">Add some questions to get started with your test.</p>
            <button
              onClick={onAddQuestion}
              className="px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-500 text-white font-bold rounded-xl hover:from-green-600 hover:to-emerald-600 transition-all shadow-lg hover:shadow-xl"
            >
              Add Your First Question
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {poolInfo && poolInfo.type === "warning" && (
              <div className="bg-yellow-50 border-2 border-yellow-200 p-4 rounded-xl mb-4 text-yellow-800">
                ⚠️ {poolInfo.message}
              </div>
            )}

            {isPoolMode && groupedQuestions ? (
              // Pool mode: grouped by pool
              <div className="space-y-4">
                {Object.entries(groupedQuestions).map(([poolIdStr, poolQuestions]) => {
                  const poolId = poolIdStr === "null" ? null : Number(poolIdStr);
                  const isPoolOpen = poolId === null ? true : openPoolIds.has(poolId);
                  const poolData = getPoolInfo(poolId);

                  return (
                    <div key={poolIdStr} className="border-2 border-purple-200 rounded-2xl overflow-hidden bg-white">
                      {/* Pool Header */}
                      <div
                        className="bg-gradient-to-r from-purple-50 to-purple-100 p-4 transition-all"
                      >
                        <div className="flex flex-col gap-3">
                          <div 
                            className="flex items-center justify-between cursor-pointer select-none"
                            onClick={() => {
                              if (poolId !== null) togglePoolOpen(poolId);
                            }}
                          >
                            <div className="flex items-center gap-3">
                              <h3 className="text-lg font-bold text-purple-900">{getPoolTitle(poolId)}</h3>
                              <span className="px-3 py-1 bg-purple-200 text-purple-800 rounded-full text-sm font-medium">
                                {poolQuestions.length} {poolQuestions.length === 1 ? "question" : "questions"}
                              </span>
                            </div>
                            
                            <div className="flex items-center gap-3">
                              {/* Pool Actions */}
                              {poolId !== null && (
                                <div className="flex gap-2 mr-4" onClick={(e) => e.stopPropagation()}>
                                  {onAssignQuestionsToPool && poolData && (
                                    <button
                                      onClick={() => onAssignQuestionsToPool(poolData)}
                                      className="p-2 bg-white text-purple-600 rounded-lg hover:bg-purple-200 border border-purple-200 transition-colors"
                                      title="Add Questions to Pool"
                                    >
                                      ➕ Add Qs
                                    </button>
                                  )}
                                  {onEditPool && poolData && (
                                    <button
                                      onClick={() => onEditPool(poolData)}
                                      className="p-2 bg-white text-blue-600 rounded-lg hover:bg-blue-100 border border-blue-200 transition-colors"
                                      title="Edit Pool"
                                    >
                                      ✏️ Edit
                                    </button>
                                  )}
                                  {onDeletePool && (
                                    <button
                                      onClick={() => onDeletePool(poolId)}
                                      className="p-2 bg-white text-red-600 rounded-lg hover:bg-red-100 border border-red-200 transition-colors"
                                      title="Delete Pool"
                                    >
                                      🗑️ Delete
                                    </button>
                                  )}
                                </div>
                              )}
                              
                              {poolId !== null && (
                                <span className={`text-purple-600 transition-transform ${isPoolOpen ? "rotate-180" : ""}`}>
                                  ▼
                                </span>
                              )}
                            </div>
                          </div>

                          {/* Pool Stats Bar */}
                          {isPoolOpen && poolQuestions.length > 0 && (
                             <StatsBar questions={poolQuestions} />
                          )}
                        </div>
                      </div>

                      {/* Pool Questions */}
                      <div
                        className={`transition-all duration-300 ease-in-out overflow-hidden ${
                          isPoolOpen ? "max-h-[10000px] opacity-100" : "max-h-0 opacity-0"
                        }`}
                      >
                        <div className="p-4 space-y-3 bg-white">
                          {poolQuestions.length === 0 ? (
                            <div className="text-center py-8 text-gray-500 bg-gray-50 rounded-xl border-dashed border-2 border-gray-200">
                              No questions in this pool yet
                            </div>
                          ) : (
                            poolQuestions.map((question, idx) => {
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
                                  <div className="flex items-center gap-3 flex-1">
                                    <span className="px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-sm font-medium">
                                      Q{idx + 1}
                                    </span>
                                    <h3 className="text-lg font-semibold text-gray-900">{question.text}</h3>
                                    {!isOpen && (
                                      <div className="flex items-center gap-2 ml-auto text-xs text-gray-600">
                                        <span className="px-2 py-1 bg-blue-50 rounded text-blue-700 font-medium">
                                          {question.type === "MULTIPLE_CHOICE"
                                            ? "MCQ"
                                            : question.type === "TRUE_FALSE"
                                              ? "T/F"
                                              : question.type === "SHORT_ANSWER"
                                                ? "Short"
                                                : "Long"}
                                        </span>
                                        <span className="px-2 py-1 bg-orange-50 rounded text-orange-700 font-medium">
                                          {question.maxMarks} mark{question.maxMarks !== 1 ? "s" : ""}
                                        </span>
                                      </div>
                                    )}
                                  </div>
                                  <span
                                    className={`text-gray-500 transition-transform flex-shrink-0 ${isOpen ? "rotate-180" : ""}`}
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
                                        {question.maxMarks} {question.maxMarks === 1 ? "mark" : "marks"}
                                      </span>
                                    </div>

                                    {question.image && (
                                      <div className="mb-4 relative w-full" style={{ maxHeight: "300px" }}>
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

                                    {question.type === "MULTIPLE_CHOICE" && question.options && (
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
                                              <span className="text-green-600 font-bold ml-2">✓</span>
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
                                          False{" "}
                                          {question.correctAnswer === 0 && (
                                            <span className="text-green-600 font-bold">✓</span>
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
                                      {poolId !== null && onUnassignQuestion && (
                                        <button
                                          onClick={() => onUnassignQuestion(question.id, poolId)}
                                          className="px-4 py-2 bg-orange-100 text-orange-700 font-medium rounded-lg hover:bg-orange-200 transition-all"
                                        >
                                          Unassign
                                        </button>
                                      )}
                                    </div>
                                  </div>
                                )}
                              </div>
                            );
                          }))}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              // Static mode: flat list
              <div className="space-y-4">
                {sortedQuestions.map((question, index) => {
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
                        <div className="flex items-center gap-3 flex-1">
                          <span className="px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-sm font-medium">
                            Q{index + 1}
                          </span>
                          <h3 className="text-lg font-semibold text-gray-900">{question.text}</h3>
                          {!isOpen && (
                            <div className="flex items-center gap-2 ml-auto text-xs text-gray-600">
                              <span className="px-2 py-1 bg-blue-50 rounded text-blue-700 font-medium">
                                {question.type === "MULTIPLE_CHOICE"
                                  ? "MCQ"
                                  : question.type === "TRUE_FALSE"
                                    ? "T/F"
                                    : question.type === "SHORT_ANSWER"
                                      ? "Short"
                                      : "Long"}
                              </span>
                              <span className="px-2 py-1 bg-orange-50 rounded text-orange-700 font-medium">
                                {question.maxMarks} mark{question.maxMarks !== 1 ? "s" : ""}
                              </span>
                            </div>
                          )}
                        </div>
                        <span
                          className={`text-gray-500 transition-transform flex-shrink-0 ml-3 ${isOpen ? "rotate-180" : ""}`}
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
                              {question.maxMarks} {question.maxMarks === 1 ? "mark" : "marks"}
                            </span>
                          </div>

                          {question.image && (
                            <div className="mb-4 relative w-full" style={{ maxHeight: "300px" }}>
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

                          {question.type === "MULTIPLE_CHOICE" && question.options && (
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
                                    <span className="text-green-600 font-bold ml-2">✓</span>
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
                                False{" "}
                                {question.correctAnswer === 0 && (
                                  <span className="text-green-600 font-bold">✓</span>
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
        )}
      </div>
    </div>
  );
}
