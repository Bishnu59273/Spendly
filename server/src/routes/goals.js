import { Router } from "express";
import { z } from "zod";
import prisma from "../lib/prisma.js";
import { authMiddleware } from "../middleware/auth.js";

const router = Router();
router.use(authMiddleware);

const goalSchema = z.object({
  name: z.string().min(1),
  icon: z.string().default("🎯"),
  color: z.string().default("#1d6b51"),
  target: z.number().positive(),
  saved: z.number().min(0).default(0),
  monthly: z.number().min(0).default(0),
  isPrimary: z.boolean().default(false),
});

router.get("/", async (req, res, next) => {
  try {
    const goals = await prisma.goal.findMany({
      where: { userId: req.userId },
      orderBy: [{ isPrimary: "desc" }, { createdAt: "asc" }],
    });
    res.json(goals);
  } catch (err) {
    next(err);
  }
});

router.post("/", async (req, res, next) => {
  try {
    const data = goalSchema.parse(req.body);
    // Only one primary goal allowed — demote others if this is primary
    if (data.isPrimary) {
      await prisma.goal.updateMany({
        where: { userId: req.userId, isPrimary: true },
        data: { isPrimary: false },
      });
    }
    const goal = await prisma.goal.create({ data: { ...data, userId: req.userId } });
    res.status(201).json(goal);
  } catch (err) {
    next(err);
  }
});

router.patch("/:id", async (req, res, next) => {
  try {
    const existing = await prisma.goal.findFirst({ where: { id: req.params.id, userId: req.userId } });
    if (!existing) return res.status(404).json({ error: "Not found" });

    const data = goalSchema.partial().parse(req.body);
    if (data.isPrimary) {
      await prisma.goal.updateMany({
        where: { userId: req.userId, isPrimary: true, id: { not: req.params.id } },
        data: { isPrimary: false },
      });
    }
    const goal = await prisma.goal.update({ where: { id: req.params.id }, data });

    if (data.saved !== undefined) {
      await prisma.goalSnapshot.create({
        data: { goalId: req.params.id, savedAmount: goal.saved },
      });
    }

    res.json(goal);
  } catch (err) {
    next(err);
  }
});

router.get("/:id/snapshots", async (req, res, next) => {
  try {
    const existing = await prisma.goal.findFirst({ where: { id: req.params.id, userId: req.userId } });
    if (!existing) return res.status(404).json({ error: "Not found" });

    const rows = await prisma.goalSnapshot.findMany({
      where: { goalId: req.params.id },
      orderBy: { snapshotDate: "desc" },
      take: 12,
    });
    res.json(rows.reverse());
  } catch (err) {
    next(err);
  }
});

router.delete("/:id", async (req, res, next) => {
  try {
    const existing = await prisma.goal.findFirst({ where: { id: req.params.id, userId: req.userId } });
    if (!existing) return res.status(404).json({ error: "Not found" });
    await prisma.goal.delete({ where: { id: req.params.id } });
    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
});

export default router;
