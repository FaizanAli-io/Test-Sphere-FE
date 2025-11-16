"use client";

import React, { useState, useMemo } from "react";

import {
  useAllTests,
  useClassDetails,
  useNotifications,
  useTestsForClass,
  useStudentClasses,
} from "./hooks";
import { TestsModal, JoinClassModal, ClassDetailsModal } from "./modals";
import { ClassData } from "./types";
import { Submission } from "../Submissions/types";
import { useSubmissions, SubmissionDetail, SubmissionsList } from "../Submissions";
import { BasePortal, QuickAction, ClassCardAction, BaseClass } from "../SharedPortal";

export default function StudentPortal() {
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
    fetchClassDetails,
  } = useClassDetails();

  const {
    tests,
    testsLoading,
    error: testsError,
    fetchTestsForClass,
    setTests,
    setError: setTestsError,
  } = useTestsForClass();

  const { allTests, allTestsLoading, allTestsError, fetchAllTests, setAllTests, setAllTestsError } =
    useAllTests();

  const {
    success,
    error: notificationError,
    copiedCode,
    showSuccess,
    showError,
    clearError,
    handleCopyCode: originalHandleCopyCode,
  } = useNotifications();

  const notificationsApi = useMemo(
    () => ({
      showSuccess,
      showError,
      showWarning: showError,
      showInfo: showSuccess,
    }),
    [showSuccess, showError],
  );

  const {
    submissions,
    submissionsLoading,
    selectedSubmission: selectedSubmissionFromHook,
    selectSubmission,
    closeSubmissionDetail,
    getSubmissionForTest: getSubmissionForTestFromHook,
    fetchSubmissions,
  } = useSubmissions(undefined, "student", notificationsApi);

  const [classCode, setClassCode] = useState("");
  const [joining, setJoining] = useState(false);
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showTestsModal, setShowTestsModal] = useState(false);
  const [testsForClass, setTestsForClass] = useState<number | null>(null);
  const [showSubmissionsListModal, setShowSubmissionsListModal] = useState(false);
  const [submissionsForClass, setSubmissionsForClass] = useState<number | null>(null);

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
      showError(err instanceof Error ? err.message : "An unexpected error occurred");
    } finally {
      setJoining(false);
    }
  };

  const handleLeaveClass = async (id: number, name: string) => {
    const confirmed = window.confirm(`Are you sure you want to leave "${name}"?`);
    if (!confirmed) return;

    clearError();
    try {
      await leaveClass(id);
      showSuccess("Successfully left the class");
    } catch (err: unknown) {
      showError(err instanceof Error ? err.message : "An unexpected error occurred");
    }
  };

  const handleViewSubmission = (submission: Submission) => {
    selectSubmission(submission);
  };

  const openTestsModal = async (cls: ClassData) => {
    setTestsForClass(cls.id);
    setShowTestsModal(true);
    try {
      await fetchTestsForClass(cls.id);
    } catch (err: unknown) {
      showError(err instanceof Error ? err.message : "An unexpected error occurred");
    }
  };

  const openSubmissionsModal = async (cls: ClassData) => {
    setSubmissionsForClass(cls.id);
    setShowSubmissionsListModal(true);

    await fetchSubmissions();
  };

  const closeTestsModal = () => {
    setShowTestsModal(false);
    setTestsForClass(null);
    setTests([]);
    setTestsError(null);
    setAllTests([]);
    setAllTestsError(null);
  };

  const handleCopyCode = async (code: string, id: string | number) => {
    await originalHandleCopyCode(code, Number(id));
  };

  const handleClassClick = async (classData: BaseClass) => {
    try {
      await fetchClassDetails(Number(classData.id));
      // Fetch all tests to have data available for the modal
      if (!allTests.length) {
        await fetchAllTests(classes);
      }
      setShowDetailsModal(true);
    } catch (err) {
      showError(err instanceof Error ? err.message : "Failed to load class details");
    }
  };

  const baseClasses: BaseClass[] = classes.map((cls) => ({
    ...cls,
    id: cls.id.toString(),
    studentCount: undefined,
    disabled: cls.approved === false,
    testCount: cls.testCount ?? cls.tests?.length ?? 0,
    statusLabel: cls.approved === false ? "Pending Approval" : undefined,
  }));

  const displayError =
    notificationError || classesError || detailsError || testsError || allTestsError;

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
      onClick: async () => {
        setSubmissionsForClass(null);
        setShowSubmissionsListModal(true);
        await fetchSubmissions();
      },
    },
  ];

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
      onClick: (classData) => handleLeaveClass(Number(classData.id), classData.name),
      colorScheme: "red",
    },
  ];

  return (
    <BasePortal
      role="student"
      quickActions={quickActions}
      classes={baseClasses}
      loading={loading}
      error={displayError}
      success={success}
      copiedCode={copiedCode}
      onPrimaryAction={() => setShowJoinModal(true)}
      onCopyCode={handleCopyCode}
      classCardActions={classCardActions}
      onClassClick={handleClassClick}
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
        tests={allTests}
        submissions={submissions}
        onViewTests={() => {
          if (selectedClass) {
            setShowDetailsModal(false);
            openTestsModal({ ...selectedClass, id: selectedClass.id });
          }
        }}
        onViewSubmissions={() => {
          if (selectedClass) {
            setShowDetailsModal(false);
            openSubmissionsModal({ ...selectedClass, id: selectedClass.id });
          }
        }}
      />

      <TestsModal
        isOpen={showTestsModal}
        onClose={closeTestsModal}
        testsForClass={testsForClass}
        tests={testsForClass ? tests : allTests}
        testsLoading={testsForClass ? testsLoading : allTestsLoading}
        error={testsForClass ? testsError : allTestsError}
        submissions={submissions}
        getSubmissionForTest={getSubmissionForTestFromHook}
        onViewSubmission={handleViewSubmission}
      />

      {showSubmissionsListModal && (
        <SubmissionsList
          submissions={submissions}
          onClose={() => setShowSubmissionsListModal(false)}
          onSelectSubmission={handleViewSubmission}
          viewContext="student"
          loading={submissionsLoading}
          error={null}
          classFilter={submissionsForClass}
        />
      )}

      <SubmissionDetail
        isOpen={!!selectedSubmissionFromHook}
        onClose={closeSubmissionDetail}
        submission={selectedSubmissionFromHook}
        viewContext="student"
      />
    </BasePortal>
  );
}
