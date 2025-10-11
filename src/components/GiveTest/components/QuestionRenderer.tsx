import React from "react";
import Image from "next/image";
import { Question } from "../hooks/useTestExam";

interface QuestionRendererProps {
  question: Question;
  index: number;
  answer: string | undefined;
  onAnswerChange: (questionId: number, answer: string) => void;
}

export const QuestionRenderer: React.FC<QuestionRendererProps> = ({
  question,
  index,
  answer,
  onAnswerChange
}) => {
  const renderQuestionInput = () => {
    switch (question.type) {
      case "MULTIPLE_CHOICE":
        return (
          <div className="space-y-3">
            {question.options?.map((option, optIndex) => (
              <label
                key={optIndex}
                className={`flex items-center gap-4 p-4 rounded-xl border-2 cursor-pointer transition-all ${
                  answer === optIndex.toString()
                    ? "bg-indigo-50 border-indigo-400 shadow-md"
                    : "bg-gray-50 border-gray-300 hover:border-indigo-300 hover:bg-indigo-50"
                }`}
              >
                <input
                  type="radio"
                  name={`question-${question.id}`}
                  value={optIndex}
                  checked={answer === optIndex.toString()}
                  onChange={(e) => onAnswerChange(question.id, e.target.value)}
                  className="w-5 h-5 text-indigo-600"
                />
                <div className="flex items-center gap-3 flex-1">
                  <span className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-blue-500 text-white font-bold rounded-lg flex items-center justify-center text-sm">
                    {String.fromCharCode(65 + optIndex)}
                  </span>
                  <span className="text-gray-900 font-medium">{option}</span>
                </div>
              </label>
            ))}
          </div>
        );

      case "TRUE_FALSE":
        return (
          <div className="flex gap-4">
            <label
              className={`flex-1 flex items-center justify-center gap-3 p-6 rounded-xl border-2 cursor-pointer transition-all ${
                answer === "0"
                  ? "bg-green-100 border-green-400 shadow-md"
                  : "bg-gray-50 border-gray-300 hover:border-green-300 hover:bg-green-50"
              }`}
            >
              <input
                type="radio"
                name={`question-${question.id}`}
                value="0"
                checked={answer === "0"}
                onChange={(e) => onAnswerChange(question.id, e.target.value)}
                className="w-5 h-5 text-green-600"
              />
              <span className="text-xl font-bold text-gray-900">True</span>
            </label>
            <label
              className={`flex-1 flex items-center justify-center gap-3 p-6 rounded-xl border-2 cursor-pointer transition-all ${
                answer === "1"
                  ? "bg-red-100 border-red-400 shadow-md"
                  : "bg-gray-50 border-gray-300 hover:border-red-300 hover:bg-red-50"
              }`}
            >
              <input
                type="radio"
                name={`question-${question.id}`}
                value="1"
                checked={answer === "1"}
                onChange={(e) => onAnswerChange(question.id, e.target.value)}
                className="w-5 h-5 text-red-600"
              />
              <span className="text-xl font-bold text-gray-900">False</span>
            </label>
          </div>
        );

      case "SHORT_ANSWER":
        return (
          <div>
            <input
              type="text"
              value={answer || ""}
              onChange={(e) => onAnswerChange(question.id, e.target.value)}
              placeholder="Type your answer here..."
              className="w-full px-4 py-4 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all text-gray-900 font-medium"
            />
          </div>
        );

      case "LONG_ANSWER":
        return (
          <div>
            <textarea
              value={answer || ""}
              onChange={(e) => onAnswerChange(question.id, e.target.value)}
              placeholder="Type your detailed answer here..."
              rows={8}
              className="w-full px-4 py-4 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all text-gray-900 font-medium resize-none"
            />
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div
      id={`question-${question.id}`}
      className="bg-white rounded-2xl shadow-lg border-2 border-gray-200 p-8 scroll-mt-24"
    >
      <div className="flex items-start gap-4 mb-6">
        <div className="flex-shrink-0 w-12 h-12 bg-gradient-to-br from-indigo-600 to-blue-600 rounded-xl flex items-center justify-center text-white font-bold text-lg">
          {index + 1}
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-3">
            <span className="px-3 py-1 bg-purple-100 text-purple-800 text-xs font-bold rounded-lg">
              {question.type.replace(/_/g, " ")}
            </span>
            <span className="px-3 py-1 bg-green-100 text-green-800 text-xs font-bold rounded-lg">
              {question.maxMarks} {question.maxMarks === 1 ? "mark" : "marks"}
            </span>
          </div>
          <p className="text-gray-900 font-semibold text-xl leading-relaxed">
            {question.text}
          </p>
        </div>
      </div>

      {question.image && (
        <div className="mb-6">
          <Image
            src={question.image}
            alt="Question"
            width={800}
            height={600}
            className="max-w-full h-auto rounded-xl border-2 border-gray-300 shadow-md"
            onError={(e) => {
              (e.target as HTMLImageElement).style.display = "none";
            }}
          />
        </div>
      )}

      {renderQuestionInput()}
    </div>
  );
};
