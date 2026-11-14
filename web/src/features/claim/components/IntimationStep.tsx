import { ChevronRight, FileCheck, Sparkles, Upload, User, Zap } from 'lucide-react'
import { useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { bdt } from '@/shared/format'
import type { Member } from '../types'
import { MemberPicker } from './MemberPicker'

interface Props {
  members: Member[]
  busy: boolean
  onSubmit: (file: File, memberCode: string) => void
}

export function IntimationStep({ members, busy, onSubmit }: Props) {
  const [memberCode, setMemberCode] = useState('')
  const [file, setFile] = useState<File | null>(null)
  const [loadingSample, setLoadingSample] = useState(false)
  const member = members.find((m) => m.code === memberCode)

  // 1-Click Demo Scenario Loader for live presentation
  const loadScenario = async (targetCode: string, samplePdfPath: string, fileName: string) => {
    try {
      setLoadingSample(true)
      setMemberCode(targetCode)
      const res = await fetch(samplePdfPath)
      const blob = await res.blob()
      const demoFile = new File([blob], fileName, { type: 'application/pdf' })
      setFile(demoFile)
    } catch (err) {
      console.error('Failed to load sample demo file:', err)
    } finally {
      setLoadingSample(false)
    }
  }

  const limitUsed = member ? member.plan.opd_limit - member.limit_remaining : 0
  const limitPct = member ? Math.round((member.limit_remaining / member.plan.opd_limit) * 100) : 0

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      {/* Presentation Quick-Select Bar */}
      {/* <div className="rounded-xl border border-amber-200/80 bg-gradient-to-r from-amber-50/90 via-orange-50/70 to-amber-50/90 p-4 shadow-sm">
        <div className="flex items-center gap-2 mb-2">
          <Zap className="size-4 text-[var(--glil-orange)]" />
          <span className="text-xs font-bold uppercase tracking-wider text-amber-950">
            Presentation Demo Presets (1-Click Sample Pre-load)
          </span>
        </div>
        <p className="text-xs text-amber-900/80 mb-3">
          Click any scenario below to automatically load the member profile and verified sample claim documents for your demonstration:
        </p>
        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={loadingSample || busy}
            onClick={() => loadScenario('DEMO-7049-0001', '/samples/sample_claim_rahim.pdf', 'prescription_receipt_rahim.pdf')}
            className="h-8 border-amber-300 bg-white/80 hover:bg-white text-xs font-medium gap-1.5 shadow-2xs"
          >
            <Sparkles className="size-3 text-[var(--glil-orange)]" />
            <span>Scenario 1: Clean Claim (Rahim Uddin · Instant STP ≤ ৳3,000)</span>
          </Button>

          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={loadingSample || busy}
            onClick={() => loadScenario('DEMO-7049-0003', '/samples/sample_claim_tanvir.pdf', 'spectacles_bill_tanvir.pdf')}
            className="h-8 border-amber-300 bg-white/80 hover:bg-white text-xs font-medium gap-1.5 shadow-2xs"
          >
            <Sparkles className="size-3 text-indigo-600" />
            <span>Scenario 2: Plan Limit & Deductions (Tanvir Hasan · Optical Cap)</span>
          </Button>

          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={loadingSample || busy}
            onClick={() => loadScenario('DEMO-7049-0002', '/samples/sample_claim_rahim.pdf', 'spouse_claim_nasrin.pdf')}
            className="h-8 border-amber-300 bg-white/80 hover:bg-white text-xs font-medium gap-1.5 shadow-2xs"
          >
            <Sparkles className="size-3 text-emerald-600" />
            <span>Scenario 3: Low Limit Exhaustion (Nasrin Akter · Spouse)</span>
          </Button>
        </div>
      </div> */}

      {/* Main Intake Card */}
      <Card className="border-border shadow-sm">
        <CardHeader className="glil-card-header rounded-t-xl pb-4">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-xl font-bold tracking-tight">Intimate a Group Health Claim</CardTitle>
              <CardDescription className="text-xs text-muted-foreground mt-0.5">
                Step 1: Select the enrolled member and upload original claim documents. The Intake Agent will extract all clinical and financial fields.
              </CardDescription>
            </div>
            <Badge variant="outline" className="gap-1 border-orange-200 bg-orange-50 text-[var(--glil-orange)]">
              <Sparkles className="size-3" /> Agent 1: OCR Intake
            </Badge>
          </div>
        </CardHeader>

        <CardContent className="grid gap-6 pt-6">
          {/* Member Picker */}
          <div className="grid gap-2">
            <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
              <User className="size-3.5" /> Enrolled Group Member
            </Label>
            <MemberPicker members={members} value={memberCode} onChange={setMemberCode} />
          </div>

          {/* Member Profile & Policy Limit Visualizer */}
          {member && (
            <div className="rounded-xl border bg-gradient-to-b from-muted/30 to-muted/60 p-4 space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b pb-3">
                <div className="flex items-center gap-2.5">
                  <div className="grid size-9 place-items-center rounded-lg bg-[var(--glil-orange)] text-white font-semibold text-sm">
                    {member.name.charAt(0)}
                  </div>
                  <div>
                    <div className="font-semibold text-sm leading-tight">{member.name}</div>
                    <div className="text-xs text-muted-foreground font-mono">{member.code} · Relation: {member.relation.toLowerCase()}</div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Badge variant={member.is_active ? 'secondary' : 'destructive'} className="gap-1 text-xs">
                    <span className="size-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    {member.is_active ? 'Active Policy' : 'Inactive'}
                  </Badge>
                  <Badge variant="outline" className="text-xs font-medium">
                    Plan {member.plan.plan_name} (OPD {bdt(member.plan.opd_limit)})
                  </Badge>
                </div>
              </div>

              {/* Limit Gauge */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">Remaining OPD Limit</span>
                  <span className="font-semibold text-foreground">
                    <span className="text-emerald-700 font-bold">{bdt(member.limit_remaining)}</span> remaining ({limitPct}%)
                  </span>
                </div>
                <div className="h-2 w-full overflow-hidden rounded-full bg-slate-200">
                  <div
                    className="h-full rounded-full transition-all duration-500 bg-gradient-to-r from-emerald-500 to-teal-500"
                    style={{ width: `${limitPct}%` }}
                  />
                </div>
                <div className="flex justify-between text-[11px] text-muted-foreground">
                  <span>Policy Cycle: {member.plan.cycle_start} to {member.plan.cycle_end}</span>
                  <span>Used to date: {bdt(limitUsed)}</span>
                </div>
              </div>
            </div>
          )}

          {/* Claim Documents Upload Dropzone */}
          <div className="grid gap-2">
            <Label htmlFor="claim-documents" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center justify-between">
              <span>Original Claim Documents</span>
              <span className="text-[11px] font-normal lowercase text-muted-foreground">PDF, JPEG, or PNG</span>
            </Label>

            <label
              htmlFor="claim-documents"
              className={`flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed p-7 text-center transition-all ${
                file
                  ? 'border-emerald-300 bg-emerald-50/30'
                  : 'border-slate-300 hover:border-[var(--glil-orange)] hover:bg-orange-50/20'
              }`}
            >
              {file ? (
                <div className="flex flex-col items-center gap-1.5">
                  <div className="grid size-11 place-items-center rounded-full bg-emerald-100 text-emerald-700">
                    <FileCheck className="size-6" />
                  </div>
                  <span className="text-sm font-semibold text-emerald-950 mt-1">{file.name}</span>
                  <Badge variant="outline" className="border-emerald-300 text-emerald-800 text-[11px]">
                    {(file.size / 1024).toFixed(0)} KB · Ready for AI Intake
                  </Badge>
                  <span className="text-xs text-muted-foreground mt-1">Click to replace document</span>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-2">
                  <div className="grid size-11 place-items-center rounded-full bg-slate-100 text-slate-500">
                    <Upload className="size-5" />
                  </div>
                  <span className="text-sm font-semibold text-foreground">Upload Claim Files (Prescription & Receipts)</span>
                  <span className="text-xs text-muted-foreground max-w-md">
                    Drag and drop or browse printed medical receipts, money memos, and doctor prescriptions.
                  </span>
                  <div className="flex items-center gap-2 mt-2">
                    <Badge variant="outline" className="text-[10px] text-muted-foreground">Doctor Prescription</Badge>
                    <Badge variant="outline" className="text-[10px] text-muted-foreground">Cash Memo</Badge>
                    <Badge variant="outline" className="text-[10px] text-muted-foreground">Diagnostic Bill</Badge>
                  </div>
                </div>
              )}
              <input
                id="claim-documents"
                type="file"
                accept="application/pdf,image/jpeg,image/png,image/webp"
                className="sr-only"
                onChange={(e) => setFile(e.target.files?.[0] ?? null)}
              />
            </label>
          </div>
        </CardContent>

        <CardFooter className="flex items-center justify-between border-t bg-muted/20 px-6 py-4">
          <p className="text-xs text-muted-foreground">
            {!member ? 'Select a member to proceed.' : !file ? 'Attach claim document to proceed.' : 'Ready for AI intake.'}
          </p>
          <Button
            size="lg"
            disabled={!file || !member || busy || loadingSample}
            onClick={() => file && onSubmit(file, memberCode)}
            className="bg-[var(--glil-orange)] hover:bg-[var(--glil-orange-hover)] text-white gap-2 font-medium"
          >
            {busy ? 'Running AI Intake…' : 'Intimate Claim & Run AI Intake'} <ChevronRight className="size-4" />
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
}
