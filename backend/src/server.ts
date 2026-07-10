import express from "express";
import cors from "cors";
import authRouter from "./routes/auth.routes.js";
import deckRouter from "./routes/deck.routes.js";
import cardRouter from "./routes/card.routes.js";

const app = express();

// Hosting platforms hand the port to the process; 3000 is the local default.
const PORT = Number(process.env.PORT) || 3000;

// Comma-separated list, so a preview deployment can be allowed alongside prod.
const allowedOrigins = (process.env.CORS_ORIGIN ?? "http://localhost:5173")
  .split(",")
  .map((origin) => origin.trim())
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
