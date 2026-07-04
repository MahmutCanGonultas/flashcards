import { Router } from "express";
import { requireAuth } from "../middleware/requireAuth.js";
import {
  createCard,
  getCards,
  updateCard,
  deleteCard,
} from "../controllers/card.controller.js";

const router = Router();

router.post("/:deckId/cards", requireAuth, createCard);
router.get("/:deckId/cards", requireAuth, getCards);
router.put("/:deckId/cards/:cardId", requireAuth, updateCard);
router.delete("/:deckId/cards/:cardId", requireAuth, deleteCard);

export default router;
