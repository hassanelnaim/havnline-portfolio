import type { DbRank } from "@/lib/database/types";
import { cn } from "@/lib/utils";

/**
 * A real, consistent visual signature for rank — not just colored
 * text. This is the deliberate "one bold moment" of the app: wherever
 * a rank appears (profile headers, salesperson cards, top performers),
 * it should look like this same distinctive shield shape, not a plain
 * emoji-and-label pairing.
 */
export function RankBadge({ rank, size = "md" }: { rank: DbRank | null; size?: "sm" | "md" | "lg" }) {
  const dims = { sm: "h-8 w-8 text-[14px]", md: "h-11 w-11 text-[18px]", lg: "h-16 w-16 text-[28px]" }[size];
  const color = rank?.color || "#9AA3B2";

  return (
    <div
      className={cn("relative flex shrink-0 items-center justify-center", dims)}
      style={{
        clipPath: "polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)",
        background: `linear-gradient(155deg, ${color}, ${color}CC)`,
      }}
    >
      <span className="drop-shadow-sm">{rank?.badge_emoji || "—"}</span>
    </div>
  );
}
