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

  // yeni tarih = bugün + interval gün; bilinemeyen kelime on dakika sonra
  const dueDate = new Date();
  if (quality < 3) dueDate.setMinutes(dueDate.getMinutes() + LAPSE_MINUTES);
  else dueDate.setDate(dueDate.getDate() + interval);

  return { repetitions, interval, easeFactor, dueDate };
};
