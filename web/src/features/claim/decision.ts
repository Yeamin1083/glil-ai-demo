import { humanize } from "@/shared/format";
import type { Review } from "./types";

export interface Reason {
  title: string;
  note?: string;
}

// every reason once: the main reason, each failed check, and remarks that say something new
export function regretReasons(review: Review): Reason[] {
  const failed = review.checks.filter((c) => !c.passed);
  const main = review.rejection_reason
    ? humanize(review.rejection_reason)
    : null;
  const reasons: Reason[] = [];
  // ACPS's bare "Others" says nothing; the failed checks explain it
  if (main && !(main === "Others" && failed.length))
    reasons.push({ title: main });
  failed.forEach((c) =>
    reasons.push({ title: `Failed check: ${c.check}`, note: c.detail }),
  );
  const remarks = new Map<string, string[]>();
  review.expenses.forEach((e) =>
    e.remarks.forEach((r) => {
      const text = r.replace(/^claim regretted:\s*/i, "");
      if (main && text.toLowerCase() === main.toLowerCase()) return;
      remarks.set(text, [...(remarks.get(text) ?? []), humanize(e.category)]);
    }),
  );
  remarks.forEach((cats, text) =>
    reasons.push({ title: text, note: `Applies to: ${cats.join(", ")}` }),
  );
  return reasons.length
    ? reasons
    : [{ title: "Something does not match the plan." }];
}
