from typing import List, Optional

from fastapi import FastAPI
from pydantic import BaseModel, Field

app = FastAPI(title="Chit Fund Calculation Service", version="1.0.0")


def round2(value: float) -> float:
    return round(float(value), 2)


class EligibilityRequest(BaseModel):
    monthlyAmount: float = Field(gt=0)
    durationMonths: int = Field(gt=0)
    monthNumber: int = Field(ge=1)
    paidTotal: float = Field(ge=0)


class EligibilityResponse(BaseModel):
    totalDue: float
    dueUptoMonth: float
    pendingAmount: float
    completionPercent: float
    isEligible: bool


class PayoutRequest(BaseModel):
    groupMonthlyAmount: float = Field(gt=0)
    memberCount: int = Field(gt=0)
    bidDiscountPercent: float = Field(ge=0, le=100)
    monthNumber: int = Field(ge=1)


class PayoutResponse(BaseModel):
    monthNumber: int
    poolAmount: float
    discountAmount: float
    winnerPayout: float
    dividendPerMember: float


class ContributionItem(BaseModel):
    amount_paid: Optional[float] = None
    amountPaid: Optional[float] = None


class StatementRequest(BaseModel):
    monthlyAmount: float = Field(gt=0)
    durationMonths: int = Field(gt=0)
    contributions: List[ContributionItem] = Field(default_factory=list)


class StatementResponse(BaseModel):
    totalDue: float
    paidTotal: float
    pendingAmount: float
    completionPercent: float


@app.get("/health")
def health() -> dict:
    return {"status": "ok", "service": "chit-fund-calculation"}


@app.post("/eligibility", response_model=EligibilityResponse)
def calculate_eligibility(payload: EligibilityRequest) -> EligibilityResponse:
    bounded_month = min(max(payload.monthNumber, 1), payload.durationMonths)
    due_upto_month = payload.monthlyAmount * bounded_month
    total_due = payload.monthlyAmount * payload.durationMonths
    pending = max(due_upto_month - payload.paidTotal, 0)
    completion = min((payload.paidTotal / total_due) * 100, 100) if total_due > 0 else 0

    return EligibilityResponse(
      totalDue=round2(total_due),
      dueUptoMonth=round2(due_upto_month),
      pendingAmount=round2(pending),
      completionPercent=round2(completion),
      isEligible=round2(pending) == 0,
    )


@app.post("/payout", response_model=PayoutResponse)
def calculate_payout(payload: PayoutRequest) -> PayoutResponse:
    pool_amount = payload.groupMonthlyAmount * payload.memberCount
    discount_amount = (pool_amount * payload.bidDiscountPercent) / 100
    winner_payout = max(pool_amount - discount_amount, 0)
    dividend = discount_amount / payload.memberCount if payload.memberCount > 0 else 0

    return PayoutResponse(
      monthNumber=payload.monthNumber,
      poolAmount=round2(pool_amount),
      discountAmount=round2(discount_amount),
      winnerPayout=round2(winner_payout),
      dividendPerMember=round2(dividend),
    )


@app.post("/statement", response_model=StatementResponse)
def generate_statement(payload: StatementRequest) -> StatementResponse:
    paid_total = 0.0
    for row in payload.contributions:
        value = row.amount_paid if row.amount_paid is not None else row.amountPaid
        paid_total += float(value or 0)

    total_due = payload.monthlyAmount * payload.durationMonths
    pending = max(total_due - paid_total, 0)
    completion = min((paid_total / total_due) * 100, 100) if total_due > 0 else 0

    return StatementResponse(
      totalDue=round2(total_due),
      paidTotal=round2(paid_total),
      pendingAmount=round2(pending),
      completionPercent=round2(completion),
    )
