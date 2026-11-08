// Time helpers. All user-facing times are in the browser's local time zone;
// everything sent to the API is an ISO 8601 string with an offset.

export const SLOT_MINUTES = 15;
export const DURATION_OPTIONS = [15, 30, 45, 60, 90, 120, 180, 240] as const;

const pad = (value: number) => String(value).padStart(2, "0");

/** Local calendar date as YYYY-MM-DD. */
export function toDateInputValue(date: Date): string {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

/** Parses YYYY-MM-DD as local midnight. Returns null for anything else. */
export function parseDateInput(value: string): Date | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return null;
  const [year, month, day] = [Number(match[1]), Number(match[2]), Number(match[3])];
  const date = new Date(year, month - 1, day);
  const valid = date.getFullYear() === year && date.getMonth() === month - 1 && date.getDate() === day;
  return valid ? date : null;
}

/** The [from, to) window covering one local calendar day. */
export function dayWindow(dateValue: string): { from: string; to: string } | null {
  const start = parseDateInput(dateValue);
  if (!start) return null;
  const end = new Date(start);
  end.setDate(end.getDate() + 1);
  return { from: start.toISOString(), to: end.toISOString() };
}

/** Start times on the slot grid between two local hours, as HH:MM. */
export function timeSlots(firstHour = 7, lastHour = 22): string[] {
  const slots: string[] = [];
  for (let minutes = firstHour * 60; minutes <= lastHour * 60; minutes += SLOT_MINUTES) {
    slots.push(`${pad(Math.floor(minutes / 60))}:${pad(minutes % 60)}`);
  }
  return slots;
}

/** Combines a local date and HH:MM time into an ISO timestamp, plus an end time. */
export function bookingWindow(
  dateValue: string,
  time: string,
  durationMinutes: number,
): { startsAt: string; endsAt: string } | null {
  const day = parseDateInput(dateValue);
  const match = /^(\d{2}):(\d{2})$/.exec(time);
  if (!day || !match) return null;
  const start = new Date(day);
  start.setHours(Number(match[1]), Number(match[2]), 0, 0);
  const end = new Date(start.getTime() + durationMinutes * 60_000);
  return { startsAt: start.toISOString(), endsAt: end.toISOString() };
}

export function formatTime(iso: string, locale?: string): string {
  return new Date(iso).toLocaleTimeString(locale, { hour: "2-digit", minute: "2-digit" });
}

export function formatTimeRange(startIso: string, endIso: string, locale?: string): string {
  return `${formatTime(startIso, locale)} – ${formatTime(endIso, locale)}`;
}

export function formatDate(iso: string, locale?: string): string {
  return new Date(iso).toLocaleDateString(locale, { weekday: "short", day: "numeric", month: "short" });
}

export function formatDateTime(iso: string, locale?: string): string {
  return new Date(iso).toLocaleString(locale, { dateStyle: "medium", timeStyle: "short" });
}

export function formatDuration(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  if (hours === 0) return `${rest} min`;
  return rest === 0 ? `${hours} h` : `${hours} h ${rest} min`;
}
