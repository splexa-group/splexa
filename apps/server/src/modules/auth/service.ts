import bcrypt from "bcryptjs";

import { MAX_OTP_ATTEMPTS, MAX_OTP_REQUESTS_PER_HOUR } from "@/constants/auth";
import { emailProvider } from "@/integrations/email";
import type { VerifyOtpCtx, VerifyOtpResult } from "@/types/auth";
import {
  generateOtp,
  generateRefreshToken,
  generateUUID,
  hashToken,
} from "@/utils/crypto";
import { Errors } from "@/utils/errors";
import { signAccessToken } from "@/utils/jwt";

import { otpExpiry, refreshTokenExpiry } from "./helper";
import { authRepository } from "./repository";
import type { SignupInput, OtpRequestInput, OtpVerifyInput } from "./schema";

export type { VerifyOtpResult };

export const authService = {
  async signup(input: SignupInput): Promise<void> {
    const existing = await authRepository.findUserByEmail(input.email);
    if (existing) throw Errors.emailTaken();

    const count = await authRepository.countOtpRequestsInLastHour(input.email);
    if (count >= MAX_OTP_REQUESTS_PER_HOUR) throw Errors.otpRateLimited();

    const orgId = generateUUID();
    const userId = generateUUID();
    const otp = generateOtp();

    try {
      await emailProvider.sendOtp(input.email, otp);
    } catch {
      throw Errors.emailSendFailed();
    }

    await authRepository.createOrgAndUser(orgId, userId, input);
    const otpHash = await bcrypt.hash(otp, 10);
    await authRepository.createOtpRequest(input.email, otpHash, otpExpiry());
  },

  async requestOtp(input: OtpRequestInput): Promise<void> {
    const user = await authRepository.findUserByEmail(input.email);
    if (!user) throw Errors.userNotFound();

    const count = await authRepository.countOtpRequestsInLastHour(input.email);
    if (count >= MAX_OTP_REQUESTS_PER_HOUR) throw Errors.otpRateLimited();

    const locked = await authRepository.findRecentLockedOtp(
      input.email,
      MAX_OTP_ATTEMPTS,
    );
    if (locked) throw Errors.otpLocked();

    const otp = generateOtp();

    try {
      await emailProvider.sendOtp(input.email, otp);
    } catch {
      throw Errors.emailSendFailed();
    }

    const otpHash = await bcrypt.hash(otp, 10);
    await authRepository.createOtpRequest(input.email, otpHash, otpExpiry());
  },

  async verifyOtp(
    input: OtpVerifyInput,
    ctx: VerifyOtpCtx,
  ): Promise<VerifyOtpResult> {
    const user = await authRepository.findUserByEmail(input.email);
    if (!user) throw Errors.userNotFound();

    const otpRow = await authRepository.findLatestActiveOtp(input.email);
    if (!otpRow) throw Errors.otpNotFound();

    if (otpRow.attempts >= MAX_OTP_ATTEMPTS) throw Errors.otpLocked();

    const isValid = await bcrypt.compare(input.otp, otpRow.otpHash);

    if (!isValid) {
      await authRepository.incrementOtpAttempts(otpRow.id);
      const newAttempts = otpRow.attempts + 1;

      if (newAttempts >= MAX_OTP_ATTEMPTS) {
        // TODO: LOCK ACCOUNT
      }

      throw Errors.invalidOtp();
    }

    await authRepository.markOtpVerified(otpRow.id);
    await authRepository.markEmailVerified(user.id);

    const accessToken = await signAccessToken({
      userId: user.id,
      orgId: user.orgId,
      role: user.role,
    });

    const refreshToken = generateRefreshToken();
    const tokenHash = hashToken(refreshToken);

    await authRepository.createSession({
      userId: user.id,
      orgId: user.orgId,
      tokenHash,
      ipAddress: ctx.ipAddress,
      userAgent: ctx.userAgent,
      expiresAt: refreshTokenExpiry(),
    });

    return {
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        role: user.role,
        orgId: user.orgId,
      },
    };
  },

  async refreshSession(
    refreshToken: string | undefined,
  ): Promise<{ accessToken: string }> {
    if (!refreshToken) throw Errors.missingToken();

    const tokenHash = hashToken(refreshToken);
    const session =
      await authRepository.findActiveSessionByTokenHash(tokenHash);
    if (!session) throw Errors.sessionExpired();

    const user = await authRepository.findUserById(session.userId);
    if (!user) throw Errors.userNotFound();

    const accessToken = await signAccessToken({
      userId: user.id,
      orgId: user.orgId,
      role: user.role,
    });

    await authRepository.updateSessionLastUsed(session.id);

    return { accessToken };
  },

  async logout(refreshToken: string | undefined): Promise<void> {
    if (!refreshToken) throw Errors.missingToken();

    const tokenHash = hashToken(refreshToken);
    const session =
      await authRepository.findActiveSessionByTokenHash(tokenHash);

    if (session) {
      await authRepository.revokeSession(session.id);
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

  async revokeSession(sessionId: string, userId: string): Promise<void> {
    const session = await authRepository.findSessionById(sessionId, userId);
    if (!session) throw Errors.sessionNotFound();

    await authRepository.revokeSession(sessionId);
  },

  async revokeAllSessions(userId: string): Promise<void> {
    await authRepository.revokeAllUserSessions(userId);
  },
};
