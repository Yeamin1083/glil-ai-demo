import { AlertTriangle, RefreshCw, Sparkles, X } from 'lucide-react'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { cn } from '@/lib/utils'
import { SETTLEMENT_OPTIONS, STATUS, STATUS_LABEL, STATUS_TONE, TONE_TEXT } from '@/shared/constants'
import { bdt } from '@/shared/format'
import { regretReasons } from '../decision'
import type { Review, Status } from '../types'

interface Props {
  review: Review
  stale: boolean
  busy: boolean
  onRecheck: () => void
  onDecide: (status: Status, remarks: string) => void
}

// the AI's settlement, with a picker so the claim officer can change it with their own remarks
export function DecisionPanel({ review, stale, busy, onRecheck, onDecide }: Props) {
  const [pick, setPick] = useState<Status | null>(null)
  const [note, setNote] = useState<string | null>(null)

  const selected = pick ?? review.status
  const remarks = note ?? review.officer_remarks
  const changesAi = selected !== review.ai_status
  const dirty = selected !== review.status || remarks !== review.officer_remarks
  const canApply = dirty && !busy && !stale && (!changesAi || remarks.trim() !== '')

  return (
    <section className="grid gap-4 rounded-xl border bg-muted/30 p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Settlement</h3>
        <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <Sparkles className="size-3.5 text-[var(--glil-orange)]" /> AI suggests
          <strong className={cn('text-sm', TONE_TEXT[STATUS_TONE[review.ai_status]])}>
            {STATUS_LABEL[review.ai_status]}
          </strong>
        </span>
      </div>

      {stale && (
        <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-amber-300 bg-amber-50 px-3 py-2 text-xs text-amber-900">
          <span className="flex items-center gap-2 font-medium">
            <AlertTriangle className="size-4" /> You changed the details after the AI checked. Check again so the
            decision matches.
          </span>
          <Button size="sm" variant="outline" className="gap-1.5" onClick={onRecheck} disabled={busy}>
            <RefreshCw className="size-3.5" /> Update decision
          </Button>
        </div>
      )}

      <p className="text-xs leading-relaxed text-muted-foreground">{review.summary}</p>

      {review.ai_status === STATUS.REGRETTED && (
        <ul className="grid gap-1.5">
          {regretReasons(review).map((r) => (
            <li
              key={r.title}
              className="flex items-start gap-2 rounded-lg border border-red-200 bg-white/80 p-2.5 text-xs text-red-950"
            >
              <X className="mt-0.5 size-3.5 shrink-0 text-red-600" />
              <div>
                <div className="font-medium">{r.title}</div>
                {r.note && <div className="text-[11px] text-red-900/70">{r.note}</div>}
              </div>
            </li>
          ))}
        </ul>
      )}
      {review.ai_status === STATUS.DOCUMENTS_REQUIRED && review.required_documents && (
        <p className="rounded-lg border border-amber-200 bg-white/80 p-2.5 text-xs font-medium text-amber-950">
          {review.required_documents}
        </p>
      )}

      <div className="grid gap-2">
        <div className="text-xs font-semibold text-muted-foreground">Your decision</div>
        <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="Settlement decision">
          {SETTLEMENT_OPTIONS.map((o) => (
            <button
              key={o.status}
              type="button"
              role="radio"
              aria-checked={selected === o.status}
              onClick={() => setPick(o.status)}
              className={cn(
                'rounded-full border px-4 py-1.5 text-xs font-semibold transition-colors cursor-pointer',
                selected === o.status
                  ? 'border-[var(--glil-orange)] bg-[var(--glil-orange)] text-white'
                  : 'border-slate-300 bg-white text-slate-700 hover:bg-slate-50',
              )}
            >
              {o.label}
            </button>
          ))}
        </div>
        <Textarea
          value={remarks}
          onChange={(e) => setNote(e.target.value)}
          placeholder={changesAi ? 'Your remarks (needed to change the AI decision)' : 'Your remarks (optional)'}
          className="min-h-16 bg-white text-xs"
        />
        <div className="flex flex-wrap items-center justify-between gap-2">
          <span className="text-xs text-muted-foreground">
            We pay <strong className="text-sm text-foreground">{bdt(review.total_payable)}</strong>
            {changesAi && remarks.trim() === '' && (
              <span className="ml-3 text-amber-800">Add your remarks to change the decision.</span>
            )}
          </span>
          <Button size="sm" onClick={() => onDecide(selected, remarks.trim())} disabled={!canApply}>
            {busy ? 'Saving…' : 'Apply decision'}
          </Button>
        </div>
      </div>
    </section>
  )
}
