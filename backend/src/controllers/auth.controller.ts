import { Request, Response } from "express";
import bcrypt from "bcrypt";
import { z } from "zod";
import pool from "../db.js";

// GELEN VERIYI DOGRULAMAK ICIN KURAL SEMASI
const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

export const register = async (req: Request, res: Response) => {
  // 1-Gelen Veriyi Doğrulama
  const validation = registerSchema.safeParse(req.body);

  if (!validation.success) {
    return res.status(400).json({ error: "Geçersiz e-posta veya parola" });
  }
  const { email, password } = validation.data;

  // 2-Parolayı güvenli şekilde hash'le
  const passwordHash = await bcrypt.hash(password, 10);

  // 3-Kullanıcıyı veritabanına kaydet
  const result = await pool.query(
    "INSERT INTO users (email,password_hash) VALUES ($1, $2) RETURNING id, email, created_at",
    [email, passwordHash],
  );

  // 4. Başarılı cevabı döndür
  return res.status(201).json({ user: result.rows[0] });
};
