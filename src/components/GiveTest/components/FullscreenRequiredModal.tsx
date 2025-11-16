import React from "react";

interface FullscreenRequiredModalProps {
  isOpen: boolean;
  onTryAgain: () => void;
  onCancel: () => void;
}

export const FullscreenRequiredModal: React.FC<FullscreenRequiredModalProps> = ({
  isOpen,
  onTryAgain,
  onCancel,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[9999]">
      <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md mx-4">
        <div className="text-center">
          <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-4xl">🖥️</span>
          </div>

          <h2 className="text-2xl font-bold text-gray-900 mb-4">Fullscreen Mode Required</h2>

          <p className="text-gray-600 mb-6 text-lg leading-relaxed">
            To start the test, you must allow fullscreen mode. This ensures a secure testing
            environment and prevents distractions.
          </p>

          <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-4 mb-6">
            <h3 className="font-semibold text-blue-800 mb-2">Important:</h3>
            <ul className="text-blue-700 text-sm space-y-1 text-left">
              <li>• Exiting fullscreen during the test will be recorded as a violation</li>
              <li>• 2 violations will result in automatic test submission</li>
              <li>• Your teacher will be notified of any violations</li>
            </ul>
          </div>

          <div className="flex gap-4">
            <button
              onClick={onCancel}
              className="flex-1 px-6 py-3 bg-gray-100 text-gray-700 font-bold rounded-xl hover:bg-gray-200 transition-all"
            >
              Cancel Test
            </button>
            <button
              onClick={onTryAgain}
              className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all shadow-lg hover:shadow-xl"
            >
              Enter Fullscreen
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
