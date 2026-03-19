import express from "express";
import { z } from "zod";
import { query, withTransaction } from "../db.js";
import { authenticate, requireRole } from "../middleware/auth.js";
import { calculatePayout } from "../services/calculationClient.js";

const router = express.Router();

const scheduleSchema = z.object({
  groupId: z.number().int().positive(),
  monthNumber: z.number().int().positive(),
  scheduledOn: z.string().date(),
});

const completeSchema = z.object({
  winnerMemberId: z.number().int().positive(),
  bidDiscountPercent: z.number().min(0).max(100),
});

router.get("/", authenticate, async (req, res, next) => {
  try {
    const { groupId } = req.query;
    const values = [];
    const filters = [];

    if (groupId) {
      values.push(Number(groupId));
      filters.push(`a.group_id = $${values.length}`);
    }

    const whereClause = filters.length > 0 ? `WHERE ${filters.join(" AND ")}` : "";

    const result = await query(
      `SELECT a.id, a.group_id, g.name AS group_name, a.month_number, a.scheduled_on, a.status,
              a.winner_member_id, m.full_name AS winner_name, a.bid_discount_percent,
              a.pool_amount, a.winner_payout, a.dividend_per_member, a.completed_on, a.created_at
       FROM auctions a
       JOIN chit_groups g ON g.id = a.group_id
       LEFT JOIN members m ON m.id = a.winner_member_id
       ${whereClause}
       ORDER BY a.month_number DESC, a.created_at DESC`,
      values
    );

    return res.json(result.rows);
  } catch (error) {
    return next(error);
  }
});

router.post("/", authenticate, requireRole("ADMIN"), async (req, res, next) => {
  try {
    const payload = scheduleSchema.parse(req.body);

    const inserted = await query(
      `INSERT INTO auctions (group_id, month_number, scheduled_on, status)
       VALUES ($1, $2, $3, 'SCHEDULED')
       RETURNING id, group_id, month_number, scheduled_on, status, created_at`,
      [payload.groupId, payload.monthNumber, payload.scheduledOn]
    );

    return res.status(201).json(inserted.rows[0]);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ message: "Invalid auction payload.", issues: error.issues });
    }

    if (error.code === "23505") {
      return res.status(409).json({ message: "Auction for this group and month already exists." });
    }

    return next(error);
  }
});

router.post("/:auctionId/complete", authenticate, requireRole("ADMIN"), async (req, res, next) => {
  try {
    const auctionId = Number(req.params.auctionId);
    if (Number.isNaN(auctionId)) {
      return res.status(400).json({ message: "Invalid auctionId." });
    }

    const payload = completeSchema.parse(req.body);

    const completedAuction = await withTransaction(async (client) => {
      const auctionResult = await client.query(
        `SELECT a.id, a.group_id, a.month_number, a.status, g.monthly_amount
         FROM auctions a
         JOIN chit_groups g ON g.id = a.group_id
         WHERE a.id = $1
         FOR UPDATE`,
        [auctionId]
      );

      if (auctionResult.rowCount === 0) {
        throw Object.assign(new Error("Auction not found."), { status: 404 });
      }

      const auction = auctionResult.rows[0];

      if (auction.status === "COMPLETED") {
        throw Object.assign(new Error("Auction is already completed."), { status: 409 });
      }

      const membershipResult = await client.query(
        `SELECT COUNT(*)::int AS member_count
         FROM group_members
         WHERE group_id = $1 AND is_active = TRUE`,
        [auction.group_id]
      );

      const memberCount = membershipResult.rows[0].member_count;

      const payout = await calculatePayout({
        groupMonthlyAmount: Number(auction.monthly_amount),
        memberCount,
        bidDiscountPercent: payload.bidDiscountPercent,
        monthNumber: auction.month_number,
      });

      const updated = await client.query(
        `UPDATE auctions
         SET status = 'COMPLETED',
             winner_member_id = $1,
             bid_discount_percent = $2,
             pool_amount = $3,
             winner_payout = $4,
             dividend_per_member = $5,
             completed_on = NOW()
         WHERE id = $6
         RETURNING id, group_id, month_number, status, winner_member_id, bid_discount_percent,
                   pool_amount, winner_payout, dividend_per_member, completed_on`,
        [
          payload.winnerMemberId,
          payload.bidDiscountPercent,
          payout.poolAmount,
          payout.winnerPayout,
          payout.dividendPerMember,
          auctionId,
        ]
      );

      await client.query(
        `INSERT INTO payouts (auction_id, member_id, amount, paid_on, remarks)
         VALUES ($1, $2, $3, CURRENT_DATE, $4)
         ON CONFLICT (auction_id)
         DO UPDATE SET member_id = EXCLUDED.member_id,
                       amount = EXCLUDED.amount,
                       paid_on = EXCLUDED.paid_on,
                       remarks = EXCLUDED.remarks`,
        [
          auctionId,
          payload.winnerMemberId,
          payout.winnerPayout,
          `Auto-generated from month ${auction.month_number} auction`,
        ]
      );

      return { ...updated.rows[0], payout_breakdown: payout };
    });

    return res.json(completedAuction);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ message: "Invalid completion payload.", issues: error.issues });
    }

    if (error.status) {
      return res.status(error.status).json({ message: error.message });
    }

    return next(error);
  }
});

export default router;
