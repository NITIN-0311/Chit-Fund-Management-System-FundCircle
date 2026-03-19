import express from "express";
import { z } from "zod";
import { query } from "../db.js";
import { authenticate, requireRole } from "../middleware/auth.js";
import { calculateEligibility } from "../services/calculationClient.js";

const router = express.Router();

const groupSchema = z.object({
  name: z.string().min(3),
  monthlyAmount: z.number().positive(),
  durationMonths: z.number().int().positive(),
  startDate: z.string().date(),
  status: z.enum(["ACTIVE", "UPCOMING", "CLOSED"]).optional().default("ACTIVE"),
});

const assignMemberSchema = z.object({
  memberId: z.number().int().positive(),
});

function getCurrentMonthNumber(startDate, durationMonths) {
  const start = new Date(startDate);
  const now = new Date();

  if (Number.isNaN(start.getTime())) {
    return 1;
  }

  const months = (now.getFullYear() - start.getFullYear()) * 12 + (now.getMonth() - start.getMonth()) + 1;
  const bounded = Math.max(months, 1);
  return Math.min(bounded, durationMonths);
}

router.get("/", authenticate, async (req, res, next) => {
  try {
    const result = await query(
      `SELECT g.id, g.name, g.monthly_amount, g.duration_months, g.start_date, g.status, g.created_at,
              COUNT(gm.id) FILTER (WHERE gm.is_active = TRUE) AS member_count
       FROM chit_groups g
       LEFT JOIN group_members gm ON gm.group_id = g.id
       GROUP BY g.id
       ORDER BY g.created_at DESC`
    );

    return res.json(result.rows);
  } catch (error) {
    return next(error);
  }
});

router.post("/", authenticate, requireRole("ADMIN"), async (req, res, next) => {
  try {
    const payload = groupSchema.parse(req.body);

    const inserted = await query(
      `INSERT INTO chit_groups (name, monthly_amount, duration_months, start_date, status)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, name, monthly_amount, duration_months, start_date, status, created_at`,
      [payload.name, payload.monthlyAmount, payload.durationMonths, payload.startDate, payload.status]
    );

    return res.status(201).json(inserted.rows[0]);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ message: "Invalid group payload.", issues: error.issues });
    }
    return next(error);
  }
});

router.put("/:groupId", authenticate, requireRole("ADMIN"), async (req, res, next) => {
  try {
    const groupId = Number(req.params.groupId);

    if (Number.isNaN(groupId)) {
      return res.status(400).json({ message: "Invalid groupId." });
    }

    const payload = groupSchema.partial().parse(req.body);

    const updated = await query(
      `UPDATE chit_groups
       SET name = COALESCE($1, name),
           monthly_amount = COALESCE($2, monthly_amount),
           duration_months = COALESCE($3, duration_months),
           start_date = COALESCE($4, start_date),
           status = COALESCE($5, status)
       WHERE id = $6
       RETURNING id, name, monthly_amount, duration_months, start_date, status, created_at`,
      [
        payload.name ?? null,
        payload.monthlyAmount ?? null,
        payload.durationMonths ?? null,
        payload.startDate ?? null,
        payload.status ?? null,
        groupId,
      ]
    );

    if (updated.rowCount === 0) {
      return res.status(404).json({ message: "Group not found." });
    }

    return res.json(updated.rows[0]);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ message: "Invalid group payload.", issues: error.issues });
    }
    return next(error);
  }
});

router.post("/:groupId/members", authenticate, requireRole("ADMIN"), async (req, res, next) => {
  try {
    const groupId = Number(req.params.groupId);
    if (Number.isNaN(groupId)) {
      return res.status(400).json({ message: "Invalid groupId." });
    }

    const payload = assignMemberSchema.parse(req.body);

    const assignment = await query(
      `INSERT INTO group_members (group_id, member_id, is_active)
       VALUES ($1, $2, TRUE)
       ON CONFLICT (group_id, member_id)
       DO UPDATE SET is_active = TRUE, joined_at = CURRENT_DATE
       RETURNING id, group_id, member_id, joined_at, is_active`,
      [groupId, payload.memberId]
    );

    return res.status(201).json(assignment.rows[0]);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ message: "Invalid member assignment payload.", issues: error.issues });
    }
    return next(error);
  }
});

router.get("/:groupId", authenticate, async (req, res, next) => {
  try {
    const groupId = Number(req.params.groupId);
    if (Number.isNaN(groupId)) {
      return res.status(400).json({ message: "Invalid groupId." });
    }

    const groupResult = await query(
      `SELECT id, name, monthly_amount, duration_months, start_date, status, created_at
       FROM chit_groups
       WHERE id = $1`,
      [groupId]
    );

    if (groupResult.rowCount === 0) {
      return res.status(404).json({ message: "Group not found." });
    }

    const group = groupResult.rows[0];

    const membersResult = await query(
      `SELECT m.id AS member_id, m.full_name, m.phone, m.email, gm.joined_at, gm.is_active,
              COALESCE(SUM(c.amount_paid), 0) AS paid_total
       FROM group_members gm
       JOIN members m ON m.id = gm.member_id
       LEFT JOIN contributions c ON c.group_id = gm.group_id AND c.member_id = gm.member_id
       WHERE gm.group_id = $1 AND gm.is_active = TRUE
       GROUP BY m.id, gm.joined_at, gm.is_active
       ORDER BY m.full_name ASC`,
      [groupId]
    );

    const currentMonth = getCurrentMonthNumber(group.start_date, Number(group.duration_months));

    const membersWithEligibility = await Promise.all(
      membersResult.rows.map(async (member) => {
        const calc = await calculateEligibility({
          monthlyAmount: Number(group.monthly_amount),
          durationMonths: Number(group.duration_months),
          monthNumber: currentMonth,
          paidTotal: Number(member.paid_total),
        });

        return {
          ...member,
          paid_total: Number(member.paid_total),
          current_month: currentMonth,
          pending_amount: calc.pendingAmount,
          is_eligible: calc.isEligible,
          completion_percent: calc.completionPercent,
        };
      })
    );

    return res.json({
      ...group,
      current_month: currentMonth,
      members: membersWithEligibility,
    });
  } catch (error) {
    return next(error);
  }
});

export default router;
