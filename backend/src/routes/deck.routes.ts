import { Router } from "express";
import { requireAuth } from "../middleware/requireAuth.js";
import { createDeck } from "../controllers/deck.controller.js";

const router = Router();

router.post("/", requireAuth, createDeck);

export default router;
