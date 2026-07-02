import { Request, Response } from "express";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import { email, z } from "zod";
import pool from "../db.js";

// Kullanici Kaydederken DOGRULAMAK ICIN KURAL SEMASI
const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

// Giris İcin Kural Semasi
const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

// REGISTER CONTROLLER
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

// LOGIN CONTROLLER
export const login = async (req: Request, res: Response) => {
  // 1-Gelen veriyi doğrula
  const validation = loginSchema.safeParse(req.body);

  if (!validation.success) {
    return res.status(400).json({ error: "Geçersiz eposta veya parola" });
  }

  const { email, password } = validation.data;

  // 2-Kullaniciyi veritabanindan bul
  const result = await pool.query("SELECT * FROM users WHERE email= $1", [
    email,
  ]);
  const user = result.rows[0];

  // 3-Kullanici yoksa Veya parola yanlissa hata dondur
  if (!user) {
    return res.status(401).json({ error: "E-posta veya parola hatalı" });
  }

  const passwordMatch = await bcrypt.compare(password, user.password_hash);

  if (!passwordMatch) {
    return res.status(401).json({ error: "E-posta veya parola hatali" });
  }

  // 4-Token Uret (Kimlik Karti)
  const token = jwt.sign(
    {
      id: user.id,
    },
    process.env.JWT_SECRET as string,
    { expiresIn: "7d" },
  );

  // 5-Tokeni dondur
  return res.status(200).json({ token });
};
