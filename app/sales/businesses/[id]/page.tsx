import { notFound } from "next/navigation";
import { getBusiness } from "@/lib/data/businesses";
import { getActivityForBusiness } from "@/lib/data/activity";
import { BusinessDetailClient } from "@/components/leads/business-detail-client";

export const dynamic = "force-dynamic";

export default async function SalesBusinessDetailPage({ params }: { params: { id: string } }) {
  // RLS guarantees a salesperson only ever gets a result here if this
  // business is actually assigned to them — not just a UI-level check.
  const business = await getBusiness(params.id);
  if (!business) notFound();
  const activity = await getActivityForBusiness(params.id);

  return <BusinessDetailClient business={business} activity={activity} isAdmin={false} />;
}
