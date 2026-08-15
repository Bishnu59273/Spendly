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
      select: { salaryDay: true, monthlyBudget: true, useDefaultBudget: true },
    });
    const { cycleStart, cycleEnd } = parseCycleStart(
      req.query.cycleStart,
      user.salaryDay,
    );
    const cycleMonth = cycleStart.getMonth() + 1;
    const cycleYear = cycleStart.getFullYear();

    const allTransactions = await prisma.expense.findMany({
      where: { userId: req.userId, date: { gte: cycleStart, lte: cycleEnd } },
      include: { category: true },
    });

    const categories = await prisma.category.findMany({
      where: { userId: req.userId },
    });
    const budgets = await prisma.budget.findMany({
      where: {
        userId: req.userId,
        month: cycleMonth,
        year: cycleYear,
      },
    });

    const spendingOnly = allTransactions.filter((t) => t.type !== "INCOME");
    const incomeOnly = allTransactions.filter((t) => t.type === "INCOME");
    const grossSpent = spendingOnly.reduce((s, e) => s + e.amount, 0);
    const totalIncome = incomeOnly.reduce((s, e) => s + e.amount, 0);
    // Category-tied income (refunds) offsets spend; source-tied ("Other
    // source") income doesn't touch a category but is still real money in.
    const categoryTiedIncome = incomeOnly
      .filter((e) => e.categoryId)
      .reduce((s, e) => s + e.amount, 0);
    const netSpent = grossSpent - categoryTiedIncome;
    const totalSpent = Math.max(0, netSpent);

    // Category-tied income (refunds) nets against that category; source-tied
    // ("Others") income has no categoryId and never touches this map.
    const byCategoryMap = {};
    for (const e of allTransactions) {
      if (!e.categoryId) continue;
      if (!byCategoryMap[e.categoryId]) {
        byCategoryMap[e.categoryId] = { ...e.category, spent: 0 };
      }
      byCategoryMap[e.categoryId].spent +=
        e.type === "INCOME" ? -e.amount : e.amount;
    }

    const byCategory = Object.values(byCategoryMap).map((c) => {
      const budget =
        budgets.find((b) => b.categoryId === c.id) ||
        (c.budgetLimit ? { cap: c.budgetLimit } : null);
      return { ...c, spent: Math.max(0, c.spent), budget: budget?.cap || null };
    });

    // Priority: user's overall monthly budget → sum of per-month budget records → sum of category limits
    const categoryBudgetSum =
      budgets.reduce((s, b) => s + b.cap, 0) ||
      categories.reduce((s, c) => s + (c.budgetLimit || 0), 0);

    // An explicit per-month record always wins and never changes once set -
    // this is what lets a past month stay frozen even if the live default
    // (below) is changed later. Only current/future cycles without one of
    // their own fall back to the live default; past cycles without one just
    // show "not set" rather than borrowing today's default.
    const { cycleStart: liveCycleStart } = getCycleRange(user.salaryDay);
    const isCurrentOrFutureCycle = cycleStart >= liveCycleStart;

    const explicitMonthly = await prisma.monthlyBudget.findUnique({
      where: {
        userId_month_year: {
          userId: req.userId,
          month: cycleMonth,
          year: cycleYear,
        },
      },
    });

    let totalBudget;
    let needsBudgetInput = false;
    if (explicitMonthly) {
      totalBudget = explicitMonthly.amount;
    } else if (isCurrentOrFutureCycle && user.useDefaultBudget) {
      totalBudget = user.monthlyBudget ?? categoryBudgetSum;
    } else if (isCurrentOrFutureCycle) {
      totalBudget = categoryBudgetSum || null;
      needsBudgetInput = true;
    } else {
      totalBudget = categoryBudgetSum || null;
    }

    const now = new Date();
    const daysLeft = Math.max(
      0,
      Math.ceil((cycleEnd - now) / (1000 * 60 * 60 * 24)),
    );

    res.json({
      cycleStart,
      cycleEnd,
      cycleMonth,
      cycleYear,
      totalSpent,
      totalIncome,
      totalBudget,
      remaining: (totalBudget || 0) - grossSpent + totalIncome,
      daysLeft,
      byCategory,
      hasOverallBudget: user.monthlyBudget != null,
      useDefaultBudget: user.useDefaultBudget,
      needsBudgetInput,
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
    const { cycleStart, cycleEnd } = parseCycleStart(
      req.query.cycleStart,
      user.salaryDay,
    );

    const expenses = await prisma.expense.findMany({
      where: {
        userId: req.userId,
        date: { gte: cycleStart, lte: cycleEnd },
        type: { not: "INCOME" },
      },
      include: { category: true },
    });

    const pieMap = {};
    for (const e of expenses) {
      if (!pieMap[e.categoryId]) {
        pieMap[e.categoryId] = {
          name: e.category.name,
          color: e.category.color,
          value: 0,
        };
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
        where: {
          userId: req.userId,
          date: { gte: cycleStart, lte: cycleEnd },
          type: { not: "INCOME" },
        },
      });
      const total = expenses.reduce((s, e) => s + e.amount, 0);

      cycles.push({
        label: cycleStart.toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
        }),
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
