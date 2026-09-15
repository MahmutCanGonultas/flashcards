import type { Card } from "../types";
import type { PathStats, Unit } from "./path";
import { isDue, wordTier } from "./path";
import { parseBack } from "./cardBack";

/**
 * What Tonton says on the home screens. Every pick that looks random is
 * keyed off the day, so a line doesn't change under the learner between
 * one render and the next.
 */

const dayIndex = () => Math.floor(Date.now() / 86_400_000);

function greeting(): string {
  const hour = new Date().getHours();
  if (hour < 5) return "Geç saate mi kaldın? Kısa bir ders, sonra uyku. 🌙";
  if (hour < 12) return "Günaydın! ☀️ Taze kafa, yeni kelimeler.";
  if (hour < 18) return "İyi günler! 👋 On beş dakikan var mı?";
  return "İyi akşamlar! 🌙 Yatmadan önce birkaç kelime?";
}

const TIPS = [
  "Günde üç kelime, yılda bin kelime eder. 🐢",
  "Her kelimeyi yüksek sesle söyle — kulakların da öğrenir. 👂",
  "En çok yanlış cevaplar öğretir. Yine de tahmin et. 💪",
  "İki kez kaçırdığın kelimeyi bir daha asla unutmazsın. 🧠",
  "Yarın yine gel: kelime kalmaya o zaman karar verir. 📅",
  "Örnek cümleyi iki kez oku. Kelime orada yaşar. 📖",
  "Duymak için kelimeye dokun. Sonra sen de söyle. 🔊",
  "Bir kelimede mi takıldın? Hafıza ipucu bir dokunuş uzakta. 💡",
];

const tip = () => TIPS[dayIndex() % TIPS.length];

/** One word the learner has actually kept, brought back for a second. */
function recall(cards: Card[]): string | null {
  const known = cards.filter((card) => wordTier(card) === "known");
  if (known.length === 0) return null;
  const card = known[dayIndex() % known.length];
  const back = parseBack(card.back);
  return `"${card.front}" ne demekti? ${back.text}${back.emoji ? ` ${back.emoji}` : ""}`;
}

/** The deck list: a hello, what's due, the streak, a word from memory, a tip. */
export function homeLines({
  cards,
  due,
  streak,
  personal = [],
}: {
  cards: Card[];
  due: number;
  streak: number;
  /** The learner's own words, if they have added any. */
  personal?: Card[];
}): string[] {
  const lines = [greeting()];
  // Their own words come first: those are the ones they asked to be reminded of.
  const personalDue = personal.filter(isDue);
  if (personalDue.length > 0) {
    lines.push(`Kendi kelimelerinden ${personalDue.length} tanesi bugün seni bekliyor. ✍️`);
  }
  if (personal.length > 0) {
    const card = personal[dayIndex() % personal.length];
    const back = parseBack(card.back);
    lines.push(`Senin kelimen: "${card.front}" — ${back.text}. Hatırladın mı? ✍️`);
  } else {
    lines.push("Sokakta, dizide duyduğun bir kelime mi var? Ekle, fotoğrafını koy; ben sorarım. ✍️");
  }
  if (due > 0) lines.push(`${due} kelime seni bekliyor. Önce tekrar? 🔁`);
  else if (cards.length > 0) lines.push("Şu an tekrar edecek bir şey yok — yeni bir ders? ✨");
  if (streak > 1) lines.push(`${streak} günlük seri! 🔥 Böyle devam.`);
  else if (streak === 1) lines.push("Serinin ilk günü. Yarın iki olur. 🔥");
  const remembered = recall(cards);
  if (remembered) lines.push(remembered);
  lines.push(tip());
  return lines;
}

/** Above the path: where you are on the line and what's open. */
export function pathLines(stats: PathStats, units: Unit[], isFresh: boolean): string[] {
  const lessons = units.flatMap((unit) => unit.lessons);
  const cards = lessons.flatMap((lesson) => lesson.cards);
  const lines: string[] = [];

  if (isFresh) lines.push("Yeni misin? Seviye testine gir — ya da direkt Ders 1'den başla. 🎯");
  if (stats.dueNow > 0) lines.push(`${stats.dueNow} kelime tekrar bekliyor. Önce tekrar? 🔁`);
  if (stats.testReady) lines.push(`Ünite ${stats.testReady.index} bitti — testi açıldı! 🎯`);
  const current = lessons.find((lesson) => lesson.state === "current");
  if (current) {
    lines.push(
      `${current.learned > 0 ? "Kaldığın yer:" : "Sıradaki durak:"} ${current.cards.map((card) => card.front).join(" · ")} 🚉`,
    );
  }
  if (stats.wordsKnown > 0) lines.push(`${stats.wordsKnown} kelime artık gerçekten senin. 🏅`);
  const remembered = recall(cards);
  if (remembered) lines.push(remembered);
  lines.push(tip());
  return lines;
}

/* ------------------------------------------------------------- pop-ins -- */

/**
 * What Tonton says when he wanders onto the screen uninvited. A wide pool
 * so it doesn't repeat, split by mood; the caller weaves in the live
 * lines (what's due, a word to recall) and keeps the last few picks out.
 */
