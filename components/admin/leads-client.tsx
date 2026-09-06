"use client";
import { useState, useMemo, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Papa from "papaparse";
import { Upload, Filter } from "lucide-react";
import type { DbBusiness, DbProfile, PipelineStatus } from "@/lib/database/types";
import { PIPELINE_LABELS } from "@/lib/database/types";
import { importLeadsAction, assignLeadsAction, type ImportRow } from "@/app/actions/leads";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { StatusBadge } from "@/components/leads/status-badge";

export function LeadsClient({ initialBusinesses, salespeople }: { initialBusinesses: DbBusiness[]; salespeople: DbProfile[] }) {
  const router = useRouter();
  const [, startTransition] = useTransition();

  // Import
  const [importing, setImporting] = useState(false);
  const [importMsg, setImportMsg] = useState<string | null>(null);

  function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setImporting(true);
    setImportMsg(null);

    Papa.parse<ImportRow>(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        startTransition(async () => {
          const batchLabel = `Imported ${new Date().toLocaleDateString()}`;
          const result = await importLeadsAction(results.data, batchLabel);
          setImporting(false);
          if (!result.success) {
            setImportMsg(result.error || "Import failed.");
            return;
          }
          setImportMsg(`Imported ${result.imported} new leads. Skipped ${result.skippedDuplicates} duplicates.`);
          router.refresh();
        });
      },
    });
    e.target.value = "";
  }

  // Filters
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [salespersonFilter, setSalespersonFilter] = useState<string>("all");
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    return initialBusinesses.filter((b) => {
      if (statusFilter !== "all" && b.status !== statusFilter) return false;
      if (salespersonFilter === "unassigned" && b.assigned_to) return false;
      if (salespersonFilter !== "all" && salespersonFilter !== "unassigned" && b.assigned_to !== salespersonFilter) return false;
      if (search && !b.business_name.toLowerCase().includes(search.toLowerCase())) return false;
      return true;
    });
  }, [initialBusinesses, statusFilter, salespersonFilter, search]);

  // Bulk assign
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [assignTo, setAssignTo] = useState("");

  function toggleSelect(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }

  function handleBulkAssign() {
    if (!assignTo || selected.size === 0) return;
    startTransition(async () => {
      await assignLeadsAction(Array.from(selected), assignTo);
      setSelected(new Set());
      router.refresh();
    });
  }

  const salespersonName = (id: string | null) => salespeople.find((s) => s.id === id)?.full_name || "—";

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader><CardTitle className="flex items-center gap-2"><Upload className="h-4 w-4 text-brand" /> Import leads</CardTitle><CardDescription>Upload a CSV with columns like business_name, phone, website, address, city, state, industry, contact_name, priority, source. Duplicates (by phone or name+city) are skipped automatically.</CardDescription></CardHeader>
        <CardContent>
          {importMsg && <div className="mb-3 rounded-lg border border-border bg-paper px-3.5 py-2.5 text-[12.5px] text-text-muted">{importMsg}</div>}
          <input type="file" accept=".csv" onChange={handleFileUpload} disabled={importing} className="text-[13px]" />
        </CardContent>
      </Card>

      <Card>
        <CardContent className="flex flex-wrap items-center gap-3 p-4">
          <Filter className="h-4 w-4 text-text-faint" />
          <Input placeholder="Search by name…" value={search} onChange={(e) => setSearch(e.target.value)} className="w-48" />
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="h-9 rounded-lg border border-border bg-card px-3 text-[13px]">
            <option value="all">All statuses</option>
            {Object.entries(PIPELINE_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select>
          <select value={salespersonFilter} onChange={(e) => setSalespersonFilter(e.target.value)} className="h-9 rounded-lg border border-border bg-card px-3 text-[13px]">
            <option value="all">All salespeople</option>
            <option value="unassigned">Unassigned</option>
            {salespeople.map((s) => <option key={s.id} value={s.id}>{s.full_name}</option>)}
          </select>

          {selected.size > 0 && (
            <div className="ml-auto flex items-center gap-2">
              <span className="text-[12.5px] text-text-muted">{selected.size} selected</span>
              <select value={assignTo} onChange={(e) => setAssignTo(e.target.value)} className="h-9 rounded-lg border border-border bg-card px-3 text-[13px]">
                <option value="">Assign to…</option>
                {salespeople.map((s) => <option key={s.id} value={s.id}>{s.full_name}</option>)}
              </select>
              <Button size="sm" variant="brand" onClick={handleBulkAssign} disabled={!assignTo}>Assign</Button>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <Table>
          <TableHeader><TableRow><TableHead></TableHead><TableHead>Business</TableHead><TableHead>Industry</TableHead><TableHead>City</TableHead><TableHead>Assigned to</TableHead><TableHead>Status</TableHead></TableRow></TableHeader>
          <TableBody>
            {filtered.map((b) => (
              <TableRow key={b.id}>
                <TableCell><input type="checkbox" checked={selected.has(b.id)} onChange={() => toggleSelect(b.id)} /></TableCell>
                <TableCell><Link href={`/admin/businesses/${b.id}`} className="font-medium text-brand hover:underline">{b.business_name}</Link></TableCell>
                <TableCell>{b.industry || "—"}</TableCell>
                <TableCell>{b.city || "—"}</TableCell>
                <TableCell>{salespersonName(b.assigned_to)}</TableCell>
                <TableCell><StatusBadge status={b.status} /></TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        {filtered.length === 0 && <div className="p-8 text-center text-[13px] text-text-muted">No leads match these filters.</div>}
      </Card>
    </div>
  );
}
