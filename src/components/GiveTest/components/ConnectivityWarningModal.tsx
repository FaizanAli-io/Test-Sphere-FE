import React from "react";
import { WifiOff, Loader2, CheckCircle, AlertTriangle } from "lucide-react";

interface ConnectivityWarningModalProps {
  isOnline: boolean;
  hasPendingLogs: boolean;
  pendingCount: number;
  isSyncing: boolean;
}

export const ConnectivityWarningModal: React.FC<ConnectivityWarningModalProps> = ({
  isOnline,
  hasPendingLogs,
  pendingCount,
  isSyncing,
}) => {
  // Don't show modal if online and no pending logs
  if (isOnline && !hasPendingLogs && !isSyncing) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-md p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden">
        {/* Header */}
        <div
          className={`px-6 py-4 ${
            isOnline
              ? "bg-gradient-to-r from-green-50 to-emerald-50"
              : "bg-gradient-to-r from-orange-50 to-red-50"
          }`}
        >
          <div className="flex items-center gap-3">
            {isOnline ? (
              <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center">
                {isSyncing ? (
                  <Loader2 className="text-green-600 animate-spin" size={24} />
                ) : (
                  <CheckCircle className="text-green-600" size={24} />
                )}
              </div>
            ) : (
              <div className="w-12 h-12 rounded-full bg-orange-100 flex items-center justify-center">
                <WifiOff className="text-orange-600" size={24} />
              </div>
            )}
            <div>
              <h2 className="text-lg font-bold text-gray-800">
                {isOnline ? "Connection Restored" : "Connection Lost"}
              </h2>
              <p className="text-sm text-gray-600">
                {isOnline ? "Syncing your data..." : "Internet connection unavailable"}
              </p>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="px-6 py-6 space-y-4">
          {!isOnline && (
            <>
              <div className="flex items-start gap-3 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <AlertTriangle className="text-blue-600 flex-shrink-0 mt-0.5" size={20} />
                <div className="flex-1">
                  <p className="text-sm font-medium text-blue-900 mb-1">
                    Your responses have been saved
                  </p>
                  <p className="text-xs text-blue-700">
                    All your answers and test activity are being stored securely on your device.
                  </p>
                </div>
              </div>

              <div className="space-y-2">
                <p className="text-sm text-gray-700 font-medium">What happens next:</p>
                <ul className="space-y-2 text-sm text-gray-600">
                  <li className="flex items-start gap-2">
                    <span className="text-orange-500 font-bold">•</span>
                    <span>Your test will automatically submit once connectivity is restored</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-orange-500 font-bold">•</span>
                    <span>The submit button is temporarily disabled</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-orange-500 font-bold">•</span>
                    <span>All your progress is safely stored</span>
                  </li>
                </ul>
              </div>

              <div className="p-4 bg-red-50 border-2 border-red-200 rounded-lg">
                <p className="text-sm font-bold text-red-900 mb-1 flex items-center gap-2">
                  <AlertTriangle size={16} />
                  Critical Warning
                </p>
                <p className="text-xs text-red-700">
                  <strong>Do NOT close this window or navigate away!</strong> Closing the browser
                  before connectivity is restored will result in test forfeiture and loss of all
                  unsaved data.
                </p>
              </div>

              {pendingCount > 0 && (
                <div className="text-center p-3 bg-gray-50 rounded-lg">
                  <p className="text-xs text-gray-600">
                    <span className="font-bold text-gray-800">{pendingCount}</span> log entries
                    waiting to sync
                  </p>
                </div>
              )}
            </>
          )}

          {isOnline && hasPendingLogs && (
            <>
              <div className="flex items-start gap-3 p-4 bg-green-50 border border-green-200 rounded-lg">
                {isSyncing ? (
                  <Loader2 className="text-green-600 flex-shrink-0 mt-0.5 animate-spin" size={20} />
                ) : (
                  <CheckCircle className="text-green-600 flex-shrink-0 mt-0.5" size={20} />
                )}
                <div className="flex-1">
                  <p className="text-sm font-medium text-green-900 mb-1">
                    {isSyncing ? "Syncing your data..." : "Almost done!"}
                  </p>
                  <p className="text-xs text-green-700">
                    {isSyncing
                      ? "We're uploading your saved test data to the server. Please wait..."
                      : "All your data has been uploaded. You can submit your test now."}
                  </p>
                </div>
              </div>

              {pendingCount > 0 && isSyncing && (
                <div className="text-center p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center justify-center gap-2 mb-2">
                    <Loader2 className="animate-spin text-gray-600" size={16} />
                    <p className="text-xs text-gray-600">
                      Syncing <span className="font-bold text-gray-800">{pendingCount}</span>{" "}
                      remaining entries...
                    </p>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div className="bg-green-500 h-2 rounded-full transition-all duration-300 animate-pulse w-3/4"></div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};
