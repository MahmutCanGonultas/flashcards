import { useStreak } from "../lib/streak";
import { learnerDayStart } from "../lib/day";
import { CheckIcon } from "./icons";

const DAY_LABELS = ["Pazar", "Pazartesi", "Salı", "Çarşamba", "Perşembe", "Cuma", "Cumartesi"];
const DAY_SHORT = ["Pz", "Pt", "Sa", "Ça", "Pe", "Cu", "Ct"];
const MONTHS = ["Ocak", "Şubat", "Mart", "Nisan", "Mayıs", "Haziran", "Temmuz", "Ağustos", "Eylül", "Ekim", "Kasım", "Aralık"];
function localISO(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

/**
 * The week so far: today's date, and seven days lit orange where the streak
 * covers them. Days are the learner's (lib/day.ts): at 00:30 it is still
 * the evening's day, the one a round finished now counts for.
 */
function StreakWeek() {
  const { data } = useStreak();
  const streak = data?.streak ?? 0;
  const last = data?.lastStudyDate ?? null;
  const today = new Date(learnerDayStart());
  const days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(today);
    d.setDate(today.getDate() - (6 - i));
    return d;
  });
  const lastIndex = last ? days.findIndex((d) => localISO(d) === last) : -1;
  const lit = (i: number) => lastIndex !== -1 && i <= lastIndex && lastIndex - i < streak;
  return (
    <div className="flex items-center justify-between gap-3">
      <p className="min-w-0 truncate text-[15px] font-extrabold text-graphite">
        {DAY_LABELS[today.getDay()]}, {today.getDate()} {MONTHS[today.getMonth()]}
      </p>
      <ol className="flex shrink-0 gap-[3px]" aria-label="Son yedi gün">
        {days.map((d, i) => (
          <li
            key={i}
            aria-label={`${DAY_LABELS[d.getDay()]}${lit(i) ? ", çalışıldı" : ""}`}
            className={`grid h-6 w-6 place-items-center rounded-full text-[9px] font-black ${
              lit(i) ? "bg-tangerine text-white" : i === 6 ? "border-2 border-dashed border-tangerine text-tangerine-ink" : "bg-paper-deep text-hare"
            }`}
          >
            {lit(i) ? <CheckIcon className="h-3 w-3" /> : DAY_SHORT[d.getDay()]}
          </li>
        ))}
      </ol>
    </div>
  );
}

export default StreakWeek;
