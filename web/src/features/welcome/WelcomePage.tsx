import { ArrowRight, Bot, Building2, CheckCircle2, ChevronRight, FileCheck, FileText, Layers, ShieldCheck, Sparkles, UserCheck, Zap } from 'lucide-react'
import { useState, useEffect } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { cn } from '@/lib/utils'

interface Props {
  onStartClaimsFlow: () => void
  onOpenHrPortal: () => void
}

export function WelcomePage({ onStartClaimsFlow, onOpenHrPortal }: Props) {
  const [helloIndex, setHelloIndex] = useState(0)
  const [mounted, setMounted] = useState(false)

  const greetings = ['Hello', 'স্বাগতম', 'Welcome', 'নমস্কার', 'Hello']

  useEffect(() => {
    setMounted(true)
    const interval = setInterval(() => {
      setHelloIndex((prev) => (prev + 1) % greetings.length)
    }, 2400)
    return () => clearInterval(interval)
  }, [greetings.length])

  return (
    <div className="relative min-h-[calc(100vh-4rem)] flex flex-col justify-between overflow-hidden py-10 px-4 sm:px-6 lg:px-8">
      {/* Apple-style dynamic ambient glow in logo colors */}
      <div className="pointer-events-none absolute -top-24 left-1/2 -translate-x-1/2 w-[720px] h-[480px] apple-glow-orb rounded-full -z-10" />
      <div className="pointer-events-none absolute bottom-0 right-10 w-[420px] h-[320px] bg-blue-500/10 blur-[90px] rounded-full -z-10" />

      {/* Hero Container */}
      <div className="mx-auto max-w-5xl w-full text-center my-auto space-y-8">
        {/* Animated Badge */}
        <div className="inline-flex items-center gap-2 rounded-full border border-orange-200/80 bg-orange-50/70 px-4 py-1.5 text-xs font-semibold text-[var(--glil-orange)] shadow-xs animate-in fade-in slide-in-from-top-4 duration-700">
          <Sparkles className="size-3.5" />
          <span>Next-Generation Autonomous Insurance Intelligence</span>
          <span className="h-1 w-1 rounded-full bg-[var(--glil-orange)]" />
          <span className="text-[11px] font-medium text-slate-600">OPD Group Health</span>
        </div>

        {/* Apple "Hello" Fluid Animated Greeting */}
        <div className="h-14 sm:h-18 flex items-center justify-center overflow-hidden">
          <span
            key={helloIndex}
            className="text-4xl sm:text-6xl font-light tracking-tight text-slate-800 transition-all duration-700 ease-out inline-block animate-in fade-in zoom-in-95"
            style={{ fontFamily: 'system-ui, -apple-system, sans-serif' }}
          >
            {greetings[helloIndex]}
            <span className="text-[var(--glil-orange)] font-bold">.</span>
          </span>
        </div>

        {/* Animated Project Name (Apple Typography + Logo Brand Color) */}
        <div className="space-y-3">
          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight">
            <span className="apple-title-gradient block pb-1">
              AI Claim Processing System
            </span>
            <span className="text-2xl sm:text-4xl font-bold text-slate-700 tracking-normal block mt-1">
              (ACPS)
            </span>
          </h1>

          <p className="mx-auto max-w-2xl text-base sm:text-lg text-slate-600 leading-relaxed font-normal">
            Welcome to Guardian Life&apos;s intelligent claims automation engine. Real-time document extraction, clinical adjudication, and straight-through settlement in seconds.
          </p>
        </div>

        {/* Action Buttons: Primary Enter Button + Pathway Cards */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-3">
          <Button
            size="lg"
            onClick={onStartClaimsFlow}
            className="h-12 px-8 rounded-full bg-[var(--glil-orange)] hover:bg-[var(--glil-orange-hover)] text-white font-semibold text-sm shadow-md hover:shadow-lg transition-all duration-300 gap-2.5 group cursor-pointer"
          >
            <span>Enter System</span>
            <ArrowRight className="size-4 transition-transform duration-300 group-hover:translate-x-1" />
          </Button>

          <Button
            size="lg"
            variant="outline"
            onClick={onOpenHrPortal}
            className="h-12 px-7 rounded-full border-slate-300 bg-white hover:bg-slate-50 text-slate-800 font-semibold text-sm shadow-xs transition-all duration-300 gap-2 cursor-pointer"
          >
            <Building2 className="size-4 text-[var(--glil-orange)]" />
            <span>Corporate HR Portal</span>
            <Badge className="ml-1 bg-amber-100 text-amber-800 border-amber-200 text-[10px] px-1.5 py-0">
              3 Pending
            </Badge>
          </Button>
        </div>

        {/* Feature Highlights: 3 Apple-Style Minimalist Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-6 text-left">
          <div className="apple-card-hover rounded-2xl border border-slate-200/90 bg-white/80 backdrop-blur p-5 shadow-xs">
            <div className="size-10 rounded-xl bg-orange-100/70 text-[var(--glil-orange)] grid place-items-center mb-3">
              <Zap className="size-5" />
            </div>
            <h3 className="text-sm font-bold text-slate-900">Instant STP Settlement</h3>
            <p className="text-xs text-slate-500 mt-1 leading-relaxed">
              Autonomous straight-through adjudication in under 30 seconds for eligible OPD claims ≤ ৳3,000.
            </p>
          </div>

          <div className="apple-card-hover rounded-2xl border border-slate-200/90 bg-white/80 backdrop-blur p-5 shadow-xs">
            <div className="size-10 rounded-xl bg-blue-100/70 text-blue-700 grid place-items-center mb-3">
              <Bot className="size-5" />
            </div>
            <h3 className="text-sm font-bold text-slate-900">Multimodal Vision OCR</h3>
            <p className="text-xs text-slate-500 mt-1 leading-relaxed">
              Medical document extraction with auto-highlighting of clinical entities and bill reconciliation.
            </p>
          </div>

          <div className="apple-card-hover rounded-2xl border border-slate-200/90 bg-white/80 backdrop-blur p-5 shadow-xs">
            <div className="size-10 rounded-xl bg-emerald-100/70 text-emerald-700 grid place-items-center mb-3">
              <ShieldCheck className="size-5" />
            </div>
            <h3 className="text-sm font-bold text-slate-900">Deterministic Policy Shield</h3>
            <p className="text-xs text-slate-500 mt-1 leading-relaxed">
              6-point automated policy audit enforcing member enrollment, item caps, cycle dates, and duplicate protection.
            </p>
          </div>
        </div>

        {/* Action Item 1: Clear Demo Disclaimer Notice */}
        <div className="rounded-xl border border-slate-200 bg-slate-100/70 p-4 text-xs text-slate-600 max-w-3xl mx-auto shadow-2xs">
          <div className="flex items-center justify-center gap-2 font-semibold text-slate-800 mb-1">
            <CheckCircle2 className="size-4 text-[var(--glil-orange)]" />
            <span>Pilot Demonstration Notice</span>
          </div>
          <p className="text-[11px] text-slate-500 text-center leading-normal">
            Disclaimer: This presentation demo operates with pre-configured sample claim documents and simulated OPD plan parameters. All medical records, invoices, and employee names shown are sanitized for demonstration purposes.
          </p>
        </div>
      </div>

      {/* Footer Branding */}
      <footer className="mt-8 pt-4 border-t border-slate-200/80 text-center text-xs text-slate-400">
        Guardian Life Insurance Limited · Automated Claims Processing System (ACPS) · AI Innovation Pilot
      </footer>
    </div>
  )
}
