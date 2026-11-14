import { Plus, Sparkles, X } from 'lucide-react'
import { useEffect, useMemo, useState, type CSSProperties } from 'react'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardAction, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import { Table, TableBody, TableCell, TableFooter, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { cn } from '@/lib/utils'
import { Typewriter } from '@/shared/components/Typewriter'
import { CLAIM_TYPES, DATE_PATTERN, EXPENSE_CODES, PHYSICIAN_TYPES, TREATMENT_TYPES } from '@/shared/constants'
import { bdt, humanize } from '@/shared/format'
import { expenseTotal, type ClaimForm, type FormField } from '../form'
import type { Confidence, Extraction, Member } from '../types'

interface Props {
  file: File
  intimationNumber: string
  extraction: Extraction
  member: Member
  form: ClaimForm
  confidence: Partial<Record<FormField, Confidence>>
  canSubmit: boolean
  busy: boolean
  onChange: (form: ClaimForm) => void
  onSubmit: () => void
}

// screen order of the fields, so they light up top to bottom as the extraction lands
const FIELD_ORDER: FormField[] = [
  'patient_name', 'claim_type', 'treatment_date', 'reference_date', 'dispatch_number', 'dispatch_date',
  'claimed_amount', 'bill_discount', 'hospital_name', 'physician_name', 'physician_type', 'diagnosis',
  'treatment_type',
]

const CONFIDENCE_CLASS: Record<string, string> = {
  high: 'border-emerald-200 bg-emerald-50 text-emerald-700',
  medium: 'border-indigo-200 bg-indigo-50 text-indigo-700',
  low: 'border-amber-200 bg-amber-50 text-amber-700',
}

function ConfidenceBadge({ level }: { level: Confidence | undefined }) {
  if (!level) return null
  return (
    <Badge variant="outline" className={cn('h-4 px-1.5 text-[10px] font-medium', CONFIDENCE_CLASS[level])}>
      {level}
    </Badge>
  )
}

export function ReviewStep(props: Props) {
  const { file, intimationNumber, extraction, member, form, confidence, canSubmit, busy, onChange, onSubmit } = props
  const previewUrl = useMemo(() => URL.createObjectURL(file), [file])
  useEffect(() => () => URL.revokeObjectURL(previewUrl), [previewUrl])
  // fields an officer has edited lose the AI marking
  const [touched, setTouched] = useState<Set<FormField>>(() => new Set())

  const set = (field: FormField, value: string) => {
    setTouched((t) => new Set(t).add(field))
    onChange({ ...form, [field]: value })
  }
  const setExpense = (i: number, patch: Partial<ClaimForm['expenses'][number]>) =>
    onChange({
      ...form,
      expenses: form.expenses.map((row, j) => (j === i ? { ...row, ...patch, confidence: null } : row)),
    })

  const total = expenseTotal(form)
  const claimed = Math.round(Number(form.claimed_amount) || 0)
  const badDates = (['treatment_date', 'reference_date'] as const).some((f) => !DATE_PATTERN.test(form[f]))
  const codes = EXPENSE_CODES[form.claim_type] ?? EXPENSE_CODES.GENERAL

  const field = (name: FormField, label: string, opts: { options?: string[]; hint?: string } = {}) => {
    const fromAi = !touched.has(name) && name !== 'reference_date' && form[name] !== ''
    const control = cn('reveal-fill w-full', fromAi && 'ai-filled', confidence[name] === 'low' && 'border-amber-300 bg-amber-50')
    const style = { '--i': FIELD_ORDER.indexOf(name) } as CSSProperties
    return (
      <div className="grid gap-1.5">
        <Label htmlFor={name} className="flex items-center gap-1.5">
          {label} <ConfidenceBadge level={confidence[name]} />
        </Label>
        {opts.options ? (
          <Select value={form[name] || undefined} onValueChange={(v) => set(name, v)}>
            <SelectTrigger id={name} className={control} style={style}>
              <SelectValue placeholder="Select" />
            </SelectTrigger>
            <SelectContent>
              {opts.options.map((o) => (
                <SelectItem key={o} value={o}>{o}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        ) : (
          <Input
            id={name}
            value={form[name]}
            placeholder={opts.hint}
            className={control}
            style={style}
            onChange={(e) => set(name, e.target.value)}
          />
        )}
      </div>
    )
  }

  return (
    <div className="grid items-start gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]">
      <Card className="gap-2 p-3 lg:sticky lg:top-20">
        <div className="flex items-center justify-between px-1 text-sm">
          <span className="truncate font-medium">{file.name}</span>
          <span className="text-xs text-muted-foreground">Source document</span>
        </div>
        {file.type === 'application/pdf' ? (
          <iframe src={previewUrl} title="Claim documents" className="h-[calc(100vh-170px)] w-full rounded-md bg-muted" />
        ) : (
          <img src={previewUrl} alt="Claim documents" className="h-[calc(100vh-170px)] w-full rounded-md bg-muted object-contain" />
        )}
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-xl">Edit an intimated group health claim</CardTitle>
          <CardDescription>
            Intimation {intimationNumber}. Check what Agent 1 read against the document, then send it on.
          </CardDescription>
          <CardAction>
            <Badge variant="outline" className="gap-1">
              <Sparkles className="size-3 text-[var(--ai-a)]" /> Filled by Agent 1
            </Badge>
          </CardAction>
        </CardHeader>

        <CardContent className="grid gap-6">
          {extraction.summary && (
            <div className="ai-edge rounded-lg border bg-card py-3 pr-4 pl-5 text-sm leading-relaxed">
              <Typewriter text={extraction.summary} />
            </div>
          )}

          <section className="grid gap-4">
            <h3 className="text-sm font-semibold">Claim</h3>
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              <div className="grid gap-1.5">
                <Label>Member</Label>
                <Input value={`${member.name} (${member.code})`} disabled />
              </div>
              {field('patient_name', 'Patient name')}
              {field('claim_type', 'Claim type', { options: CLAIM_TYPES })}
              {field('treatment_date', 'Admission / Treatment Date', { hint: 'dd-mm-yyyy' })}
              {field('reference_date', 'Reference Date', { hint: 'dd-mm-yyyy' })}
              {field('dispatch_number', 'Dispatch No.')}
              {field('dispatch_date', 'Dispatch Date', { hint: 'dd-mm-yyyy' })}
              {field('claimed_amount', 'Claimed Amount')}
              {field('bill_discount', 'Bill discount')}
            </div>
          </section>

          <Separator />

          <section className="grid gap-4">
            <h3 className="text-sm font-semibold">Treatment</h3>
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {field('hospital_name', 'Hospital Name')}
              {field('physician_name', 'Physician name')}
              {field('physician_type', 'Physician type', { options: PHYSICIAN_TYPES })}
              {field('diagnosis', 'Diagnosis')}
              {field('treatment_type', 'Treatment type', { options: TREATMENT_TYPES })}
            </div>
          </section>

          <Separator />

          <section className="grid gap-2">
            <h3 className="text-sm font-semibold">Expenses</h3>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Expense</TableHead>
                  <TableHead className="text-right">Claimed</TableHead>
                  <TableHead className="w-24" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {form.expenses.map((row, i) => (
                  <TableRow key={i}>
                    <TableCell>
                      <Select value={row.category} onValueChange={(v) => setExpense(i, { category: v })}>
                        <SelectTrigger className={cn('w-full', row.confidence && 'ai-filled')}>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {[...new Set([row.category, ...codes])].map((c) => (
                            <SelectItem key={c} value={c}>{humanize(c)}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell>
                      <Input
                        value={row.claimed}
                        className={cn('ml-auto max-w-36 text-right', row.confidence && 'ai-filled')}
                        onChange={(e) => setExpense(i, { claimed: e.target.value })}
                      />
                    </TableCell>
                    <TableCell className="text-right">
                      <ConfidenceBadge level={row.confidence} />
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        aria-label="Remove expense"
                        onClick={() => onChange({ ...form, expenses: form.expenses.filter((_, j) => j !== i) })}
                      >
                        <X />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
              <TableFooter>
                <TableRow>
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() =>
                        onChange({ ...form, expenses: [...form.expenses, { category: codes[0], claimed: '', confidence: null }] })
                      }
                    >
                      <Plus /> Add expense
                    </Button>
                  </TableCell>
                  <TableCell className="text-right font-semibold">{bdt(total)}</TableCell>
                  <TableCell />
                </TableRow>
              </TableFooter>
            </Table>
          </section>

          {total !== claimed && (
            <Alert className="border-amber-200 bg-amber-50 text-amber-800">
              <AlertDescription className="text-amber-800">
                Expenses add up to {bdt(total)} but the claimed amount is {bdt(claimed)}.
              </AlertDescription>
            </Alert>
          )}
          {badDates && (
            <Alert variant="destructive">
              <AlertDescription>Dates must be dd-mm-yyyy.</AlertDescription>
            </Alert>
          )}
          {extraction.extraction_notes && (
            <p className="text-xs text-muted-foreground">Agent 1 notes: {extraction.extraction_notes}</p>
          )}
        </CardContent>

        <CardFooter className="justify-end gap-3">
          {!canSubmit && <span className="text-sm text-muted-foreground">Switch to a claims officer to confirm.</span>}
          <Button size="lg" disabled={!canSubmit || busy || badDates || form.expenses.length === 0} onClick={onSubmit}>
            Confirm and send to processing
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
}
