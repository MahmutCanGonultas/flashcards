/**
 * The learner's day. It runs from 04:00 to 04:00 in the learner's zone, not
 * midnight to midnight: a session at 00:30 still belongs to the evening
 * before, so it counts against that day's new words and its reviews come
 * back the next evening rather than an hour later.
 *
 * The web app has the same rule in web/src/lib/day.ts (device local time).
 */

/** "Yarın" hangi saat dilimine göre yarın: öğrencininki. */
export const LEARNER_TIMEZONE = process.env.LEARNER_TIMEZONE ?? "Europe/Istanbul";
/** The hour a new learner day starts. */
export const DAY_ROLLOVER_HOUR = 4;

const HOUR_MS = 3_600_000;

/** Bir saat diliminin UTC'ye göre farkı (ms), o tarihte. */
export function timezoneOffsetMs(timeZone: string, at: Date): number {
  try {
    const parts = new Intl.DateTimeFormat("en-US", {
      timeZone,
      hour12: false,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    }).formatToParts(at);
    const get = (type: string) => Number(parts.find((p) => p.type === type)?.value ?? "0");
    const asUTC = Date.UTC(get("year"), get("month") - 1, get("day"), get("hour") % 24, get("minute"), get("second"));
    return asUTC - Math.floor(at.getTime() / 1000) * 1000;
  } catch {
    return 0;
  }
}

/** The learner day `now` falls in, as 'YYYY-MM-DD': the local date of four hours earlier. */
export function learnerDay(now: Date = new Date()): string {
  const shifted = new Date(now.getTime() - DAY_ROLLOVER_HOUR * HOUR_MS);
  const local = new Date(shifted.getTime() + timezoneOffsetMs(LEARNER_TIMEZONE, shifted));
  return local.toISOString().slice(0, 10);
}

/** The instant a learner day starts (04:00 local), `plusDays` after `day`. */
export function dayStart(day: string, plusDays = 0): Date {
  const [year, month, date] = day.split("-").map(Number);
  const wall = Date.UTC(year, month - 1, date + plusDays, DAY_ROLLOVER_HOUR);
  // The offset is read at the guess and again at the result, so a zone
  // that changes its clocks near 04:00 still lands on the right instant.
  const guess = wall - timezoneOffsetMs(LEARNER_TIMEZONE, new Date(wall));
  return new Date(wall - timezoneOffsetMs(LEARNER_TIMEZONE, new Date(guess)));
}
