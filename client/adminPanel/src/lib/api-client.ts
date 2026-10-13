import axios, {
  AxiosError,
  type AxiosInstance,
  type AxiosRequestConfig,
  type InternalAxiosRequestConfig,
} from "axios";

import { apiCache, cacheKey } from "./api-cache";
import type { ApiEnvelope } from "./types";

export const API_BASE_URL =
  (import.meta.env.VITE_API_URL as string | undefined)?.replace(/\/$/, "") ??
  "http://localhost:4000/api/v1";

export const ACCESS_TOKEN_KEY = "tap:accessToken";

export class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

let onUnauthorized: (() => void) | undefined;
export function setUnauthorizedHandler(fn: () => void) {
  onUnauthorized = fn;
}

/**
 * Set once a refresh has failed for this session. Without it every request
 * would fire its own `POST /auth/refresh` before giving up.
 */
let refreshUnavailable = false;

/** Cleared whenever we obtain fresh credentials. */
export function markRefreshAvailable() {
  refreshUnavailable = false;
}

const http: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
  timeout: 20_000,
  headers: { "Content-Type": "application/json" },
});

const DEBUG =
  (import.meta.env.DEV as boolean | undefined) &&
  (import.meta.env.VITE_API_DEBUG as string | undefined) === "true";

http.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const token = localStorage.getItem(ACCESS_TOKEN_KEY);
  if (token) config.headers.Authorization = `Bearer ${token}`;
  if (DEBUG) {
    console.debug(
      `[api] ${(config.method ?? "get").toUpperCase()} ${config.baseURL ?? ""}${config.url ?? ""}`,
    );
  }
  return config;
});

let refreshing: Promise<string | null> | null = null;

async function rotateAccessToken(): Promise<string | null> {
  try {
    const { data } = await axios.post<{ accessToken?: string }>(
      `${API_BASE_URL}/auth/refresh`,
      {},
      { withCredentials: true },
    );
    const token = data.accessToken ?? null;
    if (token) localStorage.setItem(ACCESS_TOKEN_KEY, token);
    return token;
  } catch {
    return null;
  }
}

http.interceptors.response.use(
  (response) => response,
  async (error: AxiosError<ApiEnvelope>) => {
    const original = error.config as
      | (InternalAxiosRequestConfig & {
          _retried?: boolean;
        })
      | undefined;
    const status = error.response?.status ?? 0;
    const message =
      (error.response?.data as ApiEnvelope | undefined)?.message ??
      error.message ??
      "Something went wrong";

    const isAuthRoute = original?.url?.includes("/auth/");

    if (
      status === 401 &&
      original &&
      !original._retried &&
      !isAuthRoute &&
      !refreshUnavailable
    ) {
      original._retried = true;
      refreshing ??= rotateAccessToken().finally(() => {
        refreshing = null;
      });
      const token = await refreshing;
      // Replay preserves the original method and body, so a PATCH stays a PATCH.
      if (token) return http(original);

      // The refresh token is gone or was replayed — stop trying for this
      // session instead of firing a refresh POST on every later request.
      refreshUnavailable = true;
      localStorage.removeItem(ACCESS_TOKEN_KEY);
      onUnauthorized?.();
    }

    if (status === 429) {
      return Promise.reject(
        new ApiError("Rate limit exceeded. Try again shortly.", status),
      );
    }
    if (status === 503) {
      return Promise.reject(
        new ApiError(
          error.response?.data?.message ??
            "Service unavailable (Redis not configured).",
          status,
        ),
      );
    }

    return Promise.reject(new ApiError(message, status));
  },
);

type RequestOptions = AxiosRequestConfig & {
  /** Cache TTL in ms. Only applies to GET requests. Omit to skip caching. */
  cacheTtl?: number;
  /** Skip the cache read but refresh the stored entry. */
  fresh?: boolean;
};

function methodOf(config: AxiosRequestConfig) {
  return (config.method ?? "get").toLowerCase();
}

function keyOf(config: AxiosRequestConfig) {
  const params = config.params;
  const serialisedParams =
    params && typeof params === "object" && !Array.isArray(params)
      ? Object.entries(params as Record<string, unknown>)
          .filter(([, v]) => v !== undefined && v !== null && v !== "")
          .sort(([a], [b]) => a.localeCompare(b))
          .map(([k, v]) => `${k}=${String(v)}`)
          .join("&")
      : "";
  return cacheKey(
    methodOf(config),
    config.url ?? "",
    serialisedParams,
    config.baseURL ?? "",
  );
}

async function request<T>(config: RequestOptions): Promise<T> {
  const isCacheable = methodOf(config) === "get" && (config.cacheTtl ?? 0) > 0;
  const key = keyOf(config);

  if (isCacheable && !config.fresh) {
    const cached = apiCache.peek<T>(key);
    if (cached !== undefined) return cached;
  }

  const send = async () => {
    const response = await http.request<T>(config);
    if (isCacheable) apiCache.set(key, response.data, config.cacheTtl);
    return response.data;
  };

  return isCacheable ? apiCache.dedupe(key, send) : send();
}

export const api = {
  get: <T>(url: string, options: RequestOptions = {}) =>
    request<T>({ ...options, url, method: "get" }),
  post: <T>(url: string, data?: unknown, options: RequestOptions = {}) =>
    request<T>({ ...options, url, data, method: "post" }),
  patch: <T>(url: string, data?: unknown, options: RequestOptions = {}) =>
    request<T>({ ...options, url, data, method: "patch" }),
  put: <T>(url: string, data?: unknown, options: RequestOptions = {}) =>
    request<T>({ ...options, url, data, method: "put" }),
  delete: <T>(url: string, options: RequestOptions = {}) =>
    request<T>({ ...options, url, method: "delete" }),
};

export { apiCache };
