"use client";

import React, { useState, useEffect } from "react";
import { BookOpen } from "lucide-react";

import {
  useClassDetails,
  useNotifications,
  useTestsForClass,
  useStudentClasses,
  useAllTests,
  useStudentSubmissions,
} from "./hooks";
import { ClassData, StudentSubmission } from "./types";
import {
  JoinClassModal,
  ClassDetailsModal,
  TestsModal,
  SubmissionsListModal,
} from "./Modals";
import { StudentSubmissionViewModal } from "./StudentSubmissionViewModal";
import { BasePortal, QuickAction, ClassCardAction, BaseClass } from "../shared";

export default function StudentPortal() {
  // Hook-based state management
  const {
    classes,
    loading,
    error: classesError,
    fetchClasses,
    joinClass,
    leaveClass,
  } = useStudentClasses();

  const {
    selectedClass,
    loadingDetails,
    error: detailsError,
    fetchClassDetails: _fetchClassDetails, // eslint-disable-line @typescript-eslint/no-unused-vars
  } = useClassDetails();

  const {
    tests,
    testsLoading,
    error: testsError,
    fetchTestsForClass,
    setTests,
    setError: setTestsError,
  } = useTestsForClass();

  const {
    allTests,
    allTestsLoading,
    allTestsError,
    fetchAllTests: _fetchAllTests, // eslint-disable-line @typescript-eslint/no-unused-vars
    setAllTests,
    setAllTestsError,
  } = useAllTests();

  const {
    success,
    error: notificationError,
    copiedCode,
    showSuccess,
    showError,
    clearError,
    handleCopyCode: originalHandleCopyCode,
  } = useNotifications();

  const {
    submissions,
    loading: submissionsLoading,
    error: submissionsError,
    fetchSubmissions,
  } = useStudentSubmissions();

  // Local state for modals and form inputs
  const [classCode, setClassCode] = useState("");
  const [joining, setJoining] = useState(false);
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showTestsModal, setShowTestsModal] = useState(false);
  const [testsForClass, setTestsForClass] = useState<number | null>(null);
  const [showSubmissionModal, setShowSubmissionModal] = useState(false);
  const [selectedSubmission, setSelectedSubmission] =
    useState<StudentSubmission | null>(null);
  const [showSubmissionsListModal, setShowSubmissionsListModal] =
    useState(false);
  const [submissionsForClass, setSubmissionsForClass] = useState<number | null>(
    null
  );

  // Fetch submissions on component mount
  useEffect(() => {
    fetchSubmissions();
  }, [fetchSubmissions]);

  // Event handlers
  const handleJoinClass = async () => {
    if (!classCode.trim()) {
      showError("Please enter a class code");
      return;
    }

    setJoining(true);
    clearError();

    try {
      await joinClass(classCode);
      showSuccess("Successfully joined the class!");
      setClassCode("");
      setShowJoinModal(false);
      setTimeout(() => {
        fetchClasses();
      }, 2000);
    } catch (err: unknown) {
      showError(
        err instanceof Error ? err.message : "An unexpected error occurred"
      );
    } finally {
      setJoining(false);
    }
  };

  const handleLeaveClass = async (id: number, name: string) => {
    const confirmed = window.confirm(
      `Are you sure you want to leave "${name}"?`
    );
    if (!confirmed) return;

    clearError();
    try {
      await leaveClass(id);
      showSuccess("Successfully left the class");
    } catch (err: unknown) {
      showError(
        err instanceof Error ? err.message : "An unexpected error occurred"
      );
    }
  };

  // Helper function to check if student has submission for a test
  const getSubmissionForTest = (testId: number) => {
    return submissions.find((sub) => sub.testId === testId);
  };

  const handleViewSubmission = (submission: StudentSubmission) => {
    setSelectedSubmission(submission);
    setShowSubmissionModal(true);
  };

  const openTestsModal = async (cls: ClassData) => {
    setTestsForClass(cls.id);
    setShowTestsModal(true);
    try {
      await fetchTestsForClass(cls.id);
    } catch (err: unknown) {
      showError(
        err instanceof Error ? err.message : "An unexpected error occurred"
      );
    }
  };

  const openSubmissionsModal = async (cls: ClassData) => {
    setSubmissionsForClass(cls.id);
    setShowSubmissionsListModal(true);
    // Submissions are already fetched via useStudentSubmissions hook
  };

  const closeTestsModal = () => {
    setShowTestsModal(false);
    setTestsForClass(null);
    setTests([]);
    setTestsError(null);
    setAllTests([]);
    setAllTestsError(null);
  };

  // Wrapper for copy code to handle type compatibility
  const handleCopyCode = async (code: string, id: string | number) => {
    await originalHandleCopyCode(code, Number(id));
  };

  // Convert classes to BaseClass format
  const baseClasses: BaseClass[] = classes.map((cls) => ({
    ...cls,
    id: cls.id.toString(),
    // Students don't have access to student count, so we hide it by setting to undefined
    studentCount: undefined,
    testCount: cls.testCount ?? cls.tests?.length ?? 0,
  }));

  // Determine which error to show
  const displayError =
    notificationError ||
    classesError ||
    detailsError ||
    testsError ||
    allTestsError;

  // Quick actions configuration
  const quickActions: QuickAction[] = [
    {
      icon: "👥",
      title: "Join a Class",
      description: "Enter a class code provided by your teacher to join",
      actionText: "Join Now",
      colorScheme: "indigo",
      onClick: () => setShowJoinModal(true),
    },
    {
      icon: "📊",
      title: "View Submissions",
      description: "Review your test submissions and scores",
      actionText: "View All",
      colorScheme: "orange",
      onClick: () => {
        setSubmissionsForClass(null); // null means all submissions
        setShowSubmissionsListModal(true);
      },
    },
  ];

  // Class card actions configuration
  const classCardActions: ClassCardAction[] = [
    {
      label: "Scores",
      onClick: (classData) => openSubmissionsModal(classData as ClassData),
      colorScheme: "green",
    },
    {
      label: "Tests",
      onClick: (classData) => openTestsModal(classData as ClassData),
      colorScheme: "blue",
    },
    {
      label: "Leave",
      onClick: (classData) =>
        handleLeaveClass(Number(classData.id), classData.name),
      colorScheme: "red",
    },
  ];

  return (
    <BasePortal
      title="Student Portal"
      subtitle="Manage your classes and assignments"
      headerIcon={<BookOpen className="w-10 h-10 text-white" />}
      quickActions={quickActions}
      classes={baseClasses}
      loading={loading}
      error={displayError}
      success={success}
      copiedCode={copiedCode}
      classListTitle="My Classes"
      classListSubtitle="Access your enrolled classes and assignments"
      primaryActionLabel="Join New Class"
      onPrimaryAction={() => setShowJoinModal(true)}
      emptyStateTitle="No Classes Yet"
      emptyStateSubtitle="Join your first class using a code provided by your teacher"
      emptyStateIcon="📚"
      emptyStateActionLabel="Join Your First Class"
      onCopyCode={handleCopyCode}
      classCardActions={classCardActions}
    >
      {/* Modals */}
      <JoinClassModal
        isOpen={showJoinModal}
        onClose={() => setShowJoinModal(false)}
        classCode={classCode}
        setClassCode={setClassCode}
        onJoinClass={handleJoinClass}
        joining={joining}
        error={notificationError}
      />

      <ClassDetailsModal
        isOpen={showDetailsModal}
        onClose={() => setShowDetailsModal(false)}
        selectedClass={selectedClass}
        loadingDetails={loadingDetails}
      />

      <TestsModal
        isOpen={showTestsModal}
        onClose={closeTestsModal}
        testsForClass={testsForClass}
        tests={testsForClass ? tests : allTests}
        testsLoading={testsForClass ? testsLoading : allTestsLoading}
        error={testsForClass ? testsError : allTestsError}
        submissions={submissions}
        getSubmissionForTest={getSubmissionForTest}
        onViewSubmission={handleViewSubmission}
      />

      <SubmissionsListModal
        isOpen={showSubmissionsListModal}
        onClose={() => setShowSubmissionsListModal(false)}
        submissionsForClass={submissionsForClass}
        submissions={submissions}
        loading={submissionsLoading}
        error={submissionsError}
        onViewSubmission={handleViewSubmission}
      />

      <StudentSubmissionViewModal
        isOpen={showSubmissionModal}
        onClose={() => {
          setShowSubmissionModal(false);
          setSelectedSubmission(null);
        }}
        submission={selectedSubmission}
      />
    </BasePortal>
  );
}
