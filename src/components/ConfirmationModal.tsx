import React from "react";

interface ConfirmationModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void;
  onCancel: () => void;
  type?: "danger" | "warning" | "info";
}

export default function ConfirmationModal({
  isOpen,
  title,
  message,
  confirmText = "Confirm",
  cancelText = "Cancel",
  onConfirm,
  onCancel,
  type = "warning"
}: ConfirmationModalProps) {
  if (!isOpen) return null;

  const getTypeStyles = () => {
    switch (type) {
      case "danger":
        return {
          header: "bg-gradient-to-r from-red-500 to-red-600",
          confirmButton: "bg-red-500 hover:bg-red-600",
          icon: "⚠️"
        };
      case "warning":
        return {
          header: "bg-gradient-to-r from-yellow-500 to-orange-500",
          confirmButton: "bg-yellow-500 hover:bg-yellow-600",
          icon: "⚠️"
        };
      case "info":
        return {
          header: "bg-gradient-to-r from-blue-500 to-indigo-500",
          confirmButton: "bg-blue-500 hover:bg-blue-600",
          icon: "ℹ️"
        };
      default:
        return {
          header: "bg-gradient-to-r from-gray-500 to-gray-600",
          confirmButton: "bg-gray-500 hover:bg-gray-600",
          icon: "❓"
        };
    }
  };

  const styles = getTypeStyles();

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl overflow-hidden">
        {/* Header */}
        <div className={`px-6 py-4 ${styles.header}`}>
          <h3 className="text-xl font-bold text-white flex items-center gap-3">
            <span className="text-2xl">{styles.icon}</span>
            {title}
          </h3>
        </div>

        {/* Content */}
        <div className="p-6">
          <p className="text-gray-700 text-lg leading-relaxed mb-6">
            {message}
          </p>

          {/* Buttons */}
          <div className="flex gap-3">
            <button
              onClick={onCancel}
              className="flex-1 px-4 py-3 bg-gray-100 text-gray-700 font-bold rounded-xl hover:bg-gray-200 transition-all text-lg"
            >
              {cancelText}
            </button>
            <button
              onClick={onConfirm}
              className={`flex-1 px-4 py-3 text-white font-bold rounded-xl transition-all text-lg shadow-lg hover:shadow-xl ${styles.confirmButton}`}
            >
              {confirmText}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
