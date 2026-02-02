import { useState, useCallback, useEffect, useRef } from "react";
import api from "../../../hooks/useApi";
import {
  Question,
  QuestionCreatePayload,
  QuestionUpdatePayload,
  NotificationFunctions,
  ConfirmationFunction,
} from "../types";

/**
 * Hook for managing questions CRUD operations
 */
export const useQuestions = (
  testId?: string,
  notifications?: NotificationFunctions,
  confirm?: ConfirmationFunction,
  mode: "STATIC" | "POOL" = "STATIC",
) => {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loadingQuestions, setLoadingQuestions] = useState(false);
  const hasFetchedRef = useRef<string | null>(null);
  const invalidPoolTestsRef = useRef<Set<string>>(new Set());
  const lastErrorRef = useRef<{ message: string; ts: number } | null>(null);

  const makeFetchKey = (t?: string, m?: string) => `${t || ""}:${m || ""}`;

  const fetchQuestions = useCallback(async () => {
    if (!testId) return;

    const key = makeFetchKey(testId, mode);
    if (hasFetchedRef.current === key) return;

    setLoadingQuestions(true);

    try {
      // If we've already seen that POOL is invalid for this test, use STATIC directly
      const usePool = mode === "POOL" && !invalidPoolTestsRef.current.has(testId);
      const fetchMode = usePool ? "POOL" : "STATIC";
      const url = `/tests/${testId}/questions?mode=${fetchMode}`;
      const { debugLogger } = await import("@/utils/logger");
      debugLogger("Fetching questions", { testId, fetchMode, usePool, key });
      const response = await api(url, {
        method: "GET",
        auth: true,
      });

      if (!response.ok) {
        let errorData: { message?: string } = {};
        try {
          errorData = await response.json();
        } catch {
          errorData = { message: `HTTP ${response.status}` };
        }

        const errorMsg = errorData?.message || "";

        // If server validation fails for mode (e.g., enum validation), fall back to STATIC
        if (
          usePool &&
          (errorMsg.toLowerCase().includes("enum") || errorMsg.toLowerCase().includes("validation failed"))
        ) {
          // Record that POOL is invalid for this test so future attempts use STATIC directly
          invalidPoolTestsRef.current.add(testId);
          // Mark we've attempted POOL for this key to avoid immediate retry loops
          hasFetchedRef.current = key;
          // Notify user and try fetching without mode (suppress duplicate warnings)
          const warnMsg = "Pool mode is not supported for this test — showing static questions instead";
          const now = Date.now();
          if (lastErrorRef.current?.message !== warnMsg || now - lastErrorRef.current.ts > 2000) {
            notifications?.showWarning?.(warnMsg);
            lastErrorRef.current = { message: warnMsg, ts: now };
          }

          try {
            const fallback = await api(`/tests/${testId}/questions?mode=STATIC`, { method: "GET", auth: true });
            if (!fallback.ok) {
              const fallbackErr = await fallback.json();
              throw new Error(fallbackErr.message || "Failed to fetch questions (fallback)");
            }
            const fallbackData = await fallback.json();
            setQuestions(Array.isArray(fallbackData) ? fallbackData : []);
            // Record that we've fetched static as well
            hasFetchedRef.current = makeFetchKey(testId, "STATIC");
          } catch (fallbackErr) {
            // If fallback also fails, just set empty and mark as fetched to avoid infinite retries
            const fallbackMessage = fallbackErr instanceof Error ? fallbackErr.message : "Fallback fetch failed";
            const fallbackNow = Date.now();
            if (lastErrorRef.current?.message !== fallbackMessage || fallbackNow - lastErrorRef.current.ts > 2000) {
              console.warn("Fallback fetch failed, showing empty questions:", fallbackMessage);
              lastErrorRef.current = { message: fallbackMessage, ts: fallbackNow };
            }
            setQuestions([]);
            hasFetchedRef.current = makeFetchKey(testId, "STATIC");
          }
          return;
        }

        if (errorMsg === "No questions found for this test.") {
          setQuestions([]);
          // record that we've fetched for this mode to prevent refetch loops
          hasFetchedRef.current = key;
          return;
        }

        throw new Error(errorMsg || "Failed to fetch questions");
      }

      const questionsData = await response.json();
      setQuestions(Array.isArray(questionsData) ? questionsData : []);
      hasFetchedRef.current = key;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to fetch questions";

      // Suppress duplicate identical errors that occur in a short window (e.g., React Strict double-invoke)
      const now = Date.now();
      if (lastErrorRef.current?.message !== errorMessage || now - lastErrorRef.current.ts > 2000) {
        console.error("Error fetching questions:", errorMessage);
        lastErrorRef.current = { message: errorMessage, ts: now };
      }

      if (!errorMessage.includes("No questions found")) {
        // Also suppress duplicate notification spam
        if (lastErrorRef.current?.message !== errorMessage || now - lastErrorRef.current.ts > 2000) {
          notifications?.showError?.(errorMessage);
        }
      }
      setQuestions([]);
      // mark we've attempted this mode for this test to avoid infinite retries
      hasFetchedRef.current = key;
    } finally {
      setLoadingQuestions(false);
    }
  }, [testId, notifications, mode]);

  const refreshQuestions = useCallback(async () => {
    hasFetchedRef.current = null;
    await fetchQuestions();
  }, [fetchQuestions]);

  const createQuestion = useCallback(
    async (questionData: QuestionCreatePayload) => {
      try {
        const payload = {
          questions: [
            {
            text: questionData.text,
              type: questionData.type,
              maxMarks: questionData.maxMarks || 1,
              ...(questionData.options && { options: questionData.options }),
              ...(typeof questionData.correctAnswer === "number" && {
                correctAnswer: questionData.correctAnswer,
              }),
              ...(questionData.image && { image: questionData.image }),
              ...(typeof questionData.questionPoolId !== "undefined" && {
                questionPoolId: questionData.questionPoolId,
              }),
            },
          ],
        };

        const response = await api(`/tests/${testId}/questions`, {
          method: "POST",
          auth: true,
          body: JSON.stringify(payload),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || "Failed to create question");
        }

        const result = await response.json();
        const newQuestions = Array.isArray(result) ? result : [result];
        setQuestions((prev) => [...prev, ...newQuestions]);
        hasFetchedRef.current = null;
        notifications?.showSuccess?.("Question created successfully");
        return true;
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : "Failed to create question";
        notifications?.showError?.(errorMessage);
        return false;
      }
    },
    [testId, notifications],
  );

  const updateQuestion = useCallback(
    async (questionId: number, updates: QuestionUpdatePayload) => {
      try {
        const response = await api(`/tests/questions/${questionId}`, {
          method: "PATCH",
          auth: true,
          body: JSON.stringify({
            ...updates,
            ...(typeof updates.questionPoolId !== "undefined" && { questionPoolId: updates.questionPoolId }),
          }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || "Failed to update question");
        }

        const updatedQuestion = await response.json();
        setQuestions((prev) => prev.map((q) => (q.id === questionId ? updatedQuestion : q)));
        notifications?.showSuccess?.("Question updated successfully");
        return true;
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : "Failed to update question";
        notifications?.showError?.(errorMessage);
        return false;
      }
    },
    [notifications],
  );

  const deleteQuestion = useCallback(
    async (questionId: number) => {
      if (!confirm) return false;

      const confirmed = await confirm({
        title: "Delete Question",
        message: "Are you sure you want to delete this question? This action cannot be undone.",
        confirmText: "Delete",
        type: "danger",
      });

      if (!confirmed) return false;

      try {
        const response = await api(`/tests/questions/${questionId}`, {
          method: "DELETE",
          auth: true,
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || "Failed to delete question");
        }

        setQuestions((prev) => prev.filter((q) => q.id !== questionId));
        notifications?.showSuccess?.("Question deleted successfully");
        return true;
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : "Failed to delete question";
        notifications?.showError?.(errorMessage);
        return false;
      }
    },
    [notifications, confirm],
  );

  const bulkCreateQuestions = useCallback(
    async (questions: QuestionCreatePayload[]) => {
      if (questions.length === 0) return true;

      try {
        const payload = {
          questions: questions.map((question) => ({
            text: question.text,
            type: question.type,
            maxMarks: question.maxMarks || 1,
            ...(question.options && { options: question.options }),
            ...(typeof question.correctAnswer === "number" && {
              correctAnswer: question.correctAnswer,
            }),
            ...(question.image && { image: question.image }),
          })),
        };

        const response = await api(`/tests/${testId}/questions`, {
          method: "POST",
          auth: true,
          body: JSON.stringify(payload),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || "Failed to create questions");
        }

        const result = await response.json();
        const newQuestions = Array.isArray(result) ? result : [result];
        setQuestions((prev) => [...prev, ...newQuestions]);
        hasFetchedRef.current = null;
        notifications?.showSuccess?.(`${newQuestions.length} questions created successfully`);
        return true;
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : "Failed to create questions";
        notifications?.showError?.(errorMessage);
        return false;
      }
    },
    [testId, notifications],
  );

  useEffect(() => {
    hasFetchedRef.current = null;
    if (testId) {
      fetchQuestions();
    }
  }, [testId, fetchQuestions]);

  return {
    questions,
    loadingQuestions,
    fetchQuestions,
    refreshQuestions,
    createQuestion,
    updateQuestion,
    deleteQuestion,
    bulkCreateQuestions,
    setQuestions,

    handleAddQuestion: createQuestion,
    handleUpdateQuestion: updateQuestion,
    handleDeleteQuestion: deleteQuestion,
  };
};
