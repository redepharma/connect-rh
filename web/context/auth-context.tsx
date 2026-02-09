"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import type { ReactNode } from "react";
import { clearAccessToken } from "./auth-storage";

export type AuthUser = {
  id: string;
  usuario: string;
  nome: string;
  papelConnectRh?: string | null;
  departamentoId?: string | null;
  departamento?: string | null;
};

type AuthContextValue = {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  reloadUser: () => Promise<void>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

async function fetchMe(): Promise<AuthUser | null> {
  const response = await fetch("/api/auth/me", {
    method: "GET",
    credentials: "include",
  });

  if (!response.ok) {
    return null;
  }

  return (await response.json()) as AuthUser;
}

async function requestLogout(): Promise<void> {
  await fetch("/api/auth/logout", { method: "POST", credentials: "include" });
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const reloadUser = useCallback(async () => {
    setIsLoading(true);
    try {
      const me = await fetchMe();
      setUser(me);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const logout = useCallback(async () => {
    await requestLogout();
    clearAccessToken();
    setUser(null);
  }, []);

  useEffect(() => {
    void reloadUser();
  }, [reloadUser]);

  const value = useMemo(
    () => ({
      user,
      isAuthenticated: Boolean(user),
      isLoading,
      reloadUser,
      logout,
    }),
    [user, isLoading, reloadUser, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth deve ser usado dentro de AuthProvider");
  }
  return context;
};
