export interface ClassData {
  id: number;
  name: string;
  description?: string;
  code: string;
  teacherId: number;
  teacher?: {
    id: number;
    name: string;
    email: string;
  };
  students?: Array<{ id: number; name: string; email: string }>;
  tests?: Array<{ id: number; title: string; [key: string]: unknown }>;
  studentCount?: number;
  testCount?: number;
  createdAt?: string;
}

export interface Test {
  id: number;
  title: string;
  description?: string;
  duration?: number;
  startAt?: string;
  endAt?: string;
  status?: string;
  classId?: number;
  className?: string;
}

export interface ModalState {
  showJoinModal: boolean;
  showDetailsModal: boolean;
  showTestsModal: boolean;
  selectedClass: ClassData | null;
  testsForClass: number | null;
}

export interface LoadingState {
  loading: boolean;
  joining: boolean;
  loadingDetails: boolean;
  testsLoading: boolean;
}

export interface NotificationState {
  error: string | null;
  success: string | null;
  copiedCode: number | null;
}

export interface StudentSubmission {
  id: number;
  userId: number;
  testId: number;
  status: string;
  startedAt?: string;
  submittedAt: string;
  gradedAt?: string | null;
  createdAt: string;
  updatedAt: string;
  test?: {
    id: number;
    title: string;
    duration?: number;
    startAt?: string;
    endAt?: string;
    description?: string;
    class?: {
      id: number;
      name: string;
    };
  };
  student?: {
    id: number;
    name: string;
    email: string;
  };
  answers?: Array<{
    id: number;
    studentId: number;
    questionId: number;
    submissionId: number;
    answer: string;
    obtainedMarks: number | null;
    gradingStatus: string;
    createdAt: string;
    updatedAt: string;
    question: {
      id: number;
      testId: number;
      text: string;
      type: string;
      options?: string[];
      correctAnswer?: number;
      maxMarks: number;
      image?: string | null;
    };
  }>;
}

// Helper function to calculate total obtained marks for a submission
export const calculateSubmissionScore = (
  submission: StudentSubmission
): number => {
  if (!submission.answers) return 0;
  return submission.answers.reduce(
    (total, answer) => total + (answer.obtainedMarks || 0),
    0
  );
};

// Helper function to calculate total possible marks for a submission
export const calculateSubmissionMaxScore = (
  submission: StudentSubmission
): number => {
  if (!submission.answers) return 0;
  return submission.answers.reduce(
    (total, answer) => total + (answer.question?.maxMarks || 0),
    0
  );
};
