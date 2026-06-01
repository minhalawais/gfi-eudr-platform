export type StatusTone =
  | "approved"
  | "active"
  | "ready"
  | "pending"
  | "pending_response"
  | "pending_approval"
  | "review"
  | "review_required"
  | "under_review"
  | "blocked"
  | "held"
  | "changes_requested"
  | "requested"
  | "current"
  | "draft"
  | "superseded"
  | "info";

export type RiskTone = "negligible" | "low" | "medium" | "high" | "critical";

export const STATUS_TONE_MAP: Record<StatusTone, string> = {
  approved: "success",
  active: "success",
  ready: "success",
  pending: "warning",
  pending_response: "warning",
  pending_approval: "warning",
  review: "warning",
  review_required: "warning",
  under_review: "warning",
  blocked: "error",
  held: "error",
  changes_requested: "error",
  requested: "info",
  current: "info",
  draft: "neutral",
  superseded: "neutral",
  info: "info",
};

export const RISK_TONE_MAP: Record<RiskTone, "success" | "warning" | "error" | "critical"> = {
  negligible: "success",
  low: "success",
  medium: "warning",
  high: "error",
  critical: "critical",
};
