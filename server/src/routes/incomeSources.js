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

export const incomeSourceSchema = z.object({
  name: z.string().min(1),
  icon: z.string().min(1).default("💰"),
  clientMutationId: z.string().optional(),
});

export async function createIncomeSourceRecord(userId, data) {
  if (data.clientMutationId) {
    const existing = await prisma.incomeSource.findFirst({ where: { userId, clientMutationId: data.clientMutationId } });
    if (existing) return { record: existing };
  }
  const source = await prisma.incomeSource.create({ data: { ...data, userId } });
  return { record: source };
}

export async function deleteIncomeSourceRecord(userId, id) {
  const source = await prisma.incomeSource.findFirst({ where: { id, userId } });
  if (!source) return { notFound: true };
  if (source.isDefault) return { error: "Cannot delete a default source", statusCode: 400 };
  await prisma.incomeSource.deleteMany({ where: { id, userId } });
  return { ok: true };
}

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
    const data = incomeSourceSchema.parse(req.body);
    const result = await createIncomeSourceRecord(req.userId, data);
    res.status(201).json(result.record);
  } catch (err) {
    next(err);
  }
});

router.delete("/:id", async (req, res, next) => {
  try {
    const result = await deleteIncomeSourceRecord(req.userId, req.params.id);
    if (result.notFound) return res.status(404).json({ error: "Not found" });
    if (result.error) return res.status(result.statusCode).json({ error: result.error });
    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
});

export default router;
