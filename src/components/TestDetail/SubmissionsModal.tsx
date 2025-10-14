import React, { useState, useEffect } from "react";

import { Submission, SubmissionsList, SubmissionDetail } from "../Submissions";

interface SubmissionsModalProps {
  showSubmissionsModal: boolean;
  submissions: Submission[];
  onClose: () => void;
  loadingSubmissions: boolean;
  preSelectedSubmissionId?: number;
  fetchSubmissionDetails: (submissionId: number) => Promise<Submission>;
}

export default function SubmissionsModal({
  showSubmissionsModal,
  submissions,
  onClose,
  preSelectedSubmissionId,
  fetchSubmissionDetails
}: SubmissionsModalProps) {
  const [selectedSubmission, setSelectedSubmission] =
    useState<Submission | null>(null);
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
            .then((detailedSubmission) => {
              // Update the local selected submission with the detailed data
              setSelectedSubmission(detailedSubmission);
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
    fetchSubmissionDetails
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

  const handleSelectSubmission = async (submission: Submission) => {
    setHasNavigatedBack(false);
    setSelectedSubmission(submission);

    // Only show loading if we need to fetch detailed data
    const hasDetailedData =
      submission.test || submission.answers?.some((a) => a.question);

    if (!hasDetailedData) {
      setLoadingSubmissionDetails(true);
      try {
        const detailedSubmission = await fetchSubmissionDetails(submission.id);
        // Update the local selected submission with the detailed data
        setSelectedSubmission(detailedSubmission);
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

  // Wrapper function to update local state after fetching details
  const handleFetchSubmissionDetails = async (submissionId: number) => {
    const detailedSubmission = await fetchSubmissionDetails(submissionId);
    // Update the local selected submission with fresh data
    setSelectedSubmission(detailedSubmission);
    return detailedSubmission;
  };

  // Show detail view
  return (
    <SubmissionDetail
      isOpen={true}
      submission={selectedSubmission}
      viewContext="teacher"
      onBack={handleBackToList}
      onClose={onClose}
      loadingSubmissionDetails={loadingSubmissionDetails}
      fetchSubmissionDetails={handleFetchSubmissionDetails}
    />
  );
}
