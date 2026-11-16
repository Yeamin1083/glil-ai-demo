import {
  AlertTriangle,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Clock,
  Copy,
  FileCheck,
  Layers,
  RefreshCw,
  XCircle,
} from "lucide-react";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  STATUS,
  STATUS_TONE,
  TONE_TEXT,
  type Status,
} from "@/shared/constants";
import { bdt, humanize } from "@/shared/format";
import type { OracleRecord } from "../types";

// the saved page takes its colour and wording from the decision, not always green
const TONE = {
  good: {
    hero: "from-emerald-600 via-teal-600 to-emerald-700",
    border: "border-emerald-200/80",
    icon: CheckCircle2,
  },
  warn: {
    hero: "from-amber-500 via-amber-600 to-orange-600",
    border: "border-amber-200",
    icon: AlertTriangle,
  },
  bad: {
    hero: "from-red-600 via-red-700 to-rose-800",
    border: "border-red-200",
    icon: XCircle,
  },
} as const;

const TITLE: Record<Status, string> = {
  [STATUS.SETTLED]: "Claim Approved",
  [STATUS.DOCUMENTS_REQUIRED]: "Documents Requested",
  [STATUS.REGRETTED]: "Claim Regretted",
};

interface Props {
  record: OracleRecord;
  aiSeconds: number;
  onNext: () => void;
}

