import { LEARNER_TIMEZONE, dayStart, learnerDay, timezoneOffsetMs } from "./day.service.js";

export { LEARNER_TIMEZONE, timezoneOffsetMs };

// Algoritmaya VERECEĞİMİZ bilgiler (girdi)
interface SrsInput {
  repetitions: number; // combo: kaç kez üst üste doğru bildi
  interval: number; // kartın şu anki aralığı (gün)
  easeFactor: number; // kolaylık ayarı (yüksek = kolay)
  quality: number; // kullanıcının notu (0-5)
  phase?: "learn" | "review"; // 'learn': yeni kelimenin ilk günkü tek yazımı
  direction?: "fwd" | "rev"; // 'rev': Türkçeden İngilizceye sorulan kart
}

// Algoritmanın GERİ VERECEĞİ bilgiler (çıktı)
interface SrsOutput {
  repetitions: number; // yeni combo
  interval: number; // yeni aralık (gün)
  easeFactor: number; // yeni kolaylık ayarı
  dueDate: Date; // yeni tekrar tarihi
  lapse: boolean; // gerçekten unutuldu mu (inatçı kelime sayacı için)
}

/**
 * 'classic' kursun SM-2'si (1 gün, 6 gün, sonra × kolaylık). 'gentle'
 * öğrencinin kendi kelimeleri için: 1, 3, 7 gün, sonra × kolaylık.
 */
export type SrsPolicy = "classic" | "gentle";

/** Kendi kelimelerin düzeni. Render'da SRS_POLICY_PERSONAL=classic geri dönüş yoludur. */
export const PERSONAL_POLICY: SrsPolicy = process.env.SRS_POLICY_PERSONAL === "classic" ? "classic" : "gentle";

/** Bilinemeyen bir kelimenin yeniden sorulmasına kadar geçecek süre ('classic'). */
export const LAPSE_MINUTES = 10;

/** 'gentle': ilk üç doğrunun aralıkları (gün). Sonrası eski aralık × kolaylık. */
export const LADDER = [1, 3, 7];

const MIN_EASE = 1.3;

/**
 * Kelimenin unutma sayacı artar mı? Yeni kelimenin ilk yazımı hiçbir düzende
 * unutma sayılmaz: 'classic'e (geri dönüş) geçildiğinde tur sonundaki
 * "henüz değil" yazımı, hiç öğrenilmemiş bir kelimeyi inatçılığa taşımasın.
 */
export const addsLapse = (output: Pick<SrsOutput, "lapse">, phase: SrsInput["phase"], started: boolean): boolean =>
  output.lapse && !(phase === "learn" && !started);

export const calculateSrs = (
  input: SrsInput,
  { policy = "classic", now = new Date() }: { policy?: SrsPolicy; now?: Date } = {},
): SrsOutput => (policy === "gentle" ? gentle(input, now) : classic(input, now));

function classic(input: SrsInput, now: Date): SrsOutput {
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
  if (easeFactor < MIN_EASE) {
    easeFactor = MIN_EASE;
  }

  // yeni tarih = bugün + interval gün; bilinemeyen kelime on dakika sonra.
  // Bilinen kelime o günün başından (UTC gece yarısı) itibaren "vadesi
  // gelmiş" sayılır: akşam çalışılan kart ertesi akşamki hatırlatmada
  // saat farkı yüzünden görünmez kalmasın.
  let dueDate = new Date(now.getTime());
  if (quality < 3) dueDate.setMinutes(dueDate.getMinutes() + LAPSE_MINUTES);
  else {
    // Öğrencinin takvimine göre "interval gün sonra"nın gece yarısı: önce
    // şu anki yerel tarihi bul, gün ekle, o günün 00:00'ını UTC'ye çevir.
    const offsetMs = timezoneOffsetMs(LEARNER_TIMEZONE, dueDate);
    const local = new Date(dueDate.getTime() + offsetMs);
    const midnightUTC = Date.UTC(local.getUTCFullYear(), local.getUTCMonth(), local.getUTCDate() + interval);
    dueDate = new Date(midnightUTC - offsetMs);
  }

  return { repetitions, interval, easeFactor, dueDate, lapse: quality < 3 };
}

function gentle(input: SrsInput, now: Date): SrsOutput {
  const { repetitions, interval, easeFactor, quality, phase = "review", direction = "fwd" } = input;
  const started = repetitions > 0 || interval > 0;
  let next = { repetitions, interval, easeFactor, lapse: false };

  if (phase === "learn" && !started) {
    // YENİ KELİMENİN İLK YAZIMI: o günkü adımlardan sonra bir kez. Tuttuysa
    // ilk basamak, tutmadıysa yarın baştan; ikisi de unutma sayılmaz.
    next = { ...next, repetitions: quality >= 3 ? 1 : 0, interval: 1 };
  } else if (quality >= 4) {
    // BİLDİ: bir basamak yukarı. Merdivendeyken en az basamağın aralığı,
    // sonra eski aralık × kolaylık; kolaylık yalnız merdivenden sonra artar.
    const reps = repetitions + 1;
    const onLadder = reps <= LADDER.length;
    next = {
      ...next,
      repetitions: reps,
      interval: onLadder ? Math.max(LADDER[reps - 1], interval + 1) : Math.max(interval + 1, Math.round(interval * easeFactor)),
      easeFactor: onLadder || quality === 4 ? easeFactor : easeFactor + 0.1,
    };
  } else if (quality === 3) {
    // ZORLANDI: basamak yerinde kalır, aralık biraz uzar, kolaylık düşer.
    next = {
      ...next,
      repetitions: Math.max(repetitions, 1),
      interval: Math.max(interval + 1, Math.round(interval * 1.2)),
      easeFactor: easeFactor - 0.15,
    };
  } else {
    // BİLEMEDİ: yarın sabah yeniden (o günkü tekrarı oturum yapar). Unutma
    // ancak kelime daha önce iki gün üst üste tutulmuşsa sayılır; ters
    // yönde kaçan kelime yalnız kolaylıktan kaybeder.
    const settled = repetitions >= 2;
    const lapse = settled && direction === "fwd";
    next = {
      repetitions: repetitions >= 1 ? 1 : 0,
      interval: 1,
      easeFactor: !settled ? easeFactor : lapse ? easeFactor - 0.2 : easeFactor - 0.15,
      lapse,
    };
  }

  // İki basamaklı yuvarlama: REAL sütunda 2.35 yine 2.35 kalsın, kayma birikmesin.
  const ease = Math.max(MIN_EASE, Math.round(next.easeFactor * 100) / 100);
  // Vadesi o günün sabahı 04:00: gece yarısından sonraki bir oturum bir
  // önceki akşama sayılır, yarının kartı da yarın akşam hazır olur.
  const dueDate = dayStart(learnerDay(now), next.interval);
  return { ...next, easeFactor: ease, dueDate };
}
