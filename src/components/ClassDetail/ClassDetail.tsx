"use client";

import React, { useState, useEffect, ReactElement, useCallback, useRef } from "react";
import { useRouter, useParams } from "next/navigation";

import api from "../../hooks/useApi"; // adjusted path (folder moved)
import CreateTestModal from "../CreateTestModal"; // sibling folder
import ConfirmationModal from "../ConfirmationModal"; // sibling component
import { useConfirmation } from "../../hooks/useConfirmation"; // adjusted path

import ClassHeader from "./ClassHeader";
import StudentsSection from "./StudentsSection";
import TestsSection from "./TestsSection";
import TeachersSection from "./TeachersSection";
import InviteTeacherModal from "./InviteTeacherModal";

interface Test {
  id: number;
  title: string;
  description: string;
  duration: number;
  startAt: string;
  endAt: string;
  status: "DRAFT" | "ACTIVE" | "COMPLETED" | "ARCHIVED";
  questionCount?: number;
}

interface Student {
  id: number;
  name: string;
  email: string;
}

interface ClassData {
  id: number;
  name: string;
  description: string;
  code: string;
  students: Student[];
}

const BUTTON_STYLES = {
  primary:
    "px-6 py-3 bg-gradient-to-r from-indigo-600 to-blue-600 text-white font-bold rounded-xl hover:from-indigo-700 hover:to-blue-700 transition-all shadow-lg hover:shadow-xl",
  secondary:
    "px-6 py-3 bg-gradient-to-r from-orange-500 to-red-500 text-white font-bold rounded-xl hover:from-orange-600 hover:to-red-600 transition-all shadow-lg hover:shadow-xl",
};

