import { Request, Response } from "express";
import { z } from "zod";
import webpush from "web-push";
import pool from "../db.js";
import { dailyPlan, pushLine } from "../services/daily.service.js";

/**
 * Daily reminders as Web Push. The learner turns them on from the app (a
 * user gesture, as browsers require), picks an hour, and once an hour a
 * scheduled job asks the server to send. The server sends to everyone
 * whose hour it is in their own time zone, at most once a day, and only
 * when there is something to do — a reminder with nothing behind it
 * teaches people to ignore reminders.
 *
 * The VAPID keys are generated once and kept in the settings table, so
 * no deploy-time configuration is needed.
 */

const TIMEZONE_DEFAULT = "Europe/Istanbul";

async function vapidKeys(): Promise<{ publicKey: string; privateKey: string }> {
  const { rows } = await pool.query(`SELECT key, value FROM settings WHERE key IN ('vapid_public', 'vapid_private')`);
  const found = Object.fromEntries(rows.map((r: { key: string; value: string }) => [r.key, r.value]));
  if (found.vapid_public && found.vapid_private) return { publicKey: found.vapid_public, privateKey: found.vapid_private };
  const keys = webpush.generateVAPIDKeys();
  await pool.query(
    `INSERT INTO settings (key, value) VALUES ('vapid_public', $1), ('vapid_private', $2)
     ON CONFLICT (key) DO NOTHING`,
    [keys.publicKey, keys.privateKey],
  );
  // Another instance may have won the race; read back what's stored.
  const again = await pool.query(`SELECT key, value FROM settings WHERE key IN ('vapid_public', 'vapid_private')`);
  const stored = Object.fromEntries(again.rows.map((r: { key: string; value: string }) => [r.key, r.value]));
  return { publicKey: stored.vapid_public, privateKey: stored.vapid_private };
}

export const getPushKey = async (_req: Request, res: Response) => {
  const { publicKey } = await vapidKeys();
  return res.status(200).json({ publicKey });
};

const subscribeSchema = z.object({
  subscription: z.object({
    endpoint: z.string().url().max(2000),
    keys: z.object({ p256dh: z.string().min(1), auth: z.string().min(1) }),
  }),
  hour: z.number().int().min(0).max(23).optional(),
  timezone: z.string().max(60).optional(),
});

export const subscribePush = async (req: Request, res: Response) => {
  const validation = subscribeSchema.safeParse(req.body);
  if (!validation.success) return res.status(400).json({ error: "Abonelik geçersiz" });
  const { subscription, hour = 20, timezone = TIMEZONE_DEFAULT } = validation.data;
  await pool.query(
    `INSERT INTO push_subscriptions (user_id, endpoint, p256dh, auth, hour, timezone)
     VALUES ($1, $2, $3, $4, $5, $6)
     ON CONFLICT (endpoint) DO UPDATE SET user_id = EXCLUDED.user_id, p256dh = EXCLUDED.p256dh,
       auth = EXCLUDED.auth, hour = EXCLUDED.hour, timezone = EXCLUDED.timezone`,
    [req.userId, subscription.endpoint, subscription.keys.p256dh, subscription.keys.auth, hour, timezone],
  );
  return res.status(201).json({ ok: true, hour, timezone });
};

const unsubscribeSchema = z.object({ endpoint: z.string().url().max(2000) });

export const unsubscribePush = async (req: Request, res: Response) => {
  const validation = unsubscribeSchema.safeParse(req.body);
  if (!validation.success) return res.status(400).json({ error: "Abonelik geçersiz" });
  await pool.query(`DELETE FROM push_subscriptions WHERE user_id = $1 AND endpoint = $2`, [req.userId, validation.data.endpoint]);
  return res.status(200).json({ ok: true });
};

export const pushStatus = async (req: Request, res: Response) => {
  const { rows } = await pool.query(
    `SELECT endpoint, hour, timezone, last_sent_on FROM push_subscriptions WHERE user_id = $1 ORDER BY id DESC`,
    [req.userId],
  );
  return res.status(200).json({ subscriptions: rows });
};

/** Send a test reminder to this user's devices right now. */
export const pushTest = async (req: Request, res: Response) => {
  const { rows } = await pool.query(`SELECT * FROM push_subscriptions WHERE user_id = $1`, [req.userId]);
  if (rows.length === 0) return res.status(404).json({ error: "Abonelik yok" });
  const sent = await sendToAll(rows, {
    title: "Tonton burada 👋",
    body: "Hatırlatmalar açık. Kartların bekleyince böyle haber vereceğim.",
    url: "/decks",
  });
  return res.status(200).json({ sent });
};

