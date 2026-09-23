import express from "express";
import cors from "cors";
import authRouter from "./routes/auth.routes.js";
import deckRouter from "./routes/deck.routes.js";
import cardRouter from "./routes/card.routes.js";
import streakRouter from "./routes/streak.routes.js";
import pushRouter from "./routes/push.routes.js";
import unitRouter from "./routes/unit.routes.js";

// Without these the server still boots and answers the platform's health check,
// then fails on the first real request. Refuse to start instead.
const missingEnv = (["DATABASE_URL", "JWT_SECRET"] as const).filter(
  (name) => !process.env[name],
);

if (missingEnv.length > 0) {
  console.error(`Missing required environment variable(s): ${missingEnv.join(", ")}`);
  process.exit(1);
}

const app = express();

// Hosting platforms hand the port to the process; 3000 is the local default.
const PORT = Number(process.env.PORT) || 3000;

// Comma-separated, so a preview deployment can be allowed alongside prod. The
// trailing slash is stripped because browsers never send one in Origin, and a
// stray "https://app.com/" would silently block every request.
const allowedOrigins = (process.env.CORS_ORIGIN ?? "http://localhost:5173")
  .split(",")
  .map((origin) => origin.trim().replace(/\/+$/, ""))
  .filter(Boolean);

app.use(express.json());
// Without CORS_ORIGIN (local development) any localhost port may call the
// API, so a second dev server on another port works without ceremony.
app.use(cors({ origin: process.env.CORS_ORIGIN ? allowedOrigins : /^http:\/\/localhost:\d+$/ }));

app.use("/api/v1/auth", authRouter);
app.use("/api/v1/decks", deckRouter);
app.use("/api/v1/decks", cardRouter);
app.use("/api/v1/decks", unitRouter);
app.use("/api/v1/streak", streakRouter);
app.use("/api/v1/push", pushRouter);

// Which build is answering: Render exposes the deployed commit, so a deploy
// can be confirmed from outside without a real request that writes data.
app.get("/", (req, res) => {
  res.json({ ok: true, commit: (process.env.RENDER_GIT_COMMIT ?? "local").slice(0, 7) });
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
