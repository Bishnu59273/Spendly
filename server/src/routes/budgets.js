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

router.put("/monthly", async (req, res, next) => {
  try {
    const schema = z.object({
      month: z.number().int().min(1).max(12),
      year: z.number().int(),
      amount: z.number().positive(),
      isDefault: z.boolean(),
    });
    const { month, year, amount, isDefault } = schema.parse(req.body);

    let user;
    if (isDefault) {
      // Lock in the month being edited so it reflects this amount immediately
      // (matters when editing a past cycle, which the live default no longer
      // reaches), while also updating the live default for future cycles.
      await prisma.monthlyBudget.upsert({
        where: { userId_month_year: { userId: req.userId, month, year } },
        create: { userId: req.userId, month, year, amount },
        update: { amount },
      });
      user = await prisma.user.update({
        where: { id: req.userId },
        data: { monthlyBudget: amount, useDefaultBudget: true },
        select: USER_SELECT,
      });
    } else {
      await prisma.monthlyBudget.upsert({
        where: { userId_month_year: { userId: req.userId, month, year } },
        create: { userId: req.userId, month, year, amount },
        update: { amount },
      });
      user = await prisma.user.update({
        where: { id: req.userId },
        data: { useDefaultBudget: false },
        select: USER_SELECT,
      });
    }

    res.json(user);
  } catch (err) {
    next(err);
  }
});

export default router;
