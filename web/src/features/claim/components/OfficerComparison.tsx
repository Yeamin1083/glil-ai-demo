import { Badge } from '@/components/ui/badge'
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { cn } from '@/lib/utils'
import { STATUS_TONE, TONE_TEXT } from '@/shared/constants'
import { bdt, humanize } from '@/shared/format'
import type { OfficerDecision, Review } from '../types'

// what the officer actually decided in ACPS, beside the AI's recommendation
export function OfficerComparison({ officer, review }: { officer: OfficerDecision; review: Review }) {
  const sameStatus = officer.status === review.status
  const samePayable = officer.payable_amount === review.total_payable
  const verdict = sameStatus ? (samePayable ? 'AI matches the officer' : 'Same decision, different payable') : 'AI decided differently'

  return (
    <Card>
      <CardHeader>
        <CardTitle>The officer's decision in ACPS</CardTitle>
        <CardDescription>This claim was also processed by hand. Here is what the officer decided.</CardDescription>
        <CardAction>
          <Badge
            variant="outline"
            className={sameStatus && samePayable ? 'border-emerald-200 bg-emerald-50 text-emerald-700' : 'border-amber-200 bg-amber-50 text-amber-700'}
          >
            {verdict}
          </Badge>
        </CardAction>
      </CardHeader>
      <CardContent className="grid gap-4">
        <div className="grid gap-3 md:grid-cols-2">
          <div className="rounded-lg border p-4">
            <p className="text-xs text-muted-foreground">Officer</p>
            <p className={cn('text-lg font-semibold', TONE_TEXT[STATUS_TONE[officer.status]])}>{humanize(officer.status)}</p>
            {officer.rejection_reason && <p className="text-sm font-medium">{humanize(officer.rejection_reason)}</p>}
            {officer.required_documents && <p className="text-sm">Asked for: {officer.required_documents}</p>}
            <p className="mt-1 text-sm text-muted-foreground">
              Payable {bdt(officer.payable_amount)} of {bdt(officer.claimed_amount)}
            </p>
          </div>
          <div className="ai-card rounded-lg border p-4">
            <p className="text-xs text-muted-foreground">AI</p>
            <p className={cn('text-lg font-semibold', TONE_TEXT[STATUS_TONE[review.status]])}>{humanize(review.status)}</p>
            {review.rejection_reason && <p className="text-sm font-medium">{humanize(review.rejection_reason)}</p>}
            {review.required_documents && <p className="text-sm">Asks for: {review.required_documents}</p>}
            <p className="mt-1 text-sm text-muted-foreground">
              Payable {bdt(review.total_payable)} of {bdt(review.total_claimed)}
            </p>
          </div>
        </div>

        {officer.expenses.length > 0 && (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Officer's expenses</TableHead>
                <TableHead className="text-right">Claimed</TableHead>
                <TableHead className="text-right">Deducted</TableHead>
                <TableHead className="text-right">Payable</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {officer.expenses.map((e) => (
                <TableRow key={e.category}>
                  <TableCell className="whitespace-normal">
                    <div className="font-medium">{humanize(e.category)}</div>
                    {e.remarks && <div className="text-xs text-amber-700">{e.remarks}</div>}
                  </TableCell>
                  <TableCell className="text-right">{bdt(e.claimed)}</TableCell>
                  <TableCell className={cn('text-right', e.deducted && 'text-red-600')}>
                    {e.deducted ? `−${bdt(e.deducted)}` : '—'}
                  </TableCell>
                  <TableCell className="text-right">{bdt(e.payable)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
        {(officer.reviewed_by || officer.decided_by) && (
          <p className="text-xs text-muted-foreground">
            {officer.reviewed_by && `Assigned officer: ${officer.reviewed_by}. `}
            {officer.decided_by && `Decided by: ${officer.decided_by}.`}
          </p>
        )}
      </CardContent>
    </Card>
  )
}
