import React from "react";
import {
  Class,
  KickConfirm,
  NewClass,
  RequestAction,
  ClassStudent
} from "./types";

interface ConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  loading?: boolean;
  type: "delete" | "kick";
  data?: {
    studentName?: string;
  };
}

export function ConfirmationModal({
  isOpen,
  onClose,
  onConfirm,
  loading = false,
  type,
  data
}: ConfirmationModalProps) {
  if (!isOpen) return null;

  const config = {
    delete: {
      icon: "⚠️",
      title: "Delete Class?",
      message:
        "Are you sure you want to delete this class? All associated data will be permanently removed. This action cannot be undone.",
      confirmText: "Delete",
      gradient: "from-red-600 to-rose-600",
      hoverGradient: "hover:from-red-700 hover:to-rose-700"
    },
    kick: {
      icon: "👤",
      title: "Remove Student?",
      message: `Are you sure you want to remove ${
        data?.studentName || "this student"
      } from this class? They will lose access to all class materials and tests.`,
      confirmText: "Remove",
      gradient: "from-red-600 to-rose-600",
      hoverGradient: "hover:from-red-700 hover:to-rose-700"
    }
  };

  const modalConfig = config[type];

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-fadeIn">
      <div className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl transform animate-slideUp">
        <div className="text-center">
          <div className="w-20 h-20 bg-gradient-to-br from-red-100 to-rose-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <span className="text-4xl">{modalConfig.icon}</span>
          </div>
          <h3 className="text-3xl font-bold text-gray-900 mb-4">
            {modalConfig.title}
          </h3>

          {type === "kick" && data?.studentName && (
            <>
              <p className="text-gray-600 mb-2 text-lg">
                Are you sure you want to remove
              </p>
              <p className="text-indigo-600 font-bold text-xl mb-6">
                {data.studentName}
              </p>
              <p className="text-gray-500 text-sm">
                from this class? They will lose access to all class materials
                and tests.
              </p>
            </>
          )}

          {type === "delete" && (
            <p className="text-gray-600 mb-8 text-lg leading-relaxed">
              {modalConfig.message}
            </p>
          )}
        </div>
        <div className="flex gap-3 mt-8">
          <button
            onClick={onClose}
            className="flex-1 px-6 py-4 bg-gray-100 text-gray-700 font-bold rounded-xl hover:bg-gray-200 transition-all text-lg"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className={`flex-1 px-6 py-4 bg-gradient-to-r ${modalConfig.gradient} text-white font-bold rounded-xl ${modalConfig.hoverGradient} transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl text-lg`}
          >
            {loading ? "Processing..." : modalConfig.confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}

interface StudentsModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedClass: Class | null;
  onKickStudent: (kickConfirm: KickConfirm) => void;
}

