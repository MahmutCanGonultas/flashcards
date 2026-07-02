import { Router } from "express";
import { requireAuth } from "../middleware/requireAuth.js";
import {
  createDeck,
  getDecks,
  updateDeck,
  deleteDeck,
} from "../controllers/deck.controller.js";

const router = Router();

router.post("/", requireAuth, createDeck);
router.get("/", requireAuth, getDecks);
router.put("/:id", requireAuth, updateDeck);
router.delete("/:id", requireAuth, deleteDeck);

export default router;
