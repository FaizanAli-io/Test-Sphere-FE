import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import api from "@/hooks/useApi";
import { useNotifications } from "@/contexts/NotificationContext";

export interface Question {
  id: number;
  text: string;
  type: "TRUE_FALSE" | "MULTIPLE_CHOICE" | "SHORT_ANSWER" | "LONG_ANSWER";
  options?: string[];
  maxMarks: number;
  image?: string;
}

export interface Test {
  id: number;
  title: string;
  description: string;
  duration: number;
  startAt: string;
  endAt: string;
  status: string;
  questions: Question[];
}

export interface Answer {
  questionId: number;
  answer: string;
}

const shuffleArray = <T>(array: T[]): T[] => {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
};

export const useTestExam = (testId: number | null) => {
  const router = useRouter();
  const notifications = useNotifications();

  const [test, setTest] = useState<Test | null>(null);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [testStarted, setTestStarted] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [submissionId, setSubmissionId] = useState<number | null>(null);

  // Common error message for missing testId
  const MISSING_TEST_ID_ERROR =
    "Missing test id. Open this page as /give-test/[id] or /give-test?testId=123";

  const fetchTestDetails = useCallback(async () => {
    if (!testId) {
      setError(MISSING_TEST_ID_ERROR);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Fetch test and questions in parallel for better performance
      const [testRes, questionsRes] = await Promise.all([
        api(`/tests/${testId}`, { method: "GET", auth: true }),
        api(`/tests/${testId}/questions`, { method: "GET", auth: true }),
      ]);

      if (!testRes.ok) {
        const errorData = await testRes.json();
        throw new Error(errorData.message || "Failed to fetch test");
      }

      if (!questionsRes.ok) {
        const errorData = await questionsRes.json();
        throw new Error(errorData.message || "Failed to fetch questions");
      }

      const [testData, questionsData] = await Promise.all([testRes.json(), questionsRes.json()]);

      setTest({ ...testData, questions: shuffleArray(questionsData) });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load test");
    } finally {
      setLoading(false);
    }
  }, [testId, MISSING_TEST_ID_ERROR]);

  const startTest = useCallback(async () => {
    if (!testId) {
      setError(MISSING_TEST_ID_ERROR);
      return;
    }

    setLoading(true);

    try {
      const res = await api("/submissions/start", {
        method: "POST",
        auth: true,
        body: JSON.stringify({ testId }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || "Failed to start test");
      }

      const submissionData = await res.json();

      // Update multiple states together
      setSubmissionId(submissionData.id || null);
      setTestStarted(true);
      setTimeRemaining(test ? test.duration * 60 : 30 * 60);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to start test";
      notifications.showError(errorMessage);
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [testId, test, notifications, MISSING_TEST_ID_ERROR]);

  const updateAnswer = (questionId: number, answer: string) => {
    setAnswers((prev) => ({ ...prev, [questionId]: answer }));
  };

  const submitTest = useCallback(async () => {
    setSubmitting(true);

    try {
      const answersArray: Answer[] =
        test?.questions.map((q) => ({
          answer: answers[q.id] ?? null,
          questionId: q.id,
        })) || [];

      const res = await api("/submissions/submit", {
        method: "POST",
        auth: true,
        body: JSON.stringify({ answers: answersArray }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || "Failed to submit test");
      }

      notifications.showSuccess("Test submitted successfully!");
      router.push("/student");
    } catch (err) {
      notifications.showError(err instanceof Error ? err.message : "Error submitting test");
    } finally {
      setSubmitting(false);
    }
  }, [answers, router, notifications, test]);

  useEffect(() => {
    if (!testStarted || timeRemaining <= 0) return;

    const timer = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          submitTest();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [testStarted, timeRemaining, submitTest]);

  useEffect(() => {
    fetchTestDetails();
  }, [fetchTestDetails]);

  const formatTime = (seconds: number) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hrs.toString().padStart(2, "0")}:${mins.toString().padStart(2, "0")}:${secs
      .toString()
      .padStart(2, "0")}`;
  };

  // Memoized calculations to avoid redundant computations
  const answeredCount = Object.keys(answers).length;
  const totalQuestions = test?.questions.length || 0;
  const totalMarks = test?.questions.reduce((sum, q) => sum + q.maxMarks, 0) || 0;
  const progress = totalQuestions > 0 ? (answeredCount / totalQuestions) * 100 : 0;

  return {
    test,
    answers,
    loading,
    submitting,
    error,
    testStarted,
    timeRemaining,
    submissionId,

    answeredCount,
    totalQuestions,
    totalMarks,
    progress,

    startTest,
    updateAnswer,
    submitTest,

    formatTime,
  };
};
