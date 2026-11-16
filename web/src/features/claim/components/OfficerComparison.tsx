import {
  CheckCircle2,
  Scale,
  Sparkles,
  User,
  AlertTriangle,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";
import { STATUS_LABEL, STATUS_TONE, TONE_TEXT } from "@/shared/constants";
import { bdt, humanize } from "@/shared/format";
import type { OfficerDecision, Review } from "../types";

export function OfficerComparison({
  officer,
  review,
}: {
  officer: OfficerDecision;
  review: Review;
}) {
  const sameStatus = officer.status === review.status;
  const samePayable = officer.payable_amount === review.total_payable;
  const verdict = sameStatus
    ? samePayable
      ? "AI and officer agree"
      : "Same decision, different amount"
    : "AI and officer differ";

  return (
    <Card className="border-border/80 shadow-sm overflow-hidden">
      <CardHeader className="glil-card-header rounded-t-xl pb-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <div>
            <div className="flex items-center gap-2">
              <Scale className="size-4 text-[var(--glil-orange)]" />
              <CardTitle className="text-base font-bold tracking-tight">
                AI vs. Claim Officer
              </CardTitle>
            </div>
            <CardDescription className="text-xs text-muted-foreground mt-0.5">
              What the AI suggested, next to what the officer actually decided.
            </CardDescription>
          </div>
          <CardAction>
            <Badge
              variant="outline"
              className={cn(
                "gap-1.5 text-xs font-semibold px-2.5 py-1",
                sameStatus && samePayable
                  ? "border-emerald-300 bg-emerald-50 text-emerald-800"
                  : "border-amber-300 bg-amber-50 text-amber-800",
              )}
            >
              {sameStatus && samePayable ? (
                <CheckCircle2 className="size-3.5 text-emerald-600" />
              ) : (
                <AlertTriangle className="size-3.5 text-amber-600" />
              )}
              {verdict}
            </Badge>
          </CardAction>
        </div>
      </CardHeader>

      <CardContent className="grid gap-5 pt-5">
        <div className="grid gap-4 md:grid-cols-2">
          {/* Officer Side */}
          <div className="rounded-xl border bg-muted/30 p-4 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                <User className="size-3.5" /> Claim Officer
              </span>
              <Badge variant="outline" className="text-[10px] font-mono">
                ACPS record
              </Badge>
            </div>
            <div
              className={cn(
                "text-xl font-bold tracking-tight",
                TONE_TEXT[STATUS_TONE[officer.status]],
              )}
            >
              {STATUS_LABEL[officer.status] || humanize(officer.status)}
            </div>
            {officer.rejection_reason && (
              <p className="text-xs font-medium text-amber-900 bg-amber-50 rounded px-2 py-1 border border-amber-200">
                Reason: {humanize(officer.rejection_reason)}
              </p>
            )}
            {officer.required_documents && (
              <p className="text-xs text-amber-900 bg-amber-50 rounded px-2 py-1 border border-amber-200">
                Documents Requested: {officer.required_documents}
              </p>
            )}
            <div className="pt-2 border-t mt-3 flex justify-between items-baseline text-xs">
              <span className="text-muted-foreground">Officer Approved:</span>
              <span className="font-bold text-sm text-foreground">
                {bdt(officer.payable_amount)}{" "}
                <span className="text-xs font-normal text-muted-foreground">
                  of {bdt(officer.claimed_amount)}
                </span>
              </span>
            </div>
          </div>

          {/* AI Side */}
          <div className="rounded-xl border border-orange-200 bg-gradient-to-br from-orange-50/40 via-background to-blue-50/30 p-4 space-y-2 relative overflow-hidden">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-[var(--glil-orange)] flex items-center gap-1.5">
                <Sparkles className="size-3.5" /> AI Suggestion
              </span>
              <Badge className="bg-[var(--glil-orange)] text-white text-[10px]">
                AI + plan rules
              </Badge>
            </div>
            <div
              className={cn(
                "text-xl font-bold tracking-tight",
                TONE_TEXT[STATUS_TONE[review.status]],
              )}
            >
              {STATUS_LABEL[review.status] || humanize(review.status)}
            </div>
            {review.rejection_reason && (
              <p className="text-xs font-medium text-amber-900 bg-amber-50 rounded px-2 py-1 border border-amber-200">
                Reason: {humanize(review.rejection_reason)}
              </p>
            )}
            {review.required_documents && (
              <p className="text-xs text-amber-900 bg-amber-50 rounded px-2 py-1 border border-amber-200">
                Documents Requested: {review.required_documents}
              </p>
            )}
            <div className="pt-2 border-t mt-3 flex justify-between items-baseline text-xs">
              <span className="text-muted-foreground">AI payout:</span>
              <span className="font-bold text-sm text-foreground">
                {bdt(review.total_payable)}{" "}
                <span className="text-xs font-normal text-muted-foreground">
                  of {bdt(review.total_claimed)}
                </span>
              </span>
            </div>
          </div>
        </div>

        {/* Breakdown of Historic Settlement Lines */}
        {officer.expenses.length > 0 && (
          <div className="space-y-2 pt-2 border-t">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Items the officer recorded
            </span>
            <div className="rounded-lg border overflow-hidden">
              <Table>
                <TableHeader className="bg-muted/40 text-xs">
                  <TableRow>
                    <TableHead className="pl-3">Expense</TableHead>
                    <TableHead className="text-right">Claimed (৳)</TableHead>
                    <TableHead className="text-right">Approved (৳)</TableHead>
                    <TableHead className="pr-3 pl-4">Officer Remarks</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody className="text-xs">
                  {officer.expenses.map((e, idx) => (
                    <TableRow key={idx} className="hover:bg-muted/20">
                      <TableCell className="pl-3 font-medium">
                        {humanize(e.category)}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {bdt(e.claimed)}
                      </TableCell>
                      <TableCell className="text-right font-semibold tabular-nums">
                        {bdt(e.payable)}
                      </TableCell>
                      <TableCell className="pr-3 pl-4 text-muted-foreground">
                        {e.remarks || "—"}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
