import { Router } from "express";
import { z } from "zod";
import prisma from "../lib/prisma.js";
import { authMiddleware } from "../middleware/auth.js";

const router = Router();
router.use(authMiddleware);

export const categorySchema = z.object({
  name: z.string().min(1),
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/),
  icon: z.string().min(1),
  budgetLimit: z.number().positive().optional().nullable(),
  clientMutationId: z.string().optional(),
});

export async function createCategoryRecord(userId, data) {
  if (data.clientMutationId) {
    const existing = await prisma.category.findFirst({ where: { userId, clientMutationId: data.clientMutationId } });
    if (existing) return { record: existing };
  }
  const cat = await prisma.category.create({ data: { ...data, userId } });
  return { record: cat };
}

export async function updateCategoryRecord(userId, id, data, expectedUpdatedAt) {
  const existing = await prisma.category.findFirst({ where: { id, userId } });
  if (!existing) return { notFound: true };

  if (existing.isSystemManaged) {
    return { error: "This category is managed automatically and can't be edited.", statusCode: 403 };
  }

  if (expectedUpdatedAt !== undefined && new Date(expectedUpdatedAt).getTime() !== existing.updatedAt.getTime()) {
    return { conflict: true, serverRecord: existing };
  }

  const { clientMutationId, ...rest } = data;
  const updated = await prisma.category.update({ where: { id }, data: rest });
  return { record: updated };
}

export async function deleteCategoryRecord(userId, id) {
  const existing = await prisma.category.findFirst({ where: { id, userId } });
  if (!existing) return { notFound: true };

  if (existing.isSystemManaged) {
    return { error: "This category is managed automatically and can't be deleted.", statusCode: 403 };
  }

  const inUse = await prisma.expense.findFirst({ where: { categoryId: id } });
  if (inUse) {
    return { error: "This category still has expenses logged under it. Recategorize or delete those first.", statusCode: 409 };
  }

  await prisma.category.delete({ where: { id } });
  return { ok: true };
}

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
    const result = await createCategoryRecord(req.userId, data);
    res.status(201).json(result.record);
  } catch (err) {
    next(err);
  }
});

router.patch("/:id", async (req, res, next) => {
  try {
    const data = categorySchema.partial().parse(req.body);
    const result = await updateCategoryRecord(req.userId, req.params.id, data);
    if (result.notFound) return res.status(404).json({ error: "Not found" });
    if (result.error) return res.status(result.statusCode).json({ error: result.error });
    res.json(result.record);
  } catch (err) {
    next(err);
  }
});

router.delete("/:id", async (req, res, next) => {
  try {
    const result = await deleteCategoryRecord(req.userId, req.params.id);
    if (result.notFound) return res.status(404).json({ error: "Not found" });
    if (result.error) return res.status(result.statusCode).json({ error: result.error });
    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
});

export default router;
