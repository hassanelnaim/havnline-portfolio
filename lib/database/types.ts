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
