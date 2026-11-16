import { ArrowRight, CheckCircle2, ExternalLink, FileText, Info, Plus, Sparkles, X } from 'lucide-react'
import { useState, type CSSProperties } from 'react'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardAction, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { InputGroup, InputGroupAddon, InputGroupInput, InputGroupText } from '@/components/ui/input-group'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableFooter, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { cn } from '@/lib/utils'
import { Typewriter } from '@/shared/components/Typewriter'
import { CLAIM_TYPES, DATE_PATTERN, EXPENSE_CODES, PHYSICIAN_TYPES, TREATMENT_TYPES } from '@/shared/constants'
import { bdt, humanize } from '@/shared/format'
import { useObjectUrl } from '@/shared/useObjectUrl'
import { expenseTotal, type ClaimForm, type FormField } from '../form'
import { LimitCells, LimitGroupHead, LimitHeads, limitBefore } from './PlanLimit'
import type { Confidence, Extraction, Member, Review, Status } from '../types'
import { DecisionPanel } from './DecisionPanel'

interface Props {
  file: File
  intimationNumber: string
  hrApproved: boolean
  extraction: Extraction
  member: Member
  form: ClaimForm
  confidence: Partial<Record<FormField, Confidence>>
  canSubmit: boolean
  busy: boolean
  review: Review
  reviewVersion: number
  stale: boolean
  onChange: (form: ClaimForm) => void
  onRecheck: () => void
  onDecide: (status: Status, remarks: string) => void
  onSubmit: () => void
}

const FIELD_ORDER: FormField[] = [
  'patient_name', 'claim_type', 'treatment_date', 'reference_date', 'dispatch_number', 'dispatch_date',
  'claimed_amount', 'excess_amount', 'hospital_name', 'physician_name', 'physician_type', 'diagnosis',
  'treatment_type',
]

const CONFIDENCE_CLASS: Record<string, string> = {
  high: 'border-emerald-300 bg-emerald-50 text-emerald-800',
  medium: 'border-indigo-300 bg-indigo-50 text-indigo-800',
  low: 'border-amber-300 bg-amber-50 text-amber-800 font-semibold',
}

function ConfidenceBadge({ level }: { level: Confidence | undefined }) {
  if (!level || level === 'high') return null
  return (
    <Badge variant="outline" className={cn('h-4 px-1.5 text-[10px] uppercase font-mono tracking-wider', CONFIDENCE_CLASS[level])}>
      {level} Conf.
    </Badge>
  )
}

