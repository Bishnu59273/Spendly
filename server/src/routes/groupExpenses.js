import { Router } from "express";
import { z } from "zod";
import prisma from "../lib/prisma.js";
import { authMiddleware } from "../middleware/auth.js";
import { fetchGroupBalances } from "../lib/groupBalances.js";
import { requireMembership } from "./groups.js";
import { createExpenseRecord } from "./expenses.js";

const SETTLEMENT_LEDGER_NAME = "Group Settlement";
const SETTLEMENT_LEDGER_ICON = "🤝";
const GROUP_EXPENSE_LEDGER_NAME = "Group Expense";
const GROUP_EXPENSE_LEDGER_ICON = "🧾";

async function findOrCreateSettlementCategory(client, userId) {
  let category = await client.category.findFirst({ where: { userId, name: SETTLEMENT_LEDGER_NAME } });
  if (!category) {
    category = await client.category.create({
      data: { name: SETTLEMENT_LEDGER_NAME, color: "#1d6b51", icon: SETTLEMENT_LEDGER_ICON, userId },
    });
  }
  return category;
}

async function findOrCreateGroupExpenseCategory(client, userId) {
  let category = await client.category.findFirst({ where: { userId, name: GROUP_EXPENSE_LEDGER_NAME } });
  if (!category) {
    category = await client.category.create({
      data: { name: GROUP_EXPENSE_LEDGER_NAME, color: "#1d6b51", icon: GROUP_EXPENSE_LEDGER_ICON, userId },
    });
  }
  return category;
}

const router = Router();
router.use(authMiddleware);

const splitInputSchema = z.object({
  userId: z.string(),
  shareAmount: z.number().optional(),
  sharePercent: z.number().optional(),
});

export const groupExpenseSchema = z.object({
  description: z.string().min(1),
  amount: z.number().positive(),
  splitType: z.enum(["EQUAL", "CUSTOM", "PERCENTAGE"]),
  paidById: z.string(),
  date: z.coerce.date(),
  splits: z.array(splitInputSchema).min(1),
});

function roundMoney(n) {
  return Math.round(n * 100) / 100;
}

function resolveSplits(amount, splitType, splits) {
  if (splitType === "EQUAL") {
    const share = roundMoney(amount / splits.length);
    const resolved = splits.map((s) => ({ userId: s.userId, shareAmount: share, sharePercent: null }));
    const remainder = roundMoney(amount - share * splits.length);
    resolved[0].shareAmount = roundMoney(resolved[0].shareAmount + remainder);
    return { splits: resolved };
  }

  if (splitType === "CUSTOM") {
    const sum = roundMoney(splits.reduce((acc, s) => acc + (s.shareAmount ?? 0), 0));
    if (Math.abs(sum - amount) > 0.01) {
      return { error: `Custom split amounts (${sum}) must add up to the total (${amount}).`, statusCode: 400 };
    }
    return { splits: splits.map((s) => ({ userId: s.userId, shareAmount: roundMoney(s.shareAmount ?? 0), sharePercent: null })) };
  }

  // PERCENTAGE
  const pctSum = splits.reduce((acc, s) => acc + (s.sharePercent ?? 0), 0);
  if (Math.abs(pctSum - 100) > 0.5) {
    return { error: `Split percentages (${pctSum}%) must add up to 100%.`, statusCode: 400 };
  }
  const resolved = splits.map((s) => ({
    userId: s.userId,
    shareAmount: roundMoney((amount * (s.sharePercent ?? 0)) / 100),
    sharePercent: s.sharePercent ?? 0,
  }));
  const sum = roundMoney(resolved.reduce((acc, s) => acc + s.shareAmount, 0));
  const remainder = roundMoney(amount - sum);
  if (Math.abs(remainder) > 0) resolved[0].shareAmount = roundMoney(resolved[0].shareAmount + remainder);
  return { splits: resolved };
}

async function membersError(groupId, userIds) {
  const members = await prisma.groupMember.findMany({ where: { groupId, userId: { in: userIds } } });
  if (members.length !== new Set(userIds).size) {
    return { error: "All participants must be members of this group.", statusCode: 400 };
  }
  return null;
}

export async function createGroupExpenseRecord(userId, groupId, data) {
  const memberErr = await membersError(groupId, [data.paidById, ...data.splits.map((s) => s.userId)]);
  if (memberErr) return memberErr;

  const resolved = resolveSplits(data.amount, data.splitType, data.splits);
  if (resolved.error) return resolved;

  const expense = await prisma.$transaction(async (tx) => {
    const created = await tx.groupExpense.create({
      data: {
        groupId,
        description: data.description,
        amount: data.amount,
        splitType: data.splitType,
        paidById: data.paidById,
        createdById: userId,
        date: data.date,
        splits: { create: resolved.splits },
      },
      include: { splits: true },
    });

    const group = await tx.group.findUnique({ where: { id: groupId }, select: { name: true } });
    const category = await findOrCreateGroupExpenseCategory(tx, data.paidById);
    await createExpenseRecord(data.paidById, {
      amount: data.amount,
      type: "EXPENSE",
      categoryId: category.id,
      note: `${data.description} — paid for "${group.name}"`,
      date: data.date,
      groupExpenseId: created.id,
      tagIds: [],
    }, tx);

    return created;
  }, { maxWait: 10000, timeout: 15000 });

  return { record: expense };
}

