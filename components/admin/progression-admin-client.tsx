"use client";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Plus, Trash2, Check, X } from "lucide-react";
import type { DbRank, DbMilestone, DbPromotion, DbSalespersonPromotion, DbProfile, MilestoneRequirementType, RewardType } from "@/lib/database/types";
import {
  createRankAction, deleteRankAction,
  createMilestoneAction, deleteMilestoneAction, toggleMilestoneActiveAction,
  createPromotionAction, deletePromotionAction,
  approvePromotionAction, denyPromotionAction,
} from "@/app/actions/progression-admin";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { formatCurrency, formatDate } from "@/lib/format";

const REQUIREMENT_TYPES: { value: MilestoneRequirementType; label: string }[] = [
  { value: "businesses_sold", label: "Businesses sold (lifetime)" },
  { value: "active_businesses", label: "Active businesses" },
  { value: "commission_earned", label: "Commission earned ($, paid only)" },
  { value: "sales_in_month", label: "Sales in current month" },
  { value: "sales_in_week", label: "Sales in current week" },
  { value: "customer_retention", label: "Customer retention (%)" },
];

const REWARD_TYPES: RewardType[] = ["cash_bonus", "commission_bonus", "gift_card", "merchandise", "promotion", "rank_advancement", "recognition", "special_badge"];

