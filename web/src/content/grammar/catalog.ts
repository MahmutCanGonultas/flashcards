import type { Level, Tone, TopicMeta } from "./types";

/**
 * The topics in the learner's own order (the list they were taught in),
 * light enough for the home page to import: titles and badges only. The
 * pages themselves live in beginner.ts, elementary.ts and preIntermediate.ts.
 */
export const LEVELS: { key: Level; title: string; titleTr: string; tone: Tone }[] = [
  { key: "beginner", title: "Beginner", titleTr: "Başlangıç", tone: "grass" },
  { key: "elementary", title: "Elementary", titleTr: "Temel", tone: "ocean" },
  { key: "pre-intermediate", title: "Pre-Intermediate", titleTr: "Orta öncesi", tone: "tangerine" },
];

export const CATALOG: TopicMeta[] = [
  { slug: "to-be", level: "beginner", title: "To Be", titleTr: "am / is / are", emoji: "👋" },
  { slug: "possessive-s-of", level: "beginner", title: "Possessive 's and Of", titleTr: "İyelik: 's ve of", emoji: "🔑" },
  { slug: "possessive-adjectives", level: "beginner", title: "Possessive Adjectives", titleTr: "my, your, his, her…", emoji: "🎒" },
  { slug: "have-got", level: "beginner", title: "Have Got / Has Got", titleTr: "Sahip olmak", emoji: "🐶" },
  { slug: "jobs", level: "beginner", title: "Jobs", titleTr: "Meslekler", emoji: "👩‍⚕️" },

  { slug: "noun-adjective-verb", level: "elementary", title: "Noun · Adjective · Verb", titleTr: "İsim, sıfat, fiil", emoji: "🧩" },
  { slug: "simple-present", level: "elementary", title: "Simple Present Tense", titleTr: "Geniş zaman", emoji: "☕" },
  { slug: "wh-questions", level: "elementary", title: "Wh- Questions", titleTr: "Soru kelimeleri", emoji: "❓" },
  { slug: "sentence-building", level: "elementary", title: "Building a Sentence", titleTr: "Temel cümle kurma", emoji: "🧱" },
  { slug: "to-by-from", level: "elementary", title: "To · By · From", titleTr: "Üç küçük edat", emoji: "🧭" },
  { slug: "numbers", level: "elementary", title: "Numbers", titleTr: "Sayılar", emoji: "🔢" },
  { slug: "ordinals-frequency", level: "elementary", title: "Ordinal Numbers & Frequency", titleTr: "Sıra sayıları ve sıklık", emoji: "🥇" },

  { slug: "likes-dislikes", level: "pre-intermediate", title: "Likes and Dislikes", titleTr: "Sevdiklerin, sevmediklerin", emoji: "❤️" },
  { slug: "articles", level: "pre-intermediate", title: "Articles: a / an / the", titleTr: "Tanımlıklar", emoji: "🍎" },
  { slug: "countable-uncountable", level: "pre-intermediate", title: "Countable & Uncountable", titleTr: "Sayılabilen, sayılamayan", emoji: "🥛" },
  { slug: "there-is-are", level: "pre-intermediate", title: "There is / There are", titleTr: "Var / yok", emoji: "🏠" },
  { slug: "quantifiers", level: "pre-intermediate", title: "Quantifiers", titleTr: "some, any, much, many…", emoji: "⚖️" },
  { slug: "present-continuous", level: "pre-intermediate", title: "Present Continuous", titleTr: "Şimdiki zaman", emoji: "🏃" },
  { slug: "imperatives", level: "pre-intermediate", title: "Imperatives", titleTr: "Emir cümleleri", emoji: "📣" },
  { slug: "linking-words", level: "pre-intermediate", title: "Linking Words", titleTr: "Bağlaçlara giriş", emoji: "🔗" },
  { slug: "future", level: "pre-intermediate", title: "Future Tense", titleTr: "Gelecek zaman", emoji: "🚀" },
];

export const levelOf = (level: Level) => LEVELS.find((l) => l.key === level) ?? LEVELS[0];
export const metaOf = (slug: string) => CATALOG.find((t) => t.slug === slug);
