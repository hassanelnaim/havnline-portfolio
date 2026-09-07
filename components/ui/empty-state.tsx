import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * An empty state is an invitation to act, not just an apology for
 * having nothing to show — always pairs the explanation with a real
 * next step.
 */
export function EmptyState({
  icon: Icon, title, description, action, className,
}: {
  icon: LucideIcon; title: string; description: string; action?: React.ReactNode; className?: string;
}) {
  return (
    <div className={cn("flex flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-card px-6 py-14 text-center", className)}>
      <div className="flex h-11 w-11 items-center justify-center rounded-full bg-brand-soft text-brand"><Icon className="h-5 w-5" /></div>
      <div className="mt-3 font-display text-[15px] font-semibold text-ink">{title}</div>
      <p className="mt-1 max-w-xs text-[13px] text-text-muted">{description}</p>
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
