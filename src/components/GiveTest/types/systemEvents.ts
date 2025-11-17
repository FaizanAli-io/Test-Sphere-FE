/**
 * System Event Monitoring Types
 *
 * Type definitions for capturing and tracking user interactions during test taking.
 */

/**
 * Base type for all system events
 */
export type SystemEventType = "FOCUS_CHANGE" | "MOUSECLICK" | "KEYSTROKE";

/**
 * Mouse button types
 */
export type MouseButtonType = "LEFT" | "RIGHT";

/**
 * Focus change event - tracks when user switches tabs/windows
 */
export interface FocusChangeEvent {
  type: "FOCUS_CHANGE";
  duration: number; // Time in milliseconds the user was away
  loggedAt: string; // ISO timestamp
}

/**
 * Mouse click event - tracks all mouse clicks
 */
export interface MouseClickEvent {
  type: "MOUSECLICK";
  buttonType: MouseButtonType;
  position: [number, number]; // [x, y] screen coordinates
  loggedAt: string; // ISO timestamp
}

/**
 * Keystroke event - tracks keyboard interactions
 */
export interface KeystrokeEvent {
  type: "KEYSTROKE";
  key: string; // The key that was pressed
  loggedAt: string; // ISO timestamp
}

/**
 * Union type for all system events
 */
export type SystemEvent = FocusChangeEvent | MouseClickEvent | KeystrokeEvent;

/**
 * Payload structure for uploading to backend
 */
export interface SystemEventLogPayload {
  submissionId: number;
  logType: SystemEventType;
  meta: FocusChangeMetaPayload[] | MouseClickMetaPayload[] | KeystrokeMetaPayload[];
}

/**
 * Backend meta payload for FOCUS_CHANGE log
 */
export interface FocusChangeMetaPayload {
  duration: number;
  loggedAt: string;
}

/**
 * Backend meta payload for MOUSECLICK log
 */
export interface MouseClickMetaPayload {
  type: MouseButtonType;
  position: [number, number];
  loggedAt: string;
}

/**
 * Backend meta payload for KEYSTROKE log
 */
export interface KeystrokeMetaPayload {
  key: string;
  loggedAt: string;
}
