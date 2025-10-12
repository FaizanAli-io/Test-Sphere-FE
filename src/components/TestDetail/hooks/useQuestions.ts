import { useState, useCallback, useEffect } from "react";
import api from "../../../hooks/useApi";
import {
  Question,
  QuestionCreatePayload,
  QuestionUpdatePayload,
  NotificationFunctions,
  ConfirmationFunction
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

  const fetchQuestions = useCallback(async () => {
    if (!testId) return;
    setLoadingQuestions(true);

    try {
      const response = await api(`/tests/${testId}/questions`, {
        method: "GET",
        auth: true
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to fetch questions");
      }

      const questionsData = await response.json();
      setQuestions(Array.isArray(questionsData) ? questionsData : []);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to fetch questions";
      notifications?.showError(errorMessage);
      setQuestions([]);
    } finally {
      setLoadingQuestions(false);
    }
  }, [testId, notifications]);

  const createQuestion = useCallback(
    async (questionData: QuestionCreatePayload) => {
      try {
        const response = await api(`/tests/${testId}/questions`, {
          method: "POST",
          auth: true,
          body: JSON.stringify(questionData)
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || "Failed to create question");
        }

        const newQuestion = await response.json();
        setQuestions((prev) => [...prev, newQuestion]);
        notifications?.showSuccess("Question created successfully");
        return true;
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Failed to create question";
        notifications?.showError(errorMessage);
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
          body: JSON.stringify(updates)
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || "Failed to update question");
        }

        const updatedQuestion = await response.json();
        setQuestions((prev) =>
          prev.map((q) => (q.id === questionId ? updatedQuestion : q))
        );
        notifications?.showSuccess("Question updated successfully");
        return true;
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Failed to update question";
        notifications?.showError(errorMessage);
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
        type: "danger"
      });

      if (!confirmed) return false;

      try {
        const response = await api(`/tests/questions/${questionId}`, {
          method: "DELETE",
          auth: true
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || "Failed to delete question");
        }

        setQuestions((prev) => prev.filter((q) => q.id !== questionId));
        notifications?.showSuccess("Question deleted successfully");
        return true;
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Failed to delete question";
        notifications?.showError(errorMessage);
        return false;
      }
    },
    [notifications, confirm]
  );

  const bulkCreateQuestions = useCallback(
    async (questions: QuestionCreatePayload[]) => {
      if (questions.length === 0) return true;

      try {
        const promises = questions.map((question) =>
          api(`/tests/${testId}/questions`, {
            method: "POST",
            auth: true,
            body: JSON.stringify(question)
          })
        );

        const responses = await Promise.all(promises);
        const failedResponses = responses.filter((r) => !r.ok);

        if (failedResponses.length > 0) {
          throw new Error(
            `${failedResponses.length} questions failed to create`
          );
        }

        const newQuestions = await Promise.all(responses.map((r) => r.json()));
        setQuestions((prev) => [...prev, ...newQuestions]);
        notifications?.showSuccess(
          `${newQuestions.length} questions created successfully`
        );
        return true;
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Failed to create questions";
        notifications?.showError(errorMessage);
        return false;
      }
    },
    [testId, notifications]
  );

  // Auto-fetch questions when testId changes
  useEffect(() => {
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
    handleDeleteQuestion: deleteQuestion
  };
};