export function OracleStep({ record, aiSeconds, onNext }: Props) {
  const [showJson, setShowJson] = useState(false);
  const [copied, setCopied] = useState(false);

  const intimationNo = String(record.intimation_number || "GH26-DEMO-0001");
  const voucherId = `ACPS-GL-${intimationNo.replace(/[^a-zA-Z0-9]/g, "")}`;
  const memberCode = String(record.member_code || "");
  const claimStatus = String(record.claim_status || STATUS.SETTLED);
  // only a settled claim goes for approval
  const approval = record.approval_status
    ? humanize(String(record.approval_status))
    : "Not needed";
  const claimedAmt = Number(record.claimed_amount) || 0;
  const payableAmt = Number(record.payable_amount) || 0;
  const reviewedBy = String(record.reviewed_by || "Claim Officer");
  const overrideRemarks = String(record.audit_override_remarks || "");
  const settledAt = record.settled_at
    ? String(record.settled_at).replace("T", " ")
    : "Just now";

  const status = claimStatus as Status;
  const tone = STATUS_TONE[status] ?? "good";
  const HeroIcon = TONE[tone].icon;

  const copyPayload = () => {
    navigator.clipboard.writeText(JSON.stringify(record, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      {/* Executive Hero Confirmation Card (Action Item 10: ACPS Submit) */}
      <Card className={`overflow-hidden shadow-md ${TONE[tone].border}`}>
        <div
          className={`bg-gradient-to-r ${TONE[tone].hero} px-6 py-6 text-white`}
        >
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <div className="grid size-12 place-items-center rounded-xl bg-white/15 backdrop-blur">
                <HeroIcon className="size-7 text-white" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-xl font-bold tracking-tight">
                    {TITLE[status] ?? "Decision Saved"}
                  </h2>
                  <Badge className="border-0 bg-white/20 text-white hover:bg-white/30 text-xs">
                    Saved in ACPS
                  </Badge>
                </div>
                <p className="text-sm text-emerald-50">
                  Claim{" "}
                  <span className="font-mono font-semibold">
                    {intimationNo}
                  </span>{" "}
                  is saved in ACPS.
                </p>
              </div>
            </div>

            <div className="mt-2 text-left sm:mt-0 sm:text-right">
              <div className="text-xs font-medium uppercase tracking-wider text-emerald-100">
                Amount to Pay
              </div>
              <div className="text-2xl font-extrabold tracking-tight sm:text-3xl">
                {bdt(payableAmt)}
              </div>
            </div>
          </div>
        </div>

        <CardContent className="grid gap-6 p-6">
          {/* Key Transaction Metrics */}
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <div className="rounded-lg border bg-muted/40 p-3.5">
              <div className="text-xs text-muted-foreground">Voucher No.</div>
              <div className="font-mono text-sm font-semibold">{voucherId}</div>
              {memberCode && (
                <div className="text-[10px] text-muted-foreground mt-0.5">
                  Member: {memberCode}
                </div>
              )}
            </div>
            <div className="rounded-lg border bg-muted/40 p-3.5">
              <div className="text-xs text-muted-foreground">
                Claim Decision
              </div>
              <div
                className={`text-sm font-semibold capitalize ${TONE_TEXT[tone]}`}
              >
                {claimStatus.toLowerCase()}
              </div>
              {claimedAmt > 0 && (
                <div className="text-[10px] text-muted-foreground mt-0.5">
                  Claimed: {bdt(claimedAmt)}
                </div>
              )}
            </div>
            <div className="rounded-lg border bg-muted/40 p-3.5">
              <div className="text-xs text-muted-foreground">Approval</div>
              <div
                className={`text-sm font-semibold ${record.approval_status ? "text-indigo-700" : "text-muted-foreground"}`}
              >
                {approval}
              </div>
            </div>
            <div className="rounded-lg border bg-muted/40 p-3.5">
              <div className="text-xs text-muted-foreground">Saved At</div>
              <div className="text-sm font-semibold">{settledAt}</div>
            </div>
          </div>

          <Separator />

          <div className="space-y-3">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Handled By
            </h3>
            <div className="flex items-start gap-3 rounded-lg border p-3">
              <FileCheck className="mt-0.5 size-4 text-[var(--glil-orange)] shrink-0" />
              <div className="text-xs">
                <div className="font-medium text-foreground">Claim Officer</div>
                <div className="text-muted-foreground">
                  <span className="font-semibold text-foreground">
                    {reviewedBy}
                  </span>{" "}
                  checked the details against the documents, confirmed the
                  decision and saved the claim.
                </div>
              </div>
            </div>
            {overrideRemarks && (
              <div className="rounded-lg border border-amber-200 bg-amber-50/60 p-3 text-xs text-amber-950">
                <div className="font-medium">
                  Saved although the double-check said look again
                </div>
                <div className="text-amber-900/80">
                  Reason: {overrideRemarks}
                </div>
              </div>
            )}
          </div>

          {/* Turnaround Time Metric (Action Item 5: Removed Legacy Manual Time) */}
          <div className="rounded-xl border border-indigo-100 bg-indigo-50/60 p-4">
            <div className="flex items-center gap-2 mb-2">
              <Clock className="size-4 text-indigo-700" />
              <span className="text-xs font-bold uppercase tracking-wider text-indigo-900">
                How Fast It Was
              </span>
            </div>
            <div className="rounded-lg border border-indigo-200/60 bg-white/70 p-3 text-xs">
              <div className="text-muted-foreground">AI time</div>
              <div className="text-lg font-bold text-indigo-900 mt-0.5">
                {aiSeconds.toFixed(1)} seconds
              </div>
              <div className="text-[11px] text-muted-foreground">
                Reading the claim documents and checking the claim
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
                <span>Technical details (for IT)</span>
              </span>
              {showJson ? (
                <ChevronUp className="size-4" />
              ) : (
                <ChevronDown className="size-4" />
              )}
            </button>

            {showJson && (
              <div className="border-t bg-muted/60 p-3">
                <div className="flex justify-end mb-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-7 text-xs gap-1"
                    onClick={copyPayload}
                  >
                    <Copy className="size-3" />{" "}
                    {copied ? "Copied!" : "Copy JSON"}
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
            If you upload these documents again, we will flag it as a duplicate.
          </p>
          <Button
            size="lg"
            className="w-full sm:w-auto bg-[var(--glil-orange)] hover:bg-[var(--glil-orange-hover)] text-white gap-2 font-medium"
            onClick={onNext}
          >
            <RefreshCw className="size-4" /> Start Another Claim
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
