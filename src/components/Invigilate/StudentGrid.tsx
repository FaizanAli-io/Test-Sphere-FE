import React from "react";
import { StudentCard } from "./StudentCard";
import type { InvigilatingStudent } from "@/hooks/useInvigilateStudents";

interface StudentGridProps {
  students: InvigilatingStudent[];
  onStudentClick: (student: InvigilatingStudent) => void;
}

export const StudentGrid: React.FC<StudentGridProps> = ({
  students,
  onStudentClick,
}) => {
  // Safety check: ensure students is an array
  const studentList = Array.isArray(students) ? students : [];

  if (studentList.length === 0) {
    return (
      <div className="text-center py-16">
        <p className="text-gray-400 text-lg">
          No students are currently taking this test
        </p>
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
        />
      ))}
    </div>
  );
};
