"use client";

import { ArrowLeft } from "lucide-react";
import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";

import api from "@/hooks/useApi";
import { useInvigilateStudents } from "./hooks";
import type { InvigilatingStudent } from "./hooks";
import { StudentGrid, StudentLivestreamModal, ProctoringLogsModal } from "./components";

export default function Invigilate() {
  const params = useParams();
  const router = useRouter();
  const testId = params?.testId as string;

  const { students, loading, error, refetch } = useInvigilateStudents(testId);
  const [selectedStudent, setSelectedStudent] = useState<InvigilatingStudent | null>(null);
  const [teacherId, setTeacherId] = useState<string>("");
  const [testTitle, setTestTitle] = useState<string>("");

  useEffect(() => {
    let ignore = false;
    const fetchMe = async () => {
      try {
        const res = await api("/auth/me", { auth: true, method: "GET" });
        if (!ignore && res.ok) {
          const me = await res.json();
          setTeacherId(String(me.id));
        }
      } catch {
        // ignore
      }
    };
    fetchMe();
    return () => {
      ignore = true;
    };
  }, []);

  // Fetch test title for header display
  useEffect(() => {
    let ignore = false;
    const fetchTest = async () => {
      if (!testId) return;
      try {
        const res = await api(`/tests/${testId}`, { auth: true, method: "GET" });
        if (!ignore && res.ok) {
          const test = await res.json();
          setTestTitle(test?.title ?? "N / A");
        }
      } catch {
        // ignore
      }
    };
    fetchTest();
    return () => {
      ignore = true;
    };
  }, [testId]);
  const [logsModalOpen, setLogsModalOpen] = useState(false);
  const [selectedSubmissionId, setSelectedSubmissionId] = useState<number | null>(null);

  const handleStudentClick = (student: InvigilatingStudent) => {
    setSelectedStudent(student);
  };

  const handleViewLogs = (student: InvigilatingStudent) => {
    setSelectedSubmissionId(student.submissionId);
    setLogsModalOpen(true);
  };

  const handleCloseModal = () => {
    setSelectedStudent(null);
  };

  const handleCloseLogsModal = () => {
    setLogsModalOpen(false);
    setSelectedSubmissionId(null);
  };

  const handleBack = () => {
    router.push(`/test/${testId}`);
  };

  if (loading && students.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-100 via-purple-50 to-pink-100 flex items-center justify-center">
        <div className="text-center bg-white rounded-2xl shadow-lg p-12 max-w-md mx-4">
          <div className="relative inline-flex mb-6">
            <div className="animate-spin rounded-full h-16 w-16 border-4 border-indigo-200"></div>
            <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-indigo-600 absolute top-0 left-0"></div>
          </div>
          <p className="text-gray-800 text-lg font-semibold">Loading students...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-100 via-purple-50 to-pink-100 flex items-center justify-center">
        <div className="text-center bg-white rounded-2xl shadow-lg p-12 max-w-md mx-4">
          <div className="text-5xl mb-4">⚠️</div>
          <p className="text-red-600 text-lg mb-4 font-semibold">Error: {error}</p>
          <button
            onClick={refetch}
            className="px-6 py-3 bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 text-white rounded-xl transition-all shadow-lg hover:shadow-xl font-semibold"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-100 via-purple-50 to-pink-100">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <button
              onClick={handleBack}
              className="flex items-center gap-2 px-4 py-2 bg-white hover:bg-gray-50 text-gray-700 rounded-xl transition-all shadow-md hover:shadow-lg font-semibold"
            >
              <ArrowLeft size={20} />
              <span>Back to Test</span>
            </button>
            <div className="flex items-center gap-2 px-4 py-2 bg-white rounded-xl shadow-md">
              <div
                className={`w-2 h-2 rounded-full ${loading ? "bg-yellow-500 animate-pulse" : "bg-green-500"}`}
              ></div>
              <span className="text-sm text-gray-600 font-medium">
                {loading ? "Updating..." : "Live"}
              </span>
            </div>
          </div>
          <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
            <h1 className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-blue-600 mb-2">
              Test Invigilation ({testTitle})
            </h1>
            <p className="text-gray-600 text-lg">
              {students.length} {students.length === 1 ? "student" : "students"} currently taking
              the test
            </p>
          </div>
        </div>

        {/* Student Grid */}
        <StudentGrid
          students={students}
          onStudentClick={handleStudentClick}
          onViewLogs={handleViewLogs}
        />

        {/* Livestream Modal */}
        <StudentLivestreamModal
          student={selectedStudent}
          teacherId={teacherId}
          testId={testId}
          onClose={handleCloseModal}
        />

        {/* Proctoring Logs Modal */}
        <ProctoringLogsModal
          open={logsModalOpen}
          submissionId={selectedSubmissionId}
          onClose={handleCloseLogsModal}
        />
      </div>
    </div>
  );
}
