import { cn } from "@/lib/utils";
import type { Severity } from "@/lib/mock-data";

const MAP: Record<Severity, string> = {
  Critical: "bg-critical/15 text-critical border border-critical/30",
  High: "bg-suspicious/15 text-suspicious border border-suspicious/30",
  Medium: "bg-warning/15 text-warning border border-warning/30",
  Low: "bg-safe/15 text-safe border border-safe/30",
};

export function SeverityBadge({ level }: { level: Severity }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[11px] font-medium",
        MAP[level],
      )}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-current" />
      {level}
    </span>
  );
}
