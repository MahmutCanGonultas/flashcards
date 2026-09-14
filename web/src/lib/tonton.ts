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
