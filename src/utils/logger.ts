export function debugLogger(...args: Parameters<typeof console.log>) {
  if (process.env.NEXT_PUBLIC_LOGGING === "true") console.log(...args);
}
