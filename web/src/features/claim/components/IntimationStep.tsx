import { FileText, Upload } from 'lucide-react'
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
  const member = members.find((m) => m.code === memberCode)

  return (
    <Card className="mx-auto max-w-2xl">
      <CardHeader>
        <CardTitle className="text-xl">Intimate a claim</CardTitle>
        <CardDescription>
          Pick the member and upload their claim documents. The intake agent reads them and fills in the claim for you to check.
        </CardDescription>
      </CardHeader>

      <CardContent className="grid gap-5">
        <div className="grid gap-2">
          <Label>Member</Label>
          <MemberPicker members={members} value={memberCode} onChange={setMemberCode} />
        </div>

        {member && (
          <dl className="grid grid-cols-2 gap-x-6 gap-y-3 rounded-lg bg-muted/60 p-4 text-sm sm:grid-cols-3">
            <div>
              <dt className="text-xs text-muted-foreground">Member</dt>
              <dd className="font-medium">{member.name}</dd>
            </div>
            <div>
              <dt className="text-xs text-muted-foreground">Relation</dt>
              <dd className="font-medium capitalize">{member.relation.toLowerCase()}</dd>
            </div>
            <div>
              <dt className="text-xs text-muted-foreground">Status</dt>
              <dd>
                <Badge variant={member.is_active ? 'secondary' : 'destructive'}>
                  {member.is_active ? 'Active' : 'Inactive'}
                </Badge>
              </dd>
            </div>
            <div>
              <dt className="text-xs text-muted-foreground">Plan</dt>
              <dd className="font-medium">
                {member.plan.plan_name}, OPD {bdt(member.plan.opd_limit)}
              </dd>
            </div>
            <div>
              <dt className="text-xs text-muted-foreground">Cycle</dt>
              <dd className="font-medium">
                {member.plan.cycle_start} to {member.plan.cycle_end}
              </dd>
            </div>
            <div>
              <dt className="text-xs text-muted-foreground">OPD limit left</dt>
              <dd className="font-medium">{bdt(member.limit_remaining)}</dd>
            </div>
          </dl>
        )}

        <div className="grid gap-2">
          <Label htmlFor="claim-documents">Claim documents</Label>
          <label
            htmlFor="claim-documents"
            className="flex cursor-pointer flex-col items-center gap-1 rounded-lg border border-dashed p-8 text-center transition-colors hover:bg-muted/50 has-[:focus-visible]:ring-3 has-[:focus-visible]:ring-ring/50"
          >
            {file ? <FileText className="mb-1 size-5" /> : <Upload className="mb-1 size-5 text-muted-foreground" />}
            <span className="text-sm font-medium">{file ? file.name : 'Choose a PDF or image'}</span>
            <span className="text-xs text-muted-foreground">
              {file ? `${(file.size / 1024).toFixed(0)} KB` : 'Bills, money receipts and prescription, printed not handwritten'}
            </span>
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

      <CardFooter className="justify-end">
        <Button size="lg" disabled={!file || !member || busy} onClick={() => file && onSubmit(file, memberCode)}>
          Intimate claim
        </Button>
      </CardFooter>
    </Card>
  )
}
