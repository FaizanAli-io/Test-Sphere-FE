import React, { useState, useEffect } from "react";

import { Submission, SubmissionsList, SubmissionDetail } from "../Submissions";

interface SubmissionsModalProps {
  showSubmissionsModal: boolean;
  submissions: Submission[];
  onClose: () => void;
  loadingSubmissions: boolean;
  preSelectedSubmissionId?: number;
}

export default function SubmissionsModal({
  showSubmissionsModal,
  submissions,
  onClose,
  preSelectedSubmissionId
}: SubmissionsModalProps) {
  const [selectedSubmission, setSelectedSubmission] =
    useState<Submission | null>(null);
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
      }
    }
  }, [
    preSelectedSubmissionId,
    submissions,
    selectedSubmission,
    hasNavigatedBack
  ]);

  // Reset states when modal closes
  useEffect(() => {
    if (!showSubmissionsModal) {
      setSelectedSubmission(null);
      setHasNavigatedBack(false);
    }
  }, [showSubmissionsModal]);

  if (!showSubmissionsModal) return null;

  const handleSelectSubmission = (submission: Submission) => {
    setHasNavigatedBack(false);
    setSelectedSubmission(submission);
  };

  const handleBackToList = () => {
    setHasNavigatedBack(true);
    setSelectedSubmission(null);
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
      isOpen={true}
      submission={selectedSubmission}
      viewContext="teacher"
      onBack={handleBackToList}
      onClose={onClose}
    />
  );
}
