import { SubmissionAnswer } from "./types";

/**
 * Format dates consistently across the TestDetail module
 */
export const formatDate = (dateString: string | undefined): string => {
  if (!dateString) return "Not available";
  return new Date(dateString).toLocaleString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit"
  });
};

/**
 * Calculate total possible marks from answers array
 */
export const calculateTotalPossibleMarks = (
  answers: SubmissionAnswer[] | undefined
): number => {
  if (!answers) return 0;
  return answers.reduce((total, answer) => {
    // Check both answer.maxMarks and answer.question.maxMarks
    const maxMarks = answer.maxMarks || (answer as any).question?.maxMarks || 0;
    return total + maxMarks;
  }, 0);
};

/**
 * Calculate current total obtained marks from answers array
 */
export const calculateCurrentTotalMarks = (
  answers: SubmissionAnswer[] | undefined
): number => {
  if (!answers) return 0;
  return answers.reduce(
    (total, answer) => total + (answer.obtainedMarks || 0),
    0
  );
};

/**
 * Get submission status display text
 */
export const getSubmissionStatus = (submission: {
  status?: string;
  obtainedMarks?: number | null;
}): string => {
  if (
    submission.obtainedMarks !== null &&
    submission.obtainedMarks !== undefined
  ) {
    return "Graded";
  }
  if (submission.status === "SUBMITTED") {
    return "Pending";
  }
  return submission.status || "Unknown";
};

/**
 * Get color classes for submission status
 */
export const getSubmissionStatusColor = (status: string): string => {
  switch (status) {
    case "Graded":
      return "bg-green-100 text-green-800";
    case "Pending":
      return "bg-yellow-100 text-yellow-800";
    default:
      return "bg-gray-100 text-gray-800";
  }
};

/**
 * Calculate time taken between two dates in minutes
 */
export const calculateTimeTaken = (
  startTime: string,
  endTime: string
): number => {
  const start = new Date(startTime);
  const end = new Date(endTime);
  return Math.round((end.getTime() - start.getTime()) / (1000 * 60));
};

/**
 * Validate question data before submission
 */
export const validateQuestion = (question: {
  text: string;
  type: string;
  maxMarks: number;
  options?: string[];
  correctAnswer?: number;
}): string | null => {
  if (!question.text.trim()) {
    return "Question text is required";
  }

  if (question.maxMarks <= 0) {
    return "Max marks must be greater than 0";
  }

  if (question.type === "MULTIPLE_CHOICE") {
    if (!question.options || question.options.length < 2) {
      return "Multiple choice questions need at least 2 options";
    }
    if (
      question.correctAnswer === undefined ||
      question.correctAnswer < 0 ||
      question.correctAnswer >= question.options.length
    ) {
      return "Please select a correct answer";
    }
  }

  if (question.type === "TRUE_FALSE") {
    if (
      question.correctAnswer === undefined ||
      (question.correctAnswer !== 0 && question.correctAnswer !== 1)
    ) {
      return "Please select True or False as the correct answer";
    }
  }

  return null;
};

/**
 * Format answer text based on question type
 */
export const formatAnswerText = (
  answer: string | undefined,
  questionType?: string,
  options?: string[]
): string => {
  if (!answer) return "No answer provided";

  if (questionType === "MULTIPLE_CHOICE" || questionType === "TRUE_FALSE") {
    const answerIndex = parseInt(answer);
    if (options && options[answerIndex]) {
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
  options?: string[]
): string => {
  if (questionType === "MULTIPLE_CHOICE" || questionType === "TRUE_FALSE") {
    if (options && correctAnswer !== undefined && options[correctAnswer]) {
      return options[correctAnswer];
    }
  }
  return "Teacher will review";
};
