"use client";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Phone, Globe, MapPin, User, Calendar, Plus } from "lucide-react";
import type { DbBusiness, DbActivityLog, PipelineStatus } from "@/lib/database/types";
import { PIPELINE_LABELS } from "@/lib/database/types";
import { logCallAction, addNoteAction, scheduleFollowupAction, changeStatusAction, startTrialAction } from "@/app/actions/business-updates";
import { markFirstMonthCompleteAction, markSecondMonthCompleteAction } from "@/app/actions/commissions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/leads/status-badge";
import { formatDate, formatDateTime } from "@/lib/format";

export function BusinessDetailClient({ business, activity, isAdmin }: { business: DbBusiness; activity: DbActivityLog[]; isAdmin: boolean }) {
  const router = useRouter();
  const [, startTransition] = useTransition();
  const [note, setNote] = useState("");
  const [callNote, setCallNote] = useState("");
  const [followupDate, setFollowupDate] = useState(business.next_followup || "");
  const [status, setStatus] = useState<PipelineStatus>(business.status);
  const [trialStart, setTrialStart] = useState(business.trial_start || new Date().toISOString().slice(0, 10));
  const [trialEnd, setTrialEnd] = useState(business.trial_end || "");
  const [busy, setBusy] = useState(false);

  function refresh() { router.refresh(); }

  function handleLogCall() {
    setBusy(true);
    startTransition(async () => { await logCallAction(business.id, callNote); setCallNote(""); setBusy(false); refresh(); });
  }
  function handleAddNote() {
    if (!note.trim()) return;
    setBusy(true);
    startTransition(async () => { await addNoteAction(business.id, note); setNote(""); setBusy(false); refresh(); });
  }
  function handleScheduleFollowup() {
    if (!followupDate) return;
    setBusy(true);
    startTransition(async () => { await scheduleFollowupAction(business.id, followupDate); setBusy(false); refresh(); });
  }
  function handleChangeStatus(newStatus: PipelineStatus) {
    setStatus(newStatus);
    startTransition(async () => { await changeStatusAction(business.id, newStatus); refresh(); });
  }
  function handleStartTrial() {
    if (!trialEnd) return;
    setBusy(true);
    startTransition(async () => { await startTrialAction(business.id, trialStart, trialEnd); setBusy(false); refresh(); });
  }
  function handleMarkFirstMonth() {
    setBusy(true);
    startTransition(async () => { await markFirstMonthCompleteAction(business.id); setBusy(false); refresh(); });
  }
  function handleMarkSecondMonth() {
    setBusy(true);
    startTransition(async () => { await markSecondMonthCompleteAction(business.id); setBusy(false); refresh(); });
  }

  return (
    <div>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-[24px] font-semibold text-ink">{business.business_name}</h1>
          <div className="mt-2 flex flex-wrap gap-4 text-[13px] text-text-muted">
            {business.phone && <a href={`tel:${business.phone}`} className="flex items-center gap-1.5 text-brand hover:underline"><Phone className="h-3.5 w-3.5" /> {business.phone}</a>}
            {business.website && <span className="flex items-center gap-1.5"><Globe className="h-3.5 w-3.5" /> {business.website}</span>}
            {business.city && <span className="flex items-center gap-1.5"><MapPin className="h-3.5 w-3.5" /> {business.city}, {business.state}</span>}
            {business.contact_name && <span className="flex items-center gap-1.5"><User className="h-3.5 w-3.5" /> {business.contact_name}</span>}
          </div>
        </div>
        <StatusBadge status={business.status} />
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-[1.3fr_1fr]">
        <div className="space-y-4">
          <Card>
            <CardHeader><CardTitle>Update status</CardTitle></CardHeader>
            <CardContent>
              <select value={status} onChange={(e) => handleChangeStatus(e.target.value as PipelineStatus)} className="h-9 w-full rounded-lg border border-border bg-card px-3 text-[13px]">
                {Object.entries(PIPELINE_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </select>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>Log a call</CardTitle></CardHeader>
            <CardContent className="space-y-2">
              <Textarea rows={2} placeholder="What happened on the call?" value={callNote} onChange={(e) => setCallNote(e.target.value)} />
              <Button size="sm" variant="outline" onClick={handleLogCall} disabled={busy}><Phone className="h-3.5 w-3.5" /> Log call ({business.call_attempts} so far)</Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>Add a note</CardTitle></CardHeader>
            <CardContent className="space-y-2">
              <Textarea rows={2} value={note} onChange={(e) => setNote(e.target.value)} />
              <Button size="sm" variant="outline" onClick={handleAddNote} disabled={busy || !note.trim()}><Plus className="h-3.5 w-3.5" /> Add note</Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>Schedule follow-up</CardTitle></CardHeader>
            <CardContent className="flex items-end gap-2">
              <div className="flex-1"><Label>Date</Label><Input type="date" className="mt-1.5" value={followupDate} onChange={(e) => setFollowupDate(e.target.value)} /></div>
              <Button size="sm" variant="outline" onClick={handleScheduleFollowup} disabled={busy}><Calendar className="h-3.5 w-3.5" /> Schedule</Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>Start trial</CardTitle></CardHeader>
            <CardContent className="grid gap-2 sm:grid-cols-3">
              <div><Label>Start</Label><Input type="date" className="mt-1.5" value={trialStart} onChange={(e) => setTrialStart(e.target.value)} /></div>
              <div><Label>End</Label><Input type="date" className="mt-1.5" value={trialEnd} onChange={(e) => setTrialEnd(e.target.value)} /></div>
              <div className="flex items-end"><Button size="sm" variant="brand" onClick={handleStartTrial} disabled={busy || !trialEnd}>Start trial</Button></div>
            </CardContent>
          </Card>

          {isAdmin && (
            <Card>
              <CardHeader><CardTitle>Commission milestones (admin only)</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between rounded-lg border border-border bg-paper px-3.5 py-2.5">
                  <span className="text-[13px] text-text">First paid month completed</span>
                  {business.first_month_completed_at ? <span className="text-[12px] text-success">Done {formatDate(business.first_month_completed_at)}</span> : <Button size="sm" variant="outline" onClick={handleMarkFirstMonth} disabled={busy}>Mark complete</Button>}
                </div>
                <div className="flex items-center justify-between rounded-lg border border-border bg-paper px-3.5 py-2.5">
                  <span className="text-[13px] text-text">Second paid month completed</span>
                  {business.second_month_completed_at ? <span className="text-[12px] text-success">Done {formatDate(business.second_month_completed_at)}</span> : <Button size="sm" variant="outline" onClick={handleMarkSecondMonth} disabled={busy || !business.first_month_completed_at}>Mark complete</Button>}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        <div>
          <Card>
            <CardHeader><CardTitle>Activity</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              {activity.length === 0 && <p className="text-[13px] text-text-muted">No activity logged yet.</p>}
              {activity.map((a) => (
                <div key={a.id} className="border-l-2 border-border pl-3">
                  <div className="text-[11px] uppercase tracking-wide text-text-faint">{a.type.replace("_", " ")}</div>
                  {a.content && <div className="text-[13px] text-text">{a.content}</div>}
                  <div className="text-[11px] text-text-faint">{formatDateTime(a.created_at)}</div>
                </div>
              ))}
            </CardContent>
          </Card>

          {business.notes && (
            <Card className="mt-4"><CardHeader><CardTitle>Original notes</CardTitle></CardHeader><CardContent><p className="text-[13px] text-text">{business.notes}</p></CardContent></Card>
          )}
        </div>
      </div>
    </div>
  );
}
