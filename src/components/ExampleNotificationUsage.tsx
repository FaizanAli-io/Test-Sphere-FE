// Example usage of notification system
"use client";

import { useNotifications } from "../contexts/NotificationContext";

export default function ExampleNotificationUsage() {
  const notifications = useNotifications();

  const handleSuccess = () => {
    notifications.showSuccess("This is a success message!");
  };

  const handleError = () => {
    notifications.showError("This is an error message!");
  };

  const handleWarning = () => {
    notifications.showWarning("This is a warning message!");
  };

  const handleInfo = () => {
    notifications.showInfo("This is an info message!");
  };

  return (
    <div className="p-4 space-y-4">
      <h2 className="text-xl font-bold">Notification Examples</h2>
      <div className="space-x-2">
        <button
          onClick={handleSuccess}
          className="px-4 py-2 bg-green-500 text-white rounded"
        >
          Show Success
        </button>
        <button
          onClick={handleError}
          className="px-4 py-2 bg-red-500 text-white rounded"
        >
          Show Error
        </button>
        <button
          onClick={handleWarning}
          className="px-4 py-2 bg-yellow-500 text-white rounded"
        >
          Show Warning
        </button>
        <button
          onClick={handleInfo}
          className="px-4 py-2 bg-blue-500 text-white rounded"
        >
          Show Info
        </button>
      </div>
    </div>
  );
}
