"use client";

import React, { useState } from "react";
import type { ReactElement } from "react";
import { useRouter } from "next/navigation";
import { GraduationCap } from "lucide-react";

import { BasePortal, QuickAction, ClassCardAction, BaseClass } from "../shared";
import { Class, KickConfirm } from "./types";
import CreateTestModal from "../CreateTestModal";
import { ConfirmationModal, ClassModal } from "./Modals";
import { useTeacherPortal, useClassDetails } from "./hooks";

export default function TeacherPortal(): ReactElement {
  const router = useRouter();

  // Hooks
  const { classes, loading, error, createClass, updateClass, deleteClass } =
    useTeacherPortal();
  const { kickStudent } = useClassDetails();

  // Modal states
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showCreateTestModal, setShowCreateTestModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showKickConfirm, setShowKickConfirm] = useState(false);

  // Form states
  const [editClass, setEditClass] = useState<Class | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [kickConfirm, setKickConfirm] = useState<KickConfirm | null>(null);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  // Event handlers
  const handleCreateClass = async (newClass: {
    name: string;
    description: string;
  }) => {
    const success = await createClass(newClass);
    if (success) {
      setShowCreateModal(false);
    }
    return success;
  };

  const handleEditClass = async (
    updatedClass: Class | { name: string; description: string }
  ) => {
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

  const navigateToClassDetail = (classId: string) => {
    router.push(`/class/${classId}`);
  };

  const handleCopyCode = async (code: string, id: string | number) => {
    try {
      await navigator.clipboard.writeText(code);
      setCopiedCode(id as string);
      setTimeout(() => setCopiedCode(null), 2000);
    } catch {
      alert("Failed to copy code");
    }
  };

  // Convert classes to BaseClass format
  const baseClasses: BaseClass[] = classes.map((cls) => ({
    ...cls,
    id: cls.id as string,
    studentCount: cls.studentCount ?? cls.students?.length ?? 0,
    testCount: cls.testCount ?? cls.tests?.length ?? 0
  }));

  // Quick actions configuration
  const quickActions: QuickAction[] = [
    {
      icon: "🏫",
      title: "Create New Class",
      description:
        "Set up a new class and generate a unique join code for your students",
      actionText: "Get Started",
      colorScheme: "indigo",
      onClick: () => setShowCreateModal(true)
    },
    {
      icon: "📝",
      title: "Create a Test",
      description:
        "Design comprehensive assessments and schedule them for your classes",
      actionText: "Get Started",
      colorScheme: "orange",
      onClick: () => setShowCreateTestModal(true)
    }
  ];

  // Class card actions configuration
  const classCardActions: ClassCardAction[] = [
    {
      label: "View",
      onClick: (classData) => navigateToClassDetail(classData.id as string),
      colorScheme: "green"
    },
    {
      label: "Edit",
      onClick: (classData) => {
        setEditClass(classData as Class);
        setShowEditModal(true);
      },
      colorScheme: "yellow"
    },
    {
      label: "Delete",
      onClick: (classData) => {
        setDeleteConfirm(classData.id as string);
        setShowDeleteConfirm(true);
      },
      colorScheme: "red"
    }
  ];

  return (
    <BasePortal
      title="Teacher Portal"
      subtitle="Manage your classes, track student progress, and create engaging assessments"
      headerIcon={<GraduationCap className="w-10 h-10 text-white" />}
      quickActions={quickActions}
      classes={baseClasses}
      loading={loading}
      error={error}
      copiedCode={copiedCode}
      classListTitle="My Classes"
      classListSubtitle="Manage and monitor all your classes"
      primaryActionLabel="Create New Class"
      onPrimaryAction={() => setShowCreateModal(true)}
      emptyStateTitle="No Classes Yet"
      emptyStateSubtitle="Start your teaching journey by creating your first class"
      emptyStateIcon="🏫"
      emptyStateActionLabel="Create Your First Class"
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
    </BasePortal>
  );
}