export function ProgressionAdminClient({
  ranks, milestones, promotions, pendingApprovals, salespeople,
}: {
  ranks: DbRank[]; milestones: DbMilestone[]; promotions: DbPromotion[]; pendingApprovals: DbSalespersonPromotion[]; salespeople: DbProfile[];
}) {
  const router = useRouter();
  const [, startTransition] = useTransition();

  const salespersonName = (id: string) => salespeople.find((s) => s.id === id)?.full_name || "—";
  const promotionTitle = (id: string) => promotions.find((p) => p.id === id)?.title || "—";

  // ---- Ranks form ----
  const [rankName, setRankName] = useState("");
  const [rankMin, setRankMin] = useState(0);
  const [rankEmoji, setRankEmoji] = useState("🏅");
  const [rankColor, setRankColor] = useState("#2563EB");
  const [rankBenefits, setRankBenefits] = useState("");
  const [rankBonus, setRankBonus] = useState(0);

  function addRank() {
    startTransition(async () => {
      await createRankAction({ name: rankName, description: "", minBusinessesSold: rankMin, badgeEmoji: rankEmoji, color: rankColor, benefits: rankBenefits, commissionBonusPercent: rankBonus, sortOrder: ranks.length });
      setRankName(""); setRankMin(0); setRankBenefits(""); setRankBonus(0);
      router.refresh();
    });
  }
  function removeRank(id: string) { startTransition(async () => { await deleteRankAction(id); router.refresh(); }); }

  // ---- Milestones form ----
  const [mName, setMName] = useState("");
  const [mIcon, setMIcon] = useState("🎯");
  const [mReqType, setMReqType] = useState<MilestoneRequirementType>("businesses_sold");
  const [mReqValue, setMReqValue] = useState(1);
  const [mRewardType, setMRewardType] = useState<RewardType>("recognition");
  const [mRewardDesc, setMRewardDesc] = useState("");
  const [mRewardAmount, setMRewardAmount] = useState<string>("");

  function addMilestone() {
    startTransition(async () => {
      await createMilestoneAction({
        name: mName, description: "", icon: mIcon, requirementType: mReqType, requirementValue: mReqValue,
        rewardType: mRewardType, rewardDescription: mRewardDesc, rewardAmount: mRewardAmount ? parseFloat(mRewardAmount) : null,
        isVisible: true, sortOrder: milestones.length,
      });
      setMName(""); setMReqValue(1); setMRewardDesc(""); setMRewardAmount("");
      router.refresh();
    });
  }
  function removeMilestone(id: string) { startTransition(async () => { await deleteMilestoneAction(id); router.refresh(); }); }
  function toggleMilestone(id: string, active: boolean) { startTransition(async () => { await toggleMilestoneActiveAction(id, active); router.refresh(); }); }

  // ---- Promotions form ----
  const [pTitle, setPTitle] = useState("");
  const [pRequired, setPRequired] = useState(0);
  const [pRetention, setPRetention] = useState<string>("");
  const [pBenefits, setPBenefits] = useState("");
  const [pApproval, setPApproval] = useState<"automatic" | "admin_approval">("automatic");

  function addPromotion() {
    startTransition(async () => {
      await createPromotionAction({
        title: pTitle, description: "", requiredBusinessesSold: pRequired,
        requiredRetentionPercent: pRetention ? parseFloat(pRetention) : null, benefits: pBenefits, approvalType: pApproval, sortOrder: promotions.length,
      });
      setPTitle(""); setPRequired(0); setPRetention(""); setPBenefits("");
      router.refresh();
    });
  }
  function removePromotion(id: string) { startTransition(async () => { await deletePromotionAction(id); router.refresh(); }); }

  const [approvalNotes, setApprovalNotes] = useState<Record<string, string>>({});
  function approve(id: string) { startTransition(async () => { await approvePromotionAction(id, approvalNotes[id] || ""); router.refresh(); }); }
  function deny(id: string) { startTransition(async () => { await denyPromotionAction(id, approvalNotes[id] || ""); router.refresh(); }); }

  return (
    <Tabs defaultValue="ranks">
      <TabsList>
        <TabsTrigger value="ranks">Ranks</TabsTrigger>
        <TabsTrigger value="milestones">Milestones</TabsTrigger>
        <TabsTrigger value="promotions">Promotions</TabsTrigger>
        <TabsTrigger value="approvals">Approvals {pendingApprovals.length > 0 && <Badge variant="warning">{pendingApprovals.length}</Badge>}</TabsTrigger>
      </TabsList>

      <TabsContent value="ranks">
        <Card className="mb-4">
          <CardHeader><CardTitle>Add a rank</CardTitle><CardDescription>Ordered automatically by minimum businesses sold.</CardDescription></CardHeader>
          <CardContent className="grid gap-3 sm:grid-cols-3">
            <div><Label>Name</Label><Input className="mt-1.5" value={rankName} onChange={(e) => setRankName(e.target.value)} placeholder="Elite Seller" /></div>
            <div><Label>Min. businesses sold</Label><Input type="number" className="mt-1.5" value={rankMin} onChange={(e) => setRankMin(parseInt(e.target.value) || 0)} /></div>
            <div><Label>Badge emoji</Label><Input className="mt-1.5" value={rankEmoji} onChange={(e) => setRankEmoji(e.target.value)} /></div>
            <div><Label>Color</Label><Input type="color" className="mt-1.5 h-9" value={rankColor} onChange={(e) => setRankColor(e.target.value)} /></div>
            <div><Label>Commission bonus (%)</Label><Input type="number" step="0.1" className="mt-1.5" value={rankBonus} onChange={(e) => setRankBonus(parseFloat(e.target.value) || 0)} /></div>
            <div className="sm:col-span-3"><Label>Benefits</Label><Textarea rows={2} className="mt-1.5" value={rankBenefits} onChange={(e) => setRankBenefits(e.target.value)} /></div>
            <Button size="sm" variant="brand" onClick={addRank} disabled={!rankName.trim()}><Plus className="h-3.5 w-3.5" /> Add rank</Button>
          </CardContent>
        </Card>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {ranks.map((r) => (
            <Card key={r.id}>
              <CardContent className="p-5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-[15px] font-semibold" style={{ color: r.color }}>{r.badge_emoji} {r.name}</div>
                  <button onClick={() => removeRank(r.id)} className="text-text-faint hover:text-danger"><Trash2 className="h-3.5 w-3.5" /></button>
                </div>
                <div className="mt-1 text-[12.5px] text-text-muted">{r.min_businesses_sold}+ businesses sold</div>
                {r.benefits && <p className="mt-2 text-[12px] text-text">{r.benefits}</p>}
                {r.commission_bonus_percent > 0 && <div className="mt-2 text-[12px] font-medium text-success">+{r.commission_bonus_percent}% commission bonus</div>}
              </CardContent>
            </Card>
          ))}
        </div>
      </TabsContent>

      <TabsContent value="milestones">
        <Card className="mb-4">
          <CardHeader><CardTitle>Add a milestone</CardTitle></CardHeader>
          <CardContent className="grid gap-3 sm:grid-cols-2">
            <div><Label>Name</Label><Input className="mt-1.5" value={mName} onChange={(e) => setMName(e.target.value)} placeholder="Double Digits" /></div>
            <div><Label>Icon</Label><Input className="mt-1.5" value={mIcon} onChange={(e) => setMIcon(e.target.value)} /></div>
            <div>
              <Label>Requirement type</Label>
              <select className="mt-1.5 h-9 w-full rounded-lg border border-border bg-card px-3 text-[13px]" value={mReqType} onChange={(e) => setMReqType(e.target.value as MilestoneRequirementType)}>
                {REQUIREMENT_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>
            </div>
            <div><Label>Requirement value</Label><Input type="number" className="mt-1.5" value={mReqValue} onChange={(e) => setMReqValue(parseFloat(e.target.value) || 0)} /></div>
            <div>
              <Label>Reward type</Label>
              <select className="mt-1.5 h-9 w-full rounded-lg border border-border bg-card px-3 text-[13px]" value={mRewardType} onChange={(e) => setMRewardType(e.target.value as RewardType)}>
                {REWARD_TYPES.map((t) => <option key={t} value={t}>{t.replace("_", " ")}</option>)}
              </select>
            </div>
            <div><Label>Reward amount ($, optional)</Label><Input type="number" step="0.01" className="mt-1.5" value={mRewardAmount} onChange={(e) => setMRewardAmount(e.target.value)} /></div>
            <div className="sm:col-span-2"><Label>Reward description</Label><Input className="mt-1.5" value={mRewardDesc} onChange={(e) => setMRewardDesc(e.target.value)} placeholder="$500 bonus" /></div>
            <Button size="sm" variant="brand" onClick={addMilestone} disabled={!mName.trim()}><Plus className="h-3.5 w-3.5" /> Add milestone</Button>
          </CardContent>
        </Card>

        <div className="space-y-2">
          {milestones.map((m) => (
            <Card key={m.id}>
              <CardContent className="flex items-center justify-between gap-4 p-4">
                <div>
                  <div className="text-[13.5px] font-medium text-text">{m.icon} {m.name}</div>
                  <div className="text-[12px] text-text-muted">{REQUIREMENT_TYPES.find((t) => t.value === m.requirement_type)?.label} ≥ {m.requirement_value} · Reward: {m.reward_description || m.reward_type}</div>
                </div>
                <div className="flex items-center gap-3">
                  <Switch checked={m.is_active} onCheckedChange={(checked) => toggleMilestone(m.id, checked)} />
                  <button onClick={() => removeMilestone(m.id)} className="text-text-faint hover:text-danger"><Trash2 className="h-3.5 w-3.5" /></button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </TabsContent>

      <TabsContent value="promotions">
        <Card className="mb-4">
          <CardHeader><CardTitle>Add a promotion</CardTitle></CardHeader>
          <CardContent className="grid gap-3 sm:grid-cols-2">
            <div className="sm:col-span-2"><Label>Title</Label><Input className="mt-1.5" value={pTitle} onChange={(e) => setPTitle(e.target.value)} placeholder="Senior Sales Representative" /></div>
            <div><Label>Required businesses sold</Label><Input type="number" className="mt-1.5" value={pRequired} onChange={(e) => setPRequired(parseInt(e.target.value) || 0)} /></div>
            <div><Label>Required retention % (optional)</Label><Input type="number" step="0.1" className="mt-1.5" value={pRetention} onChange={(e) => setPRetention(e.target.value)} /></div>
            <div className="sm:col-span-2"><Label>Benefits</Label><Textarea rows={2} className="mt-1.5" value={pBenefits} onChange={(e) => setPBenefits(e.target.value)} /></div>
            <div>
              <Label>Approval</Label>
              <select className="mt-1.5 h-9 w-full rounded-lg border border-border bg-card px-3 text-[13px]" value={pApproval} onChange={(e) => setPApproval(e.target.value as "automatic" | "admin_approval")}>
                <option value="automatic">Automatic</option>
                <option value="admin_approval">Requires admin approval</option>
              </select>
            </div>
            <Button size="sm" variant="brand" onClick={addPromotion} disabled={!pTitle.trim()} className="self-end"><Plus className="h-3.5 w-3.5" /> Add promotion</Button>
          </CardContent>
        </Card>

        <div className="space-y-2">
          {promotions.map((p) => (
            <Card key={p.id}>
              <CardContent className="flex items-center justify-between gap-4 p-4">
                <div>
                  <div className="text-[13.5px] font-medium text-text">{p.title}</div>
                  <div className="text-[12px] text-text-muted">{p.required_businesses_sold}+ businesses{p.required_retention_percent ? `, ${p.required_retention_percent}%+ retention` : ""} · <Badge variant={p.approval_type === "automatic" ? "success" : "warning"}>{p.approval_type === "automatic" ? "Auto" : "Needs approval"}</Badge></div>
                </div>
                <button onClick={() => removePromotion(p.id)} className="text-text-faint hover:text-danger"><Trash2 className="h-3.5 w-3.5" /></button>
              </CardContent>
            </Card>
          ))}
        </div>
      </TabsContent>

      <TabsContent value="approvals">
        {pendingApprovals.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border bg-card p-8 text-center text-[13px] text-text-muted">No promotions waiting on approval.</div>
        ) : (
          <div className="space-y-3">
            {pendingApprovals.map((rec) => (
              <Card key={rec.id}>
                <CardContent className="p-5">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-[14px] font-semibold text-ink">{salespersonName(rec.salesperson_id)}</div>
                      <div className="text-[12.5px] text-text-muted">Eligible for: <span className="font-medium text-text">{promotionTitle(rec.promotion_id)}</span> · Requested {formatDate(rec.requested_at)}</div>
                    </div>
                  </div>
                  <Textarea rows={2} placeholder="Notes (optional)" className="mt-3" value={approvalNotes[rec.id] || ""} onChange={(e) => setApprovalNotes((prev) => ({ ...prev, [rec.id]: e.target.value }))} />
                  <div className="mt-3 flex gap-2">
                    <Button size="sm" variant="brand" onClick={() => approve(rec.id)}><Check className="h-3.5 w-3.5" /> Approve</Button>
                    <Button size="sm" variant="outline" onClick={() => deny(rec.id)}><X className="h-3.5 w-3.5" /> Deny</Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </TabsContent>
    </Tabs>
  );
}
