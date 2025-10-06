// export const BASE_API_URL = "http://localhost:5000";
export const BASE_API_URL = "https://test-sphere-be.onrender.com";

export interface ExtendedRequestInit extends RequestInit {
  auth?: boolean;
  date?: boolean;
  stream?: boolean;
}

export const api = async (path: string, options?: ExtendedRequestInit) => {
  const baseUrl = BASE_API_URL;
  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;

  let headers: Record<string, string> = {
    "Content-Type": "application/json"
  };

  if (options?.headers) {
    if (options.headers instanceof Headers) {
      headers = {
        ...headers,
        ...Object.fromEntries(Array.from(options.headers.entries()))
      };
    } else if (typeof options.headers === "object" && !Array.isArray(options.headers)) {
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

  if (options?.date && typeof body === "object" && body !== null && !Array.isArray(body)) {
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

  const url = `${baseUrl}${path}`;
  console.log("🌐 API Request:", { url, payload });

  const res = await fetch(url, payload);

  if (options?.stream) {
    return res;
  }

  console.log("📩 API Response Status:", res.status, res.statusText);

  try {
    if (!res.ok) {
      const cloned = res.clone();
      const text = await cloned.text();
      if (text) {
        console.error("🔎 API Error Body:", text);
      }
    }
  } catch {}

  return res;
};

export default api;