export async function updateGroupExpenseRecord(userId, groupId, id, data) {
  const existing = await prisma.groupExpense.findFirst({ where: { id, groupId } });
  if (!existing) return { notFound: true };

  const membership = await requireMembership(groupId, userId);
  if (existing.createdById !== userId && !membership?.isOwner) {
    return { forbidden: true };
  }

  const memberErr = await membersError(groupId, [data.paidById, ...data.splits.map((s) => s.userId)]);
  if (memberErr) return memberErr;

  const resolved = resolveSplits(data.amount, data.splitType, data.splits);
  if (resolved.error) return resolved;

  const expense = await prisma.$transaction(async (tx) => {
    await tx.groupExpenseSplit.deleteMany({ where: { groupExpenseId: id } });
    const updated = await tx.groupExpense.update({
      where: { id },
      data: {
        description: data.description,
        amount: data.amount,
        splitType: data.splitType,
        paidById: data.paidById,
        date: data.date,
        splits: { create: resolved.splits },
      },
      include: { splits: true },
    });

    const group = await tx.group.findUnique({ where: { id: groupId }, select: { name: true } });
    const category = await findOrCreateGroupExpenseCategory(tx, data.paidById);
    const note = `${data.description} — paid for "${group.name}"`;
    const linkedExpense = await tx.expense.findFirst({ where: { groupExpenseId: id } });

    if (linkedExpense) {
      await tx.expense.update({
        where: { id: linkedExpense.id },
        data: { userId: data.paidById, amount: data.amount, date: data.date, note, categoryId: category.id, sourceId: null },
      });
    } else {
      await createExpenseRecord(data.paidById, {
        amount: data.amount,
        type: "EXPENSE",
        categoryId: category.id,
        note,
        date: data.date,
        groupExpenseId: id,
        tagIds: [],
      }, tx);
    }

    return updated;
  }, { maxWait: 10000, timeout: 15000 });

  return { record: expense };
}

export async function deleteGroupExpenseRecord(userId, groupId, id) {
  const existing = await prisma.groupExpense.findFirst({ where: { id, groupId } });
  if (!existing) return { notFound: true };

  const membership = await requireMembership(groupId, userId);
  if (existing.createdById !== userId && !membership?.isOwner) {
    return { forbidden: true };
  }

  await prisma.groupExpense.delete({ where: { id } });
  return { ok: true };
}

router.get("/:groupId/expenses", async (req, res, next) => {
  try {
    const membership = await requireMembership(req.params.groupId, req.userId);
    if (!membership) return res.status(404).json({ error: "Not found" });

    const expenses = await prisma.groupExpense.findMany({
      where: { groupId: req.params.groupId },
      include: {
        splits: true,
        paidBy: { select: { id: true, name: true } },
        createdBy: { select: { id: true, name: true } },
      },
      orderBy: { date: "desc" },
    });
    res.json(expenses);
  } catch (err) {
    next(err);
  }
});

router.post("/:groupId/expenses", async (req, res, next) => {
  try {
    const membership = await requireMembership(req.params.groupId, req.userId);
    if (!membership) return res.status(404).json({ error: "Not found" });

    const data = groupExpenseSchema.parse(req.body);
    const result = await createGroupExpenseRecord(req.userId, req.params.groupId, data);
    if (result.error) return res.status(result.statusCode).json({ error: result.error });
    res.status(201).json(result.record);
  } catch (err) {
    next(err);
  }
});

router.patch("/:groupId/expenses/:id", async (req, res, next) => {
  try {
    const membership = await requireMembership(req.params.groupId, req.userId);
    if (!membership) return res.status(404).json({ error: "Not found" });

    const data = groupExpenseSchema.parse(req.body);
    const result = await updateGroupExpenseRecord(req.userId, req.params.groupId, req.params.id, data);
    if (result.notFound) return res.status(404).json({ error: "Not found" });
    if (result.forbidden) return res.status(403).json({ error: "Only the person who logged this expense or the group owner can edit it" });
    if (result.error) return res.status(result.statusCode).json({ error: result.error });
    res.json(result.record);
  } catch (err) {
    next(err);
  }
});

