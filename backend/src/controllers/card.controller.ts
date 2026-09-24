import { Request, Response } from "express";
import { addsLapse, calculateSrs, PERSONAL_POLICY } from "../services/srs.service.js";
import {
  NEW_PER_DAY,
  dailyPlan,
  introductionDay,
  isStarted,
  newWordAllowed,
  newWordsOn,
  planCounts,
  repeatedLearnWrite,
} from "../services/daily.service.js";
import { learnerDay } from "../services/day.service.js";
import { statsFrom } from "../services/stats.service.js";
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
        // A learner's-dictionary definition in simple English, and more sentences.
        definition: z.string().max(300).nullable().optional(),
        examples: z
          .array(z.object({ en: z.string().min(1).max(300), tr: z.string().max(300).nullable().optional() }))
          .max(6)
          .nullable()
          .optional(),
        // 1 is the core meaning the cards teach, 2 opens once the word has
        // settled, 3 stays on the word page. `gloss` is its short Turkish
        // for the card face.
        tier: z.number().int().min(1).max(3).nullable().optional(),
        gloss: z.string().max(40).nullable().optional(),
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
  // Each chunk may name the sense it belongs to (an index into senses).
  collocations: z
    .array(z.object({ en: z.string().min(1).max(80), tr: z.string().min(1).max(120), sense: z.number().int().min(0).max(7).nullable().optional() }))
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

  // Kendi kelimeler günün planından gelir: en fazla 30 tekrar, sonra bugünün
  // (en fazla 3) yeni kelimesi. Başka destelerde vadesi gelenler; ama dersi
  // olan (patikadaki) bir kelime tanışılmadan gelmez: o, dersinde tanışılır.
  const deck = await pool.query("SELECT id, kind FROM decks WHERE id = $1 AND user_id = $2", [deckId, req.userId]);
  if (deck.rows[0]?.kind === "personal") {
    const plan = await dailyPlan(pool, req.userId!, deck.rows[0].id);
    return res.status(200).json({ cards: [...plan.reviews, ...plan.fresh], plan: planCounts(plan) });
  }

  const result = await pool.query(
    `SELECT cards.* FROM cards
     JOIN decks ON cards.deck_id = decks.id
     WHERE cards.deck_id = $1
       AND decks.user_id = $2
       AND cards.due_date <= NOW()
       AND (cards.repetitions > 0 OR cards.interval > 0 OR cards.lesson IS NULL)
     ORDER BY cards.due_date ASC
     LIMIT 20`,
    [deckId, req.userId],
  );

  return res.status(200).json({ cards: result.rows });
};

/**
 * Today's plan. For the personal deck: the counts behind the home screen
 * (reviews, today's new words, the queue, tomorrow). For a course deck only
 * the shared new-word budget, which gates its lessons.
 */
export const getPlan = async (req: Request, res: Response) => {
  const { deckId } = req.params;

  const deck = await pool.query("SELECT id, kind FROM decks WHERE id = $1 AND user_id = $2", [deckId, req.userId]);
  if (deck.rows.length === 0) {
    return res.status(404).json({ error: "Deste bulunamadı" });
  }

  const now = new Date();
  if (deck.rows[0].kind === "personal") {
    return res.status(200).json(planCounts(await dailyPlan(pool, req.userId!, deck.rows[0].id, now)));
  }
  const day = learnerDay(now);
  return res.status(200).json({ day, cap: NEW_PER_DAY, newToday: await newWordsOn(pool, req.userId!, day) });
};

// Düşünme süresi yalnız günlük içindir: uzun bir ara yüzünden notu
// kaybetmemek için sınırda kırpılır, reddedilmez.
const thinkMsSchema = z.number().transform((ms) => Math.min(Math.max(Math.round(ms), 0), 600_000));

