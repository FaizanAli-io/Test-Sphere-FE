import { useState, useCallback, useEffect, useRef } from 'react';
import api from '../../../hooks/useApi';
import {
  Question,
  QuestionCreatePayload,
  QuestionUpdatePayload,
  NotificationFunctions,
  ConfirmationFunction,
} from '../types';

/**
 * Hook for managing questions CRUD operations
 */
export const useQuestions = (
  testId?: string,
  notifications?: NotificationFunctions,
  confirm?: ConfirmationFunction,
) => {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loadingQuestions, setLoadingQuestions] = useState(false);
  const hasFetchedRef = useRef<string | null>(null);
  const lastErrorRef = useRef<{ message: string; ts: number } | null>(null);
  const notifRef = useRef(notifications);
  const confirmRef = useRef(confirm);
  useEffect(() => {
    notifRef.current = notifications;
  }, [notifications]);
  useEffect(() => {
    confirmRef.current = confirm;
  }, [confirm]);

  const fetchQuestions = useCallback(async () => {
    if (!testId) return;

    if (hasFetchedRef.current === testId) return;

    setLoadingQuestions(true);

    try {
      const url = `/tests/${testId}/questions`;
      const { debugLogger } = await import('@/utils/logger');
      debugLogger('Fetching questions', { testId });
      const response = await api(url, {
        method: 'GET',
        auth: true,
      });

      if (!response.ok) {
        let errorData: { message?: string } = {};
        try {
          errorData = await response.json();
        } catch {
          errorData = { message: `HTTP ${response.status}` };
        }

        const errorMsg = errorData?.message || '';

        if (errorMsg === 'No questions found for this test.') {
          setQuestions([]);
          hasFetchedRef.current = testId;
          return;
        }

        throw new Error(errorMsg || 'Failed to fetch questions');
      }

      const questionsData = await response.json();
      setQuestions(Array.isArray(questionsData) ? questionsData : []);
      hasFetchedRef.current = testId;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch questions';

      // Suppress duplicate identical errors that occur in a short window (e.g., React Strict double-invoke)
      const now = Date.now();
      if (lastErrorRef.current?.message !== errorMessage || now - lastErrorRef.current.ts > 2000) {
        console.error('Error fetching questions:', errorMessage);
        lastErrorRef.current = { message: errorMessage, ts: now };
      }

      if (!errorMessage.includes('No questions found')) {
        // Also suppress duplicate notification spam
        if (
          lastErrorRef.current?.message !== errorMessage ||
          now - lastErrorRef.current.ts > 2000
        ) {
          notifRef.current?.showError?.(errorMessage);
        }
      }
      setQuestions([]);
      hasFetchedRef.current = testId;
    } finally {
      setLoadingQuestions(false);
    }
  }, [testId]);

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
              ...(typeof questionData.correctAnswer === 'number' && {
                correctAnswer: questionData.correctAnswer,
              }),
              ...(questionData.image && { image: questionData.image }),
              ...(typeof questionData.questionPoolId !== 'undefined' && {
                questionPoolId: questionData.questionPoolId,
              }),
            },
          ],
        };

        const response = await api(`/tests/${testId}/questions`, {
          method: 'POST',
          auth: true,
          body: JSON.stringify(payload),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || 'Failed to create question');
        }

        const result = await response.json();
        const newQuestions = Array.isArray(result) ? result : [result];
        setQuestions((prev) => [...prev, ...newQuestions]);
        hasFetchedRef.current = null;
        notifRef.current?.showSuccess?.('Question created successfully');
        return true;
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to create question';
        notifRef.current?.showError?.(errorMessage);
        return false;
      }
    },
    [testId],
  );

  const updateQuestion = useCallback(async (questionId: number, updates: QuestionUpdatePayload) => {
    try {
      const response = await api(`/tests/questions/${questionId}`, {
        method: 'PATCH',
        auth: true,
        body: JSON.stringify({
          ...updates,
          ...(typeof updates.questionPoolId !== 'undefined' && {
            questionPoolId: updates.questionPoolId,
          }),
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to update question');
      }

      const updatedQuestion = await response.json();
      setQuestions((prev) => prev.map((q) => (q.id === questionId ? updatedQuestion : q)));
      notifRef.current?.showSuccess?.('Question updated successfully');
      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update question';
      notifRef.current?.showError?.(errorMessage);
      return false;
    }
  }, []);

  const deleteQuestion = useCallback(async (questionId: number) => {
    if (!confirmRef.current) return false;

    const confirmed = await confirmRef.current({
      title: 'Delete Question',
      message: 'Are you sure you want to delete this question? This action cannot be undone.',
      confirmText: 'Delete',
      type: 'danger',
    });

    if (!confirmed) return false;

    try {
      const response = await api(`/tests/questions/${questionId}`, {
        method: 'DELETE',
        auth: true,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to delete question');
      }

      setQuestions((prev) => prev.filter((q) => q.id !== questionId));
      notifRef.current?.showSuccess?.('Question deleted successfully');
      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete question';
      notifRef.current?.showError?.(errorMessage);
      return false;
    }
  }, []);

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
            ...(typeof question.correctAnswer === 'number' && {
              correctAnswer: question.correctAnswer,
            }),
            ...(question.image && { image: question.image }),
          })),
        };

        const response = await api(`/tests/${testId}/questions`, {
          method: 'POST',
          auth: true,
          body: JSON.stringify(payload),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || 'Failed to create questions');
        }

        const result = await response.json();
        const newQuestions = Array.isArray(result) ? result : [result];
        setQuestions((prev) => [...prev, ...newQuestions]);
        hasFetchedRef.current = null;
        notifications?.showSuccess?.(`${newQuestions.length} questions created successfully`);
        return true;
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to create questions';
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
