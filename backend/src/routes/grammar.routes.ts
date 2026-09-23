import { Router } from "express";
import { requireAuth } from "../middleware/requireAuth.js";
import { getGrammarProgress, saveGrammarScore } from "../controllers/grammar.controller.js";

const router = Router();

router.get("/progress", requireAuth, getGrammarProgress);
router.post("/progress", requireAuth, saveGrammarScore);

export default router;
