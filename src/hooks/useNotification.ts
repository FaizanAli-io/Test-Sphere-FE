import { useState, useCallback, useRef } from "react";

export interface Notification {
  id: string;
  type: "success" | "error" | "warning" | "info";
  message: string;
}

export const useNotification = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const timeoutsRef = useRef<Map<string, NodeJS.Timeout>>(new Map());

  const addNotification = useCallback((type: Notification["type"], message: string) => {
    const id = Date.now().toString();
    const newNotification: Notification = { id, type, message };

    setNotifications((prev) => [...prev, newNotification]);

    // Auto remove after 5 seconds with cleanup
    const timeoutId = setTimeout(() => {
      setNotifications((prev) => prev.filter((n) => n.id !== id));
      timeoutsRef.current.delete(id);
    }, 5000);

    timeoutsRef.current.set(id, timeoutId);

    return id;
  }, []);

  const removeNotification = useCallback((id: string) => {
    // Clear the timeout if manually removing notification
    const timeoutId = timeoutsRef.current.get(id);
    if (timeoutId) {
      clearTimeout(timeoutId);
      timeoutsRef.current.delete(id);
    }
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  }, []);

  const showSuccess = useCallback(
    (message: string) => {
      return addNotification("success", message);
    },
    [addNotification],
  );

  const showError = useCallback(
    (message: string) => {
      return addNotification("error", message);
    },
    [addNotification],
  );

  const showWarning = useCallback(
    (message: string) => {
      return addNotification("warning", message);
    },
    [addNotification],
  );

  const showInfo = useCallback(
    (message: string) => {
      return addNotification("info", message);
    },
    [addNotification],
  );

  // Cleanup all timeouts on unmount
  const clearAllTimeouts = useCallback(() => {
    timeoutsRef.current.forEach((timeoutId) => clearTimeout(timeoutId));
    timeoutsRef.current.clear();
  }, []);

  return {
    notifications,
    addNotification,
    removeNotification,
    showSuccess,
    showError,
    showWarning,
    showInfo,
    clearAllTimeouts,
  };
};
