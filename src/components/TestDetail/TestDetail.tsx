import Image from "next/image";
import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";

import { useQuestions, useTestDetail, useAIQuestions } from "./hooks";
import { useSubmissions } from "../Submissions";

import { useConfirmation } from "@/hooks/useConfirmation";
import { useNotifications } from "@/contexts/NotificationContext";

import type { Submission } from "../Submissions/types";
import { Question, Test, QuestionUpdatePayload } from "./types";
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

  const totalMarks = questions.reduce((sum, q) => sum + q.maxMarks, 0);

  // Helper functions for table calculations
  const calculateObjectiveMarks = (submission: Submission) => {
    if (!submission.answers) return { obtained: 0, total: 0 };

    const objectiveAnswers = submission.answers.filter(
      (answer) =>
        answer.question?.type === "MULTIPLE_CHOICE" ||
        answer.question?.type === "TRUE_FALSE"
    );

    const obtained = objectiveAnswers.reduce(
      (sum, answer) => sum + (answer.obtainedMarks || 0),
      0
    );
    const total = objectiveAnswers.reduce(
      (sum, answer) => sum + (answer.question?.maxMarks || 0),
      0
    );

    return { obtained, total };
  };

  const calculateSubjectiveMarks = (submission: Submission) => {
    if (!submission.answers) return { obtained: 0, total: 0 };

    const subjectiveAnswers = submission.answers.filter(
      (answer) =>
        answer.question?.type === "SHORT_ANSWER" ||
        answer.question?.type === "LONG_ANSWER"
    );

    const obtained = subjectiveAnswers.reduce(
      (sum, answer) => sum + (answer.obtainedMarks || 0),
      0
    );
    const total = subjectiveAnswers.reduce(
      (sum, answer) => sum + (answer.question?.maxMarks || 0),
      0
    );

    return { obtained, total };
  };

  const calculatePercentage = (obtained: number, total: number) => {
    if (total === 0) return 0;
    return Math.round((obtained / total) * 100);
  };

  const countAnsweredQuestions = (submission: Submission) => {
    if (!submission.answers) return 0;
    return submission.answers.filter((a) => a.answer != null && a.answer !== "")
      .length;
  };

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

  const handleGenerateFromPrompt = (prompt: string) => {
    aiQuestionsHook.generateAIQuestions(prompt);
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
            <div className="flex flex-col">
              <h2 className="text-2xl font-bold text-gray-900">
                Questions ({questions.length})
              </h2>
              <h3 className="text-lg font-semibold text-gray-700 mt-1">
                Total Marks: {totalMarks}
              </h3>
            </div>

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
                Students haven{"'"}t submitted their tests yet.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full bg-white border-collapse">
                <thead>
                  <tr className="bg-gradient-to-r from-purple-50 to-indigo-50 border-b-2 border-purple-200">
                    <th className="text-left p-4 font-bold text-gray-900 border-r border-purple-100">
                      Submission ID
                    </th>
                    <th className="text-left p-4 font-bold text-gray-900 border-r border-purple-100">
                      Student ID
                    </th>
                    <th className="text-center p-4 font-bold text-gray-900 border-r border-purple-100">
                      Objective Marks
                    </th>
                    <th className="text-center p-4 font-bold text-gray-900 border-r border-purple-100">
                      Subjective Marks
                    </th>
                    <th className="text-center p-4 font-bold text-gray-900 border-r border-purple-100">
                      Total Marks
                    </th>
                    <th className="text-center p-4 font-bold text-gray-900 border-r border-purple-100">
                      Percentage
                    </th>
                    <th className="text-center p-4 font-bold text-gray-900">
                      Grading Status
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {submissions.map((submission, index) => {
                    const objectiveMarks = calculateObjectiveMarks(submission);
                    const subjectiveMarks =
                      calculateSubjectiveMarks(submission);
                    const currentTotal = calculateCurrentTotalMarks(
                      submission.answers
                    );
                    const finalTotal = submission.totalMarks ?? currentTotal;
                    const percentage = calculatePercentage(
                      finalTotal,
                      totalMarks
                    );
                    const gradingStatus = submission.status;

                    return (
                      <tr
                        key={submission.id}
                        className={`border-b border-gray-200 hover:bg-purple-50 transition-all cursor-pointer ${
                          index % 2 === 0 ? "bg-gray-50" : "bg-white"
                        }`}
                        onClick={() =>
                          handleViewIndividualSubmission(submission.id)
                        }
                      >
                        <td className="p-4 border-r border-gray-200">
                          <span className="px-3 py-1 bg-purple-100 text-purple-800 rounded-full text-sm font-medium">
                            #{submission.id}
                          </span>
                        </td>
                        <td className="p-4 border-r border-gray-200">
                          <div className="flex flex-col">
                            <span className="font-semibold text-gray-900">
                              {submission.student?.name || "Unknown Student"}
                            </span>
                            <span className="text-sm text-gray-600">
                              ID: {submission.student?.id || "N/A"}
                            </span>
                          </div>
                        </td>
                        <td className="p-4 text-center border-r border-gray-200">
                          {objectiveMarks.total > 0 ? (
                            <div className="flex flex-col items-center">
                              <span className="font-bold text-lg text-gray-900">
                                {objectiveMarks.obtained}/{objectiveMarks.total}
                              </span>
                              <span className="text-xs text-gray-600">
                                MCQ & T/F
                              </span>
                            </div>
                          ) : (
                            <span className="text-gray-400 text-sm">
                              No objective
                            </span>
                          )}
                        </td>
                        <td className="p-4 text-center border-r border-gray-200">
                          {subjectiveMarks.total > 0 ? (
                            <div className="flex flex-col items-center">
                              <span className="font-bold text-lg text-gray-900">
                                {subjectiveMarks.obtained}/
                                {subjectiveMarks.total}
                              </span>
                              <span className="text-xs text-gray-600">
                                Short & Long
                              </span>
                            </div>
                          ) : (
                            <span className="text-gray-400 text-sm">
                              No subjective
                            </span>
                          )}
                        </td>
                        <td className="p-4 text-center border-r border-gray-200">
                          <div className="flex flex-col items-center">
                            <span className="font-bold text-xl text-indigo-600">
                              {finalTotal}/{totalMarks}
                            </span>
                            <span className="text-xs text-gray-600">
                              {countAnsweredQuestions(submission)} questions
                              answered
                            </span>
                          </div>
                        </td>
                        <td className="p-4 text-center border-r border-gray-200">
                          <div className="flex flex-col items-center">
                            <div
                              className={`w-16 h-16 rounded-full flex items-center justify-center font-bold text-lg ${
                                percentage >= 80
                                  ? "bg-green-100 text-green-800"
                                  : percentage >= 60
                                    ? "bg-yellow-100 text-yellow-800"
                                    : percentage >= 40
                                      ? "bg-orange-100 text-orange-800"
                                      : "bg-red-100 text-red-800"
                              }`}
                            >
                              {percentage}%
                            </div>
                          </div>
                        </td>
                        <td className="p-4 text-center">
                          <span
                            className={`px-3 py-1 rounded-full text-sm font-medium ${
                              gradingStatus === "GRADED"
                                ? "bg-green-100 text-green-800"
                                : gradingStatus === "SUBMITTED"
                                  ? "bg-blue-100 text-blue-800"
                                  : "bg-yellow-100 text-yellow-800"
                            }`}
                          >
                            {gradingStatus}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>

              {submissions.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  No submissions found
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
