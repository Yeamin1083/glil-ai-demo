from datetime import datetime
from itertools import count
from typing import Annotated

import httpx
from fastapi import FastAPI, Form, HTTPException, UploadFile
from pydantic import BaseModel

from app import fixtures as fx
from app.config import settings
from app.gemini import ReviewFailed, settle_and_check
from app.rules import record_settlement, review
from app.schemas import ClaimIn, DecideIn, Review, SettleOut, Status

app = FastAPI(title="GLIL AI claims demo")

_intimation_seq = count(1)


@app.get("/api/fixtures")
def fixtures():
    members = [
        {
            "code": code,
            "name": m["name"],
            "relation": m["relation"],
            "is_active": m["is_active"],
            "plan": m["plan"],
            "limit_remaining": max(m["plan"]["opd_limit"] - m["consumed"], 0),
            # what each expense type has used this cycle, for the review screen's limit columns
            "items": m["items"],
        }
        for code, m in fx.MEMBERS.items()
    ]
    return {
        "source": fx.SOURCE,
        "samples": fx.SAMPLES,
        "members": members,
        "users": fx.USERS,
    }


@app.post("/api/extract")
async def extract(file: UploadFile):
    """AI call 1: the real ocr-extract service, unchanged."""
    async with httpx.AsyncClient(timeout=120) as client:
        try:
            response = await client.post(
                f"{settings.OCR_EXTRACT_URL}/api/v1/claims/extract",
                headers={"X-API-Key": settings.OCR_EXTRACT_API_KEY},
                files={"file": (file.filename, await file.read(), file.content_type)},
            )
        except httpx.HTTPError as e:
            raise HTTPException(
                502, f"ocr-extract is not reachable at {settings.OCR_EXTRACT_URL}: {e}"
            )
    body = response.json()
    if not body.get("status"):
        raise HTTPException(
            response.status_code, body.get("message") or "Extraction failed."
        )
    # intimation creates the claim, so it gets its number here
    return {
        "intimation_number": f"GH26-DEMO-{next(_intimation_seq):04d}",
        "extraction": body["data"],
    }


@app.post("/api/settle", response_model=SettleOut)
async def settle(file: UploadFile, claim: Annotated[str, Form()]):
    """AI call 2: settles the officer-checked claim and double-checks it; the plan rules run in code."""
    parsed = ClaimIn.model_validate_json(claim)
    if parsed.member_code not in fx.MEMBERS:
        raise HTTPException(422, "Unknown member.")
    try:
        result = await settle_and_check(
            parsed, await file.read(), file.content_type or "application/pdf"
        )
    except ReviewFailed as e:
        raise HTTPException(502, str(e))
    for c in result.settlement.checks:
        c.check = fx.canonical_check(c.check, fx.SETTLE_CHECKS)
    for c in result.double_check.checks:
        c.check = fx.canonical_check(c.check, fx.DOUBLE_CHECKS)
    return SettleOut(
        review=review(parsed, result.settlement), double_check=result.double_check
    )


@app.post("/api/decide", response_model=Review)
def decide(body: DecideIn):
    """Applies the plan rules to the settlement, with the claim officer's own decision and remarks if they changed it. No model call."""
    if body.claim.member_code not in fx.MEMBERS:
        raise HTTPException(422, "Unknown member.")
    return review(body.claim, body.judgement, body.status, body.remarks)


class ApproveIn(BaseModel):
    intimation_number: str
    claim: ClaimIn
    review: Review
    review_officer: str
    audit_override_remarks: str = (
        ""  # why the officer saved although the double-check said look again
    )


@app.post("/api/approve")
def approve(body: ApproveIn):
    """Post-audit sign-off; stands in for the Oracle write."""
    record_settlement(body.claim, body.review)
    return {
        "intimation_number": body.intimation_number,
        "member_code": body.claim.member_code,
        "claim_status": body.review.status,
        "rejection_reason": body.review.rejection_reason,
        "required_documents": body.review.required_documents,
        "excess_remarks": body.claim.excess_remarks,
        "claimed_amount": body.review.total_claimed,
        "payable_amount": body.review.total_payable,
        "approval_status": (
            "APPROVED"
            if body.review.single_step_approval
            else "DOCTOR APPROVAL PENDING"
            if body.review.status == Status.SETTLED
            else None
        ),
        "reviewed_by": body.review_officer,
        "audit_override_remarks": body.audit_override_remarks,
        "settled_at": datetime.now().isoformat(timespec="seconds"),
        "expenses": [e.model_dump() for e in body.review.expenses],
    }
