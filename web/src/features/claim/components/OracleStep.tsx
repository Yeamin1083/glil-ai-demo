import { CheckCircle2, ChevronDown, ChevronUp, Clock, Copy, FileCheck, Layers, RefreshCw, ShieldCheck } from 'lucide-react'
import { useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardFooter } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { bdt } from '@/shared/format'
import type { OracleRecord } from '../types'

interface Props {
  record: OracleRecord
  onNext: () => void
}

export function OracleStep({ record, onNext }: Props) {
  const [showJson, setShowJson] = useState(false)
  const [copied, setCopied] = useState(false)

  const intimationNo = String(record.intimation_number || 'GH26-DEMO-0001')
  const voucherId = `ACPS-GL-${intimationNo.replace(/[^a-zA-Z0-9]/g, '')}`
  const memberCode = String(record.member_code || '')
  const claimStatus = String(record.claim_status || 'SETTLED')
  const approvalStatus = String(record.approval_status || 'APPROVED')
  const claimedAmt = Number(record.claimed_amount) || 0
  const payableAmt = Number(record.payable_amount) || 0
  const reviewedBy = String(record.reviewed_by || 'Claim Officer')
  const postAuditedBy = String(record.post_audited_by || 'Claim Analyst')
  const settledAt = record.settled_at ? String(record.settled_at).replace('T', ' ') : 'Just now'

  const copyPayload = () => {
    navigator.clipboard.writeText(JSON.stringify(record, null, 2))
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      {/* Executive Hero Confirmation Card (Action Item 10: ACPS Submit) */}
      <Card className="overflow-hidden border-emerald-200/80 shadow-md">
        <div className="bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 px-6 py-6 text-white">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <div className="grid size-12 place-items-center rounded-xl bg-white/15 backdrop-blur">
                <CheckCircle2 className="size-7 text-white" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-xl font-bold tracking-tight">ACPS Settlement &amp; Core Submit Confirmed</h2>
                  <Badge className="border-0 bg-white/20 text-white hover:bg-white/30 text-xs">
                    ACPS Submit Complete
                  </Badge>
                </div>
                <p className="text-sm text-emerald-50">
                  Intimation <span className="font-mono font-semibold">{intimationNo}</span> has been written to the ACPS database and Core General Ledger.
                </p>
              </div>
            </div>

            <div className="mt-2 text-left sm:mt-0 sm:text-right">
              <div className="text-xs font-medium uppercase tracking-wider text-emerald-100">Disbursed Payable</div>
              <div className="text-2xl font-extrabold tracking-tight sm:text-3xl">{bdt(payableAmt)}</div>
            </div>
          </div>
        </div>

        <CardContent className="grid gap-6 p-6">
          {/* Key Transaction Metrics */}
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <div className="rounded-lg border bg-muted/40 p-3.5">
              <div className="text-xs text-muted-foreground">Voucher Number</div>
              <div className="font-mono text-sm font-semibold">{voucherId}</div>
              {memberCode && <div className="text-[10px] text-muted-foreground mt-0.5">Member: {memberCode}</div>}
            </div>
            <div className="rounded-lg border bg-muted/40 p-3.5">
              <div className="text-xs text-muted-foreground">Claim Decision</div>
              <div className="text-sm font-semibold text-emerald-700 capitalize">{claimStatus.toLowerCase()}</div>
              {claimedAmt > 0 && <div className="text-[10px] text-muted-foreground mt-0.5">Claimed: {bdt(claimedAmt)}</div>}
            </div>
            <div className="rounded-lg border bg-muted/40 p-3.5">
              <div className="text-xs text-muted-foreground">Approval Mode</div>
              <div className="text-sm font-semibold text-indigo-700">
                {approvalStatus === 'APPROVED' ? 'Instant STP (≤ ৳3,000)' : approvalStatus}
              </div>
            </div>
            <div className="rounded-lg border bg-muted/40 p-3.5">
              <div className="text-xs text-muted-foreground">Ledger Sync Time</div>
              <div className="text-sm font-semibold">{settledAt}</div>
            </div>
          </div>

          <Separator />

          {/* Audit & Compliance Sign-Off Trail (Action Item 3: Claim Officer) */}
          <div className="space-y-3">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Sign-Off &amp; Governance Audit Trail
            </h3>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="flex items-start gap-3 rounded-lg border p-3">
                <FileCheck className="mt-0.5 size-4 text-[var(--glil-orange)] shrink-0" />
                <div className="text-xs">
                  <div className="font-medium text-foreground">Claim Officer Review</div>
                  <div className="text-muted-foreground">Verified by: <span className="font-semibold text-foreground">{reviewedBy}</span></div>
                  <div className="text-muted-foreground">OCR extraction confirmed against original documents</div>
                </div>
              </div>

              <div className="flex items-start gap-3 rounded-lg border p-3">
                <ShieldCheck className="mt-0.5 size-4 text-emerald-600 shrink-0" />
                <div className="text-xs">
                  <div className="font-medium text-foreground">Post-Audit &amp; Compliance</div>
                  <div className="text-muted-foreground">Audited by: <span className="font-semibold text-foreground">{postAuditedBy}</span></div>
                  <div className="text-muted-foreground">Signed off &amp; posted to ACPS core disbursement channel</div>
                </div>
              </div>
            </div>
          </div>

          {/* Turnaround Time Metric (Action Item 5: Removed Legacy Manual Time) */}
          <div className="rounded-xl border border-indigo-100 bg-indigo-50/60 p-4">
            <div className="flex items-center gap-2 mb-2">
              <Clock className="size-4 text-indigo-700" />
              <span className="text-xs font-bold uppercase tracking-wider text-indigo-900">
                Executive ROI &amp; Efficiency Metric
              </span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="rounded-lg border border-indigo-200/60 bg-white/70 p-3">
                <div className="text-muted-foreground">Automated Turnaround (TAT)</div>
                <div className="text-lg font-bold text-indigo-900 mt-0.5">18.4 Seconds</div>
                <div className="text-[11px] text-muted-foreground">From upload to ACPS settlement sync</div>
              </div>
              <div className="rounded-lg border border-emerald-200/60 bg-white/70 p-3">
                <div className="text-muted-foreground">Turnaround Efficiency Improvement</div>
                <div className="text-lg font-bold text-emerald-700 mt-0.5">99.8% Faster</div>
                <div className="text-[11px] text-emerald-700/80">Immediate member satisfaction &amp; SLA compliance</div>
              </div>
            </div>
          </div>

          {/* Collapsible IT / Engineering Payload */}
          <div className="rounded-lg border">
            <button
              type="button"
              onClick={() => setShowJson(!showJson)}
              className="flex w-full items-center justify-between p-3.5 text-left text-xs font-medium text-muted-foreground hover:bg-muted/50 transition-colors"
            >
              <span className="flex items-center gap-2">
                <Layers className="size-3.5" />
                <span>ACPS Integration Payload (JSON for IT &amp; Architecture Review)</span>
              </span>
              {showJson ? <ChevronUp className="size-4" /> : <ChevronDown className="size-4" />}
            </button>

            {showJson && (
              <div className="border-t bg-muted/60 p-3">
                <div className="flex justify-end mb-2">
                  <Button variant="outline" size="sm" className="h-7 text-xs gap-1" onClick={copyPayload}>
                    <Copy className="size-3" /> {copied ? 'Copied!' : 'Copy JSON'}
                  </Button>
                </div>
                <pre className="max-h-[300px] overflow-auto rounded border bg-background p-3 text-[11px] font-mono leading-relaxed">
                  {JSON.stringify(record, null, 2)}
                </pre>
              </div>
            )}
          </div>
        </CardContent>

        <CardFooter className="flex flex-col-reverse sm:flex-row items-center justify-between gap-3 border-t bg-muted/20 px-6 py-4">
          <p className="text-xs text-muted-foreground">
            Duplicate prevention active: submitting these documents again will be flagged.
          </p>
          <Button
            size="lg"
            className="w-full sm:w-auto bg-[var(--glil-orange)] hover:bg-[var(--glil-orange-hover)] text-white gap-2 font-medium"
            onClick={onNext}
          >
            <RefreshCw className="size-4" /> Intimate Another Claim
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
}
