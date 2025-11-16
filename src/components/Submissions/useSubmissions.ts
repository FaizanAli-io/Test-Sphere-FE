import { useState, useCallback, useEffect } from "react";
import api from "../../hooks/useApi";
import { Submission, ViewContext, GradeSubmissionPayload, NotificationFunctions } from "./types";
import { normalizeSubmission } from "./utils";

/**
 * Unified hook for managing submissions in both teacher and student contexts
 */
export const useSubmissions = (
  testId?: string,
  viewContext: ViewContext = "teacher",
  notifications?: NotificationFunctions,
) => {
  const [showSubmissionsModal, setShowSubmissionsModal] = useState(false);
  const [submissionsLoading, setSubmissionsLoading] = useState(false);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [selectedSubmission, setSelectedSubmission] = useState<Submission | null>(null);
  // Removed loadingSubmissionDetails - using rich data from list API

  /**
   * Fetch submissions based on context
   * - Teacher: GET /submissions/test/{testId}
   * - Student: GET /submissions/student
   */
  const fetchSubmissions = useCallback(async () => {
    setSubmissionsLoading(true);

    try {
      const endpoint =
        viewContext === "teacher" ? `/submissions/test/${testId}` : "/submissions/student";

      const response = await api(endpoint, {
        method: "GET",
        auth: true,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to fetch submissions");
      }

      const data = await response.json();

      const normalizedSubmissions: Submission[] = Array.isArray(data)
        ? data.map(normalizeSubmission)
        : [];

      setSubmissions(normalizedSubmissions);
    } catch (err) {
      console.error("Failed to fetch submissions:", err);
      notifications?.showError(err instanceof Error ? err.message : "Failed to fetch submissions");
      setSubmissions([]);
    } finally {
      setSubmissionsLoading(false);
    }
  }, [testId, viewContext, notifications]);

  // Removed fetchSubmissionDetails - using rich data from list API calls

  /**
   * Grade a submission (teacher only)
   * POST /submissions/{submissionId}/grade
   */
  const gradeSubmission = useCallback(
    async (submissionId: number, payload: GradeSubmissionPayload) => {
      if (viewContext !== "teacher") {
        notifications?.showError("Only teachers can grade submissions");
        return false;
      }

      try {
        const response = await api(`/submissions/${submissionId}/grade`, {
          method: "POST",
          auth: true,
          body: JSON.stringify(payload),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || "Failed to grade submission");
        }

        const result = await response.json();
        const updatedSubmission = normalizeSubmission(result);

        setSubmissions((prevSubmissions) =>
          prevSubmissions.map((submission) =>
            submission.id === submissionId ? updatedSubmission : submission,
          ),
        );

        if (selectedSubmission?.id === submissionId) {
          setSelectedSubmission(updatedSubmission);
        }

        notifications?.showSuccess(`Graded ${payload.answers.length} answer(s) successfully`);
        return true;
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : "Failed to grade submission";
        notifications?.showError(errorMessage);
        return false;
      }
    },
    [viewContext, notifications, selectedSubmission?.id],
  );

  const deleteSubmission = useCallback(
    async (submissionId: number) => {
      if (viewContext !== "teacher") {
        notifications?.showError("Only teachers can delete submissions");
        return false;
      }

      try {
        const response = await api(`/submissions/${submissionId}`, {
          method: "DELETE",
          auth: true,
        });

        if (!response.ok) {
          let errorMessage = "Failed to delete submission";
          try {
            const errorData = await response.json();
            errorMessage = errorData.message || errorMessage;
          } catch {
            // ignore parse error (e.g., 204 No Content)
          }
          throw new Error(errorMessage);
        }

        // Some APIs return 204 No Content, so no JSON parse here
        setSubmissions((prev) => prev.filter((submission) => submission.id !== submissionId));
        if (selectedSubmission?.id === submissionId) {
          setSelectedSubmission(null);
        }

        notifications?.showSuccess("Submission deleted successfully");
        return true;
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : "Failed to delete submission";
        notifications?.showError(errorMessage);
        return false;
      }
    },
    [viewContext, notifications, selectedSubmission?.id],
  );

  /**
   * Open submissions modal and fetch data
   */
  const openSubmissionsModal = useCallback(async () => {
    setShowSubmissionsModal(true);
    await fetchSubmissions();
  }, [fetchSubmissions]);

  /**
   * Select a submission for detailed view
   */
  const selectSubmission = useCallback((submission: Submission) => {
    setSelectedSubmission(submission);
    // Rich data is already available from list API - no need to fetch details
  }, []);

  /**
   * Close submission detail view
   */
  const closeSubmissionDetail = useCallback(() => {
    setSelectedSubmission(null);
  }, []);

  /**
   * Get submissions for a specific test (student context)
   */
  const getSubmissionForTest = useCallback(
    (testId: number): Submission | undefined => {
      return submissions.find((sub) => sub.testId === testId);
    },
    [submissions],
  );

  /**
   * Filter submissions by class (student context)
   */
  const getSubmissionsForClass = useCallback(
    (classId: number): Submission[] => {
      return submissions.filter((sub) => sub.test?.classId === classId);
    },
    [submissions],
  );

  useEffect(() => {
    if (viewContext === "teacher" && testId) {
      fetchSubmissions();
    } else if (viewContext === "student") {
      fetchSubmissions();
    }
  }, [viewContext, testId, fetchSubmissions]);

  return {
    showSubmissionsModal,
    setShowSubmissionsModal,

    submissions,
    submissionsLoading,
    selectedSubmission,

    fetchSubmissions,
    gradeSubmission,
    deleteSubmission,

    openSubmissionsModal,
    selectSubmission,
    closeSubmissionDetail,

    getSubmissionForTest,
    getSubmissionsForClass,

    setSubmissions,
    setSelectedSubmission,
  };
};
