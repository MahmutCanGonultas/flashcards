import type { Card } from "../types";
import type { PathStats, Unit } from "./path";
import { hasStarted, isDue, isDueReview, wordTier } from "./path";
import { parseBack } from "./cardBack";
import type { GrammarProgress } from "./grammar";
import type { DailyPlan } from "./plan";
import { CATALOG } from "../content/grammar/catalog";

/**
 * What Tonton says. Every pick that looks random is keyed off the day, so
 * a line doesn't change under the learner between one render and the
 * next. His register: dry, warm, short. At most one line in five carries
 * an emoji; the rest trust the words.
 */

const dayIndex = () => Math.floor(Date.now() / 86_400_000);

/** The part of the day, for the lines that mention it. */
export type DayPart = "night" | "morning" | "afternoon" | "evening";
export const dayPart = (hour = new Date().getHours()): DayPart =>
  hour < 5 ? "night" : hour < 12 ? "morning" : hour < 18 ? "afternoon" : "evening";

function greeting(): string {
  switch (dayPart()) {
    case "night":
      return "Geç saate mi kaldın? Kısa bir ders, sonra uyku.";
    case "morning":
      return "Günaydın. Taze kafa, yeni kelimeler.";
    case "afternoon":
      return "İyi günler. On beş dakikan var mı?";
    default:
      return "İyi akşamlar. Yatmadan önce birkaç kelime?";
  }
}

const TIPS = [
  "Günde üç kelime, yılda bin kelime eder. 🐢",
  "Her kelimeyi yüksek sesle söyle; kulakların da öğrenir.",
  "En çok yanlış cevaplar öğretir. Yine de tahmin et.",
  "İki kez kaçırdığın kelimeyi bir daha kolay unutmazsın.",
  "Yarın yine gel: kelime kalmaya o zaman karar verir.",
  "Örnek cümleyi iki kez oku. Kelime orada yaşar.",
  "Duymak için kelimeye dokun. Sonra sen de söyle.",
  "Bir kelimede mi takıldın? Sayfasını aç: renkli anlamlar, kalıplar, örnekler.",
  "Tur bitince gün yanar.",
];

const tip = () => TIPS[dayIndex() % TIPS.length];

/**
 * How many of the learner's own words wait today: the day's plan when it is
 * loaded (its reviews and today's new words), else the met words that are
 * due. Never the queue: those come three a day.
 */
function ownWaiting(personal: Card[], plan: Pick<DailyPlan, "reviewsDue" | "newIds"> | null | undefined): number {
  if (plan) return plan.reviewsDue + plan.newIds.length;
  return personal.filter((card) => hasStarted(card) && isDue(card)).length;
}

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
  plan,
}: {
  cards: Card[];
  due: number;
  streak: number;
  /** The learner's own words, if they have added any. */
  personal?: Card[];
  /** Today's plan on them, once loaded. */
  plan?: Pick<DailyPlan, "reviewsDue" | "newIds"> | null;
}): string[] {
  const lines = [greeting()];
  // Their own words come first: those are the ones they asked to be reminded of.
  const personalDue = ownWaiting(personal, plan);
  if (personalDue > 0) {
    lines.push(`Kendi kelimelerinden ${personalDue} tanesi bugün seni bekliyor.`);
  }
  // Only a word already met: asking one still waiting in the queue would be a quiz on nothing.
  const met = personal.filter(hasStarted);
  if (met.length > 0) {
    // A question, not the answer: reading the meaning here, a minute before
    // the session asks it, would spend the retrieval.
    const card = met[dayIndex() % met.length];
    lines.push(`Isınma: "${card.front}" ne demekti? Sesli söyle.`);
  } else if (personal.length === 0) {
    lines.push("Sokakta, dizide duyduğun bir kelime mi var? Ekle; ne zaman soracağımı ben ayarlarım.");
  }
  if (due > 0) lines.push(`${due} kelime seni bekliyor. Önce tekrar?`);
  else if (cards.length > 0) lines.push("Şu an tekrar edecek bir şey yok. Yeni bir ders?");
  if (streak > 1) lines.push(`${streak} günlük seri. Böyle devam. 🔥`);
  else if (streak === 1) lines.push("Serinin ilk günü. Yarın iki olur.");
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

  if (isFresh) lines.push("Yeni misin? Seviye testine gir; ya da direkt Ders 1'den başla.");
  if (stats.dueNow > 0) lines.push(`${stats.dueNow} kelime tekrar bekliyor. Önce tekrar?`);
  if (stats.testReady) lines.push(`Ünite ${stats.testReady.index} bitti; testi açıldı. 🎯`);
  const current = lessons.find((lesson) => lesson.state === "current");
  if (current) {
    lines.push(
      `${current.learned > 0 ? "Kaldığın yer:" : "Sıradaki durak:"} ${current.cards.map((card) => card.front).join(" · ")}`,
    );
  }
  if (stats.wordsKnown > 0) lines.push(`${stats.wordsKnown} kelime artık gerçekten senin.`);
  const remembered = recall(cards);
  if (remembered) lines.push(remembered);
  lines.push(tip());
  return lines;
}

