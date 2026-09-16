// Algoritmaya VERECEĞİMİZ bilgiler (girdi)
interface SrsInput {
  repetitions: number; // combo: kaç kez üst üste doğru bildi
  interval: number; // kartın şu anki aralığı (gün)
  easeFactor: number; // kolaylık ayarı (yüksek = kolay)
  quality: number; // kullanıcının notu (0-5)
}

// Algoritmanın GERİ VERECEĞİ bilgiler (çıktı)
interface SrsOutput {
  repetitions: number; // yeni combo
  interval: number; // yeni aralık (gün)
  easeFactor: number; // yeni kolaylık ayarı
  dueDate: Date; // yeni tekrar tarihi
}

/** Bilinemeyen bir kelimenin yeniden sorulmasına kadar geçecek süre. */
export const LAPSE_MINUTES = 10;
/** "Yarın" hangi saat dilimine göre yarın: öğrencininki. */
export const LEARNER_TIMEZONE = process.env.LEARNER_TIMEZONE ?? "Europe/Istanbul";

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

export const calculateSrs = (input: SrsInput): SrsOutput => {
  let { repetitions, interval, easeFactor, quality } = input;

  if (quality < 3) {
    // BİLEMEDİ
    repetitions = 0; // combo sıfırlandı
    interval = 1; // bir sonraki doğrudan sonra yarın; ama önce (aşağıda) on
    // dakika içinde tekrar önüne gelsin — bilinmeyen kelime ertesi güne
    // bırakılmaz, bir sonraki dersin başında yeniden sorulur
  } else {
    // BİLDİ
    repetitions = repetitions + 1; // combo arttı

    if (repetitions === 1) {
      interval = 1; // ilk doğru → yarın
    } else if (repetitions === 2) {
      interval = 6; // ikinci doğru → 6 gün sonra
    } else {
      interval = Math.round(interval * easeFactor); // sonrası: eski aralık × kolaylık
    }

    // kolaylık ayarını nota göre güncelle (SM-2'nin resmi formülü)
    easeFactor =
      easeFactor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02));
  }

  // ease alt sınır: 1.3'ün altına inmesin
  if (easeFactor < 1.3) {
    easeFactor = 1.3;
  }

  // yeni tarih = bugün + interval gün; bilinemeyen kelime on dakika sonra.
  // Bilinen kelime o günün başından (UTC gece yarısı) itibaren "vadesi
  // gelmiş" sayılır: akşam çalışılan kart ertesi akşamki hatırlatmada
  // saat farkı yüzünden görünmez kalmasın.
  let dueDate = new Date();
  if (quality < 3) dueDate.setMinutes(dueDate.getMinutes() + LAPSE_MINUTES);
  else {
    // Öğrencinin takvimine göre "interval gün sonra"nın gece yarısı: önce
    // şu anki yerel tarihi bul, gün ekle, o günün 00:00'ını UTC'ye çevir.
    const offsetMs = timezoneOffsetMs(LEARNER_TIMEZONE, dueDate);
    const local = new Date(dueDate.getTime() + offsetMs);
    const midnightUTC = Date.UTC(local.getUTCFullYear(), local.getUTCMonth(), local.getUTCDate() + interval);
    dueDate = new Date(midnightUTC - offsetMs);
  }

  return { repetitions, interval, easeFactor, dueDate };
};
