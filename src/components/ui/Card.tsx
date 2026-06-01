import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/cn";

const cardVariants = cva("rounded-lg border p-6 transition-all duration-250 ease-emphasized", {
  variants: {
    variant: {
      surface: "border-border-soft bg-bg-surface shadow-card",
      inset: "border-border-soft bg-bg-surface-alt",
      raised: "border-border-soft bg-bg-surface shadow-card hover:shadow-card-hover",
      alert: "border-state-warning/30 bg-state-warning/10",
    },
    interactive: {
      true: "cursor-pointer hover:-translate-y-0.5 hover:shadow-card-hover",
      false: "",
    },
  },
  defaultVariants: {
    variant: "surface",
    interactive: false,
  },
});

export interface CardProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof cardVariants> {}

export function Card({ className, variant, interactive, ...props }: CardProps) {
  return <div className={cn(cardVariants({ variant, interactive }), className)} {...props} />;
}

