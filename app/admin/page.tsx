import Link from "next/link";
import { Users, UserCheck, DollarSign, TrendingUp, PhoneCall, ArrowUpRight } from "lucide-react";
import { getAllBusinesses, countByStatus } from "@/lib/data/businesses";
import { getAllCommissions, summarizeCommissions } from "@/lib/data/commissions";
import { getAllSalespeople } from "@/lib/data/profiles";
import { getRecentActivityCompanyWide } from "@/lib/data/activity";
import { computeSalespersonStats } from "@/lib/progression/engine";
import { formatCurrency } from "@/lib/format";
import { StatusBadge } from "@/components/leads/status-badge";
import { EmptyState } from "@/components/ui/empty-state";
import { PIPELINE_LABELS } from "@/lib/database/types";

export const dynamic = "force-dynamic";

const ACTIVITY_VERBS: Record<string, string> = {
  call: "logged a call with",
  note: "left a note on",
  status_change: "updated the status of",
  followup_scheduled: "scheduled a follow-up for",
};

export default async function AdminOverviewPage() {
  const [businesses, commissions, salespeople, recentActivity] = await Promise.all([
    getAllBusinesses(), getAllCommissions(), getAllSalespeople(), getRecentActivityCompanyWide(8),
  ]);

  const unassigned = businesses.filter((b) => !b.assigned_to).length;
  const called = businesses.filter((b) => b.call_attempts > 0).length;
  const customers = businesses.filter((b) => ["paying_customer", "commission_1_pending", "commission_1_paid", "commission_2_pending", "commission_2_paid", "completed"].includes(b.status)).length;
  const { pending } = summarizeCommissions(commissions);
  const statusCounts = countByStatus(businesses);
  const totalInPipeline = businesses.length || 1;

  const performerStats = await Promise.all(
    salespeople.map(async (s) => ({ salesperson: s, stats: await computeSalespersonStats(s.id) }))
  );
  const topPerformers = performerStats
    .filter((p) => p.stats.salesThisMonth > 0)
    .sort((a, b) => b.stats.salesThisMonth - a.stats.salesThisMonth)
    .slice(0, 5);

  return (
    <div>
      <h1 className="font-display text-[24px] font-semibold text-ink">Overview</h1>
      <p className="mt-1 text-[13.5px] text-text-muted">The whole sales organization, at a glance.</p>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <div className="rounded-2xl border border-border bg-card p-5 shadow-card">
          <div className="flex items-center justify-between"><span className="text-[12.5px] text-text-muted">Total leads</span><Users className="h-4 w-4 text-brand" /></div>
          <div className="mt-2 font-display text-[28px] font-semibold text-ink">{businesses.length}</div>
          <div className="mt-1 text-[11.5px] text-text-faint">{unassigned} unassigned</div>
        </div>
        <div className="rounded-2xl border border-border bg-card p-5 shadow-card">
          <div className="flex items-center justify-between"><span className="text-[12.5px] text-text-muted">Calls made</span><PhoneCall className="h-4 w-4 text-brand" /></div>
          <div className="mt-2 font-display text-[28px] font-semibold text-ink">{called}</div>
          <div className="mt-1 text-[11.5px] text-text-faint">of {businesses.length} leads</div>
        </div>
        <div className="rounded-2xl border border-border bg-card p-5 shadow-card">
          <div className="flex items-center justify-between"><span className="text-[12.5px] text-text-muted">Customers</span><UserCheck className="h-4 w-4 text-success" /></div>
          <div className="mt-2 font-display text-[28px] font-semibold text-ink">{customers}</div>
        </div>
        <div className="rounded-2xl border border-border bg-card p-5 shadow-card">
          <div className="flex items-center justify-between"><span className="text-[12.5px] text-text-muted">Commissions owed</span><DollarSign className="h-4 w-4 text-warning" /></div>
          <div className="mt-2 font-display text-[28px] font-semibold text-ink">{formatCurrency(pending)}</div>
        </div>
        <div className="rounded-2xl border border-border bg-card p-5 shadow-card">
          <div className="flex items-center justify-between"><span className="text-[12.5px] text-text-muted">Salespeople</span><TrendingUp className="h-4 w-4 text-brand" /></div>
          <div className="mt-2 font-display text-[28px] font-semibold text-ink">{salespeople.length}</div>
        </div>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1.3fr_1fr]">
        <div className="space-y-6">
          <div className="rounded-2xl border border-border bg-card p-5 shadow-card">
            <h2 className="font-display text-[15px] font-semibold text-ink">Pipeline</h2>
            <div className="mt-4 space-y-2.5">
              {(Object.keys(PIPELINE_LABELS) as (keyof typeof PIPELINE_LABELS)[])
                .filter((status) => statusCounts[status])
                .map((status) => {
                  const count = statusCounts[status];
                  const pct = Math.round((count / totalInPipeline) * 100);
                  return (
                    <div key={status}>
                      <div className="mb-1 flex items-center justify-between text-[12.5px]">
                        <span className="text-text">{PIPELINE_LABELS[status]}</span>
                        <span className="text-text-muted">{count}</span>
                      </div>
                      <div className="h-1.5 w-full overflow-hidden rounded-full bg-border-soft">
                        <div className="h-full rounded-full bg-brand" style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  );
                })}
            </div>
          </div>

          <div className="rounded-2xl border border-border bg-card p-5 shadow-card">
            <h2 className="font-display text-[15px] font-semibold text-ink">Recent activity</h2>
            {recentActivity.length === 0 ? (
              <p className="mt-3 text-[13px] text-text-muted">Nothing logged yet — activity from every business will show up here as your team works their leads.</p>
            ) : (
              <div className="mt-3 divide-y divide-border-soft">
                {recentActivity.map((a: any) => (
                  <div key={a.id} className="py-3 text-[13px] text-text">
                    <span className="text-text-muted">{ACTIVITY_VERBS[a.type] || "updated"}</span>{" "}
                    <span className="font-medium">{a.businesses?.business_name || "a business"}</span>
                    {a.content && <div className="mt-0.5 text-[12.5px] text-text-muted">&ldquo;{a.content}&rdquo;</div>}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="rounded-2xl border border-border bg-card p-5 shadow-card">
          <h2 className="font-display text-[15px] font-semibold text-ink">Top performers this month</h2>
          {topPerformers.length === 0 ? (
            <EmptyState
              icon={TrendingUp}
              title="No sales yet this month"
              description="Once a lead's first payment comes in, your top performers will show up here."
              className="mt-3 border-none bg-transparent px-0 py-6"
            />
          ) : (
            <div className="mt-4 space-y-3">
              {topPerformers.map((p, i) => (
                <div key={p.salesperson.id} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-paper text-[11px] font-semibold text-text-muted">{i + 1}</span>
                    <span className="text-[13px] font-medium text-text">{p.salesperson.full_name}</span>
                  </div>
                  <span className="text-[12.5px] text-text-muted">{p.stats.salesThisMonth} sold</span>
                </div>
              ))}
            </div>
          )}
          <Link href="/admin/salespeople" className="mt-4 flex items-center gap-1 text-[12.5px] font-medium text-brand hover:underline">
            View all salespeople <ArrowUpRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </div>
    </div>
  );
}
