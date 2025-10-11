import { useState, useCallback } from "react";

export interface Notification {
  id: string;
  type: "success" | "error" | "warning" | "info";
  message: string;
}

export const useNotification = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);

  const addNotification = useCallback(
    (type: Notification["type"], message: string) => {
      const id = Date.now().toString();
      const newNotification: Notification = { id, type, message };

      setNotifications((prev) => [...prev, newNotification]);

      // Auto remove after 5 seconds
      setTimeout(() => {
        setNotifications((prev) => prev.filter((n) => n.id !== id));
      }, 5000);

      return id;
    },
    []
  );

  const removeNotification = useCallback((id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  }, []);

  const showSuccess = useCallback(
    (message: string) => {
      return addNotification("success", message);
    },
    [addNotification]
  );

  const showError = useCallback(
    (message: string) => {
      return addNotification("error", message);
    },
    [addNotification]
  );

  const showWarning = useCallback(
    (message: string) => {
      return addNotification("warning", message);
    },
    [addNotification]
  );

  const showInfo = useCallback(
    (message: string) => {
      return addNotification("info", message);
    },
    [addNotification]
  );

  return {
    notifications,
    addNotification,
    removeNotification,
    showSuccess,
    showError,
    showWarning,
    showInfo
  };
};
