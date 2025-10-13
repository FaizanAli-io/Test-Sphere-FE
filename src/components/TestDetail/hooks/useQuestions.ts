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
  testId: string,
  notifications?: NotificationFunctions,
  confirm?: ConfirmationFunction
) => {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loadingQuestions, setLoadingQuestions] = useState(false);
  const hasFetchedRef = useRef<string | null>(null);

  const fetchQuestions = useCallback(async () => {
    if (!testId) return;

    // Prevent multiple fetches for the same testId
    if (hasFetchedRef.current === testId) return;

    setLoadingQuestions(true);

    try {
      const response = await api(`/tests/${testId}/questions`, {
        method: "GET",
        auth: true,
      });

      if (!response.ok) {
        const errorData = await response.json();
        // Handle the specific case where no questions exist - this is not an error to show to user
        if (errorData.message === "No questions found for this test.") {
          setQuestions([]);
          hasFetchedRef.current = testId;
          return;
        }
        throw new Error(errorData.message || "Failed to fetch questions");
      }

      const questionsData = await response.json();
      setQuestions(Array.isArray(questionsData) ? questionsData : []);
      hasFetchedRef.current = testId;
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to fetch questions";
      console.error("Error fetching questions:", errorMessage);
      // Only show error notification if it's not the "no questions found" case
      if (!errorMessage.includes("No questions found")) {
        notifications?.showError?.(errorMessage);
      }
      setQuestions([]);
      hasFetchedRef.current = testId;
    } finally {
      setLoadingQuestions(false);
    }
  }, [testId]);

  const createQuestion = useCallback(
    async (questionData: QuestionCreatePayload) => {
      try {
        // Format single question as per API documentation
        const payload = {
          questions: [
            {
              testId: Number(testId),
              text: questionData.text,
              type: questionData.type,
              maxMarks: questionData.maxMarks || 1,
              ...(questionData.options && { options: questionData.options }),
              ...(typeof questionData.correctAnswer === "number" && {
                correctAnswer: questionData.correctAnswer,
              }),
              ...(questionData.image && { image: questionData.image }),
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
        hasFetchedRef.current = null; // Reset to allow refetch
        notifications?.showSuccess?.("Question created successfully");
        return true;
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Failed to create question";
        notifications?.showError?.(errorMessage);
        return false;
      }
    },
    [testId, notifications]
  );

  const updateQuestion = useCallback(
    async (questionId: number, updates: QuestionUpdatePayload) => {
      try {
        const response = await api(`/tests/questions/${questionId}`, {
          method: "PATCH",
          auth: true,
          body: JSON.stringify(updates),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || "Failed to update question");
        }

        const updatedQuestion = await response.json();
        setQuestions((prev) =>
          prev.map((q) => (q.id === questionId ? updatedQuestion : q))
        );
        notifications?.showSuccess?.("Question updated successfully");
        return true;
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Failed to update question";
        notifications?.showError?.(errorMessage);
        return false;
      }
    },
    [notifications]
  );

  const deleteQuestion = useCallback(
    async (questionId: number) => {
      if (!confirm) return false;

      const confirmed = await confirm({
        title: "Delete Question",
        message:
          "Are you sure you want to delete this question? This action cannot be undone.",
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
        const errorMessage =
          err instanceof Error ? err.message : "Failed to delete question";
        notifications?.showError?.(errorMessage);
        return false;
      }
    },
    [notifications, confirm]
  );

  const bulkCreateQuestions = useCallback(
    async (questions: QuestionCreatePayload[]) => {
      if (questions.length === 0) return true;

      try {
        // Format bulk questions as per API documentation
        const payload = {
          questions: questions.map((question) => ({
            testId: Number(testId),
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
        hasFetchedRef.current = null; // Reset to allow refetch
        notifications?.showSuccess?.(
          `${newQuestions.length} questions created successfully`
        );
        return true;
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Failed to create questions";
        notifications?.showError?.(errorMessage);
        return false;
      }
    },
    [testId, notifications]
  );

  // Reset ref and fetch questions when testId changes
  useEffect(() => {
    hasFetchedRef.current = null; // Reset the ref for new testId
    if (testId) {
      fetchQuestions();
    }
  }, [testId, fetchQuestions]);

  return {
    questions,
    loadingQuestions,
    fetchQuestions,
    createQuestion,
    updateQuestion,
    deleteQuestion,
    bulkCreateQuestions,
    setQuestions,
    // Backward compatibility aliases
    handleAddQuestion: createQuestion,
    handleUpdateQuestion: updateQuestion,
    handleDeleteQuestion: deleteQuestion,
  };
};
