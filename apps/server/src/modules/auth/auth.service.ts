import { Prisma } from "@prisma/client";
import bcrypt from "bcryptjs";

import { logger } from "@/config/logger";
import { MAX_OTP_ATTEMPTS, MAX_OTP_REQUESTS_PER_HOUR } from "@/constants/auth";
import { emailProvider } from "@/integrations/email";
import { Errors } from "@/utils/errors";
import { signAccessToken } from "@/utils/jwt";

import {
  generateOtp,
  generateRefreshToken,
  hashToken,
  refreshTokenExpiry,
} from "./auth.helper";
import { VerifyOtpCtx, VerifyOtpResult } from "./auth.models";
import { authRepository } from "./auth.repository";
import { SignupInput, OtpRequestInput, OtpVerifyInput } from "./auth.schema";

export type { VerifyOtpResult };

export const authService = {
  async signup(input: SignupInput): Promise<void> {
    const existingUser = await authRepository.findUserByEmail(input.email);
    if (existingUser) throw Errors.emailTaken();

    const count = await authRepository.countRecentOtpRequests(input.email);
    if (count >= MAX_OTP_REQUESTS_PER_HOUR) throw Errors.otpRateLimited();

    const otp = generateOtp();
    const otpHash = await bcrypt.hash(otp, 10);

    // Send email before writing to DB — if delivery fails nothing is persisted.
    try {
      await emailProvider.sendOtp(input.email, otp);
    } catch (err) {
      logger.error(
        { email: input.email, error: err },
        "auth: failed to send signup OTP",
      );
      throw Errors.emailSendFailed();
    }

    try {
      await authRepository.createOrgAndUser(input, otpHash);
    } catch (err) {
      logger.error(
        { email: input.email, error: err },
        "auth: failed to create org and user",
      );
      // Two concurrent signups for the same email can both pass the `existing`
      // check above — the DB's unique constraint is the real guard, so translate
      // its violation into the same clean error the check above would have thrown.
      if (
        err instanceof Prisma.PrismaClientKnownRequestError &&
        err.code === "P2002"
      ) {
        throw Errors.emailTaken();
      }

      throw err;
    }
  },

  async requestOtp(input: OtpRequestInput): Promise<void> {
    const user = await authRepository.findUserByEmail(input.email);
    if (!user) throw Errors.userNotFound();

    const count = await authRepository.countRecentOtpRequests(input.email);
    if (count >= MAX_OTP_REQUESTS_PER_HOUR) throw Errors.otpRateLimited();

    const lockedEmail = await authRepository.findLockedEmail(
      input.email,
      MAX_OTP_ATTEMPTS,
    );
    if (lockedEmail) throw Errors.otpLocked();

    const otp = generateOtp();
    const otpHash = await bcrypt.hash(otp, 10);

    try {
      await emailProvider.sendOtp(input.email, otp);
    } catch (err) {
      logger.error(
        { email: input.email, error: err },
        "auth: failed to send OTP",
      );
      throw Errors.emailSendFailed();
    }

    // Invalidate all previous pending OTPs before issuing the new one so a
    // stale intercepted code cannot be replayed after a newer one is verified.
    await authRepository.invalidateActiveOtps(input.email);
    await authRepository.createOtpRequest(input.email, otpHash);
  },

  async verifyOtp(
    input: OtpVerifyInput,
    ctx: VerifyOtpCtx,
  ): Promise<VerifyOtpResult> {
    const user = await authRepository.findUserByEmail(input.email);
    if (!user) throw Errors.userNotFound();

    const otpRequest = await authRepository.findLatestOtpRequest(input.email);

    if (!otpRequest) throw Errors.otpNotFound();
    if (otpRequest.expiresAt <= new Date()) throw Errors.otpExpired();
    if (otpRequest.attempts >= MAX_OTP_ATTEMPTS) throw Errors.otpLocked();

    const isValid = await bcrypt.compare(input.otp, otpRequest.otpHash);

    if (!isValid) {
      await authRepository.incrementOtpAttempts(otpRequest.id);
      const remainingAttempts = MAX_OTP_ATTEMPTS - (otpRequest.attempts + 1);

      //TODO: send email to user warning about too many failed attempts - so if he is not the one trying to login, he can take action to secure his account before lockout occurs. This is especially important if we decide to increase MAX_OTP_ATTEMPTS in the future.

      if (remainingAttempts <= 0) {
        throw Errors.otpLocked();
      }

      throw Errors.invalidOtp(
        `Invalid OTP. You have ${remainingAttempts} attempts remaining.`,
      );
    }

    await authRepository.markOtpVerified(otpRequest.id);
    await authRepository.markEmailVerified(user.id, user.orgId);

    const accessToken = await signAccessToken({
      userId: user.id,
      orgId: user.orgId,
      role: user.role,
    });

    const refreshToken = generateRefreshToken();
    const refreshTokenHash = hashToken(refreshToken);

    await authRepository.createSession({
      userId: user.id,
      orgId: user.orgId,
      refreshTokenHash,
      ipAddress: ctx.ipAddress,
      userAgent: ctx.userAgent,
      expiresAt: refreshTokenExpiry(),
    });

    const interimUser = {
      id: user.id,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      role: user.role,
      orgId: user.orgId,
    };

    return {
      accessToken,
      refreshToken,
      user: interimUser,
    };
  },

  async refreshSession(
    refreshToken: string | undefined,
  ): Promise<{ accessToken: string }> {
    if (!refreshToken) throw Errors.missingRefreshToken();

    const refreshTokenHash = hashToken(refreshToken);
    const session =
      await authRepository.findActiveSessionByRefreshToken(refreshTokenHash);
    if (!session) throw Errors.sessionExpired();

    const user = await authRepository.findUserById(session.userId);
    if (!user) throw Errors.userNotFound();

    const accessToken = await signAccessToken({
      userId: user.id,
      orgId: user.orgId,
      role: user.role,
    });

    await authRepository.updateSessionLastUsedAt(session.id, session.userId);

    return { accessToken };
  },

  async logout(refreshToken?: string): Promise<void> {
    // No token means there's nothing to revoke — logout should always succeed
    // from the client's perspective, not error out for an already-gone session.
    if (!refreshToken) return;

    const refreshTokenHash = hashToken(refreshToken);
    const session =
      await authRepository.findActiveSessionByRefreshToken(refreshTokenHash);

    if (session) {
      await authRepository.revokeSession(session.id, session.userId);
    }
  },

  async getMe(userId: string) {
    const user = await authRepository.findUserById(userId);
    if (!user) throw Errors.userNotFound();
    return user;
  },

  async listSessions(userId: string) {
    return authRepository.findUserActiveSessions(userId);
  },

  async getSession(sessionId: string, userId: string) {
    const session = await authRepository.findSessionById(sessionId, userId);
    if (!session) throw Errors.sessionNotFound();
    return session;
  },

  async revokeSession(
    sessionId: string,
    userId: string,
    refreshTokenHash: string | undefined,
  ): Promise<{ isCurrentSession: boolean }> {
    const session = await authRepository.findSessionById(sessionId, userId);
    if (!session) throw Errors.sessionNotFound();

    const sessionWithRefreshToken = refreshTokenHash
      ? await authRepository.findActiveSessionByRefreshToken(refreshTokenHash)
      : null;

    const isCurrentSession = refreshTokenHash
      ? sessionWithRefreshToken?.id === sessionId
      : false;

    await authRepository.revokeSession(sessionId, userId);

    return { isCurrentSession };
  },

  async revokeAllSessions(userId: string): Promise<void> {
    await authRepository.revokeAllUserSessions(userId);
  },
};
