import { FastifyReply } from "fastify";

import { env } from "@/config/env";
import {
  ACCESS_TOKEN_COOKIE,
  ACCESS_TOKEN_MAX_AGE,
  OTP_TTL_MINUTES,
  REFRESH_TOKEN_COOKIE,
  REFRESH_TOKEN_EXPIRY_DAYS,
  REFRESH_TOKEN_MAX_AGE,
} from "@/constants/auth";

export function otpExpiry(): Date {
  const d = new Date();
  d.setMinutes(d.getMinutes() + OTP_TTL_MINUTES);
  return d;
}

export function refreshTokenExpiry(): Date {
  const d = new Date();
  d.setDate(d.getDate() + REFRESH_TOKEN_EXPIRY_DAYS);
  return d;
}

export function setAccessTokenCookie(reply: FastifyReply, token: string): void {
  reply.setCookie(ACCESS_TOKEN_COOKIE, token, {
    httpOnly: true,
    secure: env.IS_PRODUCTION,
    sameSite: "strict",
    path: "/",
    maxAge: ACCESS_TOKEN_MAX_AGE,
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
    maxAge: REFRESH_TOKEN_MAX_AGE,
  });
}

export function clearAuthCookies(reply: FastifyReply): void {
  reply.clearCookie(ACCESS_TOKEN_COOKIE, { path: "/" });
  reply.clearCookie(REFRESH_TOKEN_COOKIE, { path: "/api/v1/auth" });
}
