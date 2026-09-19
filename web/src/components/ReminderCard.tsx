import { useState } from "react";
import { usePushReminders } from "../lib/reminders";
import Button from "./Button";
import Mascot from "./Mascot";

const HOURS = [9, 13, 18, 20, 21, 22];
const label = (h: number) => `${String(h).padStart(2, "0")}:00`;

/** One hour chip: paper with a tan rule, ink when it's the chosen one. */
const chip = (active: boolean) =>
  `min-h-10 rounded-full px-3.5 text-xs font-extrabold ring-1 transition-colors duration-150 ${
    active ? "bg-ink text-paper-lift ring-ink" : "bg-paper-lift text-ink ring-rule hover:bg-paper-deep/50"
  }`;

/**
 * "Tonton her akşam haber versin": daily push reminders, on or off, at an
 * hour of the learner's choosing. Sent only on days with cards waiting.
 */
function ReminderCard({ variant = "card" }: { variant?: "card" | "line" }) {
  const reminders = usePushReminders();
  const [hour, setHour] = useState(20);
  const [note, setNote] = useState<string | null>(null);
  const [open, setOpen] = useState(false);

  if (variant === "line") {
    const link = "font-extrabold text-ink underline decoration-ink decoration-[1.5px] underline-offset-4";
    const line = "rounded-lg bg-paper-deep/60 px-3 py-2 text-[12px] font-semibold leading-relaxed text-graphite";
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
              className="min-h-10 rounded-full bg-ink px-4 text-xs font-black uppercase tracking-[0.12em] text-paper-lift shadow-button"
            >
              Aç
            </button>
            {note && <span className="text-accent">{note}</span>}
          </div>
        )}
      </div>
    );
  }

  const panel = "rounded-3xl bg-paper-lift p-4 ring-1 ring-rule shadow-print";

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
