// Main component
export { default } from "./StudentPortal";

// Types
export type {
  Test,
  ClassData,
  ModalState,
  LoadingState,
  NotificationState
} from "./types";

// Hooks
export {
  useClassDetails,
  useTestsForClass,
  useNotifications,
  useStudentClasses
} from "./hooks";

// Components (keeping only what's still needed)
export { JoinClassModal, ClassDetailsModal, TestsModal } from "./Modals";
