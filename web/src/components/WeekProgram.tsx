import { Link } from "react-router-dom";
import type { Card } from "../types";
import { hasStarted } from "../lib/path";
import { hasWeekText } from "../content/weeks";
import { familyStyle } from "../lib/palette";
import { tintStyle } from "../lib/tint";
import { primeSpeech } from "../lib/speech";
import { WEEK_DAYS, lookBack, lookBackHref, testHref, wordsOfWeek, type DayTask } from "../lib/programme";
import type { WeekCounts } from "../lib/plan";

/**
 * "Bu hafta": the programme week on the home page. Its theme, its ten words
 * (the ones met so far by name, the rest still to come), the seven days and
 * what each is for, and the week's four pieces of work. Every piece is open
 * every day; today's is the green one.
 */
function WeekProgram({ deckId, cards, week }: { deckId: number; cards: Card[]; week: WeekCounts }) {
  if (week.number === null) return null;
  const n = week.number;
  const words = wordsOfWeek(cards, n);
  const met = words.filter(hasStarted);
  const back = lookBack(cards, n);
  const today = WEEK_DAYS[week.weekday];
  const slots = Array.from({ length: Math.max(week.target, words.length) }, (_, i) => words[i] ?? null);

  const actions: { task: DayTask; label: string; to: string | null }[] = [
    { task: "reading", label: "Okuma", to: hasWeekText(n) ? `/hafta/${n}/okuma` : null },
    { task: "translation", label: "Çeviri", to: hasWeekText(n) ? `/hafta/${n}/ceviri` : null },
    { task: "test", label: "Haftanın testi", to: met.length > 0 ? testHref(deckId, met.map((c) => c.id)) : null },
  ];

  return (
    <section style={familyStyle("ocean")} className="card-3d mt-5 rounded-[22px] p-4" aria-label="Bu hafta">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[12px] font-black uppercase tracking-[0.12em] text-ocean-ink">Bu hafta</p>
          <h2 className="mt-0.5 text-[22px] font-black leading-tight text-ink">
            Hafta {n}
            {week.theme && <span className="text-graphite"> · {week.theme}</span>}
          </h2>
        </div>
        <span className="shrink-0 rounded-full bg-ocean-soft px-2.5 py-1 text-[13px] font-black tabular-nums text-ocean-ink">
          {week.met}/{week.target} kelime
        </span>
      </div>

      {/* The week's words: met ones by name in their colour, the rest still to come. */}
      <ul className="mt-3 flex flex-wrap gap-1.5">
        {slots.map((card, i) =>
          card && hasStarted(card) ? (
            <li key={card.id} style={tintStyle(card)} className="rounded-full tint-ground px-2.5 py-0.5 text-[13px] font-black text-white">
              {card.front}
            </li>
          ) : (
            <li key={card?.id ?? `slot-${i}`} aria-label="sırada" className="rounded-full bg-paper-deep px-2.5 py-0.5 text-[13px] font-black text-hare">
              ?
            </li>
          ),
        )}
      </ul>

      {/* The seven days and what each is for; today in blue. */}
      <ol className="mt-4 grid grid-cols-7 gap-1">
        {WEEK_DAYS.map((day, i) => {
          const isToday = i === week.weekday;
          return (
            <li
              key={day.short}
              aria-current={isToday ? "date" : undefined}
              className={`flex flex-col items-center rounded-xl px-0.5 py-1.5 text-center ${isToday ? "bg-ocean text-white" : i < week.weekday ? "text-hare" : "bg-paper-deep text-graphite"}`}
            >
              <span className="text-[11px] font-black uppercase">{day.short}</span>
              <span className="mt-0.5 text-[10px] font-bold leading-tight">{day.task === "new" ? day.label.split(" ")[0] + " yeni" : day.label.split(" ")[0]}</span>
            </li>
          );
        })}
      </ol>
      <p className="mt-3 text-[14px] font-bold leading-snug text-graphite">
        Bugün: <span className="font-black text-ink">{today.label}</span>. Kartlar ve egzersiz her gün.
      </p>

      <div className="mt-3 grid grid-cols-3 gap-2">
        {actions.map((action) => {
          const primary = action.task === today.task;
          const cls = `flex min-h-12 items-center justify-center rounded-2xl px-1 text-center text-[12px] font-black uppercase leading-tight tracking-[0.04em] ${
            primary ? "face bg-grass text-white shadow-button press-3d" : "border-2 border-rule bg-white text-ocean-ink shadow-edge press"
          }`;
          return action.to ? (
            <Link key={action.task} to={action.to} onClick={primeSpeech} className={cls}>
              {action.label}
            </Link>
          ) : (
            <span key={action.task} className="flex min-h-12 items-center justify-center rounded-2xl bg-paper-deep px-1 text-center text-[12px] font-black uppercase leading-tight tracking-[0.04em] text-hare">
              {action.label}
            </span>
          );
        })}
      </div>
      {back.length > 0 && (
        <Link
          to={lookBackHref(deckId, back.map((c) => c.id))}
          onClick={primeSpeech}
          className={`mt-2 flex min-h-12 w-full items-center justify-center rounded-2xl text-[13px] font-black uppercase tracking-[0.06em] ${
            today.task === "test" ? "face bg-grass text-white shadow-button press-3d" : "border-2 border-rule bg-white text-ocean-ink shadow-edge press"
          }`}
        >
          Büyük tekrar · eski {back.length} kelime
        </Link>
      )}
    </section>
  );
}

export default WeekProgram;
