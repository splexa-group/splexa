import bcrypt from "bcryptjs";

import { MAX_OTP_ATTEMPTS, MAX_OTP_REQUESTS_PER_HOUR } from "@/constants/auth";
import { emailProvider } from "@/integrations/email";
import { VerifyOtpCtx, VerifyOtpResult } from "@/models/auth";
import {
  generateOtp,
  generateRefreshToken,
  generateUUID,
  hashToken,
} from "@/utils/crypto";
import { Errors } from "@/utils/errors";
import { signAccessToken } from "@/utils/jwt";

import { otpExpiry, refreshTokenExpiry } from "./auth.helper";
import { authRepository } from "./auth.repository";
import { SignupInput, OtpRequestInput, OtpVerifyInput } from "./auth.schema";

export type { VerifyOtpResult };

export const authService = {
  async signup(input: SignupInput): Promise<void> {
    const existing = await authRepository.findUserByEmail(input.email);
    if (existing) throw Errors.emailTaken();

    const count = await authRepository.countRecentOtpRequests(input.email);
    if (count >= MAX_OTP_REQUESTS_PER_HOUR) throw Errors.otpRateLimited();

    const orgId = generateUUID();
    const userId = generateUUID();
    const otp = generateOtp();
    const otpHash = await bcrypt.hash(otp, 10);

    // Send email before writing to DB — if delivery fails nothing is persisted.
    try {
      await emailProvider.sendOtp(input.email, otp);
    } catch {
      throw Errors.emailSendFailed();
    }

    // Org, user, and OTP request are created atomically so there is never a
    // user with no verifiable OTP or an OTP with no owning user.
    await authRepository.createOrgAndUser(
      orgId,
      userId,
      input,
      otpHash,
      otpExpiry(),
    );
  },

  async requestOtp(input: OtpRequestInput): Promise<void> {
    const user = await authRepository.findUserByEmail(input.email);
    if (!user) throw Errors.userNotFound();

    const count = await authRepository.countRecentOtpRequests(input.email);
    if (count >= MAX_OTP_REQUESTS_PER_HOUR) throw Errors.otpRateLimited();

    const locked = await authRepository.findLockedEmail(
      input.email,
      MAX_OTP_ATTEMPTS,
    );
    if (locked) throw Errors.otpLocked();

    const otp = generateOtp();
    const otpHash = await bcrypt.hash(otp, 10);

    try {
      await emailProvider.sendOtp(input.email, otp);
    } catch {
      throw Errors.emailSendFailed();
    }

    // Invalidate all previous pending OTPs before issuing the new one so a
    // stale intercepted code cannot be replayed after a newer one is verified.
    await authRepository.invalidateActiveOtps(input.email);
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
      const remainingAttempts = MAX_OTP_ATTEMPTS - (otpRow.attempts + 1);

      //TODO: send email to user warning about too many failed attempts - so if he is not the one trying to login, he can take action to secure his account before lockout occurs. This is especially important if we decide to increase MAX_OTP_ATTEMPTS in the future.

      if (remainingAttempts <= 0) {
        throw Errors.otpLocked();
      }

      throw Errors.invalidOtp(
        `Invalid OTP. You have ${remainingAttempts} attempts remaining.`,
      );
    }

    await authRepository.markOtpVerified(otpRow.id);
    await authRepository.markEmailVerified(user.id, user.orgId);

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
    if (!refreshToken) throw Errors.missingRefreshToken();

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

    await authRepository.updateSessionLastUsed(session.id, session.userId);

    return { accessToken };
  },

  async logout(refreshToken: string | undefined): Promise<void> {
    if (!refreshToken) throw Errors.missingRefreshToken();

    const tokenHash = hashToken(refreshToken);
    const session =
      await authRepository.findActiveSessionByTokenHash(tokenHash);

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

  async revokeSession(sessionId: string, userId: string): Promise<void> {
    const session = await authRepository.findSessionById(sessionId, userId);
    if (!session) throw Errors.sessionNotFound();

    await authRepository.revokeSession(sessionId, userId);
  },

  async revokeAllSessions(userId: string): Promise<void> {
    await authRepository.revokeAllUserSessions(userId);
  },
};
