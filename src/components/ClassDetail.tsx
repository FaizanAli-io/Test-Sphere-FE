"use client";

import React, {
  useState,
  useEffect,
  ReactElement,
  useCallback,
  useRef,
} from "react";
import { useRouter, useParams } from "next/navigation";
import api from "../hooks/useApi";
import CreateTestModal from "./CreateTestModal";
import { useNotifications } from "../contexts/NotificationContext";
import { useConfirmation } from "../hooks/useConfirmation";
import ConfirmationModal from "./ConfirmationModal";

// Interfaces
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

// Reusable style constants
const BUTTON_STYLES = {
  primary:
    "px-6 py-3 bg-gradient-to-r from-indigo-600 to-blue-600 text-white font-bold rounded-xl hover:from-indigo-700 hover:to-blue-700 transition-all shadow-lg hover:shadow-xl",
  secondary:
    "px-6 py-3 bg-gradient-to-r from-orange-500 to-red-500 text-white font-bold rounded-xl hover:from-orange-600 hover:to-red-600 transition-all shadow-lg hover:shadow-xl",
};

// Helper functions
const getStatusColor = (status: Test["status"]) => {
  const colors = {
    DRAFT: "bg-gray-100 text-gray-800 border-gray-300",
    ACTIVE: "bg-green-100 text-green-800 border-green-300",
    COMPLETED: "bg-blue-100 text-blue-800 border-blue-300",
    ARCHIVED: "bg-purple-100 text-purple-800 border-purple-300",
  };
  return colors[status] || colors.DRAFT;
};

const getTimeStatus = (startAt: string, endAt: string) => {
  const now = new Date();
  const start = new Date(startAt);
  const end = new Date(endAt);

  if (now >= start && now <= end)
    return { text: "LIVE NOW", color: "bg-red-500 text-white animate-pulse" };
  if (start > now)
    return { text: "UPCOMING", color: "bg-yellow-500 text-white" };
  if (now > end) return { text: "ENDED", color: "bg-gray-500 text-white" };
  return { text: "DRAFT", color: "bg-gray-400 text-white" };
};

