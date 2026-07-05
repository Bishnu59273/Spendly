import { Router } from "express";
import prisma from "../lib/prisma.js";
import { authMiddleware } from "../middleware/auth.js";

const router = Router();

router.use(authMiddleware);

router.get("/", async (req, res, next) => {
  try {
    const [announcements, read] = await Promise.all([
      prisma.announcement.findMany({ orderBy: { createdAt: "desc" } }),
      prisma.announcementRead.findUnique({ where: { userId: req.userId } }),
    ]);

    res.json({ announcements, lastSeenAt: read?.lastSeenAt || null });
  } catch (err) {
    next(err);
  }
});

router.post("/seen", async (req, res, next) => {
  try {
    const read = await prisma.announcementRead.upsert({
      where: { userId: req.userId },
      update: { lastSeenAt: new Date() },
      create: { userId: req.userId },
    });

    res.json({ lastSeenAt: read.lastSeenAt });
  } catch (err) {
    next(err);
  }
});

export default router;
