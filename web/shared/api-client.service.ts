import axios, { AxiosError } from "axios";
import { getAccessToken } from "@/context/auth-storage";

const API_BASE_URL = process.env.NEXT_PUBLIC_CONNECT_RH_API_BASE ?? "";

type HttpMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

interface RequestOptions<TBody = unknown> {
  method?: HttpMethod;
  body?: TBody;
  query?: Record<string, string | number | boolean | undefined>;
  headers?: Record<string, string>;
}

export type ApiClientErrorShape = {
  isApiClientError: true;
  status: number;
  url: string;
  method: HttpMethod;
  data: unknown;
};

function buildQueryString(
  query?: Record<string, string | number | boolean | undefined>,
): string {
  if (!query) return "";

  const params = new URLSearchParams();

  Object.entries(query).forEach(([key, value]) => {
    if (value === undefined || value === null || value === "") return;
    params.append(key, String(value));
  });

  const qs = params.toString();
  return qs ? `?${qs}` : "";
}

const axiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
});

axiosInstance.interceptors.request.use((config) => {
  const token = getAccessToken();
  if (token) {
    config.headers = config.headers ?? {};
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export async function apiClient<TResponse, TBody = unknown>(
  path: string,
  options: RequestOptions<TBody> = {},
): Promise<TResponse> {
  const { method = "GET", body, query, headers } = options;
  const url = `${path}${buildQueryString(query)}`;

  try {
    const response = await axiosInstance.request<TResponse>({
      url,
      method,
      headers,
      data: body,
    });

    return response.data;
  } catch (error) {
    const axiosErr = error as AxiosError;
    const status = axiosErr.response?.status ?? 0;
    const data = axiosErr.response?.data ?? axiosErr.message;

    const apiErr: ApiClientErrorShape = {
      isApiClientError: true,
      status,
      url: `${API_BASE_URL}${url}`,
      method,
      data,
    };

    throw apiErr;
  }
}
