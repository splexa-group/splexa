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
    new AppError(401, ErrorCode.MISSING_TOKEN, "Missing access token"),
  missingRefreshToken: () =>
    new AppError(401, ErrorCode.MISSING_REFRESH_TOKEN, "Missing refresh token"),
  invalidToken: () =>
    new AppError(
      401,
      ErrorCode.INVALID_TOKEN,
      "Invalid or expired access token",
    ),
  forbidden: (msg = "Access denied") =>
    new AppError(403, ErrorCode.FORBIDDEN, msg),

  emailTaken: () =>
    new AppError(409, ErrorCode.EMAIL_TAKEN, "Email is already registered"),
  userNotFound: () =>
    new AppError(
      404,
      ErrorCode.USER_NOT_FOUND,
      "No account found with that email",
    ),

  otpNotFound: () =>
    new AppError(
      401,
      ErrorCode.OTP_NOT_FOUND,
      "No active OTP found for this email",
    ),
  invalidOtp: () => new AppError(401, ErrorCode.INVALID_OTP, "Invalid OTP"),
  otpExpired: () => new AppError(401, ErrorCode.OTP_EXPIRED, "OTP has expired"),
  otpLocked: () =>
    new AppError(
      429,
      ErrorCode.OTP_LOCKED,
      "Too many failed attempts, please request a new OTP",
    ),
  otpRateLimited: () =>
    new AppError(
      429,
      ErrorCode.OTP_RATE_LIMITED,
      "Too many OTP requests, please try again later",
    ),

  sessionNotFound: () =>
    new AppError(404, ErrorCode.SESSION_NOT_FOUND, "Session not found"),
  sessionExpired: () =>
    new AppError(401, ErrorCode.SESSION_EXPIRED, "Invalid or expired session"),

  emailSendFailed: () =>
    new AppError(
      503,
      ErrorCode.EMAIL_SEND_FAILED,
      "Failed to send OTP, please try again",
    ),
} as const;
