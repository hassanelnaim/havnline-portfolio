"use client";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Phone, Globe, MapPin, User, Calendar, Plus, ChevronDown, RotateCcw } from "lucide-react";
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

const STEPPER_STAGES: { label: string; statuses: PipelineStatus[] }[] = [
  { label: "New Lead", statuses: ["new_lead"] },
  { label: "Contacted", statuses: ["contacted"] },
  { label: "Interested", statuses: ["interested"] },
  { label: "Demo", statuses: ["demo"] },
  { label: "Trial", statuses: ["trial"] },
  { label: "Customer", statuses: ["paying_customer", "commission_1_pending", "commission_1_paid", "commission_2_pending", "commission_2_paid"] },
  { label: "Completed", statuses: ["completed"] },
];

const NEGATIVE_STATUSES: PipelineStatus[] = ["not_interested", "bad_fit", "cancelled", "no_response"];
const CUSTOMER_STAGE: PipelineStatus[] = ["paying_customer", "commission_1_pending", "commission_1_paid", "commission_2_pending", "commission_2_paid", "completed"];

function addDays(dateStr: string, days: number): string {
  const d = new Date(dateStr + "T00:00:00");
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

export function BusinessDetailClient({ business, activity, isAdmin }: { business: DbBusiness; activity: DbActivityLog[]; isAdmin: boolean }) {
  const router = useRouter();
  const [, startTransition] = useTransition();
  const [note, setNote] = useState("");
  const [callNote, setCallNote] = useState("");
  const [status, setStatus] = useState<PipelineStatus>(business.status);
  const [busy, setBusy] = useState(false);
  const [showManualStatus, setShowManualStatus] = useState(false);

  const [followupDate, setFollowupDate] = useState(business.next_followup || "");
  const [followupNote, setFollowupNote] = useState("");

  const [demoDate, setDemoDate] = useState("");
  const [demoTime, setDemoTime] = useState("");

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
    startTransition(async () => { await scheduleFollowupAction(business.id, followupDate, followupNote); setFollowupNote(""); setBusy(false); refresh(); });
  }
  function handleChangeStatus(newStatus: PipelineStatus) {
    setStatus(newStatus);
    startTransition(async () => { await changeStatusAction(business.id, newStatus); refresh(); });
  }
  function handleScheduleDemo() {
    if (!demoDate) return;
    setBusy(true);
    const demoNote = `Demo scheduled for ${demoDate}${demoTime ? ` at ${demoTime}` : ""}`;
    startTransition(async () => {
      await scheduleFollowupAction(business.id, demoDate, demoNote);
      await changeStatusAction(business.id, "demo");
      setStatus("demo");
      setDemoDate(""); setDemoTime("");
      setBusy(false);
      refresh();
    });
  }
  function handleStartTrialNow() {
    setBusy(true);
    const today = new Date().toISOString().slice(0, 10);
    startTransition(async () => {
      await startTrialAction(business.id, today, addDays(today, 7));
      setStatus("trial");
      setBusy(false);
      refresh();
    });
  }
  function handleMarkFirstMonth() {
    setBusy(true);
    startTransition(async () => { await markFirstMonthCompleteAction(business.id); setBusy(false); refresh(); });
  }
  function handleMarkSecondMonth() {
    setBusy(true);
    startTransition(async () => { await markSecondMonthCompleteAction(business.id); setBusy(false); refresh(); });
  }

  const isNegative = NEGATIVE_STATUSES.includes(status);
  const isCustomerStage = CUSTOMER_STAGE.includes(status);

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
            <CardHeader><CardTitle>Pipeline status</CardTitle></CardHeader>
            <CardContent>
              {!isNegative && (
                <div className="mb-5 flex items-center">
                  {STEPPER_STAGES.map((stage, i) => {
                    const currentIndex = STEPPER_STAGES.findIndex((s) => s.statuses.includes(status));
                    const reached = i <= currentIndex;
                    return (
                      <div key={stage.label} className="flex flex-1 items-center last:flex-none">
                        <div className="flex flex-col items-center gap-1.5">
                          <div className={`flex h-6 w-6 items-center justify-center rounded-full text-[11px] font-semibold ${reached ? "bg-brand text-white" : "bg-border-soft text-text-faint"}`}>{i + 1}</div>
                          <span className={`whitespace-nowrap text-[10.5px] ${reached ? "font-medium text-text" : "text-text-faint"}`}>{stage.label}</span>
                        </div>
                        {i < STEPPER_STAGES.length - 1 && <div className={`mx-1 h-0.5 flex-1 ${i < currentIndex ? "bg-brand" : "bg-border-soft"}`} />}
                      </div>
                    );
                  })}
                </div>
              )}

              {isNegative ? (
                <div className="rounded-lg border border-danger/20 bg-danger-soft px-3.5 py-3">
                  <div className="text-[13px] text-danger">Marked as: {PIPELINE_LABELS[status]}</div>
                  <Button size="sm" variant="outline" className="mt-2.5" onClick={() => handleChangeStatus("new_lead")}><RotateCcw className="h-3.5 w-3.5" /> Reopen this lead</Button>
                </div>
              ) : status === "new_lead" ? (
                <Button variant="brand" onClick={() => handleChangeStatus("contacted")}>Mark as Contacted</Button>
              ) : status === "contacted" ? (
                <div className="flex gap-2">
                  <Button variant="brand" onClick={() => handleChangeStatus("interested")}>Interested</Button>
                  <Button variant="outline" onClick={() => handleChangeStatus("not_interested")}>Not Interested</Button>
                </div>
              ) : status === "interested" ? (
                <div className="rounded-lg border border-border bg-paper p-3.5">
                  <div className="text-[13px] font-medium text-text">Schedule their demo</div>
                  <div className="mt-2.5 grid gap-2 sm:grid-cols-2">
                    <Input type="date" value={demoDate} onChange={(e) => setDemoDate(e.target.value)} />
                    <Input type="time" value={demoTime} onChange={(e) => setDemoTime(e.target.value)} placeholder="Time (optional)" />
                  </div>
                  <Button size="sm" variant="brand" className="mt-2.5" onClick={handleScheduleDemo} disabled={busy || !demoDate}><Calendar className="h-3.5 w-3.5" /> Schedule Demo</Button>
                </div>
              ) : status === "demo" ? (
                <div className="flex flex-wrap gap-2">
                  <Button variant="brand" onClick={handleStartTrialNow} disabled={busy}>They want to move forward → Start Trial</Button>
                  <Button variant="outline" onClick={() => handleChangeStatus("not_interested")}>Didn&apos;t convert</Button>
                </div>
              ) : status === "trial" ? (
                <div className="rounded-lg border border-brand/20 bg-brand-soft px-3.5 py-3 text-[13px] text-brand-dark">
                  On their free trial{business.trial_end ? ` — ends ${formatDate(business.trial_end)}` : ""}. Once they've paid for real, mark their first month complete below.
                </div>
              ) : isCustomerStage ? (
                <div className="rounded-lg border border-success/20 bg-success-soft px-3.5 py-3 text-[13px] text-success">
                  Real paying customer. {isAdmin ? "Use the commission milestones below to track their payments." : "Your admin tracks commission milestones from here."}
                </div>
              ) : null}

              <button onClick={() => setShowManualStatus((v) => !v)} className="mt-4 flex items-center gap-1 text-[11.5px] font-medium text-text-faint hover:text-text-muted">
                <ChevronDown className={`h-3 w-3 transition-transform ${showManualStatus ? "rotate-180" : ""}`} /> Change status manually
              </button>
              {showManualStatus && (
                <select value={status} onChange={(e) => handleChangeStatus(e.target.value as PipelineStatus)} className="mt-2 h-9 w-full rounded-lg border border-border bg-card px-3 text-[13px]">
                  {Object.entries(PIPELINE_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                </select>
              )}
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
            <CardContent className="space-y-2">
              <div><Label>What&apos;s this follow-up about?</Label><Textarea rows={2} className="mt-1.5" placeholder="e.g. Check if they've talked to their business partner" value={followupNote} onChange={(e) => setFollowupNote(e.target.value)} /></div>
              <div className="flex items-end gap-2">
                <div className="flex-1"><Label>Date</Label><Input type="date" className="mt-1.5" value={followupDate} onChange={(e) => setFollowupDate(e.target.value)} /></div>
                <Button size="sm" variant="outline" onClick={handleScheduleFollowup} disabled={busy || !followupDate}><Calendar className="h-3.5 w-3.5" /> Schedule</Button>
              </div>
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
                  <div className="text-[12px] font-medium text-brand">{a.type.replace("_", " ")}</div>
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
