import { otpRequestSchema, otpVerifySchema, signupSchema } from "@splexa-group/shared/schemas";
import type { FastifyReply, FastifyRequest } from "fastify";

import {
  ACCESS_TOKEN_COOKIE,
  ACCESS_TOKEN_MAX_AGE,
  REFRESH_TOKEN_COOKIE,
  REFRESH_TOKEN_MAX_AGE,
} from "@/config/constants";

import { sessionParamsSchema } from "./auth-schema";
import * as authService from "./auth-service";

function setAccessTokenCookie(reply: FastifyReply, token: string): void {
  reply.setCookie(ACCESS_TOKEN_COOKIE, token, {
    httpOnly: true,
    secure: true,
    sameSite: "strict",
    path: "/",
    maxAge: ACCESS_TOKEN_MAX_AGE,
  });
}

function setRefreshTokenCookie(reply: FastifyReply, token: string): void {
  reply.setCookie(REFRESH_TOKEN_COOKIE, token, {
    httpOnly: true,
    secure: true,
    sameSite: "strict",
    path: "/auth",
    maxAge: REFRESH_TOKEN_MAX_AGE,
  });
}

function clearAuthCookies(reply: FastifyReply): void {
  reply.clearCookie(ACCESS_TOKEN_COOKIE, { path: "/" });
  reply.clearCookie(REFRESH_TOKEN_COOKIE, { path: "/auth" });
}

export const authController = {
  async signup(req: FastifyRequest, reply: FastifyReply): Promise<void> {
    const body = signupSchema.parse(req.body);
    await authService.signup(body, { ipAddress: req.ip });
    reply.code(201).send({ message: "OTP sent to your email" });
  },

  async requestOtp(req: FastifyRequest, reply: FastifyReply): Promise<void> {
    const body = otpRequestSchema.parse(req.body);
    await authService.requestOtp(body, { ipAddress: req.ip });
    reply.send({ message: "OTP sent" });
  },

  async verifyOtp(req: FastifyRequest, reply: FastifyReply): Promise<void> {
    const body = otpVerifySchema.parse(req.body);
    const userAgent = req.headers["user-agent"] ?? "unknown";
    const { accessToken, refreshToken, user } = await authService.verifyOtp(body, {
      ipAddress: req.ip,
      userAgent,
    });
    setAccessTokenCookie(reply, accessToken);
    setRefreshTokenCookie(reply, refreshToken);
    reply.send({ user });
  },

  async refresh(req: FastifyRequest, reply: FastifyReply): Promise<void> {
    const refreshToken = req.cookies[REFRESH_TOKEN_COOKIE];
    const { accessToken } = await authService.refreshSession(refreshToken, { ipAddress: req.ip });
    setAccessTokenCookie(reply, accessToken);
    reply.send({ message: "Token refreshed" });
  },

  async logout(req: FastifyRequest, reply: FastifyReply): Promise<void> {
    const refreshToken = req.cookies[REFRESH_TOKEN_COOKIE];
    await authService.logout(refreshToken, { ipAddress: req.ip });
    clearAuthCookies(reply);
    reply.send({ message: "Logged out" });
  },

  async getMe(req: FastifyRequest, reply: FastifyReply): Promise<void> {
    const user = await authService.getMe(req.user.userId);
    reply.send(user);
  },

  async listSessions(req: FastifyRequest, reply: FastifyReply): Promise<void> {
    const sessions = await authService.listSessions(req.user.userId);
    reply.send({ sessions });
  },

  async getSession(req: FastifyRequest, reply: FastifyReply): Promise<void> {
    const { id } = sessionParamsSchema.parse(req.params);
    const session = await authService.getSession(id, req.user.userId);
    reply.send(session);
  },

  async revokeSession(req: FastifyRequest, reply: FastifyReply): Promise<void> {
    const { id } = sessionParamsSchema.parse(req.params);
    await authService.revokeSession(id, req.user.userId, req.user.orgId, { ipAddress: req.ip });
    reply.send({ message: "Session revoked" });
  },

  async revokeAllSessions(req: FastifyRequest, reply: FastifyReply): Promise<void> {
    await authService.revokeAllSessions(req.user.userId, req.user.orgId, { ipAddress: req.ip });
    clearAuthCookies(reply);
    reply.send({ message: "All sessions revoked" });
  },
};
