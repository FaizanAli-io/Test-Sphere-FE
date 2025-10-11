import React from "react";

interface TestHeaderProps {
  testTitle: string;
  answeredCount: number;
  totalQuestions: number;
  timeRemaining: number;
  formatTime: (seconds: number) => string;
  progress: number;
  onSubmitTest: () => void;
  submitting: boolean;
}

export const TestHeader: React.FC<TestHeaderProps> = ({
  testTitle,
  answeredCount,
  totalQuestions,
  timeRemaining,
  formatTime,
  progress,
  onSubmitTest,
  submitting
}) => {
  return (
    <div className="sticky top-0 z-40 bg-white shadow-lg border-b-2 border-gray-200">
      <div className="max-w-7xl mx-auto px-4 py-4">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{testTitle}</h1>
            <p className="text-sm text-gray-600 mt-1">
              Question {answeredCount} of {totalQuestions} answered
            </p>
          </div>

          <div className="flex items-center gap-4">
            <div className="bg-gradient-to-r from-orange-100 to-red-100 border-2 border-orange-300 rounded-xl px-6 py-3">
              <p className="text-xs font-bold text-gray-600 mb-1">
                Time Remaining
              </p>
              <p
                className={`text-2xl font-bold ${
                  timeRemaining < 300 ? "text-red-600" : "text-gray-900"
                }`}
              >
                {formatTime(timeRemaining)}
              </p>
            </div>

            <button
              onClick={onSubmitTest}
              disabled={submitting}
              className="px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white font-bold rounded-xl hover:from-green-600 hover:to-emerald-700 transition-all shadow-lg hover:shadow-xl disabled:opacity-50"
            >
              Submit Test
            </button>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="mt-4">
          <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-indigo-600 to-blue-600 transition-all duration-300 rounded-full"
              style={{ width: `${progress}%` }}
            ></div>
          </div>
        </div>
      </div>
    </div>
  );
};