/** What hour it is now, and today's date, in a zone. */
function nowIn(timezone: string): { hour: number; date: string } {
  try {
    const parts = new Intl.DateTimeFormat("en-CA", {
      timeZone: timezone,
      hour12: false,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
    }).formatToParts(new Date());
    const get = (type: string) => parts.find((p) => p.type === type)?.value ?? "";
    return { hour: Number(get("hour")) % 24, date: `${get("year")}-${get("month")}-${get("day")}` };
  } catch {
    return nowIn(TIMEZONE_DEFAULT);
  }
}

type Sub = { id: number; user_id: number; endpoint: string; p256dh: string; auth: string; hour: number; timezone: string; last_sent_on: string | null };

async function sendToAll(subs: Sub[], payload: { title: string; body: string; url: string }): Promise<number> {
  const keys = await vapidKeys();
  webpush.setVapidDetails("mailto:kelimece@example.com", keys.publicKey, keys.privateKey);
  let sent = 0;
  for (const sub of subs) {
    try {
      await webpush.sendNotification(
        { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
        JSON.stringify({ ...payload, tag: "kelimece-daily" }),
        { TTL: 4 * 3600, timeout: 10_000 },
      );
      sent++;
    } catch (error) {
      const status = (error as { statusCode?: number }).statusCode;
      console.warn(`push to ${sub.id} failed`, status ?? (error as Error).message);
      // Gone (404/410) or rejected outright (401/403: a key that no longer
      // matches): forget it, so the app offers to turn reminders on again.
      if (status === 404 || status === 410 || status === 401 || status === 403) {
        await pool.query(`DELETE FROM push_subscriptions WHERE id = $1`, [sub.id]);
      }
    }
  }
  return sent;
}

/**
 * Called on the hour by the scheduler. Public and idempotent: whoever
 * calls it, each subscription is sent at most once per local day, only
 * at its own hour, only with something to do. What is waiting comes from
 * today's plan (read-only), so the reminder names the same numbers as the
 * home screen.
 */
export const runPushReminders = async (_req: Request, res: Response) => {
  const { rows: subs } = await pool.query<Sub>(
    `SELECT id, user_id, endpoint, p256dh, auth, hour, timezone, to_char(last_sent_on, 'YYYY-MM-DD') AS last_sent_on
     FROM push_subscriptions`,
  );
  const byUser = new Map<number, Sub[]>();
  for (const sub of subs) {
    const now = nowIn(sub.timezone || TIMEZONE_DEFAULT);
    // From the chosen hour until midnight: a late or skipped cron run
    // still gets that day's reminder out, and never twice.
    if (now.hour < sub.hour) continue;
    if (sub.last_sent_on === now.date) continue;
    byUser.set(sub.user_id, [...(byUser.get(sub.user_id) ?? []), sub]);
  }
  let sent = 0;
  for (const [userId, userSubs] of byUser) {
    // Course cards due for at least an hour: a word missed ten minutes ago
    // is not a reason to buzz someone who is clearly studying right now.
    const { rows: [due] } = await pool.query(
      `SELECT COUNT(*)::int AS course
       FROM cards c JOIN decks d ON d.id = c.deck_id
       WHERE d.user_id = $1 AND d.kind <> 'personal' AND c.due_date <= NOW() - INTERVAL '1 hour'
         AND (c.repetitions > 0 OR c.interval > 0)`,
      [userId],
    );
    const { rows: [personal] } = await pool.query(
      `SELECT id FROM decks WHERE user_id = $1 AND kind = 'personal' ORDER BY id LIMIT 1`,
      [userId],
    );
    const plan = personal ? await dailyPlan(pool, userId, personal.id) : null;
    const line = pushLine({
      deckId: personal?.id ?? null,
      plan,
      course: due?.course ?? 0,
      exercisesToday: plan?.exercisesToday ?? 0,
      started: plan?.exercisable ?? 0,
    });
    if (!line) continue;
    const count = await sendToAll(userSubs, { title: "Kelimece", ...line });
    sent += count;
    const today = nowIn(userSubs[0].timezone || TIMEZONE_DEFAULT).date;
    await pool.query(`UPDATE push_subscriptions SET last_sent_on = $1 WHERE id = ANY($2::int[])`, [today, userSubs.map((s) => s.id)]);
  }
  return res.status(200).json({ considered: subs.length, sent });
};
