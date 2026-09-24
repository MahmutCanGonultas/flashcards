import { Router } from "express";
import { requireAuth } from "../middleware/requireAuth.js";
import { suggestCard } from "../controllers/suggest.controller.js";
import {
  createCard,
  getCards,
  updateCard,
  deleteCard,
  getDueCards,
  reviewCard,
  practiceCard,
  getDeckStats,
  getPlan,
} from "../controllers/card.controller.js";

const router = Router();

router.post("/:deckId/cards", requireAuth, createCard);
router.post("/:deckId/cards/suggest", requireAuth, suggestCard);
router.get("/:deckId/cards", requireAuth, getCards);
router.put("/:deckId/cards/:cardId", requireAuth, updateCard);
router.delete("/:deckId/cards/:cardId", requireAuth, deleteCard);
router.get("/:deckId/cards/due", requireAuth, getDueCards);
router.post("/:deckId/cards/:cardId/review", requireAuth, reviewCard);
router.post("/:deckId/cards/:cardId/practice", requireAuth, practiceCard);
router.get("/:deckId/stats", requireAuth, getDeckStats);
router.get("/:deckId/plan", requireAuth, getPlan);

export default router;
