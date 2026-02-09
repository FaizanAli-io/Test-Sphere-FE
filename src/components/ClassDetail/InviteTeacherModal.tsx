"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import api from "../../hooks/useApi";
import ConfirmationModal from "../ConfirmationModal";

interface InvitableTeacher {
  id: number;
  email: string;
  name: string;
  firebaseId: string | null;
  cnic: string;
  role: string;
  password: string;
  profileImage: string | null;
  verified: boolean;
  otp: string | null;
  otpExpiry: string | null;
  createdAt: string;
  updatedAt: string;
}

interface InviteTeacherModalProps {
  isOpen: boolean;
  onClose: () => void;
  classId: string | number;
  onInviteSuccess?: () => void;
}

const InviteTeacherModal: React.FC<InviteTeacherModalProps> = ({
  isOpen,
  onClose,
  classId,
  onInviteSuccess,
}) => {
  const [invitableTeachers, setInvitableTeachers] = useState<InvitableTeacher[]>([]);
  const [selectedTeacher, setSelectedTeacher] = useState<InvitableTeacher | null>(null);
  const [selectedRole, setSelectedRole] = useState<"EDITOR" | "VIEWER">("EDITOR");
  const [loading, setLoading] = useState(false);
  const [inviting, setInviting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [showConfirm, setShowConfirm] = useState(false);
  const fetchingRef = useRef(false);

  const fetchInvitableTeachers = useCallback(async () => {
    if (fetchingRef.current || !isOpen) return;
    fetchingRef.current = true;
    setLoading(true);
    setError(null);

    try {
      const response = await api(`/classes/${classId}/inviteable-teachers`, {
        method: "GET",
        auth: true,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to fetch inviteable teachers");
      }

      const data = await response.json();
      setInvitableTeachers(Array.isArray(data) ? data : []);
      if (Array.isArray(data) && data.length > 0 && !selectedTeacher) {
        setSelectedTeacher(data[0]);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to fetch teachers";
      setError(message);
      console.error(message);
    } finally {
      setLoading(false);
      fetchingRef.current = false;
    }
  }, [classId, isOpen, selectedTeacher]);

  useEffect(() => {
    if (isOpen) {
      fetchInvitableTeachers();
    }
  }, [isOpen, fetchInvitableTeachers]);

  const handleInvite = async () => {
    if (!selectedTeacher) {
      setError("Please select a teacher to invite");
      return;
    }

    setInviting(true);
    setError(null);

    try {
      const response = await api(`/classes/${classId}/teachers/${selectedTeacher.id}`, {
        method: "POST",
        auth: true,
        body: JSON.stringify({
          role: selectedRole,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to invite teacher");
      }

      setSuccess(`Teacher invited as ${selectedRole}`);
      setInviting(false);

      setTimeout(() => {
        setShowConfirm(false);
        setError(null);
        setSuccess(null);
        setSelectedTeacher(invitableTeachers.length > 0 ? invitableTeachers[0] : null);
        setSelectedRole("EDITOR");
        onClose();
        onInviteSuccess?.();
      }, 1500);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to invite teacher";
      setError(message);
      setInviting(false);
    }
  };

  const handleConfirm = () => {
    handleInvite();
  };

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-8 border-2 border-gray-100">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Invite Teacher</h2>

          {success && (
            <div className="mb-6 p-4 bg-green-50 border border-green-300 rounded-xl">
              <p className="text-green-700 font-semibold">✓ {success}</p>
            </div>
          )}

          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-300 rounded-xl">
              <p className="text-red-700 font-semibold">✗ {error}</p>
            </div>
          )}

          <div className="space-y-4 mb-6">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-3">Select Teacher</label>
              <select
                value={selectedTeacher?.id || ""}
                onChange={(e) => {
                  const teacher = invitableTeachers.find((t) => t.id === Number(e.target.value));
                  if (teacher) setSelectedTeacher(teacher);
                }}
                disabled={loading || inviting}
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-indigo-600 font-semibold text-gray-900 disabled:bg-gray-100"
              >
                <option value="">{loading ? "Loading teachers..." : "Choose a teacher..."}</option>
                {invitableTeachers.map((teacher) => (
                  <option key={teacher.id} value={teacher.id}>
                    {teacher.name} ({teacher.email})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-700 mb-3">Role</label>
              <select
                value={selectedRole}
                onChange={(e) => setSelectedRole(e.target.value as "EDITOR" | "VIEWER")}
                disabled={inviting}
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-indigo-600 font-semibold text-gray-900 disabled:bg-gray-100"
              >
                <option value="EDITOR">Editor (Can edit tests and class)</option>
                <option value="VIEWER">Viewer (Can only view)</option>
              </select>
            </div>
          </div>

          <div className="flex gap-3">
            <button
              onClick={onClose}
              disabled={inviting}
              className="flex-1 px-4 py-3 bg-gray-200 text-gray-800 font-bold rounded-lg hover:bg-gray-300 transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              onClick={() => setShowConfirm(true)}
              disabled={!selectedTeacher || loading || inviting}
              className="flex-1 px-4 py-3 bg-gradient-to-r from-indigo-600 to-blue-600 text-white font-bold rounded-lg hover:from-indigo-700 hover:to-blue-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {inviting ? "Inviting..." : "Invite"}
            </button>
          </div>
        </div>
      </div>

      {showConfirm && (
        <ConfirmationModal
          isOpen={showConfirm}
          title="Confirm Invitation"
          message={`Are you sure you want to invite ${selectedTeacher?.name || selectedTeacher?.email} as ${selectedRole}?`}
          confirmText="Invite"
          cancelText="Cancel"
          type="info"
          onConfirm={handleConfirm}
          onCancel={() => setShowConfirm(false)}
        />
      )}
    </>
  );
};

export default InviteTeacherModal;
