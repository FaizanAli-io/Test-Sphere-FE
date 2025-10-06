"use client";

import React, { useState, useEffect } from "react";
import type { ReactElement } from "react";
import { useRouter } from "next/navigation";
import api from "../hooks/useApi";

interface Class {
  id: string;
  name: string;
  description: string;
  code: string;
  createdBy: string;
  students?: Array<{ id: number; name: string; email: string }>;
  createdAt?: string;
}

interface TestItem {
  id: number;
  title: string;
  description?: string;
  duration?: number;
  startAt?: string;
  endAt?: string;
  status?: string;
}

type QuestionType = "TRUE_FALSE" | "MULTIPLE_CHOICE" | "SHORT_ANSWER" | "LONG_ANSWER";

interface SubmissionAnswer {
  id: number; // answerId
  questionId?: number;
  questionText?: string;
  questionType?: QuestionType;
  maxMarks?: number;
  answer?: string; // raw answer string
  obtainedMarks?: number | null; // may be null if not graded
  isAutoEvaluated?: boolean;
}

interface SubmissionItem {
  id: number; // submission id
  student?: { id?: number; name?: string; email?: string };
  totalMarks?: number;
  obtainedMarks?: number | null;
  answers?: SubmissionAnswer[];
}

export default function TeacherPortal(): ReactElement {
  const router = useRouter();
  const [classes, setClasses] = useState<Class[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newClass, setNewClass] = useState({ name: "", description: "" });
  const [showEditModal, setShowEditModal] = useState(false);
  const [editClass, setEditClass] = useState<Class | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [selectedClass, setSelectedClass] = useState<Class | null>(null);
  const [showStudentsModal, setShowStudentsModal] = useState(false);
  const [kickConfirm, setKickConfirm] = useState<{
    classId: string;
    studentId: number;
    studentName: string;
  } | null>(null);
  // Tests modal state
  const [showTestsModal, setShowTestsModal] = useState(false);
  const [testsLoading, setTestsLoading] = useState(false);
  const [testsForClass, setTestsForClass] = useState<string | null>(null);
  const [tests, setTests] = useState<TestItem[]>([]);
  // Submissions modal state
  const [showSubmissionsModal, setShowSubmissionsModal] = useState(false);
  const [submissionsLoading, setSubmissionsLoading] = useState(false);
  const [selectedTestId, setSelectedTestId] = useState<number | null>(null);
  const [submissions, setSubmissions] = useState<SubmissionItem[]>([]);
  // Local grading state per submissionId -> answerId -> obtainedMarks
  const [gradeDraft, setGradeDraft] = useState<Record<number, Record<number, number>>>({});

  const fetchClasses = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await api("/classes", { method: "GET", auth: true });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to fetch classes");
      }
      const data = await response.json();
      setClasses(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch classes");
    } finally {
      setLoading(false);
    }
  };

  const fetchClassDetails = async (classId: string) => {
    try {
      const response = await api(`/classes/${classId}`, { method: "GET", auth: true });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to fetch class details");
      }
      const data = await response.json();
      setSelectedClass(data);
      setShowStudentsModal(true);
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to fetch class details");
    }
  };

  const navigateToClassDetail = (classId: string) => {
    router.push(`/class/${classId}`);
  };

  const fetchTestsForClass = async (classId: string) => {
    setTestsLoading(true);
    setError(null);
    try {
      const response = await api(`/tests/class/${classId}`, { method: "GET", auth: true });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to fetch tests for class");
      }
      const data = await response.json();
      interface RawTest {
        id?: number;
        title?: string;
        description?: string;
        duration?: number;
        startAt?: string;
        endAt?: string;
        status?: string;
      }
      const normalized: TestItem[] = Array.isArray(data)
        ? data
            .map((t: unknown) => {
              if (!t || typeof t !== "object") return null;
              const obj = t as RawTest;
              return {
                id: Number(obj.id),
                title: obj.title ?? "",
                description: obj.description,
                duration: typeof obj.duration === "number" ? obj.duration : undefined,
                startAt: obj.startAt,
                endAt: obj.endAt,
                status: obj.status
              } as TestItem;
            })
            .filter((t): t is TestItem => !!t && Number.isFinite(t.id))
        : [];
      setTests(normalized.filter((t) => Number.isFinite(t.id)));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch tests for class");
      setTests([]);
    } finally {
      setTestsLoading(false);
    }
  };

  const openTestsModal = async (cls: Class) => {
    setTestsForClass(cls.id);
    setShowTestsModal(true);
    await fetchTestsForClass(cls.id);
  };

  const fetchSubmissionsForTest = async (testId: number) => {
    setSubmissionsLoading(true);
    setError(null);
    try {
      const response = await api(`/submissions/test/${testId}`, { method: "GET", auth: true });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to fetch submissions");
      }
      const data = await response.json();
      interface RawAnswer {
        id?: number;
        answerId?: number;
        questionId?: number;
        questionText?: string;
        question?: { text?: string; type?: QuestionType; maxMarks?: number };
        questionType?: QuestionType;
        maxMarks?: number;
        answer?: string;
        text?: string;
        obtainedMarks?: number | null;
        score?: number | null;
        isAutoEvaluated?: boolean;
        autoGraded?: boolean;
      }
      interface RawSubmission {
        id?: number;
        submissionId?: number;
        submission?: { id?: number };
        student?: { id?: number; name?: string; email?: string };
        user?: { id?: number; name?: string; email?: string };
        learner?: { id?: number; name?: string; email?: string };
        totalMarks?: number;
        maxMarks?: number;
        obtainedMarks?: number | null;
        score?: number | null;
        answers?: RawAnswer[];
      }
      const normalized: SubmissionItem[] = Array.isArray(data)
        ? (data as unknown[])
            .map((s) => {
              if (!s || typeof s !== "object") return null;
              const obj = s as RawSubmission;
              const answersArr: SubmissionAnswer[] = Array.isArray(obj.answers)
                ? obj.answers
                    .map((ans) => {
                      if (!ans || typeof ans !== "object") return null;
                      const a = ans as RawAnswer;
                      return {
                        id: Number(a.id ?? a.answerId),
                        questionId: a.questionId,
                        questionText: a.questionText ?? a.question?.text,
                        questionType: a.questionType ?? a.question?.type,
                        maxMarks: a.maxMarks ?? a.question?.maxMarks,
                        answer: a.answer ?? a.text,
                        obtainedMarks: a.obtainedMarks ?? a.score ?? null,
                        isAutoEvaluated: a.isAutoEvaluated ?? a.autoGraded ?? false
                      } as SubmissionAnswer;
                    })
                    .filter((x): x is SubmissionAnswer => !!x)
                : [];
              return {
                id: Number(obj.id ?? obj.submissionId ?? obj.submission?.id),
                student: obj.student ?? obj.user ?? obj.learner ?? undefined,
                totalMarks: obj.totalMarks ?? obj.maxMarks ?? undefined,
                obtainedMarks: obj.obtainedMarks ?? obj.score ?? null,
                answers: answersArr
              } as SubmissionItem;
            })
            .filter((s): s is SubmissionItem => !!s && Number.isFinite(s.id))
        : [];
      setSubmissions(normalized.filter((s) => Number.isFinite(s.id)));
      // Initialize grade draft for manual questions with existing marks
      const initial: Record<number, Record<number, number>> = {};
      normalized.forEach((s) => {
        initial[s.id] = {};
        (s.answers ?? []).forEach((a) => {
          if (typeof a.obtainedMarks === "number") {
            initial[s.id][a.id] = a.obtainedMarks;
          }
        });
      });
      setGradeDraft(initial);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch submissions");
      setSubmissions([]);
    } finally {
      setSubmissionsLoading(false);
    }
  };

  const openSubmissionsModal = async (testId: number) => {
    setSelectedTestId(testId);
    setShowSubmissionsModal(true);
    await fetchSubmissionsForTest(testId);
  };

  const updateDraftMark = (submissionId: number, answerId: number, value: number, max?: number) => {
    const safe = Math.max(0, typeof max === "number" ? Math.min(value, max) : value);
    setGradeDraft((prev) => ({
      ...prev,
      [submissionId]: { ...(prev[submissionId] || {}), [answerId]: safe }
    }));
  };

  const submitGrades = async (submission: SubmissionItem) => {
    const draft = gradeDraft[submission.id] || {};
    const answersPayload = Object.entries(draft).map(([answerId, obtainedMarks]) => ({
      answerId: Number(answerId),
      obtainedMarks
    }));
    if (answersPayload.length === 0) {
      alert("No manual grades to submit for this submission.");
      return;
    }
    setLoading(true);
    try {
      const response = await api(`/submissions/${submission.id}/grade`, {
        method: "POST",
        auth: true,
        body: JSON.stringify({ answers: answersPayload })
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to grade submission");
      }
      alert("✅ Submission graded successfully");
      if (selectedTestId) {
        await fetchSubmissionsForTest(selectedTestId);
      }
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to grade submission");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateClass = async () => {
    if (!newClass.name.trim()) {
      alert("Please enter a class name");
      return;
    }
    setLoading(true);
    try {
      const response = await api("/classes", {
        method: "POST",
        auth: true,
        body: JSON.stringify(newClass)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to create class");
      }

      const data = await response.json();
      alert(
        `✅ Class created successfully!\n\nClass Code: ${data.code}\n\nShare this code with your students to join the class.`
      );
      setShowCreateModal(false);
      setNewClass({ name: "", description: "" });
      fetchClasses();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to create class");
    } finally {
      setLoading(false);
    }
  };

  const handleEditClass = async () => {
    if (!editClass || !editClass.name.trim()) {
      alert("Please enter a class name");
      return;
    }
    setLoading(true);
    try {
      const response = await api(`/classes/${editClass.id}`, {
        method: "PATCH",
        auth: true,
        body: JSON.stringify({
          name: editClass.name,
          description: editClass.description
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to update class");
      }

      alert("✅ Class updated successfully!");
      setShowEditModal(false);
      setEditClass(null);
      fetchClasses();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to update class");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteClass = async (classId: string) => {
    setLoading(true);
    try {
      const response = await api(`/classes/${classId}`, {
        method: "DELETE",
        auth: true
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to delete class");
      }

      alert("✅ Class deleted successfully!");
      setDeleteConfirm(null);
      fetchClasses();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to delete class");
    } finally {
      setLoading(false);
    }
  };

  const handleKickStudent = async () => {
    if (!kickConfirm) return;

    setLoading(true);
    try {
      const response = await api(`/classes/${kickConfirm.classId}/kick`, {
        method: "POST",
        auth: true,
        body: JSON.stringify({ studentId: kickConfirm.studentId })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to remove student");
      }

      alert(`✅ ${kickConfirm.studentName} has been removed from the class`);
      setKickConfirm(null);

      // Refresh class details if modal is open
      if (selectedClass) {
        fetchClassDetails(selectedClass.id);
      }
      fetchClasses();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to remove student");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClasses();
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-block mb-4">
            <div className="w-20 h-20 bg-gradient-to-br from-indigo-600 to-blue-600 rounded-3xl flex items-center justify-center text-4xl shadow-lg transform hover:scale-110 transition-transform">
              👨‍🏫
            </div>
          </div>
          <h1 className="text-5xl font-bold text-gray-900 mb-3 bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-blue-600">
            Teacher Portal
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Manage your classes, track student progress, and create engaging assessments
          </p>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
          <div
            onClick={() => setShowCreateModal(true)}
            className="group relative bg-white rounded-2xl shadow-md border-2 border-transparent p-8 hover:shadow-2xl hover:border-indigo-200 transition-all duration-300 cursor-pointer overflow-hidden"
          >
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-indigo-100 to-blue-100 rounded-full -mr-16 -mt-16 opacity-50 group-hover:scale-150 transition-transform duration-500"></div>
            <div className="relative z-10">
              <div className="w-16 h-16 bg-gradient-to-br from-indigo-600 to-blue-600 rounded-2xl flex items-center justify-center text-4xl mb-5 shadow-lg group-hover:shadow-xl group-hover:scale-110 transition-all">
                🏫
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-3 group-hover:text-indigo-600 transition-colors">
                Create New Class
              </h3>
              <p className="text-gray-600 mb-6 leading-relaxed">
                Set up a new class and generate a unique join code for your students
              </p>
              <div className="inline-flex items-center gap-2 text-indigo-600 font-bold group-hover:gap-4 transition-all">
                Get Started
                <span className="text-xl">→</span>
              </div>
            </div>
          </div>

          <div
            onClick={() => router.push("/create-test")}
            className="group relative bg-white rounded-2xl shadow-md border-2 border-transparent p-8 hover:shadow-2xl hover:border-orange-200 transition-all duration-300 cursor-pointer overflow-hidden"
          >
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-orange-100 to-red-100 rounded-full -mr-16 -mt-16 opacity-50 group-hover:scale-150 transition-transform duration-500"></div>
            <div className="relative z-10">
              <div className="w-16 h-16 bg-gradient-to-br from-orange-500 to-red-500 rounded-2xl flex items-center justify-center text-4xl mb-5 shadow-lg group-hover:shadow-xl group-hover:scale-110 transition-all">
                📝
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-3 group-hover:text-orange-600 transition-colors">
                Create Test
              </h3>
              <p className="text-gray-600 mb-6 leading-relaxed">
                Design comprehensive assessments and schedule them for your classes
              </p>
              <div className="inline-flex items-center gap-2 text-orange-600 font-bold group-hover:gap-4 transition-all">
                Get Started
                <span className="text-xl">→</span>
              </div>
            </div>
          </div>
        </div>

        {/* Classes List */}
        <div className="bg-white rounded-2xl shadow-md border border-gray-100 p-8">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
            <div>
              <h3 className="text-3xl font-bold text-gray-900 mb-2">My Classes</h3>
              <p className="text-gray-600">Manage and monitor all your classes</p>
            </div>
            <button
              onClick={() => setShowCreateModal(true)}
              className="group px-6 py-3.5 bg-gradient-to-r from-indigo-600 to-blue-600 text-white font-bold rounded-xl hover:from-indigo-700 hover:to-blue-700 transition-all shadow-lg hover:shadow-xl hover:scale-105 flex items-center gap-2"
            >
              <span className="text-xl">+</span>
              <span>Create New Class</span>
            </button>
          </div>

          {loading && !classes.length ? (
            <div className="flex flex-col items-center justify-center py-20">
              <div className="relative">
                <div className="animate-spin rounded-full h-16 w-16 border-4 border-indigo-200"></div>
                <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-indigo-600 absolute top-0"></div>
              </div>
              <p className="text-gray-600 font-semibold mt-6 text-lg">Loading your classes...</p>
            </div>
          ) : error ? (
            <div className="bg-gradient-to-r from-red-50 to-red-100 border-2 border-red-300 rounded-2xl p-8 text-center">
              <div className="text-5xl mb-4">⚠️</div>
              <p className="text-red-700 font-bold text-lg mb-2">Error Loading Classes</p>
              <p className="text-red-600">{error}</p>
              <button
                onClick={fetchClasses}
                className="mt-4 px-6 py-2 bg-red-600 text-white font-semibold rounded-lg hover:bg-red-700 transition-colors"
              >
                Try Again
              </button>
            </div>
          ) : classes.length === 0 ? (
            <div className="text-center py-20 bg-gradient-to-br from-gray-50 to-blue-50 rounded-2xl border-2 border-dashed border-gray-300">
              <div className="w-24 h-24 bg-gradient-to-br from-indigo-100 to-blue-100 rounded-full flex items-center justify-center mx-auto mb-6 text-5xl">
                🏫
              </div>
              <h4 className="text-2xl font-bold text-gray-900 mb-3">No Classes Yet</h4>
              <p className="text-gray-600 mb-8 text-lg max-w-md mx-auto">
                Start your teaching journey by creating your first class
              </p>
              <button
                onClick={() => setShowCreateModal(true)}
                className="px-8 py-4 bg-gradient-to-r from-indigo-600 to-blue-600 text-white font-bold rounded-xl hover:from-indigo-700 hover:to-blue-700 transition-all shadow-lg hover:shadow-xl hover:scale-105 text-lg"
              >
                Create Your First Class
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {classes.map((cls) => (
                <div
                  key={cls.id}
                  className="group relative bg-gradient-to-br from-white via-blue-50 to-indigo-50 rounded-2xl p-6 shadow-md border-2 border-blue-100 hover:shadow-2xl hover:border-indigo-300 transition-all duration-300"
                >
                  <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-indigo-600/10 to-blue-600/10 rounded-full -mr-16 -mt-16 group-hover:scale-150 transition-transform duration-500"></div>

                  <div className="relative z-10">
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-3">
                          <span className="px-4 py-2 bg-gradient-to-r from-indigo-600 to-blue-600 text-white text-sm font-bold rounded-lg shadow-md">
                            {cls.code}
                          </span>
                          <span className="text-xs font-mono text-gray-500 bg-white px-3 py-1.5 rounded-lg border border-gray-200">
                            #{cls.id}
                          </span>
                        </div>
                        <h4
                          onClick={() => navigateToClassDetail(cls.id)}
                          className="text-2xl font-bold text-gray-900 mb-2 group-hover:text-indigo-600 transition-colors cursor-pointer hover:underline"
                        >
                          {cls.name}
                        </h4>
                        <p className="text-gray-600 line-clamp-2 leading-relaxed">
                          {cls.description || "No description provided"}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-4 border-t-2 border-indigo-200 mb-4">
                      <div
                        onClick={(e) => {
                          e.stopPropagation();
                          fetchClassDetails(cls.id);
                        }}
                        className="flex items-center gap-2 text-gray-700 hover:text-indigo-600 transition-colors cursor-pointer group/students"
                      >
                        <span className="text-xl">👥</span>
                        <span className="font-bold text-lg">{cls.students?.length || 0}</span>
                        <span className="text-sm font-semibold group-hover/students:underline">
                          {cls.students?.length === 1 ? "Student" : "Students"}
                        </span>
                      </div>

                      {cls.createdAt && (
                        <span className="text-xs text-gray-500 bg-white px-3 py-1.5 rounded-lg border border-gray-200">
                          {new Date(cls.createdAt).toLocaleDateString()}
                        </span>
                      )}
                    </div>

                    <div className="grid grid-cols-3 gap-3">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          navigateToClassDetail(cls.id);
                        }}
                        className="px-4 py-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white text-sm font-bold rounded-xl hover:from-green-600 hover:to-emerald-700 transition-all shadow-md hover:shadow-lg hover:scale-105"
                      >
                        View
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setEditClass(cls);
                          setShowEditModal(true);
                        }}
                        className="px-4 py-3 bg-gradient-to-r from-yellow-500 to-orange-500 text-white text-sm font-bold rounded-xl hover:from-yellow-600 hover:to-orange-600 transition-all shadow-md hover:shadow-lg hover:scale-105"
                      >
                        Edit
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setDeleteConfirm(cls.id);
                        }}
                        className="px-4 py-3 bg-gradient-to-r from-red-500 to-rose-600 text-white text-sm font-bold rounded-xl hover:from-red-600 hover:to-rose-700 transition-all shadow-md hover:shadow-lg hover:scale-105"
                      >
                        Delete
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          openTestsModal(cls);
                        }}
                        className="px-4 py-3 bg-gradient-to-r from-orange-500 to-red-500 text-white text-sm font-bold rounded-xl hover:from-orange-600 hover:to-red-600 transition-all shadow-md hover:shadow-lg hover:scale-105"
                      >
                        View Tests
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Create Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-fadeIn">
          <div className="bg-white rounded-3xl p-8 max-w-lg w-full shadow-2xl transform animate-slideUp">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-12 h-12 bg-gradient-to-br from-indigo-600 to-blue-600 rounded-xl flex items-center justify-center text-2xl">
                🏫
              </div>
              <h3 className="text-3xl font-bold text-gray-900">Create New Class</h3>
            </div>
            <div className="space-y-5">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Class Name *</label>
                <input
                  type="text"
                  value={newClass.name}
                  onChange={(e) => setNewClass({ ...newClass, name: e.target.value })}
                  className="w-full px-4 py-3.5 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-gray-900 bg-gray-50 focus:bg-white transition-all font-medium"
                  placeholder="e.g., Mathematics 101"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Description</label>
                <textarea
                  value={newClass.description}
                  onChange={(e) => setNewClass({ ...newClass, description: e.target.value })}
                  className="w-full px-4 py-3.5 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-gray-900 bg-gray-50 focus:bg-white transition-all font-medium resize-none"
                  rows={4}
                  placeholder="Brief description of the class (optional)"
                />
              </div>
            </div>
            <div className="flex gap-3 mt-8">
              <button
                onClick={() => {
                  setShowCreateModal(false);
                  setNewClass({ name: "", description: "" });
                }}
                className="flex-1 px-6 py-4 bg-gray-100 text-gray-700 font-bold rounded-xl hover:bg-gray-200 transition-all text-lg"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateClass}
                disabled={loading}
                className="flex-1 px-6 py-4 bg-gradient-to-r from-indigo-600 to-blue-600 text-white font-bold rounded-xl hover:from-indigo-700 hover:to-blue-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl text-lg"
              >
                {loading ? "Creating..." : "Create Class"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Tests Modal */}
      {showTestsModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-fadeIn">
          <div className="bg-white rounded-3xl p-8 max-w-3xl w-full shadow-2xl transform animate-slideUp max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-red-500 rounded-xl flex items-center justify-center text-2xl">
                  📝
                </div>
                <div>
                  <h3 className="text-3xl font-bold text-gray-900">Class Tests</h3>
                  {testsForClass && <p className="text-gray-600 mt-1">Class #{testsForClass}</p>}
                </div>
              </div>
              <button
                onClick={() => {
                  setShowTestsModal(false);
                  setTestsForClass(null);
                  setTests([]);
                }}
                className="w-10 h-10 bg-gray-100 hover:bg-gray-200 rounded-xl flex items-center justify-center transition-colors text-gray-600 font-bold text-xl"
              >
                ✕
              </button>
            </div>

            {error && (
              <div className="mb-4 p-3 bg-red-50 border-l-4 border-red-500 rounded">
                <p className="text-sm text-red-700">{error}</p>
              </div>
            )}

            {testsLoading ? (
              <div className="text-center text-gray-600 py-10">Loading tests…</div>
            ) : tests.length === 0 ? (
              <div className="text-center text-gray-500 py-10">
                No tests available for this class.
              </div>
            ) : (
              <div className="space-y-3">
                {tests.map((t) => (
                  <div
                    key={t.id}
                    className="flex items-center justify-between p-4 bg-gradient-to-r from-gray-50 to-orange-50 rounded-xl border-2 border-gray-200"
                  >
                    <div>
                      <p className="font-bold text-gray-900 text-lg">{t.title}</p>
                      {t.description && (
                        <p className="text-sm text-gray-600 line-clamp-2">{t.description}</p>
                      )}
                      <div className="text-xs text-gray-500 mt-2 flex gap-4 flex-wrap">
                        {typeof t.duration === "number" && <span>Duration: {t.duration} min</span>}
                        {t.status && <span>Status: {t.status}</span>}
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => openSubmissionsModal(t.id)}
                        className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition"
                      >
                        View Submissions
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Submissions Modal */}
      {showSubmissionsModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-fadeIn">
          <div className="bg-white rounded-3xl p-8 max-w-5xl w-full shadow-2xl transform animate-slideUp max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-gradient-to-br from-indigo-600 to-blue-600 rounded-xl flex items-center justify-center text-2xl">
                  📄
                </div>
                <div>
                  <h3 className="text-3xl font-bold text-gray-900">Test Submissions</h3>
                  {selectedTestId && <p className="text-gray-600 mt-1">Test #{selectedTestId}</p>}
                </div>
              </div>
              <button
                onClick={() => {
                  setShowSubmissionsModal(false);
                  setSelectedTestId(null);
                  setSubmissions([]);
                }}
                className="w-10 h-10 bg-gray-100 hover:bg-gray-200 rounded-xl flex items-center justify-center transition-colors text-gray-600 font-bold text-xl"
              >
                ✕
              </button>
            </div>

            {error && (
              <div className="mb-4 p-3 bg-red-50 border-l-4 border-red-500 rounded">
                <p className="text-sm text-red-700">{error}</p>
              </div>
            )}

            {submissionsLoading ? (
              <div className="text-center text-gray-600 py-10">Loading submissions…</div>
            ) : submissions.length === 0 ? (
              <div className="text-center text-gray-500 py-10">No submissions yet.</div>
            ) : (
              <div className="space-y-6">
                {submissions.map((s) => (
                  <div key={s.id} className="border rounded-2xl p-6 bg-white shadow-sm">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <p className="text-lg font-bold text-gray-900">
                          {s.student?.name || s.student?.email || `Submission #${s.id}`}
                        </p>
                        <p className="text-sm text-gray-600">ID: {s.id}</p>
                      </div>
                      <button
                        onClick={() => submitGrades(s)}
                        className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
                      >
                        Submit Grades
                      </button>
                    </div>

                    <div className="space-y-4">
                      {(s.answers ?? []).map((a) => {
                        const manual =
                          a.questionType === "SHORT_ANSWER" || a.questionType === "LONG_ANSWER";
                        const value =
                          gradeDraft[s.id]?.[a.id] ??
                          (typeof a.obtainedMarks === "number" ? a.obtainedMarks : 0);
                        return (
                          <div key={a.id} className="p-4 rounded-xl border bg-gray-50">
                            <div className="flex items-center justify-between mb-2">
                              <div className="flex items-center gap-2">
                                <span className="text-xs font-bold px-2 py-1 rounded bg-indigo-100 text-indigo-800">
                                  {a.questionType || "UNKNOWN"}
                                </span>
                                {typeof a.maxMarks === "number" && (
                                  <span className="text-xs font-bold px-2 py-1 rounded bg-green-100 text-green-800">
                                    Max {a.maxMarks}
                                  </span>
                                )}
                              </div>
                              {!manual && (
                                <span className="text-xs text-gray-600">Auto-graded</span>
                              )}
                            </div>
                            {a.questionText && (
                              <p className="text-gray-900 font-semibold mb-1">{a.questionText}</p>
                            )}
                            {typeof a.answer === "string" && (
                              <p className="text-gray-700 text-sm whitespace-pre-wrap">
                                {a.answer}
                              </p>
                            )}
                            <div className="mt-3">
                              {manual ? (
                                <div className="flex items-center gap-3">
                                  <input
                                    type="number"
                                    min={0}
                                    step={0.5}
                                    value={value}
                                    onChange={(e) =>
                                      updateDraftMark(
                                        s.id,
                                        a.id,
                                        Number(e.target.value),
                                        a.maxMarks
                                      )
                                    }
                                    className="w-28 px-3 py-2 border rounded-lg"
                                  />
                                  {typeof a.maxMarks === "number" && (
                                    <span className="text-sm text-gray-600">/ {a.maxMarks}</span>
                                  )}
                                </div>
                              ) : (
                                <div className="text-sm text-gray-700">
                                  Marks: {typeof a.obtainedMarks === "number" ? a.obtainedMarks : 0}
                                  {typeof a.maxMarks === "number" && ` / ${a.maxMarks}`}
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {showEditModal && editClass && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-fadeIn">
          <div className="bg-white rounded-3xl p-8 max-w-lg w-full shadow-2xl transform animate-slideUp">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-12 h-12 bg-gradient-to-br from-yellow-500 to-orange-500 rounded-xl flex items-center justify-center text-2xl">
                ✏️
              </div>
              <h3 className="text-3xl font-bold text-gray-900">Edit Class</h3>
            </div>
            <div className="space-y-5">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Class Name *</label>
                <input
                  type="text"
                  value={editClass.name}
                  onChange={(e) => setEditClass({ ...editClass, name: e.target.value })}
                  className="w-full px-4 py-3.5 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 text-gray-900 bg-gray-50 focus:bg-white transition-all font-medium"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Description</label>
                <textarea
                  value={editClass.description}
                  onChange={(e) => setEditClass({ ...editClass, description: e.target.value })}
                  className="w-full px-4 py-3.5 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 text-gray-900 bg-gray-50 focus:bg-white transition-all font-medium resize-none"
                  rows={4}
                />
              </div>
            </div>
            <div className="flex gap-3 mt-8">
              <button
                onClick={() => {
                  setShowEditModal(false);
                  setEditClass(null);
                }}
                className="flex-1 px-6 py-4 bg-gray-100 text-gray-700 font-bold rounded-xl hover:bg-gray-200 transition-all text-lg"
              >
                Cancel
              </button>
              <button
                onClick={handleEditClass}
                disabled={loading}
                className="flex-1 px-6 py-4 bg-gradient-to-r from-yellow-500 to-orange-500 text-white font-bold rounded-xl hover:from-yellow-600 hover:to-orange-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl text-lg"
              >
                {loading ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Modal */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-fadeIn">
          <div className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl transform animate-slideUp">
            <div className="text-center">
              <div className="w-20 h-20 bg-gradient-to-br from-red-100 to-rose-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <span className="text-4xl">⚠️</span>
              </div>
              <h3 className="text-3xl font-bold text-gray-900 mb-4">Delete Class?</h3>
              <p className="text-gray-600 mb-8 text-lg leading-relaxed">
                Are you sure you want to delete this class? All associated data will be permanently
                removed. This action cannot be undone.
              </p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setDeleteConfirm(null)}
                className="flex-1 px-6 py-4 bg-gray-100 text-gray-700 font-bold rounded-xl hover:bg-gray-200 transition-all text-lg"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDeleteClass(deleteConfirm)}
                disabled={loading}
                className="flex-1 px-6 py-4 bg-gradient-to-r from-red-600 to-rose-600 text-white font-bold rounded-xl hover:from-red-700 hover:to-rose-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl text-lg"
              >
                {loading ? "Deleting..." : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Students Modal */}
      {showStudentsModal && selectedClass && (
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
                onClick={() => {
                  setShowStudentsModal(false);
                  setSelectedClass(null);
                }}
                className="w-10 h-10 bg-gray-100 hover:bg-gray-200 rounded-xl flex items-center justify-center transition-colors text-gray-600 font-bold text-xl"
              >
                ✕
              </button>
            </div>

            {selectedClass.students && selectedClass.students.length > 0 ? (
              <div className="space-y-3">
                {selectedClass.students.map((student, index) => (
                  <div
                    key={student.id}
                    className="flex items-center justify-between p-4 bg-gradient-to-r from-gray-50 to-blue-50 rounded-xl border-2 border-gray-200 hover:border-indigo-300 transition-all"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-blue-500 rounded-xl flex items-center justify-center text-white font-bold text-lg">
                        {index + 1}
                      </div>
                      <div>
                        <p className="font-bold text-gray-900 text-lg">{student.name}</p>
                        <p className="text-sm text-gray-600">{student.email}</p>
                      </div>
                    </div>
                    <button
                      onClick={() =>
                        setKickConfirm({
                          classId: selectedClass.id,
                          studentId: student.id,
                          studentName: student.name
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
      )}

      {/* Kick Student Confirmation Modal */}
      {kickConfirm && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-fadeIn">
          <div className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl transform animate-slideUp">
            <div className="text-center">
              <div className="w-20 h-20 bg-gradient-to-br from-orange-100 to-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <span className="text-4xl">👤</span>
              </div>
              <h3 className="text-3xl font-bold text-gray-900 mb-4">Remove Student?</h3>
              <p className="text-gray-600 mb-2 text-lg">Are you sure you want to remove</p>
              <p className="text-indigo-600 font-bold text-xl mb-6">{kickConfirm.studentName}</p>
              <p className="text-gray-500 text-sm">
                from this class? They will lose access to all class materials and tests.
              </p>
            </div>
            <div className="flex gap-3 mt-8">
              <button
                onClick={() => setKickConfirm(null)}
                className="flex-1 px-6 py-4 bg-gray-100 text-gray-700 font-bold rounded-xl hover:bg-gray-200 transition-all text-lg"
              >
                Cancel
              </button>
              <button
                onClick={handleKickStudent}
                disabled={loading}
                className="flex-1 px-6 py-4 bg-gradient-to-r from-red-600 to-rose-600 text-white font-bold rounded-xl hover:from-red-700 hover:to-rose-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl text-lg"
              >
                {loading ? "Removing..." : "Remove"}
              </button>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }

        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .animate-fadeIn {
          animation: fadeIn 0.2s ease-out;
        }

        .animate-slideUp {
          animation: slideUp 0.3s ease-out;
        }
      `}</style>
    </div>
  );
}
