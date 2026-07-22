import type { LucideIcon } from "lucide-react";
import { ArrowDownRight, ArrowUpRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface Props {
  label: string;
  value: string;
  delta?: number;
  icon: LucideIcon;
  tone?: "primary" | "safe" | "warning" | "suspicious" | "critical" | "info";
  hint?: string;
}
const TONE: Record<NonNullable<Props["tone"]>, string> = {
  primary: "bg-primary/15 text-primary",
  safe: "bg-safe/15 text-safe",
  warning: "bg-warning/15 text-warning",
  suspicious: "bg-suspicious/15 text-suspicious",
  critical: "bg-critical/15 text-critical",
  info: "bg-info/15 text-info",
};

export function StatCard({ label, value, delta, icon: Icon, tone = "primary", hint }: Props) {
  const up = (delta ?? 0) >= 0;
  return (
    <div className="glass-card p-5 relative overflow-hidden group">
      <div className="flex items-start justify-between">
        <div>
          <div className="text-xs uppercase tracking-wider text-muted-foreground">{label}</div>
          <div className="mt-2 text-3xl font-semibold tracking-tight font-display">{value}</div>
          {hint && <div className="mt-1 text-[11px] text-muted-foreground">{hint}</div>}
        </div>
        <div className={cn("h-10 w-10 rounded-lg flex items-center justify-center", TONE[tone])}>
          <Icon className="h-5 w-5" />
        </div>
      </div>
      {typeof delta === "number" && (
        <div className="mt-3 flex items-center gap-1 text-xs">
          <span
            className={cn(
              "inline-flex items-center gap-1 rounded-full px-1.5 py-0.5 font-medium",
              up ? "bg-safe/15 text-safe" : "bg-critical/15 text-critical",
            )}
          >
            {up ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
            {Math.abs(delta)}%
          </span>
          <span className="text-muted-foreground">vs last hour</span>
        </div>
      )}
      <div className="pointer-events-none absolute inset-x-0 -bottom-px h-px bg-gradient-to-r from-transparent via-primary/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
    </div>
  );
}
