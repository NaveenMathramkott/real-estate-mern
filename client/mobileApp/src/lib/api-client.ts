import axios, {
  create,
  type AxiosError,
  type AxiosInstance,
  type AxiosRequestConfig,
  type InternalAxiosRequestConfig,
} from "axios";
import Constants from "expo-constants";

import { apiCache, cacheKey } from "./api-cache";
import { readAccessToken, writeAccessToken } from "./token-store";
import type { ApiEnvelope } from "./types";

function resolveBaseUrl() {
  const fromEnv = process.env.EXPO_PUBLIC_API_URL?.replace(/\/$/, "");
  if (fromEnv) return fromEnv;

  // On a physical device `localhost` points at the phone. The Metro host is the
  // closest thing to "the machine running the server", so reuse its IP.
  const hostUri = Constants.expoConfig?.hostUri;
  const host = hostUri?.split(":")[0];
  if (host && host !== "localhost" && host !== "127.0.0.1" && host !== "::1") {
    return `http://${host}:4000/api/v1`;
  }
  return "http://localhost:4000/api/v1";
}

export const API_BASE_URL = resolveBaseUrl();

/** Socket.IO shares the API host — drop the `/api/v1` suffix. */
export const SOCKET_URL = API_BASE_URL.replace(/\/api\/v1$/, "");

const DEBUG = process.env.EXPO_PUBLIC_API_DEBUG === "true";

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

/** Set once a refresh has failed, so later requests stop firing their own. */
let refreshUnavailable = false;

/** Cleared whenever we obtain fresh credentials. */
export function markRefreshAvailable() {
  refreshUnavailable = false;
}

export type QueryValue = string | number | boolean | undefined | null;

export type RequestOptions = {
  params?: Record<string, QueryValue>;
  /** Cache TTL in ms. Only applies to GET requests. Omit to skip caching. */
  cacheTtl?: number;
  /** Skip the cache read but refresh the stored entry. */
  fresh?: boolean;
  /** Skip the Authorization header (used by the refresh call itself). */
  anonymous?: boolean;
};

/**
 * React Native's native HTTP stack keeps a cookie jar, so `withCredentials` lets
 * the httpOnly refresh cookie ride along without any explicit handling.
 */
const http: AxiosInstance = create({
  baseURL: API_BASE_URL,
  withCredentials: true,
  timeout: 20_000,
  headers: { "Content-Type": "application/json" },
});

http.interceptors.request.use(
  async (config: InternalAxiosRequestConfig) => {
    const token = await readAccessToken();
    if (token) config.headers.Authorization = `Bearer ${token}`;
    if (DEBUG) {
      console.debug(
        `[api] ${(config.method ?? "get").toUpperCase()} ${config.baseURL ?? ""}${config.url ?? ""}`,
      );
    }
    return config;
  },
  (error) => Promise.reject(error),
);

let refreshing: Promise<string | null> | null = null;

/** Rotates the refresh cookie for a new access token. */
async function rotateAccessToken(): Promise<string | null> {
  try {
    const { data } = await axios.post<{ accessToken?: string }>(
      `${API_BASE_URL}/auth/refresh`,
      {},
      { withCredentials: true },
    );
    const token = data.accessToken ?? null;
    if (token) await writeAccessToken(token);
    return token;
  } catch {
    return null;
  }
}

http.interceptors.response.use(
  (response) => response,
  async (error: AxiosError<ApiEnvelope>) => {
    const original = error.config as
      | (InternalAxiosRequestConfig & { _retried?: boolean })
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

      // The refresh cookie is gone or was replayed — stop trying for this
      // session instead of firing a refresh POST on every later request.
      refreshUnavailable = true;
      await writeAccessToken(null);
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
          (error.response?.data as ApiEnvelope | undefined)?.message ??
            "Service unavailable (Redis not configured).",
          status,
        ),
      );
    }

    return Promise.reject(new ApiError(message, status));
  },
);

/** Depth counter for cache bypass, used when a revalidation must reach the server. */
let bypassDepth = 0;

/** Runs `fn` with the GET response cache disabled, forcing a real network request. */
export async function withFreshCache<T>(fn: () => Promise<T>): Promise<T> {
  bypassDepth += 1;
  try {
    return await fn();
  } finally {
    bypassDepth -= 1;
  }
}

function methodOf(config: AxiosRequestConfig) {
  return (config.method ?? "get").toLowerCase();
}

/** Sorted, empty-value-free params so a cache key is stable across call sites. */
function serialiseParams(params?: Record<string, QueryValue>) {
  if (!params) return "";
  return Object.entries(params)
    .filter(
      ([, value]) => value !== undefined && value !== null && value !== "",
    )
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, value]) => `${key}=${String(value)}`)
    .join("&");
}

function keyOf(config: AxiosRequestConfig) {
  return cacheKey(
    methodOf(config),
    config.url ?? "",
    serialiseParams(config.params as Record<string, QueryValue> | undefined),
    config.baseURL ?? "",
  );
}

async function request<T>(
  config: AxiosRequestConfig & RequestOptions,
): Promise<T> {
  const isCacheable =
    methodOf(config) === "get" &&
    (config.cacheTtl ?? 0) > 0 &&
    bypassDepth === 0;
  const key = keyOf(config);

  if (isCacheable && !config.fresh) {
    const cached = apiCache.peek<T>(key);
    if (cached !== undefined) return cached;
  }

  const run = async () => {
    const response = await http.request<T>(config);
    const data = response.data;
    if (isCacheable) apiCache.set(key, data, config.cacheTtl);
    return data;
  };

  return isCacheable ? apiCache.dedupe(key, run) : run();
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
  /** `DELETE /favorites` reads `{ propertyId }` from the body, so a body is allowed here. */
  delete: <T>(url: string, data?: unknown, options: RequestOptions = {}) =>
    request<T>({ ...options, url, data, method: "delete" }),
};

export { apiCache, readAccessToken, writeAccessToken };
