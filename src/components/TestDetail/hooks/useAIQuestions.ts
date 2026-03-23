import { useState, useCallback, useRef, useEffect } from 'react';

import api from '@/hooks/useApi';
import { Question, NotificationFunctions } from '../types';

export const useAIQuestions = (
  testId?: string,
  onQuestionsCreated?: () => void,
  notifications?: NotificationFunctions,
  closeModal?: () => void,
) => {
  const [aiPrompt, setAiPrompt] = useState('');
  const [aiGenerating, setAiGenerating] = useState(false);
  const [aiPdfUploading, setAiPdfUploading] = useState(false);

  const [aiMessages, setAiMessages] = useState<string[]>([]);
  const [showAiSection, setShowAiSection] = useState(false);
  const [showApprovalModal, setShowApprovalModal] = useState(false);
  const [pendingApprovalQuestions, setPendingApprovalQuestions] = useState<Question[]>([]);
  const [approvedQuestionIds, setApprovedQuestionIds] = useState<Set<number>>(new Set());
  const [targetPoolId, setTargetPoolId] = useState<number | undefined>(undefined);

  const notifRef = useRef(notifications);
  const closeModalRef = useRef(closeModal);
  const onQuestionsCreatedRef = useRef(onQuestionsCreated);
  useEffect(() => {
    notifRef.current = notifications;
  }, [notifications]);
  useEffect(() => {
    closeModalRef.current = closeModal;
  }, [closeModal]);
  useEffect(() => {
    onQuestionsCreatedRef.current = onQuestionsCreated;
  }, [onQuestionsCreated]);

  const normalizeAIQuestion = useCallback(
    (q: Record<string, unknown>): Question | null => {
      const text = String(q.text || q.question || '').trim();
      if (!text || text.length < 3) {
        console.warn('Skipping question with invalid text:', q);
        return null;
      }

      const rawType = String(q.type || 'MULTIPLE_CHOICE').toUpperCase();
      let type: Question['type'] = 'MULTIPLE_CHOICE';

      if (['TRUE_FALSE', 'MULTIPLE_CHOICE', 'SHORT_ANSWER', 'LONG_ANSWER'].includes(rawType)) {
        type = rawType as Question['type'];
      }

      const maxMarks = Math.max(1, Number(q.maxMarks || q.marks || q.points || 1));

      let options: string[] | undefined;
      let correctAnswer: number | undefined;

      if (type === 'MULTIPLE_CHOICE') {
        const rawOptions = Array.isArray(q.options)
          ? q.options.filter((opt) => opt && String(opt).trim().length > 0)
          : [];

        if (rawOptions.length >= 2) {
          options = rawOptions.map((opt) => String(opt).trim());
        } else {
          options = ['Option A', 'Option B', 'Option C', 'Option D'];
        }

        const rawCorrect = Number(q.correctAnswer || q.correct || 0);
        correctAnswer = Math.max(0, Math.min(options.length - 1, rawCorrect));
      } else if (type === 'TRUE_FALSE') {
        options = ['True', 'False'];

        if (q.correctAnswer === 'True' || q.correctAnswer === true || q.correctAnswer === 1) {
          correctAnswer = 1;
        } else if (
          q.correctAnswer === 'False' ||
          q.correctAnswer === false ||
          q.correctAnswer === 0
        ) {
          correctAnswer = 0;
        } else {
          correctAnswer = 1;
        }
      }

      const normalizedQuestion: Question = {
        id: Math.random(),
        testId: Number(testId),
        text,
        type,
        maxMarks,
        options,
        correctAnswer,
        image: typeof q.image === 'string' && q.image.trim() ? q.image.trim() : undefined,
      };

      if (type === 'MULTIPLE_CHOICE' && (!options || options.length < 2)) {
        console.warn('Invalid multiple choice question:', normalizedQuestion);
        return null;
      }

      if (
        (type === 'MULTIPLE_CHOICE' || type === 'TRUE_FALSE') &&
        typeof correctAnswer !== 'number'
      ) {
        console.warn('Missing correct answer for question:', normalizedQuestion);
        return null;
      }

      return normalizedQuestion;
    },
    [testId],
  );

  const generateAIQuestions = useCallback(
    async (prompt: string, poolId?: number) => {
      if (!prompt.trim()) {
        notifRef.current?.showError?.('Please enter a prompt for AI question generation');
        return false;
      }

      setAiGenerating(true);
      setAiMessages([]);

      try {
        const response = await api('/agent/generate-questions/ask', {
          method: 'POST',
          auth: true,
          body: JSON.stringify({
            prompt: prompt.trim(),
          }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || 'Failed to generate questions');
        }

        const result = await response.json();

        if (result.message) {
          setAiMessages([result.message]);
        }

        if (result.questions && result.questions.length > 0) {
          const normalized = result.questions.map(normalizeAIQuestion).filter(Boolean);

          if (normalized.length > 0) {
            setPendingApprovalQuestions(normalized);
            setTargetPoolId(poolId);
            setShowApprovalModal(true);
            closeModalRef.current?.();
            notifRef.current?.showSuccess?.(
              `Generated ${normalized.length} questions for your review`,
            );
          }
        } else {
          notifRef.current?.showWarning?.('No questions were generated from the prompt');
        }

        return true;
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to generate AI questions';
        notifRef.current?.showError?.(errorMessage);
        return false;
      } finally {
        setAiGenerating(false);
      }
    },
    [normalizeAIQuestion],
  );

  const uploadPDFForQuestions = useCallback(
    async (file: File, poolId?: number) => {
      if (!file) {
        notifRef.current?.showError?.('No file selected. Please choose a PDF file.');
        return false;
      }

      if (!file.type || !file.type.includes('pdf')) {
        notifRef.current?.showError?.('Invalid file type. Please select a PDF file.');
        return false;
      }

      // Log file details for debugging
      console.log('PDF Upload - File Details:', {
        name: file.name,
        size: file.size,
        type: file.type,
        lastModified: file.lastModified,
      });

      setAiPdfUploading(true);

      try {
        const formData = new FormData();
        formData.append('file', file);

        const response = await api('/agent/generate-questions/pdf', {
          method: 'POST',
          auth: true,
          body: formData,
        });

        if (!response.ok) {
          const errorData = await response.json();
          const errorMessage = errorData.message || 'Failed to process PDF';
          console.error('PDF Processing Error:', {
            status: response.status,
            error: errorData,
            message: errorMessage,
          });
          throw new Error(errorMessage);
        }

        const result = await response.json();
        const normalized = result.questions?.map(normalizeAIQuestion).filter(Boolean) || [];

        if (normalized.length > 0) {
          setPendingApprovalQuestions(normalized);
          setTargetPoolId(poolId);
          setShowApprovalModal(true);
          closeModalRef.current?.();
          notifRef.current?.showSuccess?.(`Extracted ${normalized.length} questions from PDF`);
        } else {
          notifRef.current?.showWarning?.('No questions could be extracted from the PDF');
        }

        return true;
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to process PDF';
        console.error('PDF Upload Error:', err);
        notifRef.current?.showError?.(errorMessage);
        return false;
      } finally {
        setAiPdfUploading(false);
      }
    },
    [normalizeAIQuestion],
  );

  const approveQuestions = useCallback(
    async (questions: Question[]) => {
      if (questions.length === 0) return true;

      try {
        const questionsToCreate = questions.map((q) => {
          const questionData: {
            text: string;
            type: Question['type'];
            maxMarks: number;
            options?: string[];
            correctAnswer?: number;
            image?: string;
          } = {
            text: q.text?.trim() || 'Question text not provided',
            type: q.type || 'MULTIPLE_CHOICE',
            maxMarks: q.maxMarks || 1,
          };

          if (q.type === 'MULTIPLE_CHOICE' && q.options && q.options.length > 0) {
            questionData.options = q.options;
            questionData.correctAnswer = typeof q.correctAnswer === 'number' ? q.correctAnswer : 0;
          }

          if (q.type === 'TRUE_FALSE') {
            questionData.correctAnswer = typeof q.correctAnswer === 'number' ? q.correctAnswer : 0;
          }

          if (q.image && q.image.trim()) {
            questionData.image = q.image.trim();
          }

          return questionData;
        });

        const payload = {
          questions: questionsToCreate.map((q) => ({
            ...q,
            questionPoolId: targetPoolId ?? undefined,
          })),
        };

        const response = await api(`/tests/${testId}/questions`, {
          method: 'POST',
          auth: true,
          body: JSON.stringify(payload),
        });

        if (!response.ok) {
          const errorData = await response.json();
          console.error('Question creation error:', errorData);
          throw new Error(
            errorData.message || `Failed to create questions: HTTP ${response.status}`,
          );
        }

        notifRef.current?.showSuccess?.(
          `${questions.length} questions approved and created successfully`,
        );

        onQuestionsCreatedRef.current?.();

        setPendingApprovalQuestions([]);
        setApprovedQuestionIds(new Set());
        setShowApprovalModal(false);
        closeModalRef.current?.();

        return true;
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : 'Failed to create approved questions';
        notifRef.current?.showError?.(errorMessage);
        return false;
      }
    },

    [testId, targetPoolId],
  );

  const resetAIState = useCallback(() => {
    setAiPrompt('');
    setAiMessages([]);
    setShowAiSection(false);
    setPendingApprovalQuestions([]);
    setApprovedQuestionIds(new Set());
    setTargetPoolId(undefined);
    setShowApprovalModal(false);
  }, []);

  return {
    aiPrompt,
    aiGenerating,
    aiPdfUploading,
    aiMessages,
    showAiSection,
    showApprovalModal,
    pendingApprovalQuestions,
    approvedQuestionIds,

    setAiPrompt,
    setShowAiSection,
    setShowApprovalModal,
    setApprovedQuestionIds,
    generateAIQuestions,
    uploadPDFForQuestions,
    approveQuestions,
    resetAIState,
    setPendingApprovalQuestions,

    handleGenerateFromPrompt: generateAIQuestions,
    handleGenerateFromPdf: uploadPDFForQuestions,
    handleApproveBatchQuestions: approveQuestions,
  };
};
