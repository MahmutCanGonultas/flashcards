import { Request, Response } from "express";
import { z } from "zod";
import pool from "../db.js";

// Deste olusturmak icin kural semasi
const createDeckSchema = z.object({
  name: z.string().min(1),
});

// CREATE
export const createDeck = async (req: Request, res: Response) => {
  // 1-Gelen veriyi dogrula
  const validation = createDeckSchema.safeParse(req.body);

  if (!validation.success) {
    return res.status(400).json({ error: "Deste adı gecersiz" });
  }
  const { name } = validation.data;

  // 2-Desteyi veritabanina kaydet (bu kullaniciya ait olarak)
  const result = await pool.query(
    "INSERT INTO decks (user_id,name) VALUES ($1, $2) RETURNING *",
    [req.userId, name],
  );

  // 3. Oluşan desteyi döndür
  return res.status(201).json({ deck: result.rows[0] });
};

// READ
export const getDecks = async (req: Request, res: Response) => {
  const result = await pool.query(
    "SELECT * FROM decks WHERE user_id = $1 ORDER BY created_at DESC",
    [req.userId],
  );

  return res.status(200).json({ decks: result.rows });
};

// UPDATE
export const updateDeck = async (req: Request, res: Response) => {
  // 1.Gelen Veriyi Doğrula
  const validation = createDeckSchema.safeParse(req.body);

  if (!validation.success) {
    return res.status(400).json({ error: "Deste adi gecersiz" });
  }

  const { name } = validation.data;
  const { id } = req.params;

  // 2-Güncelle - ama sadece bu kullaniciya ait olan desteyi
  const result = await pool.query(
    "UPDATE decks SET name = $1 WHERE id = $2 AND user_id = $3 RETURNING *",
    [name, id, req.userId],
  );

  // 3. Deste bulunamadıysa (ya yok ya da başkasının)
  if (result.rows.length === 0) {
    return res.status(404).json({ error: "Deste bulunamadı" });
  }

  return res.status(200).json({ deck: result.rows[0] });
};

// DELETE
export const deleteDeck = async (req: Request, res: Response) => {
  const { id } = req.params;

  const result = await pool.query(
    "DELETE FROM decks WHERE id = $1 AND user_id = $2 RETURNING *",
    [id, req.userId],
  );

  if (result.rows.length === 0) {
    return res.status(404).json({ error: "Deste bulunamadı" });
  }

  return res.status(200).json({ message: "Deste silindi" });
};
