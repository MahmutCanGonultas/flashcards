import { Router } from "express";
import express from "express";
import { requireAuth } from "../middleware/requireAuth.js";
import { uploadImage, getImage } from "../controllers/image.controller.js";

const router = Router();

// The upload carries a base64 photo, so this route alone accepts a bigger body.
router.post("/", requireAuth, express.json({ limit: "3mb" }), uploadImage);
router.get("/:token", getImage);

export default router;
