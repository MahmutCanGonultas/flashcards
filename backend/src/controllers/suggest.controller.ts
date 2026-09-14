import { Request, Response } from "express";
import { z } from "zod";

/**
 * Fills in a card from just the word: meaning, part of speech, emoji, two
 * example sentences with Turkish, and a topic — so adding a word is typing
 * it, checking, saving. Needs ANTHROPIC_API_KEY on the server; without it
 * the client falls back to typing everything by hand.
 */
const suggestSchema = z.object({
  word: z.string().min(1).max(60),
  /** What the learner wrote about it, if anything — kept as their note, used as context. */
  note: z.string().max(400).nullable().optional(),
});

const MODEL = "claude-haiku-4-5-20251001";

const RESULT_SHAPE = `{
  "front": "the English headword, corrected spelling/casing (lowercase unless a proper noun)",
  "meaning_tr": "the most natural everyday Turkish meaning, comma-separated if two common senses, max 30 chars",
  "pos": "noun | verb | adjective | adverb | phrasal verb | idiom | interjection | preposition | conjunction | pronoun | expression",
  "emoji": "one fitting emoji or empty string",
  "example_en": "one natural sentence (max 12 words) using the word or a natural inflection, showing it in a real situation, never a definition",
  "example_tr": "its natural Turkish translation, containing a counterpart of the word",
  "example2_en": "a second sentence from a different situation (max 12 words)",
  "example2_tr": "its natural Turkish translation",
  "topic": "a 1-2 word English topic label such as Food, Work, Feelings, Travel, Home, Health, Nature, Technology, Money, People, School, Sport, Daily life, Idioms",
  "topic_tr": "the same topic in Turkish"
}`;

export const suggestCard = async (req: Request, res: Response) => {
  const validation = suggestSchema.safeParse(req.body);
  if (!validation.success) return res.status(400).json({ error: "Kelime geçersiz" });
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return res.status(503).json({ error: "Otomatik doldurma kapalı: sunucuda ANTHROPIC_API_KEY yok" });

  const { word, note } = validation.data;
  const prompt = `You are the content writer for Kelimece, an English course for Turkish speakers. The learner wants a flashcard for the English word or phrase: "${word}".${note ? ` Their own note about it: "${note}". Respect what they mean by it.` : ""}
Return ONLY a JSON object with exactly these fields (no prose, no code fences):
${RESULT_SHAPE}
Use proper Turkish characters (ı İ ş ğ ü ö ç). Sentences must be everyday, concrete, warm.`;

  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: MODEL,
      max_tokens: 600,
      messages: [{ role: "user", content: prompt }],
    }),
  });
  if (!response.ok) {
    return res.status(502).json({ error: "Öneri alınamadı" });
  }
  const body = (await response.json()) as { content?: { type: string; text?: string }[] };
  const text = body.content?.find((c) => c.type === "text")?.text ?? "";
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  if (start === -1 || end === -1) return res.status(502).json({ error: "Öneri okunamadı" });
  try {
    const parsed = JSON.parse(text.slice(start, end + 1));
    return res.status(200).json({ suggestion: parsed });
  } catch {
    return res.status(502).json({ error: "Öneri okunamadı" });
  }
};
