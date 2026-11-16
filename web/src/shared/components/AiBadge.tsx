import { Sparkles } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { AI_CALL, type AiCall } from "@/shared/constants";

const STYLE: Record<AiCall, string> = {
  [AI_CALL.READ]: "border-orange-200 bg-orange-50 text-[var(--glil-orange)]",
  [AI_CALL.SETTLE]: "border-indigo-200 bg-indigo-50 text-indigo-700",
};

// says which of the two AI calls produced the result next to it
export function AiBadge({
  call,
  className,
}: {
  call: AiCall;
  className?: string;
}) {
  return (
    <Badge
      variant="outline"
      className={cn("gap-1 text-[11px] font-semibold", STYLE[call], className)}
    >
      <Sparkles className="size-3" /> {call}
    </Badge>
  );
}
