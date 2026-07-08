import { Request, Response } from "express";
import { calculateSrs } from "../services/srs.service.js";
import { z } from "zod";
import pool from "../db.js";

// Kart olusturmak icin kural semasi
const createCardSchema = z.object({
  front: z.string().min(1),
  back: z.string().min(1),
});

// Card Olusturma
export const createCard = async (req: Request, res: Response) => {
  // 1-Gelen Veriyi Doğrula
  const validation = createCardSchema.safeParse(req.body);

  if (!validation.success) {
    return res.status(400).json({ error: "Kart Bilgileri Gecersiz" });
  }

  const { front, back } = validation.data;
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
    "INSERT INTO cards (deck_id, front, back) VALUES ($1,$2,$3) RETURNING *",
    [deckId, front, back],
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

  const { front, back } = validation.data;
  const { deckId, cardId } = req.params;

  // 2. Güncelle — ama sadece bu kullanıcının destesindeki karta dokun
  const result = await pool.query(
    `UPDATE cards
     SET front = $1, back = $2
     WHERE id = $3
       AND deck_id = $4
       AND deck_id IN (SELECT id FROM decks WHERE user_id = $5)
     RETURNING *`,
    [front, back, cardId, deckId, req.userId],
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

  // 1. Notu doğrula (0-5 arası olmalı)
  const reviewSchema = z.object({
    quality: z.number().min(0).max(5),
  });

  const validation = reviewSchema.safeParse(req.body);
  if (!validation.success) {
    return res.status(400).json({ error: "Not 0-5 arası olmalı" });
  }

  const { quality } = validation.data;

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

  // 4. Yeni durumu veritabanına yaz
  const result = await pool.query(
    `UPDATE cards
     SET repetitions = $1, interval = $2, ease_factor = $3, due_date = $4
     WHERE id = $5
     RETURNING *`,
    [
      updated.repetitions,
      updated.interval,
      updated.easeFactor,
      updated.dueDate,
      cardId,
    ],
  );

  return res.status(200).json({ card: result.rows[0] });
};
