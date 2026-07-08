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

export const calculateSrs = (input: SrsInput): SrsOutput => {
  let { repetitions, interval, easeFactor, quality } = input;

  if (quality < 3) {
    // BİLEMEDİ
    repetitions = 0; // combo sıfırlandı
    interval = 1; // yarın göster
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

  // yeni tarih = bugün + interval gün
  const dueDate = new Date();
  dueDate.setDate(dueDate.getDate() + interval);

  return { repetitions, interval, easeFactor, dueDate };
};
