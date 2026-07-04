import express from "express";
import authRouter from "./routes/auth.routes.js";
import deckRouter from "./routes/deck.routes.js";
import cardRouter from "./routes/card.routes.js";

const app = express();
const PORT = 3000;

app.use(express.json());

app.use("/api/v1/auth", authRouter);
app.use("/api/v1/decks", deckRouter);
app.use("/api/v1/decks", cardRouter);

app.get("/", (req, res) => {
  res.send("Flashcards API is running 🚀");
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
