import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";

import { useSubmissions } from "../Submissions";
import type { Submission } from "../Submissions/types";

import { debugLogger } from "@/utils/logger";
import { useConfirmation } from "@/hooks/useConfirmation";
import ConfirmationModal from "@/components/ConfirmationModal";
import { useNotifications } from "@/contexts/NotificationContext";

import {
  EditTestModal,
  AIApprovalModal,
  AddQuestionModal,
  SubmissionsModal,
  EditQuestionModal,
  ConfigureTestModal,
  PoolModal,
  AddQuestionsToPoolModal,
} from "./modals";
import dynamic from "next/dynamic";
const ProctoringLogsModal = dynamic(() => import("./modals").then((m) => m.ProctoringLogsModal), {
  loading: () => null,
});
import { HeaderSection, QuestionsSection, SubmissionsSection, PoolsSection } from "./components";
import { Question, Test, QuestionUpdatePayload, TestConfig, QuestionPool } from "./types";
import { useQuestions, useTestDetail, useAIQuestions, useQuestionPools } from "./hooks";

interface TestDetailProps {
  testId?: string;
}

export default function TestDetail({ testId: propTestId }: TestDetailProps) {
  const params = useParams();
  const router = useRouter();
  const confirmation = useConfirmation();
  const notifications = useNotifications();
  const testId = propTestId || (params?.testId as string);

  const [redirecting, setRedirecting] = useState(false);
  const [showLogsModal, setShowLogsModal] = useState(false);
  const [showEditTestModal, setShowEditTestModal] = useState(false);
  const [showConfigureModal, setShowConfigureModal] = useState(false);
  const [showAddQuestionModal, setShowAddQuestionModal] = useState(false);
  const [showEditQuestionModal, setShowEditQuestionModal] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState<Question | null>(null);
  const [logsSubmissionId, setLogsSubmissionId] = useState<number | null>(null);

  const [showCreatePoolModal, setShowCreatePoolModal] = useState(false);
  const [editingPool, setEditingPool] = useState<QuestionPool | null>(null);
  const [showAddQuestionsToPoolModal, setShowAddQuestionsToPoolModal] = useState(false);
  const [targetPoolForAddQuestions, setTargetPoolForAddQuestions] = useState<QuestionPool | null>(null);

  const testIdOrNull = redirecting ? undefined : testId;

  const [mode, setMode] = React.useState<"STATIC" | "POOL">("STATIC");

  const testDetailHook = useTestDetail(testIdOrNull, notifications, confirmation.confirm);
  const questionsHook = useQuestions(testIdOrNull, notifications, confirmation.confirm, mode);
  const submissionsHook = useSubmissions(testIdOrNull, "teacher", notifications);
  const {
    pools,
    loadingPools,
    createPool,
    updatePool,
    deletePool,
    addQuestionsToPool,
    removeQuestionsFromPool,
  } = useQuestionPools(testIdOrNull, notifications, confirmation.confirm);
  const aiQuestionsHook = useAIQuestions(
    testIdOrNull,
    questionsHook.refreshQuestions,
    notifications,
    () => setShowAddQuestionModal(false),
  );

  const test = testDetailHook.testData;
  const loadingTest = testDetailHook.loading;
  const questions = questionsHook.questions;
  const loadingQuestions = questionsHook.loadingQuestions;
  const loadingSubmissions = submissionsHook.submissionsLoading;
  const [submissionsState, setSubmissionsState] = useState<Submission[]>([]);
  const submissions: Submission[] =
    submissionsState.length > 0 ? submissionsState : submissionsHook.submissions;

  const role = typeof window !== "undefined" ? (localStorage.getItem("role") || "teacher") : "teacher";
  const isTeacher = role === "teacher";

  // If in pool mode, warn teacher if selected response is shorter than requested counts
  const requestedCount = pools.reduce((acc, p) => acc + Object.values(p.config).reduce((a, b) => a + b, 0), 0);
  const poolWarning = mode === "POOL" && isTeacher && questions.length < requestedCount;

  const handleEditTest = () => {
    setShowEditTestModal(true);
  };

  const handleBackToClass = () => {
    debugLogger("Navigating back to class:", test);
    const classId = test?.classId;
    if (classId) {
      router.push(`/class/${classId}`);
    } else {
      router.push("/teacher");
    }
  };

  const handleUpdateTest = async (updatedTest: Partial<Test>) => {
    await testDetailHook.handleUpdateTest(updatedTest);
    setShowEditTestModal(false);
    return true;
  };

  const handleConfigure = () => {
    setShowConfigureModal(true);
  };

  const handleUpdateConfig = async (config: TestConfig) => {
    const success = await testDetailHook.handleUpdateConfig(config);
    if (success) {
      setShowConfigureModal(false);
    }
    return success;
  };

  const handleDeleteTest = async () => {
    const result = await testDetailHook.handleDeleteTest();

    if (result !== false) {
      setRedirecting(true);
      router.replace("/teacher");
    }
  };

  const handleAddQuestion = () => {
    setShowAddQuestionModal(true);
  };

  const handleCreateQuestion = async (questionData: Question) => {
    const success = await questionsHook.handleAddQuestion(questionData);
    if (success) {
      setShowAddQuestionModal(false);
    }
    return success;
  };

  const handleEditQuestion = (question: Question) => {
    setEditingQuestion(question);
    setShowEditQuestionModal(true);
  };

  const handleUpdateQuestion = async (question: Question) => {
    const { id } = question;

    const updates: QuestionUpdatePayload = {
      text: question.text,
      type: question.type,
      maxMarks: question.maxMarks,
    };

    if (question.type === "MULTIPLE_CHOICE" && question.options) {
      updates.options = question.options;
    }

    if (
      (question.type === "MULTIPLE_CHOICE" || question.type === "TRUE_FALSE") &&
      typeof question.correctAnswer === "number"
    ) {
      updates.correctAnswer = question.correctAnswer;
    }

    if (question.image) {
      updates.image = question.image;
    }

    if (typeof question.questionPoolId !== "undefined") {
      updates.questionPoolId = question.questionPoolId ?? null;
    }

    const success = await questionsHook.updateQuestion(id, updates);
    if (success) {
      setShowEditQuestionModal(false);
      setEditingQuestion(null);
    }
    return success;
  };

  const handleDeleteQuestion = async (questionId: number) => {
    await questionsHook.handleDeleteQuestion(questionId);
  };

  const handleUnassignQuestion = async (questionId: number, poolId: number) => {
    const success = await removeQuestionsFromPool(poolId, [questionId]);
    if (success) {
      await questionsHook.refreshQuestions();
    }
  };

  const handleAddQuestionsToPool = async (poolId: number, questionIds: number[]) => {
    const success = await addQuestionsToPool(poolId, questionIds);
    if (success) {
      await questionsHook.refreshQuestions();
      setShowAddQuestionsToPoolModal(false);
      setTargetPoolForAddQuestions(null);
    }
  };

  const handleViewSubmissions = () => {
    submissionsHook.setShowSubmissionsModal(true);
  };

  const handleViewIndividualSubmission = (submissionId: number) => {
    const submission = submissions.find((s) => s.id === submissionId);
    if (submission) {
      submissionsHook.setSelectedSubmission(submission);
    }
    submissionsHook.setShowSubmissionsModal(true);
  };

  const handleDeleteSubmission = async (submissionId: number) => {
    const confirmed = await confirmation.confirm({
      title: "Delete submission?",
      message:
        "This will permanently remove the student's submission. This action cannot be undone.",
      confirmText: "Delete",
      cancelText: "Cancel",
      type: "danger",
    });

    if (!confirmed) return;

    await submissionsHook.deleteSubmission(submissionId);
  };

  const handleGenerateFromPrompt = (prompt: string, poolId?: number) => {
    aiQuestionsHook.generateAIQuestions(prompt, poolId);
  };

  const handleGenerateFromPdf = (file: File | null, poolId?: number) => {
    if (file) {
      aiQuestionsHook.uploadPDFForQuestions(file, poolId);
    }
  };

  const handleApproveMultipleQuestions = async (questions: Question[]) => {
    await aiQuestionsHook.approveQuestions(questions);
  };

  useEffect(() => {
    if (!loadingTest && !test) {
      setRedirecting(true);
      router.replace("/teacher");
    }
  }, [loadingTest, test, router]);

  if (loadingTest) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-yellow-50 to-orange-50 p-4">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-yellow-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading test details...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!test) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-yellow-50 to-orange-50 p-4">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-yellow-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">{redirecting ? "Redirecting..." : "Loading..."}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-yellow-50 to-orange-50">
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        {/* Header */}
        <HeaderSection
          test={test}
          onBack={handleBackToClass}
          onEdit={handleEditTest}
          onConfigure={handleConfigure}
          onDelete={handleDeleteTest}
          mode={mode}
          onModeChange={(m) => setMode(m)}
        />

        {/* Questions Section */}
        <QuestionsSection
          questions={questions}
          loadingQuestions={loadingQuestions}
          onAddQuestion={handleAddQuestion}
          onEditQuestion={handleEditQuestion}
          onDeleteQuestion={handleDeleteQuestion}
          isPoolMode={mode === "POOL"}
          poolInfo={poolWarning ? { type: "warning", message: "Pool requested more questions than available; selected list is shorter." } : undefined}
          pools={pools}
          onUnassignQuestion={handleUnassignQuestion}
          onAddPool={() => setShowCreatePoolModal(true)}
          onEditPool={(pool) => {
            setEditingPool(pool);
            setShowCreatePoolModal(true);
          }}
          onDeletePool={(id) => deletePool(id)}
          onAssignQuestionsToPool={(pool) => {
            setTargetPoolForAddQuestions(pool);
            setShowAddQuestionsToPoolModal(true);
          }}
          isTeacher={isTeacher}
        />

        {/* Pools Section (Teacher only) */}
        {isTeacher && (
          <PoolsSection
            pools={pools}
            loading={loadingPools}
            onCreate={() => {
              setShowCreatePoolModal(true);
            }}
            onEdit={(pool) => {
              setEditingPool(pool);
              setShowCreatePoolModal(true);
            }}
            onDelete={(id) => deletePool(id)}
            onAddQuestions={(pool) => {
              setTargetPoolForAddQuestions(pool);
              setShowAddQuestionsToPoolModal(true);
            }}
            questions={questions}
          />
        )}
        {/* Submissions Section */}
        <SubmissionsSection
          submissions={submissions}
          loadingSubmissions={loadingSubmissions}
          onViewSubmissions={handleViewSubmissions}
          onViewIndividualSubmission={handleViewIndividualSubmission}
          onDeleteSubmission={handleDeleteSubmission}
        />
      </div>

      {/* Modals */}
      <EditTestModal
        showEditTestModal={showEditTestModal}
        editingTest={test}
        onClose={() => setShowEditTestModal(false)}
        onUpdate={handleUpdateTest}
      />

      <AddQuestionModal
        showAddQuestionModal={showAddQuestionModal}
        onClose={() => setShowAddQuestionModal(false)}
        onAdd={handleCreateQuestion}
        aiGenerating={aiQuestionsHook.aiGenerating}
        aiPdfUploading={aiQuestionsHook.aiPdfUploading}
        aiMessages={aiQuestionsHook.aiMessages}
        showAiSection={aiQuestionsHook.showAiSection}
        setShowAiSection={aiQuestionsHook.setShowAiSection}
        handleGenerateFromPrompt={handleGenerateFromPrompt}
        handleGenerateFromPdf={handleGenerateFromPdf}
        loadingQuestions={loadingQuestions}
        testId={testId}
      />

      <EditQuestionModal
        showEditQuestionModal={showEditQuestionModal}
        editingQuestion={editingQuestion}
        onClose={() => {
          setShowEditQuestionModal(false);
          setEditingQuestion(null);
        }}
        onUpdate={handleUpdateQuestion}
        loadingQuestions={loadingQuestions}
        testId={testId}
      />

      <PoolModal
        isOpen={showCreatePoolModal}
        editingPool={editingPool}
        onClose={() => {
          setShowCreatePoolModal(false);
          setEditingPool(null);
        }}
        onCreate={async (payload) => {
          const ok = await createPool(payload);
          return ok;
        }}
        onUpdate={async (id, payload) => {
          const ok = await updatePool(id, payload);
          return ok;
        }}
      />

      <AddQuestionsToPoolModal
        isOpen={showAddQuestionsToPoolModal}
        onClose={() => {
          setShowAddQuestionsToPoolModal(false);
          setTargetPoolForAddQuestions(null);
        }}
        pool={targetPoolForAddQuestions || { id: 0, testId: 0, title: "", config: {}, createdAt: "", updatedAt: "" }}
        allQuestions={questions}
        pools={pools}
        onAddQuestions={handleAddQuestionsToPool}
        loading={loadingQuestions}
      />

      <ConfigureTestModal
        isOpen={showConfigureModal}
        config={test?.config || null}
        onClose={() => setShowConfigureModal(false)}
        onUpdate={handleUpdateConfig}
      />

      <AIApprovalModal
        showAIApprovalModal={aiQuestionsHook.showApprovalModal}
        pendingAIQuestions={aiQuestionsHook.pendingApprovalQuestions}
        onClose={() => aiQuestionsHook.setShowApprovalModal(false)}
        onApproveAIQuestion={async (question) => {
          await handleApproveMultipleQuestions([question]);
        }}
        onApproveMultipleQuestions={handleApproveMultipleQuestions}
        onRejectAIQuestion={(index) => {
          const newQuestions = [...aiQuestionsHook.pendingApprovalQuestions];
          newQuestions.splice(index, 1);
          aiQuestionsHook.setPendingApprovalQuestions(newQuestions);
        }}
        loadingQuestions={loadingQuestions}
      />

      <SubmissionsModal
        showSubmissionsModal={submissionsHook.showSubmissionsModal}
        submissions={submissions}
        onClose={() => {
          submissionsHook.setShowSubmissionsModal(false);
          submissionsHook.setSelectedSubmission(null);
        }}
        loadingSubmissions={loadingSubmissions}
        preSelectedSubmissionId={submissionsHook.selectedSubmission?.id}
        onUpdateSubmissionStatus={(id: number, newStatus) => {
          submissionsHook.setSubmissions((prev) =>
            prev.map((s) => (s.id === id ? { ...s, status: newStatus } : s)),
          );
          setSubmissionsState((prev) =>
            prev.map((s) => (s.id === id ? { ...s, status: newStatus } : s)),
          );
        }}
        onUpdateSubmissionScores={(id: number, updatedAnswers) => {
          submissionsHook.setSubmissions((prev) =>
            prev.map((s) => (s.id === id ? { ...s, answers: updatedAnswers } : s)),
          );
          setSubmissionsState((prev) =>
            prev.map((s) => (s.id === id ? { ...s, answers: updatedAnswers } : s)),
          );
        }}
        topExtraContent={
          <button
            className="w-full text-sm px-3 py-2 bg-purple-500 hover:bg-purple-600 text-white font-medium rounded-lg transition-all"
            onClick={() => {
              const subId = submissionsHook.selectedSubmission?.id;
              if (subId) {
                setLogsSubmissionId(subId);
                setShowLogsModal(true);
              }
            }}
          >
            📸 View Logs
          </button>
        }
      />

      <ProctoringLogsModal
        open={showLogsModal}
        submissionId={logsSubmissionId}
        onClose={() => setShowLogsModal(false)}
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
