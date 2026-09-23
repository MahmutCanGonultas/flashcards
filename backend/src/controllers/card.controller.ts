import { Request, Response } from "express";
import { calculateSrs } from "../services/srs.service.js";
import { z } from "zod";
import pool from "../db.js";

// Kart olusturmak icin kural semasi
const createCardSchema = z.object({
  front: z.string().min(1),
  back: z.string().min(1),
  // Optional grouping label, e.g. "Day 3" for a multi-day program deck.
  tag: z.string().max(50).nullable().optional(),
  // Optional: front used in a sentence, with its Turkish, and a second one.
  exampleSentence: z.string().nullable().optional(),
  exampleTr: z.string().nullable().optional(),
  example2: z.string().nullable().optional(),
  example2Tr: z.string().nullable().optional(),
  // The learner's own note about the word ("where I heard it").
  mnemonic: z.string().nullable().optional(),
  // A rich card: every sense with its pattern and example, derived words, a warning.
  senses: z
    .array(
      z.object({
        pos: z.string().max(40).nullable().optional(),
        meaning: z.string().min(1).max(200),
        pattern: z.string().max(200).nullable().optional(),
        example_en: z.string().max(300).nullable().optional(),
        example_tr: z.string().max(300).nullable().optional(),
        note: z.string().max(300).nullable().optional(),
      }),
    )
    .max(8)
    .nullable()
    .optional(),
  related: z
    .array(z.object({ word: z.string().min(1).max(60), pos: z.string().max(40).nullable().optional(), meaning: z.string().max(200) }))
    .max(8)
    .nullable()
    .optional(),
  watchOut: z.string().max(400).nullable().optional(),
  collocations: z
    .array(z.object({ en: z.string().min(1).max(80), tr: z.string().min(1).max(120) }))
    .max(10)
    .nullable()
    .optional(),
  // The word's own colour (see schema.sql).
  tint: z.string().regex(/^#[0-9a-fA-F]{6}$/).nullable().optional(),
  // A sentence the learner wrote with the word — the strongest cue it has.
  mySentence: z.string().trim().max(300).nullable().optional(),
  // Optional lesson number for path-organised decks.
  lesson: z.number().int().positive().nullable().optional(),
});

// Card Olusturma
export const createCard = async (req: Request, res: Response) => {
  // 1-Gelen Veriyi Doğrula
  const validation = createCardSchema.safeParse(req.body);

  if (!validation.success) {
    return res.status(400).json({ error: "Kart Bilgileri Gecersiz" });
  }

  const { front, back, tag, exampleSentence, mnemonic, lesson, exampleTr, example2, example2Tr, senses, related, watchOut, collocations, tint, mySentence } =
    validation.data;
  const { deckId } = req.params;

  // 2-Bu deste gercekten bu kullanicinin mi ? kontrol et.
  const deckCheck = await pool.query(
    "SELECT * FROM decks WHERE id = $1 AND user_id = $2",
    [deckId, req.userId],
  );

  if (deckCheck.rows.length === 0) {
    return res.status(404).json({ error: "Deste Bulunamadi" });
  }

  // 3-Deste bu kullanicinin - artik karti ekleyebiliriz
  const result = await pool.query(
    `INSERT INTO cards (deck_id, front, back, tag, example_sentence, mnemonic, lesson, example_tr, example2, example2_tr, senses, related, watch_out, collocations, tint, my_sentence)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16) RETURNING *`,
    [
      deckId,
      front,
      back,
      tag ?? null,
      exampleSentence ?? null,
      mnemonic ?? null,
      lesson ?? null,
      exampleTr ?? null,
      example2 ?? null,
      example2Tr ?? null,
      senses ? JSON.stringify(senses) : null,
      related ? JSON.stringify(related) : null,
      watchOut ?? null,
      collocations ? JSON.stringify(collocations) : null,
      tint ?? null,
      mySentence || null,
    ],
  );

  // 4-Olusan Karti Dondur
  return res.status(201).json({ card: result.rows[0] });
};

// Cardları Getirme
export const getCards = async (req: Request, res: Response) => {
  const { deckId } = req.params;

  const result = await pool.query(
    `SELECT cards.* FROM cards
     JOIN decks ON cards.deck_id = decks.id
     WHERE cards.deck_id = $1 AND decks.user_id = $2
     ORDER BY cards.created_at DESC`,
    [deckId, req.userId],
  );

  return res.status(200).json({ cards: result.rows });
};

// Card Güncelleme
export const updateCard = async (req: Request, res: Response) => {
  // 1. Gelen veriyi doğrula
  const validation = createCardSchema.safeParse(req.body);

  if (!validation.success) {
    return res.status(400).json({ error: "Kart bilgileri geçersiz" });
  }

  const { front, back, tag, exampleSentence, mnemonic, exampleTr, example2, example2Tr, senses, related, watchOut, collocations, tint, mySentence } =
    validation.data;
  const { deckId, cardId } = req.params;

  // 2. Güncelle — ama sadece bu kullanıcının destesindeki karta dokun.
  //    Gönderilmeyen alanlar olduğu gibi kalır; null gönderilen silinir.
  const result = await pool.query(
    `UPDATE cards
     SET front = $1, back = $2,
         tag = CASE WHEN $6::boolean THEN $7 ELSE tag END,
         example_sentence = CASE WHEN $8::boolean THEN $9 ELSE example_sentence END,
         mnemonic = CASE WHEN $10::boolean THEN $11 ELSE mnemonic END,
         example_tr = CASE WHEN $12::boolean THEN $13 ELSE example_tr END,
         example2 = CASE WHEN $14::boolean THEN $15 ELSE example2 END,
         example2_tr = CASE WHEN $16::boolean THEN $17 ELSE example2_tr END,
         senses = CASE WHEN $18::boolean THEN $19::jsonb ELSE senses END,
         related = CASE WHEN $20::boolean THEN $21::jsonb ELSE related END,
         watch_out = CASE WHEN $22::boolean THEN $23 ELSE watch_out END,
         collocations = CASE WHEN $24::boolean THEN $25::jsonb ELSE collocations END,
         tint = CASE WHEN $26::boolean THEN $27 ELSE tint END,
         my_sentence = CASE WHEN $28::boolean THEN $29 ELSE my_sentence END
     WHERE id = $3
       AND deck_id = $4
       AND deck_id IN (SELECT id FROM decks WHERE user_id = $5)
     RETURNING *`,
    [
      front, back, cardId, deckId, req.userId,
      tag !== undefined, tag ?? null,
      exampleSentence !== undefined, exampleSentence ?? null,
      mnemonic !== undefined, mnemonic ?? null,
      exampleTr !== undefined, exampleTr ?? null,
      example2 !== undefined, example2 ?? null,
      example2Tr !== undefined, example2Tr ?? null,
      senses !== undefined, senses ? JSON.stringify(senses) : null,
      related !== undefined, related ? JSON.stringify(related) : null,
      watchOut !== undefined, watchOut ?? null,
      collocations !== undefined, collocations ? JSON.stringify(collocations) : null,
      tint !== undefined, tint ?? null,
      mySentence !== undefined, mySentence || null,
    ],
  );

  // 3. Kart bulunamadıysa (yok, yanlış deste, ya da başkasının)
  if (result.rows.length === 0) {
    return res.status(404).json({ error: "Kart bulunamadı" });
  }

  return res.status(200).json({ card: result.rows[0] });
};

// Card Silme
export const deleteCard = async (req: Request, res: Response) => {
  const { deckId, cardId } = req.params;

  const result = await pool.query(
    `DELETE FROM cards
     WHERE id = $1
       AND deck_id = $2
       AND deck_id IN (SELECT id FROM decks WHERE user_id = $3)
     RETURNING *`,
    [cardId, deckId, req.userId],
  );

  if (result.rows.length === 0) {
    return res.status(404).json({ error: "Kart bulunamadı" });
  }

  return res.status(200).json({ message: "Kart silindi" });
};

export const getDueCards = async (req: Request, res: Response) => {
  const { deckId } = req.params;

  const result = await pool.query(
    `SELECT cards.* FROM cards
     JOIN decks ON cards.deck_id = decks.id
     WHERE cards.deck_id = $1
       AND decks.user_id = $2
       AND cards.due_date <= NOW()
     ORDER BY cards.due_date ASC
     LIMIT 20`,
    [deckId, req.userId],
  );

  return res.status(200).json({ cards: result.rows });
};

export const reviewCard = async (req: Request, res: Response) => {
  const { deckId, cardId } = req.params;

  // 1. Notu doğrula (0-5 arası olmalı). `kind` hangi alıştırmanın sorduğu:
  //    recall, produce, cloze… — günlüğe yazılır, zamanlamayı etkilemez.
  const reviewSchema = z.object({
    quality: z.number().min(0).max(5),
    kind: z.string().max(20).regex(/^[a-z-]+$/).optional(),
  });

  const validation = reviewSchema.safeParse(req.body);
  if (!validation.success) {
    return res.status(400).json({ error: "Not 0-5 arası olmalı" });
  }

  const { quality, kind } = validation.data;

  // 2. Kartı çek (mevcut durumu almak için) — güvenlik kontrolüyle
  const cardResult = await pool.query(
    `SELECT c.* FROM cards AS c
     JOIN decks AS d ON c.deck_id = d.id
     WHERE c.id = $1 AND c.deck_id = $2 AND d.user_id = $3`,
    [cardId, deckId, req.userId],
  );

  if (cardResult.rows.length === 0) {
    return res.status(404).json({ error: "Kart bulunamadı" });
  }

  const card = cardResult.rows[0];

  // 3. Beyni çağır: kartın durumu + not → yeni durum
  const updated = calculateSrs({
    repetitions: card.repetitions,
    interval: card.interval,
    easeFactor: card.ease_factor,
    quality: quality,
  });

  // 4. Yeni durumu veritabanına yaz. Bilinemeyen her tekrar `lapses`i bir
  //    artırır: inatçı kelimeler böyle bulunur.
  const result = await pool.query(
    `UPDATE cards
     SET repetitions = $1, interval = $2, ease_factor = $3, due_date = $4,
         lapses = lapses + $6, reviewed_at = NOW()
     WHERE id = $5
     RETURNING *`,
    [
      updated.repetitions,
      updated.interval,
      updated.easeFactor,
      updated.dueDate,
      cardId,
      quality < 3 ? 1 : 0,
    ],
  );

  // 5. Günlüğe yaz. Günlük istatistik içindir; yazılamazsa tekrar yine
  //    sayılır — istemci yeniden denerse aynı kart iki kez notlanmasın diye
  //    burada hata döndürülmez.
  try {
    await pool.query(
      `INSERT INTO review_log (card_id, user_id, quality, kind) VALUES ($1, $2, $3, $4)`,
      [cardId, req.userId, quality, kind ?? null],
    );
  } catch (error) {
    console.error("review_log insert failed", error);
  }

  return res.status(200).json({ card: result.rows[0] });
};

/**
 * How the last seven days went for one deck: how many graded reviews, and
 * how many of them the learner remembered (quality 3 or more).
 */
export const getDeckStats = async (req: Request, res: Response) => {
  const { deckId } = req.params;

  const result = await pool.query(
    `SELECT count(*)::int AS reviews,
            count(*) FILTER (WHERE r.quality >= 3)::int AS remembered
     FROM review_log AS r
     JOIN cards AS c ON c.id = r.card_id
     JOIN decks AS d ON d.id = c.deck_id
     WHERE c.deck_id = $1 AND d.user_id = $2
       AND r.created_at > NOW() - INTERVAL '7 days'`,
    [deckId, req.userId],
  );

  return res.status(200).json({ lastWeek: result.rows[0] });
};
