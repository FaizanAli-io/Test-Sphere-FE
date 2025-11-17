/**
 * Test Security Configuration
 *
 * Centralized constants for controlling test monitoring and security policies.
 */

export const TEST_SECURITY_CONFIG = {
  /**
   * Maximum number of fullscreen violations allowed before auto-submitting the test.
   */
  MAX_FULLSCREEN_VIOLATIONS: 5,

  /**
   * Number of seconds a user has to re-enter fullscreen mode after exiting
   * before the test is automatically submitted.
   */
  FULLSCREEN_REENTRY_SECONDS: 10,

  /**
   * Whether to allow users with multiple displays to start the test.
   * When false, users must disconnect all external monitors before starting.
   */
  ALLOW_MULTIPLE_DISPLAYS: true,

  /**
   * Interval in seconds for capturing webcam photos during test monitoring.
   */
  WEBCAM_CAPTURE_INTERVAL_SECONDS: 10,

  /**
   * Interval in seconds for capturing screenshots when not in fullscreen mode.
   */
  SCREENSHOT_CAPTURE_INTERVAL_SECONDS: 5,

  /**
   * Interval in seconds for uploading system events (clicks, keystrokes, focus changes).
   */
  SYSTEM_EVENTS_UPLOAD_INTERVAL_SECONDS: 15,
} as const;
