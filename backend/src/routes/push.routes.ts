import { Router } from "express";
import { requireAuth } from "../middleware/requireAuth.js";
import { getPushKey, subscribePush, unsubscribePush, pushStatus, pushTest, runPushReminders } from "../controllers/push.controller.js";

const router = Router();

router.get("/key", getPushKey);
router.get("/status", requireAuth, pushStatus);
router.post("/subscribe", requireAuth, subscribePush);
router.post("/unsubscribe", requireAuth, unsubscribePush);
router.post("/test", requireAuth, pushTest);
// The scheduler's door. No auth on purpose: it can only cause the daily
// check to run, which is idempotent (see runPushReminders).
router.post("/run", runPushReminders);

export default router;