/* ------------------------------------------------------------- pop-ins -- */

/** A line he says on a visit; the kicker is the small label above it. */
export type PopLine = { text: string; kicker?: string };

/**
 * What Tonton says when he wanders onto the screen uninvited. A wide pool
 * so it doesn't repeat, split by mood; the caller weaves in the live
 * lines (what's due, a word to recall) and keeps the last few picks out.
 */
const POP_SMALL_TALK = [
  "Buradayım. Sadece bakıyordum.",
  "Bugün bir kelime öğrendin mi? Ben 'biscuit' öğrendim. Sonra yedim. 🍪",
  "Şşş… Kelimeler uyuyor. Uyandıralım mı?",
  "Hazır olduğunda buradayım. Acele yok. Ama azıcık var.",
  "Bir kelime, bir cümle, bir nefes. Sonra yine gel.",
  "İngilizce zor değil; sadece çok kelimesi var. Tek tek alıyoruz.",
  "Tonton'un notu: hata yapmak ücretsiz. Bol bol yap.",
  "Bugün kimseyle İngilizce konuştun mu? Benimle konuşabilirsin. Cevap veremem ama dinlerim.",
  "Sayfayı karıştırırken buradaydım. Görülmedim sanırım.",
  "Kartlar rafta bekliyor. Tozlanmadan çevirelim.",
  "Bugün hiçbir şey yapmasan da uğradın ya. Sayılır.",
  "Kendi kendime bekledim burada. Sonra 'ben de karakterim' dedim, geldim.",
  "Kulaklarım büyük; kısa cevapları da duyarım.",
  "Ben burada kelime sayıyorum. Sen bir tane ekle, hesap şaşsın.",
  "Rafa yeni kelime gelmedi. Dizide duyduğun bir şey yok muydu?",
  "Bugün az, yarın az. Bir ay sonra çok. Matematik böyle.",
  "Unutmak ayıp değil. Unuttuğunu fark etmek, hafızanın işe geldiği an.",
];

