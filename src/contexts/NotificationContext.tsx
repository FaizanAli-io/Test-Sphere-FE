'use client';

import React, { createContext, useContext, useEffect, useMemo } from 'react';
import { useNotification } from '../hooks/useNotification';
import NotificationBar from '../components/NotificationBar';

interface NotificationContextType {
  showSuccess: (message: string) => void;
  showError: (message: string) => void;
  showWarning: (message: string) => void;
  showInfo: (message: string) => void;
}

const NotificationContext = createContext<NotificationContextType | null>(null);

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};

interface NotificationProviderProps {
  children: React.ReactNode;
}

export const NotificationProvider: React.FC<NotificationProviderProps> = ({ children }) => {
  const {
    notifications,
    removeNotification,
    showSuccess,
    showError,
    showWarning,
    showInfo,
    clearAllTimeouts,
  } = useNotification();

  // Cleanup timeouts on unmount
  useEffect(() => {
    return () => {
      clearAllTimeouts();
    };
  }, [clearAllTimeouts]);

  // Memoize so consumers don't re-render just because the notifications array changed
  const contextValue = useMemo(
    () => ({ showSuccess, showError, showWarning, showInfo }),
    [showSuccess, showError, showWarning, showInfo],
  );

  return (
    <NotificationContext.Provider value={contextValue}>
      {children}
      <NotificationBar notifications={notifications} onRemove={removeNotification} />
    </NotificationContext.Provider>
  );
};
