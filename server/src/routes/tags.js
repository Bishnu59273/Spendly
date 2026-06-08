import { Router } from "express";
import { z } from "zod";
import prisma from "../lib/prisma.js";
import { authMiddleware } from "../middleware/auth.js";

const router = Router();
router.use(authMiddleware);

const tagSchema = z.object({
  name: z.string().min(1),
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/),
  icon: z.string().max(2),
});

router.get("/", async (req, res, next) => {
  try {
    const tags = await prisma.tag.findMany({
      where: { userId: req.userId },
      orderBy: { name: "asc" },
    });
    res.json(tags);
  } catch (err) {
    next(err);
  }
});

router.post("/", async (req, res, next) => {
  try {
    const data = tagSchema.parse(req.body);
    const tag = await prisma.tag.create({ data: { ...data, userId: req.userId } });
    res.status(201).json(tag);
  } catch (err) {
    next(err);
  }
});

router.patch("/:id", async (req, res, next) => {
  try {
    const data = tagSchema.partial().parse(req.body);
    const result = await prisma.tag.updateMany({
      where: { id: req.params.id, userId: req.userId },
      data,
    });
    if (result.count === 0) return res.status(404).json({ error: "Not found" });
    const updated = await prisma.tag.findUnique({ where: { id: req.params.id } });
    res.json(updated);
  } catch (err) {
    next(err);
  }
});

router.delete("/:id", async (req, res, next) => {
  try {
    const result = await prisma.tag.deleteMany({
      where: { id: req.params.id, userId: req.userId },
    });
    if (result.count === 0) return res.status(404).json({ error: "Not found" });
    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
});

export default router;
