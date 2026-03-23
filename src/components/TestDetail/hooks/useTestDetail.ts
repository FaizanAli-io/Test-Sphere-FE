import { useState, useCallback, useEffect, useRef } from 'react';
import api from '../../../hooks/useApi';
import { Test, TestConfig, NotificationFunctions, ConfirmationFunction } from '../types';

export const useTestDetail = (
  testId?: string,
  notifications?: NotificationFunctions,
  confirm?: ConfirmationFunction,
) => {
  const [testData, setTestData] = useState<Test | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const notifRef = useRef(notifications);
  const confirmRef = useRef(confirm);
  useEffect(() => {
    notifRef.current = notifications;
  }, [notifications]);
  useEffect(() => {
    confirmRef.current = confirm;
  }, [confirm]);

  const fetchTestDetails = useCallback(async () => {
    if (!testId) return;
    setLoading(true);
    setError(null);

    try {
      const testRes = await api(`/tests/${testId}`, {
        method: 'GET',
        auth: true,
      });

      if (!testRes.ok) {
        const errorData = await testRes.json();
        throw new Error(errorData.message || 'Failed to fetch test details');
      }

      const testData = await testRes.json();
      setTestData(testData);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch test details';
      setError(errorMessage);
      notifRef.current?.showError?.(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [testId]);

  const updateTest = useCallback(
    async (updates: Partial<Test>) => {
      if (!testId) return false;

      try {
        const response = await api(`/tests/${testId}`, {
          method: 'PATCH',
          auth: true,
          body: JSON.stringify(updates),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || 'Failed to update test');
        }

        const updatedTest = await response.json();
        setTestData(updatedTest);
        notifRef.current?.showSuccess?.('Test updated successfully');
        return true;
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to update test';
        notifRef.current?.showError?.(errorMessage);
        return false;
      }
    },
    [testId],
  );

  const updateConfig = useCallback(
    async (config: TestConfig) => {
      if (!testId) return false;

      try {
        const response = await api(`/tests/${testId}/config`, {
          method: 'PATCH',
          auth: true,
          body: JSON.stringify(config),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || 'Failed to update test configuration');
        }

        const updatedTest = await response.json();
        setTestData(updatedTest);
        notifRef.current?.showSuccess?.('Test configuration updated successfully');
        return true;
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : 'Failed to update test configuration';
        notifRef.current?.showError?.(errorMessage);
        return false;
      }
    },
    [testId],
  );

  const deleteTest = useCallback(async () => {
    if (!testId || !confirmRef.current) return false;

    const confirmed = await confirmRef.current({
      title: 'Delete Test',
      message: 'Are you sure you want to delete this test? This action cannot be undone.',
      confirmText: 'Delete',
      type: 'danger',
    });

    if (!confirmed) return false;

    try {
      const response = await api(`/tests/${testId}`, {
        method: 'DELETE',
        auth: true,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to delete test');
      }

      notifRef.current?.showSuccess?.('Test deleted successfully');
      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete test';
      notifRef.current?.showError?.(errorMessage);
      return false;
    }
  }, [testId]);

  // Auto-fetch test details when testId changes
  useEffect(() => {
    if (testId) {
      fetchTestDetails();
    }
  }, [testId, fetchTestDetails]);

  return {
    testData,
    loading,
    error,
    fetchTestDetails,
    updateTest,
    updateConfig,
    deleteTest,
    setTestData,
    // Backward compatibility aliases
    handleUpdateTest: updateTest,
    handleUpdateConfig: updateConfig,
    handleDeleteTest: deleteTest,
  };
};
