/**
 * The app talking like a person rather than a counter: numbers in words
 * ("üç", not "3 kart"), words named rather than counted, a greeting for the
 * time of day. English words are never given a Turkish suffix
 * ("occupy'ı"); the sentences are built so they don't need one.
 */

const NUMBERS = ["sıfır", "bir", "iki", "üç", "dört", "beş", "altı", "yedi", "sekiz", "dokuz", "on"];

/** "üç" for 3; past ten, the digits read better. */
export const inWords = (n: number): string => NUMBERS[n] ?? String(n);

/** "invest", "invest ve hamper", "invest, hamper ve occupy"; past `max`, "… ve iki kelime daha". */
export function listOf(words: string[], max = 3): string {
  if (words.length === 0) return "";
  if (words.length > max) return `${words.slice(0, max).join(", ")} ve ${inWords(words.length - max)} kelime daha`;
  if (words.length === 1) return words[0];
  return `${words.slice(0, -1).join(", ")} ve ${words[words.length - 1]}`;
}

/** A greeting for the hour, the learner's day turning at four in the morning. */
export function greeting(hour: number): string {
  if (hour >= 4 && hour < 11) return "Günaydın";
  if (hour >= 11 && hour < 17) return "İyi günler";
  if (hour >= 17 && hour < 22) return "İyi akşamlar";
  return "İyi geceler";
}

/**
 * What today holds, in one sentence, in the order the round goes: the new
 * words by name first (the round opens with them), then the ones coming
 * back, named when there are a few. Returns the pieces so the page can
 * colour the English words. "ayrıca", not "de": an English word gives no
 * vowel to agree with.
 */
export type Piece = { text: string; word?: boolean };

export function todayPieces(reviews: string[], fresh: string[]): Piece[] {
  const named = (words: string[]): Piece[] =>
    words.flatMap((word, i) => {
      const sep = i === 0 ? [] : [{ text: i === words.length - 1 ? " ve " : ", " }];
      return [...sep, { text: word, word: true }];
    });
  const back = (): Piece[] => (reviews.length <= 3 ? [...named(reviews), { text: " tekrar gelecek." }] : [{ text: `${inWords(reviews.length)} kelime tekrar gelecek.` }]);
  if (fresh.length > 0) {
    const meet: Piece[] = [{ text: "Bugün " }, ...named(fresh), { text: " ile tanışacaksın" }];
    return reviews.length > 0 ? [...meet, { text: "; ayrıca " }, ...back()] : [...meet, { text: "." }];
  }
  return [{ text: "Bugün " }, ...back()];
}

/** How long it takes, without a stopwatch. */
export const howLong = (minutes: number): string => (minutes <= 5 ? "Birkaç dakikanı alır." : `Yaklaşık ${inWords(Math.round(minutes / 5) * 5)} dakikanı alır.`);

const WEEKDAYS = ["Pazar", "Pazartesi", "Salı", "Çarşamba", "Perşembe", "Cuma", "Cumartesi"];

/** "Yarın", or the weekday's name. */
export const dayName = (offset: number, weekday: number): string => (offset === 1 ? "Yarın" : WEEKDAYS[weekday]);
