import { Building2, Check, Database, FileText, Home, ShieldCheck, User, UserCheck } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
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
import { HrPendingClaimsPage, type HrPendingClaim } from './features/hr/HrPendingClaimsPage'
import { WelcomePage } from './features/welcome/WelcomePage'
import { ScanOverlay } from './shared/components/ScanOverlay'
import { EXTRACT_STEPS, REVIEW_STEPS, ROLE, ROLE_LABEL, STEP, STEP_LABEL, type Step } from './shared/constants'

const MIN_SCAN_MS = 2800
const pause = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

const STEP_ICONS = [
  FileText,
  UserCheck,
  ShieldCheck,
  Database,
]

interface NavTab {
  id: 'welcome' | 'claims' | 'hr'
  label: string
  icon: typeof Home
  badge?: number
}

const NAV_TABS: NavTab[] = [
  { id: 'welcome', label: 'Welcome', icon: Home },
  { id: 'claims', label: 'Claims Flow', icon: FileText },
  { id: 'hr', label: 'HR Pending', icon: Building2, badge: 3 },
]

export default function App() {
  const [fixtures, setFixtures] = useState<Fixtures | null>(null)
  const [officerId, setOfficerId] = useState('')
  // Step 1: Initial page is the Welcome Page
  const [view, setView] = useState<'welcome' | 'claims' | 'hr'>('welcome')
  const [step, setStep] = useState<Step>(STEP.INTIMATION)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [scanning, setScanning] = useState<{ file: File; agent: 'extract' | 'review' } | null>(null)

  const [file, setFile] = useState<File | null>(null)
  const [intimationNumber, setIntimationNumber] = useState('')
  const [extraction, setExtraction] = useState<Extraction | null>(null)
  const [form, setForm] = useState<ClaimForm | null>(null)
  const [confidence, setConfidence] = useState<Partial<Record<FormField, Confidence>>>({})
  const [review, setReview] = useState<Review | null>(null)
  const [reviewedBy, setReviewedBy] = useState('')
  const [record, setRecord] = useState<OracleRecord | null>(null)

  const users = fixtures?.users ?? [
    { id: 'hr1', name: 'Sadia Rahman', designation: 'HR Manager', role: 'HR_ADMIN' },
    { id: 'o1', name: 'Farhana Islam', designation: 'Claim Officer', role: 'CLAIMS_OFFICER' },
    { id: 'o2', name: 'Arif Hossain', designation: 'Claim Officer', role: 'CLAIMS_OFFICER' },
    { id: 'o3', name: 'Imran Chowdhury', designation: 'Claim Analyst', role: 'POST_AUDITOR' },
  ]
  const officer = users.find((u) => u.id === officerId) ?? users[1] // default to Claim Officer Farhana
  const member = fixtures?.members.find((m) => m.code === form?.member_code)
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

  // Step 2: HR Endorsement flow - skips Intimation page and enters Review step directly
  const handleHrApprove = (claim: HrPendingClaim, claimFile: File) => {
    setFile(claimFile)
    setIntimationNumber(claim.intimationNumber)
    setExtraction(claim.extraction)
    const prefilled = fromExtraction(claim.extraction, claim.memberCode)
    setForm(prefilled.form)
    setConfidence(prefilled.confidence)
    if (officer.role === 'HR_ADMIN') {
      const claimOfficer = users.find((u) => u.role === 'CLAIMS_OFFICER')
      if (claimOfficer) setOfficerId(claimOfficer.id)
    }
    setStep(STEP.REVIEW)
    setView('claims')
  }

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
    <div className="min-h-svh bg-slate-50/70 text-slate-900">
      {/* Top Corporate Bar */}
      <header className="sticky top-0 z-30 border-b bg-white/95 backdrop-blur shadow-2xs">
        <div className="mx-auto flex h-16 max-w-[1360px] items-center justify-between gap-4 px-6">
          {/* Logo & Brand Identity */}
          <button
            type="button"
            onClick={() => setView('welcome')}
            className="flex items-center gap-3 shrink-0 text-left hover:opacity-90 transition-opacity cursor-pointer"
            title="Return to Welcome Screen"
          >
            <img src="/guardian.svg" alt="Guardian Life Insurance" className="h-9 w-auto shrink-0" />
            <div className="border-l pl-3 leading-tight hidden sm:block">
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold tracking-tight text-slate-900">Guardian Life Insurance</span>
                <Badge className="bg-[var(--glil-orange)] text-white text-[10px] h-4 px-1.5 hover:bg-[var(--glil-orange)]">
                  ACPS
                </Badge>
              </div>
              <div className="text-[11px] text-muted-foreground">
                AI Claim Processing System · OPD Group Health
              </div>
            </div>
          </button>

          {/* Apple-Style Sliding Segmented View Switcher */}
          <nav
            className="relative flex items-center p-1 rounded-full bg-slate-100/90 border border-slate-200/90 shadow-2xs backdrop-blur w-full max-w-[390px]"
            aria-label="Main Navigation"
          >
            {/* Smooth Gliding Apple Indicator Pill */}
            <span
              aria-hidden="true"
              className="absolute top-1 bottom-1 rounded-full bg-white shadow-xs transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)]"
              style={{
                left: `calc(${(NAV_TABS.findIndex((t) => t.id === view) * 100) / 3}% + 2px)`,
                width: 'calc(33.333% - 4px)',
              }}
            />

            {NAV_TABS.map((tab) => {
              const Icon = tab.icon
              const isActive = view === tab.id
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setView(tab.id)}
                  className={cn(
                    'relative z-10 flex flex-1 items-center justify-center gap-1.5 py-1.5 px-3 rounded-full text-xs font-semibold transition-colors duration-200 cursor-pointer select-none',
                    isActive ? 'text-slate-900 font-bold' : 'text-slate-500 hover:text-slate-800'
                  )}
                >
                  <Icon className={cn('size-3.5 shrink-0 transition-colors', isActive ? 'text-[var(--glil-orange)]' : 'text-slate-400')} />
                  <span className="truncate">{tab.label}</span>
                  {tab.badge && (
                    <span
                      className={cn(
                        'ml-0.5 inline-flex items-center justify-center text-[10px] font-bold rounded-full px-1.5 h-4 transition-colors',
                        isActive ? 'bg-[var(--glil-orange)] text-white' : 'bg-amber-100 text-amber-800'
                      )}
                    >
                      {tab.badge}
                    </span>
                  )}
                </button>
              )
            })}
          </nav>

          {/* Persona Switcher ("Acting as") */}
          <div className="flex shrink-0 items-center gap-2">
            <div className="hidden lg:flex flex-col text-right">
              <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">Active Persona</span>
              <span className="text-xs font-semibold text-slate-800">{ROLE_LABEL[officer?.role || 'CLAIMS_OFFICER']}</span>
            </div>

            <Select value={officer?.id ?? ''} onValueChange={setOfficerId}>
              <SelectTrigger className="w-52 h-9 text-xs font-medium bg-slate-50 border-slate-300">
                <SelectValue placeholder="Select acting user" />
              </SelectTrigger>
              <SelectContent>
                {users.map((u) => (
                  <SelectItem key={u.id} value={u.id} className="text-xs">
                    <div className="flex items-center gap-1.5">
                      <User className="size-3 text-muted-foreground shrink-0" />
                      <span className="font-medium capitalize">{u.name.toLowerCase()}</span>
                      <span className="text-[10px] text-muted-foreground">({ROLE_LABEL[u.role] || u.designation})</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="mx-auto max-w-[1360px] px-6 pt-6 pb-16">
        {error && (
          <Alert variant="destructive" className="mb-5 shadow-sm">
            <AlertDescription className="flex items-center justify-between gap-3 text-xs">
              <span>{error}</span>
              <Button variant="ghost" size="sm" className="h-6 text-xs" onClick={() => setError(null)}>
                Dismiss
              </Button>
            </AlertDescription>
          </Alert>
        )}

        {/* Claims Flow Step Progress Header (Apple Style) */}
        {view === 'claims' && (
          <div className="mb-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4 rounded-2xl border border-slate-200/80 bg-white/80 p-4 shadow-2xs backdrop-blur animate-in fade-in duration-300">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-bold tracking-tight text-slate-900">Claims Processing Pipeline</h2>
                <Badge variant="outline" className="text-[10px] border-orange-200 bg-orange-50 text-[var(--glil-orange)] font-mono">
                  Step {step + 1} of 4
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">
                Autonomous claims intake, verification, policy checks, and core ACPS submission.
              </p>
            </div>

            <ol className="flex flex-wrap items-center gap-2" aria-label="Claims Flow Progress">
              {Object.entries(STEP_LABEL).map(([key, label]) => {
                const n = Number(key)
                const Icon = STEP_ICONS[n] || FileText
                const isCurrent = n === step
                const isPast = n < step

                return (
                  <li
                    key={key}
                    aria-current={isCurrent ? 'step' : undefined}
                    className={cn(
                      'flex h-8 items-center gap-2 rounded-lg px-3 text-xs font-semibold whitespace-nowrap transition-all',
                      isCurrent && 'bg-[var(--glil-orange)] text-white shadow-xs',
                      isPast && 'text-slate-700 bg-emerald-50 border border-emerald-200/70',
                      !isCurrent && !isPast && 'text-slate-400 bg-slate-100/60'
                    )}
                  >
                    <span
                      className={cn(
                        'grid size-4 place-items-center rounded-full text-[10px] font-bold',
                        isCurrent && 'bg-white text-[var(--glil-orange)]',
                        isPast && 'bg-emerald-600 text-white',
                        !isCurrent && !isPast && 'bg-slate-200 text-slate-500'
                      )}
                    >
                      {isPast ? <Check className="size-2.5 stroke-[3]" /> : <Icon className="size-2.5" />}
                    </span>
                    <span>{label}</span>
                  </li>
                )
              })}
            </ol>
          </div>
        )}

        <div key={view} className="animate-in fade-in duration-300 ease-out">
          {view === 'welcome' ? (
            /* Step 1: Apple-style Welcome Page */
            <WelcomePage
              onStartClaimsFlow={() => setView('claims')}
              onOpenHrPortal={() => setView('hr')}
            />
          ) : view === 'hr' ? (
            /* Step 2: HR Pending Claims Page */
            <HrPendingClaimsPage
              members={fixtures?.members || []}
              onApproveAndProceed={handleHrApprove}
              onBackToClaims={() => setView('claims')}
            />
          ) : !fixtures ? (
            <div className="flex items-center justify-center p-16 text-xs text-muted-foreground">
              <div className="flex flex-col items-center gap-2">
                <div className="size-8 rounded-full border-2 border-[var(--glil-orange)] border-t-transparent animate-spin" />
                <span>Connecting to ACPS Claim Gateway…</span>
              </div>
            </div>
          ) : scanning ? (
            <ScanOverlay
              file={scanning.file}
              title={
                scanning.agent === 'extract'
                  ? 'Reading Claim Documents...'
                  : 'Checking Policy Rules & Calculating Settlement...'
              }
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
              canSubmit={officer?.role === ROLE.CLAIMS_OFFICER || officer?.role === ROLE.HR_ADMIN}
              busy={busy}
              onChange={setForm}
              onSubmit={sendToProcessing}
            />
          ) : step === STEP.PROCESS && review ? (
            <ProcessStep
              review={review}
              officerDecision={sample?.officer_decision ?? null}
              reviewedBy={reviewedBy || officer?.name || 'Farhana Islam'}
              canSignOff={officer?.role === ROLE.POST_AUDITOR}
              busy={busy}
              onBack={() => setStep(STEP.REVIEW)}
              onSignOff={signOff}
            />
          ) : step === STEP.ORACLE && record ? (
            <OracleStep record={record} onNext={reset} />
          ) : null}
        </div>
      </main>
    </div>
  )
}
