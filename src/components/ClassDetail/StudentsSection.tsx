"use client";
import React from "react";
import { canEdit as checkCanEdit } from "@/utils/rolePermissions";
import type { TeacherRole } from "@/utils/rolePermissions";

interface Student {
  id: number;
  name: string;
  email: string;
}

interface StudentsSectionProps {
  students: Student[];
  kickingStudent: number | null;
  onKick: (studentId: number, studentName: string) => void;
  classCode: string;
  userRole?: TeacherRole;
}

const StudentsSection: React.FC<StudentsSectionProps> = ({
  students,
  kickingStudent,
  onKick,
  classCode,
  userRole = "VIEWER",
}) => {
  const canRemoveStudent = userRole === "OWNER" || userRole === "EDITOR";
  return (
    <div>
      <h3 className="text-2xl font-bold text-gray-900 mb-6">Enrolled Students</h3>
      {students?.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {students.map((student, index) => (
            <div
              key={student.id}
              className="bg-gradient-to-br from-white to-blue-50 rounded-2xl p-6 border-2 border-blue-100 hover:border-indigo-300 hover:shadow-lg transition-all"
            >
              <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-blue-500 rounded-xl flex items-center justify-center text-white font-bold text-lg shrink-0">
                  {index + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-bold text-gray-900 text-lg truncate">{student.name}</h4>
                  <p className="text-sm text-gray-600 truncate">{student.email}</p>
                </div>
              </div>
              {canRemoveStudent && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onKick(student.id, student.name);
                  }}
                  disabled={kickingStudent === student.id}
                  className="w-full px-4 py-2 bg-gradient-to-r from-red-500 to-rose-600 text-white font-bold rounded-lg hover:from-red-600 hover:to-rose-700 transition-all shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {kickingStudent === student.id ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                      <span>Removing...</span>
                    </>
                  ) : (
                    <>
                      <span>🚫</span>
                      <span>Remove Student</span>
                    </>
                  )}
                </button>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-16 bg-gradient-to-br from-gray-50 to-blue-50 rounded-2xl border-2 border-dashed border-gray-300">
          <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4 text-4xl">
            👥
          </div>
          <p className="text-gray-600 font-bold text-lg">No students enrolled yet</p>
          <p className="text-gray-500 mt-2">
            Share class code: <span className="font-bold text-indigo-600">{classCode}</span>
          </p>
        </div>
      )}
    </div>
  );
};

export default StudentsSection;