/**
 * A graded answer. `kind` is which screen asked (recall, reverse, produce…),
 * `phase` whether it is a new word's first write ('learn') or a review,
 * `direction` which way the card was asked, `thinkMs` how long the front was
 * up before the flip. All but the grade and phase are only logged.
 */
export const reviewSchema = z.object({
  quality: z.number().min(0).max(5),
  kind: z.string().max(20).regex(/^[a-z-]+$/).optional(),
  phase: z.enum(["learn", "review"]).optional(),
  direction: z.enum(["fwd", "rev"]).optional(),
  thinkMs: thinkMsSchema.optional(),
});

/** An ungraded answer: a learning step, a repeat, a filler, an exercise, the drill. */
export const practiceSchema = z.object({
  quality: z.union([z.literal(1), z.literal(3), z.literal(4), z.literal(5)]),
  kind: z.string().max(20).regex(/^[a-z-]+$/),
  phase: z.enum(["learn-step", "relearn", "filler", "practice", "exercise", "drill"]),
  direction: z.enum(["fwd", "rev"]).optional(),
  thinkMs: thinkMsSchema.optional(),
});

export const reviewCard = async (req: Request, res: Response) => {
  const { deckId, cardId } = req.params;

  // 1. Notu doğrula (0-5 arası olmalı). `kind` hangi alıştırmanın sorduğu:
  //    recall, reverse, cloze… — günlüğe yazılır, zamanlamayı etkilemez.
  const validation = reviewSchema.safeParse(req.body);
  if (!validation.success) {
    return res.status(400).json({ error: "Not 0-5 arası olmalı" });
  }

  const { quality, kind, phase, direction, thinkMs } = validation.data;

  // 2. Kartı çek (mevcut durumu almak için) — güvenlik kontrolüyle. Destenin
  //    türü hangi zamanlamanın kullanılacağını seçer.
  const cardResult = await pool.query(
    `SELECT c.*, d.kind AS deck_kind FROM cards AS c
     JOIN decks AS d ON c.deck_id = d.id
     WHERE c.id = $1 AND c.deck_id = $2 AND d.user_id = $3`,
    [cardId, deckId, req.userId],
  );

  if (cardResult.rows.length === 0) {
    return res.status(404).json({ error: "Kart bulunamadı" });
  }

  const card = cardResult.rows[0];
  const now = new Date();
  const day = learnerDay(now);
  const started = isStarted(card);

  // 3. Yeni kelimenin bugün zaten yazılmış öğrenme yazımı ikinci kez gelirse
  //    (yanıtı kaybolmuş bir isteğin tekrarı) kart olduğu gibi döner: iki kez
  //    işlenirse ilk tekrarı sayılır ve kelime bir basamak atlar.
  if (repeatedLearnWrite(phase, started, card.introduced_on, day)) {
    const { deck_kind: _deckKind, ...row } = card;
    return res.status(200).json({ card: row });
  }

  // 4. Günde en fazla 3 yeni kelime, kurs dahil. Hiç başlamamış bir kelimenin
  //    ilk yazımı bugünün payından yer; pay dolduysa hiçbir şey yazılmaz.
  //    Eski bir uygulama sürümüne ve kursa karşı da geçerli.
  const newToday = started || card.introduced_on !== null ? 0 : await newWordsOn(pool, req.userId!, day);
  if (!newWordAllowed(started, card.introduced_on, newToday)) {
    return res.status(409).json({ error: `Bugünün ${NEW_PER_DAY} yeni kelimesi doldu` });
  }

  // Başlamış ama tanışma günü yazılmamış kelime (API'nin eski sürümünde
  // çalışılmış): tanışma günü ilk cevabının günüdür, bugünün payından yemez.
  const firstAnswerAt =
    started && card.introduced_on === null
      ? ((await pool.query("SELECT min(created_at) AS at FROM review_log WHERE card_id = $1", [cardId])).rows[0]?.at ?? card.reviewed_at)
      : null;

  // 5. Beyni çağır: kartın durumu + not → yeni durum
  const updated = calculateSrs(
    {
      repetitions: card.repetitions,
      interval: card.interval,
      easeFactor: card.ease_factor,
      quality: quality,
      phase,
      direction,
    },
    { policy: card.deck_kind === "personal" ? PERSONAL_POLICY : "classic", now },
  );

  // 6. Yeni durumu veritabanına yaz. Gerçekten unutulan her tekrar `lapses`i
  //    bir artırır: inatçı kelimeler böyle bulunur (yeni kelimenin ilk yazımı
  //    asla). İlk yazım kelimenin tanıştığı günü de işaretler.
  const result = await pool.query(
    `UPDATE cards
     SET repetitions = $1, interval = $2, ease_factor = $3, due_date = $4,
         lapses = lapses + $6, reviewed_at = NOW(),
         introduced_on = COALESCE(introduced_on, $7::date)
     WHERE id = $5
     RETURNING *`,
    [
      updated.repetitions,
      updated.interval,
      updated.easeFactor,
      updated.dueDate,
      cardId,
      addsLapse(updated, phase, started) ? 1 : 0,
      introductionDay(started, firstAnswerAt, now),
    ],
  );

  // 7. Günlüğe yaz. Günlük istatistik içindir; yazılamazsa tekrar yine
  //    sayılır — istemci yeniden denerse aynı kart iki kez notlanmasın diye
  //    burada hata döndürülmez.
  try {
    await pool.query(
      `INSERT INTO review_log (card_id, user_id, quality, kind, phase, direction, think_ms, scheduled)
       VALUES ($1, $2, $3, $4, $5, $6, $7, TRUE)`,
      [cardId, req.userId, quality, kind ?? null, phase ?? null, direction ?? null, thinkMs ?? null],
    );
  } catch (error) {
    console.error("review_log insert failed", error);
  }

  return res.status(200).json({ card: result.rows[0] });
};

