"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import api from "../../hooks/useApi";
import { canManageMembers } from "@/utils/rolePermissions";
import type { TeacherRole } from "@/utils/rolePermissions";

interface ClassTeacher {
  teacherId: number;
  classId: number;
  role: TeacherRole;
  assignedAt: string;
  teacher: {
    id: number;
    email: string;
    name: string;
    profileImage: string | null;
  };
}

interface TeachersSectionProps {
  classId: string | number;
  onInviteClick: () => void;
  refreshTrigger?: number;
  isCurrentUserOwner?: boolean;
}

const getRoleBadgeStyles = (role: string) => {
  switch (role) {
    case "OWNER":
      return "bg-purple-100 text-purple-800 border border-purple-300";
    case "EDITOR":
      return "bg-blue-100 text-blue-800 border border-blue-300";
    case "VIEWER":
      return "bg-gray-100 text-gray-800 border border-gray-300";
    default:
      return "bg-gray-100 text-gray-800 border border-gray-300";
  }
};

const TeachersSection: React.FC<TeachersSectionProps> = ({
  classId,
  onInviteClick,
  refreshTrigger,
  isCurrentUserOwner = false,
}) => {
  const [teachers, setTeachers] = useState<ClassTeacher[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingTeacherId, setEditingTeacherId] = useState<number | null>(null);
  const [editingRole, setEditingRole] = useState<"EDITOR" | "VIEWER">("EDITOR");
  const [showEditModal, setShowEditModal] = useState(false);
  const [deletingTeacherId, setDeletingTeacherId] = useState<number | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const fetchingRef = useRef(false);

  // Only OWNER can manage teachers
  const canManageTeachers = isCurrentUserOwner;

  const fetchTeachers = useCallback(async () => {
    if (fetchingRef.current) return;
    fetchingRef.current = true;
    setLoading(true);

    try {
      const response = await api(`/classes/${classId}`, {
        method: "GET",
        auth: true,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to fetch teachers");
      }

      const data = await response.json();
      setTeachers(Array.isArray(data.teachers) ? data.teachers : []);
    } catch (err) {
      console.error("Failed to fetch teachers:", err);
      setTeachers([]);
    } finally {
      setLoading(false);
      fetchingRef.current = false;
    }
  }, [classId]);

  const handleEditRole = (teacher: ClassTeacher) => {
    setEditingTeacherId(teacher.teacherId);
    setEditingRole(teacher.role as "EDITOR" | "VIEWER");
    setShowEditModal(true);
  };

  const handleConfirmEdit = async () => {
    if (!editingTeacherId) return;

    setActionLoading(true);
    try {
      const response = await api(`/classes/${classId}/teachers/${editingTeacherId}`, {
        method: "PATCH",
        auth: true,
        body: JSON.stringify({ role: editingRole }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to update teacher role");
      }

      setShowEditModal(false);
      setEditingTeacherId(null);
      await fetchTeachers();
    } catch (err) {
      console.error("Failed to update teacher role:", err);
      alert(err instanceof Error ? err.message : "Failed to update teacher role");
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteTeacher = (teacherId: number) => {
    setDeletingTeacherId(teacherId);
    setShowDeleteConfirm(true);
  };

  const handleConfirmDelete = async () => {
    if (!deletingTeacherId) return;

    setActionLoading(true);
    try {
      const response = await api(`/classes/${classId}/teachers/${deletingTeacherId}`, {
        method: "DELETE",
        auth: true,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to remove teacher");
      }

      setShowDeleteConfirm(false);
      setDeletingTeacherId(null);
      await fetchTeachers();
    } catch (err) {
      console.error("Failed to remove teacher:", err);
      alert(err instanceof Error ? err.message : "Failed to remove teacher");
    } finally {
      setActionLoading(false);
    }
  };

  useEffect(() => {
    fetchTeachers();
  }, [fetchTeachers, refreshTrigger]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-indigo-200 border-t-indigo-600 mx-auto" />
          <p className="mt-4 text-gray-600 font-semibold">Loading teachers...</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-2xl font-bold text-gray-900">Teachers in this class</h3>
        {canManageTeachers && (
          <button
            onClick={onInviteClick}
            className="px-6 py-3 bg-gradient-to-r from-indigo-600 to-blue-600 text-white font-bold rounded-xl hover:from-indigo-700 hover:to-blue-700 transition-all shadow-lg hover:shadow-xl"
          >
            + Invite Teacher
          </button>
        )}
      </div>

      {teachers.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-2xl border-2 border-dashed border-gray-300">
          <span className="text-4xl mb-3 block">👨‍🏫</span>
          <p className="text-gray-600 text-lg">No teachers added yet</p>
          <p className="text-gray-500 text-sm mt-2">Invite teachers to collaborate on this class</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {teachers.map((item) => (
            <div
              key={item.teacherId}
              className="bg-gradient-to-br from-white to-gray-50 rounded-xl border border-gray-200 p-6 shadow-md hover:shadow-lg transition-shadow"
            >
              <div className="flex items-start justify-between mb-4">
                {item.teacher.profileImage ? (
                  <img
                    src={item.teacher.profileImage}
                    alt={item.teacher.name}
                    className="w-12 h-12 rounded-full object-cover border-2 border-indigo-200"
                  />
                ) : (
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-indigo-500 to-blue-500 flex items-center justify-center text-white font-bold text-lg">
                    {item.teacher.name.charAt(0).toUpperCase()}
                  </div>
                )}
                <span
                  className={`text-xs font-bold px-3 py-1.5 rounded-lg ${getRoleBadgeStyles(item.role)}`}
                >
                  {item.role}
                </span>
              </div>
              <h4 className="text-lg font-bold text-gray-900 mb-1">{item.teacher.name}</h4>
              <p className="text-sm text-gray-600 mb-3">{item.teacher.email}</p>
              {item.assignedAt && (
                <p className="text-xs text-gray-500 mb-4">
                  Added {new Date(item.assignedAt).toLocaleDateString()}
                </p>
              )}
              {canManageTeachers && (
                <div className="flex flex-col gap-2 pt-4 border-t border-gray-200">
                  <button
                    onClick={() => handleEditRole(item)}
                    disabled={actionLoading || item.role === "OWNER"}
                    className="w-full px-3 py-2 bg-blue-100 text-blue-700 font-semibold rounded-lg hover:bg-blue-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                    title={item.role === "OWNER" ? "Cannot edit owner" : ""}
                  >
                    Edit Role
                  </button>
                  <button
                    onClick={() => handleDeleteTeacher(item.teacherId)}
                    disabled={actionLoading || item.role === "OWNER"}
                    className="w-full px-3 py-2 bg-red-100 text-red-700 font-semibold rounded-lg hover:bg-red-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                    title={item.role === "OWNER" ? "Cannot remove owner" : ""}
                  >
                    Remove
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Edit Role Modal */}
      {showEditModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-8 border-2 border-gray-100">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Update Teacher Role</h2>

            <div className="mb-6">
              <label className="block text-sm font-bold text-gray-700 mb-3">New Role</label>
              <select
                value={editingRole}
                onChange={(e) => setEditingRole(e.target.value as "EDITOR" | "VIEWER")}
                disabled={actionLoading}
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-indigo-600 font-semibold text-gray-900 disabled:bg-gray-100"
              >
                <option value="EDITOR">Editor (Can edit tests and class)</option>
                <option value="VIEWER">Viewer (Can only view)</option>
              </select>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setShowEditModal(false)}
                disabled={actionLoading}
                className="flex-1 px-4 py-3 bg-gray-200 text-gray-800 font-bold rounded-lg hover:bg-gray-300 transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmEdit}
                disabled={actionLoading}
                className="flex-1 px-4 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {actionLoading ? "Updating..." : "Update"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-8 border-2 border-red-200">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Remove Teacher?</h2>
            <p className="text-gray-600 mb-6">
              Are you sure you want to remove{" "}
              <strong>
                {teachers.find((t) => t.teacherId === deletingTeacherId)?.teacher.name}
              </strong>{" "}
              from this class? This action cannot be undone.
            </p>

            <div className="flex gap-3">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                disabled={actionLoading}
                className="flex-1 px-4 py-3 bg-gray-200 text-gray-800 font-bold rounded-lg hover:bg-gray-300 transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmDelete}
                disabled={actionLoading}
                className="flex-1 px-4 py-3 bg-gradient-to-r from-red-600 to-rose-600 text-white font-bold rounded-lg hover:from-red-700 hover:to-rose-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {actionLoading ? "Removing..." : "Remove"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TeachersSection;
