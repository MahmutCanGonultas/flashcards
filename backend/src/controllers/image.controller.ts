import { Request, Response } from "express";
import { randomBytes } from "node:crypto";
import { z } from "zod";
import pool from "../db.js";

const MAX_BYTES = 1_500_000;

const uploadSchema = z.object({
  mime: z.enum(["image/jpeg", "image/png", "image/webp"]),
  /** Base64, no data: prefix. */
  data: z.string().min(1),
});

/** Where a stored image can be fetched from, absolute so it works in <img src>. */
export const imageUrlFor = (req: Request, token: string) => {
  const base = process.env.PUBLIC_API_URL ?? `${req.protocol}://${req.get("host")}/api/v1`;
  return `${base.replace(/\/+$/, "")}/images/${token}`;
};

export const uploadImage = async (req: Request, res: Response) => {
  const validation = uploadSchema.safeParse(req.body);
  if (!validation.success) return res.status(400).json({ error: "Görsel geçersiz" });
  const { mime, data } = validation.data;
  const buffer = Buffer.from(data, "base64");
  if (buffer.length === 0 || buffer.length > MAX_BYTES) {
    return res.status(413).json({ error: "Görsel çok büyük" });
  }
  const token = randomBytes(18).toString("base64url");
  await pool.query(
    `INSERT INTO images (user_id, token, mime, data) VALUES ($1, $2, $3, $4)`,
    [req.userId, token, mime, buffer],
  );
  return res.status(201).json({ url: imageUrlFor(req, token) });
};

export const getImage = async (req: Request, res: Response) => {
  const { token } = req.params;
  const result = await pool.query(`SELECT mime, data FROM images WHERE token = $1`, [token]);
  if (result.rows.length === 0) return res.status(404).end();
  const { mime, data } = result.rows[0];
  res.setHeader("Content-Type", mime);
  res.setHeader("Cache-Control", "public, max-age=31536000, immutable");
  return res.status(200).send(data);
};
