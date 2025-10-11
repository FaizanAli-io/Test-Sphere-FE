"use client";

import React, { useState } from "react";
import { useSearchParams, useRouter, useParams } from "next/navigation";

import {
  TestHeader,
  useTestExam,
  QuestionRenderer,
  TestInstructions,
  SubmitConfirmModal
} from "./index";

export default function GiveTest() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const params = useParams() as Record<string, string | string[]> | null;

  const routeIdRaw = params?.["testId"] ?? params?.["id"];
  const routeId = Array.isArray(routeIdRaw) ? routeIdRaw[0] : routeIdRaw;
  const qpId = searchParams?.get("testId") || searchParams?.get("id");
  const testIdParam = qpId || routeId || null;
  const testId = testIdParam ? Number(testIdParam) : null;

  const [showSubmitConfirm, setShowSubmitConfirm] = useState(false);

  const {
    test,
    answers,
    loading,
    submitting,
    error,
    testStarted,
    timeRemaining,
    answeredCount,
    totalQuestions,
    progress,
    startTest,
    updateAnswer,
    submitTest,
    formatTime
  } = useTestExam(testId);

  const handleStartTest = async () => {
    await startTest();
  };

  const handleSubmitTest = async () => {
    await submitTest();
    setShowSubmitConfirm(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-purple-50 to-indigo-50">
        <div className="text-center">
          <div className="relative">
            <div className="animate-spin rounded-full h-16 w-16 border-4 border-indigo-200"></div>
            <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-indigo-600 absolute top-0"></div>
          </div>
          <p className="mt-6 text-gray-600 font-semibold text-lg">
            Loading test...
          </p>
        </div>
      </div>
    );
  }

  if (error || !test) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 bg-gradient-to-br from-slate-50 via-purple-50 to-indigo-50">
        <div className="bg-white p-10 rounded-3xl shadow-2xl text-center max-w-md border-2 border-red-200">
          <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <span className="text-4xl">⚠️</span>
          </div>
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            Error Loading Test
          </h2>
          <p className="text-gray-600 mb-8 text-lg">
            {error || "Test not found"}
          </p>
          <button
            onClick={() => router.push("/student")}
            className="px-8 py-4 bg-gradient-to-r from-indigo-600 to-blue-600 text-white font-bold rounded-xl hover:from-indigo-700 hover:to-blue-700 transition-all shadow-lg hover:shadow-xl"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  if (!testStarted) {
    return (
      <TestInstructions
        test={test}
        onStartTest={handleStartTest}
        onCancel={() => router.push("/student")}
      />
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-purple-50 to-indigo-50">
      <TestHeader
        testTitle={test.title}
        answeredCount={answeredCount}
        totalQuestions={totalQuestions}
        timeRemaining={timeRemaining}
        formatTime={formatTime}
        progress={progress}
        onSubmitTest={() => setShowSubmitConfirm(true)}
        submitting={submitting}
      />

      {/* Questions */}
      <div className="max-w-5xl mx-auto px-4 py-8">
        <div className="space-y-8">
          {test.questions.map((question, index) => (
            <QuestionRenderer
              key={question.id}
              question={question}
              index={index}
              answer={answers[question.id]}
              onAnswerChange={updateAnswer}
            />
          ))}
        </div>

        {/* Submit Button at Bottom */}
        <div className="mt-8 bg-white rounded-2xl shadow-lg border-2 border-gray-200 p-6">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <p className="text-gray-900 font-bold text-lg">
                {answeredCount} of {totalQuestions} questions answered
              </p>
              <p className="text-gray-600 text-sm mt-1">
                {totalQuestions - answeredCount === 0
                  ? "All questions answered! You can submit now."
                  : `${totalQuestions - answeredCount} question${
                      totalQuestions - answeredCount !== 1 ? "s" : ""
                    } remaining`}
              </p>
            </div>
            <button
              onClick={() => setShowSubmitConfirm(true)}
              disabled={submitting}
              className="px-8 py-4 bg-gradient-to-r from-green-500 to-emerald-600 text-white font-bold rounded-xl hover:from-green-600 hover:to-emerald-700 transition-all shadow-lg hover:shadow-xl disabled:opacity-50 text-lg"
            >
              Submit Test
            </button>
          </div>
        </div>
      </div>

      <SubmitConfirmModal
        isOpen={showSubmitConfirm}
        answeredCount={answeredCount}
        totalQuestions={totalQuestions}
        submitting={submitting}
        onConfirm={handleSubmitTest}
        onCancel={() => setShowSubmitConfirm(false)}
      />
    </div>
  );
}
