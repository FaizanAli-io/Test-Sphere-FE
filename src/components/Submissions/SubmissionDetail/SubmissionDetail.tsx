import React, { useState } from "react";

import api from "@/hooks/useApi";
import { useNotification } from "@/hooks/useNotification";
import { SubmissionDetailProps, SubmissionStatus } from "../types";
import { calculateCurrentTotalMarks, calculateTotalPossibleMarks } from "../utils";

import SubmissionHeader from "./SubmissionHeader";
import ScoreSummary from "./ScoreSummary";
import TestInfo from "./TestInfo";
import Timeline from "./Timeline";
import QuestionItem from "./QuestionItem";
import GradingActions from "./GradingActions";

export default function SubmissionDetail(props: SubmissionDetailProps) {
  const {
    isOpen,
    onClose,
    onBack,
    submission,
    viewContext,
    onUpdateStatus,
    onUpdateScores,
    topExtraContent,
  } = props;
  const [gradingScores, setGradingScores] = useState<Record<string, number>>({});
  const [loadingBulkUpdate, setLoadingBulkUpdate] = useState(false);
  const notifications = useNotification();

  if (!isOpen || !submission) return null;

  const isTeacherView = viewContext === "teacher";
  const totalPossible = calculateTotalPossibleMarks(submission.answers);
  const currentTotal = calculateCurrentTotalMarks(submission.answers);

  const handleScoreChange = (submissionId: number, questionIndex: number, score: number) => {
    const key = `${submissionId}-${questionIndex}`;
    setGradingScores((prev) => ({ ...prev, [key]: score }));
  };

  const handleBulkUpdateScores = async () => {
    if (!submission || Object.keys(gradingScores).length === 0) return;

    setLoadingBulkUpdate(true);
    try {
      const answers = Object.entries(gradingScores).map(([key, obtainedMarks]) => {
        const [, questionIndex] = key.split("-");
        const questionIdx = parseInt(questionIndex);

        const answer = submission.answers?.[questionIdx];
        if (!answer) {
          throw new Error(`Answer not found for question index ${questionIdx}`);
        }

        return { answerId: answer.id, obtainedMarks };
      });

      const response = await api(`/submissions/${submission.id}/grade`, {
        body: JSON.stringify({ answers }),
        method: "POST",
        auth: true,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to update scores");
      }

      await response.json();

      notifications.showSuccess(`Updated ${answers.length} score(s) successfully`);

      // Update parent state with new scores
      if (onUpdateScores && submission.answers) {
        const updatedAnswers = submission.answers.map((answer, idx) => {
          const key = `${submission.id}-${idx}`;
          const newScore = gradingScores[key];
          if (newScore !== undefined) {
            return { ...answer, obtainedMarks: newScore };
          }
          return answer;
        });
        onUpdateScores(submission.id, updatedAnswers);
      }

      setGradingScores({});
    } catch (error) {
      console.error("Failed to update scores:", error);
      notifications.showError(error instanceof Error ? error.message : "Failed to update scores");
    } finally {
      setLoadingBulkUpdate(false);
    }
  };

  const handleStatusUpdate = async (newStatus: SubmissionStatus) => {
    if (!submission) return;

    try {
      const response = await api(`/submissions/${submission.id}/status`, {
        method: "PATCH",
        auth: true,
        body: JSON.stringify({ status: newStatus }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to update status");
      }

      notifications.showSuccess(`Submission marked as ${newStatus.toLowerCase()} successfully`);

      // Update status in parent state
      if (onUpdateStatus) {
        onUpdateStatus(submission.id, newStatus);
      }
    } catch (error) {
      console.error("Failed to update status:", error);
      notifications.showError(error instanceof Error ? error.message : "Failed to update status");
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-3xl w-full max-w-5xl shadow-2xl overflow-hidden max-h-[90vh] overflow-y-auto relative">
        {/* Loading Overlay */}
        {loadingBulkUpdate && (
          <div className="absolute inset-0 bg-white/80 backdrop-blur-sm flex items-center justify-center z-50 rounded-3xl">
            <div className="bg-white rounded-2xl shadow-2xl p-8 flex flex-col items-center">
              <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-purple-600 mb-4"></div>
              <p className="text-lg font-semibold text-gray-900">Updating scores...</p>
              <p className="text-sm text-gray-600 mt-2">Please wait</p>
            </div>
          </div>
        )}

        <SubmissionHeader
          submission={submission}
          onBack={onBack}
          onClose={onClose}
          isTeacherView={isTeacherView}
        />

        <div className="p-6 space-y-6">
          <ScoreSummary
            isTeacherView={isTeacherView}
            submission={submission}
            totalPossible={totalPossible}
            currentTotal={currentTotal}
            onBack={onBack}
            handleStatusUpdate={handleStatusUpdate}
            topExtraContent={topExtraContent}
          />

          <TestInfo submission={submission} />

          <Timeline submission={submission} isTeacherView={isTeacherView} />

          {/* Questions */}
          <div className="space-y-6">
            {submission.answers?.map((answer, index) => (
              <QuestionItem
                key={answer.id}
                answer={answer}
                index={index}
                submissionId={submission.id}
                gradingScores={gradingScores}
                onScoreChange={handleScoreChange}
                isTeacherView={isTeacherView}
              />
            ))}
          </div>

          {isTeacherView && (
            <GradingActions
              gradingScores={gradingScores}
              handleBulkUpdateScores={handleBulkUpdateScores}
              loadingBulkUpdate={loadingBulkUpdate}
            />
          )}

          {/* Footer Actions */}
          <div className="flex justify-between pt-6 border-t border-gray-200">
            {isTeacherView && onBack ? (
              <button
                onClick={onBack}
                className="px-6 py-3 bg-gray-100 text-gray-700 font-bold rounded-xl hover:bg-gray-200 transition-all"
              >
                ← Back to List
              </button>
            ) : (
              <div></div>
            )}
            <button
              onClick={onClose}
              className={`px-6 py-3 font-bold rounded-xl transition-all ${
                isTeacherView
                  ? "bg-purple-500 text-white hover:bg-purple-600"
                  : "bg-green-500 text-white hover:bg-green-600"
              }`}
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
