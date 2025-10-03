export const api = async (
  path: string,
  options?: RequestInit & { auth?: boolean; date?: boolean }
) => {
  const baseUrl = "https://s61qbtst-3000.inc1.devtunnels.ms";
  const token =
    typeof window !== "undefined" ? localStorage.getItem("token") : null;

  // Default headers
  let headers: Record<string, string> = {
    "Content-Type": "application/json",
  };

  // Merge custom headers
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

  // Add authorization header if needed
  if (options?.auth && token) {
    headers["Authorization"] = `Bearer ${token}`;
    console.log("Authentication:", token);
  }

  // Handle body (if any)
  let body: any;
  if (options?.body) {
    try {
      body =
        typeof options.body === "string"
          ? JSON.parse(options.body)
          : options.body;
    } catch {
      body = options.body;
    }
  } else {
    body = {};
  }

  // Optional timestamp field
  if (options?.date) {
    body.requestDate = new Date().toISOString();
  }

  const requestBody =
    body && Object.keys(body).length > 0 ? JSON.stringify(body) : undefined;

  const payload: RequestInit = {
    ...options,
    headers,
    body: requestBody,
  };

  // Execute request
  const url = `${baseUrl}${path}`;
  console.log("🌐 API Request:", { url, payload });

  const res = await fetch(url, payload);

  // Safe log for debugging (without consuming response)
  console.log("📩 API Response Status:", res.status, res.statusText);

  return res;
};

export default api;
