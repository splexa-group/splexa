export const MAX_OTP_ATTEMPTS = 3;
export const OTP_LOCKOUT_MS = 15 * 60 * 1000; // 15 minutes
export const MAX_OTP_REQUESTS_PER_HOUR = 10;
export const OTP_TTL_MS = 10 * 60 * 1000; // 10 minutes
export const REFRESH_TOKEN_EXPIRY_MS = 3 * 24 * 60 * 60 * 1000; // 3 days
export const OTP_RATE_WINDOW_MS = 60 * 60 * 1000; // 1 hour
export const ACCESS_TOKEN_TTL_MS = 15 * 60 * 1000; // 15 minutes

export const ACCESS_TOKEN_COOKIE = "access_token";
export const REFRESH_TOKEN_COOKIE = "refresh_token";
