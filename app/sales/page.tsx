import { redirect } from "next/navigation";
import { Users, UserCheck, DollarSign, PhoneCall } from "lucide-react";
import { getCurrentProfile } from "@/lib/supabase/profile";
import { getMyBusinesses } from "@/lib/data/businesses";
import { getMyCommissions, summarizeCommissions } from "@/lib/data/commissions";
import { formatCurrency } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function SalesOverviewPage() {
  const profile = await getCurrentProfile();
  if (!profile) redirect("/login");

  const [businesses, commissions] = await Promise.all([getMyBusinesses(profile.id), getMyCommissions(profile.id)]);
  const { pending, lifetime } = summarizeCommissions(commissions);
  const customers = businesses.filter((b) => ["paying_customer", "commission_1_pending", "commission_1_paid", "commission_2_pending", "commission_2_paid", "completed"].includes(b.status)).length;
  const totalCalls = businesses.reduce((sum, b) => sum + b.call_attempts, 0);

  return (
    <div>
      <h1 className="font-display text-[24px] font-semibold text-ink">Welcome back, {profile.full_name.split(" ")[0]}</h1>
      <p className="mt-1 text-[13.5px] text-text-muted">Here's how your book is doing.</p>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-2xl border border-border bg-card p-5 shadow-card"><div className="flex items-center justify-between"><span className="text-[11px] font-semibold uppercase tracking-wide text-text-faint">My leads</span><Users className="h-4 w-4 text-brand" /></div><div className="mt-2 font-display text-[28px] font-semibold text-ink">{businesses.length}</div></div>
        <div className="rounded-2xl border border-border bg-card p-5 shadow-card"><div className="flex items-center justify-between"><span className="text-[11px] font-semibold uppercase tracking-wide text-text-faint">My customers</span><UserCheck className="h-4 w-4 text-success" /></div><div className="mt-2 font-display text-[28px] font-semibold text-ink">{customers}</div></div>
        <div className="rounded-2xl border border-border bg-card p-5 shadow-card"><div className="flex items-center justify-between"><span className="text-[11px] font-semibold uppercase tracking-wide text-text-faint">Calls made</span><PhoneCall className="h-4 w-4 text-brand" /></div><div className="mt-2 font-display text-[28px] font-semibold text-ink">{totalCalls}</div></div>
        <div className="rounded-2xl border border-border bg-card p-5 shadow-card"><div className="flex items-center justify-between"><span className="text-[11px] font-semibold uppercase tracking-wide text-text-faint">Pending commission</span><DollarSign className="h-4 w-4 text-warning" /></div><div className="mt-2 font-display text-[28px] font-semibold text-ink">{formatCurrency(pending)}</div></div>
      </div>

      <div className="mt-6 rounded-2xl border border-border bg-card p-5 shadow-card">
        <div className="text-[11px] font-semibold uppercase tracking-wide text-text-faint">Lifetime earnings</div>
        <div className="mt-2 font-display text-[32px] font-semibold text-brand">{formatCurrency(lifetime)}</div>
      </div>
    </div>
  );
}
