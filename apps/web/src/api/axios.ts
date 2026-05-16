import axios from "axios";
import { useAuthStore } from "@/store/auth-store";

const axiosInstance = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5001",
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
});

axiosInstance.interceptors.request.use((config) => {
  const token = useAuthStore.getState().accessToken;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

axiosInstance.interceptors.response.use(
  (response) => {
    // Unwrap the { success: true, data: ... } envelope
    if (response.data?.success === true) {
      response.data = response.data.data;
    }
    return response;
  },
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const refreshRes = await axiosInstance.post("/api/v1/auth/refresh");
        const { accessToken } = refreshRes.data;
        useAuthStore.getState().setAuth(accessToken, useAuthStore.getState().user!);
        originalRequest.headers.Authorization = `Bearer ${accessToken}`;
        return axiosInstance(originalRequest);
      } catch {
        useAuthStore.getState().clearAuth();
      }
    }

    const message =
      error.response?.data?.error?.message ??
      error.message ??
      "Something went wrong. Please try again.";

    return Promise.reject(new Error(message));
  }
);

export default axiosInstance;
