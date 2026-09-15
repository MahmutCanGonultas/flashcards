import { Request, Response } from "express";
import { z } from "zod";
import pool from "../db.js";

// The client sends its own local date. The server's clock is UTC, so a
// late-night session in UTC+3 would otherwise be filed under the previous day
// and quietly break the streak.
const touchSchema = z.object({
  localDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
});

export const getStreak = async (req: Request, res: Response) => {
  const result = await pool.query(
    `SELECT streak_count, to_char(last_study_date, 'YYYY-MM-DD') AS last_study_date
     FROM users WHERE id = $1`,
    [req.userId],
  );

  if (result.rows.length === 0) {
    return res.status(404).json({ error: "Kullanici bulunamadi" });
  }

  const { streak_count, last_study_date } = result.rows[0];
  // A run that wasn't extended yesterday or today is over, whatever the
  // stored count says. Dates are compared in the learner's zone.
  const localDate = typeof req.query.localDate === "string" && /^\d{4}-\d{2}-\d{2}$/.test(req.query.localDate)
    ? req.query.localDate
    : new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Istanbul", year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date());
  const dayMs = 86_400_000;
  const gapDays = last_study_date ? Math.round((Date.parse(localDate) - Date.parse(last_study_date)) / dayMs) : Infinity;
  const alive = gapDays <= 1;
  return res.status(200).json({
    streak: alive ? (streak_count ?? 0) : 0,
    lastStudyDate: last_study_date,
  });
};

/**
 * Records that the user studied today. Same day again keeps the number
 * unchanged; the day after continues the run; any longer gap starts over at 1.
 */
export const touchStreak = async (req: Request, res: Response) => {
  const validation = touchSchema.safeParse(req.body);
  if (!validation.success) {
    return res.status(400).json({ error: "Gecersiz tarih" });
  }

  const { localDate } = validation.data;

  const result = await pool.query(
    `UPDATE users
     SET streak_count = CASE
           WHEN last_study_date = $2::date THEN GREATEST(streak_count, 1)
           WHEN last_study_date = $2::date - 1 THEN streak_count + 1
           ELSE 1
         END,
         last_study_date = $2::date
     WHERE id = $1
     RETURNING streak_count, to_char(last_study_date, 'YYYY-MM-DD') AS last_study_date`,
    [req.userId, localDate],
  );

  if (result.rows.length === 0) {
    return res.status(404).json({ error: "Kullanici bulunamadi" });
  }

  const { streak_count, last_study_date } = result.rows[0];
  return res.status(200).json({ streak: streak_count, lastStudyDate: last_study_date });
};
