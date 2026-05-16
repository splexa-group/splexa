import { ApiErrorResponse } from "@/types/misc";
import axios, { AxiosError, InternalAxiosRequestConfig } from "axios";

interface RetryableRequest extends InternalAxiosRequestConfig {
  _retry?: boolean;
}

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
});

api.interceptors.response.use(
  (response) => {
    if (response.data?.success === true) {
      response.data = response.data.data;
    }
    return response;
  },

  async (error: AxiosError<ApiErrorResponse>) => {
    const originalRequest = error.config as RetryableRequest;

    const is401 = error.response?.status === 401;
    const notRetried = !originalRequest?._retry;

    if (is401 && notRetried && originalRequest) {
      originalRequest._retry = true;

      try {
        await api.post("/api/v1/auth/refresh");

        // Retry original request
        return api(originalRequest);
      } catch {
        // Refresh failed — session expired, redirect to login
        window.location.href = "/login";
        return Promise.reject(
          new Error("Session expired. Please login in again."),
        );
      }
    }

    const message =
      error.response?.data?.error?.message ??
      error.message ??
      "Something went wrong. Please try again.";

    return Promise.reject(new Error(message));
  },
);

export default api;
