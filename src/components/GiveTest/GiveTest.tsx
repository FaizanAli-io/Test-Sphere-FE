"use client";

import React, { useEffect, useState } from "react";
import { useSearchParams, useRouter, useParams } from "next/navigation";

import {
  TestHeader,
  QuestionRenderer,
  TestInstructions,
  SubmitConfirmModal,
  FullscreenRequiredModal,
  FullscreenViolationWarning,
  StreamingIndicator,
} from "./components";

import {
  useTestExam,
  useTestMonitoring,
  useFullscreenMonitoring,
  useSystemEventMonitoring,
} from "./hooks";

import { useNotifications } from "@/contexts/NotificationContext";
import { useImageKitUploader } from "@/hooks/useImageKitUploader";
import { TEST_SECURITY_CONFIG } from "./constants";
import api, { API_BASE_URL } from "@/hooks/useApi";
import { getNetworkMonitor } from "@offline";

export default function GiveTest() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const params = useParams() as Record<string, string | string[]> | null;

  const routeIdRaw = params?.["testId"] ?? params?.["id"];
  const routeId = Array.isArray(routeIdRaw) ? routeIdRaw[0] : routeIdRaw;
  const qpId = searchParams?.get("testId") || searchParams?.get("id");
  const testIdParam = qpId || routeId || null;
  const testId = testIdParam ? Number(testIdParam) : null;

  const [showSubmitConfirm, setShowSubmitConfirm] = useState(false);
  const [requireWebcam, setRequireWebcam] = useState(true);
  const [showFullscreenModal, setShowFullscreenModal] = useState(false);
  const [startErrors, setStartErrors] = useState<string[]>([]);
  const [currentUserId, setCurrentUserId] = useState<string>("");
  const [initialWebcamStream, setInitialWebcamStream] = useState<
    MediaStream | undefined
  >();
  const [initialScreenStream, setInitialScreenStream] = useState<
    MediaStream | undefined
  >();

  const {
    test,
    answers,
    loading,
    submitting,
    error,
    testStarted,
    timeRemaining,
    submissionId,
    answeredCount,
    totalQuestions,
    progress,
    startTest,
    updateAnswer,
    submitTest,
    formatTime,
  } = useTestExam(testId);

  useImageKitUploader();
  const notifications = useNotifications();

  useEffect(() => {
    let ignore = false;
    const fetchMe = async () => {
      try {
        const res = await api("/auth/me", { auth: true, method: "GET" });
        if (!ignore && res.ok) {
          const me = await res.json();
          setCurrentUserId(String(me.id));
        }
      } catch {
        // ignore
      }
    };
    fetchMe();
    return () => {
      ignore = true;
    };
  }, []);

  // Initialize network monitor early to ensure offline logs are captured from the start
  useEffect(() => {
    try {
      const monitor = getNetworkMonitor(API_BASE_URL);
      monitor.start();
      console.log("🚀 Network monitor initialized for offline support");
    } catch (error) {
      console.error("Failed to initialize network monitor:", error);
    }
  }, []);

  // Initialize fullscreen monitoring first (needed for useTestMonitoring)
  const {
    isFullscreen,
    violationCount,
    showViolationWarning,
    countdownSeconds,
    isFullscreenSupported,
    enterFullscreen,
    dismissWarning,
  } = useFullscreenMonitoring({
    submissionId,
    isTestActive: testStarted,
    onViolationLimit: async () => {
      // Auto-submit test when violation limit is reached
      notifications.showError(
        "Test auto-submitted due to multiple fullscreen violations."
      );

      // Log violation data locally for reference (frontend only)

      await submitTest();
    },
    onExtendedFullscreenExit: async () => {
      // Auto-submit test when user stays out of fullscreen for too long
      notifications.showError(
        "Test auto-submitted due to extended fullscreen violation."
      );

      // Log violation data locally for reference (frontend only)

      await submitTest();
    },
  });

  // Initialize monitoring hook with randomized intervals (5-10 seconds)
  // Pass isFullscreen to control capture behavior:
  // - NOT in fullscreen: Take ONLY screenshots
  // - IN fullscreen: Take ONLY webcam photos
  const {
    videoRef,
    canvasRef,
    logs,
    requestScreenPermission,
    checkWebcamAvailable,
  } = useTestMonitoring({
    submissionId,
    isTestActive: testStarted,
    requireWebcam,
    isFullscreen,
    initialScreenStream,
  });

  // Initialize system event monitoring (clicks, keystrokes, focus changes)
  useSystemEventMonitoring({
    submissionId,
    isTestActive: testStarted,
  });

  // Detect multiple displays using the Window Management API when available
  const detectMultipleDisplays = async (): Promise<string | null> => {
    // Skip check if multiple displays are allowed
    if (TEST_SECURITY_CONFIG.ALLOW_MULTIPLE_DISPLAYS) {
      return null;
    }

    try {
      const anyNav = navigator as unknown as {
        userAgentData?: {
          getHighEntropyValues: (
            hints: string[]
          ) => Promise<{ platform?: string }>;
        };
      };
      const anyWin = window as unknown as {
        getScreenDetails?: () => Promise<{ screens: unknown[] }>;
      };

      if (typeof anyWin.getScreenDetails !== "function") {
        // API not supported; we cannot reliably detect multiple screens
        // Return a guidance error to keep policy strict, or null to allow. We enforce check only when supported.
        return null;
      }

      // Query permission for window-management
      if (anyNav.permissions?.query) {
        try {
          const status = await anyNav.permissions.query({
            // TS doesn't know this permission name yet
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            name: "window-management" as any,
          });

          if (status.state === "denied") {
            return "We need the 'Window Management' permission to verify you have only one display connected. Please allow the permission when prompted.";
          }
        } catch {
          // Ignore permission errors and attempt to call getScreenDetails
        }
      }

      const details = await anyWin.getScreenDetails();
      const count = Array.isArray(details?.screens)
        ? details.screens.length
        : 1;

      if (count > 1) {
        return "Multiple displays detected. Disconnect external monitors and use a single display to start the test.";
      }
      return null;
    } catch {
      // If anything fails, fail closed by asking the user to try again
      return "Unable to verify the number of connected displays. Please ensure only one display is connected and try again.";
    }
  };

  const handleStartTest = async (opts?: {
    requireWebcam: boolean;
    initialStream?: MediaStream;
    initialScreenStream?: MediaStream;
  }) => {
    // Reset previous persistent errors
    setStartErrors([]);

    const wantWebcam = opts?.requireWebcam ?? requireWebcam;

    // Store the initial streams if provided
    if (opts?.initialStream) {
      setInitialWebcamStream(opts.initialStream);
    }
    if (opts?.initialScreenStream) {
      setInitialScreenStream(opts.initialScreenStream);
    }

    // Check if fullscreen is supported
    if (!isFullscreenSupported()) {
      setStartErrors((prev) => [
        ...prev,
        "Fullscreen mode is not supported in your browser. Please use a modern browser to take this test.",
      ]);
      return;
    }

    // Require single-display environment before starting
    const multiDisplayError = await detectMultipleDisplays();
    if (multiDisplayError) {
      setStartErrors((prev) => [...prev, multiDisplayError]);
      return;
    }

    // If webcam is required, ensure it exists before starting
    if (wantWebcam) {
      const hasWebcam = await checkWebcamAvailable();
      if (!hasWebcam) {
        setStartErrors((prev) => [
          ...prev,
          "No webcam detected. Please connect a camera or disable 'Require webcam' to start.",
        ]);
        return;
      }
    }

    // Request screen-capture permission once, before test begins (user gesture)
    // Skip if initialScreenStream already provided from TestInstructions
    if (!initialScreenStream) {
      const screenPermissionGranted = await requestScreenPermission();
      if (!screenPermissionGranted) {
        setStartErrors((prev) => [
          ...prev,
          "Screen sharing permission is required to start the test. Please share your entire screen.",
        ]);
        return;
      }
    } else {
      console.log(
        "[GiveTest] Using initial screen stream from permission check, skipping requestScreenPermission"
      );
    }

    // Try to enter fullscreen mode
    const fullscreenEntered = await enterFullscreen();
    if (!fullscreenEntered) {
      setShowFullscreenModal(true);
      return;
    }

    // Update state to reflect final choice
    setRequireWebcam(wantWebcam);
    await startTest();
  };

  const handleRetryFullscreen = async () => {
    setShowFullscreenModal(false);
    const fullscreenEntered = await enterFullscreen();
    if (fullscreenEntered) {
      await startTest();
    } else {
      setShowFullscreenModal(true);
    }
  };

  const handleCancelFullscreen = () => {
    setShowFullscreenModal(false);
    router.push("/student");
  };

  const handleSubmitTest = async () => {
    // Log violation data locally for reference (frontend only)

    await submitTest();
    setShowSubmitConfirm(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-purple-50 to-indigo-50">
        <div className="text-center">
          <div className="relative">
            <div className="animate-spin rounded-full h-16 w-16 border-4 border-indigo-200"></div>
            <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-indigo-600 absolute top-0"></div>
          </div>
          <p className="mt-6 text-gray-600 font-semibold text-lg">
            Loading test...
          </p>
        </div>
      </div>
    );
  }

  if (error || !test) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 bg-gradient-to-br from-slate-50 via-purple-50 to-indigo-50">
        <div className="bg-white p-10 rounded-3xl shadow-2xl text-center max-w-md border-2 border-red-200">
          <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <span className="text-4xl">⚠️</span>
          </div>
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            Error Loading Test
          </h2>
          <p className="text-gray-600 mb-8 text-lg">
            {error || "Test not found"}
          </p>
          <button
            onClick={() => router.push("/student")}
            className="px-8 py-4 bg-gradient-to-r from-indigo-600 to-blue-600 text-white font-bold rounded-xl hover:from-indigo-700 hover:to-blue-700 transition-all shadow-lg hover:shadow-xl"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  if (!testStarted) {
    return (
      <TestInstructions
        test={test}
        onStartTest={handleStartTest}
        requireWebcam={requireWebcam}
        onToggleRequireWebcam={setRequireWebcam}
        onCancel={() => router.push("/student")}
        errors={startErrors}
      />
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-purple-50 to-indigo-50">
      {/* Hidden webcam video and canvas for monitoring */}
      <div style={{ display: "none" }}>
        <video ref={videoRef} autoPlay playsInline muted />
        <canvas ref={canvasRef} />
      </div>

      <TestHeader
        testTitle={test.title}
        answeredCount={answeredCount}
        totalQuestions={totalQuestions}
        timeRemaining={timeRemaining}
        formatTime={formatTime}
        progress={progress}
        onSubmitTest={() => setShowSubmitConfirm(true)}
        submitting={submitting}
        isCapturing={testStarted ? isCapturing : undefined}
        logsCount={testStarted ? logs.length : undefined}
        isFullscreen={testStarted ? isFullscreen : undefined}
        violationCount={testStarted ? violationCount : undefined}
      />

      {/* Questions */}
      <div className="max-w-5xl mx-auto px-4 py-8">
        <div className="space-y-8">
          {test.questions.map((question, index) => (
            <QuestionRenderer
              key={question.id}
              question={question}
              index={index}
              answer={answers[question.id]}
              onAnswerChange={updateAnswer}
            />
          ))}
        </div>

        {/* Submit Button at Bottom */}
        <div className="mt-8 bg-white rounded-2xl shadow-lg border-2 border-gray-200 p-6">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <p className="text-gray-900 font-bold text-lg">
                {answeredCount} of {totalQuestions} questions answered
              </p>
              <p className="text-gray-600 text-sm mt-1">
                {totalQuestions - answeredCount === 0
                  ? "All questions answered! You can submit now."
                  : `${totalQuestions - answeredCount} question${
                      totalQuestions - answeredCount !== 1 ? "s" : ""
                    } remaining`}
              </p>
            </div>
            <button
              onClick={() => setShowSubmitConfirm(true)}
              disabled={submitting}
              className="px-8 py-4 bg-gradient-to-r from-green-500 to-emerald-600 text-white font-bold rounded-xl hover:from-green-600 hover:to-emerald-700 transition-all shadow-lg hover:shadow-xl disabled:opacity-50 text-lg"
            >
              Submit Test
            </button>
          </div>
        </div>
      </div>

      <SubmitConfirmModal
        isOpen={showSubmitConfirm}
        answeredCount={answeredCount}
        totalQuestions={totalQuestions}
        submitting={submitting}
        onConfirm={handleSubmitTest}
        onCancel={() => setShowSubmitConfirm(false)}
      />

      {/* Fullscreen violation warning */}
      {showViolationWarning && (
        <FullscreenViolationWarning
          violationCount={violationCount}
          countdownSeconds={countdownSeconds}
          onDismiss={dismissWarning}
        />
      )}

      {/* Fullscreen required modal */}
      <FullscreenRequiredModal
        isOpen={showFullscreenModal}
        onTryAgain={handleRetryFullscreen}
        onCancel={handleCancelFullscreen}
      />

      {/* WebRTC Streaming Indicator - This enables live viewing by teachers */}
      {testStarted && currentUserId && (
        <StreamingIndicator
          userId={currentUserId}
          testId={testId?.toString() || ""}
          enabled={testStarted && requireWebcam}
          initialStream={initialWebcamStream}
          initialScreenStream={initialScreenStream}
        />
      )}
    </div>
  );
}
