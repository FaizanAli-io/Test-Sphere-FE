import { Submission, Answer, Test, QuestionType } from "./types";

/**
 * Format dates consistently across submission components
 */
export const formatDate = (dateString: string | undefined): string => {
  if (!dateString) return "Not available";
  return new Date(dateString).toLocaleString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
};

/**
 * Calculate time taken between two timestamps in minutes
 */
export const calculateTimeTaken = (startTime?: string, endTime?: string): number => {
  if (!startTime || !endTime) return 0;
  const start = new Date(startTime);
  const end = new Date(endTime);
  return Math.round((end.getTime() - start.getTime()) / (1000 * 60));
};

/**
 * Calculate total possible marks for a submission
 */
export const calculateTotalPossibleMarks = (answers: Answer[] | undefined): number => {
  if (!answers) return 0;
  return answers.reduce((total, answer) => {
    const maxMarks = answer.maxMarks || answer.question?.maxMarks || 0;
    return total + maxMarks;
  }, 0);
};

/**
 * Calculate current total obtained marks for a submission
 */
export const calculateCurrentTotalMarks = (answers: Answer[] | undefined): number => {
  if (!answers) return 0;
  return answers.reduce((total, answer) => total + (answer.obtainedMarks || 0), 0);
};

/**
 * Format answer text for display based on question type
 */
export const formatAnswerText = (
  answer: string | undefined,
  questionType?: string,
  options?: string[],
): string => {
  if (!answer) return "No answer provided";

  if (questionType === "MULTIPLE_CHOICE" || questionType === "TRUE_FALSE") {
    const answerIndex = parseInt(answer);
    if (options && options[answerIndex] !== undefined) {
      return options[answerIndex];
    }
  }

  return answer;
};

/**
 * Get correct answer text for display
 */
export const getCorrectAnswerText = (
  correctAnswer: number | undefined,
  questionType?: string,
  options?: string[],
): string => {
  if (questionType === "MULTIPLE_CHOICE" || questionType === "TRUE_FALSE") {
    if (
      options &&
      correctAnswer !== undefined &&
      correctAnswer !== null &&
      options[correctAnswer]
    ) {
      return options[correctAnswer];
    }
  }
  return "Teacher will review";
};

/**
 * Get submission status for display
 */
export const getSubmissionStatus = (submission: Submission): string => {
  if (submission.status === "GRADED" || submission.gradedAt) {
    return "Graded";
  }
  if (submission.status === "SUBMITTED") {
    return "Submitted";
  }
  return "In Progress";
};

/**
 * Get status color classes
 */
export const getSubmissionStatusColor = (status: string): string => {
  switch (status.toLowerCase()) {
    case "graded":
      return "bg-green-100 text-green-800";
    case "submitted":
      return "bg-blue-100 text-blue-800";
    case "in progress":
      return "bg-yellow-100 text-yellow-800";
    default:
      return "bg-gray-100 text-gray-800";
  }
};

/**
 * Check if answer is correct for objective questions
 */
export const isAnswerCorrect = (
  answer: Answer,
  questionType?: string,
  correctAnswer?: number,
): boolean => {
  if (!questionType || correctAnswer === undefined || correctAnswer === null) {
    const maxMarks = answer.maxMarks || answer.question?.maxMarks || 0;
    return answer.obtainedMarks === maxMarks && maxMarks > 0;
  }

  if (questionType === "MULTIPLE_CHOICE" || questionType === "TRUE_FALSE") {
    const studentAnswer = parseInt(answer.answer);
    return studentAnswer === correctAnswer;
  }

  const maxMarks = answer.maxMarks || answer.question?.maxMarks || 0;
  return answer.obtainedMarks === maxMarks && maxMarks > 0;
};

/**
 * Get answer status (correct, incorrect, pending, etc.)
 */
export const getAnswerStatus = (
  answer: Answer,
): {
  status: "correct" | "incorrect" | "pending" | "partial";
  color: string;
  icon: string;
} => {
  const maxMarks = answer.maxMarks || answer.question?.maxMarks || 0;
  const obtained = answer.obtainedMarks || 0;

  const isPending =
    answer.gradingStatus === "PENDING" ||
    (answer.obtainedMarks === null &&
      (answer.question?.type === "SHORT_ANSWER" || answer.question?.type === "LONG_ANSWER"));

  if (isPending) {
    return {
      status: "pending",
      color: "border-yellow-200 bg-yellow-50",
      icon: "⏳",
    };
  }

  if (obtained === maxMarks && maxMarks > 0) {
    return {
      status: "correct",
      color: "border-green-200 bg-green-50",
      icon: "✅",
    };
  }

  if (obtained === 0) {
    return {
      status: "incorrect",
      color: "border-red-200 bg-red-50",
      icon: "❌",
    };
  }

  return {
    status: "partial",
    color: "border-blue-200 bg-blue-50",
    icon: "📝",
  };
};

/**
 * Normalize API response to unified Submission type
 */

