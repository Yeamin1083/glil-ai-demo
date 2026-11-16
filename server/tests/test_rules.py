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
    assert names_match("MD. SHAHJAHAN SHEIKH", "Md. Shajahan Sheikh")  # one-letter spelling slip
    assert not names_match("Rahim Uddin", "Karim Uddin")
    assert names_match("Nurul Islam Chowdhury", "Nurul")  # prescription with only a first name
    assert not names_match("Nurul Islam Chowdhury", "Rahim")
    assert names_match("Nurul Islam Chowdhury", "Chowdhury Nurul")  # order swapped, middle name missing
    assert names_match("Mst. Rokeya Begum", "Rokeya")  # title on one side only


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


def test_claim_officer_can_change_the_decision_with_remarks():
    c = claim("DEMO-7049-0001", {"MEDICINE": 1500}, treated="01-01-2020")  # outside the plan period
    ai = review(c, settled())
    assert ai.status == "REGRETTED" and ai.total_payable == 0

    settle = review(c, settled(), "SETTLED", "Member showed the older cycle applies")
    assert settle.status == "SETTLED" and settle.total_payable == 1500
    assert settle.ai_status == "REGRETTED" and settle.decided_by_officer
    assert "older cycle" in settle.summary

    regret = review(claim("DEMO-7049-0001", {"MEDICINE": 1500}), settled(), "REGRETTED", "Not related to the illness")
    assert regret.total_payable == 0 and "Not related" in regret.expenses[0].remarks[0]


def test_decide_endpoint_changes_the_decision_without_a_model_call():
    from fastapi.testclient import TestClient

    from app.main import app

    c = claim("DEMO-7049-0001", {"MEDICINE": 1500})
    r = TestClient(app).post(
        "/api/decide",
        json={"claim": c.model_dump(), "judgement": settled().model_dump(), "status": "REGRETTED", "remarks": "Not related"},
    )
    body = r.json()
    assert r.status_code == 200
    assert body["status"] == "REGRETTED" and body["ai_status"] == "SETTLED" and body["total_payable"] == 0


def test_audit_endpoint_returns_the_second_calls_verdict(monkeypatch):
    from fastapi.testclient import TestClient

    from app import main
    from app.schemas import AuditReview

    async def fake_audit(claim, review, document, mime_type):
        assert review.decided_by_officer  # the officer's final decision is what gets audited
        return AuditReview(verdict="LOOK_AGAIN", checks=[], summary="Check the dates.")

    monkeypatch.setattr(main, "audit_claim", fake_audit)
    c = claim("DEMO-7049-0001", {"MEDICINE": 1500})
    final = review(c, settled(), "REGRETTED", "Not related")
    r = TestClient(main.app).post(
        "/api/audit",
        data={"claim": c.model_dump_json(), "review": final.model_dump_json()},
        files={"file": ("a.pdf", b"%PDF-1.4", "application/pdf")},
    )
    assert r.status_code == 200 and r.json()["verdict"] == "LOOK_AGAIN"


def test_extract_is_one_call_that_returns_the_extraction_and_the_settlement(monkeypatch):
    from fastapi.testclient import TestClient

    from app import main

    sent = {}
    reply = {
        "status": True,
        "data": {
            "patient_name": "Test",
            "extra": {"lines": [], "checks": [], "status": "SETTLED", "summary": "Fine."},
        },
    }

    class FakeResponse:
        status_code = 200

        def json(self):
            return reply

    class FakeClient:
        def __init__(self, **kw): ...
        async def __aenter__(self):
            return self
        async def __aexit__(self, *a): ...
        async def post(self, url, **kw):
            sent.update(kw)
            return FakeResponse()

    monkeypatch.setattr(main.httpx, "AsyncClient", FakeClient)
    member = next(iter(fx.MEMBERS))
    r = TestClient(main.app).post(
        "/api/extract", data={"member_code": member}, files={"file": ("a.pdf", b"%PDF-1.4", "application/pdf")}
    )
    body = r.json()
    assert r.status_code == 200
    assert body["judgement"]["status"] == "SETTLED" and "extra" not in body["extraction"]
    assert "plan_covers_dental_and_optical" in sent["data"]["extra_prompt"]  # the settlement rides on the same call


def test_decide_without_a_status_keeps_the_ai_decision():
    c = claim("DEMO-7049-0001", {"MEDICINE": 1500})
    result = review(c, settled())
    assert result.status == "SETTLED" and not result.decided_by_officer


def test_officer_deduction_replaces_the_ai_one_instead_of_adding_to_it():
    c = claim("DEMO-7049-0001", {"MEDICINE": 1500})
    c.expenses[0].deducted = 169
    ai = settled([LineJudgement(category="MEDICINE", deducted=300, remark="Calcium cost not payable")])
    result = review(c, ai)
    assert result.expenses[0].deducted == 169 and result.total_payable == 1331
