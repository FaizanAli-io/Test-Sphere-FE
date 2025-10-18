export function debugLogger(...args: Parameters<typeof console.log>) {
  if (process.env.NEXT_PUBLIC_DEV_MODE === "true") console.log(...args);
}
