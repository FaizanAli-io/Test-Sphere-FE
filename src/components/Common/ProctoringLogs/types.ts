/**
 * Proctoring Logs Types
 *
 * Type definitions for all proctoring log types and their metadata
 */

// ===== Base Types =====

export type LogType = "SCREENSHOT" | "WEBCAM_PHOTO" | "FOCUS_CHANGE" | "MOUSECLICK" | "KEYSTROKE";

export type FilterType = "ALL" | LogType;

// ===== Metadata Types =====

export interface ImageMeta {
  image: string;
  fileId: string;
  takenAt: string;
}

export interface FocusChangeMeta {
  duration: number; // milliseconds
  loggedAt: string;
}

export interface MouseClickMeta {
  type: "LEFT" | "RIGHT";
  position: [number, number]; // [x, y]
  loggedAt: string;
}

export interface KeystrokeMeta {
  key: string;
  loggedAt: string;
}

// ===== Log Entry Types =====

export interface ImageLog {
  id: number;
  submissionId: number;
  meta: ImageMeta[];
  logType: "SCREENSHOT" | "WEBCAM_PHOTO";
  metaLength: number;
}

export interface FocusChangeLog {
  id: number;
  submissionId: number;
  meta: FocusChangeMeta[];
  logType: "FOCUS_CHANGE";
  metaLength: number;
}

export interface MouseClickLog {
  id: number;
  submissionId: number;
  meta: MouseClickMeta[];
  logType: "MOUSECLICK";
  metaLength: number;
}

export interface KeystrokeLog {
  id: number;
  submissionId: number;
  meta: KeystrokeMeta[];
  logType: "KEYSTROKE";
  metaLength: number;
}

export type ProctoringLog = ImageLog | FocusChangeLog | MouseClickLog | KeystrokeLog;

// ===== Component Props =====

export interface ProctoringLogsModalProps {
  open: boolean;
  submissionId: number | null;
  onClose: () => void;
}

export interface LogViewProps {
  logs: ProctoringLog[];
  isLoading?: boolean;
}

// ===== Utility Types =====

export interface LogCounts {
  screenshot: number;
  webcam: number;
  focusChange: number;
  mouseClick: number;
  keystroke: number;
  total: number;
}
