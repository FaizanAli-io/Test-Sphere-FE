"use client";

import React, { useState } from "react";
import type { ReactElement } from "react";

import CreateTestModal from "../CreateTestModal";
import { useTeacherPortal, useClassDetails } from "./hooks";
import { Class, KickConfirm, RequestAction } from "./types";
import { useNotifications } from "../../contexts/NotificationContext";
import { ConfirmationModal, ClassModal, RequestsModal } from "./modals";
import { BasePortal, QuickAction, ClassCardAction, BaseClass } from "../shared";

export default function TeacherPortal(): ReactElement {
  const notifications = useNotifications();

  // Hooks
  const { classes, loading, error, createClass, updateClass, deleteClass, fetchClasses } =
    useTeacherPortal();
  const { kickStudent, handleStudentRequest, fetchClassDetails, selectedClass } = useClassDetails();

  // Modal states
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showCreateTestModal, setShowCreateTestModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showKickConfirm, setShowKickConfirm] = useState(false);
  const [showRequestsModal, setShowRequestsModal] = useState(false);

  // Form states
  const [editClass, setEditClass] = useState<Class | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [kickConfirm, setKickConfirm] = useState<KickConfirm | null>(null);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  // Event handlers
  const handleCreateClass = async (newClass: { name: string; description: string }) => {
    const success = await createClass(newClass);
    if (success) {
      setShowCreateModal(false);
    }
    return success;
  };

  const handleEditClass = async (updatedClass: Class | { name: string; description: string }) => {
    const success = await updateClass(updatedClass as Class);
    if (success) {
      setShowEditModal(false);
      setEditClass(null);
    }
    return success;
  };

  const handleDeleteClass = async () => {
    if (deleteConfirm) {
      await deleteClass(deleteConfirm);
      setShowDeleteConfirm(false);
      setDeleteConfirm(null);
    }
  };

  const handleKickStudent = async () => {
    if (kickConfirm) {
      const success = await kickStudent(kickConfirm);
      if (success) {
        setShowKickConfirm(false);
        setKickConfirm(null);
      }
    }
  };

  const handleTestCreated = () => {
    setShowCreateTestModal(false);
  };

  const handleRequestAction = async (action: RequestAction) => {
    const success = await handleStudentRequest(action);
    if (success) {
      // Refresh the classes data to update counts
      await fetchClasses();
    }
  };

  // navigateToClassDetail removed (not used) to satisfy lint rules

  const handleCopyCode = async (code: string, id: string | number) => {
    try {
      await navigator.clipboard.writeText(code);
      setCopiedCode(id as string);
      setTimeout(() => setCopiedCode(null), 2000);
      notifications.showSuccess("Class code copied to clipboard!");
    } catch {
      notifications.showError("Failed to copy code");
    }
  };

  // Convert classes to BaseClass format
  const baseClasses: BaseClass[] = classes.map((cls) => ({
    ...cls,
    id: cls.id as string,
    testCount: cls.testCount ?? cls.tests?.length ?? 0,
    // Use approved student count for display
    studentCount: cls.studentCount ?? cls.students?.filter((s) => s.approved === true).length ?? 0,
    // Convert ClassStudent[] to simple student array for BaseClass (only approved students)
    students: cls.students
      ?.filter((s) => s.approved === true)
      .map((classStudent) => ({
        id: classStudent.student.id,
        name: classStudent.student.name,
        email: classStudent.student.email,
      })),
  }));

  // Quick actions configuration
  const quickActions: QuickAction[] = [
    {
      icon: "🏫",
      title: "Create New Class",
      description: "Set up a new class and generate a unique join code for your students",
      actionText: "Get Started",
      colorScheme: "indigo",
      onClick: () => setShowCreateModal(true),
    },
    {
      icon: "📝",
      title: "Create a Test",
      description: "Design comprehensive assessments and schedule them for your classes",
      actionText: "Get Started",
      colorScheme: "orange",
      onClick: () => setShowCreateTestModal(true),
    },
  ];

  // Class card actions configuration
  const classCardActions: ClassCardAction[] = [
    {
      label: "Edit",
      onClick: (classData) => {
        setEditClass(classData as Class);
        setShowEditModal(true);
      },
      colorScheme: "green",
    },
    {
      label: "Requests",
      onClick: async (classData) => {
        const fullClass = classes.find((cls) => cls.id === classData.id);
        if (fullClass) {
          await fetchClassDetails(fullClass.id as string);
          setShowRequestsModal(true);
        }
      },
      colorScheme: "blue",
      badge: (classData) => {
        const fullClass = classes.find((cls) => cls.id === classData.id);
        const pendingCount = fullClass?.students?.filter((s) => !s.approved).length ?? 0;
        return pendingCount > 0 ? pendingCount : undefined;
      },
    },
    {
      label: "Delete",
      onClick: (classData) => {
        setDeleteConfirm(classData.id as string);
        setShowDeleteConfirm(true);
      },
      colorScheme: "red",
    },
  ];

  return (
    <BasePortal
      role="teacher"
      quickActions={quickActions}
      classes={baseClasses}
      loading={loading}
      error={error}
      copiedCode={copiedCode}
      onPrimaryAction={() => setShowCreateModal(true)}
      onCopyCode={handleCopyCode}
      classCardActions={classCardActions}
    >
      {/* Modals */}
      <ClassModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSubmit={handleCreateClass}
        loading={loading}
        title="Create New Class"
        submitText="Create Class"
        icon="🏫"
        colorScheme="indigo"
      />

      <ClassModal
        isOpen={showEditModal}
        onClose={() => {
          setShowEditModal(false);
          setEditClass(null);
        }}
        onSubmit={handleEditClass}
        loading={loading}
        title="Edit Class"
        submitText="Update Class"
        icon="✏️"
        colorScheme="yellow"
        class={editClass}
      />

      <CreateTestModal
        isOpen={showCreateTestModal}
        onClose={() => setShowCreateTestModal(false)}
        onTestCreated={handleTestCreated}
      />

      <ConfirmationModal
        isOpen={showDeleteConfirm}
        onClose={() => {
          setShowDeleteConfirm(false);
          setDeleteConfirm(null);
        }}
        onConfirm={handleDeleteClass}
        loading={loading}
        type="delete"
      />

      <ConfirmationModal
        isOpen={showKickConfirm}
        onClose={() => {
          setShowKickConfirm(false);
          setKickConfirm(null);
        }}
        onConfirm={handleKickStudent}
        loading={loading}
        type="kick"
      />

      <RequestsModal
        isOpen={showRequestsModal}
        onClose={() => {
          setShowRequestsModal(false);
        }}
        selectedClass={selectedClass}
        onRequestAction={handleRequestAction}
        loading={loading}
      />
    </BasePortal>
  );
}
