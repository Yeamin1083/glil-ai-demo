import { ChevronRight, FileCheck, Sparkles, Upload, User, Zap } from 'lucide-react'
import { useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { bdt } from '@/shared/format'
import { loadTestClaimFile, TEST_CLAIMS } from '../testClaims'
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
  const [exampleError, setExampleError] = useState<string | null>(null)
  const member = members.find((m) => m.code === memberCode)

  // the example list uses real claims; the demo members stand in for the real employees
  const loadExample = async (index: string) => {
    const i = Number(index)
    try {
      setLoadingSample(true)
      setFile(await loadTestClaimFile(TEST_CLAIMS[i]))
      setMemberCode(TEST_CLAIMS[i].memberCode)
      setExampleError(null)
    } catch (e) {
      setExampleError((e as Error).message)
    } finally {
      setLoadingSample(false)
    }
  }

  const limitUsed = member ? member.plan.opd_limit - member.limit_remaining : 0
  const limitPct = member ? Math.round((member.limit_remaining / member.plan.opd_limit) * 100) : 0

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="rounded-xl border border-amber-200/80 bg-amber-50/70 p-4">
        <div className="flex items-center gap-2 mb-2">
          <Zap className="size-4 text-[var(--glil-orange)]" />
          <span className="text-xs font-bold uppercase tracking-wider text-amber-950">Try an example</span>
        </div>
        <Select disabled={loadingSample || busy || members.length === 0} onValueChange={loadExample}>
          <SelectTrigger className="bg-white text-xs">
            <SelectValue placeholder="Pick a real claim to fill in a member and documents" />
          </SelectTrigger>
          <SelectContent>
            {TEST_CLAIMS.map((c, i) => (
              <SelectItem key={c.number} value={String(i)} className="text-xs">
                {c.number} · {c.label} · {c.result}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {exampleError && <p className="mt-2 text-xs text-red-700">{exampleError}</p>}
      </div>

      {/* Main Intake Card */}
      <Card className="border-border shadow-sm">
        <CardHeader className="glil-card-header rounded-t-xl pb-4">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-xl font-bold tracking-tight">New Claim</CardTitle>
              <CardDescription className="text-xs text-muted-foreground mt-0.5">
                Choose the member and upload the bills. We will fill in the details for you.
              </CardDescription>
            </div>
            <Badge variant="outline" className="gap-1 border-orange-200 bg-orange-50 text-[var(--glil-orange)]">
              <Sparkles className="size-3" /> Step 1
            </Badge>
          </div>
        </CardHeader>

        <CardContent className="grid gap-6 pt-6">
          {/* Member Picker */}
          <div className="grid gap-2">
            <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
              <User className="size-3.5" /> Member
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
                    {member.is_active ? 'Active' : 'Inactive'}
                  </Badge>
                  <Badge variant="outline" className="text-xs font-medium">
                    Plan {member.plan.plan_name} (OPD {bdt(member.plan.opd_limit)})
                  </Badge>
                </div>
              </div>

              {/* Limit Gauge */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">Limit left</span>
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
                  <span>Plan year: {member.plan.cycle_start} to {member.plan.cycle_end}</span>
                  <span>Used so far: {bdt(limitUsed)}</span>
                </div>
              </div>
            </div>
          )}

          {/* Claim Documents Upload Dropzone */}
          <div className="grid gap-2">
            <Label htmlFor="claim-documents" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center justify-between">
              <span>Claim documents</span>
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
                    {(file.size / 1024).toFixed(0)} KB · Ready
                  </Badge>
                  <span className="text-xs text-muted-foreground mt-1">Click to change the file</span>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-2">
                  <div className="grid size-11 place-items-center rounded-full bg-slate-100 text-slate-500">
                    <Upload className="size-5" />
                  </div>
                  <span className="text-sm font-semibold text-foreground">Upload your bills and prescription</span>
                  <span className="text-xs text-muted-foreground max-w-md">
                    Drag files here or click to choose.
                  </span>
                  <div className="flex items-center gap-2 mt-2">
                    <Badge variant="outline" className="text-[10px] text-muted-foreground">Prescription</Badge>
                    <Badge variant="outline" className="text-[10px] text-muted-foreground">Receipt</Badge>
                    <Badge variant="outline" className="text-[10px] text-muted-foreground">Test bill</Badge>
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
            {!member ? 'Choose a member to continue.' : !file ? 'Add a file to continue.' : 'Ready.'}
          </p>
          <Button
            size="lg"
            disabled={!file || !member || busy || loadingSample}
            onClick={() => file && onSubmit(file, memberCode)}
            className="bg-[var(--glil-orange)] hover:bg-[var(--glil-orange-hover)] text-white gap-2 font-medium"
          >
            {busy ? 'Reading…' : 'Read My Documents'} <ChevronRight className="size-4" />
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
}
