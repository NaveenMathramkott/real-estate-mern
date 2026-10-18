import { create } from "zustand";

import {
  ApiError,
  apiCache,
  markRefreshAvailable,
  setUnauthorizedHandler,
  writeAccessToken,
} from "@/lib/api-client";
import { authApi } from "@/lib/api";
import { queryStore } from "@/lib/query-store";
import { disconnectSocket } from "@/lib/socket";
import type { Role, User } from "@/lib/types";

export type AuthStatus =
  | "idle"
  | "loading"
  | "authenticated"
  | "unauthenticated";

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
    role?: Role;
    locale?: string;
    currency?: string;
  }) => Promise<User>;
  logout: () => Promise<void>;
  bootstrap: () => Promise<void>;
  clearError: () => void;
};

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
      if (data.accessToken) await writeAccessToken(data.accessToken);
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
      if (data.accessToken) await writeAccessToken(data.accessToken);
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
      if (data.accessToken) await writeAccessToken(data.accessToken);
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
      // Revoking the refresh cookie is best effort — always clear locally.
    }
    await writeAccessToken(null);
    disconnectSocket();
    apiCache.clear();
    queryStore.resetAll();
    markRefreshAvailable();
    set({ user: null, status: "unauthenticated", otpEmail: null });
  },

  bootstrap: async () => {
    set({ status: "loading" });

    // A cold start often races the network coming up. One retry turns the most
    // common cause of a spurious sign-out into a slightly slower launch.
    const attempt = async () => {
      try {
        return await authApi.me();
      } catch (error) {
        // ApiError status 0 means the request never reached the server.
        if (error instanceof ApiError && error.status === 0) {
          await new Promise((resolve) => setTimeout(resolve, 800));
          return authApi.me();
        }
        throw error;
      }
    };

    try {
      const data = await attempt();
      markRefreshAvailable();
      set({ user: data.user, status: "authenticated" });
    } catch (error) {
      // Only a rejected token means the session is really over. A network
      // blip must not destroy stored credentials, or the next cold start is
      // signed out even though the refresh cookie was never spent.
      const rejected =
        error instanceof ApiError &&
        (error.status === 401 || error.status === 403);

      if (rejected) await writeAccessToken(null);

      // A failed bootstrap is the normal anonymous case, not an error state.
      set({ user: null, status: "unauthenticated" });
    }
  },
}));

/** Registered once at app start so an expired refresh token signs the user out
 *  from anywhere in the tree instead of only where a request happened to fail. */
setUnauthorizedHandler(() => {
  const { user, status } = useAuthStore.getState();
  if (!user && status === "unauthenticated") return;
  disconnectSocket();
  apiCache.clear();
  queryStore.resetAll();
  useAuthStore.setState({ user: null, status: "unauthenticated" });
});
