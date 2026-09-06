import { redirect } from "next/navigation";
import Link from "next/link";
import { getCurrentProfile } from "@/lib/supabase/profile";
import { getMyBusinesses } from "@/lib/data/businesses";
import { Card } from "@/components/ui/card";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { StatusBadge } from "@/components/leads/status-badge";
import { formatDate } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function SalesLeadsPage() {
  const profile = await getCurrentProfile();
  if (!profile) redirect("/login");

  const businesses = await getMyBusinesses(profile.id);

  return (
    <div>
      <h1 className="font-display text-[24px] font-semibold text-ink">My Leads</h1>
      <p className="mt-1 text-[13.5px] text-text-muted">Every business assigned to you.</p>

      <Card className="mt-6">
        <Table>
          <TableHeader><TableRow><TableHead>Business</TableHead><TableHead>Industry</TableHead><TableHead>City</TableHead><TableHead>Next follow-up</TableHead><TableHead>Status</TableHead></TableRow></TableHeader>
          <TableBody>
            {businesses.map((b) => (
              <TableRow key={b.id}>
                <TableCell><Link href={`/sales/businesses/${b.id}`} className="font-medium text-brand hover:underline">{b.business_name}</Link></TableCell>
                <TableCell>{b.industry || "—"}</TableCell>
                <TableCell>{b.city || "—"}</TableCell>
                <TableCell>{formatDate(b.next_followup)}</TableCell>
                <TableCell><StatusBadge status={b.status} /></TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        {businesses.length === 0 && <div className="p-8 text-center text-[13px] text-text-muted">No leads assigned yet — check back soon.</div>}
      </Card>
    </div>
  );
}
