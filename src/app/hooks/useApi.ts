export const api = async (
  path: string,
  options?: RequestInit & { auth?: boolean; date?: boolean }
) => {
  const baseUrl = "https://test-sphere-be.onrender.com";
  const token =
    typeof window !== "undefined" ? localStorage.getItem("token") : null;

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

  if (options?.auth && token) {
    headers["Authorization"] = `Bearer ${token}`;
    console.log("Auth Header Added", token);
  }

  let body: any = options?.body ? JSON.parse(options.body as string) : {};

  if (options?.date) {
    body.requestDate = new Date().toISOString();
  }

  const res = await fetch(`${baseUrl}${path}`, {
    ...options,
    headers,
    body: Object.keys(body).length ? JSON.stringify(body) : undefined,
  });
  console.log("API Request:", { path, options, body, res });
  console.log("Res Body:", body.text ? body.text : body);
  return res;
};

export default api;
