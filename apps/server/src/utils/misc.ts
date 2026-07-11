import crypto from "crypto";

export function UUID(): string {
  return crypto.randomUUID();
}
