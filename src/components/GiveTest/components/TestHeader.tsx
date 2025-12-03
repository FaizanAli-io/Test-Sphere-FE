import React from "react";

interface CaptureStats {
  screenshots: { total: number; uploaded: number };
  webcamPhotos: { total: number; uploaded: number };
}

interface SystemEventStats {
  focusChanges: { total: number; uploaded: number };
  clicks: { total: number; uploaded: number };
  keystrokes: { total: number; uploaded: number };
}

interface TestHeaderProps {
  testTitle: string;
  answeredCount: number;
  totalQuestions: number;
  timeRemaining: number;
  formatTime: (seconds: number) => string;
  progress: number;
  onSubmitTest: () => void;
  submitting: boolean;
  isCapturing?: boolean;
  isFullscreen?: boolean;
  violationCount?: number;
  isOnline?: boolean;
  hasPendingLogs?: boolean;
  captureStats?: CaptureStats;
  systemEventStats?: SystemEventStats;
}

export const TestHeader: React.FC<TestHeaderProps> = ({
  testTitle,
  answeredCount,
  totalQuestions,
  timeRemaining,
  formatTime,
  progress,
  onSubmitTest,
  submitting,
  isCapturing,
  isFullscreen,
  violationCount = 0,
  isOnline = true,
  hasPendingLogs = false,
  captureStats,
  systemEventStats,
}) => {
  const showDebug = typeof process !== "undefined" && process.env.NEXT_PUBLIC_DEBUG_MODE === "true";
  const showStatus = !isOnline || hasPendingLogs;
  return (
    <div className="sticky top-0 z-50 bg-white/95 backdrop-blur-md shadow-lg border-b-2 border-gray-200">
      <div className="max-w-7xl mx-auto px-4 py-4">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{testTitle}</h1>
            <p className="text-sm text-gray-600 mt-1">
              Question {answeredCount} of {totalQuestions} answered
            </p>
          </div>

          <div className="flex items-center gap-4">
            {/* Comprehensive Monitoring Stats (debug mode only) */}
            {showDebug && (captureStats || systemEventStats || isFullscreen !== undefined) && (
              <div className="bg-gray-50 border-2 border-gray-200 rounded-lg px-4 py-2">
                <div className="grid grid-cols-6 gap-3 text-xs">
                  {/* Screenshots */}
                  {captureStats && (
                    <div className="text-center">
                      <div className="font-semibold text-gray-600 mb-1">Screenshots</div>
                      <div className="text-blue-600 font-bold">
                        {captureStats.screenshots.uploaded}/{captureStats.screenshots.total}
                      </div>
                    </div>
                  )}

                  {/* Webcam */}
                  {captureStats && (
                    <div className="text-center">
                      <div className="font-semibold text-gray-600 mb-1">Webcam</div>
                      <div className="text-blue-600 font-bold">
                        {captureStats.webcamPhotos.uploaded}/{captureStats.webcamPhotos.total}
                      </div>
                    </div>
                  )}

                  {/* Focus Changes */}
                  {systemEventStats && (
                    <div className="text-center">
                      <div className="font-semibold text-gray-600 mb-1">Focus</div>
                      <div className="text-orange-600 font-bold">
                        {systemEventStats.focusChanges.uploaded}/
                        {systemEventStats.focusChanges.total}
                      </div>
                    </div>
                  )}

                  {/* Clicks */}
                  {systemEventStats && (
                    <div className="text-center">
                      <div className="font-semibold text-gray-600 mb-1">Clicks</div>
                      <div className="text-purple-600 font-bold">
                        {systemEventStats.clicks.uploaded}/{systemEventStats.clicks.total}
                      </div>
                    </div>
                  )}

                  {/* Keystrokes */}
                  {systemEventStats && (
                    <div className="text-center">
                      <div className="font-semibold text-gray-600 mb-1">Keys</div>
                      <div className="text-green-600 font-bold">
                        {systemEventStats.keystrokes.uploaded}/{systemEventStats.keystrokes.total}
                      </div>
                    </div>
                  )}

                  {/* Violations */}
                  {isFullscreen !== undefined && (
                    <div className="text-center">
                      <div className="font-semibold text-gray-600 mb-1">Violations</div>
                      <div
                        className={`font-bold ${violationCount === 0 ? "text-green-600" : "text-red-600"}`}
                      >
                        {violationCount}
                      </div>
                    </div>
                  )}
                </div>

                {/* Capturing indicator (debug only) */}
                {showDebug && isCapturing !== undefined && (
                  <div className="flex items-center justify-center gap-2 mt-2 pt-2 border-t border-gray-300">
                    <div
                      className={`w-2 h-2 rounded-full ${
                        isCapturing ? "bg-red-500 animate-pulse" : "bg-green-500"
                      }`}
                    />
                    <span className="text-xs font-medium text-gray-600">
                      {isCapturing ? "Capturing..." : "Monitoring Active"}
                    </span>
                  </div>
                )}
              </div>
            )}
            {/* Two-column layout: Left = Submit + Connection, Right = Time Remaining */}
            <div className={`flex ${showStatus ? "items-start" : "items-center"} gap-6`}>
              {/* Left column */}
              <div className={`flex flex-col gap-2 ${showStatus ? "" : "justify-center"}`}>
                <button
                  onClick={onSubmitTest}
                  disabled={submitting}
                  className="px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white font-bold rounded-xl hover:from-green-600 hover:to-emerald-700 transition-all shadow-lg hover:shadow-xl disabled:opacity-50"
                >
                  Submit Test
                </button>

                {showStatus && (
                  <div className="bg-orange-50 border-2 border-orange-300 rounded-lg px-3 py-1">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-orange-500 animate-pulse" />
                      <span className="text-xs font-medium text-orange-700">
                        {!isOnline ? "Connection Lost" : "Syncing..."}
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {/* Right column */}
              <div className="bg-gradient-to-r from-orange-100 to-red-100 border-2 border-orange-300 rounded-xl px-6 py-3">
                <p className="text-xs font-bold text-gray-600 mb-1">Time Remaining</p>
                <p
                  className={`text-2xl font-bold ${
                    timeRemaining < 300 ? "text-red-600" : "text-gray-900"
                  }`}
                >
                  {formatTime(timeRemaining)}
                </p>
              </div>
            </div>
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
