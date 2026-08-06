import { Router } from "express";
import crypto from "crypto";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { z } from "zod";
import prisma from "../lib/prisma.js";
import { authMiddleware } from "../middleware/auth.js";
import { sendPasswordResetEmail } from "../lib/email.js";
import { seedDefaultCategories } from "../../prisma/seed.js";

const router = Router();

const USER_SELECT = {
  id: true, name: true, email: true,
  salaryDay: true, currency: true,
  monthlyBudget: true, useDefaultBudget: true, createdAt: true,
  upiId: true,
};

const registerSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  password: z.string().min(6),
  salaryDay: z.number().int().min(1).max(31).default(1),
  currency: z.string().default("INR"),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string(),
});

function signToken(userId) {
  return jwt.sign({ userId }, process.env.JWT_SECRET, { expiresIn: "7d" });
}

function setCookie(res, token) {
  res.cookie("token", token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });
}

router.post("/register", async (req, res, next) => {
  try {
    const data = registerSchema.parse(req.body);
    const existing = await prisma.user.findUnique({ where: { email: data.email } });
    if (existing) return res.status(409).json({ error: "Email already registered" });

    const hashed = await bcrypt.hash(data.password, 10);
    const user = await prisma.user.create({
      data: { name: data.name, email: data.email, password: hashed, salaryDay: data.salaryDay, currency: data.currency },
      select: USER_SELECT,
    });

    await seedDefaultCategories(user.id);

    const token = signToken(user.id);
    setCookie(res, token);
    res.status(201).json({ token, user });
  } catch (err) {
    next(err);
  }
});

router.post("/login", async (req, res, next) => {
  try {
    const { email, password } = loginSchema.parse(req.body);
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) return res.status(401).json({ error: "Invalid credentials" });

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) return res.status(401).json({ error: "Invalid credentials" });

    const token = signToken(user.id);
    setCookie(res, token);

    const { password: _, ...safeUser } = user;
    res.json({ token, user: safeUser });
  } catch (err) {
    next(err);
  }
});

router.get("/me", authMiddleware, async (req, res, next) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.userId },
      select: USER_SELECT,
    });
    if (!user) return res.status(404).json({ error: "User not found" });
    res.json(user);
  } catch (err) {
    next(err);
  }
});

router.patch("/me", authMiddleware, async (req, res, next) => {
  try {
    const schema = z.object({
      name: z.string().min(1).optional(),
      salaryDay: z.number().int().min(1).max(31).optional(),
      currency: z.string().optional(),
      monthlyBudget: z.number().positive().optional().nullable(),
      useDefaultBudget: z.boolean().optional(),
      upiId: z.string().optional().nullable(),
    });
    const data = schema.parse(req.body);
    const user = await prisma.user.update({
      where: { id: req.userId },
      data,
      select: USER_SELECT,
    });
    res.json(user);
  } catch (err) {
    next(err);
  }
});

router.patch("/password", authMiddleware, async (req, res, next) => {
  try {
    const schema = z.object({
      currentPassword: z.string(),
      newPassword: z.string().min(6),
    });
    const { currentPassword, newPassword } = schema.parse(req.body);

    const user = await prisma.user.findUnique({ where: { id: req.userId } });
    const valid = await bcrypt.compare(currentPassword, user.password);
    if (!valid) return res.status(400).json({ error: "Current password is incorrect" });

    const hashed = await bcrypt.hash(newPassword, 10);
    await prisma.user.update({ where: { id: req.userId }, data: { password: hashed } });
    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
});

const forgotPasswordSchema = z.object({
  email: z.string().email(),
});

const resetPasswordSchema = z.object({
  token: z.string().min(1),
  password: z.string().min(6),
});

const RESET_TOKEN_TTL_MS = 60 * 60 * 1000; // 1 hour
const RESET_RATE_WINDOW_MS = 3 * 60 * 60 * 1000; // 3 hours
const RESET_RATE_MAX = 3;

function hashResetToken(token) {
  return crypto.createHash("sha256").update(token).digest("hex");
}

router.post("/forgot-password", async (req, res, next) => {
  try {
    const { email } = forgotPasswordSchema.parse(req.body);
    const user = await prisma.user.findUnique({ where: { email } });

    if (!user) {
      return res.json({ ok: true });
    }

    const windowStart = new Date(Date.now() - RESET_RATE_WINDOW_MS);
    const recentCount = await prisma.passwordResetToken.count({
      where: { userId: user.id, createdAt: { gt: windowStart } },
    });

    if (recentCount >= RESET_RATE_MAX) {
      return res.status(429).json({ error: "Too many password reset requests. Please wait a few hours before trying again." });
    }

    // Expire any currently active token so only one valid link exists at a time.
    // Records are kept (not deleted) so they count toward the rate limit window.
    await prisma.passwordResetToken.updateMany({
      where: { userId: user.id, expiresAt: { gt: new Date() } },
      data: { expiresAt: new Date() },
    });

    const token = crypto.randomBytes(32).toString("hex");
    await prisma.passwordResetToken.create({
      data: {
        userId: user.id,
        tokenHash: hashResetToken(token),
        expiresAt: new Date(Date.now() + RESET_TOKEN_TTL_MS),
      },
    });

    const resetUrl = `${process.env.CLIENT_URL}/reset-password?token=${token}`;
    try {
      await sendPasswordResetEmail({ to: user.email, name: user.name, resetUrl });
    } catch (emailErr) {
      console.error(`Failed to send password reset email to ${user.email}:`, emailErr);
      return res.status(502).json({ error: "Could not send the reset email. Please try again." });
    }

    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
});

router.get("/reset-password/validate", async (req, res, next) => {
  try {
    const token = typeof req.query.token === "string" ? req.query.token : "";
    if (!token) return res.json({ valid: false });

    const record = await prisma.passwordResetToken.findUnique({
      where: { tokenHash: hashResetToken(token) },
    });
    res.json({ valid: !!record && record.expiresAt >= new Date() });
  } catch (err) {
    next(err);
  }
});

router.post("/reset-password", async (req, res, next) => {
  try {
    const { token, password } = resetPasswordSchema.parse(req.body);

    const record = await prisma.passwordResetToken.findUnique({
      where: { tokenHash: hashResetToken(token) },
    });

    if (!record || record.expiresAt < new Date()) {
      if (record) {
        await prisma.passwordResetToken.delete({ where: { id: record.id } });
      }
      return res.status(400).json({ error: "This reset link is invalid or has expired" });
    }

    const hashed = await bcrypt.hash(password, 10);
    await prisma.$transaction([
      prisma.user.update({ where: { id: record.userId }, data: { password: hashed } }),
      prisma.passwordResetToken.deleteMany({ where: { userId: record.userId } }),
    ]);

    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
});

router.post("/logout", (req, res) => {
  res.clearCookie("token");
  res.json({ ok: true });
});

export default router;
