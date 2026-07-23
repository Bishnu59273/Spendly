import { Router } from "express";
import { z } from "zod";
import prisma from "../lib/prisma.js";
import { authMiddleware } from "../middleware/auth.js";

const router = Router();
router.use(authMiddleware);

const USER_SELECT = {
  id: true, name: true, email: true,
  salaryDay: true, currency: true,
  monthlyBudget: true, useDefaultBudget: true, createdAt: true,
};

export const monthlyBudgetSchema = z.object({
  month: z.number().int().min(1).max(12),
  year: z.number().int(),
  amount: z.number().positive(),
  isDefault: z.boolean(),
});

export async function setMonthlyBudgetRecord(userId, data) {
  const { month, year, amount, isDefault } = data;

  // Lock in the month being edited so it reflects this amount immediately
  // (matters when editing a past cycle, which the live default no longer
  // reaches), while also updating the live default for future cycles.
  await prisma.monthlyBudget.upsert({
    where: { userId_month_year: { userId, month, year } },
    create: { userId, month, year, amount },
    update: { amount },
  });

  const user = await prisma.user.update({
    where: { id: userId },
    data: isDefault ? { monthlyBudget: amount, useDefaultBudget: true } : { useDefaultBudget: false },
    select: USER_SELECT,
  });

  return { record: user };
}

router.put("/monthly", async (req, res, next) => {
  try {
    const data = monthlyBudgetSchema.parse(req.body);
    const result = await setMonthlyBudgetRecord(req.userId, data);
    res.json(result.record);
  } catch (err) {
    next(err);
  }
});

export default router;
