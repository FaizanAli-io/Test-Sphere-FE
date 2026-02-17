import React from "react";
import { Class, RequestAction, BulkRequestAction } from "../types";
import { canManageMembers } from "@/utils/rolePermissions";

interface RequestsModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedClass: Class | null;
  onRequestAction: (action: RequestAction) => void;
  onBulkRequestAction: (action: BulkRequestAction) => void;
  loading?: boolean;
}

export default function RequestsModal({
  isOpen,
  onClose,
  selectedClass,
  onRequestAction,
  onBulkRequestAction,
  loading = false,
}: RequestsModalProps) {
  if (!isOpen || !selectedClass) return null;

  // Filter only pending requests (students who are not approved)
  const pendingStudents =
    selectedClass.students?.filter((classStudent) => !classStudent.approved) || [];

  // Check if the current teacher can approve/reject requests (OWNER only)
  const canApproveRequests = canManageMembers(selectedClass.role);

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-fadeIn">
      <div className="bg-white rounded-3xl p-8 max-w-2xl w-full shadow-2xl transform animate-slideUp max-h-[90vh] overflow-y-auto relative">
        {/* Loading Overlay */}
        {loading && (
          <div className="absolute inset-0 bg-white/80 backdrop-blur-sm flex items-center justify-center z-50 rounded-3xl">
            <div className="bg-white rounded-2xl shadow-2xl p-8 flex flex-col items-center">
              <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-orange-600 mb-4"></div>
              <p className="text-lg font-semibold text-gray-900">Processing request...</p>
              <p className="text-sm text-gray-600 mt-2">Please wait</p>
            </div>
          </div>
        )}

        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-red-600 rounded-xl flex items-center justify-center text-2xl">
              📋
            </div>
            <div>
              <h3 className="text-3xl font-bold text-gray-900">{selectedClass.name} - Requests</h3>
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
          <>
            {!canApproveRequests && (
              <div className="mb-4 p-4 bg-gray-50 border-l-4 border-gray-400 rounded-lg">
                <p className="text-sm text-gray-700 font-medium">
                  ⚠️ You do not have permission to approve or reject student requests. Only the
                  class owner can manage student requests.
                </p>
              </div>
            )}
            {canApproveRequests && (
              <div className="flex gap-3 mb-4">
                <button
                  onClick={() =>
                    onBulkRequestAction({
                      classId: selectedClass.id,
                      action: "approve-all",
                    })
                  }
                  disabled={loading}
                  className="flex-1 px-4 py-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white font-bold rounded-xl hover:from-green-600 hover:to-emerald-700 transition-all shadow-md hover:shadow-lg hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  ✅ Approve All
                </button>
                <button
                  onClick={() =>
                    onBulkRequestAction({
                      classId: selectedClass.id,
                      action: "reject-all",
                    })
                  }
                  disabled={loading}
                  className="flex-1 px-4 py-3 bg-gradient-to-r from-red-500 to-rose-600 text-white font-bold rounded-xl hover:from-red-600 hover:to-rose-700 transition-all shadow-md hover:shadow-lg hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  ❌ Reject All
                </button>
              </div>
            )}
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
                      <p className="font-bold text-gray-900 text-lg">{classStudent.student.name}</p>
                      <p className="text-sm text-gray-600">{classStudent.student.email}</p>
                      <p className="text-xs text-orange-600 font-medium">
                        Requested: {new Date(classStudent.joinedAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  {canApproveRequests && (
                    <div className="flex gap-2">
                      <button
                        onClick={() =>
                          onRequestAction({
                            classId: selectedClass.id,
                            studentId: classStudent.student.id,
                            studentName: classStudent.student.name,
                            action: "approve",
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
                            action: "reject",
                          })
                        }
                        disabled={loading}
                        className="px-4 py-2.5 bg-gradient-to-r from-red-500 to-rose-600 text-white font-bold rounded-lg hover:from-red-600 hover:to-rose-700 transition-all shadow-md hover:shadow-lg hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Reject
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </>
        ) : (
          <div className="text-center py-12 bg-gradient-to-br from-green-50 to-blue-50 rounded-2xl border-2 border-dashed border-green-300">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4 text-3xl">
              ✅
            </div>
            <p className="text-gray-600 font-semibold text-lg">No pending requests</p>
            <p className="text-gray-500 text-sm mt-2">
              All students have been approved or no requests yet
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
