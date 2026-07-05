import { Router } from "express";
import { z } from "zod";
import prisma from "../lib/prisma.js";
import { authMiddleware } from "../middleware/auth.js";

const router = Router();

router.use(authMiddleware);

router.get("/vapid-public-key", (req, res) => {
  res.json({ publicKey: process.env.VAPID_PUBLIC_KEY });
});

const subscribeSchema = z.object({
  endpoint: z.string().url(),
  keys: z.object({
    p256dh: z.string(),
    auth: z.string(),
  }),
});

router.post("/subscribe", async (req, res, next) => {
  try {
    const { endpoint, keys } = subscribeSchema.parse(req.body);
    const subscription = await prisma.pushSubscription.upsert({
      where: { endpoint },
      update: { userId: req.userId, p256dh: keys.p256dh, auth: keys.auth },
      create: { userId: req.userId, endpoint, p256dh: keys.p256dh, auth: keys.auth },
    });
    res.status(201).json({ id: subscription.id });
  } catch (err) {
    next(err);
  }
});

const unsubscribeSchema = z.object({ endpoint: z.string().url() });

router.post("/unsubscribe", async (req, res, next) => {
  try {
    const { endpoint } = unsubscribeSchema.parse(req.body);
    await prisma.pushSubscription.deleteMany({ where: { endpoint, userId: req.userId } });
    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
});

export default router;
