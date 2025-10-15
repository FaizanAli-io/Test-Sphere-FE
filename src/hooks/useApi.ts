export const API_BASE_URL = !process.env.NEXT_PUBLIC_DEV_MODE
  ? "https://test-sphere-be.onrender.com"
  : "http://localhost:3000";

console.log("API Base URL:", API_BASE_URL);

export interface ExtendedRequestInit extends RequestInit {
  auth?: boolean;
  date?: boolean;
  stream?: boolean;
}

export const api = async (path: string, options?: ExtendedRequestInit) => {
  const token =
    typeof window !== "undefined" ? localStorage.getItem("token") : null;

  let headers: Record<string, string> = {
    "Content-Type": "application/json"
  };

  if (options?.headers) {
    if (options.headers instanceof Headers) {
      headers = {
        ...headers,
        ...Object.fromEntries(Array.from(options.headers.entries()))
      };
    } else if (
      typeof options.headers === "object" &&
      !Array.isArray(options.headers)
    ) {
      headers = {
        ...headers,
        ...(options.headers as Record<string, string>)
      };
    }
  }

  if (options?.auth && token) {
    headers["Authorization"] = `Bearer ${token}`;
    console.log("Authentication:", token);
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
    body: requestBody
  };

  const url = `${API_BASE_URL}${path}`;
  console.log("🌐 API Request:", { url, payload });

  const res = await fetch(url, payload);
  if (options?.stream) return res;

  try {
    const cloned = res.clone();
    const contentType = cloned.headers.get("content-type");
    const responseData = contentType?.includes("application/json")
      ? await cloned.json().catch(() => "⚠️ Failed to parse JSON")
      : await cloned.text().catch(() => "⚠️ Failed to read text");

    console.log("📦 API Response:", {
      url,
      status: res.status,
      statusText: res.statusText,
      data: responseData
    });

    if (!res.ok) {
      console.error("❌ API Request Failed:", {
        status: res.status,
        statusText: res.statusText,
        response: responseData
      });
    }
  } catch (logError) {
    console.warn("⚠️ Failed to log response data:", logError);
  }

  return res;
};

export default api;
