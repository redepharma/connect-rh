import axios, { type AxiosError, type AxiosRequestConfig } from "axios";
import { getAccessToken } from "@/context/auth-storage";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_CONNECT_RH_API_BASE ?? "http://localhost:4006";

export type ApiClientErrorShape = {
  isApiClientError: true;
  status: number;
  url: string;
  method: string;
  data: unknown;
};

export const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 20000,
});

api.interceptors.request.use((config) => {
  const token = getAccessToken();
  if (token) {
    config.headers = config.headers ?? {};
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export async function apiClient<T>(config: AxiosRequestConfig): Promise<T> {
  try {
    const res = await api.request<T>(config);
    return res.data;
  } catch (err) {
    const axiosErr = err as AxiosError;
    const apiErr: ApiClientErrorShape = {
      isApiClientError: true,
      status: axiosErr.response?.status ?? 0,
      url: axiosErr.config?.url ?? "",
      method: axiosErr.config?.method ?? "GET",
      data: axiosErr.response?.data ?? axiosErr.message,
    };
    throw apiErr;
  }
}
