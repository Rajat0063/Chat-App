import axios from "axios";

const apiBaseUrl = (import.meta.env.VITE_API_URL || "").replace(/\/+$/, "");

export const axiosInstance = axios.create({
  baseURL: apiBaseUrl ? `${apiBaseUrl}/api` : "/api",
  withCredentials: true,
});

axiosInstance.interceptors.request.use((config) => {
  const token = localStorage.getItem("chat-token");
  if (token) {
    config.headers = config.headers || {};
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error?.response?.status === 401) {
      localStorage.removeItem("chat-token");
    }
    return Promise.reject(error);
  }
);