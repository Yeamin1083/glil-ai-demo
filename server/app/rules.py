"""Deterministic half of processing and audit: limits, dates, duplicates.
Mirrors ACPS create_individual_expense_for_claim / claim_was_submitted_late /
check_duplicate_claims, cut down to one OPD plan."""

from datetime import date, datetime

from app import fixtures as fx
from app.schemas import AuditCheck, ClaimIn, ExpenseOut, ModelReview, Review

DATE_FORMAT = "%d-%m-%Y"


def parse_date(value: str) -> date:
    return datetime.strptime(value, DATE_FORMAT).date()


def is_duplicate(claim: ClaimIn) -> bool:
    for past in fx.HISTORY[claim.member_code]:
        if (
            past["treatment_date"] == claim.treatment_date
            and past["claimed_amount"] == claim.claimed_amount
        ):
            return True
    return False


def apply_limits(
    claim: ClaimIn, model: ModelReview, member: dict
) -> tuple[list[ExpenseOut], int]:
    remaining = max(fx.PLAN["opd_limit"] - member["consumed"], 0)
    judged = {line.category: line for line in model.lines}
    out = []
    for expense in claim.expenses:
        line = judged.get(expense.category)
        deducted = min(max(line.deducted, 0), expense.claimed) if line else 0
        remarks = [line.remark] if line and line.remark and deducted else []
        payable = expense.claimed - deducted
        used = member["items"].get(expense.category, {"amount": 0, "count": 0})

        max_count = fx.ITEM_COUNT_LIMITS.get(expense.category)
        if max_count is not None and payable and used["count"] >= max_count:
            payable = 0
            remarks.append(
                fx.REMARK_COUNT_USED.format(item=expense.category, count=used["count"])
            )

        cap = fx.ITEM_LIMITS.get(expense.category)
        if cap is not None and payable > max(cap - used["amount"], 0):
            payable = max(cap - used["amount"], 0)
            remarks.append(
                fx.REMARK_ITEM_CAP.format(
                    cap=cap, item=expense.category, used=used["amount"]
                )
            )

        if payable > remaining:
            payable = remaining
            remarks.append(fx.REMARK_PARTIAL_LIMIT if remaining else fx.REMARK_NO_LIMIT)
        remaining -= payable

        out.append(
            ExpenseOut(
                category=expense.category,
                claimed=expense.claimed,
                deducted=expense.claimed - payable,
                payable=payable,
                remarks=remarks,
            )
        )
    return out, remaining


def review(claim: ClaimIn, model: ModelReview) -> Review:
    member = fx.MEMBERS[claim.member_code]
    treated = parse_date(claim.treatment_date)
    days_late = (parse_date(claim.reference_date) - treated).days
    in_cycle = fx.PLAN["cycle_start"] <= treated <= fx.PLAN["cycle_end"]
    on_time = days_late <= fx.PLAN["opd_max_days_to_claim"]
    duplicate = is_duplicate(claim)

    expenses, remaining = apply_limits(claim, model, member)
    total_payable = sum(e.payable for e in expenses)

    checks = [
        AuditCheck(
            check="Treatment date inside policy cycle",
            passed=in_cycle,
            detail=f"{fx.PLAN['cycle_start']:%d-%m-%Y} to {fx.PLAN['cycle_end']:%d-%m-%Y}",
        ),
        AuditCheck(
            check=f"Submitted within {fx.PLAN['opd_max_days_to_claim']} days",
            passed=on_time,
            detail=f"Submitted {days_late} days after treatment",
        ),
        AuditCheck(
            check="Not a duplicate claim",
            passed=not duplicate,
            detail="Same treatment date and amount already settled"
            if duplicate
            else "No match in claim history",
        ),
        *model.checks,
    ]

    status, reason = model.status, model.rejection_reason
    # a model rejection must name a listed reason; otherwise ask the member instead
    if status == "REGRETTED" and reason not in fx.MODEL_REJECTION_REASONS:
        status = "DOCUMENTS REQUIRED"
    if duplicate:
        status, reason = "REGRETTED", fx.REASON_DUPLICATE
    elif not on_time:
        status, reason = "REGRETTED", fx.REASON_LATE
    elif not in_cycle:
        status, reason = "REGRETTED", "OTHERS"
    elif status != "REGRETTED" and total_payable == 0:
        status, reason = "REGRETTED", fx.REASON_NO_LIMIT
    if status != "REGRETTED":
        reason = None

    # ACPS refuses DOCUMENTS REQUIRED without this text
    required_documents = None
    if status == "DOCUMENTS REQUIRED":
        required_documents = model.required_documents or "; ".join(
            c.detail for c in model.checks if not c.passed
        )

    limit_before = max(fx.PLAN["opd_limit"] - member["consumed"], 0)
    return Review(
        expenses=expenses,
        checks=checks,
        status=status,
        rejection_reason=reason,
        required_documents=required_documents or None,
        summary=model.summary,
        total_claimed=sum(e.claimed for e in expenses),
        total_payable=total_payable if status != "REGRETTED" else 0,
        limit_before=limit_before,
        limit_after=remaining if status != "REGRETTED" else limit_before,
        single_step_approval=status == "SETTLED"
        and total_payable <= fx.SINGLE_STEP_APPROVAL_MAX,
    )


def record_settlement(claim: ClaimIn, result: Review) -> None:
    """The 'Oracle' write: settled amounts count against the member's limits next time."""
    member = fx.MEMBERS[claim.member_code]
    fx.HISTORY[claim.member_code].append(
        {"treatment_date": claim.treatment_date, "claimed_amount": claim.claimed_amount}
    )
    if result.status != "SETTLED":
        return
    member["consumed"] += result.total_payable
    for expense in result.expenses:
        used = member["items"].setdefault(expense.category, {"amount": 0, "count": 0})
        used["amount"] += expense.payable
        used["count"] += 1 if expense.payable else 0
