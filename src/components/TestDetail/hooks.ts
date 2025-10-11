import { useState, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import api from "../../hooks/useApi";
import {
  Test,
  Question,
  SubmissionItem,
  SubmissionAnswer,
  AIQuestionRaw,
  QuestionCreatePayload,
  QuestionUpdatePayload,
  GradingStatus,
  SubmissionStatus,
} from "./types";

export const useTestDetail = (testId: string) => {
  const router = useRouter();
  const [testData, setTestData] = useState<Test | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTestDetails = useCallback(async () => {
    if (!testId) return;
    setLoading(true);
    setError(null);

    try {
      const testRes = await api(`/tests/${testId}`, {
        method: "GET",
        auth: true,
      });
      if (!testRes.ok) {
        const errorData = await testRes.json();
        throw new Error(errorData.message || "Failed to fetch test details");
      }
      const testData = await testRes.json();
      setTestData(testData);
    } catch (err) {
      console.error(err);
      setError(
        err instanceof Error ? err.message : "Failed to fetch test data",
      );
    } finally {
      setLoading(false);
    }
  }, [testId]);

  const handleUpdateTest = async (editingTest: Test) => {
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
      await fetchTestDetails();
      return true;
    } catch (err) {
      alert(err instanceof Error ? err.message : "Error updating test");
      return false;
    }
  };

  const handleDeleteTest = async () => {
    if (!testData) return;
    if (
      !confirm(
        "Are you sure you want to delete this test? This action cannot be undone.",
      )
    )
      return;

    try {
      const res = await api(`/tests/${testData.id}`, {
        method: "DELETE",
        auth: true,
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || "Failed to delete test");
      }

      alert("Test deleted successfully!");
      if (testData?.classId) {
        router.push(`/class/${testData.classId}`);
      } else {
        router.back();
      }
    } catch (err) {
      alert(err instanceof Error ? err.message : "Error deleting test");
    }
  };

  // Auto-fetch when testId changes
  useEffect(() => {
    fetchTestDetails();
  }, [fetchTestDetails]);

  return {
    testData,
    loading,
    error,
    fetchTestDetails,
    handleUpdateTest,
    handleDeleteTest,
  };
};

export const useQuestions = (testId: string) => {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loadingQuestions, setLoadingQuestions] = useState(false);
  const [questionsError, setQuestionsError] = useState<string | null>(null);

  const fetchQuestions = useCallback(async () => {
    if (!testId) return;
    setLoadingQuestions(true);
    setQuestionsError(null);
    try {
      const res = await api(`/tests/${testId}/questions`, {
        method: "GET",
        auth: true,
      });
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || "Failed to fetch questions");
      }
      const data = await res.json();
      setQuestions(data || []); // Ensure we always have an array
    } catch (err) {
      console.error("Failed to fetch questions:", err);
      setQuestionsError(
        err instanceof Error ? err.message : "Failed to fetch questions",
      );
      setQuestions([]); // Set empty array on error so the interface still works
    } finally {
      setLoadingQuestions(false);
    }
  }, [testId]);

  const handleAddQuestion = async (newQuestion: Question) => {
    if (!testId) return false;
    if (!newQuestion.text.trim()) {
      alert("Please enter a question text");
      return false;
    }

    if (newQuestion.type === "MULTIPLE_CHOICE") {
      if (!newQuestion.options || newQuestion.options.length < 2) {
        alert("Multiple choice questions must have at least 2 options");
        return false;
      }
      if (
        newQuestion.correctAnswer === undefined ||
        newQuestion.correctAnswer < 0
      ) {
        alert("Please select the correct answer");
        return false;
      }
    }

    setLoadingQuestions(true);
    try {
      const payload: QuestionCreatePayload = {
        testId: Number(testId),
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

      alert("Question added successfully!");
      await fetchQuestions();
      return true;
    } catch (err) {
      alert(err instanceof Error ? err.message : "Error adding question");
      return false;
    } finally {
      setLoadingQuestions(false);
    }
  };

  const handleUpdateQuestion = async (editingQuestion: Question) => {
    if (!editingQuestion) return false;

    setLoadingQuestions(true);
    try {
      const payload: QuestionUpdatePayload = {
        text: editingQuestion.text.trim(),
        type: editingQuestion.type,
        maxMarks: Number(editingQuestion.maxMarks),
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
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || "Failed to update question");
      }

      alert("Question updated successfully!");
      await fetchQuestions();
      return true;
    } catch (err) {
      alert(err instanceof Error ? err.message : "Error updating question");
      return false;
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
      await fetchQuestions();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Error deleting question");
    }
  };

  // Auto-fetch when testId changes
  useEffect(() => {
    fetchQuestions();
  }, [fetchQuestions]);

  return {
    questions,
    loadingQuestions,
    questionsError,
    fetchQuestions,
    handleAddQuestion,
    handleUpdateQuestion,
    handleDeleteQuestion,
  };
};

