import { Request, Response } from "express";
import { z } from "zod";
import pool from "../db.js";

/** Percentage needed to pass a unit test and open the next unit. */
export const UNIT_PASS_MARK = 80;

/**
 * A deck's units in path order, each with this learner's test history folded
 * in: whether they have ever passed, and their best score so far.
 */
export const getUnits = async (req: Request, res: Response) => {
  const { deckId } = req.params;

  const result = await pool.query(
    `SELECT units.id, units.position, units.title, units.level, units.dialogue,
            COALESCE(BOOL_OR(unit_results.passed), FALSE) AS passed,
            MAX(unit_results.score) AS best_score,
            COUNT(unit_results.id)::int AS attempts
     FROM units
     JOIN decks ON decks.id = units.deck_id
     LEFT JOIN unit_results
       ON unit_results.unit_id = units.id AND unit_results.user_id = $2
     WHERE units.deck_id = $1 AND decks.user_id = $2
     GROUP BY units.id
     ORDER BY units.position`,
    [deckId, req.userId],
  );

  return res.status(200).json({ units: result.rows });
};

const resultSchema = z.object({
  score: z.number().int().min(0).max(100),
});

/**
 * Records one attempt at a unit's test. The server decides whether it passed,
 * so the pass mark can't be argued with from the client.
 */
export const recordUnitResult = async (req: Request, res: Response) => {
  const validation = resultSchema.safeParse(req.body);
  if (!validation.success) {
    return res.status(400).json({ error: "Gecersiz sonuc" });
  }

  const { deckId, unitId } = req.params;
  const { score } = validation.data;

  const unitCheck = await pool.query(
    `SELECT units.id FROM units
     JOIN decks ON decks.id = units.deck_id
     WHERE units.id = $1 AND units.deck_id = $2 AND decks.user_id = $3`,
    [unitId, deckId, req.userId],
  );
  if (unitCheck.rows.length === 0) {
    return res.status(404).json({ error: "Unite bulunamadi" });
  }

  const passed = score >= UNIT_PASS_MARK;
  await pool.query(
    `INSERT INTO unit_results (user_id, unit_id, score, passed) VALUES ($1, $2, $3, $4)`,
    [req.userId, unitId, score, passed],
  );

  const best = await pool.query(
    `SELECT MAX(score) AS best_score, COALESCE(BOOL_OR(passed), FALSE) AS passed
     FROM unit_results WHERE user_id = $1 AND unit_id = $2`,
    [req.userId, unitId],
  );

  return res.status(201).json({
    score,
    passed,
    bestScore: best.rows[0].best_score,
    everPassed: best.rows[0].passed,
  });
};
