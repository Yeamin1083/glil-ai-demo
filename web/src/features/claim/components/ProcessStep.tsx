import { Check, X } from 'lucide-react'
import type { CSSProperties } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardAction, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { cn } from '@/lib/utils'
import { Typewriter } from '@/shared/components/Typewriter'
import { AMOUNT_TOLERANCE_BDT, NAME_CHECK, STATUS_LABEL, STATUS_TONE, TONE_TEXT } from '@/shared/constants'
import { bdt, humanize } from '@/shared/format'
import type { OfficerDecision, Review } from '../types'
import { OfficerComparison } from './OfficerComparison'

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

// only compare with the officer when these documents are clearly that claim's
function sameClaim(officer: OfficerDecision, review: Review) {
  const samePatient = review.checks.find((c) => c.check === NAME_CHECK)?.passed ?? false
  const gap = Math.abs(officer.claimed_amount - review.total_claimed)
  return samePatient && gap <= Math.max(AMOUNT_TOLERANCE_BDT, officer.claimed_amount * 0.02)
}

export function ProcessStep(props: Props) {
  const { review, officerDecision, reviewedBy, canSignOff, busy, onBack, onSignOff } = props
  const failed = review.checks.filter((c) => !c.passed).length
  const tone = STATUS_TONE[review.status]

  return (
    <div className="grid gap-4">
      <Card className="ai-top" aria-live="polite">
        <CardContent className="grid gap-8 md:grid-cols-[1fr_auto]">
          <div>
            <p className="text-sm text-muted-foreground">The AI recommends</p>
            <p className={cn('land my-1.5 text-4xl font-bold tracking-tight', TONE_TEXT[tone])}>
              {STATUS_LABEL[review.status]}
            </p>
            {review.rejection_reason && <p className="mb-2 font-medium">{humanize(review.rejection_reason)}</p>}
            {review.required_documents && (
              <p className="mb-2 font-medium">Ask the member for: {review.required_documents}</p>
            )}
            <p className="max-w-[70ch] text-[15px] leading-relaxed">
              <Typewriter text={review.summary} delayMs={450} />
            </p>
          </div>
          <dl className="grid min-w-56 content-start gap-3 md:border-l md:pl-6">
            <div>
              <dt className="text-sm text-muted-foreground">Payable</dt>
              <dd className="text-3xl font-bold tracking-tight">{bdt(review.total_payable)}</dd>
            </div>
            <div>
              <dt className="text-sm text-muted-foreground">Claimed</dt>
              <dd className="text-lg font-semibold">{bdt(review.total_claimed)}</dd>
            </div>
            <div>
              <dt className="text-sm text-muted-foreground">OPD limit left after this claim</dt>
              <dd className="text-lg font-semibold">{bdt(review.limit_after)}</dd>
            </div>
          </dl>
        </CardContent>
      </Card>

      <div className="grid gap-4 lg:grid-cols-[1.4fr_1fr]">
        <Card>
          <CardHeader>
            <CardTitle>Processing</CardTitle>
            <CardDescription>Agent 2: deductions and plan limits per expense</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Expense</TableHead>
                  <TableHead className="text-right">Claimed</TableHead>
                  <TableHead className="text-right">Deducted</TableHead>
                  <TableHead className="text-right">Payable</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody className="stagger">
                {review.expenses.map((e, i) => (
                  <TableRow key={e.category} style={order(i)}>
                    <TableCell className="align-top whitespace-normal">
                      <div className="font-medium">{humanize(e.category)}</div>
                      {e.remarks.map((r) => (
                        <div key={r} className="text-xs text-amber-700">{r}</div>
                      ))}
                    </TableCell>
                    <TableCell className="text-right align-top">{bdt(e.claimed)}</TableCell>
                    <TableCell className={cn('text-right align-top', e.deducted && 'text-red-600')}>
                      {e.deducted ? `−${bdt(e.deducted)}` : '—'}
                    </TableCell>
                    <TableCell className="text-right align-top font-semibold">{bdt(e.payable)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Audit</CardTitle>
            <CardDescription>Agent 3: documents, dates, names and history</CardDescription>
            <CardAction>
              <Badge
                variant="outline"
                className={failed ? 'border-amber-200 bg-amber-50 text-amber-700' : 'border-emerald-200 bg-emerald-50 text-emerald-700'}
              >
                {failed ? `${failed} issue${failed > 1 ? 's' : ''}` : 'All clear'}
              </Badge>
            </CardAction>
          </CardHeader>
          <CardContent>
            <ul className="stagger grid gap-3">
              {review.checks.map((c, i) => (
                <li key={c.check} className="flex gap-2.5" style={order(i)}>
                  <span
                    className={cn(
                      'mt-0.5 grid size-5 shrink-0 place-items-center rounded-full border',
                      c.passed ? 'border-emerald-200 bg-emerald-50 text-emerald-700' : 'border-red-200 bg-red-50 text-red-600',
                    )}
                    aria-label={c.passed ? 'Passed' : 'Failed'}
                  >
                    {c.passed ? <Check className="size-3" /> : <X className="size-3" />}
                  </span>
                  <div className="text-sm">
                    <div className="font-medium">{c.check}</div>
                    <div className="text-muted-foreground">{c.detail}</div>
                  </div>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </div>

      {officerDecision &&
        (sameClaim(officerDecision, review) ? (
          <OfficerComparison officer={officerDecision} review={review} />
        ) : (
          <p className="text-sm text-muted-foreground">
            The officer's ACPS decision isn't shown: these documents have a different patient or amount from the
            member's sample claim.
          </p>
        ))}

      <Card>
        <CardHeader>
          <CardTitle>Post-audit</CardTitle>
          <CardDescription>
            Reviewed by {reviewedBy}.{' '}
            {review.single_step_approval
              ? `Payable is ${bdt(3000)} or less, so sign-off approves it in one step.`
              : review.status === 'SETTLED'
                ? 'After sign-off it goes to doctor approval.'
                : ''}
          </CardDescription>
        </CardHeader>
        <CardFooter className="justify-end gap-3">
          {!canSignOff && (
            <span className="mr-auto text-sm text-muted-foreground">Switch "Acting as" to the post-audit user to sign off.</span>
          )}
          <Button variant="outline" size="lg" onClick={onBack} disabled={busy}>
            Send back to review
          </Button>
          <Button size="lg" disabled={!canSignOff || busy} onClick={onSignOff}>
            {busy ? 'Posting to Oracle…' : 'Sign off and post to Oracle'}
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
}
