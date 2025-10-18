import React from "react";

interface JoinClassModalProps {
  isOpen: boolean;
  onClose: () => void;
  classCode: string;
  setClassCode: (code: string) => void;
  onJoinClass: () => void;
  joining: boolean;
  error: string | null;
}

export default function JoinClassModal({
  isOpen,
  onClose,
  classCode,
  setClassCode,
  onJoinClass,
  joining,
  error,
}: JoinClassModalProps) {
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !joining) {
      onJoinClass();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md transform transition-all duration-300">
        <h2 className="text-2xl font-bold text-gray-900 mb-4 text-center">
          Join a Class
        </h2>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border-l-4 border-red-500 rounded">
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}

        <input
          type="text"
          value={classCode}
          onChange={(e) => setClassCode(e.target.value)}
          onKeyDown={handleKeyPress}
          placeholder="Enter class code"
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none mb-4 text-gray-700"
        />

        <div className="flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-600 hover:text-gray-800 font-medium"
          >
            Cancel
          </button>
          <button
            onClick={onJoinClass}
            disabled={joining}
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition disabled:opacity-50"
          >
            {joining ? "Joining..." : "Join"}
          </button>
        </div>
      </div>
    </div>
  );
}
