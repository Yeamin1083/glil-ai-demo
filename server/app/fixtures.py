"""Hardcoded stand-ins for ACPS data. Plan values copied from ACPS_T plan_id 59
(org 7049, plan B), the busiest pilot-sized OPD plan. Members are fictional."""

from datetime import date

PLAN = {
    "plan_id": 59,
    "organization_code": "7049",
    "plan_name": "B",
    # real cycle 3218 is 2024-12-01..2025-11-30; shifted a year so today's documents fall inside
    "cycle_start": date(2025, 12, 1),
    "cycle_end": date(2026, 11, 30),
    "opd_limit": 50_000,
    "coinsurance_pct": 0,
    "opd_max_days_to_claim": 60,
}

# x_plan_features limits below the OPD GENERAL 50k (other items share the 50k)
ITEM_LIMITS = {"SPECTACLES": 2_500, "PHYSIOTHERAPY": 10_000}
# x_plan_controls EXPENSE_COUNT, per cycle
ITEM_COUNT_LIMITS = {"SPECTACLES": 4, "SCALING": 1, "ROOT_CANAL": 3}

# OPD payable at or under this can be approved in one step (ACPS process view)
SINGLE_STEP_APPROVAL_MAX = 3_000

MEMBERS = {
    "DEMO-7049-0001": {
        "name": "Rahim Uddin",
        "relation": "SELF",
        "consumed": 8_450,
        "items": {"MEDICINE": {"amount": 5_200, "count": 4}},
    },
    "DEMO-7049-0002": {
        "name": "Nasrin Akter",
        "relation": "SPOUSE",
        "consumed": 48_900,
        "items": {"MEDICINE": {"amount": 31_000, "count": 18}},
    },
    "DEMO-7049-0003": {
        "name": "Tanvir Hasan",
        "relation": "SELF",
        "consumed": 21_300,
        "items": {"SPECTACLES": {"amount": 2_500, "count": 4}},
    },
}

# settled claims per member; /approve appends here, so re-submitting a claim shows the duplicate check
HISTORY: dict[str, list[dict]] = {code: [] for code in MEMBERS}

STATUSES = ("SETTLED", "REGRETTED", "DOCUMENTS REQUIRED")

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

# the model picks only from these: cleaned from x_expense_remarks and top officer remarks
MODEL_REMARKS = (
    "No proper money receipt",
    "Amount does not have itemized proper money receipt",
    "Medicine calculated based on prescription schedule by physician",
    "Continuous prescribed medicine payable up to 3 months at a time",
    "Vitamins & dietary supplements not payable",
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
    "NAME MISMATCH",
    "SELF ADVISED INVESTIGATION NOT PAYABLE",
    "BEAUTIFICATION TREATMENT COST NOT PAYABLE",
    "TREATMENT OF INFERTILITY/SUBFERTILITY NOT COVERED",
    "FAMILY PLANNING TREATMENT COST NOT COVERED",
    "VACCINATION NOT COVERED",
    "PSYCHIATRIC DISORDER/ANXIETY TREATMENT COST NOT COVERED",
    "CONGENITAL ANOMALY TREATMENT COST NOT PAYABLE",
)
