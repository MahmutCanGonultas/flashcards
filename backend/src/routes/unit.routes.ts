import { Router } from "express";
import { requireAuth } from "../middleware/requireAuth.js";
import { getUnits, recordUnitResult, recordPlacement } from "../controllers/unit.controller.js";

const router = Router();

router.get("/:deckId/units", requireAuth, getUnits);
router.post("/:deckId/units/:unitId/result", requireAuth, recordUnitResult);
router.post("/:deckId/placement", requireAuth, recordPlacement);

export default router;
