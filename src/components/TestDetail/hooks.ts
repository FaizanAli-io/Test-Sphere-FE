// Re-export all hooks from the hooks directory for backward compatibility
export * from "./hooks";

// Explicit exports for better compatibility with bundlers
export { useTestDetail } from "./hooks/useTestDetail";
export { useQuestions } from "./hooks/useQuestions";
export { useAIQuestions } from "./hooks/useAIQuestions";
