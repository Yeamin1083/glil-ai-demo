"""Deterministic half of processing and audit: limits, dates, duplicates.
Mirrors ACPS create_individual_expense_for_claim / claim_was_submitted_late /
check_duplicate_claims, cut down to OPD. Each member carries their own plan."""

import re
from datetime import date, datetime
from difflib import SequenceMatcher

from app import fixtures as fx
from app.schemas import AuditCheck, ClaimIn, ExpenseOut, ModelReview, Review, Status

DATE_FORMAT = "%d-%m-%Y"
NAME_SPELLING_MATCH = 0.85


def parse_date(value: str) -> date:
    return datetime.strptime(value, DATE_FORMAT).date()


_NAME_TITLES = {"MR", "MRS", "MS", "MISS", "MD", "MOST", "DR", "BABY", "SK", "SHEIKH"}


def _name_parts(name: str) -> set[str]:
    cleaned = re.sub(r"[^A-Z ]", "", name.upper().replace(".", " "))
    return {p for p in cleaned.split() if p not in _NAME_TITLES and len(p) > 1}


def _same_word(x: str, y: str) -> bool:
    # a one-letter spelling slip is the same name: Shajahan = Shahjahan
    return x == y or SequenceMatcher(None, x, y).ratio() >= NAME_SPELLING_MATCH


def names_match(member_name: str, patient_name: str) -> bool:
    """Same person if every full part of the shorter name is in the longer one;
    titles, initials, punctuation and small spelling slips are ignored
    ('Mr. A.K.M. Nurul Huda' = 'Nurul Huda')."""
    a, b = _name_parts(member_name), _name_parts(patient_name)
    if not a or not b:
        return False
    shorter, longer = sorted((a, b), key=len)
    return all(any(_same_word(s, w) for w in longer) for s in shorter)


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
    plan = member["plan"]
    remaining = max(plan["opd_limit"] - member["consumed"], 0)
    judged = {line.category: line for line in model.lines}
    out = []
    for expense in claim.expenses:
        line = judged.get(expense.category)
        ai_deducted = min(max(line.deducted, 0), expense.claimed) if line else 0
        # the AI proposed its deduction before the officer looked; when the officer enters one, theirs wins
        if expense.deducted:
            deducted, remarks = (
                min(expense.deducted, expense.claimed),
                [expense.remarks] if expense.remarks else [],
            )
        else:
            deducted, remarks = (
                ai_deducted,
                [line.remark] if line and line.remark and ai_deducted else [],
            )
        payable = expense.claimed - deducted
        used = member["items"].get(expense.category, {"amount": 0, "count": 0})
        max_count = plan["item_count_limits"].get(expense.category)
        cap = plan["item_limits"].get(expense.category)

        # ACPS "Limit - Consumed - Remaining": the item's own cap if it has one,
        # otherwise the OPD limit it shares with the other items
        if cap is not None:
            limit, consumed = cap, used["amount"]
            left = min(max(cap - used["amount"], 0), remaining)
        else:
            limit, consumed, left = (
                plan["opd_limit"],
                plan["opd_limit"] - remaining,
                remaining,
            )

        if max_count is not None and payable and used["count"] >= max_count:
            payable = 0
            remarks.append(
                fx.REMARK_COUNT_USED.format(item=expense.category, count=used["count"])
            )

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
                limit=limit,
                consumed=consumed,
                remaining=left,
                count_limit=max_count,
                count_used=used["count"],
            )
        )
    return out, remaining


