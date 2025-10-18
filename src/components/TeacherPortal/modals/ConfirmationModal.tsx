import React from "react";

interface ConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  loading?: boolean;
  type: "delete" | "kick";
  data?: {
    studentName?: string;
  };
}

export default function ConfirmationModal({
  isOpen,
  onClose,
  onConfirm,
  loading = false,
  type,
  data,
}: ConfirmationModalProps) {
  if (!isOpen) return null;

  const config = {
    delete: {
      icon: "⚠️",
      title: "Delete Class?",
      message:
        "Are you sure you want to delete this class? All associated data will be permanently removed. This action cannot be undone.",
      confirmText: "Delete",
      gradient: "from-red-600 to-rose-600",
      hoverGradient: "hover:from-red-700 hover:to-rose-700",
    },
    kick: {
      icon: "👤",
      title: "Remove Student?",
      message: `Are you sure you want to remove ${
        data?.studentName || "this student"
      } from this class? They will lose access to all class materials and tests.`,
      confirmText: "Remove",
      gradient: "from-red-600 to-rose-600",
      hoverGradient: "hover:from-red-700 hover:to-rose-700",
    },
  };

  const modalConfig = config[type];

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-fadeIn">
      <div className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl transform animate-slideUp">
        <div className="text-center">
          <div className="w-20 h-20 bg-gradient-to-br from-red-100 to-rose-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <span className="text-4xl">{modalConfig.icon}</span>
          </div>
          <h3 className="text-3xl font-bold text-gray-900 mb-4">
            {modalConfig.title}
          </h3>

          {type === "kick" && data?.studentName && (
            <>
              <p className="text-gray-600 mb-2 text-lg">
                Are you sure you want to remove
              </p>
              <p className="text-indigo-600 font-bold text-xl mb-6">
                {data.studentName}
              </p>
              <p className="text-gray-500 text-sm">
                from this class? They will lose access to all class materials
                and tests.
              </p>
            </>
          )}

          {type === "delete" && (
            <p className="text-gray-600 mb-8 text-lg leading-relaxed">
              {modalConfig.message}
            </p>
          )}
        </div>
        <div className="flex gap-3 mt-8">
          <button
            onClick={onClose}
            className="flex-1 px-6 py-4 bg-gray-100 text-gray-700 font-bold rounded-xl hover:bg-gray-200 transition-all text-lg"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className={`flex-1 px-6 py-4 bg-gradient-to-r ${modalConfig.gradient} text-white font-bold rounded-xl ${modalConfig.hoverGradient} transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl text-lg`}
          >
            {loading ? "Processing..." : modalConfig.confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}
