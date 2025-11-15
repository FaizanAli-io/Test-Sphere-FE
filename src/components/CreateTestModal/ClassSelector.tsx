"use client";
import React from "react";

interface ClassSelectorProps {
  classesLoading: boolean;
  classesError: string | null;
  classes: Array<{ id: string | number; code: string; name: string }>;
  classId: number;
  prefilledClassId?: number;
  onRetry: () => void;
  onSelect: (id: number) => void;
}

export const ClassSelector: React.FC<ClassSelectorProps> = ({
  classesLoading,
  classesError,
  classes,
  classId,
  prefilledClassId,
  onRetry,
  onSelect
}) => {
  return (
    <div>
      <label className="block text-sm font-bold text-gray-700 mb-2 flex items-center gap-2">
        <span className="text-lg">🏫</span>
        Select Class *
      </label>
      {classesLoading ? (
        <div className="w-full px-4 py-3.5 border-2 border-gray-300 rounded-xl bg-gray-50 flex items-center gap-3">
          <div className="animate-spin rounded-full h-5 w-5 border-2 border-purple-500 border-t-transparent"></div>
          <span className="text-gray-600 font-medium">Loading classes...</span>
        </div>
      ) : classesError ? (
        <div className="space-y-3">
          <div className="w-full px-4 py-3.5 border-2 border-red-300 rounded-xl bg-red-50 text-red-700 font-medium flex items-center gap-2">
            <span>⚠️</span>
            {classesError}
          </div>
          <button
            type="button"
            onClick={onRetry}
            className="px-4 py-2 bg-purple-100 text-purple-700 font-medium rounded-lg hover:bg-purple-200 transition-all flex items-center gap-2"
          >
            <span>🔄</span>
            Retry
          </button>
        </div>
      ) : (
        <div>
          <div className="relative">
            <select
              value={classId || ""}
              onChange={(e) => onSelect(Number(e.target.value))}
              className="w-full px-4 py-3.5 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all text-gray-900 bg-white font-medium appearance-none pr-12 cursor-pointer disabled:cursor-not-allowed disabled:bg-gray-50 disabled:text-gray-500"
              disabled={!!prefilledClassId}
            >
              <option value="">Choose a class...</option>
              {classes.map((cls) => (
                <option key={cls.id} value={Number(cls.id)}>
                  {cls.name} ({cls.code})
                </option>
              ))}
            </select>
            <div className="absolute inset-y-0 right-0 flex items-center pr-4 pointer-events-none">
              <svg
                className="w-5 h-5 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 9l-7 7-7-7"
                />
              </svg>
            </div>
          </div>
          {prefilledClassId && (
            <p className="mt-2 text-sm text-green-600 font-medium flex items-center gap-2">
              <span>✓</span>
              Using prefilled class:{" "}
              {classes.find((c) => Number(c.id) === prefilledClassId)?.name ||
                `ID: ${prefilledClassId}`}
            </p>
          )}
          {classes.length === 0 && !classesLoading && (
            <p className="mt-2 text-sm text-amber-600 font-medium flex items-center gap-2">
              <span>📝</span>
              No classes found. Create a class first to add tests.
            </p>
          )}
        </div>
      )}
    </div>
  );
};

export default ClassSelector;
