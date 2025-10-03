"use client";

import React, { useState, useEffect, ReactElement } from "react";
import { useRouter, useParams } from "next/navigation";
import apix from "../app/hooks/useApi";

interface Student {
  id: string;
  name: string;
  email: string;
  enrolledAt?: string;
}

interface Test {
  id: string;
  title: string;
  description: string;
  date: string;
  duration: number;
  disableTime?: string | null;
  status?: "upcoming" | "ongoing" | "completed";
}

interface ClassData {
  id: string;
  name: string;
  description: string;
  classCode: string;
  teacherId: string;
  teacher: {
    id: string;
    name: string;
    email: string;
  };
  students: {
    studentId: string;
    classId: string;
    student: {
      id: string;
      name: string;
      email: string;
    };
  }[];
  tests?: Test[];
}

export default function ClassDetail(): ReactElement {
  const router = useRouter();
  const params = useParams();
  const classId = params?.classId as string;

  const [classData, setClassData] = useState<ClassData | null>(null);
  const [tests, setTests] = useState<Test[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"students" | "tests">("students");

  const copyClassCode = () => {
    if (classData?.classCode) {
      navigator.clipboard.writeText(classData.classCode);
      alert("Class code copied to clipboard!");
    }
  };

  const fetchClassDetails = async () => {
    if (!classId) return;

    setLoading(true);
    setError(null);

    try {
      const [classRes, testsRes] = await Promise.all([
        apix(`/classes/${classId}`, { method: "GET", auth: true }),
        apix(`/tests/class/${classId}`, { method: "GET", auth: true }),
      ]);

      if (!classRes.ok) throw new Error("Failed to fetch class details");
      if (!testsRes.ok) throw new Error("Failed to fetch tests");

      const classData = await classRes.json();
      const testsData = await testsRes.json();

      const now = new Date();
      const enhancedTests = testsData.map((t: any) => {
        const testDate = new Date(t.date);
        const endDate = new Date(testDate.getTime() + t.duration * 60000);
        let status: "upcoming" | "ongoing" | "completed" = "upcoming";
        if (now >= testDate && now <= endDate) status = "ongoing";
        else if (now > endDate) status = "completed";
        return { ...t, status };
      });

      setClassData({ ...classData, tests: enhancedTests });
      setTests(enhancedTests);
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : "Failed to fetch data");
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveStudent = async (studentId: string) => {
    if (!confirm("Are you sure you want to remove this student?")) return;

    try {
      const response = await apix(`/classes/${classId}/students/${studentId}`, {
        method: "DELETE",
        auth: true,
      });
      if (!response.ok) throw new Error("Failed to remove student");

      alert("Student removed successfully!");
      fetchClassDetails();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to remove student");
    }
  };

  useEffect(() => {
    fetchClassDetails();
  }, [classId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600 font-medium">
            Loading class details...
          </p>
        </div>
      </div>
    );
  }

  if (error || !classData) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
        <div className="bg-white p-8 rounded-2xl shadow-xl text-center max-w-md">
          <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-4xl">❌</span>
          </div>
          <h2 className="text-2xl font-semibold text-gray-900 mb-3">
            Error Loading Class
          </h2>
          <p className="text-gray-600 mb-6">{error || "Class not found"}</p>
          <button
            onClick={() => router.push("/teacher")}
            className="px-6 py-3 bg-indigo-600 text-white font-semibold rounded-xl hover:bg-indigo-700 transition-colors"
          >
            Back to Teacher Portal
          </button>
        </div>
      </div>
    );
  }

  const students: Student[] =
    classData.students?.map((s) => ({
      id: s.student.id,
      name: s.student.name,
      email: s.student.email,
    })) || [];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Back Button */}
        <button
          onClick={() => router.push("/teacher")}
          className="text-indigo-600 hover:text-indigo-700 font-semibold mb-6 flex items-center gap-2 transition-colors"
        >
          <span>←</span> Back to Teacher Portal
        </button>

        {/* Class Header */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 mb-8">
          <div className="flex flex-col lg:flex-row lg:justify-between gap-6">
            <div className="flex-1">
              <h1 className="text-4xl font-bold text-gray-900 mb-3">
                {classData.name}
              </h1>
              <p className="text-gray-600 text-lg">{classData.description}</p>
            </div>

            <div className="flex flex-col sm:flex-row lg:flex-col gap-4 lg:w-64">
              <div className="flex-1 bg-gradient-to-br from-indigo-600 to-blue-600 text-white rounded-xl p-5 shadow-md">
                <p className="text-sm opacity-90 mb-2 font-medium">
                  Class Code
                </p>
                <p className="text-3xl font-bold mb-3">{classData.classCode}</p>
                <button
                  onClick={copyClassCode}
                  className="w-full px-4 py-2.5 bg-white text-indigo-600 text-sm font-semibold rounded-lg hover:bg-gray-100 transition-colors"
                >
                  📋 Copy Code
                </button>
              </div>
              <div className="flex-1 bg-gray-50 rounded-xl p-5 border border-gray-200">
                <p className="text-sm text-gray-600 mb-2 font-medium">
                  Total Students
                </p>
                <p className="text-4xl font-bold text-gray-900">
                  {students.length}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="flex border-b border-gray-200">
            <button
              onClick={() => setActiveTab("students")}
              className={`flex-1 px-6 py-4 font-semibold transition-colors ${
                activeTab === "students"
                  ? "bg-indigo-600 text-white"
                  : "bg-white text-gray-600 hover:bg-gray-50"
              }`}
            >
              👥 Students ({students.length})
            </button>
            <button
              onClick={() => setActiveTab("tests")}
              className={`flex-1 px-6 py-4 font-semibold transition-colors ${
                activeTab === "tests"
                  ? "bg-indigo-600 text-white"
                  : "bg-white text-gray-600 hover:bg-gray-50"
              }`}
            >
              📝 Tests ({tests.length})
            </button>
          </div>

          <div className="p-8">
            {/* Students Tab */}
            {activeTab === "students" && (
              <div>
                {students.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                    {students.map((s) => (
                      <div
                        key={s.id}
                        className="bg-gradient-to-br from-white to-blue-50 rounded-xl p-5 border border-blue-100 hover:shadow-md transition-all"
                      >
                        <div className="flex items-center gap-3 mb-4">
                          <div className="w-12 h-12 bg-gradient-to-br from-indigo-600 to-blue-600 rounded-full flex items-center justify-center text-white font-bold text-lg shadow-sm">
                            {s.name?.charAt(0).toUpperCase()}
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className="font-semibold text-gray-900 truncate">
                              {s.name}
                            </h4>
                            <p className="text-sm text-gray-600 truncate">
                              {s.email}
                            </p>
                          </div>
                        </div>
                        <button
                          onClick={() => handleRemoveStudent(s.id)}
                          className="w-full px-3 py-2.5 bg-red-500 text-white text-sm font-semibold rounded-lg hover:bg-red-600 transition-colors"
                        >
                          Remove Student
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-16 bg-gray-50 rounded-xl">
                    <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4 text-4xl">
                      👥
                    </div>
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">
                      No Students Yet
                    </h3>
                    <p className="text-gray-600 mb-1">
                      Share the class code with students to get started
                    </p>
                    <p className="text-sm text-gray-500">
                      Class Code:{" "}
                      <span className="font-bold text-indigo-600">
                        {classData.classCode}
                      </span>
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Tests Tab */}
            {activeTab === "tests" && (
              <div>
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-xl font-semibold text-gray-900">
                    Scheduled Tests
                  </h3>
                  <button
                    onClick={() => router.push("/create-test")}
                    className="px-5 py-2.5 bg-gradient-to-r from-orange-500 to-red-500 text-white font-semibold rounded-xl hover:from-orange-600 hover:to-red-600 transition-all shadow-sm"
                  >
                    + Create Test
                  </button>
                </div>

                {tests.length > 0 ? (
                  <div className="space-y-4">
                    {tests.map((t) => (
                      <div
                        key={t.id}
                        className="bg-gradient-to-br from-white to-orange-50 rounded-xl p-6 border border-orange-100 hover:shadow-md transition-all"
                      >
                        <div className="flex justify-between items-start mb-4">
                          <div className="flex-1">
                            <h4 className="text-xl font-semibold text-gray-900 mb-1">
                              {t.title}
                            </h4>
                            <p className="text-gray-600 text-sm">
                              {t.description}
                            </p>
                          </div>
                          <span
                            className={`px-3 py-1.5 rounded-lg text-xs font-bold ml-4 ${
                              t.status === "upcoming"
                                ? "bg-blue-100 text-blue-700"
                                : t.status === "ongoing"
                                ? "bg-green-100 text-green-700"
                                : "bg-gray-100 text-gray-700"
                            }`}
                          >
                            {t.status?.toUpperCase()}
                          </span>
                        </div>
                        <div className="grid grid-cols-3 gap-4 pt-4 border-t border-orange-200">
                          <div>
                            <p className="text-xs text-gray-500 font-medium mb-1">
                              Duration
                            </p>
                            <p className="font-semibold text-gray-900">
                              {t.duration} min
                            </p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-500 font-medium mb-1">
                              Date
                            </p>
                            <p className="font-semibold text-gray-900">
                              {new Date(t.date).toLocaleDateString()}
                            </p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-500 font-medium mb-1">
                              Time
                            </p>
                            <p className="font-semibold text-gray-900">
                              {new Date(t.date).toLocaleTimeString([], {
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-16 bg-gray-50 rounded-xl">
                    <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4 text-4xl">
                      📝
                    </div>
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">
                      No Tests Scheduled
                    </h3>
                    <p className="text-gray-600 mb-6">
                      Create your first test for this class
                    </p>
                    <button
                      onClick={() => router.push("/create-test")}
                      className="px-6 py-3 bg-gradient-to-r from-orange-500 to-red-500 text-white font-semibold rounded-xl hover:from-orange-600 hover:to-red-600 transition-all"
                    >
                      Create Test
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
