import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Converts a YYYY-MM-DD date string to a full ISO-8601 datetime the backend accepts. */
export function toISODatetime(date: string | null | undefined): string | undefined {
  if (!date) return undefined;
  if (date.includes("T")) return date; // already a full datetime
  return `${date}T00:00:00.000Z`;
}

export function maskEmail(email: string): string {
  const [local, domain] = email.split("@");
  if (!local || !domain) return email;
  return `${local[0]}***@${domain}`;
}
