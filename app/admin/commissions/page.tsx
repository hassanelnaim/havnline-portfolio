import { getAllCommissions, summarizeCommissions } from "@/lib/data/commissions";
import { getAllBusinesses } from "@/lib/data/businesses";
import { getAllSalespeople } from "@/lib/data/profiles";
import { CommissionsClient } from "@/components/admin/commissions-client";
import { formatCurrency } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function CommissionsPage() {
  const [commissions, businesses, salespeople] = await Promise.all([getAllCommissions(), getAllBusinesses(), getAllSalespeople()]);
  const { pending, paid } = summarizeCommissions(commissions);

  return (
    <div>
      <h1 className="font-display text-[24px] font-semibold text-ink">Commissions</h1>
      <p className="mt-1 text-[13.5px] text-text-muted">Every commission owed and paid, across the whole team.</p>

      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        <div className="rounded-2xl border border-border bg-card p-5 shadow-card"><div className="text-[12.5px] text-text-muted">Total pending</div><div className="mt-2 font-display text-[28px] font-semibold text-warning">{formatCurrency(pending)}</div></div>
        <div className="rounded-2xl border border-border bg-card p-5 shadow-card"><div className="text-[12.5px] text-text-muted">Total paid</div><div className="mt-2 font-display text-[28px] font-semibold text-success">{formatCurrency(paid)}</div></div>
      </div>

      <div className="mt-6"><CommissionsClient commissions={commissions} businesses={businesses} salespeople={salespeople} /></div>
    </div>
  );
}
