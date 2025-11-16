import React from "react";

type Props = {
  gradingScores: Record<string, number>;
  handleBulkUpdateScores: () => Promise<void> | void;
  loadingBulkUpdate: boolean;
};

export default function GradingActions({
  gradingScores,
  handleBulkUpdateScores,
  loadingBulkUpdate,
}: Props) {
  const pending = Object.keys(gradingScores).length;
  if (pending === 0) return null;

  return (
    <div className="bg-gradient-to-r from-green-50 to-blue-50 rounded-2xl p-6 border border-green-200">
      <div className="flex items-center justify-between">
        <div>
          <h4 className="text-lg font-bold text-gray-900 mb-2">📝 Update Scores</h4>
          <p className="text-gray-700">You have {pending} pending score update(s).</p>
        </div>
        <button
          onClick={handleBulkUpdateScores}
          disabled={loadingBulkUpdate}
          className="px-6 py-3 bg-green-500 text-white font-bold rounded-xl hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
        >
          {loadingBulkUpdate ? (
            <div className="flex items-center space-x-2">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              <span>Updating...</span>
            </div>
          ) : (
            "Update Scores"
          )}
        </button>
      </div>
    </div>
  );
}
