import { useEffect, useMemo, useState } from 'react'
import {
  CLAIM_TYPES,
  DATE_PATTERN,
  EXPENSE_CODES,
  PHYSICIAN_TYPES,
  TREATMENT_TYPES,
} from '../../../shared/constants'
import { bdt, humanize } from '../../../shared/format'
import { expenseTotal, type ClaimForm, type FormField } from '../form'
import type { Confidence, Extraction, Member } from '../types'

interface Props {
  file: File
  extraction: Extraction
  member: Member
  form: ClaimForm
  confidence: Partial<Record<FormField, Confidence>>
  canSubmit: boolean
  busy: boolean
  onChange: (form: ClaimForm) => void
  onSubmit: () => void
}

function ConfidenceDot({ level }: { level: Confidence | undefined }) {
  if (!level) return null
  return <span className={`conf conf-${level}`} title={`AI confidence: ${level}`}>{level}</span>
}

export function ReviewStep(props: Props) {
  const { file, extraction, member, form, confidence, canSubmit, busy, onChange, onSubmit } = props
  const previewUrl = useMemo(() => URL.createObjectURL(file), [file])
  useEffect(() => () => URL.revokeObjectURL(previewUrl), [previewUrl])
  const [showDoc, setShowDoc] = useState(true)

  const set = (field: FormField, value: string) => onChange({ ...form, [field]: value })
  const setExpense = (i: number, patch: Partial<ClaimForm['expenses'][number]>) =>
    onChange({
      ...form,
      expenses: form.expenses.map((row, j) => (j === i ? { ...row, ...patch, confidence: null } : row)),
    })

  const total = expenseTotal(form)
  const claimed = Math.round(Number(form.claimed_amount) || 0)
  const badDates = (['treatment_date', 'reference_date'] as const).filter(
    (f) => !DATE_PATTERN.test(form[f]),
  )
  const codes = EXPENSE_CODES[form.claim_type] ?? EXPENSE_CODES.GENERAL

  const input = (field: FormField, label: string, opts: { options?: string[]; hint?: string } = {}) => (
    <label className={`field${confidence[field] === 'low' ? ' low' : ''}`}>
      <span>
        {label} <ConfidenceDot level={confidence[field]} />
      </span>
      {opts.options ? (
        <select value={form[field]} onChange={(e) => set(field, e.target.value)}>
          <option value="">---------</option>
          {opts.options.map((o) => (
            <option key={o}>{o}</option>
          ))}
        </select>
      ) : (
        <input value={form[field]} placeholder={opts.hint} onChange={(e) => set(field, e.target.value)} />
      )}
    </label>
  )

  return (
    <div className={`review${showDoc ? '' : ' no-doc'}`}>
      {showDoc && (
        <aside className="card doc">
          <div className="doc-head">
            <strong>{file.name}</strong>
            <button className="ghost" onClick={() => setShowDoc(false)}>Hide</button>
          </div>
          {file.type === 'application/pdf' ? (
            <iframe src={previewUrl} title="Claim documents" />
          ) : (
            <img src={previewUrl} alt="Claim documents" />
          )}
        </aside>
      )}

      <section className="card">
        <div className="row-between">
          <h2>Edit an intimated group health claim</h2>
          {!showDoc && <button className="ghost" onClick={() => setShowDoc(true)}>Show document</button>}
        </div>
        {extraction.summary && <p className="ai-note">🤖 {extraction.summary}</p>}

        <h3>Claim</h3>
        <div className="grid">
          <label className="field">
            <span>Member code</span>
            <input value={`${member.code} · ${member.relation}`} disabled />
          </label>
          {input('patient_name', 'Patient name')}
          {input('claim_type', 'Claim type', { options: CLAIM_TYPES })}
          {input('treatment_date', 'Admission / Treatment Date', { hint: 'dd-mm-yyyy' })}
          {input('reference_date', 'Reference Date', { hint: 'dd-mm-yyyy' })}
          {input('dispatch_number', 'Dispatch No.')}
          {input('dispatch_date', 'Dispatch Date', { hint: 'dd-mm-yyyy' })}
          {input('claimed_amount', 'Claimed Amount')}
          {input('bill_discount', 'Bill discount (gross amounts)')}
        </div>

        <h3>Treatment</h3>
        <div className="grid">
          {input('hospital_name', 'Hospital Name')}
          {input('physician_name', 'Physician name')}
          {input('physician_type', 'Physician type', { options: PHYSICIAN_TYPES })}
          {input('diagnosis', 'Diagnosis')}
          {input('treatment_type', 'Treatment type', { options: TREATMENT_TYPES })}
        </div>

        <h3>Expenses</h3>
        <table className="table">
          <thead>
            <tr>
              <th>Expense</th>
              <th className="num">Claimed</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {form.expenses.map((row, i) => (
              <tr key={i} className={row.confidence === 'low' ? 'low' : ''}>
                <td>
                  <select value={row.category} onChange={(e) => setExpense(i, { category: e.target.value })}>
                    {[...new Set([row.category, ...codes])].map((c) => (
                      <option key={c} value={c}>{humanize(c)}</option>
                    ))}
                  </select>
                </td>
                <td className="num">
                  <input
                    className="num"
                    value={row.claimed}
                    onChange={(e) => setExpense(i, { claimed: e.target.value })}
                  />
                </td>
                <td>
                  <ConfidenceDot level={row.confidence} />
                  <button
                    className="ghost"
                    aria-label="Remove expense"
                    onClick={() => onChange({ ...form, expenses: form.expenses.filter((_, j) => j !== i) })}
                  >
                    ✕
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr>
              <td>
                <button
                  className="ghost"
                  onClick={() =>
                    onChange({ ...form, expenses: [...form.expenses, { category: codes[0], claimed: '', confidence: null }] })
                  }
                >
                  + Add expense
                </button>
              </td>
              <td className="num"><strong>{bdt(total)}</strong></td>
              <td />
            </tr>
          </tfoot>
        </table>

        {total !== claimed && (
          <p className="warn">Expenses add up to {bdt(total)} but the claimed amount is {bdt(claimed)}.</p>
        )}
        {extraction.extraction_notes && <p className="muted small">Agent 1 notes: {extraction.extraction_notes}</p>}

        <div className="actions">
          {!canSubmit && <span className="muted">Switch to a Claims Officer to confirm the review.</span>}
          <button
            className="primary"
            disabled={!canSubmit || busy || badDates.length > 0 || form.expenses.length === 0}
            onClick={onSubmit}
          >
            {busy ? 'Agents 2 & 3 are processing and auditing…' : 'Confirm & send to processing'}
          </button>
        </div>
        {badDates.length > 0 && <p className="warn">Dates must be dd-mm-yyyy.</p>}
      </section>
    </div>
  )
}
