import React from "react";

export type QuestionType =
  | "TRUE_FALSE"
  | "MULTIPLE_CHOICE"
  | "SHORT_ANSWER"
  | "LONG_ANSWER";
export type SubmissionStatus = "IN_PROGRESS" | "SUBMITTED" | "GRADED";
export type GradingStatus = "AUTOMATIC" | "PENDING" | "GRADED";

export interface User {
  id: number;
  name: string;
  email: string;
}

export interface Class {
  id: number;
  name: string;
  code?: string;
  description?: string;
  teacherId?: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface Question {
  id: number;
  testId: number;
  text: string;
  type: QuestionType;
  options: string[];
  correctAnswer?: number | null;
  maxMarks: number;
  image?: string | null;
}

export interface Test {
  id: number;
  classId: number;
  title: string;
  description?: string;
  duration: number;
  startAt: string;
  endAt: string;
  status: string;
  createdAt: string;
  updatedAt: string;
  class?: Class;
  questions?: Question[];
}

export interface Answer {
  id: number;
  studentId: number;
  questionId: number;
  submissionId: number;
  answer: string;
  obtainedMarks: number | null;
  gradingStatus: GradingStatus;
  createdAt: string;
  updatedAt: string;
  question?: Question;
  maxMarks?: number;
}

export interface Submission {
  id: number;
  userId: number;
  testId: number;
  status: SubmissionStatus;
  startedAt?: string;
  submittedAt: string;
  gradedAt?: string | null;
  totalMarks?: number | null;
  createdAt: string;
  updatedAt: string;
  user?: User;
  student?: User;
  test?: Test;
  answers?: Answer[];
}

export interface GradeSubmissionPayload {
  answers: {
    answerId: number;
    obtainedMarks: number;
  }[];
}

export type ViewContext = "teacher" | "student";

export interface SubmissionDetailProps {
  isOpen: boolean;
  onClose: () => void;
  onBack?: () => void;
  submission: Submission | null;
  viewContext: ViewContext;
  onUpdateStatus?: (id: number, newStatus: SubmissionStatus) => void;
  onUpdateScores?: (id: number, updatedAnswers: Answer[]) => void;
  topExtraContent?: React.ReactNode;
}

export interface NotificationFunctions {
  showSuccess: (message: string) => void;
  showError: (message: string) => void;
  showWarning: (message: string) => void;
  showInfo: (message: string) => void;
}
