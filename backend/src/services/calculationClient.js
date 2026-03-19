import axios from "axios";

const calcApi = axios.create({
  baseURL: process.env.PYTHON_CALC_URL || "http://localhost:8001",
  timeout: 3000,
});

function fallbackEligibility(payload) {
  const monthlyAmount = Number(payload.monthlyAmount || 0);
  const durationMonths = Number(payload.durationMonths || 0);
  const monthNumber = Number(payload.monthNumber || 1);
  const paidTotal = Number(payload.paidTotal || 0);

  const dueUptoMonth = monthlyAmount * Math.min(Math.max(monthNumber, 1), durationMonths || monthNumber);
  const pendingAmount = Math.max(dueUptoMonth - paidTotal, 0);
  const overallDue = monthlyAmount * durationMonths;
  const completionPercent = overallDue > 0 ? Math.min((paidTotal / overallDue) * 100, 100) : 0;

  return {
    pendingAmount,
    isEligible: pendingAmount === 0,
    completionPercent,
    dueUptoMonth,
  };
}

function fallbackPayout(payload) {
  const groupMonthlyAmount = Number(payload.groupMonthlyAmount || 0);
  const memberCount = Number(payload.memberCount || 0);
  const bidDiscountPercent = Number(payload.bidDiscountPercent || 0);
  const monthNumber = Number(payload.monthNumber || 1);

  const poolAmount = groupMonthlyAmount * memberCount;
  const discountAmount = (poolAmount * bidDiscountPercent) / 100;
  const winnerPayout = Math.max(poolAmount - discountAmount, 0);
  const dividendPerMember = memberCount > 0 ? discountAmount / memberCount : 0;

  return {
    monthNumber,
    poolAmount,
    discountAmount,
    winnerPayout,
    dividendPerMember,
  };
}

function fallbackStatement(payload) {
  const monthlyAmount = Number(payload.monthlyAmount || 0);
  const durationMonths = Number(payload.durationMonths || 0);
  const contributions = Array.isArray(payload.contributions) ? payload.contributions : [];

  const paidTotal = contributions.reduce((sum, row) => sum + Number(row.amount_paid || row.amountPaid || 0), 0);
  const totalDue = monthlyAmount * durationMonths;
  const pendingAmount = Math.max(totalDue - paidTotal, 0);

  return {
    totalDue,
    paidTotal,
    pendingAmount,
    completionPercent: totalDue > 0 ? Math.min((paidTotal / totalDue) * 100, 100) : 0,
  };
}

async function callCalculationService(endpoint, payload, fallbackCalculator) {
  try {
    const response = await calcApi.post(endpoint, payload);
    return response.data;
  } catch (error) {
    return fallbackCalculator(payload);
  }
}

export function calculateEligibility(payload) {
  return callCalculationService("/eligibility", payload, fallbackEligibility);
}

export function calculatePayout(payload) {
  return callCalculationService("/payout", payload, fallbackPayout);
}

export function generateStatement(payload) {
  return callCalculationService("/statement", payload, fallbackStatement);
}
