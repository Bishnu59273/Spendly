import { Router } from "express";
import { z } from "zod";
import prisma from "../lib/prisma.js";
import { authMiddleware } from "../middleware/auth.js";

const router = Router();
router.use(authMiddleware);

const categorySchema = z.object({
  name: z.string().min(1),
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/),
  icon: z.string().min(1),
  budgetLimit: z.number().positive().optional().nullable(),
});

router.get("/", async (req, res, next) => {
  try {
    const categories = await prisma.category.findMany({
      where: { userId: req.userId },
      orderBy: { name: "asc" },
    });
    res.json(categories);
  } catch (err) {
    next(err);
  }
});

router.post("/", async (req, res, next) => {
  try {
    const data = categorySchema.parse(req.body);
    const cat = await prisma.category.create({
      data: { ...data, userId: req.userId },
    });
    res.status(201).json(cat);
  } catch (err) {
    next(err);
  }
});

router.patch("/:id", async (req, res, next) => {
  try {
    const data = categorySchema.partial().parse(req.body);
    const result = await prisma.category.updateMany({
      where: { id: req.params.id, userId: req.userId },
      data,
    });
    if (result.count === 0) return res.status(404).json({ error: "Not found" });
    const updated = await prisma.category.findUnique({ where: { id: req.params.id } });
    res.json(updated);
  } catch (err) {
    next(err);
  }
});

router.delete("/:id", async (req, res, next) => {
  try {
    const result = await prisma.category.deleteMany({
      where: { id: req.params.id, userId: req.userId },
    });
    if (result.count === 0) return res.status(404).json({ error: "Not found" });
    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
});

export default router;
