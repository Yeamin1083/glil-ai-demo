import { useEffect, useState } from 'react'
import { approveClaim, extractClaim, getFixtures, reviewClaim } from './features/claim/api'
import { IntimationStep } from './features/claim/components/IntimationStep'
import { OracleStep } from './features/claim/components/OracleStep'
import { ProcessStep } from './features/claim/components/ProcessStep'
import { ReviewStep } from './features/claim/components/ReviewStep'
import { fromExtraction, toClaimIn, type ClaimForm, type FormField } from './features/claim/form'
import type { Confidence, Extraction, Fixtures, OracleRecord, Review, Sample } from './features/claim/types'
import { ROLE, ROLE_LABEL, STEP, STEP_LABEL, type Step } from './shared/constants'
import { bdt } from './shared/format'

export default function App() {
  const [fixtures, setFixtures] = useState<Fixtures | null>(null)
  const [officerId, setOfficerId] = useState('')
  const [step, setStep] = useState<Step>(STEP.INTIMATION)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [file, setFile] = useState<File | null>(null)
  const [sample, setSample] = useState<Sample | null>(null)
  const [extraction, setExtraction] = useState<Extraction | null>(null)
  const [form, setForm] = useState<ClaimForm | null>(null)
  const [confidence, setConfidence] = useState<Partial<Record<FormField, Confidence>>>({})
  const [review, setReview] = useState<Review | null>(null)
  const [reviewedBy, setReviewedBy] = useState('')
  const [record, setRecord] = useState<OracleRecord | null>(null)

  const users = fixtures?.users ?? []
  const officer = users.find((u) => u.id === officerId) ?? users[0]
  const member = fixtures?.members.find((m) => m.code === form?.member_code)

  const loadFixtures = () => getFixtures().then(setFixtures).catch((e: Error) => setError(e.message))
  useEffect(() => {
    loadFixtures()
  }, [])

  async function run(task: () => Promise<void>) {
    setBusy(true)
    setError(null)
    try {
      await task()
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setBusy(false)
    }
  }

  const intimate = (doc: File, memberCode: string, chosen: Sample | null) =>
    run(async () => {
      const result = await extractClaim(doc)
      const prefilled = fromExtraction(result, memberCode, chosen?.reference_date)
      setFile(doc)
      setSample(chosen)
      setExtraction(result)
      setForm(prefilled.form)
      setConfidence(prefilled.confidence)
      setStep(STEP.REVIEW)
    })

  const sendToProcessing = () =>
    run(async () => {
      setReview(await reviewClaim(file!, toClaimIn(form!)))
      setReviewedBy(officer!.name)
      setStep(STEP.PROCESS)
    })

  const signOff = () =>
    run(async () => {
      setRecord(await approveClaim(toClaimIn(form!), review!, reviewedBy, officer!.name))
      setStep(STEP.ORACLE)
    })

  const reset = () => {
    setFile(null)
    setSample(null)
    setExtraction(null)
    setForm(null)
    setReview(null)
    setRecord(null)
    setStep(STEP.INTIMATION)
    loadFixtures()
  }

  return (
    <div className="app">
      <header className="topbar">
        <div className="brand">
          <span className="logo">G</span>
          <div>
            <strong>Claims AI</strong>
            <span className="muted small">
              Group health · OPD pilot ≤ {bdt(5000)}
              {fixtures && ` · data: ${fixtures.source}`}
            </span>
          </div>
        </div>
        <label className="acting-as">
          <span className="muted small">Acting as</span>
          <select value={officer?.id ?? ''} onChange={(e) => setOfficerId(e.target.value)}>
            {users.map((u) => (
              <option key={u.id} value={u.id}>
                {u.name} · {ROLE_LABEL[u.role]}
              </option>
            ))}
          </select>
        </label>
      </header>

      <ol className="stepper">
        {Object.entries(STEP_LABEL).map(([key, label]) => {
          const n = Number(key)
          return (
            <li key={key} className={n === step ? 'current' : n < step ? 'done' : ''}>
              <span className="dot">{n < step ? '✓' : n + 1}</span>
              {label}
            </li>
          )
        })}
      </ol>

      <main>
        {error && (
          <div className="error" role="alert">
            {error}
            <button className="ghost" onClick={() => setError(null)}>Dismiss</button>
          </div>
        )}

        {!fixtures ? (
          <p className="muted">Loading demo data…</p>
        ) : step === STEP.INTIMATION ? (
          <IntimationStep
            members={fixtures.members}
            samples={fixtures.samples}
            busy={busy}
            onSubmit={intimate}
          />
        ) : step === STEP.REVIEW && file && extraction && form && member ? (
          <ReviewStep
            file={file}
            extraction={extraction}
            member={member}
            form={form}
            confidence={confidence}
            canSubmit={officer?.role === ROLE.CLAIMS_OFFICER}
            busy={busy}
            onChange={setForm}
            onSubmit={sendToProcessing}
          />
        ) : step === STEP.PROCESS && review ? (
          <ProcessStep
            review={review}
            officerDecision={sample?.officer_decision ?? null}
            reviewedBy={reviewedBy}
            canSignOff={officer?.role === ROLE.POST_AUDITOR}
            busy={busy}
            onBack={() => setStep(STEP.REVIEW)}
            onSignOff={signOff}
          />
        ) : step === STEP.ORACLE && record ? (
          <OracleStep record={record} onNext={reset} />
        ) : null}
      </main>
    </div>
  )
}
