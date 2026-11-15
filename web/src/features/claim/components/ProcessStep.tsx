import { AlertTriangle, ArrowLeft, Check, CheckCircle2, FileCheck, Info, Send, ShieldCheck, Sparkles, X, Zap } from 'lucide-react'
import { useState, type CSSProperties } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableFooter, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { cn } from '@/lib/utils'
import { Typewriter } from '@/shared/components/Typewriter'
import { AGENT, AMOUNT_TOLERANCE_BDT, NAME_CHECK, STATUS_LABEL, STATUS_TONE, TONE_TEXT } from '@/shared/constants'
import { bdt, humanize } from '@/shared/format'
import type { OfficerDecision, Review } from '../types'
import { OfficerComparison } from './OfficerComparison'
import { LimitCells, LimitGroupHead, LimitHeads } from './PlanLimit'

interface Props {
  review: Review
  officerDecision: OfficerDecision | null
  reviewedBy: string
  canSignOff: boolean
  busy: boolean
  onBack: () => void
  onSignOff: () => void
}

const order = (i: number) => ({ '--i': i }) as CSSProperties

function sameClaim(officer: OfficerDecision, review: Review) {
  const samePatient = review.checks.find((c) => c.check === NAME_CHECK)?.passed ?? false
  const gap = Math.abs(officer.claimed_amount - review.total_claimed)
  return samePatient && gap <= Math.max(AMOUNT_TOLERANCE_BDT, officer.claimed_amount * 0.02)
}

