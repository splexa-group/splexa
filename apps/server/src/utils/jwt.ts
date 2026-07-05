import { TextEncoder } from "node:util";

import type { UserRole } from "@splexa-group/shared/enums";
import type { AuthUser } from "@splexa-group/shared/models";
import { jwtVerify, SignJWT } from "jose";

import { env } from "@/config/env";
import { RawJwtPayload } from "@/types/auth";

export async function signAccessToken(payload: {
  userId: string;
  orgId: string;
  role: string;
}): Promise<string> {
  const secret = new TextEncoder().encode(env.JWT_ACCESS_SECRET);

  return new SignJWT(payload as Record<string, unknown>)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(env.JWT_ACCESS_EXPIRY)
    .sign(secret);
}

export async function verifyAccessToken(token: string): Promise<AuthUser> {
  const secret = new TextEncoder().encode(env.JWT_ACCESS_SECRET);
  const { payload } = await jwtVerify<RawJwtPayload>(token, secret);
  return {
    userId: payload.userId,
    orgId: payload.orgId,
    role: payload.role as UserRole,
  };
}
