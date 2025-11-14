import { debugLogger } from "@/utils/logger";

// Base URL resolution:
// 1. Prefer explicit NEXT_PUBLIC_API_BASE_URL (set in .env.local)
// 2. Fallback to localhost:3000 (current backend dev port)
// This removes reliance on a boolean dev flag and guarantees port 3000 locally.
export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:5000";

// Log base URL and auth header once per runtime without touching window
let apiBaseLogged = false;

export interface ExtendedRequestInit extends RequestInit {
  auth?: boolean;
  date?: boolean;
  stream?: boolean;
}

// Request deduplication cache
const requestCache = new Map<string, Promise<Response>>();
const CACHE_DURATION = 100; // 100ms to deduplicate rapid calls

export const api = async (path: string, options?: ExtendedRequestInit) => {
  const token =
    typeof window !== "undefined" ? localStorage.getItem("token") : null;

  // Log base URL and auth header once (on first call)
  if (!apiBaseLogged) {
    apiBaseLogged = true;
    debugLogger("API Base URL:", API_BASE_URL);
    debugLogger("Auth Header:", token ? `Bearer ${token}` : "None");
  }

  let headers: Record<string, string> = {
    "Content-Type": "application/json",
  };

  if (options?.headers) {
    if (options.headers instanceof Headers) {
      headers = {
        ...headers,
        ...Object.fromEntries(Array.from(options.headers.entries())),
      };
    } else if (
      typeof options.headers === "object" &&
      !Array.isArray(options.headers)
    ) {
      headers = {
        ...headers,
        ...(options.headers as Record<string, string>),
      };
    }
  }

  // If an authenticated request is attempted without a token, short-circuit with 401
  if (options?.auth && !token) {
    return new Response(JSON.stringify({ message: "Unauthorized" }), {
      headers: { "Content-Type": "application/json" },
      status: 401,
    });
  }

  if (options?.auth && token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  let body: Record<string, unknown> | undefined;

  if (options?.body) {
    const rawBody = options.body;

    if (typeof rawBody === "string") {
      try {
        body = JSON.parse(rawBody) as Record<string, unknown>;
      } catch {
        body = { raw: rawBody };
      }
    } else if (
      rawBody instanceof Blob ||
      rawBody instanceof FormData ||
      rawBody instanceof URLSearchParams ||
      rawBody instanceof ReadableStream ||
      rawBody instanceof ArrayBuffer ||
      ArrayBuffer.isView(rawBody)
    ) {
      body = undefined;
    } else if (typeof rawBody === "object") {
      body = rawBody as Record<string, unknown>;
    }
  } else {
    body = {};
  }

  if (
    options?.date &&
    typeof body === "object" &&
    body !== null &&
    !Array.isArray(body)
  ) {
    (body as Record<string, unknown>).requestDate = new Date().toISOString();
  }

  const requestBody =
    body && typeof body === "object" && Object.keys(body).length > 0
      ? JSON.stringify(body)
      : undefined;

  const payload: RequestInit = {
    ...options,
    headers,
    body: requestBody,
  };

  const url = `${API_BASE_URL}${path}`;

  // Create cache key for deduplication
  const cacheKey = `${options?.method || "GET"}:${url}:${JSON.stringify(payload.body || {})}`;

  // Log payload for every request
  debugLogger("API Request Payload:", { path, payload });

  const fetchPromise = fetch(url, payload);

  // Cache the request promise to deduplicate rapid calls
  if (!options?.stream) {
    requestCache.set(cacheKey, fetchPromise);

    // Clear cache after duration
    setTimeout(() => {
      requestCache.delete(cacheKey);
    }, CACHE_DURATION);
  }

  const res = await fetchPromise;
  if (options?.stream) return res;

  try {
    const cloned = res.clone();
    const contentType = cloned.headers.get("content-type");
    const responseData = contentType?.includes("application/json")
      ? await cloned.json().catch(() => "⚠️ Failed to parse JSON")
      : await cloned.text().catch(() => "⚠️ Failed to read text");

    // Log response for every request
    debugLogger("API Response:", {
      path,
      status: res.status,
      statusText: res.statusText,
      data: responseData,
    });
  } catch (logError) {
    console.warn("⚠️ Failed to log response data:", logError);
  }

  return res;
};

export default api;
