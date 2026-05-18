import { ApiErrorResponse } from "@/types/misc";
import axios, { AxiosError, InternalAxiosRequestConfig } from "axios";

interface RetryableRequest extends InternalAxiosRequestConfig {
  _retry?: boolean;
}

const apiBaseURL = process.env.NEXT_PUBLIC_API_URL ?? "/api/v1";

const api = axios.create({
  baseURL: apiBaseURL,
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
});

let isRefreshing = false;
let refreshPromise: Promise<void> | null = null;

api.interceptors.response.use(
  (response) => {
    if (response.data?.success === true) {
      response.data = response.data.data;
    }

    return response;
  },

  async (error: AxiosError<ApiErrorResponse>) => {
    const originalRequest = error.config as RetryableRequest;

    const status = error.response?.status;

    const is401 = status === 401;
    const isRefreshRequest = originalRequest?.url?.includes("/auth/refresh");

    const notRetried = !originalRequest?._retry;

    // Refresh token itself expired
    if (is401 && isRefreshRequest) {
      window.location.href = "/login";

      return Promise.reject(
        new Error("Your session has expired. Please login again."),
      );
    }

    // Access token expired
    if (is401 && notRetried && originalRequest) {
      originalRequest._retry = true;

      try {
        // Prevent multiple refresh API calls
        if (!isRefreshing) {
          isRefreshing = true;

          refreshPromise = api
            .post("/auth/refresh")
            .then(() => {})
            .finally(() => {
              isRefreshing = false;
            });
        }

        await refreshPromise;

        // Retry original request
        return api(originalRequest);
      } catch {
        window.location.href = "/login";

        return Promise.reject(
          new Error("Your session has expired. Please login again."),
        );
      }
    }

    const message =
      error.response?.data?.error?.message ||
      error.message ||
      "Unable to process your request right now.";

    return Promise.reject(new Error(message));
  },
);

export default api;
