import express from "express";
import { query } from "../db.js";
import { authenticate, requireRole } from "../middleware/auth.js";
import { generateStatement } from "../services/calculationClient.js";

const router = express.Router();

function getCurrentMonth(startDate, durationMonths) {
  const start = new Date(startDate);
  if (Number.isNaN(start.getTime())) {
    return 1;
  }

  const now = new Date();
  const monthDiff = (now.getFullYear() - start.getFullYear()) * 12 + (now.getMonth() - start.getMonth()) + 1;
  return Math.min(Math.max(monthDiff, 1), durationMonths);
}

router.get("/summary", authenticate, requireRole("ADMIN"), async (req, res, next) => {
  try {
    const [membersResult, groupsResult, contributionsResult, completedAuctionsResult] = await Promise.all([
      query(`SELECT COUNT(*)::int AS total_members FROM members WHERE is_active = TRUE`),
      query(`SELECT COUNT(*)::int AS active_groups FROM chit_groups WHERE status = 'ACTIVE'`),
      query(`SELECT COALESCE(SUM(amount_paid), 0) AS total_collected FROM contributions`),
      query(`SELECT COUNT(*)::int AS completed_auctions FROM auctions WHERE status = 'COMPLETED'`),
    ]);

    const dueRows = await query(
      `SELECT gm.group_id, gm.member_id, g.monthly_amount, g.duration_months, g.start_date,
              COALESCE(SUM(c.amount_paid), 0) AS paid_total
       FROM group_members gm
       JOIN chit_groups g ON g.id = gm.group_id
       LEFT JOIN contributions c ON c.group_id = gm.group_id AND c.member_id = gm.member_id
       WHERE gm.is_active = TRUE
         AND g.status = 'ACTIVE'
       GROUP BY gm.group_id, gm.member_id, g.monthly_amount, g.duration_months, g.start_date`
    );

    let totalPending = 0;
    for (const row of dueRows.rows) {
      const month = getCurrentMonth(row.start_date, Number(row.duration_months));
      const dueUptoMonth = Number(row.monthly_amount) * month;
      totalPending += Math.max(dueUptoMonth - Number(row.paid_total), 0);
    }

    return res.json({
      totalMembers: membersResult.rows[0].total_members,
      activeGroups: groupsResult.rows[0].active_groups,
      totalCollected: Number(contributionsResult.rows[0].total_collected),
      totalPending,
      completedAuctions: completedAuctionsResult.rows[0].completed_auctions,
    });
  } catch (error) {
    return next(error);
  }
});

router.get("/statement/me", authenticate, async (req, res, next) => {
  try {
    if (req.user.role !== "MEMBER" || !req.user.memberId) {
      return res.status(403).json({ message: "This endpoint is available only for member users." });
    }

    req.params.memberId = String(req.user.memberId);
    return next();
  } catch (error) {
    return next(error);
  }
}, async (req, res, next) => {
  try {
    return await buildMemberStatement(req, res);
  } catch (error) {
    return next(error);
  }
});

router.get("/statement/member/:memberId", authenticate, async (req, res, next) => {
  try {
    const memberId = Number(req.params.memberId);
    if (Number.isNaN(memberId)) {
      return res.status(400).json({ message: "Invalid memberId." });
    }

    if (req.user.role === "MEMBER" && req.user.memberId !== memberId) {
      return res.status(403).json({ message: "You can only access your own statement." });
    }

    return await buildMemberStatement(req, res);
  } catch (error) {
    return next(error);
  }
});

async function buildMemberStatement(req, res) {
  const memberId = Number(req.params.memberId);

  const memberResult = await query(
    `SELECT id, full_name, phone, email
     FROM members
     WHERE id = $1`,
    [memberId]
  );

  if (memberResult.rowCount === 0) {
    return res.status(404).json({ message: "Member not found." });
  }

  const membershipResult = await query(
    `SELECT g.id AS group_id, g.name AS group_name, g.monthly_amount, g.duration_months, g.start_date
     FROM group_members gm
     JOIN chit_groups g ON g.id = gm.group_id
     WHERE gm.member_id = $1 AND gm.is_active = TRUE
     ORDER BY g.created_at DESC`,
    [memberId]
  );

  const statements = await Promise.all(
    membershipResult.rows.map(async (group) => {
      const contributionsResult = await query(
        `SELECT contribution_month, amount_paid, paid_on, payment_mode
         FROM contributions
         WHERE group_id = $1 AND member_id = $2
         ORDER BY contribution_month ASC`,
        [group.group_id, memberId]
      );

      const winningsResult = await query(
        `SELECT a.month_number, p.amount, p.paid_on
         FROM payouts p
         JOIN auctions a ON a.id = p.auction_id
         WHERE p.member_id = $1 AND a.group_id = $2
         ORDER BY a.month_number ASC`,
        [memberId, group.group_id]
      );

      const calc = await generateStatement({
        monthlyAmount: Number(group.monthly_amount),
        durationMonths: Number(group.duration_months),
        contributions: contributionsResult.rows,
      });

      return {
        groupId: group.group_id,
        groupName: group.group_name,
        monthlyAmount: Number(group.monthly_amount),
        durationMonths: Number(group.duration_months),
        startDate: group.start_date,
        summary: calc,
        contributions: contributionsResult.rows,
        payoutsReceived: winningsResult.rows,
      };
    })
  );

  const overallDue = statements.reduce((sum, s) => sum + Number(s.summary.totalDue || 0), 0);
  const overallPaid = statements.reduce((sum, s) => sum + Number(s.summary.paidTotal || 0), 0);
  const overallPending = Math.max(overallDue - overallPaid, 0);

  return res.json({
    generatedAt: new Date().toISOString(),
    member: memberResult.rows[0],
    totals: {
      overallDue,
      overallPaid,
      overallPending,
    },
    statements,
  });
}

export default router;
