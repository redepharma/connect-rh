const TOKEN_KEY = "connect_rh_token";

export const getAccessToken = (): string | null => {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(TOKEN_KEY);
};

export const setAccessToken = (token: string) => {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(TOKEN_KEY, token);
};

export const clearAccessToken = () => {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(TOKEN_KEY);
};

export const getTokenKey = () => TOKEN_KEY;