def review(
    claim: ClaimIn,
    model: ModelReview,
    officer_status: Status | None = None,
    officer_remarks: str = "",
) -> Review:
    member = fx.MEMBERS[claim.member_code]
    plan = member["plan"]
    treated = parse_date(claim.treatment_date)
    days_late = (parse_date(claim.reference_date) - treated).days
    in_cycle = (
        parse_date(plan["cycle_start"]) <= treated <= parse_date(plan["cycle_end"])
    )
    on_time = days_late <= plan["opd_max_days_to_claim"]
    duplicate = is_duplicate(claim)
    same_person = names_match(member["name"], claim.patient_name)

    expenses, remaining = apply_limits(claim, model, member)
    total_payable = sum(e.payable for e in expenses)

    checks = [
        AuditCheck(
            check="Member active",
            passed=member["is_active"],
            detail=f"{claim.member_code} · {member['relation']} · plan {plan['plan_name']}",
        ),
        AuditCheck(
            check="Treatment date inside policy cycle",
            passed=in_cycle,
            detail=f"{plan['cycle_start']} to {plan['cycle_end']}",
        ),
        AuditCheck(
            check=f"Submitted within {plan['opd_max_days_to_claim']} days",
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
        AuditCheck(
            check="Patient name matches member",
            passed=same_person,
            detail=f"Documents: {claim.patient_name or 'no name found'} · Member: {member['name']}",
        ),
        *model.checks,
    ]

    status, reason = model.status, model.rejection_reason
    # a model rejection must name a listed reason; otherwise ask the member instead
    if status == Status.REGRETTED and reason not in fx.MODEL_REJECTION_REASONS:
        status = Status.DOCUMENTS_REQUIRED
    note = (
        None  # plain words for the regret remark when the ACPS reason is just "OTHERS"
    )
    if not member["is_active"]:
        status, reason, note = (
            Status.REGRETTED,
            fx.REASON_NOT_COVERED,
            "Member is not active",
        )
    elif duplicate:
        status, reason = Status.REGRETTED, fx.REASON_DUPLICATE
    elif not on_time:
        status, reason = Status.REGRETTED, fx.REASON_LATE
    elif not in_cycle:
        status, reason, note = (
            Status.REGRETTED,
            fx.REASON_NOT_COVERED,
            "Treatment date is outside the plan period",
        )
    elif not same_person:
        status, reason = Status.REGRETTED, fx.REASON_NAME_MISMATCH
    elif status != Status.REGRETTED and total_payable == 0:
        status, reason = Status.REGRETTED, fx.REASON_NO_LIMIT
    ai_status = status
    if officer_status:  # the claim officer has the final say, with their own remarks
        status, reason = officer_status, None
        if status == Status.REGRETTED:
            reason, note = fx.REASON_NOT_COVERED, officer_remarks or None
    if status != Status.REGRETTED:
        reason = None
    else:
        # nothing is paid on a regretted claim, so every line shows it, matching the total
        regret_remark = f"Claim regretted: {note or reason.capitalize()}"
        for e in expenses:
            e.payable, e.deducted, e.remarks = 0, e.claimed, [regret_remark]
        total_payable = 0

    # ACPS refuses DOCUMENTS REQUIRED without this text
    required_documents = None
    if status == Status.DOCUMENTS_REQUIRED:
        required_documents = (
            (officer_remarks if officer_status else None)
            or model.required_documents
            or "; ".join(c.detail for c in model.checks if not c.passed)
        )

    # the model wrote its summary before the rules above may have changed the decision
    summary = model.summary
    if status != model.status:
        summary = f"The plan rules changed the decision to {status.lower()}: {(note or reason or 'see the checks').lower()}."

    if officer_status:
        summary = f"The claim officer decided: {status.lower()}." + (
            f" {officer_remarks}" if officer_remarks else ""
        )

    limit_before = max(plan["opd_limit"] - member["consumed"], 0)
    return Review(
        expenses=expenses,
        checks=checks,
        status=status,
        rejection_reason=reason,
        required_documents=required_documents or None,
        summary=summary,
        total_claimed=sum(e.claimed for e in expenses),
        total_payable=total_payable,
        limit_before=limit_before,
        limit_after=remaining if status != Status.REGRETTED else limit_before,
        single_step_approval=status == Status.SETTLED
        and total_payable <= fx.SINGLE_STEP_APPROVAL_MAX,
        ai_status=ai_status,
        decided_by_officer=bool(officer_status),
        officer_remarks=officer_remarks if officer_status else "",
        judgement=model,
    )


def record_settlement(claim: ClaimIn, result: Review) -> None:
    """The 'Oracle' write: settled amounts count against the member's limits next time."""
    member = fx.MEMBERS[claim.member_code]
    fx.HISTORY[claim.member_code].append(
        {"treatment_date": claim.treatment_date, "claimed_amount": claim.claimed_amount}
    )
    if result.status != Status.SETTLED:
        return
    member["consumed"] += result.total_payable
    for expense in result.expenses:
        used = member["items"].setdefault(expense.category, {"amount": 0, "count": 0})
        used["amount"] += expense.payable
        used["count"] += 1 if expense.payable else 0