export function StudentsModal({
  isOpen,
  onClose,
  selectedClass,
  onKickStudent
}: StudentsModalProps) {
  if (!isOpen || !selectedClass) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-fadeIn">
      <div className="bg-white rounded-3xl p-8 max-w-2xl w-full shadow-2xl transform animate-slideUp max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl flex items-center justify-center text-2xl">
              👥
            </div>
            <div>
              <h3 className="text-3xl font-bold text-gray-900">
                {selectedClass.name}
              </h3>
              <p className="text-gray-600 mt-1">
                {selectedClass.students?.length || 0} enrolled{" "}
                {selectedClass.students?.length === 1 ? "student" : "students"}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-10 h-10 bg-gray-100 hover:bg-gray-200 rounded-xl flex items-center justify-center transition-colors text-gray-600 font-bold text-xl"
          >
            ✕
          </button>
        </div>

        {selectedClass.students && selectedClass.students.length > 0 ? (
          <div className="space-y-3">
            {selectedClass.students.map((classStudent, index) => (
              <div
                key={classStudent.student.id}
                className="flex items-center justify-between p-4 bg-gradient-to-r from-gray-50 to-blue-50 rounded-xl border-2 border-gray-200 hover:border-indigo-300 transition-all"
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-blue-500 rounded-xl flex items-center justify-center text-white font-bold text-lg">
                    {index + 1}
                  </div>
                  <div>
                    <p className="font-bold text-gray-900 text-lg">
                      {classStudent.student.name}
                    </p>
                    <p className="text-sm text-gray-600">
                      {classStudent.student.email}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() =>
                    onKickStudent({
                      classId: selectedClass.id,
                      studentId: classStudent.student.id,
                      studentName: classStudent.student.name
                    })
                  }
                  className="px-4 py-2.5 bg-gradient-to-r from-red-500 to-rose-600 text-white font-bold rounded-lg hover:from-red-600 hover:to-rose-700 transition-all shadow-md hover:shadow-lg hover:scale-105"
                >
                  Remove
                </button>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12 bg-gradient-to-br from-gray-50 to-blue-50 rounded-2xl border-2 border-dashed border-gray-300">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4 text-3xl">
              👥
            </div>
            <p className="text-gray-600 font-semibold text-lg">
              No students enrolled yet
            </p>
            <p className="text-gray-500 text-sm mt-2">
              Share class code:{" "}
              <span className="font-bold text-indigo-600">
                {selectedClass.code}
              </span>
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

interface ClassModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (cls: Class | NewClass) => Promise<boolean>;
  class?: Class | null;
  loading?: boolean;
  title: string;
  submitText: string;
  icon: string;
  colorScheme: "indigo" | "yellow";
}

export function ClassModal({
  isOpen,
  onClose,
  onSubmit,
  class: classData,
  loading = false,
  title,
  submitText,
  icon,
  colorScheme
}: ClassModalProps) {
  const [formData, setFormData] = React.useState<NewClass>({
    name: classData?.name || "",
    description: classData?.description || ""
  });

  React.useEffect(() => {
    if (classData) {
      setFormData({
        name: classData.name,
        description: classData.description
      });
    } else {
      setFormData({ name: "", description: "" });
    }
  }, [classData]);

  const handleSubmit = async () => {
    const success = await onSubmit(
      classData ? { ...classData, ...formData } : formData
    );
    if (success) {
      onClose();
      setFormData({ name: "", description: "" });
    }
  };

  const handleClose = () => {
    onClose();
    setFormData({ name: "", description: "" });
  };

  if (!isOpen) return null;

  const colors = {
    indigo: {
      gradient: "from-indigo-600 to-blue-600",
      hoverGradient: "hover:from-indigo-700 hover:to-blue-700",
      focus: "focus:ring-indigo-500 focus:border-indigo-500"
    },
    yellow: {
      gradient: "from-yellow-500 to-orange-500",
      hoverGradient: "hover:from-yellow-600 hover:to-orange-600",
      focus: "focus:ring-yellow-500 focus:border-yellow-500"
    }
  };

  const colorConfig = colors[colorScheme];

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-fadeIn">
      <div className="bg-white rounded-3xl p-8 max-w-lg w-full shadow-2xl transform animate-slideUp">
        <div className="flex items-center gap-4 mb-6">
          <div
            className={`w-12 h-12 bg-gradient-to-br ${colorConfig.gradient} rounded-xl flex items-center justify-center text-2xl`}
          >
            {icon}
          </div>
          <h3 className="text-3xl font-bold text-gray-900">{title}</h3>
        </div>
        <div className="space-y-5">
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">
              Class Name *
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
              className={`w-full px-4 py-3.5 border-2 border-gray-200 rounded-xl focus:ring-2 ${colorConfig.focus} text-gray-900 bg-gray-50 focus:bg-white transition-all font-medium`}
              placeholder="e.g., Mathematics 101"
            />
          </div>
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">
              Description
            </label>
            <textarea
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
              className={`w-full px-4 py-3.5 border-2 border-gray-200 rounded-xl focus:ring-2 ${colorConfig.focus} text-gray-900 bg-gray-50 focus:bg-white transition-all font-medium resize-none`}
              rows={4}
              placeholder="Brief description of the class (optional)"
            />
          </div>
        </div>
        <div className="flex gap-3 mt-8">
          <button
            onClick={handleClose}
            className="flex-1 px-6 py-4 bg-gray-100 text-gray-700 font-bold rounded-xl hover:bg-gray-200 transition-all text-lg"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading}
            className={`flex-1 px-6 py-4 bg-gradient-to-r ${colorConfig.gradient} text-white font-bold rounded-xl ${colorConfig.hoverGradient} transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl text-lg`}
          >
            {loading ? "Processing..." : submitText}
          </button>
        </div>
      </div>
    </div>
  );
}

interface RequestsModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedClass: Class | null;
  onRequestAction: (action: RequestAction) => void;
  loading?: boolean;
}

export function RequestsModal({
  isOpen,
  onClose,
  selectedClass,
  onRequestAction,
  loading = false
}: RequestsModalProps) {
  if (!isOpen || !selectedClass) return null;

  // Filter only pending requests (students who are not approved)
  const pendingStudents =
    selectedClass.students?.filter((classStudent) => !classStudent.approved) ||
    [];

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-fadeIn">
      <div className="bg-white rounded-3xl p-8 max-w-2xl w-full shadow-2xl transform animate-slideUp max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-red-600 rounded-xl flex items-center justify-center text-2xl">
              📋
            </div>
            <div>
              <h3 className="text-3xl font-bold text-gray-900">
                {selectedClass.name} - Requests
              </h3>
              <p className="text-gray-600 mt-1">
                {pendingStudents.length} pending{" "}
                {pendingStudents.length === 1 ? "request" : "requests"}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-10 h-10 bg-gray-100 hover:bg-gray-200 rounded-xl flex items-center justify-center transition-colors text-gray-600 font-bold text-xl"
          >
            ✕
          </button>
        </div>

        {pendingStudents.length > 0 ? (
          <div className="space-y-3">
            {pendingStudents.map((classStudent, index) => (
              <div
                key={classStudent.student.id}
                className="flex items-center justify-between p-4 bg-gradient-to-r from-orange-50 to-yellow-50 rounded-xl border-2 border-orange-200 hover:border-orange-300 transition-all"
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-yellow-500 rounded-xl flex items-center justify-center text-white font-bold text-lg">
                    {index + 1}
                  </div>
                  <div>
                    <p className="font-bold text-gray-900 text-lg">
                      {classStudent.student.name}
                    </p>
                    <p className="text-sm text-gray-600">
                      {classStudent.student.email}
                    </p>
                    <p className="text-xs text-orange-600 font-medium">
                      Requested:{" "}
                      {new Date(classStudent.joinedAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() =>
                      onRequestAction({
                        classId: selectedClass.id,
                        studentId: classStudent.student.id,
                        studentName: classStudent.student.name,
                        action: "approve"
                      })
                    }
                    disabled={loading}
                    className="px-4 py-2.5 bg-gradient-to-r from-green-500 to-emerald-600 text-white font-bold rounded-lg hover:from-green-600 hover:to-emerald-700 transition-all shadow-md hover:shadow-lg hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Approve
                  </button>
                  <button
                    onClick={() =>
                      onRequestAction({
                        classId: selectedClass.id,
                        studentId: classStudent.student.id,
                        studentName: classStudent.student.name,
                        action: "reject"
                      })
                    }
                    disabled={loading}
                    className="px-4 py-2.5 bg-gradient-to-r from-red-500 to-rose-600 text-white font-bold rounded-lg hover:from-red-600 hover:to-rose-700 transition-all shadow-md hover:shadow-lg hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Reject
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12 bg-gradient-to-br from-green-50 to-blue-50 rounded-2xl border-2 border-dashed border-green-300">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4 text-3xl">
              ✅
            </div>
            <p className="text-gray-600 font-semibold text-lg">
              No pending requests
            </p>
            <p className="text-gray-500 text-sm mt-2">
              All students have been approved or no requests yet
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
