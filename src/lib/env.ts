export function getApiBaseUrl(): string {
  // Prefer NEXT_PUBLIC_ vars for client components
  if (typeof window !== "undefined" && process.env.NEXT_PUBLIC_API_URL) {
    return process.env.NEXT_PUBLIC_API_URL as string;
  }
  // Server-side fallback
  return process.env.API_URL || "";
}


