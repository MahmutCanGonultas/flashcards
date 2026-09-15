import { useState } from "react";
import { usePushReminders } from "../lib/reminders";
import Button from "./Button";
import Mascot from "./Mascot";

const HOURS = [9, 13, 18, 20, 21, 22];
const label = (h: number) => `${String(h).padStart(2, "0")}:00`;

/**
 * "Tonton her akşam haber versin": daily push reminders, on or off, at an
 * hour of the learner's choosing. Sent only on days with cards waiting.
 */
function ReminderCard() {
  const reminders = usePushReminders();
  const [hour, setHour] = useState(20);
  const [note, setNote] = useState<string | null>(null);

  if (!reminders.supported) {
    return (
      <section className="flex items-center gap-3 rounded-3xl bg-white/80 p-4 ring-1 ring-stone-200">
        <Mascot mood="idle" size={44} lively={false} className="shrink-0" />
        <div className="min-w-0">
          <p className="text-sm font-extrabold text-stone-800">🔔 Günlük hatırlatma</p>
          <p className="mt-0.5 text-xs text-stone-500">
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
      <section className="flex items-center gap-3 rounded-3xl bg-white/80 p-4 ring-1 ring-emerald-200">
        <Mascot mood="happy" size={44} lively={false} className="shrink-0" />
        <div className="min-w-0 flex-1">
          <p className="text-sm font-extrabold text-stone-800">🔔 Hatırlatma açık · {reminders.hour !== null ? label(reminders.hour) : ""}</p>
          <p className="mt-0.5 text-xs text-stone-500">Kartların bekleyen günlerde Tonton o saatte haber verir; boş günlerde susar.</p>
          {note && <p className="mt-1 text-xs font-bold text-emerald-700">{note}</p>}
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
    <section className="rounded-3xl bg-white/80 p-4 ring-1 ring-stone-200">
      <div className="flex items-center gap-3">
        <Mascot mood="idle" size={44} lively={false} className="shrink-0" />
        <div className="min-w-0 flex-1">
          <p className="text-sm font-extrabold text-stone-800">🔔 Tonton her gün haber versin mi?</p>
          <p className="mt-0.5 text-xs text-stone-500">
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
              <button
                key={h}
                type="button"
                role="radio"
                aria-checked={hour === h}
                onClick={() => setHour(h)}
                className={`min-h-10 rounded-full px-3.5 py-2 text-xs font-extrabold ring-1 transition ${
                  hour === h ? "bg-violet-600 text-white ring-violet-600" : "bg-white text-stone-600 ring-stone-200 hover:bg-violet-50"
                }`}
              >
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
      {note && <p className="mt-2 text-xs font-bold text-rose-600">{note}</p>}
    </section>
  );
}

export default ReminderCard;
