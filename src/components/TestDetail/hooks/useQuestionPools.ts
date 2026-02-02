import { useCallback, useEffect, useState } from "react";
import api from "../../../hooks/useApi";
import { ConfirmationFunction, NotificationFunctions, QuestionPool } from "../types";

export const useQuestionPools = (
  testId?: string,
  notifications?: NotificationFunctions,
  confirm?: ConfirmationFunction,
) => {
  const [pools, setPools] = useState<QuestionPool[]>([]);
  const [loadingPools, setLoadingPools] = useState(false);

  const fetchPools = useCallback(async () => {
    if (!testId) return;
    setLoadingPools(true);

    try {
      const res = await api(`/tests/${testId}/pools`, { method: "GET", auth: true });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || "Failed to fetch pools");
      }
      const data = await res.json();
      setPools(Array.isArray(data) ? data : []);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to fetch pools";
      notifications?.showError?.(msg);
      setPools([]);
    } finally {
      setLoadingPools(false);
    }
  }, [testId, notifications]);

  const createPool = useCallback(
    async (payload: { title: string; config: Record<string, number> }) => {
      if (!testId) return false;
      try {
        const res = await api(`/tests/${testId}/pools`, {
          method: "POST",
          auth: true,
          body: JSON.stringify(payload),
        });
        if (!res.ok) {
          const err = await res.json();
          throw new Error(err.message || "Failed to create pool");
        }
        const created = await res.json();
        setPools((p) => [...p, created]);
        notifications?.showSuccess?.("Question pool created successfully");
        return true;
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Failed to create pool";
        notifications?.showError?.(msg);
        return false;
      }
    },
    [testId, notifications],
  );

  const updatePool = useCallback(
    async (id: number, updates: Partial<{ title: string; config: Record<string, number> }>) => {
      try {
        const res = await api(`/tests/pools/${id}`, {
          method: "PATCH",
          auth: true,
          body: JSON.stringify(updates),
        });
        if (!res.ok) {
          const err = await res.json();
          throw new Error(err.message || "Failed to update pool");
        }
        const updated = await res.json();
        setPools((prev) => prev.map((p) => (p.id === id ? updated : p)));
        notifications?.showSuccess?.("Question pool updated successfully");
        return true;
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Failed to update pool";
        notifications?.showError?.(msg);
        return false;
      }
    },
    [notifications],
  );

  const deletePool = useCallback(
    async (id: number) => {
      if (!confirm) return false;
      const confirmed = await confirm({
        title: "Delete Pool",
        message: "Are you sure you want to delete this pool? This will unassign any questions in the pool.",
        confirmText: "Delete",
        type: "danger",
      });
      if (!confirmed) return false;

      try {
        const res = await api(`/tests/pools/${id}`, { method: "DELETE", auth: true });
        if (!res.ok) {
          const err = await res.json();
          throw new Error(err.message || "Failed to delete pool");
        }
        setPools((prev) => prev.filter((p) => p.id !== id));
        notifications?.showSuccess?.("Question pool deleted successfully");
        return true;
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Failed to delete pool";
        notifications?.showError?.(msg);
        return false;
      }
    },
    [confirm, notifications],
  );

  const addQuestionsToPool = useCallback(
    async (poolId: number, questionIds: number[]) => {
      if (questionIds.length === 0) return false;
      try {
        const res = await api(`/tests/pools/${poolId}/questions`, {
          method: "POST",
          auth: true,
          body: JSON.stringify({ questionIds }),
        });
        if (!res.ok) {
          const err = await res.json();
          throw new Error(err.message || "Failed to add questions to pool");
        }
        notifications?.showSuccess?.(`${questionIds.length} question(s) added to pool`);
        return true;
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Failed to add questions to pool";
        notifications?.showError?.(msg);
        return false;
      }
    },
    [notifications],
  );

  const removeQuestionsFromPool = useCallback(
    async (poolId: number, questionIds: number[]) => {
      if (questionIds.length === 0) return false;
      try {
        const res = await api(`/tests/pools/${poolId}/questions`, {
          method: "DELETE",
          auth: true,
          body: JSON.stringify({ questionIds }),
        });
        if (!res.ok) {
          const err = await res.json();
          throw new Error(err.message || "Failed to remove questions from pool");
        }
        notifications?.showSuccess?.(`${questionIds.length} question(s) removed from pool`);
        return true;
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Failed to remove questions from pool";
        notifications?.showError?.(msg);
        return false;
      }
    },
    [notifications],
  );

  useEffect(() => {
    if (testId) fetchPools();
  }, [testId, fetchPools]);

  return {
    pools,
    loadingPools,
    fetchPools,
    createPool,
    updatePool,
    deletePool,
    addQuestionsToPool,
    removeQuestionsFromPool,
    setPools,
  };
};
