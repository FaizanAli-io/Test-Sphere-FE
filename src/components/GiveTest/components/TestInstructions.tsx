import React, { useState } from "react";
import { Test } from "../hooks/useTestExam";
import { Camera, Mic, Check, X } from "lucide-react";

interface TestInstructionsProps {
  test: Test;
  onStartTest: (options?: {
    requireWebcam: boolean;
    initialStream?: MediaStream;
    initialScreenStream?: MediaStream;
  }) => void;
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
  const [permissionsGranted, setPermissionsGranted] = useState({
    camera: false,
    microphone: false,
    screen: false,
  });
  const [checkingPermissions, setCheckingPermissions] = useState(false);
  const [permissionErrors, setPermissionErrors] = useState<string[]>([]);
  const [initialStream, setInitialStream] = useState<MediaStream | null>(null);
  const [initialScreenStream, setInitialScreenStream] =
    useState<MediaStream | null>(null);

  const checkPermissions = async () => {
    setCheckingPermissions(true);
    setPermissionErrors([]);
    const newPerms = { camera: false, microphone: false, screen: false };
    const errors: string[] = [];

    try {
      // Request camera and microphone permissions
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true,
      });

      // Check if we got both tracks
      const videoTrack = stream.getVideoTracks()[0];
      const audioTrack = stream.getAudioTracks()[0];

      if (videoTrack && videoTrack.readyState === "live") {
        newPerms.camera = true;
      }
      if (audioTrack && audioTrack.readyState === "live") {
        newPerms.microphone = true;
      }

      // Keep the stream alive for later use
      setInitialStream(stream);

