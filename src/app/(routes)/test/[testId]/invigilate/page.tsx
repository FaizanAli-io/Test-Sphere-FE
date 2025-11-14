"use client";

import React, { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, RefreshCw } from "lucide-react";
import { StudentGrid, StudentLivestreamModal } from "@/components/Invigilation";
import { useInvigilateStudents } from "@/hooks/useInvigilateStudents";
import type { InvigilatingStudent } from "@/hooks/useInvigilateStudents";

export default function InvigilatePage() {
  const params = useParams();
  const router = useRouter();
  const testId = params?.testId as string;

  const { students, loading, error, refetch } = useInvigilateStudents(testId);
  const [selectedStudent, setSelectedStudent] =
    useState<InvigilatingStudent | null>(null);

  const handleStudentClick = (student: InvigilatingStudent) => {
    setSelectedStudent(student);
  };

  const handleCloseModal = () => {
    setSelectedStudent(null);
  };

  const handleBack = () => {
    router.push(`/test/${testId}`);
  };

  if (loading && students.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-yellow-500 mx-auto mb-4"></div>
          <p className="text-gray-300 text-lg">Loading students...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-500 text-lg mb-4">Error: {error}</p>
          <button
            onClick={refetch}
            className="px-6 py-2 bg-yellow-500 hover:bg-yellow-600 text-white rounded-lg transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <button
              onClick={handleBack}
              className="flex items-center gap-2 text-gray-300 hover:text-white transition-colors"
            >
              <ArrowLeft size={20} />
              <span>Back to Test</span>
            </button>
            <button
              onClick={refetch}
              disabled={loading}
              className="flex items-center gap-2 px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors disabled:opacity-50"
            >
              <RefreshCw size={18} className={loading ? "animate-spin" : ""} />
              <span>Refresh</span>
            </button>
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">
            Test Invigilation
          </h1>
          <p className="text-gray-400">
            {students.length} {students.length === 1 ? "student" : "students"}{" "}
            currently taking the test
          </p>
        </div>

        {/* Student Grid */}
        <StudentGrid students={students} onStudentClick={handleStudentClick} />

        {/* Livestream Modal */}
        <StudentLivestreamModal
          student={selectedStudent}
          teacherId={
            typeof window !== "undefined"
              ? localStorage.getItem("userId") || ""
              : ""
          }
          testId={testId}
          onClose={handleCloseModal}
        />
      </div>
    </div>
  );
}
