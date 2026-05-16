import type {
  OtpRequestInput,
  OtpVerifyInput,
  SignupInput,
} from "@splexa-group/shared/schemas";
import type { FastifyReply, FastifyRequest } from "fastify";

import { REFRESH_TOKEN_COOKIE } from "@/constants/auth";

import { clearAuthCookies, setAccessTokenCookie, setRefreshTokenCookie } from "./helper";
import type { SessionParams } from "./schema";
import { authService } from "./service";

export const authController = {
  async signup(
    req: FastifyRequest<{ Body: SignupInput }>,
    reply: FastifyReply,
  ): Promise<void> {
    await authService.signup(req.body);
    reply.code(201).send({ message: "OTP sent to your email" });
  },

  async requestOtp(
    req: FastifyRequest<{ Body: OtpRequestInput }>,
    reply: FastifyReply,
  ): Promise<void> {
    await authService.requestOtp(req.body);
    reply.send({ message: "OTP sent" });
  },

  async verifyOtp(
    req: FastifyRequest<{ Body: OtpVerifyInput }>,
    reply: FastifyReply,
  ): Promise<void> {
    const userAgent = req.headers["user-agent"] ?? "unknown";
    const { accessToken, refreshToken, user } = await authService.verifyOtp(
      req.body,
      {
        ipAddress: req.ip,
        userAgent,
      },
    );
    setAccessTokenCookie(reply, accessToken);
    setRefreshTokenCookie(reply, refreshToken);
    reply.send({ user });
  },

  async refresh(req: FastifyRequest, reply: FastifyReply): Promise<void> {
    const refreshToken = req.cookies[REFRESH_TOKEN_COOKIE];
    const { accessToken } = await authService.refreshSession(refreshToken);
    setAccessTokenCookie(reply, accessToken);
    reply.send({ message: "Token refreshed" });
  },

  async logout(req: FastifyRequest, reply: FastifyReply): Promise<void> {
    const refreshToken = req.cookies[REFRESH_TOKEN_COOKIE];
    await authService.logout(refreshToken);
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

  async getSession(
    req: FastifyRequest<{ Params: SessionParams }>,
    reply: FastifyReply,
  ): Promise<void> {
    const session = await authService.getSession(
      req.params.id,
      req.user.userId,
    );
    reply.send(session);
  },

  async revokeSession(
    req: FastifyRequest<{ Params: SessionParams }>,
    reply: FastifyReply,
  ): Promise<void> {
    await authService.revokeSession(req.params.id, req.user.userId);
    reply.send({ message: "Session revoked" });
  },

  async revokeAllSessions(
    req: FastifyRequest,
    reply: FastifyReply,
  ): Promise<void> {
    await authService.revokeAllSessions(req.user.userId);
    clearAuthCookies(reply);
    reply.send({ message: "All sessions revoked" });
  },
};
