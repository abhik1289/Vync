"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { apiFetch } from "./api";

export interface PublicUser {
  id: string;
  email: string;
  name: string | null;
  avatarUrl: string | null;
  provider: "LOCAL" | "GOOGLE";
  emailVerified: boolean;
  createdAt: string;
}

interface AuthContextValue {
  user: PublicUser | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<PublicUser>;
  register: (input: {
    email: string;
    password: string;
    name?: string;
  }) => Promise<PublicUser>;
  logout: () => Promise<void>;
  refresh: () => Promise<PublicUser | null>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

const ACCESS_TOKEN_KEY = "vync_access_token";

/** Access token lives in memory only (never localStorage) to reduce XSS surface. */
let inMemoryAccessToken: string | null = null;

export function getAccessToken(): string | null {
  return inMemoryAccessToken;
}

export function setAccessToken(token: string | null): void {
  inMemoryAccessToken = token;
  if (token) {
    sessionStorage.setItem(ACCESS_TOKEN_KEY, token);
  } else {
    sessionStorage.removeItem(ACCESS_TOKEN_KEY);
  }
}

function readInitialToken(): string | null {
  if (typeof window === "undefined") return null;
  return sessionStorage.getItem(ACCESS_TOKEN_KEY);
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<PublicUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const refresh = useCallback(async (): Promise<PublicUser | null> => {
    try {
      const data = await apiFetch<{ user: PublicUser; accessToken: string }>(
        "/api/v1/auth/refresh",
        { method: "POST" },
      );
      setAccessToken(data.accessToken);
      setUser(data.user);
      return data.user;
    } catch {
      setAccessToken(null);
      setUser(null);
      return null;
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    const token = readInitialToken();
    if (token) {
      setAccessToken(token);
      // Validate the stored token with the API and refresh it if needed.
      refresh().catch(() => {
        if (!cancelled) {
          setUser(null);
          setIsLoading(false);
        }
      });
    } else {
      setIsLoading(false);
    }
    return () => {
      cancelled = true;
    };
  }, [refresh]);

  const login = useCallback(
    async (email: string, password: string): Promise<PublicUser> => {
      const data = await apiFetch<{ user: PublicUser; accessToken: string }>(
        "/api/v1/auth/login",
        {
          method: "POST",
          body: JSON.stringify({ email, password }),
        },
      );
      setAccessToken(data.accessToken);
      setUser(data.user);
      return data.user;
    },
    [],
  );

  const register = useCallback(
    async (input: {
      email: string;
      password: string;
      name?: string;
    }): Promise<PublicUser> => {
      const data = await apiFetch<{ user: PublicUser; accessToken: string }>(
        "/api/v1/auth/register",
        {
          method: "POST",
          body: JSON.stringify(input),
        },
      );
      setAccessToken(data.accessToken);
      setUser(data.user);
      return data.user;
    },
    [],
  );

  const logout = useCallback(async () => {
    try {
      await apiFetch("/api/v1/auth/logout", { method: "POST" });
    } finally {
      setAccessToken(null);
      setUser(null);
    }
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({ user, isLoading, login, register, logout, refresh }),
    [user, isLoading, login, register, logout, refresh],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within an <AuthProvider>");
  }
  return ctx;
}
