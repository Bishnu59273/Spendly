import prisma from "./prisma.js";

// GET /api/goals/:id/snapshots only ever reads the most recent 12 rows per
// goal, so keep a small buffer beyond that and prune the rest.
const SNAPSHOT_RETENTION_PER_GOAL = 24;

export async function cleanupExpiredPasswordResetTokens() {
  const { count } = await prisma.passwordResetToken.deleteMany({
    where: { expiresAt: { lt: new Date() } },
  });
  return count;
}

export async function pruneGoalSnapshots() {
  const overLimit = await prisma.goalSnapshot.groupBy({
    by: ["goalId"],
    _count: { id: true },
    having: { id: { _count: { gt: SNAPSHOT_RETENTION_PER_GOAL } } },
  });

  let removed = 0;
  for (const { goalId } of overLimit) {
    const [cutoff] = await prisma.goalSnapshot.findMany({
      where: { goalId },
      orderBy: { snapshotDate: "desc" },
      skip: SNAPSHOT_RETENTION_PER_GOAL,
      take: 1,
      select: { snapshotDate: true },
    });
    if (cutoff) {
      const { count } = await prisma.goalSnapshot.deleteMany({
        where: { goalId, snapshotDate: { lt: cutoff.snapshotDate } },
      });
      removed += count;
    }
  }
  return removed;
}

export async function runDailyCleanup() {
  const [tokens, snapshots] = await Promise.all([
    cleanupExpiredPasswordResetTokens(),
    pruneGoalSnapshots(),
  ]);
  console.log(`[cleanup] Removed ${tokens} expired reset tokens, ${snapshots} old goal snapshots`);
}
