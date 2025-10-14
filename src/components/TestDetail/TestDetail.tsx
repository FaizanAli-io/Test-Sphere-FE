import Image from "next/image";
import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";

import { useQuestions, useTestDetail, useAIQuestions } from "./hooks";
import { useSubmissions } from "../Submissions";

import { Question, Test, QuestionUpdatePayload } from "./types";
import { useConfirmation } from "@/hooks/useConfirmation";
import { useNotifications } from "@/contexts/NotificationContext";
import { calculateCurrentTotalMarks } from "../Submissions/utils";

import EditTestModal from "./EditTestModal";
import AIApprovalModal from "./AIApprovalModal";
import AddQuestionModal from "./AddQuestionModal";
import SubmissionsModal from "./SubmissionsModal";
import EditQuestionModal from "./EditQuestionModal";
import ConfirmationModal from "@/components/ConfirmationModal";

interface TestDetailProps {
  testId?: string;
}

export default function TestDetail({ testId: propTestId }: TestDetailProps) {
  const params = useParams();
  const router = useRouter();
  const testId = propTestId || (params?.testId as string);
  const notifications = useNotifications();
  const confirmation = useConfirmation();

  const [showEditTestModal, setShowEditTestModal] = useState(false);
  const [showAddQuestionModal, setShowAddQuestionModal] = useState(false);
  const [showEditQuestionModal, setShowEditQuestionModal] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState<Question | null>(null);
  const [redirecting, setRedirecting] = useState(false);

  const testDetailHook = useTestDetail(
    testId,
    notifications,
    confirmation.confirm
  );
  const questionsHook = useQuestions(
    testId,
    notifications,
    confirmation.confirm
  );
  const submissionsHook = useSubmissions(testId, "teacher", notifications);
  const aiQuestionsHook = useAIQuestions(
    testId,
    questionsHook.refreshQuestions,
    notifications,
    () => setShowAddQuestionModal(false)
  );

  const test = testDetailHook.testData;
  const loadingTest = testDetailHook.loading;
  const questions = questionsHook.questions;
  const loadingQuestions = questionsHook.loadingQuestions;
  const submissions = submissionsHook.submissions;
  const loadingSubmissions = submissionsHook.submissionsLoading;

  const handleEditTest = () => {
    setShowEditTestModal(true);
  };

  const handleBackToClass = () => {
    if (typeof window !== "undefined" && window.history.length > 1) {
      router.back();
      return;
    }
    const classId = test?.class?.id ?? test?.classId;
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

  const handleDeleteTest = async () => {
    const result = await testDetailHook.handleDeleteTest();

    if (result !== false) {
      setRedirecting(true);
      if (typeof window !== "undefined") {
        if (window.history.length > 1) {
          router.back();
        } else {
          router.push("/teacher");
        }
      }
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
      maxMarks: question.maxMarks
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

  const handleGenerateFromPrompt = () => {
    aiQuestionsHook.generateAIQuestions(aiQuestionsHook.aiPrompt);
  };

  const handleGenerateFromPdf = (file: File | null) => {
    if (file) {
      aiQuestionsHook.uploadPDFForQuestions(file);
    }
  };

  const handleApproveMultipleQuestions = async (questions: Question[]) => {
    await aiQuestionsHook.approveQuestions(questions);
  };

  useEffect(() => {
    if (!loadingTest && !test) {
      setRedirecting(true);
      if (typeof window !== "undefined") {
        if (window.history.length > 1) {
          router.back();
        } else {
          router.push("/teacher");
        }
      }
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
            <p className="mt-4 text-gray-600">
              {redirecting ? "Redirecting..." : "Loading..."}
            </p>
          </div>
        </div>
      </div>
    );
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "DRAFT":
        return "bg-gray-100 text-gray-800";
      case "ACTIVE":
        return "bg-green-100 text-green-800";
      case "COMPLETED":
        return "bg-blue-100 text-blue-800";
      case "ARCHIVED":
        return "bg-yellow-100 text-yellow-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-yellow-50 to-orange-50">
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        {/* Header */}
        <div className="bg-white rounded-3xl shadow-xl p-8 mb-8 relative">
          <button
            onClick={handleBackToClass}
            className="absolute top-4 right-4 px-4 py-2 bg-gray-100 text-gray-900 font-semibold rounded-lg hover:bg-gray-200 transition-all shadow"
          >
            ← Back to Class
          </button>
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-3">
                <h1 className="text-3xl font-bold text-gray-900">
                  {test.title}
                </h1>
                <span
                  className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(
                    test.status
                  )}`}
                >
                  {test.status}
                </span>
              </div>
              <p className="text-gray-600 text-lg mb-4">{test.description}</p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <span className="text-2xl">⏱️</span>
                  <div>
                    <p className="font-medium text-gray-900">Duration</p>
                    <p className="text-gray-600">{test.duration} minutes</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-2xl">🚀</span>
                  <div>
                    <p className="font-medium text-gray-900">Start Time</p>
                    <p className="text-gray-600">{formatDate(test.startAt)}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-2xl">🏁</span>
                  <div>
                    <p className="font-medium text-gray-900">End Time</p>
                    <p className="text-gray-600">{formatDate(test.endAt)}</p>
                  </div>
                </div>
              </div>
            </div>
            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={handleEditTest}
                className="px-6 py-3 bg-blue-500 text-white font-bold rounded-xl hover:bg-blue-600 transition-all shadow-lg hover:shadow-xl"
              >
                Edit Test
              </button>
              <button
                onClick={handleDeleteTest}
                className="px-6 py-3 bg-red-500 text-white font-bold rounded-xl hover:bg-red-600 transition-all shadow-lg hover:shadow-xl"
              >
                Delete Test
              </button>
            </div>
          </div>
        </div>

        {/* Questions Section */}
        <div className="bg-white rounded-3xl shadow-xl p-8 mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
            <h2 className="text-2xl font-bold text-gray-900">
              Questions ({questions.length})
            </h2>
            <button
              onClick={handleAddQuestion}
              className="px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-500 text-white font-bold rounded-xl hover:from-green-600 hover:to-emerald-600 transition-all shadow-lg hover:shadow-xl"
            >
              + Add Question
            </button>
          </div>

          {loadingQuestions ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-600 mx-auto"></div>
              <p className="mt-4 text-gray-600">Loading questions...</p>
            </div>
          ) : questions.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">❓</div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                No Questions Yet
              </h3>
              <p className="text-gray-600 mb-6">
                Add some questions to get started with your test.
              </p>
              <button
                onClick={handleAddQuestion}
                className="px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-500 text-white font-bold rounded-xl hover:from-green-600 hover:to-emerald-600 transition-all shadow-lg hover:shadow-xl"
              >
                Add Your First Question
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {questions.map((question, index) => (
                <div
                  key={question.id}
                  className="border-2 border-gray-200 rounded-2xl p-6 hover:border-yellow-300 transition-all"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <span className="px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-sm font-medium">
                          Q{index + 1}
                        </span>
                        <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
                          {question.type === "MULTIPLE_CHOICE"
                            ? "Multiple Choice"
                            : question.type === "TRUE_FALSE"
                              ? "True/False"
                              : question.type === "SHORT_ANSWER"
                                ? "Short Answer"
                                : "Long Answer"}
                        </span>
                        <span className="text-sm text-gray-600">
                          {question.maxMarks}{" "}
                          {question.maxMarks === 1 ? "mark" : "marks"}
                        </span>
                      </div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-3">
                        {question.text}
                      </h3>

                      {question.image && (
                        <div
                          className="mb-4 relative w-full"
                          style={{ maxHeight: "300px" }}
                        >
                          <Image
                            src={question.image}
                            alt="Question image"
                            width={0}
                            height={0}
                            sizes="100vw"
                            className="w-full h-auto rounded-lg border border-gray-200"
                            style={{ maxHeight: "300px", width: "auto" }}
                          />
                        </div>
                      )}

                      {question.type === "MULTIPLE_CHOICE" &&
                        question.options && (
                          <div className="space-y-2">
                            {question.options.map((option, optIndex) => (
                              <div
                                key={optIndex}
                                className={`p-3 rounded-lg border ${
                                  question.correctAnswer === optIndex
                                    ? "bg-green-50 border-green-200 text-green-800"
                                    : "bg-gray-50 border-gray-200 text-gray-900"
                                }`}
                              >
                                <span className="font-medium">
                                  {String.fromCharCode(65 + optIndex)}.
                                </span>{" "}
                                {option}
                                {question.correctAnswer === optIndex && (
                                  <span className="text-green-600 font-bold ml-2">
                                    ✓
                                  </span>
                                )}
                              </div>
                            ))}
                          </div>
                        )}

                      {question.type === "TRUE_FALSE" && (
                        <div className="flex gap-4">
                          <div
                            className={`p-3 rounded-lg border ${
                              question.correctAnswer === 1
                                ? "bg-green-50 border-green-200 text-green-800"
                                : "bg-gray-50 border-gray-200 text-gray-900"
                            }`}
                          >
                            True{" "}
                            {question.correctAnswer === 1 && (
                              <span className="text-green-600 font-bold">
                                ✓
                              </span>
                            )}
                          </div>
                          <div
                            className={`p-3 rounded-lg border ${
                              question.correctAnswer === 0
                                ? "bg-green-50 border-green-200 text-green-800"
                                : "bg-gray-50 border-gray-200 text-gray-900"
                            }`}
                          >
                            False{" "}
                            {question.correctAnswer === 0 && (
                              <span className="text-green-600 font-bold">
                                ✓
                              </span>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                    <div className="flex gap-2 ml-4">
                      <button
                        onClick={() => handleEditQuestion(question)}
                        className="px-4 py-2 bg-blue-100 text-blue-700 font-medium rounded-lg hover:bg-blue-200 transition-all"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDeleteQuestion(question.id)}
                        className="px-4 py-2 bg-red-100 text-red-700 font-medium rounded-lg hover:bg-red-200 transition-all"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Submissions Section */}
        <div className="bg-white rounded-3xl shadow-xl p-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
            <h2 className="text-2xl font-bold text-gray-900">
              Submissions ({submissions.length})
            </h2>
            <button
              onClick={handleViewSubmissions}
              className="px-6 py-3 bg-gradient-to-r from-purple-500 to-indigo-500 text-white font-bold rounded-xl hover:from-purple-600 hover:to-indigo-600 transition-all shadow-lg hover:shadow-xl"
            >
              View All Submissions
            </button>
          </div>

          {loadingSubmissions ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-600 mx-auto"></div>
              <p className="mt-4 text-gray-600">Loading submissions...</p>
            </div>
          ) : submissions.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">📝</div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                No Submissions Yet
              </h3>
              <p className="text-gray-600">
                Students haven&apos;t submitted their tests yet.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {submissions.slice(0, 6).map((submission) => (
                <div
                  key={submission.id}
                  className="border-2 border-gray-200 rounded-xl p-4 hover:border-purple-300 hover:shadow-lg transition-all cursor-pointer"
                  onClick={() => handleViewIndividualSubmission(submission.id)}
                >
                  <h4 className="font-semibold text-gray-900 mb-2">
                    {submission.student?.name || "Unknown Student"}
                    {submission.student?.id && (
                      <span className="text-sm font-normal text-gray-600 ml-2">
                        (ID: {submission.student.id})
                      </span>
                    )}
                  </h4>
                  <p className="text-sm text-gray-600 mb-2">
                    {submission.answers?.length || 0} questions answered
                  </p>
                  {submission.totalMarks !== null &&
                  submission.totalMarks !== undefined ? (
                    <div className="text-sm">
                      <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full font-medium">
                        Graded: {submission.totalMarks} marks
                      </span>
                    </div>
                  ) : submission.answers &&
                    calculateCurrentTotalMarks(submission.answers) > 0 ? (
                    <div className="text-sm">
                      <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full font-medium">
                        Partial:{" "}
                        {calculateCurrentTotalMarks(submission.answers)} marks
                      </span>
                    </div>
                  ) : (
                    <div className="text-sm">
                      <span className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded-full font-medium">
                        Pending Review
                      </span>
                    </div>
                  )}
                </div>
              ))}
              {submissions.length > 6 && (
                <div className="border-2 border-dashed border-gray-300 rounded-xl p-4 flex items-center justify-center">
                  <button
                    onClick={handleViewSubmissions}
                    className="text-gray-600 hover:text-purple-600 font-medium transition-all"
                  >
                    +{submissions.length - 6} more submissions
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
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
        aiPrompt={aiQuestionsHook.aiPrompt}
        setAiPrompt={aiQuestionsHook.setAiPrompt}
        aiGenerating={aiQuestionsHook.aiGenerating}
        aiPdfUploading={aiQuestionsHook.aiPdfUploading}
        aiMessages={aiQuestionsHook.aiMessages}
        showAiSection={aiQuestionsHook.showAiSection}
        setShowAiSection={aiQuestionsHook.setShowAiSection}
        handleGenerateFromPrompt={handleGenerateFromPrompt}
        handleGenerateFromPdf={handleGenerateFromPdf}
        loadingQuestions={loadingQuestions}
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
        fetchSubmissionDetails={submissionsHook.fetchSubmissionDetails}
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
