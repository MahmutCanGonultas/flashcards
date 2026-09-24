import { useState } from "react";
import { usePushReminders } from "../lib/reminders";
import { dismissPrompt, promptDismissed } from "../lib/reminderPrompt";
import Button from "./Button";
import Mascot from "./Mascot";

const HOURS = [9, 13, 18, 20, 21, 22, 23];
/** The evening hours the prompt after a round offers. */
const EVENING = [20, 21, 22, 23];
const label = (h: number) => `${String(h).padStart(2, "0")}:00`;
/** "22:00'de", "23:00'te": the hour as it is read aloud decides the ending. */
const UNIT_ENDING = ["", "de", "de", "te", "te", "te", "da", "de", "de", "da"];
const atHour = (h: number) => `${label(h)}'${h % 10 !== 0 ? UNIT_ENDING[h % 10] : h === 20 ? "de" : "da"}`;

/** One hour chip: white with a grey border, blue when it's the chosen one. */
const chip = (active: boolean) =>
  `min-h-10 rounded-full border-2 px-3.5 text-xs font-extrabold transition-colors duration-150 ${
    active ? "border-ocean bg-ocean-soft text-ocean-ink" : "border-rule bg-white text-ink hover:bg-paper-deep"
  }`;

/**
 * "Tonton her akşam haber versin": daily push reminders, on or off, at an
 * hour of the learner's choosing. Sent only on days with cards waiting.
 *
 * The "prompt" variant is the question asked once at the end of a round of
 * cards, to someone who has never answered the browser's permission
 * question: an evening hour, yes or not now. Not now keeps it quiet for a
 * week (lib/reminderPrompt.ts). In a Safari tab, where there is no push at
 * all, it says how to install the app first.
 */
