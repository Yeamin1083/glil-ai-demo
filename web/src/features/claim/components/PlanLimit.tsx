import { TableCell, TableHead } from "@/components/ui/table";
import { cn } from "@/lib/utils";
import { bdt } from "@/shared/format";
import type { Member } from "../types";

export interface LimitInfo {
  limit: number;
  consumed: number;
  remaining: number;
  count_limit: number | null;
  count_used: number;
}

// the position before this claim, for the review screen (the server works it out per line on adjudication)
export function limitBefore(member: Member, category: string): LimitInfo {
  const used = member.items[category] ?? { amount: 0, count: 0 };
  const cap = member.plan.item_limits[category];
  const count_limit = member.plan.item_count_limits[category] ?? null;
  if (cap !== undefined) {
    return {
      limit: cap,
      consumed: used.amount,
      remaining: Math.min(
        Math.max(cap - used.amount, 0),
        member.limit_remaining,
      ),
      count_limit,
      count_used: used.count,
    };
  }
  const limit = member.plan.opd_limit;
  return {
    limit,
    consumed: limit - member.limit_remaining,
    remaining: member.limit_remaining,
    count_limit,
    count_used: used.count,
  };
}

// ACPS heads this "Limit - Consumed - Remaining"; split into three columns so the figures line up
export function LimitHeads() {
  return (
    <>
      <TableHead className="border-l text-right">Limit</TableHead>
      <TableHead className="text-right">Used</TableHead>
      <TableHead className="border-r text-right">Remaining</TableHead>
    </>
  );
}

export function LimitGroupHead() {
  return (
    <TableHead
      colSpan={3}
      className="h-7 border-x text-center text-xs text-muted-foreground"
    >
      Plan limit
    </TableHead>
  );
}

export function LimitCells({ info }: { info: LimitInfo }) {
  const left = info.limit ? info.remaining / info.limit : 0;
  const countUsedUp =
    info.count_limit !== null && info.count_used >= info.count_limit;
  return (
    <>
      <TableCell className="border-l text-right align-top text-muted-foreground tabular-nums">
        {bdt(info.limit)}
      </TableCell>
      <TableCell className="text-right align-top text-muted-foreground tabular-nums">
        {bdt(info.consumed)}
      </TableCell>
      <TableCell className="min-w-28 border-r text-right align-top">
        <div
          className={cn(
            "font-semibold tabular-nums",
            info.remaining === 0 && "text-red-600",
          )}
        >
          {bdt(info.remaining)}
        </div>
        <div
          className="mt-1.5 ml-auto h-1 w-20 overflow-hidden rounded-full bg-muted"
          aria-hidden="true"
        >
          <div
            className={cn(
              "h-full rounded-full",
              left > 0.25
                ? "bg-emerald-500"
                : left > 0
                  ? "bg-amber-500"
                  : "bg-red-500",
            )}
            style={{ width: `${Math.round(left * 100)}%` }}
          />
        </div>
        {info.count_limit !== null && (
          <div
            className={cn(
              "mt-1 text-xs text-muted-foreground",
              countUsedUp && "text-red-600",
            )}
          >
            {info.count_used} of {info.count_limit} times used
          </div>
        )}
      </TableCell>
    </>
  );
}
