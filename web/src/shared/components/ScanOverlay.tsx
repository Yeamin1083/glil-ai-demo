import { Bot, Check, Layers, ShieldCheck, Sparkles } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import { useObjectUrl } from '@/shared/useObjectUrl'

interface Props {
  file: File
  title: string
  steps: string[]
}

const STEP_MS = 1400

export function ScanOverlay({ file, title, steps }: Props) {
  const url = useObjectUrl(file)
  const [active, setActive] = useState(0)

  useEffect(() => {
    const timer = window.setInterval(() => setActive((i) => Math.min(i + 1, steps.length - 1)), STEP_MS)
    return () => window.clearInterval(timer)
  }, [steps.length])

  const progress = Math.min(Math.round(((active + 1) / steps.length) * 100), 98)

  return (
    <Card className="grid items-center gap-8 p-6 md:grid-cols-[1.1fr_minmax(320px,0.9fr)] border-border/80 shadow-lg" aria-live="polite" aria-busy="true">
      {/* Document Scanner Viewport */}
      <div className="relative isolate h-[52vh] overflow-hidden rounded-xl border border-slate-300 bg-slate-900 md:h-[min(68vh,680px)] shadow-inner">
        {file.type === 'application/pdf' ? (
          <iframe
            src={url ? `${url}#toolbar=0&navpanes=0` : undefined}
            title="Document being processed"
            tabIndex={-1}
            className="pointer-events-none size-full opacity-80 filter contrast-125"
          />
        ) : (
          <img src={url || undefined} alt="Document being processed" className="size-full object-contain opacity-80" />
        )}

        {/* Laser Scanner Animation */}
        <div className="scan-beam" aria-hidden="true" />
        <div className="scan-grid" aria-hidden="true" />

        {/* High-tech HUD Overlay Elements */}
        <div className="absolute top-4 left-4 flex items-center gap-2 rounded-md bg-slate-950/80 px-2.5 py-1 text-[11px] font-mono text-emerald-400 backdrop-blur border border-emerald-500/30">
          <span className="size-2 rounded-full bg-emerald-400 animate-ping" />
          <span>Reading the document…</span>
        </div>

        <div className="absolute bottom-4 right-4 rounded-md bg-slate-950/80 px-2.5 py-1 text-[11px] font-mono text-slate-300 backdrop-blur border border-slate-700">
          File: {file.name} ({(file.size / 1024).toFixed(0)} KB)
        </div>
      </div>

      {/* AI Telemetry & Pipeline */}
      <div className="pr-4 space-y-6">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Badge className="bg-[var(--glil-orange)] text-white gap-1 hover:bg-[var(--glil-orange)]">
              <Sparkles className="size-3" /> ACPS AI
            </Badge>
            <span className="text-xs font-mono text-muted-foreground">{progress}% Complete</span>
          </div>

          <h2 className="text-2xl font-bold tracking-tight text-foreground shimmer-text">{title}</h2>
          <p className="text-xs text-muted-foreground mt-1">
            This only takes a few seconds.
          </p>

          {/* Progress Line */}
          <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full bg-gradient-to-r from-[var(--glil-orange)] via-indigo-500 to-emerald-500 transition-all duration-700"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* 3 Specialized Subsystems Status */}
        <div className="grid grid-cols-3 gap-2">
          <div className="rounded-lg border bg-muted/40 p-2.5 text-center">
            <div className="flex justify-center mb-1">
              <Bot className="size-4 text-[var(--glil-orange)]" />
            </div>
            <div className="text-[11px] font-semibold">Reading</div>
            <div className="text-[10px] text-emerald-600 font-medium">Working</div>
          </div>

          <div className="rounded-lg border bg-muted/40 p-2.5 text-center">
            <div className="flex justify-center mb-1">
              <Layers className="size-4 text-indigo-600" />
            </div>
            <div className="text-[11px] font-semibold">Calculating</div>
            <div className="text-[10px] text-muted-foreground font-medium">Ready</div>
          </div>

          <div className="rounded-lg border bg-muted/40 p-2.5 text-center">
            <div className="flex justify-center mb-1">
              <ShieldCheck className="size-4 text-emerald-600" />
            </div>
            <div className="text-[11px] font-semibold">Checking</div>
            <div className="text-[10px] text-muted-foreground font-medium">Ready</div>
          </div>
        </div>

        {/* Real-time Checklist */}
        <ol className="grid gap-2.5 text-xs font-medium">
          {steps.map((step, i) => (
            <li
              key={step}
              className={cn(
                'flex items-center gap-3 rounded-md px-3 py-2 transition-all',
                i < active && 'bg-emerald-50/70 text-emerald-900 border border-emerald-100',
                i === active && 'bg-muted text-foreground font-semibold border shadow-2xs',
                i > active && 'text-muted-foreground opacity-60',
              )}
            >
              <span
                className={cn(
                  'grid size-5 shrink-0 place-items-center rounded-full text-[10px] border',
                  i < active && 'border-emerald-500 bg-emerald-500 text-white',
                  i === active && 'border-[var(--glil-orange)] text-[var(--glil-orange)] animate-spin border-t-transparent',
                  i > active && 'border-muted-foreground/30 text-muted-foreground',
                )}
                aria-hidden="true"
              >
                {i < active ? <Check className="size-3 stroke-[3]" /> : i + 1}
              </span>
              <span>{step}</span>
            </li>
          ))}
        </ol>
      </div>
    </Card>
  )
}
