export interface Question {
  id: number;
  testId: number;
  text: string;
  type: "TRUE_FALSE" | "MULTIPLE_CHOICE" | "SHORT_ANSWER" | "LONG_ANSWER";
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
  status: "DRAFT" | "ACTIVE" | "COMPLETED" | "ARCHIVED";
  classId?: number;
}

export interface AIQuestionRaw {
  text?: string;
  question?: string;
  type?: string;
  options?: string[];
  correctAnswer?: number | string;
  answer?: number | string;
  maxMarks?: number;
  marks?: number;
}

// Backend enums
export type SubmissionStatus = "IN_PROGRESS" | "SUBMITTED" | "GRADED";
export type GradingStatus = "AUTOMATIC" | "PENDING" | "GRADED";

export interface SubmissionAnswer {
  id: number; // answerId
  questionId?: number;
  questionText?: string;
  questionType?: Question["type"];
  maxMarks?: number;
  answer?: string; // raw answer string
  obtainedMarks?: number | null; // may be null if not graded
  isAutoEvaluated?: boolean;
  gradingStatus?: GradingStatus;
}

export interface SubmissionItem {
  id: number; // submission id
  student?: { id?: number; name?: string; email?: string };
  totalMarks?: number;
  obtainedMarks?: number | null;
  answers?: SubmissionAnswer[];
  status?: SubmissionStatus;
  submittedAt?: string;
  gradedAt?: string;
}

export interface QuestionCreatePayload {
  testId: number;
  text: string;
  type: Question["type"];
  maxMarks: number;
  options?: string[];
  correctAnswer?: number;
  image?: string;
}

export interface QuestionUpdatePayload {
  text: string;
  type: Question["type"];
  maxMarks: number;
  options?: string[];
  correctAnswer?: number;
  image?: string;
}
