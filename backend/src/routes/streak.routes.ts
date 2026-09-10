import { Router } from "express";
import { requireAuth } from "../middleware/requireAuth.js";
import { getStreak, touchStreak } from "../controllers/streak.controller.js";

const router = Router();

router.get("/", requireAuth, getStreak);
router.post("/", requireAuth, touchStreak);

export default router;
