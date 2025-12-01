import React from "react";
import Image from "next/image";

import { getAnswerStatus, formatAnswerText, getCorrectAnswerText } from "../utils";
import { Answer } from "../types";

type Props = {
  answer: Answer;
  index: number;
  submissionId: number;
  gradingScores: Record<string, number>;
  onScoreChange: (submissionId: number, questionIndex: number, score: number) => void;
  isTeacherView: boolean;
};

export default function QuestionItem({
  answer,
  index,
  submissionId,
  gradingScores,
  onScoreChange,
  isTeacherView,
}: Props) {
  const key = `${submissionId}-${index}`;
  const localScore = gradingScores[key];
  const displayScore = localScore !== undefined ? localScore : answer.obtainedMarks || 0;

  const question = answer.question;
  const studentAnswerText = answer.answer;
  const maxMarks = answer.maxMarks || question?.maxMarks || 0;

  const answerStatus = getAnswerStatus(answer);

  const effectiveOptions =
    question?.options && question.options.length > 0
      ? question.options
      : question?.type === "TRUE_FALSE"
        ? ["True", "False"]
        : question?.options;

  const formattedStudentAnswer = formatAnswerText(
    studentAnswerText,
    question?.type,
    effectiveOptions,
  );

  const correctAnswerText = getCorrectAnswerText(
    question?.correctAnswer ?? undefined,
    question?.type,
    effectiveOptions,
  );

  return (
    <div className={`border-2 rounded-2xl p-6 ${answerStatus.color}`}>
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-2xl">{answerStatus.icon}</span>
            <h5 className="text-lg font-bold text-gray-900">
              Question {index + 1}
              {question?.type && (
                <span className="ml-2 text-sm bg-gray-200 px-2 py-1 rounded">
                  {question.type.replace("_", " ")}
                </span>
              )}
            </h5>
          </div>
          <p className="text-gray-800 font-medium leading-relaxed">
            {question?.text || "Question text not available"}
          </p>
          {question?.image && (
            <div className="mt-3 max-w-md rounded-lg overflow-hidden shadow-md relative">
              <Image
                src={question.image}
                alt="Question"
                width={500}
                height={300}
                className="w-full h-auto object-contain"
                priority={false}
              />
            </div>
          )}
        </div>
        <div className="text-right ml-4">
          <div className="text-sm text-gray-600 mb-1">Score</div>
          {isTeacherView ? (
            <div className="flex items-center space-x-2">
              <input
                type="number"
                min="0"
                max={maxMarks}
                value={localScore !== undefined ? localScore : answer.obtainedMarks || 0}
                onChange={(e) =>
                  onScoreChange(
                    submissionId,
                    index,
                    Math.min(maxMarks, Math.max(0, parseInt(e.target.value) || 0)),
                  )
                }
                className="w-16 px-3 py-2 border-2 border-gray-400 rounded-lg text-center font-semibold text-gray-900 bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-200 focus:outline-none transition-all"
              />
              <span className="text-sm text-gray-600">/ {maxMarks}</span>
            </div>
          ) : (
            <div className="text-lg font-bold text-gray-900">
              {displayScore} / {maxMarks}
            </div>
          )}
        </div>
      </div>

      <div className="bg-white/80 rounded-xl p-4 mb-4">
        <h6 className="font-semibold text-gray-900 mb-2">
          {isTeacherView ? "Student's Answer:" : "Your Answer:"}
        </h6>
        <p className="text-gray-800 font-medium">{formattedStudentAnswer}</p>
      </div>

      {(question?.type === "MULTIPLE_CHOICE" || question?.type === "TRUE_FALSE") && (
        <div className="bg-white/80 rounded-xl p-4 mb-4">
          <h6 className="font-semibold text-green-800 mb-2">Correct Answer:</h6>
          <p className="text-green-700 font-medium">{correctAnswerText}</p>
        </div>
      )}

      {question?.type === "MULTIPLE_CHOICE" && effectiveOptions && (
        <div className="bg-white/80 rounded-xl p-4">
          <h6 className="font-semibold text-gray-900 mb-3">Options:</h6>
          <div className="space-y-2">
            {effectiveOptions.map((option: string, optIndex: number) => {
              const isStudentChoice = parseInt(studentAnswerText) === optIndex;
              const isCorrectOption = question.correctAnswer === optIndex;

              return (
                <div
                  key={optIndex}
                  className={`p-3 rounded-lg border-2 ${
                    isStudentChoice && isCorrectOption
                      ? "border-green-400 bg-green-100"
                      : isStudentChoice && !isCorrectOption
                        ? "border-red-400 bg-red-100"
                        : isCorrectOption
                          ? "border-green-300 bg-green-50"
                          : "border-gray-200 bg-gray-50"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-gray-800 font-medium">
                      {String.fromCharCode(65 + optIndex)}. {option}
                    </span>
                    <div className="flex space-x-2">
                      {isStudentChoice && (
                        <span className="text-xs bg-blue-500 text-white px-2 py-1 rounded">
                          Student{"'"}s Choice
                        </span>
                      )}
                      {isCorrectOption && (
                        <span className="text-xs bg-green-500 text-white px-2 py-1 rounded">
                          Correct
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
