"use client";

import React, { useState } from "react";
import { IKContext } from "imagekitio-react";
import { useSearchParams, useRouter, useParams } from "next/navigation";

import {
  TestHeader,
  useTestExam,
  QuestionRenderer,
  TestInstructions,
  SubmitConfirmModal,
  useFullscreenMonitoring,
  FullscreenViolationWarning,
  FullscreenRequiredModal,
} from "./index";
import { useTestMonitoring } from "./hooks/useTestMonitoring";
import { useImageKitUploader } from "@/hooks/useImageKitUploader";
import { useNotifications } from "@/contexts/NotificationContext";

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

  const { config } = useImageKitUploader();
  const notifications = useNotifications();

  // Initialize fullscreen monitoring first (needed for useTestMonitoring)
  const {
    isFullscreen,
    violationCount,
    showViolationWarning,
    countdownSeconds,
    maxViolations,
    isFullscreenSupported,
    enterFullscreen,
    dismissWarning,
  } = useFullscreenMonitoring({
    submissionId,
    isTestActive: testStarted,
    onViolationLimit: async () => {
      // Auto-submit test when violation limit is reached
      notifications.showError(
        `Test auto-submitted due to ${maxViolations} fullscreen violations.`
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
    isCapturing,
    requestScreenPermission,
    checkWebcamAvailable,
  } = useTestMonitoring({
    submissionId,
    isTestActive: testStarted,
    requireWebcam,
    isFullscreen,
  });

  const handleStartTest = async (opts?: { requireWebcam: boolean }) => {
    const wantWebcam = opts?.requireWebcam ?? requireWebcam;

    // Check if fullscreen is supported
    if (!isFullscreenSupported()) {
      notifications.showError(
        "Fullscreen mode is not supported in your browser. Please use a modern browser to take this test."
      );
      return;
    }

    // If webcam is required, ensure it exists before starting
    if (wantWebcam) {
      const hasWebcam = await checkWebcamAvailable();
      if (!hasWebcam) {
        notifications.showError(
          "No webcam detected. Please connect a camera or disable 'Require webcam' to start."
        );
        return;
      }
    }

    // Request screen-capture permission once, before test begins (user gesture)
    const screenPermissionGranted = await requestScreenPermission();
    if (!screenPermissionGranted) {
      notifications.showError(
        "Screen sharing permission is required to start the test. Please share your entire screen."
      );
      return;
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

      {/* Monitoring indicator */}
      {testStarted && config && (
        <IKContext
          publicKey={config.publicKey}
          urlEndpoint={config.urlEndpoint}
          authenticator={async () => ({ signature: "", expire: 0, token: "" })}
        >
          <div className="fixed top-24 right-4 space-y-2 z-50">
            {/* Screen monitoring indicator */}
            <div className="bg-white rounded-lg shadow-lg p-3 border border-gray-200">
              <div className="flex items-center gap-2">
                <div
                  className={`w-2 h-2 rounded-full ${
                    isCapturing ? "bg-red-500 animate-pulse" : "bg-green-500"
                  }`}
                />
                <span className="text-xs font-medium text-gray-700">
                  {isCapturing ? "Capturing..." : "Monitoring Active"}
                </span>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                {logs.length} snapshots taken
              </p>
            </div>

            {/* Fullscreen status indicator */}
            <div className="bg-white rounded-lg shadow-lg p-3 border border-gray-200">
              <div className="flex items-center gap-2">
                <div
                  className={`w-2 h-2 rounded-full ${
                    isFullscreen ? "bg-green-500" : "bg-red-500"
                  }`}
                />
                <span className="text-xs font-medium text-gray-700">
                  {isFullscreen ? "Fullscreen Active" : "Fullscreen Required"}
                </span>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Violations: {violationCount}/{maxViolations}
              </p>
            </div>
          </div>
        </IKContext>
      )}

      <TestHeader
        testTitle={test.title}
        answeredCount={answeredCount}
        totalQuestions={totalQuestions}
        timeRemaining={timeRemaining}
        formatTime={formatTime}
        progress={progress}
        onSubmitTest={() => setShowSubmitConfirm(true)}
        submitting={submitting}
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
          maxViolations={maxViolations}
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
    </div>
  );
}
