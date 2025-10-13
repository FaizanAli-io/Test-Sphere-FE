import { useState, useCallback } from "react";
import { Question, NotificationFunctions } from "../types";
import api from "../../../hooks/useApi";

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

  const normalizeAIQuestion = useCallback(
    (q: Record<string, unknown>): Question | null => {
      const text = String(q.text || q.question || "").trim();
      if (!text || text.length < 3) {
        console.warn("Skipping question with invalid text:", q);
        return null;
      }

      const rawType = String(q.type || "MULTIPLE_CHOICE").toUpperCase();
      let type: Question["type"] = "MULTIPLE_CHOICE";

      if (
        [
          "TRUE_FALSE",
          "MULTIPLE_CHOICE",
          "SHORT_ANSWER",
          "LONG_ANSWER",
        ].includes(rawType)
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
        const rawOptions = Array.isArray(q.options)
          ? q.options.filter((opt) => opt && String(opt).trim().length > 0)
          : [];

        if (rawOptions.length >= 2) {
          options = rawOptions.map((opt) => String(opt).trim());
        } else {
          options = ["Option A", "Option B", "Option C", "Option D"];
        }

        const rawCorrect = Number(q.correctAnswer || q.correct || 0);
        correctAnswer = Math.max(0, Math.min(options.length - 1, rawCorrect));
      } else if (type === "TRUE_FALSE") {
        options = ["True", "False"];

        // Handle various true/false formats
        if (
          q.correctAnswer === "False" ||
          q.correctAnswer === false ||
          q.correctAnswer === 1
        ) {
          correctAnswer = 1; // False
        } else if (
          q.correctAnswer === "True" ||
          q.correctAnswer === true ||
          q.correctAnswer === 0
        ) {
          correctAnswer = 0; // True
        } else {
          correctAnswer = 0; // Default to True
        }
      }

      const normalizedQuestion: Question = {
        id: Math.random(), // Temporary ID for approval process
        testId: Number(testId),
        text,
        type,
        maxMarks,
        options,
        correctAnswer,
        image:
          typeof q.image === "string" && q.image.trim()
            ? q.image.trim()
            : undefined,
      };

      // Validate the normalized question
      if (type === "MULTIPLE_CHOICE" && (!options || options.length < 2)) {
        console.warn("Invalid multiple choice question:", normalizedQuestion);
        return null;
      }

      if (
        (type === "MULTIPLE_CHOICE" || type === "TRUE_FALSE") &&
        typeof correctAnswer !== "number"
      ) {
        console.warn(
          "Missing correct answer for question:",
          normalizedQuestion
        );
        return null;
      }

      return normalizedQuestion;
    },
    [testId]
  );

  const generateAIQuestions = useCallback(
    async (prompt: string) => {
      if (!prompt.trim()) {
        notifications?.showError?.(
          "Please enter a prompt for AI question generation"
        );
        return false;
      }

      setAiGenerating(true);
      setAiMessages([]);

      try {
        const response = await api("/agent/generate-questions/ask", {
          method: "POST",
          auth: true,
          body: JSON.stringify({
            prompt: prompt.trim(),
          }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || "Failed to generate questions");
        }

        const result = await response.json();

        // Set the message if available
        if (result.message) {
          setAiMessages([result.message]);
        }

        // Process the questions
        if (result.questions && result.questions.length > 0) {
          const normalized = result.questions
            .map(normalizeAIQuestion)
            .filter(Boolean);

          if (normalized.length > 0) {
            setPendingApprovalQuestions(normalized);
            setShowApprovalModal(true);
            closeModal?.();
            notifications?.showSuccess?.(
              `Generated ${normalized.length} questions for your review`
            );
          }
        } else {
          notifications?.showWarning?.(
            "No questions were generated from the prompt"
          );
        }

        return true;
      } catch (err) {
        const errorMessage =
          err instanceof Error
            ? err.message
            : "Failed to generate AI questions";
        notifications?.showError?.(errorMessage);
        return false;
      } finally {
        setAiGenerating(false);
      }
    },
    [testId, notifications, closeModal, normalizeAIQuestion]
  );

  const uploadPDFForQuestions = useCallback(
    async (file: File) => {
      setAiPdfUploading(true);

      try {
        const formData = new FormData();
        formData.append("file", file);

        const response = await api("/agent/generate-questions/pdf", {
          method: "POST",
          auth: true,
          headers: {},
          body: formData,
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
          notifications?.showSuccess?.(
            `Extracted ${normalized.length} questions from PDF`
          );
        } else {
          notifications?.showWarning?.(
            "No questions could be extracted from the PDF"
          );
        }

        return true;
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Failed to process PDF";
        notifications?.showError?.(errorMessage);
        return false;
      } finally {
        setAiPdfUploading(false);
      }
    },
    [testId, notifications, closeModal, normalizeAIQuestion]
  );

  const approveQuestions = useCallback(
    async (questions: Question[]) => {
      if (questions.length === 0) return true;

      try {
        const questionsToCreate = questions.map((q) => {
          const questionData: any = {
            testId: Number(testId),
            text: q.text?.trim() || "Question text not provided",
            type: q.type || "MULTIPLE_CHOICE",
            maxMarks: q.maxMarks || 1,
          };

          // Only include options for MULTIPLE_CHOICE questions
          if (
            q.type === "MULTIPLE_CHOICE" &&
            q.options &&
            q.options.length > 0
          ) {
            questionData.options = q.options;
            questionData.correctAnswer =
              typeof q.correctAnswer === "number" ? q.correctAnswer : 0;
          }

          // Only include correctAnswer for TRUE_FALSE questions
          if (q.type === "TRUE_FALSE") {
            questionData.correctAnswer =
              typeof q.correctAnswer === "number" ? q.correctAnswer : 0;
          }

          // Include image if provided
          if (q.image && q.image.trim()) {
            questionData.image = q.image.trim();
          }

          return questionData;
        });

        // Send all questions in a single request as expected by the backend
        const payload = {
          questions: questionsToCreate,
        };

        const response = await api(`/tests/${testId}/questions`, {
          method: "POST",
          auth: true,
          body: JSON.stringify(payload),
        });

        if (!response.ok) {
          const errorData = await response.json();
          console.error("Question creation error:", errorData);
          throw new Error(
            errorData.message ||
              `Failed to create questions: HTTP ${response.status}`
          );
        }

        notifications?.showSuccess?.(
          `${questions.length} questions approved and created successfully`
        );

        // Trigger questions refresh
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
        notifications?.showError?.(errorMessage);
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
    handleApproveBatchQuestions: approveQuestions,
  };
};
