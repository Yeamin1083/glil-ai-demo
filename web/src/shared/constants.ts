// roles of the human steps in the ACPS flow; the users themselves come from /api/fixtures
export const ROLE = {
  HR_ADMIN: "HR_ADMIN",
  CLAIMS_OFFICER: "CLAIMS_OFFICER",
  POST_AUDITOR: "POST_AUDITOR",
} as const;
export type Role = (typeof ROLE)[keyof typeof ROLE];

export const ROLE_LABEL: Record<Role, string> = {
  HR_ADMIN: "Corporate HR",
  CLAIMS_OFFICER: "Claim Officer",
  POST_AUDITOR: "Final Approver",
};

export const STEP = {
  INTIMATION: 0,
  REVIEW: 1,
  PROCESS: 2,
  ORACLE: 3,
} as const;
export type Step = (typeof STEP)[keyof typeof STEP];

export const STEP_LABEL: Record<Step, string> = {
  0: "Upload",
  1: "Check Details",
  2: "Settle",
  3: "Done",
};

// the three AI processing subsystems, named for the claims job each one does
export const AGENT = {
  INTAKE: "Reading documents",
  ADJUDICATION: "Payout calculation",
  AUDIT: "Policy checks",
} as const;

// what each subsystem is doing, shown while it runs
export const EXTRACT_STEPS = [
  "Reading the documents",
  "Finding bills, receipts and prescriptions",
  "Finding the patient, doctor and dates",
  "Sorting bill lines by type",
  "Checking totals against the claimed amount",
];
export const REVIEW_STEPS = [
  "Checking each bill line",
  "Matching medicines to the prescription",
  "Applying plan limits and co-pay",
  "Checking dates, patient and past claims",
  "Checking what the plan covers",
  "Working out the payout",
  "Double-checking the settlement",
];

// ACPS lookup values (x_claim_* tables), same as ocr-extract
export const CLAIM_TYPES = ["GENERAL", "OPTICAL", "DENTAL"];
export const PHYSICIAN_TYPES = [
  "GENERAL PRACTITIONER",
  "SPECIALIST",
  "OPHTHALMOLOGIST",
  "BDS",
];
export const TREATMENT_TYPES = ["CONSERVATIVE", "SURGICAL"];

export const EXPENSE_CODES: Record<string, string[]> = {
  GENERAL: [
    "GENERAL_PRACTITIONER",
    "SPECIALIST_VISIT",
    "INVESTIGATION",
    "MEDICINE",
    "OTHERS",
  ],
  OPTICAL: [
    "CONSULTANCY",
    "INVESTIGATION",
    "MEDICINE",
    "SPECTACLES",
    "LASIK",
    "OTHERS",
  ],
  DENTAL: [
    "CONSULTANCY",
    "INVESTIGATION",
    "MEDICINE",
    "ROOT_CANAL",
    "SCALING",
    "CAPPING",
    "FILLING",
    "ROUTINE_EXTRACTION",
    "SURGICAL_EXTRACTION",
    "OTHERS",
  ],
};

// server audit check name, and how far claimed amounts may differ and still be the same claim
export const NAME_CHECK = "Patient name matches member";
export const AMOUNT_TOLERANCE_BDT = 50;

// the three settlement decisions, same values as the server's Status enum
export const STATUS = {
  SETTLED: "SETTLED",
  DOCUMENTS_REQUIRED: "DOCUMENTS REQUIRED",
  REGRETTED: "REGRETTED",
} as const;
export type Status = (typeof STATUS)[keyof typeof STATUS];

export const STATUS_LABEL: Record<Status, string> = {
  [STATUS.SETTLED]: "Settle",
  [STATUS.DOCUMENTS_REQUIRED]: "Ask for documents",
  [STATUS.REGRETTED]: "Regret",
};

export const TONE_TEXT: Record<"good" | "warn" | "bad", string> = {
  good: "text-emerald-700",
  warn: "text-amber-700",
  bad: "text-red-600",
};

export const STATUS_TONE: Record<Status, "good" | "warn" | "bad"> = {
  [STATUS.SETTLED]: "good",
  [STATUS.DOCUMENTS_REQUIRED]: "warn",
  [STATUS.REGRETTED]: "bad",
};

// ocr-extract and ACPS both use dd-mm-yyyy
export const DATE_PATTERN = /^\d{2}-\d{2}-\d{4}$/;

export const SETTLEMENT_OPTIONS = [
  { status: STATUS.SETTLED, label: STATUS_LABEL[STATUS.SETTLED] },
  {
    status: STATUS.DOCUMENTS_REQUIRED,
    label: STATUS_LABEL[STATUS.DOCUMENTS_REQUIRED],
  },
  { status: STATUS.REGRETTED, label: STATUS_LABEL[STATUS.REGRETTED] },
] as const;

// the two AI calls, named the same everywhere a result is shown
export const AI_CALL = {
  READ: "AI 1 · Read documents",
  SETTLE: "AI 2 · Settle & double-check",
} as const;
export type AiCall = (typeof AI_CALL)[keyof typeof AI_CALL];
