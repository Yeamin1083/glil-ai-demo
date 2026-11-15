import { ArrowRight, Building2 } from 'lucide-react'
import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { bdt } from '@/shared/format'
import { TEST_CLAIMS } from '../claim/testClaims'

interface Props {
  onStartClaimsFlow: () => void
  onOpenHrPortal: () => void
}

const GREETINGS = ['welcome']
const GREETING_MS = 2600

// ponytail: module flag, so the intro plays once per page load, not on every return to Welcome
let introSeen = false

// one paid in full, one part paid, one regretted, one asking for documents
const EXAMPLES = [0, 2, 4, 10].map((i) => TEST_CLAIMS[i])

export function WelcomePage({ onStartClaimsFlow, onOpenHrPortal }: Props) {
  const [greeting, setGreeting] = useState(0)
  const [intro, setIntro] = useState(!introSeen)
  const [activeScenario, setActiveScenario] = useState(0)

  const endIntro = () => {
    introSeen = true
    setIntro(false)
  }

  useEffect(() => {
    if (!intro) return
    const t = setTimeout(() => (greeting + 1 < GREETINGS.length ? setGreeting(greeting + 1) : endIntro()), GREETING_MS)
    return () => clearTimeout(t)
  }, [intro, greeting])

  const scenario = EXAMPLES[activeScenario]

  return (
    <>
      {intro &&
        createPortal(
          <div
            onClick={endIntro}
            className="fixed inset-0 z-50 bg-white flex items-center justify-center cursor-pointer"
          >
            <span key={greeting} className="hello-word text-7xl sm:text-9xl leading-none px-4">
              {GREETINGS[greeting]}
            </span>
          </div>,
          document.body,
        )}
      <div className="min-h-[calc(100vh-5rem)] flex flex-col justify-between py-8 px-4 sm:px-6 lg:px-8 font-montserrat">
        <div className="mx-auto max-w-4xl w-full text-center my-auto space-y-8">
          <div className="space-y-3">
            <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-slate-900">
              AI Claim Processing System
              <span className="block text-xl sm:text-3xl font-bold text-slate-700 mt-1">(ACPS)</span>
            </h1>
            <p className="mx-auto max-w-xl text-base sm:text-lg text-slate-600">
              Upload your bills. We read them, check your plan, and tell you what we can pay.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button
              size="lg"
              onClick={onStartClaimsFlow}
              className="h-12 px-8 rounded-full bg-[var(--glil-orange)] hover:bg-[var(--glil-orange-hover)] text-white font-semibold text-sm shadow-md hover:shadow-lg transition-all gap-2.5 group cursor-pointer"
            >
              <span>Start a Claim</span>
              <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
            </Button>

            <Button
              size="lg"
              variant="outline"
              onClick={onOpenHrPortal}
              className="h-12 px-7 rounded-full border-slate-300 bg-white/90 hover:bg-slate-50 text-slate-800 font-semibold text-sm gap-2 cursor-pointer"
            >
              <Building2 className="size-4 text-[var(--glil-orange)]" />
              <span>HR Portal</span>
              <Badge className="ml-1 bg-amber-100 text-amber-800 border-amber-200 text-[10px] px-1.5 py-0 font-medium">
                {TEST_CLAIMS.length} waiting
              </Badge>
            </Button>
          </div>

          <div className="text-left rounded-2xl border border-slate-200/90 bg-white/90 shadow-xl overflow-hidden">
            <div className="flex items-center justify-between border-b border-slate-200/80 bg-slate-50/90 px-4 py-3">
              <span className="text-xs font-semibold text-slate-700">See an example</span>
              <div className="flex gap-2">
                {EXAMPLES.map((s, i) => (
                  <button
                    key={s.number}
                    type="button"
                    onClick={() => setActiveScenario(i)}
                    className={cn(
                      'text-[11px] font-medium py-1 px-3 rounded-full transition-all cursor-pointer',
                      activeScenario === i
                        ? 'bg-[var(--glil-orange)] text-white'
                        : 'bg-slate-200 text-slate-600 hover:text-slate-900',
                    )}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 p-5 sm:p-6">
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 space-y-2 text-sm">
                <div className="text-xs font-semibold text-slate-500">Claim {scenario.number}</div>
                <div className="font-semibold text-slate-900">{scenario.label}</div>
                <div className="flex justify-between border-t border-slate-200 pt-2 text-xs text-slate-600">
                  <span>On the bills</span>
                  <span className="font-mono text-slate-800">{bdt(scenario.claimed)}</span>
                </div>
              </div>

              <div className="rounded-xl border border-orange-200 bg-orange-50/50 p-4 flex items-center justify-between gap-3">
                <div>
                  <div className="text-sm font-bold text-slate-900">{scenario.result}</div>
                  <div className="text-xs text-slate-600 mt-0.5">Decided in seconds</div>
                </div>
                <div className="text-right shrink-0">
                  <div className="text-xs text-slate-500">We pay</div>
                  <div className="text-2xl font-extrabold text-emerald-700">{bdt(scenario.paid)}</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <footer className="mt-8 pt-4 border-t border-slate-200/80 text-center text-xs text-slate-400">
          Guardian Life Insurance Limited · ACPS demo with sample claims only
        </footer>
      </div>
    </>
  )
}
