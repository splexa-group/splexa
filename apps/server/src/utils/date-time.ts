export function msAgo(ms: number): Date {
  return new Date(Date.now() - ms);
}

export function msFromNow(ms: number): Date {
  return new Date(Date.now() + ms);
}

export function msToSeconds(ms: number): number {
  return Math.floor(ms / 1000);
}

export function msToMinutes(ms: number): number {
  return Math.floor(ms / (60 * 1000));
}
