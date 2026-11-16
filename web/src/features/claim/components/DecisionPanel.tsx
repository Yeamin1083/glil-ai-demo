import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { AiBadge } from "@/shared/components/AiBadge";
import {
  AI_CALL,
  SETTLEMENT_OPTIONS,
  STATUS_LABEL,
  STATUS_TONE,
  TONE_TEXT,
} from "@/shared/constants";
import { bdt } from "@/shared/format";
import type { Review, Status } from "../types";

interface Props {
  review: Review;
  busy: boolean;
  onDecide: (status: Status, remarks: string) => void;
}

// the claim officer can change the AI's decision, with their own remarks
export function DecisionPanel({ review, busy, onDecide }: Props) {
  const [pick, setPick] = useState<Status | null>(null);
  const [note, setNote] = useState<string | null>(null);

  const selected = pick ?? review.status;
  const remarks = note ?? review.officer_remarks;
  const changesAi = selected !== review.ai_status;
  const dirty =
    selected !== review.status || remarks !== review.officer_remarks;
  const canApply = dirty && !busy && (!changesAi || remarks.trim() !== "");

  return (
    <section className="grid gap-3 rounded-xl border bg-muted/30 p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
          Your decision
        </h3>
        <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <AiBadge call={AI_CALL.PROCESS} /> suggests
          <strong
            className={cn("text-sm", TONE_TEXT[STATUS_TONE[review.ai_status]])}
          >
            {STATUS_LABEL[review.ai_status]}
          </strong>
        </span>
      </div>
      <div
        className="flex flex-wrap gap-2"
        role="radiogroup"
        aria-label="Settlement decision"
      >
        {SETTLEMENT_OPTIONS.map((o) => (
          <button
            key={o.status}
            type="button"
            role="radio"
            aria-checked={selected === o.status}
            onClick={() => setPick(o.status)}
            className={cn(
              "rounded-full border px-4 py-1.5 text-xs font-semibold transition-colors cursor-pointer",
              selected === o.status
                ? "border-[var(--glil-orange)] bg-[var(--glil-orange)] text-white"
                : "border-slate-300 bg-white text-slate-700 hover:bg-slate-50",
            )}
          >
            {o.label}
          </button>
        ))}
      </div>
      <Textarea
        value={remarks}
        onChange={(e) => setNote(e.target.value)}
        placeholder={
          changesAi
            ? "Your remarks (needed to change the AI decision)"
            : "Your remarks (optional)"
        }
        className="min-h-16 bg-white text-xs"
      />
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="text-xs text-muted-foreground">
          We pay{" "}
          <strong className="text-sm text-foreground">
            {bdt(review.total_payable)}
          </strong>
          {changesAi && remarks.trim() === "" && (
            <span className="ml-3 text-amber-800">
              Add your remarks to change the decision.
            </span>
          )}
        </span>
        <Button
          size="sm"
          onClick={() => onDecide(selected, remarks.trim())}
          disabled={!canApply}
        >
          {busy ? "Saving…" : "Apply decision"}
        </Button>
      </div>
    </section>
  );
}
