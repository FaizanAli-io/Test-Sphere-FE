import React from "react";
import { useRouter } from "next/navigation";
import { Test } from "../types";
import { Submission } from "../../Submissions/types";

interface TestsModalProps {
  isOpen: boolean;
  onClose: () => void;
  testsForClass: number | null;
  tests: Test[];
  testsLoading: boolean;
  error: string | null;
  submissions: Submission[];
  getSubmissionForTest: (testId: number) => Submission | undefined;
  onViewSubmission: (submission: Submission) => void;
}

export default function TestsModal({
  isOpen,
  onClose,
  testsForClass,
  tests,
  testsLoading,
  error,
  getSubmissionForTest,
  onViewSubmission,
}: TestsModalProps) {
  const router = useRouter();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-3xl w-full max-w-3xl shadow-2xl overflow-hidden max-h-[90vh] overflow-y-auto">
        <div className="px-8 py-6 bg-gradient-to-r from-orange-500 to-amber-600 sticky top-0 z-10">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-white">
                {testsForClass
                  ? `Class #${testsForClass} Tests`
                  : "Available Tests"}
              </h2>
              <p className="text-orange-100 mt-1">
                Choose a test to take or view results
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
          {error && (
            <div className="mb-4 p-3 bg-red-50 border-l-4 border-red-500 rounded">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          {testsLoading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Loading tests…</p>
            </div>
          ) : (
            (() => {
              const filteredTests = tests.filter((t) =>
                t.status ? t.status.toUpperCase() !== "DRAFT" : true
              );
              if (filteredTests.length === 0) {
                return (
                  <div className="text-center text-gray-500 py-10">
                    {testsForClass
                      ? "No available tests for this class right now."
                      : "No available tests across your classes right now."}
                  </div>
                );
              }

              const getStatusColor = (status?: string) => {
                const s = status?.toUpperCase();
                if (s === "ACTIVE") return "bg-green-100 text-green-800";
                if (s === "COMPLETED") return "bg-blue-100 text-blue-800";
                if (s === "ARCHIVED") return "bg-yellow-100 text-yellow-800";
                return "bg-gray-100 text-gray-800";
              };

              return (
                <div className="space-y-4">
                  {filteredTests.map((test) => (
                    <div
                      key={test.id}
                      className="bg-gradient-to-r from-gray-50 to-orange-50 rounded-2xl p-6 border-2 border-gray-200 hover:border-orange-300 transition-all"
                    >
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <h3 className="text-lg font-bold text-gray-900">
                            {test.title}
                          </h3>
                          {test.status && (
                            <span
                              className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(test.status)}`}
                            >
                              {test.status}
                            </span>
                          )}
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
                            }
                            return (
                              <button
                                onClick={() =>
                                  router.push(`/give-test/${test.id}`)
                                }
                                className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition"
                              >
                                Take Test
                              </button>
                            );
                          })()}
                        </div>
                      </div>

                      {test.className && (
                        <p className="text-sm text-blue-600 font-medium">
                          Class: {test.className}
                        </p>
                      )}

                      {test.description && (
                        <p className="text-sm text-gray-700 mt-2 line-clamp-2">
                          {test.description}
                        </p>
                      )}

                      <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm">
                        {typeof test.duration === "number" && (
                          <div className="bg-white/70 rounded-lg p-3">
                            <span className="font-bold text-gray-700">
                              Duration:
                            </span>
                            <div className="text-gray-900">
                              {test.duration} min
                            </div>
                          </div>
                        )}
                        {test.startAt && (
                          <div className="bg-white/70 rounded-lg p-3">
                            <span className="font-bold text-gray-700">
                              Starts:
                            </span>
                            <div className="text-gray-900">
                              {new Date(test.startAt).toLocaleString()}
                            </div>
                          </div>
                        )}
                        {test.endAt && (
                          <div className="bg-white/70 rounded-lg p-3">
                            <span className="font-bold text-gray-700">
                              Finishes:
                            </span>
                            <div className="text-gray-900">
                              {new Date(test.endAt).toLocaleString()}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              );
            })()
          )}
        </div>
      </div>
    </div>
  );
}
