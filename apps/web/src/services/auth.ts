import { GET, POST } from "@/api/http";
import { SignupPayload, VerifyOtpResponse } from "@/types/auth";
import type { UserProfile } from "@splexa-group/shared/models";

export const authApi = {
  me: () => GET<UserProfile>("/auth/me"),

  signup: (data: SignupPayload) => POST<void>("/auth/signup", data),

  requestOtp: (email: string) => POST<void>("/auth/otp/request", { email }),

  verifyOtp: (email: string, otp: string) =>
    POST<VerifyOtpResponse>("/auth/otp/verify", { email, otp }),

  refresh: () => POST("/auth/refresh"),

  logout: () => POST<void>("/auth/logout"),
};
