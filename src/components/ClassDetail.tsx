"use client";

import React, { useState, useEffect, ReactElement, useCallback } from "react";
import Image from "next/image";
import { useRouter, useParams } from "next/navigation";
import api from "../hooks/useApi";
import CreateTestModal from "./CreateTestModal";
import { useNotifications } from "../contexts/NotificationContext";
import { useConfirmation } from "../hooks/useConfirmation";
import ConfirmationModal from "./ConfirmationModal";

// Removed unused Student interface

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
  questionCount?: number;
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
  const notifications = useNotifications();
  const confirmation = useConfirmation();

  const [classData, setClassData] = useState<ClassData | null>(null);
  const [tests, setTests] = useState<Test[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"students" | "tests">("students");
  const [loadingQuestionCounts, setLoadingQuestionCounts] = useState(false);

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
    image: ""
  });
  // AI generation state (shared inside add question modal)
  const [aiPrompt, setAiPrompt] = useState("");
  const [aiGenerating, setAiGenerating] = useState(false);
  const [aiPdfUploading, setAiPdfUploading] = useState(false);
  const [aiDesiredCount, setAiDesiredCount] = useState(5);
  const [aiMessages, setAiMessages] = useState<string[]>([]);
  const [showAiSection, setShowAiSection] = useState(false);

  // AI question approval state
  const [showApprovalModal, setShowApprovalModal] = useState(false);
  const [pendingApprovalQuestions, setPendingApprovalQuestions] = useState<
    Question[]
  >([]);
  const [approvedQuestionIds, setApprovedQuestionIds] = useState<Set<number>>(
    new Set()
  );

  // Create test modal state
  const [showCreateTestModal, setShowCreateTestModal] = useState(false);

  const fetchClassDetails = useCallback(async () => {
    if (!classId) return;
    setLoading(true);
    setError(null);

    try {
      const classRes = await api(`/classes/${classId}`, {
        method: "GET",
        auth: true
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
          ? data.students.map(
              (s: {
                id?: number;
                name?: string;
                email?: string;
                student?: { id: number; name: string; email: string };
              }) =>
                s?.student
                  ? {
                      id: Number(s.student.id),
                      name: s.student.name,
                      email: s.student.email
                    }
                  : {
                      id: Number(s.id),
                      name: s.name ?? "",
                      email: s.email ?? ""
                    }
            )
          : []
      };
      setClassData(normalized);
    } catch (err) {
      console.error(err);
      setError(
        err instanceof Error ? err.message : "Failed to fetch class data"
      );
    } finally {
      setLoading(false);
    }
  }, [classId]);

  const fetchTests = useCallback(async () => {
    if (!classId) return;
    try {
      const testsRes = await api(`/tests/class/${classId}`, {
        method: "GET",
        auth: true
      });
      if (!testsRes.ok) {
        const errorData = await testsRes.json();
        throw new Error(errorData.message || "Failed to fetch tests");
      }
      const testsData = await testsRes.json();
      setTests(testsData);

      // Fetch question counts for each test
      await fetchQuestionCounts(testsData);
    } catch (err) {
      console.error("Failed to fetch tests:", err);
    }
  }, [classId]);

  const fetchQuestionCounts = async (testsData: Test[]) => {
    setLoadingQuestionCounts(true);
    try {
      const testsWithCounts = await Promise.all(
        testsData.map(async (test) => {
          try {
            const res = await api(`/tests/${test.id}/questions`, {
              method: "GET",
              auth: true
            });
            if (res.ok) {
              const questions = await res.json();
              return {
                ...test,
                questionCount: Array.isArray(questions) ? questions.length : 0
              };
            }
            return { ...test, questionCount: 0 };
          } catch {
            return { ...test, questionCount: 0 };
          }
        })
      );
      setTests(testsWithCounts);
    } catch (err) {
      console.error("Failed to fetch question counts:", err);
    } finally {
      setLoadingQuestionCounts(false);
    }
  };

  const fetchQuestions = async (testId: number) => {
    setLoadingQuestions(true);
    try {
      const res = await api(`/tests/${testId}/questions`, {
        method: "GET",
        auth: true
      });
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

  // Commented out unused function
  // const handleViewQuestions = async (testId: number) => {
  //   setSelectedTestId(testId);
  //   await fetchQuestions(testId);
  //   setShowQuestionsModal(true);
  // };

  const handleAddQuestion = async () => {
    if (!selectedTestId) return;
    if (!newQuestion.text.trim()) {
      notifications.showError("Please enter a question text");
      return;
    }

    if (newQuestion.type === "MULTIPLE_CHOICE") {
      if (!newQuestion.options || newQuestion.options.length < 2) {
        alert("Multiple choice questions must have at least 2 options");
        return;
      }
      if (
        newQuestion.correctAnswer === undefined ||
        newQuestion.correctAnswer < 0
      ) {
        notifications.showError("Please select the correct answer");
        return;
      }
    }

    setLoadingQuestions(true);
    try {
      interface QuestionCreatePayload {
        testId: number;
        text: string;
        type: Question["type"];
        maxMarks: number;
        options?: string[];
        correctAnswer?: number;
        image?: string;
      }
      const payload: QuestionCreatePayload = {
        testId: selectedTestId,
        text: newQuestion.text.trim(),
        type: newQuestion.type,
        maxMarks: Number(newQuestion.maxMarks)
      };

      if (newQuestion.type === "MULTIPLE_CHOICE") {
        payload.options =
          newQuestion.options?.filter((opt) => opt.trim() !== "") || [];
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
        body: JSON.stringify({ questions: [payload] })
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || "Failed to add question");
      }

      notifications.showSuccess("Question added successfully!");
      setShowAddQuestionModal(false);
      setNewQuestion({
        id: 0,
        testId: 0,
        text: "",
        type: "MULTIPLE_CHOICE",
        options: ["Option A", "Option B", "Option C", "Option D"],
        correctAnswer: 0,
        maxMarks: 1,
        image: ""
      });
      await fetchQuestions(selectedTestId);
    } catch (err) {
      notifications.showError(
        err instanceof Error ? err.message : "Error adding question"
      );
    } finally {
      setLoadingQuestions(false);
    }
  };

  // -------------------- AI HELPERS --------------------
  interface AIQuestionRaw {
    text?: string;
    question?: string;
    type?: string;
    options?: string[];
    correctAnswer?: number | string;
    answer?: number | string;
    maxMarks?: number;
    marks?: number;
  }

  const normalizeAIQuestion = (q: AIQuestionRaw): Question | null => {
    const text = (q.text || q.question || "").trim();
    if (!text) return null;
    const rawType = (q.type || "MULTIPLE_CHOICE").toUpperCase();
    let type: Question["type"] = "MULTIPLE_CHOICE";
    if (
      ["TRUE_FALSE", "MULTIPLE_CHOICE", "SHORT_ANSWER", "LONG_ANSWER"].includes(
        rawType
      )
    ) {
      type = rawType as Question["type"];
    }
    let options = q.options;
    if (type === "TRUE_FALSE" && !options) options = ["True", "False"];
    let correctAnswer: number | undefined = undefined;
    const rawAnswer = q.correctAnswer ?? q.answer;
    if (type === "MULTIPLE_CHOICE" || type === "TRUE_FALSE") {
      if (typeof rawAnswer === "number") correctAnswer = rawAnswer;
      else if (typeof rawAnswer === "string") {
        const upper = rawAnswer.trim().toUpperCase();
        if (/^[A-D]$/.test(upper)) correctAnswer = upper.charCodeAt(0) - 65;
        else if (upper === "TRUE") correctAnswer = 0;
        else if (upper === "FALSE") correctAnswer = 1;
      }
      if (correctAnswer === undefined && type === "TRUE_FALSE")
        correctAnswer = 0;
    }
    const maxMarks = Number(q.maxMarks ?? q.marks ?? 1) || 1;
    return {
      id: 0,
      testId: selectedTestId || 0,
      text,
      type,
      options,
      correctAnswer,
      maxMarks
    };
  };

  const appendAiMessage = (msg: string) => setAiMessages((m) => [...m, msg]);

  const bulkPersistQuestions = async (generated: Question[]) => {
    if (!generated.length || !selectedTestId) return;
    try {
      const payload = generated.map((g) => {
        const base: {
          testId: number;
          text: string;
          type: string;
          maxMarks: number;
          options?: string[];
          correctAnswer?: string | boolean | number;
          image?: string;
        } = {
          testId: selectedTestId,
          text: g.text,
          type: g.type,
          maxMarks: g.maxMarks || 1
        };
        if (g.type === "MULTIPLE_CHOICE" || g.type === "TRUE_FALSE") {
          base.options =
            g.type === "TRUE_FALSE" ? ["True", "False"] : g.options || [];
          base.correctAnswer =
            typeof g.correctAnswer === "number" ? g.correctAnswer : 0;
        }
        if (g.image) base.image = g.image;
        return base;
      });
      const res = await api(`/tests/${selectedTestId}/questions`, {
        method: "POST",
        auth: true,
        body: JSON.stringify({ questions: payload })
      });
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || "Failed to persist AI questions");
      }
      await fetchQuestions(selectedTestId);
      appendAiMessage(`✅ Added ${generated.length} AI generated question(s).`);
    } catch (err) {
      console.error(err);
      appendAiMessage(
        `❌ Failed to save generated questions: ${
          err instanceof Error ? err.message : "Unknown error"
        }`
      );
    }
  };

  const showApprovalModalForQuestions = (questions: Question[]) => {
    // Add temporary IDs for approval tracking
    const questionsWithTempIds = questions.map((q, index) => ({
      ...q,
      id: index + 1 // Temporary ID for approval tracking
    }));
    setPendingApprovalQuestions(questionsWithTempIds);
    setApprovedQuestionIds(new Set());
    setShowApprovalModal(true);
  };

  const toggleQuestionApproval = (questionId: number) => {
    const newApprovedIds = new Set(approvedQuestionIds);
    if (newApprovedIds.has(questionId)) {
      newApprovedIds.delete(questionId);
    } else {
      newApprovedIds.add(questionId);
    }
    setApprovedQuestionIds(newApprovedIds);
  };

  const handleApproveAndAddQuestions = async () => {
    const approvedQuestions = pendingApprovalQuestions.filter((q) =>
      approvedQuestionIds.has(q.id)
    );

    if (approvedQuestions.length === 0) {
      alert("Please approve at least one question to add.");
      return;
    }

    // Reset the IDs back to 0 for proper persistence
    const questionsToAdd = approvedQuestions.map((q) => ({
      ...q,
      id: 0,
      testId: selectedTestId || 0
    }));

    await bulkPersistQuestions(questionsToAdd);

    // Close modals and reset state
    setShowApprovalModal(false);
    setPendingApprovalQuestions([]);
    setApprovedQuestionIds(new Set());
  };

  const handleGenerateFromPrompt = async () => {
    if (!selectedTestId) return;
    if (!aiPrompt.trim()) {
      alert("Enter a topic or prompt first");
      return;
    }
    setAiGenerating(true);
    appendAiMessage("🧠 Generating questions from prompt...");
    try {
      const body = {
        prompt: `${aiPrompt}\nReturn ${aiDesiredCount} diverse questions with types (MULTIPLE_CHOICE / TRUE_FALSE / SHORT_ANSWER).`
      };
      const res = await api(`/agent/generate-questions/ask`, {
        method: "POST",
        auth: true,
        body: JSON.stringify(body)
      });
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || "Generation failed");
      }
      const data = await res.json();
      const rawList: AIQuestionRaw[] = Array.isArray(data)
        ? data
        : data.questions || [];
      const normalized: Question[] = rawList
        .map(normalizeAIQuestion)
        .filter((q): q is Question => !!q);
      if (!normalized.length)
        throw new Error("No usable questions returned by AI");

      appendAiMessage(
        `✅ Generated ${normalized.length} questions. Review and approve to add.`
      );
      showApprovalModalForQuestions(normalized);
    } catch (err) {
      appendAiMessage(
        `❌ Prompt generation error: ${err instanceof Error ? err.message : "Unknown error"}`
      );
    } finally {
      setAiGenerating(false);
    }
  };

  const handleGenerateFromPdf = async (file: File | null) => {
    if (!selectedTestId || !file) return;
    setAiPdfUploading(true);
    appendAiMessage(`📄 Uploading PDF: ${file.name}`);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await api(`/agent/generate-questions/pdf`, {
        method: "POST",
        auth: true,
        body: formData
      });
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || "PDF processing failed");
      }
      const data = await res.json();
      const rawList: AIQuestionRaw[] = Array.isArray(data)
        ? data
        : data.questions || [];
      const normalized: Question[] = rawList
        .map(normalizeAIQuestion)
        .filter((q): q is Question => !!q);
      if (!normalized.length)
        throw new Error("No questions extracted from PDF");

      appendAiMessage(
        `✅ Generated ${normalized.length} questions from PDF. Review and approve to add.`
      );
      showApprovalModalForQuestions(normalized);
    } catch (err) {
      appendAiMessage(
        `❌ PDF generation error: ${err instanceof Error ? err.message : "Unknown error"}`
      );
    } finally {
      setAiPdfUploading(false);
    }
  };

  const handleUpdateQuestion = async () => {
    if (!editingQuestion) return;

    setLoadingQuestions(true);
    try {
      interface QuestionUpdatePayload {
        text: string;
        type: Question["type"];
        maxMarks: number;
        options?: string[];
        correctAnswer?: number;
        image?: string;
      }
      const payload: QuestionUpdatePayload = {
        text: editingQuestion.text.trim(),
        type: editingQuestion.type,
        maxMarks: Number(editingQuestion.maxMarks)
      };

      if (editingQuestion.type === "MULTIPLE_CHOICE") {
        payload.options =
          editingQuestion.options?.filter((opt) => opt.trim() !== "") || [];
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
        body: JSON.stringify(payload)
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
    const confirmed = await confirmation.confirm({
      title: "Delete Question",
      message:
        "Are you sure you want to delete this question? This action cannot be undone.",
      confirmText: "Delete",
      cancelText: "Cancel",
      type: "danger"
    });
    if (!confirmed) return;

    try {
      const res = await api(`/tests/questions/${questionId}`, {
        method: "DELETE",
        auth: true
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

  // Commented out unused function
  // const handleEditTest = async (testId: number) => {
  //   try {
  //     const res = await api(`/tests/${testId}`, { method: "GET", auth: true });
  //     if (!res.ok) {
  //       const errorData = await res.json();
  //       throw new Error(errorData.message || "Failed to fetch test");
  //     }
  //     const data = await res.json();
  //     setEditingTest(data);
  //     setShowEditTestModal(true);
  //   } catch (err) {
  //     alert(err instanceof Error ? err.message : "Error fetching test");
  //   }
  // };

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
        status: editingTest.status
      };

      const res = await api(`/tests/${editingTest.id}`, {
        method: "PATCH",
        auth: true,
        body: JSON.stringify(payload)
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

  // Commented out unused function
  // const handleDeleteTest = async (testId: number) => {
  //   if (
  //     !confirm(
  //       "Are you sure you want to delete this test? This action cannot be undone.",
  //     )
  //   )
  //     return;

  //   try {
  //     const res = await api(`/tests/${testId}`, {
  //       method: "DELETE",
  //       auth: true,
  //     });

  //     if (!res.ok) {
  //       const errorData = await res.json();
  //       throw new Error(errorData.message || "Failed to delete test");
  //     }

  //     alert("Test deleted successfully!");
  //     await fetchTests();
  //   } catch (err) {
  //     alert(err instanceof Error ? err.message : "Error deleting test");
  //   }
  // };

  const handleNavigateToTestDetails = (testId: number) => {
    router.push(`/test/${testId}`);
  };

  const handleTestCreated = async () => {
    // Refresh the tests list to show the new test
    await fetchTests();
    // Optionally navigate to the new test
    // router.push(`/test/${testId}`);
  };

  useEffect(() => {
    fetchClassDetails();
    fetchTests();
  }, [fetchClassDetails, fetchTests]);

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
            <span className="text-4xl">⚠️</span>
          </div>
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            Error Loading Class
          </h2>
          <p className="text-gray-600 mb-8 text-lg">
            {error || "Class not found"}
          </p>
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
          <span className="text-xl group-hover:-translate-x-1 transition-transform">
            ←
          </span>
          Back to Teacher Portal
        </button>

        {/* Class Header */}
        <div className="bg-gradient-to-br from-white to-indigo-50 rounded-3xl shadow-xl border-2 border-indigo-100 p-8 mb-8 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-40 h-40 bg-gradient-to-br from-indigo-600/10 to-blue-600/10 rounded-full -mr-20 -mt-20"></div>
          <div className="relative z-10">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div>
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
                    className="px-6 py-3 bg-gradient-to-r from-orange-500 to-red-500 text-white font-bold rounded-xl hover:from-orange-600 hover:to-red-600 transition-all shadow-lg hover:shadow-xl hover:scale-105"
                  >
                    <span className="mr-2">+</span>
                    Create Test
                  </button>
                </div>

                {tests.length > 0 ? (
                  <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                    {tests.map((test) => {
                      const startDate = new Date(test.startAt);
                      const endDate = new Date(test.endAt);
                      const isUpcoming = startDate > new Date();
                      const isActive =
                        new Date() >= startDate && new Date() <= endDate;
                      const isCompleted = new Date() > endDate;

                      const getStatusColor = () => {
                        switch (test.status) {
                          case "DRAFT":
                            return "bg-gray-100 text-gray-800 border-gray-300";
                          case "ACTIVE":
                            return "bg-green-100 text-green-800 border-green-300";
                          case "COMPLETED":
                            return "bg-blue-100 text-blue-800 border-blue-300";
                          case "ARCHIVED":
                            return "bg-purple-100 text-purple-800 border-purple-300";
                          default:
                            return "bg-gray-100 text-gray-800 border-gray-300";
                        }
                      };

                      const getTimeStatus = () => {
                        if (isActive)
                          return {
                            text: "LIVE NOW",
                            color: "bg-red-500 text-white animate-pulse"
                          };
                        if (isUpcoming)
                          return {
                            text: "UPCOMING",
                            color: "bg-yellow-500 text-white"
                          };
                        if (isCompleted)
                          return {
                            text: "ENDED",
                            color: "bg-gray-500 text-white"
                          };
                        return {
                          text: "DRAFT",
                          color: "bg-gray-400 text-white"
                        };
                      };

                      const timeStatus = getTimeStatus();

                      return (
                        <div
                          key={test.id}
                          className="group relative bg-white rounded-3xl p-6 border-2 border-gray-200 hover:border-indigo-300 hover:shadow-2xl transition-all duration-300 cursor-pointer transform hover:-translate-y-1 overflow-hidden"
                          onClick={() => handleNavigateToTestDetails(test.id)}
                        >
                          {/* Background Gradient Overlay */}
                          <div className="absolute inset-0 bg-gradient-to-br from-indigo-50/30 via-white to-orange-50/30 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>

                          {/* Status Badge */}
                          <div className="flex items-center justify-between mb-4">
                            <span
                              className={`px-3 py-1 rounded-full text-xs font-bold border-2 ${getStatusColor()}`}
                            >
                              {test.status}
                            </span>
                            <span
                              className={`px-3 py-1 rounded-full text-xs font-bold ${timeStatus.color}`}
                            >
                              {timeStatus.text}
                            </span>
                          </div>

                          {/* Title */}
                          <h4 className="text-xl font-bold text-gray-900 mb-3 group-hover:text-indigo-700 transition-colors line-clamp-2">
                            {test.title}
                          </h4>

                          {/* Description */}
                          <p className="text-gray-600 text-sm mb-4 line-clamp-3 leading-relaxed">
                            {test.description || "No description provided"}
                          </p>

                          {/* Test Stats */}
                          <div className="space-y-3 mb-6">
                            {/* Questions Count */}
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-indigo-500 rounded-lg flex items-center justify-center">
                                <span className="text-white text-sm font-bold">
                                  ❓
                                </span>
                              </div>
                              <div>
                                <p className="text-xs text-gray-500 uppercase tracking-wide font-semibold">
                                  Questions
                                </p>
                                <p className="text-lg font-bold text-gray-900">
                                  {loadingQuestionCounts ? (
                                    <span className="animate-pulse bg-gray-200 rounded px-2 py-1">
                                      ...
                                    </span>
                                  ) : (
                                    test.questionCount || 0
                                  )}
                                </p>
                              </div>
                            </div>

                            {/* Duration */}
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 bg-gradient-to-r from-orange-500 to-red-500 rounded-lg flex items-center justify-center">
                                <span className="text-white text-sm font-bold">
                                  ⏱️
                                </span>
                              </div>
                              <div>
                                <p className="text-xs text-gray-500 uppercase tracking-wide font-semibold">
                                  Duration
                                </p>
                                <p className="text-lg font-bold text-gray-900">
                                  {test.duration} min
                                </p>
                              </div>
                            </div>

                            {/* Schedule */}
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 bg-gradient-to-r from-green-500 to-emerald-500 rounded-lg flex items-center justify-center">
                                <span className="text-white text-sm font-bold">
                                  📅
                                </span>
                              </div>
                              <div>
                                <p className="text-xs text-gray-500 uppercase tracking-wide font-semibold">
                                  Schedule
                                </p>
                                <p className="text-sm font-semibold text-gray-900">
                                  {startDate.toLocaleDateString("en-US", {
                                    month: "short",
                                    day: "numeric",
                                    hour: "2-digit",
                                    minute: "2-digit"
                                  })}
                                </p>
                              </div>
                            </div>
                          </div>

                          {/* Action Indicator */}
                          <div className="flex items-center justify-between pt-4 border-t-2 border-gray-100 group-hover:border-indigo-200 transition-colors">
                            <span className="text-sm text-gray-500 group-hover:text-indigo-600 transition-colors">
                              Click to manage test
                            </span>
                            <div className="w-8 h-8 bg-gray-100 group-hover:bg-indigo-100 rounded-full flex items-center justify-center transition-all">
                              <span className="text-gray-400 group-hover:text-indigo-600 font-bold transform group-hover:translate-x-0.5 transition-transform">
                                →
                              </span>
                            </div>
                          </div>

                          {/* Hover Effect Glow */}
                          <div className="absolute inset-0 rounded-3xl bg-gradient-to-r from-indigo-500/5 to-orange-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"></div>
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
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  Title
                </label>
                <input
                  type="text"
                  value={editingTest.title}
                  onChange={(e) =>
                    setEditingTest({ ...editingTest, title: e.target.value })
                  }
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 transition-all text-gray-900"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  Description
                </label>
                <textarea
                  value={editingTest.description}
                  onChange={(e) =>
                    setEditingTest({
                      ...editingTest,
                      description: e.target.value
                    })
                  }
                  rows={3}
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 transition-all text-gray-900 resize-none"
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">
                    Duration (minutes)
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={editingTest.duration}
                    onChange={(e) =>
                      setEditingTest({
                        ...editingTest,
                        duration: Number(e.target.value)
                      })
                    }
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 transition-all text-gray-900"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">
                    Status
                  </label>
                  <select
                    value={editingTest.status}
                    onChange={(e) =>
                      setEditingTest({
                        ...editingTest,
                        status: e.target.value as Test["status"]
                      })
                    }
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 transition-all text-gray-900 bg-white"
                  >
                    <option value="DRAFT">Draft</option>
                    <option value="ACTIVE">Active</option>
                    <option value="CLOSED">Closed</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">
                    Start Date & Time
                  </label>
                  <input
                    type="datetime-local"
                    value={editingTest.startAt?.slice(0, 16)}
                    onChange={(e) =>
                      setEditingTest({
                        ...editingTest,
                        startAt: e.target.value
                      })
                    }
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 transition-all text-gray-900"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">
                    End Date & Time
                  </label>
                  <input
                    type="datetime-local"
                    value={editingTest.endAt?.slice(0, 16)}
                    onChange={(e) =>
                      setEditingTest({ ...editingTest, endAt: e.target.value })
                    }
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
              <h3 className="text-2xl font-bold text-white">
                Add New Question
              </h3>
            </div>
            <div className="p-8 space-y-6">
              {/* AI Section Toggle */}
              <div className="border-2 border-emerald-200 rounded-2xl p-4 bg-gradient-to-br from-green-50 to-emerald-50">
                <button
                  type="button"
                  onClick={() => setShowAiSection(!showAiSection)}
                  className="w-full flex items-center justify-between px-4 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-bold rounded-xl shadow hover:shadow-lg transition-all"
                >
                  <span className="flex items-center gap-2">
                    <span>🧠</span>
                    {showAiSection
                      ? "Hide AI Question Generator"
                      : "AI Question Generator"}
                  </span>
                  <span>{showAiSection ? "▲" : "▼"}</span>
                </button>
                {showAiSection && (
                  <div className="mt-4 space-y-4 animate-slideUp">
                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-2">
                        Prompt / Topic *
                      </label>
                      <textarea
                        value={aiPrompt}
                        onChange={(e) => setAiPrompt(e.target.value)}
                        rows={3}
                        placeholder="e.g., Algebra linear equations basics"
                        className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all text-gray-900 resize-none"
                      />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-sm font-bold text-gray-700 mb-2">
                          # Questions
                        </label>
                        <input
                          type="number"
                          min={1}
                          max={25}
                          value={aiDesiredCount}
                          onChange={(e) =>
                            setAiDesiredCount(Number(e.target.value))
                          }
                          className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all text-gray-900"
                        />
                      </div>
                      <div className="md:col-span-2 flex items-end gap-3">
                        <button
                          type="button"
                          onClick={handleGenerateFromPrompt}
                          disabled={aiGenerating}
                          className="flex-1 px-5 py-3.5 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-bold rounded-xl hover:from-indigo-700 hover:to-purple-700 transition-all shadow disabled:opacity-50"
                        >
                          {aiGenerating
                            ? "Generating..."
                            : "Generate from Prompt"}
                        </button>
                        <label className="px-5 py-3.5 bg-gradient-to-r from-blue-600 to-cyan-600 text-white font-bold rounded-xl shadow cursor-pointer hover:from-blue-700 hover:to-cyan-700 transition-all disabled:opacity-50">
                          <input
                            type="file"
                            accept="application/pdf"
                            className="hidden"
                            onChange={(e) =>
                              handleGenerateFromPdf(e.target.files?.[0] || null)
                            }
                            disabled={aiPdfUploading}
                          />
                          {aiPdfUploading
                            ? "Processing PDF..."
                            : "Generate from PDF"}
                        </label>
                      </div>
                    </div>
                    {aiMessages.length > 0 && (
                      <div className="max-h-32 overflow-y-auto space-y-1 bg-gray-50 border-2 border-gray-200 rounded-xl p-3 text-xs font-mono">
                        {aiMessages.map((m, i) => (
                          <div key={i} className="text-gray-700">
                            {m}
                          </div>
                        ))}
                      </div>
                    )}
                    <p className="text-xs text-gray-500">
                      AI generated questions are auto-added. Review for
                      accuracy.
                    </p>
                  </div>
                )}
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  Question Text *
                </label>
                <textarea
                  value={newQuestion.text}
                  onChange={(e) =>
                    setNewQuestion({ ...newQuestion, text: e.target.value })
                  }
                  placeholder="Enter your question here..."
                  rows={3}
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all text-gray-900 resize-none"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">
                    Question Type *
                  </label>
                  <select
                    value={newQuestion.type}
                    onChange={(e) => {
                      const type = e.target.value as Question["type"];
                      if (type === "TRUE_FALSE") {
                        setNewQuestion({
                          ...newQuestion,
                          type,
                          options: ["True", "False"],
                          correctAnswer: 0
                        });
                      } else if (type === "MULTIPLE_CHOICE") {
                        setNewQuestion({
                          ...newQuestion,
                          type,
                          options: [
                            "Option A",
                            "Option B",
                            "Option C",
                            "Option D"
                          ],
                          correctAnswer: 0
                        });
                      } else {
                        setNewQuestion({
                          ...newQuestion,
                          type,
                          options: undefined,
                          correctAnswer: undefined
                        });
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
                  <label className="block text-sm font-bold text-gray-700 mb-2">
                    Maximum Marks *
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={newQuestion.maxMarks}
                    onChange={(e) =>
                      setNewQuestion({
                        ...newQuestion,
                        maxMarks: Number(e.target.value)
                      })
                    }
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all text-gray-900"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  Image URL (Optional)
                </label>
                <input
                  type="text"
                  value={newQuestion.image || ""}
                  onChange={(e) =>
                    setNewQuestion({ ...newQuestion, image: e.target.value })
                  }
                  placeholder="https://example.com/image.jpg"
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all text-gray-900"
                />
              </div>

              {newQuestion.type === "MULTIPLE_CHOICE" && (
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-3">
                    Answer Options *
                  </label>
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
                            onChange={() =>
                              setNewQuestion({
                                ...newQuestion,
                                correctAnswer: i
                              })
                            }
                            className="w-4 h-4 text-green-600"
                          />
                          <span className="text-sm font-bold text-gray-700">
                            Correct
                          </span>
                        </label>
                        {(newQuestion.options?.length || 0) > 2 && (
                          <button
                            onClick={() => {
                              const opts = newQuestion.options?.filter(
                                (_, idx) => idx !== i
                              );
                              setNewQuestion({
                                ...newQuestion,
                                options: opts,
                                correctAnswer:
                                  newQuestion.correctAnswer === i
                                    ? 0
                                    : newQuestion.correctAnswer! > i
                                      ? newQuestion.correctAnswer! - 1
                                      : newQuestion.correctAnswer
                              });
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
                      const opts = [
                        ...(newQuestion.options || []),
                        `Option ${String.fromCharCode(65 + (newQuestion.options?.length || 0))}`
                      ];
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
                  <label className="block text-sm font-bold text-gray-700 mb-3">
                    Correct Answer *
                  </label>
                  <div className="flex gap-4">
                    <label className="flex-1 flex items-center justify-center gap-3 px-6 py-4 bg-green-50 border-2 border-green-300 rounded-xl cursor-pointer hover:bg-green-100 transition-colors">
                      <input
                        type="radio"
                        name="tfAnswer"
                        checked={newQuestion.correctAnswer === 0}
                        onChange={() =>
                          setNewQuestion({ ...newQuestion, correctAnswer: 0 })
                        }
                        className="w-5 h-5 text-green-600"
                      />
                      <span className="text-lg font-bold text-gray-900">
                        True
                      </span>
                    </label>
                    <label className="flex-1 flex items-center justify-center gap-3 px-6 py-4 bg-red-50 border-2 border-red-300 rounded-xl cursor-pointer hover:bg-red-100 transition-colors">
                      <input
                        type="radio"
                        name="tfAnswer"
                        checked={newQuestion.correctAnswer === 1}
                        onChange={() =>
                          setNewQuestion({ ...newQuestion, correctAnswer: 1 })
                        }
                        className="w-5 h-5 text-red-600"
                      />
                      <span className="text-lg font-bold text-gray-900">
                        False
                      </span>
                    </label>
                  </div>
                </div>
              )}

              {(newQuestion.type === "SHORT_ANSWER" ||
                newQuestion.type === "LONG_ANSWER") && (
                <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-4">
                  <p className="text-sm text-blue-800 font-medium">
                    ℹ️{" "}
                    {newQuestion.type === "SHORT_ANSWER"
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
                      image: ""
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
                  <p className="mt-6 text-gray-600 font-semibold text-lg">
                    Loading questions...
                  </p>
                </div>
              ) : questions.length === 0 ? (
                <div className="text-center py-16 bg-gradient-to-br from-gray-50 to-purple-50 rounded-2xl border-2 border-dashed border-gray-300">
                  <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4 text-4xl">
                    ❓
                  </div>
                  <p className="text-gray-600 font-bold text-lg">
                    No questions added yet
                  </p>
                  <p className="text-gray-500 mt-2 mb-6">
                    Add questions to make this test complete
                  </p>
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
                                {q.maxMarks}{" "}
                                {q.maxMarks === 1 ? "mark" : "marks"}
                              </span>
                            </div>
                            <p className="text-gray-900 font-semibold text-lg">
                              {q.text}
                            </p>
                          </div>
                        </div>
                      </div>

                      {q.image && (
                        <div className="mb-4">
                          <Image
                            src={q.image}
                            alt="Question"
                            width={400}
                            height={300}
                            className="max-w-sm h-auto rounded-xl border-2 border-gray-300"
                            onError={(e) => {
                              (e.target as HTMLImageElement).style.display =
                                "none";
                            }}
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
                              <span className="font-bold mr-2">
                                {String.fromCharCode(65 + i)}.
                              </span>
                              {opt}
                              {q.correctAnswer === i && (
                                <span className="ml-2 text-green-700 font-bold">
                                  ✓ Correct
                                </span>
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
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  Question Text *
                </label>
                <textarea
                  value={editingQuestion.text}
                  onChange={(e) =>
                    setEditingQuestion({
                      ...editingQuestion,
                      text: e.target.value
                    })
                  }
                  rows={3}
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 transition-all text-gray-900 resize-none"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">
                    Question Type
                  </label>
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
                  <label className="block text-sm font-bold text-gray-700 mb-2">
                    Maximum Marks *
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={editingQuestion.maxMarks}
                    onChange={(e) =>
                      setEditingQuestion({
                        ...editingQuestion,
                        maxMarks: Number(e.target.value)
                      })
                    }
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 transition-all text-gray-900"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  Image URL (Optional)
                </label>
                <input
                  type="text"
                  value={editingQuestion.image || ""}
                  onChange={(e) =>
                    setEditingQuestion({
                      ...editingQuestion,
                      image: e.target.value
                    })
                  }
                  placeholder="https://example.com/image.jpg"
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 transition-all text-gray-900"
                />
              </div>

              {editingQuestion.type === "MULTIPLE_CHOICE" && (
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-3">
                    Answer Options
                  </label>
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
                            setEditingQuestion({
                              ...editingQuestion,
                              options: opts
                            });
                          }}
                          className="flex-1 px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 transition-all text-gray-900"
                        />
                        <label className="flex items-center gap-2 px-4 py-3 bg-green-100 border-2 border-green-300 rounded-xl cursor-pointer hover:bg-green-200 transition-colors">
                          <input
                            type="radio"
                            name="editCorrectAnswer"
                            checked={editingQuestion.correctAnswer === i}
                            onChange={() =>
                              setEditingQuestion({
                                ...editingQuestion,
                                correctAnswer: i
                              })
                            }
                            className="w-4 h-4 text-green-600"
                          />
                          <span className="text-sm font-bold text-gray-700">
                            Correct
                          </span>
                        </label>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {editingQuestion.type === "TRUE_FALSE" && (
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-3">
                    Correct Answer
                  </label>
                  <div className="flex gap-4">
                    <label className="flex-1 flex items-center justify-center gap-3 px-6 py-4 bg-green-50 border-2 border-green-300 rounded-xl cursor-pointer hover:bg-green-100 transition-colors">
                      <input
                        type="radio"
                        name="editTfAnswer"
                        checked={editingQuestion.correctAnswer === 0}
                        onChange={() =>
                          setEditingQuestion({
                            ...editingQuestion,
                            correctAnswer: 0
                          })
                        }
                        className="w-5 h-5 text-green-600"
                      />
                      <span className="text-lg font-bold text-gray-900">
                        True
                      </span>
                    </label>
                    <label className="flex-1 flex items-center justify-center gap-3 px-6 py-4 bg-red-50 border-2 border-red-300 rounded-xl cursor-pointer hover:bg-red-100 transition-colors">
                      <input
                        type="radio"
                        name="editTfAnswer"
                        checked={editingQuestion.correctAnswer === 1}
                        onChange={() =>
                          setEditingQuestion({
                            ...editingQuestion,
                            correctAnswer: 1
                          })
                        }
                        className="w-5 h-5 text-red-600"
                      />
                      <span className="text-lg font-bold text-gray-900">
                        False
                      </span>
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

      {/* AI Question Approval Modal */}
      {showApprovalModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl w-full max-w-5xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
            <div className="px-8 py-6 bg-gradient-to-r from-indigo-600 to-purple-600 flex items-center justify-between">
              <div>
                <h3 className="text-2xl font-bold text-white">
                  Review AI Generated Questions
                </h3>
                <p className="text-indigo-200 mt-1">
                  {approvedQuestionIds.size} of{" "}
                  {pendingApprovalQuestions.length} questions selected
                </p>
              </div>
              <button
                onClick={() => {
                  setShowApprovalModal(false);
                  setPendingApprovalQuestions([]);
                  setApprovedQuestionIds(new Set());
                }}
                className="w-10 h-10 bg-white/20 hover:bg-white/30 rounded-xl flex items-center justify-center transition-colors text-white font-bold text-xl"
              >
                ✕
              </button>
            </div>

            <div className="p-6 overflow-y-auto flex-1">
              {pendingApprovalQuestions.length === 0 ? (
                <div className="text-center py-16">
                  <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4 text-4xl">
                    🤖
                  </div>
                  <p className="text-gray-600 font-bold text-lg">
                    No questions to review
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex items-center justify-between mb-6 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-indigo-200 rounded-2xl">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center text-white font-bold">
                        ✓
                      </div>
                      <span className="text-gray-800 font-bold">
                        Select questions to add to your test
                      </span>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => {
                          const allIds = new Set(
                            pendingApprovalQuestions.map((q) => q.id)
                          );
                          setApprovedQuestionIds(allIds);
                        }}
                        className="px-4 py-2 bg-green-500 text-white font-bold rounded-lg hover:bg-green-600 transition-colors text-sm"
                      >
                        Select All
                      </button>
                      <button
                        onClick={() => setApprovedQuestionIds(new Set())}
                        className="px-4 py-2 bg-gray-500 text-white font-bold rounded-lg hover:bg-gray-600 transition-colors text-sm"
                      >
                        Clear All
                      </button>
                    </div>
                  </div>

                  {pendingApprovalQuestions.map((question, index) => (
                    <div
                      key={question.id}
                      className={`border-2 rounded-2xl p-6 transition-all cursor-pointer hover:shadow-lg ${
                        approvedQuestionIds.has(question.id)
                          ? "border-green-400 bg-gradient-to-r from-green-50 to-emerald-50"
                          : "border-gray-200 bg-gradient-to-r from-gray-50 to-blue-50 hover:border-indigo-300"
                      }`}
                      onClick={() => toggleQuestionApproval(question.id)}
                    >
                      <div className="flex items-start gap-4">
                        <div className="flex-shrink-0 mt-1">
                          <div
                            className={`w-8 h-8 rounded-xl flex items-center justify-center font-bold text-sm transition-all ${
                              approvedQuestionIds.has(question.id)
                                ? "bg-green-500 text-white"
                                : "bg-gray-200 text-gray-600 hover:bg-indigo-500 hover:text-white"
                            }`}
                          >
                            {approvedQuestionIds.has(question.id)
                              ? "✓"
                              : index + 1}
                          </div>
                        </div>

                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-3">
                              <span
                                className={`px-3 py-1 rounded-full text-xs font-bold ${
                                  question.type === "MULTIPLE_CHOICE"
                                    ? "bg-blue-100 text-blue-800"
                                    : question.type === "TRUE_FALSE"
                                      ? "bg-purple-100 text-purple-800"
                                      : question.type === "SHORT_ANSWER"
                                        ? "bg-green-100 text-green-800"
                                        : "bg-orange-100 text-orange-800"
                                }`}
                              >
                                {question.type.replace("_", " ")}
                              </span>
                              <span className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-xs font-bold">
                                {question.maxMarks}{" "}
                                {question.maxMarks === 1 ? "Mark" : "Marks"}
                              </span>
                            </div>
                          </div>

                          <p className="text-gray-900 font-medium mb-4 text-lg leading-relaxed">
                            {question.text}
                          </p>

                          {question.options && question.options.length > 0 && (
                            <div className="space-y-2">
                              {question.options.map((option, optIndex) => (
                                <div
                                  key={optIndex}
                                  className={`px-4 py-2 rounded-lg text-sm ${
                                    question.correctAnswer === optIndex
                                      ? "bg-green-100 border-2 border-green-300 text-green-800 font-bold"
                                      : "bg-white border border-gray-200 text-gray-700"
                                  }`}
                                >
                                  <span className="font-bold mr-2">
                                    {String.fromCharCode(65 + optIndex)}.
                                  </span>
                                  {option}
                                  {question.correctAnswer === optIndex && (
                                    <span className="ml-2 text-green-600 font-bold">
                                      ✓ Correct
                                    </span>
                                  )}
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="px-8 py-6 bg-gray-50 border-t-2 border-gray-200">
              <div className="flex items-center justify-between gap-4">
                <div className="text-gray-600">
                  <span className="font-bold text-lg text-indigo-600">
                    {approvedQuestionIds.size}
                  </span>
                  <span className="ml-1">questions selected</span>
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={() => {
                      setShowApprovalModal(false);
                      setPendingApprovalQuestions([]);
                      setApprovedQuestionIds(new Set());
                    }}
                    className="px-6 py-3 bg-gray-500 text-white font-bold rounded-xl hover:bg-gray-600 transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleApproveAndAddQuestions}
                    disabled={approvedQuestionIds.size === 0}
                    className="px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white font-bold rounded-xl hover:from-green-600 hover:to-emerald-700 transition-all shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Add {approvedQuestionIds.size} Selected Question
                    {approvedQuestionIds.size !== 1 ? "s" : ""}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Create Test Modal */}
      <CreateTestModal
        isOpen={showCreateTestModal}
        onClose={() => setShowCreateTestModal(false)}
        onTestCreated={handleTestCreated}
        prefilledClassId={classData?.id ? Number(classData.id) : undefined}
      />

      {/* Confirmation Modal */}
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
