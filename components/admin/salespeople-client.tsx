"use client";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { UserPlus, Copy, Check, MoreVertical } from "lucide-react";
import { createSalespersonAction, updateSalespersonAction, resetSalespersonPasswordAction, deactivateSalespersonAction, reactivateSalespersonAction } from "@/app/actions/salespeople";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface SalespersonWithCounts {
  id: string;
  full_name: string;
  email: string;
  phone: string | null;
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

  function copyPassword(pw: string) {
    navigator.clipboard.writeText(pw);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  const [managingId, setManagingId] = useState<string | null>(null);
  const managing = salespeople.find((s) => s.id === managingId) || null;
  const [editName, setEditName] = useState("");
  const [editPhone, setEditPhone] = useState("");
  const [manageError, setManageError] = useState<string | null>(null);
  const [manageSaved, setManageSaved] = useState(false);
  const [newTempPassword, setNewTempPassword] = useState<string | null>(null);
  const [resetting, setResetting] = useState(false);
  const [busy, setBusy] = useState(false);

  function openManage(s: SalespersonWithCounts) {
    setManagingId(s.id);
    setEditName(s.full_name);
    setEditPhone(s.phone || "");
    setManageError(null);
    setManageSaved(false);
    setNewTempPassword(null);
  }

  function handleSaveEdit() {
    if (!managingId) return;
    setBusy(true);
    setManageError(null);
    startTransition(async () => {
      const result = await updateSalespersonAction(managingId, { fullName: editName, phone: editPhone });
      setBusy(false);
      if (!result.success) { setManageError(result.error || "Could not save changes."); return; }
      setManageSaved(true);
      setTimeout(() => setManageSaved(false), 1800);
      router.refresh();
    });
  }

  function handleResetPassword() {
    if (!managingId) return;
    setResetting(true);
    setManageError(null);
    startTransition(async () => {
      const result = await resetSalespersonPasswordAction(managingId);
      setResetting(false);
      if (!result.success) { setManageError(result.error || "Could not reset password."); return; }
      setNewTempPassword(result.tempPassword || null);
    });
  }

  function handleToggleActive() {
    if (!managing) return;
    setBusy(true);
    startTransition(async () => {
      if (managing.is_active) await deactivateSalespersonAction(managing.id);
      else await reactivateSalespersonAction(managing.id);
      setBusy(false);
      router.refresh();
      setManagingId(null);
    });
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
              <button onClick={() => copyPassword(tempPassword)}>{copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}</button>
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
              <div className="flex items-start justify-between">
                <div className="text-[14px] font-semibold text-ink">{s.full_name}</div>
                <div className="flex items-center gap-2">
                  <Badge variant={s.is_active ? "success" : "neutral"}>{s.is_active ? "Active" : "Inactive"}</Badge>
                  <button onClick={() => openManage(s)} className="text-text-faint hover:text-text" aria-label="Manage salesperson">
                    <MoreVertical className="h-4 w-4" />
                  </button>
                </div>
              </div>
              <div className="mt-0.5 text-[12px] text-text-muted">{s.email}</div>
              {s.phone && <a href={`tel:${s.phone}`} className="text-[12px] text-brand hover:underline">{s.phone}</a>}
              <div className="mt-3 flex gap-4 text-[12.5px]">
                <div><span className="font-semibold text-text">{s.leadCount}</span> <span className="text-text-muted">leads</span></div>
                <div><span className="font-semibold text-text">{s.customerCount}</span> <span className="text-text-muted">customers</span></div>
              </div>
            </CardContent>
          </Card>
        ))}
        {salespeople.length === 0 && <div className="text-[13px] text-text-muted">No salespeople yet — add your first one above.</div>}
      </div>

      <Dialog open={managingId !== null} onOpenChange={(open) => !open && setManagingId(null)}>
        <DialogContent>
          <DialogTitle className="font-display text-[17px] font-semibold text-ink">Manage {managing?.full_name}</DialogTitle>
          <DialogDescription className="mt-1 text-[13px] text-text-muted">{managing?.email}</DialogDescription>

          <div className="mt-5 space-y-4">
            {manageError && <div className="rounded-lg border border-danger/20 bg-danger-soft px-3.5 py-2.5 text-[12.5px] text-danger">{manageError}</div>}

            <div>
              <Label>Full name</Label>
              <Input className="mt-1.5" value={editName} onChange={(e) => setEditName(e.target.value)} />
            </div>
            <div>
              <Label>Phone</Label>
              <Input className="mt-1.5" value={editPhone} onChange={(e) => setEditPhone(e.target.value)} />
            </div>
            <div className="flex items-center gap-3">
              <Button size="sm" variant="brand" onClick={handleSaveEdit} disabled={busy}>{busy ? "Saving…" : "Save changes"}</Button>
              {manageSaved && <span className="text-[12px] font-medium text-success">Saved ✓</span>}
            </div>

            <div className="border-t border-border pt-4">
              <div className="text-[12.5px] font-medium text-text">Reset password</div>
              <p className="mt-0.5 text-[11.5px] text-text-muted">Generates a new temporary password and immediately replaces their current one.</p>
              {newTempPassword ? (
                <div className="mt-2 flex items-center justify-between rounded-lg border border-success/20 bg-success-soft px-3 py-2 text-[12.5px] text-success">
                  <span>New password: <code className="font-mono font-semibold">{newTempPassword}</code></span>
                  <button onClick={() => copyPassword(newTempPassword)}><Copy className="h-3.5 w-3.5" /></button>
                </div>
              ) : (
                <Button size="sm" variant="outline" className="mt-2" onClick={handleResetPassword} disabled={resetting}>{resetting ? "Resetting…" : "Reset password"}</Button>
              )}
            </div>

            <div className="border-t border-border pt-4">
              <div className="text-[12.5px] font-medium text-text">{managing?.is_active ? "Deactivate account" : "Reactivate account"}</div>
              <p className="mt-0.5 text-[11.5px] text-text-muted">{managing?.is_active ? "They'll no longer be able to log in. Their leads and history stay intact." : "Restores their ability to log in."}</p>
              <Button size="sm" variant={managing?.is_active ? "danger" : "outline"} className="mt-2" onClick={handleToggleActive} disabled={busy}>
                {managing?.is_active ? "Deactivate" : "Reactivate"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
