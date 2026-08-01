import bcrypt from "bcryptjs";
import { describe, it, expect, vi, beforeEach } from "vitest";

import { emailProvider } from "@/integrations/email";
import { Errors } from "@/utils/errors";
import { signAccessToken } from "@/utils/jwt";

import * as authHelper from "../auth.helper";
import { authRepository } from "../auth.repository";
import { authService } from "../auth.service";

vi.mock("@prisma/client", () => {
  class PrismaClientKnownRequestError extends Error {
    code: string;
    constructor(
      message: string,
      { code }: { code: string; clientVersion: string },
    ) {
      super(message);
      this.code = code;
    }
  }
  return { Prisma: { PrismaClientKnownRequestError } };
});

vi.mock("../auth.repository", () => ({
  authRepository: {
    findUserByEmail: vi.fn(),
    findUserById: vi.fn(),
    createOrgAndUser: vi.fn(),
    invalidateActiveOtps: vi.fn(),
    createOtpRequest: vi.fn(),
    countRecentOtpRequests: vi.fn(),
    findLatestOtpRequest: vi.fn(),
    findLockedEmail: vi.fn(),
    incrementOtpAttempts: vi.fn(),
    markOtpVerified: vi.fn(),
    markEmailVerified: vi.fn(),
    createSession: vi.fn(),
    findActiveSessionByRefreshToken: vi.fn(),
    updateSessionLastUsedAt: vi.fn(),
    revokeSession: vi.fn(),
    revokeAllUserSessions: vi.fn(),
    findUserActiveSessions: vi.fn(),
    findSessionById: vi.fn(),
  },
}));

vi.mock("../auth.helper", () => ({
  generateOtp: vi.fn(),
  hashToken: vi.fn(),
  generateRefreshToken: vi.fn(),
  otpExpiry: vi.fn(),
  refreshTokenExpiry: vi.fn(),
}));

vi.mock("@/config/logger", () => ({
  logger: { error: vi.fn() },
}));

vi.mock("@/integrations/email", () => ({
  emailProvider: { sendOtp: vi.fn() },
}));

vi.mock("@/utils/jwt", () => ({
  signAccessToken: vi.fn(),
}));

vi.mock("bcryptjs", () => ({
  default: { hash: vi.fn(), compare: vi.fn() },
}));

const mockUser = {
  id: "user-1",
  orgId: "org-1",
  firstName: "Ada",
  lastName: "Lovelace",
  email: "ada@example.com",
  phoneNumber: "9999999999",
  designation: "ADVOCATE",
  role: "OWNER",
  emailVerified: false,
};

const signupInput = {
  firstName: "Ada",
  lastName: "Lovelace",
  email: "ada@example.com",
  phoneNumber: "9999999999",
  designation: "ADVOCATE",
  orgName: "Ada & Co",
  practiceTypes: ["CIVIL"],
  firmType: "SOLO",
  city: "Hyderabad",
  state: "TELANGANA",
};

const ctx = { ipAddress: "127.0.0.1", userAgent: "vitest" };
const otpVerifyInput = { email: mockUser.email, otp: "123456" };

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(authHelper.generateOtp).mockReturnValue("123456");
  vi.mocked(authHelper.hashToken).mockReturnValue("hashed-value");
  vi.mocked(authHelper.generateRefreshToken).mockReturnValue(
    "raw-refresh-token",
  );
  vi.mocked(authHelper.otpExpiry).mockReturnValue(
    new Date("2026-01-01T00:10:00Z"),
  );
  vi.mocked(authHelper.refreshTokenExpiry).mockReturnValue(
    new Date("2026-01-04T00:00:00Z"),
  );
  vi.mocked(bcrypt.hash).mockResolvedValue("otp-hash" as never);
});

