export function extractErrorMessage(
  err: unknown,
  fallback = "An unexpected error occurred",
): string {
  if (err instanceof Error) return err.message || fallback;
  if (typeof err === "string") return err;
  if (err && typeof err === "object") {
    // Narrow potential 'message' property
    const maybeMessage = (err as { message?: unknown }).message;
    if (typeof maybeMessage === "string" && maybeMessage.trim()) return maybeMessage;
  }
  return fallback;
}

export type ApiErrorShape = {
  message?: string;
  error?: string;
  [key: string]: unknown;
};
