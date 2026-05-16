const API_BASE =
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5001";

interface ApiSuccess<T> {
  success: true;
  data: T;
}

interface ApiError {
  success: false;
  error: { code: string; message: string };
}

async function apiFetch<T>(
  path: string,
  options: RequestInit
): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...(options.headers ?? {}),
    },
  });

  const json = (await res.json()) as ApiSuccess<T> | ApiError;

  if (!res.ok || !json.success) {
    const msg =
      !json.success
        ? json.error?.message
        : `Request failed with status ${res.status}`;
    throw new Error(msg ?? "Something went wrong. Please try again.");
  }

  return (json as ApiSuccess<T>).data;
}

export interface AuthUser {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
  orgId: string;
}

export interface VerifyOtpResponse {
  accessToken: string;
  user: AuthUser;
}

export interface SignupPayload {
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string;
  designation: string;
  orgName: string;
  practiceType: string;
  city: string;
}

export function requestOtp(email: string): Promise<void> {
  return apiFetch("/api/v1/auth/otp/request", {
    method: "POST",
    body: JSON.stringify({ email }),
  });
}

export function signup(data: SignupPayload): Promise<void> {
  return apiFetch("/api/v1/auth/signup", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export function verifyOtp(
  email: string,
  otp: string
): Promise<VerifyOtpResponse> {
  return apiFetch<VerifyOtpResponse>("/api/v1/auth/otp/verify", {
    method: "POST",
    body: JSON.stringify({ email, otp }),
  });
}
