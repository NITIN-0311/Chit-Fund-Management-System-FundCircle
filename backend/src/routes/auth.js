import express from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { z } from "zod";
import { query } from "../db.js";

const router = express.Router();
const jwtSecret = process.env.JWT_SECRET || "dev-secret";

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  role: z.enum(["ADMIN", "MEMBER"]).default("MEMBER"),
  memberId: z.number().int().positive().optional(),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

router.post("/register", async (req, res, next) => {
  try {
    const payload = registerSchema.parse(req.body);

    if (payload.role === "MEMBER" && !payload.memberId) {
      return res.status(400).json({ message: "memberId is required for MEMBER role." });
    }

    const existing = await query("SELECT id FROM users WHERE email = $1", [payload.email]);
    if (existing.rowCount > 0) {
      return res.status(409).json({ message: "A user with this email already exists." });
    }

    const hashedPassword = await bcrypt.hash(payload.password, 10);
    const inserted = await query(
      `INSERT INTO users (email, password_hash, role, member_id)
       VALUES ($1, $2, $3, $4)
       RETURNING id, email, role, member_id`,
      [
        payload.email,
        hashedPassword,
        payload.role,
        payload.role === "MEMBER" ? payload.memberId : null,
      ]
    );

    const user = inserted.rows[0];
    const token = jwt.sign(
      {
        userId: user.id,
        role: user.role,
        memberId: user.member_id,
      },
      jwtSecret,
      { expiresIn: "12h" }
    );

    return res.status(201).json({ token, user });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ message: "Invalid request payload.", issues: error.issues });
    }
    return next(error);
  }
});

router.post("/login", async (req, res, next) => {
  try {
    const payload = loginSchema.parse(req.body);

    const result = await query(
      `SELECT id, email, role, member_id, password_hash
       FROM users
       WHERE email = $1`,
      [payload.email]
    );

    if (result.rowCount === 0) {
      return res.status(401).json({ message: "Invalid email or password." });
    }

    const user = result.rows[0];
    const isPasswordValid = await bcrypt.compare(payload.password, user.password_hash);

    if (!isPasswordValid) {
      return res.status(401).json({ message: "Invalid email or password." });
    }

    const token = jwt.sign(
      {
        userId: user.id,
        role: user.role,
        memberId: user.member_id,
      },
      jwtSecret,
      { expiresIn: "12h" }
    );

    return res.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        memberId: user.member_id,
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ message: "Invalid request payload.", issues: error.issues });
    }
    return next(error);
  }
});

export default router;