describe("authService.signup", () => {
  it("throws emailTaken when the email is already registered", async () => {
    vi.mocked(authRepository.findUserByEmail).mockResolvedValue(
      mockUser as never,
    );

    await expect(authService.signup(signupInput as never)).rejects.toThrow(
      Errors.emailTaken(),
    );
    expect(emailProvider.sendOtp).not.toHaveBeenCalled();
  });

  it("throws otpRateLimited when too many recent OTP requests exist", async () => {
    vi.mocked(authRepository.findUserByEmail).mockResolvedValue(null);
    vi.mocked(authRepository.countRecentOtpRequests).mockResolvedValue(999);

    await expect(authService.signup(signupInput as never)).rejects.toThrow(
      Errors.otpRateLimited(),
    );
  });

  it("throws emailSendFailed when the OTP email fails to send", async () => {
    vi.mocked(authRepository.findUserByEmail).mockResolvedValue(null);
    vi.mocked(authRepository.countRecentOtpRequests).mockResolvedValue(0);
    vi.mocked(emailProvider.sendOtp).mockRejectedValue(new Error("smtp down"));

    await expect(authService.signup(signupInput as never)).rejects.toThrow(
      Errors.emailSendFailed(),
    );
    expect(authRepository.createOrgAndUser).not.toHaveBeenCalled();
  });

  it("creates the org and user when everything succeeds", async () => {
    vi.mocked(authRepository.findUserByEmail).mockResolvedValue(null);
    vi.mocked(authRepository.countRecentOtpRequests).mockResolvedValue(0);
    vi.mocked(emailProvider.sendOtp).mockResolvedValue(undefined);
    vi.mocked(authRepository.createOrgAndUser).mockResolvedValue(
      undefined as never,
    );

    await authService.signup(signupInput as never);

    expect(authRepository.createOrgAndUser).toHaveBeenCalledWith(
      signupInput,
      "otp-hash",
    );
  });

  it("converts a concurrent-signup unique-constraint violation into emailTaken", async () => {
    const { Prisma } = await import("@prisma/client");
    vi.mocked(authRepository.findUserByEmail).mockResolvedValue(null);
    vi.mocked(authRepository.countRecentOtpRequests).mockResolvedValue(0);
    vi.mocked(emailProvider.sendOtp).mockResolvedValue(undefined);
    vi.mocked(authRepository.createOrgAndUser).mockRejectedValue(
      new Prisma.PrismaClientKnownRequestError("unique violation", {
        code: "P2002",
        clientVersion: "test",
      }),
    );

    await expect(authService.signup(signupInput as never)).rejects.toThrow(
      Errors.emailTaken(),
    );
  });

  it("rethrows non-unique-constraint errors from createOrgAndUser", async () => {
    vi.mocked(authRepository.findUserByEmail).mockResolvedValue(null);
    vi.mocked(authRepository.countRecentOtpRequests).mockResolvedValue(0);
    vi.mocked(emailProvider.sendOtp).mockResolvedValue(undefined);
    vi.mocked(authRepository.createOrgAndUser).mockRejectedValue(
      new Error("db down"),
    );

    await expect(authService.signup(signupInput as never)).rejects.toThrow(
      "db down",
    );
  });
});