const POP_TIPS = [
  "Bir kelimeyi kaçırdıysan, birkaç kart sonra yine gelir. Kaçış yok.",
  "Kartın arkasına bakmadan üç saniye dur. O üç saniye hafızadır.",
  "Kelimeyi bir cümlede düşün, tek başına değil. Yalnız kelimeler kaybolur.",
  "Yüksek sesle söylemekten utanma; duvarlar İngilizce bilmiyor.",
  "'Zorlandım' demek ayıp değil. O kelimeyi biraz daha sık göstermemi sağlar.",
  "Bir kelimeyi üç kez ayrı günlerde bildiysen, o artık senin.",
  "Her gün beş dakika, haftada bir saatten iyidir. Seri böyle kurulur.",
  "Dizide duyduğun kelimeyi ekle. Sahnesi aklında kaldıkça kelime de kalır.",
  "Türkçesini değil, cümlesini hatırla.",
  "Bir kelimeye dokun, sesini duy. Kulak da öğrenir.",
  "Gramer notları kısa. Bir tanesini oku, sonra bir kart çevir.",
  "Gramer köşesinde her konu 10 soru. Beş dakika, bir yıldız.",
  "Bir gramer konusunu okurken örnekleri sesli söyle. Kural kulağa da yerleşir.",
  "Kelimenin kalıbını öğren; kelimeyi bedava alırsın.",
  "Aynı aileden kelimeler birlikte kalır. Birini bildin mi, ötekine de bak.",
  "Yazarak hatırladığın kelime, bakarak hatırladığından iki kat kalır.",
  "Kendi cümlen, benim bütün cümlelerimden iyidir. Kelimenin sayfasına bir tane yaz.",
  "Boşluğu doldururken zorlanıyorsan iyi: hafıza tam da orada güçleniyor.",
  "Yeni kelimede önce tahmin et. Yanlış tahmin bile doğruyu daha sağlam yerleştirir.",
];

const POP_CHEERS = [
  "Geldin ya, en zor kısmı bu. Gerisi kelime.",
  "Dün de buradaydın, bugün de. Seni fark ediyorum.",
  "Küçük adımlar. Büyük adımlar dizini incitir.",
  "Yanlış cevap verdiğinde bile kelime seni tanıdı. Yarın hatırlar.",
  "Bir kart bile çevirsen bugün sayılır.",
  "Bir yıl sonra bugüne bakacaksın: 'O gün başlamıştım' diyeceksin.",
  "Üç kelime az gibi. Üç yüz gün sonra değil.",
  "Buraya kadar geldin. Kapıdan dönmek daha zor.",
];

/**
 * Small talk that only makes sense once the learner has met that word. It
 * asks, never tells: a meaning read here would spend the card's recall.
 */
const WORD_TALK: Record<string, string> = {
  commit: "Bugün aklıma 'commit' geldi. Sen hatırlıyor musun? Sesli söyle.",
  consider: "'consider' diye bir kelimen var. Ne demekti? Ben beklerim.",
};

function shuffleByDay<T>(items: T[], salt: number): T[] {
  // A stable shuffle for the day, so the order is fresh tomorrow but the
  // "don't repeat" window works within a day.
  const seed = dayIndex() * 7919 + salt;
  return [...items].sort((a, b) => Math.sin(seed + items.indexOf(a) * 13.7) - Math.sin(seed + items.indexOf(b) * 13.7));
}

/** What he can say about the grammar topics: the next one to open, or one worth another go. */
function grammarLines(grammar: GrammarProgress | undefined): PopLine[] {
  if (!grammar) return [];
  const started = CATALOG.filter((t) => grammar[t.slug]);
  const next = CATALOG.find((t) => !grammar[t.slug]);
  const weak = started.filter((t) => (grammar[t.slug]?.best ?? 100) < 70).sort((a, b) => (grammar[a.slug]?.best ?? 0) - (grammar[b.slug]?.best ?? 0))[0];
  const lines: PopLine[] = [];
  if (started.length === 0) lines.push({ kicker: "Gramer", text: `Gramer köşesinde ${CATALOG.length} konu var. İlki "${CATALOG[0].title}": okuması iki, alıştırması beş dakika.` });
  else if (next) lines.push({ kicker: "Gramer", text: `Sıradaki gramer konun: "${next.title}" (${next.titleTr}). Bir göz at?` });
  if (weak) lines.push({ kicker: "Gramer", text: `"${weak.title}" konusunda en iyin %${grammar[weak.slug]?.best}. Bir tur daha, bir yıldız daha.` });
  return lines;
}

