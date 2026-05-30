/**
 * Velonix API Client
 * Typed HTTP client for the NestJS API.
 * Uses native fetch — no extra runtime dependency.
 */

import { getAccessToken } from "@/stores/authStore";

const API_BASE =
  typeof window === "undefined"
    ? (process.env["API_URL"] ?? "http://localhost:3001/api/v1")
    : (process.env["NEXT_PUBLIC_API_URL"] ?? "http://localhost:3001") + "/api/v1";

class ApiError extends Error {
  constructor(
    public statusCode: number,
    public code: string,
    message: string
  ) {
    super(message);
    this.name = "ApiError";
  }
}

type RequestOptions = Omit<RequestInit, "body"> & {
  params?: Record<string, string | number | boolean | string[] | undefined | null>;
  body?: unknown;
};

async function request<T>(
  method: string,
  path: string,
  options: RequestOptions = {}
): Promise<T> {
  const { params, body, headers, ...rest } = options;

  // Build URL with query params
  const url = new URL(`${API_BASE}${path}`);
  if (params) {
    for (const [key, value] of Object.entries(params)) {
      if (value === undefined || value === null) continue;
      if (Array.isArray(value)) {
        value.forEach((v) => url.searchParams.append(key, String(v)));
      } else {
        url.searchParams.set(key, String(value));
      }
    }
  }

  const token = typeof window !== "undefined" ? getAccessToken() : null; // getAccessToken reads localStorage — server returns null
  const authHeader = token ? { Authorization: `Bearer ${token}` } : {};

  const res = await fetch(url.toString(), {
    method,
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      ...authHeader,
      ...headers,
    },
    ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
    ...rest,
  });

  if (!res.ok) {
    let code = "UNKNOWN";
    let message = `HTTP ${res.status}`;
    try {
      const body = await res.json() as Record<string, unknown>;
      // Our format: { error: { code, message } }
      if (body["error"] && typeof body["error"] === "object") {
        const e = body["error"] as Record<string, unknown>;
        code = (e["code"] as string) ?? code;
        message = (e["message"] as string) ?? message;
      }
      // NestJS default: { message: "..." }
      else if (body["message"]) {
        message = Array.isArray(body["message"])
          ? (body["message"] as string[]).join("; ")
          : (body["message"] as string);
        code = (body["error"] as string) ?? code;
      }
    } catch {
      // ignore JSON parse failure — keep default message
    }
    throw new ApiError(res.status, code, message);
  }

  if (res.status === 204) return undefined as unknown as T;

  const json = await res.json() as unknown;
  // Unwrap the { success: true, data: T } envelope added by ResponseWrapInterceptor
  if (
    json !== null &&
    typeof json === "object" &&
    "success" in (json as object) &&
    (json as Record<string, unknown>)["success"] === true &&
    "data" in (json as object)
  ) {
    return (json as Record<string, unknown>)["data"] as T;
  }
  return json as T;
}

export const apiClient = {
  get: <T>(path: string, options?: RequestOptions) =>
    request<T>("GET", path, options),

  post: <T>(path: string, body?: unknown, options?: RequestOptions) =>
    request<T>("POST", path, { ...options, body }),

  patch: <T>(path: string, body?: unknown, options?: RequestOptions) =>
    request<T>("PATCH", path, { ...options, body }),

  put: <T>(path: string, body?: unknown, options?: RequestOptions) =>
    request<T>("PUT", path, { ...options, body }),

  delete: <T = void>(path: string, options?: RequestOptions) =>
    request<T>("DELETE", path, options),
};

export { ApiError };
