import React, { useState, useEffect } from "react";

import { Submission, SubmissionsList, SubmissionDetail } from "../../Submissions";
import type { SubmissionStatus } from "../../Submissions/types";

interface SubmissionsModalProps {
  showSubmissionsModal: boolean;
  submissions: Submission[];
  onClose: () => void;
  loadingSubmissions: boolean;
  preSelectedSubmissionId?: number;
  onUpdateSubmissionStatus?: (id: number, newStatus: SubmissionStatus) => void;
  onUpdateSubmissionScores?: (id: number, updatedAnswers: Submission["answers"]) => void;
  topExtraContent?: React.ReactNode;
}

export default function SubmissionsModal({
  showSubmissionsModal,
  submissions,
  onClose,
  preSelectedSubmissionId,
  onUpdateSubmissionStatus,
  onUpdateSubmissionScores,
  topExtraContent,
}: SubmissionsModalProps) {
  const [selectedSubmission, setSelectedSubmission] = useState<Submission | null>(null);
  const [hasNavigatedBack, setHasNavigatedBack] = useState(false);

  // Auto-select submission if preSelectedSubmissionId is provided (only once)
  useEffect(() => {
    if (
      preSelectedSubmissionId &&
      submissions.length > 0 &&
      !selectedSubmission &&
      !hasNavigatedBack
    ) {
      const submission = submissions.find((s) => s.id === preSelectedSubmissionId);
      if (submission) {
        setSelectedSubmission(submission);
      }
    }
  }, [preSelectedSubmissionId, submissions, selectedSubmission, hasNavigatedBack]);

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

  // Status update handled via onUpdateSubmissionStatus and local selectedSubmission update below

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
      onUpdateStatus={(id, newStatus) => {
        // update selected locally for immediate feedback
        setSelectedSubmission((prev) =>
          prev && prev.id === id ? { ...prev, status: newStatus } : prev,
        );
        // propagate to parent so list and section update
        onUpdateSubmissionStatus?.(id, newStatus);
      }}
      onUpdateScores={(id, updatedAnswers) => {
        // update selected locally for immediate feedback
        setSelectedSubmission((prev) =>
          prev && prev.id === id ? { ...prev, answers: updatedAnswers } : prev,
        );
        // propagate to parent so list and section update
        onUpdateSubmissionScores?.(id, updatedAnswers);
      }}
      topExtraContent={topExtraContent}
    />
  );
}
