import { getAllBusinesses } from "@/lib/data/businesses";
import { getAllSalespeople } from "@/lib/data/profiles";
import { LeadsClient } from "@/components/admin/leads-client";

export const dynamic = "force-dynamic";

export default async function AdminLeadsPage() {
  const [businesses, salespeople] = await Promise.all([getAllBusinesses(), getAllSalespeople()]);

  return (
    <div>
      <h1 className="font-display text-[24px] font-semibold text-ink">Leads</h1>
      <p className="mt-1 text-[13.5px] text-text-muted">Every business in the system — import, assign, and filter.</p>
      <div className="mt-6"><LeadsClient initialBusinesses={businesses} salespeople={salespeople} /></div>
    </div>
  );
}
