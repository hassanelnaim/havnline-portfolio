export type UUID = string;
export type ISODate = string;
export type ISODateTime = string;

export type UserRole = "admin" | "salesperson";

export interface DbProfile {
  id: UUID;
  email: string;
  full_name: string;
  role: UserRole;
  phone: string | null;
  is_active: boolean;
  current_promotion_id: UUID | null;
  created_at: ISODateTime;
}

export type PipelineStatus =
  | "new_lead" | "contacted" | "interested" | "demo" | "trial"
  | "paying_customer" | "commission_1_pending" | "commission_1_paid"
  | "commission_2_pending" | "commission_2_paid" | "completed"
  | "not_interested" | "bad_fit" | "cancelled" | "no_response";

export interface DbBusiness {
  id: UUID;
  business_name: string;
  phone: string | null;
  normalized_phone: string | null;
  website: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  industry: string | null;
  contact_name: string | null;
  priority: "low" | "normal" | "high";
  source: string | null;
  status: PipelineStatus;
  assigned_to: UUID | null;
  call_attempts: number;
  last_contacted: ISODateTime | null;
  next_followup: ISODate | null;
  notes: string | null;
  trial_start: ISODate | null;
  trial_end: ISODate | null;
  first_payment_date: ISODate | null;
  first_month_completed_at: ISODate | null;
  second_payment_date: ISODate | null;
  second_month_completed_at: ISODate | null;
  cancelled_at: ISODate | null;
  imported_batch: string | null;
  created_at: ISODateTime;
  updated_at: ISODateTime;
}

export type ActivityType = "call" | "note" | "status_change" | "followup_scheduled";

export interface DbActivityLog {
  id: UUID;
  business_id: UUID;
  salesperson_id: UUID | null;
  type: ActivityType;
  content: string | null;
  created_at: ISODateTime;
}

export interface DbCommission {
  id: UUID;
  business_id: UUID;
  salesperson_id: UUID;
  commission_number: 1 | 2;
  amount: number;
  status: "pending" | "paid";
  eligible_date: ISODate | null;
  paid_date: ISODate | null;
  created_at: ISODateTime;
}

export const PIPELINE_LABELS: Record<PipelineStatus, string> = {
  new_lead: "New Lead",
  contacted: "Contacted",
  interested: "Interested",
  demo: "Demo",
  trial: "Trial",
  paying_customer: "Paying Customer",
  commission_1_pending: "Commission #1 Pending",
  commission_1_paid: "Commission #1 Paid",
  commission_2_pending: "Commission #2 Pending",
  commission_2_paid: "Commission #2 Paid",
  completed: "Completed",
  not_interested: "Not Interested",
  bad_fit: "Bad Fit",
  cancelled: "Cancelled",
  no_response: "No Response",
};

// =========================================================
// Progression system — ranks, milestones, promotions
// =========================================================

export interface DbRank {
  id: UUID;
  name: string;
  description: string | null;
  min_businesses_sold: number;
  badge_emoji: string;
  color: string;
  benefits: string | null;
  commission_bonus_percent: number;
  sort_order: number;
  is_active: boolean;
  created_at: ISODateTime;
}

export type MilestoneRequirementType =
  | "businesses_sold" | "active_businesses" | "commission_earned"
  | "sales_in_month" | "sales_in_week" | "consecutive_sales_weeks"
  | "customer_retention" | "revenue_generated" | "custom";

export type RewardType =
  | "cash_bonus" | "commission_bonus" | "gift_card" | "merchandise"
  | "promotion" | "rank_advancement" | "recognition" | "special_badge";

export interface DbMilestone {
  id: UUID;
  name: string;
  description: string | null;
  icon: string;
  requirement_type: MilestoneRequirementType;
  requirement_value: number;
  reward_type: RewardType;
  reward_description: string | null;
  reward_amount: number | null;
  is_active: boolean;
  is_visible: boolean;
  sort_order: number;
  created_at: ISODateTime;
}

export interface DbSalespersonMilestone {
  id: UUID;
  salesperson_id: UUID;
  milestone_id: UUID;
  unlocked_at: ISODateTime;
  reward_status: "pending" | "approved" | "paid";
  reward_amount: number | null;
  approved_by: UUID | null;
  approved_at: ISODateTime | null;
  paid_at: ISODateTime | null;
  payment_reference: string | null;
}

export interface DbPromotion {
  id: UUID;
  title: string;
  description: string | null;
  required_businesses_sold: number;
  required_retention_percent: number | null;
  additional_requirements: Record<string, unknown> | null;
  benefits: string | null;
  approval_type: "automatic" | "admin_approval";
  sort_order: number;
  is_active: boolean;
  created_at: ISODateTime;
}

export interface DbSalespersonPromotion {
  id: UUID;
  salesperson_id: UUID;
  promotion_id: UUID;
  status: "eligible" | "approved" | "denied";
  requested_at: ISODateTime;
  decided_at: ISODateTime | null;
  decided_by: UUID | null;
  notes: string | null;
  requirements_snapshot: Record<string, unknown> | null;
}