describe("authService.requestOtp", () => {
  it("throws userNotFound when there is no account for the email", async () => {
    vi.mocked(authRepository.findUserByEmail).mockResolvedValue(null);

    await expect(
      authService.requestOtp({ email: mockUser.email }),
    ).rejects.toThrow(Errors.userNotFound());
  });

  it("throws otpRateLimited when too many recent requests exist", async () => {
    vi.mocked(authRepository.findUserByEmail).mockResolvedValue(
      mockUser as never,
    );
    vi.mocked(authRepository.countRecentOtpRequests).mockResolvedValue(999);

    await expect(
      authService.requestOtp({ email: mockUser.email }),
    ).rejects.toThrow(Errors.otpRateLimited());
  });

  it("throws otpLocked when the email is locked out", async () => {
    vi.mocked(authRepository.findUserByEmail).mockResolvedValue(
      mockUser as never,
    );
    vi.mocked(authRepository.countRecentOtpRequests).mockResolvedValue(0);
    vi.mocked(authRepository.findLockedEmail).mockResolvedValue({
      id: "otp-1",
    } as never);

    await expect(
      authService.requestOtp({ email: mockUser.email }),
    ).rejects.toThrow(Errors.otpLocked());
  });

  it("throws emailSendFailed when delivery fails", async () => {
    vi.mocked(authRepository.findUserByEmail).mockResolvedValue(
      mockUser as never,
    );
    vi.mocked(authRepository.countRecentOtpRequests).mockResolvedValue(0);
    vi.mocked(authRepository.findLockedEmail).mockResolvedValue(null);
    vi.mocked(emailProvider.sendOtp).mockRejectedValue(new Error("smtp down"));

    await expect(
      authService.requestOtp({ email: mockUser.email }),
    ).rejects.toThrow(Errors.emailSendFailed());
    expect(authRepository.invalidateActiveOtps).not.toHaveBeenCalled();
  });

  it("invalidates old OTPs and creates a new one on success", async () => {
    vi.mocked(authRepository.findUserByEmail).mockResolvedValue(
      mockUser as never,
    );
    vi.mocked(authRepository.countRecentOtpRequests).mockResolvedValue(0);
    vi.mocked(authRepository.findLockedEmail).mockResolvedValue(null);
    vi.mocked(emailProvider.sendOtp).mockResolvedValue(undefined);

    await authService.requestOtp({ email: mockUser.email });

    expect(authRepository.invalidateActiveOtps).toHaveBeenCalledWith(
      mockUser.email,
    );
    expect(authRepository.createOtpRequest).toHaveBeenCalledWith(
      mockUser.email,
      "otp-hash",
    );
  });
});

describe("authService.verifyOtp", () => {
  it("throws userNotFound when there is no account", async () => {
    vi.mocked(authRepository.findUserByEmail).mockResolvedValue(null);

    await expect(authService.verifyOtp(otpVerifyInput, ctx)).rejects.toThrow(
      Errors.userNotFound(),
    );
  });

  it("throws otpNotFound when no OTP request was ever made", async () => {
    vi.mocked(authRepository.findUserByEmail).mockResolvedValue(
      mockUser as never,
    );
    vi.mocked(authRepository.findLatestOtpRequest).mockResolvedValue(null);

    await expect(authService.verifyOtp(otpVerifyInput, ctx)).rejects.toThrow(
      Errors.otpNotFound(),
    );
  });

  it("throws otpExpired when the OTP request has expired", async () => {
    vi.mocked(authRepository.findUserByEmail).mockResolvedValue(
      mockUser as never,
    );
    vi.mocked(authRepository.findLatestOtpRequest).mockResolvedValue({
      id: "otp-1",
      otpHash: "stored-hash",
      attempts: 0,
      expiresAt: new Date(Date.now() - 1000),
    } as never);

    await expect(authService.verifyOtp(otpVerifyInput, ctx)).rejects.toThrow(
      Errors.otpExpired(),
    );
  });

  it("throws otpLocked when attempts are already at the max", async () => {
    vi.mocked(authRepository.findUserByEmail).mockResolvedValue(
      mockUser as never,
    );
    vi.mocked(authRepository.findLatestOtpRequest).mockResolvedValue({
      id: "otp-1",
      otpHash: "stored-hash",
      attempts: 3,
      expiresAt: new Date(Date.now() + 60_000),
    } as never);

    await expect(authService.verifyOtp(otpVerifyInput, ctx)).rejects.toThrow(
      Errors.otpLocked(),
    );
  });

  it("increments attempts and throws invalidOtp on a wrong code", async () => {
    vi.mocked(authRepository.findUserByEmail).mockResolvedValue(
      mockUser as never,
    );
    vi.mocked(authRepository.findLatestOtpRequest).mockResolvedValue({
      id: "otp-1",
      otpHash: "stored-hash",
      attempts: 0,
      expiresAt: new Date(Date.now() + 60_000),
    } as never);
    vi.mocked(bcrypt.compare).mockResolvedValue(false as never);

    await expect(authService.verifyOtp(otpVerifyInput, ctx)).rejects.toThrow(
      "Invalid OTP. You have 2 attempts remaining.",
    );
    expect(authRepository.incrementOtpAttempts).toHaveBeenCalledWith("otp-1");
  });

  it("locks out once the final attempt is used", async () => {
    vi.mocked(authRepository.findUserByEmail).mockResolvedValue(
      mockUser as never,
    );
    vi.mocked(authRepository.findLatestOtpRequest).mockResolvedValue({
      id: "otp-1",
      otpHash: "stored-hash",
      attempts: 2,
      expiresAt: new Date(Date.now() + 60_000),
    } as never);
    vi.mocked(bcrypt.compare).mockResolvedValue(false as never);

    await expect(authService.verifyOtp(otpVerifyInput, ctx)).rejects.toThrow(
      Errors.otpLocked(),
    );
  });

  it("verifies, creates a session, and returns tokens on a correct code", async () => {
    vi.mocked(authRepository.findUserByEmail).mockResolvedValue(
      mockUser as never,
    );
    vi.mocked(authRepository.findLatestOtpRequest).mockResolvedValue({
      id: "otp-1",
      otpHash: "stored-hash",
      attempts: 0,
      expiresAt: new Date(Date.now() + 60_000),
    } as never);
    vi.mocked(bcrypt.compare).mockResolvedValue(true as never);
    vi.mocked(signAccessToken).mockResolvedValue("access-token");

    const result = await authService.verifyOtp(otpVerifyInput, ctx);

    expect(authRepository.markOtpVerified).toHaveBeenCalledWith("otp-1");
    expect(authRepository.markEmailVerified).toHaveBeenCalledWith(
      mockUser.id,
      mockUser.orgId,
    );
    expect(authRepository.createSession).toHaveBeenCalledWith({
      userId: mockUser.id,
      orgId: mockUser.orgId,
      refreshTokenHash: "hashed-value",
      ipAddress: ctx.ipAddress,
      userAgent: ctx.userAgent,
      expiresAt: expect.any(Date),
    });
    expect(result).toEqual({
      accessToken: "access-token",
      refreshToken: "raw-refresh-token",
      user: {
        id: mockUser.id,
        firstName: mockUser.firstName,
        lastName: mockUser.lastName,
        email: mockUser.email,
        role: mockUser.role,
        orgId: mockUser.orgId,
      },
    });
  });
});

