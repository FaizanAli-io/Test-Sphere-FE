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

  const fetchTestDetails = useCallback(async () => {
    if (!testId) {
      setError(
        "Missing test id. Open this page as /give-test/[id] or /give-test?testId=123"
      );
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

      const questionsRes = await api(`/tests/${testId}/questions`, {
        method: "GET",
        auth: true
      });

      if (!questionsRes.ok) {
        const errorData = await questionsRes.json();
        throw new Error(errorData.message || "Failed to fetch questions");
      }
      const questionsData = await questionsRes.json();

      const fullTest = { ...testData, questions: shuffleArray(questionsData) };
      setTest(fullTest);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load test");
    } finally {
      setLoading(false);
    }
  }, [testId]);

  const startTest = useCallback(async () => {
    if (!testId) {
      setError(
        "Missing test id. Open this page as /give-test/[id] or /give-test?testId=123"
      );
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
      notifications.showError(
        err instanceof Error ? err.message : "Error starting test"
      );
      setError(err instanceof Error ? err.message : "Failed to start test");
    } finally {
      setLoading(false);
    }
  }, [testId, test, notifications]);

  const updateAnswer = (questionId: number, answer: string) => {
    setAnswers((prev) => ({ ...prev, [questionId]: answer }));
  };

  const submitTest = useCallback(async () => {
    setSubmitting(true);

    try {
      const answersArray: Answer[] =
        test?.questions.map((q) => ({
          answer: answers[q.id] ?? null,
          questionId: q.id
        })) || [];

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

      notifications.showSuccess("Test submitted successfully!");
      router.push("/student");
    } catch (err) {
      notifications.showError(
        err instanceof Error ? err.message : "Error submitting test"
      );
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

  const calculateProgress = () => {
    if (!test) return 0;
    const answered = Object.keys(answers).length;
    const total = test.questions.length;
    return total > 0 ? (answered / total) * 100 : 0;
  };

  const formatTime = (seconds: number) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hrs.toString().padStart(2, "0")}:${mins.toString().padStart(2, "0")}:${secs
      .toString()
      .padStart(2, "0")}`;
  };

  const answeredCount = Object.keys(answers).length;
  const totalQuestions = test?.questions.length || 0;
  const totalMarks =
    test?.questions.reduce((sum, q) => sum + q.maxMarks, 0) || 0;

  return {
    test,
    answers,
    loading,
    submitting,
    error,
    testStarted,
    timeRemaining,

    answeredCount,
    totalQuestions,
    totalMarks,
    progress: calculateProgress(),

    startTest,
    updateAnswer,
    submitTest,

    formatTime
  };
};
