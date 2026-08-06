import { Router } from "express";
import { z } from "zod";
import prisma from "../lib/prisma.js";
import { authMiddleware } from "../middleware/auth.js";
import { generateUniqueInviteCode } from "../lib/inviteCode.js";
import { fetchGroupBalances } from "../lib/groupBalances.js";

const router = Router();
router.use(authMiddleware);

const MEMBER_SELECT = {
  id: true,
  userId: true,
  isOwner: true,
  joinedAt: true,
  user: { select: { id: true, name: true, email: true, upiId: true } },
};

export const groupSchema = z.object({
  name: z.string().min(1),
  icon: z.string().default("🏠"),
  color: z.string().default("#1d6b51"),
});

export async function requireMembership(groupId, userId) {
  return prisma.groupMember.findFirst({ where: { groupId, userId } });
}

export async function createGroupRecord(userId, data) {
  const inviteCode = await generateUniqueInviteCode();
  const group = await prisma.$transaction(async (tx) => {
    const created = await tx.group.create({ data: { ...data, inviteCode, createdById: userId } });
    await tx.groupMember.create({ data: { groupId: created.id, userId, isOwner: true } });
    return created;
  });
  return { record: group };
}

router.get("/", async (req, res, next) => {
  try {
    const memberships = await prisma.groupMember.findMany({
      where: { userId: req.userId },
      include: { group: { include: { members: { select: MEMBER_SELECT } } } },
      orderBy: { joinedAt: "asc" },
    });

    const groups = await Promise.all(
      memberships.map(async (m) => {
        const { balances } = await fetchGroupBalances(m.groupId);
        return { ...m.group, myBalance: balances[req.userId] ?? 0 };
      })
    );

    res.json(groups);
  } catch (err) {
    next(err);
  }
});

router.post("/", async (req, res, next) => {
  try {
    const data = groupSchema.parse(req.body);
    const result = await createGroupRecord(req.userId, data);
    res.status(201).json(result.record);
  } catch (err) {
    next(err);
  }
});

router.post("/join", async (req, res, next) => {
  try {
    const { code } = z.object({ code: z.string().min(1) }).parse(req.body);
    const group = await prisma.group.findUnique({ where: { inviteCode: code.toUpperCase() } });
    if (!group) return res.status(404).json({ error: "Invite code not found" });

    const existing = await requireMembership(group.id, req.userId);
    if (!existing) {
      await prisma.groupMember.create({ data: { groupId: group.id, userId: req.userId } });
    }
    res.json(group);
  } catch (err) {
    next(err);
  }
});

router.get("/invite/:code", async (req, res, next) => {
  try {
    const group = await prisma.group.findUnique({
      where: { inviteCode: req.params.code.toUpperCase() },
      select: { id: true, name: true, icon: true, color: true, _count: { select: { members: true } } },
    });
    if (!group) return res.status(404).json({ error: "Invite code not found" });

    const alreadyMember = await requireMembership(group.id, req.userId);
    res.json({
      id: group.id,
      name: group.name,
      icon: group.icon,
      color: group.color,
      memberCount: group._count.members,
      alreadyMember: !!alreadyMember,
    });
  } catch (err) {
    next(err);
  }
});

router.get("/:groupId", async (req, res, next) => {
  try {
    const membership = await requireMembership(req.params.groupId, req.userId);
    if (!membership) return res.status(404).json({ error: "Not found" });

    const group = await prisma.group.findUnique({
      where: { id: req.params.groupId },
      include: { members: { select: MEMBER_SELECT } },
    });
    if (!group) return res.status(404).json({ error: "Not found" });

    const { balances, suggestions } = await fetchGroupBalances(group.id);
    res.json({ ...group, balances, suggestions });
  } catch (err) {
    next(err);
  }
});

router.patch("/:groupId", async (req, res, next) => {
  try {
    const membership = await requireMembership(req.params.groupId, req.userId);
    if (!membership) return res.status(404).json({ error: "Not found" });
    if (!membership.isOwner) return res.status(403).json({ error: "Only the group owner can do this" });

    const data = groupSchema.partial().parse(req.body);
    const group = await prisma.group.update({ where: { id: req.params.groupId }, data });
    res.json(group);
  } catch (err) {
    next(err);
  }
});

router.post("/:groupId/regenerate-code", async (req, res, next) => {
  try {
    const membership = await requireMembership(req.params.groupId, req.userId);
    if (!membership) return res.status(404).json({ error: "Not found" });
    if (!membership.isOwner) return res.status(403).json({ error: "Only the group owner can do this" });

    const inviteCode = await generateUniqueInviteCode();
    const group = await prisma.group.update({ where: { id: req.params.groupId }, data: { inviteCode } });
    res.json(group);
  } catch (err) {
    next(err);
  }
});

router.get("/:groupId/members", async (req, res, next) => {
  try {
    const membership = await requireMembership(req.params.groupId, req.userId);
    if (!membership) return res.status(404).json({ error: "Not found" });

    const members = await prisma.groupMember.findMany({
      where: { groupId: req.params.groupId },
      select: MEMBER_SELECT,
      orderBy: { joinedAt: "asc" },
    });
    const { balances } = await fetchGroupBalances(req.params.groupId);
    res.json(members.map((m) => ({ ...m, balance: balances[m.userId] ?? 0 })));
  } catch (err) {
    next(err);
  }
});

router.delete("/:groupId/members/:userId", async (req, res, next) => {
  try {
    const membership = await requireMembership(req.params.groupId, req.userId);
    if (!membership) return res.status(404).json({ error: "Not found" });

    const isSelf = req.params.userId === req.userId;
    if (!isSelf && !membership.isOwner) {
      return res.status(403).json({ error: "Only the group owner can remove other members" });
    }

    const target = await prisma.groupMember.findFirst({
      where: { groupId: req.params.groupId, userId: req.params.userId },
    });
    if (!target) return res.status(404).json({ error: "Not found" });

    const { balances } = await fetchGroupBalances(req.params.groupId);
    if (Math.abs(balances[req.params.userId] ?? 0) > 0.01) {
      return res.status(409).json({ error: "This member still has an outstanding balance — settle up before leaving/removing." });
    }

    await prisma.groupMember.delete({ where: { id: target.id } });
    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
});

router.delete("/:groupId", async (req, res, next) => {
  try {
    const membership = await requireMembership(req.params.groupId, req.userId);
    if (!membership) return res.status(404).json({ error: "Not found" });
    if (!membership.isOwner) return res.status(403).json({ error: "Only the group owner can do this" });

    const { balances } = await fetchGroupBalances(req.params.groupId);
    const hasOutstanding = Object.values(balances).some((b) => Math.abs(b) > 0.01);
    if (hasOutstanding) {
      return res.status(409).json({ error: "Settle up all balances before deleting this group." });
    }

    await prisma.group.delete({ where: { id: req.params.groupId } });
    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
});

export default router;
