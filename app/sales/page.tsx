import { redirect } from "next/navigation";
import Link from "next/link";
import { Users, UserCheck, DollarSign, PhoneCall, ArrowUpRight, Clock } from "lucide-react";
import { getCurrentProfile } from "@/lib/supabase/profile";
import { getMyBusinesses } from "@/lib/data/businesses";
import { getMyCommissions, summarizeCommissions } from "@/lib/data/commissions";
import { computeRankProgress, computeSalespersonStats } from "@/lib/progression/engine";
import { formatCurrency, formatDate, initials } from "@/lib/format";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { EmptyState } from "@/components/ui/empty-state";
import { RankBadge } from "@/components/progression/rank-badge";

export const dynamic = "force-dynamic";

export default async function SalesOverviewPage() {
  const profile = await getCurrentProfile();
  if (!profile) redirect("/login");

  const [businesses, commissions] = await Promise.all([getMyBusinesses(profile.id), getMyCommissions(profile.id)]);
  const { pending, lifetime } = summarizeCommissions(commissions);
  const stats = await computeSalespersonStats(profile.id);
  const rankProgress = await computeRankProgress(stats.businessesSoldLifetime);
  const customers = businesses.filter((b) => ["paying_customer", "commission_1_pending", "commission_1_paid", "commission_2_pending", "commission_2_paid", "completed"].includes(b.status)).length;
  const totalCalls = businesses.reduce((sum, b) => sum + b.call_attempts, 0);

  const today = new Date().toISOString().slice(0, 10);
  const needsAttention = businesses
    .filter((b) => (b.next_followup && b.next_followup <= today) || b.status === "new_lead")
    .sort((a, b) => (a.next_followup || "9999").localeCompare(b.next_followup || "9999"))
    .slice(0, 6);

  return (
    <div>
      <div className="flex items-center gap-3">
        <Avatar className="h-14 w-14"><AvatarFallback className="text-[16px]">{initials(profile.full_name)}</AvatarFallback></Avatar>
        <RankBadge rank={rankProgress.currentRank} size="sm" />
        <div>
          <h1 className="font-display text-[22px] font-semibold text-ink">Welcome back, {profile.full_name.split(" ")[0]}</h1>
          <p className="mt-0.5 text-[13px] text-text-muted">
            {rankProgress.currentRank?.name || "Getting started"} · Member since {formatDate(profile.created_at)}
          </p>
        </div>
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-2xl border border-border bg-card p-5 shadow-card"><div className="flex items-center justify-between"><span className="text-[12.5px] text-text-muted">My leads</span><Users className="h-4 w-4 text-brand" /></div><div className="mt-2 font-display text-[28px] font-semibold text-ink">{businesses.length}</div></div>
        <div className="rounded-2xl border border-border bg-card p-5 shadow-card"><div className="flex items-center justify-between"><span className="text-[12.5px] text-text-muted">My customers</span><UserCheck className="h-4 w-4 text-success" /></div><div className="mt-2 font-display text-[28px] font-semibold text-ink">{customers}</div></div>
        <div className="rounded-2xl border border-border bg-card p-5 shadow-card"><div className="flex items-center justify-between"><span className="text-[12.5px] text-text-muted">Calls made</span><PhoneCall className="h-4 w-4 text-brand" /></div><div className="mt-2 font-display text-[28px] font-semibold text-ink">{totalCalls}</div></div>
        <div className="rounded-2xl border border-border bg-card p-5 shadow-card"><div className="flex items-center justify-between"><span className="text-[12.5px] text-text-muted">Pending commission</span><DollarSign className="h-4 w-4 text-warning" /></div><div className="mt-2 font-display text-[28px] font-semibold text-ink">{formatCurrency(pending)}</div></div>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1.3fr_1fr]">
        <div className="rounded-2xl border border-border bg-card p-5 shadow-card">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-[15px] font-semibold text-ink">Needs your attention</h2>
            <Link href="/sales/leads" className="flex items-center gap-1 text-[12px] font-medium text-brand hover:underline">All leads <ArrowUpRight className="h-3 w-3" /></Link>
          </div>
          {needsAttention.length === 0 ? (
            <EmptyState icon={Clock} title="You're all caught up" description="No overdue follow-ups and no untouched leads right now — nice work." className="mt-3 border-none bg-transparent px-0 py-8" />
          ) : (
            <div className="mt-3 divide-y divide-border-soft">
              {needsAttention.map((b) => (
                <Link key={b.id} href={`/sales/businesses/${b.id}`} className="flex items-center justify-between py-3 hover:bg-paper">
                  <div>
                    <div className="text-[13px] font-medium text-text">{b.business_name}</div>
                    <div className="text-[12px] text-text-faint">{b.status === "new_lead" ? "Never contacted" : b.next_followup && b.next_followup < today ? `Follow-up overdue since ${formatDate(b.next_followup)}` : "Follow-up due today"}</div>
                  </div>
                  <ArrowUpRight className="h-3.5 w-3.5 text-text-faint" />
                </Link>
              ))}
            </div>
          )}
        </div>

        <div className="rounded-2xl border border-border bg-card p-5 shadow-card">
          <h2 className="font-display text-[15px] font-semibold text-ink">Lifetime earnings</h2>
          <div className="mt-2 font-display text-[32px] font-semibold text-brand">{formatCurrency(lifetime)}</div>
          {rankProgress.nextRank && (
            <div className="mt-4 border-t border-border-soft pt-4">
              <div className="mb-1.5 flex justify-between text-[12px] text-text-muted">
                <span>Next rank: {rankProgress.nextRank.badge_emoji} {rankProgress.nextRank.name}</span>
                <span>{rankProgress.progressPercent}%</span>
              </div>
              <div className="h-1.5 w-full overflow-hidden rounded-full bg-border-soft"><div className="h-full rounded-full bg-brand" style={{ width: `${rankProgress.progressPercent}%` }} /></div>
            </div>
          )}
          <Link href="/sales/progression" className="mt-4 flex items-center gap-1 text-[12.5px] font-medium text-brand hover:underline">View full progression <ArrowUpRight className="h-3.5 w-3.5" /></Link>
        </div>
      </div>
    </div>
  );
}
