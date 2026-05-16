import { GET, POST } from "@/api/http";

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

export const authApi = {
  requestOtp: (email: string) =>
    POST<void>("/api/v1/auth/otp/request", { email }),

  signup: (data: SignupPayload) =>
    POST<void>("/api/v1/auth/signup", data),

  verifyOtp: (email: string, otp: string) =>
    POST<VerifyOtpResponse>("/api/v1/auth/otp/verify", { email, otp }),

  refresh: () =>
    POST<{ accessToken: string }>("/api/v1/auth/refresh"),

  logout: () =>
    POST<void>("/api/v1/auth/logout"),

  me: () =>
    GET<AuthUser>("/api/v1/auth/me"),
};
