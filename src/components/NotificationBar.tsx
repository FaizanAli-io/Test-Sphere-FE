import React from "react";
import { Notification } from "../hooks/useNotification";

interface NotificationBarProps {
  notifications: Notification[];
  onRemove: (id: string) => void;
}

export default function NotificationBar({ notifications, onRemove }: NotificationBarProps) {
  if (notifications.length === 0) return null;

  const getNotificationStyles = (type: Notification["type"]) => {
    switch (type) {
      case "success":
        return "bg-green-50 border-green-200 text-green-800";
      case "error":
        return "bg-red-50 border-red-200 text-red-800";
      case "warning":
        return "bg-yellow-50 border-yellow-200 text-yellow-800";
      case "info":
        return "bg-blue-50 border-blue-200 text-blue-800";
      default:
        return "bg-gray-50 border-gray-200 text-gray-800";
    }
  };

  const getIcon = (type: Notification["type"]) => {
    switch (type) {
      case "success":
        return "✅";
      case "error":
        return "❌";
      case "warning":
        return "⚠️";
      case "info":
        return "ℹ️";
      default:
        return "📢";
    }
  };

  return (
    <div className="fixed top-0 left-0 right-0 z-50 p-4">
      <div className="max-w-4xl mx-auto space-y-2">
        {notifications
          .filter(
            (notification) =>
              notification.type !== "error" || !notification.message.includes("Failed to fetch"),
          )
          .map((notification) => (
            <div
              key={notification.id}
              className={`
              flex items-center justify-between 
              px-4 py-3 rounded-lg border-2 shadow-lg 
              animate-slide-down
              ${getNotificationStyles(notification.type)}
            `}
            >
              <div className="flex items-center gap-3">
                <span className="text-lg">{getIcon(notification.type)}</span>
                <span className="font-medium">{notification.message}</span>
              </div>
              <button
                onClick={() => onRemove(notification.id)}
                className="ml-4 text-current opacity-70 hover:opacity-100 transition-opacity"
              >
                <span className="text-lg">✕</span>
              </button>
            </div>
          ))}
      </div>
    </div>
  );
}
