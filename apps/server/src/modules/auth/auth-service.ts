import crypto from "crypto";

import type {
  OtpRequestInput,
  OtpVerifyInput,
  SignupInput,
} from "@splexa-group/shared/schemas";
import bcrypt from "bcryptjs";

import {
  MAX_OTP_ATTEMPTS,
  MAX_OTP_REQUESTS_PER_HOUR,
} from "@/config/constants";
import { AuditAction } from "@/enums/audit.enums";
import { logActivity } from "@/lib/activity-logger";
import { emailProvider } from "@/lib/integrations/email";
import { Errors } from "@/lib/utils/errors";
import { signAccessToken } from "@/lib/utils/jwt";
import type {
  RequestCtx,
  VerifyOtpCtx,
  VerifyOtpResult,
} from "@/types/auth.types";

import { authRepository } from "./auth-repository";
import {
  generateOtp,
  hashToken,
  maskEmail,
  otpExpiry,
  refreshTokenExpiry,
} from "./auth-utils";

export type { VerifyOtpResult };

export async function signup(
  input: SignupInput,
  ctx: RequestCtx,
): Promise<void> {
  const existing = await authRepository.findUserByEmail(input.email);
  if (existing) throw Errors.emailTaken();

  const count = await authRepository.countOtpRequestsInLastHour(input.email);
  if (count >= MAX_OTP_REQUESTS_PER_HOUR) throw Errors.otpRateLimited();

  const orgId = crypto.randomUUID();
  const userId = crypto.randomUUID();
  const otp = generateOtp();

  try {
    await emailProvider.sendOtp(input.email, otp);
  } catch {
    throw Errors.emailSendFailed();
  }

  await authRepository.createOrgAndUser(orgId, userId, input);
  const otpHash = await bcrypt.hash(otp, 10);
  await authRepository.createOtpRequest(input.email, otpHash, otpExpiry());

  await logActivity({
    orgId,
    userId,
    action: AuditAction.AUTH_OTP_SENT,
    ipAddress: ctx.ipAddress,
    metadata: { email: maskEmail(input.email) },
  });
}

export async function requestOtp(
  input: OtpRequestInput,
  ctx: RequestCtx,
): Promise<void> {
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

  await logActivity({
    action: AuditAction.AUTH_OTP_SENT,
    ipAddress: ctx.ipAddress,
    metadata: { email: maskEmail(input.email) },
  });
}

export async function verifyOtp(
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

    await logActivity({
      action: AuditAction.AUTH_LOGIN_FAILED,
      ipAddress: ctx.ipAddress,
      metadata: { email: maskEmail(input.email) },
    });

    if (newAttempts >= MAX_OTP_ATTEMPTS) {
      await logActivity({
        action: AuditAction.AUTH_ACCOUNT_LOCKED,
        ipAddress: ctx.ipAddress,
        metadata: { email: maskEmail(input.email) },
      });
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

  const refreshToken = crypto.randomBytes(64).toString("hex");
  const tokenHash = hashToken(refreshToken);

  await authRepository.createSession({
    userId: user.id,
    orgId: user.orgId,
    tokenHash,
    ipAddress: ctx.ipAddress,
    userAgent: ctx.userAgent,
    expiresAt: refreshTokenExpiry(),
  });

  await logActivity({
    orgId: user.orgId,
    userId: user.id,
    action: AuditAction.AUTH_OTP_VERIFIED,
    ipAddress: ctx.ipAddress,
    metadata: { email: maskEmail(input.email) },
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
}

export async function refreshSession(
  refreshToken: string | undefined,
  ctx: RequestCtx,
): Promise<{ accessToken: string }> {
  if (!refreshToken) throw Errors.missingToken();

  const tokenHash = hashToken(refreshToken);
  const session = await authRepository.findActiveSessionByTokenHash(tokenHash);
  if (!session) throw Errors.sessionExpired();

  const user = await authRepository.findUserById(session.userId);
  if (!user) throw Errors.userNotFound();

  const accessToken = await signAccessToken({
    userId: user.id,
    orgId: user.orgId,
    role: user.role,
  });

  await authRepository.updateSessionLastUsed(session.id);

  await logActivity({
    orgId: user.orgId,
    userId: user.id,
    action: AuditAction.AUTH_REFRESH,
    ipAddress: ctx.ipAddress,
    metadata: {},
  });

  return { accessToken };
}

export async function logout(
  refreshToken: string | undefined,
  ctx: RequestCtx,
): Promise<void> {
  if (!refreshToken) throw Errors.missingToken();

  const tokenHash = hashToken(refreshToken);
  const session = await authRepository.findActiveSessionByTokenHash(tokenHash);

  if (session) {
    await authRepository.revokeSession(session.id);
    await logActivity({
      orgId: session.orgId,
      userId: session.userId,
      action: AuditAction.AUTH_LOGOUT,
      ipAddress: ctx.ipAddress,
      metadata: {},
    });
  }
}

export async function getMe(userId: string) {
  const user = await authRepository.findUserById(userId);
  if (!user) throw Errors.userNotFound();
  return user;
}

export async function listSessions(userId: string) {
  return authRepository.findUserActiveSessions(userId);
}

export async function getSession(sessionId: string, userId: string) {
  const session = await authRepository.findSessionById(sessionId, userId);
  if (!session) throw Errors.sessionNotFound();
  return session;
}

export async function revokeSession(
  sessionId: string,
  userId: string,
  orgId: string,
  ctx: RequestCtx,
): Promise<void> {
  const session = await authRepository.findSessionById(sessionId, userId);
  if (!session) throw Errors.sessionNotFound();

  await authRepository.revokeSession(sessionId);

  await logActivity({
    orgId,
    userId,
    action: AuditAction.AUTH_SESSION_REVOKED,
    resourceType: "session",
    resourceId: sessionId,
    ipAddress: ctx.ipAddress,
    metadata: {},
  });
}

export async function revokeAllSessions(
  userId: string,
  orgId: string,
  ctx: RequestCtx,
): Promise<void> {
  await authRepository.revokeAllUserSessions(userId);

  await logActivity({
    orgId,
    userId,
    action: AuditAction.AUTH_ALL_SESSIONS_REVOKED,
    ipAddress: ctx.ipAddress,
    metadata: {},
  });
}
