import { Router } from "express";
import { z } from "zod";
import prisma from "../lib/prisma.js";
import { authMiddleware } from "../middleware/auth.js";

const DEFAULT_SOURCES = [
  { name: "Freelance", icon: "💻" },
  { name: "Refund",    icon: "↩️" },
  { name: "Gift",      icon: "🎁" },
  { name: "Others",    icon: "💰" },
];

const router = Router();
router.use(authMiddleware);

router.get("/", async (req, res, next) => {
  try {
    let sources = await prisma.incomeSource.findMany({
      where: { userId: req.userId },
      orderBy: [{ isDefault: "desc" }, { createdAt: "asc" }],
    });
    if (sources.length === 0) {
      await prisma.incomeSource.createMany({
        data: DEFAULT_SOURCES.map((s) => ({ ...s, isDefault: true, userId: req.userId })),
      });
      sources = await prisma.incomeSource.findMany({
        where: { userId: req.userId },
        orderBy: [{ isDefault: "desc" }, { createdAt: "asc" }],
      });
    }
    res.json(sources);
  } catch (err) {
    next(err);
  }
});

router.post("/", async (req, res, next) => {
  try {
    const data = z.object({
      name: z.string().min(1),
      icon: z.string().min(1).default("💰"),
    }).parse(req.body);
    const source = await prisma.incomeSource.create({ data: { ...data, userId: req.userId } });
    res.status(201).json(source);
  } catch (err) {
    next(err);
  }
});

router.delete("/:id", async (req, res, next) => {
  try {
    const source = await prisma.incomeSource.findFirst({
      where: { id: req.params.id, userId: req.userId },
    });
    if (!source) return res.status(404).json({ error: "Not found" });
    if (source.isDefault) return res.status(400).json({ error: "Cannot delete a default source" });
    await prisma.incomeSource.deleteMany({ where: { id: req.params.id, userId: req.userId } });
    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
});

export default router;
