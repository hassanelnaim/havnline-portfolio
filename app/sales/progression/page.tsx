import { redirect } from "next/navigation";
import { getCurrentProfile } from "@/lib/supabase/profile";
import { computeSalespersonStats, computeRankProgress } from "@/lib/progression/engine";
import { getAllMilestones, getUnlockedMilestones, getAllPromotions, getSalespersonPromotionHistory } from "@/lib/data/progression";
import { createClient } from "@/lib/supabase/server";
import { formatCurrency, formatDate } from "@/lib/format";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { RankBadge } from "@/components/progression/rank-badge";

export const dynamic = "force-dynamic";

export default async function SalesProgressionPage() {
  const profile = await getCurrentProfile();
  if (!profile) redirect("/login");

  const stats = await computeSalespersonStats(profile.id);
  const rankProgress = await computeRankProgress(stats.businessesSoldLifetime);
  const [allMilestones, unlockedMilestones, allPromotions, promotionHistory] = await Promise.all([
    getAllMilestones(), getUnlockedMilestones(profile.id), getAllPromotions(), getSalespersonPromotionHistory(profile.id),
  ]);

  const supabase = createClient();
  const { data: fullProfile } = await supabase.from("profiles").select("current_promotion_id").eq("id", profile.id).single();
  const currentPromotion = allPromotions.find((p) => p.id === fullProfile?.current_promotion_id);
  const nextPromotion = allPromotions
    .filter((p) => p.required_businesses_sold > stats.businessesSoldLifetime)
    .sort((a, b) => a.required_businesses_sold - b.required_businesses_sold)[0];

  const unlockedIds = new Set(unlockedMilestones.map((m) => m.milestone_id));
  const visibleMilestones = allMilestones.filter((m) => m.is_visible);

  return (
    <div>
      {/* The one bold moment — rank is the thing this whole page exists to show, so it gets real weight, not a plain card. */}
      <div className="overflow-hidden rounded-2xl bg-ink p-7 text-white shadow-card">
        <div className="flex flex-wrap items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <RankBadge rank={rankProgress.currentRank} size="lg" />
            <div>
              <div className="text-[12.5px] text-[#8A93A6]">{profile.full_name} · Member since {formatDate(profile.created_at)}</div>
              <div className="mt-0.5 font-display text-[26px] font-semibold" style={{ color: rankProgress.currentRank?.color || "#fff" }}>
                {rankProgress.currentRank?.name || "Unranked"}
              </div>
            </div>
          </div>
          <div className="text-right">
            <div className="text-[12.5px] text-[#8A93A6]">Lifetime sold</div>
            <div className="font-display text-[34px] font-semibold text-white">{stats.businessesSoldLifetime}</div>
          </div>
        </div>

        {rankProgress.nextRank && (
          <div className="mt-6">
            <div className="mb-1.5 flex justify-between text-[12px] text-[#8A93A6]">
              <span>{rankProgress.progressCount} / {rankProgress.progressNeeded - (rankProgress.currentRank?.min_businesses_sold || 0)} to {rankProgress.nextRank.name}</span>
              <span>{rankProgress.progressPercent}%</span>
            </div>
            <div className="h-2 w-full overflow-hidden rounded-full bg-white/10">
              <div className="h-full rounded-full" style={{ width: `${rankProgress.progressPercent}%`, background: `linear-gradient(90deg, ${rankProgress.currentRank?.color || "#2563EB"}, ${rankProgress.nextRank.color})` }} />
            </div>
          </div>
        )}
      </div>

      {/* Everything below is functional, calm data — deliberately not competing with the banner above. */}
      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        <Card><CardContent className="p-5"><div className="text-[12.5px] text-text-muted">Active customers</div><div className="mt-2 font-display text-[24px] font-semibold text-ink">{stats.activeBusinesses}</div></CardContent></Card>
        <Card><CardContent className="p-5"><div className="text-[12.5px] text-text-muted">Commission earned</div><div className="mt-2 font-display text-[24px] font-semibold text-ink">{formatCurrency(stats.commissionEarned)}</div></CardContent></Card>
        <Card><CardContent className="p-5"><div className="text-[12.5px] text-text-muted">Retention</div><div className="mt-2 font-display text-[24px] font-semibold text-ink">{stats.retentionPercent.toFixed(0)}%</div></CardContent></Card>
      </div>

      <Card className="mt-6">
        <CardContent className="p-6">
          <div className="text-[12.5px] text-text-muted">Current position</div>
          <div className="mt-1 font-display text-[20px] font-semibold text-ink">{currentPromotion?.title || "Sales Representative"}</div>
          {nextPromotion && (
            <div className="mt-4 rounded-lg border border-border bg-paper p-4">
              <div className="text-[12.5px] font-medium text-text">Next: {nextPromotion.title}</div>
              <div className="mt-1 text-[12px] text-text-muted">{stats.businessesSoldLifetime} / {nextPromotion.required_businesses_sold} businesses{nextPromotion.required_retention_percent ? ` · ${stats.retentionPercent.toFixed(0)}% / ${nextPromotion.required_retention_percent}% retention` : ""}</div>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="mt-6">
        <h2 className="mb-3 font-display text-[16px] font-semibold text-ink">Milestones</h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {visibleMilestones.map((m) => {
            const unlocked = unlockedIds.has(m.id);
            return (
              <Card key={m.id} className={unlocked ? "border-achievement/30 bg-achievement-soft" : "opacity-45"}>
                <CardContent className="p-4">
                  <div className="text-[24px]">{m.icon}</div>
                  <div className="mt-1.5 text-[13.5px] font-semibold text-ink">{m.name}</div>
                  {m.reward_description && <div className="mt-0.5 text-[12px] text-text-muted">{m.reward_description}</div>}
                  {unlocked && <Badge className="mt-2 bg-achievement text-white">Unlocked</Badge>}
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      {promotionHistory.length > 0 && (
        <div className="mt-6">
          <h2 className="mb-3 font-display text-[16px] font-semibold text-ink">Promotion history</h2>
          <Card>
            <CardContent className="divide-y divide-border-soft p-0">
              {promotionHistory.map((h) => (
                <div key={h.id} className="flex items-center justify-between px-5 py-3.5">
                  <div>
                    <div className="text-[13px] font-medium text-text">{allPromotions.find((p) => p.id === h.promotion_id)?.title}</div>
                    <div className="text-[11.5px] text-text-faint">{formatDate(h.requested_at)}</div>
                  </div>
                  <Badge variant={h.status === "approved" ? "success" : h.status === "denied" ? "danger" : "warning"}>{h.status}</Badge>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