/**
 * A pool of pop-in lines for the moment: the live ones (due cards, a word
 * of the learner's own to recall, streak, grammar) first, then small
 * talk, tips and cheers mixed.
 */
export function popLines({
  cards,
  personal,
  streak,
  grammar,
  plan,
}: {
  cards: Card[];
  personal: Card[];
  streak: number;
  grammar?: GrammarProgress;
  /** Today's plan on the learner's own words, once loaded. */
  plan?: Pick<DailyPlan, "reviewsDue" | "newIds"> | null;
}): PopLine[] {
  const live: PopLine[] = [...grammarLines(grammar)];
  const personalDue = ownWaiting(personal, plan);
  if (personalDue > 0) {
    live.push({
      text:
        personalDue === 1
          ? "Bir kartın seni bekliyor. Bir dakika sürer."
          : `${personalDue} kartın seni bekliyor. Hadi, çabuk çevirelim.`,
    });
  }
  // The recall lines use the learner's own words, never the course's, and only ones already met.
  const met = personal.filter(hasStarted);
  if (met.length > 0) {
    const card = met[(dayIndex() + new Date().getHours()) % met.length];
    live.push({ kicker: "Küçük sınav", text: `"${card.front}"? … Sesli söyle.` });
    live.push({ text: `"${card.front}" — bir cümlede kullan. Sesli. Duvarlar duymaz.` });
    const own = card.my_sentence?.trim();
    if (own) live.push({ kicker: "Senin cümlen", text: own.length > 90 ? `${own.slice(0, 90).trimEnd()}…` : own });
    else live.push({ text: `"${card.front}" ile kendi cümleni kurdun mu? Kelimenin sayfasında bir yer var.` });
  }
  // Reviews only: a course word the path hasn't reached isn't waiting yet.
  const courseDue = cards.filter(isDueReview).length;
  if (courseDue > 0) live.push({ text: `Kursta ${courseDue} kelime tekrar bekliyor. Kısa bir tur?` });
  if (streak >= 3) live.push({ text: `${streak} gündür buradasın. Seriyi bozma, bugün bir kart yeter.` });
  const hour = new Date().getHours();
  if (hour >= 22 || hour < 5) live.push({ text: "Gece kelimeleri daha iyi yapışır derler. Bir kart, sonra uyku. 🌙" });
  if (hour >= 6 && hour < 10) live.push({ text: "Sabah sabah bir kelime, gün boyu aklında döner." });

  const fronts = new Set([...cards, ...personal].filter(hasStarted).map((card) => card.front.trim().toLowerCase()));
  const wordTalk = Object.entries(WORD_TALK)
    .filter(([word]) => fronts.has(word))
    .map(([, text]) => text);
  const rest = shuffleByDay([...POP_SMALL_TALK, ...wordTalk, ...POP_TIPS, ...POP_CHEERS], live.length);
  return [...shuffleByDay(live, 3), ...rest.map((text) => ({ text }))];
}

/* ------------------------------------------------------ the director's -- */

