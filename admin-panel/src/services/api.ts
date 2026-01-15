import axios from "axios";
import { ADMIN_TOKEN_KEY } from "@/lib/auth";

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
});

api.interceptors.request.use((config) => {
  if (typeof window === "undefined") {
    return config;
  }

  const token = localStorage.getItem(ADMIN_TOKEN_KEY);
  if (token) {
    if (!config.headers) {
      config.headers = {};
    }
    (config.headers as Record<string, string>).Authorization = `Bearer ${token}`;
  }

  return config;
});

export default api;
