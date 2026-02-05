const ACCESS_TOKEN_KEY = "connect_rh_access_token";
const USER_KEY = "connect_rh_user";
const AUTH_COOKIE = "connect_rh_auth";
const AUTH_COOKIE_VALUE = "1";

export type StoredUser = Record<string, unknown>;

export function getAccessToken(): string | null {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(ACCESS_TOKEN_KEY);
}

export function saveAccessToken(token: string): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(ACCESS_TOKEN_KEY, token);
  document.cookie = `${AUTH_COOKIE}=${AUTH_COOKIE_VALUE}; path=/; SameSite=Lax`;
}

export function clearAccessToken(): void {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(ACCESS_TOKEN_KEY);
  document.cookie = `${AUTH_COOKIE}=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT`;
}

export function saveStoredUser(user: StoredUser): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(USER_KEY, JSON.stringify(user));
}

export function getStoredUser(): StoredUser | null {
  if (typeof window === "undefined") return null;
  const raw = window.localStorage.getItem(USER_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as StoredUser;
  } catch {
    return null;
  }
}

export function clearStoredUser(): void {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(USER_KEY);
}
