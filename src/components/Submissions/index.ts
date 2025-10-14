export { default as SubmissionDetail } from "./SubmissionDetail";
export { default as SubmissionsList } from "./SubmissionsList";
export { useSubmissions } from "./useSubmissions";

export type {
  Submission,
  Answer,
  Question,
  Test,
  Class,
  User,
  QuestionType,
  SubmissionStatus,
  GradingStatus,
  ViewContext,
  SubmissionDetailProps,
  GradeSubmissionPayload,
  NotificationFunctions
} from "./types";

export {
  formatDate,
  calculateTimeTaken,
  calculateTotalPossibleMarks,
  calculateCurrentTotalMarks,
  formatAnswerText,
  getCorrectAnswerText,
  getAnswerStatus,
  getSubmissionStatus,
  getSubmissionStatusColor,
  isAnswerCorrect,
  normalizeSubmission
} from "./utils";
