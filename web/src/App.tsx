import { Check } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { cn } from '@/lib/utils'
import { approveClaim, extractClaim, getFixtures, reviewClaim } from './features/claim/api'
import { IntimationStep } from './features/claim/components/IntimationStep'
import { OracleStep } from './features/claim/components/OracleStep'
import { ProcessStep } from './features/claim/components/ProcessStep'
import { ReviewStep } from './features/claim/components/ReviewStep'
import { fromExtraction, toClaimIn, type ClaimForm, type FormField } from './features/claim/form'
import type { Confidence, Extraction, Fixtures, OracleRecord, Review } from './features/claim/types'
import { ScanOverlay } from './shared/components/ScanOverlay'
import { AGENT, EXTRACT_STEPS, REVIEW_STEPS, ROLE, ROLE_LABEL, STEP, STEP_LABEL, type Step } from './shared/constants'
import { bdt } from './shared/format'

const MIN_SCAN_MS = 4000
const pause = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

export default function App() {
  const [fixtures, setFixtures] = useState<Fixtures | null>(null)
  const [officerId, setOfficerId] = useState('')
  const [step, setStep] = useState<Step>(STEP.INTIMATION)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  // the document an agent is reading right now, shown under the scanner
  const [scanning, setScanning] = useState<{ file: File; agent: 'extract' | 'review' } | null>(null)

  const [file, setFile] = useState<File | null>(null)
  const [intimationNumber, setIntimationNumber] = useState('')
  const [extraction, setExtraction] = useState<Extraction | null>(null)
  const [form, setForm] = useState<ClaimForm | null>(null)
  const [confidence, setConfidence] = useState<Partial<Record<FormField, Confidence>>>({})
  const [review, setReview] = useState<Review | null>(null)
  const [reviewedBy, setReviewedBy] = useState('')
  const [record, setRecord] = useState<OracleRecord | null>(null)

  const users = fixtures?.users ?? []
  const officer = users.find((u) => u.id === officerId) ?? users[0]
  const member = fixtures?.members.find((m) => m.code === form?.member_code)
  // the member's claim that ACPS also processed by hand, if there is one
  const sample = fixtures?.samples.find((s) => s.member_code === form?.member_code) ?? null

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

  const intimate = (doc: File, memberCode: string) =>
    run(async () => {
      setScanning({ file: doc, agent: 'extract' })
      // cached extractions come back instantly; keep the scan on screen long enough to read
      const [result] = await Promise.all([extractClaim(doc), pause(MIN_SCAN_MS)])
      const known = fixtures?.samples.find((s) => s.member_code === memberCode)
      const prefilled = fromExtraction(result.extraction, memberCode, known?.reference_date)
      setFile(doc)
      setIntimationNumber(result.intimation_number)
      setExtraction(result.extraction)
      setForm(prefilled.form)
      setConfidence(prefilled.confidence)
      setStep(STEP.REVIEW)
    })

  const sendToProcessing = () =>
    run(async () => {
      setScanning({ file: file!, agent: 'review' })
      const [result] = await Promise.all([reviewClaim(file!, toClaimIn(form!)), pause(MIN_SCAN_MS)])
      setReview(result)
      setReviewedBy(officer!.name)
      setStep(STEP.PROCESS)
    })

  const signOff = () =>
    run(async () => {
      setRecord(await approveClaim(intimationNumber, toClaimIn(form!), review!, reviewedBy, officer!.name))
      setStep(STEP.ORACLE)
    })

  const reset = () => {
    setFile(null)
    setIntimationNumber('')
    setExtraction(null)
    setForm(null)
    setReview(null)
    setRecord(null)
    setStep(STEP.INTIMATION)
    loadFixtures()
  }

  return (
    <div className="min-h-svh bg-muted/40">
      <header className="sticky top-0 z-10 border-b bg-background/85 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-[1320px] items-center gap-6 px-6">
          <div className="flex items-center gap-3">
            <img src="/guardian.svg" alt="Guardian Life Insurance" className="h-9 w-auto shrink-0" />
            <div className="border-l pl-3 leading-tight">
              <div className="text-sm font-semibold">Claims AI</div>
              <div className="text-xs whitespace-nowrap text-muted-foreground">
                OPD pilot, up to {bdt(5000)}
                {fixtures?.source === 'ACPS_T' && ' · ACPS_T'}
              </div>
            </div>
          </div>

          <ol className="mx-auto hidden items-center gap-1 lg:flex" aria-label="Claim progress">
            {Object.entries(STEP_LABEL).map(([key, label]) => {
              const n = Number(key)
              return (
                <li
                  key={key}
                  aria-current={n === step ? 'step' : undefined}
                  className={cn(
                    'flex h-8 items-center gap-2 rounded-md pr-3 pl-1.5 text-sm font-medium whitespace-nowrap text-muted-foreground',
                    n === step && 'bg-muted text-foreground',
                    n < step && 'text-foreground',
                  )}
                >
                  <span
                    className={cn(
                      'grid size-5 place-items-center rounded-full border text-[11px]',
                      n === step && 'border-primary bg-primary text-primary-foreground',
                      n < step && 'border-emerald-200 bg-emerald-50 text-emerald-700',
                    )}
                  >
                    {n < step ? <Check className="size-3" /> : n + 1}
                  </span>
                  {label}
                </li>
              )
            })}
          </ol>

          <div className="ml-auto flex shrink-0 items-center gap-2 lg:ml-0">
            <span className="text-sm whitespace-nowrap text-muted-foreground">Acting as</span>
            <Select value={officer?.id ?? ''} onValueChange={setOfficerId}>
              <SelectTrigger className="w-64">
                <SelectValue placeholder="Select a user" />
              </SelectTrigger>
              <SelectContent>
                {users.map((u) => (
                  <SelectItem key={u.id} value={u.id}>
                    <span className="capitalize">{u.name.toLowerCase()}</span> ({ROLE_LABEL[u.role]})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-[1320px] px-6 pt-6 pb-14">
        {error && (
          <Alert variant="destructive" className="mb-4">
            <AlertDescription className="flex items-center justify-between gap-3">
              {error}
              <Button variant="ghost" size="sm" onClick={() => setError(null)}>Dismiss</Button>
            </AlertDescription>
          </Alert>
        )}

        {!fixtures ? (
          <p className="text-sm text-muted-foreground">Loading members…</p>
        ) : scanning ? (
          <ScanOverlay
            file={scanning.file}
            title={scanning.agent === 'extract' ? `${AGENT.INTAKE} is reading the claim` : 'Adjudication and audit agents are reviewing'}
            steps={scanning.agent === 'extract' ? EXTRACT_STEPS : REVIEW_STEPS}
          />
        ) : step === STEP.INTIMATION ? (
          <IntimationStep members={fixtures.members} busy={busy} onSubmit={intimate} />
        ) : step === STEP.REVIEW && file && extraction && form && member ? (
          <ReviewStep
            file={file}
            intimationNumber={intimationNumber}
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
