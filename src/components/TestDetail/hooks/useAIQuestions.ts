import { useState, useCallback } from "react";
import { Question, NotificationFunctions } from "../types";

/**
 * Hook for managing AI question generation and approval workflow
 */
export const useAIQuestions = (
  testId: string,
  onQuestionsCreated?: () => void,
  notifications?: NotificationFunctions,
  closeModal?: () => void
) => {
  const [aiPrompt, setAiPrompt] = useState("");
  const [aiGenerating, setAiGenerating] = useState(false);
  const [aiPdfUploading, setAiPdfUploading] = useState(false);

  const [aiMessages, setAiMessages] = useState<string[]>([]);
  const [showAiSection, setShowAiSection] = useState(false);
  const [showApprovalModal, setShowApprovalModal] = useState(false);
  const [pendingApprovalQuestions, setPendingApprovalQuestions] = useState<
    Question[]
  >([]);
  const [approvedQuestionIds, setApprovedQuestionIds] = useState<Set<number>>(
    new Set()
  );

  const normalizeAIQuestion = (q: any): Question | null => {
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

    const maxMarks = Math.max(
      1,
      Number(q.maxMarks || q.marks || q.points || 1)
    );

    let options: string[] | undefined;
    let correctAnswer: number | undefined;

    if (type === "MULTIPLE_CHOICE") {
      options = Array.isArray(q.options) ? q.options.filter(Boolean) : [];
      if (!options || options.length < 2) {
        options = ["Option A", "Option B", "Option C", "Option D"];
      }
      correctAnswer = Math.max(
        0,
        Math.min(options.length - 1, Number(q.correctAnswer || q.correct || 0))
      );
    } else if (type === "TRUE_FALSE") {
      options = ["True", "False"];
      correctAnswer =
        q.correctAnswer === "False" ||
        q.correctAnswer === false ||
        q.correctAnswer === 1
          ? 1
          : 0;
    }

    return {
      id: Math.random(), // Temporary ID for approval process
      testId: Number(testId),
      text,
      type,
      options,
      correctAnswer,
      maxMarks,
      image: q.image
    };
  };

  const generateAIQuestions = useCallback(
    async (prompt: string) => {
      if (!prompt.trim()) {
        notifications?.showError(
          "Please enter a prompt for AI question generation"
        );
        return false;
      }

      setAiGenerating(true);
      setAiMessages([]);

      try {
        const response = await fetch("/api/ai/generate-questions", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("token")}`
          },
          body: JSON.stringify({
            testId,
            prompt: prompt.trim(),
            stream: true
          })
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || "Failed to generate questions");
        }

        const reader = response.body?.getReader();
        if (!reader) throw new Error("No response stream available");

        const decoder = new TextDecoder();
        let buffer = "";
        const messages: string[] = [];

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n");
          buffer = lines.pop() || "";

          for (const line of lines) {
            if (line.startsWith("data: ")) {
              const data = line.slice(6);
              if (data === "[DONE]") continue;

              try {
                const parsed = JSON.parse(data);
                if (parsed.message) {
                  messages.push(parsed.message);
                  setAiMessages([...messages]);
                }
                if (parsed.questions) {
                  const normalized = parsed.questions
                    .map(normalizeAIQuestion)
                    .filter(Boolean);

                  if (normalized.length > 0) {
                    setPendingApprovalQuestions(normalized);
                    setShowApprovalModal(true);
                    closeModal?.();
                  }
                }
              } catch (e) {
                console.warn("Failed to parse AI response:", e);
              }
            }
          }
        }

        return true;
      } catch (err) {
        const errorMessage =
          err instanceof Error
            ? err.message
            : "Failed to generate AI questions";
        notifications?.showError(errorMessage);
        return false;
      } finally {
        setAiGenerating(false);
      }
    },
    [testId, notifications, closeModal]
  );

  const uploadPDFForQuestions = useCallback(
    async (file: File) => {
      setAiPdfUploading(true);

      try {
        const formData = new FormData();
        formData.append("pdf", file);
        formData.append("testId", testId);

        const response = await fetch("/api/ai/extract-questions-from-pdf", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`
          },
          body: formData
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || "Failed to process PDF");
        }

        const result = await response.json();
        const normalized =
          result.questions?.map(normalizeAIQuestion).filter(Boolean) || [];

        if (normalized.length > 0) {
          setPendingApprovalQuestions(normalized);
          setShowApprovalModal(true);
          closeModal?.();
          notifications?.showSuccess(
            `Extracted ${normalized.length} questions from PDF`
          );
        } else {
          notifications?.showWarning(
            "No questions could be extracted from the PDF"
          );
        }

        return true;
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Failed to process PDF";
        notifications?.showError(errorMessage);
        return false;
      } finally {
        setAiPdfUploading(false);
      }
    },
    [testId, notifications, closeModal]
  );

  const approveQuestions = useCallback(
    async (questions: Question[]) => {
      if (questions.length === 0) return true;

      try {
        const questionsToCreate = questions.map((q) => ({
          testId: Number(testId),
          text: q.text,
          type: q.type,
          maxMarks: q.maxMarks,
          options: q.options,
          correctAnswer: q.correctAnswer,
          image: q.image
        }));

        const promises = questionsToCreate.map((question) =>
          fetch("/api/questions", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${localStorage.getItem("token")}`
            },
            body: JSON.stringify(question)
          })
        );

        const responses = await Promise.all(promises);
        const failedResponses = responses.filter((r) => !r.ok);

        if (failedResponses.length > 0) {
          throw new Error(
            `${failedResponses.length} questions failed to create`
          );
        }

        notifications?.showSuccess(
          `${questions.length} questions approved and created successfully`
        );
        onQuestionsCreated?.();

        // Reset state
        setPendingApprovalQuestions([]);
        setApprovedQuestionIds(new Set());
        setShowApprovalModal(false);

        return true;
      } catch (err) {
        const errorMessage =
          err instanceof Error
            ? err.message
            : "Failed to create approved questions";
        notifications?.showError(errorMessage);
        return false;
      }
    },
    [testId, notifications, onQuestionsCreated]
  );

  const resetAIState = useCallback(() => {
    setAiPrompt("");
    setAiMessages([]);
    setShowAiSection(false);
    setPendingApprovalQuestions([]);
    setApprovedQuestionIds(new Set());
    setShowApprovalModal(false);
  }, []);

  return {
    // State
    aiPrompt,
    aiGenerating,
    aiPdfUploading,
    aiMessages,
    showAiSection,
    showApprovalModal,
    pendingApprovalQuestions,
    approvedQuestionIds,

    // Actions
    setAiPrompt,
    setShowAiSection,
    setShowApprovalModal,
    setApprovedQuestionIds,
    generateAIQuestions,
    uploadPDFForQuestions,
    approveQuestions,
    resetAIState,
    setPendingApprovalQuestions,

    // Backward compatibility aliases
    handleGenerateFromPrompt: generateAIQuestions,
    handleGenerateFromPdf: uploadPDFForQuestions,
    handleApproveBatchQuestions: approveQuestions
  };
};