describe("authService.refreshSession", () => {
  it("throws missingRefreshToken when no token is provided", async () => {
    await expect(authService.refreshSession(undefined)).rejects.toThrow(
      Errors.missingRefreshToken(),
    );
  });

  it("throws sessionExpired when no matching active session exists", async () => {
    vi.mocked(authRepository.findActiveSessionByRefreshToken).mockResolvedValue(
      null,
    );

    await expect(authService.refreshSession("raw-token")).rejects.toThrow(
      Errors.sessionExpired(),
    );
  });

  it("throws userNotFound when the session's user no longer exists", async () => {
    vi.mocked(authRepository.findActiveSessionByRefreshToken).mockResolvedValue(
      {
        id: "session-1",
        userId: "user-1",
      } as never,
    );
    vi.mocked(authRepository.findUserById).mockResolvedValue(null);

    await expect(authService.refreshSession("raw-token")).rejects.toThrow(
      Errors.userNotFound(),
    );
  });

  it("issues a new access token and bumps last-used on success", async () => {
    vi.mocked(authRepository.findActiveSessionByRefreshToken).mockResolvedValue(
      {
        id: "session-1",
        userId: "user-1",
      } as never,
    );
    vi.mocked(authRepository.findUserById).mockResolvedValue(mockUser as never);
    vi.mocked(signAccessToken).mockResolvedValue("new-access-token");

    const result = await authService.refreshSession("raw-token");

    expect(result).toEqual({ accessToken: "new-access-token" });
    expect(authRepository.updateSessionLastUsedAt).toHaveBeenCalledWith(
      "session-1",
      "user-1",
    );
  });
});

