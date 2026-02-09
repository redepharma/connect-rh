import axios from "axios";
import { getAccessToken } from "@/context/auth-storage";

const baseURL = process.env.NEXT_PUBLIC_CONNECT_RH_API_BASE ?? "";

export const apiClient = axios.create({
  baseURL,
});

apiClient.interceptors.request.use((config) => {
  const token = getAccessToken();
  if (token) {
    config.headers = config.headers ?? {};
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});
