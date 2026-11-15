import { Check, Clock, Eye } from 'lucide-react'
import { useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { bdt } from '@/shared/format'
import type { Member } from '../claim/types'
import { loadTestClaimFile, TEST_CLAIMS, type TestClaim } from '../claim/testClaims'

export interface HrPendingClaim extends TestClaim {
  employeeName: string
}

interface Props {
  members: Member[]
  onApproveAndProceed: (claim: HrPendingClaim, file: File) => void
  onBackToClaims: () => void
}

export function HrPendingClaimsPage({ members, onApproveAndProceed, onBackToClaims }: Props) {
  const [approvingId, setApprovingId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const claims: HrPendingClaim[] = TEST_CLAIMS.map((t) => ({
    ...t,
    employeeName: members.find((m) => m.code === t.memberCode)?.name ?? 'Member not loaded',
  }))
  const total = claims.reduce((sum, c) => sum + c.claimed, 0)

  const approve = async (claim: HrPendingClaim) => {
    setApprovingId(claim.number)
    setError(null)
    try {
      onApproveAndProceed(claim, await loadTestClaimFile(claim))
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setApprovingId(null)
    }
  }

  return (
    <div className="space-y-6">
      <Card className="border-border shadow-sm overflow-hidden py-0 gap-0">
        <div className="bg-white p-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1.5">
              <Badge className="bg-[var(--glil-orange)] text-white hover:bg-[var(--glil-orange)] text-xs font-semibold">
                HR Portal
              </Badge>
              <h1 className="text-2xl font-bold tracking-tight text-slate-900">Claims Waiting for HR</h1>
              <p className="text-xs text-slate-600 max-w-2xl leading-relaxed">
                Check your employees&apos; claims. Once you approve one, it goes straight to a Claim Officer.
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={onBackToClaims}
              className="border-slate-300 bg-white hover:bg-slate-50 text-slate-800 text-xs cursor-pointer"
            >
              Start a New Claim
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 p-5 bg-slate-50/70 border-t">
          <div className="rounded-xl border bg-white p-3.5 shadow-2xs">
            <div className="text-xs text-muted-foreground font-medium">Claims Waiting</div>
            <div className="text-2xl font-bold text-slate-900 mt-0.5">{claims.length}</div>
            <div className="text-[11px] text-amber-600 font-medium mt-0.5">Waiting for you</div>
          </div>
          <div className="rounded-xl border bg-white p-3.5 shadow-2xs">
            <div className="text-xs text-muted-foreground font-medium">Total Claimed</div>
            <div className="text-2xl font-bold text-emerald-700 mt-0.5">{bdt(total)}</div>
            <div className="text-[11px] text-muted-foreground mt-0.5">All claims together</div>
          </div>
          <div className="rounded-xl border bg-white p-3.5 shadow-2xs">
            <div className="text-xs text-muted-foreground font-medium">Time to Decide</div>
            <div className="text-2xl font-bold text-slate-900 mt-0.5">&lt; 30s</div>
            <div className="text-[11px] text-emerald-600 font-medium mt-0.5">After you approve</div>
          </div>
        </div>
      </Card>

      <Card className="border-border shadow-sm">
        <CardHeader className="glil-card-header rounded-t-xl pb-4">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg font-bold tracking-tight">Employee Claims</CardTitle>
              <CardDescription className="text-xs text-muted-foreground mt-0.5">
                Click &quot;Approve &amp; Send to Officer&quot; to read the documents and check the claim.
              </CardDescription>
            </div>
            <Badge variant="outline" className="border-amber-300 bg-amber-50 text-amber-800 text-xs font-semibold gap-1">
              <Clock className="size-3" /> {claims.length} waiting
            </Badge>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          {error && <div className="border-b bg-red-50 px-6 py-2 text-xs text-red-700">{error}</div>}
          <Table>
            <TableHeader className="bg-slate-50/80">
              <TableRow className="text-xs">
                <TableHead className="pl-6 font-semibold">Employee</TableHead>
                <TableHead className="font-semibold">Claim</TableHead>
                <TableHead className="text-right font-semibold">Claimed (৳)</TableHead>
                <TableHead className="font-semibold">What ACPS decided</TableHead>
                <TableHead className="pr-6 text-right font-semibold">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {claims.map((claim) => (
                <TableRow key={claim.number} className="text-xs hover:bg-slate-50/50">
                  <TableCell className="pl-6 py-4 align-top">
                    <div className="font-bold text-slate-900 text-sm">{claim.employeeName}</div>
                    <div className="text-[11px] text-muted-foreground">{claim.memberCode}</div>
                  </TableCell>
                  <TableCell className="py-4 align-top">
                    <div className="font-mono text-[11px] text-[var(--glil-orange)] font-semibold">{claim.number}</div>
                    <div className="font-medium text-slate-800">{claim.label}</div>
                  </TableCell>
                  <TableCell className="py-4 align-top text-right font-extrabold text-slate-900 text-sm tabular-nums">
                    {bdt(claim.claimed)}
                  </TableCell>
                  <TableCell className="py-4 align-top">
                    <div className="font-medium text-slate-800">{claim.result}</div>
                    <div className="text-[11px] text-muted-foreground">Paid {bdt(claim.paid)}</div>
                  </TableCell>
                  <TableCell className="pr-6 py-4 align-top text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Button variant="ghost" size="sm" asChild className="h-8 text-xs text-slate-600 hover:text-slate-900">
                        <a href={`/samples/claims/${claim.number}.pdf`} target="_blank" rel="noopener noreferrer">
                          <Eye className="size-3.5 mr-1" /> View
                        </a>
                      </Button>
                      <Button
                        size="sm"
                        disabled={approvingId !== null}
                        onClick={() => approve(claim)}
                        className="h-8 bg-[var(--glil-orange)] hover:bg-[var(--glil-orange-hover)] text-white text-xs font-semibold gap-1.5 shadow-2xs cursor-pointer"
                      >
                        {approvingId === claim.number ? (
                          'Loading…'
                        ) : (
                          <>
                            <Check className="size-3.5" />
                            <span>Approve &amp; Send to Officer</span>
                          </>
                        )}
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
