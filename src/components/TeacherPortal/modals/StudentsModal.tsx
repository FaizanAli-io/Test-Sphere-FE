import React from "react";
import { Class, KickConfirm } from "../types";

interface StudentsModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedClass: Class | null;
  onKickStudent: (kickConfirm: KickConfirm) => void;
}

export default function StudentsModal({
  isOpen,
  onClose,
  selectedClass,
  onKickStudent,
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
              <h3 className="text-3xl font-bold text-gray-900">{selectedClass.name}</h3>
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
                    <p className="font-bold text-gray-900 text-lg">{classStudent.student.name}</p>
                    <p className="text-sm text-gray-600">{classStudent.student.email}</p>
                  </div>
                </div>
                <button
                  onClick={() =>
                    onKickStudent({
                      classId: selectedClass.id,
                      studentId: classStudent.student.id,
                      studentName: classStudent.student.name,
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
            <p className="text-gray-600 font-semibold text-lg">No students enrolled yet</p>
            <p className="text-gray-500 text-sm mt-2">
              Share class code:{" "}
              <span className="font-bold text-indigo-600">{selectedClass.code}</span>
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
