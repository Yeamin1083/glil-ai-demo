// roles of the human steps in the ACPS flow; the users themselves come from /api/fixtures
export const ROLE = {
  CLAIMS_OFFICER: 'CLAIMS_OFFICER',
  POST_AUDITOR: 'POST_AUDITOR',
} as const
export type Role = (typeof ROLE)[keyof typeof ROLE]

export const ROLE_LABEL: Record<Role, string> = {
  CLAIMS_OFFICER: 'Claims Officer',
  POST_AUDITOR: 'Post-audit',
}

export const STEP = {
  INTIMATION: 0,
  REVIEW: 1,
  PROCESS: 2,
  ORACLE: 3,
} as const
export type Step = (typeof STEP)[keyof typeof STEP]

export const STEP_LABEL: Record<Step, string> = {
  0: 'Intimation',
  1: 'Human review',
  2: 'Adjudication & audit',
  3: 'Oracle',
}

// the three AI agents, named for the claims job each one does
export const AGENT = {
  INTAKE: 'Intake agent',
  ADJUDICATION: 'Adjudication agent',
  AUDIT: 'Audit agent',
} as const

// what each agent is doing, shown while it runs
export const EXTRACT_STEPS = [
  'Reading the documents',
  'Finding bills, money receipts and prescriptions',
  'Reading patient, physician and treatment dates',
  'Mapping bill lines to plan expense types',
  'Reconciling totals with the claimed amount',
]
export const REVIEW_STEPS = [
  'Adjudication: checking each line against receipts',
  'Adjudication: checking medicines against the prescription',
  'Adjudication: applying plan limits',
  'Audit: checking dates, names and claim history',
  'Audit: checking coverage exclusions',
  'Writing the recommendation',
]

// ACPS lookup values (x_claim_* tables), same as ocr-extract
export const CLAIM_TYPES = ['GENERAL', 'OPTICAL', 'DENTAL']
export const PHYSICIAN_TYPES = ['GENERAL PRACTITIONER', 'SPECIALIST', 'OPHTHALMOLOGIST', 'BDS']
export const TREATMENT_TYPES = ['CONSERVATIVE', 'SURGICAL']

export const EXPENSE_CODES: Record<string, string[]> = {
  GENERAL: ['GENERAL_PRACTITIONER', 'SPECIALIST_VISIT', 'INVESTIGATION', 'MEDICINE', 'OTHERS'],
  OPTICAL: ['CONSULTANCY', 'INVESTIGATION', 'MEDICINE', 'SPECTACLES', 'LASIK', 'OTHERS'],
  DENTAL: [
    'CONSULTANCY', 'INVESTIGATION', 'MEDICINE', 'ROOT_CANAL', 'SCALING', 'CAPPING',
    'FILLING', 'ROUTINE_EXTRACTION', 'SURGICAL_EXTRACTION', 'OTHERS',
  ],
}

// server audit check name, and how far claimed amounts may differ and still be the same claim
export const NAME_CHECK = 'Patient name matches member'
export const AMOUNT_TOLERANCE_BDT = 50

export const STATUS_LABEL: Record<string, string> = {
  SETTLED: 'Settle',
  'DOCUMENTS REQUIRED': 'Ask for documents',
  REGRETTED: 'Regret',
}

export const TONE_TEXT: Record<'good' | 'warn' | 'bad', string> = {
  good: 'text-emerald-700',
  warn: 'text-amber-700',
  bad: 'text-red-600',
}

export const STATUS_TONE: Record<string, 'good' | 'warn' | 'bad'> = {
  SETTLED: 'good',
  'DOCUMENTS REQUIRED': 'warn',
  REGRETTED: 'bad',
}

// ocr-extract and ACPS both use dd-mm-yyyy
export const DATE_PATTERN = /^\d{2}-\d{2}-\d{4}$/
