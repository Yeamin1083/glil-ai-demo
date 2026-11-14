export type Confidence = 'high' | 'medium' | 'low' | null

export interface Scored<T = string | number | null> {
  value: T
  confidence: Confidence
}

// ocr-extract ClaimExtractionData, the fields this demo uses
export interface Extraction {
  claim_category: Scored | null
  claim_type: Scored | null
  hospital_name: string | null
  patient_name: string | null
  claimed_amount: Scored | null
  dispatch_number: Scored | null
  dispatch_date: Scored | null
  treatment_date: Scored | null
  physician_name: Scored | null
  physician_type: Scored | null
  diagnosis: Scored | null
  treatment_type: Scored | null
  expense_breakdown: Record<string, Scored> | null
  bill_discount: Scored | null
  extraction_notes: string | null
  summary: string | null
}

export interface Plan {
  plan_id: number
  plan_name: string
  claim_type: string
  cycle_start: string
  cycle_end: string
  opd_limit: number
  opd_max_days_to_claim: number
  item_limits: Record<string, number>
  item_count_limits: Record<string, number>
}

// intimation creates the claim: a new number, plus what Agent 1 read
export interface Intimation {
  intimation_number: string
  extraction: Extraction
}

export interface Member {
  code: string
  name: string
  relation: string
  is_active: boolean
  plan: Plan
  limit_remaining: number
}

export interface OfficerDecision {
  status: Status
  rejection_reason: string | null
  required_documents: string | null
  claimed_amount: number
  payable_amount: number
  expenses: { category: string; claimed: number; deducted: number; payable: number; remarks: string | null }[]
  reviewed_by: string | null
  decided_by: string | null
}

// a real claim from ACPS_T: its member, submission date and what the officer decided
export interface Sample {
  intimation_number: string
  member_code: string
  reference_date: string
  officer_decision: OfficerDecision
}

export interface User {
  id: string
  name: string
  designation: string | null
  role: 'CLAIMS_OFFICER' | 'POST_AUDITOR'
}

export interface Fixtures {
  source: string
  samples: Sample[]
  members: Member[]
  users: User[]
}

export interface ExpenseIn {
  category: string
  claimed: number
}

export interface ClaimIn {
  member_code: string
  patient_name: string
  bill_discount: number
  claim_type: string
  treatment_date: string
  reference_date: string
  claimed_amount: number
  hospital_name: string
  physician_name: string
  physician_type: string
  diagnosis: string
  expenses: ExpenseIn[]
}

export type Status = 'SETTLED' | 'REGRETTED' | 'DOCUMENTS REQUIRED'

export interface ExpenseOut {
  category: string
  claimed: number
  deducted: number
  payable: number
  remarks: string[]
}

export interface AuditCheck {
  check: string
  passed: boolean
  detail: string
}

export interface Review {
  expenses: ExpenseOut[]
  checks: AuditCheck[]
  status: Status
  rejection_reason: string | null
  required_documents: string | null
  summary: string
  total_claimed: number
  total_payable: number
  limit_before: number
  limit_after: number
  single_step_approval: boolean
}

export type OracleRecord = Record<string, unknown>
