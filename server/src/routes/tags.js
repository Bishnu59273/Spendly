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
    const tag = await prisma.tag.findFirst({ where: { id: req.params.id, userId: req.userId } });
    if (!tag) return res.status(404).json({ error: "Not found" });

    const updated = await prisma.tag.update({ where: { id: req.params.id }, data });
    res.json(updated);
  } catch (err) {
    next(err);
  }
});

router.delete("/:id", async (req, res, next) => {
  try {
    const tag = await prisma.tag.findFirst({ where: { id: req.params.id, userId: req.userId } });
    if (!tag) return res.status(404).json({ error: "Not found" });

    await prisma.tag.delete({ where: { id: req.params.id } });
    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
});

export default router;
