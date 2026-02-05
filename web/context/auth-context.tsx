"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { useRouter } from "next/router";

import { apiClient } from "@/shared/api-client.service";
import {
  clearAccessToken,
  getAccessToken,
  getStoredUser,
  saveAccessToken,
  saveStoredUser,
  clearStoredUser,
} from "@/context/auth-storage";

type AuthUser = Record<string, unknown>;

interface AuthContextValue {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  setSessionFromSso: (token: string, user?: AuthUser) => void;
  logout: () => void;
  reloadUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [user, setUser] = useState<AuthUser | null>(() => {
    const token = getAccessToken();
    return token ? getStoredUser() : null;
  });
  const [isLoading] = useState(false);

  const setSessionFromSso = useCallback(
    (token: string, userPayload?: AuthUser) => {
      saveAccessToken(token);
      if (userPayload) {
        saveStoredUser(userPayload);
        setUser(userPayload);
      }
    },
    [],
  );

  const logout = useCallback(() => {
    clearAccessToken();
    clearStoredUser();
    setUser(null);
    router.replace("/");
  }, [router]);

  const reloadUser = useCallback(async () => {
    const token = getAccessToken();
    if (!token) {
      setUser(null);
      return;
    }

    try {
      const me = await apiClient<AuthUser>({ url: "/auth/me", method: "GET" });
      saveStoredUser(me);
      setUser(me);
    } catch {
      setUser(getStoredUser());
    }
  }, []);

  const value = useMemo(
    () => ({
      user,
      isAuthenticated: !!user && !!getAccessToken(),
      isLoading,
      setSessionFromSso,
      logout,
      reloadUser,
    }),
    [user, isLoading, setSessionFromSso, logout, reloadUser],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth deve ser usado dentro de AuthProvider");
  return ctx;
}
