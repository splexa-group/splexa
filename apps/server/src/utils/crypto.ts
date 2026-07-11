import crypto from "crypto";

export function generateOtp(): string {
  return crypto.randomInt(100000, 1_000_000).toString();
}

export function hashToken(token: string): string {
  return crypto.createHash("sha256").update(token).digest("hex");
}

export function UUID(): string {
  return crypto.randomUUID();
}

export function generateRefreshToken(): string {
  return crypto.randomBytes(64).toString("hex");
}
