import type { FastifyReply, FastifyRequest } from "fastify";

import { REFRESH_TOKEN_COOKIE } from "@/constants/auth";

import {
  clearAuthCookies,
  setAccessTokenCookie,
  setRefreshTokenCookie,
} from "./auth.helper";
import type {
  OtpRequestInput,
  OtpVerifyInput,
  SessionParams,
  SignupInput,
} from "./auth.schema";
import { authService } from "./auth.service";

export const authController = {
  async signup(req: FastifyRequest<{ Body: SignupInput }>) {
    await authService.signup(req.body);
    return { message: "OTP sent to your email" };
  },

  async requestOtp(req: FastifyRequest<{ Body: OtpRequestInput }>) {
    await authService.requestOtp(req.body);
    return { message: "OTP sent to your email" };
  },

  async verifyOtp(
    req: FastifyRequest<{ Body: OtpVerifyInput }>,
    reply: FastifyReply,
  ) {
    const userAgent = req.headers["user-agent"] ?? "unknown";
    const { accessToken, refreshToken, user } = await authService.verifyOtp(
      req.body,
      { ipAddress: req.ip, userAgent },
    );
    setAccessTokenCookie(reply, accessToken);
    setRefreshTokenCookie(reply, refreshToken);
    return { user };
  },

  async refresh(req: FastifyRequest, reply: FastifyReply) {
    const refreshToken = req.cookies[REFRESH_TOKEN_COOKIE];
    const { accessToken } = await authService.refreshSession(refreshToken);
    setAccessTokenCookie(reply, accessToken);
    return { message: "Token refreshed" };
  },

  async logout(req: FastifyRequest, reply: FastifyReply) {
    const refreshToken = req.cookies[REFRESH_TOKEN_COOKIE];
    await authService.logout(refreshToken);
    clearAuthCookies(reply);
    return { message: "Logged out" };
  },

  async getMe(req: FastifyRequest) {
    return authService.getMe(req.user.userId);
  },

  async listSessions(req: FastifyRequest) {
    const sessions = await authService.listSessions(req.user.userId);
    return { sessions };
  },

  async getSession(req: FastifyRequest<{ Params: SessionParams }>) {
    return authService.getSession(req.params.id, req.user.userId);
  },

  async revokeSession(req: FastifyRequest<{ Params: SessionParams }>) {
    await authService.revokeSession(req.params.id, req.user.userId);
    return { message: "Session revoked" };
  },

  async revokeAllSessions(req: FastifyRequest, reply: FastifyReply) {
    await authService.revokeAllSessions(req.user.userId);
    clearAuthCookies(reply);
    return { message: "All sessions revoked" };
  },
};
