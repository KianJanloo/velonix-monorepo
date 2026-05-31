/**
 * Velonix API Client
 * Typed HTTP client for the NestJS API.
 * Uses native fetch — no extra runtime dependency.
 */

import { getAccessToken, getRefreshToken, useAuthStore } from "@/stores/authStore";

const API_BASE =
  typeof window === "undefined"
    ? (process.env["API_URL"] ?? "http://localhost:3001/api/v1")
    : (process.env["NEXT_PUBLIC_API_URL"] ?? "http://localhost:3001") + "/api/v1";

// ── Token refresh (single-flight) ─────────────────────────────────────────────
let refreshPromise: Promise<string | null> | null = null;

async function refreshAccessToken(): Promise<string | null> {
  const refreshToken = getRefreshToken();
  if (!refreshToken) return null;
  // De-duplicate concurrent refreshes
  if (!refreshPromise) {
    refreshPromise = (async () => {
      try {
        const res = await fetch(`${API_BASE}/auth/refresh`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ refreshToken }),
        });
        if (!res.ok) {
          useAuthStore.getState().clearAuth();
          return null;
        }
        const json = await res.json() as { data?: { accessToken: string; refreshToken: string }; accessToken?: string; refreshToken?: string };
        const payload = json.data ?? json;
        if (payload.accessToken && payload.refreshToken) {
          useAuthStore.getState().setTokens(payload.accessToken, payload.refreshToken);
          return payload.accessToken;
        }
        return null;
      } catch {
        return null;
      } finally {
        // Allow the next refresh attempt after this settles
        setTimeout(() => { refreshPromise = null; }, 0);
      }
    })();
  }
  return refreshPromise;
}

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

  const doFetch = (token: string | null) =>
    fetch(url.toString(), {
      method,
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...headers,
      },
      ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
      ...rest,
    });

  const initialToken = typeof window !== "undefined" ? getAccessToken() : null;
  let res = await doFetch(initialToken);

  // On 401, try a one-time silent token refresh, then retry the request.
  if (res.status === 401 && typeof window !== "undefined" && getRefreshToken() && path !== "/auth/refresh") {
    const newToken = await refreshAccessToken();
    if (newToken) {
      res = await doFetch(newToken);
    }
  }

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
