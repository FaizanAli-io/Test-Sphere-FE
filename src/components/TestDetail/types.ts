// Import shared types from Submissions
import { QuestionType } from "../Submissions/types";

// TestDetail specific types
export type TestStatus = "DRAFT" | "ACTIVE" | "COMPLETED" | "ARCHIVED";

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
  numQuestions?: number;
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
