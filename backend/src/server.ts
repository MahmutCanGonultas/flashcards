import express from "express";
import authRouter from "./routes/auth.routes.js";

const app = express();
const PORT = 3000;

app.use(express.json());

app.use("/api/v1/auth", authRouter);

app.get("/", (req, res) => {
  res.send("Flashcards API is running 🚀");
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
