import { Router } from "express";
import { z } from "zod";
import prisma from "../lib/prisma.js";
import { authMiddleware } from "../middleware/auth.js";
import { parseCycleStart } from "../lib/cycleHelper.js";

const router = Router();
router.use(authMiddleware);

export const expenseSchema = z.object({
  amount: z.number().positive(),
  type: z.enum(["EXPENSE", "INCOME"]).default("EXPENSE"),
  note: z.string().optional().nullable(),
  date: z.string().datetime(),
  categoryId: z.string().optional().nullable(),
  sourceId: z.string().optional().nullable(),
  tagIds: z.array(z.string()).optional().default([]),
  isRecurring: z.boolean().optional().default(false),
  recurringDay: z.number().int().min(1).max(31).optional().nullable(),
  clientMutationId: z.string().optional(),
});

const EXPENSE_INCLUDE = { category: true, source: true, tags: { include: { tag: true } } };

export async function createExpenseRecord(userId, data, client = prisma) {
  if (data.clientMutationId) {
    const existing = await client.expense.findFirst({
      where: { userId, clientMutationId: data.clientMutationId },
      include: EXPENSE_INCLUDE,
    });
    if (existing) return { record: existing };
  }

  if (data.type === "INCOME") {
    if (data.categoryId) {
      const cat = await client.category.findFirst({ where: { id: data.categoryId, userId } });
      if (!cat) return { error: "Invalid category", statusCode: 400 };
    } else if (data.sourceId) {
      const src = await client.incomeSource.findFirst({ where: { id: data.sourceId, userId } });
      if (!src) return { error: "Invalid income source", statusCode: 400 };
    } else {
      return { error: "categoryId or sourceId is required for income", statusCode: 400 };
    }
  } else {
    if (!data.categoryId) return { error: "categoryId is required for expenses", statusCode: 400 };
    const cat = await client.category.findFirst({ where: { id: data.categoryId, userId } });
    if (!cat) return { error: "Invalid category", statusCode: 400 };
  }

  const expense = await client.expense.create({
    data: {
      amount: data.amount,
      type: data.type,
      note: data.note,
      date: new Date(data.date),
      isRecurring: data.isRecurring,
      recurringDay: data.recurringDay,
      categoryId: data.type === "EXPENSE" ? data.categoryId : (data.categoryId || null),
      sourceId: data.type === "INCOME" && !data.categoryId ? data.sourceId : null,
      userId,
      clientMutationId: data.clientMutationId || null,
      tags: {
        create: data.tagIds.map((tagId) => ({ tagId })),
      },
    },
    include: EXPENSE_INCLUDE,
  });
  return { record: expense };
}

export async function updateExpenseRecord(userId, id, data, expectedUpdatedAt) {
  const existing = await prisma.expense.findFirst({ where: { id, userId } });
  if (!existing) return { notFound: true };

  if (expectedUpdatedAt !== undefined && new Date(expectedUpdatedAt).getTime() !== existing.updatedAt.getTime()) {
    const serverRecord = await prisma.expense.findUnique({ where: { id }, include: EXPENSE_INCLUDE });
    return { conflict: true, serverRecord };
  }

  const { tagIds, clientMutationId, ...rest } = data;

  const finalType = rest.type ?? existing.type;
  const finalCategoryId = "categoryId" in rest ? rest.categoryId : existing.categoryId;
  const finalSourceId = "sourceId" in rest ? rest.sourceId : existing.sourceId;

  if (finalType === "INCOME") {
    if (finalCategoryId) {
      const cat = await prisma.category.findFirst({ where: { id: finalCategoryId, userId } });
      if (!cat) return { error: "Invalid category", statusCode: 400 };
      rest.categoryId = finalCategoryId;
      rest.sourceId = null;
    } else if (finalSourceId) {
      const src = await prisma.incomeSource.findFirst({ where: { id: finalSourceId, userId } });
      if (!src) return { error: "Invalid income source", statusCode: 400 };
      rest.sourceId = finalSourceId;
      rest.categoryId = null;
    } else {
      return { error: "categoryId or sourceId is required for income", statusCode: 400 };
    }
  } else {
    if (!finalCategoryId) return { error: "categoryId is required for expenses", statusCode: 400 };
    const cat = await prisma.category.findFirst({ where: { id: finalCategoryId, userId } });
    if (!cat) return { error: "Invalid category", statusCode: 400 };
    rest.categoryId = finalCategoryId;
    rest.sourceId = null;
  }

  const expense = await prisma.expense.update({
    where: { id },
    data: {
      ...rest,
      date: rest.date ? new Date(rest.date) : undefined,
      ...(tagIds !== undefined && {
        tags: {
          deleteMany: {},
          create: tagIds.map((tagId) => ({ tagId })),
        },
      }),
    },
    include: EXPENSE_INCLUDE,
  });
  return { record: expense };
}

