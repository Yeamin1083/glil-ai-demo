import { Check, Clock, Eye, Info } from 'lucide-react'
import { useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { bdt, humanize } from '@/shared/format'
import type { Extraction, Member } from '../claim/types'
import type { ClaimForm } from '../claim/form'

export interface HrPendingClaim {
  id: string
  intimationNumber: string
  employeeName: string
  memberCode: string
  relationship: string
  company: string
  claimType: string
  claimedAmount: number
  treatmentDate: string
  submissionDate: string
  hospitalName: string
  physicianName: string
  diagnosis: string
  samplePdfUrl: string
  sampleFileName: string
  hrNotes: string
  form: ClaimForm
  extraction: Extraction
}

interface Props {
  members: Member[]
  onApproveAndProceed: (claim: HrPendingClaim, file: File) => void
  onBackToClaims: () => void
}

export const SAMPLE_HR_CLAIMS: HrPendingClaim[] = [
  {
    id: 'hr-claim-1',
    intimationNumber: 'GH26-HR-1042',
    employeeName: 'Rahim Uddin',
    memberCode: 'DEMO-7049-0001',
    relationship: 'Self',
    company: 'Square Pharmaceuticals Ltd. (Plan B)',
    claimType: 'GENERAL',
    claimedAmount: 2450,
    treatmentDate: '12-10-2026',
    submissionDate: '14-10-2026',
    hospitalName: 'United Hospital Limited',
    physicianName: 'Prof. Dr. M. Rahman',
    diagnosis: 'Acute Gastritis & Viral Fever',
    samplePdfUrl: '/samples/sample_claim_rahim.pdf',
    sampleFileName: 'united_hospital_rahim_prescription.pdf',
    hrNotes: 'Employee submitted original pharmacy money receipts and doctor prescription.',
    form: {
      member_code: 'DEMO-7049-0001',
      patient_name: 'Rahim Uddin',
      claim_type: 'GENERAL',
      treatment_date: '12-10-2026',
      reference_date: '12-10-2026',
      dispatch_number: 'UH-INV-99214',
      dispatch_date: '14-10-2026',
      claimed_amount: '2450',
      bill_discount: '0',
      hospital_name: 'United Hospital Limited',
      physician_name: 'Prof. Dr. M. Rahman',
      physician_type: 'SPECIALIST',
      diagnosis: 'Acute Gastritis & Viral Fever',
      treatment_type: 'CONSERVATIVE',
      expenses: [
        { category: 'SPECIALIST_VISIT', claimed: '1000', confidence: 'high' },
        { category: 'MEDICINE', claimed: '1450', confidence: 'high' },
      ],
    },
    extraction: {
      claim_category: { value: 'OPD', confidence: 'high' },
      claim_type: { value: 'GENERAL', confidence: 'high' },
      hospital_name: 'United Hospital Limited',
      patient_name: 'Rahim Uddin',
      claimed_amount: { value: 2450, confidence: 'high' },
      bill_discount: { value: 0, confidence: 'high' },
      dispatch_number: { value: 'UH-INV-99214', confidence: 'high' },
      dispatch_date: { value: '14-10-2026', confidence: 'high' },
      treatment_date: { value: '12-10-2026', confidence: 'high' },
      physician_name: { value: 'Prof. Dr. M. Rahman', confidence: 'high' },
      physician_type: { value: 'SPECIALIST', confidence: 'high' },
      diagnosis: { value: 'Acute Gastritis & Viral Fever', confidence: 'high' },
      treatment_type: { value: 'CONSERVATIVE', confidence: 'high' },
      expense_breakdown: {
        SPECIALIST_VISIT: { value: 1000, confidence: 'high' },
        MEDICINE: { value: 1450, confidence: 'high' },
      },
      summary: 'Verified prescription from Prof. Dr. M. Rahman for Rahim Uddin. Attached pharmacy receipt total ৳1,450 matches itemized antacids and antibiotics.',
      extraction_notes: 'Original computer-printed cash memo; Doctor seal and BMDC registration verified.',
    },
  },
  {
    id: 'hr-claim-2',
    intimationNumber: 'GH26-HR-1043',
    employeeName: 'Tanvir Hasan',
    memberCode: 'DEMO-7049-0003',
    relationship: 'Self',
    company: 'Square Pharmaceuticals Ltd. (Plan B)',
    claimType: 'OPTICAL',
    claimedAmount: 3200,
    treatmentDate: '10-10-2026',
    submissionDate: '12-10-2026',
    hospitalName: 'Fashion Optics & Eye Hospital',
    physicianName: 'Dr. Kamrul Hasan',
    diagnosis: 'Refractive Error & Presbyopia',
    samplePdfUrl: '/samples/sample_claim_tanvir.pdf',
    sampleFileName: 'fashion_optics_tanvir_bill.pdf',
    hrNotes: 'Annual optical allowance claim for prescription spectacles and eye consultation.',
    form: {
      member_code: 'DEMO-7049-0003',
      patient_name: 'Tanvir Hasan',
      claim_type: 'OPTICAL',
      treatment_date: '10-10-2026',
      reference_date: '10-10-2026',
      dispatch_number: 'FO-99321',
      dispatch_date: '12-10-2026',
      claimed_amount: '3200',
      bill_discount: '0',
      hospital_name: 'Fashion Optics & Eye Hospital',
      physician_name: 'Dr. Kamrul Hasan',
      physician_type: 'OPHTHALMOLOGIST',
      diagnosis: 'Refractive Error & Presbyopia',
      treatment_type: 'CONSERVATIVE',
      expenses: [
        { category: 'CONSULTANCY', claimed: '700', confidence: 'high' },
        { category: 'SPECTACLES', claimed: '2500', confidence: 'high' },
      ],
    },
    extraction: {
      claim_category: { value: 'OPD', confidence: 'high' },
      claim_type: { value: 'OPTICAL', confidence: 'high' },
      hospital_name: 'Fashion Optics & Eye Hospital',
      patient_name: 'Tanvir Hasan',
      claimed_amount: { value: 3200, confidence: 'high' },
      bill_discount: { value: 0, confidence: 'high' },
      dispatch_number: { value: 'FO-99321', confidence: 'high' },
      dispatch_date: { value: '12-10-2026', confidence: 'high' },
      treatment_date: { value: '10-10-2026', confidence: 'high' },
      physician_name: { value: 'Dr. Kamrul Hasan', confidence: 'high' },
      physician_type: { value: 'OPHTHALMOLOGIST', confidence: 'high' },
      diagnosis: { value: 'Refractive Error & Presbyopia', confidence: 'high' },
      treatment_type: { value: 'CONSERVATIVE', confidence: 'high' },
      expense_breakdown: {
        CONSULTANCY: { value: 700, confidence: 'high' },
        SPECTACLES: { value: 2500, confidence: 'high' },
      },
      summary: 'Doctor consultation receipt (৳700) and optical frames/lenses bill (৳2,500). Within plan category schedule.',
      extraction_notes: 'Invoice clearly mentions frame and prescription lens power.',
    },
  },
  {
    id: 'hr-claim-3',
    intimationNumber: 'GH26-HR-1044',
    employeeName: 'Nasrin Akter',
    memberCode: 'DEMO-7049-0002',
    relationship: 'Spouse',
    company: 'Square Pharmaceuticals Ltd. (Plan B)',
    claimType: 'GENERAL',
    claimedAmount: 1800,
    treatmentDate: '08-10-2026',
    submissionDate: '11-10-2026',
    hospitalName: 'Apollo Imperial Medical Center',
    physicianName: 'Dr. Farhana Yasmin',
    diagnosis: 'Seasonal Bronchitis',
    samplePdfUrl: '/samples/sample_claim_rahim.pdf',
    sampleFileName: 'apollo_prescription_nasrin.pdf',
    hrNotes: 'Spouse OPD medication and doctor visit claimed by employee.',
    form: {
      member_code: 'DEMO-7049-0002',
      patient_name: 'Nasrin Akter',
      claim_type: 'GENERAL',
      treatment_date: '08-10-2026',
      reference_date: '08-10-2026',
      dispatch_number: 'AP-44021',
      dispatch_date: '11-10-2026',
      claimed_amount: '1800',
      bill_discount: '0',
      hospital_name: 'Apollo Imperial Medical Center',
      physician_name: 'Dr. Farhana Yasmin',
      physician_type: 'GENERAL PRACTITIONER',
      diagnosis: 'Seasonal Bronchitis',
      treatment_type: 'CONSERVATIVE',
      expenses: [
        { category: 'GENERAL_PRACTITIONER', claimed: '600', confidence: 'high' },
        { category: 'MEDICINE', claimed: '1200', confidence: 'high' },
      ],
    },
    extraction: {
      claim_category: { value: 'OPD', confidence: 'high' },
      claim_type: { value: 'GENERAL', confidence: 'high' },
      hospital_name: 'Apollo Imperial Medical Center',
      patient_name: 'Nasrin Akter',
      claimed_amount: { value: 1800, confidence: 'high' },
      bill_discount: { value: 0, confidence: 'high' },
      dispatch_number: { value: 'AP-44021', confidence: 'high' },
      dispatch_date: { value: '11-10-2026', confidence: 'high' },
      treatment_date: { value: '08-10-2026', confidence: 'high' },
      physician_name: { value: 'Dr. Farhana Yasmin', confidence: 'high' },
      physician_type: { value: 'GENERAL PRACTITIONER', confidence: 'high' },
      diagnosis: { value: 'Seasonal Bronchitis', confidence: 'high' },
      treatment_type: { value: 'CONSERVATIVE', confidence: 'high' },
      expense_breakdown: {
        GENERAL_PRACTITIONER: { value: 600, confidence: 'high' },
        MEDICINE: { value: 1200, confidence: 'high' },
      },
      summary: 'General physician prescription and pharmacy receipt for inhaler and cough syrup.',
      extraction_notes: 'All items substantiated with serial voucher.',
    },
  },
]

export function HrPendingClaimsPage({ onApproveAndProceed, onBackToClaims }: Props) {
  const [approvingId, setApprovingId] = useState<string | null>(null)
  const [previewClaim, setPreviewClaim] = useState<HrPendingClaim | null>(null)

  const handleApprove = async (claim: HrPendingClaim) => {
    setApprovingId(claim.id)
    try {
      let file: File
      try {
        const res = await fetch(claim.samplePdfUrl)
        if (res.ok) {
          const blob = await res.blob()
          file = new File([blob], claim.sampleFileName, { type: 'application/pdf' })
        } else {
          file = new File([`Simulated Medical Claim PDF for ${claim.employeeName}`], claim.sampleFileName, { type: 'application/pdf' })
        }
      } catch {
        file = new File([`Simulated Medical Claim PDF for ${claim.employeeName}`], claim.sampleFileName, { type: 'application/pdf' })
      }
      onApproveAndProceed(claim, file)
    } finally {
      setApprovingId(null)
    }
  }

  const totalPending = SAMPLE_HR_CLAIMS.reduce((acc, c) => acc + c.claimedAmount, 0)

  return (
    <div className="space-y-6">
      {/* Top Corporate HR Header Banner */}
      <Card className="border-border shadow-sm overflow-hidden">
        <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 text-white p-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1.5">
              <div className="flex items-center gap-2">
                <Badge className="bg-[var(--glil-orange)] text-white hover:bg-[var(--glil-orange)] text-xs font-semibold">
                  Corporate Client Portal
                </Badge>
                <Badge variant="outline" className="border-slate-600 text-slate-300 text-xs">
                  Square Pharmaceuticals Ltd. · Org 7049
                </Badge>
              </div>
              <h1 className="text-2xl font-bold tracking-tight">Corporate HR Pending Claims Endorsement</h1>
              <p className="text-xs text-slate-300 max-w-2xl leading-relaxed">
                Review employee medical claims submitted for group OPD coverage. Upon HR approval, claims bypass manual intimation and directly enter the Claim Officer verification and AI adjudication pipeline.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                size="sm"
                onClick={onBackToClaims}
                className="border-slate-700 bg-slate-800/80 hover:bg-slate-700 text-slate-200 text-xs cursor-pointer"
              >
                Go to Standard Claims Flow
              </Button>
            </div>
          </div>
        </div>

        {/* Executive Metric Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-5 bg-slate-50/70 border-t">
          <div className="rounded-xl border bg-white p-3.5 shadow-2xs">
            <div className="text-xs text-muted-foreground font-medium">Pending Claims</div>
            <div className="text-2xl font-bold text-slate-900 mt-0.5">{SAMPLE_HR_CLAIMS.length}</div>
            <div className="text-[11px] text-amber-600 font-medium mt-0.5">Awaiting HR endorsement</div>
          </div>

          <div className="rounded-xl border bg-white p-3.5 shadow-2xs">
            <div className="text-xs text-muted-foreground font-medium">Total Amount Claimed</div>
            <div className="text-2xl font-bold text-emerald-700 mt-0.5">{bdt(totalPending)}</div>
            <div className="text-[11px] text-muted-foreground mt-0.5">Across 3 employees</div>
          </div>

          <div className="rounded-xl border bg-white p-3.5 shadow-2xs">
            <div className="text-xs text-muted-foreground font-medium">Instant STP Qualified</div>
            <div className="text-2xl font-bold text-indigo-700 mt-0.5">3 of 3</div>
            <div className="text-[11px] text-indigo-600 font-medium mt-0.5">All claims ≤ ৳3,000 threshold</div>
          </div>

          <div className="rounded-xl border bg-white p-3.5 shadow-2xs">
            <div className="text-xs text-muted-foreground font-medium">Processing SLA</div>
            <div className="text-2xl font-bold text-slate-900 mt-0.5">&lt; 30s</div>
            <div className="text-[11px] text-emerald-600 font-medium mt-0.5">From approval to settlement</div>
          </div>
        </div>
      </Card>

      {/* Pending Claims Table Card */}
      <Card className="border-border shadow-sm">
        <CardHeader className="glil-card-header rounded-t-xl pb-4">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg font-bold tracking-tight">Pending Employee OPD Claims</CardTitle>
              <CardDescription className="text-xs text-muted-foreground mt-0.5">
                Step 2 Workflow: Click &quot;Approve &amp; Send to Claim Officer&quot; to skip manual intimation and launch the review flow.
              </CardDescription>
            </div>
            <Badge variant="outline" className="border-amber-300 bg-amber-50 text-amber-800 text-xs font-semibold gap-1">
              <Clock className="size-3" /> Action Required (3 Claims)
            </Badge>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-slate-50/80">
              <TableRow className="text-xs">
                <TableHead className="pl-6 font-semibold">Intimation &amp; Employee</TableHead>
                <TableHead className="font-semibold">Claim Type &amp; Diagnosis</TableHead>
                <TableHead className="font-semibold">Hospital / Physician</TableHead>
                <TableHead className="font-semibold">Treatment Date</TableHead>
                <TableHead className="text-right font-semibold">Claimed (৳)</TableHead>
                <TableHead className="font-semibold">HR Status</TableHead>
                <TableHead className="pr-6 text-right font-semibold">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {SAMPLE_HR_CLAIMS.map((claim) => {
                const isApproving = approvingId === claim.id

                return (
                  <TableRow key={claim.id} className="text-xs hover:bg-slate-50/50">
                    <TableCell className="pl-6 py-4 align-top">
                      <div>
                        <div className="font-bold text-slate-900 text-sm">{claim.employeeName}</div>
                        <div className="font-mono text-[11px] text-[var(--glil-orange)] font-semibold">{claim.intimationNumber}</div>
                        <div className="text-[11px] text-muted-foreground">{claim.memberCode} · {claim.relationship}</div>
                      </div>
                    </TableCell>

                    <TableCell className="py-4 align-top">
                      <div className="space-y-1">
                        <Badge variant="outline" className="text-[10px] uppercase font-semibold">
                          {claim.claimType}
                        </Badge>
                        <div className="font-medium text-slate-800">{claim.diagnosis}</div>
                      </div>
                    </TableCell>

                    <TableCell className="py-4 align-top">
                      <div>
                        <div className="font-medium text-slate-800">{claim.hospitalName}</div>
                        <div className="text-[11px] text-muted-foreground">{claim.physicianName}</div>
                      </div>
                    </TableCell>

                    <TableCell className="py-4 align-top">
                      <div>
                        <div className="font-medium">{claim.treatmentDate}</div>
                        <div className="text-[11px] text-muted-foreground">Submitted: {claim.submissionDate}</div>
                      </div>
                    </TableCell>

                    <TableCell className="py-4 align-top text-right">
                      <div className="font-extrabold text-slate-900 text-sm tabular-nums">
                        {bdt(claim.claimedAmount)}
                      </div>
                      <div className="text-[10px] text-emerald-600 font-semibold">STP Qualified</div>
                    </TableCell>

                    <TableCell className="py-4 align-top">
                      <Badge className="bg-amber-100 text-amber-800 border-amber-300 text-[11px] font-medium gap-1 hover:bg-amber-100">
                        <Clock className="size-3" /> Pending HR
                      </Badge>
                    </TableCell>

                    <TableCell className="pr-6 py-4 align-top text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setPreviewClaim(claim)}
                          className="h-8 text-xs text-slate-600 hover:text-slate-900 cursor-pointer"
                        >
                          <Eye className="size-3.5 mr-1" /> View
                        </Button>

                        <Button
                          size="sm"
                          disabled={isApproving}
                          onClick={() => handleApprove(claim)}
                          className="h-8 bg-[var(--glil-orange)] hover:bg-[var(--glil-orange-hover)] text-white text-xs font-semibold gap-1.5 shadow-2xs cursor-pointer"
                        >
                          {isApproving ? (
                            'Processing…'
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
                )
              })}
            </TableBody>
          </Table>
        </CardContent>

        <CardFooter className="flex items-center justify-between border-t bg-slate-50/50 p-4 text-xs text-muted-foreground">
          <div className="flex items-center gap-1.5">
            <Info className="size-3.5 text-[var(--glil-orange)]" />
            <span>
              Approving an employee claim validates submission and jumps straight to <strong>Human Review (Claim Officer)</strong>, bypassing the Intimation step.
            </span>
          </div>
          <span className="font-semibold text-slate-700">3 claims queued</span>
        </CardFooter>
      </Card>

      {/* Claim Preview Dialog */}
      {previewClaim && (
        <Dialog open={!!previewClaim} onOpenChange={() => setPreviewClaim(null)}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle className="flex items-center justify-between text-base">
                <span>Claim Details: {previewClaim.intimationNumber}</span>
                <Badge className="bg-amber-100 text-amber-800 border-amber-300">Pending Endorsement</Badge>
              </DialogTitle>
              <DialogDescription className="text-xs">
                Employee {previewClaim.employeeName} ({previewClaim.memberCode}) · Submitted on {previewClaim.submissionDate}
              </DialogDescription>
            </DialogHeader>

            <div className="grid gap-4 py-2 text-xs">
              <div className="grid grid-cols-2 gap-3 rounded-lg border bg-slate-50 p-3">
                <div>
                  <span className="text-muted-foreground block text-[11px]">Clinical Diagnosis</span>
                  <span className="font-semibold text-slate-800">{previewClaim.diagnosis}</span>
                </div>
                <div>
                  <span className="text-muted-foreground block text-[11px]">Treatment Date</span>
                  <span className="font-semibold text-slate-800">{previewClaim.treatmentDate}</span>
                </div>
                <div>
                  <span className="text-muted-foreground block text-[11px]">Hospital &amp; Physician</span>
                  <span className="font-semibold text-slate-800">{previewClaim.hospitalName} ({previewClaim.physicianName})</span>
                </div>
                <div>
                  <span className="text-muted-foreground block text-[11px]">Total Amount</span>
                  <span className="font-bold text-slate-900 text-sm">{bdt(previewClaim.claimedAmount)}</span>
                </div>
              </div>

              <div>
                <h4 className="font-semibold text-slate-800 mb-1.5">Itemized Medical Invoices:</h4>
                <div className="rounded-lg border overflow-hidden">
                  <Table>
                    <TableHeader className="bg-slate-100">
                      <TableRow className="text-xs">
                        <TableHead>Category</TableHead>
                        <TableHead className="text-right">Claimed (৳)</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {previewClaim.form.expenses.map((e, idx) => (
                        <TableRow key={idx} className="text-xs">
                          <TableCell className="font-medium">{humanize(e.category)}</TableCell>
                          <TableCell className="text-right font-semibold">{bdt(Number(e.claimed))}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>

              <div className="rounded-lg border border-amber-200 bg-amber-50/60 p-3">
                <span className="font-semibold text-amber-900 block mb-0.5">HR Officer Endorsement Note:</span>
                <p className="text-amber-800">{previewClaim.hrNotes}</p>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t">
              <Button variant="outline" size="sm" onClick={() => setPreviewClaim(null)}>
                Close
              </Button>
              <Button
                size="sm"
                onClick={() => {
                  const claim = previewClaim
                  setPreviewClaim(null)
                  handleApprove(claim)
                }}
                className="bg-[var(--glil-orange)] hover:bg-[var(--glil-orange-hover)] text-white text-xs font-semibold gap-1.5"
              >
                <Check className="size-3.5" /> Approve &amp; Send to Officer
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}
