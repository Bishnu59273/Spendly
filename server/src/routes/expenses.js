import { Router } from "express";
import { z } from "zod";
import prisma from "../lib/prisma.js";
import { authMiddleware } from "../middleware/auth.js";
import { parseCycleStart } from "../lib/cycleHelper.js";

const router = Router();
router.use(authMiddleware);

const expenseSchema = z.object({
  amount: z.number().positive(),
  type: z.enum(["EXPENSE", "INCOME"]).default("EXPENSE"),
  note: z.string().optional().nullable(),
  date: z.string().datetime(),
  categoryId: z.string().optional().nullable(),
  sourceId: z.string().optional().nullable(),
  tagIds: z.array(z.string()).optional().default([]),
  isRecurring: z.boolean().optional().default(false),
  recurringDay: z.number().int().min(1).max(31).optional().nullable(),
});

// Last N expenses by createdAt — used for notifications
router.get("/recent", async (req, res, next) => {
  try {
    const limit = Math.min(parseInt(req.query.limit) || 5, 20);
    const expenses = await prisma.expense.findMany({
      where: { userId: req.userId },
      orderBy: { createdAt: "desc" },
      take: limit,
      include: { category: true, source: true, tags: { include: { tag: true } } },
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
      include: {
        category: true,
        source: true,
        tags: { include: { tag: true } },
      },
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
      include: { category: true, source: true, tags: { include: { tag: true } } },
    });

    const rows = expenses.map((e) => [
      new Date(e.date).toISOString().split("T")[0],
      e.type || "EXPENSE",
      e.amount,
      e.type === "INCOME" ? (e.source?.name || "") : (e.category?.name || ""),
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

    if (data.type === "INCOME") {
      if (!data.sourceId) return res.status(400).json({ error: "sourceId is required for income" });
      const src = await prisma.incomeSource.findFirst({ where: { id: data.sourceId, userId: req.userId } });
      if (!src) return res.status(400).json({ error: "Invalid income source" });
    } else {
      if (!data.categoryId) return res.status(400).json({ error: "categoryId is required for expenses" });
      const cat = await prisma.category.findFirst({ where: { id: data.categoryId, userId: req.userId } });
      if (!cat) return res.status(400).json({ error: "Invalid category" });
    }

    const expense = await prisma.expense.create({
      data: {
        amount: data.amount,
        type: data.type,
        note: data.note,
        date: new Date(data.date),
        isRecurring: data.isRecurring,
        recurringDay: data.recurringDay,
        categoryId: data.type === "EXPENSE" ? data.categoryId : null,
        sourceId: data.type === "INCOME" ? data.sourceId : null,
        userId: req.userId,
        tags: {
          create: data.tagIds.map((tagId) => ({ tagId })),
        },
      },
      include: { category: true, source: true, tags: { include: { tag: true } } },
    });
    res.status(201).json(expense);
  } catch (err) {
    next(err);
  }
});

router.patch("/:id", async (req, res, next) => {
  try {
    const existing = await prisma.expense.findFirst({ where: { id: req.params.id, userId: req.userId } });
    if (!existing) return res.status(404).json({ error: "Not found" });

    const data = expenseSchema.partial().parse(req.body);
    const { tagIds, ...rest } = data;

    const expense = await prisma.expense.update({
      where: { id: req.params.id },
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
      include: { category: true, source: true, tags: { include: { tag: true } } },
    });
    res.json(expense);
  } catch (err) {
    next(err);
  }
});

router.delete("/:id", async (req, res, next) => {
  try {
    const existing = await prisma.expense.findFirst({ where: { id: req.params.id, userId: req.userId } });
    if (!existing) return res.status(404).json({ error: "Not found" });

    await prisma.expense.delete({ where: { id: req.params.id } });

    // If this was a savings deduction, reverse the goal's saved amount
    if (existing.goalId) {
      const goal = await prisma.goal.findFirst({ where: { id: existing.goalId, userId: req.userId } });
      if (goal) {
        const newSaved = Math.max(0, goal.saved - existing.amount);
        await prisma.goal.update({ where: { id: goal.id }, data: { saved: newSaved } });
        await prisma.goalSnapshot.create({
          data: { goalId: goal.id, savedAmount: newSaved },
        });
      }
    }

    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
});

export default router;
