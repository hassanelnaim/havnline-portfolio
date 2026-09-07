import { getAllSalespeople } from "@/lib/data/profiles";
import { getAllBusinesses } from "@/lib/data/businesses";
import { computeSalespersonStats, computeRankProgress } from "@/lib/progression/engine";
import { SalespeopleClient } from "@/components/admin/salespeople-client";

export const dynamic = "force-dynamic";

export default async function SalespeoplePage() {
  const [salespeople, businesses] = await Promise.all([getAllSalespeople(), getAllBusinesses()]);

  const withCounts = await Promise.all(
    salespeople.map(async (s) => {
      const stats = await computeSalespersonStats(s.id);
      const rankProgress = await computeRankProgress(stats.businessesSoldLifetime);
      return {
        ...s,
        leadCount: businesses.filter((b) => b.assigned_to === s.id).length,
        customerCount: businesses.filter((b) => b.assigned_to === s.id && ["paying_customer", "commission_1_pending", "commission_1_paid", "commission_2_pending", "commission_2_paid", "completed"].includes(b.status)).length,
        rank: rankProgress.currentRank,
      };
    })
  );

  return (
    <div>
      <h1 className="font-display text-[24px] font-semibold text-ink">Salespeople</h1>
      <p className="mt-1 text-[13.5px] text-text-muted">Manage your sales team.</p>
      <div className="mt-6"><SalespeopleClient salespeople={withCounts} /></div>
    </div>
  );
}
