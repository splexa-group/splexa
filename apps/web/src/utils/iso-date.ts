/** Converts a YYYY-MM-DD date string to a full ISO-8601 datetime the backend accepts. */
export function toISODatetime(date: string | null | undefined): string | undefined {
  if (!date) return undefined;
  if (date.includes("T")) return date; // already a full datetime
  return `${date}T00:00:00.000Z`;
}
