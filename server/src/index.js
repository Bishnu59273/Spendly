import "dotenv/config";
import express from "express";
import cookieParser from "cookie-parser";
import cors from "cors";
import cron from "node-cron";

import authRouter from "./routes/auth.js";
import categoriesRouter from "./routes/categories.js";
import tagsRouter from "./routes/tags.js";
import expensesRouter from "./routes/expenses.js";
import summaryRouter from "./routes/summary.js";
import goalsRouter from "./routes/goals.js";
import feedbackRouter from "./routes/feedback.js";
import incomeSourcesRouter from "./routes/incomeSources.js";
import budgetsRouter from "./routes/budgets.js";
import announcementsRouter from "./routes/announcements.js";
import pushRouter from "./routes/push.js";
import syncRouter from "./routes/sync.js";
import groupsRouter from "./routes/groups.js";
import groupExpensesRouter from "./routes/groupExpenses.js";
import { errorHandler } from "./middleware/errorHandler.js";
import prisma from "./lib/prisma.js";
import { getCycleRange } from "./lib/cycleHelper.js";
import { runDailyCleanup } from "./lib/cleanup.js";

const app = express();

app.set("trust proxy", 1);

app.use(cors({ origin: process.env.CLIENT_URL, credentials: true }));
app.use(express.json());
app.use(cookieParser());

app.get("/health", (_req, res) => res.json({ status: "ok" }));

app.use("/api/auth", authRouter);
app.use("/api/categories", categoriesRouter);
app.use("/api/tags", tagsRouter);
app.use("/api/expenses", expensesRouter);
app.use("/api/summary", summaryRouter);
app.use("/api/goals", goalsRouter);
app.use("/api/feedback", feedbackRouter);
app.use("/api/income-sources", incomeSourcesRouter);
app.use("/api/budgets", budgetsRouter);
app.use("/api/announcements", announcementsRouter);
app.use("/api/push", pushRouter);
app.use("/api/sync", syncRouter);
app.use("/api/groups", groupsRouter);
app.use("/api/groups", groupExpensesRouter);

app.use(errorHandler);

// Daily cron: auto-insert recurring expenses
cron.schedule("0 0 * * *", async () => {
  console.log("[cron] Checking recurring expenses...");
  try {
    const today = new Date();
    const todayDay = today.getDate();

    const recurringExpenses = await prisma.expense.findMany({
      where: { isRecurring: true, recurringDay: todayDay },
      include: { user: true },
    });

    for (const exp of recurringExpenses) {
      const { cycleStart, cycleEnd } = getCycleRange(exp.user.salaryDay);
      const exists = await prisma.expense.findFirst({
        where: {
          userId: exp.userId,
          categoryId: exp.categoryId,
          amount: exp.amount,
          recurringDay: todayDay,
          date: { gte: cycleStart, lte: cycleEnd },
        },
      });

      if (!exists) {
        await prisma.expense.create({
          data: {
            amount: exp.amount,
            note: exp.note,
            date: today,
            isRecurring: true,
            recurringDay: todayDay,
            categoryId: exp.categoryId,
            userId: exp.userId,
          },
        });
        console.log(`[cron] Created recurring expense for user ${exp.userId}`);
      }
    }
  } catch (err) {
    console.error("[cron] Error:", err);
  }
});

// Daily cron: prune expired password-reset tokens and old goal snapshots
cron.schedule("30 0 * * *", async () => {
  console.log("[cron] Running DB cleanup...");
  try {
    await runDailyCleanup();
  } catch (err) {
    console.error("[cron] Cleanup error:", err);
  }
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
