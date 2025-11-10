export { default } from "./GiveTest";

export { useTestExam } from "./hooks/useTestExam";
export { useTestMonitoring } from "./hooks/useTestMonitoring";
export { useFullscreenMonitoring } from "./hooks/useFullscreenMonitoring";
export { useScreenSharingMonitoring } from "./hooks/useScreenSharingMonitoring";
export type { Question, Test, Answer } from "./hooks/useTestExam";

export { TestHeader } from "./components/TestHeader";
export { QuestionRenderer } from "./components/QuestionRenderer";
export { TestInstructions } from "./components/TestInstructions";
export { SubmitConfirmModal } from "./components/SubmitConfirmModal";
export { FullscreenViolationWarning } from "./components/FullscreenViolationWarning";
export { FullscreenRequiredModal } from "./components/FullscreenRequiredModal";
export { ScreenSharingViolationWarning } from "./components/ScreenSharingViolationWarning";
