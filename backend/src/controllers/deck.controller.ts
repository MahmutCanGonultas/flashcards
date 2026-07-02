import { Request, Response } from "express";
import { z } from "zod";
import pool from "../db.js";

// Deste olusturmak icin kural semasi
const createDeckSchema = z.object({
  name: z.string().min(1),
});

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
