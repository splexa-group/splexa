import { ErrorCode } from "@/enums/error-code";

export class AppError extends Error {
  constructor(
    public readonly statusCode: number,
    public readonly code: string,
    message: string,
    public readonly cause?: Error,
  ) {
    super(message);
    this.name = "AppError";
  }
}

export const Errors = {
  missingToken: () =>
    new AppError(401, ErrorCode.MISSING_TOKEN, "Missing access token."),
  missingRefreshToken: () =>
    new AppError(
      401,
      ErrorCode.MISSING_REFRESH_TOKEN,
      "Missing refresh token.",
    ),
  invalidToken: () =>
    new AppError(
      401,
      ErrorCode.INVALID_TOKEN,
      "Invalid or expired access token.",
    ),
  forbidden: (msg = "Access denied") =>
    new AppError(403, ErrorCode.FORBIDDEN, msg),

  emailTaken: () =>
    new AppError(
      409,
      ErrorCode.EMAIL_TAKEN,
      "Email is already registered. Please log in or use a different email.",
    ),
  userNotFound: () =>
    new AppError(
      404,
      ErrorCode.USER_NOT_FOUND,
      "No account found. Please check your email and try again.",
    ),

  otpNotFound: () =>
    new AppError(
      404,
      ErrorCode.OTP_NOT_FOUND,
      "No active OTP found for this email.",
    ),
  invalidOtp: (msg?: string) =>
    new AppError(422, ErrorCode.INVALID_OTP, msg ?? "Invalid OTP."),
  otpExpired: () =>
    new AppError(
      422,
      ErrorCode.OTP_EXPIRED,
      "This code has expired. Please request a new one.",
    ),
  otpLocked: () =>
    new AppError(
      429,
      ErrorCode.OTP_LOCKED,
      `Too many attempts. Please wait 15 minutes before trying again.`,
    ),
  otpRateLimited: () =>
    new AppError(
      429,
      ErrorCode.OTP_RATE_LIMITED,
      "Too many OTP requests, please try again later.",
    ),

  sessionNotFound: () =>
    new AppError(404, ErrorCode.SESSION_NOT_FOUND, "Session not found."),
  sessionExpired: () =>
    new AppError(401, ErrorCode.SESSION_EXPIRED, "Invalid or expired session"),

  emailSendFailed: () =>
    new AppError(
      503,
      ErrorCode.EMAIL_SEND_FAILED,
      "Failed to send OTP, please try again.",
    ),
} as const;