      if (!newPerms.camera || !newPerms.microphone) {
        const missing = [];
        if (!newPerms.camera) missing.push("Camera");
        if (!newPerms.microphone) missing.push("Microphone");
        errors.push(
          `${missing.join(" and ")} permission required to start the test.`
        );
      }
    } catch (error: unknown) {
      console.error("Camera/Microphone permission check failed:", error);

      // Provide specific error messages
      if (error instanceof Error && error.name === "NotAllowedError") {
        errors.push(
          "Camera and microphone permissions were denied. Please allow access and try again."
        );
      } else if (error instanceof Error && error.name === "NotFoundError") {
        errors.push(
          "No camera or microphone found. Please connect devices and try again."
        );
      } else {
        errors.push(
          "Failed to access camera or microphone. Please check your devices and try again."
        );
      }
    }

    // Request screen share permission
    try {
      const screenStream = await navigator.mediaDevices.getDisplayMedia({
        video: {
          // Note: Browsers may ignore this, we'll validate after selection
          displaySurface: "monitor",
        } as MediaTrackConstraints,
        audio: false,
      });

      const screenTrack = screenStream.getVideoTracks()[0];
      const settings = screenTrack?.getSettings?.();
      const surface = (settings as Record<string, unknown> | undefined)?.[
        "displaySurface"
      ] as string | undefined;
      const isEntireScreen =
        surface === "monitor" ||
        (typeof screenTrack?.label === "string" &&
          /entire screen|screen 1|screen 2|whole screen/i.test(
            screenTrack.label
          ));

      if (screenTrack && screenTrack.readyState === "live" && isEntireScreen) {
        newPerms.screen = true;
        console.log(
          "[TestInstructions] Screen permission granted (entire screen), stream active:",
          screenStream.active
        );
        // Keep the screen stream alive for later use
        setInitialScreenStream(screenStream);
      } else {
        // Not an entire screen selection; stop and inform user
        screenStream.getTracks().forEach((t) => t.stop());
        errors.push(
          "Please select 'Entire screen' in the screen sharing dialog."
        );
      }
    } catch (error: unknown) {
      console.error("Screen share permission check failed:", error);

      if (error instanceof Error && error.name === "NotAllowedError") {
        errors.push(
          "Screen share permission was denied. Please allow access and try again."
        );
      } else {
        errors.push("Failed to access screen share. Please try again.");
      }
    }

    setPermissionsGranted(newPerms);
    if (errors.length > 0) {
      setPermissionErrors(errors);
    }
    setCheckingPermissions(false);
  };

  const handleStartTest = () => {
    if (
      requireWebcam &&
      (!permissionsGranted.camera ||
        !permissionsGranted.microphone ||
        !permissionsGranted.screen)
    ) {
      setPermissionErrors([
        "Please grant camera, microphone, and screen share permissions before starting the test.",
      ]);
      return;
    }
    console.log("[TestInstructions] Starting test with streams:", {
      webcamActive: initialStream?.active,
      screenActive: initialScreenStream?.active,
      webcamTracks: initialStream?.getTracks().length,
      screenTracks: initialScreenStream?.getTracks().length,
    });
    onStartTest({
      requireWebcam,
      initialStream: initialStream || undefined,
      initialScreenStream: initialScreenStream || undefined,
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-purple-50 to-indigo-50 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-3xl shadow-2xl border-2 border-gray-100 overflow-hidden">
          <div className="px-8 py-6 bg-gradient-to-r from-indigo-600 to-blue-600">
            <h1 className="text-3xl font-bold text-white">Test Instructions</h1>
          </div>

          <div className="p-8">
            <div className="mb-8">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">
                {test.title}
              </h2>
              <p className="text-gray-600 text-lg leading-relaxed">
                {test.description}
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-6 border-2 border-blue-200">
                <div className="text-4xl mb-3">📝</div>
                <p className="text-sm font-bold text-gray-600 mb-1">
                  Total Questions
                </p>
                <p className="text-3xl font-bold text-gray-900">
                  {test.questions.length}
                </p>
              </div>

              <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-2xl p-6 border-2 border-purple-200">
                <div className="text-4xl mb-3">⏱️</div>
                <p className="text-sm font-bold text-gray-600 mb-1">Duration</p>
                <p className="text-3xl font-bold text-gray-900">
                  {test.duration} min
                </p>
              </div>

              <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl p-6 border-2 border-green-200">
                <div className="text-4xl mb-3">🎯</div>
                <p className="text-sm font-bold text-gray-600 mb-1">
                  Total Marks
                </p>
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
                  <span>
                    You can navigate between questions using the question
                    palette
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-indigo-600 font-bold mt-1">•</span>
                  <span>
                    Your answers are automatically saved as you progress
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-indigo-600 font-bold mt-1">•</span>
                  <span>
                    The test will auto-submit when the timer reaches zero
                  </span>
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
                Security Requirements
              </h3>
              <ul className="space-y-3 text-gray-700">
                <li className="flex items-start gap-3">
                  <span className="text-red-600 font-bold mt-1">•</span>
                  <span>
                    You must share your{" "}
                    <span className="font-semibold">entire screen</span> when
                    prompted. Window or tab sharing is not allowed.
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-red-600 font-bold mt-1">•</span>
                  <span>
                    The test will automatically enter{" "}
                    <span className="font-semibold">fullscreen mode</span> once
                    you start. Exiting fullscreen will be recorded as a
                    violation.
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-red-600 font-bold mt-1">•</span>
                  <span>
                    Repeated fullscreen violations may result in automatic test
                    submission and your teacher will be notified.
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-red-600 font-bold mt-1">•</span>
                  <span>
                    You must allow{" "}
                    <span className="font-semibold">camera and microphone</span>{" "}
                    access before starting the test.
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-red-600 font-bold mt-1">•</span>
                  <span>
                    Your teacher may request to view your live camera or screen
                    feed during the test.
                  </span>
                </li>
              </ul>
            </div>

            {/* Permission Check Section */}
            {requireWebcam && (
              <div className="bg-blue-50 border-2 border-blue-200 rounded-2xl p-6 mb-6">
                <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <span className="text-2xl">🎥</span>
                  Proctoring Permissions
                </h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between bg-white rounded-xl p-4 border-2 border-gray-200">
                    <div className="flex items-center gap-3">
                      <Camera className="w-5 h-5 text-gray-700" />
                      <span className="font-medium text-gray-700">
                        Camera Access
                      </span>
                    </div>
                    {permissionsGranted.camera ? (
                      <div className="flex items-center gap-2 text-green-600">
                        <Check className="w-5 h-5" />
                        <span className="font-semibold">Granted</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 text-gray-400">
                        <X className="w-5 h-5" />
                        <span className="font-semibold">Not Checked</span>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center justify-between bg-white rounded-xl p-4 border-2 border-gray-200">
                    <div className="flex items-center gap-3">
                      <Mic className="w-5 h-5 text-gray-700" />
                      <span className="font-medium text-gray-700">
                        Microphone Access
                      </span>
                    </div>
                    {permissionsGranted.microphone ? (
                      <div className="flex items-center gap-2 text-green-600">
                        <Check className="w-5 h-5" />
                        <span className="font-semibold">Granted</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 text-gray-400">
                        <X className="w-5 h-5" />
                        <span className="font-semibold">Not Checked</span>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center justify-between bg-white rounded-xl p-4 border-2 border-gray-200">
                    <div className="flex items-center gap-3">
                      <svg
                        className="w-5 h-5 text-gray-700"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <rect
                          x="2"
                          y="3"
                          width="20"
                          height="14"
                          rx="2"
                          strokeWidth="2"
                        />
                        <line x1="8" y1="21" x2="16" y2="21" strokeWidth="2" />
                        <line x1="12" y1="17" x2="12" y2="21" strokeWidth="2" />
                      </svg>
                      <span className="font-medium text-gray-700">
                        Screen Share Access
                      </span>
                    </div>
                    {permissionsGranted.screen ? (
                      <div className="flex items-center gap-2 text-green-600">
                        <Check className="w-5 h-5" />
                        <span className="font-semibold">Granted</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 text-gray-400">
                        <X className="w-5 h-5" />
                        <span className="font-semibold">Not Checked</span>
                      </div>
                    )}
                  </div>

                  <button
                    onClick={checkPermissions}
                    disabled={checkingPermissions}
                    className="w-full px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {checkingPermissions
                      ? "Checking Permissions..."
                      : "Check Permissions"}
                  </button>
                </div>
              </div>
            )}

            {(errors.length > 0 || permissionErrors.length > 0) && (
              <div className="bg-red-50 border-2 border-red-300 rounded-2xl p-5 mb-6">
                <h4 className="text-red-700 font-semibold mb-2 flex items-center gap-2">
                  <span className="text-xl">⚠️</span>
                  Please fix the following before starting
                </h4>
                <ul className="list-disc pl-6 text-red-700 space-y-1">
                  {[...errors, ...permissionErrors].map((e, i) => (
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
                <label
                  htmlFor="require-webcam"
                  className="text-gray-800 font-medium"
                >
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
                  onClick={handleStartTest}
                  disabled={
                    requireWebcam &&
                    (!permissionsGranted.camera ||
                      !permissionsGranted.microphone)
                  }
                  className="flex-1 px-8 py-4 bg-gradient-to-r from-indigo-600 to-blue-600 text-white font-bold rounded-xl hover:from-indigo-700 hover:to-blue-700 transition-all shadow-lg hover:shadow-xl text-lg disabled:opacity-50 disabled:cursor-not-allowed"
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
