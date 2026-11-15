import copy

import pytest

from app import fixtures as fx
from app.rules import names_match, record_settlement, review
from app.schemas import ClaimIn, ExpenseIn, LineJudgement, ModelReview


@pytest.fixture(autouse=True)
def fresh_fixtures(monkeypatch):
    # always the fictional members, whether or not members.local.json exists
    members = copy.deepcopy(fx._FICTIONAL["members"])
    monkeypatch.setattr(fx, "MEMBERS", members)
    monkeypatch.setattr(fx, "HISTORY", {code: [] for code in members})


def claim(
    member: str,
    expenses: dict[str, int],
    treated="01-11-2026",
    submitted="10-11-2026",
    patient=None,
):
    return ClaimIn(
        member_code=member,
        patient_name=patient or fx.MEMBERS[member]["name"],
        claim_type="GENERAL",
        treatment_date=treated,
        reference_date=submitted,
        claimed_amount=sum(expenses.values()),
        expenses=[ExpenseIn(category=c, claimed=a) for c, a in expenses.items()],
    )


def settled(lines=()):
    return ModelReview(lines=list(lines), checks=[], status="SETTLED", summary="")


def test_model_deduction_then_settle():
    result = review(
        claim("DEMO-7049-0001", {"MEDICINE": 1500, "GENERAL_PRACTITIONER": 800}),
        settled(
            [
                LineJudgement(
                    category="MEDICINE", deducted=300, remark="Calcium cost not payable"
                )
            ]
        ),
    )
    assert result.status == "SETTLED"
    assert result.total_payable == 2000
    assert result.single_step_approval


def test_remaining_limit_caps_payable():
    # member 2 has 1,100 left of 50,000
    result = review(
        claim("DEMO-7049-0002", {"MEDICINE": 900, "INVESTIGATION": 900}), settled()
    )
    assert [e.payable for e in result.expenses] == [900, 200]
    assert result.expenses[1].remarks == [fx.REMARK_PARTIAL_LIMIT]
    assert result.limit_after == 0
    # limit, consumed, remaining per line, as the ACPS process page shows them
    first, second = result.expenses
    assert (first.limit, first.consumed, first.remaining) == (50_000, 48_900, 1_100)
    assert (second.limit, second.consumed, second.remaining) == (50_000, 49_800, 200)


def test_item_cap_shows_its_own_limit():
    # member 3: spectacles cap 2,500, already 2,500 used over 4 purchases
    result = review(claim("DEMO-7049-0003", {"SPECTACLES": 2000}), settled())
    spectacles = result.expenses[0]
    assert (spectacles.limit, spectacles.consumed, spectacles.remaining) == (
        2_500,
        2_500,
        0,
    )
    assert (spectacles.count_limit, spectacles.count_used) == (4, 4)


def test_spectacles_count_used_up_regrets_for_no_limit():
    # member 3 already had spectacles 4 times
    result = review(claim("DEMO-7049-0003", {"SPECTACLES": 2000}), settled())
    assert result.expenses[0].payable == 0
    assert (result.status, result.rejection_reason) == ("REGRETTED", fx.REASON_NO_LIMIT)


def test_late_submission_overrides_model():
    result = review(
        claim("DEMO-7049-0001", {"MEDICINE": 500}, treated="01-08-2026"), settled()
    )
    assert (result.status, result.rejection_reason) == ("REGRETTED", fx.REASON_LATE)
    assert result.total_payable == 0
    # lines agree with the total: nothing paid, the reason on each line
    line = result.expenses[0]
    assert (line.payable, line.deducted) == (0, 500)
    assert line.remarks[-1] == "Claim regretted: Late submission"


def test_resubmitted_claim_is_duplicate_and_limits_move():
    first = claim("DEMO-7049-0001", {"MEDICINE": 1000})
    record_settlement(first, review(first, settled()))
    assert fx.MEMBERS["DEMO-7049-0001"]["consumed"] == 9_450
    again = review(first, settled())
    assert (again.status, again.rejection_reason) == ("REGRETTED", fx.REASON_DUPLICATE)


def test_model_rejection_without_listed_reason_asks_for_documents():
    model = ModelReview(
        lines=[], checks=[], status="REGRETTED", rejection_reason="OTHERS", summary=""
    )
    result = review(claim("DEMO-7049-0001", {"MEDICINE": 500}), model)
    assert (result.status, result.rejection_reason) == ("DOCUMENTS REQUIRED", None)


def test_names_match_ignores_titles_and_initials():
    assert names_match("A.K.M. Nurul Huda", "Mr. AKM Nurul Huda")
    assert names_match("Nurul Huda", "Md. A.K.M. Nurul Huda")
    assert not names_match("Rahim Uddin", "Mr. AKM Nurul Huda")
    assert not names_match("Rahim Uddin", "")


def test_other_persons_documents_are_regretted_for_name_mismatch():
    result = review(
        claim("DEMO-7049-0001", {"MEDICINE": 500}, patient="Mr. AKM Nurul Huda"),
        settled(),
    )
    assert (result.status, result.rejection_reason) == (
        "REGRETTED",
        fx.REASON_NAME_MISMATCH,
    )


def test_summary_follows_the_final_decision_when_rules_override_the_model():
    first = claim("DEMO-7049-0001", {"MEDICINE": 1500})
    record_settlement(first, review(first, settled()))
    again = review(claim("DEMO-7049-0001", {"MEDICINE": 1500}), settled())
    assert again.status == "REGRETTED"
    assert "regretted" in again.summary
    assert "double" in again.summary.lower()


def test_dental_optical_cover_depends_on_the_plan_items():
    assert fx.covers_dental_optical({"item_limits": {"SPECTACLES": 3000}, "item_count_limits": {}})
    assert not fx.covers_dental_optical({"item_limits": {"MEDICINE": 100}, "item_count_limits": {}})
