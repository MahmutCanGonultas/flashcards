import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

export const requireAuth = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  // 1- Authorization basligini al
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Yetkilendirme Gerekli " });
  }

  // 2-"Bearer " kısmını ayıkla token'i al
  const token = authHeader.split(" ")[1];

  // 3-Token'ı dogrula
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET as string) as {
      id: number;
    };
    req.userId = payload.id;
    next();
  } catch (error) {
    return res.status(401).json({ error: "Geçersiz veya süresi dolmuş token" });
  }
};
