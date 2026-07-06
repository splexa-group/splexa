import { UserRole } from "@splexa-group/shared/enums";

import { OTP_LOCKOUT_MINUTES, OTP_RATE_WINDOW_MS } from "@/constants/auth";
import { prisma } from "@/db/client";
import { orgSelect, userSelect } from "@/db/selects";

import type { SignupInput } from "./schema";

export const authRepository = {
  async findUserByEmail(email: string) {
    return prisma.user.findFirst({
      where: { email, deletedAt: null },
      select: userSelect,
    });
  },

  async findUserById(userId: string) {
    return prisma.user.findFirst({
      where: { id: userId, deletedAt: null },
      select: { ...userSelect, org: { select: orgSelect } },
    });
  },

  // Creates org, user, and initial OTP request atomically so partial failures
  // cannot leave a user with no verifiable OTP or an OTP with no user.
  async createOrgAndUser(
    orgId: string,
    userId: string,
    input: SignupInput,
    otpHash: string,
    otpExpiresAt: Date,
  ) {
    return prisma.$transaction(async (tx) => {
      await tx.$executeRaw`SET CONSTRAINTS ALL DEFERRED`;

      await tx.organization.create({
        data: {
          id: orgId,
          name: input.orgName,
          practiceTypes: input.practiceTypes,
          city: input.city,
          createdBy: userId,
        },
      });

      await tx.user.create({
        data: {
          id: userId,
          orgId,
          firstName: input.firstName,
          lastName: input.lastName,
          email: input.email,
          phoneNumber: input.phoneNumber,
          designation: input.designation,
          role: UserRole.OWNER,
        },
        select: userSelect,
      });

      await tx.otpRequest.create({
        data: { email: input.email, otpHash, expiresAt: otpExpiresAt },
      });
    });
  },

  // Invalidates all pending OTPs for an email before issuing a new one,
  // preventing replay of a stale code after a newer one has been verified.
  async invalidateActiveOtps(email: string): Promise<void> {
    await prisma.otpRequest.updateMany({
      where: { email, verifiedAt: null },
      data: { verifiedAt: new Date() },
    });
  },

  async createOtpRequest(email: string, otpHash: string, expiresAt: Date) {
    return prisma.otpRequest.create({
      data: { email, otpHash, expiresAt },
    });
  },

  async countRecentOtpRequests(email: string): Promise<number> {
    const since = new Date(Date.now() - OTP_RATE_WINDOW_MS);
    return prisma.otpRequest.count({
      where: { email, createdAt: { gt: since } },
    });
  },

  async findLatestActiveOtp(email: string) {
    return prisma.otpRequest.findFirst({
      where: { email, verifiedAt: null, expiresAt: { gt: new Date() } },
      orderBy: { createdAt: "desc" },
    });
  },

  async findLockedEmail(email: string, maxAttempts: number) {
    const since = new Date(Date.now() - OTP_LOCKOUT_MINUTES * 60 * 1000);
    return prisma.otpRequest.findFirst({
      where: {
        email,
        attempts: { gte: maxAttempts },
        createdAt: { gt: since },
      },
      orderBy: { createdAt: "desc" },
    });
  },

  async incrementOtpAttempts(id: string): Promise<void> {
    await prisma.otpRequest.update({
      where: { id },
      data: { attempts: { increment: 1 } },
    });
  },

  async markOtpVerified(id: string): Promise<void> {
    await prisma.otpRequest.update({
      where: { id },
      data: { verifiedAt: new Date() },
    });
  },

  async markEmailVerified(userId: string, orgId: string): Promise<void> {
    await prisma.user.updateMany({
      where: { id: userId, orgId },
      data: { emailVerified: true },
    });
  },

  async createSession(data: {
    userId: string;
    orgId: string;
    tokenHash: string;
    ipAddress: string;
    userAgent: string;
    expiresAt: Date;
  }) {
    return prisma.session.create({ data });
  },

  async findActiveSessionByTokenHash(tokenHash: string) {
    return prisma.session.findFirst({
      where: { tokenHash, revokedAt: null, expiresAt: { gt: new Date() } },
    });
  },

  async updateSessionLastUsed(id: string, userId: string): Promise<void> {
    await prisma.session.updateMany({
      where: { id, userId },
      data: { lastUsedAt: new Date() },
    });
  },

  async revokeSession(id: string, userId: string): Promise<void> {
    await prisma.session.updateMany({
      where: { id, userId },
      data: { revokedAt: new Date() },
    });
  },

  async revokeAllUserSessions(userId: string): Promise<void> {
    await prisma.session.updateMany({
      where: { userId, revokedAt: null },
      data: { revokedAt: new Date() },
    });
  },

  async findUserActiveSessions(userId: string) {
    return prisma.session.findMany({
      where: { userId, revokedAt: null, expiresAt: { gt: new Date() } },
      select: {
        id: true,
        ipAddress: true,
        userAgent: true,
        createdAt: true,
        lastUsedAt: true,
      },
      orderBy: { lastUsedAt: "desc" },
    });
  },

  async findSessionById(id: string, userId: string) {
    return prisma.session.findFirst({
      where: { id, userId },
      select: {
        id: true,
        ipAddress: true,
        userAgent: true,
        createdAt: true,
        lastUsedAt: true,
        revokedAt: true,
        expiresAt: true,
      },
    });
  },
};