export function ReviewStep(props: Props) {
  const { file, intimationNumber, hrApproved, extraction, member, form, confidence, canSubmit, busy, review, reviewVersion, stale, onChange, onRecheck, onDecide, onSubmit } = props
  const previewUrl = useObjectUrl(file)

  // Track user edits for Step 3 & Action Item 6: Green for AI, Orange for Human
  const [touched, setTouched] = useState<Set<FormField>>(() => new Set())
  const [touchedExpenses, setTouchedExpenses] = useState<Set<number>>(() => new Set())

  const set = (field: FormField, value: string) => {
    setTouched((t) => new Set(t).add(field))
    onChange({ ...form, [field]: value })
  }

  const setExpense = (i: number, patch: Partial<ClaimForm['expenses'][number]>) => {
    // deducted and remarks are the officer's own, so they don't mark the AI-read fields as edited
    const aiField = 'category' in patch || 'claimed' in patch
    if (aiField) setTouchedExpenses((t) => new Set(t).add(i))
    onChange({
      ...form,
      expenses: form.expenses.map((row, j) =>
        j === i ? { ...row, ...patch, ...(aiField && { confidence: null }) } : row,
      ),
    })
  }

  const total = expenseTotal(form)
  const claimed = Math.round(Number(form.claimed_amount) || 0)
  const deductedTotal = form.expenses.reduce((sum, r) => sum + Math.round(Number(r.deducted) || 0), 0)
  // the claimed amount is gross, so a discount on the bills must be entered before moving on
  const billDiscount = Math.round(Number(extraction.bill_discount?.value) || 0)
  const needsDiscountBreakdown = billDiscount > 0 && deductedTotal === 0
  // as in ACPS: what is claimed but is neither an item nor the excess amount
  const gap = claimed - (total + Math.round(Number(form.excess_amount) || 0))
  const badDates = (['treatment_date', 'reference_date'] as const).some((f) => !DATE_PATTERN.test(form[f]))
  const codes = EXPENSE_CODES[form.claim_type] ?? EXPENSE_CODES.GENERAL

  const field = (name: FormField, label: string, opts: { options?: string[]; hint?: string } = {}) => {
    const isHumanEdited = touched.has(name)
    const fromAi = !isHumanEdited && name !== 'reference_date' && form[name] !== ''

    const control = cn(
      'reveal-fill w-full text-sm font-medium transition-all duration-200',
      fromAi && 'ai-filled', // Green highlight per Step 3 / Item 6
      isHumanEdited && 'human-edited', // Orange highlight per Step 3 / Item 6
      confidence[name] === 'low' && 'border-amber-400 bg-amber-50/60'
    )
    const style = { '--i': FIELD_ORDER.indexOf(name) } as CSSProperties

    return (
      <div className="grid gap-1.5">
        <Label htmlFor={name} className="flex items-center justify-between text-xs text-muted-foreground font-semibold uppercase tracking-wider">
          <span className="flex items-center gap-1.5">
            <span>{label}</span>
            {fromAi && (
              <span className="inline-block size-2 rounded-full bg-emerald-500" title="Filled by AI (green)" />
            )}
            {isHumanEdited && (
              <span className="inline-block size-2 rounded-full bg-[var(--glil-orange)]" title="Edited by you (orange)" />
            )}
          </span>
          <ConfidenceBadge level={confidence[name]} />
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
    <div className="grid items-start gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)]">
      {/* Left Column: Source Document Viewer */}
      <Card className="p-3 lg:sticky lg:top-20 border-border/80 shadow-sm">
        <div className="flex items-center justify-between px-2 py-1 text-xs border-b mb-2 pb-2">
          <div className="flex items-center gap-1.5 truncate">
            <FileText className="size-3.5 text-muted-foreground shrink-0" />
            <span className="truncate font-semibold">{file.name}</span>
          </div>
          <a
            href={previewUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 text-[11px] text-[var(--glil-orange)] hover:underline shrink-0 font-medium"
          >
            <span>Open in new tab</span> <ExternalLink className="size-3" />
          </a>
        </div>
        {file.type === 'application/pdf' ? (
          <iframe src={previewUrl || undefined} title="Claim documents" className="h-[calc(100vh-175px)] w-full rounded-lg bg-slate-100 border" />
        ) : (
          <img src={previewUrl || undefined} alt="Claim documents" className="h-[calc(100vh-175px)] w-full rounded-lg bg-slate-100 object-contain border" />
        )}
      </Card>

      {/* Right Column: Check the Details Form */}
      <Card className="border-border/80 shadow-sm">
        <CardHeader className="glil-card-header rounded-t-xl pb-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <div>
              <CardTitle className="text-xl font-bold tracking-tight">Review &amp; Decide</CardTitle>
              <CardDescription className="text-xs text-muted-foreground mt-0.5">
                Claim <span className="font-mono font-semibold text-foreground">{intimationNumber}</span> · Check the details against the documents, then confirm the settlement.
              </CardDescription>
            </div>
            <CardAction>
              <Badge variant="outline" className="gap-1.5 border-orange-200 bg-orange-50 text-[var(--glil-orange)] text-xs font-semibold">
                <Sparkles className="size-3" /> Filled in by AI
              </Badge>
            </CardAction>
          </div>
        </CardHeader>

        <CardContent className="grid gap-5 pt-5">
          {/* HR Pre-Intimation Banner (Step 2) */}
          {hrApproved && (
            <div className="rounded-xl border border-emerald-200 bg-emerald-50/70 p-3.5 flex items-center justify-between text-xs text-emerald-950 shadow-2xs">
              <div className="flex items-center gap-2.5">
                <div className="grid size-7 place-items-center rounded-full bg-emerald-600 text-white shrink-0">
                  <CheckCircle2 className="size-4" />
                </div>
                <div>
                  <span className="font-bold block">Approved by HR</span>
                  <span className="text-[11px] text-emerald-800">
                    Sent in and approved by HR for {member.name}.
                  </span>
                </div>
              </div>
              <Badge className="bg-emerald-700 text-white hover:bg-emerald-700 text-[10px]">
                HR approved
              </Badge>
            </div>
          )}

          {/* Visual Legend for Step 3 & Action Item 6 */}
          <div className="flex flex-wrap items-center justify-between gap-2 px-3.5 py-2.5 bg-slate-50 border rounded-lg text-xs">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
              Colour key:
            </span>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1.5 font-medium text-emerald-800">
                <span className="size-3 rounded-md bg-emerald-100 border-2 border-emerald-500" />
                <span>Filled by AI (green)</span>
              </div>
              <div className="flex items-center gap-1.5 font-medium text-orange-800">
                <span className="size-3 rounded-md bg-orange-100 border-2 border-[var(--glil-orange)]" />
                <span>Edited by you (orange)</span>
              </div>
            </div>
          </div>

          {extraction.summary && (
            <div className="ai-edge rounded-lg border bg-gradient-to-r from-orange-50/20 via-background to-blue-50/20 py-3 pr-4 pl-5 text-xs leading-relaxed text-muted-foreground">
              <span className="font-semibold text-foreground block mb-0.5">Summary:</span>
              <Typewriter text={extraction.summary} />
            </div>
          )}

          {/* Section 1: Claim & Beneficiary */}
          <section className="grid gap-4">
            <div className="flex items-center justify-between border-b pb-1.5">
              <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                1. Member and claim
              </h3>
              <span className="text-[11px] text-muted-foreground">Policy: Plan {member.plan.plan_name}</span>
            </div>
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              <div className="grid gap-1.5">
                <Label className="text-xs text-muted-foreground font-semibold uppercase tracking-wider">Member</Label>
                <Input value={`${member.name} (${member.code})`} disabled className="bg-muted font-medium" />
              </div>
              {field('patient_name', 'Patient Name')}
              {field('claim_type', 'Claim Type', { options: CLAIM_TYPES })}
              {field('treatment_date', 'Treatment Date', { hint: 'dd-mm-yyyy' })}
              {field('reference_date', 'Reference Date', { hint: 'dd-mm-yyyy' })}
              {field('dispatch_number', 'Dispatch / Receipt No.')}
              {field('dispatch_date', 'Dispatch Date', { hint: 'dd-mm-yyyy' })}
              {field('claimed_amount', 'Total Claimed Amount (৳)')}
            </div>
          </section>

          {/* Section 2: Clinical Details */}
          <section className="grid gap-4">
            <div className="border-b pb-1.5">
              <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                2. Treatment
              </h3>
            </div>
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {field('hospital_name', 'Hospital / Clinic')}
              {field('physician_name', 'Doctor')}
              {field('physician_type', 'Doctor Type', { options: PHYSICIAN_TYPES })}
              {field('diagnosis', 'Diagnosis')}
              {field('treatment_type', 'Treatment Type', { options: TREATMENT_TYPES })}
            </div>
          </section>

          {/* Section 3: Itemized Expenses */}
          <section className="grid gap-3">
            <div className="flex items-center justify-between border-b pb-1.5">
              <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                3. Bill items and plan limits
              </h3>
              <Button
                variant="outline"
                size="sm"
                className="h-7 text-xs gap-1 border-dashed"
                onClick={() =>
                  onChange({ ...form, expenses: [...form.expenses, { category: codes[0], claimed: '', deducted: '', remarks: '', confidence: null }] })
                }
              >
                <Plus className="size-3" /> Add Row
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              If the bills show a discount, the claim officer enters it item by item in the Deducted column.
            </p>
            {billDiscount > 0 && (
              <p className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-medium text-amber-900">
                The AI read a discount of {bdt(billDiscount)} on the bills.
              </p>
            )}

            <div className="overflow-hidden rounded-lg border">
              <Table>
                <TableHeader className="bg-muted/60">
                  <TableRow className="hover:bg-transparent">
                    <TableHead rowSpan={2} className="pl-3 text-xs font-semibold">Expense</TableHead>
                    <LimitGroupHead />
                    <TableHead rowSpan={2} className="w-36 text-right text-xs font-semibold">Claimed (৳)</TableHead>
                    <TableHead rowSpan={2} className="w-32 text-right text-xs font-semibold">Deducted (৳)</TableHead>
                    <TableHead rowSpan={2} className="w-28 text-right text-xs font-semibold">Payable (৳)</TableHead>
                    <TableHead rowSpan={2} className="min-w-40 text-xs font-semibold">Remarks</TableHead>
                    <TableHead rowSpan={2} className="w-10" />
                  </TableRow>
                  <TableRow className="hover:bg-transparent">
                    <LimitHeads />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {form.expenses.map((row, i) => {
                    const isRowEdited = touchedExpenses.has(i) || !row.confidence
                    const isRowAi = !isRowEdited && !!row.confidence

                    return (
                      <TableRow key={i} className="hover:bg-muted/30">
                        <TableCell className="pl-3 align-top">
                          <div className="flex items-center gap-2">
                            <Select value={row.category} onValueChange={(v) => setExpense(i, { category: v })}>
                              <SelectTrigger
                                className={cn(
                                  'w-full max-w-56 text-xs h-9 transition-colors',
                                  isRowAi && 'ai-filled',
                                  isRowEdited && 'human-edited'
                                )}
                              >
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {[...new Set([row.category, ...codes])].map((c) => (
                                  <SelectItem key={c} value={c}>{humanize(c)}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <ConfidenceBadge level={row.confidence} />
                          </div>
                        </TableCell>
                        <LimitCells info={limitBefore(member, row.category)} />
                        <TableCell className="align-top">
                          <InputGroup
                            className={cn(
                              'ml-auto w-32 h-9 transition-colors',
                              isRowAi && 'ai-filled',
                              isRowEdited && 'human-edited'
                            )}
                          >
                            <InputGroupAddon>
                              <InputGroupText className="text-xs">৳</InputGroupText>
                            </InputGroupAddon>
                            <InputGroupInput
                              inputMode="decimal"
                              aria-label={`${humanize(row.category)} claimed`}
                              value={row.claimed}
                              className="text-right tabular-nums text-xs font-semibold"
                              onChange={(e) => setExpense(i, { claimed: e.target.value })}
                            />
                          </InputGroup>
                        </TableCell>
                        <TableCell className="align-top">
                          <Input
                            inputMode="decimal"
                            aria-label={`${humanize(row.category)} deducted`}
                            value={row.deducted}
                            className="ml-auto h-9 w-28 text-right text-xs font-semibold tabular-nums"
                            onChange={(e) => setExpense(i, { deducted: e.target.value })}
                          />
                        </TableCell>
                        <TableCell className="text-right align-top pt-3 text-xs font-bold tabular-nums">
                          {bdt(Math.max(Math.round(Number(row.claimed) || 0) - Math.round(Number(row.deducted) || 0), 0))}
                        </TableCell>
                        <TableCell className="align-top">
                          <Input
                            aria-label={`${humanize(row.category)} remarks`}
                            value={row.remarks}
                            className="h-9 text-xs"
                            onChange={(e) => setExpense(i, { remarks: e.target.value })}
                          />
                        </TableCell>
                        <TableCell className="pr-2 text-right align-top">
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            aria-label={`Remove ${humanize(row.category)}`}
                            className="size-8 text-muted-foreground hover:text-destructive"
                            onClick={() => onChange({ ...form, expenses: form.expenses.filter((_, j) => j !== i) })}
                          >
                            <X className="size-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    )
                  })}
                  {form.expenses.length === 0 && (
                    <TableRow className="hover:bg-transparent">
                      <TableCell colSpan={9} className="py-6 text-center text-xs text-muted-foreground">
                        No items yet. Click &quot;Add Row&quot;.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
                <TableFooter className="bg-muted/60">
                  <TableRow className="hover:bg-transparent">
                    <TableCell className="pl-3 text-xs font-semibold" colSpan={4}>Total</TableCell>
                    <TableCell className="pr-3 text-right font-bold text-sm tabular-nums text-foreground">{bdt(total)}</TableCell>
                    <TableCell className="text-right font-bold text-sm tabular-nums">{bdt(deductedTotal)}</TableCell>
                    <TableCell className="text-right font-bold text-sm tabular-nums">{bdt(Math.max(total - deductedTotal, 0))}</TableCell>
                    <TableCell colSpan={2} />
                  </TableRow>
                </TableFooter>
              </Table>
            </div>
          </section>

          {/* Excess: money on the bills that is not an item, like a discount (same idea as ACPS's Excess section) */}
          <section className="grid gap-3 rounded-xl border bg-muted/30 p-4">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Excess</h3>
              <Badge variant="outline" className={cn('text-xs', gap === 0 ? 'border-emerald-300 text-emerald-800' : 'border-amber-300 text-amber-800')}>
                Left over: {bdt(gap)}
              </Badge>
            </div>
            <div className="grid gap-4 sm:grid-cols-[200px_1fr]">
              {field('excess_amount', 'Amount (৳)', { hint: 'Claimed money that is not one of the items' })}
              {field('excess_remarks', 'Remarks')}
            </div>
          </section>

          <DecisionPanel
            key={reviewVersion}
            review={review}
            stale={stale}
            busy={busy}
            onRecheck={onRecheck}
            onDecide={onDecide}
          />

          {/* Mismatch Warning */}
          {gap !== 0 && (
            <Alert className="border-amber-300 bg-amber-50/70 text-amber-900">
              <AlertDescription className="text-xs text-amber-900 flex items-center gap-2">
                <span>Note: the items and the excess add up to {bdt(claimed - gap)}, but the claimed amount is {bdt(claimed)}. Please check.</span>
              </AlertDescription>
            </Alert>
          )}

          {badDates && (
            <Alert variant="destructive">
              <AlertDescription className="text-xs">Dates must look like dd-mm-yyyy.</AlertDescription>
            </Alert>
          )}

          {extraction.extraction_notes && (
            <Alert className="bg-slate-50 border-slate-200">
              <Info className="size-4 text-[var(--glil-orange)]" />
              <AlertTitle className="text-xs font-semibold">Notes</AlertTitle>
              <AlertDescription className="text-xs text-muted-foreground mt-1">
                <ul className="list-disc space-y-1 pl-4">
                  {extraction.extraction_notes
                    .split(';')
                    .map((note) => note.trim())
                    .filter(Boolean)
                    .map((note) => (
                      <li key={note}>{note}</li>
                    ))}
                </ul>
              </AlertDescription>
            </Alert>
          )}
        </CardContent>

        <CardFooter className="flex flex-col sm:flex-row items-center justify-between gap-3 border-t bg-muted/20 px-6 py-4">
          <div className="text-xs text-muted-foreground">
            {!canSubmit ? (
              <span className="text-amber-800 font-medium">To continue, pick a Claim Officer from the user list at the top.</span>
            ) : needsDiscountBreakdown ? (
              <span className="text-amber-800 font-medium">
                The bills show a discount of {bdt(billDiscount)}. Enter it item by item in the Deducted column to continue.
              </span>
            ) : stale ? (
              <span className="text-amber-800 font-medium">Update the decision, so it matches your changes.</span>
            ) : (
              <span>Happy with the details and the decision? Go to the final check.</span>
            )}
          </div>
          {/* Action button renamed to simple, clear title */}
          <Button
            size="lg"
            disabled={!canSubmit || busy || badDates || form.expenses.length === 0 || needsDiscountBreakdown || stale}
            onClick={onSubmit}
            className="w-full sm:w-auto bg-[var(--glil-orange)] hover:bg-[var(--glil-orange-hover)] text-white gap-2 font-medium"
          >
            {busy ? 'Working…' : 'Go to Final Check'} <ArrowRight className="size-4" />
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
}
