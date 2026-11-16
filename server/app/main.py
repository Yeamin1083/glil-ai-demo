from datetime import datetime
from itertools import count
from typing import Annotated

import httpx
from fastapi import FastAPI, Form, HTTPException, UploadFile
from pydantic import BaseModel, ValidationError

from app import fixtures as fx
from app.config import settings
from app.gemini import ReviewFailed, audit_claim, settle_prompt
from app.rules import record_settlement, review
from app.schemas import AuditReview, ClaimIn, DecideIn, ModelReview, Review, Status

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
async def extract(file: UploadFile, member_code: Annotated[str, Form()]):
    """AI call 1: ocr-extract reads the claim and, in the same call, proposes the settlement."""
    if member_code not in fx.MEMBERS:
        raise HTTPException(422, "Unknown member.")
    async with httpx.AsyncClient(timeout=120) as client:
        try:
            response = await client.post(
                f"{settings.OCR_EXTRACT_URL}/api/v1/claims/extract",
                headers={"X-API-Key": settings.OCR_EXTRACT_API_KEY},
                data={"extra_prompt": settle_prompt(member_code)},
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
    extraction = body["data"]
    try:
        judgement = ModelReview.model_validate(extraction.pop("extra", None))
    except ValidationError:
        raise HTTPException(502, "The AI did not return a settlement, retry.")
    # intimation creates the claim, so it gets its number here
    return {
        "intimation_number": f"GH26-DEMO-{next(_intimation_seq):04d}",
        "extraction": extraction,
        "judgement": judgement,
    }


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
    post_auditor: str


@app.post("/api/audit", response_model=AuditReview)
async def audit_endpoint(
    file: UploadFile, claim: Annotated[str, Form()], review: Annotated[str, Form()]
):
    """The second AI call: double-checks the officer's final decision before it is saved."""
    try:
        return await audit_claim(
            ClaimIn.model_validate_json(claim),
            Review.model_validate_json(review),
            await file.read(),
            file.content_type or "application/pdf",
        )
    except ReviewFailed as e:
        raise HTTPException(502, str(e))


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
        "post_audited_by": body.post_auditor,
        "settled_at": datetime.now().isoformat(timespec="seconds"),
        "expenses": [e.model_dump() for e in body.review.expenses],
    }
