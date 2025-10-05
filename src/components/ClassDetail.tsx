"use client";

import React, { useState, useEffect, ReactElement } from "react";
import { useRouter, useParams } from "next/navigation";
import api from "../app/hooks/useApi";

interface Student {
  id: string;
  name: string;
  email: string;
}

interface Question {
  id: number;
  testId: number;
  text: string;
  type: "TRUE_FALSE" | "MULTIPLE_CHOICE" | "SHORT_ANSWER" | "LONG_ANSWER";
  options?: string[];
  correctAnswer?: number;
  maxMarks: number;
  image?: string;
}

interface Test {
  id: number;
  title: string;
  description: string;
  duration: number;
  startAt: string;
  endAt: string;
  status: "DRAFT" | "ACTIVE" | "COMPLETED" | "ARCHIVED";
}

interface ClassData {
  id: number;
  name: string;
  description: string;
  code: string;
  students: Array<{
    id: number;
    name: string;
    email: string;
  }>;
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

  // Test modals
  const [showEditTestModal, setShowEditTestModal] = useState(false);
  const [editingTest, setEditingTest] = useState<Test | null>(null);
  const [updatingTest, setUpdatingTest] = useState(false);

  // Question modals
  const [showAddQuestionModal, setShowAddQuestionModal] = useState(false);
  const [showQuestionsModal, setShowQuestionsModal] = useState(false);
  const [showEditQuestionModal, setShowEditQuestionModal] = useState(false);
  const [selectedTestId, setSelectedTestId] = useState<number | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [editingQuestion, setEditingQuestion] = useState<Question | null>(null);
  const [loadingQuestions, setLoadingQuestions] = useState(false);

  const [newQuestion, setNewQuestion] = useState<Question>({
    id: 0,
    testId: 0,
    text: "",
    type: "MULTIPLE_CHOICE",
    options: ["Option A", "Option B", "Option C", "Option D"],
    correctAnswer: 0,
    maxMarks: 1,
    image: "",
  });

