import { FastifyReply, FastifyRequest } from "fastify";

import { REFRESH_TOKEN_COOKIE } from "@/constants/auth";

import {
  clearAuthCookies,
  hashToken,
  setAccessTokenCookie,
  setRefreshTokenCookie,
  setSessionActiveCookie,
} from "./auth.helper";
import { OtpRequestInput, OtpVerifyInput, SessionParams, SignupInput } from "./auth.schema";
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

  async verifyOtp(req: FastifyRequest<{ Body: OtpVerifyInput }>, reply: FastifyReply) {
    const userAgent = req.headers["user-agent"] ?? "unknown";
    const { accessToken, refreshToken, user } = await authService.verifyOtp(req.body, {
      ipAddress: req.ip,
      userAgent,
    });
    setAccessTokenCookie(reply, accessToken);
    setRefreshTokenCookie(reply, refreshToken);
    setSessionActiveCookie(reply);
    return { user };
  },

  async refresh(req: FastifyRequest, reply: FastifyReply) {
    const refreshToken = req.cookies[REFRESH_TOKEN_COOKIE];
    const { accessToken } = await authService.refreshSession(refreshToken);
    setAccessTokenCookie(reply, accessToken);
    // Re-set alongside the access token so a session whose marker cookie is
    // missing or was cleared (e.g. pre-dates this cookie existing at all)
    // self-heals on the next silent refresh, rather than staying locked out
    // until the user re-authenticates from scratch.
    setSessionActiveCookie(reply);
    return { message: "Token refreshed" };
  },

  async logout(req: FastifyRequest, reply: FastifyReply) {
    const refreshToken = req.cookies[REFRESH_TOKEN_COOKIE];
    await authService.logout(refreshToken);
    clearAuthCookies(reply);
    return { message: "Logged out" };
  },

  async getMe(req: FastifyRequest) {
    const user = await authService.getMe(req.user.userId);
    return { user };
  },

  async listSessions(req: FastifyRequest) {
    const sessions = await authService.listSessions(req.user.userId);
    return { sessions };
  },

  async getSession(req: FastifyRequest<{ Params: SessionParams }>) {
    const session = await authService.getSession(req.params.id, req.user.userId);
    return { session };
  },

  async revokeSession(req: FastifyRequest<{ Params: SessionParams }>, reply: FastifyReply) {
    const currentToken = req.cookies[REFRESH_TOKEN_COOKIE];
    const refreshTokenHash = currentToken ? hashToken(currentToken) : undefined;
    const { isCurrentSession } = await authService.revokeSession(
      req.params.id,
      req.user.userId,
      refreshTokenHash,
    );
    if (isCurrentSession) clearAuthCookies(reply);
    return { message: "Session revoked" };
  },

  async revokeAllSessions(req: FastifyRequest, reply: FastifyReply) {
    await authService.revokeAllSessions(req.user.userId);
    clearAuthCookies(reply);
    return { message: "All sessions revoked" };
  },
};
