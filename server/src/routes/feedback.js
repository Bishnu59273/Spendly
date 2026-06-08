import { Router } from "express";
import { z } from "zod";
import prisma from "../lib/prisma.js";
import { authMiddleware } from "../middleware/auth.js";

const router = Router();
router.use(authMiddleware);

const feedbackSchema = z.object({
  stars: z.number().int().min(1).max(5),
  recommendation: z.string().max(1000).optional(),
});

router.post("/", async (req, res, next) => {
  try {
    const data = feedbackSchema.parse(req.body);
    const entry = await prisma.feedback.create({
      data: { ...data, userId: req.userId },
    });
    res.status(201).json(entry);
  } catch (err) {
    next(err);
  }
});

export default router;
