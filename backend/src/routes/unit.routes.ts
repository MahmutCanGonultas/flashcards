import { Router } from "express";
import { requireAuth } from "../middleware/requireAuth.js";
import { getUnits, recordUnitResult } from "../controllers/unit.controller.js";

const router = Router();

router.get("/:deckId/units", requireAuth, getUnits);
router.post("/:deckId/units/:unitId/result", requireAuth, recordUnitResult);

export default router;