/** Right after a grade, on the flashcard screen: a word on most cards, so the pools are wide. */
export const AFTER_GRADE = {
  known: [
    "Gördün mü, biliyormuşsun.",
    "Sessizce not aldım: bildi.",
    "Bu kelime seni tanıdı. Yarın da tanır.",
    "Düşünmeden çıktı. Bu artık senin.",
    "Kısa ve net. Sıradaki.",
    "Tık! Yerine oturdu.",
    "Kulaklarım dikildi. Güzel.",
    "İşte bu. Hafıza böyle güçlenir.",
    "Hızlıydın. Ben bile yetişemedim.",
    "Bir yıldız daha. Hayali, ama olsun. ⭐",
    "Bu kelimeyle aranız iyi.",
  ],
  missed: [
    "Olur öyle. Birkaç kart sonra yine buluşuruz.",
    "Kaçtı ama uzağa gitmedi. Sırada bekliyor.",
    "Bu kelime inatçı. Ben daha inatçıyım.",
    "Yanlış cevap da öğretir. Şimdi arkasına iyi bak.",
    "Unutmak, hatırlamanın ilk adımı. Birazdan yine sorarım.",
    "Sorun değil. Cümlesini oku, kelime cümleyle gelir.",
    "Bir daha gelecek; bu sefer hazır ol.",
    "Hafıza bazen nazlanır. Üstüne gitmeye devam.",
  ],
  hard: [
    "Zorlandın ama bildin. Hafızanın kas ağrısı bu.",
    "Dürüstlük için sağ ol. Biraz daha sık getiririm.",
    "Tereddüt de bir cevap. Not ettim.",
    "Az kaldı. Yarın daha kolay gelecek.",
    "Zorlanmak iyidir; kelime tam da o an yapışır.",
    "Bir dahakine düşünmeden çıkacak, görürsün.",
  ],
};

export const MILESTONE: Record<"run3" | "run5" | "firstMiss" | "returned", PopLine> = {
  run3: { kicker: "Üçlü seri", text: "Üç üst üste. Kulaklarım dikildi." },
  run5: { kicker: "Beşli seri", text: "Beş! Ben bile şaşırdım — ki ben kolay şaşırmam." },
  firstMiss: { text: "Seri bozuldu, fikir bozulmadı. Devam." },
  returned: { kicker: "Geri gelen kart", text: "Geri gelen kartı bildin. En sevdiğim an bu." },
};

/** The first hello of the day, by the hour it happens. */
export const FIRST_OPEN: Record<DayPart, string> = {
  morning: "Günaydın. Kahve sende, kelimeler bende.",
  afternoon: "Öğle arası mı? Üç kart, sonra devam edersin.",
  evening: "Akşam kelimeleri daha iyi yapışır derler. Deneyelim.",
  night: "Bu saatte mi? Bir kart, sonra yat. Ciddiyim.",
};

export const LATE_NIGHT = "Saat geç. Bir kart, sonra ışıkları söndürüyorum.";

export const LONG_ABSENCE = [
  "Üç gündür yoktun. Kelimeler sordu, 'geliyor' dedim.",
  "Geldin. Ben de tam 'gelmeyecek' demiştim; içimden.",
];

export const STREAK_RISK = "Seri bu akşam bir karta bakıyor. Bir tane yeter.";
export const streakLine = (streak: number) => `${streak}. gün. Alev bugün biraz daha parlak.`;

export const IDLE_NUDGE = "Bakıp durma. Bildiysen bildim, bilmediysen bilemedim. Ceza yok.";
export const WORD_PAGE_LINGER = [
  "Kalıplar tek kelimeden daha çok akılda kalır. Birini sesli oku.",
  "Renklere bak: her anlam kendi renginde. Mavi hep birinci anlam.",
  "Örnek cümlelerden birini yüksek sesle oku. Kulak da öğrenir.",
  "Dikkat kutusunu atlama: en sık yapılan hata orada.",
];
export const TOPIC_LINGER = [
  "Örnekleri sesli oku; kural kulağına da yerleşsin.",
  "Yeşil kelimeler konunun kalbi. Onlara bir daha bak.",
  "Okudun mu? Alıştırma aşağıda seni bekliyor. On soru, beş dakika.",
  "Sık yapılan hatalar kısmını oku; sınavda değil, burada yanıl.",
];

export const SUMMARY_LATER = [
  "Yarın aynı saatte? Ben burada olurum. Genelde buradayım.",
  "Bugünün kelimeleri cebinde. Kapıyı kapatırken bir daha söyle.",
];

export const HUSH = "Tamam, sustum. İki saat sonra bakarım.";
export const AUTO_MUTE = "Tamam, sonra.";
