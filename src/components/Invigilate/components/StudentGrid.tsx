import React from "react";
import { StudentCard } from "./StudentCard";
import type { InvigilatingStudent } from "../hooks";

interface StudentGridProps {
  students: InvigilatingStudent[];
  onStudentClick: (student: InvigilatingStudent) => void;
  onViewLogs?: (student: InvigilatingStudent) => void;
}

export const StudentGrid: React.FC<StudentGridProps> = ({
  students,
  onStudentClick,
  onViewLogs,
}) => {
  // Safety check: ensure students is an array
  const studentList = Array.isArray(students) ? students : [];

  if (studentList.length === 0) {
    return (
      <div className="bg-white rounded-2xl shadow-lg p-16 text-center border-2 border-dashed border-gray-300">
        <div className="text-6xl mb-4">👥</div>
        <p className="text-gray-600 text-xl font-semibold mb-2">No Active Students</p>
        <p className="text-gray-500">No students are currently taking this test</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-6">
      {studentList.map((student) => (
        <StudentCard
          key={student.id}
          student={student}
          onClick={() => onStudentClick(student)}
          onViewLogs={onViewLogs}
        />
      ))}
    </div>
  );
};
