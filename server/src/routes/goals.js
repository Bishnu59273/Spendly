import { Router } from "express";
import { z } from "zod";
import prisma from "../lib/prisma.js";
import { authMiddleware } from "../middleware/auth.js";

const router = Router();
router.use(authMiddleware);

export const goalSchema = z.object({
  name: z.string().min(1),
  icon: z.string().default("🎯"),
  color: z.string().default("#1d6b51"),
  target: z.number().positive(),
  saved: z.number().min(0).default(0),
  monthly: z.number().min(0).default(0),
  isPrimary: z.boolean().default(false),
  clientMutationId: z.string().optional(),
});

export async function createGoalRecord(userId, data) {
  if (data.clientMutationId) {
    const existing = await prisma.goal.findFirst({ where: { userId, clientMutationId: data.clientMutationId } });
    if (existing) return { record: existing };
  }
  // Only one primary goal allowed — demote others if this is primary
  if (data.isPrimary) {
    await prisma.goal.updateMany({
      where: { userId, isPrimary: true },
      data: { isPrimary: false },
    });
  }
  const goal = await prisma.goal.create({ data: { ...data, userId } });
  return { record: goal };
}

export async function updateGoalRecord(userId, id, data, expectedUpdatedAt, deductFromBudget) {
  const existing = await prisma.goal.findFirst({ where: { id, userId } });
  if (!existing) return { notFound: true };

  if (expectedUpdatedAt !== undefined && new Date(expectedUpdatedAt).getTime() !== existing.updatedAt.getTime()) {
    return { conflict: true, serverRecord: existing };
  }

  const { clientMutationId, ...rest } = data;
  if (rest.isPrimary) {
    await prisma.goal.updateMany({
      where: { userId, isPrimary: true, id: { not: id } },
      data: { isPrimary: false },
    });
  }
  const goal = await prisma.goal.update({ where: { id }, data: rest });

  if (rest.saved !== undefined) {
    await prisma.goalSnapshot.create({
      data: { goalId: id, savedAmount: goal.saved },
    });

    if (deductFromBudget === true) {
      const savingsAmount = rest.saved - existing.saved;
      if (savingsAmount > 0) {
        let savingsCat = await prisma.category.findFirst({
          where: { userId, name: "Savings" },
        });
        if (!savingsCat) {
          savingsCat = await prisma.category.create({
            data: { name: "Savings", color: "#1d6b51", icon: "🏦", userId },
          });
        }
        await prisma.expense.create({
          data: {
            amount: savingsAmount,
            note: `Savings: ${existing.name}`,
            date: new Date(),
            categoryId: savingsCat.id,
            goalId: id,
            userId,
          },
        });
      }
    }
  }

  return { record: goal };
}

export async function deleteGoalRecord(userId, id) {
  const existing = await prisma.goal.findFirst({ where: { id, userId } });
  if (!existing) return { notFound: true };
  await prisma.goal.delete({ where: { id } });
  return { ok: true };
}

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
    const result = await createGoalRecord(req.userId, data);
    res.status(201).json(result.record);
  } catch (err) {
    next(err);
  }
});

router.patch("/:id", async (req, res, next) => {
  try {
    const { deductFromBudget, ...bodyRest } = req.body;
    const data = goalSchema.partial().parse(bodyRest);
    const result = await updateGoalRecord(req.userId, req.params.id, data, undefined, deductFromBudget);
    if (result.notFound) return res.status(404).json({ error: "Not found" });
    res.json(result.record);
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
    const result = await deleteGoalRecord(req.userId, req.params.id);
    if (result.notFound) return res.status(404).json({ error: "Not found" });
    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
});

export default router;
