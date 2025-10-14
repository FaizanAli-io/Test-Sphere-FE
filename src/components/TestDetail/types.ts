// Base types and enums
export type QuestionType =
  | "TRUE_FALSE"
  | "MULTIPLE_CHOICE"
  | "SHORT_ANSWER"
  | "LONG_ANSWER";
export type TestStatus = "DRAFT" | "ACTIVE" | "COMPLETED" | "ARCHIVED";
export type SubmissionStatus = "IN_PROGRESS" | "SUBMITTED" | "GRADED";
export type GradingStatus = "AUTOMATIC" | "PENDING" | "GRADED";

// Core entities
export interface Question {
  id: number;
  testId: number;
  text: string;
  type: QuestionType;
  options?: string[];
  correctAnswer?: number;
  maxMarks: number;
  image?: string;
}

export interface Test {
  id: number;
  title: string;
  description: string;
  duration: number;
  startAt: string;
  endAt: string;
  status: TestStatus;
  classId?: number;
  class?: {
    id: number;
    name: string;
  };
}

export interface Student {
  id: number;
  name: string;
  email: string;
}

// Submission related types
export interface SubmissionAnswer {
  id: number; // answerId
  questionId?: number;
  questionText?: string;
  questionType?: QuestionType;
  maxMarks?: number;
  answer?: string; // raw answer string
  obtainedMarks?: number | null; // may be null if not graded
  isAutoEvaluated?: boolean;
  gradingStatus?: GradingStatus;
  // Enhanced for detailed API response
  question?: {
    id: number;
    text: string;
    type: QuestionType;
    options?: string[];
    correctAnswer?: number;
    maxMarks: number;
  };
}

// API payload types
export interface QuestionCreatePayload {
  testId: number;
  text: string;
  type: QuestionType;
  maxMarks: number;
  options?: string[];
  correctAnswer?: number;
  image?: string;
}

export interface QuestionUpdatePayload {
  text: string;
  type: QuestionType;
  maxMarks: number;
  options?: string[];
  correctAnswer?: number;
  image?: string;
}

export interface GradeSubmissionPayload {
  answers: {
    answerId: number;
    obtainedMarks: number;
  }[];
}

// Hook utility types
export interface NotificationFunctions {
  showSuccess: (message: string) => void;
  showError: (message: string) => void;
  showWarning: (message: string) => void;
  showInfo: (message: string) => void;
}

export interface ConfirmationFunction {
  (options: {
    title: string;
    message: string;
    confirmText?: string;
    cancelText?: string;
    type?: "danger" | "warning" | "info";
  }): Promise<boolean>;
}