  const fetchClassDetails = async () => {
    if (!classId) return;
    setLoading(true);
    setError(null);

    try {
      const classRes = await api(`/classes/${classId}`, { method: "GET", auth: true });
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
                ? { id: Number(s.student.id), name: s.student.name, email: s.student.email }
                : { id: Number(s.id), name: s.name, email: s.email }
            )
          : [],
      };
      setClassData(normalized);
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : "Failed to fetch class data");
    } finally {
      setLoading(false);
    }
  };

  const fetchTests = async () => {
    if (!classId) return;
    try {
      const testsRes = await api(`/tests/class/${classId}`, { method: "GET", auth: true });
      if (!testsRes.ok) {
        const errorData = await testsRes.json();
        throw new Error(errorData.message || "Failed to fetch tests");
      }
      const testsData = await testsRes.json();
      setTests(testsData);
    } catch (err) {
      console.error("Failed to fetch tests:", err);
    }
  };

  const fetchQuestions = async (testId: number) => {
    setLoadingQuestions(true);
    try {
      const res = await api(`/tests/${testId}/questions`, { method: "GET", auth: true });
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || "Failed to fetch questions");
      }
      const data = await res.json();
      setQuestions(data);
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to fetch questions");
    } finally {
      setLoadingQuestions(false);
    }
  };

  const handleViewQuestions = async (testId: number) => {
    setSelectedTestId(testId);
    await fetchQuestions(testId);
    setShowQuestionsModal(true);
  };

  const handleAddQuestion = async () => {
    if (!selectedTestId) return;
    if (!newQuestion.text.trim()) {
      alert("Please enter a question text");
      return;
    }

    if (newQuestion.type === "MULTIPLE_CHOICE") {
      if (!newQuestion.options || newQuestion.options.length < 2) {
        alert("Multiple choice questions must have at least 2 options");
        return;
      }
      if (newQuestion.correctAnswer === undefined || newQuestion.correctAnswer < 0) {
        alert("Please select the correct answer");
        return;
      }
    }

    setLoadingQuestions(true);
    try {
      const payload: any = {
        testId: selectedTestId,
        text: newQuestion.text.trim(),
        type: newQuestion.type,
        maxMarks: Number(newQuestion.maxMarks),
      };

      if (newQuestion.type === "MULTIPLE_CHOICE") {
        payload.options = newQuestion.options?.filter(opt => opt.trim() !== "") || [];
        payload.correctAnswer = Number(newQuestion.correctAnswer);
      }

      if (newQuestion.type === "TRUE_FALSE") {
        payload.options = ["True", "False"];
        payload.correctAnswer = Number(newQuestion.correctAnswer || 0);
      }

      if (newQuestion.image && newQuestion.image.trim()) {
        payload.image = newQuestion.image.trim();
      }

      const res = await api(`/tests/${selectedTestId}/questions`, {
        method: "POST",
        auth: true,
        body: JSON.stringify({ questions: [payload] }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || "Failed to add question");
      }

      alert("Question added successfully!");
      setShowAddQuestionModal(false);
      setNewQuestion({
        id: 0,
        testId: 0,
        text: "",
        type: "MULTIPLE_CHOICE",
        options: ["Option A", "Option B", "Option C", "Option D"],
        correctAnswer: 0,
        maxMarks: 1,
        image: "",
      });
      await fetchQuestions(selectedTestId);
    } catch (err) {
      alert(err instanceof Error ? err.message : "Error adding question");
    } finally {
      setLoadingQuestions(false);
    }
  };

  const handleUpdateQuestion = async () => {
    if (!editingQuestion) return;

    setLoadingQuestions(true);
    try {
      const payload: any = {
        text: editingQuestion.text.trim(),
        type: editingQuestion.type,
        maxMarks: Number(editingQuestion.maxMarks),
      };

      if (editingQuestion.type === "MULTIPLE_CHOICE") {
        payload.options = editingQuestion.options?.filter(opt => opt.trim() !== "") || [];
        payload.correctAnswer = Number(editingQuestion.correctAnswer);
      }

      if (editingQuestion.type === "TRUE_FALSE") {
        payload.options = ["True", "False"];
        payload.correctAnswer = Number(editingQuestion.correctAnswer || 0);
      }

      if (editingQuestion.image && editingQuestion.image.trim()) {
        payload.image = editingQuestion.image.trim();
      }

      const res = await api(`/tests/questions/${editingQuestion.id}`, {
        method: "PATCH",
        auth: true,
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || "Failed to update question");
      }

      alert("Question updated successfully!");
      setShowEditQuestionModal(false);
      setEditingQuestion(null);
      if (selectedTestId) await fetchQuestions(selectedTestId);
    } catch (err) {
      alert(err instanceof Error ? err.message : "Error updating question");
    } finally {
      setLoadingQuestions(false);
    }
  };

  const handleDeleteQuestion = async (questionId: number) => {
    if (!confirm("Are you sure you want to delete this question?")) return;

    try {
      const res = await api(`/tests/questions/${questionId}`, {
        method: "DELETE",
        auth: true,
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || "Failed to delete question");
      }

      alert("Question deleted successfully!");
      if (selectedTestId) await fetchQuestions(selectedTestId);
    } catch (err) {
      alert(err instanceof Error ? err.message : "Error deleting question");
    }
  };

  const handleEditTest = async (testId: number) => {
    try {
      const res = await api(`/tests/${testId}`, { method: "GET", auth: true });
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || "Failed to fetch test");
      }
      const data = await res.json();
      setEditingTest(data);
      setShowEditTestModal(true);
    } catch (err) {
      alert(err instanceof Error ? err.message : "Error fetching test");
    }
  };

  const handleUpdateTest = async () => {
    if (!editingTest) return;

    setUpdatingTest(true);
    try {
      const payload = {
        title: editingTest.title.trim(),
        description: editingTest.description.trim(),
        duration: Number(editingTest.duration),
        startAt: editingTest.startAt,
        endAt: editingTest.endAt,
        status: editingTest.status,
      };

      const res = await api(`/tests/${editingTest.id}`, {
        method: "PATCH",
        auth: true,
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || "Failed to update test");
      }

      alert("Test updated successfully!");
      setShowEditTestModal(false);
      setEditingTest(null);
      await fetchTests();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Error updating test");
    } finally {
      setUpdatingTest(false);
    }
  };

  const handleDeleteTest = async (testId: number) => {
    if (!confirm("Are you sure you want to delete this test? This action cannot be undone.")) return;

    try {
      const res = await api(`/tests/${testId}`, {
        method: "DELETE",
        auth: true,
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || "Failed to delete test");
      }

      alert("Test deleted successfully!");
      await fetchTests();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Error deleting test");
    }
  };

  useEffect(() => {
    fetchClassDetails();
    fetchTests();
  }, [classId]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
        <div className="text-center">
          <div className="relative">
            <div className="animate-spin rounded-full h-16 w-16 border-4 border-indigo-200"></div>
            <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-indigo-600 absolute top-0"></div>
          </div>
          <p className="mt-6 text-gray-600 font-semibold text-lg">Loading class details...</p>
        </div>
      </div>
    );
  }

  if (error || !classData) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
        <div className="bg-white p-10 rounded-3xl shadow-2xl text-center max-w-md border-2 border-red-200">
          <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <span className="text-4xl">⚠️</span>
          </div>
          <h2 className="text-3xl font-bold text-gray-900 mb-4">Error Loading Class</h2>
          <p className="text-gray-600 mb-8 text-lg">{error || "Class not found"}</p>
          <button
            onClick={() => router.push("/teacher")}
            className="px-8 py-4 bg-gradient-to-r from-indigo-600 to-blue-600 text-white font-bold rounded-xl hover:from-indigo-700 hover:to-blue-700 transition-all shadow-lg hover:shadow-xl"
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
          <span className="text-xl group-hover:-translate-x-1 transition-transform">←</span>
          Back to Teacher Portal
        </button>

        {/* Class Header */}
        <div className="bg-gradient-to-br from-white to-indigo-50 rounded-3xl shadow-xl border-2 border-indigo-100 p-8 mb-8 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-40 h-40 bg-gradient-to-br from-indigo-600/10 to-blue-600/10 rounded-full -mr-20 -mt-20"></div>
          <div className="relative z-10">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div>
                <h1 className="text-4xl font-bold text-gray-900 mb-3">{classData.name}</h1>
                <p className="text-gray-600 text-lg mb-4">{classData.description || "No description provided"}</p>
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
                <h3 className="text-2xl font-bold text-gray-900 mb-6">Enrolled Students</h3>
                {classData.students && classData.students.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {classData.students.map((student, index) => (
                      <div
                        key={student.id}
                        className="bg-gradient-to-br from-white to-blue-50 rounded-2xl p-6 border-2 border-blue-100 hover:border-indigo-300 hover:shadow-lg transition-all"
                      >
                        <div className="flex items-center gap-4 mb-3">
                          <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-blue-500 rounded-xl flex items-center justify-center text-white font-bold text-lg">
                            {index + 1}
                          </div>
                          <div className="flex-1">
                            <h4 className="font-bold text-gray-900 text-lg">{student.name}</h4>
                            <p className="text-sm text-gray-600">{student.email}</p>
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
                    <p className="text-gray-600 font-bold text-lg">No students enrolled yet</p>
                    <p className="text-gray-500 mt-2">Share class code: <span className="font-bold text-indigo-600">{classData.code}</span></p>
                  </div>
                )}
              </div>
            )}

            {/* Tests Tab */}
            {activeTab === "tests" && (
              <div>
                <div className="flex justify-between items-center mb-6 flex-wrap gap-4">
                  <h3 className="text-2xl font-bold text-gray-900">Scheduled Tests</h3>
                  <button
                    onClick={() => router.push(`/create-test?classId=${classId}`)}
                    className="px-6 py-3 bg-gradient-to-r from-orange-500 to-red-500 text-white font-bold rounded-xl hover:from-orange-600 hover:to-red-600 transition-all shadow-lg hover:shadow-xl hover:scale-105"
                  >
                    <span className="mr-2">+</span>
                    Create Test
                  </button>
                </div>

                {tests.length > 0 ? (
                  <div className="space-y-4">
                    {tests.map((test) => (
                      <div
                        key={test.id}
                        className="bg-gradient-to-br from-white to-orange-50 rounded-2xl p-6 border-2 border-orange-100 hover:shadow-xl transition-all"
                      >
                        <div className="flex justify-between items-start mb-4 flex-wrap gap-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <h4 className="text-2xl font-bold text-gray-900">{test.title}</h4>
                              <span className={`px-3 py-1 text-xs font-bold rounded-lg ${
                                test.status === "ACTIVE" ? "bg-green-100 text-green-800" :
                                test.status === "DRAFT" ? "bg-gray-100 text-gray-800" :
                                test.status === "COMPLETED" ? "bg-blue-100 text-blue-800" :
                                "bg-purple-100 text-purple-800"
                              }`}>
                                {test.status}
                              </span>
                            </div>
                            <p className="text-gray-600 mb-3">{test.description}</p>
                            <div className="flex items-center gap-4 flex-wrap text-sm text-gray-600">
                              <span className="flex items-center gap-1">
                                <span>⏱️</span>
                                {test.duration} minutes
                              </span>
                              <span className="flex items-center gap-1">
                                <span>📅</span>
                                {new Date(test.startAt).toLocaleDateString()}
                              </span>
                            </div>
                          </div>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          <button
                            onClick={() => handleViewQuestions(test.id)}
                            className="px-4 py-2.5 bg-gradient-to-r from-purple-500 to-indigo-600 text-white font-bold rounded-lg hover:from-purple-600 hover:to-indigo-700 transition-all shadow-md hover:shadow-lg text-sm"
                          >
                            📋 Questions
                          </button>
                          <button
                            onClick={() => {
                              setSelectedTestId(test.id);
                              setShowAddQuestionModal(true);
                            }}
                            className="px-4 py-2.5 bg-gradient-to-r from-green-500 to-emerald-600 text-white font-bold rounded-lg hover:from-green-600 hover:to-emerald-700 transition-all shadow-md hover:shadow-lg text-sm"
                          >
                            ➕ Add Question
                          </button>
                          <button
                            onClick={() => handleEditTest(test.id)}
                            className="px-4 py-2.5 bg-gradient-to-r from-yellow-500 to-orange-500 text-white font-bold rounded-lg hover:from-yellow-600 hover:to-orange-600 transition-all shadow-md hover:shadow-lg text-sm"
                          >
                            ✏️ Edit
                          </button>
                          <button
                            onClick={() => handleDeleteTest(test.id)}
                            className="px-4 py-2.5 bg-gradient-to-r from-red-500 to-rose-600 text-white font-bold rounded-lg hover:from-red-600 hover:to-rose-700 transition-all shadow-md hover:shadow-lg text-sm"
                          >
                            🗑️ Delete
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-16 bg-gradient-to-br from-gray-50 to-orange-50 rounded-2xl border-2 border-dashed border-gray-300">
                    <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4 text-4xl">
                      📝
                    </div>
                    <p className="text-gray-600 font-bold text-lg">No tests created yet</p>
                    <p className="text-gray-500 mt-2 mb-6">Create your first test to get started</p>
                    <button
                      onClick={() => router.push(`/create-test?classId=${classId}`)}
                      className="px-6 py-3 bg-gradient-to-r from-orange-500 to-red-500 text-white font-bold rounded-xl hover:from-orange-600 hover:to-red-600 transition-all shadow-lg hover:shadow-xl"
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

      {/* Edit Test Modal */}
      {showEditTestModal && editingTest && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl w-full max-w-2xl shadow-2xl overflow-hidden">
            <div className="px-8 py-6 bg-gradient-to-r from-yellow-500 to-orange-500">
              <h3 className="text-2xl font-bold text-white">Edit Test</h3>
            </div>
            <div className="p-8 space-y-6">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Title</label>
                <input
                  type="text"
                  value={editingTest.title}
                  onChange={(e) => setEditingTest({ ...editingTest, title: e.target.value })}
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 transition-all text-gray-900"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Description</label>
                <textarea
                  value={editingTest.description}
                  onChange={(e) => setEditingTest({ ...editingTest, description: e.target.value })}
                  rows={3}
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 transition-all text-gray-900 resize-none"
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Duration (minutes)</label>
                  <input
                    type="number"
                    min="1"
                    value={editingTest.duration}
                    onChange={(e) => setEditingTest({ ...editingTest, duration: Number(e.target.value) })}
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 transition-all text-gray-900"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Status</label>
                  <select
                    value={editingTest.status}
                    onChange={(e) => setEditingTest({ ...editingTest, status: e.target.value as Test["status"] })}
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 transition-all text-gray-900 bg-white"
                  >
                    <option value="DRAFT">Draft</option>
                    <option value="ACTIVE">Active</option>
                    <option value="COMPLETED">Completed</option>
                    <option value="ARCHIVED">Archived</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Start Date & Time</label>
                  <input
                    type="datetime-local"
                    value={editingTest.startAt?.slice(0, 16)}
                    onChange={(e) => setEditingTest({ ...editingTest, startAt: e.target.value })}
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 transition-all text-gray-900"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">End Date & Time</label>
                  <input
                    type="datetime-local"
                    value={editingTest.endAt?.slice(0, 16)}
                    onChange={(e) => setEditingTest({ ...editingTest, endAt: e.target.value })}
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 transition-all text-gray-900"
                  />
                </div>
              </div>
              <div className="flex gap-3 pt-4">
                <button
                  onClick={() => setShowEditTestModal(false)}
                  className="flex-1 px-6 py-4 bg-gray-100 text-gray-700 font-bold rounded-xl hover:bg-gray-200 transition-all text-lg"
                >
                  Cancel
                </button>
                <button
                  onClick={handleUpdateTest}
                  disabled={updatingTest}
                  className="flex-1 px-6 py-4 bg-gradient-to-r from-yellow-500 to-orange-500 text-white font-bold rounded-xl hover:from-yellow-600 hover:to-orange-600 transition-all shadow-lg hover:shadow-xl disabled:opacity-50 text-lg"
                >
                  {updatingTest ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add Question Modal */}
      {showAddQuestionModal && selectedTestId && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl w-full max-w-3xl shadow-2xl overflow-hidden max-h-[90vh] overflow-y-auto">
            <div className="px-8 py-6 bg-gradient-to-r from-green-500 to-emerald-600 sticky top-0 z-10">
              <h3 className="text-2xl font-bold text-white">Add New Question</h3>
            </div>
            <div className="p-8 space-y-6">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Question Text *</label>
                <textarea
                  value={newQuestion.text}
                  onChange={(e) => setNewQuestion({ ...newQuestion, text: e.target.value })}
                  placeholder="Enter your question here..."
                  rows={3}
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all text-gray-900 resize-none"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Question Type *</label>
                  <select
                    value={newQuestion.type}
                    onChange={(e) => {
                      const type = e.target.value as Question["type"];
                      if (type === "TRUE_FALSE") {
                        setNewQuestion({ ...newQuestion, type, options: ["True", "False"], correctAnswer: 0 });
                      } else if (type === "MULTIPLE_CHOICE") {
                        setNewQuestion({ ...newQuestion, type, options: ["Option A", "Option B", "Option C", "Option D"], correctAnswer: 0 });
                      } else {
                        setNewQuestion({ ...newQuestion, type, options: undefined, correctAnswer: undefined });
                      }
                    }}
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all text-gray-900 bg-white"
                  >
                    <option value="MULTIPLE_CHOICE">Multiple Choice</option>
                    <option value="TRUE_FALSE">True/False</option>
                    <option value="SHORT_ANSWER">Short Answer</option>
                    <option value="LONG_ANSWER">Long Answer</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Maximum Marks *</label>
                  <input
                    type="number"
                    min="1"
                    value={newQuestion.maxMarks}
                    onChange={(e) => setNewQuestion({ ...newQuestion, maxMarks: Number(e.target.value) })}
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all text-gray-900"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Image URL (Optional)</label>
                <input
                  type="text"
                  value={newQuestion.image || ""}
                  onChange={(e) => setNewQuestion({ ...newQuestion, image: e.target.value })}
                  placeholder="https://example.com/image.jpg"
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all text-gray-900"
                />
              </div>

              {newQuestion.type === "MULTIPLE_CHOICE" && (
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-3">Answer Options *</label>
                  <div className="space-y-3">
                    {newQuestion.options?.map((opt, i) => (
                      <div key={i} className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-emerald-600 text-white font-bold rounded-lg flex items-center justify-center">
                          {String.fromCharCode(65 + i)}
                        </div>
                        <input
                          type="text"
                          value={opt}
                          onChange={(e) => {
                            const opts = [...(newQuestion.options || [])];
                            opts[i] = e.target.value;
                            setNewQuestion({ ...newQuestion, options: opts });
                          }}
                          placeholder={`Option ${String.fromCharCode(65 + i)}`}
                          className="flex-1 px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all text-gray-900"
                        />
                        <label className="flex items-center gap-2 px-4 py-3 bg-green-100 border-2 border-green-300 rounded-xl cursor-pointer hover:bg-green-200 transition-colors">
                          <input
                            type="radio"
                            name="correctAnswer"
                            checked={newQuestion.correctAnswer === i}
                            onChange={() => setNewQuestion({ ...newQuestion, correctAnswer: i })}
                            className="w-4 h-4 text-green-600"
                          />
                          <span className="text-sm font-bold text-gray-700">Correct</span>
                        </label>
                        {(newQuestion.options?.length || 0) > 2 && (
                          <button
                            onClick={() => {
                              const opts = newQuestion.options?.filter((_, idx) => idx !== i);
                              setNewQuestion({ ...newQuestion, options: opts, correctAnswer: newQuestion.correctAnswer === i ? 0 : (newQuestion.correctAnswer! > i ? newQuestion.correctAnswer! - 1 : newQuestion.correctAnswer) });
                            }}
                            className="px-3 py-3 text-red-600 hover:bg-red-50 rounded-xl font-bold border-2 border-red-200"
                          >
                            ✕
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                  <button
                    onClick={() => {
                      const opts = [...(newQuestion.options || []), `Option ${String.fromCharCode(65 + (newQuestion.options?.length || 0))}`];
                      setNewQuestion({ ...newQuestion, options: opts });
                    }}
                    className="mt-3 px-5 py-2.5 text-green-600 hover:bg-green-100 rounded-xl font-bold border-2 border-green-200"
                  >
                    + Add Option
                  </button>
                </div>
              )}

              {newQuestion.type === "TRUE_FALSE" && (
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-3">Correct Answer *</label>
                  <div className="flex gap-4">
                    <label className="flex-1 flex items-center justify-center gap-3 px-6 py-4 bg-green-50 border-2 border-green-300 rounded-xl cursor-pointer hover:bg-green-100 transition-colors">
                      <input
                        type="radio"
                        name="tfAnswer"
                        checked={newQuestion.correctAnswer === 0}
                        onChange={() => setNewQuestion({ ...newQuestion, correctAnswer: 0 })}
                        className="w-5 h-5 text-green-600"
                      />
                      <span className="text-lg font-bold text-gray-900">True</span>
                    </label>
                    <label className="flex-1 flex items-center justify-center gap-3 px-6 py-4 bg-red-50 border-2 border-red-300 rounded-xl cursor-pointer hover:bg-red-100 transition-colors">
                      <input
                        type="radio"
                        name="tfAnswer"
                        checked={newQuestion.correctAnswer === 1}
                        onChange={() => setNewQuestion({ ...newQuestion, correctAnswer: 1 })}
                        className="w-5 h-5 text-red-600"
                      />
                      <span className="text-lg font-bold text-gray-900">False</span>
                    </label>
                  </div>
                </div>
              )}

              {(newQuestion.type === "SHORT_ANSWER" || newQuestion.type === "LONG_ANSWER") && (
                <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-4">
                  <p className="text-sm text-blue-800 font-medium">
                    ℹ️ {newQuestion.type === "SHORT_ANSWER" 
                      ? "Students will provide a brief text answer. Manual grading required."
                      : "Students will provide a detailed text answer. Manual grading required."}
                  </p>
                </div>
              )}

              <div className="flex gap-3 pt-4">
                <button
                  onClick={() => {
                    setShowAddQuestionModal(false);
                    setNewQuestion({
                      id: 0,
                      testId: 0,
                      text: "",
                      type: "MULTIPLE_CHOICE",
                      options: ["Option A", "Option B", "Option C", "Option D"],
                      correctAnswer: 0,
                      maxMarks: 1,
                      image: "",
                    });
                  }}
                  className="flex-1 px-6 py-4 bg-gray-100 text-gray-700 font-bold rounded-xl hover:bg-gray-200 transition-all text-lg"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAddQuestion}
                  disabled={loadingQuestions}
                  className="flex-1 px-6 py-4 bg-gradient-to-r from-green-500 to-emerald-600 text-white font-bold rounded-xl hover:from-green-600 hover:to-emerald-700 transition-all shadow-lg hover:shadow-xl disabled:opacity-50 text-lg"
                >
                  {loadingQuestions ? "Adding..." : "Add Question"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* View Questions Modal */}
      {showQuestionsModal && selectedTestId && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl w-full max-w-4xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
            <div className="px-8 py-6 bg-gradient-to-r from-purple-500 to-indigo-600 flex items-center justify-between">
              <h3 className="text-2xl font-bold text-white">Test Questions</h3>
              <button
                onClick={() => {
                  setShowQuestionsModal(false);
                  setSelectedTestId(null);
                  setQuestions([]);
                }}
                className="w-10 h-10 bg-white/20 hover:bg-white/30 rounded-xl flex items-center justify-center transition-colors text-white font-bold text-xl"
              >
                ✕
              </button>
            </div>
            
            <div className="p-8 overflow-y-auto flex-1">
              {loadingQuestions ? (
                <div className="flex flex-col items-center justify-center py-20">
                  <div className="relative">
                    <div className="animate-spin rounded-full h-16 w-16 border-4 border-purple-200"></div>
                    <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-purple-600 absolute top-0"></div>
                  </div>
                  <p className="mt-6 text-gray-600 font-semibold text-lg">Loading questions...</p>
                </div>
              ) : questions.length === 0 ? (
                <div className="text-center py-16 bg-gradient-to-br from-gray-50 to-purple-50 rounded-2xl border-2 border-dashed border-gray-300">
                  <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4 text-4xl">
                    ❓
                  </div>
                  <p className="text-gray-600 font-bold text-lg">No questions added yet</p>
                  <p className="text-gray-500 mt-2 mb-6">Add questions to make this test complete</p>
                  <button
                    onClick={() => {
                      setShowQuestionsModal(false);
                      setShowAddQuestionModal(true);
                    }}
                    className="px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white font-bold rounded-xl hover:from-green-600 hover:to-emerald-700 transition-all shadow-lg hover:shadow-xl"
                  >
                    Add First Question
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  {questions.map((q, index) => (
                    <div
                      key={q.id}
                      className="bg-gradient-to-r from-gray-50 to-purple-50 rounded-2xl border-2 border-purple-100 p-6 hover:shadow-lg transition-all"
                    >
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center gap-3 flex-1">
                          <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-indigo-600 text-white font-bold rounded-xl flex items-center justify-center">
                            {index + 1}
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <span className="px-3 py-1 bg-indigo-100 text-indigo-800 text-xs font-bold rounded-lg">
                                {q.type.replace(/_/g, " ")}
                              </span>
                              <span className="px-3 py-1 bg-green-100 text-green-800 text-xs font-bold rounded-lg">
                                {q.maxMarks} {q.maxMarks === 1 ? "mark" : "marks"}
                              </span>
                            </div>
                            <p className="text-gray-900 font-semibold text-lg">{q.text}</p>
                          </div>
                        </div>
                      </div>
                      
                      {q.image && (
                        <div className="mb-4">
                          <img
                            src={q.image}
                            alt="Question"
                            className="max-w-sm rounded-xl border-2 border-gray-300"
                            onError={(e) => e.currentTarget.style.display = "none"}
                          />
                        </div>
                      )}

                      {q.options && q.options.length > 0 && (
                        <div className="space-y-2 mb-4">
                          {q.options.map((opt, i) => (
                            <div
                              key={i}
                              className={`px-4 py-3 rounded-lg font-medium ${
                                q.correctAnswer === i
                                  ? "bg-green-100 border-2 border-green-400 text-green-900"
                                  : "bg-white border-2 border-gray-200 text-gray-700"
                              }`}
                            >
                              <span className="font-bold mr-2">{String.fromCharCode(65 + i)}.</span>
                              {opt}
                              {q.correctAnswer === i && (
                                <span className="ml-2 text-green-700 font-bold">✓ Correct</span>
                              )}
                            </div>
                          ))}
                        </div>
                      )}

                      <div className="flex gap-2 pt-3 border-t-2 border-purple-200">
                        <button
                          onClick={() => {
                            setEditingQuestion(q);
                            setShowEditQuestionModal(true);
                          }}
                          className="px-4 py-2 bg-gradient-to-r from-yellow-500 to-orange-500 text-white font-bold rounded-lg hover:from-yellow-600 hover:to-orange-600 transition-all shadow-md text-sm"
                        >
                          ✏️ Edit
                        </button>
                        <button
                          onClick={() => handleDeleteQuestion(q.id)}
                          className="px-4 py-2 bg-gradient-to-r from-red-500 to-rose-600 text-white font-bold rounded-lg hover:from-red-600 hover:to-rose-700 transition-all shadow-md text-sm"
                        >
                          🗑️ Delete
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Edit Question Modal */}
      {showEditQuestionModal && editingQuestion && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl w-full max-w-3xl shadow-2xl overflow-hidden max-h-[90vh] overflow-y-auto">
            <div className="px-8 py-6 bg-gradient-to-r from-yellow-500 to-orange-500 sticky top-0 z-10">
              <h3 className="text-2xl font-bold text-white">Edit Question</h3>
            </div>
            <div className="p-8 space-y-6">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Question Text *</label>
                <textarea
                  value={editingQuestion.text}
                  onChange={(e) => setEditingQuestion({ ...editingQuestion, text: e.target.value })}
                  rows={3}
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 transition-all text-gray-900 resize-none"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Question Type</label>
                  <select
                    value={editingQuestion.type}
                    disabled
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl bg-gray-100 text-gray-900 cursor-not-allowed"
                  >
                    <option value="MULTIPLE_CHOICE">Multiple Choice</option>
                    <option value="TRUE_FALSE">True/False</option>
                    <option value="SHORT_ANSWER">Short Answer</option>
                    <option value="LONG_ANSWER">Long Answer</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Maximum Marks *</label>
                  <input
                    type="number"
                    min="1"
                    value={editingQuestion.maxMarks}
                    onChange={(e) => setEditingQuestion({ ...editingQuestion, maxMarks: Number(e.target.value) })}
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 transition-all text-gray-900"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Image URL (Optional)</label>
                <input
                  type="text"
                  value={editingQuestion.image || ""}
                  onChange={(e) => setEditingQuestion({ ...editingQuestion, image: e.target.value })}
                  placeholder="https://example.com/image.jpg"
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 transition-all text-gray-900"
                />
              </div>

              {editingQuestion.type === "MULTIPLE_CHOICE" && (
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-3">Answer Options</label>
                  <div className="space-y-3">
                    {editingQuestion.options?.map((opt, i) => (
                      <div key={i} className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-yellow-500 to-orange-500 text-white font-bold rounded-lg flex items-center justify-center">
                          {String.fromCharCode(65 + i)}
                        </div>
                        <input
                          type="text"
                          value={opt}
                          onChange={(e) => {
                            const opts = [...(editingQuestion.options || [])];
                            opts[i] = e.target.value;
                            setEditingQuestion({ ...editingQuestion, options: opts });
                          }}
                          className="flex-1 px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 transition-all text-gray-900"
                        />
                        <label className="flex items-center gap-2 px-4 py-3 bg-green-100 border-2 border-green-300 rounded-xl cursor-pointer hover:bg-green-200 transition-colors">
                          <input
                            type="radio"
                            name="editCorrectAnswer"
                            checked={editingQuestion.correctAnswer === i}
                            onChange={() => setEditingQuestion({ ...editingQuestion, correctAnswer: i })}
                            className="w-4 h-4 text-green-600"
                          />
                          <span className="text-sm font-bold text-gray-700">Correct</span>
                        </label>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {editingQuestion.type === "TRUE_FALSE" && (
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-3">Correct Answer</label>
                  <div className="flex gap-4">
                    <label className="flex-1 flex items-center justify-center gap-3 px-6 py-4 bg-green-50 border-2 border-green-300 rounded-xl cursor-pointer hover:bg-green-100 transition-colors">
                      <input
                        type="radio"
                        name="editTfAnswer"
                        checked={editingQuestion.correctAnswer === 0}
                        onChange={() => setEditingQuestion({ ...editingQuestion, correctAnswer: 0 })}
                        className="w-5 h-5 text-green-600"
                      />
                      <span className="text-lg font-bold text-gray-900">True</span>
                    </label>
                    <label className="flex-1 flex items-center justify-center gap-3 px-6 py-4 bg-red-50 border-2 border-red-300 rounded-xl cursor-pointer hover:bg-red-100 transition-colors">
                      <input
                        type="radio"
                        name="editTfAnswer"
                        checked={editingQuestion.correctAnswer === 1}
                        onChange={() => setEditingQuestion({ ...editingQuestion, correctAnswer: 1 })}
                        className="w-5 h-5 text-red-600"
                      />
                      <span className="text-lg font-bold text-gray-900">False</span>
                    </label>
                  </div>
                </div>
              )}

              <div className="flex gap-3 pt-4">
                <button
                  onClick={() => {
                    setShowEditQuestionModal(false);
                    setEditingQuestion(null);
                  }}
                  className="flex-1 px-6 py-4 bg-gray-100 text-gray-700 font-bold rounded-xl hover:bg-gray-200 transition-all text-lg"
                >
                  Cancel
                </button>
                <button
                  onClick={handleUpdateQuestion}
                  disabled={loadingQuestions}
                  className="flex-1 px-6 py-4 bg-gradient-to-r from-yellow-500 to-orange-500 text-white font-bold rounded-xl hover:from-yellow-600 hover:to-orange-600 transition-all shadow-lg hover:shadow-xl disabled:opacity-50 text-lg"
                >
                  {loadingQuestions ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}