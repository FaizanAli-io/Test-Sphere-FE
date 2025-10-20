import React from "react";

interface FullscreenViolationWarningProps {
  violationCount: number;
  maxViolations: number;
  countdownSeconds: number;
  onDismiss: () => void;
}

export const FullscreenViolationWarning: React.FC<
  FullscreenViolationWarningProps
> = ({ violationCount, maxViolations, countdownSeconds, onDismiss }) => {
  const remainingViolations = maxViolations - violationCount;
  const isLastWarning = remainingViolations === 0;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[9999]">
      <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md mx-4 border-4 border-red-500">
        <div className="text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-4xl">⚠️</span>
          </div>

          <h2 className="text-2xl font-bold text-red-600 mb-4">
            {isLastWarning ? "Final Warning!" : "Fullscreen Violation!"}
          </h2>

          <p className="text-gray-700 mb-4 text-lg">
            You exited fullscreen mode during the test. This action has been
            recorded.
          </p>

          <div className="bg-red-50 border-2 border-red-200 rounded-xl p-4 mb-6">
            <p className="text-red-800 font-semibold">
              Violation {violationCount} of {maxViolations}
            </p>
            {!isLastWarning && (
              <p className="text-red-700 text-sm mt-2">
                {remainingViolations} more violation
                {remainingViolations !== 1 ? "s" : ""} will result in automatic
                test submission.
              </p>
            )}
            {isLastWarning && (
              <p className="text-red-700 text-sm mt-2">
                Your test will be automatically submitted if you exit fullscreen
                again.
              </p>
            )}
          </div>

          {/* Countdown Timer */}
          <div className="bg-orange-50 border-2 border-orange-300 rounded-xl p-4 mb-6">
            <div className="flex items-center justify-center mb-2">
              <div className="w-12 h-12 bg-orange-500 text-white rounded-full flex items-center justify-center text-xl font-bold">
                {countdownSeconds}
              </div>
            </div>
            <p className="text-orange-800 font-semibold text-lg">
              Auto-Submit in {countdownSeconds} second
              {countdownSeconds !== 1 ? "s" : ""}
            </p>
            <p className="text-orange-700 text-sm mt-1">
              Click &ldquo;I Understand&rdquo; to continue the test, or the exam
              will be automatically submitted.
            </p>
          </div>

          <div className="space-y-3">
            <p className="text-gray-600 text-sm">
              Please return to fullscreen mode to continue the test.
            </p>

            <button
              onClick={onDismiss}
              className="w-full px-6 py-3 bg-red-600 text-white font-bold rounded-xl hover:bg-red-700 transition-all"
            >
              I Understand - Continue Test
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
