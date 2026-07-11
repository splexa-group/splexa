export interface RequestCtx {
  ipAddress: string;
}

export interface VerifyOtpCtx extends RequestCtx {
  userAgent: string;
}

export interface UserPublic {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
  orgId: string;
}

export interface VerifyOtpResult {
  accessToken: string;
  refreshToken: string;
  user: UserPublic;
}

export interface CreateSessionData {
  userId: string;
  orgId: string;
  refreshTokenHash: string;
  ipAddress: string;
  userAgent: string;
  expiresAt: Date;
}
