import { getAccessToken } from "@/context/auth-storage";

const baseURL = process.env.NEXT_PUBLIC_CONNECT_RH_API_BASE ?? "";

const buildUrl = (path: string) => {
  if (path.startsWith("http")) return path;
  const base = baseURL.replace(/\/$/, "");
  if (!path.startsWith("/")) return `${base}/${path}`;
  return `${base}${path}`;
};

export async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const token = getAccessToken();
  const headers = new Headers(init?.headers);

  if (!headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  const response = await fetch(buildUrl(path), {
    ...init,
    headers,
  });

  if (!response.ok) {
    const message = await response.text();
    throw new Error(message || "Erro na requisicao");
  }

  return (await response.json()) as T;
}