interface RawUserLike {
  id?: unknown;
  name?: unknown;
  email?: unknown;
}
interface RawAnswer {
  id?: unknown;
  studentId?: unknown;
  questionId?: unknown;
  submissionId?: unknown;
  answer?: unknown;
  obtainedMarks?: unknown;
  gradingStatus?: unknown;
  createdAt?: unknown;
  updatedAt?: unknown;
  question?: unknown;
  maxMarks?: unknown;
}
interface RawSubmission {
  id?: unknown;
  userId?: unknown;
  testId?: unknown;
  status?: unknown;
  startedAt?: unknown;
  submittedAt?: unknown;
  gradedAt?: unknown;
  totalMarks?: unknown;
  createdAt?: unknown;
  updatedAt?: unknown;
  user?: RawUserLike;
  student?: RawUserLike;
  test?: RawTestLike | unknown;
  answers?: RawAnswer[] | unknown;
}

interface RawTestLike {
  id?: unknown;
  classId?: unknown;
  title?: unknown;
  description?: unknown;
  duration?: unknown;
  startAt?: unknown;
  endAt?: unknown;
  status?: unknown;
  createdAt?: unknown;
  updatedAt?: unknown;
  class?: unknown;
  questions?: unknown;
}

const normalizeTest = (t: unknown): Test | undefined => {
  if (!isObject(t)) return undefined;
  const rt = t as RawTestLike;
  const cls = isObject(rt.class) ? (rt.class as Record<string, unknown>) : undefined;
  const classIdFromClass =
    cls && (typeof cls.id === "string" || typeof cls.id === "number") ? Number(cls.id) : undefined;

  return {
    id: Number(rt.id),
    classId: Number(rt.classId ?? classIdFromClass ?? 0),
    title: String(rt.title || ""),
    description: typeof rt.description === "string" ? rt.description : undefined,
    duration: Number(rt.duration || 0),
    startAt: String(rt.startAt || ""),
    endAt: String(rt.endAt || ""),
    status: String(rt.status || "") || "DRAFT",
    createdAt: String(rt.createdAt || ""),
    updatedAt: String(rt.updatedAt || ""),
    class: cls
      ? {
          id: classIdFromClass ?? 0,
          name: typeof cls.name === "string" ? cls.name : "",
        }
      : undefined,
  } as Test;
};

const isObject = (v: unknown): v is Record<string, unknown> => typeof v === "object" && v !== null;

export const normalizeSubmission = (raw: unknown): Submission => {
  const r: RawSubmission = isObject(raw) ? (raw as RawSubmission) : {};
  return {
    id: Number(r.id),
    userId: Number(r.userId),
    testId: Number(r.testId),
    status:
      r.status === "IN_PROGRESS" || r.status === "SUBMITTED" || r.status === "GRADED"
        ? r.status
        : "SUBMITTED",
    startedAt: typeof r.startedAt === "string" ? r.startedAt : undefined,
    submittedAt: typeof r.submittedAt === "string" ? r.submittedAt : "",
    gradedAt: typeof r.gradedAt === "string" ? r.gradedAt : r.gradedAt === null ? null : undefined,
    totalMarks:
      typeof r.totalMarks === "number" || r.totalMarks === null ? r.totalMarks : undefined,
    createdAt: typeof r.createdAt === "string" ? r.createdAt : "",
    updatedAt: typeof r.updatedAt === "string" ? r.updatedAt : "",

    student:
      r.user || r.student
        ? {
            id: Number((r.user || r.student)?.id),
            name: String((r.user || r.student)?.name || ""),
            email: String((r.user || r.student)?.email || ""),
          }
        : undefined,
    test: normalizeTest(r.test),
    answers: Array.isArray(r.answers)
      ? (r.answers as RawAnswer[]).map((a) => {
          const question = isObject(a.question)
            ? {
                id: Number((a.question as Record<string, unknown>).id),
                testId: Number((a.question as Record<string, unknown>).testId || 0),
                text: String((a.question as Record<string, unknown>).text || ""),
                type: String(
                  (a.question as Record<string, unknown>).type || "MULTIPLE_CHOICE",
                ) as QuestionType,
                options: Array.isArray((a.question as Record<string, unknown>).options)
                  ? ((a.question as Record<string, unknown>).options as unknown[]).map((o) =>
                      String(o),
                    )
                  : [],
                correctAnswer:
                  typeof (a.question as Record<string, unknown>).correctAnswer === "number"
                    ? ((a.question as Record<string, unknown>).correctAnswer as number)
                    : undefined,
                maxMarks: Number((a.question as Record<string, unknown>).maxMarks || 0),
                image:
                  typeof (a.question as Record<string, unknown>).image === "string"
                    ? ((a.question as Record<string, unknown>).image as string)
                    : undefined,
              }
            : undefined;
          return {
            id: Number(a.id),
            studentId: Number(a.studentId),
            questionId: Number(a.questionId),
            submissionId: Number(a.submissionId),
            answer: typeof a.answer === "string" ? a.answer : "",
            obtainedMarks:
              typeof a.obtainedMarks === "number" || a.obtainedMarks === null
                ? a.obtainedMarks
                : null,
            gradingStatus:
              a.gradingStatus === "AUTOMATIC" ||
              a.gradingStatus === "PENDING" ||
              a.gradingStatus === "GRADED"
                ? a.gradingStatus
                : "PENDING",
            createdAt: typeof a.createdAt === "string" ? a.createdAt : "",
            updatedAt: typeof a.updatedAt === "string" ? a.updatedAt : "",
            question,
            maxMarks: Number((question && question.maxMarks) || a.maxMarks || 0),
          } as Answer;
        })
      : [],
  };
};
