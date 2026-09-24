/**
 * The learner's day. It runs from 04:00 to 04:00, not midnight to
 * midnight: a session at 00:30 still belongs to the evening before, so it
 * counts against that day's new words and that day's streak, and a word due
 * "tomorrow" is due at 04:00, not an hour after midnight.
 *
 * The server has the same rule in backend/src/services/day.service.ts, in
 * the learner's time zone; here it is the device's local time.
 */

/** The hour a new learner day starts. */
export const DAY_ROLLOVER_HOUR = 4;

const pad = (n: number) => String(n).padStart(2, "0");

/** A local date as 'YYYY-MM-DD'. */
const ymd = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

/** The local calendar date the learner day of `now` is named after. */
function dateOf(now: number): Date {
  const d = new Date(now);
  if (d.getHours() < DAY_ROLLOVER_HOUR) d.setDate(d.getDate() - 1);
  d.setHours(DAY_ROLLOVER_HOUR, 0, 0, 0);
  return d;
}

/** The learner day `now` falls in, as 'YYYY-MM-DD': before 04:00 it is still yesterday. */
export const learnerDay = (now: number = Date.now()): string => ymd(dateOf(now));

/** When the learner day of `now` starts (04:00 local), or the one `plusDays` after it. */
export function learnerDayStart(now: number = Date.now(), plusDays = 0): number {
  const d = dateOf(now);
  d.setDate(d.getDate() + plusDays);
  return d.getTime();
}

/** When a learner day named 'YYYY-MM-DD' starts, `plusDays` after it. */
export function dayStart(day: string, plusDays = 0): number {
  const [year, month, date] = day.split("-").map(Number);
  return new Date(year, month - 1, date + plusDays, DAY_ROLLOVER_HOUR).getTime();
}

/** The learner day as a whole number, for picks that hold all day and change with the next. */
export function learnerDayNumber(now: number = Date.now()): number {
  const d = dateOf(now);
  return Math.floor(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()) / 86_400_000);
}
