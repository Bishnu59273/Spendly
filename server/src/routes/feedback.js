import { Router } from "express";
import { z } from "zod";
import prisma from "../lib/prisma.js";
import { authMiddleware } from "../middleware/auth.js";

const router = Router();

// PUBLIC — no auth, used by the landing page testimonials section
router.get("/testimonials", async (req, res, next) => {
  try {
    const entries = await prisma.feedback.findMany({
      where: { stars: { gte: 4 }, recommendation: { not: null } },
      include: { user: { select: { name: true } } },
      orderBy: { createdAt: "desc" },
      take: 50,
    });

    // Deduplicate by userId — keep the longest meaningful text per user
    const byUser = new Map();
    for (const e of entries) {
      if (!e.recommendation || e.recommendation.trim().length < 20) continue;
      const existing = byUser.get(e.userId);
      if (!existing || e.recommendation.length > existing.recommendation.length) {
        byUser.set(e.userId, e);
      }
    }

    const testimonials = [...byUser.values()]
      .slice(0, 3)
      .map((e) => ({
        text: e.recommendation.trim(),
        stars: e.stars,
        name: e.user.name,
        initials: e.user.name.split(" ").map((w) => w[0]).join("").toUpperCase().slice(0, 2),
      }));

    res.json(testimonials);
  } catch (err) {
    next(err);
  }
});

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