export default function ClassDetail(): ReactElement {
  const router = useRouter();
  const params = useParams();
  const classId = params?.classId as string;
  const confirmation = useConfirmation();

  const [classData, setClassData] = useState<ClassData | null>(null);
  const [tests, setTests] = useState<Test[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"students" | "teachers" | "tests">("students");
  const [showCreateTestModal, setShowCreateTestModal] = useState(false);
  const [showInviteTeacherModal, setShowInviteTeacherModal] = useState(false);
  const [teacherRefreshTrigger, setTeacherRefreshTrigger] = useState(0);
  const [isCurrentUserOwner, setIsCurrentUserOwner] = useState(false);
  const [userRole, setUserRole] = useState<string>("VIEWER");
  const [kickingStudent, setKickingStudent] = useState<number | null>(null);

  const fetchingClassRef = useRef(false);
  const fetchingTestsRef = useRef(false);

  const fetchClassDetails = useCallback(async () => {
    if (!classId || fetchingClassRef.current) return;
    fetchingClassRef.current = true;
    setLoading(true);
    try {
      const classRes = await api(`/classes/${classId}`, {
        method: "GET",
        auth: true,
      });
      if (!classRes.ok) {
        const errorData = await classRes.json();
        throw new Error(errorData.message || "Failed to fetch class details");
      }
      const data = await classRes.json();
      const normalized: ClassData = {
        id: Number(data.id),
        name: data.name,
        description: data.description ?? "",
        code: data.code,
        students: Array.isArray(data.students)
          ? data.students.map((s: unknown) => {
              if (
                typeof s === "object" &&
                s !== null &&
                "student" in s &&
                typeof (s as { student?: unknown }).student === "object" &&
                (s as { student?: unknown }).student !== null
              ) {
                const inner = (s as { student: Partial<Student> }).student || {};
                return {
                  id: Number(inner.id),
                  name: inner.name ?? "",
                  email: inner.email ?? "",
                } as Student;
              }
              const flat = s as Partial<Student>;
              return {
                id: Number(flat.id),
                name: flat.name ?? "",
                email: flat.email ?? "",
              } as Student;
            })
          : [],
      };
      setClassData(normalized);

      // Determine if current user is owner
      if (Array.isArray(data.teachers) && data.teachers.length > 0) {
        const currentUserEmail = localStorage.getItem("userEmail");

        console.group("👤 Owner Detection Debug");
        console.log("Current User Email from localStorage:", currentUserEmail);
        console.log("Teachers array:", data.teachers);
        console.log("Teachers details:");

        data.teachers.forEach((t: any, idx: number) => {
          console.log(`  [${idx}] Role: ${t.role}, Teacher Email: ${t.teacher?.email}`);
        });

        const isOwner = data.teachers.some(
          (t: any) => t.role === "OWNER" && t.teacher?.email === currentUserEmail,
        );

        console.log("Is Owner?", isOwner);
        console.groupEnd();

        setIsCurrentUserOwner(isOwner);
      } else {
        console.warn("No teachers array found in class data");
        setIsCurrentUserOwner(false);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to fetch class data";
      console.error(message);
    } finally {
      setLoading(false);
      fetchingClassRef.current = false;
      // Get user role from localStorage
      const role = localStorage.getItem("role") || "VIEWER";
      setUserRole(role);
    }
  }, [classId]);

  /* Removed fetchQuestionCounts as per user request, API returns questions now */

  const fetchTests = useCallback(async () => {
    if (!classId || fetchingTestsRef.current) return;
    fetchingTestsRef.current = true;
    try {
      const testsRes = await api(`/tests/class/${classId}`, {
        method: "GET",
        auth: true,
      });
      if (!testsRes.ok) {
        const errorData = await testsRes.json();
        throw new Error(errorData.message || "Failed to fetch tests");
      }
      const testsData = await testsRes.json();

      // Assume questions are included in the testsData response or handle accordingly
      const testsWithCounts = Array.isArray(testsData)
        ? testsData.map((test: any) => ({
            ...test,
            questionCount: Array.isArray(test.questions)
              ? test.questions.length
              : test.questionCount || 0,
          }))
        : [];

      setTests(testsWithCounts);
    } catch (err) {
      console.error("Failed to fetch tests:", err);
    } finally {
      fetchingTestsRef.current = false;
    }
  }, [classId]);

  const handleNavigateToTestDetails = (testId: number) => {
    window.open(`/test/${testId}`, "_blank");
  };

  const handleTestCreated = async () => {
    await fetchTests();
  };

  const handleKickStudent = async (studentId: number, studentName: string) => {
    const confirmed = await confirmation.confirm({
      title: "Remove Student?",
      message: `Are you sure you want to remove ${studentName} from this class? This action cannot be undone.`,
      confirmText: "Remove",
      cancelText: "Cancel",
      type: "danger",
    });
    if (!confirmed) return;
    setKickingStudent(studentId);
    try {
      const response = await api(`/classes/${classId}/remove`, {
        method: "POST",
        auth: true,
        body: JSON.stringify({ studentId }),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to remove student");
      }
      await fetchClassDetails();
    } catch (err) {
      console.error("Failed to remove student:", err);
    } finally {
      setKickingStudent(null);
    }
  };

  useEffect(() => {
    if (classId) {
      fetchClassDetails();
      fetchTests();
    }
  }, [classId, fetchClassDetails, fetchTests]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
        <div className="text-center">
          <div className="relative flex items-center justify-center">
            <div className="animate-spin rounded-full h-16 w-16 border-4 border-indigo-200" />
            <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-indigo-600 absolute top-0" />
          </div>
          <p className="mt-6 text-gray-600 font-semibold text-lg">Loading class details...</p>
        </div>
      </div>
    );
  }

  if (!classData) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
        <div className="bg-white p-10 rounded-3xl shadow-2xl text-center max-w-md border-2 border-red-200">
          <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <span className="text-4xl">⚠</span>
          </div>
          <h2 className="text-3xl font-bold text-gray-900 mb-4">Error Loading Class</h2>
          <p className="text-gray-600 mb-8 text-lg">{"Class not found"}</p>
          <button onClick={() => router.push("/teacher")} className={BUTTON_STYLES.primary}>
            Back to Teacher Portal
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      <div className="max-w-7xl mx-auto px-4 py-12">
        <ClassHeader
          classData={classData}
          testsCount={tests.length}
          onBack={() => router.push("/teacher")}
        />
        <div className="bg-white rounded-3xl shadow-xl border-2 border-gray-100 overflow-hidden">
          <div className="flex border-b-2 border-gray-200">
            <button
              onClick={() => setActiveTab("students")}
              className={`flex-1 px-8 py-5 font-bold text-lg transition-all ${
                activeTab === "students"
                  ? "bg-gradient-to-r from-indigo-600 to-blue-600 text-white"
                  : "text-gray-600 hover:bg-gray-50"
              }`}
            >
              <span className="mr-2">👥</span>
              Students
            </button>
            <button
              onClick={() => setActiveTab("teachers")}
              className={`flex-1 px-8 py-5 font-bold text-lg transition-all ${
                activeTab === "teachers"
                  ? "bg-gradient-to-r from-purple-600 to-pink-600 text-white"
                  : "text-gray-600 hover:bg-gray-50"
              }`}
            >
              <span className="mr-2">👨‍🏫</span>
              Teachers
            </button>
            <button
              onClick={() => setActiveTab("tests")}
              className={`flex-1 px-8 py-5 font-bold text-lg transition-all ${
                activeTab === "tests"
                  ? "bg-gradient-to-r from-orange-500 to-red-500 text-white"
                  : "text-gray-600 hover:bg-gray-50"
              }`}
            >
              <span className="mr-2">📝</span>
              Tests
            </button>
          </div>
          <div className="p-8">
            {activeTab === "students" && (
              <StudentsSection
                students={classData.students}
                kickingStudent={kickingStudent}
                onKick={handleKickStudent}
                classCode={classData.code}
                userRole={userRole}
              />
            )}
            {activeTab === "teachers" && (
              <TeachersSection
                classId={classId}
                onInviteClick={() => setShowInviteTeacherModal(true)}
                refreshTrigger={teacherRefreshTrigger}
                isCurrentUserOwner={isCurrentUserOwner}
              />
            )}
            {activeTab === "tests" && (
              <TestsSection
                tests={tests}
                onCreateTest={() => setShowCreateTestModal(true)}
                onNavigate={handleNavigateToTestDetails}
                userRole={userRole}
              />
            )}
          </div>
        </div>
      </div>
      <CreateTestModal
        isOpen={showCreateTestModal}
        onClose={() => setShowCreateTestModal(false)}
        onTestCreated={handleTestCreated}
        prefilledClassId={classData?.id ? Number(classData.id) : undefined}
      />
      <InviteTeacherModal
        isOpen={showInviteTeacherModal}
        onClose={() => setShowInviteTeacherModal(false)}
        classId={classId}
        onInviteSuccess={() => {
          setActiveTab("teachers");
          setTeacherRefreshTrigger((prev) => prev + 1);
        }}
      />
      <ConfirmationModal
        isOpen={confirmation.isOpen}
        title={confirmation.options.title}
        message={confirmation.options.message}
        confirmText={confirmation.options.confirmText}
        cancelText={confirmation.options.cancelText}
        type={confirmation.options.type}
        onConfirm={confirmation.handleConfirm}
        onCancel={confirmation.handleCancel}
      />
    </div>
  );
}
