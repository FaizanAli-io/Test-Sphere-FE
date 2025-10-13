import React, { useState, useEffect } from "react";

import { SubmissionItem } from "./types";
import SubmissionsList from "../Submissions/SubmissionsList";
import SubmissionDetail from "../Submissions/SubmissionDetail";

interface SubmissionsModalProps {
  showSubmissionsModal: boolean;
  submissions: SubmissionItem[];
  onClose: () => void;
  onGradeSubmission: (submissionId: string, marks: number) => Promise<void>;
  onUpdateIndividualScore: (
    submissionId: string,
    questionIndex: number,
    score: number
  ) => Promise<void>;
  loadingSubmissions: boolean;
  preSelectedSubmissionId?: number;
  fetchSubmissionDetails: (submissionId: number) => Promise<SubmissionItem>;
}

export default function SubmissionsModal({
  showSubmissionsModal,
  submissions,
  onClose,
  preSelectedSubmissionId,
  fetchSubmissionDetails,
}: SubmissionsModalProps) {
  const [selectedSubmission, setSelectedSubmission] =
    useState<SubmissionItem | null>(null);
  const [loadingSubmissionDetails, setLoadingSubmissionDetails] =
    useState(false);
  const [hasNavigatedBack, setHasNavigatedBack] = useState(false);

  // Auto-select submission if preSelectedSubmissionId is provided (only once)
  useEffect(() => {
    if (
      preSelectedSubmissionId &&
      submissions.length > 0 &&
      !selectedSubmission &&
      !hasNavigatedBack
    ) {
      const submission = submissions.find(
        (s) => s.id === preSelectedSubmissionId
      );
      if (submission) {
        setSelectedSubmission(submission);

        // Only fetch detailed data if not already available
        const hasDetailedData =
          submission.test || submission.answers?.some((a) => a.question);

        if (!hasDetailedData) {
          setLoadingSubmissionDetails(true);
          fetchSubmissionDetails(submission.id)
            .then(() => {
              setLoadingSubmissionDetails(false);
            })
            .catch((err) => {
              console.error(
                "Failed to fetch preselected submission details:",
                err
              );
              setLoadingSubmissionDetails(false);
            });
        }
      }
    }
  }, [
    preSelectedSubmissionId,
    submissions,
    selectedSubmission,
    hasNavigatedBack,
    fetchSubmissionDetails,
  ]);

  // Reset states when modal closes
  useEffect(() => {
    if (!showSubmissionsModal) {
      setSelectedSubmission(null);
      setLoadingSubmissionDetails(false);
      setHasNavigatedBack(false);
    }
  }, [showSubmissionsModal]);

  if (!showSubmissionsModal) return null;

  const handleSelectSubmission = async (submission: SubmissionItem) => {
    setHasNavigatedBack(false);
    setSelectedSubmission(submission);

    // Only show loading if we need to fetch detailed data
    const hasDetailedData =
      submission.test || submission.answers?.some((a) => a.question);

    if (!hasDetailedData) {
      setLoadingSubmissionDetails(true);
      try {
        await fetchSubmissionDetails(submission.id);
      } catch (err) {
        console.error("Failed to fetch submission details:", err);
      } finally {
        setLoadingSubmissionDetails(false);
      }
    }
  };

  const handleBackToList = () => {
    setHasNavigatedBack(true);
    setSelectedSubmission(null);
    setLoadingSubmissionDetails(false);
  };

  // Show list view
  if (!selectedSubmission) {
    return (
      <SubmissionsList
        submissions={submissions}
        onClose={onClose}
        onSelectSubmission={handleSelectSubmission}
      />
    );
  }

  // Show detail view
  return (
    <SubmissionDetail
      submission={selectedSubmission}
      onBack={handleBackToList}
      onClose={onClose}
      loadingSubmissionDetails={loadingSubmissionDetails}
      fetchSubmissionDetails={fetchSubmissionDetails}
    />
  );
}