router.delete("/:groupId/expenses/:id", async (req, res, next) => {
  try {
    const membership = await requireMembership(req.params.groupId, req.userId);
    if (!membership) return res.status(404).json({ error: "Not found" });

    const result = await deleteGroupExpenseRecord(req.userId, req.params.groupId, req.params.id);
    if (result.notFound) return res.status(404).json({ error: "Not found" });
    if (result.forbidden) return res.status(403).json({ error: "Only the person who logged this expense or the group owner can delete it" });
    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
});

router.get("/:groupId/balances", async (req, res, next) => {
  try {
    const membership = await requireMembership(req.params.groupId, req.userId);
    if (!membership) return res.status(404).json({ error: "Not found" });

    const result = await fetchGroupBalances(req.params.groupId);
    res.json(result);
  } catch (err) {
    next(err);
  }
});

const settlementSchema = z.object({
  fromUserId: z.string().optional(),
  toUserId: z.string().optional(),
  amount: z.number().positive(),
  note: z.string().optional(),
});

router.get("/:groupId/settlements", async (req, res, next) => {
  try {
    const membership = await requireMembership(req.params.groupId, req.userId);
    if (!membership) return res.status(404).json({ error: "Not found" });

    const where = { groupId: req.params.groupId };
    if (req.query.status) where.status = req.query.status;

    const settlements = await prisma.settlement.findMany({
      where,
      include: {
        fromUser: { select: { id: true, name: true } },
        toUser: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: "desc" },
    });
    res.json(settlements);
  } catch (err) {
    next(err);
  }
});

router.post("/:groupId/settlements", async (req, res, next) => {
  try {
    const membership = await requireMembership(req.params.groupId, req.userId);
    if (!membership) return res.status(404).json({ error: "Not found" });

    const data = settlementSchema.parse(req.body);
    const fromUserId = data.fromUserId ?? req.userId;
    const toUserId = data.toUserId ?? req.userId;
    if (fromUserId === toUserId) {
      return res.status(400).json({ error: "A settlement needs two different people" });
    }
    if (req.userId !== fromUserId && req.userId !== toUserId) {
      return res.status(400).json({ error: "You must be one of the two parties in a settlement" });
    }
    const memberErr = await membersError(req.params.groupId, [fromUserId, toUserId]);
    if (memberErr) return res.status(memberErr.statusCode).json({ error: memberErr.error });

    const settlement = await prisma.settlement.create({
      data: {
        groupId: req.params.groupId,
        fromUserId,
        toUserId,
        amount: data.amount,
        note: data.note,
        initiatedById: req.userId,
      },
    });
    res.status(201).json(settlement);
  } catch (err) {
    next(err);
  }
});

router.patch("/:groupId/settlements/:id", async (req, res, next) => {
  try {
    const membership = await requireMembership(req.params.groupId, req.userId);
    if (!membership) return res.status(404).json({ error: "Not found" });

    const { action } = z.object({ action: z.enum(["confirm", "decline"]) }).parse(req.body);
    const settlement = await prisma.settlement.findFirst({
      where: { id: req.params.id, groupId: req.params.groupId },
      include: {
        fromUser: { select: { id: true, name: true } },
        toUser: { select: { id: true, name: true } },
      },
    });
    if (!settlement) return res.status(404).json({ error: "Not found" });
    if (settlement.status !== "PENDING") return res.status(409).json({ error: "This settlement has already been resolved" });

    const otherParty = settlement.initiatedById === settlement.fromUserId ? settlement.toUserId : settlement.fromUserId;
    if (req.userId !== otherParty) {
      return res.status(403).json({ error: "Only the other party in this settlement can confirm or decline it" });
    }

    if (action === "decline") {
      const declined = await prisma.settlement.update({
        where: { id: settlement.id },
        data: { status: "DECLINED", resolvedAt: new Date() },
      });
      return res.json(declined);
    }

    const now = new Date().toISOString();
    const updated = await prisma.$transaction(async (tx) => {
      const confirmed = await tx.settlement.update({
        where: { id: settlement.id },
        data: { status: "CONFIRMED", resolvedAt: new Date() },
      });

      const group = await tx.group.findUnique({ where: { id: req.params.groupId }, select: { name: true } });
      const [debtorCategory, creditorCategory] = await Promise.all([
        findOrCreateSettlementCategory(tx, settlement.fromUserId),
        findOrCreateSettlementCategory(tx, settlement.toUserId),
      ]);

      await createExpenseRecord(settlement.fromUserId, {
        amount: settlement.amount,
        type: "EXPENSE",
        categoryId: debtorCategory.id,
        note: `Paid ${settlement.toUser.name} — settled up in "${group.name}"`,
        date: now,
        tagIds: [],
      }, tx);

      // Category-tied (not source-tied) so it reads as a refund of money
      // already counted as spent — nets against both Total Spent and Remaining Budget.
      await createExpenseRecord(settlement.toUserId, {
        amount: settlement.amount,
        type: "INCOME",
        categoryId: creditorCategory.id,
        note: `Received from ${settlement.fromUser.name} — settled up in "${group.name}"`,
        date: now,
        tagIds: [],
      }, tx);

      return confirmed;
    }, { maxWait: 10000, timeout: 15000 });

    res.json(updated);
  } catch (err) {
    next(err);
  }
});

export default router;
