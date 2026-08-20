"use client";

import { getAccessToken, setAccessToken } from "./auth";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5000";

export interface ApiErrorBody {
  success: false;
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
}

export class ApiClientError extends Error {
  readonly status: number;
  readonly code: string;
  readonly details?: unknown;

  constructor(
    status: number,
    code: string,
    message: string,
    details?: unknown,
  ) {
    super(message);
    this.name = "ApiClientError";
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

/** Single-flight refresh promise so concurrent 401s share one refresh call. */
let refreshPromise: Promise<boolean> | null = null;

async function performRefresh(): Promise<boolean> {
  try {
    const res = await fetch(`${API_URL}/api/v1/auth/refresh`, {
      method: "POST",
      credentials: "include",
    });
    if (!res.ok) {
      setAccessToken(null);
      return false;
    }
    const body = (await res.json()) as {
      success: boolean;
      data?: { accessToken?: string };
    };
    const accessToken = body.data?.accessToken;
    if (!accessToken) {
      setAccessToken(null);
      return false;
    }
    setAccessToken(accessToken);
    return true;
  } catch {
    setAccessToken(null);
    return false;
  }
}

function refreshAccessToken(): Promise<boolean> {
  // Deduplicate concurrent refresh calls.
  refreshPromise ??= performRefresh().finally(() => {
    refreshPromise = null;
  });
  return refreshPromise;
}

interface ApiFetchOptions extends RequestInit {
  /** Set to false to skip the automatic refresh-on-401 retry. */
  skipAutoRefresh?: boolean;
}

export async function apiFetch<T = unknown>(
  path: string,
  options: ApiFetchOptions = {},
): Promise<T> {
  const { skipAutoRefresh = false, headers, ...rest } = options;
  const token = getAccessToken();

  const finalHeaders: Record<string, string> = {
    ...(headers as Record<string, string> | undefined),
  };
  if (token) {
    finalHeaders.Authorization = `Bearer ${token}`;
  }
  if (rest.body && !finalHeaders["Content-Type"]) {
    finalHeaders["Content-Type"] = "application/json";
  }

  const response = await fetch(`${API_URL}${path}`, {
    ...rest,
    headers: finalHeaders,
    credentials: "include",
  });

  // Access token expired -> try a single refresh then retry once.
  if (response.status === 401 && !skipAutoRefresh) {
    const refreshed = await refreshAccessToken();
    if (refreshed) {
      return apiFetch<T>(path, { ...options, skipAutoRefresh: true });
    }
  }

  const contentType = response.headers.get("content-type") ?? "";
  const body = contentType.includes("application/json")
    ? ((await response.json()) as unknown)
    : null;

  if (!response.ok) {
    const errBody = body as ApiErrorBody | null;
    throw new ApiClientError(
      response.status,
      errBody?.error.code ?? "UNKNOWN_ERROR",
      errBody?.error.message ?? `Request failed with status ${response.status}`,
      errBody?.error.details,
    );
  }

  return (body as { data: T }).data;
}

export { API_URL };
