import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/cn";
import { RISK_TONE_MAP, STATUS_TONE_MAP, type RiskTone, type StatusTone } from "@/lib/ui-semantics";

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-semibold uppercase tracking-wide",
  {
    variants: {
      tone: {
        neutral: "border-border-soft bg-bg-surface-alt text-text-secondary",
        info: "border-state-info/35 bg-state-info/10 text-state-info",
        success: "border-state-success/35 bg-state-success/10 text-state-success",
        warning: "border-state-warning/35 bg-state-warning/10 text-state-warning",
        error: "border-state-error/35 bg-state-error/10 text-state-error",
        critical: "border-state-critical/35 bg-state-critical/10 text-state-critical",
      },
    },
    defaultVariants: {
      tone: "neutral",
    },
  },
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {}

export function Badge({ className, tone, ...props }: BadgeProps) {
  return <span className={cn(badgeVariants({ tone }), className)} {...props} />;
}

export interface StatusBadgeProps extends Omit<BadgeProps, "tone"> {
  status: StatusTone;
}

export function StatusBadge({ status, className, ...props }: StatusBadgeProps) {
  const tone = STATUS_TONE_MAP[status];
  return (
    <Badge tone={tone as BadgeProps["tone"]} className={className} {...props}>
      {props.children ?? status.replace(/_/g, " ")}
    </Badge>
  );
}

export interface RiskBadgeProps extends Omit<BadgeProps, "tone"> {
  risk: RiskTone;
}

export function RiskBadge({ risk, className, ...props }: RiskBadgeProps) {
  const tone = RISK_TONE_MAP[risk];
  return (
    <Badge tone={tone as BadgeProps["tone"]} className={className} {...props}>
      {props.children ?? risk}
    </Badge>
  );
}

