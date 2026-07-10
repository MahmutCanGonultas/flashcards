import express from "express";
import cors from "cors";
import authRouter from "./routes/auth.routes.js";
import deckRouter from "./routes/deck.routes.js";
import cardRouter from "./routes/card.routes.js";

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
app.use(cors({ origin: allowedOrigins }));

app.use("/api/v1/auth", authRouter);
app.use("/api/v1/decks", deckRouter);
app.use("/api/v1/decks", cardRouter);

app.get("/", (req, res) => {
  res.send("Flashcards API is running 🚀");
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
