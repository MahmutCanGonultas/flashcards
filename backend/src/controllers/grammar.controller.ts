import { Request, Response } from "express";
import { z } from "zod";
import pool from "../db.js";

// Gramer konularının içeriği web uygulamasıyla birlikte gelir; burada yalnızca
// öğrencinin her konudaki en iyi puanı ve kaç kez çalıştığı tutulur.

export const getGrammarProgress = async (req: Request, res: Response) => {
  const result = await pool.query(
    `SELECT topic, best, attempts, updated_at FROM grammar_progress WHERE user_id = $1 ORDER BY topic`,
    [req.userId],
  );
  return res.status(200).json({ progress: result.rows });
};

const scoreSchema = z.object({
  topic: z.string().min(1).max(60).regex(/^[a-z0-9-]+$/),
  score: z.number().int().min(0).max(100),
});

export const saveGrammarScore = async (req: Request, res: Response) => {
  const validation = scoreSchema.safeParse(req.body);
  if (!validation.success) {
    return res.status(400).json({ error: "Konu ya da puan geçersiz" });
  }
  const { topic, score } = validation.data;

  // En iyi puan kalır; her deneme sayılır.
  const result = await pool.query(
    `INSERT INTO grammar_progress (user_id, topic, best, attempts, updated_at)
     VALUES ($1, $2, $3, 1, NOW())
     ON CONFLICT (user_id, topic)
     DO UPDATE SET best = GREATEST(grammar_progress.best, EXCLUDED.best),
                   attempts = grammar_progress.attempts + 1,
                   updated_at = NOW()
     RETURNING topic, best, attempts, updated_at`,
    [req.userId, topic, score],
  );
  return res.status(200).json({ progress: result.rows[0] });
};