function ReminderCard({ variant = "card", defaultHour = 20 }: { variant?: "card" | "line" | "prompt"; defaultHour?: number }) {
  const reminders = usePushReminders();
  const [hour, setHour] = useState(defaultHour);
  const [note, setNote] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  // The prompt: read once, when it first shows; "Şimdi değil" and "Evet" settle it for this visit.
  const [quiet, setQuiet] = useState(() => variant === "prompt" && promptDismissed());
  const [enabledAt, setEnabledAt] = useState<number | null>(null);

  if (variant === "prompt") {
    const later = () => {
      dismissPrompt();
      setQuiet(true);
    };
    const title = <p className="text-[17px] font-black leading-snug text-ink">Her akşam haber vereyim mi?</p>;
    const panel = "card-3d flex gap-3 rounded-[20px] p-4 text-left animate-rise-in";
    if (enabledAt !== null) {
      return (
        <section className={`${panel} items-center`}>
          <Mascot mood="happy" size={44} lively={false} className="shrink-0" />
          <p className="min-w-0 text-[15px] font-extrabold leading-snug text-ink">Tamam: kelimelerin beklediği akşamlar saat {atHour(enabledAt)} haber veririm.</p>
        </section>
      );
    }
    if (quiet) return null;
    if (!reminders.supported) {
      // Installed and still no push: this device can't; nothing to ask.
      if (reminders.standalone) return null;
      return (
        <section className={panel}>
          <Mascot mood="idle" size={44} lively={false} className="shrink-0" />
          <div className="min-w-0 flex-1">
            {title}
            <p className="mt-1 text-[14px] font-bold leading-snug text-graphite">Bildirim için önce Kelimece'yi Ana Ekran'a ekle: Paylaş → Ana Ekrana Ekle. Sonra oradan aç.</p>
            <button type="button" onClick={later} className="-ml-2 mt-2 min-h-10 rounded-xl px-2 text-[13px] font-black uppercase tracking-[0.08em] text-ocean-ink hover:bg-ocean-soft">
              Şimdi değil
            </button>
          </div>
        </section>
      );
    }
    // Only someone never asked: on, turned off here, or refused are all answers already.
    if (reminders.permission !== "default" && note === null) return null;
    return (
      <section className="card-3d rounded-[20px] p-4 text-left animate-rise-in">
        <div className="flex items-start gap-3">
          <Mascot mood="idle" size={44} lively={false} className="shrink-0" />
          <div className="min-w-0 flex-1">
            {title}
            <p className="mt-1 text-[14px] font-bold leading-snug text-graphite">Kelimelerin beklediği akşamlar seçtiğin saatte tek bir bildirim gelir.</p>
          </div>
        </div>
        <div className="mt-3 grid grid-cols-4 gap-1.5" role="radiogroup" aria-label="Saat">
          {EVENING.map((h) => (
            <button key={h} type="button" role="radio" aria-checked={hour === h} onClick={() => setHour(h)} className={`${chip(hour === h)} !px-0`}>
              {label(h)}
            </button>
          ))}
        </div>
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <Button
            size="sm"
            variant="go"
            className="flex-1 whitespace-nowrap"
            isLoading={reminders.enable.isPending}
            onClick={() =>
              reminders.enable.mutate(hour, {
                onSuccess: () => setEnabledAt(hour),
                onError: () => setNote("İzin verilmedi. İstersen sonra Kartlarım'ın altından açarsın."),
              })
            }
          >
            Evet, {atHour(hour)}
          </Button>
          <Button size="sm" variant="ghost" onClick={later}>
            Şimdi değil
          </Button>
        </div>
        {note && <p className="mt-2 text-[13px] font-bold text-berry-ink">{note}</p>}
      </section>
    );
  }

  if (variant === "line") {
    const link = "font-black text-ocean-ink underline decoration-ocean/50 decoration-2 underline-offset-4";
    const line = "rounded-2xl border-2 border-rule bg-paper-deep px-3.5 py-2.5 text-[13px] font-bold leading-relaxed text-graphite";
    if (!reminders.supported) {
      return <p className={line}>{reminders.standalone ? "Bu cihaz bildirimleri desteklemiyor." : "Bildirim için uygulamayı Ana Ekran'a ekle (Paylaş → Ana Ekrana Ekle)."}</p>;
    }
    if (reminders.subscribed) {
      return (
        <p className={line}>
          Hatırlatma açık · {reminders.hour !== null ? label(reminders.hour) : ""} ·{" "}
          <button type="button" className={link} onClick={() => reminders.disable.mutate()}>
            Kapat
          </button>
          {note && <span className="ml-2">{note}</span>}
        </p>
      );
    }
    if (reminders.permission === "denied") {
      return <p className={line}>Bildirim izni kapalı — Ayarlar → Kelimece → Bildirimler.</p>;
    }
    return (
      <div className={line}>
        {!open ? (
          <p>
            Bildirimler kapalı.{" "}
            <button type="button" className={link} onClick={() => setOpen(true)}>
              Tonton haber versin
            </button>
          </p>
        ) : (
          <div className="flex flex-wrap items-center gap-2">
            <span>Saat:</span>
            {HOURS.map((h) => (
              <button key={h} type="button" role="radio" aria-checked={hour === h} onClick={() => setHour(h)} className={chip(hour === h)}>
                {label(h)}
              </button>
            ))}
            <button
              type="button"
              disabled={reminders.enable.isPending}
              onClick={() => reminders.enable.mutate(hour, { onError: () => setNote("İzin verilmedi.") })}
              className="min-h-10 rounded-full bg-grass px-4 text-xs font-black uppercase tracking-[0.1em] text-white shadow-button press-3d"
            >
              Aç
            </button>
            {note && <span className="text-accent">{note}</span>}
          </div>
        )}
      </div>
    );
  }

  const panel = "rounded-3xl card-3d p-4";

  if (!reminders.supported) {
    return (
      <section className={`flex items-center gap-3 ${panel}`}>
        <Mascot mood="idle" size={44} lively={false} className="shrink-0" />
        <div className="min-w-0">
          <p className="text-sm font-extrabold text-ink">Günlük hatırlatma</p>
          <p className="mt-0.5 text-xs text-graphite">
            {reminders.standalone
              ? "Bu cihaz bildirimleri desteklemiyor."
              : "Uygulamayı Ana Ekran'a ekleyince (Paylaş → Ana Ekrana Ekle) Tonton sana bildirim gönderebilir."}
          </p>
        </div>
      </section>
    );
  }

  if (reminders.subscribed) {
    return (
      <section className={`flex items-center gap-3 ${panel}`}>
        <Mascot mood="happy" size={44} lively={false} className="shrink-0" />
        <div className="min-w-0 flex-1">
          <p className="text-sm font-extrabold text-ink">Hatırlatma açık · {reminders.hour !== null ? label(reminders.hour) : ""}</p>
          <p className="mt-0.5 text-xs text-graphite">Kartların bekleyen günlerde Tonton o saatte haber verir; boş günlerde susar.</p>
          {note && <p className="mt-1 text-xs font-bold text-moss">{note}</p>}
        </div>
        <div className="flex shrink-0 flex-col gap-1">
          <Button
            size="sm"
            variant="secondary"
            isLoading={reminders.test.isPending}
            onClick={() =>
              reminders.test.mutate(undefined, {
                onSuccess: (r) => setNote(r.sent > 0 ? "Deneme bildirimi gitti." : "Gönderilemedi."),
                onError: () => setNote("Gönderilemedi."),
              })
            }
          >
            Dene
          </Button>
          <Button size="sm" variant="ghost" isLoading={reminders.disable.isPending} onClick={() => reminders.disable.mutate()}>
            Kapat
          </Button>
        </div>
      </section>
    );
  }

  const denied = reminders.permission === "denied";

  return (
    <section className={panel}>
      <div className="flex items-center gap-3">
        <Mascot mood="idle" size={44} lively={false} className="shrink-0" />
        <div className="min-w-0 flex-1">
          <p className="text-sm font-extrabold text-ink">Tonton her gün haber versin mi?</p>
          <p className="mt-0.5 text-xs text-graphite">
            {denied
              ? "Bildirim izni kapalı. Ayarlar → Kelimece → Bildirimler'den açabilirsin."
              : "Kartların bekleyince seçtiğin saatte bir bildirim. Boş günlerde susar."}
          </p>
        </div>
      </div>
      {!denied && (
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <div className="flex flex-wrap gap-1.5" role="radiogroup" aria-label="Saat">
            {HOURS.map((h) => (
              <button key={h} type="button" role="radio" aria-checked={hour === h} onClick={() => setHour(h)} className={`${chip(hour === h)} py-2`}>
                {label(h)}
              </button>
            ))}
          </div>
          <Button
            size="sm"
            className="ml-auto"
            isLoading={reminders.enable.isPending}
            onClick={() => reminders.enable.mutate(hour, { onError: () => setNote("İzin verilmedi.") })}
          >
            Aç
          </Button>
        </div>
      )}
      {note && <p className="mt-2 text-xs font-bold text-accent">{note}</p>}
    </section>
  );
}

export default ReminderCard;
