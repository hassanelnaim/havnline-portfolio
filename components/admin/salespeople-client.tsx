"use client";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { UserPlus, Copy, Check } from "lucide-react";
import { createSalespersonAction } from "@/app/actions/salespeople";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface SalespersonWithCounts {
  id: string;
  full_name: string;
  email: string;
  is_active: boolean;
  leadCount: number;
  customerCount: number;
}

export function SalespeopleClient({ salespeople }: { salespeople: SalespersonWithCounts[] }) {
  const router = useRouter();
  const [, startTransition] = useTransition();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [tempPassword, setTempPassword] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [creating, setCreating] = useState(false);

  function handleCreate() {
    setCreating(true);
    setError(null);
    setTempPassword(null);
    startTransition(async () => {
      const result = await createSalespersonAction({ fullName, email, phone });
      setCreating(false);
      if (!result.success) { setError(result.error || "Could not create account."); return; }
      setTempPassword(result.tempPassword || null);
      setFullName(""); setEmail(""); setPhone("");
      router.refresh();
    });
  }

  function copyPassword() {
    if (!tempPassword) return;
    navigator.clipboard.writeText(tempPassword);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader><CardTitle className="flex items-center gap-2"><UserPlus className="h-4 w-4 text-brand" /> Add a salesperson</CardTitle><CardDescription>Creates their login. Share the temporary password with them directly — they should change it on first login.</CardDescription></CardHeader>
        <CardContent className="space-y-3">
          {error && <div className="rounded-lg border border-danger/20 bg-danger-soft px-3.5 py-2.5 text-[12.5px] text-danger">{error}</div>}
          {tempPassword && (
            <div className="flex items-center justify-between rounded-lg border border-success/20 bg-success-soft px-3.5 py-2.5 text-[12.5px] text-success">
              <span>Account created. Temporary password: <code className="font-mono font-semibold">{tempPassword}</code></span>
              <button onClick={copyPassword}>{copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}</button>
            </div>
          )}
          <div className="grid gap-3 sm:grid-cols-3">
            <div><Label>Full name</Label><Input className="mt-1.5" value={fullName} onChange={(e) => setFullName(e.target.value)} /></div>
            <div><Label>Email</Label><Input type="email" className="mt-1.5" value={email} onChange={(e) => setEmail(e.target.value)} /></div>
            <div><Label>Phone (optional)</Label><Input className="mt-1.5" value={phone} onChange={(e) => setPhone(e.target.value)} /></div>
          </div>
          <Button variant="brand" size="sm" onClick={handleCreate} disabled={creating || !fullName.trim() || !email.trim()}>{creating ? "Creating…" : "Create account"}</Button>
        </CardContent>
      </Card>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {salespeople.map((s) => (
          <Card key={s.id}>
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <div className="text-[14px] font-semibold text-ink">{s.full_name}</div>
                <Badge variant={s.is_active ? "success" : "neutral"}>{s.is_active ? "Active" : "Inactive"}</Badge>
              </div>
              <div className="mt-0.5 text-[12px] text-text-muted">{s.email}</div>
              <div className="mt-3 flex gap-4 text-[12.5px]">
                <div><span className="font-semibold text-text">{s.leadCount}</span> <span className="text-text-muted">leads</span></div>
                <div><span className="font-semibold text-text">{s.customerCount}</span> <span className="text-text-muted">customers</span></div>
              </div>
            </CardContent>
          </Card>
        ))}
        {salespeople.length === 0 && <div className="text-[13px] text-text-muted">No salespeople yet — add your first one above.</div>}
      </div>
    </div>
  );
}
