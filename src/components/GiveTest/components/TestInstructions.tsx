import React from "react";
import { Test } from "../hooks/useTestExam";

interface TestInstructionsProps {
  test: Test;
  onStartTest: (options?: { requireWebcam: boolean }) => void;
  onCancel: () => void;
  requireWebcam?: boolean;
  onToggleRequireWebcam?: (val: boolean) => void;
  errors?: string[];
}

export const TestInstructions: React.FC<TestInstructionsProps> = ({
  test,
  onStartTest,
  onCancel,
  requireWebcam = true,
  onToggleRequireWebcam,
  errors = [],
}) => {
  const totalMarks = test.questions.reduce((sum, q) => sum + q.maxMarks, 0);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-purple-50 to-indigo-50 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-3xl shadow-2xl border-2 border-gray-100 overflow-hidden">
          <div className="px-8 py-6 bg-gradient-to-r from-indigo-600 to-blue-600">
            <h1 className="text-3xl font-bold text-white">Test Instructions</h1>
          </div>

          <div className="p-8">
            <div className="mb-8">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">{test.title}</h2>
              <p className="text-gray-600 text-lg leading-relaxed">{test.description}</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-6 border-2 border-blue-200">
                <div className="text-4xl mb-3">📝</div>
                <p className="text-sm font-bold text-gray-600 mb-1">Total Questions</p>
                <p className="text-3xl font-bold text-gray-900">{test.questions.length}</p>
              </div>

              <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-2xl p-6 border-2 border-purple-200">
                <div className="text-4xl mb-3">⏱️</div>
                <p className="text-sm font-bold text-gray-600 mb-1">Duration</p>
                <p className="text-3xl font-bold text-gray-900">{test.duration} min</p>
              </div>

              <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl p-6 border-2 border-green-200">
                <div className="text-4xl mb-3">🎯</div>
                <p className="text-sm font-bold text-gray-600 mb-1">Total Marks</p>
                <p className="text-3xl font-bold text-gray-900">{totalMarks}</p>
              </div>
            </div>

            <div className="bg-yellow-50 border-2 border-yellow-200 rounded-2xl p-6 mb-8">
              <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                <span className="text-2xl">📋</span>
                Important Instructions
              </h3>
              <ul className="space-y-3 text-gray-700">
                <li className="flex items-start gap-3">
                  <span className="text-indigo-600 font-bold mt-1">•</span>
                  <span>Read each question carefully before answering</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-indigo-600 font-bold mt-1">•</span>
                  <span>You can navigate between questions using the question palette</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-indigo-600 font-bold mt-1">•</span>
                  <span>Your answers are automatically saved as you progress</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-indigo-600 font-bold mt-1">•</span>
                  <span>The test will auto-submit when the timer reaches zero</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-indigo-600 font-bold mt-1">•</span>
                  <span>Ensure you have a stable internet connection</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-indigo-600 font-bold mt-1">•</span>
                  <span>Once submitted, you cannot change your answers</span>
                </li>
              </ul>
            </div>

            {/* Security requirements info */}
            <div className="bg-red-50 border-2 border-red-200 rounded-2xl p-6 mb-8">
              <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                <span className="text-2xl">🔒</span>
                Security requirements
              </h3>
              <ul className="space-y-3 text-gray-700">
                <li className="flex items-start gap-3">
                  <span className="text-red-600 font-bold mt-1">•</span>
                  <span>
                    You must share your <span className="font-semibold">entire screen</span> when
                    prompted. Window or tab sharing is not allowed.
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-red-600 font-bold mt-1">•</span>
                  <span>
                    The test will automatically enter{" "}
                    <span className="font-semibold">fullscreen mode</span> once you start. Exiting
                    fullscreen will be recorded as a violation.
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-red-600 font-bold mt-1">•</span>
                  <span>
                    Repeated fullscreen violations may result in automatic test submission and your
                    teacher will be notified.
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-red-600 font-bold mt-1">•</span>
                  <span>
                    If enabled, you must also{" "}
                    <span className="font-semibold">allow webcam access</span> before the test can
                    begin.
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-red-600 font-bold mt-1">•</span>
                  <span>
                    If you deny permissions, you will be asked again and will not be able to start
                    the test until granted.
                  </span>
                </li>
              </ul>
            </div>

            {errors.length > 0 && (
              <div className="bg-red-50 border-2 border-red-300 rounded-2xl p-5 mb-6">
                <h4 className="text-red-700 font-semibold mb-2 flex items-center gap-2">
                  <span className="text-xl">⚠️</span>
                  Please fix the following before starting
                </h4>
                <ul className="list-disc pl-6 text-red-700 space-y-1">
                  {errors.map((e, i) => (
                    <li key={i} className="text-sm md:text-base">
                      {e}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <div className="flex flex-col gap-6">
              <div className="flex items-center gap-3 bg-white border-2 border-gray-200 rounded-xl p-4">
                <input
                  id="require-webcam"
                  type="checkbox"
                  className="h-5 w-5 text-indigo-600 rounded focus:ring-indigo-500"
                  checked={requireWebcam}
                  onChange={(e) => onToggleRequireWebcam?.(e.target.checked)}
                />
                <label htmlFor="require-webcam" className="text-gray-800 font-medium">
                  Require webcam monitoring
                </label>
              </div>

              <div className="flex gap-4">
                <button
                  onClick={onCancel}
                  className="flex-1 px-8 py-4 bg-gray-100 text-gray-700 font-bold rounded-xl hover:bg-gray-200 transition-all text-lg"
                >
                  Cancel
                </button>
                <button
                  onClick={() => onStartTest({ requireWebcam })}
                  className="flex-1 px-8 py-4 bg-gradient-to-r from-indigo-600 to-blue-600 text-white font-bold rounded-xl hover:from-indigo-700 hover:to-blue-700 transition-all shadow-lg hover:shadow-xl text-lg"
                >
                  Start Test
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
