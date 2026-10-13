import { create } from "zustand";

import {
  ACCESS_TOKEN_KEY,
  apiCache,
  markRefreshAvailable,
} from "@/lib/api-client";
import { authApi } from "@/lib/api";
import { queryStore } from "@/lib/query-store";
import type { User } from "@/lib/types";

type AuthStatus = "idle" | "loading" | "authenticated" | "unauthenticated";

type AuthState = {
  user: User | null;
  status: AuthStatus;
  error: string | null;
  otpEmail: string | null;
  setUser: (user: User | null) => void;
  login: (email: string, password: string) => Promise<User>;
  loginWithOtp: (email: string, otp: string) => Promise<User>;
  sendOtp: (email: string) => Promise<void>;
  register: (payload: {
    email: string;
    password: string;
    name?: string;
    role?: string;
  }) => Promise<User>;
  logout: () => Promise<void>;
  bootstrap: () => Promise<void>;
  clearError: () => void;
};

const timerHandles: number[] = [];

function clearTimers() {
  while (timerHandles.length) window.clearTimeout(timerHandles.pop());
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  status: "idle",
  error: null,
  otpEmail: null,

  setUser: (user) =>
    set({ user, status: user ? "authenticated" : "unauthenticated" }),

  clearError: () => set({ error: null }),

  login: async (email, password) => {
    set({ status: "loading", error: null });
    try {
      const data = await authApi.login({ email, password });
      if (data.accessToken)
        localStorage.setItem(ACCESS_TOKEN_KEY, data.accessToken);
      queryStore.invalidate("get|");
      markRefreshAvailable();
      set({ user: data.user, status: "authenticated" });
      return data.user;
    } catch (error) {
      const message = error instanceof Error ? error.message : "Login failed";
      set({ error: message, status: "unauthenticated" });
      throw error;
    }
  },

  loginWithOtp: async (email, otp) => {
    set({ status: "loading", error: null });
    try {
      const data = await authApi.verifyOtp({ email, otp });
      if (data.accessToken)
        localStorage.setItem(ACCESS_TOKEN_KEY, data.accessToken);
      queryStore.invalidate("get|");
      markRefreshAvailable();
      set({ user: data.user, status: "authenticated", otpEmail: null });
      return data.user;
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "OTP verification failed";
      set({ error: message });
      throw error;
    }
  },

  sendOtp: async (email) => {
    set({ error: null });
    try {
      await authApi.requestOtp({ email });
      set({ otpEmail: email });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Could not send OTP";
      set({ error: message });
      throw error;
    }
  },

  register: async (payload) => {
    set({ status: "loading", error: null });
    try {
      const data = await authApi.register(payload);
      if (data.accessToken)
        localStorage.setItem(ACCESS_TOKEN_KEY, data.accessToken);
      queryStore.invalidate("get|");
      markRefreshAvailable();
      set({ user: data.user, status: "authenticated" });
      return data.user;
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Registration failed";
      set({ error: message, status: "unauthenticated" });
      throw error;
    }
  },

  logout: async () => {
    try {
      await authApi.logout();
    } catch {
      /* revoke is best effort — always clear locally */
    }
    localStorage.removeItem(ACCESS_TOKEN_KEY);
    apiCache.clear();
    queryStore.resetAll();
    markRefreshAvailable();
    set({ user: null, status: "unauthenticated" });
  },

  bootstrap: async () => {
    set({ status: "loading" });
    // Guard against an unreachable API so the shell never hangs on a spinner.
    const timeout = new Promise<never>((_, reject) => {
      const id = setTimeout(
        () => reject(new Error("Auth check timed out")),
        10000,
      );
      timerHandles.push(id);
    });
    try {
      const data = await Promise.race([authApi.me(), timeout]);
      clearTimers();
      markRefreshAvailable();
      set({ user: data.user, status: "authenticated" });
    } catch {
      clearTimers();
      localStorage.removeItem(ACCESS_TOKEN_KEY);
      set({ user: null, status: "unauthenticated" });
    }
  },
}));
