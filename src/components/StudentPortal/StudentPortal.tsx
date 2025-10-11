"use client";

import React, { useState } from "react";
import { BookOpen } from "lucide-react";

import { BasePortal, QuickAction, ClassCardAction, BaseClass } from "../shared";
import {
  useStudentClasses,
  useClassDetails,
  useTestsForClass,
  useNotifications
} from "./hooks";
import { ClassData } from "./types";
import { JoinClassModal, ClassDetailsModal, TestsModal } from "./Modals";

export default function StudentPortal() {
  // Hook-based state management
  const {
    classes,
    loading,
    error: classesError,
    fetchClasses,
    joinClass,
    leaveClass
  } = useStudentClasses();

  const {
    selectedClass,
    loadingDetails,
    error: detailsError,
    fetchClassDetails
  } = useClassDetails();

  const {
    tests,
    testsLoading,
    error: testsError,
    fetchTestsForClass,
    setTests,
    setError: setTestsError
  } = useTestsForClass();

  const {
    success,
    error: notificationError,
    copiedCode,
    showSuccess,
    showError,
    clearError,
    handleCopyCode: originalHandleCopyCode
  } = useNotifications();

  // Local state for modals and form inputs
  const [classCode, setClassCode] = useState("");
  const [joining, setJoining] = useState(false);
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showTestsModal, setShowTestsModal] = useState(false);
  const [testsForClass, setTestsForClass] = useState<number | null>(null);

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
    if (!confirm(`Are you sure you want to leave "${name}"?`)) return;

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

  const handleViewDetails = async (id: number) => {
    try {
      await fetchClassDetails(id);
      setShowDetailsModal(true);
    } catch (err: unknown) {
      showError(
        err instanceof Error ? err.message : "An unexpected error occurred"
      );
    }
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

  const handleTakeTest = async () => {
    const targetClass = selectedClass || classes[0];
    if (!targetClass) {
      alert("Please join or select a class first.");
      return;
    }
    await openTestsModal(targetClass);
  };

  const closeTestsModal = () => {
    setShowTestsModal(false);
    setTestsForClass(null);
    setTests([]);
    setTestsError(null);
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
    testCount: cls.testCount ?? cls.tests?.length ?? 0
  }));

  // Determine which error to show
  const displayError =
    notificationError || classesError || detailsError || testsError;

  // Quick actions configuration
  const quickActions: QuickAction[] = [
    {
      icon: "👥",
      title: "Join a Class",
      description: "Enter a class code provided by your teacher to join",
      actionText: "Join Now",
      colorScheme: "indigo",
      onClick: () => setShowJoinModal(true)
    },
    {
      icon: "📝",
      title: "Take a Test",
      description: "Start your upcoming or active assignments and tests",
      actionText: "Start Now",
      colorScheme: "orange",
      onClick: handleTakeTest
    }
  ];

  // Class card actions configuration
  const classCardActions: ClassCardAction[] = [
    {
      label: "View",
      onClick: (classData) => handleViewDetails(Number(classData.id)),
      colorScheme: "green"
    },
    {
      label: "Tests",
      onClick: (classData) => openTestsModal(classData as ClassData),
      colorScheme: "blue"
    },
    {
      label: "Leave",
      onClick: (classData) =>
        handleLeaveClass(Number(classData.id), classData.name),
      colorScheme: "red"
    }
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
        tests={tests}
        testsLoading={testsLoading}
        error={testsError}
      />
    </BasePortal>
  );
}
