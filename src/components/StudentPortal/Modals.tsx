import React from "react";
import { useRouter } from "next/navigation";
import {
  ClassData,
  Test,
  StudentSubmission,
  calculateSubmissionScore,
  calculateSubmissionMaxScore
} from "./types";

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
  submissions: StudentSubmission[];
  getSubmissionForTest: (testId: number) => StudentSubmission | undefined;
  onViewSubmission: (submission: StudentSubmission) => void;
}

export function TestsModal({
  isOpen,
  onClose,
  testsForClass,
  tests,
  testsLoading,
  error,
  submissions,
  getSubmissionForTest,
  onViewSubmission
}: TestsModalProps) {
  const router = useRouter();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-2xl transform transition-all duration-300">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold text-gray-900">
            {testsForClass
              ? `Class #${testsForClass} Tests`
              : "Available Tests"}
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
            {testsForClass
              ? "No tests available for this class."
              : "No tests available in any of your classes."}
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
                  {test.className && (
                    <p className="text-sm text-blue-600 font-medium mt-1">
                      Class: {test.className}
                    </p>
                  )}
                  {test.description && (
                    <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                      {test.description}
                    </p>
                  )}
                  <div className="text-xs text-gray-500 mt-2 flex flex-col gap-1">
                    {typeof test.duration === "number" && (
                      <span>Duration: {test.duration} min</span>
                    )}
                    {test.startAt && (
                      <span>
                        Starts: {new Date(test.startAt).toLocaleString()}
                      </span>
                    )}
                    {test.endAt && (
                      <span>
                        Finishes: {new Date(test.endAt).toLocaleString()}
                      </span>
                    )}
                    {test.status && <span>Status: {test.status}</span>}
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  {(() => {
                    const submission = getSubmissionForTest(test.id);
                    if (submission) {
                      return (
                        <button
                          onClick={() => onViewSubmission(submission)}
                          className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
                        >
                          View Score
                        </button>
                      );
                    } else {
                      return (
                        <button
                          onClick={() => router.push(`/give-test/${test.id}`)}
                          className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition"
                        >
                          Take Test
                        </button>
                      );
                    }
                  })()}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

interface SubmissionsListModalProps {
  isOpen: boolean;
  onClose: () => void;
  submissionsForClass: number | null;
  submissions: StudentSubmission[];
  loading: boolean;
  error: string | null;
  onViewSubmission: (submission: StudentSubmission) => void;
}

export function SubmissionsListModal({
  isOpen,
  onClose,
  submissionsForClass,
  submissions,
  loading,
  error,
  onViewSubmission
}: SubmissionsListModalProps) {
  if (!isOpen) return null;

  // Filter submissions for the specific class
  const filteredSubmissions = submissionsForClass
    ? submissions.filter((sub) => {
        const match = sub.test?.class?.id === Number(submissionsForClass);
        return match;
      })
    : submissions;

  const getStatusColor = (submission: StudentSubmission) => {
    if (submission.status === "GRADED" || submission.gradedAt) {
      return "bg-green-100 text-green-800";
    }
    if (submission.status === "SUBMITTED") {
      return "bg-yellow-100 text-yellow-800";
    }
    return "bg-gray-100 text-gray-800";
  };

  const getStatusText = (submission: StudentSubmission) => {
    if (submission.status === "GRADED" || submission.gradedAt) {
      return "Graded";
    }
    if (submission.status === "SUBMITTED") {
      return "Pending";
    }
    return submission.status || "Unknown";
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    });
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-3xl w-full max-w-4xl shadow-2xl overflow-hidden max-h-[90vh] overflow-y-auto">
        <div className="px-8 py-6 bg-gradient-to-r from-purple-500 to-indigo-600 sticky top-0 z-10">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-2xl font-bold text-white">
                Your Submissions ({filteredSubmissions.length})
              </h3>
              <p className="text-purple-100 mt-1">
                {submissionsForClass
                  ? "View your submissions for this class"
                  : "Review all your test submissions and scores"}
              </p>
            </div>
            <button
              onClick={onClose}
              className="px-4 py-2 bg-white/20 text-white rounded-lg hover:bg-white/30 transition-all"
            >
              Close
            </button>
          </div>
        </div>

        <div className="p-6">
          {loading && (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Loading your submissions...</p>
            </div>
          )}

          {error && (
            <div className="text-center py-12">
              <p className="text-red-600 mb-4">{error}</p>
              <button
                onClick={onClose}
                className="px-6 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-all"
              >
                Close
              </button>
            </div>
          )}

          {!error && filteredSubmissions.length === 0 && (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">📝</div>
              <h4 className="text-xl font-semibold text-gray-700 mb-2">
                No Submissions Yet
              </h4>
              <p className="text-gray-500 mb-2">
                {submissionsForClass
                  ? "You haven't submitted any tests for this class yet."
                  : "You haven't submitted any tests yet. Take a test to see your submissions here."}
              </p>
            </div>
          )}

          {!error && filteredSubmissions.length > 0 && (
            <div className="space-y-4">
              {filteredSubmissions.map((submission) => {
                const score = calculateSubmissionScore(submission);
                const maxScore = calculateSubmissionMaxScore(submission);
                const percentage = maxScore > 0 ? (score / maxScore) * 100 : 0;

                return (
                  <div
                    key={submission.id}
                    className="bg-gradient-to-r from-gray-50 to-blue-50 rounded-2xl p-6 border-2 border-gray-200 hover:border-blue-300 transition-all cursor-pointer"
                    onClick={() => onViewSubmission(submission)}
                  >
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h4 className="text-xl font-bold text-gray-900 mb-1">
                          {submission.test?.title || "Unknown Test"}
                        </h4>
                        <p className="text-gray-600">
                          {submission.test?.class?.name || "Unknown Class"}
                        </p>
                      </div>
                      <div className="text-right">
                        <div
                          className={`inline-flex px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(submission)}`}
                        >
                          {getStatusText(submission)}
                        </div>
                        {submission.gradedAt && (
                          <div className="mt-2 text-2xl font-bold text-gray-900">
                            {score}/{maxScore}
                            <span className="text-sm text-gray-600 ml-2">
                              ({percentage.toFixed(1)}%)
                            </span>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                      <div className="bg-white/70 rounded-lg p-3">
                        <span className="font-bold text-gray-700">
                          Submitted:
                        </span>
                        <div className="text-gray-900">
                          {formatDate(submission.submittedAt)}
                        </div>
                      </div>

                      {submission.gradedAt && (
                        <div className="bg-white/70 rounded-lg p-3">
                          <span className="font-bold text-gray-700">
                            Graded:
                          </span>
                          <div className="text-gray-900">
                            {formatDate(submission.gradedAt)}
                          </div>
                        </div>
                      )}

                      <div className="bg-white/70 rounded-lg p-3">
                        <span className="font-bold text-gray-700">
                          Questions:
                        </span>
                        <div className="text-gray-900">
                          {submission.answers?.length || 0}
                        </div>
                      </div>
                    </div>

                    <div className="mt-4 flex justify-end">
                      <button className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-all text-sm font-medium">
                        View Details →
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
