import { getAllRanks, getAllMilestones, getAllPromotions, getPendingPromotionApprovals } from "@/lib/data/progression";
import { getAllSalespeople } from "@/lib/data/profiles";
import { ProgressionAdminClient } from "@/components/admin/progression-admin-client";

export const dynamic = "force-dynamic";

export default async function ProgressionAdminPage() {
  const [ranks, milestones, promotions, pendingApprovals, salespeople] = await Promise.all([
    getAllRanks(), getAllMilestones(), getAllPromotions(), getPendingPromotionApprovals(), getAllSalespeople(),
  ]);

  return (
    <div>
      <h1 className="font-display text-[24px] font-semibold text-ink">Sales Progression</h1>
      <p className="mt-1 text-[13.5px] text-text-muted">Configure ranks, milestones, and promotions — everything here drives real salesperson dashboards automatically.</p>
      <div className="mt-6">
        <ProgressionAdminClient ranks={ranks} milestones={milestones} promotions={promotions} pendingApprovals={pendingApprovals} salespeople={salespeople} />
      </div>
    </div>
  );
}
