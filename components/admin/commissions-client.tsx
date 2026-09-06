"use client";
import { useTransition } from "react";
import { useRouter } from "next/navigation";
import type { DbCommission, DbBusiness, DbProfile } from "@/lib/database/types";
import { markCommissionPaidAction } from "@/app/actions/commissions";
import { Card } from "@/components/ui/card";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatCurrency, formatDate } from "@/lib/format";

export function CommissionsClient({ commissions, businesses, salespeople }: { commissions: DbCommission[]; businesses: DbBusiness[]; salespeople: DbProfile[] }) {
  const router = useRouter();
  const [, startTransition] = useTransition();

  function handleMarkPaid(id: string) {
    startTransition(async () => { await markCommissionPaidAction(id); router.refresh(); });
  }

  const businessName = (id: string) => businesses.find((b) => b.id === id)?.business_name || "—";
  const salespersonName = (id: string) => salespeople.find((s) => s.id === id)?.full_name || "—";

  return (
    <Card>
      <Table>
        <TableHeader><TableRow><TableHead>Business</TableHead><TableHead>Salesperson</TableHead><TableHead>#</TableHead><TableHead>Amount</TableHead><TableHead>Eligible</TableHead><TableHead>Status</TableHead><TableHead></TableHead></TableRow></TableHeader>
        <TableBody>
          {commissions.map((c) => (
            <TableRow key={c.id}>
              <TableCell className="font-medium">{businessName(c.business_id)}</TableCell>
              <TableCell>{salespersonName(c.salesperson_id)}</TableCell>
              <TableCell>{c.commission_number}</TableCell>
              <TableCell>{formatCurrency(Number(c.amount))}</TableCell>
              <TableCell>{formatDate(c.eligible_date)}</TableCell>
              <TableCell><Badge variant={c.status === "paid" ? "success" : "warning"}>{c.status}</Badge></TableCell>
              <TableCell>{c.status === "pending" && <Button size="sm" variant="outline" onClick={() => handleMarkPaid(c.id)}>Mark paid</Button>}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      {commissions.length === 0 && <div className="p-8 text-center text-[13px] text-text-muted">No commissions yet.</div>}
    </Card>
  );
}
