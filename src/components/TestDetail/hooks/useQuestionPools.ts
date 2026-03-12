import { useCallback, useEffect, useRef, useState } from "react";
import api from "../../../hooks/useApi";
import { ConfirmationFunction, NotificationFunctions, QuestionPool } from "../types";

export const useQuestionPools = (
  testId?: string,
  notifications?: NotificationFunctions,
  confirm?: ConfirmationFunction,
) => {
  const [pools, setPools] = useState<QuestionPool[]>([]);
  const [loadingPools, setLoadingPools] = useState(false);

  // Keep a ref so callbacks never become stale without creating new function refs
  const notifRef = useRef(notifications);
  const confirmRef = useRef(confirm);
  useEffect(() => {
    notifRef.current = notifications;
  }, [notifications]);
  useEffect(() => {
    confirmRef.current = confirm;
  }, [confirm]);

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
      notifRef.current?.showError?.(msg);
      setPools([]);
    } finally {
      setLoadingPools(false);
    }
  }, [testId]);

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
        notifRef.current?.showSuccess?.("Question pool created successfully");
        return true;
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Failed to create pool";
        notifRef.current?.showError?.(msg);
        return false;
      }
    },
    [testId],
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
        notifRef.current?.showSuccess?.("Question pool updated successfully");
        return true;
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Failed to update pool";
        notifRef.current?.showError?.(msg);
        return false;
      }
    },
    [],
  );

  const deletePool = useCallback(async (id: number) => {
    if (!confirmRef.current) return false;
    const confirmed = await confirmRef.current({
      title: "Delete Pool",
      message:
        "Are you sure you want to delete this pool? This will unassign any questions in the pool.",
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
      notifRef.current?.showSuccess?.("Question pool deleted successfully");
      return true;
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to delete pool";
      notifRef.current?.showError?.(msg);
      return false;
    }
  }, []);

  const addQuestionsToPool = useCallback(async (poolId: number, questionIds: number[]) => {
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
      notifRef.current?.showSuccess?.(`${questionIds.length} question(s) added to pool`);
      return true;
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to add questions to pool";
      notifRef.current?.showError?.(msg);
      return false;
    }
  }, []);

  const removeQuestionsFromPool = useCallback(async (poolId: number, questionIds: number[]) => {
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
      notifRef.current?.showSuccess?.(`${questionIds.length} question(s) removed from pool`);
      return true;
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to remove questions from pool";
      notifRef.current?.showError?.(msg);
      return false;
    }
  }, []);

  const togglePoolActive = useCallback(async (pool: QuestionPool) => {
    const newActive = pool.active !== false ? false : true;
    // Optimistic update — flip immediately so UI feels instant
    setPools((prev) => prev.map((p) => (p.id === pool.id ? { ...p, active: newActive } : p)));
    try {
      const res = await api(`/tests/pools/${pool.id}`, {
        method: "PATCH",
        auth: true,
        body: JSON.stringify({ active: newActive }),
      });
      if (!res.ok) {
        const err = await res.json();
        // Revert on failure
        setPools((prev) => prev.map((p) => (p.id === pool.id ? { ...p, active: !newActive } : p)));
        throw new Error(err.message || "Failed to toggle pool active state");
      }
      const updated = await res.json();
      setPools((prev) => prev.map((p) => (p.id === pool.id ? updated : p)));
      notifRef.current?.showSuccess?.(newActive ? "Pool activated" : "Pool deactivated");
      return true;
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to toggle pool";
      // Revert if catch was triggered before the revert above
      setPools((prev) =>
        prev.map((p) =>
          p.id === pool.id && p.active === newActive ? { ...p, active: !newActive } : p,
        ),
      );
      notifRef.current?.showError?.(msg);
      return false;
    }
  }, []);

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
    togglePoolActive,
    addQuestionsToPool,
    removeQuestionsFromPool,
    setPools,
  };
};
