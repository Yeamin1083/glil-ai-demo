import {
  Activity,
  ArrowRight,
  Bot,
  Building2,
  Check,
  CheckCircle2,
  ChevronRight,
  ShieldCheck,
  Sparkles,
  Zap,
} from 'lucide-react'
import { useEffect, useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface Props {
  onStartClaimsFlow: () => void
  onOpenHrPortal: () => void
}

interface DemoScenario {
  id: string
  member: string
  company: string
  hospital: string
  diagnosis: string
  claimed: string
  payable: string
  turnaround: string
  status: string
  items: { label: string; amount: string }[]
}

const DEMO_SCENARIOS: DemoScenario[] = [
  {
    id: 'DEMO-7049-0001',
    member: 'Rahim Uddin',
    company: 'Square Pharmaceuticals Ltd.',
    hospital: 'United Hospital Limited',
    diagnosis: 'Acute Gastritis & Viral Fever',
    claimed: '৳2,450',
    payable: '৳2,450',
    turnaround: '2.8s',
    status: 'Instant STP Approved (≤ ৳3,000)',
    items: [
      { label: 'Specialist Consultation', amount: '৳1,000' },
      { label: 'Pharma / Prescribed Medicines', amount: '৳1,450' },
    ],
  },
  {
    id: 'DEMO-7049-0003',
    member: 'Tanvir Hasan',
    company: 'Grameenphone Ltd.',
    hospital: 'Fashion Optics Ltd.',
    diagnosis: 'Refractive Error & Spectacles',
    claimed: '৳4,500',
    payable: '৳2,000',
    turnaround: '3.4s',
    status: 'Optical Cap Reconciled',
    items: [
      { label: 'Ophthalmologist Visit', amount: '৳500' },
      { label: 'Spectacles Frame (Cap ৳1,500)', amount: '৳1,500' },
    ],
  },
]

export function WelcomePage({ onStartClaimsFlow, onOpenHrPortal }: Props) {
  // Only "hello" and "welcome" as requested
  const [wordIndex, setWordIndex] = useState(0)
  const [activeScenario, setActiveScenario] = useState(0)
  const words = ['hello', 'welcome']

  useEffect(() => {
    const interval = setInterval(() => {
      setWordIndex((prev) => (prev + 1) % words.length)
    }, 3200)
    return () => clearInterval(interval)
  }, [words.length])

  const scenario = DEMO_SCENARIOS[activeScenario]

  return (
    <div className="relative min-h-[calc(100vh-5rem)] flex flex-col justify-between overflow-hidden py-8 px-4 sm:px-6 lg:px-8 font-montserrat">
      {/* Warm Apple-style ambient background glow */}
      <div
        className="pointer-events-none absolute -top-24 left-1/2 -translate-x-1/2 w-[820px] h-[520px] rounded-full blur-[90px] -z-10"
        style={{
          background: 'radial-gradient(circle, rgba(242, 183, 5, 0.35) 0%, rgba(243, 112, 33, 0.22) 45%, transparent 75%)',
        }}
      />
      <div className="pointer-events-none absolute bottom-4 right-10 w-[440px] h-[340px] bg-blue-500/10 blur-[100px] rounded-full -z-10" />
      <div className="pointer-events-none absolute top-1/2 left-6 w-[340px] h-[340px] bg-amber-400/15 blur-[90px] rounded-full -z-10" />

      {/* Main Container */}
      <div className="mx-auto max-w-5xl w-full text-center my-auto space-y-8">
        {/* Top Pilot Pill */}
        <div className="inline-flex items-center gap-2 rounded-full border border-orange-200/90 bg-white/90 backdrop-blur px-4 py-1.5 text-xs font-semibold text-[var(--glil-orange)] shadow-xs animate-in fade-in slide-in-from-top-4 duration-700">
          <Sparkles className="size-3.5" />
          <span>Guardian Life Insurance · AI Innovation Pilot</span>
          <span className="h-1 w-1 rounded-full bg-[var(--glil-orange)]" />
          <span className="text-[11px] font-medium text-slate-500">OPD Group Health</span>
        </div>

        {/* Authentic Apple Device "Hello" & "Welcome" SVG Handwriting Draw Animation */}
        <div className="h-24 sm:h-32 flex flex-col items-center justify-center overflow-visible">
          <svg
            viewBox="0 0 520 120"
            className="w-full max-w-[420px] sm:max-w-[480px] h-full overflow-visible select-none drop-shadow-sm"
          >
            <text
              key={wordIndex}
              x="50%"
              y="75%"
              textAnchor="middle"
              className="apple-draw-text text-7xl sm:text-8xl"
            >
              {words[wordIndex]}.
            </text>
          </svg>
        </div>

        {/* Clean Project Header in Montserrat */}
        <div className="space-y-3">
          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-slate-900">
            <span className="apple-title-gradient block pb-1">
              AI Claim Processing System
            </span>
            <span className="text-xl sm:text-3xl font-bold text-slate-700 tracking-normal block mt-1">
              (ACPS)
            </span>
          </h1>

          <p className="mx-auto max-w-2xl text-base sm:text-lg text-slate-600 leading-relaxed font-normal">
            Welcome to Guardian Life&apos;s intelligent claims automation engine. Real-time document extraction, clinical policy verification, and straight-through settlement in seconds.
          </p>
        </div>

         {/* Discrete Demonstration Notice */}
        <div className="rounded-xl border border-slate-200/80 bg-slate-100/70 p-3.5 text-xs text-slate-600 max-w-2xl mx-auto shadow-2xs">
          <div className="flex items-center justify-center gap-2 font-semibold text-slate-800 mb-0.5">
            <CheckCircle2 className="size-3.5 text-[var(--glil-orange)]" />
            <span>Pilot Demonstration Notice</span>
          </div>
          <p className="text-[11px] text-slate-500 text-center leading-normal">
            Disclaimer: This presentation demo operates with pre-configured sample claim documents and simulated OPD plan parameters. All medical records and invoices are sanitized.
          </p>
        </div>

        {/* Apple Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-1">
          <Button
            size="lg"
            onClick={onStartClaimsFlow}
            className="h-12 px-8 rounded-full bg-[var(--glil-orange)] hover:bg-[var(--glil-orange-hover)] text-white font-semibold text-sm shadow-md hover:shadow-lg hover:scale-[1.02] active:scale-[0.98] transition-all duration-300 gap-2.5 group cursor-pointer"
          >
            <span>Enter System</span>
            <ArrowRight className="size-4 transition-transform duration-300 group-hover:translate-x-1" />
          </Button>

          <Button
            size="lg"
            variant="outline"
            onClick={onOpenHrPortal}
            className="h-12 px-7 rounded-full border-slate-300 bg-white/90 hover:bg-slate-50 text-slate-800 font-semibold text-sm shadow-xs hover:scale-[1.02] active:scale-[0.98] transition-all duration-300 gap-2 cursor-pointer"
          >
            <Building2 className="size-4 text-[var(--glil-orange)]" />
            <span>Corporate HR Portal</span>
            <Badge className="ml-1 bg-amber-100 text-amber-800 border-amber-200 text-[10px] px-1.5 py-0 font-medium">
              3 Pending
            </Badge>
          </Button>
        </div>

        {/* HERO SHOT: Apple-Style Glassmorphism Interactive Demo Window */}
        <div className="mx-auto max-w-4xl text-left rounded-2xl border border-slate-200/90 bg-white/90 backdrop-blur-xl shadow-xl overflow-hidden transition-all duration-300">
          {/* Window Header with macOS Dots */}
          <div className="flex items-center justify-between border-b border-slate-200/80 bg-slate-50/90 px-4 py-3">
            <div className="flex items-center gap-2">
              <span className="size-3 rounded-full bg-rose-400 inline-block shadow-2xs" />
              <span className="size-3 rounded-full bg-amber-400 inline-block shadow-2xs" />
              <span className="size-3 rounded-full bg-emerald-400 inline-block shadow-2xs" />
              <span className="ml-2 text-xs font-semibold text-slate-700 hidden sm:inline">
                ACPS Intelligent Adjudication Engine · Live Demonstration
              </span>
            </div>

            <div className="flex items-center gap-2">
              <span className="relative flex size-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full size-2 bg-emerald-500" />
              </span>
              <span className="text-[11px] font-mono text-emerald-700 font-medium">
                Autonomous Settlement Live
              </span>
            </div>
          </div>

          {/* Window Body: Interactive Split View */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-5 p-5 sm:p-6 bg-gradient-to-b from-white to-slate-50/60">
            {/* Left Column: Simulated Prescription / Document Scanner Viewport (5 cols) */}
            <div className="md:col-span-5 flex flex-col justify-between rounded-xl border border-slate-200 bg-slate-900 text-slate-100 p-4 relative overflow-hidden shadow-inner">
              {/* Laser scan animation line */}
              <div className="scan-beam" aria-hidden="true" />
              <div className="scan-grid" aria-hidden="true" />

              {/* HUD Header */}
              <div className="relative z-10 flex items-center justify-between text-[11px] text-slate-300 border-b border-slate-800 pb-2.5">
                <div className="flex items-center gap-1.5 text-orange-400 font-mono font-medium">
                  <Activity className="size-3.5 animate-pulse" />
                  <span>OCR_VISION_HUD</span>
                </div>
                <span className="font-mono text-slate-400">{scenario.id}</span>
              </div>

              {/* Document Mockup View */}
              <div className="relative z-10 my-4 space-y-2.5 bg-slate-950/70 p-3 rounded-lg border border-slate-800 text-xs">
                <div className="flex items-center justify-between text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                  <span>{scenario.hospital}</span>
                  <Badge variant="outline" className="text-[9px] border-emerald-500/40 text-emerald-400 bg-emerald-950/30">
                    Verified Original
                  </Badge>
                </div>
                <div className="font-semibold text-slate-200 text-sm">
                  Rx · {scenario.diagnosis}
                </div>
                <div className="space-y-1 text-[11px] text-slate-400 border-t border-slate-800/80 pt-2">
                  {scenario.items.map((it) => (
                    <div key={it.label} className="flex justify-between">
                      <span className="truncate">{it.label}</span>
                      <span className="font-mono text-slate-300">{it.amount}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Scenario Switcher Pills */}
              <div className="relative z-10 flex items-center gap-2 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setActiveScenario(0)}
                  className={cn(
                    'flex-1 text-[11px] font-medium py-1 px-2 rounded transition-all cursor-pointer text-center',
                    activeScenario === 0
                      ? 'bg-[var(--glil-orange)] text-white shadow-xs'
                      : 'bg-slate-800 text-slate-400 hover:text-slate-200'
                  )}
                >
                  Scenario 1 (STP ≤ ৳3,000)
                </button>
                <button
                  type="button"
                  onClick={() => setActiveScenario(1)}
                  className={cn(
                    'flex-1 text-[11px] font-medium py-1 px-2 rounded transition-all cursor-pointer text-center',
                    activeScenario === 1
                      ? 'bg-[var(--glil-orange)] text-white shadow-xs'
                      : 'bg-slate-800 text-slate-400 hover:text-slate-200'
                  )}
                >
                  Scenario 2 (Plan Cap)
                </button>
              </div>
            </div>

            {/* Right Column: AI Extraction & Policy Adjudication Telemetry (7 cols) */}
            <div className="md:col-span-7 flex flex-col justify-between space-y-4">
              {/* Telemetry Checklist */}
              <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                    Live Policy Verification &amp; Audit
                  </span>
                  <Badge className="bg-emerald-100 text-emerald-800 border-emerald-200 text-[10px]">
                    100% Policy Match
                  </Badge>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                  <div className="flex items-start gap-2 rounded-lg border border-slate-200/80 bg-white p-2.5 shadow-2xs">
                    <Check className="size-4 text-emerald-600 shrink-0 mt-0.5" />
                    <div className="min-w-0">
                      <div className="font-semibold text-slate-900 truncate">{scenario.member}</div>
                      <div className="text-[10px] text-slate-500 truncate">{scenario.company}</div>
                    </div>
                  </div>

                  <div className="flex items-start gap-2 rounded-lg border border-slate-200/80 bg-white p-2.5 shadow-2xs">
                    <Check className="size-4 text-emerald-600 shrink-0 mt-0.5" />
                    <div className="min-w-0">
                      <div className="font-semibold text-slate-900">Coverage Cycle Active</div>
                      <div className="text-[10px] text-slate-500">60-Day Submission Met</div>
                    </div>
                  </div>
                </div>

                {/* Calculation Summary Box */}
                <div className="rounded-xl border border-orange-200 bg-orange-50/50 p-3.5 flex items-center justify-between gap-3">
                  <div>
                    <div className="text-[10px] uppercase font-bold text-orange-950/70">
                      Settlement Recommendation
                    </div>
                    <div className="text-sm font-bold text-slate-900 mt-0.5">
                      {scenario.status}
                    </div>
                    <div className="text-[11px] text-slate-600 mt-0.5">
                      Autonomous decision latency: <span className="font-bold text-slate-800">{scenario.turnaround}</span>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <div className="text-[10px] uppercase font-bold text-slate-500">Payable Amount</div>
                    <div className="text-2xl font-extrabold text-emerald-700 tracking-tight">
                      {scenario.payable}
                    </div>
                  </div>
                </div>
              </div>

              {/* Bottom Quick-Launch Trigger */}
              <div className="flex items-center justify-between pt-2 border-t border-slate-200/70">
                <span className="text-xs text-slate-500">
                  Ready to test with live documents and real-time adjudication?
                </span>
                <Button
                  size="sm"
                  onClick={onStartClaimsFlow}
                  className="bg-[var(--glil-orange)] hover:bg-[var(--glil-orange-hover)] text-white text-xs gap-1.5 h-8 rounded-lg cursor-pointer font-medium"
                >
                  <span>Launch Live Flow</span>
                  <ChevronRight className="size-3.5" />
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* 3 Clean Minimalist Frosted-Glass Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2 text-left">
          <div className="apple-card-hover rounded-2xl border border-slate-200/90 bg-white/85 backdrop-blur p-5 shadow-xs">
            <div className="size-10 rounded-xl bg-orange-100/70 text-[var(--glil-orange)] grid place-items-center mb-3">
              <Zap className="size-5" />
            </div>
            <h3 className="text-sm font-bold text-slate-900">Instant STP Settlement</h3>
            <p className="text-xs text-slate-500 mt-1 leading-relaxed">
              Autonomous straight-through decision in under 30 seconds for eligible OPD claims ≤ ৳3,000.
            </p>
          </div>

          <div className="apple-card-hover rounded-2xl border border-slate-200/90 bg-white/85 backdrop-blur p-5 shadow-xs">
            <div className="size-10 rounded-xl bg-blue-100/70 text-blue-700 grid place-items-center mb-3">
              <Bot className="size-5" />
            </div>
            <h3 className="text-sm font-bold text-slate-900">Multimodal Vision OCR</h3>
            <p className="text-xs text-slate-500 mt-1 leading-relaxed">
              Clinical entity extraction from doctor handwriting, medical prescriptions, and cash receipts.
            </p>
          </div>

          <div className="apple-card-hover rounded-2xl border border-slate-200/90 bg-white/85 backdrop-blur p-5 shadow-xs">
            <div className="size-10 rounded-xl bg-emerald-100/70 text-emerald-700 grid place-items-center mb-3">
              <ShieldCheck className="size-5" />
            </div>
            <h3 className="text-sm font-bold text-slate-900">Deterministic Policy Shield</h3>
            <p className="text-xs text-slate-500 mt-1 leading-relaxed">
              6-point automated policy audit enforcing member enrollment, item caps, cycle dates, and duplicate protection.
            </p>
          </div>
        </div>

    
      </div>

      {/* Floating Status Bar (Inspired by .template-footer with clean design) */}
      <div className="hidden sm:flex fixed bottom-0 right-0 h-10 px-4 rounded-tl-xl border-t border-l border-amber-200/70 bg-[#ffffba]/80 backdrop-blur items-center justify-between gap-3 text-xs text-slate-700 shadow-xs z-20">
        <div className="flex items-center gap-2">
          <span className="size-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="font-semibold text-slate-800">ACPS Gateway</span>
        </div>
        <span className="text-slate-400">|</span>
        <span className="text-[11px] text-slate-600 font-medium">Guardian Life Insurance Ltd.</span>
      </div>

      {/* Footer Branding */}
      <footer className="mt-8 pt-4 border-t border-slate-200/80 text-center text-xs text-slate-400">
        Guardian Life Insurance Limited · Automated Claims Processing System (ACPS) · AI Innovation Pilot
      </footer>
    </div>
  )
}
