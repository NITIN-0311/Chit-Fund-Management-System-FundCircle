import express from "express";
import { z } from "zod";
import { query } from "../db.js";
import { authenticate, requireRole } from "../middleware/auth.js";
import { calculateEligibility } from "../services/calculationClient.js";

const router = express.Router();

const contributionSchema = z.object({
  groupId: z.number().int().positive(),
  memberId: z.number().int().positive(),
  contributionMonth: z.number().int().positive(),
  amountPaid: z.number().positive(),
  paidOn: z.string().date().optional(),
  paymentMode: z.string().min(2).optional().default("CASH"),
  notes: z.string().optional().nullable(),
});

router.get("/", authenticate, async (req, res, next) => {
  try {
    const { groupId, memberId } = req.query;

    const filters = [];
    const values = [];

    if (groupId) {
      values.push(Number(groupId));
      filters.push(`c.group_id = $${values.length}`);
    }

    if (memberId) {
      values.push(Number(memberId));
      filters.push(`c.member_id = $${values.length}`);
    }

    if (req.user.role === "MEMBER") {
      values.push(req.user.memberId);
      filters.push(`c.member_id = $${values.length}`);
    }

    const whereClause = filters.length > 0 ? `WHERE ${filters.join(" AND ")}` : "";

    const result = await query(
      `SELECT c.id, c.group_id, g.name AS group_name, c.member_id, m.full_name, c.contribution_month,
              c.amount_paid, c.paid_on, c.payment_mode, c.notes, c.created_at
       FROM contributions c
       JOIN chit_groups g ON g.id = c.group_id
       JOIN members m ON m.id = c.member_id
       ${whereClause}
       ORDER BY c.paid_on DESC, c.created_at DESC`,
      values
    );

    return res.json(result.rows);
  } catch (error) {
    return next(error);
  }
});

router.post("/", authenticate, requireRole("ADMIN"), async (req, res, next) => {
  try {
    const payload = contributionSchema.parse(req.body);

    const inserted = await query(
      `INSERT INTO contributions (group_id, member_id, contribution_month, amount_paid, paid_on, payment_mode, notes)
       VALUES ($1, $2, $3, $4, COALESCE($5, CURRENT_DATE), $6, $7)
       ON CONFLICT (group_id, member_id, contribution_month)
       DO UPDATE SET amount_paid = EXCLUDED.amount_paid,
                     paid_on = EXCLUDED.paid_on,
                     payment_mode = EXCLUDED.payment_mode,
                     notes = EXCLUDED.notes
       RETURNING id, group_id, member_id, contribution_month, amount_paid, paid_on, payment_mode, notes, created_at`,
      [
        payload.groupId,
        payload.memberId,
        payload.contributionMonth,
        payload.amountPaid,
        payload.paidOn || null,
        payload.paymentMode,
        payload.notes || null,
      ]
    );

    const groupResult = await query(
      `SELECT monthly_amount, duration_months
       FROM chit_groups
       WHERE id = $1`,
      [payload.groupId]
    );

    const paidResult = await query(
      `SELECT COALESCE(SUM(amount_paid), 0) AS paid_total
       FROM contributions
       WHERE group_id = $1 AND member_id = $2`,
      [payload.groupId, payload.memberId]
    );

    const group = groupResult.rows[0];
    const paidTotal = Number(paidResult.rows[0].paid_total);

    const eligibility = await calculateEligibility({
      monthlyAmount: Number(group.monthly_amount),
      durationMonths: Number(group.duration_months),
      monthNumber: payload.contributionMonth,
      paidTotal,
    });

    return res.status(201).json({
      contribution: inserted.rows[0],
      eligibility,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ message: "Invalid contribution payload.", issues: error.issues });
    }
    return next(error);
  }
});

export default router;
