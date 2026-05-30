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
    let errorBody: { error?: { code?: string; message?: string } } = {};
    try {
      errorBody = await res.json() as typeof errorBody;
    } catch {
      // ignore parse failure
    }
    throw new ApiError(
      res.status,
      errorBody.error?.code ?? "UNKNOWN",
      errorBody.error?.message ?? `HTTP ${res.status}`
    );
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
