"use client";

import React, { useState } from "react";
import Image from "next/image";
import { useSearchParams } from "next/navigation";
import api from "../hooks/useApi";

interface Question {
  testId?: number;
  text: string;
  type: "TRUE_FALSE" | "MULTIPLE_CHOICE" | "SHORT_ANSWER" | "LONG_ANSWER";
  options?: string[];
  correctAnswer?: number;
  maxMarks: number;
  image?: string;
}

interface TestData {
  classId: number;
  title: string;
  description: string;
  duration: number;
  startAt: string;
  endAt: string;
  status: "DRAFT" | "ACTIVE" | "CLOSED";
}

export default function CreateTestPage() {
  const searchParams = useSearchParams();
  // Removed unused router (was not referenced elsewhere)
  const classIdFromUrl = searchParams?.get("classId") || null;

  const [formData, setFormData] = useState<TestData>({
    classId: classIdFromUrl ? Number(classIdFromUrl) : 0,
    title: "",
    description: "",
    duration: 60,
    startAt: "",
    endAt: "",
    status: "DRAFT",
  });

  const [loading, setLoading] = useState(false);
  const [showQuestions, setShowQuestions] = useState(false);
  const [createdTestId, setCreatedTestId] = useState<number | null>(null);

  const handleChange = <K extends keyof TestData>(
    key: K,
    value: TestData[K]
  ) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.title.trim()) {
      alert("Please enter a test title");
      return;
    }

    if (!formData.classId || formData.classId <= 0) {
      alert("Please enter a valid class ID");
      return;
    }

    if (!formData.startAt || !formData.endAt) {
      alert("Please set both start and end date/time");
      return;
    }

    setLoading(true);
    try {
      const payload = {
        classId: Number(formData.classId),
        title: formData.title.trim(),
        description: formData.description.trim(),
        duration: Number(formData.duration),
        startAt: formData.startAt,
        endAt: formData.endAt,
        status: formData.status,
      };

      const res = await api("/tests", {
        method: "POST",
        auth: true,
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || "Failed to create test");
      }

      const data = await res.json();
      setCreatedTestId(data.id);
      alert(
        `✅ Test created successfully!\n\nTest ID: ${data.id}\n\nYou can now add questions to your test.`
      );
      setShowQuestions(true);
    } catch (err) {
      console.error("Failed to create test:", err);
      alert(err instanceof Error ? err.message : "Error creating test");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-purple-50 to-indigo-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-10">
          <div className="inline-block mb-4">
            <div className="w-20 h-20 bg-gradient-to-br from-purple-600 to-indigo-600 rounded-3xl flex items-center justify-center text-4xl shadow-xl transform hover:scale-110 transition-transform">
              📝
            </div>
          </div>
          <h1 className="text-5xl font-bold text-gray-900 mb-3 bg-clip-text text-transparent bg-gradient-to-r from-purple-600 to-indigo-600">
            Create New Test
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Design comprehensive assessments with custom questions and settings
          </p>
        </div>

        {/* Quick Actions Bar */}
        {createdTestId && (
          <div className="mb-8 bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-200 rounded-2xl p-6 shadow-md">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl flex items-center justify-center text-2xl">
                  ✅
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-900">
                    Test Created Successfully!
                  </h3>
                  <p className="text-sm text-gray-600">
                    Test ID:{" "}
                    <span className="font-mono font-bold text-green-700">
                      #{createdTestId}
                    </span>
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowQuestions(!showQuestions)}
                className="px-6 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-bold rounded-xl hover:from-purple-700 hover:to-indigo-700 transition-all shadow-lg hover:shadow-xl hover:scale-105"
              >
                {showQuestions ? "Hide Questions ▲" : "Add Questions ▼"}
              </button>
            </div>
          </div>
        )}

        {/* Test Information Form */}
        <div className="bg-white rounded-3xl shadow-xl border-2 border-gray-100 overflow-hidden mb-8">
          <div className="px-8 py-6 bg-gradient-to-r from-purple-600 to-indigo-600">
            <h2 className="text-2xl font-bold text-white flex items-center gap-3">
              <span className="text-3xl">📋</span>
              Test Information
            </h2>
            <p className="mt-1 text-purple-100">
              Configure the basic details of your test
            </p>
          </div>

          <form onSubmit={handleSubmit} className="p-8 space-y-6">
            {/* Class ID */}
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2 flex items-center gap-2">
                <span className="text-lg">🏫</span>
                Class ID *
              </label>
              <input
                type="number"
                min="1"
                value={formData.classId || ""}
                onChange={(e) =>
                  handleChange("classId", Number(e.target.value))
                }
                placeholder="Enter class ID"
                className="w-full px-4 py-3.5 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all text-gray-900 placeholder-gray-400 font-medium"
                disabled={!!classIdFromUrl}
              />
              {classIdFromUrl && (
                <p className="mt-2 text-sm text-green-600 font-medium flex items-center gap-2">
                  <span>✓</span> Using class ID from URL: {classIdFromUrl}
                </p>
              )}
            </div>

            {/* Title & Description */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2 flex items-center gap-2">
                  <span className="text-lg">📌</span>
                  Test Title *
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => handleChange("title", e.target.value)}
                  placeholder="e.g., Midterm Examination"
                  className="w-full px-4 py-3.5 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all text-gray-900 placeholder-gray-400 font-medium"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2 flex items-center gap-2">
                  <span className="text-lg">⏱️</span>
                  Duration (minutes) *
                </label>
                <input
                  type="number"
                  min="1"
                  value={formData.duration}
                  onChange={(e) =>
                    handleChange("duration", Number(e.target.value))
                  }
                  placeholder="60"
                  className="w-full px-4 py-3.5 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all text-gray-900 placeholder-gray-400 font-medium"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2 flex items-center gap-2">
                <span className="text-lg">📄</span>
                Description
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => handleChange("description", e.target.value)}
                placeholder="Provide a brief description of the test (optional)"
                rows={4}
                className="w-full px-4 py-3.5 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all text-gray-900 placeholder-gray-400 resize-none font-medium"
              />
            </div>

            {/* Date & Time */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2 flex items-center gap-2">
                  <span className="text-lg">🕐</span>
                  Start Date & Time *
                </label>
                <input
                  type="datetime-local"
                  value={formData.startAt}
                  onChange={(e) => handleChange("startAt", e.target.value)}
                  className="w-full px-4 py-3.5 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all text-gray-900 font-medium"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2 flex items-center gap-2">
                  <span className="text-lg">🕓</span>
                  End Date & Time *
                </label>
                <input
                  type="datetime-local"
                  value={formData.endAt}
                  onChange={(e) => handleChange("endAt", e.target.value)}
                  className="w-full px-4 py-3.5 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all text-gray-900 font-medium"
                />
              </div>
            </div>

            {/* Status */}
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2 flex items-center gap-2">
                <span className="text-lg">📊</span>
                Test Status
              </label>
              <select
                value={formData.status}
                onChange={(e) =>
                  handleChange("status", e.target.value as TestData["status"])
                }
                className="w-full px-4 py-3.5 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all text-gray-900 bg-white font-medium"
              >
                <option value="DRAFT">Draft - Not visible to students</option>
                <option value="ACTIVE">Active - Visible to students</option>
                <option value="CLOSED">Closed - Read-only</option>
              </select>
            </div>

            {/* Submit Button */}
            <div className="pt-4">
              <button
                type="submit"
                disabled={loading || !!createdTestId}
                className="w-full px-8 py-4 bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-bold rounded-xl shadow-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed hover:from-purple-700 hover:to-indigo-700 text-lg flex items-center justify-center gap-3"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    Creating Test...
                  </>
                ) : createdTestId ? (
                  <>Test Created Successfully ✓</>
                ) : (
                  <>Create Test</>
                )}
              </button>
            </div>
          </form>
        </div>

        {/* Questions Manager */}
        {showQuestions && createdTestId && (
          <TestQuestionsManager testId={createdTestId} />
        )}
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*                            QUESTIONS MANAGER                               */
/* -------------------------------------------------------------------------- */

