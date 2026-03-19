import express from "express";
import { z } from "zod";
import { query } from "../db.js";
import { authenticate, requireRole } from "../middleware/auth.js";

const router = express.Router();

const memberSchema = z.object({
  fullName: z.string().min(2),
  phone: z.string().min(7),
  email: z.string().email().optional().nullable(),
  address: z.string().optional().nullable(),
  profileInfo: z.record(z.any()).optional().default({}),
  isActive: z.boolean().optional().default(true),
});

router.get("/", authenticate, requireRole("ADMIN"), async (req, res, next) => {
  try {
    const result = await query(
      `SELECT id, full_name, phone, email, address, profile_info, is_active, joined_on, created_at, updated_at
       FROM members
       ORDER BY created_at DESC`
    );
    return res.json(result.rows);
  } catch (error) {
    return next(error);
  }
});

router.post("/", authenticate, requireRole("ADMIN"), async (req, res, next) => {
  try {
    const payload = memberSchema.parse(req.body);

    const inserted = await query(
      `INSERT INTO members (full_name, phone, email, address, profile_info, is_active)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id, full_name, phone, email, address, profile_info, is_active, joined_on, created_at, updated_at`,
      [
        payload.fullName,
        payload.phone,
        payload.email || null,
        payload.address || null,
        JSON.stringify(payload.profileInfo || {}),
        payload.isActive,
      ]
    );

    return res.status(201).json(inserted.rows[0]);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ message: "Invalid member payload.", issues: error.issues });
    }
    return next(error);
  }
});

router.get("/:memberId", authenticate, async (req, res, next) => {
  try {
    const memberId = Number(req.params.memberId);

    if (Number.isNaN(memberId)) {
      return res.status(400).json({ message: "Invalid memberId." });
    }

    if (req.user.role === "MEMBER" && req.user.memberId !== memberId) {
      return res.status(403).json({ message: "You can only access your own profile." });
    }

    const result = await query(
      `SELECT id, full_name, phone, email, address, profile_info, is_active, joined_on, created_at, updated_at
       FROM members
       WHERE id = $1`,
      [memberId]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ message: "Member not found." });
    }

    return res.json(result.rows[0]);
  } catch (error) {
    return next(error);
  }
});

router.put("/:memberId", authenticate, requireRole("ADMIN"), async (req, res, next) => {
  try {
    const memberId = Number(req.params.memberId);

    if (Number.isNaN(memberId)) {
      return res.status(400).json({ message: "Invalid memberId." });
    }

    const payload = memberSchema.partial().parse(req.body);

    const existing = await query("SELECT id, profile_info FROM members WHERE id = $1", [memberId]);
    if (existing.rowCount === 0) {
      return res.status(404).json({ message: "Member not found." });
    }

    const current = existing.rows[0];
    const mergedProfile = payload.profileInfo
      ? { ...(current.profile_info || {}), ...payload.profileInfo }
      : current.profile_info || {};

    const updated = await query(
      `UPDATE members
       SET full_name = COALESCE($1, full_name),
           phone = COALESCE($2, phone),
           email = COALESCE($3, email),
           address = COALESCE($4, address),
           profile_info = $5,
           is_active = COALESCE($6, is_active),
           updated_at = NOW()
       WHERE id = $7
       RETURNING id, full_name, phone, email, address, profile_info, is_active, joined_on, created_at, updated_at`,
      [
        payload.fullName ?? null,
        payload.phone ?? null,
        payload.email ?? null,
        payload.address ?? null,
        JSON.stringify(mergedProfile),
        payload.isActive ?? null,
        memberId,
      ]
    );

    return res.json(updated.rows[0]);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ message: "Invalid member payload.", issues: error.issues });
    }
    return next(error);
  }
});

router.delete("/:memberId", authenticate, requireRole("ADMIN"), async (req, res, next) => {
  try {
    const memberId = Number(req.params.memberId);

    if (Number.isNaN(memberId)) {
      return res.status(400).json({ message: "Invalid memberId." });
    }

    const result = await query(
      `UPDATE members
       SET is_active = FALSE,
           updated_at = NOW()
       WHERE id = $1
       RETURNING id`,
      [memberId]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ message: "Member not found." });
    }

    return res.status(204).send();
  } catch (error) {
    return next(error);
  }
});

export default router;
