import React from "react";
import { useRouter } from "next/navigation";
import { ClassData, Test } from "./types";

interface JoinClassModalProps {
  isOpen: boolean;
  onClose: () => void;
  classCode: string;
  setClassCode: (code: string) => void;
  onJoinClass: () => void;
  joining: boolean;
  error: string | null;
}

export function JoinClassModal({
  isOpen,
  onClose,
  classCode,
  setClassCode,
  onJoinClass,
  joining,
  error
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

interface ClassDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedClass: ClassData | null;
  loadingDetails: boolean;
}

export function ClassDetailsModal({
  isOpen,
  onClose,
  selectedClass,
  loadingDetails
}: ClassDetailsModalProps) {
  if (!isOpen || !selectedClass) return null;

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-lg transform transition-all duration-300">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">
          {selectedClass.name}
        </h2>

        {loadingDetails ? (
          <div className="text-gray-600 text-center py-4">
            Loading details...
          </div>
        ) : (
          <>
            <p className="text-gray-600 mb-3">
              {selectedClass.description || "No description available."}
            </p>

            <div className="border-t pt-3 text-sm text-gray-600 space-y-1">
              <p>
                <span className="font-semibold text-gray-800">Class Code:</span>{" "}
                {selectedClass.code}
              </p>
              <p>
                <span className="font-semibold text-gray-800">Teacher:</span>{" "}
                {selectedClass.teacher?.name || "N/A"}
              </p>
              <p>
                <span className="font-semibold text-gray-800">Students:</span>{" "}
                {selectedClass.studentCount || 0}
              </p>
            </div>
          </>
        )}

        <div className="flex justify-end gap-3 mt-6">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-600 hover:text-gray-800 font-medium"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

interface TestsModalProps {
  isOpen: boolean;
  onClose: () => void;
  testsForClass: number | null;
  tests: Test[];
  testsLoading: boolean;
  error: string | null;
}

export function TestsModal({
  isOpen,
  onClose,
  testsForClass,
  tests,
  testsLoading,
  error
}: TestsModalProps) {
  const router = useRouter();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-2xl transform transition-all duration-300">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold text-gray-900">
            {testsForClass ? `Class #${testsForClass} Tests` : "Class Tests"}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-600 hover:text-gray-800 font-medium"
          >
            Close
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border-l-4 border-red-500 rounded">
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}

        {testsLoading ? (
          <div className="text-center text-gray-600 py-10">Loading tests…</div>
        ) : tests.length === 0 ? (
          <div className="text-center text-gray-500 py-10">
            No tests available for this class.
          </div>
        ) : (
          <div className="space-y-4 max-h-[60vh] overflow-auto pr-1">
            {tests.map((test) => (
              <div
                key={test.id}
                className="border rounded-xl p-4 bg-white shadow-sm flex items-center justify-between"
              >
                <div>
                  <h3 className="text-lg font-bold text-gray-900">
                    {test.title}
                  </h3>
                  {test.description && (
                    <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                      {test.description}
                    </p>
                  )}
                  <div className="text-xs text-gray-500 mt-2 flex gap-4 flex-wrap">
                    {typeof test.duration === "number" && (
                      <span>Duration: {test.duration} min</span>
                    )}
                    {test.startAt && (
                      <span>
                        Starts: {new Date(test.startAt).toLocaleString()}
                      </span>
                    )}
                    {test.endAt && (
                      <span>Ends: {new Date(test.endAt).toLocaleString()}</span>
                    )}
                    {test.status && <span>Status: {test.status}</span>}
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => router.push(`/give-test/${test.id}`)}
                    className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition"
                  >
                    Take Test
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