const POP_SMALL_TALK = [
  "Buradayım. Sadece bakıyordum. 👀",
  "Kulaklarım büyük diye her şeyi duyuyorum sanma. Çoğunu duyuyorum. 👂",
  "Bugün bir kelime öğrendin mi? Ben 'biscuit' öğrendim. Sonra yedim. 🍪",
  "Şşş… Kelimeler uyuyor. Uyandıralım mı? 🃏",
  "Hazır olduğunda buradayım. Acele yok. Ama azıcık var. 😌",
  "Bir kelime, bir cümle, bir nefes. Sonra yine gel. 🌬️",
  "Mor olduğum için değil, senin için buradayım. 💜",
  "İngilizce zor değil; sadece çok kelimesi var. Tek tek alıyoruz. 🧱",
  "Bana bir kelime söyle, ben sana cümlesini söyleyeyim. Yok, gerçekten söyleyemem ama denerim. 😅",
  "Kelime kartlarını çevirmek, kalbimi çevirmek gibi. Dramatik oldu. 🎭",
  "Tonton'un notu: hata yapmak ücretsiz. Bol bol yap. 🆓",
  "Bugün kimseyle İngilizce konuştun mu? Benimle konuşabilirsin. Cevap veremem ama dinlerim. 🐻",
];

const POP_TIPS = [
  "Bir kelimeyi kaçırdıysan, on dakika sonra yine gelir. Kaçış yok. ⏱️",
  "Kartın arkasına bakmadan önce üç saniye dur. O üç saniye hafızadır. 🧠",
  "Kelimeyi bir cümlede düşün, tek başına değil. Yalnız kelimeler kaybolur. 🧩",
  "Yüksek sesle söylemekten utanma; duvarlar İngilizce bilmiyor. 🗣️",
  "'Zorlandım' demek ayıp değil. O kelimeyi biraz daha sık göstermemi sağlar. 🤔",
  "Bir kelimeyi üç kez ayrı günlerde bildiysen, o artık senin. 🏅",
  "Her gün beş dakika, haftada bir saatten iyidir. Seri böyle kurulur. 🔥",
  "Dizide duyduğun kelimeyi ekle. Sahnesi aklında kaldıkça kelime de kalır. 🎬",
  "Türkçesini değil, cümlesini hatırla. Anlam cümlede saklı. 📖",
  "Gramer notları kısa. Bir tanesini oku, sonra bir kart çevir. 📝",
];

const POP_CHEERS = [
  "Geldin ya, en zor kısmı bu. Gerisi kelime. 👏",
  "Dün de buradaydın, bugün de. Seni fark ediyorum. 🌱",
  "Küçük adımlar. Büyük adımlar dizini incitir. 🐾",
  "Yanlış cevap verdiğinde bile kelime seni tanıdı. Yarın hatırlar. 🙂",
  "Bir kart bile çevirsen bugün sayılır. ✅",
  "Bir yıl sonra bugüne bakacaksın: 'O gün başlamıştım' diyeceksin. 📅",
];

function shuffleByDay<T>(items: T[], salt: number): T[] {
  // A stable shuffle for the day, so the order is fresh tomorrow but the
  // "don't repeat" window works within a day.
  const seed = dayIndex() * 7919 + salt;
  return [...items].sort((a, b) => Math.sin(seed + items.indexOf(a) * 13.7) - Math.sin(seed + items.indexOf(b) * 13.7));
}

/**
 * A pool of pop-in lines for the moment: the live ones (due cards, a word
 * to recall, streak) first, then small talk, tips and cheers mixed.
 */
export function popLines({
  cards,
  personal,
  streak,
}: {
  cards: Card[];
  personal: Card[];
  streak: number;
}): string[] {
  const live: string[] = [];
  const personalDue = personal.filter(isDue).length;
  if (personalDue > 0) {
    live.push(
      personalDue === 1
        ? "Bir kartın seni bekliyor. Bir dakika sürer. 🃏"
        : `${personalDue} kartın seni bekliyor. Hadi, çabuk çevirelim. 🃏`,
    );
  }
  if (personal.length > 0) {
    const card = personal[(dayIndex() + new Date().getHours()) % personal.length];
    const back = parseBack(card.back);
    live.push(`Küçük sınav: "${card.front}"? … ${back.text}. 🎯`);
    live.push(`"${card.front}" — bir cümlede kullanabilir misin? Sesli söyle. 🗣️`);
  }
  const courseDue = cards.filter(isDue).length;
  if (courseDue > 0) live.push(`Kursta ${courseDue} kelime tekrar bekliyor. Kısa bir tur? 🔁`);
  if (streak >= 3) live.push(`${streak} gündür buradasın. Seriyi bozma, bugün bir kart yeter. 🔥`);
  const hour = new Date().getHours();
  if (hour >= 22 || hour < 5) live.push("Gece kelimeleri daha iyi yapışır derler. Bir kart, sonra uyku. 🌙");
  if (hour >= 6 && hour < 10) live.push("Sabah sabah bir kelime, gün boyu aklında döner. ☀️");

  const rest = shuffleByDay([...POP_SMALL_TALK, ...POP_TIPS, ...POP_CHEERS], live.length);
  return [...shuffleByDay(live, 3), ...rest];
}
