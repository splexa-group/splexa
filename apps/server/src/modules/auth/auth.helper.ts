import crypto from "crypto";

import { FastifyReply } from "fastify";

import { env } from "@/config/env";
import {
  ACCESS_TOKEN_COOKIE,
  ACCESS_TOKEN_TTL_MS,
  OTP_TTL_MS,
  REFRESH_TOKEN_COOKIE,
  REFRESH_TOKEN_EXPIRY_MS,
} from "@/constants/auth";
import { msFromNow, msToSeconds } from "@/utils/date-time";

export function generateOtp(): string {
  return crypto.randomInt(100000, 1_000_000).toString();
}

export function hashToken(token: string): string {
  return crypto.createHash("sha256").update(token).digest("hex");
}

export function generateRefreshToken(): string {
  return crypto.randomBytes(64).toString("hex");
}

export function otpExpiry(): Date {
  return msFromNow(OTP_TTL_MS);
}

export function refreshTokenExpiry(): Date {
  return msFromNow(REFRESH_TOKEN_EXPIRY_MS);
}

export function setAccessTokenCookie(reply: FastifyReply, token: string): void {
  reply.setCookie(ACCESS_TOKEN_COOKIE, token, {
    httpOnly: true,
    secure: env.IS_PRODUCTION,
    sameSite: "strict",
    path: "/",
    maxAge: msToSeconds(ACCESS_TOKEN_TTL_MS),
  });
}

export function setRefreshTokenCookie(
  reply: FastifyReply,
  token: string,
): void {
  reply.setCookie(REFRESH_TOKEN_COOKIE, token, {
    httpOnly: true,
    secure: env.IS_PRODUCTION,
    sameSite: "strict",
    path: "/api/v1/auth",
    maxAge: msToSeconds(REFRESH_TOKEN_EXPIRY_MS),
  });
}

export function clearAuthCookies(reply: FastifyReply): void {
  reply.clearCookie(ACCESS_TOKEN_COOKIE, { path: "/" });
  reply.clearCookie(REFRESH_TOKEN_COOKIE, { path: "/api/v1/auth" });
}
