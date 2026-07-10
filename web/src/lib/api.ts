// Baked in at build time. A trailing slash would produce "//decks", so drop it.
const API_BASE_URL = (
  (import.meta.env.VITE_API_URL as string | undefined) ??
  "http://localhost:3000/api/v1"
).replace(/\/+$/, "");

const TOKEN_KEY = "token";

/**
 * The server speaks Turkish, the interface speaks English, so `message` is
 * always UI-ready copy derived from the status. `serverMessage` keeps the raw
 * text around for debugging.
 */
export class ApiError extends Error {
  readonly status: number;
  readonly serverMessage: string | null;

  constructor(status: number, message: string, serverMessage: string | null) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.serverMessage = serverMessage;
  }
}

/** An earlier build could persist the literal string "undefined". Treat it as signed out. */
export function getToken(): string | null {
  const token = localStorage.getItem(TOKEN_KEY);
  if (!token || token === "undefined" || token === "null") {
    return null;
  }
  return token;
}

export function setToken(token: string): void {
  localStorage.setItem(TOKEN_KEY, token);
}

export function clearToken(): void {
  localStorage.removeItem(TOKEN_KEY);
}

function friendlyMessage(status: number): string {
  switch (status) {
    case 0:
      return "We can't reach the server. Check your connection and try again.";
    case 400:
      return "Please check the details you entered.";
    case 401:
      return "Your email or password is incorrect.";
    case 403:
      return "You don't have access to this.";
    case 404:
      return "We couldn't find what you were looking for.";
    default:
      return status >= 500
        ? "Something went wrong on our end. Please try again."
        : "Something went wrong. Please try again.";
  }
}

/** Error bodies are JSON on handled paths and HTML when Express catches a throw. */
async function readServerMessage(response: Response): Promise<string | null> {
  if (!response.headers.get("content-type")?.includes("application/json")) {
    return null;
  }
  try {
    const body: unknown = await response.json();
    if (body && typeof body === "object" && "error" in body) {
      const { error } = body as { error?: unknown };
      return typeof error === "string" ? error : null;
    }
    return null;
  } catch {
    return null;
  }
}

type RequestOptions = {
  method?: "GET" | "POST" | "PUT" | "DELETE";
  body?: unknown;
};

async function request<T>(
  path: string,
  { method = "GET", body }: RequestOptions = {},
): Promise<T> {
  const token = getToken();
  const headers: Record<string, string> = {};

  if (body !== undefined) headers["Content-Type"] = "application/json";
  if (token) headers.Authorization = `Bearer ${token}`;

  let response: Response;
  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      method,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
    });
  } catch {
    throw new ApiError(0, friendlyMessage(0), null);
  }

  if (!response.ok) {
    const serverMessage = await readServerMessage(response);

    // An expired or forged token can't be recovered from in-app: start over.
    if (response.status === 401 && !path.startsWith("/auth")) {
      clearToken();
      if (window.location.pathname !== "/login") {
        window.location.replace("/login");
      }
    }

    throw new ApiError(response.status, friendlyMessage(response.status), serverMessage);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return (await response.json()) as T;
}

export const api = {
  get: <T>(path: string) => request<T>(path),
  post: <T>(path: string, body?: unknown) => request<T>(path, { method: "POST", body }),
  put: <T>(path: string, body?: unknown) => request<T>(path, { method: "PUT", body }),
  delete: <T>(path: string) => request<T>(path, { method: "DELETE" }),
};
