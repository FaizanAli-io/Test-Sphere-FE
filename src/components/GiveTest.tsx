"use client";

import React, { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import { useSearchParams, useRouter, useParams } from "next/navigation";
import api from "../hooks/useApi";

interface Question {
  id: number;
  text: string;
  type: "TRUE_FALSE" | "MULTIPLE_CHOICE" | "SHORT_ANSWER" | "LONG_ANSWER";
  options?: string[];
  maxMarks: number;
  image?: string;
}

interface Test {
  id: number;
  title: string;
  description: string;
  duration: number;
  startAt: string;
  endAt: string;
  status: string;
  questions: Question[];
}

interface Answer {
  questionId: number;
  answer: string;
}

export default function GiveTest() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const params = useParams() as Record<string, string | string[]> | null;

  // Support both query params (?testId=123 or ?id=123) and dynamic routes (/take-test/123 or /take-test/[testId])
  const routeIdRaw = params?.["testId"] ?? params?.["id"];
  const routeId = Array.isArray(routeIdRaw) ? routeIdRaw[0] : routeIdRaw;
  const qpId = searchParams?.get("testId") || searchParams?.get("id");
  const testIdParam = qpId || routeId || null;
  const testId = testIdParam ? Number(testIdParam) : null;

  const [test, setTest] = useState<Test | null>(null);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [testStarted, setTestStarted] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [showSubmitConfirm, setShowSubmitConfirm] = useState(false);

  // Start the test
  const handleStartTest = useCallback(async () => {
    if (!testId) {
      setError("Missing test id. Open this page as /take-test/[id] or /take-test?testId=123");
      return;
    }

    setLoading(true);

    try {
      const res = await api("/submissions/start", {
        method: "POST",
        auth: true,
        body: JSON.stringify({ testId })
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || "Failed to start test");
      }

      await res.json();

      setTestStarted(true);

      if (test) {
        const timeInSeconds = test.duration * 60;
        setTimeRemaining(timeInSeconds);
      } else {
        setTimeRemaining(30 * 60);
      }
    } catch (err) {
      alert(err instanceof Error ? err.message : "Error starting test");
      setError(err instanceof Error ? err.message : "Failed to start test");
    } finally {
      setLoading(false);
    }
  }, [testId, test]);

  // Fetch test details
  const fetchTestDetails = useCallback(async () => {
    if (!testId) {
      setError("Missing test id. Open this page as /take-test/[id] or /take-test?testId=123");
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await api(`/tests/${testId}`, { method: "GET", auth: true });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || "Failed to fetch test");
      }
      const testData = await res.json();

      // Fetch questions
      const questionsRes = await api(`/tests/${testId}/questions`, {
        method: "GET",
        auth: true
      });

      if (!questionsRes.ok) {
        const errorData = await questionsRes.json();
        throw new Error(errorData.message || "Failed to fetch questions");
      }
      const questionsData = await questionsRes.json();

      const fullTest = { ...testData, questions: questionsData };
      setTest(fullTest);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load test");
    } finally {
      setLoading(false);
    }
  }, [testId]);

  // Handle answer change
  const handleAnswerChange = (questionId: number, answer: string) => {
    setAnswers((prev) => ({ ...prev, [questionId]: answer }));
  };

  // Submit test
  const handleSubmitTest = useCallback(async () => {
    setSubmitting(true);

    try {
      const answersArray: Answer[] = Object.entries(answers).map(([questionId, answer]) => ({
        questionId: Number(questionId),
        answer: answer
      }));

      const res = await api("/submissions/submit", {
        method: "POST",
        auth: true,
        body: JSON.stringify({ answers: answersArray })
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || "Failed to submit test");
      }

      await res.json();

      alert("Test submitted successfully!");
      router.push("/student");
    } catch (err) {
      alert(err instanceof Error ? err.message : "Error submitting test");
    } finally {
      setSubmitting(false);
      setShowSubmitConfirm(false);
    }
  }, [answers, router]);

  // Timer effect
  useEffect(() => {
    if (!testStarted || timeRemaining <= 0) return;
    const timer = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          handleSubmitTest();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [testStarted, timeRemaining, handleSubmitTest]);

  useEffect(() => {
    fetchTestDetails();
  }, [fetchTestDetails]);

  // Format time display
  const formatTime = (seconds: number) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hrs.toString().padStart(2, "0")}:${mins.toString().padStart(2, "0")}:${secs
      .toString()
      .padStart(2, "0")}`;
  };

  // Calculate progress
  const calculateProgress = () => {
    if (!test) return 0;
    const answered = Object.keys(answers).length;
    const total = test.questions.length;
    return total > 0 ? (answered / total) * 100 : 0;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-purple-50 to-indigo-50">
        <div className="text-center">
          <div className="relative">
            <div className="animate-spin rounded-full h-16 w-16 border-4 border-indigo-200"></div>
            <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-indigo-600 absolute top-0"></div>
          </div>
          <p className="mt-6 text-gray-600 font-semibold text-lg">Loading test...</p>
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
          <h2 className="text-3xl font-bold text-gray-900 mb-4">Error Loading Test</h2>
          <p className="text-gray-600 mb-8 text-lg">{error || "Test not found"}</p>
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
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-purple-50 to-indigo-50 py-12 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-3xl shadow-2xl border-2 border-gray-100 overflow-hidden">
            <div className="px-8 py-6 bg-gradient-to-r from-indigo-600 to-blue-600">
              <h1 className="text-3xl font-bold text-white">Test Instructions</h1>
            </div>

            <div className="p-8">
              <div className="mb-8">
                <h2 className="text-3xl font-bold text-gray-900 mb-4">{test.title}</h2>
                <p className="text-gray-600 text-lg leading-relaxed">{test.description}</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-6 border-2 border-blue-200">
                  <div className="text-4xl mb-3">📝</div>
                  <p className="text-sm font-bold text-gray-600 mb-1">Total Questions</p>
                  <p className="text-3xl font-bold text-gray-900">{test.questions.length}</p>
                </div>

                <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-2xl p-6 border-2 border-purple-200">
                  <div className="text-4xl mb-3">⏱️</div>
                  <p className="text-sm font-bold text-gray-600 mb-1">Duration</p>
                  <p className="text-3xl font-bold text-gray-900">{test.duration} min</p>
                </div>

                <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl p-6 border-2 border-green-200">
                  <div className="text-4xl mb-3">🎯</div>
                  <p className="text-sm font-bold text-gray-600 mb-1">Total Marks</p>
                  <p className="text-3xl font-bold text-gray-900">
                    {test.questions.reduce((sum, q) => sum + q.maxMarks, 0)}
                  </p>
                </div>
              </div>

              <div className="bg-yellow-50 border-2 border-yellow-200 rounded-2xl p-6 mb-8">
                <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <span className="text-2xl">📋</span>
                  Important Instructions
                </h3>
                <ul className="space-y-3 text-gray-700">
                  <li className="flex items-start gap-3">
                    <span className="text-indigo-600 font-bold mt-1">•</span>
                    <span>Read each question carefully before answering</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="text-indigo-600 font-bold mt-1">•</span>
                    <span>You can navigate between questions using the question palette</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="text-indigo-600 font-bold mt-1">•</span>
                    <span>Your answers are automatically saved as you progress</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="text-indigo-600 font-bold mt-1">•</span>
                    <span>The test will auto-submit when the timer reaches zero</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="text-indigo-600 font-bold mt-1">•</span>
                    <span>Ensure you have a stable internet connection</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="text-indigo-600 font-bold mt-1">•</span>
                    <span>Once submitted, you cannot change your answers</span>
                  </li>
                </ul>
              </div>

              <div className="flex gap-4">
                <button
                  onClick={() => router.push("/student")}
                  className="flex-1 px-8 py-4 bg-gray-100 text-gray-700 font-bold rounded-xl hover:bg-gray-200 transition-all text-lg"
                >
                  Cancel
                </button>
                <button
                  onClick={handleStartTest}
                  className="flex-1 px-8 py-4 bg-gradient-to-r from-indigo-600 to-blue-600 text-white font-bold rounded-xl hover:from-indigo-700 hover:to-blue-700 transition-all shadow-lg hover:shadow-xl text-lg"
                >
                  Start Test
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const progress = calculateProgress();
  const answeredCount = Object.keys(answers).length;
  const totalQuestions = test.questions.length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-purple-50 to-indigo-50">
      {/* Fixed Header */}
      <div className="sticky top-0 z-40 bg-white shadow-lg border-b-2 border-gray-200">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{test.title}</h1>
              <p className="text-sm text-gray-600 mt-1">
                Question {answeredCount} of {totalQuestions} answered
              </p>
            </div>

            <div className="flex items-center gap-4">
              <div className="bg-gradient-to-r from-orange-100 to-red-100 border-2 border-orange-300 rounded-xl px-6 py-3">
                <p className="text-xs font-bold text-gray-600 mb-1">Time Remaining</p>
                <p
                  className={`text-2xl font-bold ${
                    timeRemaining < 300 ? "text-red-600" : "text-gray-900"
                  }`}
                >
                  {formatTime(timeRemaining)}
                </p>
              </div>

              <button
                onClick={() => setShowSubmitConfirm(true)}
                disabled={submitting}
                className="px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white font-bold rounded-xl hover:from-green-600 hover:to-emerald-700 transition-all shadow-lg hover:shadow-xl disabled:opacity-50"
              >
                Submit Test
              </button>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="mt-4">
            <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-indigo-600 to-blue-600 transition-all duration-300 rounded-full"
                style={{ width: `${progress}%` }}
              ></div>
            </div>
          </div>
        </div>
      </div>

      {/* Questions */}
      <div className="max-w-5xl mx-auto px-4 py-8">
        <div className="space-y-8">
          {test.questions.map((question, index) => (
            <div
              key={question.id}
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

              {/* Multiple Choice */}
              {question.type === "MULTIPLE_CHOICE" && question.options && (
                <div className="space-y-3">
                  {question.options.map((option, optIndex) => (
                    <label
                      key={optIndex}
                      className={`flex items-center gap-4 p-4 rounded-xl border-2 cursor-pointer transition-all ${
                        answers[question.id] === optIndex.toString()
                          ? "bg-indigo-50 border-indigo-400 shadow-md"
                          : "bg-gray-50 border-gray-300 hover:border-indigo-300 hover:bg-indigo-50"
                      }`}
                    >
                      <input
                        type="radio"
                        name={`question-${question.id}`}
                        value={optIndex}
                        checked={answers[question.id] === optIndex.toString()}
                        onChange={(e) => handleAnswerChange(question.id, e.target.value)}
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
              )}

              {/* True/False */}
              {question.type === "TRUE_FALSE" && (
                <div className="flex gap-4">
                  <label
                    className={`flex-1 flex items-center justify-center gap-3 p-6 rounded-xl border-2 cursor-pointer transition-all ${
                      answers[question.id] === "0"
                        ? "bg-green-100 border-green-400 shadow-md"
                        : "bg-gray-50 border-gray-300 hover:border-green-300 hover:bg-green-50"
                    }`}
                  >
                    <input
                      type="radio"
                      name={`question-${question.id}`}
                      value="0"
                      checked={answers[question.id] === "0"}
                      onChange={(e) => handleAnswerChange(question.id, e.target.value)}
                      className="w-5 h-5 text-green-600"
                    />
                    <span className="text-xl font-bold text-gray-900">True</span>
                  </label>
                  <label
                    className={`flex-1 flex items-center justify-center gap-3 p-6 rounded-xl border-2 cursor-pointer transition-all ${
                      answers[question.id] === "1"
                        ? "bg-red-100 border-red-400 shadow-md"
                        : "bg-gray-50 border-gray-300 hover:border-red-300 hover:bg-red-50"
                    }`}
                  >
                    <input
                      type="radio"
                      name={`question-${question.id}`}
                      value="1"
                      checked={answers[question.id] === "1"}
                      onChange={(e) => handleAnswerChange(question.id, e.target.value)}
                      className="w-5 h-5 text-red-600"
                    />
                    <span className="text-xl font-bold text-gray-900">False</span>
                  </label>
                </div>
              )}

              {/* Short Answer */}
              {question.type === "SHORT_ANSWER" && (
                <div>
                  <input
                    type="text"
                    value={answers[question.id] || ""}
                    onChange={(e) => handleAnswerChange(question.id, e.target.value)}
                    placeholder="Type your answer here..."
                    className="w-full px-4 py-4 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all text-gray-900 font-medium"
                  />
                </div>
              )}

              {/* Long Answer */}
              {question.type === "LONG_ANSWER" && (
                <div>
                  <textarea
                    value={answers[question.id] || ""}
                    onChange={(e) => handleAnswerChange(question.id, e.target.value)}
                    placeholder="Type your detailed answer here..."
                    rows={8}
                    className="w-full px-4 py-4 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all text-gray-900 font-medium resize-none"
                  />
                </div>
              )}
            </div>
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

      {/* Submit Confirmation Modal */}
      {showSubmitConfirm && (
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
                  You have answered{" "}
                  <span className="font-bold text-indigo-600">{answeredCount}</span> out of{" "}
                  <span className="font-bold">{totalQuestions}</span> questions.
                </p>
                {answeredCount < totalQuestions && (
                  <p className="text-red-600 font-medium text-sm">
                    {totalQuestions - answeredCount} question
                    {totalQuestions - answeredCount !== 1 ? "s" : ""} unanswered!
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
                  onClick={() => setShowSubmitConfirm(false)}
                  className="flex-1 px-6 py-4 bg-gray-100 text-gray-700 font-bold rounded-xl hover:bg-gray-200 transition-all text-lg"
                >
                  Review Answers
                </button>
                <button
                  onClick={handleSubmitTest}
                  disabled={submitting}
                  className="flex-1 px-6 py-4 bg-gradient-to-r from-green-500 to-emerald-600 text-white font-bold rounded-xl hover:from-green-600 hover:to-emerald-700 transition-all shadow-lg hover:shadow-xl disabled:opacity-50 text-lg"
                >
                  {submitting ? "Submitting..." : "Submit Now"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
