import axiosInstance from "./client";
import type { AxiosRequestConfig } from "axios";

export function GET<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
  return axiosInstance.get<T>(url, config).then((r) => r.data);
}

export function POST<T>(
  url: string,
  data?: unknown,
  config?: AxiosRequestConfig,
): Promise<T> {
  return axiosInstance.post<T>(url, data, config).then((r) => r.data);
}

export function PUT<T>(
  url: string,
  data?: unknown,
  config?: AxiosRequestConfig,
): Promise<T> {
  return axiosInstance.put<T>(url, data, config).then((r) => r.data);
}

export function PATCH<T>(
  url: string,
  data?: unknown,
  config?: AxiosRequestConfig,
): Promise<T> {
  return axiosInstance.patch<T>(url, data, config).then((r) => r.data);
}

export function DELETE<T>(
  url: string,
  config?: AxiosRequestConfig,
): Promise<T> {
  return axiosInstance.delete<T>(url, config).then((r) => r.data);
}
