import { Badge } from "@/components/ui/badge";
import { PIPELINE_LABELS, type PipelineStatus } from "@/lib/database/types";

const VARIANT_MAP: Record<PipelineStatus, "brand" | "success" | "danger" | "warning" | "neutral"> = {
  new_lead: "neutral",
  contacted: "brand",
  interested: "brand",
  demo: "brand",
  trial: "warning",
  paying_customer: "success",
  commission_1_pending: "warning",
  commission_1_paid: "success",
  commission_2_pending: "warning",
  commission_2_paid: "success",
  completed: "success",
  not_interested: "danger",
  bad_fit: "danger",
  cancelled: "danger",
  no_response: "neutral",
};

export function StatusBadge({ status }: { status: PipelineStatus }) {
  return <Badge variant={VARIANT_MAP[status]}>{PIPELINE_LABELS[status]}</Badge>;
}
