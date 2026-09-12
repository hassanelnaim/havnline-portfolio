import { redirect } from "next/navigation";
import { getCurrentProfile } from "@/lib/supabase/profile";
import { getMyCommissions, summarizeCommissions } from "@/lib/data/commissions";
import { getAllBusinesses } from "@/lib/data/businesses";
import { Card } from "@/components/ui/card";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { formatCurrency, formatDate } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function EarningsPage() {
  const profile = await getCurrentProfile();
  if (!profile) redirect("/login");

  const [commissions, businesses] = await Promise.all([getMyCommissions(profile.id), getAllBusinesses()]);
  const { pending, paid, lifetime } = summarizeCommissions(commissions);
  const businessName = (id: string) => businesses.find((b) => b.id === id)?.business_name || "—";

  return (
    <div>
      <h1 className="font-display text-[24px] font-semibold text-ink">Earnings</h1>
      <p className="mt-1 text-[13.5px] text-text-muted">Your commission history — amounts and status are set by your admin and can't be edited here.</p>

      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-border bg-card p-5 shadow-card"><div className="text-[12.5px] text-text-muted">Pending</div><div className="mt-2 font-display text-[26px] font-semibold text-warning">{formatCurrency(pending)}</div></div>
        <div className="rounded-2xl border border-border bg-card p-5 shadow-card"><div className="text-[12.5px] text-text-muted">Paid</div><div className="mt-2 font-display text-[26px] font-semibold text-success">{formatCurrency(paid)}</div></div>
        <div className="rounded-2xl border border-border bg-card p-5 shadow-card"><div className="text-[12.5px] text-text-muted">Lifetime</div><div className="mt-2 font-display text-[26px] font-semibold text-brand">{formatCurrency(lifetime)}</div></div>
      </div>

      {/* Desktop/tablet: real table, unchanged. */}
      <Card className="mt-6 hidden md:block">
        <Table>
          <TableHeader><TableRow><TableHead>Business</TableHead><TableHead>Commission</TableHead><TableHead>Amount</TableHead><TableHead>Eligible</TableHead><TableHead>Status</TableHead></TableRow></TableHeader>
          <TableBody>
            {commissions.map((c) => (
              <TableRow key={c.id}>
                <TableCell className="font-medium">{businessName(c.business_id)}</TableCell>
                <TableCell>#{c.commission_number}</TableCell>
                <TableCell>{formatCurrency(Number(c.amount))}</TableCell>
                <TableCell>{formatDate(c.eligible_date)}</TableCell>
                <TableCell><Badge variant={c.status === "paid" ? "success" : "warning"}>{c.status}</Badge></TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        {commissions.length === 0 && <div className="p-8 text-center text-[13px] text-text-muted">No commissions yet — they'll show up here once a customer completes their first paid month.</div>}
      </Card>

      {/* Mobile: same data, stacked cards. */}
      <div className="mt-6 space-y-2.5 md:hidden">
        {commissions.map((c) => (
          <Card key={c.id} className="p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="text-[14px] font-semibold text-ink">{businessName(c.business_id)}</div>
                <div className="mt-0.5 text-[12px] text-text-muted">Commission #{c.commission_number} · Eligible {formatDate(c.eligible_date)}</div>
              </div>
              <Badge variant={c.status === "paid" ? "success" : "warning"}>{c.status}</Badge>
            </div>
            <div className="mt-2.5 border-t border-border-soft pt-2.5 font-display text-[16px] font-semibold text-ink">{formatCurrency(Number(c.amount))}</div>
          </Card>
        ))}
        {commissions.length === 0 && <Card className="p-8 text-center text-[13px] text-text-muted">No commissions yet — they'll show up here once a customer completes their first paid month.</Card>}
      </div>
    </div>
  );
}