describe("authService.logout", () => {
  it("does nothing when no refresh token is provided", async () => {
    await expect(authService.logout(undefined)).resolves.toBeUndefined();
    expect(
      authRepository.findActiveSessionByRefreshToken,
    ).not.toHaveBeenCalled();
  });

  it("does nothing when the token doesn't match an active session", async () => {
    vi.mocked(authRepository.findActiveSessionByRefreshToken).mockResolvedValue(
      null,
    );

    await authService.logout("raw-token");

    expect(authRepository.revokeSession).not.toHaveBeenCalled();
  });

  it("revokes the matching session", async () => {
    vi.mocked(authRepository.findActiveSessionByRefreshToken).mockResolvedValue(
      {
        id: "session-1",
        userId: "user-1",
      } as never,
    );

    await authService.logout("raw-token");

    expect(authRepository.revokeSession).toHaveBeenCalledWith(
      "session-1",
      "user-1",
    );
  });
});

describe("authService.getMe", () => {
  it("throws userNotFound when the user doesn't exist", async () => {
    vi.mocked(authRepository.findUserById).mockResolvedValue(null);

    await expect(authService.getMe("user-1")).rejects.toThrow(
      Errors.userNotFound(),
    );
  });

  it("returns the user", async () => {
    vi.mocked(authRepository.findUserById).mockResolvedValue(mockUser as never);

    await expect(authService.getMe("user-1")).resolves.toEqual(mockUser);
  });
});

describe("authService.listSessions", () => {
  it("returns the repository's session list", async () => {
    const sessions = [{ id: "session-1" }];
    vi.mocked(authRepository.findUserActiveSessions).mockResolvedValue(
      sessions as never,
    );

    await expect(authService.listSessions("user-1")).resolves.toEqual(sessions);
  });
});

describe("authService.getSession", () => {
  it("throws sessionNotFound when the session doesn't belong to the user", async () => {
    vi.mocked(authRepository.findSessionById).mockResolvedValue(null);

    await expect(authService.getSession("session-1", "user-1")).rejects.toThrow(
      Errors.sessionNotFound(),
    );
  });

  it("returns the session", async () => {
    const session = { id: "session-1" };
    vi.mocked(authRepository.findSessionById).mockResolvedValue(
      session as never,
    );

    await expect(
      authService.getSession("session-1", "user-1"),
    ).resolves.toEqual(session);
  });
});

describe("authService.revokeSession", () => {
  it("throws sessionNotFound when the session doesn't belong to the user", async () => {
    vi.mocked(authRepository.findSessionById).mockResolvedValue(null);

    await expect(
      authService.revokeSession("session-1", "user-1", "hash"),
    ).rejects.toThrow(Errors.sessionNotFound());
  });

  it("reports isCurrentSession: false when no refresh token hash is given", async () => {
    vi.mocked(authRepository.findSessionById).mockResolvedValue({
      id: "session-1",
    } as never);

    const result = await authService.revokeSession(
      "session-1",
      "user-1",
      undefined,
    );

    expect(result).toEqual({ isCurrentSession: false });
    expect(
      authRepository.findActiveSessionByRefreshToken,
    ).not.toHaveBeenCalled();
    expect(authRepository.revokeSession).toHaveBeenCalledWith(
      "session-1",
      "user-1",
    );
  });

  it("reports isCurrentSession: true when the token belongs to the session being revoked", async () => {
    vi.mocked(authRepository.findSessionById).mockResolvedValue({
      id: "session-1",
    } as never);
    vi.mocked(authRepository.findActiveSessionByRefreshToken).mockResolvedValue(
      {
        id: "session-1",
      } as never,
    );

    const result = await authService.revokeSession(
      "session-1",
      "user-1",
      "hash",
    );

    expect(result).toEqual({ isCurrentSession: true });
  });

  it("reports isCurrentSession: false when the token belongs to a different session", async () => {
    vi.mocked(authRepository.findSessionById).mockResolvedValue({
      id: "session-1",
    } as never);
    vi.mocked(authRepository.findActiveSessionByRefreshToken).mockResolvedValue(
      {
        id: "session-2",
      } as never,
    );

    const result = await authService.revokeSession(
      "session-1",
      "user-1",
      "hash",
    );

    expect(result).toEqual({ isCurrentSession: false });
  });
});

describe("authService.revokeAllSessions", () => {
  it("revokes every session for the user", async () => {
    await authService.revokeAllSessions("user-1");

    expect(authRepository.revokeAllUserSessions).toHaveBeenCalledWith("user-1");
  });
});
