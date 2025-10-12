import { useState, useCallback, useEffect } from "react";
import api from "../../../hooks/useApi";
import {
  SubmissionItem,
  SubmissionAnswer,
  GradingStatus,
  SubmissionStatus,
  GradeSubmissionPayload,
  NotificationFunctions
} from "../types";

/**
 * Hook for managing test submissions and grading
 */
export const useSubmissions = (
  testId: string,
  notifications?: NotificationFunctions
) => {
  const [showSubmissionsModal, setShowSubmissionsModal] = useState(false);
  const [submissionsLoading, setSubmissionsLoading] = useState(false);
  const [submissions, setSubmissions] = useState<SubmissionItem[]>([]);
  const [preSelectedSubmissionId, setPreSelectedSubmissionId] = useState<
    number | undefined
  >();
  const [gradeDraft, setGradeDraft] = useState<
    Record<number, Record<number, number>>
  >({});

  const fetchSubmissions = useCallback(async () => {
    if (!testId) return;
    setSubmissionsLoading(true);

    try {
      const response = await api(`/submissions/test/${testId}`, {
        method: "GET",
        auth: true
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to fetch submissions");
      }

      const data = await response.json();

      // Normalize the data structure to handle various API response formats
      const normalized: SubmissionItem[] = Array.isArray(data)
        ? data.map((s: any) => ({
            id: Number(s.id ?? s.submissionId ?? s.submission?.id),
            student: s.student ?? s.user ?? s.learner ?? undefined,
            totalMarks: s.totalMarks ?? s.maxMarks ?? undefined,
            obtainedMarks: s.obtainedMarks ?? s.score ?? null,
            answers: Array.isArray(s.answers)
              ? s.answers.map((ans: any) => ({
                  id: Number(ans.id ?? ans.answerId),
                  questionId: ans.questionId,
                  questionText: ans.questionText ?? ans.question?.text,
                  questionType: ans.questionType ?? ans.question?.type,
                  maxMarks: ans.maxMarks ?? ans.question?.maxMarks,
                  answer: ans.answer ?? ans.text,
                  obtainedMarks: ans.obtainedMarks ?? ans.score ?? null,
                  isAutoEvaluated:
                    ans.isAutoEvaluated ?? ans.autoGraded ?? false,
                  gradingStatus: (ans.gradingStatus ??
                    ans.status ??
                    "PENDING") as GradingStatus
                }))
              : [],
            status: (s.status ??
              s.submissionStatus ??
              "SUBMITTED") as SubmissionStatus,
            submittedAt: s.submittedAt,
            gradedAt: s.gradedAt,
            startedAt: s.startedAt
          }))
        : [];

      setSubmissions(normalized.filter((s) => Number.isFinite(s.id)));
    } catch (err) {
      console.error("Failed to fetch submissions:", err);
      notifications?.showError(
        err instanceof Error ? err.message : "Failed to fetch submissions"
      );
      setSubmissions([]);
    } finally {
      setSubmissionsLoading(false);
    }
  }, [testId, notifications]);

  const fetchSubmissionDetails = useCallback(
    async (submissionId: number) => {
      try {
        const response = await api(`/submissions/${submissionId}`, {
          method: "GET",
          auth: true
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(
            errorData.message || "Failed to fetch submission details"
          );
        }

        const detailedSubmission = await response.json();

        // Update the specific submission in the submissions array with detailed data
        setSubmissions((prevSubmissions) =>
          prevSubmissions.map((submission) =>
            submission.id === submissionId
              ? { ...submission, ...detailedSubmission }
              : submission
          )
        );

        return detailedSubmission;
      } catch (err) {
        console.error("Failed to fetch submission details:", err);
        notifications?.showError(
          err instanceof Error
            ? err.message
            : "Failed to fetch submission details"
        );
        throw err;
      }
    },
    [notifications]
  );

  const gradeSubmission = useCallback(
    async (submissionId: number, payload: GradeSubmissionPayload) => {
      try {
        const response = await api(`/submissions/${submissionId}/grade`, {
          method: "POST",
          auth: true,
          body: JSON.stringify(payload)
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || "Failed to grade submission");
        }

        const result = await response.json();

        // Update local state with graded submission
        setSubmissions((prevSubmissions) =>
          prevSubmissions.map((submission) =>
            submission.id === submissionId
              ? {
                  ...submission,
                  ...result,
                  status: "GRADED" as SubmissionStatus
                }
              : submission
          )
        );

        notifications?.showSuccess(
          `Graded ${payload.answers.length} answer(s) successfully`
        );
        return true;
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Failed to grade submission";
        notifications?.showError(errorMessage);
        return false;
      }
    },
    [notifications]
  );

  const openSubmissionsModal = useCallback(async () => {
    setShowSubmissionsModal(true);
    await fetchSubmissions();
  }, [fetchSubmissions]);

  const updateDraftMark = useCallback(
    (submissionId: number, answerId: number, value: number, max?: number) => {
      const safe = Math.max(
        0,
        typeof max === "number" ? Math.min(value, max) : value
      );
      setGradeDraft((prev) => ({
        ...prev,
        [submissionId]: { ...(prev[submissionId] || {}), [answerId]: safe }
      }));
    },
    []
  );

  const submitGrades = useCallback(
    async (submission: SubmissionItem) => {
      const draft = gradeDraft[submission.id] || {};
      const answersPayload = Object.entries(draft).map(
        ([answerId, obtainedMarks]) => ({
          answerId: Number(answerId),
          obtainedMarks
        })
      );

      if (answersPayload.length === 0) {
        notifications?.showWarning(
          "No manual grades to submit for this submission."
        );
        return;
      }

      setSubmissionsLoading(true);
      try {
        const response = await api(`/submissions/${submission.id}/grade`, {
          method: "POST",
          auth: true,
          body: JSON.stringify({ answers: answersPayload })
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || "Failed to grade submission");
        }

        // Update local state instead of refetching
        setSubmissions((prevSubmissions) =>
          prevSubmissions.map((s) => {
            if (s.id === submission.id) {
              const updatedAnswers = s.answers?.map((answer) => {
                const gradeUpdate = answersPayload.find(
                  (ap) => ap.answerId === answer.id
                );
                if (gradeUpdate) {
                  return {
                    ...answer,
                    obtainedMarks: gradeUpdate.obtainedMarks,
                    gradingStatus: "GRADED" as GradingStatus
                  };
                }
                return answer;
              });

              // Calculate total obtained marks
              const totalObtained =
                updatedAnswers?.reduce(
                  (sum, ans) => sum + (ans.obtainedMarks ?? 0),
                  0
                ) ?? 0;

              return {
                ...s,
                answers: updatedAnswers,
                obtainedMarks: totalObtained,
                status: "GRADED" as SubmissionStatus,
                gradedAt: new Date().toISOString()
              };
            }
            return s;
          })
        );

        // Clear the draft for this submission
        setGradeDraft((prev) => {
          const updated = { ...prev };
          delete updated[submission.id];
          return updated;
        });

        notifications?.showSuccess("Submission graded successfully");
      } catch (err) {
        notifications?.showError(
          err instanceof Error ? err.message : "Failed to grade submission"
        );
      } finally {
        setSubmissionsLoading(false);
      }
    },
    [gradeDraft, notifications]
  );

  // Auto-fetch submissions when testId changes
  useEffect(() => {
    if (testId) {
      fetchSubmissions();
    }
  }, [testId, fetchSubmissions]);

  return {
    showSubmissionsModal,
    setShowSubmissionsModal,
    submissionsLoading,
    submissions,
    preSelectedSubmissionId,
    setPreSelectedSubmissionId,
    openSubmissionsModal,
    fetchSubmissions,
    fetchSubmissionDetails,
    gradeSubmission,
    setSubmissions,
    gradeDraft,
    updateDraftMark,
    submitGrades
  };
};
