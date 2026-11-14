import { useEffect, useState } from 'react'
import { approveClaim, extractClaim, getFixtures, reviewClaim } from './features/claim/api'
import { IntimationStep } from './features/claim/components/IntimationStep'
import { OracleStep } from './features/claim/components/OracleStep'
import { ProcessStep } from './features/claim/components/ProcessStep'
import { ReviewStep } from './features/claim/components/ReviewStep'
import { fromExtraction, toClaimIn, type ClaimForm, type FormField } from './features/claim/form'
import type { Confidence, Extraction, Fixtures, OracleRecord, Review, Sample } from './features/claim/types'
import { ScanOverlay } from './shared/components/ScanOverlay'
import { EXTRACT_STEPS, REVIEW_STEPS, ROLE, ROLE_LABEL, STEP, STEP_LABEL, type Step } from './shared/constants'
import { bdt } from './shared/format'

export default function App() {
  const [fixtures, setFixtures] = useState<Fixtures | null>(null)
  const [officerId, setOfficerId] = useState('')
  const [step, setStep] = useState<Step>(STEP.INTIMATION)
  const [busy, setBusy] = useState(false)
  // the document an agent is reading right now, shown under the scanner
  const [scanning, setScanning] = useState<{ file: File; agent: 'extract' | 'review' } | null>(null)
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
      setScanning(null)
    }
  }

  const intimate = (doc: File, memberCode: string, chosen: Sample | null) =>
    run(async () => {
      setScanning({ file: doc, agent: 'extract' })
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
      setScanning({ file: file!, agent: 'review' })
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
          <img className="logo" src="/guardian-logo-white.svg" alt="Guardian Life Insurance" />
          <div>
            <strong>Claims AI</strong>
            <span className="sub">
              Group health OPD pilot, claims up to {bdt(5000)}
              {fixtures?.source === 'ACPS_T' && ', running on ACPS_T data'}
            </span>
          </div>
        </div>

        <ol className="stepper" aria-label="Claim progress">
          {Object.entries(STEP_LABEL).map(([key, label]) => {
            const n = Number(key)
            return (
              <li
                key={key}
                className={n === step ? 'current' : n < step ? 'done' : ''}
                aria-current={n === step ? 'step' : undefined}
              >
                <span className="dot">{n < step ? '✓' : n + 1}</span>
                {label}
              </li>
            )
          })}
        </ol>

        <label className="acting-as">
          <span>Acting as</span>
          <select value={officer?.id ?? ''} onChange={(e) => setOfficerId(e.target.value)}>
            {users.map((u) => (
              <option key={u.id} value={u.id}>
                {u.name} ({ROLE_LABEL[u.role]})
              </option>
            ))}
          </select>
        </label>
      </header>

      <main>
        {error && (
          <div className="error" role="alert">
            {error}
            <button className="ghost" onClick={() => setError(null)}>Dismiss</button>
          </div>
        )}

        {!fixtures ? (
          <p className="muted">Loading claims…</p>
        ) : scanning ? (
          <ScanOverlay
            file={scanning.file}
            title={scanning.agent === 'extract' ? 'Agent 1 is reading the claim' : 'Agents 2 and 3 are reviewing'}
            steps={scanning.agent === 'extract' ? EXTRACT_STEPS : REVIEW_STEPS}
          />
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
