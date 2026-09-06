import { Users, UserCheck, DollarSign, TrendingUp } from "lucide-react";
import { getAllBusinesses, countByStatus } from "@/lib/data/businesses";
import { getAllCommissions, summarizeCommissions } from "@/lib/data/commissions";
import { getAllSalespeople } from "@/lib/data/profiles";
import { formatCurrency } from "@/lib/format";
import { StatusBadge } from "@/components/leads/status-badge";
import { PIPELINE_LABELS } from "@/lib/database/types";

export const dynamic = "force-dynamic";

export default async function AdminOverviewPage() {
  const [businesses, commissions, salespeople] = await Promise.all([getAllBusinesses(), getAllCommissions(), getAllSalespeople()]);

  const unassigned = businesses.filter((b) => !b.assigned_to).length;
  const customers = businesses.filter((b) => ["paying_customer", "commission_1_pending", "commission_1_paid", "commission_2_pending", "commission_2_paid", "completed"].includes(b.status)).length;
  const { pending, paid } = summarizeCommissions(commissions);
  const statusCounts = countByStatus(businesses);

  return (
    <div>
      <h1 className="font-display text-[24px] font-semibold text-ink">Overview</h1>
      <p className="mt-1 text-[13.5px] text-text-muted">The whole sales organization, at a glance.</p>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-2xl border border-border bg-card p-5 shadow-card">
          <div className="flex items-center justify-between"><span className="text-[11px] font-semibold uppercase tracking-wide text-text-faint">Total leads</span><Users className="h-4 w-4 text-brand" /></div>
          <div className="mt-2 font-display text-[28px] font-semibold text-ink">{businesses.length}</div>
          <div className="mt-1 text-[11.5px] text-text-faint">{unassigned} unassigned</div>
        </div>
        <div className="rounded-2xl border border-border bg-card p-5 shadow-card">
          <div className="flex items-center justify-between"><span className="text-[11px] font-semibold uppercase tracking-wide text-text-faint">Customers</span><UserCheck className="h-4 w-4 text-success" /></div>
          <div className="mt-2 font-display text-[28px] font-semibold text-ink">{customers}</div>
        </div>
        <div className="rounded-2xl border border-border bg-card p-5 shadow-card">
          <div className="flex items-center justify-between"><span className="text-[11px] font-semibold uppercase tracking-wide text-text-faint">Commissions owed</span><DollarSign className="h-4 w-4 text-warning" /></div>
          <div className="mt-2 font-display text-[28px] font-semibold text-ink">{formatCurrency(pending)}</div>
        </div>
        <div className="rounded-2xl border border-border bg-card p-5 shadow-card">
          <div className="flex items-center justify-between"><span className="text-[11px] font-semibold uppercase tracking-wide text-text-faint">Salespeople</span><TrendingUp className="h-4 w-4 text-brand" /></div>
          <div className="mt-2 font-display text-[28px] font-semibold text-ink">{salespeople.length}</div>
        </div>
      </div>

      <div className="mt-6 rounded-2xl border border-border bg-card p-5 shadow-card">
        <h2 className="mb-3 font-display text-[15px] font-semibold text-ink">Pipeline</h2>
        <div className="flex flex-wrap gap-2">
          {(Object.keys(PIPELINE_LABELS) as (keyof typeof PIPELINE_LABELS)[]).map((status) => (
            statusCounts[status] ? (
              <div key={status} className="flex items-center gap-2 rounded-full border border-border bg-paper px-3 py-1.5">
                <StatusBadge status={status} /><span className="text-[12px] font-medium text-text">{statusCounts[status]}</span>
              </div>
            ) : null
          ))}
        </div>
      </div>
    </div>
  );
}