/**
 * An answer that never touches the schedule — a learning step, a repeat in
 * the round, a filler, an exercise, the drill — logged so the numbers can
 * tell practice from graded reviews.
 */
export const practiceCard = async (req: Request, res: Response) => {
  const { deckId, cardId } = req.params;

  const validation = practiceSchema.safeParse(req.body);
  if (!validation.success) {
    return res.status(400).json({ error: "Cevap geçersiz" });
  }

  const { quality, kind, phase, direction, thinkMs } = validation.data;

  const owned = await pool.query(
    `SELECT c.id FROM cards AS c
     JOIN decks AS d ON c.deck_id = d.id
     WHERE c.id = $1 AND c.deck_id = $2 AND d.user_id = $3`,
    [cardId, deckId, req.userId],
  );

  if (owned.rows.length === 0) {
    return res.status(404).json({ error: "Kart bulunamadı" });
  }

  await pool.query(
    `INSERT INTO review_log (card_id, user_id, quality, kind, phase, direction, think_ms, scheduled)
     VALUES ($1, $2, $3, $4, $5, $6, $7, FALSE)`,
    [cardId, req.userId, quality, kind, phase, direction ?? null, thinkMs ?? null],
  );

  return res.status(200).json({ ok: true });
};

/**
 * How the last seven days went for one deck: the graded reviews by grade,
 * and how the typed exercises went (see statsFrom).
 */
export const getDeckStats = async (req: Request, res: Response) => {
  const { deckId } = req.params;

  const result = await pool.query(
    `SELECT r.quality, r.kind, r.phase, r.scheduled
     FROM review_log AS r
     JOIN cards AS c ON c.id = r.card_id
     JOIN decks AS d ON d.id = c.deck_id
     WHERE c.deck_id = $1 AND d.user_id = $2
       AND r.created_at > NOW() - INTERVAL '7 days'`,
    [deckId, req.userId],
  );

  return res.status(200).json({ lastWeek: statsFrom(result.rows) });
};