export const useSubmissions = (testId: string) => {
  const [showSubmissionsModal, setShowSubmissionsModal] = useState(false);
  const [submissionsLoading, setSubmissionsLoading] = useState(false);
  const [submissions, setSubmissions] = useState<SubmissionItem[]>([]);
  const [gradeDraft, setGradeDraft] = useState<
    Record<number, Record<number, number>>
  >({});

  const fetchSubmissions = useCallback(async () => {
    if (!testId) return;
    setSubmissionsLoading(true);
    try {
      const response = await api(`/submissions/test/${testId}`, {
        method: "GET",
        auth: true,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to fetch submissions");
      }

      const data = await response.json();

      // Normalize the data structure
      interface RawAnswer {
        id?: number;
        answerId?: number;
        questionId?: number;
        questionText?: string;
        question?: {
          text?: string;
          type?: Question["type"];
          maxMarks?: number;
        };
        questionType?: Question["type"];
        maxMarks?: number;
        answer?: string;
        text?: string;
        obtainedMarks?: number | null;
        score?: number | null;
        isAutoEvaluated?: boolean;
        autoGraded?: boolean;
        gradingStatus?: string;
        status?: string;
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
        status?: string;
        submissionStatus?: string;
        submittedAt?: string;
        gradedAt?: string;
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
                        isAutoEvaluated:
                          a.isAutoEvaluated ?? a.autoGraded ?? false,
                        gradingStatus: (a.gradingStatus ??
                          a.status ??
                          "PENDING") as GradingStatus,
                      } as SubmissionAnswer;
                    })
                    .filter((x): x is SubmissionAnswer => !!x)
                : [];
              return {
                id: Number(obj.id ?? obj.submissionId ?? obj.submission?.id),
                student: obj.student ?? obj.user ?? obj.learner ?? undefined,
                totalMarks: obj.totalMarks ?? obj.maxMarks ?? undefined,
                obtainedMarks: obj.obtainedMarks ?? obj.score ?? null,
                answers: answersArr,
                status: (obj.status ??
                  obj.submissionStatus ??
                  "SUBMITTED") as SubmissionStatus,
                submittedAt: obj.submittedAt,
                gradedAt: obj.gradedAt,
              } as SubmissionItem;
            })
            .filter((s): s is SubmissionItem => !!s && Number.isFinite(s.id))
        : [];

      setSubmissions(normalized.filter((s) => Number.isFinite(s.id)));

      // Initialize grade draft for manual questions with existing marks (only for non-graded questions)
      const initial: Record<number, Record<number, number>> = {};
      normalized.forEach((s) => {
        initial[s.id] = {};
        (s.answers ?? []).forEach((a) => {
          // Only add to draft if it's not already graded and has marks
          if (
            a.gradingStatus !== "GRADED" &&
            typeof a.obtainedMarks === "number"
          ) {
            initial[s.id][a.id] = a.obtainedMarks;
          }
        });
      });
      setGradeDraft(initial);
    } catch (err) {
      console.error("Failed to fetch submissions:", err);
      setSubmissions([]);
    } finally {
      setSubmissionsLoading(false);
    }
  }, [testId]);

  const openSubmissionsModal = async () => {
    setShowSubmissionsModal(true);
    await fetchSubmissions();
  };

  const updateDraftMark = (
    submissionId: number,
    answerId: number,
    value: number,
    max?: number,
  ) => {
    const safe = Math.max(
      0,
      typeof max === "number" ? Math.min(value, max) : value,
    );
    setGradeDraft((prev) => ({
      ...prev,
      [submissionId]: { ...(prev[submissionId] || {}), [answerId]: safe },
    }));
  };

  const submitGrades = async (submission: SubmissionItem) => {
    const draft = gradeDraft[submission.id] || {};
    const answersPayload = Object.entries(draft).map(
      ([answerId, obtainedMarks]) => ({
        answerId: Number(answerId),
        obtainedMarks,
      }),
    );

    if (answersPayload.length === 0) {
      alert("No manual grades to submit for this submission.");
      return;
    }

    setSubmissionsLoading(true);
    try {
      const response = await api(`/submissions/${submission.id}/grade`, {
        method: "POST",
        auth: true,
        body: JSON.stringify({ answers: answersPayload }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to grade submission");
      }

      // Update local state instead of refetching
      setSubmissions((prevSubmissions) =>
        prevSubmissions.map((s) => {
          if (s.id === submission.id) {
            const updatedAnswers = s.answers?.map((answer) => {
              const gradeUpdate = answersPayload.find(
                (ap) => ap.answerId === answer.id,
              );
              if (gradeUpdate) {
                return {
                  ...answer,
                  obtainedMarks: gradeUpdate.obtainedMarks,
                  gradingStatus: "GRADED" as GradingStatus,
                };
              }
              return answer;
            });

            // Calculate total obtained marks
            const totalObtained =
              updatedAnswers?.reduce(
                (sum, ans) => sum + (ans.obtainedMarks ?? 0),
                0,
              ) ?? 0;

            return {
              ...s,
              answers: updatedAnswers,
              obtainedMarks: totalObtained,
              status: "GRADED" as SubmissionStatus,
              gradedAt: new Date().toISOString(),
            };
          }
          return s;
        }),
      );

      // Clear the draft for this submission
      setGradeDraft((prev) => {
        const updated = { ...prev };
        delete updated[submission.id];
        return updated;
      });

      alert("✅ Submission graded successfully");
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to grade submission");
    } finally {
      setSubmissionsLoading(false);
    }
  };

  // Auto-fetch submissions when testId changes
  useEffect(() => {
    if (testId) {
      fetchSubmissions();
    }
  }, [testId, fetchSubmissions]);

  return {
    showSubmissionsModal,
    setShowSubmissionsModal,
    submissionsLoading,
    submissions,
    gradeDraft,
    openSubmissionsModal,
    updateDraftMark,
    submitGrades,
  };
};

export const useAIQuestions = (
  testId: string,
  fetchQuestions: () => Promise<void>,
) => {
  const [aiPrompt, setAiPrompt] = useState("");
  const [aiGenerating, setAiGenerating] = useState(false);
  const [aiPdfUploading, setAiPdfUploading] = useState(false);
  const [aiDesiredCount, setAiDesiredCount] = useState(5);
  const [aiMessages, setAiMessages] = useState<string[]>([]);
  const [showAiSection, setShowAiSection] = useState(false);
  const [showApprovalModal, setShowApprovalModal] = useState(false);
  const [pendingApprovalQuestions, setPendingApprovalQuestions] = useState<
    Question[]
  >([]);
  const [approvedQuestionIds, setApprovedQuestionIds] = useState<Set<number>>(
    new Set(),
  );

  const normalizeAIQuestion = (q: AIQuestionRaw): Question | null => {
    const text = (q.text || q.question || "").trim();
    if (!text) return null;
    const rawType = (q.type || "MULTIPLE_CHOICE").toUpperCase();
    let type: Question["type"] = "MULTIPLE_CHOICE";
    if (
      ["TRUE_FALSE", "MULTIPLE_CHOICE", "SHORT_ANSWER", "LONG_ANSWER"].includes(
        rawType,
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
      testId: Number(testId) || 0,
      text,
      type,
      options,
      correctAnswer,
      maxMarks,
    };
  };

  const appendAiMessage = (msg: string) => setAiMessages((m) => [...m, msg]);

  const bulkPersistQuestions = async (generated: Question[]) => {
    if (!generated.length || !testId) return;
    try {
      const payload = generated.map((g) => {
        const base: QuestionCreatePayload = {
          testId: Number(testId),
          text: g.text,
          type: g.type as Question["type"],
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
      await fetchQuestions();
      appendAiMessage(`✅ Added ${generated.length} AI generated question(s).`);
    } catch (err) {
      console.error(err);
      appendAiMessage(
        `❌ Failed to save generated questions: ${
          err instanceof Error ? err.message : "Unknown error"
        }`,
      );
    }
  };

  const showApprovalModalForQuestions = (questions: Question[]) => {
    const questionsWithTempIds = questions.map((q, index) => ({
      ...q,
      id: index + 1,
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
      approvedQuestionIds.has(q.id),
    );

    if (approvedQuestions.length === 0) {
      alert("Please approve at least one question to add.");
      return;
    }

    const questionsToAdd = approvedQuestions.map((q) => ({
      ...q,
      id: 0,
      testId: Number(testId) || 0,
    }));

    await bulkPersistQuestions(questionsToAdd);

    setShowApprovalModal(false);
    setPendingApprovalQuestions([]);
    setApprovedQuestionIds(new Set());
  };

  const handleGenerateFromPrompt = async () => {
    if (!testId) return;
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

      appendAiMessage(
        `✅ Generated ${normalized.length} questions. Review and approve to add.`,
      );
      showApprovalModalForQuestions(normalized);
    } catch (err) {
      appendAiMessage(
        `❌ Prompt generation error: ${err instanceof Error ? err.message : "Unknown error"}`,
      );
    } finally {
      setAiGenerating(false);
    }
  };

  const handleGenerateFromPdf = async (file: File | null) => {
    if (!testId || !file) return;
    setAiPdfUploading(true);
    appendAiMessage(`📄 Uploading PDF: ${file.name}`);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await api(`/agent/generate-questions/pdf`, {
        method: "POST",
        auth: true,
        body: formData,
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
        `✅ Generated ${normalized.length} questions from PDF. Review and approve to add.`,
      );
      showApprovalModalForQuestions(normalized);
    } catch (err) {
      appendAiMessage(
        `❌ PDF generation error: ${err instanceof Error ? err.message : "Unknown error"}`,
      );
    } finally {
      setAiPdfUploading(false);
    }
  };

  return {
    aiPrompt,
    setAiPrompt,
    aiGenerating,
    aiPdfUploading,
    aiDesiredCount,
    setAiDesiredCount,
    aiMessages,
    showAiSection,
    setShowAiSection,
    showApprovalModal,
    setShowApprovalModal,
    pendingApprovalQuestions,
    setPendingApprovalQuestions,
    approvedQuestionIds,
    setApprovedQuestionIds,
    appendAiMessage,
    toggleQuestionApproval,
    handleApproveAndAddQuestions,
    handleGenerateFromPrompt,
    handleGenerateFromPdf,
  };
};
