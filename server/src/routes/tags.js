import { Router } from "express";
import { z } from "zod";
import prisma from "../lib/prisma.js";
import { authMiddleware } from "../middleware/auth.js";

const router = Router();
router.use(authMiddleware);

export const tagSchema = z.object({
  name: z.string().min(1),
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/),
  icon: z.string().min(1),
  clientMutationId: z.string().optional(),
});

export async function createTagRecord(userId, data) {
  if (data.clientMutationId) {
    const existing = await prisma.tag.findFirst({ where: { userId, clientMutationId: data.clientMutationId } });
    if (existing) return { record: existing };
  }
  const tag = await prisma.tag.create({ data: { ...data, userId } });
  return { record: tag };
}

export async function updateTagRecord(userId, id, data, expectedUpdatedAt) {
  const existing = await prisma.tag.findFirst({ where: { id, userId } });
  if (!existing) return { notFound: true };

  if (expectedUpdatedAt !== undefined && new Date(expectedUpdatedAt).getTime() !== existing.updatedAt.getTime()) {
    return { conflict: true, serverRecord: existing };
  }

  const { clientMutationId, ...rest } = data;
  const updated = await prisma.tag.update({ where: { id }, data: rest });
  return { record: updated };
}

export async function deleteTagRecord(userId, id) {
  const result = await prisma.tag.deleteMany({ where: { id, userId } });
  if (result.count === 0) return { notFound: true };
  return { ok: true };
}

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
    const result = await createTagRecord(req.userId, data);
    res.status(201).json(result.record);
  } catch (err) {
    next(err);
  }
});

router.patch("/:id", async (req, res, next) => {
  try {
    const data = tagSchema.partial().parse(req.body);
    const result = await updateTagRecord(req.userId, req.params.id, data);
    if (result.notFound) return res.status(404).json({ error: "Not found" });
    res.json(result.record);
  } catch (err) {
    next(err);
  }
});

router.delete("/:id", async (req, res, next) => {
  try {
    const result = await deleteTagRecord(req.userId, req.params.id);
    if (result.notFound) return res.status(404).json({ error: "Not found" });
    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
});

export default router;
