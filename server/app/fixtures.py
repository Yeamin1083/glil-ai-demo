"""Stand-ins for ACPS data. Real samples come from members.local.json, exported
read-only from ACPS_T and gitignored because it holds real member and staff names.
Without it, three fictional members on ACPS_T plan_id 59 are used."""

import json
from pathlib import Path

LOCAL_DATA = Path(__file__).resolve().parent.parent / "members.local.json"

# OPD payable at or under this can be approved in one step (ACPS process view)
SINGLE_STEP_APPROVAL_MAX = 3_000

# ACPS_T plan_id 59 (org 7049, plan B); cycle shifted a year so current documents fall inside
_PLAN_59 = {
    "plan_id": 59,
    "plan_name": "B",
    "claim_type": "GENERAL",
    "cycle_start": "01-12-2025",
    "cycle_end": "30-11-2026",
    "opd_limit": 50_000,
    "coinsurance_pct": 0,
    "opd_max_days_to_claim": 60,
    "item_limits": {"SPECTACLES": 2_500, "PHYSIOTHERAPY": 10_000},
    "item_count_limits": {"SPECTACLES": 4, "SCALING": 1, "ROOT_CANAL": 3},
}

_FICTIONAL = {
    "samples": [],
    "members": {
        "DEMO-7049-0001": {
            "name": "Rahim Uddin",
            "relation": "SELF",
            "is_active": True,
            "plan": _PLAN_59,
            "consumed": 8_450,
            "items": {"MEDICINE": {"amount": 5_200, "count": 4}},
            "history": [],
        },
        "DEMO-7049-0002": {
            "name": "Nasrin Akter",
            "relation": "SPOUSE",
            "is_active": True,
            "plan": _PLAN_59,
            "consumed": 48_900,
            "items": {"MEDICINE": {"amount": 31_000, "count": 18}},
            "history": [],
        },
        "DEMO-7049-0003": {
            "name": "Tanvir Hasan",
            "relation": "SELF",
            "is_active": True,
            "plan": _PLAN_59,
            "consumed": 21_300,
            "items": {"SPECTACLES": {"amount": 2_500, "count": 4}},
            "history": [],
        },
    },
    "users": [
        {
            "id": "hr1",
            "name": "Sadia Rahman",
            "designation": "HR Manager",
            "role": "HR_ADMIN",
        },
        {
            "id": "o1",
            "name": "Farhana Islam",
            "designation": "Claim Officer",
            "role": "CLAIMS_OFFICER",
        },
        {
            "id": "o2",
            "name": "Arif Hossain",
            "designation": "Claim Officer",
            "role": "CLAIMS_OFFICER",
        },
        {
            "id": "o3",
            "name": "Imran Chowdhury",
            "designation": "Claim Analyst",
            "role": "POST_AUDITOR",
        },
    ],
}

_data = json.loads(LOCAL_DATA.read_text()) if LOCAL_DATA.exists() else _FICTIONAL
SOURCE = _data.get("source", "fictional")
SAMPLES: list[dict] = _data["samples"]
MEMBERS: dict[str, dict] = _data["members"]
USERS: list[dict] = _data["users"]
# claims per member before the demo; /approve appends, so re-submitting shows the duplicate check
HISTORY: dict[str, list[dict]] = {code: m["history"] for code, m in MEMBERS.items()}

# code-decided outcomes, phrased the way officers write them in x_claim_expenses_gh
REMARK_NO_LIMIT = "No limit available"
REMARK_PARTIAL_LIMIT = "As per remaining limit."
REMARK_ITEM_CAP = (
    "Max. BDT {cap} payable for {item} per cycle, earlier paid BDT {used}."
)
REMARK_COUNT_USED = "{item} already availed {count} times this cycle, the plan maximum."

REASON_LATE = "LATE SUBMISSION"
REASON_DUPLICATE = "DOUBLE/WRONGLY CLAIM"
REASON_NO_LIMIT = "NO LIMIT AVAILABLE"
REASON_NAME_MISMATCH = "NAME MISMATCH"
REASON_NOT_COVERED = "OTHERS"

# the model picks only from these: cleaned from x_expense_remarks and top officer remarks
MODEL_REMARKS = (
    "No proper money receipt",
    "Amount does not have itemized proper money receipt",
    "Medicine calculated based on prescription schedule by physician",
    "Continuous prescribed medicine payable up to 3 months at a time",
    "Medicine without physician's advice not payable",
    "Vitamins, dietary supplements & probiotics not payable",
    "Calcium cost not payable",
    "Non-medicated items not payable",
    "Without doctor's advice investigation fee not payable",
    "Irrelevant test cost not payable",
    "Home sample collection cost not payable",
    "Discount amount is not payable",
    "Consultation fee of non-registered physician not payable",
    "Sunglass cost not payable",
)

# top OPD rejection reasons on ACPS_T a model can judge from documents
MODEL_REJECTION_REASONS = (
    "UNABLE TO PROVIDE SUPPORTING DOCUMENTS",
    "UNABLE TO PROVIDE PROPER MONEY RECEIPT",
    "NON-REGISTERED PHYSICIAN TREATMENT NOT COVERED",
    "SELF ADVISED INVESTIGATION NOT PAYABLE",
    "BEAUTIFICATION TREATMENT COST NOT PAYABLE",
    "TREATMENT OF INFERTILITY/SUBFERTILITY NOT COVERED",
    "FAMILY PLANNING TREATMENT COST NOT COVERED",
    "VACCINATION NOT COVERED",
    "PSYCHIATRIC DISORDER/ANXIETY TREATMENT COST NOT COVERED",
    "CONGENITAL ANOMALY TREATMENT COST NOT PAYABLE",
    "DIETICIAN TREATMENT IS NOT COVERED",
    "DENTAL & OPTICAL TREATMENT NOT COVERED",
)

# a plan covers dental and optical treatment only if it lists one of these items
DENTAL_OPTICAL_ITEMS = ("SPECTACLES", "ROOT_CANAL", "SCALING", "FILLING", "CAPPING", "SURGICAL_EXTRACTION")


def covers_dental_optical(plan: dict) -> bool:
    return any(item in plan["item_limits"] or item in plan["item_count_limits"] for item in DENTAL_OPTICAL_ITEMS)

