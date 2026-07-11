import { UserRole } from "@splexa-group/shared/enums";

import { OTP_LOCKOUT_MS, OTP_RATE_WINDOW_MS } from "@/constants/auth";
import { prisma } from "@/db/client";
import { orgSelect } from "@/db/selects/org.select";
import { userSelect } from "@/db/selects/user.select";
import { msAgo } from "@/utils/date-time";
import { UUID } from "@/utils/misc";

import { otpExpiry } from "./auth.helper";
import { CreateSessionData } from "./auth.models";
import { SignupInput } from "./auth.schema";

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
  async createOrgAndUser(data: SignupInput, otpHash: string) {
    return prisma.$transaction(async (tx) => {
      const orgId = UUID();
      const userId = UUID();

      // Organization.createdBy and User.orgId are circular foreign keys — each
      // row needs the other's id before either exists, so ids are generated
      // up front and constraint checks are deferred to transaction commit.
      await tx.$executeRaw`SET CONSTRAINTS ALL DEFERRED`;

      await tx.organization.create({
        data: {
          id: orgId,
          name: data.orgName,
          practiceTypes: data.practiceTypes,
          firmType: data.firmType,
          city: data.city,
          state: data.state,
          createdBy: userId,
        },
      });

      await tx.user.create({
        data: {
          id: userId,
          orgId,
          firstName: data.firstName,
          lastName: data.lastName,
          email: data.email,
          phoneNumber: data.phoneNumber,
          designation: data.designation,
          role: UserRole.OWNER,
        },
        select: userSelect,
      });

      await tx.otpRequest.create({
        data: { email: data.email, otpHash, expiresAt: otpExpiry() },
      });
    });
  },

  async invalidateActiveOtps(email: string) {
    return prisma.otpRequest.updateMany({
      where: { email, verifiedAt: null, invalidatedAt: null },
      data: { invalidatedAt: new Date() },
    });
  },

  async createOtpRequest(email: string, otpHash: string) {
    return prisma.otpRequest.create({
      data: { email, otpHash, expiresAt: otpExpiry() },
    });
  },

  async countRecentOtpRequests(email: string): Promise<number> {
    const since = msAgo(OTP_RATE_WINDOW_MS);
    return prisma.otpRequest.count({
      where: { email, createdAt: { gt: since } },
    });
  },

  // Deliberately not filtered by expiresAt — the caller needs to tell "no OTP
  // was ever requested" apart from "one was requested but it expired," which
  // requires seeing the expired row rather than having it filtered out here.
  async findLatestOtpRequest(email: string) {
    return prisma.otpRequest.findFirst({
      where: { email, verifiedAt: null, invalidatedAt: null },
      orderBy: { createdAt: "desc" },
    });
  },

  async findLockedEmail(email: string, maxAttempts: number) {
    const since = msAgo(OTP_LOCKOUT_MS);
    return prisma.otpRequest.findFirst({
      where: {
        email,
        attempts: { gte: maxAttempts },
        createdAt: { gt: since },
      },
      orderBy: { createdAt: "desc" },
    });
  },

  async incrementOtpAttempts(id: string) {
    return prisma.otpRequest.update({
      where: { id },
      data: { attempts: { increment: 1 } },
    });
  },

  async markOtpVerified(id: string) {
    return prisma.otpRequest.update({
      where: { id },
      data: { verifiedAt: new Date() },
    });
  },

  async markEmailVerified(userId: string, orgId: string) {
    return prisma.user.updateMany({
      where: { id: userId, orgId },
      data: { emailVerified: true },
    });
  },

  async createSession(data: CreateSessionData) {
    return prisma.session.create({ data });
  },

  async findActiveSessionByRefreshToken(refreshTokenHash: string) {
    return prisma.session.findFirst({
      where: {
        refreshTokenHash,
        revokedAt: null,
        expiresAt: { gt: new Date() },
      },
    });
  },

  async updateSessionLastUsedAt(id: string, userId: string) {
    return prisma.session.updateMany({
      where: { id, userId },
      data: { lastUsedAt: new Date() },
    });
  },

  async revokeSession(id: string, userId: string) {
    return prisma.session.updateMany({
      where: { id, userId },
      data: { revokedAt: new Date() },
    });
  },

  async revokeAllUserSessions(userId: string) {
    return prisma.session.updateMany({
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
