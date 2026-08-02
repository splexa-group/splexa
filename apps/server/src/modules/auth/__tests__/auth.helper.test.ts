import type { FastifyReply } from "fastify";
import { describe, it, expect, vi } from "vitest";

import { env } from "@/config/env";
import {
  ACCESS_TOKEN_COOKIE,
  ACCESS_TOKEN_TTL_MS,
  OTP_TTL_MS,
  REFRESH_TOKEN_COOKIE,
  REFRESH_TOKEN_EXPIRY_MS,
  SESSION_ACTIVE_COOKIE,
} from "@/constants/auth";

import {
  generateOtp,
  hashToken,
  generateRefreshToken,
  otpExpiry,
  refreshTokenExpiry,
  setAccessTokenCookie,
  setRefreshTokenCookie,
  setSessionActiveCookie,
  clearAuthCookies,
} from "../auth.helper";

vi.mock("@/config/env", () => ({
  env: { IS_PRODUCTION: false },
}));

function createMockReply(): FastifyReply {
  return {
    setCookie: vi.fn(),
    clearCookie: vi.fn(),
  } as unknown as FastifyReply;
}

describe("generateOtp", () => {
  it("returns a 6-digit numeric string", () => {
    expect(generateOtp()).toMatch(/^\d{6}$/);
  });

  it("stays within the 100000-999999 range", () => {
    for (let i = 0; i < 20; i++) {
      const otp = Number(generateOtp());
      expect(otp).toBeGreaterThanOrEqual(100000);
      expect(otp).toBeLessThanOrEqual(999999);
    }
  });
});

describe("hashToken", () => {
  it("is deterministic for the same input", () => {
    expect(hashToken("abc")).toBe(hashToken("abc"));
  });

  it("produces different hashes for different inputs", () => {
    expect(hashToken("abc")).not.toBe(hashToken("xyz"));
  });

  it("returns a 64-character hex string (SHA-256)", () => {
    expect(hashToken("abc")).toMatch(/^[0-9a-f]{64}$/);
  });
});

describe("generateRefreshToken", () => {
  it("returns a 128-character hex string (64 random bytes)", () => {
    expect(generateRefreshToken()).toMatch(/^[0-9a-f]{128}$/);
  });

  it("returns a different value each call", () => {
    expect(generateRefreshToken()).not.toBe(generateRefreshToken());
  });
});

describe("otpExpiry", () => {
  it("returns a Date roughly OTP_TTL_MS in the future", () => {
    const before = Date.now();
    const expiry = otpExpiry();
    const after = Date.now();

    expect(expiry.getTime()).toBeGreaterThanOrEqual(before + OTP_TTL_MS);
    expect(expiry.getTime()).toBeLessThanOrEqual(after + OTP_TTL_MS);
  });
});

describe("refreshTokenExpiry", () => {
  it("returns a Date roughly REFRESH_TOKEN_EXPIRY_MS in the future", () => {
    const before = Date.now();
    const expiry = refreshTokenExpiry();
    const after = Date.now();

    expect(expiry.getTime()).toBeGreaterThanOrEqual(before + REFRESH_TOKEN_EXPIRY_MS);
    expect(expiry.getTime()).toBeLessThanOrEqual(after + REFRESH_TOKEN_EXPIRY_MS);
  });
});

describe("setAccessTokenCookie", () => {
  it("sets the access token cookie with the right options", () => {
    const reply = createMockReply();

    setAccessTokenCookie(reply, "token-value");

    expect(reply.setCookie).toHaveBeenCalledWith(
      ACCESS_TOKEN_COOKIE,
      "token-value",
      expect.objectContaining({
        httpOnly: true,
        secure: env.IS_PRODUCTION,
        sameSite: "strict",
        path: "/",
        maxAge: Math.floor(ACCESS_TOKEN_TTL_MS / 1000),
      }),
    );
  });
});

describe("setRefreshTokenCookie", () => {
  it("sets the refresh token cookie scoped to /api/v1/auth", () => {
    const reply = createMockReply();

    setRefreshTokenCookie(reply, "token-value");

    expect(reply.setCookie).toHaveBeenCalledWith(
      REFRESH_TOKEN_COOKIE,
      "token-value",
      expect.objectContaining({
        httpOnly: true,
        secure: env.IS_PRODUCTION,
        sameSite: "strict",
        path: "/api/v1/auth",
        maxAge: Math.floor(REFRESH_TOKEN_EXPIRY_MS / 1000),
      }),
    );
  });
});

describe("setSessionActiveCookie", () => {
  it("sets a non-secret session marker cookie scoped to '/' with the refresh token's lifetime", () => {
    const reply = createMockReply();

    setSessionActiveCookie(reply);

    expect(reply.setCookie).toHaveBeenCalledWith(
      SESSION_ACTIVE_COOKIE,
      "1",
      expect.objectContaining({
        httpOnly: true,
        secure: env.IS_PRODUCTION,
        sameSite: "strict",
        path: "/",
        maxAge: Math.floor(REFRESH_TOKEN_EXPIRY_MS / 1000),
      }),
    );
  });
});

describe("clearAuthCookies", () => {
  it("clears all three cookies with matching paths", () => {
    const reply = createMockReply();

    clearAuthCookies(reply);

    expect(reply.clearCookie).toHaveBeenCalledWith(ACCESS_TOKEN_COOKIE, {
      path: "/",
    });
    expect(reply.clearCookie).toHaveBeenCalledWith(REFRESH_TOKEN_COOKIE, {
      path: "/api/v1/auth",
    });
    expect(reply.clearCookie).toHaveBeenCalledWith(SESSION_ACTIVE_COOKIE, {
      path: "/",
    });
  });
});
