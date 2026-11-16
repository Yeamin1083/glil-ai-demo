from enum import StrEnum
from typing import Literal

from pydantic import BaseModel


class Status(StrEnum):
    SETTLED = "SETTLED"
    DOCUMENTS_REQUIRED = "DOCUMENTS REQUIRED"
    REGRETTED = "REGRETTED"


class ExpenseIn(BaseModel):
    category: str
    claimed: int
    deducted: int = 0  # what the claim officer already deducted
    remarks: str = ""


class ClaimIn(BaseModel):
    """The officer-reviewed intimation, sent with the documents to /review."""

    member_code: str
    patient_name: str = ""
    claim_type: str
    treatment_date: str  # dd-mm-yyyy, as ACPS
    reference_date: str  # submission date
    claimed_amount: int
    hospital_name: str = ""
    physician_name: str = ""
    physician_type: str = ""
    diagnosis: str = ""
    excess_amount: int = 0  # ACPS excess: claimed money that is not an item
    excess_remarks: str = ""  # ACPS excess remarks
    expenses: list[ExpenseIn]


# what the model returns
class LineJudgement(BaseModel):
    category: str
    deducted: int
    remark: str | None = None


class AuditCheck(BaseModel):
    check: str
    passed: bool
    detail: str


class ModelReview(BaseModel):
    lines: list[LineJudgement]
    checks: list[AuditCheck]
    status: Status
    rejection_reason: str | None = None
    required_documents: str | None = None
    summary: str


# what /review returns after the code rules
class ExpenseOut(BaseModel):
    category: str
    claimed: int
    deducted: int
    payable: int
    remarks: list[str]
    # ACPS process page "Limit - Consumed - Remaining", before this line was paid
    limit: int = 0
    consumed: int = 0
    remaining: int = 0
    count_limit: int | None = None
    count_used: int = 0


class Review(BaseModel):
    expenses: list[ExpenseOut]
    checks: list[AuditCheck]
    status: Status
    rejection_reason: str | None
    required_documents: str | None
    summary: str
    total_claimed: int
    total_payable: int
    limit_before: int
    limit_after: int
    single_step_approval: bool
    ai_status: Status  # the decision before the claim officer changed it
    decided_by_officer: bool = False
    officer_remarks: str = ""
    # kept so the officer can change the decision without another model call
    judgement: ModelReview | None = None


class AuditReview(BaseModel):
    """The model's double-check of its own settlement."""

    verdict: Literal["OK", "LOOK_AGAIN"]
    checks: list[AuditCheck]
    summary: str


class SettleResult(BaseModel):
    """What the one settle call returns: the settlement and the model's double-check of it."""

    settlement: ModelReview
    double_check: AuditReview


class SettleOut(BaseModel):
    review: Review
    double_check: AuditReview


class DecideIn(BaseModel):
    claim: ClaimIn
    judgement: ModelReview
    status: Status | None = None  # None keeps the AI's decision
    remarks: str = ""
