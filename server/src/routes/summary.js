import { Router } from "express";
import prisma from "../lib/prisma.js";
import { authMiddleware } from "../middleware/auth.js";
import { parseCycleStart, getCycleRange } from "../lib/cycleHelper.js";

const router = Router();
router.use(authMiddleware);

router.get("/cycle", async (req, res, next) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.userId },
      select: { salaryDay: true, monthlyBudget: true },
    });
    const { cycleStart, cycleEnd } = parseCycleStart(req.query.cycleStart, user.salaryDay);

    const allTransactions = await prisma.expense.findMany({
      where: { userId: req.userId, date: { gte: cycleStart, lte: cycleEnd } },
      include: { category: true },
    });

    const categories = await prisma.category.findMany({ where: { userId: req.userId } });
    const budgets = await prisma.budget.findMany({
      where: {
        userId: req.userId,
        month: cycleStart.getMonth() + 1,
        year: cycleStart.getFullYear(),
      },
    });

    const spendingOnly = allTransactions.filter((t) => t.type !== "INCOME");
    const incomeOnly   = allTransactions.filter((t) => t.type === "INCOME");
    const totalSpent   = spendingOnly.reduce((s, e) => s + e.amount, 0);
    const totalIncome  = incomeOnly.reduce((s, e) => s + e.amount, 0);

    const byCategoryMap = {};
    for (const e of spendingOnly) {
      if (!byCategoryMap[e.categoryId]) {
        byCategoryMap[e.categoryId] = { ...e.category, spent: 0 };
      }
      byCategoryMap[e.categoryId].spent += e.amount;
    }

    const byCategory = Object.values(byCategoryMap).map((c) => {
      const budget = budgets.find((b) => b.categoryId === c.id) ||
        (c.budgetLimit ? { cap: c.budgetLimit } : null);
      return { ...c, budget: budget?.cap || null };
    });

    // Priority: user's overall monthly budget → sum of per-month budget records → sum of category limits
    const categoryBudgetSum = budgets.reduce((s, b) => s + b.cap, 0) ||
      categories.reduce((s, c) => s + (c.budgetLimit || 0), 0);
    const totalBudget = user.monthlyBudget ?? categoryBudgetSum;

    const now = new Date();
    const daysLeft = Math.max(0, Math.ceil((cycleEnd - now) / (1000 * 60 * 60 * 24)));

    res.json({
      cycleStart,
      cycleEnd,
      totalSpent,
      totalIncome,
      totalBudget,
      remaining: totalBudget - totalSpent + totalIncome,
      daysLeft,
      byCategory,
      hasOverallBudget: user.monthlyBudget != null,
    });
  } catch (err) {
    next(err);
  }
});

router.get("/chart", async (req, res, next) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.userId },
      select: { salaryDay: true },
    });
    const { cycleStart, cycleEnd } = parseCycleStart(req.query.cycleStart, user.salaryDay);

    const expenses = await prisma.expense.findMany({
      where: { userId: req.userId, date: { gte: cycleStart, lte: cycleEnd }, type: { not: "INCOME" } },
      include: { category: true },
    });

    const pieMap = {};
    for (const e of expenses) {
      if (!pieMap[e.categoryId]) {
        pieMap[e.categoryId] = { name: e.category.name, color: e.category.color, value: 0 };
      }
      pieMap[e.categoryId].value += e.amount;
    }

    res.json({ pieData: Object.values(pieMap) });
  } catch (err) {
    next(err);
  }
});

router.get("/trend", async (req, res, next) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.userId },
      select: { salaryDay: true },
    });
    const today = new Date();
    const cycles = [];

    for (let i = 5; i >= 0; i--) {
      const ref = new Date(today);
      ref.setMonth(ref.getMonth() - i);
      const { cycleStart, cycleEnd } = getCycleRange(user.salaryDay, ref);

      const expenses = await prisma.expense.findMany({
        where: { userId: req.userId, date: { gte: cycleStart, lte: cycleEnd }, type: { not: "INCOME" } },
      });
      const total = expenses.reduce((s, e) => s + e.amount, 0);

      cycles.push({
        label: cycleStart.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
        total,
        cycleStart,
      });
    }

    res.json({ barData: cycles });
  } catch (err) {
    next(err);
  }
});

export default router;