export default function ClassDetail(): ReactElement {
  const router = useRouter();
  const params = useParams();
  const classId = params?.classId as string;
  const notifications = useNotifications();
  const confirmation = useConfirmation();

  // Core state - simplified and grouped
  const [classData, setClassData] = useState<ClassData | null>(null);
  const [tests, setTests] = useState<Test[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"students" | "tests">("students");
  const [showCreateTestModal, setShowCreateTestModal] = useState(false);
  const [loadingQuestionCounts, setLoadingQuestionCounts] = useState(false);

  // Refs to prevent concurrent API calls
  const fetchingClassRef = useRef(false);
  const fetchingTestsRef = useRef(false);

  const fetchClassDetails = useCallback(async () => {
    if (!classId || fetchingClassRef.current) return;
    fetchingClassRef.current = true;
    setLoading(true);
    setError(null);

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
          ? data.students.map((s: any) =>
              s?.student
                ? {
                    id: Number(s.student.id),
                    name: s.student.name,
                    email: s.student.email,
                  }
                : {
                    id: Number(s.id),
                    name: s.name ?? "",
                    email: s.email ?? "",
                  }
            )
          : [],
      };
      setClassData(normalized);
    } catch (err) {
      console.error(err);
      setError(
        err instanceof Error ? err.message : "Failed to fetch class data"
      );
    } finally {
      setLoading(false);
      fetchingClassRef.current = false;
    }
  }, [classId]);

  const fetchQuestionCounts = useCallback(async (testsData: Test[]) => {
    setLoadingQuestionCounts(true);
    try {
      const testsWithCounts = await Promise.all(
        testsData.map(async (test) => {
          try {
            const res = await api(`/tests/${test.id}/questions`, {
              method: "GET",
              auth: true,
            });

            if (res.ok) {
              const questions = await res.json();
              return {
                ...test,
                questionCount: Array.isArray(questions) ? questions.length : 0,
              };
            }

            // Handle all non-200 responses as "no questions" - this is expected behavior
            return { ...test, questionCount: 0 };
          } catch (error) {
            // Handle network errors gracefully - return 0 questions
            return { ...test, questionCount: 0 };
          }
        })
      );
      setTests(testsWithCounts);
    } catch (err) {
      // Only log unexpected errors, not the "no questions" case
      console.error("Failed to fetch question counts:", err);
    } finally {
      setLoadingQuestionCounts(false);
    }
  }, []);

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
      setTests(testsData);
      await fetchQuestionCounts(testsData);
    } catch (err) {
      console.error("Failed to fetch tests:", err);
    } finally {
      fetchingTestsRef.current = false;
    }
  }, [classId, fetchQuestionCounts]);

  const handleNavigateToTestDetails = (testId: number) => {
    router.push(`/test/${testId}`);
  };

  const handleTestCreated = async () => {
    await fetchTests();
  };

  useEffect(() => {
    if (classId) {
      fetchClassDetails();
      fetchTests();
    }
  }, [classId]); // Only depend on classId to prevent infinite loops

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
        <div className="text-center">
          <div className="relative">
            <div className="animate-spin rounded-full h-16 w-16 border-4 border-indigo-200"></div>
            <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-indigo-600 absolute top-0"></div>
          </div>
          <p className="mt-6 text-gray-600 font-semibold text-lg">
            Loading class details...
          </p>
        </div>
      </div>
    );
  }

  if (error || !classData) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
        <div className="bg-white p-10 rounded-3xl shadow-2xl text-center max-w-md border-2 border-red-200">
          <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <span className="text-4xl">⚠</span>
          </div>
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            Error Loading Class
          </h2>
          <p className="text-gray-600 mb-8 text-lg">
            {error || "Class not found"}
          </p>
          <button
            onClick={() => router.push("/teacher")}
            className={BUTTON_STYLES.primary}
          >
            Back to Teacher Portal
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      <div className="max-w-7xl mx-auto px-4 py-12">
        <button
          onClick={() => router.push("/teacher")}
          className="group flex items-center gap-2 text-indigo-600 hover:text-indigo-700 font-bold mb-8 transition-all"
        >
          <span className="text-xl group-hover:-translate-x-1 transition-transform">
            ←
          </span>
          Back to Teacher Portal
        </button>

        {/* Class Header */}
        <div className="bg-gradient-to-br from-white to-indigo-50 rounded-3xl shadow-xl border-2 border-indigo-100 p-8 mb-8 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-40 h-40 bg-gradient-to-br from-indigo-600/10 to-blue-600/10 rounded-full -mr-20 -mt-20"></div>
          <div className="relative z-10">
            <h1 className="text-4xl font-bold text-gray-900 mb-3">
              {classData.name}
            </h1>
            <p className="text-gray-600 text-lg mb-4">
              {classData.description || "No description provided"}
            </p>
            <div className="flex items-center gap-4 flex-wrap">
              <div className="px-4 py-2 bg-gradient-to-r from-indigo-600 to-blue-600 text-white font-bold rounded-xl shadow-md">
                Code: {classData.code}
              </div>
              <div className="px-4 py-2 bg-green-100 text-green-800 font-bold rounded-xl border-2 border-green-300">
                {classData.students?.length || 0} Students
              </div>
              <div className="px-4 py-2 bg-orange-100 text-orange-800 font-bold rounded-xl border-2 border-orange-300">
                {tests.length} Tests
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
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
            {/* Students Tab */}
            {activeTab === "students" && (
              <div>
                <h3 className="text-2xl font-bold text-gray-900 mb-6">
                  Enrolled Students
                </h3>
                {classData.students?.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {classData.students.map((student, index) => (
                      <div
                        key={student.id}
                        className="bg-gradient-to-br from-white to-blue-50 rounded-2xl p-6 border-2 border-blue-100 hover:border-indigo-300 hover:shadow-lg transition-all"
                      >
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-blue-500 rounded-xl flex items-center justify-center text-white font-bold text-lg">
                            {index + 1}
                          </div>
                          <div className="flex-1">
                            <h4 className="font-bold text-gray-900 text-lg">
                              {student.name}
                            </h4>
                            <p className="text-sm text-gray-600">
                              {student.email}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-16 bg-gradient-to-br from-gray-50 to-blue-50 rounded-2xl border-2 border-dashed border-gray-300">
                    <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4 text-4xl">
                      👥
                    </div>
                    <p className="text-gray-600 font-bold text-lg">
                      No students enrolled yet
                    </p>
                    <p className="text-gray-500 mt-2">
                      Share class code:{" "}
                      <span className="font-bold text-indigo-600">
                        {classData.code}
                      </span>
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Tests Tab */}
            {activeTab === "tests" && (
              <div>
                <div className="flex justify-between items-center mb-6 flex-wrap gap-4">
                  <h3 className="text-2xl font-bold text-gray-900">
                    Scheduled Tests
                  </h3>
                  <button
                    onClick={() => setShowCreateTestModal(true)}
                    className={BUTTON_STYLES.secondary}
                  >
                    <span className="mr-2">+</span>
                    Create Test
                  </button>
                </div>

                {tests.length > 0 ? (
                  <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                    {tests.map((test) => {
                      const timeStatus = getTimeStatus(
                        test.startAt,
                        test.endAt
                      );

                      return (
                        <div
                          key={test.id}
                          className="group relative bg-white rounded-3xl p-6 border-2 border-gray-200 hover:border-indigo-300 hover:shadow-2xl transition-all duration-300 cursor-pointer transform hover:-translate-y-1"
                          onClick={() => handleNavigateToTestDetails(test.id)}
                        >
                          {/* Status Badges */}
                          <div className="flex items-center justify-between mb-4">
                            <span
                              className={`px-3 py-1 rounded-full text-xs font-bold border-2 ${getStatusColor(test.status)}`}
                            >
                              {test.status}
                            </span>
                            <span
                              className={`px-3 py-1 rounded-full text-xs font-bold ${timeStatus.color}`}
                            >
                              {timeStatus.text}
                            </span>
                          </div>

                          {/* Title & Description */}
                          <h4 className="text-xl font-bold text-gray-900 mb-3 group-hover:text-indigo-700 transition-colors">
                            {test.title}
                          </h4>
                          <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                            {test.description || "No description provided"}
                          </p>

                          {/* Stats */}
                          <div className="space-y-3 mb-6">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-indigo-500 rounded-lg flex items-center justify-center">
                                <span className="text-white text-sm">❓</span>
                              </div>
                              <div>
                                <p className="text-xs text-gray-500 uppercase font-semibold">
                                  Questions
                                </p>
                                <p className="text-lg font-bold text-gray-900">
                                  {loadingQuestionCounts
                                    ? "..."
                                    : test.questionCount || 0}
                                </p>
                              </div>
                            </div>

                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 bg-gradient-to-r from-orange-500 to-red-500 rounded-lg flex items-center justify-center">
                                <span className="text-white text-sm">⏱</span>
                              </div>
                              <div>
                                <p className="text-xs text-gray-500 uppercase font-semibold">
                                  Duration
                                </p>
                                <p className="text-lg font-bold text-gray-900">
                                  {test.duration} min
                                </p>
                              </div>
                            </div>

                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 bg-gradient-to-r from-green-500 to-emerald-500 rounded-lg flex items-center justify-center">
                                <span className="text-white text-sm">📅</span>
                              </div>
                              <div>
                                <p className="text-xs text-gray-500 uppercase font-semibold">
                                  Schedule
                                </p>
                                <p className="text-sm font-semibold text-gray-900">
                                  {new Date(test.startAt).toLocaleDateString(
                                    "en-US",
                                    {
                                      month: "short",
                                      day: "numeric",
                                      hour: "2-digit",
                                      minute: "2-digit",
                                    }
                                  )}
                                </p>
                              </div>
                            </div>
                          </div>

                          {/* Action Indicator */}
                          <div className="flex items-center justify-between pt-4 border-t-2 border-gray-100 group-hover:border-indigo-200 transition-colors">
                            <span className="text-sm text-gray-500 group-hover:text-indigo-600 transition-colors">
                              Click to manage test
                            </span>
                            <span className="text-gray-400 group-hover:text-indigo-600 font-bold transition-colors">
                              →
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center py-16 bg-gradient-to-br from-gray-50 to-orange-50 rounded-2xl border-2 border-dashed border-gray-300">
                    <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4 text-4xl">
                      📝
                    </div>
                    <p className="text-gray-600 font-bold text-lg">
                      No tests created yet
                    </p>
                    <p className="text-gray-500 mt-2 mb-6">
                      Create your first test to get started
                    </p>
                    <button
                      onClick={() => setShowCreateTestModal(true)}
                      className={BUTTON_STYLES.secondary}
                    >
                      Create First Test
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modals */}
      <CreateTestModal
        isOpen={showCreateTestModal}
        onClose={() => setShowCreateTestModal(false)}
        onTestCreated={handleTestCreated}
        prefilledClassId={classData?.id ? Number(classData.id) : undefined}
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