function TestQuestionsManager({ testId }: { testId: number }) {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [newQuestion, setNewQuestion] = useState<Question>({
    text: "",
    type: "MULTIPLE_CHOICE",
    options: ["Option A", "Option B", "Option C", "Option D"],
    correctAnswer: 0,
    maxMarks: 1,
    image: "",
  });
  const [loading, setLoading] = useState(false);
  // AI integration state
  const [aiPrompt, setAiPrompt] = useState("");
  const [aiGenerating, setAiGenerating] = useState(false);
  const [aiPdfUploading, setAiPdfUploading] = useState(false);
  const [aiDesiredCount, setAiDesiredCount] = useState(5);
  const [aiMessages, setAiMessages] = useState<string[]>([]);
  const [showAiSection, setShowAiSection] = useState(false);

  const handleChange = <K extends keyof Question>(
    key: K,
    value: Question[K]
  ) => {
    setNewQuestion((prev) => ({ ...prev, [key]: value }));
  };

  const handleAddQuestion = async () => {
    if (!newQuestion.text.trim()) {
      alert("Please enter a question text");
      return;
    }

    // Validate based on question type
    if (newQuestion.type === "MULTIPLE_CHOICE") {
      if (!newQuestion.options || newQuestion.options.length < 2) {
        alert("Multiple choice questions must have at least 2 options");
        return;
      }
      if (
        newQuestion.correctAnswer === undefined ||
        newQuestion.correctAnswer < 0
      ) {
        alert("Please select the correct answer");
        return;
      }
    }

    setLoading(true);
    try {
      const payload: Required<Pick<Question, "text" | "type" | "maxMarks">> & {
        testId: number;
        options?: string[];
        correctAnswer?: number;
        image?: string;
      } = {
        testId,
        text: newQuestion.text.trim(),
        type: newQuestion.type,
        maxMarks: Number(newQuestion.maxMarks),
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

      const res = await api(`/tests/${testId}/questions`, {
        method: "POST",
        auth: true,
        body: JSON.stringify({ questions: [payload] }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || "Failed to add question");
      }

      alert("✅ Question added successfully!");

      // Add to local state
      setQuestions((prev) => [...prev, { ...payload, testId }]);

      // Reset form
      setNewQuestion({
        text: "",
        type: "MULTIPLE_CHOICE",
        options: ["Option A", "Option B", "Option C", "Option D"],
        correctAnswer: 0,
        maxMarks: 1,
        image: "",
      });
    } catch (err) {
      console.error("Failed to add question:", err);
      alert(err instanceof Error ? err.message : "Error adding question");
    } finally {
      setLoading(false);
    }
  };

  // ------------------------ AI HELPERS ------------------------
  interface AIQuestionRaw {
    text?: string;
    question?: string; // alternate key
    type?: string;
    options?: string[];
    correctAnswer?: number | string; // may come as letter
    answer?: number | string; // alternate key
    maxMarks?: number;
    marks?: number; // alternate key
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
    return { text, type, options, correctAnswer, maxMarks };
  };

  const appendAiMessage = (msg: string) => setAiMessages((m) => [...m, msg]);

  const bulkPersistQuestions = async (generated: Question[]) => {
    if (!generated.length) return;
    try {
      const payload = generated.map((g) => {
        const base: any = {
          testId,
          text: g.text,
          type: g.type,
          maxMarks: g.maxMarks || 1,
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
      const res = await api(`/tests/${testId}/questions`, {
        method: "POST",
        auth: true,
        body: JSON.stringify({ questions: payload }),
      });
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || "Failed to persist AI questions");
      }
      setQuestions((prev) => [...prev, ...generated]);
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

  const handleGenerateFromPrompt = async () => {
    if (!aiPrompt.trim()) {
      alert("Enter a topic or prompt first");
      return;
    }
    setAiGenerating(true);
    appendAiMessage("🧠 Generating questions from prompt...");
    try {
      const body = {
        prompt: `${aiPrompt}\nReturn ${aiDesiredCount} diverse questions with types (MULTIPLE_CHOICE / TRUE_FALSE / SHORT_ANSWER).`,
      };
      const res = await api(`/agent/generate-questions/ask`, {
        method: "POST",
        auth: true,
        body: JSON.stringify(body),
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
      await bulkPersistQuestions(normalized);
    } catch (err) {
      appendAiMessage(
        `❌ Prompt generation error: ${
          err instanceof Error ? err.message : "Unknown error"
        }`
      );
    } finally {
      setAiGenerating(false);
    }
  };

  const handleGenerateFromPdf = async (file: File | null) => {
    if (!file) return;
    setAiPdfUploading(true);
    appendAiMessage(`📄 Uploading PDF: ${file.name}`);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await api(`/agent/generate-questions/pdf`, {
        method: "POST",
        auth: true,
        body: formData, // api helper must support FormData
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
      await bulkPersistQuestions(normalized);
    } catch (err) {
      appendAiMessage(
        `❌ PDF generation error: ${
          err instanceof Error ? err.message : "Unknown error"
        }`
      );
    } finally {
      setAiPdfUploading(false);
    }
  };

  return (
    <div className="bg-white rounded-3xl shadow-xl border-2 border-gray-100 overflow-hidden">
      <div className="px-8 py-6 bg-gradient-to-r from-orange-500 to-red-500">
        <h2 className="text-2xl font-bold text-white flex items-center gap-3">
          <span className="text-3xl">❓</span>
          Question Bank
        </h2>
        <p className="mt-1 text-orange-100">Add questions to your test</p>
      </div>

      {/* New Question Form */}
      <div className="p-8 bg-gradient-to-br from-orange-50 to-red-50 border-b-2 border-gray-200">
        {/* AI Assistant Toggle */}
        <div className="mb-10">
          <button
            type="button"
            onClick={() => setShowAiSection(!showAiSection)}
            className="w-full flex items-center justify-between px-6 py-4 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-bold rounded-xl shadow-lg hover:shadow-xl transition-all"
          >
            <span className="flex items-center gap-3 text-lg">
              <span>🧠</span>{" "}
              {showAiSection
                ? "Hide AI Question Generator"
                : "AI Question Generator"}
            </span>
            <span>{showAiSection ? "▲" : "▼"}</span>
          </button>
          {showAiSection && (
            <div className="mt-6 bg-white/70 backdrop-blur rounded-2xl border-2 border-indigo-200 p-6 space-y-6 animate-slideUp">
              <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                <span>✨</span> Generate Questions with AI
              </h3>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  Prompt / Topic *
                </label>
                <textarea
                  value={aiPrompt}
                  onChange={(e) => setAiPrompt(e.target.value)}
                  placeholder="e.g., Basics of Photosynthesis for grade 9 biology"
                  rows={3}
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
                    onChange={(e) => setAiDesiredCount(Number(e.target.value))}
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all text-gray-900"
                  />
                </div>
                <div className="md:col-span-2 flex items-end gap-4">
                  <button
                    type="button"
                    onClick={handleGenerateFromPrompt}
                    disabled={aiGenerating}
                    className="flex-1 px-6 py-4 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-bold rounded-xl hover:from-indigo-700 hover:to-purple-700 transition-all shadow-lg hover:shadow-xl disabled:opacity-50"
                  >
                    {aiGenerating ? "Generating..." : "Generate from Prompt"}
                  </button>
                  <label className="px-6 py-4 bg-gradient-to-r from-blue-600 to-cyan-600 text-white font-bold rounded-xl shadow-lg hover:shadow-xl cursor-pointer hover:from-blue-700 hover:to-cyan-700 transition-all disabled:opacity-50">
                    <input
                      type="file"
                      accept="application/pdf"
                      className="hidden"
                      onChange={(e) =>
                        handleGenerateFromPdf(e.target.files?.[0] || null)
                      }
                      disabled={aiPdfUploading}
                    />
                    {aiPdfUploading ? "Processing PDF..." : "Generate from PDF"}
                  </label>
                </div>
              </div>
              {aiMessages.length > 0 && (
                <div className="max-h-40 overflow-y-auto space-y-2 bg-gray-50 border-2 border-gray-200 rounded-xl p-4 text-sm font-mono">
                  {aiMessages.map((m, i) => (
                    <div key={i} className="text-gray-700">
                      {m}
                    </div>
                  ))}
                </div>
              )}
              <p className="text-xs text-gray-500">
                AI generated questions are added automatically once created.
                Please review them for accuracy.
              </p>
            </div>
          )}
        </div>

        <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
          <span className="text-2xl">➕</span>
          Add New Question
        </h3>

        <div className="space-y-6">
          {/* Question Text */}
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">
              Question Text *
            </label>
            <textarea
              placeholder="Enter your question here..."
              value={newQuestion.text}
              onChange={(e) => handleChange("text", e.target.value)}
              rows={3}
              className="w-full px-4 py-3.5 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all text-gray-900 placeholder-gray-400 resize-none font-medium"
            />
          </div>

          {/* Question Type & Marks */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">
                Question Type *
              </label>
              <select
                value={newQuestion.type}
                onChange={(e) => {
                  const type = e.target.value as Question["type"];
                  handleChange("type", type);

                  // Reset options based on type
                  if (type === "TRUE_FALSE") {
                    handleChange("options", ["True", "False"]);
                    handleChange("correctAnswer", 0);
                  } else if (type === "MULTIPLE_CHOICE") {
                    handleChange("options", [
                      "Option A",
                      "Option B",
                      "Option C",
                      "Option D",
                    ]);
                    handleChange("correctAnswer", 0);
                  } else {
                    handleChange("options", undefined);
                    handleChange("correctAnswer", undefined);
                  }
                }}
                className="w-full px-4 py-3.5 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all text-gray-900 bg-white font-medium"
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
                  handleChange("maxMarks", Number(e.target.value))
                }
                className="w-full px-4 py-3.5 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all text-gray-900 font-medium"
              />
            </div>
          </div>

          {/* Image URL (Optional) */}
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">
              Image URL (Optional)
            </label>
            <input
              type="text"
              placeholder="https://example.com/image.jpg"
              value={newQuestion.image || ""}
              onChange={(e) => handleChange("image", e.target.value)}
              className="w-full px-4 py-3.5 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all text-gray-900 placeholder-gray-400 font-medium"
            />
          </div>

          {/* Options for MULTIPLE_CHOICE */}
          {newQuestion.type === "MULTIPLE_CHOICE" && (
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-3">
                Answer Options *
              </label>
              <div className="space-y-3">
                {newQuestion.options?.map((opt, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <div className="flex items-center justify-center w-10 h-10 bg-gradient-to-br from-orange-500 to-red-500 text-white font-bold rounded-lg text-sm">
                      {String.fromCharCode(65 + i)}
                    </div>
                    <input
                      type="text"
                      value={opt}
                      onChange={(e) => {
                        const newOpts = [...(newQuestion.options || [])];
                        newOpts[i] = e.target.value;
                        handleChange("options", newOpts);
                      }}
                      placeholder={`Option ${String.fromCharCode(65 + i)}`}
                      className="flex-1 px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all text-gray-900 placeholder-gray-400 font-medium"
                    />
                    <label className="flex items-center gap-2 px-4 py-3 bg-green-100 border-2 border-green-300 rounded-xl cursor-pointer hover:bg-green-200 transition-colors">
                      <input
                        type="radio"
                        name="correctAnswer"
                        checked={newQuestion.correctAnswer === i}
                        onChange={() => handleChange("correctAnswer", i)}
                        className="w-4 h-4 text-green-600"
                      />
                      <span className="text-sm font-bold text-gray-700">
                        Correct
                      </span>
                    </label>
                    {(newQuestion.options?.length || 0) > 2 && (
                      <button
                        type="button"
                        onClick={() => {
                          const newOpts = newQuestion.options?.filter(
                            (_, idx) => idx !== i
                          );
                          handleChange("options", newOpts);
                          if (newQuestion.correctAnswer === i) {
                            handleChange("correctAnswer", 0);
                          } else if (newQuestion.correctAnswer! > i) {
                            handleChange(
                              "correctAnswer",
                              newQuestion.correctAnswer! - 1
                            );
                          }
                        }}
                        className="px-4 py-3 text-red-600 hover:bg-red-50 rounded-xl font-bold transition-colors border-2 border-red-200"
                      >
                        ✕
                      </button>
                    )}
                  </div>
                ))}
              </div>
              <button
                type="button"
                onClick={() => {
                  const newOpts = [
                    ...(newQuestion.options || []),
                    `Option ${String.fromCharCode(
                      65 + (newQuestion.options?.length || 0)
                    )}`,
                  ];
                  handleChange("options", newOpts);
                }}
                className="mt-3 px-5 py-2.5 text-orange-600 hover:bg-orange-100 rounded-xl font-bold transition-colors border-2 border-orange-200"
              >
                + Add Option
              </button>
            </div>
          )}

          {/* TRUE_FALSE Correct Answer */}
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
                    onChange={() => handleChange("correctAnswer", 0)}
                    className="w-5 h-5 text-green-600"
                  />
                  <span className="text-lg font-bold text-gray-900">True</span>
                </label>
                <label className="flex-1 flex items-center justify-center gap-3 px-6 py-4 bg-red-50 border-2 border-red-300 rounded-xl cursor-pointer hover:bg-red-100 transition-colors">
                  <input
                    type="radio"
                    name="tfAnswer"
                    checked={newQuestion.correctAnswer === 1}
                    onChange={() => handleChange("correctAnswer", 1)}
                    className="w-5 h-5 text-red-600"
                  />
                  <span className="text-lg font-bold text-gray-900">False</span>
                </label>
              </div>
            </div>
          )}

          {/* Info for text-based questions */}
          {(newQuestion.type === "SHORT_ANSWER" ||
            newQuestion.type === "LONG_ANSWER") && (
            <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-4">
              <p className="text-sm text-blue-800 font-medium flex items-center gap-2">
                <span className="text-xl">ℹ️</span>
                {newQuestion.type === "SHORT_ANSWER"
                  ? "Students will provide a brief text answer. Manual grading required."
                  : "Students will provide a detailed text answer. Manual grading required."}
              </p>
            </div>
          )}

          {/* Add Question Button */}
          <button
            type="button"
            onClick={handleAddQuestion}
            disabled={loading}
            className="w-full px-8 py-4 bg-gradient-to-r from-orange-500 to-red-500 text-white font-bold rounded-xl shadow-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed hover:from-orange-600 hover:to-red-600 text-lg flex items-center justify-center gap-3"
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                Adding Question...
              </>
            ) : (
              <>Add Question to Test</>
            )}
          </button>
        </div>
      </div>

      {/* Questions List */}
      <div className="p-8">
        <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
          <span className="text-2xl">📚</span>
          Added Questions ({questions.length})
        </h3>
        {questions.length === 0 ? (
          <div className="text-center py-16 bg-gradient-to-br from-gray-50 to-blue-50 rounded-2xl border-2 border-dashed border-gray-300">
            <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4 text-4xl">
              ❓
            </div>
            <p className="text-gray-600 font-bold text-lg">
              No questions added yet
            </p>
            <p className="text-gray-500 mt-2">
              Add your first question using the form above
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {questions.map((q, index) => (
              <div
                key={index}
                className="bg-gradient-to-r from-gray-50 to-blue-50 rounded-2xl border-2 border-gray-200 p-6 hover:border-orange-300 transition-all"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-red-500 text-white font-bold rounded-xl flex items-center justify-center">
                      {index + 1}
                    </div>
                    <div>
                      <span className="px-3 py-1 bg-indigo-100 text-indigo-800 text-xs font-bold rounded-lg">
                        {q.type.replace("_", " ")}
                      </span>
                    </div>
                  </div>
                  <span className="px-4 py-2 bg-green-100 text-green-800 text-sm font-bold rounded-lg">
                    {q.maxMarks} {q.maxMarks === 1 ? "mark" : "marks"}
                  </span>
                </div>
                <p className="text-gray-900 font-medium text-lg mb-3">
                  {q.text}
                </p>
                {q.options && q.options.length > 0 && (
                  <div className="space-y-2">
                    {q.options.map((opt, i) => (
                      <div
                        key={i}
                        className={`px-4 py-2.5 rounded-lg font-medium ${
                          q.correctAnswer === i
                            ? "bg-green-100 border-2 border-green-400 text-green-900"
                            : "bg-white border border-gray-300 text-gray-700"
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
                {q.image && (
                  <div className="mt-3">
                    <Image
                      src={q.image}
                      alt="Question illustration"
                      width={400}
                      height={300}
                      className="max-w-sm h-auto rounded-lg border-2 border-gray-300"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = "none";
                      }}
                    />
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

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
