from typing import Literal

from pydantic import BaseModel

Status = Literal["SETTLED", "REGRETTED", "DOCUMENTS REQUIRED"]


class ExpenseIn(BaseModel):
    category: str
    claimed: int


class ClaimIn(BaseModel):
    """The officer-reviewed intimation, sent with the documents to /review."""

    member_code: str
    # demo members are fictional, so the insured name is the patient on the documents
    patient_name: str = ""
    claim_type: str
    treatment_date: str  # dd-mm-yyyy, as ACPS
    reference_date: str  # submission date
    claimed_amount: int
    hospital_name: str = ""
    physician_name: str = ""
    physician_type: str = ""
    diagnosis: str = ""
    # bill-level discount from agent 1; categories stay gross and agent 2 deducts it
    bill_discount: int = 0
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