export function ProcessStep(props: Props) {
  const { review, officerDecision, reviewedBy, canSignOff, busy, onBack, onSignOff } = props
  const [confirming, setConfirming] = useState(false)
  const failedChecks = review.checks.filter((c) => !c.passed)
  const failed = failedChecks.length
  const tone = STATUS_TONE[review.status]
  // every reason once: the main reason, each failed check, and remarks that say something new
  const mainReason = review.rejection_reason ? humanize(review.rejection_reason) : null
  const regretReasons: { title: string; note?: string }[] = []
  // ACPS's bare "Others" says nothing; the failed checks below explain it
  if (mainReason && !(mainReason === 'Others' && failedChecks.length)) regretReasons.push({ title: mainReason })
  failedChecks.forEach((c) => regretReasons.push({ title: `Failed check: ${c.check}`, note: c.detail }))
  const remarks = new Map<string, string[]>()
  review.expenses.forEach((e) =>
    e.remarks.forEach((r) => {
      const text = r.replace(/^claim regretted:\s*/i, '')
      if (mainReason && text.toLowerCase() === mainReason.toLowerCase()) return
      remarks.set(text, [...(remarks.get(text) ?? []), humanize(e.category)])
    }),
  )
  remarks.forEach((cats, text) => regretReasons.push({ title: text, note: `Applies to: ${cats.join(', ')}` }))
  if (!regretReasons.length) regretReasons.push({ title: 'Something does not match the plan.' })
  const deductionsTotal = review.total_claimed - review.total_payable

  return (
    <div className="grid gap-6">
      {/* Executive Decision Banner */}
      <Card className="ai-top border-border/80 shadow-md overflow-hidden" aria-live="polite">
        <div className="p-6">
          <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6">
            <div className="space-y-4 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="outline" className="border-orange-200 bg-orange-50 text-[var(--glil-orange)] text-xs font-semibold gap-1">
                  <Sparkles className="size-3" /> AI Decision
                </Badge>
                {review.single_step_approval && (
                  <Badge className="bg-emerald-600 text-white text-xs font-semibold gap-1 hover:bg-emerald-600">
                    <Zap className="size-3" /> Approved right away (≤ ৳3,000)
                  </Badge>
                )}
              </div>

              <div>
                <p className="text-xs uppercase tracking-wider font-semibold text-muted-foreground">Suggested Decision</p>
                <div className="flex items-center gap-3 mt-1">
                  <span className={cn('text-3xl sm:text-4xl font-extrabold tracking-tight', TONE_TEXT[tone])}>
                    {STATUS_LABEL[review.status]}
                  </span>
                  {review.status === 'SETTLED' ? (
                    <Badge className="bg-emerald-100 text-emerald-800 border-emerald-300 text-xs">Can be paid</Badge>
                  ) : review.status === 'DOCUMENTS REQUIRED' ? (
                    <Badge className="bg-amber-100 text-amber-800 border-amber-300 text-xs">Documents needed</Badge>
                  ) : (
                    <Badge className="bg-red-100 text-red-800 border-red-300 text-xs">Cannot be paid</Badge>
                  )}
                </div>
              </div>

              {/* Action Item 4: Show All Reasons for Settlement clearly at the top after suggested status */}
              {review.status === 'SETTLED' && (
                <div className="rounded-xl border border-emerald-200 bg-emerald-50/70 p-4 text-xs space-y-2.5 shadow-2xs">
                  <div className="flex items-center gap-2 font-bold text-emerald-900 text-sm">
                    <CheckCircle2 className="size-4 text-emerald-600" />
                    <span>Why we can pay:</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-emerald-950 font-medium pt-1">
                    <div className="flex items-start gap-2 bg-white/80 rounded-lg p-2.5 border border-emerald-200/70 shadow-2xs">
                      <Check className="size-3.5 text-emerald-600 shrink-0 mt-0.5" />
                      <span><strong>Plan is active:</strong> The member is covered for these dates.</span>
                    </div>
                    <div className="flex items-start gap-2 bg-white/80 rounded-lg p-2.5 border border-emerald-200/70 shadow-2xs">
                      <Check className="size-3.5 text-emerald-600 shrink-0 mt-0.5" />
                      <span><strong>Right patient:</strong> The name on the bills matches the member.</span>
                    </div>
                    <div className="flex items-start gap-2 bg-white/80 rounded-lg p-2.5 border border-emerald-200/70 shadow-2xs">
                      <Check className="size-3.5 text-emerald-600 shrink-0 mt-0.5" />
                      <span><strong>On time:</strong> Sent within 60 days of treatment.</span>
                    </div>
                    <div className="flex items-start gap-2 bg-white/80 rounded-lg p-2.5 border border-emerald-200/70 shadow-2xs">
                      <Check className="size-3.5 text-emerald-600 shrink-0 mt-0.5" />
                      <span><strong>Bills look right:</strong> Prescription, receipts and totals match.</span>
                    </div>
                    <div className="flex items-start gap-2 bg-white/80 rounded-lg p-2.5 border border-emerald-200/70 shadow-2xs">
                      <Check className="size-3.5 text-emerald-600 shrink-0 mt-0.5" />
                      <span><strong>Limit available:</strong> Within the limit left ({bdt(review.limit_after)} left).</span>
                    </div>
                    <div className="flex items-start gap-2 bg-white/80 rounded-lg p-2.5 border border-emerald-200/70 shadow-2xs">
                      <Check className="size-3.5 text-emerald-600 shrink-0 mt-0.5" />
                      <span><strong>No duplicates:</strong> No matching past claims found.</span>
                    </div>
                  </div>
                </div>
              )}

              {review.status === 'REGRETTED' && (
                <div className="rounded-xl border border-red-200 bg-red-50/70 p-4 text-xs space-y-2 shadow-2xs">
                  <div className="flex items-center gap-2 font-bold text-red-900 text-sm">
                    <AlertTriangle className="size-4 text-red-600" />
                    <span>Why we can&apos;t pay ({regretReasons.length}):</span>
                  </div>
                  <ul className="grid gap-2">
                    {regretReasons.map((r) => (
                      <li key={r.title} className="flex items-start gap-2 bg-white/80 rounded-lg p-3 border border-red-200 text-red-950 font-medium">
                        <X className="size-3.5 text-red-600 shrink-0 mt-0.5" />
                        <div>
                          <div>{r.title}</div>
                          {r.note && <div className="text-[11px] font-normal text-red-900/70 mt-0.5">{r.note}</div>}
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {review.status === 'DOCUMENTS REQUIRED' && (
                <div className="rounded-xl border border-amber-200 bg-amber-50/70 p-4 text-xs space-y-2 shadow-2xs">
                  <div className="flex items-center gap-2 font-bold text-amber-900 text-sm">
                    <Info className="size-4 text-amber-600" />
                    <span>Why we need more documents:</span>
                  </div>
                  <div className="bg-white/80 rounded-lg p-3 border border-amber-200 text-amber-950 font-medium">
                    {review.required_documents || 'The prescription or original receipt is missing or unclear.'}
                  </div>
                </div>
              )}

              <div className="rounded-xl border bg-gradient-to-r from-muted/40 to-muted/20 p-4 text-xs leading-relaxed text-muted-foreground">
                <span className="font-semibold text-foreground block mb-1">Summary:</span>
                <Typewriter text={review.summary} delayMs={300} />
              </div>
            </div>

            {/* Financial Totals Column */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-1 gap-3 lg:w-72 shrink-0 border-t lg:border-t-0 lg:border-l lg:pl-6 pt-4 lg:pt-0">
              <div className="rounded-lg border bg-emerald-50/50 border-emerald-200/80 p-3.5">
                <div className="text-xs font-semibold uppercase tracking-wider text-emerald-800">We Pay</div>
                <div className="text-2xl sm:text-3xl font-extrabold text-emerald-700 tracking-tight mt-0.5">
                  {bdt(review.total_payable)}
                </div>
                <div className="text-[11px] text-emerald-700/80 mt-0.5">Paid to the member</div>
              </div>

              <div className="rounded-lg border bg-muted/40 p-3">
                <div className="text-xs text-muted-foreground">Total Claimed</div>
                <div className="text-lg font-bold text-foreground mt-0.5">{bdt(review.total_claimed)}</div>
                <div className="text-[11px] text-muted-foreground">Total on the bills</div>
              </div>

              <div className="rounded-lg border bg-muted/40 p-3">
                <div className="text-xs text-muted-foreground">Not Covered</div>
                <div className={cn('text-lg font-bold mt-0.5', deductionsTotal > 0 ? 'text-red-600' : 'text-muted-foreground')}>
                  {deductionsTotal > 0 ? `−${bdt(deductionsTotal)}` : '৳0'}
                </div>
                <div className="text-[11px] text-muted-foreground">Over the limit or not covered</div>
              </div>

              <div className="rounded-lg border bg-muted/40 p-3">
                <div className="text-xs text-muted-foreground">Limit Left After This Claim</div>
                <div className="text-lg font-bold text-foreground mt-0.5">{bdt(review.limit_after)}</div>
                <div className="text-[11px] text-muted-foreground">Left to use this year</div>
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* Side-by-Side Benchmark (when historic sample available) */}
      {officerDecision &&
        (sameClaim(officerDecision, review) ? (
          <OfficerComparison officer={officerDecision} review={review} />
        ) : (
          <div className="rounded-lg border bg-muted/40 p-3 text-xs text-muted-foreground">
            No comparison is shown, because this claim has a different patient or amount than the saved sample.
          </div>
        ))}

      {/* Payout Breakdown & 6-Point Policy Cards */}
      <div className="grid gap-6 lg:grid-cols-[1.3fr_0.9fr]">
        {/* Payout Breakdown Table */}
        <Card className="border-border/80 shadow-sm">
          <CardHeader className="glil-card-header rounded-t-xl pb-3">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base font-bold tracking-tight">Payout Breakdown</CardTitle>
                <CardDescription className="text-xs text-muted-foreground">
                  {AGENT.ADJUDICATION}: each item, after plan limits
                </CardDescription>
              </div>
              <Badge variant="outline" className="text-xs font-mono">Plan rules</Badge>
            </div>
          </CardHeader>
          <CardContent className="pt-4">
            <div className="overflow-hidden rounded-lg border">
              <Table>
                <TableHeader className="bg-muted/50">
                  <TableRow className="hover:bg-transparent">
                    <TableHead rowSpan={2} className="pl-3 text-xs font-semibold">Expense</TableHead>
                    <LimitGroupHead />
                    <TableHead rowSpan={2} className="text-right text-xs font-semibold">Claimed</TableHead>
                    <TableHead rowSpan={2} className="text-right text-xs font-semibold">Deducted</TableHead>
                    <TableHead rowSpan={2} className="text-right text-xs font-semibold">Payable</TableHead>
                    <TableHead rowSpan={2} className="pr-3 pl-4 text-xs font-semibold">Remarks</TableHead>
                  </TableRow>
                  <TableRow className="hover:bg-transparent">
                    <LimitHeads />
                  </TableRow>
                </TableHeader>
                <TableBody className="stagger">
                  {review.expenses.map((e, i) => (
                    <TableRow key={e.category} style={order(i)} className="text-xs hover:bg-muted/20">
                      <TableCell className="pl-3 align-top font-semibold">{humanize(e.category)}</TableCell>
                      <LimitCells info={e} />
                      <TableCell className="text-right align-top tabular-nums">{bdt(e.claimed)}</TableCell>
                      <TableCell className={cn('text-right align-top tabular-nums font-medium', e.deducted ? 'text-red-600' : 'text-muted-foreground')}>
                        {e.deducted ? `−${bdt(e.deducted)}` : '—'}
                      </TableCell>
                      <TableCell className="text-right align-top font-bold tabular-nums text-foreground">{bdt(e.payable)}</TableCell>
                      <TableCell className="max-w-64 pr-3 pl-4 align-top text-[11px] whitespace-normal">
                        {e.remarks.length ? (
                          <ul className="grid gap-1 text-amber-800">
                            {e.remarks.map((r) => (
                              <li key={r}>• {r}</li>
                            ))}
                          </ul>
                        ) : (
                          <span className="text-muted-foreground">Approved per bill</span>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
                <TableFooter className="bg-muted/50">
                  <TableRow className="hover:bg-transparent text-xs font-bold">
                    <TableCell className="pl-3" colSpan={4}>Total</TableCell>
                    <TableCell className="text-right tabular-nums">{bdt(review.total_claimed)}</TableCell>
                    <TableCell className="text-right text-red-600 tabular-nums">
                      {deductionsTotal > 0 ? `−${bdt(deductionsTotal)}` : '—'}
                    </TableCell>
                    <TableCell className="text-right font-extrabold text-sm tabular-nums text-emerald-700">{bdt(review.total_payable)}</TableCell>
                    <TableCell />
                  </TableRow>
                </TableFooter>
              </Table>
            </div>
          </CardContent>
        </Card>

        {/* 6-Point Compliance & Policy Shield */}
        <Card className="border-border/80 shadow-sm">
          <CardHeader className="glil-card-header rounded-t-xl pb-3">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base font-bold tracking-tight">Policy Checks</CardTitle>
                <CardDescription className="text-xs text-muted-foreground">
                  {AGENT.AUDIT}: 6 automatic checks
                </CardDescription>
              </div>
              <Badge
                variant="outline"
                className={cn(
                  'text-xs font-semibold gap-1',
                  failed ? 'border-amber-300 bg-amber-50 text-amber-800' : 'border-emerald-300 bg-emerald-50 text-emerald-800'
                )}
              >
                {failed ? <AlertTriangle className="size-3" /> : <ShieldCheck className="size-3" />}
                {failed ? `${failed} Issue${failed > 1 ? 's' : ''} Found` : 'All 6 Checks Passed'}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="pt-4">
            <ul className="stagger grid gap-3">
              {review.checks.map((c, i) => (
                <li
                  key={c.check}
                  className={cn(
                    'flex items-start gap-3 rounded-lg border p-3 transition-colors',
                    c.passed ? 'bg-muted/20 border-border' : 'bg-red-50/40 border-red-200'
                  )}
                  style={order(i)}
                >
                  <span
                    className={cn(
                      'mt-0.5 grid size-5 shrink-0 place-items-center rounded-full text-xs font-bold',
                      c.passed ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700',
                    )}
                    aria-label={c.passed ? 'Passed' : 'Failed'}
                  >
                    {c.passed ? <Check className="size-3.5 stroke-[3]" /> : <X className="size-3.5 stroke-[3]" />}
                  </span>
                  <div className="text-xs">
                    <div className="font-semibold text-foreground">{c.check}</div>
                    <div className="text-muted-foreground mt-0.5">{c.detail}</div>
                  </div>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </div>

      {/* Final Sign-Off & Submission */}
      <Card className="border-border/80 shadow-sm">
        <CardHeader className="glil-card-header rounded-t-xl pb-3">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base font-bold tracking-tight">Final Approval</CardTitle>
              <CardDescription className="text-xs text-muted-foreground">
                Checked by Claim Officer <span className="font-semibold text-foreground">{reviewedBy}</span>.{' '}
                {review.single_step_approval
                  ? `The payout (${bdt(review.total_payable)}) can be approved in one step.`
                  : review.status === 'SETTLED'
                    ? 'A doctor needs to review this before payment.'
                    : ''}
              </CardDescription>
            </div>
            <Badge variant="outline" className="text-xs gap-1 border-indigo-200 bg-indigo-50 text-indigo-700">
              <FileCheck className="size-3" /> Ready to approve
            </Badge>
          </div>
        </CardHeader>

        <CardFooter className="flex flex-col sm:flex-row items-center justify-between gap-3 border-t bg-muted/20 px-6 py-4">
          <div className="text-xs text-muted-foreground">
            {!canSignOff ? (
              <span className="text-amber-800 font-semibold">
                To approve, pick Final Approver (Imran Chowdhury) from the user list at the top.
              </span>
            ) : (
              <span className="text-emerald-700 font-semibold">
                ✓ You are the Final Approver. You can approve now.
              </span>
            )}
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            <Button variant="outline" size="lg" onClick={onBack} disabled={busy} className="gap-2">
              <ArrowLeft className="size-4" /> Back
            </Button>
            <Button
              size="lg"
              disabled={!canSignOff || busy}
              onClick={() => (review.status === 'SETTLED' ? onSignOff() : setConfirming(true))}
              className="bg-[var(--glil-orange)] hover:bg-[var(--glil-orange-hover)] text-white gap-2 font-medium"
            >
              <Send className="size-4" />
              {busy ? 'Approving…' : 'Approve Claim'}
            </Button>
          </div>
        </CardFooter>
      </Card>

      <Dialog open={confirming} onOpenChange={setConfirming}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Save this claim anyway?</DialogTitle>
            <DialogDescription>
              The AI did not settle this claim. Its decision is &quot;{STATUS_LABEL[review.status]}&quot;. If you
              continue, the claim is saved to ACPS with that decision.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirming(false)}>
              Go back
            </Button>
            <Button
              className="bg-[var(--glil-orange)] hover:bg-[var(--glil-orange-hover)] text-white"
              onClick={() => {
                setConfirming(false)
                onSignOff()
              }}
            >
              Yes, save it
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
