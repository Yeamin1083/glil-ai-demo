import type { ClaimIn, Confidence, Extraction, Scored } from './types'

export interface ExpenseRow {
  category: string
  claimed: string
  confidence: Confidence
}

export interface ClaimForm {
  member_code: string
  patient_name: string
  claim_type: string
  treatment_date: string
  reference_date: string
  dispatch_number: string
  dispatch_date: string
  claimed_amount: string
  hospital_name: string
  physician_name: string
  physician_type: string
  diagnosis: string
  treatment_type: string
  bill_discount: string
  expenses: ExpenseRow[]
}

export type FormField = Exclude<keyof ClaimForm, 'expenses'>

const text = (field: Scored | null | undefined) =>
  field?.value === null || field?.value === undefined ? '' : String(field.value)

export function todayDdMmYyyy(): string {
  const d = new Date()
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${pad(d.getDate())}-${pad(d.getMonth() + 1)}-${d.getFullYear()}`
}

// referenceDate: the real submission date when the claim is an ACPS sample
export function fromExtraction(ex: Extraction, memberCode: string, referenceDate?: string) {
  const form: ClaimForm = {
    member_code: memberCode,
    patient_name: ex.patient_name ?? '',
    claim_type: text(ex.claim_type) || 'GENERAL',
    treatment_date: text(ex.treatment_date),
    // paper claims are stamped on receipt, so the dispatch date is the closest submission date
    reference_date: referenceDate || text(ex.dispatch_date) || todayDdMmYyyy(),
    dispatch_number: text(ex.dispatch_number),
    dispatch_date: text(ex.dispatch_date),
    claimed_amount: text(ex.claimed_amount),
    hospital_name: ex.hospital_name ?? '',
    physician_name: text(ex.physician_name),
    physician_type: text(ex.physician_type),
    diagnosis: text(ex.diagnosis),
    treatment_type: text(ex.treatment_type) || 'CONSERVATIVE',
    bill_discount: text(ex.bill_discount),
    expenses: Object.entries(ex.expense_breakdown ?? {}).map(([category, amount]) => ({
      category,
      claimed: text(amount),
      confidence: amount.confidence,
    })),
  }
  const confidence: Partial<Record<FormField, Confidence>> = {
    claim_type: ex.claim_type?.confidence ?? null,
    treatment_date: ex.treatment_date?.confidence ?? null,
    dispatch_number: ex.dispatch_number?.confidence ?? null,
    dispatch_date: ex.dispatch_date?.confidence ?? null,
    claimed_amount: ex.claimed_amount?.confidence ?? null,
    physician_name: ex.physician_name?.confidence ?? null,
    physician_type: ex.physician_type?.confidence ?? null,
    diagnosis: ex.diagnosis?.confidence ?? null,
    treatment_type: ex.treatment_type?.confidence ?? null,
    bill_discount: ex.bill_discount?.confidence ?? null,
  }
  return { form, confidence }
}

const amount = (value: string) => Math.round(Number(value) || 0)

export const expenseTotal = (form: ClaimForm) =>
  form.expenses.reduce((sum, row) => sum + amount(row.claimed), 0)

export function toClaimIn(form: ClaimForm): ClaimIn {
  return {
    member_code: form.member_code,
    patient_name: form.patient_name,
    claim_type: form.claim_type,
    treatment_date: form.treatment_date,
    reference_date: form.reference_date,
    bill_discount: amount(form.bill_discount),
    claimed_amount: amount(form.claimed_amount),
    hospital_name: form.hospital_name,
    physician_name: form.physician_name,
    physician_type: form.physician_type,
    diagnosis: form.diagnosis,
    expenses: form.expenses
      .filter((row) => row.category && amount(row.claimed) > 0)
      .map((row) => ({ category: row.category, claimed: amount(row.claimed) })),
  }
}