export async function deleteExpenseRecord(userId, id) {
  const existing = await prisma.expense.findFirst({ where: { id, userId } });
  if (!existing) return { notFound: true };

  await prisma.expense.delete({ where: { id } });

  // If this was a savings deduction, reverse the goal's saved amount
  if (existing.goalId) {
    const goal = await prisma.goal.findFirst({ where: { id: existing.goalId, userId } });
    if (goal) {
      const newSaved = Math.max(0, goal.saved - existing.amount);
      await prisma.goal.update({ where: { id: goal.id }, data: { saved: newSaved } });
      await prisma.goalSnapshot.create({
        data: { goalId: goal.id, savedAmount: newSaved },
      });
    }
  }

  return { ok: true };
}

// Last N expenses by createdAt — used for notifications
router.get("/recent", async (req, res, next) => {
  try {
    const limit = Math.min(parseInt(req.query.limit) || 5, 20);
    const expenses = await prisma.expense.findMany({
      where: { userId: req.userId },
      orderBy: { createdAt: "desc" },
      take: limit,
      include: EXPENSE_INCLUDE,
    });
    res.json(expenses);
  } catch (err) {
    next(err);
  }
});

router.get("/", async (req, res, next) => {
  try {
    const user = await prisma.user.findUnique({ where: { id: req.userId } });
    const { cycleStart, cycleEnd } = parseCycleStart(req.query.cycleStart, user.salaryDay);

    const where = {
      userId: req.userId,
      date: { gte: cycleStart, lte: cycleEnd },
    };

    if (req.query.categoryId) where.categoryId = req.query.categoryId;
    if (req.query.search) where.note = { contains: req.query.search, mode: "insensitive" };
    if (req.query.tagId) where.tags = { some: { tagId: req.query.tagId } };
    if (req.query.type) where.type = req.query.type;

    const expenses = await prisma.expense.findMany({
      where,
      orderBy: { date: "desc" },
      include: EXPENSE_INCLUDE,
    });
    res.json(expenses);
  } catch (err) {
    next(err);
  }
});

router.get("/export", async (req, res, next) => {
  try {
    const user = await prisma.user.findUnique({ where: { id: req.userId } });
    const { cycleStart, cycleEnd } = parseCycleStart(req.query.cycleStart, user.salaryDay);

    const expenses = await prisma.expense.findMany({
      where: { userId: req.userId, date: { gte: cycleStart, lte: cycleEnd } },
      orderBy: { date: "desc" },
      include: EXPENSE_INCLUDE,
    });

    const rows = expenses.map((e) => [
      new Date(e.date).toISOString().split("T")[0],
      e.type || "EXPENSE",
      e.amount,
      e.categoryId ? (e.category?.name || "") : (e.source?.name || ""),
      e.tags.map((t) => t.tag.name).join("|"),
      e.note || "",
    ]);

    const csv = ["Date,Type,Amount,Category,Tags,Note", ...rows.map((r) => r.map((v) => `"${v}"`).join(","))].join("\n");

    res.setHeader("Content-Type", "text/csv");
    res.setHeader("Content-Disposition", "attachment; filename=expenses.csv");
    res.send(csv);
  } catch (err) {
    next(err);
  }
});

router.post("/", async (req, res, next) => {
  try {
    const data = expenseSchema.parse(req.body);
    const result = await createExpenseRecord(req.userId, data);
    if (result.error) return res.status(result.statusCode).json({ error: result.error });
    res.status(201).json(result.record);
  } catch (err) {
    next(err);
  }
});

router.patch("/:id", async (req, res, next) => {
  try {
    const data = expenseSchema.partial().parse(req.body);
    const result = await updateExpenseRecord(req.userId, req.params.id, data);
    if (result.notFound) return res.status(404).json({ error: "Not found" });
    if (result.error) return res.status(result.statusCode).json({ error: result.error });
    res.json(result.record);
  } catch (err) {
    next(err);
  }
});

router.delete("/:id", async (req, res, next) => {
  try {
    const result = await deleteExpenseRecord(req.userId, req.params.id);
    if (result.notFound) return res.status(404).json({ error: "Not found" });
    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
});

export default router;
