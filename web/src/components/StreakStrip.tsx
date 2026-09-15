import { useStreak } from "../lib/streak";

const DAY_LABELS = ["Pz", "Pt", "Sa", "Ça", "Pe", "Cu", "Ct"];

function localISO(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

/**
 * The last seven days, lit where the streak covers them. The server only
 * keeps the run length and the day it was last extended, which is enough
 * to draw exactly this: the run counts back from that day.
 */
function StreakStrip() {
  const { data } = useStreak();
  const streak = data?.streak ?? 0;
  const last = data?.lastStudyDate ?? null;

  const today = new Date();
  const days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(today);
    d.setDate(today.getDate() - (6 - i));
    return d;
  });
  const lastIndex = last ? days.findIndex((d) => localISO(d) === last) : -1;
  const lit = (i: number) => lastIndex !== -1 && i <= lastIndex && lastIndex - i < streak;
  const todayDone = last === localISO(today);

  return (
    <div className="flex items-center gap-3 rounded-3xl bg-white/80 px-4 py-3 ring-1 ring-stone-200">
      <div className="flex shrink-0 items-baseline gap-1">
        <span className="text-2xl" aria-hidden="true">
          🔥
        </span>
        <span className="text-2xl font-extrabold tabular-nums text-stone-800">{streak}</span>
        <span className="text-xs font-bold text-stone-400">gün</span>
      </div>
      <ol className="ml-auto flex gap-1.5" aria-label="Son yedi gün">
        {days.map((d, i) => {
          const on = lit(i);
          const isToday = i === 6;
          return (
            <li key={i} className="flex flex-col items-center gap-1">
              <span
                className={`flex h-7 w-7 items-center justify-center rounded-full text-[11px] font-extrabold ${
                  on
                    ? "bg-gradient-to-br from-amber-300 to-orange-500 text-white shadow-[0_2px_0_0_var(--color-orange-600)]"
                    : isToday
                      ? "bg-white text-stone-400 ring-2 ring-dashed ring-amber-300"
                      : "bg-stone-100 text-stone-300"
                }`}
                aria-label={`${DAY_LABELS[d.getDay()]}${on ? ", çalışıldı" : ""}`}
              >
                {on ? "✓" : ""}
              </span>
              <span className={`text-[9px] font-bold uppercase ${isToday ? "text-amber-600" : "text-stone-400"}`}>{DAY_LABELS[d.getDay()]}</span>
            </li>
          );
        })}
      </ol>
      {!todayDone && streak > 0 && (
        <span className="sr-only">Bugün henüz çalışmadın</span>
      )}
    </div>
  );
}

export default StreakStrip;
