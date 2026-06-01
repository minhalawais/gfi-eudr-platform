import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/cn";

const tagVariants = cva("inline-flex items-center rounded-md border px-2.5 py-1 text-xs font-medium", {
  variants: {
    tone: {
      neutral: "border-border-soft bg-bg-surface-alt text-text-secondary",
      brand: "border-brand-primary/25 bg-brand-primary-soft text-brand-primary",
      info: "border-state-info/25 bg-state-info/10 text-state-info",
      success: "border-state-success/25 bg-state-success/10 text-state-success",
      warning: "border-state-warning/25 bg-state-warning/10 text-state-warning",
      danger: "border-state-error/25 bg-state-error/10 text-state-error",
      critical: "border-state-critical/25 bg-state-critical/10 text-state-critical",
    },
  },
  defaultVariants: {
    tone: "neutral",
  },
});

export interface TagProps extends React.HTMLAttributes<HTMLSpanElement>, VariantProps<typeof tagVariants> {}

export function Tag({ className, tone, ...props }: TagProps) {
  return <span className={cn(tagVariants({ tone }), className)} {...props} />;
}

